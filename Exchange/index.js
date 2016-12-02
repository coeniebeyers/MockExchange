var express = require('express')
var bodyParser = require('body-parser')
var app = express()
var exchange = require('./exchange.js')

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

app.get('/getStats', function (req, res) {
	exchange.GetStats(function(stats){
		res.json(stats);
	});
})

app.listen(3033, function () {
  console.log('Exchange engine is running on port 3033')
})

exchange.StartExchangeSimulation();
