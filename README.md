# Scrollbox

[![Build Status](https://travis-ci.org/Invis1ble/scrollbox.svg?branch=develop)](https://travis-ci.org/Invis1ble/scrollbox)
[![Code Climate](https://codeclimate.com/github/Invis1ble/scrollbox/badges/gpa.svg)](https://codeclimate.com/github/Invis1ble/scrollbox)
![Bower version](https://img.shields.io/bower/v/scrollbox.svg)
[![npm version](https://img.shields.io/npm/v/scrollbox.svg)](https://www.npmjs.com/package/scrollbox)
[![Packagist Prerelease](https://img.shields.io/packagist/v/Invis1ble/scrollbox.svg)](https://packagist.org/packages/Invis1ble/scrollbox)
[![MIT licensed](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

A lightweight jQuery custom scrollbar plugin, that triggers event when reached the defined point.

[Demo Page](https://invis1ble.github.io/scrollbox/)

## Table of contents

- [Browser compatibility](#browser-compatibility)
- [Installation](#installation)
- [Usage](#usage)
- [Basic features](#basic-features)
    - [Options](#options)
    - [Methods](#methods)
    - [Events](#events)
- [Infinite scrolling implementation example](#infinite-scrolling-implementation-example)
- [License](#license)

## Browser compatibility

* IE 7+
* Firefox
* Opera (old and new)
* Safari
* Chrome
* Chrome for Android

... and others.

Scrollbox is automatically tested on the following browsers

[![Sauce Test Status](https://app.saucelabs.com/browser-matrix/Invis1ble.svg)](https://app.saucelabs.com/u/Invis1ble)

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

In order to use the plugin, you have to include styles and script to your html e.g.:

```html
<link href="/path/to/scrollbox.min.css" media="screen" rel="stylesheet" type="text/css">
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

Then you should define `max-height` and/or `max-width` of that element:

```css
#long-content-container {
    max-height: 200px;
    max-width: 200px;
}
```

and initialize Scrollbox:

```js
$('#long-content-container').scrollbox();
```

That's all.
Now if real size of the container is greater than the specified `max-height`/`max-width` then the plugin will add scrollbar to it.

You can stylize scrollbar via `css` or even better by overwriting corresponding `less` variables.
See [src/less/](https://github.com/Invis1ble/scrollbox/tree/master/src/less) for more details.

## Basic features

### Options

Scrollbox uses several options to configuring behavior. The default options are:

```js
{
    distanceToReach: {
        x: 0,
        y: 0
    },
    wheelSensitivity: 20,
    momentum: {
        acceleration: 1600,
        thresholdTime: 500
    },
    startAt: {
        x: 'left',
        y: 'top'
    },
    templates: {
        horizontalBar: '<div></div>',
        verticalBar: '<div></div>',
        horizontalRail: '<div></div>',
        verticalRail: '<div></div>',
        wrapper: '<div></div>'
    }
}
```

You can optionally pass an object containing all of the options that you would like to initialize Scrollbox with e.g.:

```js
$('#long-content-container').scrollbox({
    wheelSensitivity: 25,
    startAt: {
        y: 'bottom'
    }
});
```

or re-define default values for all instances:

```js
$.fn.scrollbox.Constructor.getDefault().distanceToReach.y = 100;
```

#### startAt.x

The initial position of the scroll on x-axis.

The value can be `'left'`, `'right'` or number of pixels from the left boundary.

#### startAt.y

The initial position of the scroll on y-axis.

The value can be `'top'`, `'bottom'` or number of pixels from the top boundary.

#### distanceToReach.x

The distance from the left and right boundaries of the content when `reachleft.scrollbox` and `reachright.scrollbox` events should be triggered.

This option is useful when you want to implement so-called "infinite scrolling".

#### distanceToReach.y

The distance from the top and bottom boundaries of the content when `reachleft.scrollbox` and `reachright.scrollbox` events should be triggered.

This option is useful when you want to implement so-called "infinite scrolling".

#### wheelSensitivity

The distance in pixels for one fixed step of mouse wheel.

You probably shouldn't change this value.

#### momentum.acceleration

Swipe acceleration factor.

#### momentum.thresholdTime

Threshold time in milliseconds for detect inertial moving at swipe.

#### templates

Normally you don't need to change this templates, but you can if you want.

### Methods

You can call some methods of the plugin.

#### .update()

Recalculates scrollbars' positions and sizes.

For example, If you write the infinite scroll implementation you have to update scrollbar position and size after content has been added.
To do this you should simply call `.update()` method:

```js
$('#long-content-container').scrollbox('update');
```

#### .scrollBy(deltaX, deltaY, animationOptions)

Scrolls by pixels.

See [.animate()](https://api.jquery.com/animate/#animate-properties-options) for the available values of the `animationOptions`

Example:

```js
$('#long-content-container').scrollbox('scrollBy', 100, 200);
```

If you want to scroll only on y-axis you can pass `0` as `deltaX` value:

```js
$('#long-content-container').scrollbox('scrollBy', 0, 200);
```

#### .scrollTo(x, y, animationOptions)

Scrolls to specified position.

`x` can be integer (pixels), or string `'left'` or `'right'`.

`y` also can be integer (pixels), or string `'top'` or `'bottom'`.
 
`'left'`, `'right'`, `'top'` and `'bottom'` means the boundaries.

See [.animate()](https://api.jquery.com/animate/#animate-properties-options) for the available values of the `animationOptions`

Example:

```js
$('#long-content-container').scrollbox('scrollTo', 100, 200);
```

If you want to scroll only on y-axis you can pass `undefined` as `x` value:

```js
$('#long-content-container').scrollbox('scrollTo', undefined, 'bottom');
```

#### .destroy()

Completely removes all stuff from the element.

### Events

Scrollbox triggers a several events during lifecycle.

#### reachleft.scrollbox

Triggered when scrolling reach the left boundary of the content. Respects `distanceToReach.x` option.

#### reachright.scrollbox

Triggered when scrolling reach the right boundary of the content. Respects `distanceToReach.x` option.

#### reachtop.scrollbox

Triggered when scrolling reach the top boundary of the content. Respects `distanceToReach.y` option.

#### reachbottom.scrollbox

Triggered when scrolling reach the bottom boundary of the content. Respects `distanceToReach.y` option.

## Infinite scrolling implementation example

```js
var $container = $('#content-container');

$container
    .on('reachbottom.scrollbox', function () {
        $.ajax({
            // options
        }).done(function (response) {
            $container
                .append(response)
                .scrollbox('update');
        });
    })
    .scrollbox({
        distanceToReach: {
            y: 100
        }
    });
```

## License

[The MIT License](./LICENSE)