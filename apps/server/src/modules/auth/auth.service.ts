import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { authRepository } from './auth.repository.js';
import { auditService } from '../audit/audit.service.js';
import { config } from '../../config/env.js';
import { Errors } from '../../lib/AppError.js';
import type { LoginInput, RegisterInput, AuthUser } from '@scb/shared';

const BCRYPT_ROUNDS = 12;

// ─── Auth Service ────────────────────────────────────────────────────────────

export const authService = {
  async login(input: LoginInput): Promise<{ user: AuthUser; token: string }> {
    const user = await authRepository.findByEmail(input.email);

    if (!user) {
      throw Errors.unauthorized('Invalid email or password');
    }

    const isValidPassword = await bcrypt.compare(
      input.password,
      user.passwordHash,
    );

    if (!isValidPassword) {
      throw Errors.unauthorized('Invalid email or password');
    }

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    const token = jwt.sign(authUser, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    } as jwt.SignOptions);

    // Audit: LOGIN event
    await auditService.log({
      userId: user.id,
      action: 'LOGIN',
      entity: 'USER',
      entityId: user.id,
      afterState: { email: user.email, role: user.role },
    });

    return { user: authUser, token };
  },

  async register(input: RegisterInput): Promise<AuthUser> {
    // Check for existing user
    const existing = await authRepository.findByEmail(input.email);
    if (existing) {
      throw Errors.conflict(`User with email ${input.email} already exists`);
    }

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

    const user = await authRepository.create({
      email: input.email,
      name: input.name,
      passwordHash,
      role: input.role,
    });

    // Audit: CREATE event
    await auditService.log({
      userId: user.id,
      action: 'CREATE',
      entity: 'USER',
      entityId: user.id,
      afterState: { email: user.email, name: user.name, role: user.role },
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  },

  async getProfile(userId: string): Promise<AuthUser> {
    const user = await authRepository.findById(userId);

    if (!user) {
      throw Errors.notFound('User', userId);
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  },
};
