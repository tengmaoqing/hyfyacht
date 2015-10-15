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
})(jQuery, window);