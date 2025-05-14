import { Request, Response, Router } from 'express'

import { getConnection, sql } from '../config/db'
import { generateEstadoCtaTemplate } from '../utils/estadoCtaTemplate'
import { generatePdfInBuffer } from '../utils/generatePdf'
import { printPDF } from '../utils/print'
import { uploadToS3 } from '../utils/s3'
import { shortenUrl } from '../utils/bitly'
import { sendSms } from '../dao/client.dao'
import { getCurrentYearWeek } from '../utils/periodoVenta.util'

export const estadoCtaRouter = Router()

const PDF_OPTIONS = {
  border: {
    top: '30px',
    bottom: '30px',
    left: 0,
    right: 0,
  },
}

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

estadoCtaRouter.post('/generar-pdf', async (req: Request, res: Response) => {
  const { idOrden } = req.body

  const key = `estados-cuenta/${idOrden}/${getCurrentYearWeek()}.pdf`
  const url = `https://s3.${process.env.AWS_REGION}.amazonaws.com/${process.env.S3_BUCKET_NAME}/${key}`

  const response = await fetch(url)

  if (response.ok) {
    res.status(200).json({ pdfUrl: url })
    return
  }

  const pool = await getConnection()
  const result = await pool
    .request()
    .input('idOrden', sql.Int, idOrden)
    .query(
      `
      SELECT distinct x.folioInterno,
      ISNULL(pf.nombre1+' ','')+ISNULL(pf.nombre2+' ','')+ISNULL(pf.apellidoPaterno+' ','')+ISNULL(pf.apellidoMaterno,'') AS nombre,
      n.nombre AS convenio,
      convert(varchar,case when n.identidad not in(40,124) then 'Tasa Mensual' else '' end) AS tasaMensual,
      convert(varchar,case when n.identidad not in(40,124) then 'Tasa Anual' else '' end) AS tasaAnual,
      convert(varchar, case when n.identidad not in(40,124) then convert(varchar, round(k.interes, 3, 1)*100 )+'%' else ' ' end) AS tasaMensual,
      convert(varchar, case when n.identidad not in(40,124) then convert(varchar,ROUND(k.interes*12, 3, 1)*100 )+'%' else ' ' end) AS tasaAnual,
      ROUND(ISNULL(r.catInformativo,0.643), 3, 1) AS cat,
      ROUND(r.iva, 3, 1) AS impuesto,
      q.nombre AS tipoServicio,
      CASE WHEN n.idTipoClaveEmpleado=1001 THEN pf.rfc ELSE e.ndp END AS claveCliente,
      intermercado.dbo.GETMONTHNAMEBYLANGUAGEANDNUMMONTH(MONTH(GETDATE()),'Spanish') + ' ' + CAST(YEAR(GETDATE()) AS VARCHAR(4)) AS periodoEmision,
      'Días '+k.diasPago+' de cada mes' AS fechaLimitePago,
      CAST(k.descuento*k.Plazo AS MONEY) AS saldoInicial,
      ISNULL(total.importe,0) AS totalAbonado,
      (k.descuento*k.plazo)-ISNULL(total.importe,0) AS saldoActual,
      CONVERT(VARCHAR(10), GETDATE(), 103) AS fechaEmision,
      u.nombre AS estadoCliente,
      CONVERT(VARCHAR(10), x.tiempoLiberacion, 103) AS fechaVenta,
      k.plazo AS plazos,
      CAST(k.descuento AS MONEY) AS descuentoPeriodico,
      occ.PeriodoInicio AS periodoInicio,
      occ.PeriodoFin AS periodoFin,
      CASE WHEN q.idTratamiento=1 THEN ISNULL(p.modelo, 'S/N') ELSE 'P'+RIGHT('000'+ CONVERT(VARCHAR,intermercado.dbo.getPrecioCapitalOrden(x.idOrden)/100),4) END AS Modelo,
      CASE WHEN q.idTratamiento=1 THEN ISNULL(a.serie, 'S/N') ELSE 'P'+RIGHT('000'+ CONVERT(VARCHAR,intermercado.dbo.getPrecioCapitalOrden(x.idOrden)/100),4) END AS noSerie,
      q.nombre+' $'+CONVERT(VARCHAR, CAST(intermercado.dbo.getPrecioCapitalOrden(x.idOrden) AS MONEY), 1) AS descripcion,
      --
      mov.fecha,
      convert(varchar,mov.Periodo) AS periodo,
      mov.Importe AS importe,
      ROUND((mov.importe * (sol.importe/(k.descuento*k.plazo))),2) AS capital,
      ROUND(mov.importe * ((((k.descuento*k.plazo) - sol.importe)/1.16)/(k.descuento*k.plazo)) ,2) AS interes,
      ROUND(mov.importe - (ROUND((mov.importe * (sol.importe/(k.descuento*k.plazo))),2) + ROUND(mov.importe * ((((k.descuento*k.plazo)-sol.importe)/1.16)/(k.descuento*k.plazo)) ,2)),2) AS iva,
      mov.Movimiento AS movimiento,
      mov.Origen AS origen,
      op.urlCodigoBarras as url,op.montoPagar AS saldoVencido, op.idTransaccionOP,
      referencia  as referencia, UPPER(CAST(DAY((eomonth(GETDATE()))) AS VARCHAR)+ ' de '+intermercado.dbo.GETMONTHNAMEBYLANGUAGEANDNUMMONTH(MONTH((eomonth(GETDATE()))),'Spanish')+' de '+CAST(YEAR((eomonth(GETDATE()))) AS VARCHAR)) AS vigencia

      --
      FROM intermercado.dbo.orden x WITH(NOLOCK)
      LEFT OUTER JOIN intermercado.dbo.cliente e WITH(NOLOCK) ON x.idCliente=e.idCliente
      LEFT OUTER JOIN intermercado.dbo.sindicato s WITH(NOLOCK) ON e.idSindicato=s.idSindicato
      LEFT OUTER JOIN intermercado.dbo.ordencondicion occ WITH(NOLOCK) ON occ.idOrdenCondicion = x.idCondicionActual
      LEFT OUTER JOIN intermercado.dbo.ordencondicion k WITH(NOLOCK) ON k.idordencondicion=ISNULL(x.idcondicionoriginal,x.idcondicionactual)
      LEFT OUTER JOIN intermercado.dbo.venta v WITH(NOLOCK) ON x.idOrden=v.idOrden AND v.idProducto NOT IN (3,5209,5192,5204,5205,5208,5211)
      LEFT OUTER JOIN intermercado.dbo.ventaDetalle d WITH(NOLOCK) ON x.idOrden=d.idOrden AND d.principal='S'
      LEFT OUTER JOIN intermercado.dbo.producto p WITH(NOLOCK) ON v.idProducto=p.idProducto
      LEFT OUTER JOIN intermercado.dbo.impuesto i WITH(NOLOCK) ON v.idImpuesto=i.idImpuesto
      LEFT OUTER JOIN intermercado.dbo.entidad n WITH(NOLOCK) ON e.idEntidad=n.idEntidad
      LEFT OUTER JOIN intermercado.dbo.catalogo u WITH(NOLOCK) ON e.idEstatus=u.idCatalogo
      LEFT OUTER JOIN intermercado.dbo.tipoOrden q WITH(NOLOCK) ON x.idTipo=q.idTipoOrden
      LEFT OUTER JOIN intermercado.dbo.tratamientofiscal w WITH(NOLOCK) ON q.idTratamiento=w.idTratamiento
      LEFT OUTER JOIN intermercado.dbo.credito r WITH(NOLOCK) ON x.idCredito=r.idCredito
      LEFT OUTER JOIN intermercado.dbo.articulo a WITH(NOLOCK) ON d.idArticulo=a.idArticulo
      left outer join intermercado.dbo.personafisica pf WITH(NOLOCK) on e.idpersonafisica=pf.idpersonafisica
      LEFT OUTER JOIN intermercado.dbo.solicitud sol WITH (NOLOCK) ON sol.idOrden = x.idOrden
      left outer join intermercado.dbo.saldovencido sv WITH (NOLOCK) on sv.idorden=x.idorden
      left outer join gbplus.op.pagoAdeudo op WITH (NOLOCK) on op.idOrden=x.idOrden
      LEFT OUTER JOIN (
        SELECT
        m.idorden,
        CONVERT(VARCHAR(10), MAX(m.fechamovimiento), 103) AS fecha,
        intermercado.dbo.GETPERIODOFROMIDCALENDARIOCOBRANZA(m.idCalendario) AS Periodo,
        CAST(SUM(tm.factor*m.importe) AS MONEY) AS Importe,
        MAX(tm.concepto) AS movimiento,
        MAX(om.descripcion) AS origen
        FROM intermercado.dbo.movimiento m WITH(NOLOCK)
        LEFT OUTER JOIN intermercado.dbo.tipomovimiento tm WITH(NOLOCK) ON tm.idtipomovimiento = m.idtipo
        LEFT OUTER JOIN intermercado.dbo.ordencondicion occ WITH(NOLOCK) ON occ.idordencondicion = m.idordencondicion
        LEFT OUTER JOIN intermercado.dbo.origenmovimiento om WITH(NOLOCK) ON om.idorigenmovimiento = m.idorigenmovimiento
        WHERE m.idorden = @idOrden
        GROUP BY m.idorden,m.idCalendario,m.idtipo,m.idorigenmovimiento
      ) mov ON mov.idorden = x.idorden
      LEFT OUTER JOIN (
        SELECT
        m.idorden,
        CAST(SUM(tm.factor*m.importe) AS MONEY) AS Importe
        FROM intermercado.dbo.movimiento m WITH(NOLOCK)
        LEFT OUTER JOIN intermercado.dbo.tipomovimiento tm WITH(NOLOCK) ON tm.idtipomovimiento = m.idtipo
        WHERE m.idorden = @idOrden
        GROUP BY m.idorden
      ) total ON total.idorden = x.idorden
      WHERE x.idOrden = @idOrden
      ORDER BY Periodo
    `
    )

  if (result.recordset.length === 0) {
    res.status(404).json({ message: 'No se encontraron resultados' })
    return
  }

  const reportContent = generateEstadoCtaTemplate({
    estadosCta: result.recordset,
  })

  const buffer = await generatePdfInBuffer(reportContent, PDF_OPTIONS)
  const pdfUrl = await uploadToS3({
    buffer,
    key,
    contentType: 'application/pdf',
  })

  res.status(200).json({ pdfUrl })
})

estadoCtaRouter.post('/send-sms', async (req: Request, res: Response) => {
  const { rfc, idOrden } = req.body

  try {
    const pool = await getConnection()
    const result = await pool
      .request()
      .input('rfc', sql.VarChar, rfc)
      .query(
        `
          SELECT TOP 1
            pfc.contacto
          FROM dbo.personaFisica pf WITH(NOLOCK)
          LEFT JOIN dbo.personaFisicaContacto pfc WITH(NOLOCK) ON pfc.idPersonaFisica = pf.idPersonaFisica
          WHERE pf.rfc = UPPER(@rfc) AND pfc.idTipo = 1302
        `
      )

    if (result.rowsAffected[0] === 0) {
      res.status(404).json({ message: 'No se encontró el cliente' })
      return
    }

    const celular = result.recordset[0].contacto

    const key = `estados-cuenta/${idOrden}/${getCurrentYearWeek()}.pdf`
    const urlPdfS3 = `https://s3.${process.env.AWS_REGION}.amazonaws.com/${process.env.S3_BUCKET_NAME}/${key}`

    const shortUrl = await shortenUrl(urlPdfS3)
    const resultSms = await pool
      .request()
      .query(
        `SELECT dbo.fn_Sms('${celular}', 'Tu estado de cuenta Intermercado para la orden: ${idOrden} - ${shortUrl}') Envio;`
      )

    console.log({ resultSms: resultSms.recordset })
    console.log(
      `'Tu estado de cuenta Intermercado para la orden: ${idOrden} - ${shortUrl}'`
    )

    // await sendSms(
    //   celular,
    //   `Tu estado de cuenta Intermercado para la orden: ${idOrden} - ${shortUrl}`
    // )

    res.status(200).json({ message: 'SMS enviado correctamente' })
  } catch (error) {
    console.error('Error al enviar el SMS:', error)
    res.status(500).json({ message: 'Error al enviar el SMS' })
    return
  }
})
