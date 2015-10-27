/**
 * Created by qxj on 15/10/17.
 */
var Boat = require('../models/boat');
var Owner = require('../models/owner');
var Product = require('../models/product');
var tools = require('../tools');

exports.getBoatByCustomLink = function(req, res, next){
  Boat.findOne({customLink:req.params.link}).populate('owner', 'nickname').exec(function(err, boat){
    if(err){
      err.status = 400;
      return next(err);
    }else{
      if(boat){
        res.render('boat-detail', {boat: boat});
      }else{
        var err = new Error('Not Found');
        err.status = 404;
        next(err);
      }
    }
  });
};

exports.getBoat = function(req, res, next){
  Boat.findOne({_id:tools.decode(req.params.id)}).populate('owner', 'nickname').populate('products', '_id name summary baseCharge photo').exec(function(err, boat){
    if(err){
      err.status = 400;
      return next(err);
    }else{
      if(boat){
        res.render('boat-detail', {boat: boat});
      }else{
        var err = new Error('Not Found');
        err.status = 404;
        next(err);
      }
    }
  });
}

exports.getBoats = function(req, res, next){
  var query = {};
  var params = req.params;
  params.etmArray = [];
  params.extrasArray = [];

  var page = req.query.page || 1;

  if(req.params.location && req.params.location != 'all'){
    query['location.city'] = 'db.location.city.' + req.params.location;
  }else{
    params.location = 'all';
  }

  if(req.params.price && req.params.price != 'all'){
    var prices = req.params.price.split('-');
    query['baseCharge'] = {
      $gte: prices[0],
      $lte: prices[1]
    };
  }else{
    params.price = 'all';
  }

  if(req.params.capacity && req.params.capacity != 'all'){
    var capacity = req.params.capacity.split('-');
    query['capacity'] = {
      $gte: capacity[1]
    };
  }else{
    params.capacity = 'all';
  }

  if(req.params.entertainments && req.params.entertainments != 'no'){
    var entertainments = req.params.entertainments.split('-');
    params.etmArray = entertainments.slice();

    for(var i = 0; i < entertainments.length; i++){
      entertainments[i] = 'db.boat.etm.' + entertainments[i];
    }

    query['entertainments'] = {
      $all: entertainments
    };
  }else{
    params.entertainments = 'no';
  }

  if(req.params.extras && req.params.extras != 'no'){
    var extras = req.params.extras.split('-');
    params.extrasArray = extras.slice();

    for(var i = 0; i < extras.length; i++){
      extras[i] = 'db.boat.extras.' + extras[i];
    }

    query['extras'] = {
      $all: extras
    };
  }else{
    params.extras = 'no';
  }

  params.itemActived = function(item, type){
    return this[type].indexOf(item) >= 0;
  };

  params.getItemPath = function(item, type){
    var path = '';

    for(var i = 0; i < this[type].length; i++){
      if(this[type][i] != item){
        path += "-" + this[type][i];
      }
    }

    if(this[type].length == 0 || !this.itemActived(item, type)){
      path += "-" + item;
    }

    return path.slice(1, path.length) || 'no';
  };

  //with mongoose-paginate
  Boat.paginate(query, {
    page: page,
    limit: 12,
    columns: '_id name type baseCharge location photos'
  },function(err, boats, pageCount, itemCount){
    if(err){
      err.status = 400;
      return next(err);
    }else{
      if(boats){
        var pager = {
          current: parseInt(page),
          count: pageCount,
          pages: []
        };
        for(var i = 1; i <= pageCount; i++){
          pager.pages.push(i);
        }
        res.render('boat-list', {params: params, boats: boats, pager: pager, itemCount: itemCount});
      }
    }
  });
};

exports.insert = function(req, res, next){
  var boat = new Boat({
    bid: '201504',
    serialNumber: '201504',
    owner: '56233e877aafe569a7c5d1e6',
    name: 'Double X2',
    customLink: 'doublex2',
    length: 50,
    capacity: 60,
    type: 'db.boat.type.yacht',
    location: {
      city: 'db.location.city.hk',
      district: '',
      pier: 'db.location.pier.saikung'
    },
    baseCharge: 20000,
    description: 'Double X2 在西貢十分搶眼的西式遊艇，提供一流的服務。',
    photos: ['/img/bg_yacht2.jpg'],
    baseFacilities: ['db.boat.base.ac','db.boat.base.kitchen'],
    entertainments: ['db.boat.etm.mahjong','db.boat.etm.ktv','db.boat.etm.speedboat','db.boat.etm.wakeboard'],
    extras: ['db.boat.extras.launch','db.boat.extras.bbq']
  });

  boat.save(function (err) {
    if (err) {
      err.status = 400;
      return next(err);
    } else {
      res.send('OK');
    }
  });
};