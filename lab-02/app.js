const express = require("express");
const path = require("path");
const fs = require("fs");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();

// Middleware to parse incoming JSON request bodies
app.use(express.json());

// Deployment-safe database path: supports environment variable DB_PATH or defaults to local directory
const dbPath = process.env.DB_PATH || path.join(__dirname, "books.db");
let db = null;
let server = null;
let isInitialized = false;

// ==========================================
// ROOT ROUTE (Convenience for Browsers / Render Health)
// ==========================================
app.get("/", (req, res) => {
  res.redirect("/books/");
});

// ==========================================
// CRUD ROUTE HANDLERS
// ==========================================

/**
 * 1. GET /books/
 * Retrieves all books from the database.
 * HTTP 200 OK: returns an array of book objects.
 * HTTP 500: database or server error.
 */
app.get("/books/", async (req, res) => {
  try {
    const getBooksQuery = `
      SELECT *
      FROM book
      ORDER BY id;
    `;
    const books = await db.all(getBooksQuery);
    res.status(200).json(books);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 2. GET /books/:bookId/
 * Retrieves a single book by its ID.
 * HTTP 200 OK: returns the book object.
 * HTTP 400 Bad Request: if bookId is not a valid number.
 * HTTP 404 Not Found: if no book with bookId exists.
 * HTTP 500: database or server error.
 */
app.get("/books/:bookId/", async (req, res) => {
  try {
    const { bookId } = req.params;

    if (isNaN(bookId)) {
      return res.status(400).json({ error: "Invalid book ID format. It must be a number." });
    }

    const getBookQuery = `
      SELECT *
      FROM book
      WHERE id = ?;
    `;
    const book = await db.get(getBookQuery, [bookId]);

    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }

    res.status(200).json(book);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 3. POST /books/
 * Inserts a new book into the database.
 * HTTP 201 Created: returns confirmation message and new book ID.
 * HTTP 400 Bad Request: if required fields are missing.
 * HTTP 500: database or server error.
 */
app.post("/books/", async (req, res) => {
  try {
    const { title, author, price, pages } = req.body;

    if (!title || !author || price === undefined || pages === undefined) {
      return res.status(400).json({
        error: "Missing required fields: title, author, price, and pages are required.",
      });
    }

    const addBookQuery = `
      INSERT INTO book (title, author, price, pages)
      VALUES (?, ?, ?, ?);
    `;
    const result = await db.run(addBookQuery, [title, author, price, pages]);

    res.status(201).json({
      message: "Book Added Successfully",
      bookId: result.lastID,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 4. PUT /books/:bookId/
 * Updates an existing book's details by ID.
 * HTTP 200 OK: returns confirmation message.
 * HTTP 400 Bad Request: if bookId is invalid or fields are missing.
 * HTTP 404 Not Found: if no book with bookId exists.
 * HTTP 500: database or server error.
 */
app.put("/books/:bookId/", async (req, res) => {
  try {
    const { bookId } = req.params;

    if (isNaN(bookId)) {
      return res.status(400).json({ error: "Invalid book ID format. It must be a number." });
    }

    const { title, author, price, pages } = req.body;

    if (!title || !author || price === undefined || pages === undefined) {
      return res.status(400).json({
        error: "Missing required fields: title, author, price, and pages are required.",
      });
    }

    // Check if the book exists before updating
    const checkBookQuery = `
      SELECT *
      FROM book
      WHERE id = ?;
    `;
    const existingBook = await db.get(checkBookQuery, [bookId]);

    if (!existingBook) {
      return res.status(404).json({ error: "Book not found" });
    }

    const updateBookQuery = `
      UPDATE book
      SET
        title = ?,
        author = ?,
        price = ?,
        pages = ?
      WHERE id = ?;
    `;
    await db.run(updateBookQuery, [title, author, price, pages, bookId]);

    res.status(200).json({ message: "Book Details Updated Successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 5. DELETE /books/:bookId/
 * Deletes a book by its ID.
 * HTTP 200 OK: returns confirmation message.
 * HTTP 400 Bad Request: if bookId is not a valid number.
 * HTTP 404 Not Found: if no book with bookId exists.
 * HTTP 500: database or server error.
 */
app.delete("/books/:bookId/", async (req, res) => {
  try {
    const { bookId } = req.params;

    if (isNaN(bookId)) {
      return res.status(400).json({ error: "Invalid book ID format. It must be a number." });
    }

    // Check if the book exists before deleting
    const checkBookQuery = `
      SELECT *
      FROM book
      WHERE id = ?;
    `;
    const existingBook = await db.get(checkBookQuery, [bookId]);

    if (!existingBook) {
      return res.status(404).json({ error: "Book not found" });
    }

    const deleteBookQuery = `
      DELETE FROM book
      WHERE id = ?;
    `;
    await db.run(deleteBookQuery, [bookId]);

    res.status(200).json({ message: "Book Deleted Successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// DATABASE & SERVER INITIALIZATION
// ==========================================

/**
 * Initializes the SQLite database connection, ensures schema and seed records,
 * and starts the Express server.
 */
const initializeDBAndServer = async () => {
  // Prevent duplicate initialization
  if (isInitialized) {
    return server;
  }

  try {
    // Ensure parent directory exists (for custom mounted disk paths like /var/data)
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // Open connection to SQLite
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    // Create the book table if it does not already exist
    await db.run(`
      CREATE TABLE IF NOT EXISTS book (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        author TEXT NOT NULL,
        price INTEGER NOT NULL,
        pages INTEGER NOT NULL
      );
    `);

    // Safe, idempotent seed: seed initial 10 books only if the table is currently empty
    const bookCount = await db.get("SELECT COUNT(*) AS count FROM book;");
    if (bookCount && bookCount.count === 0) {
      await db.run(`
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
      `);
      console.log("Initial sample book records seeded successfully.");
    }

    // Use environment port provided by Render (process.env.PORT) or default to 3000 locally
    const PORT = process.env.PORT || 3000;
    server = app.listen(PORT, () => {
      console.log(`Server Running at http://localhost:${PORT}/`);
    });

    isInitialized = true;
    return server;
  } catch (error) {
    console.error(`Database / Server Startup Error: ${error.message}`);
    process.exit(1);
  }
};

// Graceful shutdown handling
process.on("SIGTERM", () => {
  if (server) {
    server.close(() => {
      console.log("Server process terminated gracefully.");
      if (db) db.close();
    });
  }
});

// Start database connection and Express server
initializeDBAndServer();

module.exports = app;
