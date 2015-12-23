/**
 * Created by qxj on 15/12/23.
 */
(function(window) {
  var hgdata = window.hgdata;
  var clientCurrency = hgdata.clientCurrency;
  var currency = hgdata.currency;

  var app = angular.module("event", []);

  app.controller("eventController", function($scope, $http){
    $scope.baseCharge = hgdata.baseCharge;
    $scope.baseCurrency = hgdata.baseCurrency;
    $scope.prefix = clientCurrency == 'hkd' ? '$' : '￥';
    $scope.numberOfPersons = 1;
    $scope.currPersons = 0;
    $scope.maxPersons = 0;
    $scope.contact = {
      name: "",
      areaCode: "86",
      mobile: ""
    };

    $scope.outDate = moment(hgdata.attendedDate) < moment();

    $http.get("/eventorder/number/" + hgdata.eventId).success(function (res) {
      $scope.currPersons = res.count;
      $scope.maxPersons = hgdata.maxPersons - res.count;
    });

    $scope.generateCharge = function(charge){
      return parseInt(charge * currency[clientCurrency] / currency[$scope.baseCurrency]);
    };

    $scope.displayAmount = function(amount){
      return $scope.prefix + (amount / 100).toFixed(2);
    };

    $scope.submit = function(){
      document.forms[0].submit();
    };
  });
})(window);