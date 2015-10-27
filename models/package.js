/**
 * Created by qxj on 15/10/25.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var PackageSchema = new Schema({
  name: String,
  summary: String,
  currency: String,
  workingMonths: [],
  workingDays: [],
  baseCharge: Number,
  basePersons: Number,
  items: [],
  boats: [{type: Schema.Types.ObjectId, ref: 'Boat'}]
});

var Package = mongoose.model('Package', PackageSchema);

module.exports = Package;