import express, { Request, Response } from 'express';
import authRoutes from './modules/auth/auth.routes';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());
const PORT: number = 3000;

app.use('/api/auth', authRoutes);

mongoose.connect(process.env.MONGO_URI).then(()=> {
  console.log('Połączono z MongoDB');
}).catch((err) => {
  console.error('Błąd połączenia z MongoDB:', err);
});

app.listen(PORT, () => {
  console.log(`Serwer działa na http://localhost:${PORT}`);
});