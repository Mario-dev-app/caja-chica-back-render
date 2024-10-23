const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Usuario = mongoose.model('Usuario', new Schema({
    usuario: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    nombre: {
        type: String,
        required: true
    },
    apellidos: {
        type: String,
        required: true
    },
    correo: {
        type: String,
        required: false
    },
    activo: {
        type: Boolean,
        default: true
    },
    role: {
        type: String,
        enum: ['USER', 'BOSS', 'GER', 'ADMIN', 'FINZ', 'ROOT'],
        default: 'USER'
    },
    empresa: {
        type: String,
        enum: ['MP', 'SP', 'SUF', 'RM'],
        required: true
    },
    sede: {
        type: String,
        enum: ['CA', 'SRC', 'CH', 'AQP', 'TRU'],
        required: true
    },
    onesignal_id: {
        type: String,
        required: false
    },
    external_id: {
        type: String,
        required: false
    }
}));

module.exports = Usuario;