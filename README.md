# ScrollStory

A jQuery UI widget for building simple, scroll-based pages and interactions.

Key features include:
- 100% style agnostic. Just a collection of often-used scroll-based patterns.
- Can can you existing DOM or use an array of objects to create markup.
- 16+ jQueryUI-style events/callbacks for various application state events.
- Focus and blur event when an individual story becomes active or inactive.
- Items can be grouped into categories, with event dispatched as categories change.
- Items filterable by user-specified tags.
- Items aware of their in-viewport status.
- Programmatically animated scroll to any item.
- Throttled scroll events and minimal DOM usage.

## Dependencies
Any recent version of:
- jQuery
- jQuery UI (core, widget and optionally effects core for custom easings)
- Underscore

## Example Usage
* [Basic instantiation via existing page elements](http://sjwilliams.github.io/scrollstory/examples/basic.html)
* [Basic instantiation using custom item selector](http://sjwilliams.github.io/scrollstory/examples/customselector.html)
* [Pass data in via data attributes](http://sjwilliams.github.io/scrollstory/examples/dataattributes.html)
* [Basic instantiation via array of objects](http://sjwilliams.github.io/scrollstory/examples/fromdata.html)
* [Programmatically scroll up and down](http://sjwilliams.github.io/scrollstory/examples/scrolltoneighbors.html)
* [Item active event](http://sjwilliams.github.io/scrollstory/examples/activeevent.html)
* [Move the trigger point](http://sjwilliams.github.io/scrollstory/examples/triggeroffset.html)
* [Using categories](http://sjwilliams.github.io/scrollstory/examples/categories.html)
* [Lazy load images on enterviewport](http://sjwilliams.github.io/scrollstory/examples/lazyload.html)

## Getting Started
Download the [production version][min] or the [development version][max].

[min]: https://raw.github.com/sjwilliams/scrollstory/master/dist/scrollstory.min.js
[max]: https://raw.github.com/sjwilliams/scrollstory/master/dist/scrollstory.js

In your web page:

```html
<script src="jquery.js"></script>
<script src="jquery-ui.js"></script>
<script src="underscore.js"></script>
<script src="dist/scrollstory.min.js"></script>
<script>
jQuery(function($) {
  $('#container').ScrollStory();
});
</script>
```

## Documentation
### Basic Use
```html
<div id="container">
    <div class="story">...</div>
    ...
</div>
```
```javascript
$('#container').ScrollStory();
```
In its most basic form, ScrollStory takes a container element and searches for '.story' child elements. Internally, ScrollStory turns those elements into 'item' objects and assigns them lots of default properties, like its 'index' position in the list, 'topOffset' (point from the top at which is becomes active), it's 'inViewport' status (true or false), and whether it has a custom 'scrollOffet' (or point on page it triggers active, different from the other items). These are covered in detail below.

In addition to object properties, ScrollStory modifies the DOM in a few ways: 
* A class of 'storyScroll_story' is added to every item
* A class of 'active' is added to the currently active item
* A class of 'scrollStory_active' is added to the container if any item is active.

[Demo](http://sjwilliams.github.io/scrollstory/examples/basic.html)

### Pass In Data Via Attributes
```html
<div id="container">
    <div class="story" data-bgcolor="#0000ff">...</div>
    ...
</div>
```
```javascript
$('#container').ScrollStory();
```
Data can be dynamically added to individual story items by adding it as data attributes. Combined with ScrollStory's API methods, some very dynamic applications can be built. 

[Demo](http://sjwilliams.github.io/scrollstory/examples/dataattributes.html)

### Build From Data
```html
<div id="container"></div>
```
```javascript
$('#container').ScrollStory({
    content: [{hed:'Headline1'}, {hed, 'Headline2'}]
    itembuild: function(ev, data) {
        data.item.el.html('<h2>'+data.item.domData.hed+'</h2>');
    }
});
```
The widget can be built with an array of data objects, which will be used to generate all the ScrollStory elements. To be useful, you'll most likely need to use an 'itembuild' callback or event to append your data any way you see fit inside a generated item element.

[Demo](http://sjwilliams.github.io/scrollstory/examples/fromdata.html)

### Options

* <a href="#contentSelector"><code>contentSelector</code></a>
* <a href="#throttleType"><code>throttleType</code></a>
* <a href="#scrollSensitivity"><code>scrollSensitivity</code></a>
* <a href="#triggerOffset"><code>triggerOffset</code></a>
* <a href="#preOffetActivation"><code>preOffetActivation</code></a>
* <a href="#keyboard"><code>keyboard</code></a>
* <a href="#scrollOffset"><code>scrollOffset</code></a>
* <a href="#autoActivateFirst"><code>autoActivateFirst</code></a>
* <a href="# delayFirstActivationToOffset"><code> delayFirstActivationToOffset</code></a>
* <a href="#speed"><code>speed</code></a>
* <a href="#scrollRate"><code>scrollRate</code></a>
* <a href="#easing"><code>easing</code></a>
* <a href="#checkViewportVisibility"><code>checkViewportVisibility</code></a>
* <a href="#verboseItemClasses"><code>verboseItemClasses</code></a>
* <a href="#throttleTypeOptions"><code>throttleTypeOptions</code></a>

--------------------------------------------------------
<a name="contentSelector"></a>
#### contentSelector
Type: `String`

Default value: '.story'

```js
$('#container').ScrollStory({
    contentSelector: '.story'
});
```
A jQuery selector to find story items within your widget.

[Example usage](http://sjwilliams.github.io/scrollstory/examples/customselector.html)

<a name="throttleType"></a>
#### throttleType
Type: `String`

Default value: 'debounce'

```js
$('#container').ScrollStory({
    throttleType: 'debounce' // debounce or throttle
});
```
Set the throttle -- or rate-limiting -- method used when testing items' active state. These are wrappers around Underscore's [throttle](http://underscorejs.org/#throttle) and [debounce](http://underscorejs.org/#debounce) functions. Use 'throttle' to trigger active state on the leading edge of the scroll event. Use 'debounce' trigger on trailing edge. 

[Example usage](http://sjwilliams.github.io/scrollstory/examples/throttletype.html)

<a name="scrollSensitivity"></a>
#### scrollSensitivity
Type: `Number`

Default value: 100

```js
$('#container').ScrollStory({
    scrollSensitivity: 100
});
```
How often in milliseconds to check for the active item during a scroll.

[Example of a lower scroll sensitivity](http://sjwilliams.github.io/scrollstory/examples/scrollsensitivity.html)

<a name="triggerOffset"></a>
#### triggerOffset
Type: `Number`

Default value: 0

```js
$('#container').ScrollStory({
    triggerOffset: 0
});
```
The trigger offset is the distance from the top of the page use to determine which item is active.

[Example of trigger point farther down the page](http://sjwilliams.github.io/scrollstory/examples/triggeroffset.html)

<a name="preOffetActivation"></a>
#### preOffetActivation
Type: `Boolean`

Default value: true

```js
$('#container').ScrollStory({
    preOffsetActivation: true
});
```
By default, ScrollStory activates the item closest to the trigger offset, indifferent to whether that item is above or below the line. If set to false, the widget will no longer allow items to be active 'pre' the triggerOffset point. Generally, a value of true gives a very natural feel.

[Example set to false](http://sjwilliams.github.io/scrollstory/examples/preoffsetactivation.html)

<a name="keyboard"></a>
#### keyboard
Type: `Boolean`

Default value: true

```js
$('#container').ScrollStory({
    keyboard: true
});
```
Enable left and right arrow keys to move between story items.

[Demo](http://sjwilliams.github.io/scrollstory/examples/basic.html)

<a name="scrollOffset"></a>
#### scrollOffset
Type: `Number`

Default value: 0

```js
$('#container').ScrollStory({
    scrollOffset: 0
});
```
When programatically scrolled, the position from the top the item is scrolled to.

<a name="autoActivateFirst"></a>
#### autoActivateFirst
Type: `Boolean`

Default value: true

```js
$('#container').ScrollStory({
    autoActivateFirst: true
});
```
Automatically activate the first item on page load, regardless of its position relative to the offset and the 'preOffsetActivation' setting. Common case: you want to disable 'preOffsetActivation' to ensure late scroll activations but need the first item to be enabled on load. With 'preOffsetActivation:true', this is ignored.

<a name="delayFirstActivationToOffset"></a>
#### delayFirstActivationToOffset
Type: `Boolean`

Default value: true

```js
$('#container').ScrollStory({
    delayFirstActivationToOffset: 0
});
```
If 'autoActivateFirst:false' and 'preOffsetActivation:true', app logic would dictate the first item would activate after a 1px scroll. Usually, we want to delay that first activation until the first item is to the offset, but maintain the activation behavior of other items. By default, we delay the activation on first item. Set to false otherwise. No effect if 'autoActivateFirst' is true or 'preOffsetActivation' is false.

<a name="speed"></a>
#### speed
Type: `Number`

Default value: 800

```js
$('#container').ScrollStory({
    speed: 800
});
```
Automated scroll speed in ms. Set to 0 to remove animation.

<a name="scrollRate"></a>
#### scrollRate
Type: `String`

Default value: 'dynamic'

```js
$('#container').ScrollStory({
    scrollRate: 'dynamic' // 'dynamic' or 'fixed'
});
```
The rate of scroll for programatic scrolls. 'fixed' means travel the full distance over 'speed' time, regardless of distance. 'dynamic' means the speed is a guide for the target travel time. Longer distances will take longer, and shorter distance will take less time. This is meant to have a more natural feel. Tip: you'll want a  higher speed if you use 'dynamic' than you would for 'fixed'.

<a name="easing"></a>
#### easing
Type: `String`

Default value: 'swing'

```js
$('#container').ScrollStory({
    easing: 'swing'
});
```
The easing type for programatic scrolls. If jQuery effects core is included in your jQuery UI build, all jQuery UI easings are available: http://api.jqueryui.com/easings/. Otherwise, you'll only have jQuery's built-in 'swing' and 'linear.' Tip: 'swing' and 'easeOutQuad' have a natural feel.

<a name="checkViewportVisibility"></a>
#### checkViewportVisibility
Type: `Boolean`

Default value: false

```js
$('#container').ScrollStory({
    checkViewportVisibility: false
});
```
Whether to keep track of which individual elements are in the viewport. This is can be CPU intensive, so is turned off by default. It is checked at the 'scrollSensitivity 'rate.

When enabled, events are triggered for items entering and leaving the viewport, and class of 'inViewport' is added and removed from those items' markup.

Regardless of 'checkViewportVisibility' setting, the getItemsInViewport() method will alway return the items in the viewport.

[Example usage](http://sjwilliams.github.io/scrollstory/examples/inviewport.html)

<a name="verboseItemClasses"></a>
#### verboseItemClasses
Type: `Boolean`

Default value: false

```js
$('#container').ScrollStory({
    verboseItemClasses: false
});
```
Add css classes to items to reflect their order from the active item. Class 'order0' for the active item. 'class-1', for the item above, continuing on through 'class-2' to 'class-N', and class 'order1' through 'orderN' for the items below.

[Example usage](http://sjwilliams.github.io/scrollstory/examples/verboseitemclasses.html)

<a name="throttleTypeOptions"></a>
#### throttleTypeOptions
Type: `Boolean\Object`

Default value: null

```js
$('#container').ScrollStory({
    throttleTypeOptions: null
});
```
Options to pass to Underscore's throttle or debounce for scroll. Type/functionality dependent on 'throttleType'

## The 'item' object

At its core, ScrollStory simply manages an array of 'item' objects, keeping track of various properties and states. The entire object is user accessible, but generally should be thought of in two parts: 

* The object root, which ScrollStory uses to maintain state.
* The domData object within the 'item' for user data. 

The 'item' object looks like this:
```
{
    active: true, // is this item, exclusively, the current item?
    category: undefined, // optionally, the single category does this belong to?
    tags: Array[1], // optionally, an array of tags associated with this item
    domData: Object, // User-specifed data, either via data-* attributes or the object used when instantiating from an array of objects. 
    el: ot.fn.ot.init[1], // the jQuery object that contains the item's markup
    filtered: false, // is this item filtered from the list? by default, that includes no styling, only logic to exclude it from being set to active.
    id: "scrollStory_story_0", // user assigned or auto-generated.
    inViewport: true, // is this item in the viewport?
    index: 0, // its index in the list array of ojects
    nextItem: Object, // reference to the item immediately after this one
    previousItem: false, // reference to the item immediately after this one
    topOffset: 322, // distance in pixels from this item's trigger offset
    scrollOffset: false, // a scroll offset that differs from the global offset
    triggerOffset: false, // a trigger offset that differs from the global offset
    height: 1035,
    width: 676
}
```

## Events

Most of ScrollStory's functionality can be used via the widget's callbacks and events. For details on how jQuery UI events work, see their [documentation](http://api.jqueryui.com/jquery.widget/).


The events are:

* <a href="#indexchange"><code>indexchange</code></a>
* <a href="#itemblur"><code>itemblur</code></a>
* <a href="#itemfilter"><code>itemfilter</code></a>
* <a href="#enterviewport"><code>enterviewport</code></a>
* <a href="#exitviewport"><code>exitviewport</code></a>
* <a href="#itembuild"><code>itembuild</code></a>
* <a href="#categorychange"><code>categorychange</code></a>
* <a href="#active"><code>active</code></a>
* <a href="#inactive"><code>inactive</code></a>
* <a href="#aboveoffset"><code>aboveoffset</code></a>
* <a href="#belowoffset"><code>belowoffset</code></a>
* <a href="#scroll"><code>scroll</code></a>

--------------------------------------------------------
<a name="indexchange"></a>
#### indexchange
Fired when an item gains 'focus', which can happen from a scroll-based activation (most commonly), or externally via this.index(), or this.scrollTo*().

```js
$('#container').ScrollStory({
    indexchange: function(ev, data) {
        var item = data.item; // most events put the affected item at data.item. This is the newly activated item.
    }
})
```

<a name="itemblur"></a>
#### itemblur
Fired when an item loses 'focus'.

```js
$('#container').ScrollStory({
    itemblur: function(ev, data) {
        var item = data.item; // newly un-activated item
    }
})
```

<a name="itemfilter"></a>
#### itemfilter
Fired when an item is filtered, which means it is no longer considered ScrollStory determines which item is active. Intended to be combined with visual changes or hidind so you can visually filter the item from the list.

```js
$('#container').ScrollStory({
    itemfilter: function(ev, data) {
        var item = data.item;
})
```

<a name="itemunfilter"></a>
#### itemunfilter
Fired when an item is unfiltered.

```js
$('#container').ScrollStory({
    itemunfilter: function(ev, data) {
        var item = data.item;
    }
})
```

<a name="enterviewport"></a>
#### enterviewport
Fired when an item enters the visible portion of the screen. This is great for triggering things like lazy loads.

```js
$('#container').ScrollStory({
    enterviewport: function(ev, data) {
        var item = data.item;
})
```

<a name="exitviewport"></a>
#### exitviewport
Fired when an item leaves the visible portion of the screen.

```js
$('#container').ScrollStory({
    exitviewport: function(ev, data) {
        var item = data.item;
    }
})
```

<a name="itembuild"></a>
#### itembuild
Fired when the widget is made aware of an individual item during instantiation. This is a good time to add additional properties to the object. If you're passing in data to build the DOM via the 'content' property, you should append HTML to the item now, as the item hasn't yet been added to the page and the render will be faster.

```js
$('#container').ScrollStory({
    content: items, // array of objects that'll be passed into item.domData.
    itembuild: function(ev, data) {
        var item = data.item;
        item.el.html('<p>My new content!</p>');
    }
})
```

[Example usage](http://sjwilliams.github.io/scrollstory/examples/fromdata.html)


<a name="categorychange"></a>
#### categorychange
Fired when new active item is in a different category than previously active item.

```js
$('#container').ScrollStory({
    categorychange: function(ev, data) {
        var category = data.category;
        var previousCategory: data.previousCategory;
    }
})
```

[Example usage](http://sjwilliams.github.io/scrollstory/examples/categories.html)

<a name="active"></a>
#### active
Fired when the widget changes states from have no active item to an active item. Depending on instantiation options, this may or not be on instantiation. 'autoActivateFirst' and 'delayFirstActivationToOffset' may delay this event until a certain scroll position has been reached.

```js
$('#container').ScrollStory({
    active: function(ev) {
        
    }
})
```

<a name="inactive"></a>
#### inactive
Fired when the widget changes states from an active item to not having an active item.

```js
$('#container').ScrollStory({
    inactive: function(ev) {
        
    }
})
```

<a name="aboveoffset"></a>
#### aboveoffset
Scrolling above global scroll offset

```js
$('#container').ScrollStory({
    aboveoffset: function(ev) {
        
    }
})
```

<a name="belowoffset"></a>
#### belowoffset
Scrolling below global scroll offset

```js
$('#container').ScrollStory({
    inactive: function(ev) {
        
    }
})
```

<a name="scroll"></a>
#### scroll
Throttled scroll event. The current active element is passed in.

```js
$('#container').ScrollStory({
    scroll: function(ev, data) {
        var activeItem = data.item;
    }
})
```

## API
ScrollStory exposes many methods for interacting with the widget. The API is available, like other jQuery UI widgets, by accessing it via its namespace and name on the element you instantiate on. You should probably cache the object like so:

```js
// save to an object
var scrollStory = $('#container').ScrollStory({
    itembuild: function(ev,data){
        data.item.el.html('<p>hi</p>');
    }
}).data('sjwScrollStory');

// use a method
scrollStory.index(3);

```

The primary methods include:

* <a href="#isActive">scrollStory.<code>isActive()</code></a>
* <a href="#updateOffsets">scrollStory.<code>updateOffsets()</code></a>
* <a href="#index">scrollStory.<code>index()</code></a>
* <a href="#next">scrollStory.<code>next()</code></a>
* <a href="#previous">scrollStory.<code>previous()</code></a>
* <a href="#scrollToItem">scrollStory.<code>scrollToItem()</code></a>
* <a href="#scrollToIndex">scrollStory.<code>scrollToIndex()</code></a>
* <a href="#getItems">scrollStory.<code>getItems()</code></a>
* <a href="#getItemsInViewport">scrollStory.<code>getItemsInViewport()</code></a>
* <a href="#getItemsByCategory">scrollStory.<code>getItemsByCategory()</code></a>
* <a href="#getFilteredItems">scrollStory.<code>getFilteredItems()</code></a>
* <a href="#getUnfilteredItems">scrollStory.<code>getUnfilteredItems()</code></a>
* <a href="#getItemById">scrollStory.<code>getItemById()</code></a>
* <a href="#getItemByIndex">scrollStory.<code>getItemByIndex()</code></a>
* <a href="#getTopItem">scrollStory.<code>getTopItem()</code></a>
* <a href="#getTopItemId">scrollStory.<code>getTopItemId()</code></a>
* <a href="#getNextItem">scrollStory.<code>getNextItem()</code></a>
* <a href="#getPreviousItem">scrollStory.<code>getPreviousItem()</code></a>
* <a href="#getLength">scrollStory.<code>getLength()</code></a>
* <a href="#getCategoryIds">scrollStory.<code>getCategoryIds()</code></a>
* <a href="#getActiveCategory">scrollStory.<code>getActiveCategory()</code></a>
* <a href="#scrollToCategory">scrollStory.<code>scrollToCategory()</code></a>
* <a href="#scrollToCategoryIndex">scrollStory.<code>scrollToCategoryIndex()</code></a>
* <a href="#getTags">scrollStory.<code>getTags()</code></a>
* <a href="#getItemsByTag">scrollStory.<code>getItemsByTag()</code></a>
* <a href="#getItemsBy">scrollStory.<code>getItemsBy()</code></a>
* <a href="#filter">scrollStory.<code>filter()</code></a>
* <a href="#unfilter">scrollStory.<code>unfilter()</code></a>
* <a href="#filterByTag">scrollStory.<code>filterByTag()</code></a>
* <a href="#unfilterByTag">scrollStory.<code>unfilterByTag()</code></a>
* <a href="#filterBy">scrollStory.<code>filterBy()</code></a>
* <a href="#unfilterAllItems">scrollStory.<code>unfilterAllItems()</code></a>

--------------------------------------------------------
<a name="isActive"></a>
### isActive()
<code>scrollStory.isActive()</code>: Whether or not any of the items are active. If so, the entire widget is considered to be 'active.'

<a name="updateOffsets"></a>
### updateOffsets()
<code>scrollStory.updateOffsets()</code>: Update the widget's awareness of each item's distance to the trigger. This method is called internally after instantiation and automatically on window resize. It should also be called externally anytime DOM changes affect your items' position on the page, like when filtering changes the size of an element.

<a name="index"></a>
### index(index)
<code>scrollStory.index()</code>: Get or set the current index of the active item. On set, also scroll to that item.

**Arguments**

  * **index** (optional Number) - The zero-based index you want to activate.


<a name="next"></a>
### next()
<code>scrollStory.next()</code>: Convenience method to navigate to the item after the active one.

[Example usage](http://sjwilliams.github.io/scrollstory/examples/scrolltoneighbors.html)

<a name="previous"></a>
### previous()
<code>scrollStory.previous()</code>: Convenience method to navigate to the item before the active one.

[Example usage](http://sjwilliams.github.io/scrollstory/examples/scrolltoneighbors.html)


<a name="scrollToItem"></a>
### scrollToItem(id, opts, cb)
<code>scrollStory.scrollToItem()</code>: Given an <code>item.id</code>, scroll to it.

**Arguments**

  * **id** (String) - The item.id to scroll to
  * **opts** (optional Object) - Allows you to pass in the <code>easing</code> type, <code>speed</code> and <code>scrollOffset</code> for the scroll, overriding the global and item-specific settings already established.
  * **cb** (optional Function) - Callback to execute after scroll.

<a name="scrollToIndex"></a>
### scrollToIndex(index, opts, cb)
<code>scrollStory.scrollToIndex()</code>: Given a zero-based index, scroll to it.

**Arguments**

* **index** (Number) - The index to scroll to
* **opts** (optional Object) - Allows you to pass in the <code>easing</code> type, <code>speed</code> and <code>scrollOffset</code> for the scroll, overriding the global and item-specific settings already established.
* **cb** (optional Function) - Callback to execute after scroll.


<a name="getItems"></a>
### getItems()
<code>scrollStory.getItems()</code>: Return an array of all item objects.

<a name="getItemsInViewport"></a>
### getItemsInViewport()
<code>scrollStory.getItemsInViewport()</code>: Return an array of all item objects currently visible on the screen.

<a name="getItemsByCategory"></a>
### getItemsByCategory(slug)
<code>scrollStory.getItemsByCategory()</code>: Return an array of all item objects in the given category.

**Arguments**

* **slug** (String) - The category slug

<a name="getFilteredItems"></a>
### getFilteredItems()
<code>scrollStory.getFilteredItems()</code>: Return an array of all item objects whose filtered state has been set to true.

<a name="getUnfilteredItems"></a>
### getUnfilteredItems()
<code>scrollStory.getUnfilteredItems()</code>: Return an array of all item objects whose filtered state has been not been set to true.


<a name="getItemById"></a>
### getItemById(id)
<code>scrollStory.getItemById()</code>: Given an <code>item.id</code>, return its data.

**Arguments**

* **id** (String) - The item.id

<a name="getItemByIndex"></a>
### getItemByIndex(index)
<code>scrollStory.getItemByIndex()</code>:  Given an item's zero-based index, return its data.

**Arguments**

* **index** (Number) - Zero-based index.

<a name="getTopItem"></a>
### getTopItem()
<code>scrollStory.getTopItem()</code>:  Return the active <code>item</code> object. False it there isn't one.

<a name="getTopItemId"></a>
### getTopItemId()
<code>scrollStory.getTopItemId()</code>:  Return the active <code>item.id</code>. False it there isn't one.

<a name="getNextItem"></a>
### getNextItem()
<code>scrollStory.getNextItem()</code>:  Return the <code>item</code> object for item after the active on. False it there isn't one.

<a name="getPreviousItem"></a>
### getPreviousItem()
<code>scrollStory.getPreviousItem()</code>:  Return the <code>item</code> object for item before the active on. False it there isn't one.

<a name="getLength"></a>
### getLength()
<code>scrollStory.getLength()</code>:  Return the number of items.

<a name="getCategoryIds"></a>
### getCategoryIds()
<code>scrollStory.getCategoryIds()</code>:  Return array of category slugs.

<a name="getActiveCategory"></a>
### getActiveCategory()
<code>scrollStory.getActiveCategory()</code>:  Return the slug of the active category.

<a name="scrollToCategory"></a>
### scrollToCategory(id)
<code>scrollStory.scrollToCategory()</code>: Scroll to the first item in given category

**Arguments**

  * **id** (String) - Category slug

<a name="scrollToCategoryIndex"></a>
### scrollToCategoryIndex(index)
<code>scrollStory.scrollToCategoryIndex()</code>: Scroll to the first item in the category, which are tracked by the order in which they appear in items, at the index specified. <code>getCategoryIds</code> lists the categories in order.

**Arguments**

* **index** (Number) - The index to scroll to

<a name="getTags"></a>
### getTags()
<code>scrollStory.getTags()</code>:  Return array of tag slugs.

<a name="getItemsByTag"></a>
### getItemsByTag(tags, all)
<code>scrollStory.getItemsByTag()</code>: Return an array of item objects that contain the given tag.

**Arguments**

* **tags** (String/Array) - The slug or array of slugs
* **all** (optional Boolean) - false (default) if item must can contain any given tag. true if item must contain all tags.

<a name="getItemsBy"></a>
### getItemsBy(truthTest)
<code>scrollStory.getItemsBy()</code>: Return an array of item objects that pass an aribitrary truth test.

**Arguments**

* **truthTest** (Function) - The function to check all items against

***Example***
```js
scrollStory.getItemsBy(function(item){
    return item.domData.slug=='josh_williams';
});
```

<a name="filter"></a>
### filter(item)
<code>scrollStory.filter()</code>:  Given an item or item id, change its state to filtered.

**Arguments**

* **item** (Object/String) - <code>item</code> or <code>item.id</code>

<a name="unfilter"></a>
### unfilter(item)
<code>scrollStory.unfilter()</code>:  Given an item or item id, change its state to unfiltered.

**Arguments**

* **item** (Object/String) - <code>item</code> or <code>item.id</code>

<a name="filterByTag"></a>
### filterByTag(tag,all)
<code>scrollStory.filterByTag()</code>:  Given a tag slug, change all matching items' state to filtered.

**Arguments**

* **tag** (String/Array) - The slug or array of slugs to filter
* **all** (optional Boolean) - false (default) if item must can contain any given tag. true if item must contain all tags.

<a name="unfilterByTag"></a>
### unfilterByTag(tag,all)
<code>scrollStory.unfilterByTag()</code>: Given a tag slug, change all matching items' state to unfiltered.

**Arguments**

* **tag** (String/Array) - The slug or array of slugs to filter
* **all** (optional Boolean) - false (default) if item must can contain any given tag. true if item must contain all tags.

<a name="filterItemsBy"></a>
### filterItemsBy(truthTest)
<code>scrollStory.filterItemsBy()</code>: Filter items that pass an abritrary truth test.

**Arguments**

* **tags** (Function) - The function to check all items against

***Example***
```js
scrollStory.filterItemsBy(function(item){
    return item.domData.slug=='josh_williams';
});
```

<a name="unfilterAllItems"></a>
### unfilterAllItems()
<code>scrollStory.unfilterAllItems()</code>:  Change all items' state to unfiltered.

## Release History
*0.1.1*
* Fixed [Issue 6](https://github.com/sjwilliams/scrollstory/issues/6): Prevent back arrow key from navigating back if the meta key is down, which browsers use to navigated previous history. 

*0.1.0*
* Fixed a bug that allowed widget to go inactive but leave an item active.

*0.0.3*

* Fixed in-viewport bug caused by assumed global jQuery variable.
* Trigger resize event
* Debug mode to visually show trigger point

*0.0.2*

* Bower release

*0.0.1*

* Initial release

###License
ScrollStory is licensed under the [MIT license](http://opensource.org/licenses/MIT).
