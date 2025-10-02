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

  if (req.headers['content-type']?.includes('application/json') && req.headers['content-type']?.includes('multipart/form-data')) {
    req.headers['content-type'] = 'application/json';
    console.log('🔧 Fixed mixed Content-Type header to application/json');
  }
  next();
});

app.use(express.json({ 
  limit: '20mb',
  verify: (req, res, buf, encoding) => {
    try {
      JSON.parse(buf.toString());
    } catch (e) {
      console.log('Invalid JSON received');
      throw new Error('Invalid JSON');
    }
  }
}));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use(cookieParser());
app.use((req, res, next) => {
  req.on('aborted', () => {
    console.log('Request aborted for:', req.url);
  });
  
  req.on('close', () => {
    console.log('Request closed for:', req.url);
  });
  
  next();
});
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use((req, res, next) => {
  console.log(`[USER SERVICE] ${req.method} ${req.url}`);
  console.log('[USER SERVICE] Body parsing middleware - Content-Type:', req.headers['content-type']);
  console.log('[USER SERVICE] Request headers:', req.headers);
  console.log('[USER SERVICE] Request body:', req.body);
  console.log('[USER SERVICE] About to call next()...');
  next();
  console.log('[USER SERVICE] next() called successfully');
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
  console.log('[USER SERVICE] Test route hit');
  res.json({ message: 'Server is working!' });
});

app.use((req, res, next) => {
  console.log('[USER SERVICE] Middleware hit:', req.method, req.originalUrl);
  console.log('[USER SERVICE] Request body:', req.body);
  next();
});

app.use((err: any, req: any, res: any, next: any) => {
  console.log('Global error handler:', err.message);
  
  if (err.message === 'Invalid JSON') {
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid JSON format',
      message: 'Request body must be valid JSON'
    });
  }
  
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ 
      success: false, 
      error: 'JSON parse error',
      message: 'Invalid JSON in request body'
    });
  }
  
  if (err.code === 'ECONNRESET' || err.message.includes('request aborted')) {
    console.log('Request aborted or connection reset');
    return;
  }
  
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    success: false, 
    error: 'Internal server error',
    message: 'An unexpected error occurred'
  });
});

export default app;
