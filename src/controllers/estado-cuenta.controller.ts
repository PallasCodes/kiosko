import { Router, Request, Response } from 'express'
import { getConnection, sql } from '../config/db'

export const estadoCtaRouter = Router()

estadoCtaRouter.get('/info-cliente', async (req: Request, res: Response) => {
  const { rfc, numCel } = req.query

  const pool = await getConnection()
  const result = await pool
    .request()
    .input('rfc', sql.VarChar, rfc ?? '')
    .input('numCel', sql.VarChar, numCel ?? '')
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
        C.contacto 
      FROM intermercado.dbo.personaFisica AS PF WITH (NOLOCK)
      INNER JOIN intermercado.dbo.contacto AS C WITH (NOLOCK)
        ON PF.idPersonaFisica = C.idPersonaFisica
        AND LEN(C.contacto) = 10
      INNER JOIN intermercado.dbo.catalogo AS CA WITH (NOLOCK)
        ON C.idTipo = CA.idCatalogo
        AND CA.idCatalogo = 1302
        AND CA.activo = 'S'
      WHERE PF.rfc = @rfc OR C.contacto = @numCel
      ORDER BY C.tiempoActualizacion DESC
      `
    )

  if (result.rowsAffected[0] === 0) {
    res.status(404).json({ message: 'No se encontró el cliente' })
    return
  }

  res.status(200).json({ ...result.recordset[0] })
})

estadoCtaRouter.get('/estados', async (req: Request, res: Response) => {
  const { rfc } = req.query

  const pool = await getConnection()
  const result = await pool
    .request()
    .input('rfc', sql.VarChar, rfc)
    .query(
      `
      SELECT ROW_NUMBER() OVER(ORDER BY CAST(O.tiempoLiberacion AS DATE) ASC) AS Row,
        O.folioInterno AS FolioInterno,
        UPPER(CONCAT(ISNULL(PF.nombre1, ''), ' ', ISNULL(PF.nombre2, ''), ' ', ISNULL(PF.apellidoPaterno, ''), ' ', ISNULL(PF.apellidoMaterno, ''))) AS NombreCliente,
        UPPER(E.nombre) AS Convenio,
        CAST(O.tiempoLiberacion AS DATE) AS FechaVenta,
        OC2.plazo AS Plazo,
        O.idContexto,
        UPPER(CO.nombre) AS Producto,
        UPPER(OE.nombre) AS Estatus,
        CONVERT(VARCHAR, O.montoDispersar, 1) AS Importe,
        UPPER(PF.rfc) AS RFC,
        O.idOrden AS Orden,
        CASE WHEN C.idEntidad IN (40, 124) THEN 2 ELSE 1 END AS JasperAUsar,
        ISNULL((CASE WHEN RCT.idSucursal = 98 THEN RCW.urlv2 ELSE RCT.nombreAsesorAsignado END), '') AS EnlaceAsesor,
        CASE
          WHEN RCT.idSucursal = 98 THEN 1
          WHEN RCT.idSucursal IS NULL THEN 0
          ELSE 2
        END AS EA,
        ISNULL((
          CASE
            WHEN RCT.flujo IS NOT NULL THEN CONCAT('Obten hasta $', CONVERT(VARCHAR, ROUND(CAST(RCT.flujo AS MONEY), 0), 1))
          END
        ), '') AS Promo
      FROM dbo.orden AS O WITH (NOLOCK)
      INNER JOIN dbo.ordenestatus AS OE WITH (NOLOCK) ON O.idEstatusActual = OE.idEstatus
      INNER JOIN dbo.cliente AS C WITH (NOLOCK) ON O.idCliente = C.idCliente
      INNER JOIN dbo.entidad AS E WITH (NOLOCK) ON C.idEntidad = E.idEntidad
      INNER JOIN dbo.contexto AS CO WITH (NOLOCK) ON O.idContexto = CO.idContexto
      INNER JOIN dbo.personaFisica AS PF WITH (NOLOCK) ON C.idPersonaFisica = PF.idPersonaFisica
      INNER JOIN dbo.ordencondicion AS OC WITH (NOLOCK) ON O.idCondicionOriginal = OC.idOrdenCondicion
      INNER JOIN dbo.ordencondicion AS OC2 WITH (NOLOCK) ON ISNULL(O.idCondicionActual, O.idCondicionOriginal) = OC2.idOrdenCondicion
      LEFT JOIN dbo.SCC_RefinanciamientosComercializacionTODOS AS RCT WITH (NOLOCK) ON O.idCliente = RCT.idCliente
        AND RCT.idOrdenPrevio LIKE ('%' + CAST(O.idOrden AS VARCHAR) + '%')
      LEFT JOIN dbo.SCC_RefinanciamientosComercializacionWeb AS RCW WITH (NOLOCK) ON O.idCliente = RCW.idCliente
        AND RCW.idOrdenPrevio LIKE ('%' + CAST(O.idOrden AS VARCHAR) + '%')
      LEFT JOIN dbo.credito AS CR WITH (NOLOCK) ON RCT.idCredito = CR.idCredito
      WHERE O.idEstatusActual IN (2609, 2656, 2678)
        AND PF.rfc = UPPER(@rfc)
      ORDER BY FechaVenta ASC
    `
    )

  res.status(200).json({ ...result.recordset })
})
