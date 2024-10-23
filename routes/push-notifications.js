const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const { APP_ID, REST_API_KEY } = require('../config/config');

//======================
// ENVIAR NOTIFICACIÓN
//======================
router.post('/send-notification', (req, res) => {

    const bodySended = req.body;

    let data = {
        app_id: APP_ID,
        name: 'test',
        target_channel: 'push',
        headings: { es: bodySended.title, en: bodySended.title },
        contents: { es: bodySended.msg, en: bodySended.msg },
        small_icon: 'mipmap/ic_launcher_round',
        large_icon: 'mipmap/ic_launcher_round',
        /* data: { notification_info: 'Notificación de prueba' }, */
        data: bodySended.data ? bodySended.data : null
        /* included_segments: ['Active Subscriptions', 'Total Subscription'] */
    };

    if (bodySended.external_id) {
        data = {
            ...data,
            filters: [
                {
                    field: 'tag',
                    key: 'external_id',
                    relation: '=',
                    value: bodySended.external_id
                }
            ],
        }
    } else {
        data = {
            ...data,
            included_segments: ["Total Subscriptions"]
        }
    };

    /* console.log(JSON.stringify(data)); */

    const url = 'https://api.onesignal.com/notifications';
    const options = {
        method: 'POST',
        headers: { 'accept': 'application/json', 'content-type': 'application/json', 'Authorization': `Basic ${REST_API_KEY}` },
        body: JSON.stringify(data)
    };

    fetch(url, options)
        .then(res => res.json())
        .then(json => {
            res.json({
                ok: true,
                message: 'Notificación enviada',
                resp: json
            });
        })
        .catch(err => {
            res.status(500).json({
                ok: false,
                message: 'Error con el envío de la notificación',
                error: err
            });
        });

});


//========================================
// REGISTRAR TAG DE DISPOSITIVO ONESIGNAL
//========================================
router.post('/register-user-onesignal', (req, res) => {

    const bodySended = req.body;

    if(!bodySended.external_id) {
        return res.status(400).json({
            ok: false,
            message: 'No ha enviado el external_id'
        });
    }

    let data = {
        app_id: APP_ID,
        properties: {
            tags: { external_id: bodySended.external_id }
        },
        identity: {
            onesignal_id: bodySended.onesignal_id,
        }
    };

    const url = `https://api.onesignal.com/apps/${APP_ID}/users`;
    const options = {
        method: 'POST',
        headers: { accept: 'application/json', 'content-type': 'application/json', 'Authorization': `Basic ${REST_API_KEY}`  },
        body: JSON.stringify(data)
    };

    fetch(url, options)
        .then(res => res.json())
        .then(json => {
            res.json({
                ok: true,
                message: 'Tag OneSignal creado',
                resp: json
            });
        })
        .catch(err => {
            res.status(500).json({
                ok: false,
                message: 'Error con la creación del usuario OneSignal',
                error: err
            });
        });
});


module.exports = router;