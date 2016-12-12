var uuid = require('uuid');
var expect = require('expect.js');
var orderLog = require('./orderLog.js');
var exchange = require('../Exchange/exchange.js')(orderLog);
var accountManagement = require('../Exchange/accountManagement.js');
var mockOrders = require('./fixtures/orders.js').MockOrders;

var account = null;

describe('exchange', function() {
  it('should be able to add an account', function(done){
    account = accountManagement.CreateAccount();
    done();
  });
  it('should be able to add a bid', function(done) {
    exchange.SubmitNewOrderForMatching(mockOrders[0], function(res){
      expect(res.submitted).to.equal(true);
      exchange.GetBidsAndAsks(1, function(bidsAndAsks){
        expect(bidsAndAsks.bids[0].timestamp).to.equal(1481536182349);
        expect(bidsAndAsks.bids[0].id).to.equal('4e367fd0-c050-11e6-992a-730712547a2a');
        expect(bidsAndAsks.bids[0].accountId).to.equal(0);
        expect(bidsAndAsks.bids[0].type).to.equal('bid');
        expect(Number(bidsAndAsks.bids[0].price)).to.equal(750);
        expect(Number(bidsAndAsks.bids[0].amount)).to.equal(100);
        done();
      });
    });
  });
  it('should be able to add an ask', function(done) {
    exchange.SubmitNewOrderForMatching(mockOrders[1], function(res){
      expect(res.submitted).to.equal(true);
      exchange.GetBidsAndAsks(1, function(bidsAndAsks){
        expect(bidsAndAsks.asks[0].timestamp).to.equal(1481536182350);
        expect(bidsAndAsks.asks[0].id).to.equal('4e374320-c050-11e6-992a-730712547a2a');
        expect(bidsAndAsks.asks[0].accountId).to.equal(0);
        expect(bidsAndAsks.asks[0].type).to.equal('ask');
        expect(Number(bidsAndAsks.asks[0].price)).to.equal(751);
        expect(Number(bidsAndAsks.asks[0].amount)).to.equal(100);
        done();
      });
    });
  });
  it('should be able to add a matcing bid', function(done) {
    exchange.SubmitNewOrderForMatching(mockOrders[2], function(res){
      expect(res.submitted).to.equal(true);
      exchange.GetBidsAndAsks(1, function(bidsAndAsks){
        expect(bidsAndAsks.asks[0].timestamp).to.equal(1481536182350);
        expect(bidsAndAsks.asks[0].id).to.equal('4e374320-c050-11e6-992a-730712547a2a');
        expect(bidsAndAsks.asks[0].accountId).to.equal(0);
        expect(bidsAndAsks.asks[0].type).to.equal('ask');
        expect(Number(bidsAndAsks.asks[0].price)).to.equal(751);
        expect(Number(bidsAndAsks.asks[0].amount)).to.equal(10);
        done();
      });
    });
  });
});
