var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var orderLog = require('../DB/orderLog.js');
var exchangeModules = {
  orderLog: orderLog
};
var exchange = require('./exchange.js')(exchangeModules);
var accounts = require('./accountManagement.js');

app.use(function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:4200');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  res.setHeader('Access-Control-Allow-Credentials', true);
  next();
});

app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(bodyParser.json());

app.get('/createNewAccount', function (req, res) {
	accounts.CreateAccount(function(newAccount){
		res.json(newAccount);
	});
})

app.get('/getLastTrade', function (req, res) {
	exchange.GetLastTrade(function(lastTrade){
		res.json(lastTrade);
	});
})

app.get('/getBidsAndAsks', function (req, res) {
	exchange.GetBidsAndAsks(12, function(bidsAndAsks){
		res.json(bidsAndAsks);
	});
})

app.get('/getStats', function (req, res) {
	exchange.GetStats(function(stats){
		res.json(stats);
	});
});

app.get('/submitOrder', function (req, res) {
  var order = {
    timestamp: Number(req.query.timestamp),
    id: req.query.id,
    accountId: req.query.accountId,
    type: req.query.type,
    price: Number(req.query.price),
    amount: Number(req.query.amount)
  };
	exchange.SubmitNewOrderForMatching(order, function(result){
		res.json(result);
	});
});

app.listen(3033, function () {
  console.log('Exchange engine is running on port 3033')
});

//exchange.StartExchangeSimulation();
