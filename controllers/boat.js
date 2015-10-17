/**
 * Created by qxj on 15/10/17.
 */
var Boat = require('../models/boat');

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
  Boat.findOne({serialNumber:req.params.id}).populate('owner', 'nickname').exec(function(err, boat){
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
  console.log(req.query);

  Boat.find({}, 'serialNumber name baseCharge location photos', function(err, boats){
    if(err){
      err.status = 400;
      return next(err);
    }else{
      if(boats){
        res.render('boat-list', {boats: boats});
      }
    }
  });
};

exports.insert = function(req, res, next){
  var boat = new Boat({
    bid: '201502',
    serialNumber: '201502',
    owner: '56220f1dc6f127cd0918482a',
    name: 'Rainbow NO.2',
    customLink: 'rainbow2',
    length: 50,
    capacity: 60,
    type: 'db.boat.type.yacht',
    location: {
      city: 'db.location.city.sz',
      district: '',
      pier: 'db.location.pier.szw'
    },
    baseCharge: 10000,
    description: 'Rainbow NO.2 在西貢十分搶眼的西式遊艇，提供一流的服務。',
    photos: ['/img/bg_yacht.jpg'],
    baseFacilities: ['db.boat.base.ac','db.boat.base.kitchen'],
    entertainments: ['db.boat.etm.mahjong','db.boat.etm.ktv','db.boat.etm.speedboat','db.boat.etm.wakeboard','db.boat.etm.bananaboat'],
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