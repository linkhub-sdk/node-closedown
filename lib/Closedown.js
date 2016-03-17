var Util = require('util');
var EventEmitter = require('events').EventEmitter;
var linkhub = require('linkhub');
var http = require('https');
var zlib = require('zlib');

module.exports = Closedown;
Util.inherits(Closedown,EventEmitter);

function Closedown(config) {
  EventEmitter.call(this);

  this._config = config;
  this.ServiceID = 'CLOSEDOWN';
  this.ServiceURL = 'closedown.linkhub.co.kr';
  this.Version = '1.0';

  linkhub.initialize({
    LinkID : this._config.LinkID,
    SecretKey : this._config.SecretKey,
    defaultErrorHandler : this._config.defaultErrorHandler
  });

  this._Linkhub_Token = '';
  this._scopes = ['170'];
};

// 잔여포인트 조회
Closedown.prototype.getBalance = function(success,error) {
  linkhub.getPartnerBalance(this._getToken(),success,error);
};

// 휴폐업조회 단가 확인
Closedown.prototype.getUnitCost = function(success,error){
  this._executeAction({
    uri : '/UnitCost',
    success : function(response){
      if(success) success(response.unitCost);
    },
    error : error
  });
};

// 휴폐업조회 - 단건
Closedown.prototype.checkCorpNum = function(CheckCorpNum,success,error){

  if(!CheckCorpNum || 0 === CheckCorpNum.length) {
    this._throwError(-99999999,'조회할 사업자번호가 입력되지 않았습니다.',error);
    return;
  }

  var uriString = '/Check?CN=' + CheckCorpNum;

  this._executeAction({
    uri : uriString,
    success : function(response){
      if(success) success(response);
    },
    error : error
  });
};

// 휴폐업조회 - 다량최대 1000건
Closedown.prototype.checkCorpNums = function(CorpNumList,success,error){

  if(!CorpNumList || 0 === CorpNumList.length) {
    this._throwError(-99999999,'조회할 사업자번호 배열이 입력되지 않았습니다.',error);
    return;
  }

  var postData = this._stringify(CorpNumList);

  this._executeAction({
    uri : '/Check',
    Method : 'POST',
    Data : postData,
    success : function(response){
      if(success) success(response);
    },
    error : error
  });
};

Closedown.prototype._getToken = function(err) {

  var newToken = this._Linkhub_Token
  var expired = true;

  if(typeof newToken === 'function') {
    var expiration = new Date(newToken(function(){},err).expiration);
    if(expiration) {
      linkhub.getTime(
        success = function(UTCTime){
          expired = new Date(UTCTime) > expiration;
        }
      );
    }
    else
      expired = false;
  }

  if(expired) {
    newToken = linkhub.newToken(this.ServiceID,null,this._getScopes(),null);
    this._Linkhub_Token = newToken;
  }

  return newToken;
};

Closedown.prototype._getScopes = function() {
  return this._scopes;
}

Closedown.prototype._executeAction = function(options) {

  if(!(options.Method)) options.Method = 'GET';

  var headers = {};
  var Token = function(callback) {callback(null);};

  Token = this._getToken();

  var _this = this;

  Token(function(token) {

    if(token) headers['Authorization'] =  'Bearer ' + token.session_token;
    headers['x-api-version'] = _this.Version;
    headers['Accept-Encoding'] = 'gzip,deflate';
    headers['Content-Type'] = 'application/json;charset=utf-8';

    var requestOpt = {
      host : _this.ServiceURL,
      path : options.uri,
      method : options.Method == 'GET' ? 'GET' : 'POST',
      headers : headers
    }

    var req = _this._makeRequest(
      requestOpt,
      function(response){
        if(options.success) options.success(response);
      },
      (typeof options.error === 'function') ? options.error : _this._config.defaultErrorHandler
    );

    if(options.Method != 'GET' && options.Data) {
        req.write(options.Data);
    }
    req.end();
  },options.error);
};

Closedown.prototype._makeRequest = function(options,success,error) {
  var request = http.request(options,
    function(response) {
      var buf = new Buffer(0);
      //Gzip Decompress..
      if (response.headers['content-encoding'] == 'gzip') {
        var gzip = zlib.createGunzip();
        response.pipe(gzip);

        gzip.on('data',function(chunk) {
          buf = Buffer.concat([buf,chunk]);
        });

        gzip.on('end',function(){
          if(response.statusCode == '200'){
            success(JSON.parse(buf));
          }
          else if(error) {
            error(JSON.parse(buf));
          }
        });
      } else {
        response.on('data',function(chunk) {
          buf = Buffer.concat([buf,chunk]);
        });

        response.on('end',function(){
          if(this.statusCode == '200'){
            success(JSON.parse(buf));
          }
          else if(error) {
            error(JSON.parse(buf));
          }
        });
      }
    }
  );

  request.on('error',function(err){
    if(err.code != 'ECONNRESET')
      console.error(err);
  });
  return request;
};

Closedown.prototype._throwError = function(Code,Message,err) {
  if(err)
    err({code : Code , message : Message});
  else if (typeof this._config.defaultErrorHandler === 'function')
    this._config.defaultErrorHandler({code:Code,message:Message});
}

Closedown.prototype._stringify = function(obj) {
  return JSON.stringify(obj,function(key,value){return !value ? undefined : value;});
};