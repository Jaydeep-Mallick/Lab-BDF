# Scenario C: Table-Name Typo (`SQLITE_ERROR: no such table`)

## 1. Problem Description
When sending a request to the API, the route fails with HTTP 500 and the following database error:

```bash
SQLITE_ERROR: no such table: books
Error: SQLITE_ERROR: no such table: books
    at Database.all (node_modules/sqlite3/lib/sqlite3.js:...)
```

## 2. Root Cause
In SQLite and relational SQL databases:
1. Table names must match the declared schema definition exactly.
2. In our schema (`setup.sql` and `app.js`), the table was created using singular form:
   ```sql
   CREATE TABLE IF NOT EXISTS book ( ... );
   ```
3. A developer or REST developer naturally expects `/books` endpoint to query a plural table name (`SELECT * FROM books;`). Because SQLite does not auto-pluralize or alias table names, it throws:
   `SQLITE_ERROR: no such table: books`

## 3. How to Resolve

### Fix: Align SQL Table Name with Schema
Make sure all SQL queries match the table name defined in the schema:

```javascript
// INCORRECT:
const getBooksQuery = `SELECT * FROM books WHERE id = ?;`; // Typo: 'books' does not exist

// CORRECT:
const getBooksQuery = `SELECT * FROM book WHERE id = ?;`;  // Matches schema table 'book'
```

Alternatively, if pluralization is preferred across the project, update `CREATE TABLE IF NOT EXISTS books` in both `setup.sql` and `app.js` and migrate existing tables.

