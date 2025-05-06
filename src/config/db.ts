import sql from 'mssql'
import { config } from './env'

let pool: sql.ConnectionPool

export const getConnection = async (): Promise<sql.ConnectionPool> => {
  if (pool) {
    return pool
  }

  try {
    pool = await sql.connect(config.DB)
    return pool
  } catch (err) {
    console.error('🔴 Error de conexión a SQL Server:', err)
    throw err
  }
}

export { sql }
