
const db = require('../db');

/**
 * Fetch all books with optional sorting.
 * sortBy: 'rating' | 'recency' | 'title'
 * order: 'asc' | 'desc'
 */
async function getAllBooks({ sortBy = 'read_date', order = 'desc' } = {}) {
  let orderBy;
  switch (sortBy) {
    case 'rating':
      orderBy = 'rating';
      break;
    case 'title':
      orderBy = 'LOWER(title)';
      break;
    case 'recency':
    case 'read_date':
    default:
      orderBy = 'read_date';
  }
  // Default nulls last for read_date so books without date appear after dated ones when sorting desc
  const q = `SELECT * FROM books ORDER BY ${orderBy} ${order === 'asc' ? 'ASC' : 'DESC'} NULLS LAST, id ASC`;
  const res = await db.query(q);
  return res.rows;
}

async function getBookById(id) {
  const res = await db.query('SELECT * FROM books WHERE id=$1', [id]);
  return res.rows[0];
}

async function createBook({ title, author, isbn, rating, review, read_date }) {
  const q = `
    INSERT INTO books (title, author, isbn, rating, review, read_date)
    VALUES ($1,$2,$3,$4,$5,$6)
    RETURNING *`;
  const values = [title, author || null, isbn || null, rating || null, review || null, read_date || null];
  const res = await db.query(q, values);
  return res.rows[0];
}

async function updateBook(id, { title, author, isbn, rating, review, read_date }) {
  // Update with parameterized query; also update updated_at
  const q = `
    UPDATE books
    SET title=$1, author=$2, isbn=$3, rating=$4, review=$5, read_date=$6, updated_at=NOW()
    WHERE id=$7
    RETURNING *`;
  const values = [title, author || null, isbn || null, rating || null, review || null, read_date || null, id];
  const res = await db.query(q, values);
  return res.rows[0];
}

async function deleteBook(id) {
  await db.query('DELETE FROM books WHERE id=$1', [id]);
}

module.exports = {
  getAllBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook
};