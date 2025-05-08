import app from './app.js';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { logInfo, logError } from './utils/logger.js';

async function startServer() {
  try {
    // Connect to MongoDB
    await connectDB();

    // Start Express server
    app.listen(env.PORT, () => {
      logInfo(`Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
    });
  } catch (error) {
    logError('Failed to start server', error);
    process.exit(1);
  }
}

startServer();