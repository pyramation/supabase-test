import { getConnections, PgTestClient } from 'pgsql-test';

let db: PgTestClient;
let teardown: () => Promise<void>;

beforeAll(async () => {
  ({ db, teardown } = await getConnections());
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

    db.setContext({
      role: 'service_role',
    });

    // Insert users
    const user1 = await db.one(
      `INSERT INTO rls_test.users (email, name) 
       VALUES ($1, $2) 
       RETURNING id, email, name`,
      ['alice@example.com', 'Alice Johnson']
    );

    const user2 = await db.one(
      `INSERT INTO rls_test.users (email, name) 
       VALUES ($1, $2) 
       RETURNING id, email, name`,
      ['bob@example.com', 'Bob Smith']
    );

    // Insert products
    db.setContext({
      role: 'authenticated',
      'jwt.claims.user_id': user1.id
    });

    const product1 = await db.one(
      `INSERT INTO rls_test.products (name, description, price, owner_id) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, name, price, owner_id`,
      ['Laptop Pro', 'High-performance laptop', 1299.99, user1.id]
    );

    db.setContext({
      role: 'authenticated',
      'jwt.claims.user_id': user2.id
    });

    const product2 = await db.one(
      `INSERT INTO rls_test.products (name, description, price, owner_id) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, name, price, owner_id`,
      ['Wireless Mouse', 'Ergonomic mouse', 49.99, user2.id]
    );

    expect(user1.email).toBe('alice@example.com');
    expect(product1.name).toBe('Laptop Pro');
    expect(product1.owner_id).toEqual(user1.id);
    expect(product2.owner_id).toEqual(user2.id);
    expect(product2.name).toBe('Wireless Mouse');
  });

  it('should rollback to initial state', async () => {
    db.setContext({
      role: 'service_role'
    });

    const result = await db.any(
      `SELECT u.name, p.name as product_name, p.price
       FROM rls_test.users u
       JOIN rls_test.products p ON u.id = p.owner_id
       ORDER BY u.name, p.name`
    );
    expect(result.length).toEqual(0);
  });
});
