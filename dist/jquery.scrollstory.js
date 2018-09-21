/**
* @preserve ScrollStory - v1.1.0 - 2018-09-20
* https://github.com/sjwilliams/scrollstory
* Copyright (c) 2017 Josh Williams; Licensed MIT 
*/

(function(factory) {
  if (typeof define === 'function' && define.amd) {
    define(['jquery'], factory);
  } else {
    factory(jQuery);
  }
}(function($, undefined) {

  var pluginName = 'scrollStory';
  var eventNameSpace = '.' + pluginName;
  var defaults = {

    // jquery object, class selector string, or array of values, or null (to use existing DOM)
    content: null,

    // Only used if content null. Should be a class selector
    contentSelector: '.story',

    // Left/right keys to navigate
    keyboard: true,

    // Offset from top used in the programatic scrolling of an
    // item to the focus position. Useful in the case of thinks like
    // top nav that might obscure part of an item if it goes to 0.
    scrollOffset: 0,

    // Offset from top to trigger a change
    triggerOffset: 0,

    // Event to monitor. Can be a name for an event on the $(window), or
    // a function that defines custom behavior. Defaults to native scroll event.
    scrollEvent: 'scroll',

    // Automatically activate the first item on load, 
    // regardless of its position relative to the offset
    autoActivateFirstItem: false,

    // Disable last item -- and the entire widget -- once it's scroll beyond the trigger point
    disablePastLastItem: true,

    // Automated scroll speed in ms. Set to 0 to remove animation.
    speed: 800,

    // Scroll easing. 'swing' or 'linear', unless an external plugin provides others
    // http://api.jquery.com/animate/
    easing: 'swing',

    // // scroll-based events are either 'debounce' or 'throttle'
    throttleType: 'throttle',

    // frequency in milliseconds to perform scroll-based functions. Scrolling functions 
    // can be CPU intense, so higher number can help performance.
    scrollSensitivity: 100,

    // options to pass to underscore's throttle or debounce for scroll
    // see: http://underscorejs.org/#throttle && http://underscorejs.org/#debounce
    throttleTypeOptions: null,

    // Update offsets after likely repaints, like window resizes and filters
    autoUpdateOffsets: true,

    debug: false,

    // whether or not the scroll checking is enabled.
    enabled: true,

    setup: $.noop,
    destroy: $.noop,
    itembuild: $.noop,
    itemfocus: $.noop,
    itemblur: $.noop,
    itemfilter: $.noop,
    itemunfilter: $.noop,
    itementerviewport: $.noop,
    itemexitviewport: $.noop,
    categoryfocus: $.noop,
    categeryblur: $.noop,
    containeractive: $.noop,
    containerinactive: $.noop,
    containerresize: $.noop,
    containerscroll: $.noop,
    updateoffsets: $.noop,
    triggeroffsetupdate: $.noop,
    scrolloffsetupdate: $.noop,
    complete: $.noop
  };

  // static across all plugin instances
  // so we can uniquely ID elements
  var instanceCounter = 0;




  /**
   * Utility methods
   *
   * debounce() and throttle() are from on Underscore.js:
   * https://github.com/jashkenas/underscore
   */

  /**
   * Underscore's now:
   * http://underscorejs.org/now
   */
  var dateNow = Date.now || function() {
    return new Date().getTime();
  };

  /**
   * Underscore's debounce:
   * http://underscorejs.org/#debounce
   */
  var debounce = function(func, wait, immediate) {
    var result;
    var timeout = null;
    return function() {
      var context = this,
        args = arguments;
      var later = function() {
        timeout = null;
        if (!immediate) {
          result = func.apply(context, args);
        }
      };
      var callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) {
        result = func.apply(context, args);
      }
      return result;
    };
  };

  /**
   * Underscore's throttle:
   * http://underscorejs.org/#throttle
   */
  var throttle = function(func, wait, options) {
    var context, args, result;
    var timeout = null;
    var previous = 0;
    options || (options = {});
    var later = function() {
      previous = options.leading === false ? 0 : dateNow();
      timeout = null;
      result = func.apply(context, args);
    };
    return function() {
      var now = dateNow();
      if (!previous && options.leading === false) {
        previous = now;
      }
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0) {
        clearTimeout(timeout);
        timeout = null;
        previous = now;
        result = func.apply(context, args);
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  var $window = $(window);
  var winHeight = $window.height(); // cached. updated via _handleResize()

  /**
   * Given a scroll/trigger offset, determine
   * its pixel value from the top of the viewport. 
   * 
   * If number or number-like string (30 or '30'), return that 
   * number. (30)
   *
   * If it's a percentage string ('30%'), convert to pixels
   * based on the height of the viewport. (eg: 395) 
   * 
   * @param  {String/Number} offset
   * @return {Number}
   */
  var offsetToPx = function(offset){
    var pxOffset;

    if (offsetIsAPercentage(offset)) {
      pxOffset = offset.slice(0, -1);
      pxOffset = Math.round(winHeight * (parseInt(pxOffset, 10)/100) );
    } else {
      pxOffset = parseInt(offset, 10);
    }

    return pxOffset;
  };

  var offsetIsAPercentage = function(offset){
    return typeof offset === 'string' && offset.slice(-1) === '%';
  };


  function ScrollStory(element, options) {
    this.el = element;
    this.$el = $(element);
    this.options = $.extend({}, defaults, options);

    this.useNativeScroll = (typeof this.options.scrollEvent === 'string') && (this.options.scrollEvent.indexOf('scroll') === 0);

    this._defaults = defaults;
    this._name = pluginName;
    this._instanceId = (function() {
      return pluginName + '_' + instanceCounter;
    })();
    
    this.init();
  }

  ScrollStory.prototype = {
    init: function() {
      
      /**
       * List of all items, and a quick lockup hash
       * Data populated via _prepItems* methods
       */
      this._items = [];
      this._itemsById = {};
      this._categories = [];
      this._tags = [];

      this._isActive = false;
      this._activeItem;
      this._previousItems = [];

      /**
       * Attach handlers before any events are dispatched
       */
      this.$el.on('setup'+eventNameSpace, this._onSetup.bind(this));
      this.$el.on('destroy'+eventNameSpace, this._onDestroy.bind(this));
      this.$el.on('containeractive'+eventNameSpace, this._onContainerActive.bind(this));
      this.$el.on('containerinactive'+eventNameSpace, this._onContainerInactive.bind(this));
      this.$el.on('itemblur'+eventNameSpace, this._onItemBlur.bind(this));
      this.$el.on('itemfocus'+eventNameSpace, this._onItemFocus.bind(this));
      this.$el.on('itementerviewport'+eventNameSpace, this._onItemEnterViewport.bind(this));
      this.$el.on('itemexitviewport'+eventNameSpace, this._onItemExitViewport.bind(this));
      this.$el.on('itemfilter'+eventNameSpace, this._onItemFilter.bind(this));
      this.$el.on('itemunfilter'+eventNameSpace, this._onItemUnfilter.bind(this));
      this.$el.on('categoryfocus'+eventNameSpace, this._onCategoryFocus.bind(this));
      this.$el.on('triggeroffsetupdate'+eventNameSpace, this._onTriggerOffsetUpdate.bind(this));


      /**
       * Run before any items have been added, allows
       * for user manipulation of page before ScrollStory
       * acts on anything.
       */
      this._trigger('setup', null, this);


      /**
       * Convert data from outside of widget into
       * items and, if needed, categories of items.
       *
       * Don't 'handleRepaints' just yet, as that'll
       * set an active item. We want to do that after
       * our 'complete' event is triggered.
       */
      this.addItems(this.options.content, {
        handleRepaint: false
      });

      // 1. offsets need to be accurate before 'complete'
      this.updateOffsets();

      // 2. handle any user actions
      this._trigger('complete', null, this);

      // 3. Set active item, and double check 
      // scroll position and offsets.
      if(this.options.enabled){
        this._handleRepaint();
      }


      /**
       * Bind keyboard events
       */
      if (this.options.keyboard) {
        $(document).keydown(function(e){
          var captured = true;
          switch (e.keyCode) {
            case 37:
              if (e.metaKey) {return;} // ignore ctrl/cmd left, as browsers use that to go back in history
              this.previous();
              break; // left arrow
            case 39:
              this.next();
              break; // right arrow
            default:
              captured = false;
          }
          return !captured;
        }.bind(this));
      }



      /**
       * Debug UI
       */
      this.$trigger = $('<div class="' + pluginName + 'Trigger"></div>').css({
        position: 'fixed',
        width: '100%',
        height: '1px',
        top: offsetToPx(this.options.triggerOffset) + 'px',
        left: '0px',
        backgroundColor: '#ff0000',
        '-webkit-transform': 'translateZ(0)',
        '-webkit-backface-visibility': 'hidden',
        zIndex: 1000
      }).attr('id', pluginName + 'Trigger-' + this._instanceId);
      
      if (this.options.debug) {
        this.$trigger.appendTo('body');
      }


      /**
       * Watch either native scroll events, throttled by 
       * this.options.scrollSensitivity, or a custom event 
       * that implements its own throttling.
       *
       * Bind these events after 'complete' trigger so no
       * items are active when those callbacks runs.
       */
      
      var scrollThrottle, scrollHandler;

      if(this.useNativeScroll){

        // bind and throttle native scroll
        scrollThrottle = (this.options.throttleType === 'throttle') ? throttle : debounce;
        scrollHandler = scrollThrottle(this._handleScroll.bind(this), this.options.scrollSensitivity, this.options.throttleTypeOptions);
        $window.on('scroll'+eventNameSpace, scrollHandler);
      } else {

        // bind but don't throttle custom event
        scrollHandler = this._handleScroll.bind(this);

        // if custom event is a function, it'll need
        // to call the scroll handler manually, like so:
        //
        //  $container.scrollStory({
        //    scrollEvent: function(cb){
        //      // custom scroll event on nytimes.com
        //      PageManager.on('nyt:page-scroll', function(){
        //       // do something interesting if you like
        //       // and then call the passed in handler();
        //       cb();
        //     });
        //    }
        //  });
        //
        //
        // Otherwise, it's a string representing an event on the
        // window to subscribe to, like so:
        //
        // // some code dispatching throttled events
        // $window.trigger('nytg-scroll');
        // 
        //  $container.scrollStory({
        //    scrollEvent: 'nytg-scroll'
        //  });
        //

        if (typeof this.options.scrollEvent === 'function') {
          this.options.scrollEvent(scrollHandler);
        } else {
          $window.on(this.options.scrollEvent+eventNameSpace, function(){
            scrollHandler();
          });
        }
      }

      // anything that might cause a repaint      
      var resizeThrottle = debounce(this._handleResize, 100);
      $window.on('DOMContentLoaded'+eventNameSpace + ' load'+eventNameSpace + ' resize'+eventNameSpace, resizeThrottle.bind(this));

      instanceCounter = instanceCounter + 1;
    },


    /**
     * Get current item's index, 
     * or set the current item with an index.
     * @param  {Number} index
     * @param  {Function} callback
     * @return {Number} index of active item
     */
    index: function(index, callback) {
      if (typeof index === 'number' && this.getItemByIndex(index)) {
        this.setActiveItem(this.getItemByIndex(index), {}, callback);
      } else {
        return this.getActiveItem().index;
      }
    },


    /**
     * Convenience method to navigate to next item
     *
     * @param  {Number} _index -- an optional index. Used to recursively find unflitered item 
     */
    next: function(_index) {
      var currentIndex = _index || this.index();
      var nextItem;

      if (typeof currentIndex === 'number') {
        nextItem = this.getItemByIndex(currentIndex + 1);

        // valid index and item
        if (nextItem) {

          // proceed if not filtered. if filtered try the one after that.
          if (!nextItem.filtered) {
            this.index(currentIndex + 1);
          } else {
            this.next(currentIndex + 1);
          }
        }
      }
    },


    /**
     * Convenience method to navigate to previous item
     *
     * @param  {Number} _index -- an optional index. Used to recursively find unflitered item 
     */
    previous: function(_index) {
      var currentIndex = _index || this.index();
      var previousItem;

      if (typeof currentIndex === 'number') {
        previousItem = this.getItemByIndex(currentIndex - 1);

        // valid index and item
        if (previousItem) {

          // proceed if not filtered. if filtered try the one before that.
          if (!previousItem.filtered) {
            this.index(currentIndex - 1);            
          } else {
            this.previous(currentIndex - 1);
          }
        }
      }
    },


    /**
     * The active item object.
     * 
     * @return {Object}
     */
    getActiveItem: function() {
      return this._activeItem;
    },


    /**
     * Given an item object, make it active,
     * including updating its scroll position. 
     * 
     * @param {Object} item
     */
    setActiveItem: function(item, options, callback) {
      options = options || {};

      // verify item
      if (item.id && this.getItemById(item.id)) {
        this._scrollToItem(item, options, callback);
      }
    },


    /**
     * Iterate over each item, passing the item to a callback.
     *
     * this.each(function(item){ console.log(item.id) });
     *
     * @param {Function}
     */
    each: function(callback) {
      this.applyToAllItems(callback);
    },


    /**
     * Return number of items
     * @return {Number}
     */
    getLength: function() {
      return this.getItems().length;
    },

    /**
     * Return array of all items
     * @return {Array}
     */
    getItems: function() {
      return this._items;
    },


    /**
     * Given an item id, return item object with that id.
     *
     * @param  {string} id
     * @return {Object}
     */
    getItemById: function(id) {
      return this._itemsById[id];
    },


    /**
     * Given an item index, return item object with that index.
     *
     * @param  {Integer} index
     * @return {Object}
     */
    getItemByIndex: function(index) {
      return this._items[index];
    },


    /**
     * Return an array of items that pass an abritrary truth test.
     *
     * Example: this.getItemsBy(function(item){return item.data.slug=='josh_williams'})
     *
     * @param {Function} truthTest The function to check all items against
     * @return {Array} Array of item objects
     */
    getItemsBy: function(truthTest) {
      if (typeof truthTest !== 'function') {
        throw new Error('You must provide a truthTest function');
      }

      return this.getItems().filter(function(item) {
        return truthTest(item);
      });
    },


    /**
     * Returns an array of items where all the properties
     * match an item's properties. Property tests can be
     * any combination of:
     *
     * 1. Values
     * this.getItemsWhere({index:2});
     * this.getItemsWhere({filtered:false});
     * this.getItemsWhere({category:'cats', width: 300});
     *
     * 2. Methods that return a value
     * this.getItemsWhere({width: function(width){ return 216 + 300;}});
     *
     * 3. Methods that return a boolean
     * this.getItemsWhere({index: function(index){ return index > 2; } });
     *
     * Mix and match:
     * this.getItemsWehre({filtered:false, index: function(index){ return index < 30;} })
     *
     * @param  {Object} properties
     * @return {Array} Array of item objects
     */
    getItemsWhere: function(properties) {
      var keys,
        items = []; // empty if properties obj not passed in

      if ($.isPlainObject(properties)) {
        keys = Object.keys(properties); // properties to check in each item
        items = this.getItemsBy(function(item) {
          var isMatch = keys.every(function(key) {
            var match;

            // type 3, method that runs a boolean
            if (typeof properties[key] === 'function') {
              match = properties[key](item[key]);

              // type 2, method that runs a value
              if (typeof match !== 'boolean') {
                match = item[key] === match;
              }

            } else {
              
              // type 1, value
              match = item[key] === properties[key];
            }
            return match;
          });

          if (isMatch) {
            return item;
          }
        });
      }

      return items;
    },


    /**
     * Array of items that are atleast partially visible
     *
     * @return {Array}
     */
    getItemsInViewport: function() {
      return this.getItemsWhere({
        inViewport: true
      });
    },


    /**
     * Most recently active item.  
     * 
     * @return {Object}
     */
    getPreviousItem: function() {
      return this._previousItems[0];
    },


    /**
     * Array of items that were previously
     * active, with most recently active
     * at the front of the array. 
     * 
     * @return {Array}
     */
    getPreviousItems: function() {
      return this._previousItems;
    },


    /**
     * Progress of the scroll needed to activate the 
     * last item on a 0.0 - 1.0 scale.
     *
     * 0 means the first item isn't yet active,
     * and 1 means the last item is active, or 
     * has already been scrolled beyond active.
     * 
     * @return {[type]} [description]
     */
    getPercentScrollToLastItem: function() {
      return this._percentScrollToLastItem || 0;
    },


    /**
     * Progress of the entire scroll distance, from the start 
     * of the first item a '0', until the very end of the last
     * item, which is '1';
     */
    getScrollComplete: function() {
      return this._totalScrollComplete || 0;
    },

    /**
     * Return an array of all filtered items.
     * @return {Array}
     */
    getFilteredItems: function() {
      return this.getItemsWhere({
        filtered: true
      });
    },


    /**
     * Return an array of all unfiltered items.
     * @return {Array}
     */
    getUnFilteredItems: function() {
      return this.getItemsWhere({
        filtered: false
      });
    },


    /**
     * Return an array of all items belonging to a category.
     * 
     * @param  {String} categorySlug
     * @return {Array}
     */
    getItemsByCategory: function(categorySlug) {
      return this.getItemsWhere({
        category: categorySlug
      });
    },


    /**
     * Return an array of all category slugs
     * 
     * @return {Array}
     */
    getCategorySlugs: function() {
      return this._categories;
    },


    /**
     * Change an item's status to filtered.
     * 
     * @param  {Object} item
     */
    filter: function(item) {
      if (!item.filtered) {
        item.filtered = true;
        this._trigger('itemfilter', null, item);
      }
    },


    /**
     * Change an item's status to unfiltered.
     * 
     * @param  {Object} item
     */
    unfilter: function(item) {
      if (item.filtered) {
        item.filtered = false;
        this._trigger('itemunfilter', null, item);
      }
    },

    /**
     * Change all items' status to filtered.
     * 
     * @param  {Function} callback
     */
    filterAll: function(callback) {
      callback = ($.isFunction(callback)) ? callback.bind(this) : $.noop;
      var filterFnc = this.filter.bind(this);
      this.getItems().forEach(filterFnc);
    },

    /**
     * Change all items' status to unfiltered.
     * 
     * @param  {Function} callback
     */
    unfilterAll: function(callback) {
      callback = ($.isFunction(callback)) ? callback.bind(this) : $.noop;
      var unfilterFnc = this.unfilter.bind(this);
      this.getItems().forEach(unfilterFnc);
    },


    /**
     * Filter items that pass an abritrary truth test. This is a light 
     * wrapper around `getItemsBy()` and `filter()`.
     *
     * Example: this.filterBy(function(item){return item.data.last_name === 'williams'})
     *
     * @param {Function} truthTest The function to check all items against
     * @param  {Function} callback
     */
    filterBy: function(truthTest, callback) {
      callback = ($.isFunction(callback)) ? callback.bind(this) : $.noop;
      var filterFnc = this.filter.bind(this);
      this.getItemsBy(truthTest).forEach(filterFnc);
      callback();
    },


    /**
     * Filter items where all the properties match an item's properties. This 
     * is a light wrapper around `getItemsWhere()` and `filter()`. See `getItemsWhere()`
     * for more options and examples.
     * 
     * Example: this.filterWhere({index:2})
     *
     * @param {Function} truthTest The function to check all items against
     * @param  {Function} callback
     */
    filterWhere: function(properties, callback) {
      callback = ($.isFunction(callback)) ? callback.bind(this) : $.noop;
      var filterFnc = this.filter.bind(this);
      this.getItemsWhere(properties).forEach(filterFnc);
      callback();
    },


    /**
     * Whether or not any of the item objects are active.
     *
     * @return {Boolean}
     */
    isContainerActive: function() {
      return this._isActive;
    },


    /**
     * Disable scroll updates. This is useful in the
     * rare case when you want to manipulate the page
     * but not have ScrollStory continue to check
     * positions, fire events, etc. Usually a `disable`
     * is temporary and followed by an `enable`.
     */
    disable: function() {
      this.options.enabled = false;
    },
    
    
    /**
     * Enable scroll updates
     */
    enable: function() {
      this.options.enabled = true;
    },


    /**
     * Update trigger offset. This is useful if a client
     * app needs to, post-instantiation, change the trigger
     * point, like after a window resize. 
     * 
     * @param  {Number} offset
     */
    updateTriggerOffset: function(offset) {
      this.options.triggerOffset = offset;
      this.updateOffsets();
      this._trigger('triggeroffsetupdate', null, offsetToPx(offset));
    },


    /**
     * Update scroll offset. This is useful if a client
     * app needs to, post-instantiation, change the scroll
     * offset, like after a window resize. 
     * @param  {Number} offset
     */
    updateScrollOffset: function(offset) {
      this.options.scrollOffset = offset;
      this.updateOffsets();
      this._trigger('scrolloffsetupdate', null, offsetToPx(offset));
    },


    /**
     * Determine which item should be active,
     * and then make it so.
     */
    _setActiveItem: function() {

      // top of the container is above the trigger point and the bottom is still below trigger point. 
      var containerInActiveArea = (this._distanceToFirstItemTopOffset <= 0 && (Math.abs(this._distanceToOffset) - this._height) < 0);

      // only check items that aren't filtered
      var items = this.getItemsWhere({
        filtered: false
      });

      var activeItem;
      items.forEach(function(item) {

        // item has to have crossed the trigger offset
        if (item.adjustedDistanceToOffset <= 0) {
          if (!activeItem) {
            activeItem = item;
          } else {

            // closer to trigger point than previously found item?
            if (activeItem.adjustedDistanceToOffset < item.adjustedDistanceToOffset) {
              activeItem = item;
            }
          }
        }
      });

      // double check conditions around an active item
      if (activeItem && !containerInActiveArea && this.options.disablePastLastItem) {
        activeItem = false;

        // not yet scrolled in, but auto-activate is set to true
      } else if (!activeItem && this.options.autoActivateFirstItem && items.length > 0) {
        activeItem = items[0];
      }

      if (activeItem) {
        this._focusItem(activeItem);

        // container
        if (!this._isActive) {
          this._isActive = true;
          this._trigger('containeractive');
        }

      } else {
        this._blurAllItems();

        // container
        if (this._isActive) {
          this._isActive = false;
          this._trigger('containerinactive');
        }
      }
    },


    /**
     * Scroll to an item, making it active.
     * 
     * @param  {Object}   item
     * @param  {Object}   opts
     * @param  {Function} callback  
     */
    _scrollToItem: function(item, opts, callback) {
      callback = ($.isFunction(callback)) ? callback.bind(this) : $.noop;

      /**
       * Allows global scroll options to be overridden
       * in one of two ways:
       *
       * 1. Higher priority: Passed in to scrollToItem directly via opts obj.
       * 2. Lower priority: options set as an item.* property
       */
      opts = $.extend(true, {
        // prefer item.scrollOffset over this.options.scrollOffset
        scrollOffset: (item.scrollOffset !== false) ? offsetToPx(item.scrollOffset) : offsetToPx(this.options.scrollOffset),
        speed: this.options.speed,
        easing: this.options.easing
      }, opts);


      // because we animate to body and html for maximum compatiblity, 
      // we only want the callback to fire once. jQuery will call it 
      // once for each element otherwise
      var debouncedCallback = debounce(callback, 100);

      // position to travel to
      var scrolllTop = item.el.offset().top - offsetToPx(opts.scrollOffset);
      $('html, body').stop(true).animate({
          scrollTop: scrolllTop
      }, opts.speed, opts.easing, debouncedCallback);
    },


    /**
     * Excecute a callback function that expects an
     * item as its paramamter for each items.
     *
     * Optionally, a item or array of items of exceptions
     * can be passed in. They'll not call the callback.
     *
     * @param  {Function} callback         Method to call, and pass in exepctions
     * @param  {Object/Array}   exceptions
     */
    applyToAllItems: function(callback, exceptions) {
      exceptions = ($.isArray(exceptions)) ? exceptions : [exceptions];
      callback = ($.isFunction(callback)) ? callback.bind(this) : $.noop;

      var items = this.getItems();
      var i = 0;
      var length = items.length;
      var item;

      for (i = 0; i < length; i++) {
        item = items[i];
        if (exceptions.indexOf(item) === -1) {
          callback(item, i);
        }
      }
    },


    /**
     * Unfocus all items.
     *
     * @param  {Object/Array} exceptions item or array of items to not blur
     */
    _blurAllItems: function(exceptions) {
      this.applyToAllItems(this._blurItem.bind(this), exceptions);

      if (!exceptions) {
        this._activeItem = undefined;
      }
    },

    /**
     * Unfocus an item
     * @param  {Object}
     */
    _blurItem: function(item) {
      if (item.active) {
        item.active = false;
        this._trigger('itemblur', null, item);
      }
    },


    /**
     * Given an item, give it focus. Focus is exclusive
     * so we unfocus any other item.
     *
     * @param  {Object} item object
     */
    _focusItem: function(item) {
      if (!item.active && !item.filtered) {
        this._blurAllItems(item);

        // make active
        this._activeItem = item;
        item.active = true;

        // notify clients of changes
        this._trigger('itemfocus', null, item);
      }
    },


    /**
     * Iterate through items and update their top offset.
     * Useful if items have been added, removed,
     * repositioned externally, and after window resize
     *
     * Based on:
     * http://javascript.info/tutorial/coordinates
     * http://stackoverflow.com/questions/123999/how-to-tell-if-a-dom-element-is-visible-in-the-current-viewport/7557433#7557433
     */
    updateOffsets: function() {
      var bodyElem = document.body;
      var docElem = document.documentElement;

      var scrollTop = window.pageYOffset || docElem.scrollTop || bodyElem.scrollTop;
      var clientTop = docElem.clientTop || bodyElem.clientTop || 0;
      var items = this.getItems();
      var i = 0;
      var length = items.length;
      var item;
      var box;

      // individual items
      for (i = 0; i < length; i++) {
        item = items[i];
        box = item.el[0].getBoundingClientRect();

        // add or update item properties
        item.width = box.width;
        item.height = box.height;
        item.topOffset = box.top + scrollTop - clientTop;
      }

      // container
      box = this.el.getBoundingClientRect();
      this._height = box.height;
      this._width = box.width;
      this._topOffset = box.top + scrollTop - clientTop;

      this._trigger('updateoffsets');
    },

    _updateScrollPositions: function() {
      var bodyElem = document.body;
      var docElem = document.documentElement;
      var scrollTop = window.pageYOffset || docElem.scrollTop || bodyElem.scrollTop;
      var wHeight = window.innerHeight || docElem.clientHeight;
      var wWidth = window.innerWidth || docElem.clientWidth;
      var triggerOffset = offsetToPx(this.options.triggerOffset);


      // update item scroll positions
      var items = this.getItems();
      var length = items.length;
      var lastItem = items[length -1];
      var i = 0;
      var item;
      var rect;
      var previouslyInViewport;

      // track total scroll across all items
      var totalScrollComplete = 0;

      for (i = 0; i < length; i++) {
        item = items[i];
        rect = item.el[0].getBoundingClientRect();
        item.distanceToOffset = Math.floor(item.topOffset - scrollTop - triggerOffset); // floor to prevent some off-by-fractional px in determining active item
        item.adjustedDistanceToOffset = (item.triggerOffset === false) ? item.distanceToOffset : item.topOffset - scrollTop - item.triggerOffset;

        // percent through this item's active scroll. expressed 0 - 1;
        if (item.distanceToOffset >= 0) {
          item.percentScrollComplete = 0;
        } else if (Math.abs(item.distanceToOffset) >= rect.height){
          item.percentScrollComplete = 1;
        } else {
          item.percentScrollComplete = Math.abs(item.distanceToOffset) / rect.height;
        }

        // track percent scroll 
        totalScrollComplete = totalScrollComplete + item.percentScrollComplete;

        // track viewport status
        previouslyInViewport = item.inViewport;
        item.inViewport = rect.bottom > 0 && rect.right > 0 && rect.left < wWidth && rect.top < wHeight;
        item.fullyInViewport = rect.top >= 0 && rect.left >= 0 && rect.bottom <= wHeight && rect.right <= wWidth;

        if (item.inViewport && !previouslyInViewport) {
          this._trigger('itementerviewport', null, item);
        } else if (!item.inViewport && previouslyInViewport) {
          this._trigger('itemexitviewport', null, item);
        }
      }

      // update container scroll position
      this._distanceToFirstItemTopOffset = items[0].adjustedDistanceToOffset;

      // takes into account other elements that might make the top of the 
      // container different than the topoffset of the first item.
      this._distanceToOffset = this._topOffset - scrollTop - triggerOffset;


      // percent of the total scroll needed to activate the last item
      var percentScrollToLastItem = 0;
      if (this._distanceToOffset < 0) {
        percentScrollToLastItem = 1 - (lastItem.distanceToOffset / (this._height - lastItem.height));
        percentScrollToLastItem = (percentScrollToLastItem < 1) ? percentScrollToLastItem : 1; // restrict range
      }

      this._percentScrollToLastItem = percentScrollToLastItem;

      this._totalScrollComplete = totalScrollComplete / length;
    },


    /**
     * Add items to the running list given any of the
     * following inputs:
     *
     * 1. jQuery selection. Items will be generated
     * from the selection, and any data-* attributes
     * will be added to the item's data object.
     *
     * 2. A string selector to search for elements
     * within our container. Items will be generated
     * from that selection, and any data-* attributes
     * will be added to the item's data object.
     *
     * 3. Array of objects. All needed markup will
     * be generated, and the data in each object will
     * be added to the item's data object.
     *
     * 4. If no 'items' param, we search for items
     * using the options.contentSelector string.
     *
     *
     * TODO: ensure existing items aren't re-added.
     * This is expecially important for the empty items
     * option, and will give us the ability to do
     * infinite scrolls, etc.
     *
     * @param {jQuery Object/String/Array} items
     */
    addItems: function(items, opts) {

      opts = $.extend(true, {
        handleRepaint: true
      }, opts);

      // use an existing jQuery selection
      if (items instanceof $) {
        this._prepItemsFromSelection(items);

        // a custom selector to use within our container
      } else if (typeof items === 'string') {
        this._prepItemsFromSelection(this.$el.find(items));

        // array objects, which will be used to create markup
      } else if ($.isArray(items)) {
        this._prepItemsFromData(items);

        // search for elements with the default selector
      } else {
        this._prepItemsFromSelection(this.$el.find(this.options.contentSelector));
      }

      // after instantiation and any addItems, we must have 
      // atleast one valid item. If not, plugin is misconfigured.
      if (this.getItems().length < 1) {
        throw new Error('addItems found no valid items.');
      }

      if (opts.handleRepaint) {
        this._handleRepaint();
      }
    },

    /**
     * Remove any classes added during
     * use and unbind all events.
     */
    destroy: function(removeMarkup) {
      removeMarkup = removeMarkup || false;

      if(removeMarkup){
        this.each(function(item){
          item.el.remove();
        });
      }

      // cleanup dom / events and 
      // run any user code
      this._trigger('destroy');

      // plugin wrapper disallows multiple scrollstory
      // instances on the same element. after a destory,
      // allow plugin to reattach to this element.
       var containerData = this.$el.data();
       containerData['plugin_' + pluginName] = null;

      // TODO: destroy the *instance*?
    },


    /**
     * Update items' scroll positions and 
     * determine which one is active based 
     * on those positions. Useful during
     * scrolls, resizes and other events
     * that repaint the page. 
     *
     * updateOffsets should be used 
     * with caution, as it's CPU intensive,
     * and only useful it item sizes or
     * scrollOffsets have changed.
     * 
     * @param  {Boolean} updateOffsets 
     * @return {[type]} [description]
     */
    _handleRepaint: function(updateOffsets) {
      updateOffsets = (updateOffsets === false) ? false : true;
      
      if (updateOffsets) {
        this.updateOffsets(); // must be called first
      }

      this._updateScrollPositions(); // must be called second
      this._setActiveItem(); // must be called third
    },


    /**
     * Keep state correct while scrolling
     */
    _handleScroll: function() {
      if (this.options.enabled) {
        this._handleRepaint(false);
        this._trigger('containerscroll');
      }
    },

    /**
     * Keep state correct while resizing
     */
    _handleResize: function() {
      winHeight = $window.height();
      
      if (this.options.enabled && this.options.autoUpdateOffsets) {

        if (offsetIsAPercentage(this.options.triggerOffset)) {
          this.updateTriggerOffset(this.options.triggerOffset);
        }

        if (offsetIsAPercentage(this.options.scrollOffset)) {
          this.updateScrollOffset(this.options.scrollOffset);
        }

        this._debouncedHandleRepaint();
        this._trigger('containerresize');
      }
    },

    // Handlers for public events that maintain state
    // of the ScrollStory instance.

    _onSetup: function() {
      this.$el.addClass(pluginName);
    },

    _onDestroy: function() {

      // remove events
      this.$el.off(eventNameSpace);
      $window.off(eventNameSpace);

      // item classes
      var itemClassesToRemove = ['scrollStoryItem', 'inviewport', 'active', 'filtered'].join(' ');
      this.each(function(item){
        item.el.removeClass(itemClassesToRemove);
      });

      // container classes
      this.$el.removeClass(function(i, classNames){
        var classNamesToRemove = [];
        classNames.split(' ').forEach(function(c){
          if (c.lastIndexOf(pluginName) === 0 ){
            classNamesToRemove.push(c);
          }
        });
        return classNamesToRemove.join(' ');
      });

      this.$trigger.remove();
    },

    _onContainerActive: function() {
      this.$el.addClass(pluginName + 'Active');
    },

    _onContainerInactive: function() {
      this.$el.removeClass(pluginName + 'Active');
    },

    _onItemFocus: function(ev, item) {
      item.el.addClass('active');
      this._manageContainerClasses('scrollStoryActiveItem-',item.id);

      // trigger catgory change if not previously active or
      // this item's category is different from the last
      if (item.category) {
        if ( (this.getPreviousItem() && this.getPreviousItem().category !== item.category) || !this.isContainerActive()) {
          this._trigger('categoryfocus', null, item.category);

          if (this.getPreviousItem()) {
            this._trigger('categoryblur', null, this.getPreviousItem().category);
          }
        }
      }
    },

    _onItemBlur: function(ev, item) {
      this._previousItems.unshift(item);
      item.el.removeClass('active');
    },

    _onItemEnterViewport: function(ev, item) {
      item.el.addClass('inviewport');
    },

    _onItemExitViewport: function(ev, item) {
      item.el.removeClass('inviewport');
    },

    _onItemFilter: function(ev, item) {
      item.el.addClass('filtered');
      if (this.options.autoUpdateOffsets) {
        this._debouncedHandleRepaint();
      }
    },

    _onItemUnfilter: function(ev, item) {
      item.el.removeClass('filtered');
      if (this.options.autoUpdateOffsets) {
        this._debouncedHandleRepaint();
      }
    },

    _onCategoryFocus: function(ev, category) {
      this._manageContainerClasses('scrollStoryActiveCategory-',category);
    },

    _onTriggerOffsetUpdate: function(ev, offset) {
      this.$trigger.css({
        top: offset + 'px'
      });
    },



    /**
     * Given a prefix string like 'scrollStoryActiveCategory-',
     * and a value like 'fruit', add 'scrollStoryActiveCategory-fruit'
     * class to the containing element after removing any other 
     * 'scrollStoryActiveCategory-*' classes
     * @param  {[type]} prefix [description]
     * @param  {[type]} value  [description]
     * @return {[type]}        [description]
     */
    _manageContainerClasses: function(prefix, value) {
      this.$el.removeClass(function(index, classes){
        return classes.split(' ').filter(function(c) {
            return c.lastIndexOf(prefix, 0) === 0;
        }).join(' ');
      });
      this.$el.addClass(prefix+value);
    },


    /**
     * Given a jQuery selection, add those elements
     * to the internal items array.
     *
     * @param  {Object} $jQuerySelection
     */
    _prepItemsFromSelection: function($selection) {
      var that = this;
      $selection.each(function() {
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

      var frag = document.createDocumentFragment();
      items.forEach(function(data) {
        var $item = $('<div class="' + selector + '"></div>');
        that._addItem(data, $item);
        frag.appendChild($item.get(0));
      });

      this.$el.append(frag);
    },


    /**
     * Given item user data, and an aleady appended
     * jQuery object, create an item for internal items array.
     *
     * @param {Object} data
     * @param {jQuery Object} $el
     */
    _addItem: function(data, $el) {
      var domData = $el.data();

      var item = {
        index: this._items.length,
        el: $el,
        // id is from markup id attribute, data or dynamically generated
        id: $el.attr('id') ? $el.attr('id') : (data.id) ? data.id : 'story' + instanceCounter + '-' + this._items.length,

        // item's data is from client data or data-* attrs. prefer data-* attrs over client data.
        data: $.extend({}, data, domData),

        category: domData.category || data.category, // string. optional category slug this item belongs to. prefer data-category attribute
        tags: data.tags || [], // optional tag or tags for this item. Can take an array of string, or a cvs string that'll be converted into array of strings.
        scrollStory: this, // reference to this instance of scrollstory

        // in-focus item
        active: false,

        // has item been filtered
        filtered: false,

        // on occassion, the scrollToItem() offset may need to be adjusted for a
        // particular item. this overrides this.options.scrollOffset set on instantiation
        scrollOffset: false,

        // on occassion we want to trigger an item at a non-standard offset.
        triggerOffset: false,

        // if any part is viewable in the viewport.
        inViewport: false

      };

      // ensure id exist in dom
      if (!$el.attr('id')) {
        $el.attr('id', item.id);
      }

      $el.addClass('scrollStoryItem');

      // global record
      this._items.push(item);

      // quick lookup
      this._itemsById[item.id] = item;

      this._trigger('itembuild', null, item);

      // An item's category is saved after the the itembuild event
      // to allow for user code to specify a category client-side in 
      // that event callback or handler.
      if (item.category && this._categories.indexOf(item.category) === -1) {
        this._categories.push(item.category);
      }

      // this._tags.push(item.tags);
    },


    /**
     * Manage callbacks and event dispatching.
     *
     * Based very heavily on jQuery UI's implementaiton
     * https://github.com/jquery/jquery-ui/blob/9d0f44fd7b16a66de1d9b0d8c5e4ab954d83790f/ui/widget.js#L492
     *
     * @param  {String} eventType
     * @param  {Object} event
     * @param  {Object} data
     */
    _trigger: function(eventType, event, data) {
      var callback = this.options[eventType];
      var prop, orig;

      if ($.isFunction(callback)) {
        data = data || {};

        event = $.Event(event);
        event.target = this.el;
        event.type = eventType;

        // copy original event properties over to the new event
        orig = event.originalEvent;
        if (orig) {
          for (prop in orig) {
            if (!(prop in event)) {
              event[prop] = orig[prop];
            }
          }
        }

        // fire event
        this.$el.trigger(event, data);

        // call the callback
        var boundCb = this.options[eventType].bind(this);
        boundCb(event, data);
      }
    }
  }; // end plugin.prototype


  /**
   * Debounced version of prototype methods
   */
  ScrollStory.prototype.debouncedUpdateOffsets = debounce(ScrollStory.prototype.updateOffsets, 100);
  ScrollStory.prototype._debouncedHandleRepaint = debounce(ScrollStory.prototype._handleRepaint, 100);



  // A really lightweight plugin wrapper around the constructor,
  // preventing multiple instantiations
  $.fn[pluginName] = function(options) {
    return this.each(function() {
      if (!$.data(this, 'plugin_' + pluginName)) {
        $.data(this, 'plugin_' + pluginName, new ScrollStory(this, options));
      }
    });
  };
}));
