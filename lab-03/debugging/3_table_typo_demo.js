/**
 * Demonstration of Scenario C: SQLITE_ERROR no such table
 * Run with: node debugging/3_table_typo_demo.js
 */
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

async function demo() {
  console.log("--- Demonstrating Scenario C: Table-Name Typo ---");

  // In-memory SQLite database
  const db = await open({
    filename: ":memory:",
    driver: sqlite3.Database,
  });

  // Table created as 'book' (singular)
  await db.run(`
    CREATE TABLE book (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL
    );
  `);
  await db.run(`INSERT INTO book (title) VALUES ('1984');`);

  // 1. Querying with typo 'books'
  try {
    console.log("[Attempting query] SELECT * FROM books; (Typo: plural 'books')");
    await db.all("SELECT * FROM books;");
  } catch (error) {
    console.log(`[Caught Database Error] ${error.message}`);
  }

  // 2. Querying with correct name 'book'
  try {
    console.log("\n[Resolution] Correcting query: SELECT * FROM book;");
    const rows = await db.all("SELECT * FROM book;");
    console.log("[Success] Query returned:", rows);
    console.log("\nDemo completed successfully: 'no such table' explained and resolved.\n");
  } catch (error) {
    console.error(error);
  }

  await db.close();
}

demo();

