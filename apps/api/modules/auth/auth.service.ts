import bcrypt from 'bcrypt';
import { User } from '../../models/user.model';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt';

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

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
  // Check all validation errors at once
  const errors: string[] = [];

  if (!validateEmail(email)) {
    errors.push('Invalid email format');
  }

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

  user.refreshToken = refreshToken;
  await user.save();

  return { accessToken, refreshToken, user: { id: user._id, email: user.email, username: user.username } };
};

export const loginUser = async (email: string, password: string) => {
  const user = await User.findOne({ email });
  if (!user || !user.passwordHash) {
    throw new Error('Invalid credentials');
  }

  const valid = await user.comparePassword(password);
  if (!valid) throw new Error('Invalid credentials');

  const payload = { userId: user._id.toString(), email: user.email };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  user.refreshToken = refreshToken;
  user.lastLoginAt = new Date();
  await user.save();

  return { accessToken, refreshToken, user: { id: user._id, email: user.email, username: user.username } };
};

export const refreshTokens = async (refreshToken: string) => {
  if (!refreshToken) throw new Error('No refresh token');

  const payload = verifyRefreshToken(refreshToken);
  const user = await User.findById(payload.userId);

  if (!user || user.refreshToken !== refreshToken) throw new Error('Invalid refresh token');

  const newPayload = { userId: user._id.toString(), email: user.email };
  const newAccessToken = signAccessToken(newPayload);
  const newRefreshToken = signRefreshToken(newPayload);

  user.refreshToken = newRefreshToken;
  await user.save();

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

export const logoutUser = async (userId: string) => {
  await User.findByIdAndUpdate(userId, { refreshToken: null });
};