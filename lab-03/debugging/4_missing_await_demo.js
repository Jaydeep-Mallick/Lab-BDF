/**
 * Demonstration of Scenario D: Missing await in Asynchronous Operations
 * Run with: node debugging/4_missing_await_demo.js
 */
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

async function demo() {
  console.log("--- Demonstrating Scenario D: Missing await ---");

  const db = await open({
    filename: ":memory:",
    driver: sqlite3.Database,
  });

  await db.run("CREATE TABLE book (id INTEGER, title TEXT);");
  await db.run("INSERT INTO book VALUES (1, 'Clean Code');");

  // 1. Missing await
  console.log("[Demonstrating Bug] Missing await:");
  const pendingPromise = db.all("SELECT * FROM book;"); // Missing await
  console.log("  Variable value:", pendingPromise);
  console.log("  JSON.stringify(variable):", JSON.stringify(pendingPromise));
  console.log("  -> Notice how client receives '{}' instead of the books array!\n");

  // 2. Corrected with await
  console.log("[Resolution] Corrected with await:");
  const resolvedBooks = await db.all("SELECT * FROM book;"); // Correct
  console.log("  Variable value:", resolvedBooks);
  console.log("  JSON.stringify(variable):", JSON.stringify(resolvedBooks));
  console.log("  -> Now client receives the actual array of book records!\n");

  console.log("Demo completed successfully: Missing await explained and resolved.\n");
  await db.close();
}

demo();

