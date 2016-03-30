/**
 * Created by qxj on 15/10/15.
 */
(function($, w) {
  $.fn.hadScrollToEl = function () {
    var win = $(w);
    var viewport = {
      top: win.scrollTop(),
    };
    viewport.bottom = viewport.top + win.height();

    var bounds = this.offset();
    bounds.bottom = bounds.top + this.outerHeight();

    return !(viewport.bottom < bounds.top);
  };

  $.fn.BootstrapDropDown = function() {
    return this.each(function(){
      var self = $(this);
      $(this).dropdown().find("li > a").click(function(){
        self.parent().find(".dropdown-toggle").html($(this).html() + ' <span class="caret"></span>');
        self.parent().find(".dropdown-menu-selected").val($(this).attr("data-value")).trigger("input");
      });
    });
  };
  
  $.fn.CustomAlert = function(msg){
    if(!msg || !$(this).hasClass("modal")){
      return;
    }

    $(this).find(".modal-body").text(msg);
    $(this).modal();
  };

  $(".dropdown-menu").BootstrapDropDown();

  var navOpen = false;

  $(".hyf-navbar-toggle").click(function(){
    navOpen = !navOpen;
    if(navOpen){
      $("html, body").css("overflow", "hidden");
    }else{
      $("html, body").removeAttr("style");
    }
    $(".hyf-navbar-overlay").toggleClass("hyf-hide");
    $(".hyf-navbar-nav").toggleClass("hyf-hide");
  });

  $(".btn-hide-navbar").click(function(){
    navOpen = false;
    $("html, body").removeAttr("style");
    $(".hyf-navbar-overlay").addClass("hyf-hide");
    $(".hyf-navbar-nav").addClass("hyf-hide");
  });

  $.fn.hyfdropdown = function(){
    return this.each(function(){
      var self = $(this);
      self.find(".hyf-dropdown-toggle").on("click", function(){
        self.toggleClass("open");
      });
    });
  };

  var bodyClickHandler = function(e){
    var target = e.target || e.touches[0].target;

    if(target.tagName === 'A'){
      return ;
    }

    var dropdown = $(target).parent();

    $(".hyf-dropdown-sm").each(function(){
      if(dropdown.is(this)){
        return;
      }

      $(this).removeClass("open");
    });
  };

  $("body").on("click", bodyClickHandler);
  $("body").on("tap", bodyClickHandler);

  $(".hyf-dropdown-sm").hyfdropdown();
})(jQuery, window);