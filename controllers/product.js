/**
 * Created by qxj on 15/10/25.
 */
var Boat = require('hyfbase').Boat;
var Product = require('hyfbase').Product;
var co = require('co');

exports.getProduct = function(req, res, next){
  var boatId = req.params.boatId;

  co(function *(){
    try {
      var product = yield Product.findOne({_id: req.params.id}).populate({
        path: 'packages',
        select: 'id name summary currency baseCharge basePersons maxPersons extraCharge items availableMonths availableDays type charges',
        match: {
          boats: boatId,
          inStock: true
        }
      }).exec();

      var boat = yield Boat.findOne({_id: boatId}).select('id name owner capacity location region').populate('owner', 'id nickname').exec();
    }catch (err){
      err.status = 500;
      throw err;
    }

    if(!product || !boat){
      var err = new Error('Not Found');
      err.status = 404;
      throw err;
    }

    return res.render('product', {product: product, boat: boat});
  }).catch(function(err){
    return next(err);
  });
};