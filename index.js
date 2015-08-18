var Closedown = require('./lib/Closedown');
var linkhub = require('linkhub');
var configuration = {LinkID : '',SecretKey : ''};

exports.config = function(config) {
	configuration = config;
}

exports.ClosedownChecker = function() {
  if(!this._ClosedownChecker) {
    this._ClosedownChecker = new Closedown(configuration);
  }
  return this._ClosedownChecker;
}
