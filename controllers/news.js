/**
 * Created by qxj on 16/3/25.
 */
var News = require('hyfbase').News;

exports.getANews = function (req, res, next) {
  News.findOne({
    _id: req.params.id,
    display: true
  }).populate({
    path: 'userId',
    select: 'nickname'
  }).exec(function(err, news){
    if (err) {
      err.status = 400;
      return next(err);
    }

    if (!news) {
      var httpErr = new Error('Not Found');
      httpErr.status = 404;
      return next(err);
    }

    res.render('news', {news:news});
  });
};

exports.getAllNews = function (req, res, next) {
  var page = req.query.page || 1;
  News.paginate({
    display:true
  },{
    page: page,
    limit: 10,
    sort: {
      createDate: -1
    }
  }, function (err, result) {
    if(err){
      err.status = 400;
      return next(err);
    }

    var pager = {
      current: parseInt(page),
      count: result.pages,
      pages: []
    };

    for (var i = 1; i <= result.pages; i++) {
      pager.pages.push(i);
    }

    return  res.render('news-list', {
      allNews:result.docs,
      pager:pager,
      itemCount: result.total
    });
  });
};
