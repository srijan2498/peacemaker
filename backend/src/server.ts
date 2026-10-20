import app from './app.js';
import { env } from './config/env.js';
import { connectDatabase } from './config/db.js';
import { startReminderScheduler } from './jobs/scheduler.js';

async function startServer() {
  try {
    await connectDatabase();

    // Start background reminder worker
    startReminderScheduler(60000);

    const port = env.PORT || 5000;
    app.listen(port, () => {
      console.log(`🌸 CozyNest Backend Server running warmly on http://localhost:${port}`);
      console.log(`🍃 Environment: ${env.NODE_ENV}`);
      console.log(`🔗 MongoDB Database: ${env.MONGODB_DB_NAME}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
