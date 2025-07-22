import { Request, Response, Router } from 'express'

import { getConnection, sql } from '../config/db'
import { shortenUrl } from '../utils/bitly'
import { generateEstadoCtaTemplate } from '../utils/estadoCtaTemplate'
import { generatePdfInBuffer } from '../utils/generatePdf'
import { getCurrentYearWeek } from '../utils/periodoVenta.util'
import { printPDF } from '../utils/print'
import { uploadToS3 } from '../utils/s3'
import { getSocket } from '../websocket'

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
        AND o.idOrden not in (494304,
563456,
702872,
713601,
716882,
718396,
718606,
720783,
717726,
710724,
705858,
706937,
556848,
586281,
703426,
710348,
710354,
605204,
615432,
587347,
563725,
721294,
717715,
718820,
719221,
719657,
718730,
720747,
563193,
559566,
555851,
591013,
583583,
572534,
569672,
615549,
702588,
608604,
610302,
606223,
602461,
710519,
708067,
708212,
705136,
703038,
711898,
712246,
713206,
713937,
716319,
716319,
715426,
715621,
716160,
716278,
713505,
715621,
713601,
713640,
716388,
717803,
715129,
715426,
711923,
710977,
711870,
710977,
702872,
703038,
703038,
703445,
703459,
703829,
704847,
704917,
708067,
707829,
707626,
707829,
708466,
602919,
602923,
601548,
601691,
602293,
603503,
569672,
604158,
605659,
605659,
605659,
606223,
606548,
607633,
607633,
607633,
605659,
605659,
605659,
605659,
610890,
611109,
611109,
611112,
611134,
613481,
607798,
609122,
609189,
609562,
609562,
610230,
610230,
614972,
615225,
615309,
615348,
615432,
701466,
615658,
615716,
615716,
578964,
572585,
572855,
572858,
574166,
581136,
583210,
583210,
583210,
568449,
568449,
569358,
569768,
569963,
571906,
577007,
577236,
577785,
577785,
578964,
578964,
578964,
579702,
586745,
586745,
586745,
586996,
591392,
591392,
591643,
591643,
593497,
593497,
598190,
598474,
599576,
600369,
600455,
600455,
601114,
601141,
541862,
555437,
555698,
555698,
537242,
537242,
541864,
541864,
554141,
554496,
559789,
560212,
561435,
561893,
561893,
561893,
561893,
561893,
561893,
556276,
565024,
565397,
565397,
561894,
561894,
562459,
563050,
561893,
561893,
561894,
561894,
561894,
561894,
561894,
561893,
561894,
561894,
561894,
718820,
719661,
720745,
720745,
717726,
718405,
718405,
561894,
561894,
561894,
561893,
561893,
561893,
561893,
561893,
561894,
561894,
561894,
561894,
561894,
561894,
565456,
566504,
567345,
567345,
564245,
561893,
561893,
561893,
561893,
560212,
560235,
559566,
556950,
554858,
554858,
538701,
530279,
555851,
541862,
556276,
601261,
600455,
600455,
600098,
600369,
599534,
598360,
593497,
593635,
596638,
592230,
591643,
591392,
591643,
591643,
586996,
581038,
583781,
585747,
578964,
572458,
569542,
569358,
583210,
583210,
582398,
582398,
582398,
582913,
574166,
576114,
579540,
569768,
701254,
701254,
702872,
702872,
615348,
615225,
615225,
608915,
610294,
608285,
608392,
608488,
613760,
614447,
614541,
614972,
611134,
605659,
606049,
605659,
605659,
607633,
607633,
606987,
606336,
605659,
603601,
604158,
602293,
602293,
602923,
708964,
710202,
710202,
708212,
707829,
707829,
707727,
708067,
704613,
707026,
707133,
706460,
706520,
703459,
703822,
710977,
710886,
710977,
715426,
713206,
713354,
713206,
717815,
718396,
718396,
717715,
715604)
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

  try {
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
  } catch (error) {
    console.error('Error al generar el PDF:', error)
    res.status(500).json({ message: 'Error al generar el estado de cuenta' })
    return
  }
})

estadoCtaRouter.post('/send-sms', async (req: Request, res: Response) => {
  const { idOrden, celular } = req.body

  try {
    const pool = await getConnection()

    const key = `estados-cuenta/${idOrden}/${getCurrentYearWeek()}.pdf`
    const urlPdfS3 = `https://s3.${process.env.AWS_REGION}.amazonaws.com/${process.env.S3_BUCKET_NAME}/${key}`

    const shortUrl = await shortenUrl(urlPdfS3)
    await pool
      .request()
      .query(
        `SELECT dbo.fn_Sms('${celular}', 'Tu estado de cuenta Intermercado para la orden: ${idOrden} - ${shortUrl}') Envio;`
      )

    res.status(200).json({ message: 'SMS enviado correctamente' })
  } catch (error) {
    console.error('Error al enviar el SMS:', error)
    res.status(500).json({ message: 'Error al enviar el SMS' })
    return
  }
})

estadoCtaRouter.post('/print', async (req: Request, res: Response) => {
  try {
    const io = getSocket()

    io.emit('print', {
      message: 'Imprimiendo estado de cuenta',
      pdfUrl: req.body.pdfUrl,
    })

    res.status(200).json({ message: 'Imprimiendo estado de cuenta' })
    return
  } catch (error) {
    console.error('Error al imprimir el estado de cuenta:', error)
    res.status(500).json({ message: 'Error al imprimir el estado de cuenta' })
    return
  }
})
