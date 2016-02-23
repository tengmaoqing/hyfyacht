(function($, window){
  var hgdata = window.hgdata;
  var FC = $.fullCalendar;
  var View = FC.View;
  var CustomView;

  var holidayUrl = "/api/getHoliday?country=" + hgdata.region.country;
  if(hgdata.region.region){
    holidayUrl += "&region=" + hgdata.region.region;
  }

  CustomView = View.extend({
  });

  FC.views.custom = CustomView;

  function setSelectedTime(start, end){
    if(!start && !end){
      $("#data-selected-date-start").val("").change();
      $("#data-selected-date-end").val("").change();

      $("#selectedTime-start").html("");
      $("#selectedTime-end").html("");
      return;
    }
    var tempEnd = end || moment(start);
    if(!end){
      tempEnd.hour(start.hour() + 1);
    }

    $("#data-selected-date-start").val(start.format("YYYY-MM-DD HH:mm")).change();
    $("#data-selected-date-end").val(tempEnd.format("YYYY-MM-DD HH:mm")).change();

    $("#selectedTime-start").html(start.format("YYYY-MM-DD HH:mm"));
    $("#selectedTime-end").html(tempEnd.format("YYYY-MM-DD HH:mm"));
  }

  $("#calendar").fullCalendar({
    contentHeight: "auto",
    timezone: "local",
    header: {
      left: "title",
      right: ""
    },
    eventLimit: 3,
    eventLimitClick: function(cellInfo, jsEvent){
      var now = moment();
      now.date(now.date() + 1);
      if(cellInfo.date < now.hour(0).minute(0).second(0)){
        return false;
      }

      $("#calendar").fullCalendar("gotoDate", cellInfo.date);
      $("#calendar").fullCalendar("changeView", "agendaDay");
    },
    allDaySlot: false,
    slotDuration: "01:00:00",
    slotLabelFormat: "HH:00",
    selectable: true,
    selectOverlap: function(event){
      return event.rendering === "background";
    },
    unselectAuto: false,
    viewRender: function(view, element){
      if(view.name == "month"){
        $("#calendar-month").addClass("invisible");
      }else{
        $("#calendar-month").removeClass("invisible");
      }
    },
    dayRender: function(date, cell){
      if(date < moment()){
        $(cell).addClass("fc-day-disable");
      }
    },
    dayClick: function(date, jsEvent, view){
      if(view.name == "custom"){
        return;
      }

      if(date < moment().hour(0).minute(0).second(0)){
        return false;
      }

      //$("#data-available-packages").val("0").change();

      var endDate = moment(date.local());
      endDate.add(1, "day");

      var clientEvents = $("#calendar").fullCalendar("clientEvents", function(e){
        return !e.allDay && (e.start >= date && e.end <= endDate);
      });

      $("#data-selected-date").val(date.format("YYYY-MM-DD")).change();

      $("#data-calendar-events").val(JSON.stringify(clientEvents)).change();

      $("#calendar").fullCalendar("gotoDate", date);
      $("#product-booking-package").show();
      $("#calendar").fullCalendar("changeView", "custom");
    },
    eventClick: function(calEvent, jsEvent, view){
      var date = calEvent.start;
      if(date < moment().hour(0).minute(0).second(0)){
        return false;
      }

      //$("#data-available-packages").val("0").change();

      var endDate = moment(date.local());
      endDate.add(1, "day");

      var clientEvents = $("#calendar").fullCalendar("clientEvents", function(e){
        return !e.allDay && (e.start >= date && e.end <= endDate);
      });

      $("#data-selected-date").val(date.format("YYYY-MM-DD")).change();

      $("#data-calendar-events").val(JSON.stringify(clientEvents)).change();

      $("#calendar").fullCalendar("gotoDate", date);
      $("#product-booking-package").show();
      $("#calendar").fullCalendar("changeView", "custom");
    },
    eventSources:[
      {
        url: "/booking/cal/" + hgdata.boatId,
        color: "#258ec7"
      },
      {
        url: "/booking/cal/unavailable/" + hgdata.boatId,
        color: "#258ec7"
      },
      {
        url: holidayUrl,
        color: "#ff0000"
      }
    ],
    eventRender: function(event, element){
      if(event.rendering === "background"){
        element.append(event.title);
      }
      $(element).find(".fc-time").text(moment(event.start).format("HH:mm") + "-" + moment(event.end).format("HH:mm"));
    }
  });

  $("#calendar-month").click(function(){
    $("#calendar").fullCalendar("changeView", "month");
    $("#product-booking-package").hide();
  });

  $("#calendar-today").click(function(){
    $("#calendar").fullCalendar("today");
    var view = $("#calendar").fullCalendar("getView");
    if(view.name == "custom"){
      var date = $("#calendar").fullCalendar("getDate");
      var endDate = moment(date);
      endDate.add(1, "day");

      var clientEvents = $("#calendar").fullCalendar("clientEvents", function(e){
        return !e.allDay && (e.start >= date && e.end <= endDate);
      });

      $("#data-selected-date").val(date.format("YYYY-MM-DD")).change();

      $("#data-calendar-events").val(JSON.stringify(clientEvents)).change();
    }
  });

  $("#calendar-prev").click(function(){
    $("#calendar").fullCalendar("prev");
    var view = $("#calendar").fullCalendar("getView");
    if(view.name == "custom"){
      var date = $("#calendar").fullCalendar("getDate");
      var endDate = moment(date);
      endDate.add(1, "day");

      var clientEvents = $("#calendar").fullCalendar("clientEvents", function(e){
        return !e.allDay && (e.start >= date && e.end <= endDate);
      });

      $("#data-selected-date").val(date.format("YYYY-MM-DD")).change();

      $("#data-calendar-events").val(JSON.stringify(clientEvents)).change();
    }
  });

  $("#calendar-next").click(function(){
    $("#calendar").fullCalendar("next");
    var view = $("#calendar").fullCalendar("getView");
    if(view.name == "custom"){
      var date = $("#calendar").fullCalendar("getDate");
      var endDate = moment(date);
      endDate.add(1, "day");

      var clientEvents = $("#calendar").fullCalendar("clientEvents", function(e){
        return !e.allDay && (e.start >= date && e.end <= endDate);
      });

      $("#data-selected-date").val(date.format("YYYY-MM-DD")).change();

      $("#data-calendar-events").val(JSON.stringify(clientEvents)).change();
    }
  });

  var clientCurrency = hgdata.clientCurrency;
  var currency = hgdata.currency;

  var app = angular.module("product", []);

  app.controller("productController", function($scope){
    $scope.baseCurrency = hgdata.baseCurrency;
    $scope.prefix = clientCurrency == 'hkd' ? '$' : '￥';

    $scope.generateCharge = function(charge){
      return parseInt(charge * currency[clientCurrency] / currency[$scope.baseCurrency]);
    };

    $scope.displayAmount = function(amount){
      return $scope.prefix + (amount / 100).toFixed(2);
    };
  });

  app.controller("bookingController", function($scope){
    $scope.packages = hgdata.packages;

    $scope.numberOfPersons = 1;
    $scope.contact = {
      name: "",
      areaCode: "86",
      mobile: "",
      email: ""
    };
    $scope.currPackage = -1;
    $scope.currSlot = -1;
    $scope.currTimes = [];
    $scope.currTimeSlot = -1;
    $scope.events = "[]";
    $scope.selectedDate = "";
    $scope.selectedItems = {};
    $scope.inputValue = {};
    $scope.submitted = false;
    $scope.agree = false;
    $scope.baseChargeName = "";
    $scope.baseCharge = 0;
    $scope.slotCount = 0;
    $scope.extraSlotCharge = 0;
    $scope.extraSlot = 0;
    $scope.extraSlotChargeName = "";
    $scope.availablePackages = false;
    $scope.invalidItems = [];
    $scope.maxTips = hgdata.maxTips;

    $scope.generateCharge = $scope.$parent.generateCharge;
    $scope.displayAmount = $scope.$parent.displayAmount;

    $scope.togglePackage = function(index){
      $scope.currPackage == index ? $scope.currPackage = -1 : $scope.currPackage = index;
      $scope.selectedItems = {};
    };

    $scope.checkAvailable = function(package){
      var selectedDate = moment($scope.selectedDate, "YYYY-MM-DD HH:mm");

      if(package.availableMonths[selectedDate.month()] && package.availableDays[selectedDate.day()]){
        $scope.availablePackages = true;
        return true;
      }

      return false;
    };

    $scope.clearPackages = function(){
      $scope.availablePackages = false;
    };

    $scope.toggleItem = function(item){
      if($scope.selectedItems[item.name]){
        delete $scope.selectedItems[item.name];
      }else{
        $scope.selectedItems[item.name] = {
          name: item.name,
          charge: item.charge,
          amount: 1
        };
      }
    };

    $scope.inputItem = function(item){
      var value = $scope.inputValue[item.name];

      if(item.max){
        if(item.max < value || value === undefined){
          $scope.invalidItems.push(item.name);
        }else {
          var index = $scope.invalidItems.indexOf(item.name);
          $scope.invalidItems.splice(index, 1);
        }
      }

      if(value <= 0){
        delete $scope.selectedItems[item.name];
      }else{
        $scope.selectedItems[item.name] = {
          name: item.name,
          charge: item.charge,
          amount: value
        };
      }
    };

    $scope.getTotal = function(){
      var package = $scope.packages[$scope.currPackage];

      if(!package){
        return 0;
      }

      var extraPersons = $scope.numberOfPersons - package.basePersons;
      extraPersons = extraPersons < 0 ? 0 : extraPersons;

      var itemsAmount = 0;

      for(var item in $scope.selectedItems){
        if($scope.selectedItems.hasOwnProperty(item)){
          itemsAmount += $scope.generateCharge($scope.selectedItems[item].charge) * $scope.selectedItems[item].amount;
        }
      }

      return $scope.generateCharge($scope.baseCharge) * $scope.slotCount + $scope.generateCharge($scope.extraSlotCharge) * $scope.extraSlot + $scope.generateCharge(package.extraCharge) * extraPersons + itemsAmount;
    };

    $scope.getItems = function() {
      return JSON.stringify($scope.selectedItems);
    };

    $scope.validate = function(){
      if(!$scope.booking.$valid){
        $scope.submitted = true;
      }else{
        $("#booking-confirm-modal").modal("show");
      }
    };

    $scope.toggleSlot = function(index, slotIndex){
      if(moment($scope.dateStart).format("YYYYMMDD") == moment($scope.selectedDate).format("YYYYMMDD") && $scope.currPackage == index && $scope.currSlot == slotIndex){
        $scope.currPackage = -1;
        $scope.currSlot = -1;
        setSelectedTime("", "");
        return;
      }
      $scope.currPackage = index;
      $scope.selectedItems = {};
      $scope.currSlot = slotIndex;
      $scope.currTimes = [];
      $scope.currTimeSlot = -1;

      var slot = $scope.packages[index].type.slots[slotIndex];

      var start = slot.start.split(":");
      var end = slot.end.split(":");

      var startDate = moment($scope.selectedDate).hour(start[0]).minute(start[1]);
      var endDate = moment($scope.selectedDate).hour(end[0]).minute(end[1]);
      setSelectedTime(startDate, endDate);

      var slotCount = endDate.diff(startDate) / 60000;

      var charges = $scope.packages[index].charges;
      //var charge = {};
      for(var j = 0; j < charges.length; j++){
        var condition = charges[j].condition;

        if(slotCount >= condition.start && ((condition.end != 0 && slotCount < condition.end) || (condition.end == 0))){
          if(charges[j].type == "all") {

            $scope.slotCount = 1;
            $scope.baseCharge = charges[j].charge;
            $scope.extraSlot = 0;

            $scope.baseChargeName = charges[j].name;
          }
        }
      }
    };

    $scope.checkSlotSelected = function(index, slotIndex) {
      if(moment($scope.dateStart).format("YYYYMMDD") != moment($scope.selectedDate).format("YYYYMMDD")){
        return false;
      }
      if($scope.currPackage == index && $scope.currSlot == slotIndex){
        return true;
      }

      return false;
    };

    $scope.timeNotAvailable = function(){
      $("#hyf-modal-alert").CustomAlert(hgdata.timeNotAvailable);
      $scope.currPackage = -1;
      setSelectedTime("", "");
      return false;
    };

    $scope.toggleTime = function(index, slotIndex, time){
      var slot = $scope.getSlotFromTime(time);

      var type = $scope.packages[index].type;
      var selectedSlot = type.slots[slotIndex];
      var slotEndDate = moment($scope.selectedDate).hour(selectedSlot.end.split(":")[0]).minute(selectedSlot.end.split(":")[1]);

      if(moment($scope.dateStart).format("YYYYMMDD") != moment($scope.selectedDate).format("YYYYMMDD") || $scope.currPackage != index || $scope.currTimeSlot != slotIndex){
        $scope.currTimes = [];
        $scope.currPackage = index;
        $scope.selectedItems = {};
        $scope.currTimeSlot = slotIndex;
      }

      var start = slot.start.split(":");
      var end = slot.end.split(":");
      var startDate = moment($scope.selectedDate).hour(start[0]).minute(start[1]);
      var endDate = moment($scope.selectedDate).hour(end[0]).minute(end[1]);

      if($scope.currTimes.length == 0 || startDate < moment($scope.dateStart)){
        endDate = moment(startDate).add(type.baseDuration, "minute");
        if(endDate > slotEndDate){
          return $scope.timeNotAvailable();
        }
      }else if(startDate.format("YYYYMMDDHHmm") == moment($scope.dateStart).format("YYYYMMDDHHmm")){
        $scope.currTimes = [];
        $scope.currPackage = -1;
        $scope.selectedItems = {};
        $scope.currTimeSlot = -1;
        setSelectedTime("", "");
        return;
      }else{
        var lastestEndDate = moment($scope.dateStart).add(type.maxDuration, "minute");

        if (endDate > lastestEndDate) {
          endDate = moment(startDate).add(type.baseDuration, "minute");
          if(endDate > slotEndDate){
            return $scope.timeNotAvailable();
          }
        }else{
          startDate = moment($scope.dateStart);

          var slotCount = endDate.diff(startDate) / 60000;
          if(slotCount < type.baseDuration){
            endDate = moment(startDate).add(type.baseDuration, "minute");
          }
        }
      }

      var resultSlot = {
        start: startDate.format("H:mm"),
        end: endDate.format("H:mm")
      };

      var times = $scope.getTimes(type, resultSlot);

      for(var i = 0; i < times.length; i++){
        if($scope.checkTimeAvailable($scope.getSlotFromTime(times[i]))){
          return $scope.timeNotAvailable();
        }
      }

      $scope.currTimes = times;

      setSelectedTime(startDate, endDate);

      var slotCount = endDate.diff(startDate) / 60000;

      var charges = $scope.packages[index].charges;
      for(var j = 0; j < charges.length; j++){
        var condition = charges[j].condition;

        if(slotCount >= condition.start && ((condition.end != 0 && slotCount < condition.end) || (condition.end == 0))){
          if(charges[j].type == "slot") {
            if (charges[j].baseCharge) {
              $scope.slotCount = 1;
              $scope.baseCharge = charges[j].baseCharge;

              $scope.extraSlot = (slotCount - type.baseDuration) / type.slotDuration;
              $scope.extraSlotCharge = charges[j].charge;
              $scope.extraSlotChargeName = charges[j].extraName;
            } else {
              $scope.slotCount = slotCount / type.slotDuration;
              $scope.baseCharge = charges[j].charge;
              $scope.extraSlot = 0;
            }

            $scope.baseChargeName = charges[j].name;
          }
        }
      }
    };

    $scope.checkTimeSelected = function(index, time){
      if($scope.currPackage != index || moment($scope.dateStart).format("YYYYMMDD") != moment($scope.selectedDate).format("YYYYMMDD")){
        return false;
      }
      var times = $scope.currTimes;
      for(var i = 0; i < times.length; i++){
        if(time == times[i]){
          return true;
        }
      }

      return false;
    };

    $scope.checkTimeAvailable = function(slot){
      var start = slot.start.split(":");
      var end = slot.end.split(":");

      var startDate = moment($scope.selectedDate).hour(start[0]).minute(start[1]);
      var endDate = moment($scope.selectedDate).hour(end[0]).minute(end[1]);

      if(startDate < moment()){
        return true;
      }

      var events = JSON.parse($scope.events);

      for(var i = 0; i < events.length; i++){
        var eventStart = moment(events[i].start);
        var eventEnd = moment(events[i].end);
        if((eventStart >= startDate && eventStart < endDate) || (eventStart < startDate && eventEnd > startDate) || (eventStart >= startDate && eventEnd <= endDate)){
          return true;
        }
      }
      return false;
    };

    $scope.getSlotFromTime = function(time){
      return {
        start: time.split("-")[0],
        end: time.split("-")[1]
      };
    };

    $scope.getTimes = function(type, slot){
      var timeArray = [];
      var slotDuration = type.slotDuration;

      var start = slot.start.split(":");
      var end = slot.end.split(":");

      var startDate = moment().hour(start[0]).minute(start[1]).second(0);
      var endDate = moment().hour(end[0]).minute(end[1]).second(0);

      do{
        timeArray.push(
          startDate.format("H:mm") + "-" + startDate.add(slotDuration, "minute").format("H:mm")
        );
      }while(startDate.format("YYYY-MM-DD HH:mm:ss") != endDate.format("YYYY-MM-DD HH:mm:ss"));

      return timeArray;
    };
  });

  //switch Step
  app.factory("stepService", function() {
    var temp = {
      nowStep : 0,
      elementArray: [],
      nextStep: function(index) {
        var lastIndex = index-1;
        this.elementArray[lastIndex].hide();
        this.elementArray[index].show();
      }
    };

    return temp
  });

  app.directive("selectstep", function(stepService) {
    return {
      restrict: "AE",
      link : function(scope, element, attrs) {

        var selecteDate = $("#product-booking-date"),
            selecteDate_date = $("#calendar"),
            selecteDate_package = $("#product-booking-package"),
            selecteOption = $("#product-booking-option"),//div#product-booking-option add
            selecteContact = $("#product-booking-contact");

        stepService.elementArray = [selecteDate_date, selecteDate_package, selecteOption, selecteContact];

        var len = stepService.elementArray.length;
        for(var i = 0; i<len; i++){
          if( i != 0 ){
            stepService.elementArray[i].hide();
          }
        }

        element.bind("click", function(){

          switch (stepService.nowStep) {
            case 0:

              break;
          }
          console.log(stepService.nowStep);

          stepService.nowStep++;
          if (stepService.nowStep == len) {
            scope.lastStep = true;
            scope.$apply();
            stepService.nowStep--;
          } else {
            stepService.nextStep(stepService.nowStep);
          }

        });
      }
    }
  });

  app.directive("back", function(stepService){
    return {
      restrict: "A",
      link: function(scope, element, attrs) {
        console.log(element);
        element.bind("click", function(){
          stepService.elementArray[stepService.nowStep].hide();
          stepService.elementArray[--stepService.nowStep].show();
        });
      }
    }
  });

  app.filter("santize", ["$sce", function($sce){
    return function(htmlCode){
      return $sce.trustAsHtml(htmlCode);
    };
  }]);

  $("#btn-contract").click(function(){
    $("#contract-container").toggleClass("hidden");
  });

  app.controller("moreController", function($scope, $http){

    $http.get("/product/moreProducts?boatId=" + hgdata.boatId + "&productId=" + hgdata.productId).success(function(boat){
      $scope.boat = boat;
    });

    $scope.generateCharge = $scope.$parent.generateCharge;
    $scope.displayAmount = $scope.$parent.displayAmount;

  });
})(jQuery, window);