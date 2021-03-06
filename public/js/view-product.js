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
      right: "today prev next"
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

      if(moment(date).isSame(moment($("#data-selected-date").val()).add(8, "h"))){
        var parentDiv = $(cell).parents(".fc-row");
        var newNode = "<div id='date-div' class='fc-selected'><div class='hyf-banner-slogan-table'><div class='hyf-banner-slogan-content'><span class='text-success glyphicon glyphicon-ok'></span></div></div></div>";
        parentDiv.append(newNode);
        $("#date-div").css({
          "left":($(cell).index()/7)*100+"%",
          "width": $(cell).css("width")
        });
      }
    },
    dayClick: function(date, jsEvent, view) {
      if(view.name == "custom"){
        return;
      }

      if(date < moment().hour(0).minute(0).second(0)){
        return false;
      }
      
      var endDate = moment(date.local());
      endDate.add(1, "day");

      var clientEvents = $("#calendar").fullCalendar("clientEvents", function(e){
        return !e.allDay && (e.start >= date && e.end <= endDate);
      });

      $("#data-selected-date").val(date.format("YYYY-MM-DD")).change();

      $("#data-calendar-events").val(JSON.stringify(clientEvents)).change();

      var index = $(this).index();
      var parentDiv = $(this).parents(".fc-row");

      if($("#date-div").parent() != parentDiv){
        $("#date-div").remove();
        var newNode = "<div id='date-div' class='fc-selected'><div class='hyf-banner-slogan-table'><div class='hyf-banner-slogan-content'><span class='text-success glyphicon glyphicon-ok'></span></div></div></div>";
        parentDiv.append(newNode);
      }

      $("#date-div").css({
          "left":(index/7)*100+"%",
          "width": $(this).css("width")
      });

    },
    eventClick: function(calEvent, jsEvent, view) {
      var date = moment(calEvent.start).hour(8).minute(0).second(0);

      if(date < moment().hour(0).minute(0).second(0)){
        return false;
      }
      
      var endDate = moment(date.local());
      endDate.add(1, "day");

      var clientEvents = $("#calendar").fullCalendar("clientEvents", function(e){
        return !e.allDay && (e.start >= date && e.end <= endDate);
      });

      $("#data-selected-date").val(date.format("YYYY-MM-DD")).change();

      $("#data-calendar-events").val(JSON.stringify(clientEvents)).change();

      var parentDiv = $(this).parents(".fc-row");

      if ($("#date-div").parent() != parentDiv) {
        $("#date-div").remove();
        var newNode = "<div id='date-div' class='fc-selected'><div class='hyf-banner-slogan-table'><div class='hyf-banner-slogan-content'><span class='text-success glyphicon glyphicon-ok'></span></div></div></div>";
        parentDiv.append(newNode);
      }
      
      $("#date-div").css({
        "left": $(this).parent()[0].offsetLeft+"px",
        "width": $(this).parent().css("width")
      });

      // $("#calendar").fullCalendar("gotoDate", date);
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

  var clientCurrency = hgdata.clientCurrency;
  var currency = hgdata.currency;

  var app = angular.module("product", []);

  app.controller("productController", function($scope){
    $scope.baseCurrency = hgdata.baseCurrency;
    $scope.prefix = clientCurrency == 'hkd' ? '$' : '￥';

    $scope.generateCharge = function(charge){
      var all = parseInt(charge * currency[clientCurrency] / currency[$scope.baseCurrency]);
      return all;
    };

    $scope.displayAmount = function(amount){
      var all = $scope.prefix + (amount / 100).toFixed(2)

      if (isNaN(amount)) {
        return
      }
      
      return all;
    };

    $scope.currPackage = "";
    $scope.selectedDate = "";
    $scope.total = 0;
  });

  app.controller("bookingController", function($scope, $http){
    $scope.packages = hgdata.packages;

    // $scope.numberOfPersons = null;
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
    $scope.invalidItem = false;
    $scope.maxTips = hgdata.maxTips;
    $scope.isHoliday = false;
    $scope.packageAlready = false;
    $scope.mobileTest = /(^(13\d|14[57]|15[^4,\D]|17[678]|18\d)\d{8}|170[059]\d{7})$/;

    $scope.generateCharge = $scope.$parent.generateCharge;
    $scope.displayAmount = $scope.$parent.displayAmount;


    $scope.getContact = function() {

      $http.get("/booking/getContact").success(function(res){
        if(res.result == false) {
          return
        }

        if (res.mobile) {
          $scope.contact.areaCode = res.mobile.length == 13? res.mobile.slice(0,2):res.mobile.slice(0,3);
        }
        $scope.contact.email = res.email;
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

    $scope.togglePackage = function(index){
      $scope.currPackage == index ? $scope.currPackage = -1 : $scope.currPackage = index;
      $scope.selectedItems = {};

      
    };

    $scope.checkIsHoliday = function() {
      if ($scope.packageAlready) {
        return;
      }

      var url = "/api/checkHoliday?country=" + hgdata.region.country + "&region="
       + hgdata.region.region + "&date="+$scope.selectedDate;
      $http.get(url).success(function(res){
        $scope.availablePackages = false;
        $scope.isHoliday = res.isPublicHoliday;
        $scope.packageAlready = true;
      });
    };

    $scope.selectedDateChange = function() {
      $scope.packageAlready = false;
    };

    $scope.checkAvailable = function(package) {
      var selectedDate = moment($scope.selectedDate, "YYYY-MM-DD HH:mm");
      $scope.$parent.selectedDate = $scope.selectedDate;

      if ($scope.isHoliday) {
        if(package.onlyHoliday){
          $scope.availablePackages = true;
        }
        
        return package.onlyHoliday;
      }

      if (package.availableMonths[selectedDate.month()] && package.availableDays[selectedDate.day()]) {

        $scope.availablePackages = true;
        return true
      }

      return false;
    };

    $scope.clearPackages = function() {
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

    $scope.focus = function(item, index) {
      var input = document.getElementById("item"+index)
      input.focus();
    };

    $scope.inputItem = function(item, index) {
      var value = $scope.inputValue[item.name];
      if ($scope.booking["item"+index].$invalid) {
        $scope.invalidItem = true;
      } else {
        $scope.invalidItem = false;
      }

      if ($scope.booking["item"+index].$invalid || !value) {
        delete $scope.selectedItems[item.name];
      } else {
        $scope.selectedItems[item.name] = {
          name: item.name,
          charge: item.charge,
          amount: value
        };
      }

      $scope.testInputStep(item.name);
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

      var all = $scope.generateCharge($scope.baseCharge) * $scope.slotCount + $scope.generateCharge($scope.extraSlotCharge) * $scope.extraSlot + $scope.generateCharge(package.extraCharge) * extraPersons + itemsAmount;

      $scope.$parent.total = all;
      $scope.$parent.currPackage = $scope.packages[$scope.currPackage].name;
      // console.log($scope.$parent.currPackage);
      return all
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

    $scope.toggleSlot = function(index, slotIndex) {
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

    $scope.timeNotAvailable = function() {
      $("#hyf-modal-alert").CustomAlert(hgdata.timeNotAvailable);
      $scope.currPackage = -1;
      setSelectedTime("", "");
      return false;
    };

    $scope.toggleTime = function(index, slotIndex, time) {
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
        $("#booking-step-title")[0].scrollIntoView();
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
        $("#backStep").hide();

        var len = stepService.elementArray.length;
        for(var i = 0; i<len; i++) {
          if( i != 0 ){
            stepService.elementArray[i].hide();
          }
        }

        function cancelStyle(index) {
          for(; index<len; index++) {
            $(".booking-step")[index].style.color = "#999";
            $(".borderline")[index] && ($(".borderline")[index].style.borderColor = "#999");
          }
        }

        scope.$watch("selectedDate", function(){
          if(scope.selectedDate) {
            $(".booking-step")[0].style.color = "green";
          }
          setSelectedTime("", "");
        });

        scope.$watch("dateEnd", function(){
          if (scope.dateEnd) {
            $(".booking-step")[1].style.color = "green";
          } else {
            cancelStyle(1);
          }
        });

        scope.$watch("contact", function(){
          if (scope.booking.$valid) {
            $(".booking-step")[3].style.color = "green";
          } else {
            $(".booking-step")[3].style.color = "#999";
          }
        }, true);

        ///
        scope.personChange = function(){
          if (scope.numberOfPersons ) {
            angular.element(".booking-step")[2].style.color = "green";
            scope.errStep2 = false;
          } else {
            cancelStyle(2);
          }
        }; 

        element.bind("click", function() {

          switch (stepService.nowStep) {
            case 0:
              if (!scope.selectedDate) {
                scope.step0 = true;
                scope.$apply();
                return;
              }

              scope.checkIsHoliday();

              $("#calendar-controller").hide();
              $("#backStep").show();
              $("#step1Hide").hide();

              if (scope.dateEnd) {
                 $(".booking-step")[1].style.color = "green";
              }
              break;
            case 1:
              if (!scope.dateEnd) {
                scope.step1 = true;
                scope.$apply();
                return;
              }

              if (scope.numberOfPersons &&  !scope.invalidItem) {
                $(".booking-step")[2].style.color = "green";
              }

              // scope.$watch("numberOfPersons", function(newValue,oldValue){
              //   console.log(newValue,oldValue);
              //   if (newValue == oldValue) {
              //     return
              //   }

              //   if (scope.numberOfPersons ) {
              //     angular.element(".booking-step")[2].style.color = "green";
              //     scope.errStep2 = false;
              //   } else {
              //     cancelStyle(2);
              //   }
              // });

              scope.testInputStep = function() {
                if (scope.invalidItem || !scope.numberOfPersons) {
                  cancelStyle(2);
                } else {
                  angular.element(".booking-step")[2].style.color = "green";
                }
              }

              selecteDate.hide();
              break;
            case 2:
              if (!scope.numberOfPersons || scope.invalidItem) {
                if (!scope.numberOfPersons) {
                  scope.errStep2 = true;
                  scope.$apply();
                }
                return;
              }
              
              if (scope.booking.$valid) {
                $(".booking-step")[3].style.color = "green";
              }

              scope.lastStep = true;
              scope.$apply();
              break;
          }

          stepService.nowStep++;
          $(".borderline")[stepService.nowStep-1].style.borderColor = "green";
          stepService.nextStep(stepService.nowStep);
        });
      }
    }
  });

  app.directive("back", function(stepService) {
    return {
      restrict: "A",
      link: function(scope, element, attrs) {

        function cancelStyle(index) {
          for(; index<4; index++) {
            $(".booking-step")[index].style.color = "#999";
            $(".borderline")[index-1] && ($(".borderline")[index-1].style.borderColor = "#999");
          }
        }

        element.bind("click", function() {

          switch (stepService.nowStep) {
            case 1:
              $("#backStep").hide();
              $("#step1Hide").show();
              $("#calendar-controller").show();
              break;
            case 2:
              $("#product-booking-date").show();
              break;
            case 3:
              scope.lastStep = false;
              scope.$apply();
              break;
          }

          cancelStyle(stepService.nowStep);
          $("#booking-step-title")[0].scrollIntoView();
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

    $scope.switchUnit = function(unti) {
      return hgdata.baseUnits[unti]
    };

    $scope.generateCharge = $scope.$parent.generateCharge;
    $scope.displayAmount = $scope.$parent.displayAmount;
  });


})(jQuery, window);

function inputCheck(ev,that) {
  ev.keyCode = event.keyCode|| event.which;
  if (ev.keyCode == 109 || ev.keyCode==110 || ev.keyCode==187 || ev.keyCode==107 || ev.keyCode==229 || ev.keyCode == 189 || ev.keyCode==190) {

    ev.preventDefault();
    return false
  }
}

(function(){

  var init = function (oElement) {
    var pswpElement = document.querySelectorAll(".pswp")[0];

    var itemArr = function() {
      var oTemp = [],
          imgs = oElement.querySelectorAll("img")||oElement.getElementsByTagName("img");
          
      for (var i=0, l=imgs.length; i<l; i++) {
        var item = {
            w: imgs[i].width,
            h: imgs[i].height
        };
        item.src = imgs[i].getAttribute("src");
        item.el = imgs[i];
        oTemp.push(item);
      }
      return oTemp;
    };

    var items = itemArr();
    var onImgClick = function (ev){
      ev = ev || window.event;
      ev.preventDefault ? ev.preventDefault() : ev.returnValue = false;
      openPswipe(this.index, this);
    };

    var openPswipe = function (index, imgEl){
      
      var options = {
        galleryUID: imgEl.getAttribute('data-pswp-uid'),

        getThumbBoundsFn: function(index) {
            var pageYScroll = window.pageYOffset || document.documentElement.scrollTop,
                rect = galleryElements[index].getBoundingClientRect();
            return {x:rect.left, y:rect.top + pageYScroll, w:rect.width};
        },
        index: index,
        loop:true
      };

      var gallery = new PhotoSwipe( pswpElement, PhotoSwipeUI_Default, items, options);
      gallery.init();
    };

    var galleryElements = oElement.querySelectorAll("img");

    for(var i = 0, l = galleryElements.length; i < l; i++) {
        galleryElements[i].setAttribute('data-pswp-uid', i+1);
        galleryElements[i].index = i;
        galleryElements[i].onclick = onImgClick;
    }
  };
  window.onload = function(){
    var oElement = document.getElementById("product-detail");
    init(oElement);
  };
})();

(function($,w){

  $(".navbar-fixed-bottom").css("position", "relative");
  $(w).on("scroll", function(){

    if($(".hyf-info").hadScrollToEl()){
      $(".navbar-fixed-bottom").css("position", "relative");
      return
    }

    if ($("#data-selected-date").val()) {
      $(".navbar-fixed-bottom").css("position", "fixed");
      return
    }

    if($(this).scrollTop() > $("#btns-div").offset().top){
      $(".navbar-fixed-bottom").css("position", "fixed");
    }else {
      $(".navbar-fixed-bottom").css("position", "relative");
    }

  });
})(jQuery, window);
