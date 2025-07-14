import { EVENTS } from '@builderbot/bot'
import { utils } from '@builderbot/bot'
import { addKeyword } from '@builderbot/bot'

export const flowAsesoria = addKeyword(utils.setEvent('Asesoria')).addAnswer(['*¿Te gustaría realizar esta inspección gratuita?*\n\nPor favor elige una opción:\n\n*1.* Sí, deseo realizar mi inspección gratuita\n*2.* Estoy interesado, deseo mayor información\n*3.* No estoy interesado por el momento'], {capture: true, delay: 1000},
    async (ctx, ctxFn) => {
        const lista = ["Sí, deseo realizar mi inspección gratuita", "Estoy interesado, deseo mayor información", "No estoy interesado por el momento"]
        const n = ctx.body.trim()
        if(!["1","2","3"].includes(n)){
            return ctxFn.fallBack('⚠️ Ups, al parecer hubo un error. Por favor indica tu respuesta del *1 al 3* para calificar correctamente el servicio brindado por CVA')
        }
        //Guardando la respuesta
        await ctxFn.state.update({
            puntaje: n
        })
        const series = ctxFn.state.get('series')
        const cliente = ctxFn.state.get('cliente')
        const planes = ctxFn.state.get('planes')
        const modelos = ctxFn.state.get('modelos')
        const inicios = ctxFn.state.get('inicios')
        const correos = ctxFn.state.get('correos')
        // Enviando a Google Apps Scripts la RPTas de la primera pregunta
        fetch('https://script.google.com/macros/s/AKfycbyCFwwVrLsKG_xPC1t2P_yntt7u_chTxIDGCuQUue-m-AFIqNmExnv0Jk2wtsXVoTGQdQ/exec', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                celular: ctx.from.slice(2),
                calificacion: lista[parseInt(n) - 1],
                comentario: '-',
                fecha: new Date().toISOString(),
                evento: 'Asesoria',
                series: series,
                cliente: cliente,
                modelos: modelos,
                planes: planes,
                inicios: inicios,
                correos: correos
            })
        }).then(res => {
            if (!res.ok) console.error('Sheets devolvieron status', res.status)
        })
        .catch(err => console.error('Error enviando a Sheets:', err))

        if(n == '1'){
            return ctxFn.gotoFlow(flowSI_asesoria)
        }
        if(n == '2'){
            return ctxFn.gotoFlow(flowINTERESADO_asesoria)
        }
        if(n == '3'){
            return ctxFn.gotoFlow(flowNO_asesoria)
        }
    }
)

export const flowSI_asesoria = addKeyword(EVENTS.ACTION).addAnswer('📍Perfecto. Puedes realizar tu inspección gratuita directamente aquí:\n👉 https://form.jotform.com/250495962688071 \n\nTu ingeniero CVA  se comunicará contigo apenas recibamos tus respuestas')

export const flowINTERESADO_asesoria = addKeyword(EVENTS.ACTION).addAnswer('🛠️ ¡Gracias por tu interés! Puedes realizar tu inspección gratuita directamente aquí:\n👉 https://form.jotform.com/250495962688071 \nTu ingeniero CVA se comunicará contigo en los próximos días para brindarte toda la información y ayudarte a coordinar la inspección.')

export const flowNO_asesoria = addKeyword(EVENTS.ACTION).addAnswer('Gracias por tu respuesta.\nEntendemos tu posición. Solo queremos recordarte que esta inspección podría ayudarte a mejorar la disponibilidad de tu equipo para futuros proyectos.\n\n📌 Si más adelante deseas realizarla, no dudes en ingresar al siguiente link\n👉 https://form.jotform.com/250495962688071')