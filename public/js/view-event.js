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

    $scope.outDate = moment(new Date(hgdata.attendedDate)) < moment();

    $http.get("/eventorder/number/" + hgdata.eventId).success(function (res) {
      $scope.currPersons = res.count;
      $scope.maxPersons = hgdata.maxPersons - res.count;

      //$(".dropdown-menu").dropdown();
      //
      //$(".dropdown-menu > li > a").click(function(e){
      //  $(this).parent().parent().parent().find(".dropdown-toggle").html($(this).html() + ' <span class="caret"></span>');
      //  $(this).parent().parent().parent().find(".dropdown-menu-selected").val($(this).attr("data-value")).trigger("input");
      //});
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

  app.controller("moreEvents", function($scope, $http){

    $http.get("/event/moreEvents?eventId="+hgdata.eventId+"&dateStart="+hgdata.dateStart).success(function(res){
      $scope.events = res.events;
    });

    $scope.generateCharge = $scope.$parent.generateCharge;
    $scope.displayAmount = $scope.$parent.displayAmount;
  });

})(window);