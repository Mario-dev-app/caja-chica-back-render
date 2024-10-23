const express = require('express');
const router = express.Router();
const MoneyRequest = require('../models/money-request');
const Approval = require('../models/approval');
const Usuario = require('../models/usuario');
const CashOutlay = require('../models/cash-outlay');
const sendPushNotification = require('../utils/send-push-notifications');

/* const getToday = () => {
    const hoy = new Date();
    hoy.setHours(-5, 0, 0, 0);
    return hoy;
} */

//=========================================
// REGISTRAR UNA NUEVA SOLICITUD DE DINERO
//=========================================
router.post('/money-request', async (req, res) => {
    const body = req.body;

    const usuarioRequester = await Usuario.findOne({ _id: body.user_id });

    const usuarioAdministrator = await Usuario.findOne({ _id: body.caja });
    
    if(usuarioRequester.empresa !== usuarioAdministrator.empresa || usuarioRequester.sede !== usuarioAdministrator.sede) {
        return res.status(400).json({
            ok: false,
            message: 'La caja seleccionada no es de su sede o empresa'
        });
    }

    const approval = await Approval.findOne({ user_id: body.user_id });

    const lastMoneyRequest = await MoneyRequest.findOne({ user_id: body.user_id }).sort({ fecha_registro: -1 });

    const lastCashInByCaja = await CashOutlay.find({ tipo: 'CASH_IN', asignado_a: body.caja }).sort({ fecha_registro: -1 });

    if(lastCashInByCaja.length === 0 || lastCashInByCaja[0].balance < body.monto_total) {
        return res.status(401).json({
            ok: false,
            message: 'No hay fondos suficientes en la caja seleccionada para desembolsar ese monto'
        });
    }

    if(body.monto_total > 400) {
        return res.status(401).json({
            ok: false,
            message: 'Monto límite de solicitud es de S/. 400.00'
        });
    }

    if(lastMoneyRequest && ['APROBADO', 'DESEMBOLSADO', 'POR REVISAR'].includes(lastMoneyRequest.estado)) {
        return res.status(401).json({
            ok: false,
            message: 'Ya cuenta con una solicitud de dinero activa'
        });
    }

    MoneyRequest.create({
        monto_total: body.monto_total,
        area_id: body.area_id,
        approver: approval.approval_id,
        details: body.details,
        /* tipo_doc: body.tipo_doc, */
        descripcion: body.descripcion,
        user_id: body.user_id,
        caja: body.caja,
        estado: (approval.approval_id === body.user_id) ? 'APROBADO' : body.estado,
        fechaRegistro: body.fecha_registro,
        fechaAprobacion: body.fecha_aprobacion,
        fechaDesembolso: body.fecha_desembolso,
        OF_card_name: body.OF_card_name,
        OF_create_date: body.OF_create_date,
        OF_doc_num: body.OF_doc_num,
        OF_item_code: body.OF_item_code,
        OF_prod_name: body.OF_prod_name,
        OF_sucursal: body.OF_sucursal
    }).then(async (resp) => {

        /* ENVIO DE NOTIFICACIÓN PUSH */
        if (approval.approval_id !== body.user_id) {
            const usuario = await Usuario.findOne({ _id: body.user_id });

            if (usuario.external_id) {
                sendPushNotification('Solicitud de dinero', `El usuario ${usuario.nombre} ${usuario.apellidos} está pidiendo aprobación para una solicitud`, approval.approval_id);
            }
        }

        res.json({
            ok: true,
            resp,
            message: 'Solicitud de dinero registrada correctamente'
        });
    }).catch((err) => {
        res.status(500).json({
            ok: false,
            message: 'Error interno',
            err
        });
    });
});


//================================
// ACTUALIZAR SOLICTUD DE DINERO
//================================
router.put('/money-request/:id', async (req, res) => {
    const body = req.body;
    const id = req.params.id;
    const lastCashInByCaja = await CashOutlay.findOne({ tipo: 'CASH_IN', asignado_a: body.user_id }).sort({ fecha_registro: -1 });
    const moneyRequestById = await MoneyRequest.findOne({_id: id});
    if (!lastCashInByCaja && !['APROBADO', 'RECHAZADO'].includes(body.estado) ) {
        return res.status(400).json({
            ok: false,
            message: 'Aún no tiene asignado fondo fijo'
        });
    }
    
    if (body.estado === 'DESEMBOLSADO' && body.money_req_monto > lastCashInByCaja.balance) {
        return res.status(400).json({
            ok: false,
            message: 'El monto a desembolsar es mayor al que se tiene asignado'
        });
    }

    if(body.estado === 'RENDIDO' && body.faltante > lastCashInByCaja.balance) {
        return res.status(400).json({
            ok: false,
            message: 'Monto faltante excede a lo asignado a fondo fijo'
        });
    }

    if(body.estado === 'RENDIDO' && body.sobrante > moneyRequestById.monto_total) {
        return res.status(400).json({
            ok: false,
            message: 'Monto sobrante no puede ser mayor al monto desembolsado'
        });
    }

    if(body.faltante && moneyRequestById.monto_total + body.faltante > 400) {
        return res.status(400).json({
            ok: false,
            message: 'La suma de lo solicitado más el faltante no pueden exceder el límite de S/. 400.00'
        });
    }

    MoneyRequest.findByIdAndUpdate(id, {
        monto_total: body.monto_total,
        area_id: body.area_id,
        details: body.details,
        descripcion: body.descripcion,
        estado: body.estado,
        caja: body.caja,
        fechaDesembolso: body.fecha_desembolso,
        observacion: body.observacion,
        faltante: body.faltante,
        sobrante: body.sobrante
    }).populate('user_id').exec()
        .then(async (resp) => {

            if (body.estado && body.estado === 'RECHAZADO') {
                if (resp.user_id.external_id) {
                    sendPushNotification('Rechazo de solicitud', `Su jefe ha rechazado su solicitud por el monto de S/. ${resp.monto_total}`, resp.user_id.external_id);
                }
                resp.fecha_aprobacion = Date.now();
                await resp.save();
            }
            if (body.estado && body.estado === 'APROBADO') {
                if (resp.user_id.external_id) {
                    sendPushNotification('Solicitud aprobada', `Su jefe aprobó su solicitud registrada por el monto de S/. ${resp.monto_total}`, resp.user_id.external_id);
                }
                resp.fecha_aprobacion = Date.now();
                await resp.save();
            }

            let approval_external_id;
            if (body.estado && body.estado === 'DESEMBOLSADO') {
                const { approval_id } = await Approval.findOne({ user_id: resp.user_id._id }).select('approval_id');
                const usuario = await Usuario.findOne({ _id: approval_id });
                approval_external_id = usuario.external_id;
                if (usuario.external_id) {
                    sendPushNotification('Desembolso realizado', `Se realizó el desembolso por la solicitud de S/. ${resp.monto_total}`, usuario.external_id);
                }
                resp.fecha_desembolso = Date.now();
                await resp.save();

                if (lastCashInByCaja) {
                    await CashOutlay.create({
                        monto: resp.monto_total,
                        tipo: 'CASH_OUT',
                        user_id: body.user_id,
                        money_request_id: resp._id,
                        usuario_solicitante: resp.user_id.usuario,
                        /* balance: lastCashInByCaja.balance - resp.monto_total */
                    });

                    lastCashInByCaja.balance = lastCashInByCaja.balance - resp.monto_total;
                    await lastCashInByCaja.save();
                }
            }

            if (body.estado && body.estado === 'RENDIDO') {
                if(body.sobrante) {
                    lastCashInByCaja.balance = lastCashInByCaja.balance + body.sobrante;
                    sendPushNotification('Documento rendido', `Hubo un sobrante de S/. ${body.sobrante} en el desembolso dado de S/. ${resp.monto_total}`, approval_external_id);
                } 
                if(body.faltante) {
                    lastCashInByCaja.balance = lastCashInByCaja.balance - body.faltante;
                    sendPushNotification('Documento rendido', `Hubo un faltante de S/. ${body.faltante} en el desembolso dado de S/. ${resp.monto_total}`, approval_external_id);
                }

                if(body.sobrante || body.faltante) {
                    await lastCashInByCaja.save();
                }
            }

            res.json({
                ok: true,
                message: 'Solicitud actualizada',
                resp
            });
        }).catch((err) => {
            console.log(err);
            res.status(500).json({
                ok: false,
                message: 'Error interno',
                err
            });
        });
});

//==========================================
// OBTENER REPORTE DE SOLICITUDES POR CAJA
//==========================================
router.get('/money-requests', (req, res) => {
    const caja_id = req.query.caja;
    const page = req.query.p;
    const limit = 5;
    const skip = page * limit;
    MoneyRequest.find({ caja: caja_id })
        .populate(['area_id', 'user_id'])
        .sort({ fecha_registro: -1 })
        .skip(skip)
        .limit(limit)
        .exec()
        .then(async (resp) => {
            const count = await MoneyRequest.countDocuments();
            res.json({
                ok: true,
                money_requests: resp,
                count
            });
        }).catch((err) => {
            res.status(500).json({
                ok: false,
                message: 'Error interno',
                err
            });
        });
});

//=============================================
// OBTENER REPORTE DE SOLICITUDES POR USUARIO
//=============================================
router.get('/money-requests-by-user', (req, res) => {
    const user_id = req.query.userId;
    const page = req.query.p;
    const limit = 5;
    const skip = page * limit;
    MoneyRequest.find({ user_id })
        .populate(['area_id', 'user_id'])
        .sort({ fecha_registro: -1 })
        .skip(skip)
        .limit(limit)
        .exec()
        .then(async (resp) => {
            const count = await MoneyRequest.countDocuments();
            res.json({
                ok: true,
                money_requests: resp,
                count
            });
        }).catch((err) => {
            res.status(500).json({
                ok: false,
                message: 'Error interno',
                err
            });
        });
});

//=========================================
// FILTRAR SOLICITUDES POR FECHA Y USUARIO
//=========================================
router.get('/money-requests-filters', (req, res) => {
    const desde = new Date(req.query.desde);
    const hasta = new Date(req.query.hasta);

    MoneyRequest.find({
        fecha_registro: {
            $gte: desde,
            $lte: hasta
        }
    }).populate(['user_id', 'area_id']).exec().then((resp) => {
        let new_response;
        if (req.query.usuario !== '*') {
            new_response = resp.filter((item) => {
                return item.user_id.usuario === req.query.usuario;
            });
        } else {
            new_response = resp;
        }

        res.json({
            ok: true,
            money_requests: new_response
        });
    }).catch((err) => {
        res.status(500).json({
            ok: false,
            message: 'Error interno',
            err
        });
    });
});

module.exports = router;