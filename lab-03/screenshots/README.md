# Screenshots Directory

Store your test screenshots in this directory.

Replace each placeholder file with your actual screenshot from Postman, browser, terminal, or SQLite viewer:

1. `01_get_all_books.png` - GET /books (Default query)
2. `02_get_book_by_id.png` - GET /books/1
3. `03_get_search_q.png` - GET /books?search_q=Great
4. `04_get_order_by_desc.png` - GET /books?order_by=price&order=DESC
5. `05_get_price_range.png` - GET /books?min_price=300&max_price=400
6. `06_get_combined_query.png` - GET /books?search_q=o&min_price=300&max_price=450&order_by=price&order=DESC&limit=4&offset=0
7. `07_post_success.png` - POST /books (201 Created)
8. `08_post_validation_error.png` - POST /books (400 Bad Request with validation message)
9. `09_put_success.png` - PUT /books/1 (200 OK)
10. `10_put_404.png` - PUT /books/9999 (404 Not Found)
11. `11_delete_success.png` - DELETE /books/10 (200 OK)
12. `12_delete_404.png` - DELETE /books/9999 (404 Not Found)
13. `13_database_view.png` - SQLite Viewer / DB Browser showing rows in the `book` table

