/* monoose 모듈 불러들이기 */
const mongoose = require('mongoose');



const dataSchema = new mongoose.Schema({
    orgFileName : String,
    saveFileName : String
});

module.exports = mongoose.model("schema", dataSchema)