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
    $scope.maxPersons = 1;
    $scope.contact = {
      name: "",
      areaCode: "86",
      mobile: ""
    };
    $scope.eventType = hgdata.eventType;
    $scope.mobileTest = /(^(13\d|14[57]|15[^4,\D]|17[678]|18\d)\d{8}|170[059]\d{7})$/;

    $scope.outDate = moment(new Date(hgdata.attendedDate)) < moment();

    $http.get("/eventorder/number/" + hgdata.eventId).success(function (res) {
      $scope.currPersons = res.count;
      $scope.maxPersons = hgdata.maxPersons - res.count;
    });

    $scope.getContact = function() {

      $http.get("/eventorder/getContact").success(function(res){
        if(res.result == false) {
          return
        }
        
        $scope.contact.areaCode = res.mobile.length == 13? res.mobile.slice(0,2):res.mobile.slice(0,3);
        $scope.contact.name = res.name;
        $scope.contact.mobile = res.mobile.length == 13? parseInt(res.mobile.slice(2)):parseInt(res.mobile.slice(3));
        $scope.areaCodeChange();
      });
    };
    $scope.getContact();

    $scope.areaCodeChange = function() {

      if ($scope.contact.areaCode == "86") {
        $scope.mobileTest = /(^(13\d|14[57]|15[^4,\D]|17[678]|18\d)\d{8}|170[059]\d{7})$/;
      } else {
        $scope.mobileTest = /(^(\d{8})$)/;
      }
    }

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

  app.controller("moreEvents", function($scope, $http){

    $http.get("/event/moreEvents?eventId="+hgdata.eventId+"&dateStart="+hgdata.dateStart).success(function(res){
      $scope.events = res.events;
    });

    $scope.generateCharge = $scope.$parent.generateCharge;
    $scope.displayAmount = $scope.$parent.displayAmount;
  });

})(window);