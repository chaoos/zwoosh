# Zwoosh

> Dragscroll, Wheelzoom and Infinityscroll Javascript and Typescript library

# Demo

Try out the [demo][3]!

# Features

- No dependencies
- Just use it: invokations in Javascript and Typescript are the same
- Dragscroll: use the mouse to scroll oversized content by dragging
- Wheelscroll: scrolling by wheel can be customized too (for example horizontal scroll)
- Wheelzoom: each element can be zoomed by mousewheel
- Anchor links: anchor links are handled too
- Elements can be nested
- There is a grid system, which can be configured

# Install

There are multiple ways to include zwoosh to your project.

----

## NPM

You can get it with NPM:

```shell
npm install zwoosh --save
```

## Bower

You can get it with Bower:

```shell
bower install zwoosh --save
```

## The classic way

If you prefer the good old way. Place it in the `<body>` as normal script tag.

```html
<script src='/path/to/zwoosh.js'></script>
```

Or if you got it with npm:

```html
<script src='node_modules/zwoosh/zwoosh.js'></script>
```

## The require way

If you're using [requireJS][7]:

var zwoosh = require("/path/to/zwoosh");

## The Typescript way

If you work in Typescript you can import the module just by invoking the `import` statement. When importing a module using `export =`, TypeScript-specific `import let = require("module")` must be used to import the module. Notice that the file ending `.ts` is not needed:

```ts
import zwoosh = require("/path/to/zwoosh");
```

## CSS

Zwoosh needs some CSS styles. You can add them by including [`dist/zwoosh.css`][5] (or [`dist/zwoosh.min.css`][4] for the minified version) in the `<head>` section of your document. 

```html
<link href='/path/to/zwoosh.css' rel='stylesheet' type='text/css' />
```

Or if you're using Stylus, you can import them with the `@import` directive

```styl
@import 'node_modules/dragula/dragula'
```

# Usage

Zwoosh can be coustomized heavily. Whether you want dragscroll, whellzoom, wheelscroll or a combination of all of them.

Zwoosh has to be be invoked separately for every element. An invokation with the default options looks like this (notice that it does not depend whether you call zwoosh in Javascript or Typescript):

```js
zwoosh(element);
```

This allows the user to dragscroll the content within the provided container `element`. Zwoosh does not care whether there is a scrollbar or not. If the contents oversize the size of the element, then the content will be scrollable by Zwoosh.

## Options object

You can also provide an `options` object. The following invokation is an example with the default options:

```js
zwoosh(element, {
  gridX: 1,
  gridY: 1,
  elasticEdges: {
    left: false,
    right: false,
    top: false,
    bottom: false,
  },
  dragScroll: true,
  dragOptions: {
    exclude: ['input', 'textarea', 'a', 'button', '.zw-ignore', 'select'],
    only: [],
    fade: true,
    brakeSpeed: 2500,
    fps: 30,
    maxSpeed: 3000,
    minSpeed: 300,
  },
  wheelScroll: true,
  wheelOptions: {
    direction: 'vertical',
    step: 114,
    smooth: true,
  },
  wheelZoom: false,
  zoomOptions: {
    maxScale: 0,
    minScale: 0,
    step: 0.1,
    direction: 'up',
  },
  handleAnchors: true,
  });
```

Most options can be changed later on, when the object has already initialized. Some of them (those which need event handlers to attach/detach or those which do DOM manipulations) need a reinittialization of the object by [zwoosh.reinit()](#zwoosh.reinit()).

#### integer `options.gridX` and `options.gridX`

When scrolling, you may want the contents to align to a grid. The grid is calculated in pixels and can be of each size grather than 1. The default values are 1x1, which means not to align to a grid. If `options.gridShow` is set to `true`, a modification of one or both options need a `reinit()` of the object.

#### boolean `options.gridShow`

This is a boolean value, defaulting to `false`. If set to `true` a visible overlay grid is placed over the contents of the Zwoosh element, indicating the size of the grid. This will only be visible is one of `options.gridX` or `options.gridX` is set greather than 1.

> This works only if the browser supports CSS Generated content for [pseudo-elements][1]

#### boolean `options.elasticEdges.left`, `.top`, `.right` and `.bottom`

The contents can be extened by elastic edges. When scrolling further than the inner elements size and elastic edges are enabled, you will be able to scroll over the edges. Each edge can be enabled or disabled separately.

#### boolean `options.dragScroll`

Whether to enable or disabled scrolling by dragging with the mouse.

> See `options.dragOptions` for customizations.

#### array `options.dragOptions.exclude`

Defines an array of CSS selectors. All elements inside the Zwoosh element are ignored for dragscroll when matching against one of those CSS selectors. Besides the obvious tag elements, like `input`, `textarea` and such (see the default options), there is a CSS class called `zw-ignore`. All elements holding this class, will be ignored for dragscrolling. The array can be extended by more elements.

#### array `options.dragOptions.only`

Defines an array of CSS selectors. Elements matching one of the selectors from the array, will be included for dragscrolling. Every other element will respond to dragscroll. It's the opposite of the `options.dragOptions.exclude` array from above, and can therefore not be used in combination with that.

> This is not implemented yet.

#### boolean `options.dragOptions.fade`

A flag to enable or disable a scroll fade when dragging an element. If set to `false` the scroll element will instantly stop after releasing the mouse buttom. If set to `true`, which is the default, the element will scroll further in the same speed, slowly braking until it stands still or it hits an edge.

#### integer `options.dragOptions.brakeSpeed`

> This options is to customize the fade animation.

This is the amount of pixels/s² to brake the scroll animation. The lower the value, the further the scroll.

#### integer `options.dragOptions.fps`

> This options is to customize the fade animation.

It sets the amount of steps in one second. The more steps, the smoother the animation, but the more CPU power is needed. Don't set this value too high. Values grather than 25 will look as a real motion for the user.

#### integer `options.dragOptions.maxSpeed`

> This options is to customize the fade animation.

This speed in pixels/second will never be exceeded. This is to prevent a scroll animation to be too fast.

#### integer `options.dragOptions.minSpeed`

> This options is to customize the fade animation.

The velocity of the mouse while dragging must exceed this value in pixels/second to trigger a fade animation.

#### boolean `options.wheelScroll`

Whether to enable or disable scroll by mouse wheel.

> See `options.wheelOptions` for customizations.

#### string `options.wheelOptions.direction`

This options defines the direction of scrolling when using the mouse wheel. It can have one if two values:
- `vertical` which is the default and
- `horizontal`

If the options is set to `vertical` and if there are scrollbars present, zwoosh will leave scrolling to the browser itself.

#### integer `options.wheelOptions.step`

The size of one step when scrolling in pixels. `114` is kind of a default value in most browsers. If you want the scroll animation to be faster, increase the value or decrease the value to scroll slower.

#### boolean `options.wheelOptions.smooth`

Whether to scroll smooth or instant.

#### boolean `options.wheelZoom`

Whether to enable or disable zooming by mouse wheel.

> This works only with a [CSS3 2D Transform][2] capable browser.
> See `options.zoomOptions` for customizations.

#### integer `options.zoomOptions.maxScale`

Defines the maximum scale for an element. If set to `0`, there is no maximum. If the maximum is hit, the element will not zoom further in.

#### integer `options.zoomOptions.minScale`

Defines the minimum scale for an element. If set to `0`, there is no minimum. If the minimum is hit, the element will not zoom further out. **Notice that the contents will not shrink smaller than the size of the zwoosh element**.

#### integer `options.zoomOptions.step`

When caculating the new scale value, this options is taken. The calculation is as follows:

> `newScale = oldScale * (1 ± step)`

#### string `options.zoomOptions.direction`

Defines the mouse wheel direction of scrolling to zoom in. This can be set to one of two values:
- `up` which is the default and
- `down`

#### boolean `options.handleAnchors`

When clicking an anchor link whose target resides within a zwoosh element, all nesting zwoosh elements have to scroll to the correct position to reveal the target to the user. If set to `true`, it lets zwoosh handle anchor links targeting to an anchor inside of this zwoosh element. Notice that, the element outside (maybe the body) handles anchors too. If you want to prevent this, add to body as zwoosh element too.

This behavior can be disabled and thus left to the browser by setting `handleAnchors` to `false`.

> This work only if the browser supports [`history.pushState()`][6]

## Events

There are 4 events triggered from zwoosh:

- `collide.left`
- `collide.right`
- `collide.top`
- `collide.bottom`

They trigger when the zwoosh element collides with one of the edges. They trigger **once**. That means when scrolling to bottom on the left hand border, the `collide.left` event is triggered only once, not on each step. The element has to leave the edge and collide again to trigger the event again.

## CSS

Zwoosh needs some CSS classes. Their purpose is quickly explained below:

- `zw-ignore` is the default CSS class on elements in a Zwoosh elment, where dragscroll is ignored. This is set in the array [array `options.dragOptions.exclude`](options.dragOptions.exclude).
- `zw-outer` is added to the given container element (the zwoosh element). This class **should not be used** to style the container element. Use an own CSS class instead.
- `zw-inner` is the class added to the inner element, which wraps all the content of the zwoosh element. 
- `zw-grab` is added to containers whose contents are dragscollable.
- `zw-nograb` is added to containers whose contents are **not** dragscollable.
- `zw-grabbing` is added to the body element, when a dragscroll is in progress.
- `zw-scale` is added to the scale element which is parent of the inner element and child of the container element.
- `zw-fakebody` is added to the element wrapping all body contents. This element is appended afterwards to the body. This only is needed when the body is defined as zwoosh element.
- `zw-{random-string}` is a class randomly generated when the zwoosh element initializes. It is to uniquely identify a zwoosh element.


## Public accessible methods

Some methods are public accessible and can be invoked from outside the object context.

#### `zwoosh.scrollTo()`

```ts
/**
 * scrollTo helper method to scroll to a x- and y-coordinate
 *
 * @param {number} x - x-coordinate to scroll to
 * @param {number} y - y-coordinate to scroll to
 * @param {boolean} smooth - whether to scroll smooth or instant
 * @return {void}
 */
public scrollTo (x: number, y: number, smooth = true)
```

#### `zwoosh.scrollBy()`

```ts
/**
 * scrollBy helper method to scroll by an amount of pixels in x- and y-direction
 *
 * @param {number} x - amount of pixels to scroll in x-direction
 * @param {number} y - amount of pixels to scroll in y-direction
 * @param {boolean} smooth - whether to scroll smooth or instant
 * @return {void}
 */
public scrollBy (x: number, y: number, smooth = true)
```

#### `zwoosh.scaleTo()`

```ts
/**
 * Scales the inner element to an absolute value.
 * 
 * @param {number} scale - the scale
 * @param {boolean} honourLimits - whether to honour maxScale and the minimum width and height
 * of the container element.
 * @return {void}
 */
public scaleTo (scale: number, honourLimits = true)
```

#### `zwoosh.scaleBy()`

```ts
/**
 * Scales the inner element by a relatice value based on the current scale value.
 * 
 * @param {number} percent - percentage of the current scale value
 * @param {boolean} honourLimits - whether to honour maxScale and the minimum width and height
 * of the container element.
 * @return {void}
 */
public scaleBy (percent: number, honourLimits = true)
```

#### `zwoosh.on()`

```ts
/**
 * Register a custom event callback
 *
 * @param {string} event - The event name
 * @param {(e: Event) => any} callback - A callback function to execute when the event raises
 * @return {Zwoosh} - The Zwoosh object instance
 */
public on (event: string, callback: (e: Event) => any): Zwoosh
```

#### `zwoosh.off()`

```ts
/**
 * Deregister a custom event callback
 *
 * @param {string} event - The event name
 * @param {(e: Event) => any} callback - A callback function to execute when the event raises
 * @return {Zwoosh} - The Zwoosh object instance
 */
public off (event: string, callback: (e: Event) => any): Zwoosh
```

#### `zwoosh.reinit()`

```ts
/**
 * Reinitialize the zwoosh element
 * 
 * @return {Zwoosh} - The Zwoosh object instance
 */
public reinit ()
```

#### `zwoosh.destroy()`

```ts
/**
 * Revert all DOM manipulations and deregister all event handlers
 * 
 * @return {void}
 */
public destroy ()
```


# License

MIT

[1]: http://caniuse.com/#search=%3Abefore
[2]: http://caniuse.com/#feat=transforms2d
[3]: https://chaoos.github.io/zwoosh/
[4]: https://github.com/chaoos/zwoosh/blob/master/dist/zwoosh.min.css
[5]: https://github.com/chaoos/zwoosh/blob/master/dist/zwoosh.css
[6]: https://developer.mozilla.org/en-US/docs/Web/API/History_API#The_pushState()_method
[7]: http://requirejs.org/