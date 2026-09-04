import dotenv from 'dotenv';

dotenv.config();

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';
const useProdDb = isProduction || process.env.USE_PROD_DB === 'true';

const localMongoUri =
  process.env.MONGODB_URI_LOCAL || 'mongodb://127.0.0.1:27017/roshalink';

const prodMongoUri =
  process.env.MONGODB_URI_PROD ||
  'mongodb+srv://roshalinkcompany_db_user:F32opVGQmBk5Ti0H@roshacluster.3tsell2.mongodb.net/roshalink?retryWrites=true&w=majority&appName=RoshaCluster';

// Active MongoDB URI based on environment and preference:
const activeMongoUri = useProdDb
  ? (process.env.MONGODB_URI_PROD || process.env.MONGODB_URI || prodMongoUri)
  : (process.env.MONGODB_URI_LOCAL || process.env.MONGODB_URI || localMongoUri);

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv,
  isProduction,
  useProdDb,
  mongodbUri: activeMongoUri,
  mongodbUriLocal: localMongoUri,
  mongodbUriProd: prodMongoUri,
  allowedOrigins: (
    process.env.ALLOWED_ORIGINS ||
    'http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000,http://localhost:5174,http://127.0.0.1:5174'
  )
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  jwt: {
    secret: process.env.JWT_SECRET || 'roshalink_super_secret_jwt_key_2026_!@#',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  resend: {
    apiKey: process.env.RESEND_API_KEY || '',
    leadToEmail: process.env.LEAD_TO_EMAIL || '',
    leadFromEmail: process.env.LEAD_FROM_EMAIL || 'onboarding@resend.dev',
  },
};

