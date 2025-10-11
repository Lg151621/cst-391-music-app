// pages/api/db-check.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getPool } from '../../lib/db';

const environment = process.env.NODE_ENV;
const dbUrl = process.env.DATABASE_URL;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Handler logic goes here
  try {
  const db = getPool();
  const { rows } = await db.query('select now() as now');
  res.status(200).json({
    time: rows[0],
    message: `Sparks Database connection successful. Running in ${environment}. DATABASE_URL: ${dbUrl}`
  });
} catch (err) {
  res.status(500).json({
    error: 'Database connection failed',
    details: (err as Error).message,
    message: `Sparks Database connection failed. Running in ${environment}. DATABASE_URL: ${dbUrl}`
  });
}
}