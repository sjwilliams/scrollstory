(function(factory) {
  if (typeof define === 'function' && define.amd) {
    define(['jquery', window, document, undefined], factory);
  } else {
    factory(jQuery, window, document, undefined);
  }
}(function($, window, document, undefined) {
  var pluginName = 'scrollStory';
  var defaults = {

    // jquery object, dom element, or array of values, or null (to use existing DOM)
    content: null,

    // Only used if content is a dom element or null. Should be a class selector
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

  var totalItems = 0; // static, across all plugin instance so we can uniquely ID elements

  function Plugin(element, options) {
    this.element = element;
    this.$element = $(element);
    this.$window = $(window);
    this.options = $.extend({}, defaults, options);
    this._defaults = defaults;
    this._name = pluginName;
    this.init();
  }

  Plugin.prototype = {
    init: function() {
      this.$element.addClass('scrollStoryContainer');

      /**
       * List of all items, and a quick lockup hash
       * Data populated via _prepItems* methods
       */
      this.items = [];
      this.itemsById = {};
      this.categories = [];
      this.tags = [];

      /**
       * Index of active item. Maintained by .focus
       * @type {Number}
       */
      this.activeIndex = 0;

      /**
       * Tracks if any items are yet
       * active. Events dispatched when
       * this changes.
       * @type {Boolean}
       */
      this.isActive = false;

      /**
       * Various viewport properties cached to this_.viewport
       */
      this.updateViewport();

      /**
       * Convert data from outside of widget into
       * items and, if needed, categories of items
       */
      this.addItems(this.options.content);

      console.log(this.getItems());
    },
    /**
    * Update viewport rectangle coords cache
    */
    updateViewport: function() {
      var width = this.$window.width();
      var height = this.$window.height();
      var top = this.$window.scrollTop();
      var left = this.$window.scrollLeft();
      var bottom = height + top;
      var right = left + width;

      this.viewport = {
        width: width,
        height: height,
        top: top,
        left: left,
        bottom: bottom,
        right: right
      };
    },

    getItems: function() {
      return this.items;
    },

    addItems: function(items) {

      // use an existing jQuery selection
      if (items instanceof jQuery) {
        this._prepItemsFromSelection(items);

      // a custom selector to use within our container
      } else if (typeof items === 'string') {
        this._prepItemsFromSelection(this.$element.find(items));

      // array objects, which will be used to create markup
      } else if ($.isArray(items)) {
        this._prepItemsFromData(items);

      // search for elements with the default selector
      } else {
        this._prepItemsFromSelection(this.$element.find(this.options.contentSelector));
      }
    },

    /**
     * Given a jQuery selection, add those elements
     * to the internal items array.
     * 
     * @param  {Object} $jQuerySelection
     */
    _prepItemsFromSelection: function($selection) {
      var that = this;
      $selection.each(function(){
        that._addItem({}, $(this));
      });
    },

    /**
     * Given array of data, append markup and add
     * data to internal items array.
     * @param  {Array} items
     */
    _prepItemsFromData: function(items) {
      var that = this;

      // drop period from the default selector, so we can 
      // add it to the class attr in markup
      var selector = this.options.contentSelector.replace(/\./g, '');

      var $items = $();
      items.forEach(function(data){
        var $item = $('<div class="'+selector+'"></div>');
        that._addItem(data, $item);
        $items = $items.add($item);
      });

      this.$element.append($items);
    },

    _addItem: function(data, $el) {

      var item = {
        index: this.items.length,

        // id is from markup id attribute, domData or dynamically generated
        id: $el.attr('id') ? $el.attr('id') : (data.id) ? data.id : 'story-'+totalItems,

        // item's domData is from client data or data-* attrs
        domData: $.extend({}, data, $el.data()),

        category: data.category, // optional category this item belongs to
        tags: data.tags || [], // optional tag or tags for this item. Can take an array of string, or a cvs string that'll be converted into array of strings.
        el: $el,
        width: $el.width(),
        height: $el.height(),

        // previousItem: previousItem,
        nextItem: false,

        // in-focus item
        active: false,

        // has item been filtered
        filtered: false,

        // cached distance from top. May need occasional updating if DOM or styling change
        // topOffset: $el.offset().top,

        // on occassion, the scrollToItem() offset may need to be adjusted for a
        // particular item. this overrides this.options.scrollOffset set on instantiation
        scrollOffset: false,

        // on occassion we want to trigger an item at a non-standard offset.
        triggerOffset: false,

        // if any part is viewable in the viewport.
        // only updated if this.options.checkViewportVisibility is true
        inViewport: false

      };

      if (!$el.attr('id')) {
        $el.attr('id', item.id);
      }

      this.items.push(item);
      totalItems = totalItems + 1;
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
