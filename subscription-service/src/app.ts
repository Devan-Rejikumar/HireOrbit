import express from 'express';
import cors from 'cors';
import { AppConfig } from './config/app.config';
import { ErrorHandler } from './middleware/error-handler.middleware';
import subscriptionRoutes from './routes/SubscriptionRoutes';
import adminSubscriptionRoutes from './routes/AdminSubscriptionRoutes';
import container from './config/inversify.config';
import TYPES from './config/types';
import { StripeWebhookHandler } from './webhooks/stripe.webhook';

const app = express();

app.use((req, res, next) => {
  console.log({ method: req.method, url: req.url, contentType: req.headers['content-type'] });
  next();
});

app.use(cors({
  origin: AppConfig.FRONTEND_URL,
  credentials: true,
}));

app.use('/api/subscriptions/webhook', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: `${AppConfig.JSON_BODY_SIZE_LIMIT_MB}mb` }));
app.use(express.urlencoded({ extended: true, limit: `${AppConfig.URL_ENCODED_BODY_SIZE_LIMIT_MB}mb` }));

app.get('/health', (req, res) => {
  res.json({ message: 'Subscription Service is running!' });
});

app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/admin/subscriptions', adminSubscriptionRoutes);

const webhookHandler = container.get<StripeWebhookHandler>(TYPES.StripeWebhookHandler);
app.post('/api/subscriptions/webhook', webhookHandler.handleWebhook);

app.use(ErrorHandler);

export default app;