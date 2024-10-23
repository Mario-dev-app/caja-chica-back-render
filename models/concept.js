const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Area = require('./area');

const Concept = mongoose.model('concept', new Schema({
    descripcion: {
        type: String,
        required: true
    },
    /* area_id: {
        type: Schema.Types.ObjectId,
        ref: 'Area',
        required: true
    } */
}));

module.exports = Concept;