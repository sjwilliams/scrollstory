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
    triggerOffset: 0,

    // Automatically activate the first item on load, 
    // regardless of its position relative to the offset
    autoActivateFirstItem: false,

    // Disable last item once it's scroll beyond the trigger point
    disablePastLastItem: true,

    // Automated scroll speed in ms. Set to 0 to remove animation.
    // speed: 800,

    // // scroll-based events are either 'debounce' or 'throttle'
    throttleType: 'throttle',

    // frequency in milliseconds to perform scroll-based functions. Scrolling functions 
    // can be CPU intense, so higher number can help performance.
    scrollSensitivity: 100,

    // options to pass to underscore's throttle or debounce for scroll
    // see: http://underscorejs.org/#throttle && http://underscorejs.org/#debounce
    throttleTypeOptions: null,

    debug: false,

    itembuild: $.noop,
    itemfocus: $.noop,
    itemblur: $.noop,
    itementerviewport: $.noop,
    itemexitviewport: $.noop,
    containeractive: $.noop,
    containerinactive: $.noop,
    containerresize: $.noop,
    containerscroll: $.noop,
    updateoffsets: $.noop,
    complete: $.noop
  };

  // static across all plugin instances
  // so we can uniquely ID elements
  var instanceCounter = 0;

  function ScrollStory(element, options) {
    this.el = element;
    this.$el = $(element);
    this.$win = $(window);
    this.options = $.extend({}, defaults, options);
    this._defaults = defaults;
    this._name = pluginName;
    this._instanceId = (function() {
      return pluginName + '_' + instanceCounter;
    })();
    this.init();
  }

  ScrollStory.prototype = {
    init: function() {
      this.$el.addClass(pluginName);

      /**
       * List of all items, and a quick lockup hash
       * Data populated via _prepItems* methods
       */
      this._items = [];
      this._itemsById = {};
      this._categories = [];
      this._tags = [];

      this._activeItem;
      this._previousItem;

      /**
       * Various viewport properties cached to this_.viewport
       */
      this.setViewport();

      /**
       * Convert data from outside of widget into
       * items and, if needed, categories of items.
       *
       * It also updates offsets and sets the active item.
       */
      this.addItems(this.options.content);

      if (this.options.debug) {
        $('<div class="' + pluginName + 'Trigger"></div>').css({
          position: 'fixed',
          width: '100%',
          height: '1px',
          top: this.options.triggerOffset + 'px',
          left: '0px',
          backgroundColor: '#ff0000',
          zIndex: 1000
        }).attr('id', pluginName + 'Trigger-' + this._instanceId).appendTo('body');
      }


      this.$el.on('containeractive', this.onContainerActive.bind(this));
      this.$el.on('containerinactive', this.onContainerInactive.bind(this));
      this.$el.on('itemblur', this.onItemBlur.bind(this));
      this.$el.on('itemfocus', this.onItemFocus.bind(this));
      this.$el.on('itementerviewport', this.onItemEnterViewport.bind(this));
      this.$el.on('itemexitviewport', this.onItemExitViewport.bind(this));


      /**
       * bind and throttle page events
       */
      var scrollThrottle = (this.options.throttleType === 'throttle') ? throttle : debounce;
      var boundScroll = scrollThrottle(this.handleScroll.bind(this), this.options.scrollSensitivity, this.options.throttleTypeOptions);
      $(window, 'body').on('scroll', boundScroll);

      var boundResize = debounce(this.handleResize.bind(this));
      $(window).on('DOMContentLoaded load resize', boundResize);


      // TODO 
      // onResize, update offsets, etc

      // TODO
      // When refreshed in middle of page, make sure 
      // an item activates on first scoll


      instanceCounter = instanceCounter + 1;

      this._trigger('complete', null, this);
    },


    /**
     * Update viewport rectangle coordinates cache
     * TODO: remove this?
     */
    setViewport: function() {
      var width = this.$win.width();
      var height = this.$win.height();
      var top = this.$win.scrollTop();
      var left = this.$win.scrollLeft();
      var bottom = height + top;
      var right = left + width;

      this._viewport = {
        width: width,
        height: height,
        top: top,
        left: left,
        bottom: bottom,
        right: right
      };
    },


    /**
     * Return viewport coordinates
     *
     * @return {Object}
     */
    getViewport: function() {
      if (typeof this._viewport === 'undefined') {
        this.setViewport();
      }

      return this._viewport();
    },


    /**
     * Return array of all items
     * @return {Array}
     */
    getItems: function() {
      return this._items;
    },


    /**
     * Given an item id, return it.
     *
     * @param  {string} id
     * @return {Object}
     */
    getItemById: function(id) {
      return this._itemsById[id];
    },


    /**
     * Given an item index, return it.
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
     * Example: this.getItemsBy(function(item){return item.domData.slug=='josh_williams'})
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
     * Get items that are atleast partially visible
     *
     * @return {Array}
     */
    getItemsInViewport: function() {
      return this.getItemsWhere({
        inViewport: true
      });
    },


    getActiveItem: function() {
      return this._activeItem;
    },


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

            // closer to trigger point that previously found item?
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
      } else if (this.options.autoActivateFirstItem && items.length > 0) {
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
     * Excecute a callback function that expects an
     * item as its paramamter for each items.
     *
     * Optionally, a item or array of items of exceptions
     * can be passed in. They'll not call the callback.
     *
     * @param  {Function} cb         Method to call, and pass in exepctions
     * @param  {Object/Array}   exceptions
     */
    applyToAllItems: function(cb, exceptions) {
      exceptions = ($.isArray(exceptions)) ? exceptions : [exceptions];

      var items = this.getItems();
      var i = 0;
      var length = items.length;
      var item;

      for (i = 0; i < length; i++) {
        item = items[i];
        if (exceptions.indexOf(item) === -1) {
          cb(item);
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
        this._trigger('itemblur', null, {
          item: item
        });
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
        this._previousItem = this._activeItem;

        // blur all the other items
        this._blurAllItems(item);

        // make active
        this._activeItem = item;
        item.active = true;

        // notify clients of changes
        var previousItem = this._previousItem;
        this._trigger('itemfocus', null, {
          item: item,
          index: item.index,
          id: item.id,
          previousItem: previousItem,
        });

        // trigger catgory change if not previously active or
        // this item's category is different from the last
        // if (item.category !== previousItem.category || !this._isActive) {
        //   this._trigger('categorychange', null, {
        //     category: item.category,
        //     previousCategory: previousItem.category
        //   });
        // }
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
      console.log('update offsets');
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
      this.topOffset = box.top + scrollTop - clientTop;

      this._trigger('updateoffsets', null, {});
    },


    _updateScrollPositions: function() {
      var bodyElem = document.body;
      var docElem = document.documentElement;
      var scrollTop = window.pageYOffset || docElem.scrollTop || bodyElem.scrollTop;
      var triggerOffset = this.options.triggerOffset;

      // update item scroll positions
      var items = this.getItems();
      var i = 0;
      var length = items.length;
      var item;
      var rect;
      var previouslyInViewport;

      for (i = 0; i < length; i++) {
        item = items[i];
        rect = item.el[0].getBoundingClientRect();
        item.distanceToOffset = item.topOffset - scrollTop - triggerOffset;
        item.adjustedDistanceToOffset = (item.triggerOffset === false) ? item.distanceToOffset : item.topOffset - scrollTop - item.triggerOffset;

        // TODO
        // make this work for partially in viewport, not just fully in viewport

        previouslyInViewport = item.inViewport;
        item.inViewport = rect.top >= 0 && rect.left >= 0 && rect.bottom <= (window.innerHeight || docElem.clientHeight) && rect.right <= (window.innerWidth || docElem.clientWidth);
        // console.log(rect, item.inViewport);

        if (item.inViewport && !previouslyInViewport) {
          this._trigger('itementerviewport', null, {
            item: item
          });
        } else if (!item.inViewport && previouslyInViewport) {
          this._trigger('itemexitviewport', null, {
            item: item
          });
        }
      }

      // update container scroll position
      this._distanceToFirstItemTopOffset = items[0].adjustedDistanceToOffset;

      // takes into account other elements that might make the top of the 
      // container different than the topoffset of the first item.
      this._distanceToOffset = this.topOffset - scrollTop - triggerOffset;
    },


    /**
     * Add items to the running list given any of the
     * following inputs:
     *
     * 1. jQuery selection. Items will be generated
     * from the selection, and any data-* attributes
     * will be added to the item's domData object.
     *
     * 2. A string selector to search for elements
     * within our container. Items will be generated
     * from that selection, and any data-* attributes
     * will be added to the item's domData object.
     *
     * 3. Array of objects. All needed markup will
     * be generated, and the data in each object will
     * be added to the item's domData object.
     *
     * 4. If no 'items' param, we search for items
     * using the options.contentSelector string.
     *
     *
     * TODO: ensure existing items aren't re-added.
     * This is expecially important for the empty items
     * option
     *
     * @param {jQuery Object/String/Array} items
     */
    addItems: function(items) {

      // use an existing jQuery selection
      if (items instanceof jQuery) {
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

      this.updateOffsets(); // must be called first
      this._updateScrollPositions(); // must be called second
      this._setActiveItem(); // must be called third
    },


    handleScroll: function() {
      this._updateScrollPositions();
      this._setActiveItem();
      this._trigger('containerscroll');
    },

    handleResize: function() {
      console.log('resize', this);
      this._updateScrollPositions();
      this._setActiveItem();
      this._trigger('containerresize');
    },

    onContainerActive: function() {
      this.$el.addClass(pluginName + 'Active');
    },

    onContainerInactive: function() {
      this.$el.removeClass(pluginName + 'Active');
    },

    onItemFocus: function(ev, data) {
      data.item.el.addClass('active');
    },

    onItemBlur: function(ev, data) {
      data.item.el.removeClass('active');
    },

    onItemEnterViewport: function(ev, data) {
      data.item.el.addClass('inviewport');
    },

    onItemExitViewport: function(ev, data) {
      data.item.el.removeClass('inviewport');
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

      var $items = $();
      items.forEach(function(data) {
        var $item = $('<div class="' + selector + '"></div>');
        that._addItem(data, $item);
        $items = $items.add($item);
      });

      this.$el.append($items);
    },

    /**
     * Given item user data, and an aleady appended
     * jQuery object, create an item for internal items array.
     *
     * @param {Object} data
     * @param {jQuery Object} $el
     */
    _addItem: function(data, $el) {
      var item = {
        index: this._items.length,

        // id is from markup id attribute, domData or dynamically generated
        id: $el.attr('id') ? $el.attr('id') : (data.id) ? data.id : 'story' + instanceCounter + '-' + this._items.length,

        // item's domData is from client data or data-* attrs
        domData: $.extend({}, data, $el.data()),

        category: data.category, // optional category this item belongs to
        tags: data.tags || [], // optional tag or tags for this item. Can take an array of string, or a cvs string that'll be converted into array of strings.
        el: $el,

        // previousItem: previousItem,
        nextItem: false,

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

      // global record
      this._items.push(item);

      // quick lookup
      this._itemsById[item.id] = item;

      this._trigger('itembuild', null, {
        item: item
      });
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
        this.options[eventType](event, data);
      }
    }
  }; // end plugin.prototype


  /**
   * Utility methods
   *
   * debounce() and throttle() are from on Underscore.js:
   * https://github.com/jashkenas/underscore
   */

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
      previous = options.leading === false ? 0 : new Date;
      timeout = null;
      result = func.apply(context, args);
    };
    return function() {
      var now = new Date;
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