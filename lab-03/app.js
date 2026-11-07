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

// Whitelist of valid database columns for safe sorting
const ALLOWED_COLUMNS = ["id", "title", "author", "price", "pages"];

// ==========================================
// ROOT ROUTE (Convenience for Browsers / Health)
// ==========================================
app.get("/", (req, res) => {
  res.redirect("/books");
});

// ==========================================
// REST API ENDPOINTS
// ==========================================

/**
 * 1. GET /books
 * Retrieves books with support for:
 *  - search_q: partial title search (SQL LIKE)
 *  - order_by: sorting column (default: 'id')
 *  - order: sorting direction ASC / DESC (default: 'ASC')
 *  - limit: number of records returned (default: 10)
 *  - offset: number of records skipped (default: 0)
 *  - min_price & max_price: price-range filter (BETWEEN or >= / <=)
 * HTTP 200 OK: returns an array of book objects.
 * HTTP 500: database or server error.
 */
app.get("/books", async (req, res) => {
  try {
    const {
      search_q = "",
      order_by = "id",
      order = "ASC",
      limit = 10,
      offset = 0,
      min_price,
      max_price,
    } = req.query;

    const conditions = [];
    const queryParams = [];

    // 1. Partial title search using SQL LIKE
    if (search_q !== undefined && String(search_q).trim() !== "") {
      conditions.push("title LIKE ?");
      queryParams.push(`%${String(search_q).trim()}%`);
    }

    // 2. Price-range filtering
    const hasMinPrice = min_price !== undefined && min_price !== "" && !isNaN(Number(min_price));
    const hasMaxPrice = max_price !== undefined && max_price !== "" && !isNaN(Number(max_price));

    if (hasMinPrice && hasMaxPrice) {
      conditions.push("price BETWEEN ? AND ?");
      queryParams.push(Number(min_price), Number(max_price));
    } else if (hasMinPrice) {
      conditions.push("price >= ?");
      queryParams.push(Number(min_price));
    } else if (hasMaxPrice) {
      conditions.push("price <= ?");
      queryParams.push(Number(max_price));
    }

    // Build the WHERE clause dynamically if filters are applied
    let whereClause = "";
    if (conditions.length > 0) {
      whereClause = `WHERE ${conditions.join(" AND ")}`;
    }

    // 3. Validate sorting column against whitelist (prevents SQL injection)
    const normalizedOrderBy = String(order_by).trim().toLowerCase();
    const safeOrderBy = ALLOWED_COLUMNS.includes(normalizedOrderBy)
      ? normalizedOrderBy
      : "id";

    // 4. Validate sorting direction (ASC / DESC)
    const safeOrder = String(order).trim().toUpperCase() === "DESC" ? "DESC" : "ASC";

    // 5. Validate pagination limit and offset
    const parsedLimit = parseInt(limit, 10);
    const safeLimit = !isNaN(parsedLimit) && parsedLimit > 0 ? parsedLimit : 10;

    const parsedOffset = parseInt(offset, 10);
    const safeOffset = !isNaN(parsedOffset) && parsedOffset >= 0 ? parsedOffset : 0;

    const getBooksQuery = `
      SELECT *
      FROM book
      ${whereClause}
      ORDER BY ${safeOrderBy} ${safeOrder}
      LIMIT ? OFFSET ?;
    `;

    queryParams.push(safeLimit, safeOffset);

    const books = await db.all(getBooksQuery, queryParams);
    res.status(200).json(books);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * 2. GET /books/:bookId
 * Retrieves a single book by its ID.
 * HTTP 200 OK: returns the book object.
 * HTTP 400 Bad Request: if bookId is not a valid number.
 * HTTP 404 Not Found: if no book with bookId exists.
 * HTTP 500: database or server error.
 */
app.get("/books/:bookId", async (req, res) => {
  try {
    const { bookId } = req.params;

    if (isNaN(bookId)) {
      return res.status(400).json({ message: "Invalid book ID format. It must be a number." });
    }

    const getBookQuery = `
      SELECT *
      FROM book
      WHERE id = ?;
    `;
    const book = await db.get(getBookQuery, [bookId]);

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    res.status(200).json(book);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * 3. POST /books
 * Inserts a new book into the database with strict body validation.
 * Rejects missing title, missing author, or non-numeric price.
 * HTTP 201 Created: returns confirmation message and new book ID.
 * HTTP 400 Bad Request: if any required field fails validation.
 * HTTP 500: database or server error.
 */
app.post("/books", async (req, res) => {
  try {
    const { title, author, price, pages } = req.body;

    // Validate title (must be present and non-empty string)
    if (title === undefined || title === null || String(title).trim() === "") {
      return res.status(400).json({ message: "Title is required" });
    }

    // Validate author (must be present and non-empty string)
    if (author === undefined || author === null || String(author).trim() === "") {
      return res.status(400).json({ message: "Author is required" });
    }

    // Validate price (must be a valid numeric value)
    if (
      price === undefined ||
      price === null ||
      price === "" ||
      isNaN(price) ||
      isNaN(Number(price))
    ) {
      return res.status(400).json({ message: "Price must be a valid number" });
    }

    // Validate pages (must be a valid integer / number if provided)
    if (
      pages === undefined ||
      pages === null ||
      pages === "" ||
      isNaN(pages) ||
      isNaN(Number(pages))
    ) {
      return res.status(400).json({ message: "Pages is required and must be a number" });
    }

    const numericPrice = Number(price);
    const numericPages = parseInt(pages, 10);

    const addBookQuery = `
      INSERT INTO book (title, author, price, pages)
      VALUES (?, ?, ?, ?);
    `;
    const result = await db.run(addBookQuery, [
      String(title).trim(),
      String(author).trim(),
      numericPrice,
      numericPages,
    ]);

    res.status(201).json({
      message: "Book Added Successfully",
      bookId: result.lastID,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * 4. PUT /books/:bookId
 * Updates an existing book's details by ID.
 * HTTP 200 OK: returns confirmation message.
 * HTTP 400 Bad Request: if bookId is invalid or fields fail validation.
 * HTTP 404 Not Found: if no book with bookId exists.
 * HTTP 500: database or server error.
 */
app.put("/books/:bookId", async (req, res) => {
  try {
    const { bookId } = req.params;

    if (isNaN(bookId)) {
      return res.status(400).json({ message: "Invalid book ID format. It must be a number." });
    }

    // Check if the book exists before updating
    const checkBookQuery = `
      SELECT *
      FROM book
      WHERE id = ?;
    `;
    const existingBook = await db.get(checkBookQuery, [bookId]);

    if (!existingBook) {
      return res.status(404).json({ message: "Book not found" });
    }

    const { title, author, price, pages } = req.body;

    // Validate title
    if (title === undefined || title === null || String(title).trim() === "") {
      return res.status(400).json({ message: "Title is required" });
    }

    // Validate author
    if (author === undefined || author === null || String(author).trim() === "") {
      return res.status(400).json({ message: "Author is required" });
    }

    // Validate price
    if (
      price === undefined ||
      price === null ||
      price === "" ||
      isNaN(price) ||
      isNaN(Number(price))
    ) {
      return res.status(400).json({ message: "Price must be a valid number" });
    }

    // Validate pages
    if (
      pages === undefined ||
      pages === null ||
      pages === "" ||
      isNaN(pages) ||
      isNaN(Number(pages))
    ) {
      return res.status(400).json({ message: "Pages is required and must be a number" });
    }

    const numericPrice = Number(price);
    const numericPages = parseInt(pages, 10);

    const updateBookQuery = `
      UPDATE book
      SET
        title = ?,
        author = ?,
        price = ?,
        pages = ?
      WHERE id = ?;
    `;
    await db.run(updateBookQuery, [
      String(title).trim(),
      String(author).trim(),
      numericPrice,
      numericPages,
      bookId,
    ]);

    res.status(200).json({ message: "Book Details Updated Successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * 5. DELETE /books/:bookId
 * Deletes a book by its ID.
 * HTTP 200 OK: returns confirmation message.
 * HTTP 400 Bad Request: if bookId is not a valid number.
 * HTTP 404 Not Found: if no book with bookId exists.
 * HTTP 500: database or server error.
 */
app.delete("/books/:bookId", async (req, res) => {
  try {
    const { bookId } = req.params;

    if (isNaN(bookId)) {
      return res.status(400).json({ message: "Invalid book ID format. It must be a number." });
    }

    // Check if the book exists before deleting
    const checkBookQuery = `
      SELECT *
      FROM book
      WHERE id = ?;
    `;
    const existingBook = await db.get(checkBookQuery, [bookId]);

    if (!existingBook) {
      return res.status(404).json({ message: "Book not found" });
    }

    const deleteBookQuery = `
      DELETE FROM book
      WHERE id = ?;
    `;
    await db.run(deleteBookQuery, [bookId]);

    res.status(200).json({ message: "Book Deleted Successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
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

