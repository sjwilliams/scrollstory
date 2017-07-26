# ScrollStory

ScrollStory is a jQuery plugin for building scroll-based stories. Rather than doing a specific task, it aims to be a tool to help solve general problems.

For example, it can help you **update your nav** as you scroll down the page. It can **auto-scroll** to sections of your story on a mouse click or custom event. It can trigger **custom callbacks** that manipulate the page as you scroll, like **lazy loading** media. It can dynamically insert markup into the page using an array of data on instantiation, or use pre-existing markup. Additionally, it **maintains data** associated with all these custom interactions.

## Examples
* Controlling scroll-based graphic in [111 N.F.L. Brains. All But One Had C.T.E.](https://www.nytimes.com/interactive/2017/07/25/sports/football/nfl-cte.html), nytimes.com
* Triggering zoomy photo in [Fleeing Boko Haram, Thousands Cling to a Road to Nowhere](https://www.nytimes.com/interactive/2017/03/30/world/africa/the-road-to-nowhere-niger.html), nytimes.com
* Triggering animations in the desktop version of [This Is Your Life, Brought to You by Private Equity](https://www.nytimes.com/interactive/2016/08/02/business/dealbook/this-is-your-life-private-equity.html), nytimes.com
* ScrollStory compared in [How to implement scrollytelling with six different libraries](https://pudding.cool/process/how-to-implement-scrollytelling/demo/scrollstory/), pudding.cool
* Lazy loading 360º video in [52 Places to Go in 2017](https://www.nytimes.com/interactive/2017/travel/places-to-visit.html), nytimes.com
* Revealing text in [A Gift to New York, in Time for the Pope](http://www.nytimes.com/interactive/2015/09/17/nyregion/st-patricks-cathedral-pope-francis-visit.html), nytimes.com

## Overview

ScrollStory is built on the idea that scrolling stories often comprise discrete elements stacked on a page that exclusively require a reader’s focus. These elements &mdash; or `items` in ScrollStory speak &mdash; can be anything: sections of text (like the sections of this page), a video, a photo and caption, or any HTML element that can be scrolled to.

ScrollStory follows these items, internally tracking the scroll distance until an item requires the reader’s focus, at which point custom code can be executed to manipulate the experience, like updating the navigation bar and fading the background color on this page. Additionally, custom code can be run whenever any `item` enters the viewport; any `item` within a ScrollStory collection is activated (or, inversely, when none are activated); when an item is `filtered`, a ScrollStory construct meaning it is no longer an active part of a collection; or any of **17 custom events**.

ScrollStory `items` aren't just DOM nodes. Rather, they’re data objects that have a corresponding representation in the DOM. ScrollStory instances maintain data about each `item` object in a collection and provides numerous methods of accessing, querying and modifying that data.


## Documentation

### Download
* [Development](https://raw.githubusercontent.com/sjwilliams/scrollstory/master/dist/jquery.scrollstory.js)
* [Production](https://raw.githubusercontent.com/sjwilliams/scrollstory/master/dist/jquery.scrollstory.min.js)
* `npm install scrollstory`


### Basic Usage

In its most basic form, ScrollStory takes a container element and searches for `.story` child elements. 


##### The code:

```html
<body>
  <!-- Default markup style -->
  <div id="container">
    <div class="story"><h2>Story 1</h2><p>...</p></div>
    <div class="story"><h2>Story 2</h2><p>...</p></div>
  </div>
  
  <!-- include jquery and scrollstory -->
  <script src="jquery.js"></script>
  <script src="jquery.scrollstory.js"></script>
  
  <script>
    // Instantiation
    $(function(){
      $("#container").scrollStory();
    });
  </script>
</body>
```

Internally, ScrollStory turns those elements into `item` objects and assigns them several default properties, like its index position in the list, its `inViewport` status and a `data` object for user data.

##### The item object:

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

In addition to creating item objects on instantiation, ScrollStory modifies the DOM to reflect various states.

* A class of `scrollStory` is added to the container element.
* A class of `scrollStoryActive` is added to the container element if any item is active.
* A class of `scrollStoryActiveItem-{itemId}` is added to the container element to reflect currently "active" item.
* A class of `scrollStoryItem` is added to every item element.
* A class of `active` is added to the currently active item element.
* A class of `inviewport` is added to item elements partially or fully in the viewport.
* An ID attribute is added to any story item element that didn't have one.

##### Post-instantiation DOM

```html
<div id="container" class="scrollStory scrollStoryActive scrollStoryActiveItem-story0-0">
  <div id="story0-0" class="story scrollStoryItem inviewport active ">...</div>
  <div id="story0-1" class="story scrollStoryItem inviewport">...</div>
  <div id="story0-2" class="story scrollStoryItem">...</div>
  <div id="story0-3" class="story scrollStoryItem">...</div>
</div>
```

### Pass In Data Via Attributes

Data can be dynamically added to individual item objects by adding it as data attributes in markup. Combined with ScrollStory's API methods, some very dynamic applications can be built.

##### The code:

```html
<div id="container">
  <div class="story" data-organization="The New York Times" data-founded="1851"></div>
  <div class="story" data-organization="The Washington Post" data-founded="1877"></div>
  ...
</div>
<script>
  $(function(){
    $("#container").scrollStory();
  });
</script>
```

Internally, ScrollStory turns those elements into item objects and assigns them several default properties, like its index position in the list, its inViewport status and a data object for user data.

##### The <span code>item</span> objects:

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


##### Post-instantiation

```html
<div id="container" class="scrollStory scrollStoryActive scrollStoryActiveItem-story0-0">
  <div id="story0-0" class="story scrollStoryItem inviewport active" data-organization="The New York Times" data-founded="1851">...</div>
  <div id="story0-1" class="story scrollStoryItem" data-organization="The Washington Post" data-founded="1877">...</div>
</div>
```

### Build From Data

A ScrollStory instance can be built with an array of data objects instead of markup, which will be used to generate all the ScrollStory items and elements on the page. The items array and rendered markup are idential to the example above.

##### The Code

```js
$(function(){

  // data
  var newspapers=[{
    organization: "The New York Times",
    founded: "1851"
  },{
    organization: "The Washington Post",
    founded: "1877"
  }];

  // pass in the data
  $("#container").scrollStory({content: newspapers});
});
```



##### Post-instantiation DOM

```html
<div id="container" class="scrollStory scrollStoryActive scrollStoryActiveItem-story0-0">
  <div id="story0-0" class="story scrollStoryItem inviewport active" data-organization="The New York Times" data-founded="1851">...</div>
  <div id="story0-1" class="story scrollStoryItem" data-organization="The Washington Post" data-founded="1877">...</div>
</div>
```

### Using Data

Item data can be used in most ScrollStory events and callbacks. For example, you can to use the data to dynamically generate markup during instantiation.


```js
$(function(){
  var newspapers=[{organization: "The New York Times", founded: "1851"},{organization: "The Washington Post", founded: "1877"}];

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

##### Post-instantiation DOM

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

You could also, for example, manipulate the styles of items as they gain and lose focus. Here we'll interact with the same instance as before, but instead of callbacks we'll use events, which are available after instantiation.

```js
$("container").on('itemfocus', function(item){
  if(item.index === 0){
    item.el.css('background-color', 'purple');
  } else {
    item.el.css('background-color', 'red');
  }
});

$("container").on('itemblur', function(ev, item){
  item.el.css('background-color', 'white');
});
```

Admittedly this example is a bit contrived as we could have done the same thing in CSS alone:
```css
.story{
  background-color: white;
}

.story.active{
  background-color: red;
}

.scrollStoryActiveItem-story0-0 .story.active{
  background-color: purple;
}

```

### Instantiation Options

#### content
Type: `jQuery Object`, `String`, or `array`
Default value: 'null'

```js
$('#container').scrollStory({
    content: [{name:'Josh', town: 'San Francisco'}]
});
```
If given a jQuery object, class selector string, or array of values, use the cooresponding data to build items in this instance.

#### contentSelector
Type: `String`
Default value: '.story'

```js
$('#container').scrollStory({
    contentSelector: '.story'
});
```
A jQuery selector to find story items within your widget.

#### keyboard
Type: `Boolean`
Default value: true

```js
$('#container').scrollStory({
    keyboard: true
});
```
Enable left and right arrow keys to move between story items.

#### triggerOffset
Type: `Number`
Default value: 0

```js
$('#container').scrollStory({
    triggerOffset: 0
});
```
The trigger offset is the distance from the top of the page used to determine which item is active.


#### scrollOffset
Type: `Number`
Default value: 0

```js
$('#container').scrollStory({
    scrollOffset: 0
});
```
When programatically scrolled, this is the position in pixels from the top the item is scrolled to.

#### autoActivateFirstItem
Type: `Boolean`

Default value: false

```js
$('#container').scrollStory({
    autoActivateFirstItem: false
});
```
Automatically activate the first item on page load, regardless of its position relative to the offset and the 'preOffsetActivation' setting. Common case: you want to disable 'preOffsetActivation' to ensure late scroll activations but need the first item to be enabled on load. With 'preOffsetActivation:true', this is ignored.

#### disablePastLastItem
Type: `Boolean`
Default value: true

```js
$('#container').scrollStory({
    disablePastLastItem: true
});
```
Disable last item -- and the entire widget -- once the last item has scrolled beyond the trigger point.

#### speed
Type: `Number`

Default value: 800

```js
$('#container').scrollStory({
    speed: 800
});
```
Automated scroll speed in ms. Set to 0 to remove animation.

#### easing
Type: `String`

Default value: 'swing'

```js
$('#container').scrollStory({
    easing: 'swing'
});
```
The easing, 'swing' or 'linear', to use during programatic scrolls.  

 
#### scrollSensitivity
Type: `Number`

Default value: 100

```js
$('#container').scrollStory({
    scrollSensitivity: 100
});
```
How often in milliseconds to check for the active item during a scroll. Use a higher number if performance becomes an issue.

#### throttleType
Type: `String`

Default value: 'debounce'

```js
$('#container').scrollStory({
    throttleType: 'debounce' // debounce or throttle
});
```
Set the throttle -- or rate-limiting -- method used when testing items' active state. These are wrappers around Underscore's [throttle](http://underscorejs.org/#throttle) and [debounce](http://underscorejs.org/#debounce) functions. Use 'throttle' to trigger active state on the leading edge of the scroll event. Use 'debounce' to trigger on the trailing edge.

#### throttleTypeOptions
Type: `Boolean\Object`

Default value: null

```js
$('#container').scrollStory({
    throttleTypeOptions: null
});
```
Options to pass to Underscore's throttle or debounce for scroll. Type/functionality dependent on 'throttleType'

#### autoUpdateOffsets
Type: `Boolean`

Default value: true

```js
$('#container').scrollStory({
    autoUpdateOffsets: true
});
```
Update offsets after likely repaints, like window resizes and filters. If updates aren't offset, the triggering of scroll events may be inaccurate.

#### enabled
Type: `Boolean`

Default value: true

```js
$('#container').scrollStory({
    enabled: true
});
```
Whether or not the scroll checking is enabled.

#### debug
Type: `Boolean`

Default value: false

```js
$('#container').scrollStory({
    debug: true
});
```
Whether or not the scroll trigger point should be visible on the page.


### Events and Callbacks

Most of ScrollStory's functionality is available via callbacks and events. 

```js

// via callbacks on instantiation
$('#container').scrollStory({
  itemfocus: function(ev, item) {
    // do something
  }
})

// or via events on the container
$('#container').on('itemfocus', function(ev, item){
  // do something
});

```

#### setup
Fired early in instantiation, before any items are added or offsets calculated. Usefull for manipulating the page before ScrollStory does
anything.

```js
$('#container').scrollStory({
  setup: function() {
    // do something
  }
})
```


#### itemfocus
Fired when an item gains 'focus', which can happen from a scroll-based activation (most commonly), or externally via this.index().

```js
$('#container').scrollStory({
  itemfocus: function(ev, item) {
    // do something
  }
})
```

#### itemblur
Fired when an item loses 'focus'.

```js
$('#container').scrollStory({
  itemblur: function(ev, item) {
    // do something
  }
})
```

#### itemfilter
Fired when an item is filtered, which means it is no longer considered when ScrollStory determines which item is currently active. By default, there is no visual change on filter, but you can achive visual changes through this event and css rules.

```js
$('#container').scrollStory({
  itemfilter: function(ev, item) {
    // do something
  }
})
```

#### itemunfilter
Fired when an item is unfiltered.

```js
$('#container').scrollStory({
  itemunfilter: function(ev, item) {
    // do something
  }
})
```

#### itementerviewport
Fired when an item enters the visible portion of the screen. This is useful for triggering things like lazy loads.

```js
$('#container').scrollStory({
  itementerviewport: function(ev, item) {
    // do something
  }
})
```

#### itemexitviewport
Fired when an item leaves the visible portion of the screen.

```js
$('#container').scrollStory({
  itemexitviewport: function(ev, item) {
    // do something
  }
})
```

#### itembuild
Fired when the widget is made aware of an individual item during instantiation. This is a good time to add additional properties to the object. If you're passing in data to build the DOM via the 'content' property, you should append HTML to the item here, as the item hasn't yet been added to the page and the render will be faster.

```js
$('#container').scrollStory({
  itembuild: function(ev, item) {
    item.el.html('<p>My new content!</p>');
  }
})
```

#### categoryfocus
Fired when new active item is in a different category than previously active item.

```js
$('#container').scrollStory({
  categoryfocus: function(ev, category) {
    // do something
  }
})
```


#### containeractive
Fired when the instance changes states from having no active item to an active item. Depending on instantiation options, this may or not be on instantiation.

```js
$('#container').scrollStory({
  containeractive: function() {
    // do something
  }
})
```

#### containerinactive
Fired when the instance changes states from having an active item to not having an active item.

```js
$('#container').scrollStory({
  containerinactive: function() {
    // do something   
  }
})
```

#### containerscroll
Throttled scroll event.

```js
$('#container').scrollStory({
  containerscroll: function() {
    // do something
  }
})
```

#### updateoffsets
Fired after offsets have been updated.

```js
$('#container').scrollStory({
  updateoffsets: function() {
    // do something
  }
})
```

#### triggeroffsetupdate
Fired after a trigger offset as been updated via `.updateTriggerOffset()`

```js
$('#container').scrollStory({
  triggeroffsetupdate: function() {
    // do something
  }
})
```

#### scrolloffsetupdate
Fired after a scroll offset as been updated via `.updateScrollOffset()`

```js
$('#container').scrollStory({
  scrolloffsetupdate: function() {
    // do something
  }
})
```

#### complete
Fired when object's instantiation is complete.

```js
$('#container').scrollStory({
  complete: function() {
    // do something
  }
})
```


### API
ScrollStory exposes many methods for interacting with the instance. 

```js
// save instance object
var scrollStory = $('#container').scrollStory().data('plugin_scrollStory');

// scroll to fourth item
scrollStory.index(3); 


// or access the methods from within the object
$('#container').scrollStory({
  complete: function() {
    this.index(3); // scroll to fourth item
  }
})

```

#### isContainerActive()
Whether or not any of the items are active. If so, the entire widget is considered to be 'active.'

#### updateOffsets()

Update the object's awareness of each item's distance to the trigger. This method is called internally after instantiation and automatically on window resize. It should also be called externally anytime DOM changes affect your items' position on the page, like when filtering changes the size of an element.

#### index([index])
Get or set the current index of the active item. On set, also scroll to that item.

###### Arguments

  * *index:* (optional Number) - The zero-based index you want to activate.

#### next()
Convenience method to navigate to the item after the active one.


#### previous()
Convenience method to navigate to the item before the active one.

#### each(callback)
Iterate over each item, passing the item to a callback.

###### Arguments
* *callback:* Function

```js
this.each(function(item, index){ 
  item.el.append('<h2>'+item.id+'</h2>');
});
```


#### getActiveItem()
The currently active item object.

#### setActiveItem(item, [options, callback])
Given an item object, make it active, including updating its scroll position. 

###### Arguments

  * *item:* Object - The item object to activate
  * *options:* (optional Object) - _scrollToItem options object. TK details.
  * *callback:* (optional Function) - Post-scroll callback

#### getItems()
Return an array of all item objects.

#### getItemsInViewport()
Return an array of all item objects currently visible on the screen.

#### getItemsByCategory(slug)
Return an array of all item objects in the given category.

###### Arguments
* *slug:* String - The category slug

#### getFilteredItems()
Return an array of all item objects whose filtered state has been set to true.

#### getUnfilteredItems()
Return an array of all item objects whose filtered state has been not been set to true.


#### getItemById(id)
Given an <code>item.id</code>, return its data.

###### Arguments
* *id:* String - The item.id for the object you want to retrieve.

#### getItemByIndex(index)
<code>scrollStory.getItemByIndex()</code>:  Given an item's zero-based index, return its data.

###### Arguments
* *index:* Number - Zero-based index for the item object you want to retrieve.



#### getItemsBy(truthTest)
Return an array of item objects that pass an aribitrary truth test.

###### Arguments
* *truthTest:* Function - The function to check all items against

```js
this.getItemsBy(function(item){
  return item.data.slug=='josh_williams';
});
```

#### getItemsWhere(properties)
Returns an array of items where all the properties match an item's properties. Property tests can be any combination of values or truth tests.

###### Arguments

* *properties:* Object 

```js
// Values
this.getItemsWhere({index:2});
this.getItemsWhere({filtered:false});
this.getItemsWhere({category:'cats', width: 300});

// Methods that return a value
this.getItemsWhere({width: function(width){ return 216 + 300;}});

// Methods that return a boolean
this.getItemsWhere({index: function(index){ return index > 2; } });

// Mix and match:
this.getItemsWehre({filtered:false, index: function(index){ return index < 30;} })
```

#### getPreviousItem()
Most recently active item.

#### getPreviousItems()
Sorted array of items that were previously active, with most recently active at the front of the array.

#### getFilteredItems()
Return an array of all filtered items.

#### getUnfilteredItems()
Return an array of all unfiltered items.


#### getLength()
Return the number of items.

#### getCategorySlugs()
Return an array of category slugs.

#### filter(item)
Given an item, change its state to filtered.

###### Arguments

* *item:* Object - item object

#### unfilter(item)
Given an item, change its state to unfiltered.

###### Arguments

* *item:* Object - item object

#### filterBy(truthTest, [callback])
Filter items that pass an abritrary truth test.

###### Arguments
* *truthTest:* Function - The function to check all items against
* *callback:* (optional Function) - Post-filter callback

```js
scrollStory.filterBy(function(item){
    return item.data.slug=='josh_williams';
});
```
#### filterAllItems([callback])
Change all items' state to filtered.

###### Arguments
* *callback:* (optional Function) - Post-filter callback

#### unfilterAllItems([callback])
Change all items' state to unfiltered.

###### Arguments
* *callback:* (optional Function) - Post-filter callback

#### disable()
Disable scroll updates. This is useful in the rare case when you want to manipulate the page but not have ScrollStory continue to check positions, fire events, etc. Usually a `disable` is temporary and followed by an `enable`.

#### enable()
Enable scroll updates.

### Release History
*1.0.0*

* Bump to 1.0 release.

*0.3.8*

* Fixed [Issue 30](https://github.com/sjwilliams/scrollstory/issues/30): Uneeded `undefined` in module setup.
* Fixed [Issue 28](https://github.com/sjwilliams/scrollstory/issues/28): Typo in documentation.

*0.3.7*

* Fixed critical typos in documentation.

*0.3.6*

* Added [PR 27](https://github.com/sjwilliams/scrollstory/pull/27) Calculate item's active scroll percent complete.

*0.3.5*

* Added [PR 26](https://github.com/sjwilliams/scrollstory/pull/26) Optionally to bind to event other than native scroll.

*0.3.4*

* Fixed missing 'index' passed to `.each()` callback that was original added in [Issue 7](https://github.com/sjwilliams/scrollstory/issues/7), but got lost in the 0.3 rewrite.

*0.3.3*

* Added [Issue 24](https://github.com/sjwilliams/scrollstory/issues/24) New `setup` event.

*0.3.2*

* Fixed [Issue 20](https://github.com/sjwilliams/scrollstory/issues/20): Item focus should fire after containeractive.

*0.3.1 - Rewrite/Breaking changes*

* A complete rewrite that drops jQuery UI and Underscore dependencies, removes many methods, standardizes naming and more.

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