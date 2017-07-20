var markx = require('markx');
var env = require('jsdom/lib/old-api.js').env;
var beautify = require('js-beautify').html;

// convert markdown to HTML, and then 
// wrap that html in section tags for
// scrollStory's use
markx({
  input: 'README.md',
  template: 'documentation/index.tmpl'
}, function(err, html) {
  if (err) {
    console.log('something went wrong', err);
  } else {
    env(html, function(err, window){
      var $ = require('jquery')(window);

      $('h2, h1', '.content').each(function(){
        $(this).nextUntil('h2').wrapAll('<section></section>');
        $(this).prependTo($(this).next('section'));
      });

      var html = '<!doctype html>\n' + $('html')[0].outerHTML;
      // console.log(html);
      console.log(beautify(html));
    });
  }
});