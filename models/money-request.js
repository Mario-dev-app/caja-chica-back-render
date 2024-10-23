const mongoose = require('mongoose');
const Schema = mongoose.Schema;
require('./area');
require('./usuario');

const getRegDate = () => {
    const hoy = new Date();
    hoy.setHours(hoy.getHours() - 5);
    return hoy;
}

const MoneyRequest = mongoose.model('money_request', new Schema({
    /* monto: {
        type: Number,
        required: true
    }, */
    descripcion: {
        type: String,
        required: true
    },
    /* concepto_id: {
        type: Schema.Types.ObjectId,
        ref: 'concept',
        required: true
    }, */
    details: [
        {
            monto: {
                type: Number,
                required: true
            },
            concepto: {
                type: String,
                required: true
            }
        }
    ],
    monto_total: {
        type: Number,
        required: true
    },
    /* tipo_doc: {
        type: String,
        required: true
    }, */
    area_id: {
        type: Schema.Types.ObjectId,
        ref: 'area',
        required: true
    },
    approver: {
        type: Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    caja: {
        type: Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    estado: {
        type: String,
        enum: ['POR REVISAR', 'APROBADO', 'RECHAZADO', 'DESEMBOLSADO', 'PENDIENTE', 'RENDIDO'],
        default: 'POR REVISAR'
    },
    user_id: {
        type: Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    fecha_registro: {
        type: Date,
        default: getRegDate
    },
    faltante: {
        type: Number,
        required: false
    },
    sobrante: {
        type: Number,
        required: false
    },
    fecha_aprobacion: {
        type: Date,
        required: false
    },
    fecha_desembolso: {
        type: Date,
        required: false
    },
    observacion: {
        type: String,
        required: false
    },
    OF_card_name: {
        type: String,
        required: false
    },
    OF_create_date: {
        type: String,
        required: false
    },
    OF_doc_num: {
        type: String,
        required: false
    },
    OF_item_code: {
        type: String,
        required: false
    },
    OF_prod_name: {
        type: String,
        required: false
    },
    OF_sucursal: {
        type: String,
        required: false
    }
}));

module.exports = MoneyRequest;