import { Router, Request, Response } from 'express'

import { getConnection, sql } from '../config/db'
import { printPDF } from '../utils/print'

export const estadoCtaRouter = Router()

estadoCtaRouter.get('/estados', async (req: Request, res: Response) => {
  const { rfc } = req.query

  const pool = await getConnection()
  const result = await pool
    .request()
    .input('rfc', sql.VarChar, rfc)
    .query(
      `
      SELECT
        O.folioInterno AS folioInterno,
        UPPER(CONCAT(ISNULL(PF.nombre1, ''), ' ', ISNULL(PF.nombre2, ''), ' ', ISNULL(PF.apellidoPaterno, ''), ' ', ISNULL(PF.apellidoMaterno, ''))) AS nombreCliente,
        UPPER(E.nombre) AS convenio,
        CAST(O.tiempoLiberacion AS DATE) AS fechaVenta,
        O.idProductoScc,
        UPPER(CO.nombre) AS producto,
        UPPER(OE.nombre) AS estatus,
        CONVERT(VARCHAR, O.montoDispersar, 1) AS importe,
        UPPER(PF.rfc) AS rfc,
        O.idOrden AS orden,
        CASE WHEN C.idEntidad IN (40, 124) THEN 2 ELSE 1 END AS jasperAUsar,
				RCT.nombreAsesorAsignado AS enlaceAsesor,
        CASE
          WHEN RCT.idSucursal = 98 THEN 1
          WHEN RCT.idSucursal IS NULL THEN 0
          ELSE 2
        END AS ea,
        ISNULL((
          CASE
            WHEN RCT.flujo IS NOT NULL THEN CONCAT('Obten hasta $', CONVERT(VARCHAR, ROUND(CAST(RCT.flujo AS MONEY), 0), 1))
          END
        ), '') AS promocion
      FROM dbo.orden AS O WITH (NOLOCK)
      INNER JOIN dbo.ordenestatus AS OE WITH (NOLOCK) ON O.idEstatusActual = OE.idEstatus
      INNER JOIN dbo.cliente AS C WITH (NOLOCK) ON O.idCliente = C.idCliente
      INNER JOIN dbo.entidad AS E WITH (NOLOCK) ON C.idEntidad = E.idEntidad
      INNER JOIN dbo.productoScc AS CO WITH (NOLOCK) ON O.idProductoScc = CO.idProductoSCC
      INNER JOIN dbo.personaFisica AS PF WITH (NOLOCK) ON C.idPersonaFisica = PF.idPersonaFisica
      LEFT JOIN scc.refinanciamientosComercializacionTODOS AS RCT WITH (NOLOCK) ON O.idCliente = RCT.idCliente
        AND RCT.idOrdenPrevio LIKE ('%' + CAST(O.idOrden AS VARCHAR) + '%')
      WHERE O.idEstatusActual IN (2609, 2656, 2678)
        AND PF.rfc = UPPER(@rfc)
      ORDER BY FechaVenta ASC
    `
    )

  res.status(200).json({ estadosCta: result.recordset })
})

estadoCtaRouter.post('/imprimir', async (req: Request, res: Response) => {
  await printPDF()
})
