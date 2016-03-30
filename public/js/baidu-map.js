
//
(function(w){
  function ZoomControl(html, offset){
    this.defaultAnchor = BMAP_ANCHOR_TOP_RIGHT;
    this.defaultOffset = offset;
    this.html = html;
  }

  ZoomControl.prototype = new BMap.Control();
  ZoomControl.prototype.initialize = function(map) {

    var div = document.createElement("div");

    div.innerHTML = this.html;
    div.style.cursor = "pointer";
    div.style.color = "#666";
    div.style.backgroundColor = "rgba(255,255,255,0.7)";
    div.style.fontSize = "20px";
    div.style.padding = "8px";
    div.style.boxShadow = "1px 1px 1px #999";
    div.style.borderRadius = "5px";
    div.style.lineHeight = "0";

    map.getContainer().appendChild(div);
    this._div = div;
    return div;
  }
  ZoomControl.prototype.addEventListener = function(event, fun){
    this._div["on"+event] = fun;
  };

  var modalMap = function(iframeId, modalContentId, modalId ,src) {
    return function(){
      var srcToMap = document.getElementById(iframeId);
      var modalBigMap = document.getElementById(modalContentId);
      srcToMap.style.height = document.body.clientHeight*0.8+"px";
      modalBigMap.style.width = document.body.clientWidth*0.9+"px";
      modalBigMap.style.margin = "10px auto";
      srcToMap.setAttribute("src",src);
    
      $("#"+modalId).modal("show");
    }
  }

  var initBaiduMap = function (mapId, geospatial, zoomControl, zoomClickEvent) {
    var map = new BMap.Map(mapId);
    var point = new BMap.Point(geospatial[0], geospatial[1]);
    map.centerAndZoom(point, 11);
    map.disableDragging();
    var marker = new BMap.Marker(point);
    map.addOverlay(marker);
    map.addControl(zoomControl);

    var fullClick = function(e) {
      zoomClickEvent();
    };
    zoomControl.addEventListener("click", fullClick);
  }

  var temp = {
    ZoomControl: ZoomControl,
    modalMap : modalMap,
    initBaiduMap: initBaiduMap
  }
  return w.baiduMap = temp;
})(window);
