
var express = require('express');
var router = express.Router();

var article = require('../controllers/article');

router.get('/', article.getArticles);
router.get('/news/:newsId', article.getANews);
router.get('/detail/:articleId', article.getArticle);

module.exports = router;