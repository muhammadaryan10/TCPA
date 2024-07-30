const mongoose = require('mongoose');
const { Schema } = mongoose;
const historySchema = new mongoose.Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true }, 
    fileName:String,
    goodNumbers: [String],
    badNumbers: [String],
    goodNo: Number,
    badNo: Number,
    totalNumbersCount: Number,
    createdAt: { type: Date, default: Date.now },
});

const history = mongoose.model('history', historySchema);

module.exports = history;
