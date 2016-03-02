

var Blog = require('hyfbase').Blog;
var News = require('hyfbase').News;

exports.getArticle = function(req, res, next) {

  Blog.findOne({
    _id: req.params.articleId,
    display: true
  }).populate({
    path: 'userId',
    select: 'nickname'
  }).exec(function(err, blog){
    if (err) {
      err.status = 400;
      return next(err);
    }

    if (!blog) {
      var httpErr = new Error('Not Found');
      httpErr.status = 404;
      return next(err);
    }

    res.render('article-detail', {blog:blog});
  });
}

exports.getArticles = function(req, res, next) {
  var page = req.query.page || 1;
  Blog.paginate({
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

    return  res.render('article-list', {
      articles:result.docs,
      pager:pager, 
      itemCount: result.total
    });
  });
}

exports.getANews = function (req, res, next) {
  News.findOne({
    _id: req.params.newsId,
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
}

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
}
