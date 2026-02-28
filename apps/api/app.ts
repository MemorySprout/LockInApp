import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT: number = 3000;

app.get('/', (req: Request, res: Response) => {
  res.send('Hello World!');
});

mongoose.connect(process.env.MONGO_URI).then(()=> {
  console.log('Połączono z MongoDB');
}).catch((err) => {
  console.error('Błąd połączenia z MongoDB:', err);
});

app.listen(PORT, () => {
  console.log(`Serwer działa na http://localhost:${PORT}`);
});