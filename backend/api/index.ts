import type { Request, Response } from 'express';
import app from '../src/app.js';
import { connectDatabase } from '../src/config/db.js';

export default async function handler(req: Request, res: Response) {
  try {
    await connectDatabase();
    return app(req, res);
  } catch (error: any) {
    console.error('Vercel serverless error:', error);
    res.status(500).json({ success: false, message: 'Server initialization error.' });
  }
}
