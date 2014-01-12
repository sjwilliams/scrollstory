# ScrollStory

jQuery UI widget for stacked, scroll-based elements that need to give focus to a single item at a time.

Key features include:
- 100% style agnostic. Just a collection of often-used scroll-based patterns.
- Can can you existing DOM or use an array of objects to create markup.
- 16+ jQueryUI-style events/callbacks for various application state events.
- Focus and blur event when an individual story becomes active or inactive.
- Items can be grouped into categories, with event dispatched as categories change.
- Items filterable by user-specifed tags.
- Items aware of their in-viewport status.
- Programatic animated scroll to any item.
- Throttled scroll events and minimal DOM usage.

## Dependencies
Any recent version of:
- jQuery
- jQuery UI (core, widget and optionally effects core for custom easings)
- Underscore

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
In its most basic form, ScrollStory takes a container element and searches for '.story' child elements. Internally, ScrollStory turns those elements into 'item' objects and assigns them lots of default properities, like its 'index' position in the list, 'topOffset' (point from the top at which is becomes active), it's 'inViewport' status (true or false), and whether it has a custom 'scrollOffet' (or point on page it triggers active, different from the other items). These are covered in detail below.

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

#### scrollOffset
Type: `Number`

Default value: 0

```js
$('#container').ScrollStory({
    scrollOffset: 0
});
```
When programatically scrolled, the position from the top the item is scrolled to.

#### autoActivateFirst
Type: `Boolean`

Default value: true

```js
$('#container').ScrollStory({
    autoActivateFirst: true
});
```
Automatically activate the first item on page load, regardless of its position relative to the offset and the 'preOffsetActivation' setting. Common case: you want to disable 'preOffsetActivation' to ensure late scroll activations but need the first item to be enabled on load. With 'preOffsetActivation:true', this is ignored.

#### delayFirstActivationToOffset
Type: `Boolean`

Default value: true

```js
$('#container').ScrollStory({
    delayFirstActivationToOffset: 0
});
```
If 'autoActivateFirst:false' and 'preOffsetActivation:true', app logic would dictate the first item would activate after a 1px scroll. Usually, we want to delay that first activation until the first item is to the offset, but maintain the activation behavior of other items. By default, we delay the activation on first item. Set to false otherwise. No effect if 'autoActivateFirst' is true or 'preOffsetActivation' is false.

#### speed
Type: `Number`

Default value: 800

```js
$('#container').ScrollStory({
    speed: 800
});
```
Automated scroll speed in ms. Set to 0 to remove animation.

#### scrollRate
Type: `String`

Default value: 'dynamic'

```js
$('#container').ScrollStory({
    scrollRate: 'dynamic' // 'dynamic' or 'fixed'
});
```
The rate of scroll for programatic scrolls. 'fixed' means travel the full distance over 'speed' time, regardless of distance. 'dynamic' means the speed is a guide for the target travel time. Longer distances will take longer, and shorter distance will take less time. This is meant to have a more natural feel. Tip: you'll want a  higher speed if you use 'dynamic' than you would for 'fixed'.

#### easing
Type: `String`

Default value: 'swing'

```js
$('#container').ScrollStory({
    easing: 'swing'
});
```
The easing type for programatic scrolls. If jQuery effects core is included in your jQuery UI build, all jQuery UI easings are available: http://api.jqueryui.com/easings/. Otherwise, you'll only have jQuery's built-in 'swing' and 'linear.' Tip: 'swing' and 'easeOutQuad' have a natural feel.

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

#### throttleTypeOptions
Type: `Boolean\Object`

Default value: null

```js
$('#container').ScrollStory({
    throttleTypeOptions: null
});
```
Options to pass to underscore's throttle or debounce for scroll. Type/functionality dependent on 'throttleType'

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

#### indexchange
Fired when an item gains 'focus', which can happen from a scroll-based activation (most commonly), or externally via this.index(), this.scrollTo*(), or a call to this.focus().

```js
$('#container').ScrollStory({
    indexchange: function(ev, data) {
        var item = data.item; // most events put the affected item at data.item. This is the newly activated item.
    }
})
```

#### itemblur
Fired when an item loses 'focus'.

```js
$('#container').ScrollStory({
    itemblur: function(ev, data) {
        var item = data.item; // newly un-activated item
    }
})
```

#### itemfilter
Fired when an item is filtered, which means it is no longer considered ScrollStory determines which item is active. Intended to be combined with visual changes or hidind so you can visually filter the item from the list.

```js
$('#container').ScrollStory({
    itemfilter: function(ev, data) {
        var item = data.item;
})
```

#### itemunfilter
Fired when an item is unfiltered.

```js
$('#container').ScrollStory({
    itemunfilter: function(ev, data) {
        var item = data.item;
    }
})
```

#### enterviewport
Fired when an item enters the visible portion of the screen. This is great for triggering things like lazy loads.

```js
$('#container').ScrollStory({
    enterviewport: function(ev, data) {
        var item = data.item;
})
```

#### exitviewport
Fired when an item leaves the visible portion of the screen.

```js
$('#container').ScrollStory({
    exitviewport: function(ev, data) {
        var item = data.item;
    }
})
```

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

#### active
Fired when the widget changes states from have no active item to an active item. Depending on instantation options, this may or not be on instantation. 'autoActivateFirst' and 'delayFirstActivationToOffset' may delay this event until a certain scroll position has been reached.

```js
$('#container').ScrollStory({
    active: function(ev) {
        
    }
})
```

#### inactive
Fired when the widget changes states from an active item to not having an active item.

```js
$('#container').ScrollStory({
    inactive: function(ev) {
        
    }
})
```

#### aboveoffset
Scrolling above global scroll offset

```js
$('#container').ScrollStory({
    aboveoffset: function(ev) {
        
    }
})
```

#### belowoffset
Scrolling below global scroll offset

```js
$('#container').ScrollStory({
    inactive: function(ev) {
        
    }
})
```

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
_(TODO)_

## Examples
* [Programmatically scroll up and down](http://sjwilliams.github.io/scrollstory/examples/scrolltoneighbors.html)
* [Item active event](http://sjwilliams.github.io/scrollstory/examples/activeevent.html)
* [Move the trigger point](http://sjwilliams.github.io/scrollstory/examples/triggeroffset.html)

## Release History
*0.0.1*

* Initial Release
