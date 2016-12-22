var expect = require('expect.js');
var accountManagement = require('../Exchange/accountManagement.js');

var accountList = [];

describe('Account', function() {
  it('should be able to add an account', function(done){
    var account = accountManagement.CreateAccount();
    accountList.push(account);
    done();
  });
  it('should be able to add an account', function(done){
    done();
  });
});
