/*globals _ */

(function($, window, document, undefined) {
    'use strict';


    $.widget('sjw.ScrollStory', {

        options: {

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
            triggerOffset: 0,

            // Activate the item closest to the offset, even if it's below the offset. Generally
            // this with an offset at the top of the viewport has a natural feel, as
            // an item activates while the previous one is still on screen, but almost
            // scrolled out.
            preOffsetActivation: true,

            // Automatically activate the first item on page load, regardless of its position
            // relative to the offset and the 'preOffsetActivation' setting. Common case: you
            // want to disable 'preOffsetActivation' to ensure late scroll activations
            // but need the first item to be enabled on load. With 'preOffsetActivation:true', this
            // is ignored.
            autoActivateFirst: true,

            // If 'autoActivateFirst:false' and 'preOffsetActivation:true', app logic would dictate the
            // first item would activate after a 1px scroll. Usually, we want to delay that
            // first activation until the first item is to the offset, but maintain the activation
            // behavior of other items.
            //
            // By default, we delay the activation on first item. Set to false otherwise. No effect
            // if 'autoActivateFirst' is true or 'preOffsetActivation' is false.
            delayFirstActivationToOffset: true,

            // Updated offsets on window resize? useful for responsive layouts
            updateOffsetsOnResize: true,

            // Automated scroll speed in ms. Set to 0 to remove animation.
            speed: 800,

            // dynamic (default) or fixed.
            // 'fixed' means travel the full distance over 'speed' time, regardless of distance.
            // 'dynnamic' means the speed is a guide for the target travel time. Longer distances will
            // take longer, and shorter distance will take less time. this is meant to have a more
            // natural feel. generally, you'll want a  higher speed if you use dynamic than you
            // would for fixed.
            scrollRate: 'dynamic',

            // easing type. All jquery UI easings available:
            // http://api.jqueryui.com/easings/
            // 'swing' and 'easeOutQuad' have a natural feel
            easing: 'swing',

            // Whether to keep track of which individual elements are in the viewport.
            checkViewportVisibility: false,

            // scroll-based events are throttled. Choose from either
            // 'debounce' or 'throttle'
            // see: http://underscorejs.org/#throttle && http://underscorejs.org/#debounce
            throttleType: 'debounce',

            // frequency in milliseconds to perform scroll-based functions.
            // Scrolling functions can be CPU intense, so higher number can
            // help performance.
            scrollSensitivity: 100,

            // options to pass to underscore's throttle or debounce for scroll
            // see: http://underscorejs.org/#throttle && http://underscorejs.org/#debounce
            throttleTypeOptions: null,

            // Add css classes to items to reflect their order from the active item.
            verboseItemClasses: false,


            /**
             * EVENTS
             */

            // changed states from no active item to an active item
            active: function() {},

            // changed states from an active item to no active item
            inactive: function() {},

            // when a new item gains 'focus'. From either scroll-based activation,
            // a call to this.focus() or externally a forced scroll with this.index(id),
            // which will call .focus() when the item scrolls into view.
            indexchange: function() {},

            // when an item looses focus
            itemblur: function() {},

            // when an item is filtered
            itemfilter: function() {},

            // when an item is unfiltered
            itemunfilter: function() {},

            // any part of item enters viewport
            enterviewport: function() {},

            // item exits viewport
            exitviewport: function() {},

            // new item's focus is in a differnt category than previous
            categorychange: function() {},

            // widget is made aware of an individual item via the _prepItem* methods.
            // this is the time to add additional properties to the object
            itembuild: function() {},

            // item offsets have been updated,
            offsetschange: function() {},

            // scroll event
            scoll: function() {},

            // scrolling above global scroll offset
            aboveoffset: function() {},

            // scrolling below global scroll offset
            belowoffset: function() {}
        },

        _create: function() {
            var that = this;

            this.$element = $(this.element).addClass('scrollStoryContainer');
            var content = this.options.content;


            /**
             * List of all items, and a quick lockup hash
             * Data populated via _prepItems* methods
             */
            this._items = [];
            this._itemsById = {};
            this._categories = [];
            this._tags = [];

            /**
             * Index of active item. Maintained by .focus
             * @type {Number}
             */
            this._activeIndex = 0;


            /**
             * Tracks if any items are yet
             * active. Events dispatched when
             * this changes.
             * @type {Boolean}
             */
            this._isActive = false;



            /**
             * Various viewport properties
             */
            this._viewport = {};
            this._updateViewport();

            /**
             * Convert data from outside of widget into
             * items and, if needed, categories of items
             */
            if ($.isArray(content)) {
                this.addItems(content);
            } else {
                this._prepItemsFromDom(content, this.options.contentSelector);
            }

            // only save unique categories and tags. generated on _prep*
            this._categories = _.uniq(this._categories);
            this._tags = _.uniq(_.flatten(this._tags));

            // items and dom are ready
            this._onReady();


            // focus first item automatically
            if (this.options.autoActivateFirst) {
                // defer for array-based content
                _.defer(function() {
                    that.focus(that.getItemByIndex(0).id);
                });
            }

            // reflect ScrollStory's active/inactive state as
            // a class name on container element
            this._on(this.element, {
                'scrollstoryactive': function() {
                    this.element.addClass('scrollStory_active');
                },
                'scrollstoryinactive': function() {
                    this.element.removeClass('scrollStory_active');
                }
            });


            // bind keyboard events
            if (this.options.keyboard) {
                $(document).keydown(_.bind(function(e) {
                    var captured = true;
                    switch (e.keyCode) {
                        case 37:
                            that.previous();
                            break; // left arrow
                        case 39:
                            that.next();
                            break; // right arrow
                        default:
                            captured = false;
                    }
                    return !captured;
                }, this));
            }


            // see what items are in the viewport
            if (this.options.checkViewportVisibility) {
                this._checkViewportVisibility();
            }


            $(window).resize(_.debounce(_.bind(function() {
                this.onResize();
            }, this), 300));


            var scrollThrottle = (this.options.throttleType === 'throttle') ? _.throttle : _.debounce;
            $(window, 'body').scroll(scrollThrottle(_.bind(function() {
                this.onScroll();
            }, this), that.options.scrollSensitivity, that.options.throttleTypeOptions));

        },

        /**
         * Update viewport rectangle coords
         */
        _updateViewport: function() {
            var win = this.window;
            var viewport = {
                top: win.scrollTop(),
                left: win.scrollLeft()
            };
            viewport.right = viewport.left + win.width();
            viewport.bottom = viewport.top + win.height();

            this._viewport = viewport;
        },

        /**
         * Excecute a callback function that expects an
         * item id as its paramamter for each items.
         *
         * Optionally, a id or array of ids of exceptions
         * can be passed in. They'll not call the callback.
         *
         * @param  {Function} cb         Method to call, and pass in exepctions
         * @param  {String/Array}   exceptions
         */
        applyToAllItems: function(cb, exceptions) {
            exceptions = (_.isArray(exceptions)) ? exceptions : [exceptions];
            for (var i = 0; i < this._items.length; i++) {
                var item = this._items[i];
                if (!_.contains(exceptions, item.id)) {
                    cb(item.id);
                }
            }
        },


        /**
         * Unfocus all items.
         *
         * @param  {String/Array} exceptions id or array of ids to not blur
         */
        blurAll: function(exceptions) {
            this.applyToAllItems(_.bind(this.blur, this), exceptions);
        },


        /**
         * Unfocus an item
         * @param  {Object/String} item object or item id
         */
        blur: function(item) {
            item = (typeof item === 'string') ? this.getItemById(item) : item;

            if (item.active) {
                var $item = item.el;
                $item.removeClass('active');
                item.active = false;
                this._trigger('itemblur', null, {
                    item: item
                });
            }
        },


        /**
         * Given an item, give it focus. Focus is exclusive
         * so we unfocus any other item. Focus essentially means
         * it is the top most visible item.
         *
         * @param  {Object/String} item object or item id
         */
        focus: function(item) {
            item = (typeof item === 'string') ? this.getItemById(item) : item;

            if (!item.active && !item.filtered) {
                var $item = item.el,
                    previousActiveIndex = this._activeIndex;

                // blur all the other items
                this.blurAll();

                // make active
                this._activeIndex = item.index;
                item.active = true;
                $item.addClass('active');

                // notify clients of changes
                var previousItem = this.getItemByIndex(previousActiveIndex);
                this._trigger('indexchange', null, {
                    item: item,
                    index: item.index,
                    id: item.id,
                    previousItem: previousItem,
                    previousIndex: previousItem.index,
                    previousId: previousItem.id
                });


                // update order classes if necessary
                if (this.options.verboseItemClasses) {
                    this._verboseItemClasses();
                }

                // trigger catgory change if not previously active or
                // this item's category is different from the last
                if (item.category !== previousItem.category || !this._isActive) {
                    this._trigger('categorychange', null, {
                        category: item.category,
                        previousCategory: previousItem.category
                    });
                }

                if (!this._isActive) {
                    this._isActive = true;
                    this._trigger('active');
                }
            }
        },


        /**
         * Get or set the current index. On set, also scroll.
         * @param  {Number} index
         * @return {Number} index of top most item
         */
        index: function(index) {
            if (typeof index === 'number' && this.getItemByIndex(index)) {
                this.scrollToItem(this.getItemByIndex(index).id);
            } else {
                return this.getItemById(this.getTopItemId()).index;
            }
        },


        /**
         * Convience method to navigate to next item
         */
        next: function() {
            this.index(this.index() + 1);
        },


        /**
         * Convience method to navigate to previous item
         */
        previous: function() {
            this.index(this.index() - 1);
        },


        /**
         * Whether or not any of the items are active.
         *
         * By default, the active item on load is always 0, even if
         * our configuration would have the 0 item inactive
         * based on current scroll position.
         *
         * @return {Boolean}
         */
        isActive: function() {
            return this._isActive;
        },


        /**
         * Find the item closest to the top, or predefined offset from top
         *
         * @return {String/Boolean} id found item. Or false if no valid item found.
         */
        getTopItem: function() {
            var topItemId = this.getTopItemId();

            if (topItemId) {
                return this.getItemById(topItemId);
            }

            return false;
        },


        /**
         * Find the id of the item closest to the top, or predefined offset from top
         *
         * @param  {Object} configurable options
         *
         * @return {String/Boolean} id found item. Or false if no valid item found.
         */
        getTopItemId: function(opts) {
            opts = $.extend(true, {
                // default offset is the one specified on initiation, but
                // can use any desired offset to find an item
                offset: $(window).scrollTop() + this.options.triggerOffset
            }, opts);

            // get position of all items. store as [{id:X,difference:Y}]
            var distancesFromTop = [];
            _.each(this._items, function(item) {
                var localOffsetAdjustment = (item.triggerOffset) ? item.triggerOffset : 0; // per-item adjustment to its offset
                item.distanceToOffset = item.topOffset - opts.offset - localOffsetAdjustment;

                // only remember items that aren't filtered
                if (!item.filtered) {
                    distancesFromTop.push({
                        id: item.id,
                        difference: item.distanceToOffset,
                        absoluteDifference: Math.abs(item.distanceToOffset) // the closest, even if it's above the offset.
                    });
                }
            });

            var itemNearestOffset;

            // item closest to offset, above or below
            if (this.options.preOffsetActivation) {
                itemNearestOffset = _.min(distancesFromTop, function(item) {
                    return item.absoluteDifference;
                });

                // only consier items above offset
            } else {

                // items above offset
                var aboveOffset = _.filter(this.getUnfilteredItems(), function(item) {
                    return item.distanceToOffset <= 0;
                });

                // but still fartherest down the screen, closest to offset
                itemNearestOffset = _.max(aboveOffset, function(item) {
                    return item.distanceToOffset;
                });
            }

            return (itemNearestOffset) ? itemNearestOffset.id : false;
        },


        /**
         * Get item after the current top item.
         * @return {Object/Boolean} Item obj or false
         */
        getNextItem: function() {
            var topItem = this.getTopItem();
            if (topItem && topItem.index < this._items.length) {
                return this.getItemByIndex(topItem.index + 1);
            }

            return false;
        },


        /**
         * Get item before the current top item.
         * @return {Object/Boolean} Item obj or false
         */
        getPreviousItem: function() {
            var topItem = this.getTopItem();
            if (topItem && topItem.index > 0) {
                return this.getItemByIndex(topItem.index - 1);
            }

            return false;
        },


        /**
         * Given an item id, scroll to it.
         *
         * An optional callback can execute
         * after scroll.
         */
        scrollToItem: function(id, opts, cb) {
            var that = this;

            var item = this.getItemById(id);

            /**
             * Allows global scroll options to be overridden
             * in one of two ways:
             *
             * 1. Higher priority: Passed in to scrollToItem directly via opts obj.
             * 2. Lower priority: options set as an item.* property
             */
            opts = $.extend(true, {

                easing: this.options.easing,
                speed: this.options.speed,

                // prefer item.scrollOffset over this.options.scrollOffset
                scrollOffset: (typeof item.scrollOffset === 'number') ? item.scrollOffset : this.options.scrollOffset

            }, opts);

            cb = (_.isFunction(cb)) ? cb : function() {};

            if (item) {

                // new scope
                (function() {

                    var offset = item.el.offset().top - opts.scrollOffset, // position to travel to
                        speed, // speed of animation. different for fixed and dynamic
                        offsetDistance, // distance needed for this item to travel to offset
                        offsets, // array of all item offsets
                        avgOffset, // average distance of an offset
                        rate; // the multiplier for our dynamic speed. its (offsetDistance / avgOffset) * 100, or the % distance of the average offset.



                    // fixed or dynamic speed?
                    if (that.options.scrollRate === 'fixed') {
                        speed = opts.speed;
                    } else {

                        /**
                         * For dynamic scrolling, we use the average offset
                         * distance as a guide to determine the speed needed
                         * for this particular move
                         */

                        offsetDistance = Math.abs(offset - Math.abs($('html,body').offset().top));
                        offsets = _.pluck(that._items, 'topOffset');
                        avgOffset = _.reduce(offsets, function(memo, num) {
                            return memo + num;
                        }, 0) / offsets.length;
                        rate = (offsetDistance / avgOffset);
                        speed = rate * opts.speed;
                    }

                    $('html, body').stop(true).animate({
                        scrollTop: offset
                    }, speed, opts.easing, _.bind(function() {
                        cb();
                    }, this));

                })();

            }

        },


        /**
         * Given an index, scroll to that item.
         *
         * This is a simple wrapper around scrollToItem
         * and accepts simliar arguments, which are just
         * passed on.
         */
        scrollToIndex: function(index, opts, cb) {
            var item = this.getItemByIndex(index);

            if (item) {
                this.scrollToItem(item.id, opts, cb);
            }
        },



        onResize: function() {
            this._updateViewport();

            // should we update offsets when window resizes?
            if (this.options.updateOffsetsOnResize) {
                this.updateOffsets();
            }
        },


        /**
         * Actions to take on scroll.
         *
         * Namely: Find the top most most item, focus it
         * and blur the others. If top item isn't
         * above the scroll offset, activate. Otherwise,
         * blur all items.
         */
        onScroll: function() {
            var topItemId = this.getTopItemId(),
                checkInactive = false, // if the entire widget inactive
                topItem;

            this._updateViewport();

            // which item has focus?
            if (topItemId) {
                topItem = this.getItemById(topItemId);


                // focus item unless it's the first item and all instantiation conditions aren't met
                var activateTop = true;

                if (topItem.index === 0 && topItem.distanceToOffset > 0) {

                    if (!this.options.preOffsetActivation) {
                        activateTop = false;
                    }

                    if (this.options.preOffsetActivation && !this.options.autoActivateFirst) {
                        activateTop = false;
                    }
                }

                if (activateTop) {
                    this.focus(topItemId);
                } else {
                    this.blurAll();
                    checkInactive = true;
                }

                // notify that we're above the global scroll offset
                if (topItem.index === 0 && topItem.distanceToOffset > 0) {
                    this._trigger('aboveoffset');
                } else {
                    this._trigger('belowoffset');
                }

            } else {
                checkInactive = true;
            }

            this._trigger('scroll', null, {
                item: topItem
            });

            // widget newly changed to an inactive state?
            if (checkInactive && this._isActive) {
                this._isActive = false;
                this._trigger('inactive');
            }


            // check viewport visibility of items
            if (this.options.checkViewportVisibility) {
                this._checkViewportVisibility();
            }

        },


        /**
         * Add css classes to an item to reflect
         * their order from the active item.
         *
         * order0 is active item.
         * order1 is directly below active item.
         * order-1 is directly above active item.
         *
         */
        _verboseItemClasses: function() {
            var activeItem = this.getTopItem();


            if (activeItem) {
                var activeIndex = activeItem.index;

                // remove old order classes
                this.$element.find(this.options.contentSelector).removeClass(function(index, cssClass) {
                    var existingClass = /order[-0-9]+/.exec(cssClass);
                    return (existingClass) ? existingClass[0] : '';
                });

                _.each(this.getItems(), function(item) {
                    var newClass = 'order' + ((item.index - activeIndex));
                    item.el.addClass(newClass);
                });

            }
        },


        /**
         * Cycle through items and update
         * their inViewport status
         */
        _checkViewportVisibility: function() {
            _.each(this.getItems(), _.bind(function(item) {
                var inViewport = this._isElementInViewport(item.el);

                if (inViewport && !item.inViewport) {
                    item.el.addClass('inViewport');
                    item.inViewport = true;
                    this._trigger('enterviewport', null, {
                        item: item
                    });
                } else if (!inViewport && item.inViewport) {
                    item.el.removeClass('inViewport');
                    item.inViewport = false;
                    this._trigger('exitviewport', null, {
                        item: item
                    });
                }
            }, this));
        },


        /**
         * Is element fully in the viewport
         * http://stackoverflow.com/questions/123999/how-to-tell-if-a-dom-element-is-visible-in-the-current-viewport/7557433#7557433
         * @param  {Object}  el
         * @return {Boolean}
         */
        _isElementFullyInViewport: function(el) {

            // ensure it's *not* a jquery object
            el = (el instanceof jQuery) ? el[0] : el;
            var rect = el.getBoundingClientRect();
            return (
                rect.top >= 0 &&
                rect.left >= 0 &&
                rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
                rect.right <= (window.innerWidth || document.documentElement.clientWidth)
            );
        },


        /**
         * Is any part of an element in the viewport
         * @param  {Object}  el
         * @return {Boolean}
         */
        _isElementInViewport: function(el) {

            // make sure el it *is* a jquery obj
            el = (el instanceof jQuery) ? el : $(el);

            var viewport = this._viewport;

            var rect = el.offset();
            rect.right = rect.left + el.outerWidth();
            rect.bottom = rect.top + el.outerHeight();

            return (!( // note the !
                viewport.right < rect.left ||
                viewport.left > rect.right ||
                viewport.bottom < rect.top ||
                viewport.top > rect.bottom
            ));
        },


        /**
         * How many items are in this ScollStory
         * @return {Number}
         */
        getLength: function() {
            return this.getItems().length;
        },


        /**
         * Return internal items array
         * @return {Array} all items
         */
        getItems: function() {
            return this._items;
        },


        /**
         * Given an item id, return its data
         * @param  {string} id
         * @return {Object/Boolean}
         */
        getItemById: function(id) {
            var item = this._itemsById[id];
            if (item) {
                return this._items[item.index];
            } else {
                return false;
            }
        },


        /**
         * Given an item index, return it.
         * @param  {Integer} index
         * @return {Object/Boolean}
         */
        getItemByIndex: function(index) {
            if (index >= 0 && index < this._items.length) {
                return this._items[index];
            } else {
                return false;
            }
        },


        /**
         * Get items that are atleast partially
         * visible in viewport
         * @return {[type]} [description]
         */
        getItemsInViewport: function() {

            // is widget keeping track on scroll?
            if (!this.options.checkViewportVisibility) {
                this._checkViewportVisibility();
            }

            return _.filter(this.getItems(), function(item) {
                return item.inViewport;
            });
        },


        /**
         * Return items in a given category
         *
         * @param  {String} category name
         * @return {Array} Items in the given category
         */
        getItemsByCategory: function(category) {
            return _.filter(this._items, function(item) {
                return item.category === category;
            });
        },


        /**
         * Return all items that haven't been filtered
         *
         * @return {Array} Array of items
         */
        getUnfilteredItems: function() {
            return this.getItemsBy(function(item) {
                return !item.filtered;
            });
        },

        /**
         * Return all items that have been filtered
         *
         * @return {Array} Array of items
         */
        getFilteredItems: function() {
            return this.getItemsBy(function(item) {
                return item.filtered;
            });
        },


        /**
         * All category ids
         * @return {Array}
         */
        getCategoryIds: function() {
            return this._categories;
        },

        /**
         * String id of the category of the active item
         * @return {String}
         */
        getActiveCategory: function() {
            return this.getItemByIndex(this.index()).category;
        },


        /**
         * Scroll to the first item in a given category
         */
        scrollToCategory: function(category) {
            var targetItem = this.getItemsByCategory(category)[0];
            if (targetItem) {
                this.scrollToItem(targetItem.id);
            }
        },


        /**
         * Scroll to the first item in the
         * category at the given index
         */
        scrollToCategoryIndex: function(index) {
            this.scrollToCategory(this._categories[index]);
        },


        /**
         * Return all tags
         * @return {Array}
         */
        getTags: function() {
            return this._tags;
        },


        /**
         * Return items with given tags
         *
         * @param  {String/Array} tag name or array of tag names
         * @param  {Boolean} all false (default) if item must can contain any given tag. true if item must contain all tags.
         * @return {Array} Items in the given category
         */
        getItemsByTag: function(tags, all) {
            tags = (_.isArray(tags)) ? tags : [tags];

            var testType = (all) ? _.every : _.some;

            return _.filter(this._items, function(item) {
                return testType(tags, function(tag) {
                    return _.indexOf(item.tags, tag) > -1;
                });
            });
        },

        /**
         * Return items that pass an abritrary truth test
         *
         * For example: this.getItemsBy(function(item){return item.domData.slug=='josh_williams'})
         *
         * @param {Function} truthTest The function to check all items against
         * @return {Array} Array of item objects
         */
        getItemsBy: function(truthTest) {
            if (typeof truthTest !== 'function') {
                throw new Error('You must provide a truthTest function');
            }

            return _.filter(this._items, function(item) {
                return truthTest(item);
            });
        },

        /**
         * Filter items that pass an abritrary truth test
         *
         * For example: this.filterBy(function(item){return item.domData.geo=='africa'})
         *
         * @param {Function} testTest The function to chech all items against
         * @param {Function} cb Callback to execute after all filter actions
         * @return {Array} Array of item objects
         */
        filterBy: function(truthTest, cb) {
            _.each(this.getItemsBy(truthTest), _.bind(function(item) {
                this.filter(item);
            }, this));

            if (typeof cb === 'function') {
                cb();
            }
        },

        /**
         * Given an item or item id, change
         * its state to filtered.
         *
         * @param  {Object/String} item
         */
        filter: function(item) {
            item = (typeof item === 'string') ? this.getItemById(item) : item;
            if (item && !item.filtered) {
                item.filtered = true;
                item.el.addClass('filtered');
                this._trigger('itemfilter', null, {
                    item: item
                });
            }
        },


        /**
         * Given an item or item id, change
         * its state to unfiltered.
         *
         * @param  {Object/String} item
         */
        unfilter: function(item) {
            item = (typeof item === 'string') ? this.getItemById(item) : item;
            if (item && item.filtered) {
                item.filtered = false;
                item.el.removeClass('filtered');
                this._trigger('itemunfilter', null, {
                    item: item
                });
            }
        },


        /**
         * Filter items that match given tag or array of tags
         * @param  {String/Array} tag name or array of tag names
         * @param  {Boolean} all false (default) if item must can contain any given tag. true if item must contain all tags.
         */
        filterByTag: function(tag, all) {
            _.each(this.getItemsByTag(tag, all), _.bind(function(item) {
                this.filter(item);
            }, this));
        },


        /**
         * Unfilter items that match given tag or array of tags
         * @param  {String/Array} tag name or array of tag names
         * @param  {Boolean} all false (default) if item must can contain any given tag. true if item must contain all tags.
         */
        unfilterByTag: function(tag, all) {
            _.each(this.getItemsByTag(tag), _.bind(function(item) {
                this.unfilter(item, all);
            }, this));
        },


        /**
         * Unfilter all items
         */
        unfilterAllItems: function() {
            _.each(this.getItems(), _.bind(function(item) {
                this.unfilter(item);
            }, this));
        },


        /**
         * Iterate through items and update their
         * top offset. Useful if items have been added,
         * removed, or repositioned externally.
         *
         * Also needed after window resize events, etc.
         */
        updateOffsets: function() {
            var items = this._items,
                i = 0,
                length = items.length,
                item;

            for (i = 0; i < length; i++) {
                item = items[i];
                item.el = $('#' + item.id);
                item.topOffset = item.el.offset().top;
                item.width = item.el.width();
                item.height = item.el.height();
            }

            this._trigger('offsetschange', null, {});

            // check viewport visibility of items
            if (this.options.checkViewportVisibility) {
                this._checkViewportVisibility();
            }
        },


        /**
         * TODO: Build out
         */
        destroy: function() {

        },


        _setOption: function(key, value) {
            this._super('_setOption', key, value);
        },


        /**
         * Add single item to DOM and  ._items list with data object.
         * To add many items at once, addItems() is more efficient.
         *
         * @param {Object} data
         * @param {Object} opts
         */
        addItem: function(data, opts) {
            var that = this;

            opts = $.extend(true, {
                appendToDom: true, // set false if external method will attach, like addItems
                updateOffsets: true
            }, opts);

            var items = this._items,
                $item = $('<div></div>'),
                index = items.length,
                newItem = this._prepItem($item, index, data);

            // dom state
            if (opts.appendToDom) {
                this.$element.append(newItem.el);
            }

            if (opts.updateOffsets) {
                _.defer(function() {
                    that.updateOffsets();
                });
            }

            return newItem;
        },


        /**
         * Add an array of items to DOM and ._items list.
         *
         * Thin wrapper around addItem, with fragment cache.
         *
         * TODO: make a true document frag
         *
         * @param {Object} data
         * @param {Object} opts
         */
        addItems: function(items) {
            var that = this,
                $frag = $('<div></div>');

            _.each(items, function(item) {
                var newItem = that.addItem(item, {
                    appendToDom: false,
                    updateOffsets: false
                });
                $frag.append(newItem.el);
            });

            // attach new DOM in bulk and recheck
            // offsets for newly-attched elements
            this.$element.append($frag.html());
            _.defer(function() {
                that.updateOffsets();
            });
        },


        /**
         * Build out items from exisiting DOM. DOM data- attributes
         * are the meta for items.
         *
         * @param  {String or jQuery} dom Selector or existing jQuery collection
         * @param  {String} Selector to search within this.$elements
         */
        _prepItemsFromDom: function(dom, itemSelector) {
            var that = this,
                $items;

            if (dom) {
                $items = $(dom);
            } else {
                $items = this.$element.find(itemSelector);
            }

            $items.each(function(index) {
                that._prepItem($(this), index, $(this).data());
            });
        },


        /**
         * Given new item DOM, create the item object that is
         * maintained in this._items.
         *
         * If items with a category, add that category to
         * this._categories.
         *
         * External apps can modify the item with the
         * 'itembuild' cb/event
         *
         * @param  {jQuery Object} $item
         * @param  {Number} index
         * @param  {Object} data  associated item data
         * @return {Object}      Newly created item object
         */
        _prepItem: function($item, index, data) {

            var that = this,
                items = this._items,
                $el = $item.addClass('storyScroll_story'),
                previousItem = (index > 0) ? items[index - 1] : false,
                id,
                item;

            // use exisiting DOM ID or generate a new one
            if ($el.attr('id')) {
                id = $el.attr('id');
            } else {
                id = 'scrollStory_story_' + index;
                $el.attr('id', id);
            }

            data.id = id;

            item = {
                index: index,
                id: id, // dom id is the unique identifer. generated if needed
                domData: data, // anything stored in data-*
                category: data.category, // optional category this item belongs to
                tags: data.tags || [], // optional tag or tags for this item. Can take an array of string, or a cvs string that'll be converted into array of strings.
                el: $el,
                width: $el.width(),
                height: $el.height(),
                previousItem: previousItem,
                nextItem: false,

                // top most/in-focus item
                active: false,

                // has item been filtered? when set to true, css class is added reflecting status.
                filtered: false,

                // cached distance from top. May need occasional updating if DOM or styling change
                topOffset: $el.offset().top,

                // on occassion, the scrollToItem() offset may need to be adjusted for a
                // particular item. this overrides this.options.scrollOffset set on instantiation
                scrollOffset: false,

                // on occassion we want to trigger an item at a non-standard offset. this is added
                // to the math used in getTopItemId()
                triggerOffset: false,

                // if any part is viewable in the viewport.
                // only updated if this.options.checkViewportVisibility is true
                inViewport: false
            };

            // force to array. split on commas
            if (typeof item.tags === 'string') {
                item.tags = item.tags.split(',');
            }

            // add this item to the global record
            that._items.push(item);

            // add to quick lookup table
            that._itemsById[id] = {
                index: index,
                id: id
            };

            // maintain references to this object in previous one
            if (previousItem) {
                previousItem.nextItem = item;
            }

            that._trigger('itembuild', null, {
                item: item
            });

            // Note that an item's category is saved after the
            // the itembuild event, to allow for user code to
            // specify a category that isn't data-category, which
            // is the default.
            if (item.category) {
                this._categories.push(item.category);
            }

            this._tags.push(item.tags);

            return item;
        },

        _onReady: function() {
            var that = this;
            this._trigger('complete', null, {
                scrollStory: that
            });
        }
    });

})(jQuery, window, document);
