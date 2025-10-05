# @lql-pg/rls-demo

RLS (Row Level Security) demo extension for PostgreSQL.

Provides a demonstration of Row Level Security implementation with users and products tables, including:
- `rls_test` schema with proper RLS policies
- `users` table with RLS policies for user data access
- `products` table with RLS policies for product ownership
- Foreign key relationships and proper indexing
- Automatic `updated_at` timestamp triggers

## Sample Data

This package includes sample data to demonstrate RLS functionality:

### Users
- Alice Johnson (alice@example.com)
- Bob Smith (bob@example.com) 
- Charlie Brown (charlie@example.com)
- Diana Prince (diana@example.com)

### Products
- Alice owns: Laptop Pro ($1299.99), Wireless Mouse ($49.99)
- Bob owns: Mechanical Keyboard ($149.99), Monitor 4K ($399.99)
- Charlie owns: Webcam HD ($89.99), Headphones ($199.99)
- Diana owns: Standing Desk ($599.99), Desk Lamp ($79.99)

## Data Insertion

### Using SQL File
```bash
psql -d your_database -f seed-data.sql
```

### Using Node.js Script
```bash
node insert-data.js
```

### Using pgsql-test
The test suite includes comprehensive data insertion and RLS testing examples.
