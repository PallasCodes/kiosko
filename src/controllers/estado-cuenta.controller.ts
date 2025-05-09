import { Router, Request, Response } from 'express'

import { getConnection, sql } from '../config/db'
import { getRandomCode } from '../utils/getRandomCode'

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
        O.folioInterno AS FolioInterno,
        UPPER(CONCAT(ISNULL(PF.nombre1, ''), ' ', ISNULL(PF.nombre2, ''), ' ', ISNULL(PF.apellidoPaterno, ''), ' ', ISNULL(PF.apellidoMaterno, ''))) AS NombreCliente,
        UPPER(E.nombre) AS Convenio,
        CAST(O.tiempoLiberacion AS DATE) AS FechaVenta,
        O.idProductoScc,
        UPPER(CO.nombre) AS Producto,
        UPPER(OE.nombre) AS Estatus,
        CONVERT(VARCHAR, O.montoDispersar, 1) AS Importe,
        UPPER(PF.rfc) AS RFC,
        O.idOrden AS Orden,
        CASE WHEN C.idEntidad IN (40, 124) THEN 2 ELSE 1 END AS JasperAUsar,
				RCT.nombreAsesorAsignado AS EnlaceAsesor,
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
      INNER JOIN dbo.productoScc AS CO WITH (NOLOCK) ON O.idProductoScc = CO.idProductoSCC
      INNER JOIN dbo.personaFisica AS PF WITH (NOLOCK) ON C.idPersonaFisica = PF.idPersonaFisica
      LEFT JOIN scc.refinanciamientosComercializacionTODOS AS RCT WITH (NOLOCK) ON O.idCliente = RCT.idCliente
        AND RCT.idOrdenPrevio LIKE ('%' + CAST(O.idOrden AS VARCHAR) + '%')
      WHERE O.idEstatusActual IN (2609, 2656, 2678)
        AND PF.rfc = UPPER(@rfc)
      ORDER BY FechaVenta ASC
    `
    )

  res.status(200).json({ ...result.recordset })
})
