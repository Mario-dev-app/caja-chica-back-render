const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Usuario = require('./usuario');
const MoneyRequest = require('./money-request');

const getRegDate = () => {
    const hoy = new Date();
    hoy.setHours(hoy.getHours() - 5);
    return hoy;
}

const CashOutlay = mongoose.model('cash_outlay', new Schema({
    monto: {
        type: Number,
        required: true
    },
    tipo: {
        type: String,
        enum: ['CASH_IN', 'CASH_OUT'],
        required: true
    },
    fecha_registro: {
        type: Date,
        default: getRegDate
    },
    asignado_a: {
        type: Schema.Types.ObjectId,
        ref: 'Usuario',
        required: false
    },
    user_id: {
        type: Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    money_request_id: {
        type: Schema.Types.ObjectId,
        ref: 'money_request',
        required: false
    },
    usuario_solicitante: {
        type: String,
        required: false
    },
    balance: {
        type: Number,
        required: false
    }
}));

module.exports = CashOutlay;