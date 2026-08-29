import { db } from '../../config/database.js';
import { users } from '../../db/schema/index.js';
import { eq } from 'drizzle-orm';

// ─── Auth Repository ─────────────────────────────────────────────────────────

export const authRepository = {
  async findByEmail(email: string) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return user ?? null;
  },

  async findById(id: string) {
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    return user ?? null;
  },

  async create(data: {
    email: string;
    name: string;
    passwordHash: string;
    role: 'ADMIN' | 'VIEWER';
  }) {
    const [user] = await db
      .insert(users)
      .values(data)
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        createdAt: users.createdAt,
      });

    return user;
  },
};
