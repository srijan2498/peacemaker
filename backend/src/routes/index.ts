import { Router } from 'express';
import authRoutes from './authRoutes.js';
import familyRoutes from './familyRoutes.js';
import categoryRoutes from './categoryRoutes.js';
import expenseRoutes from './expenseRoutes.js';
import incomeRoutes from './incomeRoutes.js';
import analyticsRoutes from './analyticsRoutes.js';
import budgetRoutes from './budgetRoutes.js';
import moneyTrackerRoutes from './moneyTrackerRoutes.js';
import reminderRoutes from './reminderRoutes.js';
import scheduleRoutes from './scheduleRoutes.js';
import noteRoutes from './noteRoutes.js';
import audioRoutes from './audioRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';
import healthRoutes from './healthRoutes.js';
import medicationRoutes from './medicationRoutes.js';
import billDocumentRoutes from './billDocumentRoutes.js';
import recipeRoutes from './recipeRoutes.js';
import relaxationRoutes from './relaxationRoutes.js';
import householdItemRoutes from './householdItemRoutes.js';

const apiRouter = Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/families', familyRoutes);
apiRouter.use('/families', categoryRoutes);
apiRouter.use('/families', expenseRoutes);
apiRouter.use('/families', incomeRoutes);
apiRouter.use('/families', analyticsRoutes);
apiRouter.use('/families', budgetRoutes);
apiRouter.use('/money-transactions', moneyTrackerRoutes);
apiRouter.use('/reminders', reminderRoutes);
apiRouter.use('/schedules', scheduleRoutes);
apiRouter.use('/notes', noteRoutes);
apiRouter.use('/audio', audioRoutes);
apiRouter.use('/notifications', notificationRoutes);
apiRouter.use('/dashboard', dashboardRoutes);
apiRouter.use('/health', healthRoutes);
apiRouter.use('/medications', medicationRoutes);
apiRouter.use('/bills', billDocumentRoutes);
apiRouter.use('/recipes', recipeRoutes);
apiRouter.use('/relaxation', relaxationRoutes);
apiRouter.use('/household-stock', householdItemRoutes);

export default apiRouter;

