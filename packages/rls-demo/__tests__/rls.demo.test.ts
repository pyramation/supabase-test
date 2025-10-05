import { getConnections, PgTestClient } from 'pgsql-test';

let pg: PgTestClient;
let db: PgTestClient;
let teardown: () => Promise<void>;

beforeAll(async () => {
  ({ pg, db, teardown } = await getConnections());
});

afterAll(async () => {
  await teardown();
});

beforeEach(async () => {
  await db.beforeEach();
});

afterEach(async () => {
  await db.afterEach();
});

describe('RLS Demo - Data Insertion', () => {
  it('should insert users and products', async () => {
    // Insert users
    const user1 = await pg.one(
      `INSERT INTO rls_test.users (email, name) 
       VALUES ($1, $2) 
       RETURNING id, email, name`,
      ['alice@example.com', 'Alice Johnson']
    );
    
    const user2 = await pg.one(
      `INSERT INTO rls_test.users (email, name) 
       VALUES ($1, $2) 
       RETURNING id, email, name`,
      ['bob@example.com', 'Bob Smith']
    );

    // Insert products
    const product1 = await pg.one(
      `INSERT INTO rls_test.products (name, description, price, owner_id) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, name, price, owner_id`,
      ['Laptop Pro', 'High-performance laptop', 1299.99, user1.id]
    );
    
    const product2 = await pg.one(
      `INSERT INTO rls_test.products (name, description, price, owner_id) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, name, price, owner_id`,
      ['Wireless Mouse', 'Ergonomic mouse', 49.99, user1.id]
    );

    expect(user1.email).toBe('alice@example.com');
    expect(product1.name).toBe('Laptop Pro');
    expect(product1.owner_id).toEqual(user1.id);
  });

  it('should query user products with joins', async () => {
    const result = await pg.many(
      `SELECT u.name, p.name as product_name, p.price
       FROM rls_test.users u
       JOIN rls_test.products p ON u.id = p.owner_id
       ORDER BY u.name, p.name`
    );
    
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty('name');
    expect(result[0]).toHaveProperty('product_name');
  });

  it('should test RLS context switching', async () => {
    // Get a user ID for context
    const user = await pg.one(`SELECT id FROM rls_test.users LIMIT 1`);
    
    // Set context to simulate authenticated user with JWT claims
    db.setContext({
      role: 'authenticated',
      'jwt.claims.user_id': user.id
    });

    // Test auth.uid() function
    const uid = await db.one(`SELECT auth.uid() as uid`);
    expect(uid.uid).toBe(user.id);

    // Test auth.role() function
    const role = await db.one(`SELECT auth.role() as role`);
    expect(role.role).toBe('authenticated');

    // Query should work with RLS policies
    const userData = await db.one(
      `SELECT id, email FROM rls_test.users WHERE id = $1`,
      [user.id]
    );
    
    expect(userData.id).toBe(user.id);
  });
});
