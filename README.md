# ScrollStory

jQuery UI widget for stacked, scroll-based stories (or items) that need to give focus to a single item at a time.

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
```javascript
('#container').ScrollStory();
```
In its most basic form, ScrollStory takes an element and searches for '.story' child elements. Internally, ScrollStory turns those elements into 'item' objects and assigns them lots of default properities, like its 'index' position in the list, 'topOffset' (point from the top at which is becomes active), it's 'inViewport' status (true or false), and whether it has a custom 'scrollOffet' (or point on page it triggers active, different from the other items). These are covered in detail below.

In addition to object properties, ScrollStory modifies the DOM in a few ways: 
* A class of 'storyScroll_story' is added to every item
* A class of 'active' is added to the currently active item
* A class of 'scrollStory_active' is added to the container if any item is active.

[Demo](http://sjwilliams.github.io/scrollstory/examples/basic.html)

### Options
#### contentSelector
Specify any jQuery selector to find story items within your widget.
```javascript
$('#container').ScrollStory({
    contentSelector: '.mySpecialContent'
});
```

[Demo](http://sjwilliams.github.io/scrollstory/examples/customselector.html)

## Examples
* 
* [Change throttle type](http://sjwilliams.github.io/scrollstory/examples/throttletype.html)
* [Change scroll sensitivity](http://sjwilliams.github.io/scrollstory/examples/scrollsensitivity.html)
* [Programmatically scroll up and down](http://sjwilliams.github.io/scrollstory/examples/scrolltoneighbors.html)
* [Item active event](http://sjwilliams.github.io/scrollstory/examples/activeevent.html)
* [Move the trigger point](http://sjwilliams.github.io/scrollstory/examples/triggeroffset.html)
* [Trigger point behavior: preoffset activation](http://sjwilliams.github.io/scrollstory/examples/preoffsetactivation.html)

## Release History
*0.0.1*

* Initial Release
