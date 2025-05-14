import { getConnection, sql } from '../config/db'

export async function sendSms(celular: string, smsBody: string) {
  console.log('🚀 ~ sendSms ~ smsBody:', smsBody)
  try {
    const pool = await getConnection()
    const result = await pool
      .request()
      .query(`SELECT dbo.fn_Sms('${celular}', '${smsBody}') Envio;`)
  } catch (error) {
    console.error('Error al enviar el SMS:', error)
    throw new Error('Error al enviar el SMS')
  }
}
