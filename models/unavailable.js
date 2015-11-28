/**
 * Created by qxj on 15/11/28.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var UnavailableSchema = new Schema({
  boatId: Schema.Types.ObjectId,
  dateStart: Date,
  dateEnd: Date
},{
  versionKey: false
});

var Unavailable = mongoose.model('Unavailable', UnavailableSchema);

module.exports = Unavailable;