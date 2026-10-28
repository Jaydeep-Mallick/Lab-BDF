-- BDF Lab 2: SQLite Database Setup Script
-- Table: book

CREATE TABLE IF NOT EXISTS book (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  price INTEGER NOT NULL,
  pages INTEGER NOT NULL
);

-- Insert 10 realistic sample books
INSERT INTO book (title, author, price, pages) VALUES
  ('To Kill a Mockingbird', 'Harper Lee', 450, 281),
  ('1984', 'George Orwell', 399, 328),
  ('The Great Gatsby', 'F. Scott Fitzgerald', 299, 180),
  ('Pride and Prejudice', 'Jane Austen', 350, 279),
  ('The Catcher in the Rye', 'J. D. Salinger', 420, 234),
  ('The Hobbit', 'J. R. R. Tolkien', 499, 310),
  ('Fahrenheit 451', 'Ray Bradbury', 380, 256),
  ('Jane Eyre', 'Charlotte Bronte', 340, 500),
  ('Animal Farm', 'George Orwell', 250, 112),
  ('Brave New World', 'Aldous Huxley', 410, 288);
