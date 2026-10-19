import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from server directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const NODE_ENV = process.env.NODE_ENV || 'development';
const PORT = parseInt(process.env.PORT, 10) || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/tenderflow_erp';
const JWT_SECRET = process.env.JWT_SECRET || 'tenderflow_erp_jwt_secret_dev_key_replace_in_production_32chars!';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

// Parse CLIENT_URL and FRONTEND_URL into array of permitted origins
const rawClientUrls = [process.env.CLIENT_URL, process.env.FRONTEND_URL, 'http://localhost:3000,http://localhost:5173']
  .filter(Boolean)
  .join(',');
const CLIENT_URLS = Array.from(
  new Set(
    rawClientUrls
      .split(',')
      .map((url) => url.trim().replace(/\/$/, ''))
      .filter(Boolean)
  )
);

const FILE_STORAGE_PROVIDER = process.env.FILE_STORAGE_PROVIDER || 'local';

// Validate required production configurations
if (NODE_ENV === 'production') {
  if (!process.env.MONGODB_URI) {
    throw new Error('CRITICAL CONFIGURATION ERROR: MONGODB_URI is required in production environment.');
  }
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('CRITICAL CONFIGURATION ERROR: JWT_SECRET must be at least 32 characters in production.');
  }
}

export const config = {
  env: NODE_ENV,
  port: PORT,
  mongoUri: MONGODB_URI,
  jwtSecret: JWT_SECRET,
  jwtExpiresIn: JWT_EXPIRES_IN,
  clientUrls: CLIENT_URLS,
  fileStorageProvider: FILE_STORAGE_PROVIDER,
  initialAdmin: {
    email: process.env.INITIAL_ADMIN_EMAIL || 'admin@tenderflow.gov.in',
    password: process.env.INITIAL_ADMIN_PASSWORD || 'AdminSecurePass@2024',
    name: process.env.INITIAL_ADMIN_NAME || 'Er. Rajesh Sharma',
    role: process.env.INITIAL_ADMIN_ROLE || 'Admin',
  },
};
