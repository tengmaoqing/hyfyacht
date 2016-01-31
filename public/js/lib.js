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
  }
})(jQuery, window);