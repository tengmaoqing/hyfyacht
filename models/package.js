/**
 * Created by qxj on 15/10/25.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var PackageSchema = new Schema({
  name: String,
  owner: {type: Schema.Types.ObjectId, ref: 'Owner'},
  summary: String,
  currency: String,
  availableMonths: [],
  availableDays: [],
  baseCharge: Number,
  basePersons: Number,
  items: [],
  boats: [{type: Schema.Types.ObjectId, ref: 'Boat'}]
});

var Package = mongoose.model('Package', PackageSchema);

module.exports = Package;