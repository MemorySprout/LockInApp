import bcrypt from 'bcrypt';
import { User } from '../../models/user.model';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt';

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

// Pre-computed hash used for dummy comparison to prevent timing attacks
const DUMMY_HASH = '$2b$12$LJ3m4ys3Lg2VBe8S/dOnzuSAMFJMaOeymHGJkJSybCBbSmOFBqCfy';

const validatePassword = (password: string): { valid: boolean; message?: string } => {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters' };
  }
  if (password.length > 128) {
    return { valid: false, message: 'Password is too long (max 128 characters)' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one special character' };
  }
  return { valid: true };
};

export const registerUser = async (email: string, username: string, password: string) => {
  // Check all validation errors at once (email format already validated by zod)
  const errors: string[] = [];

  const [existingEmail, existingUsername] = await Promise.all([
    User.findOne({ email }),
    User.findOne({ username })
  ]);

  if (existingEmail) errors.push('Email already in use');
  if (existingUsername) errors.push('Username already taken');

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    errors.push(passwordValidation.message!);
  }

  // If there are any errors, throw them all at once
  if (errors.length > 0) {
    throw new Error(errors.join(' | '));
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ email, username, passwordHash });

  const payload = { userId: user._id.toString(), email: user.email };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  user.refreshToken = await bcrypt.hash(refreshToken, 10);
  await user.save();

  return { accessToken, refreshToken, user: { id: user._id, email: user.email, username: user.username } };
};

export const loginUser = async (email: string, password: string) => {
  const user = await User.findOne({ email });
  if (!user || !user.passwordHash) {
    // Perform dummy comparison to prevent timing-based user enumeration
    await bcrypt.compare(password, DUMMY_HASH);
    throw new Error('Invalid credentials');
  }

  if (user.lockUntil && user.lockUntil > new Date()) {
    const minutesLeft = Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000);
    throw new Error(`Account temporarily locked. Try again in ${minutesLeft} minute(s)`);
  }

  const valid = await user.comparePassword(password);
  if (!valid) {
    user.loginAttempts = (user.loginAttempts || 0) + 1;
    if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
      user.lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
    }
    await user.save();
    throw new Error('Invalid credentials');
  }

  user.loginAttempts = 0;
  user.lockUntil = null;

  const payload = { userId: user._id.toString(), email: user.email };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  user.refreshToken = await bcrypt.hash(refreshToken, 10);
  user.lastLoginAt = new Date();
  await user.save();

  return { accessToken, refreshToken, user: { id: user._id, email: user.email, username: user.username } };
};

export const refreshTokens = async (refreshToken: string) => {
  if (!refreshToken) throw new Error('No refresh token');

  const payload = verifyRefreshToken(refreshToken);
  const user = await User.findById(payload.userId);

  if (!user || !user.refreshToken) throw new Error('Invalid refresh token');

  const isValid = await bcrypt.compare(refreshToken, user.refreshToken);
  if (!isValid) throw new Error('Invalid refresh token');

  const newPayload = { userId: user._id.toString(), email: user.email };
  const newAccessToken = signAccessToken(newPayload);
  const newRefreshToken = signRefreshToken(newPayload);

  user.refreshToken = await bcrypt.hash(newRefreshToken, 10);
  await user.save();

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

export const logoutUser = async (userId: string) => {
  await User.findByIdAndUpdate(userId, { refreshToken: null });
};