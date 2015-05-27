# ScrollStory

ScrollStory is a jQuery plugin for building scroll-based stories. Rather than doing a specific task, it aims to be a tool to help solve general problems.

For example, it can help you **update your nav** as you scroll down the page. It can **auto-scroll** to sections of your story on a mouse click or custom event. It can trigger **custom callbacks** that manipulate the page as you scroll, like **lazy loading** media. It can dynamically insert markup into the page using an array of data on instantiation, or use pre-existing markup. Additionally, it **maintains data** associated with all these custom interactions.

## Examples
* Loading panoramas in [Walking New York](http://www.nytimes.com/interactive/2015/04/22/magazine/new-york-city-walks.html), nytimes.com
* Triggering info panes in [A Walk Through the Gallery](http://www.nytimes.com/interactive/2015/02/06/arts/a-walk-through-the-gallery-henri-matisse-the-cut-outs-at-the-museum-of-modern-art-in-new-york.html), nytimes.com

## Overview

ScrollStory is built on the idea that scrolling stories often comprise discrete elements stacked on a page that exclusively require a reader’s focus. These elements &mdash; or `items` in ScrollStory speak &mdash; can be anything: sections of text (like the sections of this page), a video, a photo and caption, or any HTML element that can be scrolled to.

ScrollStory follows these items, internally tracking the scroll distance until an item requires the reader’s focus, at which point custom code can be executed to manipulate the experience, like updating the navigation bar and fading the background color on this page. Additionally, custom code can be run whenever any `item` enters the viewport; any `item` within a ScrollStory collection is activated (or, inversely, when none are activated); when an item is `filtered`, a ScrollStory construct meaning it is no longer an active part of a collection; or any of **17 custom events**.

ScrollStory `items` aren't just DOM nodes. Rather, they’re data objects that have a corresponding representation in the DOM. ScrollStory instances maintain data about each `item` object in a collection and provides numerous methods of accessing, querying and modifying that data.


## Documentation

### Instantiation
In its most basic form, ScrollStory takes a container element and searches for `.story` child elements.

#### The markup:

```html
<div id="container">
  <div class="story"><h2>Story 1</h2><p>...</p></div>
  <div class="story"><h2>Story 2</h2><p>...</p></div>
  ...
</div>
```
#### The JavaScript:

```js
$(function(){
  $("#container").scrollStory();
});
```

Internally, ScrollStory turns those elements into `item` objects and assigns them several default properties, like its index position in the list, its `inViewport` status and a `data` object for user data.

#### The item object:

```js
{
  id: 'story0-2', // globally unique across every instance of ScrollStory. User-assigned or auto generated.
  index: 0, // zero-based index for this item within this instance of ScrollStory
  el: $(), // jQuery object containing the item node
  data: {}, // user data for this item
  inViewport: true,
  fullyInViewport: false,
  active: false, // is this the exclusively active item
  filtered: false, // has this item been removed from the collection
  category: 'people', // optional. single, top-level association.
  tags: ['friend', 'relative'], // optional. array of strings defining lose relationships between items.
  distanceToOffset: -589, // px distance to global trigger,
  adjustedDistanceToOffet: -589, //px distance to trigger taking into account any local adjustments for this item
  scrollStory: {}, // reference to the scrollstory instance this item belongs to
  height: 582, // item element height
  width: 1341, // item element width
  scrollOffset: false, // a number if the scrollOffset for this item is different from the global one
  triggerOffset: false // a number if the triggerOffset for this item is different from the global one
}
```

#### Post-instantiation DOM

In addition to object properties, ScrollStory modifies the DOM in a few ways:

* A class of `scrollStory` is added to the container element.
* A class of `scrollStoryActive` is added to the container element if any item is active.
* A class of `scrollStoryActiveItem-{itemId}` is added to the container element to reflect currently * active item.
* A class of `scrollStoryItem` is added to every item element.
* A class of `active` is added to the currently active item element.
* A class of `inviewport` is added to item elements partially or fully in the viewport.

```html
<div id="container" class="scrollStory scrollStoryActive scrollStoryActiveItem-story0-0">
  <div id="story0-0" class="story scrollStoryItem inviewport active ">...</div>
  <div id="story0-1" class="story scrollStoryItem inviewport">...</div>
  <div id="story0-2" class="story scrollStoryItem">...</div>
  <div id="story0-3" class="story scrollStoryItem">...</div>
</div>
```

### Pass In Data Via Attributes

Data can be dynamically added to individual story items by adding it as data attributes. Combined with ScrollStory's API methods, some very dynamic applications can be built.

#### The markup:

```html
<div id="container">
  <div class="story" data-organization="The New York Times" data-founded="1851"></div>
  <div class="story" data-organization="The Washington Post" data-founded="1877"></div>
  ...
</div>
```
#### The JavaScript:

```js
$(function(){
  $("#container").scrollStory();
});
```

Internally, ScrollStory turns those elements into item objects and assigns them several default properties, like its index position in the list, its inViewport status and a data object for user data.

#### The <span code>item</span> objects:

```js
[{
  id: 'story0-0',
  index: 0
  inViewport: true,
  active: true,
  ...
  data: {
    organization: "The New York Times",
    founded: "1851"
  }
},{
  id: 'story0-1',
  index: 1
  inViewport: false,
  active: false,
  ...
  data: {
    organization: "The Washington Post",
    founded: "1877"
  }
}]
```


#### Post-instantiation

```html
<div id="container" class="scrollStory scrollStoryActive scrollStoryActiveItem-story0-0">
  <div id="story0-0" class="story scrollStoryItem inviewport active" data-organization="The New York Times" data-founded="1851">...</div>
  <div id="story0-1" class="story scrollStoryItem" data-organization="The Washington Post" data-founded="1877">...</div>
</div>
```

### Build From Data

A ScrollStory instance can be built with an array of data objects instead of markup, which will be used to generate all the ScrollStory items and elements on the page. The items array and rendered markup are idential to the example above.

#### The Code

```html
<div id="container"></div>
```

```js
$(function(){
  var newspapers=[{
    organization: "The New York Times",
    founded: "1851"
  },{
    organization: "The Washington Post",
    founded: "1877"
  }];

  $("#container").scrollStory({
    content: newspapers
  });
});
```



#### Post-instantiation DOM

```html
<div id="container" class="scrollStory scrollStoryActive scrollStoryActiveItem-story0-0">
  <div id="story0-0" class="story scrollStoryItem inviewport active" data-organization="The New York Times" data-founded="1851">...</div>
  <div id="story0-1" class="story scrollStoryItem" data-organization="The Washington Post" data-founded="1877">...</div>
</div>
```

### Using Data

Item data can be used in most ScrollStory events. For example, you can to use the data to dynamically generate markup during instantiation and when an item becomes active.

#### The Code

```html
<div id="container"></div>
```

```js
$(function(){
  var newspapers=[{
    organization: "The New York Times",
    founded: "1851"
  },{
    organization: "The Washington Post",
    founded: "1877"
  }];

  $("#container").scrollStory({
    content: newspapers
    itembuild: function(ev, item){
      item.el.append("<h2>"+item.data.organization+"</h2>");
    },
    itemfocus: function(ev, item){
      console.log(item.data.organization + ", founded in " + item.data.founded + ", is now active!");
    }
  });
});
```

#### Post-instantiation DOM

```html
<div id="container" class="scrollStory scrollStoryActive scrollStoryActiveItem-story0-0">
  <div id="story0-0" class="story scrollStoryItem inviewport active" data-organization="The New York Times" data-founded="1851">
    <h2>The New York Times</h2>
  </div>
  <div id="story0-1" class="story scrollStoryItem" data-organization="The Washington Post" data-founded="1877">
    <h2>The Washington Post</h2>
  </div>
</div>
```



### Instantiation Options

##### content
Type: `jQuery object`, `String`, or `array`
Default value: 'null'

```js
$('#container').ScrollStory({
    content: [{name:'Josh', town: 'San Francisco'}]
});
```
If given a jQuery object, class selector string, or array of values, use the cooresponding data to build items in this instance.

##### contentSelector
Type: `String`
Default value: '.story'

```js
$('#container').ScrollStory({
    contentSelector: '.story'
});
```
A jQuery selector to find story items within your widget.

##### keyboard
Type: `Boolean`
Default value: true

```js
$('#container').ScrollStory({
    keyboard: true
});
```
Enable left and right arrow keys to move between story items.

##### triggerOffset
Type: `Number`
Default value: 0

```js
$('#container').ScrollStory({
    triggerOffset: 0
});
```
The trigger offset is the distance from the top of the page used to determine which item is active.


##### scrollOffset
Type: `Number`
Default value: 0

```js
$('#container').ScrollStory({
    scrollOffset: 0
});
```
When programatically scrolled, this is the position in pixels from the top the item is scrolled to.

##### autoActivateFirstItem
Type: `Boolean`

Default value: false

```js
$('#container').ScrollStory({
    autoActivateFirstItem: false
});
```
Automatically activate the first item on page load, regardless of its position relative to the offset and the 'preOffsetActivation' setting. Common case: you want to disable 'preOffsetActivation' to ensure late scroll activations but need the first item to be enabled on load. With 'preOffsetActivation:true', this is ignored.

##### disablePastLastItem
Type: `Boolean`
Default value: true

```js
$('#container').ScrollStory({
    disablePastLastItem: true
});
```
Disable last item -- and the entire widget -- once the last item has scrolled beyond the trigger point.

##### speed
Type: `Number`

Default value: 800

```js
$('#container').ScrollStory({
    speed: 800
});
```
Automated scroll speed in ms. Set to 0 to remove animation.

##### easing
Type: `String`

Default value: 'swing'

```js
$('#container').ScrollStory({
    easing: 'swing'
});
```
The easing type for programatic scrolls. If jQuery effects core is included in your jQuery UI build, all jQuery UI easings are available: http://api.jqueryui.com/easings/. Otherwise, you'll only have jQuery's built-in 'swing' and 'linear.' Tip: 'swing' and 'easeOutQuad' have a natural feel.

 
##### scrollSensitivity
Type: `Number`

Default value: 100

```js
$('#container').ScrollStory({
    scrollSensitivity: 100
});
```
How often in milliseconds to check for the active item during a scroll. Use a higher number if performance becomes an issue.

##### throttleType
Type: `String`

Default value: 'debounce'

```js
$('#container').ScrollStory({
    throttleType: 'debounce' // debounce or throttle
});
```
Set the throttle -- or rate-limiting -- method used when testing items' active state. These are wrappers around Underscore's [throttle](http://underscorejs.org/#throttle) and [debounce](http://underscorejs.org/#debounce) functions. Use 'throttle' to trigger active state on the leading edge of the scroll event. Use 'debounce' to trigger on the trailing edge.

##### throttleTypeOptions
Type: `Boolean\Object`

Default value: null

```js
$('#container').ScrollStory({
    throttleTypeOptions: null
});
```
Options to pass to Underscore's throttle or debounce for scroll. Type/functionality dependent on 'throttleType'

##### autoUpdateOffsets
Type: `Boolean`

Default value: true

```js
$('#container').ScrollStory({
    autoUpdateOffsets: true
});
```
Update offsets after likely repaints, like window resizes and filters. If updates aren't offset, the triggering of scroll events may be inaccurate.

##### enabled
Type: `Boolean`

Default value: true

```js
$('#container').ScrollStory({
    enabled: true
});
```
Whether or not the scroll checking is enabled.

##### debug
Type: `Boolean`

Default value: false

```js
$('#container').ScrollStory({
    debug: true
});
```
Whether or not the scroll trigger point should be visible on the page.


### Events and Callbacks

Most of ScrollStory's functionality is available via callbacks and events. 

Tk - examples of both CB and events

#### itemfocus
Fired when an item gains 'focus', which can happen from a scroll-based activation (most commonly), or externally via this.index().

```js
$('#container').ScrollStory({
    indexchange: function(ev, item) {
      // do something
    }
})
```

#### itemblur
Fired when an item loses 'focus'.

```js
$('#container').ScrollStory({
    itemblur: function(ev, item) {
      // do something
    }
})
```

#### itemfilter
Fired when an item is filtered, which means it is no longer considered when ScrollStory determines which item is currently active. By default, there is no visual change on filter, but you can achive visual changes through this event and css rules.

```js
$('#container').ScrollStory({
    itemfilter: function(ev, item) {
      // do something
})
```

#### itemunfilter
Fired when an item is unfiltered.

```js
$('#container').ScrollStory({
    itemunfilter: function(ev, item) {
      // do something
    }
})
```

#### itementerviewport
Fired when an item enters the visible portion of the screen. This is useful for triggering things like lazy loads.

```js
$('#container').ScrollStory({
    itementerviewport: function(ev, item) {
      // do something
})
```

#### itemexitviewport
Fired when an item leaves the visible portion of the screen.

```js
$('#container').ScrollStory({
    itemexitviewport: function(ev, item) {
      // do something
    }
})
```

#### itembuild
Fired when the widget is made aware of an individual item during instantiation. This is a good time to add additional properties to the object. If you're passing in data to build the DOM via the 'content' property, you should append HTML to the item here, as the item hasn't yet been added to the page and the render will be faster.

```js
$('#container').ScrollStory({
    itembuild: function(ev, item) {
      item.el.html('<p>My new content!</p>');
    }
})
```

#### categoryfocus
Fired when new active item is in a different category than previously active item.

```js
$('#container').ScrollStory({
    categoryfocus: function(ev, category) {
      // do something
    }
})
```


#### containeractive
Fired when the instance changes states from having no active item to an active item. Depending on instantiation options, this may or not be on instantiation.

```js
$('#container').ScrollStory({
    containeractive: function() {
      // do something
    }
})
```

#### containerinactive
Fired when the instance changes states from having an active item to not having an active item.

```js
$('#container').ScrollStory({
    containerinactive: function() {
      // do something   
    }
})
```

#### containerscroll
Throttled scroll event.

```js
$('#container').ScrollStory({
    containerscroll: function() {
      // do something
    }
})
```

#### updateoffsets
Fired after offsets have been updated.

```js
$('#container').ScrollStory({
    updateoffsets: function() {
      // do something
    }
})
```

#### triggeroffsetupdate
Fired after a trigger offset as been updated via `.updateTriggerOffset()`

```js
$('#container').ScrollStory({
    triggeroffsetupdate: function() {
      // do something
    }
})
```

#### scrolloffsetupdate
Fired after a scroll offset as been updated via `.updateScrollOffset()`

```js
$('#container').ScrollStory({
    scrolloffsetupdate: function() {
      // do something
    }
})
```


### API
ScrollStory exposes many methods for interacting with the instance. 

```js
// save instance object
var scrollStory = $('#container').ScrollStory().data('plugin_scrollStory');

// use a method
scrollStory.index(3);

```

#### isActive()
<code>scrollStory.isActive()</code>: Whether or not any of the items are active. If so, the entire widget is considered to be 'active.'

#### updateOffsets()
<code>scrollStory.updateOffsets()</code>: Update the widget's awareness of each item's distance to the trigger. This method is called internally after instantiation and automatically on window resize. It should also be called externally anytime DOM changes affect your items' position on the page, like when filtering changes the size of an element.

#### index(index)
<code>scrollStory.index()</code>: Get or set the current index of the active item. On set, also scroll to that item.

**Arguments**

  * **index** (optional Number) - The zero-based index you want to activate.


#### next()
<code>scrollStory.next()</code>: Convenience method to navigate to the item after the active one.


#### previous()
<code>scrollStory.previous()</code>: Convenience method to navigate to the item before the active one.



#### scrollToItem(id, opts, cb)
<code>scrollStory.scrollToItem()</code>: Given an <code>item.id</code>, scroll to it.

**Arguments**

  * **id** (String) - The item.id to scroll to
  * **opts** (optional Object) - Allows you to pass in the <code>easing</code> type, <code>speed</code> and <code>scrollOffset</code> for the scroll, overriding the global and item-specific settings already established.
  * **cb** (optional Function) - Callback to execute after scroll.

#### scrollToIndex(index, opts, cb)
<code>scrollStory.scrollToIndex()</code>: Given a zero-based index, scroll to it.

**Arguments**

* **index** (Number) - The index to scroll to
* **opts** (optional Object) - Allows you to pass in the <code>easing</code> type, <code>speed</code> and <code>scrollOffset</code> for the scroll, overriding the global and item-specific settings already established.
* **cb** (optional Function) - Callback to execute after scroll.


#### getItems()
<code>scrollStory.getItems()</code>: Return an array of all item objects.

#### getItemsInViewport()
<code>scrollStory.getItemsInViewport()</code>: Return an array of all item objects currently visible on the screen.

#### getItemsByCategory(slug)
<code>scrollStory.getItemsByCategory()</code>: Return an array of all item objects in the given category.

**Arguments**

* **slug** (String) - The category slug

#### getFilteredItems()
<code>scrollStory.getFilteredItems()</code>: Return an array of all item objects whose filtered state has been set to true.

#### getUnfilteredItems()
<code>scrollStory.getUnfilteredItems()</code>: Return an array of all item objects whose filtered state has been not been set to true.


#### getItemById(id)
<code>scrollStory.getItemById()</code>: Given an <code>item.id</code>, return its data.

**Arguments**

* **id** (String) - The item.id

#### getItemByIndex(index)
<code>scrollStory.getItemByIndex()</code>:  Given an item's zero-based index, return its data.

**Arguments**

* **index** (Number) - Zero-based index.

#### getTopItem()
<code>scrollStory.getTopItem()</code>:  Return the active <code>item</code> object. False it there isn't one.

#### getTopItemId()
<code>scrollStory.getTopItemId()</code>:  Return the active <code>item.id</code>. False it there isn't one.

#### getNextItem()
<code>scrollStory.getNextItem()</code>:  Return the <code>item</code> object for the item after the currently active one. False it there isn't one.

#### getPreviousItem()
<code>scrollStory.getPreviousItem()</code>:  Return the <code>item</code> object for item before the currently active one. False it there isn't one.

#### getLength()
<code>scrollStory.getLength()</code>:  Return the number of items.

#### getCategoryIds()
<code>scrollStory.getCategoryIds()</code>:  Return an array of category slugs.

#### getActiveCategory()
<code>scrollStory.getActiveCategory()</code>:  Return the slug of the active category.

#### scrollToCategory(id)
<code>scrollStory.scrollToCategory()</code>: Scroll to the first item in a given category

**Arguments**

  * **id** (String) - Category slug

#### scrollToCategoryIndex(index)
<code>scrollStory.scrollToCategoryIndex()</code>: Scroll to the first item in the category, which are tracked by the order in which they appear in items, at the index specified. <code>getCategoryIds</code> lists the categories in order.

**Arguments**

* **index** (Number) - The index to scroll to

#### getTags()
<code>scrollStory.getTags()</code>:  Return array of tag slugs.

#### getItemsByTag(tags, all)
<code>scrollStory.getItemsByTag()</code>: Return an array of item objects that contain the given tag.

**Arguments**

* **tags** (String/Array) - The slug or array of slugs
* **all** (optional Boolean) - false (default) if item must can contain any given tag. true if item must contain all tags.

#### getItemsBy(truthTest)
<code>scrollStory.getItemsBy()</code>: Return an array of item objects that pass an aribitrary truth test.

**Arguments**

* **truthTest** (Function) - The function to check all items against

***Example***
```js
scrollStory.getItemsBy(function(item){
    return item.domData.slug=='josh_williams';
});
```

#### filter(item)
<code>scrollStory.filter()</code>:  Given an item or item id, change its state to filtered.

**Arguments**

* **item** (Object/String) - <code>item</code> or <code>item.id</code>

#### unfilter(item)
<code>scrollStory.unfilter()</code>:  Given an item or item id, change its state to unfiltered.

**Arguments**

* **item** (Object/String) - <code>item</code> or <code>item.id</code>

#### filterByTag(tag,all)
<code>scrollStory.filterByTag()</code>:  Given a tag slug, change all matching items' state to filtered.

**Arguments**

* **tag** (String/Array) - The slug or array of slugs to filter
* **all** (optional Boolean) - false (default) if item must can contain any given tag. true if item must contain all tags.

#### unfilterByTag(tag,all)
<code>scrollStory.unfilterByTag()</code>: Given a tag slug, change all matching items' state to unfiltered.

**Arguments**

* **tag** (String/Array) - The slug or array of slugs to filter
* **all** (optional Boolean) - false (default) if item must can contain any given tag. true if item must contain all tags.

#### filterItemsBy(truthTest)
<code>scrollStory.filterItemsBy()</code>: Filter items that pass an abritrary truth test.

**Arguments**

* **tags** (Function) - The function to check all items against

***Example***
```js
scrollStory.filterItemsBy(function(item){
    return item.domData.slug=='josh_williams';
});
```

#### unfilterAllItems()
<code>scrollStory.unfilterAllItems()</code>:  Change all items' state to unfiltered.

### Release History
*0.2.1*

* Fixed a bug in the name of the scroll event.

*0.2.0*

* Added [Issue 7](https://github.com/sjwilliams/scrollstory/issues/7): `.each` method iterates over each item, passing the item to a callback that is called with two arguments: `item` and `index`.

*0.1.1*

* Fixed [Issue 6](https://github.com/sjwilliams/scrollstory/issues/6): Prevent back arrow key from navigating back if the meta key is down, which browsers use to navigate previous history. 

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