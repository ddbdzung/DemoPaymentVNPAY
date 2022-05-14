const express = require('express');
require('dotenv').config()

const router = express.Router()

router
.get('/create_payment_url', function (req, res, next) {
  var dateFormat = require('dateformat');
  var date = new Date();

  var desc = 'Thanh toan don hang thoi gian: ' + dateFormat(date, 'yyyy-mm-dd HH:mm:ss');
  res.render('order', {title: 'Order page', amount: 1700000, description: desc})
})
.get('/vnpay_return', function (req, res, next) {
  var vnp_Params = req.query;

  var secureHash = vnp_Params['vnp_SecureHash'];

  delete vnp_Params['vnp_SecureHash'];
  delete vnp_Params['vnp_SecureHashType'];

  vnp_Params = sortObject(vnp_Params);

  var querystring = require('qs');
  const formData = {
    tranId: vnp_Params['vnp_BankTranNo'],
    orderDescription: Object.keys(querystring.parse(vnp_Params['vnp_OrderInfo']))[0],
    amount: vnp_Params['vnp_Amount'],
    bankCode: vnp_Params['vnp_BankCode'],
  }
  var tmnCode = process.env.vnp_TmnCode
  var secretKey = process.env.vnp_HashSecret
  var signData = querystring.stringify(vnp_Params, { encode: false });
  var crypto = require("crypto");     
  var hmac = crypto.createHmac("sha512", secretKey);
  var signed = hmac.update(new Buffer(signData, 'utf-8')).digest("hex");     
  if(secureHash === signed){
      //Kiem tra xem du lieu trong db co hop le hay khong va thong bao ket qua
      // Thuc hien luu tru don hang va redirect ve trang danh sach don hang
      const { orderList } = require('../data')
      orderList.push(formData)
      return res.redirect('/orders/viewAll')
  } else{
    res.send('Xac thuc that bai. Vui long thu lai!')
  }
})
.get('/viewAll', function(req, res) {
  const { orderList } = require('../data')
  res.render('orderList', {
    title: 'All your orders',
    orderList,
  })
})
.post('/create_payment_url', function (req, res, next) {
  var ipAddr = req.headers['x-forwarded-for'] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      req.connection.socket.remoteAddress;
  var dateFormat = require('dateformat');

  
  var tmnCode = process.env.vnp_TmnCode || 'FJACZKES'
  var secretKey = process.env.vnp_HashSecret || 'LJDZWBZDNDUNKMRATCBKYQSOXDFGGPAX'
  var vnpUrl = process.env.vnp_Url
  var returnUrl = process.env.vnp_ReturnUrl

  var date = new Date();

  var createDate = dateFormat(date, 'yyyymmddHHmmss');
  var orderId = dateFormat(date, 'HHmmss');
  var amount = req.body.amount;
  var bankCode = req.body.bankCode;
  
  var orderInfo = req.body.orderDescription;
  var orderType = req.body.orderType;
  var locale = req.body.language;
  if(locale === null || locale === ''){
      locale = 'vn';
  }
  var currCode = 'VND';
  var vnp_Params = {};
  vnp_Params['vnp_Version'] = '2.1.0';
  vnp_Params['vnp_Command'] = 'pay';
  vnp_Params['vnp_TmnCode'] = tmnCode;
  vnp_Params['vnp_Merchant'] = '20220514033235'
  vnp_Params['vnp_Locale'] = locale;
  vnp_Params['vnp_CurrCode'] = currCode;
  vnp_Params['vnp_TxnRef'] = orderId;
  vnp_Params['vnp_OrderInfo'] = orderInfo;
  vnp_Params['vnp_OrderType'] = orderType;
  vnp_Params['vnp_Amount'] = amount * 100;
  vnp_Params['vnp_ReturnUrl'] = returnUrl;
  vnp_Params['vnp_IpAddr'] = ipAddr;
  vnp_Params['vnp_CreateDate'] = createDate;
  if(bankCode !== null && bankCode !== ''){
      vnp_Params['vnp_BankCode'] = bankCode;
  }
  
  vnp_Params = sortObject(vnp_Params);

  var querystring = require('qs');
  var signData = querystring.stringify(vnp_Params, { encode: false });
  var crypto = require("crypto");     
  var hmac = crypto.createHmac("sha512", secretKey);
  var signed = hmac.update(new Buffer(signData, 'utf-8')).digest("hex"); 
  vnp_Params['vnp_SecureHash'] = signed;
  vnpUrl += '?' + querystring.stringify(vnp_Params, { encode: false });

  res.redirect(vnpUrl)
});

function sortObject(obj) {
	var sorted = {};
	var str = [];
	var key;
	for (key in obj){
		if (obj.hasOwnProperty(key)) {
		str.push(encodeURIComponent(key));
		}
	}
	str.sort();
    for (key = 0; key < str.length; key++) {
        sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
    }
    return sorted;
}

module.exports = router