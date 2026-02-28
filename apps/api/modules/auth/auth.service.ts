import bcrypt from 'bcrypt';
import { User } from '../../models/user.model';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt';

export const registerUser = async (email: string, username: string, password: string) => {
  const existingEmail = await User.findOne({ email });
  if (existingEmail) throw new Error('Email already in use');

  const existingUsername = await User.findOne({ username });
  if (existingUsername) throw new Error('Username already taken');

  if (password.length < 8) throw new Error('Password must be at least 8 characters');

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
  if (!user) throw new Error('Invalid credentials');

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