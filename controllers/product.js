/**
 * Created by qxj on 15/10/25.
 */

var Boat = require('../models/boat');
var Owner = require('../models/owner');
var Product = require('../models/product');
var Package = require('../models/package');

exports.getProduct = function(req, res, next){
  var boatId = req.params.boat_id;

  Product.findOne({_id:req.params.id}).populate({
    path: 'packages',
    select: 'id name summary currency baseCharge basePersons maxPersons extraCharge items availableMonths availableDays description chargeInclude chargeExclude attention',
    match: {
      boats: boatId,
      inStock: true
    }
  }).exec(function(err, product){
    if(err){
      err.status = 400;
      return next(err);
    }else{
      if(product){
        Boat.findOne({_id:boatId}).select('id name owner capacity location').populate('owner', 'id nickname').exec(function(err, boat){
          if(err){
            err.status = 400;
            return next(err);
          }else{
            if(boat){
              return res.render('product', {product: product, boat: boat});
            }else{
              var err = new Error('Not Found');
              err.status = 404;
              return next(err);
            }
          }
        });
      }else{
        var err = new Error('Not Found');
        err.status = 404;
        return next(err);
      }
    }
  });
};