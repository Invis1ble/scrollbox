# Scrollbox
[![Build Status](https://travis-ci.org/Invis1ble/scrollbox.svg?branch=develop)](https://travis-ci.org/Invis1ble/scrollbox)

A lightweight jQuery custom scrollbar plugin, that triggers event when reached the defined point.

[Demo Page](https://invis1ble.github.io/scrollbox/)

## Browser compatibility

* IE 7+
* Firefox
* Opera (old and new)
* Safari
* Chrome
* Chrome for Android

... and others

Scrollbox is automatically tested on the following browsers

[![Sauce Test Status](https://saucelabs.com/browser-matrix/Invis1ble.svg)](https://saucelabs.com/u/Invis1ble)

## Installation

Several quick start options are available:

* [Download the latest release](https://github.com/Invis1ble/scrollbox/archive/master.zip).
* Clone the repo: `git clone https://github.com/Invis1ble/scrollbox.git`.
* Install with [Bower](http://bower.io): `bower install scrollbox`.
* Install with [npm](https://www.npmjs.com/): `npm install scrollbox`.
* Install with [Composer](https://getcomposer.org): `composer require invis1ble/scrollbox`.

After installing the plugin you have to install [jquery-mousewheel](https://github.com/jquery/jquery-mousewheel).
You can simply [download it as archive](https://github.com/jquery/jquery-mousewheel/archive/master.zip) and unpack to desired location.

## Usage

In order to use the plugin, you have to add `link` tag to your html

```html
<link href="/path/to/scrollbox.min.css" media="screen" rel="stylesheet" type="text/css">
```

and include the scripts e.g.

```html
<script src="//ajax.googleapis.com/ajax/libs/jquery/1.12.4/jquery.min.js"></script>
<script src="/path/to/jquery.mousewheel.min.js" type="text/javascript"></script>
<script src="/path/to/scrollbox.min.js" type="text/javascript"></script>
```

Let's assume that you want to stylize the following element:

```html
<div id="long-content-container">
    Here is a long content
</div>
```

Then you need to define `max-height` of that element:

```css
#long-content-container {
    max-height: 200px;
}
```

and initialize Scrollbox:

```js
$('#long-content-container').scrollbox();
```

That's all. Now if real height of the container is more than the defined `max-height` then the plugin will add scrollbar to it.

You can stylize scrollbar via `css` or even better by overwriting corresponding `less` variables.
See [src/less/](https://github.com/Invis1ble/scrollbox/tree/master/src/less) for more details.

## Basic features

Scrollbox uses several options to configuring behavior. The default options are:

```js
{
    distanceToReach: 0,
    wheelSensitivity: 20,
    momentum: {
        acceleration: 1600,
        thresholdTime: 500
    },
    start: 'top',
    templates: {
        bar: '<div class="scrollbox-bar"></div>',
        rail: '<div class="scrollbox-rail"></div>',
        wrapper: '<div class="scrollbox-wrapper"></div>'
    }
}
```

You can optionally pass an object containing all of the options that you would like to initialize Scrollbox with e.g.

```js
$('#long-content-container').scrollbox({
    wheelSensitivity: 25,
    start: 'bottom'
});
```

or re-define default values for all instances

```js
$.fn.scrollbox.defaults.wheelSensitivity = 25;
```

* `distanceToReach` When scrolling position reaches top or bottom, the plugin triggers event `reach.scrollbox` on element.
Event object passed to handler contains `position` property that may be `top` or `bottom`. This feature is useful when you want
implement so-called "infinite scrolling". `distanceToReach` is the distance in pixels before very top or very bottom when that
events will be emitted.
* `wheelSensitivity` is the distance in pixels for one fixed step of mouse wheel. You probably shouldn't change this value.
* `momentum.acceleration` Swipe acceleration factor. Used for touchscreens.
* `momentum.thresholdTime` Threshold time in milliseconds for detect inertial moving at swipe. Used for touchscreens.
* `start` Start position of scroll. The value can be `top`, `bottom` or number of pixels from the top.
* `templates` Normally you don't need to change this templates, but you can if you want.

Scrollbox also triggers a several events during lifecycle:

* `reach.scrollbox` already has been explained above.
* `init.scrollbox` fires when instance initializes.
* `scroll.scrollbox` - on scroll position changes.

You can also call some methods of the plugin.

For example, if you write infinite scroll implementation you have to update scrollbar position and height after content has been added.
To do this you should simply call `update` method

```js
$('#long-content-container').scrollbox('update');
```

* `update()` already has been explained above.
* `scroll(delta, animationOptions))` scroll by pixels. `$('#long-content-container').scrollbox('scroll', 100)` as example.
See [.animate()](https://api.jquery.com/animate/#animate-properties-options) for the available values of the `animationOptions`
* `jump(y, animationOptions)` scroll to position.
* `destroy()` Call this method when you want to completely destroy instance of Scrollbox.

## License

[MIT](http://www.opensource.org/licenses/mit-license.php)