import { app, registerRoutes } from './app.js';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { logInfo, logError } from './utils/logger.js';
async function startServer() {
    try {
        // Connect to MongoDB
        await connectDB();
        await registerRoutes(); // ✅ ensure routes are initialized AFTER DB is ready
        // Start Express server
        app.listen(env.PORT, () => {
            logInfo(`Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
        });
    }
    catch (error) {
        logError('Failed to start server', error);
        process.exit(1);
    }
}
startServer();
