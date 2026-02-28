import { Request, Response } from 'express';
import * as authService from './auth.service';

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const tokens = await authService.registerUser(email, password);
    res.status(201).json(tokens);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const tokens = await authService.loginUser(email, password);
    res.status(200).json(tokens);
  } catch (err: any) {
    res.status(401).json({ message: err.message });
  }
};

export const refresh = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    const tokens = await authService.refreshTokens(refreshToken);
    res.status(200).json(tokens);
  } catch (err: any) {
    res.status(401).json({ message: err.message });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    await authService.logoutUser(req.user!.userId);
    res.status(200).json({ message: 'Logged out' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};