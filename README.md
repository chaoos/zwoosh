# swoosh

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

Will be available soon...


There are multiple ways to include swoosh to your project.

## The classic way:

Place it in the `<body>` tag as normal script tag.

```html
<script src='/path/to/swoosh.js'></script>
```

## The Typescript way:

If you work in Typescript you can import the module just by invoking the `import` statement. Notice that the file ending `.ts` is not needed:

```ts
import swoosh from '/path/to/swoosh'
```

Swoosh needs some CSS styles. You can add them by including [`dist/swoosh.css`][5] (or [`dist/swoosh.min.css`][4] for the minified version) in the `<head>` section of your document. 

```html
<link href='/path/to/swoosh.css' rel='stylesheet' type='text/css' />
```

# Usage

Swoosh can be coustomized heavily. Whether you want dragscroll, whellzoom, wheelscroll or a combination of all of them.

Swoosh has to be be invoked separately for every element. An invokation with the default options looks like this (notice that it does not depend whether you call swoosh in Javascript or Typescript):

```js
swoosh(element);
```

This allows the user to dragscroll the content within the provided container `element`. Swoosh does not care whether there is a scrollbar or not. If the contents oversize the size of the element, then the content will be scrollable by Swoosh.

## Options object

You can also provide an `options` object. The following invokation is an example with the default options:

```js
swoosh(element, {
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
    exclude: ['input', 'textarea', 'a', 'button', '.sw-ignore', 'select'],
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

Most options can be change later on, when the object has already initialized. Some of them (those which need event handlers to attach/detach or those which do DOM manipulations) need a reinittialization of the object by [swoosh.reinit()](#swoosh.reinit()).

#### integer `options.gridX` and `options.gridX`

When scrolling, you may want the contents to align to a grid. The grid is calculated in pixels and can be of each size grather than 1. The default values are 1x1, which means not to align to a grid. If `options.gridShow` is set to `true`, a modification of one or both options need a `reinit()` of the object.

#### boolean `options.gridShow`

This is a boolean value, defaulting to `false`. If set to `true` a visible overlay grid is placed over the contents of the Swoosh element, indicating the size of the grid. This will only be visible is one of `options.gridX` or `options.gridX` is set greather than 1.

> This works only if the browser supports CSS Generated content for [pseudo-elements][1]

#### boolean `options.elasticEdges.left`, `.top`, `.right` and `.bottom`

The contents can be extened by elastic edges. When scrolling further than the inner elements size and elastic edges are enabled, you will be able to scroll over the edges. Each edge can be enabled or disabled separately.

#### boolean `options.dragScroll`

Whether to enable or disabled scrolling by dragging with the mouse.

> See `options.dragOptions` for customizations.

#### array `options.dragOptions.exclude`

Defines an array of CSS selectors. All elements inside the Swoosh element are ignored for dragscroll when matching against one of those CSS selectors. Besides the obvious tag elements, like `input`, `textarea` and such (see the default options), there is a CSS class called `sw-ignore`. All elements holding this class, will be ignored for dragscrolling. The array can be extended by more elements.

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

If the options is set to `vertical` and if there are scrollbars present, swoosh will leave scrolling to the browser itself.

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

Defines the minimum scale for an element. If set to `0`, there is no minimum. If the minimum is hit, the element will not zoom further out. **Notice that the contents will not shrink smaller than the size of the swoosh element**.

#### integer `options.zoomOptions.step`

When caculating the new scale value, this options is taken. The calculation is as follows:

> `newScale = oldScale * (1 ± step)`

#### string `options.zoomOptions.direction`

Defines the mouse wheel direction of scrolling to zoom in. This can be set to one of two values:
- `up` which is the default and
- `down`

#### boolean `options.handleAnchors`

When clicking an anchor link whose target resides within a swoosh element, all nesting swoosh elements have to scroll to the correct position to reveal the target to the user. If set to `true`, it lets swoosh handle anchor links targeting to an anchor inside of this swoosh element. Notice that, the element outside (maybe the body) handles anchors too. If you want to prevent this, add to body as swoosh element too.

This behavior can be disabled and thus left to the browser by setting `handleAnchors` to `false`.

> This work only if the browser supports [`history.pushState()`][6]

## Events

There are 4 events triggered from swoosh:

- `collide.left`
- `collide.right`
- `collide.top`
- `collide.bottom`

They trigger when the swoosh element collides with one of the edges. They trigger **once**. That means when scrolling to bottom on the left hand border, the `collide.left` event is triggered only once, not on each step. The element has to leave the edge and collide again to trigger the event again.

## CSS

Swoosh need some CSS classes. Their purpose is quikly explained below:

- `sw-outer` is added to the given container element (the swoosh element). This class **should not be used** to style the container element. Use an own CSS class instead.
- `sw-inner` is the class added to the inner element, which wraps all the content of the swoosh element. 
- `sw-grab` is added to containers whose contents are dragscollable.
- `sw-nograb` is added to containers whose contents are **not** dragscollable.
- `sw-grabbing` is added to the body element, when a dragscroll is in progress.
- `sw-scale` is added to the scale element which is parent of the inner element and child of the container element.
- `sw-fakebody` is added to the element wrapping all body contents. This element is appended afterwards to the body. This only is needed when the body is defined as swoosh element.
- `sw-{random-string}` is a class randomly generated when the swoosh element initializes. It is to uniquely identify a swoosh element.


## Public accessible methods

Some methods are public accessible and can be invoked from outside the object context.

#### `swoosh.scrollTo()`

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

#### `swoosh.scrollBy()`

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

#### `swoosh.scaleTo()`

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

#### `swoosh.scaleBy()`

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

#### `swoosh.on()`

```ts
/**
 * Register a custom event callback
 *
 * @param {string} event - The event name
 * @param {(e: Event) => any} callback - A callback function to execute when the event raises
 * @return {Swoosh} - The Swoosh object instance
 */
public on (event: string, callback: (e: Event) => any): Swoosh
```

#### `swoosh.off()`

```ts
/**
 * Deregister a custom event callback
 *
 * @param {string} event - The event name
 * @param {(e: Event) => any} callback - A callback function to execute when the event raises
 * @return {Swoosh} - The Swoosh object instance
 */
public off (event: string, callback: (e: Event) => any): Swoosh
```

#### `swoosh.reinit()`

```ts
/**
 * Reinitialize the swoosh element
 * 
 * @return {Swoosh} - The Swoosh object instance
 */
public reinit ()
```

#### `swoosh.destroy()`

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
[3]: https://chaoos.github.io/swoosh/
[4]: https://github.com/chaoos/swoosh/blob/master/dist/swoosh.min.css
[5]: https://github.com/chaoos/swoosh/blob/master/dist/swoosh.css
[6]: https://developer.mozilla.org/en-US/docs/Web/API/History_API#The_pushState()_method
