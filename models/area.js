const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Area = mongoose.model('area', new Schema({
    descripcion: {
        type: String,
        required: true
    }
}));

module.exports = Area;