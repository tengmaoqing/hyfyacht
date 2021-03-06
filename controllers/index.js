/**
 * Created by qxj on 15/11/25.
 */
var Boat = require('hyfbase').Boat;

exports.renderIndex = function(req, res, next){
  var slides = [
    'http://img.hgboating.com/base/index1.jpg',
    'http://img.hgboating.com/base/index-r-01.jpg',
    'http://img.hgboating.com/base/index-r-02.jpg',
    'http://img.hgboating.com/base/index-r-03.jpg'
  ];

  var ids = ['567645d592aba05cbfe5e21f', '567645f892aba05cbfe5e220', '565066e00b02105ea0f3b8b4', '565ac53fdee4d4c83bb11137', '565ac572dee4d4c83bb11138', '5681f3f7b9c3f0448768c022'];


  Boat.find({
    _id: { $in: ids}
  }).select('_id name type baseCharge currency location thumbnail').exec(function(err, boats){
    if(err){
      err.status = 400;
      return res.render('index', {slides: slides});
    }

    return res.render('index', {slides: slides, boats: boats});
  });
};