import { create } from 'html-pdf'

export async function generatePdf(html: string, options: any) {
  return new Promise((resolve, reject) => {
    create(html, options).toFile('output.pdf', (err, res) => {
      if (err) {
        reject(err)
      } else {
        resolve(res)
      }
    })
  })
}
