/**
 * Created by 2nd on 15/9/24.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var UserSchema = new Schema({
  mobile: String,
  username: String,
  nickname: String,
  avatar: String,
  email: String,
  hashedPassword: String,
  role: String,
  relatedOwner: {type: Schema.Types.ObjectId, ref: 'Owner'},
  currency: String,
  location: {
    city: String
  },
  contact: [{
    name: String,
    mobile: Number,
    email: String
  }],
  wechatOpenId: String
}, {
  versionKey: false
});

var User = mongoose.model('User', UserSchema);

module.exports = User;