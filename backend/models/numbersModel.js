const mongoose = require('mongoose');

const numberSchema = new mongoose.Schema({
    number: {
        type: String,
        // required: true
    },
    status: {
        type: String,
        required: true
    },
    caseTitle: {
        type: String,
    },
    multipleCases: {
        type: String,
    },
    phoneType: {
        type: String,
    }
});

const Number = mongoose.model('Number', numberSchema);

module.exports = Number;
