// src/utils/sendSms.ts
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns'

const snsClient = new SNSClient({
  region: 'us-east-1', // Cambia por la región que estés usando
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
  },
})

interface SendSmsParams {
  phoneNumber: string // En formato E.164, por ejemplo: +521234567890
  message: string
}

/**
 * Envía un SMS usando AWS SNS
 * @param phoneNumber - Número en formato E.164 (+521234567890)
 * @param message - Contenido del mensaje
 */
export async function sendSms({
  phoneNumber,
  message,
}: SendSmsParams): Promise<void> {
  const command = new PublishCommand({
    Message: message,
    PhoneNumber: phoneNumber,
  })

  try {
    const response = await snsClient.send(command)
    console.log('SMS enviado:', response.MessageId)
  } catch (error) {
    console.error('Error al enviar SMS:', error)
    throw error
  }
}
