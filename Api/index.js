var express = require('express')
var bodyParser = require('body-parser')
var app = express()
var candleStickGenerator = require('./candleStickGenerator.js');

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

app.get('/getCandleSticks', function (req, res) {
	candleStickGenerator.GetCandleStickData("10 minute", function(candleSticks){
		res.json(candleSticks);
	});
})

app.listen(3032, function () {
    console.log('Springblock API running on port 3032')
})
