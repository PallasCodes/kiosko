import { getPrinters } from 'pdf-to-printer'

export function printPDF() {
  ;(async () => {
    try {
      const printers = await getPrinters()
      console.log('Impresoras disponibles:', printers)
    } catch (err: any) {
      console.error('Error al obtener impresoras:', err.message)
    }
  })()
}
