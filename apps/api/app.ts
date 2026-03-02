import express, { Request, Response } from 'express';
import session from 'express-session';
import cors from 'cors';
import authRoutes from './modules/auth/auth.routes';
import oauthRoutes from './modules/oauth/oauth.routes';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import passport from 'passport';
import './utils/passport';


dotenv.config();

const app = express();

const FRONTEND_URL = process.env.FRONTEND_URL;
if (!FRONTEND_URL) {
  console.warn('WARNING: FRONTEND_URL not set — CORS will reject all cross-origin requests');
}

app.use(cors({
  origin: FRONTEND_URL || false,
  credentials: true
}));

app.use(express.json());

app.use(
  session({
    name: 'sid',
    secret: (() => {
      const secret = process.env.SESSION_SECRET;
      if (!secret && process.env.NODE_ENV === 'production') {
        throw new Error('SESSION_SECRET must be set in production');
      }
      return secret || 'dev-secret';
    })(),
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' },
  })
);

app.use(passport.initialize());
app.use(passport.session());
const PORT: number = 3000;

app.use('/api/auth', authRoutes);
app.use('/api/oauth', oauthRoutes);
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

mongoose.connect(process.env.MONGO_URI).then(()=> {
  console.log('Połączono z MongoDB');
}).catch((err) => {
  console.error('Błąd połączenia z MongoDB:', err);
});

app.listen(PORT, () => {
  console.log(`Serwer działa na http://localhost:${PORT}`);
});