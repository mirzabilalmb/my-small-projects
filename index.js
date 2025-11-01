
require('dotenv').config();

const express = require('express');
const path = require('path');
const methodOverride = require('method-override');
const axios = require('axios');

const bookModel = require('./models/bookModel');

const PORT = process.env.PORT || 3000;

const app = express();

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.urlencoded({ extended: true })); // parse form bodies
app.use(express.json()); // parse JSON bodies
app.use(methodOverride('_method')); // support PUT/DELETE via ?_method= or hidden _method
app.use(express.static(path.join(__dirname, 'public')));

// Home -> redirect to books
app.get('/', (req, res) => {
  res.redirect('/books');
});

/**
 * LIST books with sorting support.
 * Query params:
 *   sort = rating | recency | title
 *   order = asc | desc
 */
app.get('/books', async (req, res) => {
  try {
    const sort = req.query.sort || 'recency';
    const order = req.query.order || 'desc';
    const books = await bookModel.getAllBooks({ sortBy: sort, order });
    res.render('index', { books, sort, order, error: null });
  } catch (err) {
    console.error('Error fetching books:', err);
    res.status(500).render('index', { books: [], sort: 'recency', order: 'desc', error: 'Unable to fetch books.' });
  }
});

// New book form
app.get('/books/new', (req, res) => {
  res.render('new', { error: null, book: {} });
});

// Create book
app.post('/books', async (req, res) => {
  try {
    const { title, author, isbn, rating, review, read_date } = req.body;
    if (!title || title.trim() === '') {
      return res.status(400).render('new', { error: 'Title is required.', book: req.body });
    }
    await bookModel.createBook({
      title: title.trim(),
      author: author ? author.trim() : null,
      isbn: isbn ? isbn.trim() : null,
      rating: rating ? Number(rating) : null,
      review: review || null,
      read_date: read_date || null
    });
    res.redirect('/books');
  } catch (err) {
    console.error('Error creating book:', err);
    res.status(500).render('new', { error: 'Failed to create book. Maybe the ISBN is already in use.', book: req.body });
  }
});

// Show single book
app.get('/books/:id', async (req, res) => {
  try {
    const book = await bookModel.getBookById(req.params.id);
    if (!book) return res.status(404).send('Book not found');
    res.render('show', { book, error: null });
  } catch (err) {
    console.error('Error showing book:', err);
    res.status(500).send('Server error');
  }
});

// Edit form
app.get('/books/:id/edit', async (req, res) => {
  try {
    const book = await bookModel.getBookById(req.params.id);
    if (!book) return res.status(404).send('Book not found');
    res.render('edit', { book, error: null });
  } catch (err) {
    console.error('Error loading edit form:', err);
    res.status(500).send('Server error');
  }
});

// Update book
app.put('/books/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const { title, author, isbn, rating, review, read_date } = req.body;
    await bookModel.updateBook(id, {
      title: title.trim(),
      author: author ? author.trim() : null,
      isbn: isbn ? isbn.trim() : null,
      rating: rating ? Number(rating) : null,
      review: review || null,
      read_date: read_date || null
    });
    res.redirect(`/books/${id}`);
  } catch (err) {
    console.error('Error updating book:', err);
    res.status(500).render('edit', { book: { id: req.params.id, ...req.body }, error: 'Failed to update book.' });
  }
});

// Delete book
app.delete('/books/:id', async (req, res) => {
  try {
    await bookModel.deleteBook(req.params.id);
    res.redirect('/books');
  } catch (err) {
    console.error('Error deleting book:', err);
    res.status(500).send('Server error deleting book');
  }
});

/**
 * API route: Get book cover from Open Library Books API.
 * We use the Open Library Books API to fetch metadata and cover links:
 * https://openlibrary.org/dev/docs/api/books
 *
 * Example: /api/cover/0451526538
 *
 * Behavior:
 * - If Open Library returns a cover, we redirect to the cover image URL.
 * - Otherwise we return a local placeholder image.
 */
app.get('/api/cover/:isbn', async (req, res) => {
  try {
    const isbn = req.params.isbn;
    if (!isbn || isbn === 'none') {
      // local svg placeholder
      return res.redirect('/images/no-cover.svg');
    }

    // Query Open Library Books API for metadata (includes cover URLs if present)
    const apiUrl = `https://openlibrary.org/api/books?bibkeys=ISBN:${encodeURIComponent(isbn)}&format=json&jscmd=data`;
    const apiRes = await axios.get(apiUrl, { timeout: 5000 });

    const data = apiRes.data || {};
    const key = `ISBN:${isbn}`;
    if (data[key] && data[key].cover) {
      // prefer large then medium then small
      const cover = data[key].cover.large || data[key].cover.medium || data[key].cover.small;
      if (cover) {
        // Redirect the browser to the external cover image URL so images load in the page.
        return res.redirect(cover);
      }
    }

    // Fallback: try direct Covers API (sometimes books have covers but Books API doesn't include it)
    // The Covers API format: https://covers.openlibrary.org/b/isbn/{isbn}-L.jpg
    const directCoverUrl = `https://covers.openlibrary.org/b/isbn/${encodeURIComponent(isbn)}-L.jpg`;
    // We could probe via HEAD, but redirecting directly is fine — Open Library will deliver a default image if none exists.
    return res.redirect(directCoverUrl);

  } catch (err) {
    console.error('Error fetching cover:', err.message || err);
    // On error, return local placeholder.
    return res.redirect('/images/no-cover.svg');
  }
});

/**
 * JSON API: list books
 */
app.get('/api/books', async (req, res) => {
  try {
    const sort = req.query.sort || 'recency';
    const order = req.query.order || 'desc';
    const books = await bookModel.getAllBooks({ sortBy: sort, order });
    res.json(books);
  } catch (err) {
    console.error('Error /api/books', err);
    res.status(500).json({ error: 'Unable to fetch books' });
  }
});

// Generic 404
app.use((req, res) => {
  res.status(404).send('Not found');
});

// Start server
app.listen(PORT, () => {
  console.log(`Book Notes App running on http://localhost:${PORT}`);
});