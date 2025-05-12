import { create } from 'html-pdf'

export async function generatePdf(html: string, options: any, output: string) {
  return new Promise((resolve, reject) => {
    create(html, options).toFile(output, (err, res) => {
      if (err) {
        reject(err)
      } else {
        resolve(res)
      }
    })
  })
}
