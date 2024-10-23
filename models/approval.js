const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Approval = mongoose.model('approval', new Schema({
    approval_id: {
        type: String,
        required: true
    },
    user_id: {
        type: String,
        required: true,
        unique: true
    }
}));

module.exports = Approval;