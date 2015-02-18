/*
 *  ScrollStory - v0.3.0
 *  A jQuery plugin for building simple, scroll-based pages and interactions.
 *  https://github.com/sjwilliams/scrollstory
 *
 *  Made by Josh Williams
 *  Under MIT License
 */
(function(factory) {
  if (typeof define === 'function' && define.amd) {
    define(['jquery', window, document, undefined], factory);
  } else {
    factory(jQuery, window, document, undefined);
  }
}(function($, window, document, undefined) {
  var pluginName = 'scrollStory',
    defaults = {

      // jquery object, dom element, or array of values, or null (to use existing DOM)
      content: null,

      // Only used if content is a dom element or null
      contentSelector: '.story',

      // Enables keys to navigate menu
      keyboard: true,

      // Offset from top used in the programatic scrolling of an
      // item to the focus position. Useful in the case of thinks like
      // top nav that might obscure part of an item if it goes to 0.
      scrollOffset: 0,

      // Offset from top to trigger a change
      triggerOffset: 0

      // // Activate the item closest to the offset, even if it's below the offset.
      // preOffsetActivation: false,

      // // Automatically activate the first item on page load, regardless of its position
      // // relative to the offset and the 'preOffsetActivation' setting.
      // // With 'preOffsetActivation:true', this is ignored.
      // autoActivateFirst: true,

      // // If 'autoActivateFirst:false' and 'preOffsetActivation:true', app logic would dictate the
      // // first item would activate after a 1px scroll. Usually, we want to delay that
      // // first activation until the first item is to the offset, but maintain the activation
      // // behavior of other items.
      // //
      // // By default, we delay the activation on first item. Set to false otherwise. No effect
      // // if 'autoActivateFirst' is true or 'preOffsetActivation' is false.
      // delayFirstActivationToOffset: true,

      // // Updated offsets on window resize? useful for responsive layouts
      // updateOffsetsOnResize: true,

      // // Automated scroll speed in ms. Set to 0 to remove animation.
      // speed: 800,

      // // Whether to keep track of which individual elements are in the viewport.
      // checkViewportVisibility: false,

      // // scroll-based events are either 'debounce' or 'throttle'
      // throttleType: 'debounce',

      // // frequency in milliseconds to perform scroll-based functions.
      // // Scrolling functions can be CPU intense, so higher number can
      // // help performance.
      // scrollSensitivity: 100
    };

  function Plugin(element, options) {
    this.element = element;
    this.$element = $(element);
    this.options = $.extend({}, defaults, options);
    this._defaults = defaults;
    this._name = pluginName;
    this.init();
  }

  Plugin.prototype = {
    init: function() {
      // Place initialization logic here
      // You already have access to the DOM element and
      // the options via the instance, e.g. this.element
      // and this.options
      // you can add more functions like the one below and
      // call them like so: this.yourOtherFunction(this.element, this.options).
      console.log(this.$element);
      console.log('xD');


      this.$element.addClass('scrollStoryContainer');
    },
    yourOtherFunction: function() {
      // some logic
    }
  };

  // A really lightweight plugin wrapper around the constructor,
  // preventing against multiple instantiations
  $.fn[pluginName] = function(options) {
    return this.each(function() {
      if (!$.data(this, 'plugin_' + pluginName)) {
        $.data(this, 'plugin_' + pluginName, new Plugin(this, options));
      }
    });
  };
}));
