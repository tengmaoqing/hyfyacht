/**
 * Created by qxj on 15/10/17.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var BoatSchema = new Schema({
  bid: String,
  serialNumber: String,
  owner: {type: Schema.Types.ObjectId, ref: "User"},
  name: String,
  customLink: String,
  length: Number,
  capacity: Number,
  type: String,
  location: {
    city: String,
    district: String,
    pier: String
  },
  baseCharge: Number,
  description: String,
  photos: [String],
  baseFacilities: [String],
  entertainments: [String],
  extras: [String],
  createDate: {type: Date, default: Date.now}
});

var Boat = mongoose.model('Boat', BoatSchema);

module.exports = Boat;