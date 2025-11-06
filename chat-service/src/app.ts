import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import chatRoutes from './routes/ChatRoutes';
import { HttpStatusCode } from './enums/StatusCodes';
import { extractUserFromHeaders } from './middleware/auth.middleware';

const app = express();

app.use(helmet());
// CORS configuration - must specify origin when using credentials
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id', 'x-user-email', 'x-user-role']
}));
app.use(morgan('combined'));
app.use(express.json());

// Extract user info from headers (forwarded by API Gateway)
app.use('/api/chat', extractUserFromHeaders);

app.use('/api/chat', chatRoutes);

app.get('/health', (req, res) => {
  res.status(HttpStatusCode.OK).json({ status: 'OK', service: 'chat-service' });
});

export default app;