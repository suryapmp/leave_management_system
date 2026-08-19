import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'leaveease-secret-key-prod-2026-secure-jwt';
const JWT_EXPIRES_IN = '7d';

export interface TokenPayload {
  id: number;
  userId: number;
  employeeId?: number;
  name: string;
  email: string;
  role: 'ADMIN' | 'HR' | 'MANAGER' | 'EMPLOYEE';
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    return null;
  }
}
