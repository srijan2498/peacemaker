import type { Request, Response } from 'express';
import app from '../src/app.js';
import { connectDatabase } from '../src/config/db.js';

export default async function handler(req: Request, res: Response) {
  const origin = (req.headers.origin as string) || '';
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type,Authorization,X-Requested-With,Accept,Origin'
    );
    res.setHeader('Access-Control-Max-Age', '86400');
  }

  // Instantly resolve OPTIONS preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  try {
    await connectDatabase();
    return app(req, res);
  } catch (error: any) {
    console.error('Vercel serverless error:', error);
    res.status(500).json({ success: false, message: 'Server initialization error.' });
  }
}
