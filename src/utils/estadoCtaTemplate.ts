export interface ReportPayload {
  estadosCta: EstadosCta[]
}

export interface EstadosCta {
  folioInterno: string
  nombre: string
  convenio: string
  tasaMensual: string[]
  tasaAnual: string[]
  cat: number
  impuesto: number
  tipoServicio: string
  claveCliente: string
  periodoEmision: string
  fechaLimitePago: string
  saldoInicial: number
  totalAbonado: number
  saldoActual: number
  fechaEmision: string
  estadoCliente: string
  fechaVenta: string
  plazos: number
  descuentoPeriodico: number
  periodoInicio: string
  periodoFin: string
  Modelo: string
  noSerie: string
  descripcion: string
  fecha: string
  periodo: string
  importe: number
  capital: number
  interes: number
  iva: number
  movimiento: string
  origen: string
  url: null
  saldoVencido: null
  idTransaccionOP: null
  referencia: null
  vigencia: string
}

export function generateEstadoCtaTemplate(payload: ReportPayload) {
  const info = payload.estadosCta[0]

  return `
  <!DOCTYPE html>
    <html>
    <head>
        <title>Document</title>
        <title>Pago Paynet</title>
    </head>
    <body>

      <div class="flex-center" style="width: 100%">
          <div id="logoIntermercado" style="margin-right: 50px; margin-left: 40px">
            <img
              src="https://intermercado.mx/wp-content/uploads/2021/02/logo-web-im-1.png"
              alt="Logo Intermercado"
              class="img-fluid"
            />
          </div>
          <div id="headerContainer">
            <span style="font-weight: 500; font-size: 26px" class="block">ESTADO DE CUENTA</span>
            <div style="font-size: 12px; padding-left: 60px">
              <span class="block" style="font-size: 23px">Todo a tu alcance</span>
              <span class="block">GB Plus SA de CV SOFOM ENR</span>
              <span class="block">RFC GPL0704252G3</span>
              <span class="block">Ignacio Allende 8, Colonia Centro</span>
            </div>
          </div>
        </div>

      <section style="padding: 0 40px; width: 100%; font-size: 11px; margin-top: 24px"">
          <div class="flex-between">
            <div>
              <div class="card">
                <span class="label" style="font-weight: 600">INFORMACIÓN GENERAL</span>
                <span class="block"><b>Nombre: </b>${info.nombre}</span>
                <span class="block"><b>Convenio: </b>${info.convenio}</span>
              </div>
              <div class="card" style="margin-top: 16px">
                <span class="block"><b>Tasa Mensual: </b>${
                  info.tasaMensual
                }</span>
                <span class="block"><b>Convenio: </b>${info.tasaAnual}</span>
                <span class="block"><b>CAT: </b>${(info.cat * 100).toFixed(
                  2
                )}%</span>
                <span class="block"><b>IVA: </b>16%</span>
              </div>
            </div>
            <div class="card">
              <span class="block"><b>Tipo de servicio: </b>${
                info.tipoServicio
              }</span>
              <span class="block"><b>Clave del client: </b>${
                info.claveCliente
              }</span>
              <span class="block"><b>Período: </b>${info.periodoEmision}</span>
              <span class="block"><b>Fecha límite pago: </b>${
                info.fechaLimitePago
              }</span>
              <span class="block"
                ><b>Saldo inicial: </b>$${info.saldoInicial.toLocaleString()}</span
              >
              <span class="block"
                ><b>Total abonado: </b>$${info.totalAbonado.toLocaleString()}</span
              >
              <span class="block"
                ><b>Saldo actual: </b>$${info.saldoActual.toLocaleString()}</span
              >
              <span class="block"><b>Fecha emisión: </b>${
                info.fechaEmision
              }</span>
              <span class="block"><b>Estado del cliente: </b>${
                info.estadoCliente
              }</span>
            </div>
          </div>

          <span class="label" style="margin-top: 16px; font-weight: 600; margin-bottom: 2px">DATOS DEL CRÉDITO</span>
          <div class="card flex" style="margin: 0 auto; text-align: center">
            <div>
              <b class="block">Folio Solicitud:</b>
              <span class="block">${info.folioInterno}</span>
            </div>
            <div>
              <b class="block">Fecha Venta:</b>
              <span class="block">${info.fechaVenta}</span>
            </div>
            <div>
              <b class="block">Plazos:</b>
              <span class="block">${info.plazos}</span>
            </div>
            <div>
              <b class="block">Descuento Periodico:</b>
              <span class="block">$${info.descuentoPeriodico.toLocaleString()}</span>
            </div>
            <div>
              <b class="block">Periodo Inicio:</b>
              <span class="block">${info.periodoInicio}</span>
            </div>
            <div>
              <b class="block">Periodo Fin:</b>
              <span class="block">${info.periodoFin}</span>
            </div>
            <div>
              <b class="block">Importe:</b>
              <span class="block">$${info.importe.toLocaleString()}</span>
            </div>
          </div>

          <span class="label" style="margin-top: 16px; font-weight: 600; margin-bottom: 2px">DATOS DEL SERVICIO</span>
          <div class="card flex" style="margin: 0 auto">
            <div>
              <b class="block">Modelo:</b>
              <span class="block">${info.Modelo}</span>
            </div>
            <div>
              <b class="block">No. Serie:</b>
              <span class="block">${info.noSerie}</span>
            </div>
            <div>
              <b class="block">Descripción:</b>
              <span class="block">${info.descripcion}</span>
            </div>
            <div>
              <b class="block">Importe:</b>
              <span class="block">$${info.importe.toLocaleString()}</span>
            </div>
          </div>
          <span class="block" style="margin-top: 2px"><b>Total: </b>$${info.importe.toLocaleString()}</span>
        </section>

      <span class="label" style="margin-top: 20px; margin-left: 40px; font-weight: 600">MOVIMIENTOS</span>
        <table style="font-size: 10px; padding: 40px; padding-top: 0; width: " id="edoCuenta">
          <tr style="font-weight: 600;">
            <th>Fecha</th>
            <th>Período</th>
            <th>Importe</th>
            <th>Capital</th>
            <th>Interés</th>
            <th>IVA</th>
            <th>Movimiento</th>
            <th>Origen</th>
            <th>Folio</th>
          </tr>
        ${(function fn() {
          let html = ``

          payload.estadosCta.forEach((edo) => {
            html += ` 
                <tr>
                  <td>${edo.fecha.toLocaleString()}</td>
                  <td>${edo.periodo.toLocaleString()}</td>
                  <td>$${edo.importe.toLocaleString()}</td>
                  <td>$${edo.capital.toLocaleString()}</td>
                  <td>$${edo.interes.toLocaleString()}</td>
                  <td>$${edo.iva.toLocaleString()}</td>
                  <td>${edo.movimiento}</td>
                  <td>${edo.origen}</td>
                  <td>${edo.folioInterno}</td>
                </tr>
              `
          })

          return html + '</table>'
        })()}
        
      <section style="margin: 80px 40px 0 40px; font-size: 11px">
          <span class="label"
            ><b>Erika Hernández: Unidad Especializada de Atención a Usuarios</b></span
          >
          <span class="block"
            ><b>Domicilio: </b>Ignacio Allende 8, Colonia Centro, Xalapa, Veracruz, C. P.
            91000 <b style="margin-left: 40px">Teléfonos: </b>01 228 8418300, 01 800
            5009195</span
          >
          <span class="block"
            ><b>Correo electrónico: </b
            ><a href="mailto:atencionclientes@intermercado.com.mx"
              >atencionclientes@intermercado.com.mx</a
            ><b style="margin-left: 40px">Página de internet: </b
            ><a href="https://www.intermercado.com.mx" target="_blank"
              >https://www.intermercado.com.mx</a
            ></span
          >
          <b class="block">
            Comisión Nacional para la Protección y Defensa de los Usuarios de Servicios
            Financieros (CONDUSEF):
          </b>
          <span class="block"
            >Con fundamento en el artículo 23 de la Ley para la Transparencia y Ordenamiento
            de los Servicios Financieros, el plazo para presentar solicitud de aclaración: 90
            días naturales contador a partir de la fecha de corte o, en su caso, de la
            realización de la operación o del servicio.</span
          >
          <div
            class="flex-between"
            style="
              color: white;
              background-color: #28367d;
              width: 100%;
              padding: 4px 6px;
              margin-top: 6px;
            "
          >
            <a href="https://www.intermercado.com.mx" target="_blank" style="color: white"
              >https://www.intermercado.com.mx</a
            >
            <b>Ignacio Allende 8, Colonia Centro, Xalapa, Veracruz, C.P. 91000</b>
          </div>
        </section>
    </body>
    </html>

    <style>
    body {
      font-family: Arial, Helvetica, sans-serif;
    }

    * {
      box-sizing: border-box;
      padding: 0;
      margin: 0;
    }

    .text-center {
      text-align: center;
    }

    .label {
      display: block;
      font-size: 12px;
    }

    .block {
      display: block;
    }

    .flex {
      display: flex;
      display: -webkit-box;
    }

    .flex-center {
      display: -webkit-box;
      display: flex;
      -webkit-box-pack: center;
      justify-content: center;
      -webkit-box-align: center;
      align-items: center;
    }

    .float-left {
      float: left;
    }

    .clear-left {
      clear: left;
    }

    .inline-block {
      display: inline-block;
    }

    .img-fluid {
      width: 100%;
      height: auto;
      display: block;
    }

    #amountToPay {
      width: 50%;
      background-color: #28367d;
      padding: 20px;
      color: #eee;
      -webkit-box-orient: vertical;
      -webkit-box-direction: normal;
      flex-direction: column;
    }

    #logoIntermercado {
      width: 120px;
    }

    #paynetLabel {
      font-size: 20px;
    }

    #header {
      padding: 10px 80px;
      display: -webkit-flex;
      display: flex;
      -webkit-justify-content: space-between;
      justify-content: space-between;
    }

    #logoPaynet {
      margin-left: 8px;
      width: 120px;
    }

    .container-body {
      margin-left: 24px;
    }

    .container {
      width: 100%;
    }

    .container .square {
      width: 30px;
      height: 50px;
      background-color: #28367d;
    }

    .container-title {
      font-size: 22px;
      font-weight: 700;
    }

    #logos {
      width: 65%;
    }

    .logos div {
      width: 50px;
      margin: 0 20px;
    }

    #edoCuenta td {
      padding-right: 10px;
      padding-left: 10px;
    }

    #headerContainer {
      background-color: #28367d;
      color: #eee;
      text-align: center;
      width: 100%;
      display: -webkit-box;
      display: flex;
      -webkit-box-align: center;
      align-items: center;
      -webkit-justify-content: space-between;
      justify-content: space-between;
      padding: 18px 30px 18px 50px;
    }

      .card {
      border: 2px solid #111;
      padding: 4px 8px;
    }

    .flex-between {
      display: -webkit-flex;
      display: flex;
      -webkit-justify-content: space-between;
      justify-content: space-between;
    }

    .card div {
      margin-right: 24px;
    }

    a {
      color: black;
    }
    </style>
 `
}
