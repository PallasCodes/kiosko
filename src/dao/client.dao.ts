import { getConnection } from '../config/db'

export async function sendSms(celular: string, smsBody: string) {
  try {
    const pool = await getConnection()
    await pool
      .request()
      .query(`SELECT dbo.fn_Sms('${celular}', '${smsBody}') Envio;`)
  } catch (error) {
    console.error('Error al enviar el SMS:', error)
    throw new Error('Error al enviar el SMS')
  }
}
