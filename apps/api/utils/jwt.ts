import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

export interface JwtPayload {
  userId: string;
  email: string;
}

export const signAccessToken = (payload: JwtPayload) =>
  jwt.sign(payload, ACCESS_SECRET, { expiresIn: '60m' });

export const signRefreshToken = (payload: JwtPayload) =>
  jwt.sign(payload, REFRESH_SECRET, { expiresIn: '7d' });

export const verifyAccessToken = (token: string) =>
  jwt.verify(token, ACCESS_SECRET) as JwtPayload;

export const verifyRefreshToken = (token: string) =>
  jwt.verify(token, REFRESH_SECRET) as JwtPayload;