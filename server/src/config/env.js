import dotenv from 'dotenv';
dotenv.config();

const env = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/root-desk',
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
};

// Validate required environment variables
if (!env.JWT_SECRET) {
  if (env.NODE_ENV === 'production') {
    console.error('FATAL: JWT_SECRET is required in production');
    process.exit(1);
  }
  env.JWT_SECRET = 'dev-secret-change-me-in-production';
  console.warn('WARNING: Using default JWT_SECRET. Set JWT_SECRET in .env for production.');
}

export default env;
