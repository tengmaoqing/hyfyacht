/**
 * Created by qxj on 15/11/25.
 */
var Boat = require('../models/boat');

exports.renderIndex = function(req, res, next){
  var slides = [
    'http://img.hgboating.com/base/index1.jpg',
    'http://img.hgboating.com/base/index4.jpg',
    'http://img.hgboating.com/base/index3.jpg'
  ];

  var ids = ['565066e00b02105ea0f3b8b4'];


  Boat.find({
    _id: { $in: ids}
  }).select('_id name type baseCharge currency location thumbnail').exec(function(err, boats){
    if(err){
      err.status = 400;
      return res.render('index', {slides: slides});
    }else{
      return res.render('index', {slides: slides, boats: boats});
    }
  });
};