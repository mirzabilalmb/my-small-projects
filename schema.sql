CREATE TABLE IF NOT EXISTS books (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT,
  isbn TEXT UNIQUE,
  rating SMALLINT CHECK (rating >= 0 AND rating <= 5),
  review TEXT,
  read_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- index to speed up sorting by rating / read_date
CREATE INDEX IF NOT EXISTS idx_books_rating ON books (rating);
CREATE INDEX IF NOT EXISTS idx_books_read_date ON books (read_date);
psql -d booknotes -f schema.sql
# optionally seed:
psql -d booknotes -f seed.sql