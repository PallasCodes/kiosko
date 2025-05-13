import {
  S3Client,
  PutObjectCommand,
  ObjectCannedACL,
  GetObjectCommand,
} from '@aws-sdk/client-s3'

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

interface UploadToS3Options {
  buffer: Buffer
  key: string // Nombre y ruta del archivo en el bucket
  contentType: string
}

/**
 * Sube un archivo a S3 desde un Buffer y lo hace público
 *
 * @param {UploadToS3Options} options - Configuración de carga
 * @returns {Promise<string>} - URL pública del archivo
 */
export async function uploadToS3({
  buffer,
  key,
  contentType,
}: UploadToS3Options): Promise<string> {
  try {
    const params = {
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ACL: 'public-read' as ObjectCannedACL, // ACL para hacerlo público
    }

    await s3.send(new PutObjectCommand(params))

    const url = `https://s3.${process.env.AWS_REGION}.amazonaws.com/${process.env.S3_BUCKET_NAME}/${key}`
    return url
  } catch (error) {
    console.error(error)
    throw new Error(`Error al subir a S3: ${error}`)
  }
}
