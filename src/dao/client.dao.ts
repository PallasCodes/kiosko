import { getConnection, sql } from '../config/db'

export async function sendSms(celular: string, smsBody: string) {
  try {
    const pool = await getConnection()
    await pool
      .request()
      .input('celular', sql.VarChar, celular)
      .input('smsBody', sql.VarChar, smsBody)
      .query('SELECT dbo.fn_Sms(@celular, @smsBody);')
  } catch (error) {
    console.error('Error al enviar el SMS:', error)
    throw new Error('Error al enviar el SMS')
  }
}
