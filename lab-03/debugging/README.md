# Lab 3: Debugging Exercises

This folder contains documentation and demonstration code for the four common debugging scenarios encountered in Node.js, Express.js, and SQLite backend development as mandated by **BDF Lab 03**.

> **Note:** As required by the assignment guidelines, the main production application (`app.js`) is completely free of broken code. The exercises here demonstrate each issue, its root cause, the exact console error emitted, and the verified solution.

---

## Overview of Debugging Scenarios

| Scenario | Error / Symptom | Root Cause | Fix / Resolution |
| :--- | :--- | :--- | :--- |
| **A. Port Conflict** | `Error: listen EADDRINUSE: address already in use :::3000` | Another process is already listening on the requested port (e.g., port 3000). | Find PID using `lsof -i :3000`, kill with `kill -9 <PID>`, or use dynamic port fallback `process.env.PORT \|\| 3001`. |
| **B. Wrong Import Path** | `Error: Cannot find module '../utils/db'` or `MODULE_NOT_FOUND` | Incorrect relative path, wrong folder depth, or misspelled filename in `require()`. | Fix relative path (e.g., `./` vs `../`), verify file extension and directory nesting. |
| **C. Table-Name Typo** | `SQLITE_ERROR: no such table: books` | SQL query references `books` while table was created as `book` (or misspelled name). | Align SQL queries with the exact schema table name (`book`). |
| **D. Missing `await`** | Response returns pending Promise `{}`, or subsequent code executes before query finishes | Calling an async function returning a Promise without `await` inside an `async` handler. | Add `await` before asynchronous calls (e.g., `await db.all(...)`). |

---

## Detailed Scenarios

### Scenario A: Port Conflict (`EADDRINUSE`)
- **File:** [1_eaddrinuse.md](file:///Users/jaydeepmallick/Desktop/lab-03/debugging/1_eaddrinuse.md)
- **Demo Script:** `node debugging/1_eaddrinuse_demo.js`

### Scenario B: Wrong Import Path (`MODULE_NOT_FOUND`)
- **File:** [2_wrong_import.md](file:///Users/jaydeepmallick/Desktop/lab-03/debugging/2_wrong_import.md)
- **Demo Script:** `node debugging/2_wrong_import_demo.js`

### Scenario C: Table-Name Typo (`no such table`)
- **File:** [3_table_typo.md](file:///Users/jaydeepmallick/Desktop/lab-03/debugging/3_table_typo.md)
- **Demo Script:** `node debugging/3_table_typo_demo.js`

### Scenario D: Missing `await` in Asynchronous Operations
- **File:** [4_missing_await.md](file:///Users/jaydeepmallick/Desktop/lab-03/debugging/4_missing_await.md)
- **Demo Script:** `node debugging/4_missing_await_demo.js`

