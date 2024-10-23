const { APP_ID, REST_API_KEY } = require('../config/config');
const fetch = require('node-fetch');

const sendPushNotification = async (title, msg, external_id) => {

    let data = {
        app_id: APP_ID,
        name: 'test',
        target_channel: 'push',
        headings: { es: title, en: title },
        contents: { es: msg, en: msg },
        small_icon: 'mipmap/ic_launcher_round',
        large_icon: 'mipmap/ic_launcher_round',
        filters: [
            {
                field: 'tag',
                key: 'external_id',
                relation: '=',
                value: external_id
            }
        ],
        /* data: { notification_info: 'Notificación de prueba' }, */
        /* data: bodySended.data ? bodySended.data : null */
        /* included_segments: ['Active Subscriptions', 'Total Subscription'] */
    };


    const url = 'https://api.onesignal.com/notifications';
    const options = {
        method: 'POST',
        headers: { 'accept': 'application/json', 'content-type': 'application/json', 'Authorization': `Basic ${REST_API_KEY}` },
        body: JSON.stringify(data)
    };

    try {
        await fetch(url, options);
    } catch (error) {
        console.log('Error en enviar notificación push: ', error);
    }
}

module.exports = sendPushNotification;