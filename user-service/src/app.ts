import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import userRoutes from './routes/UserRoutes';
import adminRoutes from './routes/AdminRoutes';
import profileRoutes from './routes/ProfileRoutes';

const app = express();

app.use((req, res, next) => {
  if (req.headers['content-type']?.includes('application/json, application/json')) {
    req.headers['content-type'] = 'application/json';
    console.log('🔧 Fixed malformed Content-Type header');
  }
  // Fix mixed content-type headers (application/json + multipart/form-data)
  if (req.headers['content-type']?.includes('application/json') && req.headers['content-type']?.includes('multipart/form-data')) {
    req.headers['content-type'] = 'application/json';
    console.log('🔧 Fixed mixed Content-Type header to application/json');
  }
  next();
});

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.url}`);
  console.log(
    '[App] Body parsing middleware - Content-Type:',
    req.headers['content-type']
  );
  next();
});
app.use((req, res, next) => {
  console.log(`[App] ${req.method} ${req.url}`);
  console.log('[App] Request body:', req.body);
  console.log('[App] Content-Type:', req.headers['content-type']);
  next();
});

app.use('/api/users', userRoutes);
app.use('/api/users/admin', adminRoutes);
app.use('/api/profile', profileRoutes);

console.log('=== ROUTES REGISTERED ===');
console.log('User routes: /api/users');
console.log('Admin routes: /api/users/admin');
console.log('Profile routes: /api/profile');
console.log('========================');

app.get('/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});
export default app;
