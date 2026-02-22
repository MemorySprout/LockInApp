import express, { Request, Response } from 'express';

const app = express();
const PORT: number = 3000;

app.get('/', (req: Request, res: Response) => {
  res.send('Hello World!');
});

app.listen(PORT, () => {
  console.log(`Serwer działa na http://localhost:${PORT}`);
});