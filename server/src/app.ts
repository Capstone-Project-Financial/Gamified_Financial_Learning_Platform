import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

import { env } from './config/env';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      // Allowed origins
      const allowedOrigins = [
        env.CLIENT_URL,
        'http://localhost:5173',
        'http://localhost:8080',
        'http://localhost:3000',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:8080',
        'http://127.0.0.1:3000'
      ].filter(Boolean); // Remove undefined values
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api', routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;

