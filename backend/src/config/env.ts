import dotenv from 'dotenv';
import path from 'path';

// Load .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'backend', '.env') });

export const env = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb+srv://mainperson:BholeBaba__72@freelanceproj.bmncaci.mongodb.net/expenseall?retryWrites=true&w=majority',
  MONGODB_DB_NAME: process.env.MONGODB_DB_NAME || 'expenseall',
  JWT_SECRET: process.env.JWT_SECRET || 'cozynest_super_secure_jwt_secret_key_2026_happy_home',
  SESSION_SECRET: process.env.SESSION_SECRET || 'cozynest_super_secure_session_secret_2026_cozy',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  COOKIE_SECURE: process.env.COOKIE_SECURE === 'true'
};
