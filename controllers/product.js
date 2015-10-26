/**
 * Created by qxj on 15/10/25.
 */

var Boat = require('../models/boat');
var Owner = require('../models/owner');
var Product = require('../models/product');
var Package = require('../models/package');
var tools = require('../tools');

exports.getProduct = function(req, res, next){
  var boat = {
    id: req.params.boat_id,
    name: req.params.boat_name
  };

  Product.findOne({_id:tools.decode(req.params.id)}).populate({
    path: 'packages',
    match: {
      boats: tools.decode(boat.id)
    }
  }).exec(function(err, product){
    if(err){
      err.status = 400;
      return next(err);
    }else{
      if(product){
        res.render('product', {product: product, boat: boat, code: tools.code});
      }else{
        var err = new Error('Not Found');
        err.status = 404;
        next(err);
      }
    }
  });
};