app.factory("common122", function(){
  var config = {
    countrys : [
      {
        country: "中国", 
        value: "db.location.country.cn", 
        citys: [
          {
            city: "深圳", 
            value: "db.location.city.sz", 
            piers: [
              {pier:"深圳湾", value: "db.location.pier.szw"},
              {pier:"南澳", value: "db.location.pier.nanao"},
              {pier:"南澳斜吓村码头", value: "db.location.pier.nanaoxiexiacun"},
              {pier:"南澳月亮湾双拥码头", value: "db.location.pier.szshuangyong"},
              {pier:"蛇口渔港", value: "db.location.pier.szshekoufishingport"}
            ]
          },
          {
            city: "香港", 
            value: "db.location.city.hk", 
            piers: [
              {pier:"西贡", value: "db.location.pier.saikung"}
            ]
          }
        ]
      }
    ],
    currencys : [
      {currency:"港元", value:"hkd"},
      {currency:"人民币", value:"cny"}
    ],
    boatTypes : [
      {boatType: "游艇", value:"db.boat.type.yacht"},
      {boatType: "西式游艇", value:"db.boat.type.westyacht"},
      {boatType: "中式游艇", value:"db.boat.type.cnyacht"},
      {boatType: "西式快艇", value:"db.boat.type.westspeedboa"},
      {boatType: "中式渔船", value:"db.boat.type.cnfishingboat"},
      {boatType: "帆船", value:"db.boat.type.sailingboat"}
    ],
    entertainments : [
      {entertainment:"海钓", value:"db.boat.etm.fishing"},
      {entertainment:"游船河", value:"db.boat.etm.cruise"},
      {entertainment:"观光", value:"db.boat.etm.sightseeing"}
    ],
    baseFacilities :[
      {baseFacilitie:"空调", value:"db.boat.base.ac"},
      {baseFacilitie:"厨房", value:"db.boat.base.kitchen"}
    ],
    extras :[
      {extra:"午餐", value:"db.boat.extras.launch"},
      {extra:"烧烤", value:"db.boat.extras.bbq"}
    ],
    locales :[ 
      {locale:"简体中文", value:"zh-cn"},
      {locale:"繁体中文", value:"zh-hk"},
      {locale:"English", value:"en"}
    ],
    options : [
      { status: "全部订单", value: "" },
      { status: "等待付款", value: "db.booking.wait_to_pay" },
      { status: "付款成功", value: "db.booking.pay_success" },
      { status: "取 消 ", value: "db.booking.cancel" }
    ],
    switchSta : function(sta){
      var ab = "";
      switch(sta){
        case "db.booking.wait_to_pay":
          ab = "等待付款";
          break;
        case "db.booking.pay_success":
          ab = "付款成功";
          break;
        case "db.booking.cancel":
          ab = "取消";
          break;
        default :
          ab = "未知";
      }
      return ab
    },
    switchDate : function(date){
      var time = moment(date).format("YYYY-MM-DD HH:mm:ss");
      return time
    },
    getOptionsValue : function(val, propertyName){
      var propertyNames = propertyName+"s";
      var arrays = this[propertyNames];
      for(var i in arrays){
        if(arrays[i].value == val){
          return arrays[i][propertyName]
        }
      }
    },
    // getCity : function(loc){
    //   var citys = this.countrys[0].citys
    //   for(var i in citys){
    //     if(citys[i].value == loc.city){
    //       return citys[i].city
    //     }
    //   }
    // },
    // getPier : function(loc){
    //   var citys = this.countrys[0].citys
    //   for(var i in citys){
    //     if(citys[i].value == loc.city){
    //       var piers = citys[i].piers
    //         for(var i in piers){
    //           if(piers[i].value == loc.pier){
    //             return piers[i].pier
    //           }
    //         }
    //     }
    //   }
    // },
    getSrc : function(select){
      setTimeout(function(){
        $(select).each(function(){
          $(this).attr("src",$(this).attr("datasrc"));
        });
      },1000);//ng-reapeat完成后，仍然没有解析表达式，等一秒再赋值
    }
  }
  return config
});