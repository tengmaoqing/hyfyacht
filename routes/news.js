
var express = require('express');
var router = express.Router();

var article = require('../controllers/article');

router.get('/', article.getAllNews)
router.get('/detail/:newsId', article.getANews);
module.exports = router;