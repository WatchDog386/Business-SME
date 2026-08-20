export default () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  corsOrigin: (process.env.CORS_ORIGIN || 'http://localhost:5173').split(','),
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  database: {
    driver: process.env.DB_DRIVER || 'sqljs',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    name: process.env.DB_NAME || 'kenya_sme',
    url: process.env.DATABASE_URL,
    synchronize: process.env.DB_SYNCHRONIZE
      ? process.env.DB_SYNCHRONIZE === 'true'
      : true,
  },
});