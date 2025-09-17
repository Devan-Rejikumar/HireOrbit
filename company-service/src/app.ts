import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import companyRoutes from './routes/CompanyRoutes';

dotenv.config();

const app = express();

app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.url}`);
  console.log(`[App] Body parsing middleware - Content-Type: ${req.headers['content-type']}`);
  next();
});

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173', 
  credentials: true,
}));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

app.use((req, res, next) => {
  console.log(`[App] ${req.method} ${req.url}`);
  console.log(`[App] Request body:`, req.body);
  console.log(`[App] Content-Type: ${req.headers['content-type']}`);
  console.log(`[App] All headers:`, req.headers);
  next();
});

app.get('/health', (req, res) => {
  res.json({ message: 'Company Service is running!' });
});

app.use('/api/company',companyRoutes);

export default app; 