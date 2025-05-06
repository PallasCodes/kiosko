import { Router, Request, Response } from 'express'
import { getConnection, sql } from '../config/db'

export const healthRouter = Router()

healthRouter.get('/', async (_req: Request, res: Response) => {
  const pool = await getConnection()
  const result = await pool.request().query('SELECT top 5 * FROM dbo.orden')
  res.status(200).json({ result })
})
