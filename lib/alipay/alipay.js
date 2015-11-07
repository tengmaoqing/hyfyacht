/**
 * Created by qxj on 15/11/5.
 */
var alipayConfig = require('./alipay-config');
var alipayCore = require('./alipay-core');

exports.submitDirectPayByUser = function(req, res, next){
  var parameter = {
    service: 'create_direct_pay_by_user',
    partner: alipayConfig.partner,
    seller_email: alipayConfig.seller_email,
    payment_type: '1',
    notify_url: alipayConfig.notify_url,
    return_url: alipayConfig.return_url,
    out_trade_no: req.body.WIDout_trade_no,
    subject: req.body.WIDsubject,
    total_fee: req.body.WIDtotal_fee,
    body: req.body.WIDbody,
    show_url: req.body.WIDshow_url,
    anti_phishing_key: '',
    exter_invoke_ip: '',
    _input_charset: alipayConfig.input_charset
  };

  var params = alipayCore.buildRequestFormParams(parameter);

  var action = alipayConfig.alipay_gateway_new + '_input_charset=' + alipayConfig.input_charset.toLocaleLowerCase();

  return res.render('payment/alipay', {action: action, params: params});
};

exports.notify = function(req, res, next){
  if(alipayCore.verifyNotify(req)){

    return res.send('success');
  }else{
    return res.send('fail');
  }
};