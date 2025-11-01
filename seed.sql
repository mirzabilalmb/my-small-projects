INSERT INTO books (title, author, isbn, rating, review, read_date)
VALUES
('The Dip', 'Seth Godin', '9781591841984', 4, 'Short and sharp. On quitting strategically.', '2019-06-01'),
('Deep Work', 'Cal Newport', '9781455586691', 5, 'Great for focus techniques', '2020-02-15'),
('Atomic Habits', 'James Clear', '9780735211292', 5, 'Actionable habit building', '2021-11-03')
ON CONFLICT DO NOTHING;