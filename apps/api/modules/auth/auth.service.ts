import bcrypt from 'bcrypt';
import { User } from '../../models/user.model';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt';

export const registerUser = async (email: string, password: string) => {
  const existing = await User.findOne({ email });
  if (existing) throw new Error('Email already in use');

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ email, passwordHash });

  const payload = { userId: user._id.toString(), email: user.email };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  user.refreshToken = refreshToken;
  await user.save();

  return { accessToken, refreshToken };
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
  await user.save();

  return { accessToken, refreshToken };
};

export const refreshTokens = async (token: string) => {
  const payload = verifyRefreshToken(token);
  
  const user = await User.findById(payload.userId);
  if (!user || user.refreshToken !== token) {
    throw new Error('Refresh token revoked');
  }

  const newPayload = { userId: user._id.toString(), email: user.email };
  const accessToken = signAccessToken(newPayload);
  const refreshToken = signRefreshToken(newPayload);

  user.refreshToken = refreshToken;
  await user.save();

  return { accessToken, refreshToken };
};

export const logoutUser = async (userId: string) => {
  await User.findByIdAndUpdate(userId, { refreshToken: null });
};