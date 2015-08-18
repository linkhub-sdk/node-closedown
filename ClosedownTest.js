var closedown = require('./');

closedown.config({
  LinkID :'TESTER',
  SecretKey : 'SwWxqU+0TErBXy/9TVjIPEnI0VTUMMSQZtJf3Ed8q3I=',
  defaultErrorHandler :  function(Error) {
    console.log('Error Occur : [' + Error.code + '] ' + Error.message);
  }
});

var closedownService = closedown.ClosedownChecker();

closedownService.checkCorpNum('1234567890',
  function(Response){
    console.log(Response);
  }, function(error){
    console.log(error);
});

var corpNumList = ['4108600477', '4108621884', '1234567890'];

closedownService.checkCorpNums(corpNumList,
  function(Response){
    console.log(Response);
  }, function(error){
    console.log(error);
});

closedownService.getBalance(
  function(balance){
    console.log('Balance is : ' + balance);
  }, function(error){
    console.log(error);
});

closedownService.getUnitCost(
  function(Unitcost){
    console.log('Unitcost is : ' + Unitcost);
  }, function(error){
    console.log(error);
});
