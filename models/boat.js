/**
 * Created by qxj on 15/10/17.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  mongoosePaginate = require('mongoose-paginate');

var BoatSchema = new Schema({
  serialNumber: String,
  owner: {type: Schema.Types.ObjectId, ref: "Owner"},
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

BoatSchema.plugin(mongoosePaginate);

var Boat = mongoose.model('Boat', BoatSchema);

module.exports = Boat;