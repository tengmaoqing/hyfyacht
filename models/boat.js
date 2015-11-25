/**
 * Created by qxj on 15/10/17.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  mongoosePaginate = require('mongoose-paginate');

var BoatSchema = new Schema({
  serialNumber: String,
  owner: {type: Schema.Types.ObjectId, ref: 'Owner'},
  name: String,
  length: Number,
  capacity: Number,
  type: String,
  location: {
    city: String,
    district: String,
    pier: String
  },
  baseCharge: Number,
  currency: String,
  description: String,
  thumbnail: String,
  photos: [String],
  baseFacilities: [String],
  entertainments: [String],
  extras: [String],
  products: [{type: Schema.Types.ObjectId, ref: 'Product'}],
  display: Boolean
});

BoatSchema.plugin(mongoosePaginate);

var Boat = mongoose.model('Boat', BoatSchema);

module.exports = Boat;