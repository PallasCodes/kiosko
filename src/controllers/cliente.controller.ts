import { Request, Response, Router } from 'express'

import { getConnection, sql } from '../config/db'
import { getRandomCode } from '../utils/getRandomCode'

export const clienteRouter = Router()

clienteRouter.get('/buscar-cliente', async (req: Request, res: Response) => {
  const { rfc, celular } = req.query

  try {
    const pool = await getConnection()
    const result = await pool
      .request()
      .input('rfc', sql.VarChar, rfc ?? null)
      .input('celular', sql.VarChar, celular ?? null)
      .query(
        `
        SELECT TOP 1 
          UPPER(PF.rfc) AS rfc,
          UPPER(CONCAT(
              ISNULL(PF.nombre1, ''), ' ',
              ISNULL(PF.nombre2, ''), ' ',
              ISNULL(PF.apellidoPaterno, ''), ' ',
              ISNULL(PF.apellidoMaterno, '')
          )) AS nombre,
          C.contacto AS celular
        FROM dbo.personaFisica AS PF WITH (NOLOCK)
        INNER JOIN dbo.personaFisicaContacto AS C WITH (NOLOCK)
          ON PF.idPersonaFisica = C.idPersonaFisica
          WHERE ${rfc ? 'PF.rfc = @rfc' : 'C.contacto = @celular'}
          AND C.idTipo = 1302
        `
      )

    if (result.rowsAffected[0] === 0) {
      res.status(404).json({ message: 'No se encontró el cliente' })
      return
    }

    const descripcion =
      celular === '' || !celular
        ? 'Consulta de RFC: ' + rfc
        : 'Consulta de celular: ' + celular

    await pool
      .request()
      .input('descripcion', sql.VarChar, descripcion)
      .query(
        'INSERT INTO intermercado.dbo.bitacora_kiosco (descripcion, consulta) VALUES (@descripcion,1)'
      )

    res.status(200).json({ ...result.recordset[0] })
  } catch (error) {
    console.error(
      'Ocurrió un error al buscar tu información, verifica tu RFC o celular: ',
      error
    )
    res.status(500).json({
      message:
        'Ocurrió un error al buscar tu información, verifica tu RFC o celular',
    })
    return
  }
})

clienteRouter.post('/enviar-codigo', async (req: Request, res: Response) => {
  const { celular, rfc } = req.body

  const codigo = getRandomCode(6)
  const smsMsg = 'Tu código de verificación Intermercado es: ' + codigo

  try {
    const pool = await getConnection()
    await pool
      .request()
      .input('celular', sql.VarChar, celular)
      .input('smsMsg', sql.VarChar, smsMsg)
      .query(`SELECT dbo.fn_Sms(@celular, @smsMsg) Envio;`)

    await pool
      .request()
      .input('codigoValidacion', sql.VarChar, codigo)
      .input('rfc', sql.VarChar, rfc)
      .query(
        `
        INSERT INTO intermercado.dbo.codigoValidacionKiosco (codigoValidacion, rfc)
        VALUES (@codigoValidacion, @rfc)
        `
      )

    await pool
      .request()
      .input('descripcion', sql.VarChar, `Envio de SMS al ${celular}`)
      .input('sms', sql.Int, 1)
      .query(
        `
        INSERT INTO intermercado.dbo.bitacora_kiosco (descripcion, sms)
        VALUES (@descripcion, @sms)
        `
      )

    res.status(200).json({ message: 'SMS enviado correctamente' })
  } catch (error) {
    console.error('Ocurrió un error al enviar el SMS: ', error)
    res.status(500).json({ message: 'Ocurrió un error al enviar el SMS' })
    return
  }
})

clienteRouter.post('/validar-codigo', async (req: Request, res: Response) => {
  const { rfc, codigo } = req.body

  try {
    const pool = await getConnection()
    const result = await pool
      .request()
      .input('rfc', sql.VarChar, rfc)
      .input('codigo', sql.VarChar, codigo)
      .query(
        `
        SELECT TOP 1 * 
        FROM intermercado.dbo.codigoValidacionKiosco WITH (NOLOCK) 
        WHERE rfc = @rfc AND codigoValidacion = @codigo
      `
      )

    if (result.rowsAffected[0] === 0) {
      res.status(400).json({ message: 'Código no válido' })
      return
    }

    await pool
      .request()
      .input('rfc', sql.VarChar, rfc)
      .input('codigo', sql.VarChar, codigo)
      .query(
        `
        DELETE FROM intermercado.dbo.codigoValidacionKiosco 
        WHERE rfc = @rfc AND codigoValidacion = @codigo
      `
      )

    res.status(200).json({ message: 'Código válido' })
  } catch (error) {
    console.error('Ocurrió un error al validar el código: ', error)
    res.status(500).json({ message: 'Ocurrió un error al validar el código' })
    return
  }
})
