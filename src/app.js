import { createBot, createProvider, createFlow} from '@builderbot/bot'
import { PostgreSQLAdapter as Database } from '@builderbot/database-postgres'
import { BaileysProvider as Provider } from '@builderbot/provider-baileys'
import { startBrowser, generarImagen } from './functions/imageHTML.js'
import { flowSatisfaccion, flowBajo_satisfaccion, flowMedio_satisfaccion, flowAlto_satisfaccion, flowTerminado_satisfaccion} from './events/satisfaccion/encuestaSatisfaccion.js'
import path from 'path'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { dirname} from 'path'
import fs from 'fs/promises'
import dotenv from 'dotenv'
dotenv.config()

const PORT = process.env.PORT ?? 3008


/**
 * CARGAR PLANTILLAS .TXT
 */
// crea __filename y __dirname a partir de import.meta.url
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

let mensaje_satisfaccion
let mensaje_asesoria

async function loadTemplates() {
    const plantilla_satisfaccion =  join(__dirname, './events/satisfaccion/start.txt')
    mensaje_satisfaccion = await fs.readFile(plantilla_satisfaccion, 'utf8')

    const plantilla_asesoria = join(__dirname, './events/asesoria/start.txt')
    mensaje_asesoria = await fs.readFile(plantilla_asesoria, 'utf-8')
}

function enviarMensajeSatisfaccion(nombre){
    return mensaje_satisfaccion.replace('[nombre]', nombre)
}

function enviarMensajeAsesoria(nombre){
    return mensaje_asesoria.replace('[nombre]', nombre)
}

/**
 * --------------------------------------------------------------------------------------------
 * ----------------- F U N C I O N E S ------------------------------------------
 * ------------------------------------------------------------
 */

// Para generar el HTML
function generateTableHTML(datos) {
    const tableRows = datos.series.map((serie, index) => `
        <tr>
            <td>${serie}</td>
            <td>${datos.modelos[index] || '-'}</td>
            <td>${datos.planes[index] || '-'}</td>
            <td>${datos.inicios[index] || '-'}</td>
        </tr>
    `).join('')

    const tableHtml = `
        <table class="table">
            <thead>
                <tr>
                    <th>Serie</th>
                    <th>Modelo</th>
                    <th>Plan CVA</th>
                    <th>Fecha Inicio</th>
                </tr>
            </thead>
            <tbody>
                ${tableRows}
            </tbody>
        </table>
    `

    const css_styles = `
        <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Arial', sans-serif;
            background: linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%);
            margin: 0;
            padding: 30px;
            min-height: 100vh;
        }
        .header {
            padding: 25px 0;
            background: linear-gradient(135deg, #000000 0%, #333333 100%);
            color: #FFCC00;
            font-size: 32px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-bottom: 30px;
            border-radius: 15px;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
            text-align: center;
        }
        .logo {
            margin: 20px auto;
            display: block;
            width: 120px;
            height: auto;
            filter: drop-shadow(0 4px 8px rgba(255, 204, 0, 0.4));
        }
        .container {
            max-width: 1100px;
            width: 100%;
            margin: 0 auto;
            padding: 30px;
            background: #ffffff;
            box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15);
            border-radius: 20px;
            border: 3px solid #FFCC00;
        }
        .table {
            border-collapse: collapse;
            width: 100%;
            font-size: 16px;
            margin: 20px 0;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }
        .table thead th {
            background: linear-gradient(135deg, #FFCC00 0%, #FFD633 100%);
            color: #000000;
            padding: 18px 15px;
            font-size: 18px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
            text-align: center;
            border-bottom: 2px solid #000000;
        }
        .table tbody td {
            padding: 15px;
            font-size: 16px;
            text-align: center;
            border-bottom: 1px solid #e0e0e0;
            transition: background-color 0.3s ease;
        }
        .table tbody tr:nth-child(even) {
            background-color: #fffbeb;
        }
        .table tbody tr:hover {
            background-color: #fff3cd;
            transform: scale(1.01);
            transition: all 0.2s ease;
        }
        .footer {
            text-align: center;
            margin-top: 20px;
            color: #666;
            font-size: 14px;
        }
        @media print {
            body { background: white; }
            .container { box-shadow: none; }
        }
        </style>
    `

    const logo_html = `<img src="https://i.ibb.co/jvXWFRHb/LOGO-CVA-FINAL-01-1.png" class="logo" alt="CVA Logo">`
    const title_html = `<div class="header">Lista de Equipos con CVA</div>`
    //const footer_html = `<div class="footer">Generado el ${new Date().toLocaleDateString('es-ES')}</div>`

    return `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Equipos CVA - ${datos.cliente || 'Cliente'}</title>
            ${css_styles}
        </head>
        <body>
            ${logo_html}
            ${title_html}
            <div class="container">
                ${tableHtml}
            </div>
        </body>
        </html>
    `
}

// Función para verificar si un número existe en WhatsApp
async function verificarNumeroWhatsApp(bot, numero) {
    try {
        // Método 1: Usar onWhatsApp de Baileys
        const numeroCompleto = `51${numero}@s.whatsapp.net`
        const [result] = await bot.provider.vendor.onWhatsApp(numeroCompleto)
        
        if (result && result.exists) {
            console.log(`✅ Número ${numero} existe en WhatsApp`)
            return true
        } else {
            console.log(`❌ Número ${numero} NO existe en WhatsApp`)
            return false
        }
    } catch (error) {
        console.error(`Error verificando número ${numero}:`, error)
        return false
    }
}

// Para eliminar el archivo Path
async function eliminarArchivo(rutaArchivo) {
    try {
        await fs.unlink(rutaArchivo);
        console.log(`Archivo eliminado: ${rutaArchivo}`);
        return true;
    } catch (error) {
        console.error(`Error al eliminar el archivo ${rutaArchivo}:`, error);
        return false;
    }
}

const main = async () => {

    await loadTemplates()

    await startBrowser()

    const adapterFlow = createFlow([flowSatisfaccion, flowBajo_satisfaccion, flowMedio_satisfaccion, flowAlto_satisfaccion, flowTerminado_satisfaccion])
    
    const adapterProvider = createProvider(Provider)
    const adapterDB = new Database({
       host: process.env.POSTGRES_DB_HOST,
       user: process.env.POSTGRES_DB_USER,
       database: process.env.POSTGRES_DB_NAME,
       password: process.env.POSTGRES_DB_PASSWORD,
       port: +process.env.POSTGRES_DB_PORT
   })

    const { handleCtx, httpServer } = await createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    },{
        queue: {
            timeout: 30000,        // 30 s de tope por mensaje: sobrado para esos ~7 s de tabla
            concurrencyLimit: 25    // permite hasta 20 tareas en paralelo (tus ~15 usuarios caben)
        }
    })

    adapterProvider.server.post(
        '/v1/satisfaccion',
        handleCtx(async (bot, req, res) => {
            try {
                const {number, datos} = req.body
                console.log(datos)
                // Verificar si el número existe en WhatsApp
                const existeEnWhatsApp = await verificarNumeroWhatsApp(bot, number)

                if (existeEnWhatsApp) {
                    const htmlContent = generateTableHTML(datos)
                    // 2) Generar la imagen PNG en disco
                    const imgName = `tabla_${datos.cliente}.png`;
                    const imgPath = path.join(process.cwd(), 'assets', imgName);
                    await generarImagen(htmlContent, imgPath)

                    // Enviar mensaje con imagen
                    console.log('Enviando Imagne')
                    await bot.sendMessage(`51${number}`, enviarMensajeSatisfaccion(datos.cliente), {
                        media: join(process.cwd(),'assets', `tabla_${datos.cliente}.png`)
                    })

                    // Eliminando imagen
                    console.log('Imagen enviado')
                    await eliminarArchivo(imgPath)

                    //Guardando variables
                    await bot.state(`51${number}`).update({
                        series: datos.series,
                        cliente: datos.cliente,
                        modelos: datos.modelos,
                        planes: datos.planes,
                        inicios: datos.inicios,
                        correos: datos.correos_vendedores,
                    })

                    // Disparar flujo de satisfacción
                    await bot.dispatch('Satisfaccion', {
                        from: `51${number}`,
                    })

                    return res.end(JSON.stringify({
                        status: 'Datos enviado'
                    }))
                }else{
                    console.log(`❌ No se puede enviar mensaje. Número 51${number} no existe en WhatsApp`)
                    return res.end(JSON.stringify({
                        status: `Error: No existe el numero en WhatsApp 51${number}`
                    }))
                }
            } catch (error) {
                console.error('Error en /v1/send-info:', error)
                return res.end(JSON.stringify({
                    status: `Error: ${error.message}`
                }))
            }
        })
    )

    adapterProvider.server.post(
        '/v1/asesoria',
        handleCtx(async (bot, req , res) => {
            try {
                const {number, datos} = req.body
                console.log(datos)
                const existeEnWhatsApp = await verificarNumeroWhatsApp(bot, number)
                if(existeEnWhatsApp){
                    const htmlContent = generateTableHTML(datos)
                    const imgName = `tabla_${datos.cliente}.png`
                    const imgPath = path.join(process.cwd(), 'assets', imgName)
                    await generarImagen(htmlContent, imgPath)

                    //Enviar mensaje con Imagen
                    console.log('Enviando imagen')
                    await bot.sendMessage(`51${number}`,
                        enviarMensajeAsesoria(datos.cliente),{
                            media: join(process.cwd(), 'assets', `tabla_${datos.cliente}.png`)
                        }
                    )
                    console.log('Imagen enviado')
                    await eliminarArchivo(imgPath)

                    //Disparar flujo de asesoria
                    await bot.dispatch('Asesoria', {
                        from: `51${number}`
                    })

                    return res.end('Datos enviado')
                } else {
                    console.log(`✖️ No se puede enviar mensaje. Numero 51${number} no existe en WhatsApp`)
                    return res.end(`Error: No existe el numero en WhatsApp 51${number}`)
                }

            } catch (error) {
                console.error(`Error en el endPoint /Asesoria`, error)

                return res.end(`Error: ${error.message}`)
            }
        })
    )
    httpServer(+PORT)
}

main()
