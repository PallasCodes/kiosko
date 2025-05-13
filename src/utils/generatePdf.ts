import { create } from 'html-pdf'

export async function generatePdfInBuffer(
  html: string,
  options: any
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    create(html, options).toBuffer((err, res) => {
      if (err) {
        reject(err)
      } else {
        resolve(res)
      }
    })
  })
}
