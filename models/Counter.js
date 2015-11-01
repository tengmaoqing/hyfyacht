/**
 * Created by qxj on 15/11/1.
 */

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var CounterSchema = new Schema({
  model: String,
  prefix: String,
  seq: {type: Number, default: 1},
  createDate: {type: Date, default: Date.now, index: {expires: 60}}
}, {
  versionKey: false
});

var Counter = mongoose.model('Counter', CounterSchema);

module.exports = Counter;