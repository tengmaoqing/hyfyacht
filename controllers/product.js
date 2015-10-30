/**
 * Created by qxj on 15/10/25.
 */

var Boat = require('../models/boat');
var Owner = require('../models/owner');
var Product = require('../models/product');
var Package = require('../models/package');
var tools = require('../tools');

exports.getProduct = function(req, res, next){
  var boatId = tools.decode(req.params.boat_id);

  Product.findOne({_id:tools.decode(req.params.id)}).populate({
    path: 'packages',
    select: '_id name summary currency baseCharge basePersons extraCharge items availableMonths availableDays',
    match: {
      boats: boatId
    }
  }).exec(function(err, product){
    if(err){
      err.status = 400;
      return next(err);
    }else{
      if(product){
        Boat.findOne({_id:boatId}).select('_id name owner capacity location').populate('owner', 'nickname').exec(function(err, boat){
          if(err){
            err.status = 400;
            return next(err);
          }else{
            if(boat){
              res.render('product', {product: product, boat: boat});
            }else{
              var err = new Error('Not Found');
              err.status = 404;
              next(err);
            }
          }
        });
      }else{
        var err = new Error('Not Found');
        err.status = 404;
        next(err);
      }
    }
  });
};