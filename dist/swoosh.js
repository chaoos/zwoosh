(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.swoosh = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        var v = factory(require, exports); if (v !== undefined) module.exports = v;
    }
    else if (typeof define === 'function' && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    /**
     * Polyfill bind function for older browsers
     * The bind function is an addition to ECMA-262, 5th edition
     * See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind
     */
    if (!Function.prototype.bind) {
        Function.prototype.bind = function (oThis) {
            if (typeof this !== 'function') {
                // closest thing possible to the ECMAScript 5
                // internal IsCallable function
                throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');
            }
            var aArgs = Array.prototype.slice.call(arguments, 1), fToBind = this, fNOP = function () { }, fBound = function () {
                return fToBind.apply(this instanceof fNOP
                    ? this
                    : oThis, aArgs.concat(Array.prototype.slice.call(arguments)));
            };
            if (this.prototype) {
                // Function.prototype doesn't have a prototype property
                fNOP.prototype = this.prototype;
            }
            fBound.prototype = new fNOP();
            return fBound;
        };
    }
    /**
     * Polyfill array.indexOf function for older browsers
     * The indexOf() function was added to the ECMA-262 standard in the 5th edition
     * as such it may not be present in all browsers.
     * See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/indexOf
     */
    if (!Array.prototype.indexOf) {
        Array.prototype.indexOf = function (searchElement, fromIndex) {
            var k;
            if (this == null) {
                throw new TypeError('"this" is null or not defined');
            }
            var o = Object(this);
            var len = o.length >>> 0;
            if (len === 0) {
                return -1;
            }
            var n = +fromIndex || 0;
            if (Math.abs(n) === Infinity) {
                n = 0;
            }
            if (n >= len) {
                return -1;
            }
            k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);
            while (k < len) {
                if (k in o && o[k] === searchElement) {
                    return k;
                }
                k++;
            }
            return -1;
        };
    }
    /* list of real events */
    var htmlEvents = {
        /* <body> and <frameset> Events */
        onload: 1,
        onunload: 1,
        /* Form Events */
        onblur: 1,
        onchange: 1,
        onfocus: 1,
        onreset: 1,
        onselect: 1,
        onsubmit: 1,
        /* Image Events */
        onabort: 1,
        /* Keyboard Events */
        onkeydown: 1,
        onkeypress: 1,
        onkeyup: 1,
        /* Mouse Events */
        onclick: 1,
        ondblclick: 1,
        onmousedown: 1,
        onmousemove: 1,
        onmouseout: 1,
        onmouseover: 1,
        onmouseup: 1
    };
    var mapEvents = {
        onscroll: window
    };
    /**
     * default export function of the module
     *
     * @param {HTMLElement} container - The HTMLElement to swoooosh!
     * @param {Options} options - the options object to configure Swoosh
     * @return {Swoosh} - Swoosh object instance
     */
    function default_1(container, options) {
        if (options === void 0) { options = {}; }
        var Swoosh = (function () {
            function Swoosh(container, options) {
                this.container = container;
                this.options = options;
                /* CSS style classes */
                this.classInner = 'sw-inner';
                this.classOuter = 'sw-outer';
                this.classGrab = 'sw-grab';
                this.classGrabbing = 'sw-grabbing';
                this.classUnique = 'sw-' + Math.random().toString(36).substring(7);
                this.classScale = 'sw-scale';
                /* array holding the custom events mapping callbacks to bound callbacks */
                this.customEvents = [];
                this.triggered = {
                    collideLeft: false,
                    collideTop: false,
                    collideRight: false,
                    collideBottom: false
                };
                /* fadeOut */
                this.timeouts = [];
                this.container = container;
                /* TODO: make options as a getters/setters: dragScroll, gridShow, wheelScroll, wheelZoom, ee.left,top,right,bottom */
                /* set default options */
                this.options = {
                    /* 1 means do not align to a grid */
                    gridX: 1,
                    gridY: 1,
                    /* shows a grid as an overlay over the element */
                    gridShow: false,
                    /* definition of how many pixels an elastic edge should have */
                    elasticEgdes: {
                        left: 0,
                        right: 0,
                        top: 0,
                        bottom: 0
                    },
                    /* activates/deactivates scroll by dragging the element */
                    dragScroll: true,
                    dragOptions: {
                        exclude: ['input', 'textarea', 'a', 'button', '.sw-ignore'],
                        only: [],
                        /* activates a scroll fade when scrolling by drag */
                        fade: true,
                        /* fade: brake acceleration in pixels per second per second (p/s²) */
                        brakeSpeed: 2500,
                        /* fade: frames per second of the swoosh fadeout animation (>=25 looks like motion) */
                        fps: 30,
                        /* fade: this speed will never be exceeded */
                        maxSpeed: 3000,
                        /* fade: minimum speed which triggers the fade */
                        minSpeed: 500
                    },
                    /* activates/deactivates scrolling by wheel */
                    wheelScroll: true,
                    wheelOptions: {
                        /* direction to scroll when the mouse wheel is used */
                        direction: 'vertical',
                        /* amount of pixels for one scroll step */
                        step: 114,
                        /* scroll smooth or instant */
                        smooth: true
                    },
                    /* activates/deactivates zooming by wheel */
                    wheelZoom: false,
                    zoomOptions: {
                        /* the maximum scale, 0 means to maximum */
                        maxScale: 0,
                        /* the minimum scale, 0 means to minimum */
                        minScale: 0,
                        /* one step when using the wheel to zoom */
                        step: 0.1,
                        /* mouse wheel direction to zoom larger */
                        direction: 'up'
                    }
                };
                /* merge the default option objects with the provided one */
                for (var key in options) {
                    if (options.hasOwnProperty(key)) {
                        if (typeof options[key] == 'object') {
                            for (var okey in options[key]) {
                                if (options[key].hasOwnProperty(okey))
                                    this.options[key][okey] = options[key][okey];
                            }
                        }
                        else {
                            this.options[key] = options[key];
                        }
                    }
                }
                this.init();
            }
            /**
             * Initialize DOM manipulations and event handlers
             *
             * @return {void}
             */
            Swoosh.prototype.init = function () {
                var _this = this;
                this.container.className += " " + this.classOuter + " ";
                this.isBody = this.container.tagName == "BODY" ? true : false;
                this.scrollElement = this.isBody ? document.documentElement : this.container;
                var x = this.scrollElement.scrollLeft + this.options.elasticEgdes.left;
                var y = this.scrollElement.scrollTop + this.options.elasticEgdes.top;
                /* create inner div element and append it to the container with its contents in it */
                this.inner = document.createElement("div");
                //var uniqueClass = this.classInner + "-" + Math.random().toString(36).substring(7);
                this.inner.className += " " + this.classInner + " " + this.classUnique + " ";
                /* TODO: check of wheelZoom 3x */
                if (this.options.wheelZoom == true) {
                    this.scaleElement = document.createElement("div");
                    this.scaleElement.className += " " + this.classScale + " ";
                    this.scaleElement.appendChild(this.inner);
                    var toAppend = this.scaleElement;
                }
                else {
                    var toAppend = this.inner;
                }
                /* move all childNodes to the new inner element */
                while (this.container.childNodes.length > 0) {
                    this.inner.appendChild(this.container.childNodes[0]);
                }
                this.container.appendChild(toAppend);
                this.inner.style.minWidth = (this.container.scrollWidth - this.getBorderWidth(this.container)) + 'px';
                this.inner.style.minHeight = (this.container.scrollHeight - this.getBorderWidth(this.container)) + 'px';
                if (this.options.wheelZoom == true) {
                    this.scaleElement.style.minWidth = this.inner.style.minWidth;
                    this.scaleElement.style.minHeight = this.inner.style.minHeight;
                    this.scaleElement.style.overflow = 'hidden';
                }
                /* show the grid only if at least one of the grid values is not 1 */
                if ((this.options.gridX != 1 || this.options.gridY != 1) && this.options.gridShow) {
                    var bgi = [];
                    this.options.gridX != 1 ? bgi.push('linear-gradient(to right, grey 1px, transparent 1px)') : null;
                    this.options.gridY != 1 ? bgi.push('linear-gradient(to bottom, grey 1px, transparent 1px)') : null;
                    this.addBeforeCSS(this.classUnique, 'width', this.inner.style.minWidth);
                    this.addBeforeCSS(this.classUnique, 'height', this.inner.style.minHeight);
                    this.addBeforeCSS(this.classUnique, 'background-size', (this.options.gridX != 1 ? this.options.gridX + 'px ' : 'auto ') + (this.options.gridY != 1 ? this.options.gridY + 'px' : 'auto'));
                    this.addBeforeCSS(this.classUnique, 'background-image', bgi.join(', '));
                }
                this.oldClientWidth = document.documentElement.clientWidth;
                this.oldClientHeight = document.documentElement.clientHeight;
                this.inner.style.paddingLeft = this.options.elasticEgdes.left + 'px';
                this.inner.style.paddingRight = this.options.elasticEgdes.right + 'px';
                this.inner.style.paddingTop = this.options.elasticEgdes.top + 'px';
                this.inner.style.paddingBottom = this.options.elasticEgdes.bottom + 'px';
                this.scrollTo(x, y, true);
                /* Event handler registration starts here */
                /* TODO: not 2 different event handlers registrations -> do it in this.addEventListener() */
                if (this.options.wheelScroll == false) {
                    this.mouseScrollHandler = function (e) { return _this.disableMouseScroll(e); };
                    //this.scrollElement.onmousewheel = this.mouseScrollHandler;
                    this.addEventListener(this.scrollElement, 'wheel', this.mouseScrollHandler);
                }
                else if (this.options.wheelScroll == true) {
                    this.mouseScrollHandler = function (e) { return _this.activeMouseScroll(e); };
                    //this.scrollElement.onmousewheel = this.mouseScrollHandler;
                    this.addEventListener(this.scrollElement, 'wheel', this.mouseScrollHandler);
                }
                /* wheelzoom */
                if (this.options.wheelZoom == true) {
                    this.scaleTo(1); /* needed, when gridShow is true */
                    this.mouseZoomHandler = function (e) { return _this.activeMouseZoom(e); };
                    this.addEventListener(this.scrollElement, 'wheel', this.mouseZoomHandler);
                }
                /* scrollhandler */
                this.scrollHandler = function (e) { return _this.onScroll(e); };
                this.addEventListener(this.container, 'scroll', this.scrollHandler);
                /* if the scroll element is body, adjust the inner div when resizing */
                if (this.isBody) {
                    this.resizeHandler = function (e) { return _this.onResize(e); }; //TODO: same as above in the wheel handler
                    window.onresize = this.resizeHandler;
                }
                /* if dragscroll is activated, register mousedown event */
                if (this.options.dragScroll == true) {
                    this.container.className += " " + this.classGrab + " ";
                    this.mouseDownHandler = function (e) { return _this.mouseDown(e); };
                    this.addEventListener(this.inner, 'mousedown', this.mouseDownHandler);
                }
            };
            Swoosh.prototype.reinit = function () {
                this.destroy();
                this.init();
            };
            /**
             * Workaround to manipulate :before CSS styles with javascript
             *
             * @param {string} - the CSS class name to alter
             * @param {string} - the CSS property to set
             * @param {string} - the CSS value to set
             * @return {void}
             */
            Swoosh.prototype.addBeforeCSS = function (cssClass, cssProperty, cssValue) {
                if (typeof document.styleSheets[0].insertRule == 'function') {
                    document.styleSheets[0].insertRule('.' + cssClass + '::before { ' + cssProperty + ': ' + cssValue + '}', 0);
                }
                else if (typeof document.styleSheets[0].addRule == 'function') {
                    document.styleSheets[0].addRule('.' + cssClass + '::before', cssProperty + ': ' + cssValue);
                }
            };
            /**
             * Get compute pixel number of the whole width of an elements border
             *
             * @param {HTMLElement} - the HTML element
             * @return {number} - the amount of pixels
             */
            Swoosh.prototype.getBorderWidth = function (el) {
                var bl = this.getStyle(el, 'borderLeftWidth');
                bl = bl == 'thin' ? 1 : bl == 'medium' ? 3 : bl == 'thick' ? 5 : parseInt(bl, 10) != NaN ? parseInt(bl, 10) : 0;
                var br = this.getStyle(el, 'borderRightWidth');
                br = br == 'thin' ? 1 : br == 'medium' ? 3 : br == 'thick' ? 5 : parseInt(br, 10) != NaN ? parseInt(br, 10) : 0;
                var pl = this.getStyle(el, 'paddingLeft');
                pl = pl == 'auto' ? 0 : parseInt(pl, 10) != NaN ? parseInt(pl, 10) : 0;
                var pr = this.getStyle(el, 'paddingRight');
                pr = pr == 'auto' ? 0 : parseInt(pr, 10) != NaN ? parseInt(pr, 10) : 0;
                var ml = this.getStyle(el, 'marginLeft');
                ml = ml == 'auto' ? 0 : parseInt(ml, 10) != NaN ? parseInt(ml, 10) : 0;
                var mr = this.getStyle(el, 'marginRight');
                mr = mr == 'auto' ? 0 : parseInt(mr, 10) != NaN ? parseInt(mr, 10) : 0;
                return (pl + pr + bl + br + ml + mr);
            };
            /**
             * Get compute pixel number of the whole height of an elements border
             *
             * @param {HTMLElement} - the HTML element
             * @return {number} - the amount of pixels
             */
            Swoosh.prototype.getBorderHeight = function (el) {
                var bt = this.getStyle(el, 'borderTopWidth');
                bt = bt == 'thin' ? 1 : bt == 'medium' ? 3 : bt == 'thick' ? 5 : parseInt(bt, 10) != NaN ? parseInt(bt, 10) : 0;
                var bb = this.getStyle(el, 'borderBottomWidth');
                bb = bb == 'thin' ? 1 : bb == 'medium' ? 3 : bb == 'thick' ? 5 : parseInt(bb, 10) != NaN ? parseInt(bb, 10) : 0;
                var pt = this.getStyle(el, 'paddingTop');
                pt = pt == 'auto' ? 0 : parseInt(pt, 10) != NaN ? parseInt(pt, 10) : 0;
                var pb = this.getStyle(el, 'paddingBottom');
                pb = pb == 'auto' ? 0 : parseInt(pb, 10) != NaN ? parseInt(pb, 10) : 0;
                var mt = this.getStyle(el, 'marginTop');
                mt = mt == 'auto' ? 0 : parseInt(mt, 10) != NaN ? parseInt(mt, 10) : 0;
                var mb = this.getStyle(el, 'marginBottom');
                mb = mb == 'auto' ? 0 : parseInt(mb, 10) != NaN ? parseInt(mb, 10) : 0;
                return (pt + pb + bt + bb + mt + mb);
            };
            /**
             * Disables the scroll wheel of the mouse
             *
             * @param {MouseWheelEvent} e - the mouse wheel event
             * @return {void}
             */
            Swoosh.prototype.disableMouseScroll = function (e) {
                if (this.elementBehindCursorIsMe(e.clientX, e.clientY)) {
                    this.clearTimeouts();
                    if (!e) {
                        e = window.event;
                    }
                    e.preventDefault ? e.preventDefault() : (e.returnValue = false);
                    e.returnValue = false;
                }
            };
            /**
             * Determine whether an element has a scrollbar or not
             *
             * @param {HTMLElement} element - the HTMLElement
             * @param {string} direction - determine the vertical or horizontal scrollbar?
             * @return {boolean} - whether the element has scrollbars or not
             */
            Swoosh.prototype.hasScrollbar = function (element, direction) {
                var has = false;
                var overflow = 'overflow';
                if (direction == 'vertical') {
                    overflow = 'overflowY';
                    has = element.scrollHeight > element.clientHeight;
                }
                else if (direction == 'horizontal') {
                    overflow = 'overflowX';
                    has = element.scrollWidth > element.clientWidth;
                }
                // Check the overflow and overflowDirection properties for "auto" and "visible" values
                has = this.getStyle(this.container, 'overflow') == "visible"
                    || this.getStyle(this.container, 'overflowY') == "visible"
                    || (has && this.getStyle(this.container, 'overflow') == "auto")
                    || (has && this.getStyle(this.container, 'overflowY') == "auto");
                return has;
            };
            /**
             * Enables the scroll wheel of the mouse to scroll, specially for divs withour scrollbar
             *
             * @param {MouseWheelEvent} e - the mouse wheel event
             * @return {void}
             */
            Swoosh.prototype.activeMouseScroll = function (e) {
                if (!e) {
                    e = window.event;
                }
                if (this.elementBehindCursorIsMe(e.clientX, e.clientY)) {
                    var direction;
                    if ("deltaY" in e) {
                        direction = e.deltaY > 0 ? 'down' : 'up';
                    }
                    else if ("wheelDelta" in e) {
                        direction = e.wheelDelta > 0 ? 'up' : 'down';
                    }
                    else {
                        return;
                    }
                    /* use the normal scroll, when there are scrollbars and the direction is "vertical" */
                    if (this.options.wheelOptions.direction == 'vertical' && this.hasScrollbar(this.scrollElement, this.options.wheelOptions.direction)) {
                        if (!((this.triggered.collideBottom && direction == 'down') || (this.triggered.collideTop && direction == 'up'))) {
                            this.clearTimeouts();
                            return;
                        }
                    }
                    this.disableMouseScroll(e);
                    var x = this.scrollElement.scrollLeft;
                    var y = this.scrollElement.scrollTop;
                    if (this.options.wheelOptions.direction == 'horizontal') {
                        x = this.scrollElement.scrollLeft + (direction == 'down' ? this.options.wheelOptions.step : this.options.wheelOptions.step * -1);
                    }
                    else if (this.options.wheelOptions.direction == 'vertical') {
                        y = this.scrollElement.scrollTop + (direction == 'down' ? this.options.wheelOptions.step : this.options.wheelOptions.step * -1);
                    }
                    this.scrollTo(x, y);
                }
            };
            /**
             * Enables the scroll wheel of the mouse to zoom
             *
             * @param {MouseWheelEvent} e - the mouse wheel event
             * @return {void}
             */
            Swoosh.prototype.activeMouseZoom = function (e) {
                if (!e) {
                    e = window.event;
                }
                if (this.elementBehindCursorIsMe(e.clientX, e.clientY)) {
                    var direction;
                    if ("deltaY" in e) {
                        direction = e.deltaY > 0 ? 'down' : 'up';
                    }
                    else if ("wheelDelta" in e) {
                        direction = e.wheelDelta > 0 ? 'up' : 'down';
                    }
                    else {
                        return;
                    }
                    if (direction == this.options.zoomOptions.direction) {
                        var scale = this.getScale() * (1 + this.options.zoomOptions.step);
                    }
                    else {
                        var scale = this.getScale() / (1 + this.options.zoomOptions.step);
                    }
                    this.scaleTo(scale);
                }
            };
            /**
             * Calculates the size of the vertical scrollbar.
             *
             * @param {HTMLElement} el - The HTMLElememnt
             * @return {number} - the amount of pixels used by the vertical scrollbar
             */
            Swoosh.prototype.scrollbarWidth = function (el) {
                return el.offsetWidth - el.clientWidth - parseInt(this.getStyle(el, 'borderLeftWidth')) - parseInt(this.getStyle(el, 'borderRightWidth'));
            };
            /**
             * Calculates the size of the horizontal scrollbar.
             *
             * @param {HTMLElement} el - The HTMLElememnt
             * @return {number} - the amount of pixels used by the horizontal scrollbar
             */
            Swoosh.prototype.scrollbarHeight = function (el) {
                return el.offsetHeight - el.clientHeight - parseInt(this.getStyle(el, 'borderTopWidth')) - parseInt(this.getStyle(el, 'borderBottomWidth'));
            };
            /**
             * Retrieves the current scale value or 1 if it is not set.
             *
             * @return {number} - the current scale value
             */
            Swoosh.prototype.getScale = function () {
                if (typeof this.inner.style.transform != 'undefined') {
                    var r = this.inner.style.transform.match(/scale\(([0-9,\.]+)\)/) || [""];
                    return parseFloat(r[1]) || 1;
                }
                return 1;
            };
            /**
             * Scales the inner element by a value based on the current scale value.
             *
             * @param {number} percent - percentage of the current scale value
             * @param {boolean} honourLimits - whether to honour maxScale and the minimum width and height
             * of the container element.
             * @return {void}
             */
            Swoosh.prototype.scaleBy = function (percent, honourLimits) {
                if (honourLimits === void 0) { honourLimits = true; }
                var scale = this.getScale() * (percent / 100);
                this.scaleTo(scale, honourLimits);
            };
            /**
             * Scales the inner element by an absolute value.
             *
             * @param {number} scale - the scale
             * @param {boolean} honourLimits - whether to honour maxScale and the minimum width and height
             * of the container element.
             * @return {void}
             */
            Swoosh.prototype.scaleTo = function (scale, honourLimits) {
                if (honourLimits === void 0) { honourLimits = true; }
                var width = (parseFloat(this.inner.style.minWidth) * scale);
                var height = (parseFloat(this.inner.style.minHeight) * scale);
                /* Scrollbars have width and height too */
                var minWidth = this.container.clientWidth + this.scrollbarWidth(this.container);
                var minHeight = this.container.clientHeight + this.scrollbarHeight(this.container);
                if (honourLimits) {
                    /* loop as long as all limits are honoured */
                    while ((scale > this.options.zoomOptions.maxScale && this.options.zoomOptions.maxScale != 0)
                        || (scale < this.options.zoomOptions.minScale && this.options.zoomOptions.minScale != 0)
                        || (width < this.container.clientWidth && !this.isBody)
                        || height < this.container.clientHeight && !this.isBody) {
                        if (scale > this.options.zoomOptions.maxScale && this.options.zoomOptions.maxScale != 0) {
                            scale = this.options.zoomOptions.maxScale;
                            width = Math.floor(parseInt(this.inner.style.minWidth) * scale);
                            height = Math.floor(parseInt(this.inner.style.minHeight) * scale);
                        }
                        if (scale < this.options.zoomOptions.minScale && this.options.zoomOptions.minScale != 0) {
                            scale = this.options.zoomOptions.minScale;
                            width = Math.floor(parseInt(this.inner.style.minWidth) * scale);
                            height = Math.floor(parseInt(this.inner.style.minHeight) * scale);
                        }
                        if (width < minWidth && !this.isBody) {
                            scale = scale / width * minWidth;
                            height = Math.floor(parseInt(this.inner.style.minHeight) * scale);
                            width = minWidth;
                        }
                        if (height < minHeight && !this.isBody) {
                            scale = scale / height * minHeight;
                            width = Math.floor(parseInt(this.inner.style.minWidth) * scale);
                            height = minHeight;
                        }
                    }
                }
                //console.log("scaleTo(): ", scale, " ----> ", width, " x ", height, " orig: ", this.container.clientWidth, " x ", this.container.clientHeight, " real: ", minWidth, " x ", minHeight);
                this.inner.style.transform = 'translate(0px, 0px) scale(' + scale + ')';
                this.scaleElement.style.minWidth = this.scaleElement.style.width = width + 'px';
                this.scaleElement.style.minHeight = this.scaleElement.style.height = height + 'px';
                /* TODO: here scrollTo based on where the mouse cursor is */
                //this.scrollTo();
            };
            /**
             * Disables the scroll wheel of the mouse
             *
             * @param {number} x - the x-coordinates
             * @param {number} y - the y-coordinates
             * @return {boolean} - whether the nearest related parent inner element is the one of this object instance
             */
            Swoosh.prototype.elementBehindCursorIsMe = function (x, y) {
                var elementBehindCursor = document.elementFromPoint(x, y);
                /**
                 * If the element directly behind the cursor is an outer element throw out, because when clicking on a scrollbar
                 * from a div, a drag of the parent Swoosh element is initiated.
                 */
                var outerRe = new RegExp(" " + this.classOuter + " ");
                if (elementBehindCursor.className.match(outerRe)) {
                    return false;
                }
                /* find the next parent which is an inner element */
                var innerRe = new RegExp(" " + this.classInner + " ");
                while (elementBehindCursor && !elementBehindCursor.className.match(innerRe)) {
                    elementBehindCursor = elementBehindCursor.parentElement;
                }
                return this.inner == elementBehindCursor;
            };
            Swoosh.prototype.getTimestamp = function () {
                if (typeof window.performance == 'object') {
                    return window.performance.now ? window.performance.now() : window.performance.webkitNow();
                }
                else {
                    return new Date().getTime();
                }
            };
            /**
             * Scroll handler to trigger the custom events
             *
             * @param {Event} e - The scroll event object (TODO: needed?)
             * @throws Event collideLeft
             * @throws Event collideRight
             * @throws Event collideTop
             * @throws Event collideBottom
             * @return {void}
             */
            Swoosh.prototype.onScroll = function (e) {
                var x = this.scrollElement.scrollLeft || this.container.scrollLeft;
                var y = this.scrollElement.scrollTop || this.container.scrollTop;
                // the collideLeft event
                if (x == 0) {
                    this.triggered.collideLeft ? null : this.triggerEvent(this.inner, 'collide.left');
                    this.triggered.collideLeft = true;
                }
                else {
                    this.triggered.collideLeft = false;
                }
                // the collideTop event
                if (y == 0) {
                    this.triggered.collideTop ? null : this.triggerEvent(this.inner, 'collide.top');
                    this.triggered.collideTop = true;
                }
                else {
                    this.triggered.collideTop = false;
                }
                // the collideRight event
                if (x == this.scrollMaxLeft) {
                    this.triggered.collideRight ? null : this.triggerEvent(this.inner, 'collide.right');
                    this.triggered.collideRight = true;
                }
                else {
                    this.triggered.collideRight = false;
                }
                // the collideBottom event
                if (y == this.scrollMaxTop) {
                    this.triggered.collideBottom ? null : this.triggerEvent(this.inner, 'collide.bottom');
                    this.triggered.collideBottom = true;
                }
                else {
                    this.triggered.collideBottom = false;
                }
            };
            /**
             * window resize handler to recalculate the inner div minWidth and minHeight
             *
             * @param {Event} e - The window resize event object (TODO: needed?)
             * @return {void}
             */
            Swoosh.prototype.onResize = function (e) {
                var _this = this;
                var onResize = function () {
                    _this.inner.style.minWidth = null;
                    _this.inner.style.minHeight = null;
                    /* take away the margin values of the body element */
                    var xDelta = parseInt(_this.getStyle(document.body, 'marginLeft'), 10) + parseInt(_this.getStyle(document.body, 'marginRight'), 10);
                    var yDelta = parseInt(_this.getStyle(document.body, 'marginTop'), 10) + parseInt(_this.getStyle(document.body, 'marginBottom'), 10);
                    //TODO: with this.getBorderWidth() and this.getBorderHeight()
                    _this.inner.style.minWidth = (document.documentElement.scrollWidth - xDelta) + 'px';
                    _this.inner.style.minHeight = (document.documentElement.scrollHeight - yDelta - 100) + 'px'; //TODO: WTF? why -100 for IE8?
                };
                /**
                 * Trigger the function only when the clientWidth or clientHeight really have changed.
                 * IE8 resides in an infinity loop always triggering the resite event when altering css.
                 */
                if (this.oldClientWidth != document.documentElement.clientWidth || this.oldClientHeight != document.documentElement.clientHeight) {
                    window.clearTimeout(this.resizeTimeout);
                    this.resizeTimeout = window.setTimeout(onResize, 10);
                }
                /* write down the old clientWidth and clientHeight for the above comparsion */
                this.oldClientWidth = document.documentElement.clientWidth;
                this.oldClientHeight = document.documentElement.clientHeight;
            };
            Swoosh.prototype.clearTextSelection = function () {
                if (window.getSelection)
                    window.getSelection().removeAllRanges();
                if (document.selection)
                    document.selection.empty();
            };
            /**
             * Browser independent event registration
             *
             * @param {HTMLElement} obj - The HTMLElement to attach the event to
             * @param {string} event - The event name without the leading "on"
             * @param {(e: Event) => void} callback - A callback function to attach to the event
             * @return {void}
             */
            Swoosh.prototype.addEventListener = function (obj, event, callback) {
                var boundCallback = callback.bind(this);
                if (typeof obj.addEventListener == 'function') {
                    if (mapEvents['on' + event] && obj.tagName == "BODY") {
                        obj = mapEvents['on' + event];
                    }
                    obj.addEventListener(event, boundCallback);
                }
                else if (typeof obj.attachEvent == 'object' && htmlEvents['on' + event]) {
                    obj.attachEvent('on' + event, boundCallback);
                }
                else if (typeof obj.attachEvent == 'object' && mapEvents['on' + event]) {
                    if (obj.tagName == "BODY") {
                        var p = 'on' + event;
                        /* example: window.onscroll = boundCallback */
                        mapEvents[p][p] = boundCallback;
                    }
                    else {
                        /* TODO: obj.onscroll ?? */
                        obj.onscroll = boundCallback;
                    }
                }
                else if (typeof obj.attachEvent == 'object') {
                    obj[event] = 1;
                    boundCallback = function (e) {
                        /* TODO: e is the onpropertychange event not one of the custom event objects */
                        if (e.propertyName == event) {
                            callback(e);
                        }
                    };
                    obj.attachEvent('onpropertychange', boundCallback);
                }
                else {
                    obj['on' + event] = boundCallback;
                }
                this.customEvents[event] ? null : (this.customEvents[event] = []);
                this.customEvents[event].push([callback, boundCallback]);
            };
            /**
             * Browser independent event deregistration
             *
             * @param {HTMLElement} obj - The HTMLElement whose event should be detached
             * @param {string} event - The event name without the leading "on"
             * @param {(e: Event) => void} callback - The callback function when attached
             * @return {void}
             *
             * @TODO: unregistering of mapEvents
             */
            Swoosh.prototype.removeEventListener = function (obj, event, callback) {
                if (event in this.customEvents) {
                    for (var i in this.customEvents[event]) {
                        /* if the event was found in the array by its callback reference */
                        if (this.customEvents[event][i][0] == callback) {
                            /* remove the listener from the array by its bound callback reference */
                            callback = this.customEvents[event][i][1];
                            this.customEvents[event].splice(i, 1);
                            break;
                        }
                    }
                }
                if (typeof obj.removeEventListener == 'function') {
                    obj.removeEventListener(event, callback);
                }
                else if (typeof obj.detachEvent == 'object' && htmlEvents['on' + event]) {
                    obj.detachEvent('on' + event, callback);
                }
                else if (typeof obj.detachEvent == 'object') {
                    obj.detachEvent('onpropertychange', callback);
                }
                else {
                    obj['on' + event] = null;
                }
            };
            /**
             * Browser independent event trigger function
             *
             * @param {HTMLElement} obj - The HTMLElement which triggers the event
             * @param {string} eventName - The event name without the leading "on"
             * @return {void}
             */
            Swoosh.prototype.triggerEvent = function (obj, eventName) {
                var event;
                if (typeof window.CustomEvent === 'function') {
                    event = new CustomEvent(eventName);
                }
                else if (typeof document.createEvent == 'function') {
                    event = document.createEvent("HTMLEvents");
                    event.initEvent(eventName, true, true);
                }
                else if (document.createEventObject) {
                    event = document.createEventObject();
                    event.eventType = eventName;
                }
                event.eventName = eventName;
                if (obj.dispatchEvent) {
                    obj.dispatchEvent(event);
                }
                else if (obj[eventName]) {
                    obj[eventName]++;
                }
                else if (obj.fireEvent && htmlEvents['on' + eventName]) {
                    obj.fireEvent('on' + event.eventType, event);
                }
                else if (obj[eventName]) {
                    obj[eventName]();
                }
                else if (obj['on' + eventName]) {
                    obj['on' + eventName]();
                }
            };
            /**
             * Get a css style property value browser independent
             *
             * @param {HTMLElement} el - The HTMLElement to lookup
             * @param {string} jsProperty - The css property name in javascript in camelCase (e.g. "marginLeft", not "margin-left")
             * @return {string} - the property value
             */
            Swoosh.prototype.getStyle = function (el, jsProperty) {
                var cssProperty = jsProperty.replace(/([A-Z])/g, "-$1").toLowerCase();
                if (typeof window.getComputedStyle == 'function') {
                    return window.getComputedStyle(el).getPropertyValue(cssProperty);
                }
                else {
                    return el.currentStyle[jsProperty];
                }
            };
            Swoosh.prototype.clearTimeouts = function () {
                if (this.timeouts) {
                    for (var idx in this.timeouts) {
                        clearTimeout(this.timeouts[idx]);
                    }
                    if (this.timeouts.length > 0) {
                        this.timeouts = [];
                        this.removeEventListener(this.inner, 'collide.left', this.clearListenerLeft);
                        this.removeEventListener(this.inner, 'collide.right', this.clearListenerRight);
                        this.removeEventListener(this.inner, 'collide.top', this.clearListenerTop);
                        this.removeEventListener(this.inner, 'collide.bottom', this.clearListenerBottom);
                    }
                }
            };
            /**
             * Mouse down handler
             * Registers the mousemove and mouseup handlers and finds the next inner element
             *
             * @param {MouseEvent} e - The mouse down event object
             * @return {void}
             */
            Swoosh.prototype.mouseDown = function (e) {
                var _this = this;
                this.clearTimeouts();
                /* drag only if the left mouse button was pressed */
                if (("which" in e && e.which == 1) || (typeof e.which == 'undefined' && "button" in e && e.button == 1)) {
                    if (this.elementBehindCursorIsMe(e.clientX, e.clientY)) {
                        /* prevent image dragging action */
                        var imgs = this.container.querySelectorAll('img');
                        for (var i = 0; i < imgs.length; i++) {
                            imgs[i].ondragstart = function () { return false; }; //MSIE
                        }
                        /* search the DOM for exclude elements */
                        if (this.options.dragOptions.exclude.length != 0) {
                            /* drag only if the mouse clicked on an allowed element */
                            var el = document.elementFromPoint(e.clientX, e.clientY);
                            var excludeElements = this.container.querySelectorAll(this.options.dragOptions.exclude.join(', '));
                            /* loop through all parent elements until we encounter an inner div or no more parents */
                            var innerRe = new RegExp(" " + this.classInner + " ");
                            while (el && !el.className.match(innerRe)) {
                                /* compare each parent, if it is in the exclude list */
                                for (var i = 0; i < excludeElements.length; i++) {
                                    /* bail out if an element matches */
                                    if (excludeElements[i] == el) {
                                        return;
                                    }
                                    ;
                                }
                                el = el.parentElement;
                            }
                        }
                        // search the DOM for only elements, but only if there are elements set
                        /*if (this.options.dragOptions.only.length != 0){
                          var onlyElements = this.container.querySelectorAll(this.options.dragOptions.only.join(', '));
                          // loop through the nodelist and check for our element
                          var found = false;
                          for (var i = 0; i < excludeElements.length; i++) {
                            if (onlyElements[i] == el) {
                              found = true;
                              break;
                            }
                          }
                          if (found == false) {
                            return;
                          }
                        }*/
                        this.inner.className += " " + this.classGrabbing + " ";
                        /* note the origin positions */
                        this.dragOriginLeft = e.clientX;
                        this.dragOriginTop = e.clientY;
                        this.dragOriginScrollLeft = this.scrollElement.scrollLeft;
                        this.dragOriginScrollTop = this.scrollElement.scrollTop;
                        /* it looks strange if scroll-behavior is set to smooth */
                        this.parentOriginStyle = this.inner.parentElement.style.cssText;
                        if (typeof this.inner.parentElement.style.setProperty == 'function') {
                            this.inner.parentElement.style.setProperty('scroll-behavior', 'auto');
                        }
                        /* register the event handlers */
                        this.mouseMoveHandler = this.mouseMove.bind(this);
                        this.addEventListener(document.documentElement, 'mousemove', this.mouseMoveHandler);
                        this.mouseUpHandler = function (e) { return _this.mouseUp(e); };
                        this.addEventListener(document.documentElement, 'mouseup', this.mouseUpHandler);
                    }
                }
            };
            /**
             * Mouse up handler
             * Deregisters the mousemove and mouseup handlers
             *
             * @param {MouseEvent} e - The mouse up event object
             * @return {void}
             */
            Swoosh.prototype.mouseUp = function (e) {
                var x = this.getRealX(this.dragOriginLeft + this.dragOriginScrollLeft - e.clientX);
                var y = this.getRealY(this.dragOriginTop + this.dragOriginScrollTop - e.clientY);
                var re = new RegExp(" " + this.classGrabbing + " ");
                this.inner.className = this.inner.className.replace(re, '');
                this.inner.parentElement.style.cssText = this.parentOriginStyle;
                if (y != this.scrollElement.scrollTop || x != this.scrollElement.scrollLeft) {
                    this.scrollTo(x, y, true);
                }
                this.removeEventListener(document.documentElement, 'mousemove', this.mouseMoveHandler);
                this.removeEventListener(document.documentElement, 'mouseup', this.mouseUpHandler);
                if (this.options.dragOptions.fade && typeof this.vx != 'undefined' && typeof this.vy != 'undefined') {
                    /* v should not exceed vMax or -vMax -> would be too fast and should exceed vMin or -vMin */
                    var vMax = this.options.dragOptions.maxSpeed;
                    var vMin = this.options.dragOptions.minSpeed;
                    var vx = this.vx;
                    var vy = this.vy;
                    if (vy < vMin && vy > -vMin && vx < vMin && vx > -vMin) {
                        return;
                    }
                    var vx = (vx <= vMax && vx >= -vMax) ? vx : (vx > 0 ? vMax : -vMax);
                    var vy = (vy <= vMax && vy >= -vMax) ? vy : (vy > 0 ? vMax : -vMax);
                    var ax = (vx > 0 ? -1 : 1) * this.options.dragOptions.brakeSpeed;
                    var ay = (vy > 0 ? -1 : 1) * this.options.dragOptions.brakeSpeed;
                    x = ((0 - Math.pow(vx, 2)) / (2 * ax)) + this.scrollElement.scrollLeft;
                    y = ((0 - Math.pow(vy, 2)) / (2 * ay)) + this.scrollElement.scrollTop;
                    this.fadeOutByCoords(x, y);
                }
            };
            Swoosh.prototype.getRealX = function (x) {
                //stick the element to the grid, if grid equals 1 the value does not change
                x = Math.round(x / (this.options.gridX * this.getScale())) * (this.options.gridX * this.getScale());
                var scrollMaxLeft = (this.scrollElement.scrollWidth - this.scrollElement.clientWidth) - this.options.elasticEgdes.right;
                return (x > scrollMaxLeft) ? scrollMaxLeft : (x < this.options.elasticEgdes.left) ? this.options.elasticEgdes.left : x;
            };
            Swoosh.prototype.getRealY = function (y) {
                //stick the element to the grid, if grid equals 1 the value does not change
                y = Math.round(y / (this.options.gridY * this.getScale())) * (this.options.gridY * this.getScale());
                var scrollMaxTop = (this.scrollElement.scrollHeight - this.scrollElement.clientHeight) - this.options.elasticEgdes.bottom;
                return (y > scrollMaxTop) ? scrollMaxTop : (y < this.options.elasticEgdes.top) ? this.options.elasticEgdes.top : y;
            };
            Swoosh.prototype.fadeOutByVelocity = function (vx, vy) {
                /* TODO: calc v here and with more info, more precisely */
                var _this = this;
                /* calculate the brake acceleration in both directions separately */
                var ay = (vy > 0 ? -1 : 1) * this.options.dragOptions.brakeSpeed;
                var ax = (vx > 0 ? -1 : 1) * this.options.dragOptions.brakeSpeed;
                /* find the direction that needs longer to stop, and recalculate the acceleration */
                var tmax = Math.max((0 - vy) / ay, (0 - vx) / ax);
                ax = (0 - vx) / tmax;
                ay = (0 - vy) / tmax;
                var fps = this.options.dragOptions.fps;
                for (var i = 0; i < ((tmax * fps) + (0 / fps)); i++) {
                    var t = ((i + 1) / fps);
                    var sy = this.scrollElement.scrollTop + (vy * t) + (0.5 * ay * t * t);
                    var sx = this.scrollElement.scrollLeft + (vx * t) + (0.5 * ax * t * t);
                    this.timeouts.push(setTimeout((function (x, y, el) {
                        return function () {
                            el.scrollTop = y;
                            el.scrollLeft = x;
                        };
                    })(sx, sy, this.scrollElement), (i + 1) * (1000 / fps)));
                }
                /* round the last step based on the direction of the fade */
                sx = vx > 0 ? Math.ceil(sx) : Math.floor(sx);
                sy = vy > 0 ? Math.ceil(sy) : Math.floor(sy);
                this.timeouts.push(setTimeout((function (x, y, el) {
                    return function () {
                        el.scrollTop = y;
                        el.scrollLeft = x;
                    };
                })(sx, sy, this.scrollElement), (i + 2) * (1000 / fps)));
                /* stop the animation when colliding with the borders */
                this.clearListenerLeft = function () { return _this.clearTimeouts; };
                this.clearListenerRight = function () { return _this.clearTimeouts; };
                this.clearListenerTop = function () { return _this.clearTimeouts; };
                this.clearListenerBottom = function () { return _this.clearTimeouts; };
                this.addEventListener(this.inner, 'collide.left', this.clearListenerLeft);
                this.addEventListener(this.inner, 'collide.right', this.clearListenerRight);
                this.addEventListener(this.inner, 'collide.top', this.clearListenerTop);
                this.addEventListener(this.inner, 'collide.bottom', this.clearListenerBottom);
            };
            Swoosh.prototype.fadeOutByCoords = function (x, y) {
                x = this.getRealX(x);
                y = this.getRealY(y);
                var a = this.options.dragOptions.brakeSpeed * -1;
                var vy = 0 - (2 * a * (y - this.scrollElement.scrollTop));
                var vx = 0 - (2 * a * (x - this.scrollElement.scrollLeft));
                vy = (vy > 0 ? 1 : -1) * Math.sqrt(Math.abs(vy));
                vx = (vx > 0 ? 1 : -1) * Math.sqrt(Math.abs(vx));
                var sx = x - this.scrollElement.scrollLeft;
                var sy = y - this.scrollElement.scrollTop;
                if (Math.abs(sy) > Math.abs(sx)) {
                    vx = (vx > 0 ? 1 : -1) * Math.abs((sx / sy) * vy);
                }
                else {
                    vy = (vy > 0 ? 1 : -1) * Math.abs((sy / sx) * vx);
                }
                this.clearTimeouts;
                this.fadeOutByVelocity(vx, vy);
            };
            /**
             * Mouse move handler
             * Calcucates the x and y deltas and scrolls
             *
             * @param {MouseEvent} e - The mouse move event object
             * @return {void}
             */
            Swoosh.prototype.mouseMove = function (e) {
                this.clearTextSelection();
                /* if the mouse left the window and the button is not pressed anymore, abort moving */
                if ((e.buttons == 0 && e.button == 0) || (typeof e.buttons == 'undefined' && e.button == 0)) {
                    this.mouseUp(e);
                    return;
                }
                var x = this.dragOriginLeft + this.dragOriginScrollLeft - e.clientX;
                var y = this.dragOriginTop + this.dragOriginScrollTop - e.clientY;
                /*  calculate speed */
                this.present = (this.getTimestamp() / 1000); //in seconds
                var t = this.present - (this.past ? this.past : this.present);
                var sx = x - (this.pastX ? this.pastX : x);
                var sy = y - (this.pastY ? this.pastY : y);
                this.vx = t == 0 ? 0 : sx / t;
                this.vy = t == 0 ? 0 : sy / t;
                this.past = this.present;
                this.pastX = x;
                this.pastY = y;
                this.scrollTo(x, y);
            };
            Swoosh.prototype.scrollBy = function (x, y, smooth) {
                if (smooth === void 0) { smooth = false; }
                var absoluteX = this.scrollElement.scrollLeft + x;
                var absoluteY = this.scrollElement.scrollTop + y;
                this.scrollTo(absoluteX, absoluteY, smooth);
            };
            /**
             * scrollTo helper method
             *
             * @param {number} x - x-coordinate to scroll to
             * @param {number} y - y-coordinate to scroll to
             * @return {void}
             */
            Swoosh.prototype.scrollTo = function (x, y, smooth) {
                if (smooth === void 0) { smooth = false; }
                this.scrollMaxLeft = (this.scrollElement.scrollWidth - this.scrollElement.clientWidth);
                this.scrollMaxTop = (this.scrollElement.scrollHeight - this.scrollElement.clientHeight);
                /* no negative values or greater than the maximum */
                var x = (x > this.scrollMaxLeft) ? this.scrollMaxLeft : (x < 0) ? 0 : x;
                var y = (y > this.scrollMaxTop) ? this.scrollMaxTop : (y < 0) ? 0 : y;
                /* remember the old values */
                this.originScrollLeft = this.scrollElement.scrollLeft;
                this.originScrollTop = this.scrollElement.scrollTop;
                if (this.options.wheelOptions.smooth != true || smooth == false) {
                    this.scrollElement.scrollTop = y;
                    this.scrollElement.scrollLeft = x;
                }
                else {
                    this.fadeOutByCoords(x, y);
                }
            };
            /**
             * Register custom event callbacks
             *
             * @param {string} event - The event name
             * @param {(e: Event) => any} callback - A callback function to execute when the event raises
             * @return {Swoosh} - The Swoosh object instance
             */
            Swoosh.prototype.on = function (event, callback) {
                this.addEventListener(this.inner, event, callback);
                return this;
            };
            /**
             * Deregister custom event callbacks
             *
             * @param {string} event - The event name
             * @param {(e: Event) => any} callback - A callback function to execute when the event raises
             * @return {Swoosh} - The Swoosh object instance
             */
            Swoosh.prototype.off = function (event, callback) {
                this.removeEventListener(this.inner, event, callback);
                return this;
            };
            /**
             * Revert all DOM manipulation and deregister all event handlers
             *
             * @return {void}
             */
            Swoosh.prototype.destroy = function () {
                var x = this.scrollElement.scrollLeft - this.options.elasticEgdes.left;
                var y = this.scrollElement.scrollTop - this.options.elasticEgdes.top;
                /* remove the outer and grab CSS classes */
                var re = new RegExp(" " + this.classOuter + " ");
                this.container.className = this.container.className.replace(re, '');
                var re = new RegExp(" " + this.classGrab + " ");
                this.container.className = this.container.className.replace(re, '');
                /* move all childNodes back to the old outer element and remove the inner element */
                while (this.inner.childNodes.length > 0) {
                    this.container.appendChild(this.inner.childNodes[0]);
                }
                this.container.removeChild(this.inner);
                this.scrollTo(x, y);
                this.mouseMoveHandler ? this.removeEventListener(document.documentElement, 'mousemove', this.mouseMoveHandler) : null;
                this.mouseUpHandler ? this.removeEventListener(document.documentElement, 'mouseup', this.mouseUpHandler) : null;
                this.mouseDownHandler ? this.removeEventListener(this.inner, 'mousedown', this.mouseDownHandler) : null;
                this.mouseScrollHandler ? this.removeEventListener(this.scrollElement, 'wheel', this.mouseScrollHandler) : null;
                this.scrollElement ? this.scrollElement.onmousewheel = null : null;
                this.scrollElement ? this.scrollElement.onscroll = null : null;
                window.onresize = null;
                return;
            };
            return Swoosh;
        }());
        /* return an instance of the class */
        return new Swoosh(container, options);
    }
    exports.__esModule = true;
    exports["default"] = default_1;
});

},{}]},{},[1])(1)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzd29vc2guanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIihmdW5jdGlvbiAoZmFjdG9yeSkge1xuICAgIGlmICh0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlLmV4cG9ydHMgPT09ICdvYmplY3QnKSB7XG4gICAgICAgIHZhciB2ID0gZmFjdG9yeShyZXF1aXJlLCBleHBvcnRzKTsgaWYgKHYgIT09IHVuZGVmaW5lZCkgbW9kdWxlLmV4cG9ydHMgPSB2O1xuICAgIH1cbiAgICBlbHNlIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICAgICAgZGVmaW5lKFtcInJlcXVpcmVcIiwgXCJleHBvcnRzXCJdLCBmYWN0b3J5KTtcbiAgICB9XG59KShmdW5jdGlvbiAocmVxdWlyZSwgZXhwb3J0cykge1xuICAgIFwidXNlIHN0cmljdFwiO1xuICAgIC8qKlxuICAgICAqIFBvbHlmaWxsIGJpbmQgZnVuY3Rpb24gZm9yIG9sZGVyIGJyb3dzZXJzXG4gICAgICogVGhlIGJpbmQgZnVuY3Rpb24gaXMgYW4gYWRkaXRpb24gdG8gRUNNQS0yNjIsIDV0aCBlZGl0aW9uXG4gICAgICogU2VlOiBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9HbG9iYWxfT2JqZWN0cy9GdW5jdGlvbi9iaW5kXG4gICAgICovXG4gICAgaWYgKCFGdW5jdGlvbi5wcm90b3R5cGUuYmluZCkge1xuICAgICAgICBGdW5jdGlvbi5wcm90b3R5cGUuYmluZCA9IGZ1bmN0aW9uIChvVGhpcykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiB0aGlzICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgLy8gY2xvc2VzdCB0aGluZyBwb3NzaWJsZSB0byB0aGUgRUNNQVNjcmlwdCA1XG4gICAgICAgICAgICAgICAgLy8gaW50ZXJuYWwgSXNDYWxsYWJsZSBmdW5jdGlvblxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0Z1bmN0aW9uLnByb3RvdHlwZS5iaW5kIC0gd2hhdCBpcyB0cnlpbmcgdG8gYmUgYm91bmQgaXMgbm90IGNhbGxhYmxlJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgYUFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpLCBmVG9CaW5kID0gdGhpcywgZk5PUCA9IGZ1bmN0aW9uICgpIHsgfSwgZkJvdW5kID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmVG9CaW5kLmFwcGx5KHRoaXMgaW5zdGFuY2VvZiBmTk9QXG4gICAgICAgICAgICAgICAgICAgID8gdGhpc1xuICAgICAgICAgICAgICAgICAgICA6IG9UaGlzLCBhQXJncy5jb25jYXQoQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKSkpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGlmICh0aGlzLnByb3RvdHlwZSkge1xuICAgICAgICAgICAgICAgIC8vIEZ1bmN0aW9uLnByb3RvdHlwZSBkb2Vzbid0IGhhdmUgYSBwcm90b3R5cGUgcHJvcGVydHlcbiAgICAgICAgICAgICAgICBmTk9QLnByb3RvdHlwZSA9IHRoaXMucHJvdG90eXBlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZkJvdW5kLnByb3RvdHlwZSA9IG5ldyBmTk9QKCk7XG4gICAgICAgICAgICByZXR1cm4gZkJvdW5kO1xuICAgICAgICB9O1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBQb2x5ZmlsbCBhcnJheS5pbmRleE9mIGZ1bmN0aW9uIGZvciBvbGRlciBicm93c2Vyc1xuICAgICAqIFRoZSBpbmRleE9mKCkgZnVuY3Rpb24gd2FzIGFkZGVkIHRvIHRoZSBFQ01BLTI2MiBzdGFuZGFyZCBpbiB0aGUgNXRoIGVkaXRpb25cbiAgICAgKiBhcyBzdWNoIGl0IG1heSBub3QgYmUgcHJlc2VudCBpbiBhbGwgYnJvd3NlcnMuXG4gICAgICogU2VlIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0phdmFTY3JpcHQvUmVmZXJlbmNlL0dsb2JhbF9PYmplY3RzL0FycmF5L2luZGV4T2ZcbiAgICAgKi9cbiAgICBpZiAoIUFycmF5LnByb3RvdHlwZS5pbmRleE9mKSB7XG4gICAgICAgIEFycmF5LnByb3RvdHlwZS5pbmRleE9mID0gZnVuY3Rpb24gKHNlYXJjaEVsZW1lbnQsIGZyb21JbmRleCkge1xuICAgICAgICAgICAgdmFyIGs7XG4gICAgICAgICAgICBpZiAodGhpcyA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignXCJ0aGlzXCIgaXMgbnVsbCBvciBub3QgZGVmaW5lZCcpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIG8gPSBPYmplY3QodGhpcyk7XG4gICAgICAgICAgICB2YXIgbGVuID0gby5sZW5ndGggPj4+IDA7XG4gICAgICAgICAgICBpZiAobGVuID09PSAwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIG4gPSArZnJvbUluZGV4IHx8IDA7XG4gICAgICAgICAgICBpZiAoTWF0aC5hYnMobikgPT09IEluZmluaXR5KSB7XG4gICAgICAgICAgICAgICAgbiA9IDA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAobiA+PSBsZW4pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBrID0gTWF0aC5tYXgobiA+PSAwID8gbiA6IGxlbiAtIE1hdGguYWJzKG4pLCAwKTtcbiAgICAgICAgICAgIHdoaWxlIChrIDwgbGVuKSB7XG4gICAgICAgICAgICAgICAgaWYgKGsgaW4gbyAmJiBvW2tdID09PSBzZWFyY2hFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBrKys7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgIH07XG4gICAgfVxuICAgIC8qIGxpc3Qgb2YgcmVhbCBldmVudHMgKi9cbiAgICB2YXIgaHRtbEV2ZW50cyA9IHtcbiAgICAgICAgLyogPGJvZHk+IGFuZCA8ZnJhbWVzZXQ+IEV2ZW50cyAqL1xuICAgICAgICBvbmxvYWQ6IDEsXG4gICAgICAgIG9udW5sb2FkOiAxLFxuICAgICAgICAvKiBGb3JtIEV2ZW50cyAqL1xuICAgICAgICBvbmJsdXI6IDEsXG4gICAgICAgIG9uY2hhbmdlOiAxLFxuICAgICAgICBvbmZvY3VzOiAxLFxuICAgICAgICBvbnJlc2V0OiAxLFxuICAgICAgICBvbnNlbGVjdDogMSxcbiAgICAgICAgb25zdWJtaXQ6IDEsXG4gICAgICAgIC8qIEltYWdlIEV2ZW50cyAqL1xuICAgICAgICBvbmFib3J0OiAxLFxuICAgICAgICAvKiBLZXlib2FyZCBFdmVudHMgKi9cbiAgICAgICAgb25rZXlkb3duOiAxLFxuICAgICAgICBvbmtleXByZXNzOiAxLFxuICAgICAgICBvbmtleXVwOiAxLFxuICAgICAgICAvKiBNb3VzZSBFdmVudHMgKi9cbiAgICAgICAgb25jbGljazogMSxcbiAgICAgICAgb25kYmxjbGljazogMSxcbiAgICAgICAgb25tb3VzZWRvd246IDEsXG4gICAgICAgIG9ubW91c2Vtb3ZlOiAxLFxuICAgICAgICBvbm1vdXNlb3V0OiAxLFxuICAgICAgICBvbm1vdXNlb3ZlcjogMSxcbiAgICAgICAgb25tb3VzZXVwOiAxXG4gICAgfTtcbiAgICB2YXIgbWFwRXZlbnRzID0ge1xuICAgICAgICBvbnNjcm9sbDogd2luZG93XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBkZWZhdWx0IGV4cG9ydCBmdW5jdGlvbiBvZiB0aGUgbW9kdWxlXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBjb250YWluZXIgLSBUaGUgSFRNTEVsZW1lbnQgdG8gc3dvb29vc2ghXG4gICAgICogQHBhcmFtIHtPcHRpb25zfSBvcHRpb25zIC0gdGhlIG9wdGlvbnMgb2JqZWN0IHRvIGNvbmZpZ3VyZSBTd29vc2hcbiAgICAgKiBAcmV0dXJuIHtTd29vc2h9IC0gU3dvb3NoIG9iamVjdCBpbnN0YW5jZVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGRlZmF1bHRfMShjb250YWluZXIsIG9wdGlvbnMpIHtcbiAgICAgICAgaWYgKG9wdGlvbnMgPT09IHZvaWQgMCkgeyBvcHRpb25zID0ge307IH1cbiAgICAgICAgdmFyIFN3b29zaCA9IChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBmdW5jdGlvbiBTd29vc2goY29udGFpbmVyLCBvcHRpb25zKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jb250YWluZXIgPSBjb250YWluZXI7XG4gICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcbiAgICAgICAgICAgICAgICAvKiBDU1Mgc3R5bGUgY2xhc3NlcyAqL1xuICAgICAgICAgICAgICAgIHRoaXMuY2xhc3NJbm5lciA9ICdzdy1pbm5lcic7XG4gICAgICAgICAgICAgICAgdGhpcy5jbGFzc091dGVyID0gJ3N3LW91dGVyJztcbiAgICAgICAgICAgICAgICB0aGlzLmNsYXNzR3JhYiA9ICdzdy1ncmFiJztcbiAgICAgICAgICAgICAgICB0aGlzLmNsYXNzR3JhYmJpbmcgPSAnc3ctZ3JhYmJpbmcnO1xuICAgICAgICAgICAgICAgIHRoaXMuY2xhc3NVbmlxdWUgPSAnc3ctJyArIE1hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpLnN1YnN0cmluZyg3KTtcbiAgICAgICAgICAgICAgICB0aGlzLmNsYXNzU2NhbGUgPSAnc3ctc2NhbGUnO1xuICAgICAgICAgICAgICAgIC8qIGFycmF5IGhvbGRpbmcgdGhlIGN1c3RvbSBldmVudHMgbWFwcGluZyBjYWxsYmFja3MgdG8gYm91bmQgY2FsbGJhY2tzICovXG4gICAgICAgICAgICAgICAgdGhpcy5jdXN0b21FdmVudHMgPSBbXTtcbiAgICAgICAgICAgICAgICB0aGlzLnRyaWdnZXJlZCA9IHtcbiAgICAgICAgICAgICAgICAgICAgY29sbGlkZUxlZnQ6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBjb2xsaWRlVG9wOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgY29sbGlkZVJpZ2h0OiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgY29sbGlkZUJvdHRvbTogZmFsc2VcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIC8qIGZhZGVPdXQgKi9cbiAgICAgICAgICAgICAgICB0aGlzLnRpbWVvdXRzID0gW107XG4gICAgICAgICAgICAgICAgdGhpcy5jb250YWluZXIgPSBjb250YWluZXI7XG4gICAgICAgICAgICAgICAgLyogVE9ETzogbWFrZSBvcHRpb25zIGFzIGEgZ2V0dGVycy9zZXR0ZXJzOiBkcmFnU2Nyb2xsLCBncmlkU2hvdywgd2hlZWxTY3JvbGwsIHdoZWVsWm9vbSwgZWUubGVmdCx0b3AscmlnaHQsYm90dG9tICovXG4gICAgICAgICAgICAgICAgLyogc2V0IGRlZmF1bHQgb3B0aW9ucyAqL1xuICAgICAgICAgICAgICAgIHRoaXMub3B0aW9ucyA9IHtcbiAgICAgICAgICAgICAgICAgICAgLyogMSBtZWFucyBkbyBub3QgYWxpZ24gdG8gYSBncmlkICovXG4gICAgICAgICAgICAgICAgICAgIGdyaWRYOiAxLFxuICAgICAgICAgICAgICAgICAgICBncmlkWTogMSxcbiAgICAgICAgICAgICAgICAgICAgLyogc2hvd3MgYSBncmlkIGFzIGFuIG92ZXJsYXkgb3ZlciB0aGUgZWxlbWVudCAqL1xuICAgICAgICAgICAgICAgICAgICBncmlkU2hvdzogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIC8qIGRlZmluaXRpb24gb2YgaG93IG1hbnkgcGl4ZWxzIGFuIGVsYXN0aWMgZWRnZSBzaG91bGQgaGF2ZSAqL1xuICAgICAgICAgICAgICAgICAgICBlbGFzdGljRWdkZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxlZnQ6IDAsXG4gICAgICAgICAgICAgICAgICAgICAgICByaWdodDogMCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvcDogMCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGJvdHRvbTogMFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAvKiBhY3RpdmF0ZXMvZGVhY3RpdmF0ZXMgc2Nyb2xsIGJ5IGRyYWdnaW5nIHRoZSBlbGVtZW50ICovXG4gICAgICAgICAgICAgICAgICAgIGRyYWdTY3JvbGw6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIGRyYWdPcHRpb25zOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBleGNsdWRlOiBbJ2lucHV0JywgJ3RleHRhcmVhJywgJ2EnLCAnYnV0dG9uJywgJy5zdy1pZ25vcmUnXSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG9ubHk6IFtdLFxuICAgICAgICAgICAgICAgICAgICAgICAgLyogYWN0aXZhdGVzIGEgc2Nyb2xsIGZhZGUgd2hlbiBzY3JvbGxpbmcgYnkgZHJhZyAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgZmFkZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIGZhZGU6IGJyYWtlIGFjY2VsZXJhdGlvbiBpbiBwaXhlbHMgcGVyIHNlY29uZCBwZXIgc2Vjb25kIChwL3PCsikgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIGJyYWtlU3BlZWQ6IDI1MDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBmYWRlOiBmcmFtZXMgcGVyIHNlY29uZCBvZiB0aGUgc3dvb3NoIGZhZGVvdXQgYW5pbWF0aW9uICg+PTI1IGxvb2tzIGxpa2UgbW90aW9uKSAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgZnBzOiAzMCxcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIGZhZGU6IHRoaXMgc3BlZWQgd2lsbCBuZXZlciBiZSBleGNlZWRlZCAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgbWF4U3BlZWQ6IDMwMDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBmYWRlOiBtaW5pbXVtIHNwZWVkIHdoaWNoIHRyaWdnZXJzIHRoZSBmYWRlICovXG4gICAgICAgICAgICAgICAgICAgICAgICBtaW5TcGVlZDogNTAwXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIC8qIGFjdGl2YXRlcy9kZWFjdGl2YXRlcyBzY3JvbGxpbmcgYnkgd2hlZWwgKi9cbiAgICAgICAgICAgICAgICAgICAgd2hlZWxTY3JvbGw6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIHdoZWVsT3B0aW9uczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgLyogZGlyZWN0aW9uIHRvIHNjcm9sbCB3aGVuIHRoZSBtb3VzZSB3aGVlbCBpcyB1c2VkICovXG4gICAgICAgICAgICAgICAgICAgICAgICBkaXJlY3Rpb246ICd2ZXJ0aWNhbCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBhbW91bnQgb2YgcGl4ZWxzIGZvciBvbmUgc2Nyb2xsIHN0ZXAgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIHN0ZXA6IDExNCxcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIHNjcm9sbCBzbW9vdGggb3IgaW5zdGFudCAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgc21vb3RoOiB0cnVlXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIC8qIGFjdGl2YXRlcy9kZWFjdGl2YXRlcyB6b29taW5nIGJ5IHdoZWVsICovXG4gICAgICAgICAgICAgICAgICAgIHdoZWVsWm9vbTogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIHpvb21PcHRpb25zOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvKiB0aGUgbWF4aW11bSBzY2FsZSwgMCBtZWFucyB0byBtYXhpbXVtICovXG4gICAgICAgICAgICAgICAgICAgICAgICBtYXhTY2FsZTogMCxcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIHRoZSBtaW5pbXVtIHNjYWxlLCAwIG1lYW5zIHRvIG1pbmltdW0gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIG1pblNjYWxlOiAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgLyogb25lIHN0ZXAgd2hlbiB1c2luZyB0aGUgd2hlZWwgdG8gem9vbSAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RlcDogMC4xLFxuICAgICAgICAgICAgICAgICAgICAgICAgLyogbW91c2Ugd2hlZWwgZGlyZWN0aW9uIHRvIHpvb20gbGFyZ2VyICovXG4gICAgICAgICAgICAgICAgICAgICAgICBkaXJlY3Rpb246ICd1cCdcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgLyogbWVyZ2UgdGhlIGRlZmF1bHQgb3B0aW9uIG9iamVjdHMgd2l0aCB0aGUgcHJvdmlkZWQgb25lICovXG4gICAgICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIG9wdGlvbnMpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zW2tleV0gPT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBva2V5IGluIG9wdGlvbnNba2V5XSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAob3B0aW9uc1trZXldLmhhc093blByb3BlcnR5KG9rZXkpKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zW2tleV1bb2tleV0gPSBvcHRpb25zW2tleV1bb2tleV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zW2tleV0gPSBvcHRpb25zW2tleV07XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5pbml0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEluaXRpYWxpemUgRE9NIG1hbmlwdWxhdGlvbnMgYW5kIGV2ZW50IGhhbmRsZXJzXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQHJldHVybiB7dm9pZH1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgU3dvb3NoLnByb3RvdHlwZS5pbml0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgICAgICAgICAgdGhpcy5jb250YWluZXIuY2xhc3NOYW1lICs9IFwiIFwiICsgdGhpcy5jbGFzc091dGVyICsgXCIgXCI7XG4gICAgICAgICAgICAgICAgdGhpcy5pc0JvZHkgPSB0aGlzLmNvbnRhaW5lci50YWdOYW1lID09IFwiQk9EWVwiID8gdHJ1ZSA6IGZhbHNlO1xuICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsRWxlbWVudCA9IHRoaXMuaXNCb2R5ID8gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50IDogdGhpcy5jb250YWluZXI7XG4gICAgICAgICAgICAgICAgdmFyIHggPSB0aGlzLnNjcm9sbEVsZW1lbnQuc2Nyb2xsTGVmdCArIHRoaXMub3B0aW9ucy5lbGFzdGljRWdkZXMubGVmdDtcbiAgICAgICAgICAgICAgICB2YXIgeSA9IHRoaXMuc2Nyb2xsRWxlbWVudC5zY3JvbGxUb3AgKyB0aGlzLm9wdGlvbnMuZWxhc3RpY0VnZGVzLnRvcDtcbiAgICAgICAgICAgICAgICAvKiBjcmVhdGUgaW5uZXIgZGl2IGVsZW1lbnQgYW5kIGFwcGVuZCBpdCB0byB0aGUgY29udGFpbmVyIHdpdGggaXRzIGNvbnRlbnRzIGluIGl0ICovXG4gICAgICAgICAgICAgICAgdGhpcy5pbm5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICAgICAgICAgICAgLy92YXIgdW5pcXVlQ2xhc3MgPSB0aGlzLmNsYXNzSW5uZXIgKyBcIi1cIiArIE1hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpLnN1YnN0cmluZyg3KTtcbiAgICAgICAgICAgICAgICB0aGlzLmlubmVyLmNsYXNzTmFtZSArPSBcIiBcIiArIHRoaXMuY2xhc3NJbm5lciArIFwiIFwiICsgdGhpcy5jbGFzc1VuaXF1ZSArIFwiIFwiO1xuICAgICAgICAgICAgICAgIC8qIFRPRE86IGNoZWNrIG9mIHdoZWVsWm9vbSAzeCAqL1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMud2hlZWxab29tID09IHRydWUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zY2FsZUVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNjYWxlRWxlbWVudC5jbGFzc05hbWUgKz0gXCIgXCIgKyB0aGlzLmNsYXNzU2NhbGUgKyBcIiBcIjtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zY2FsZUVsZW1lbnQuYXBwZW5kQ2hpbGQodGhpcy5pbm5lcik7XG4gICAgICAgICAgICAgICAgICAgIHZhciB0b0FwcGVuZCA9IHRoaXMuc2NhbGVFbGVtZW50O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRvQXBwZW5kID0gdGhpcy5pbm5lcjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLyogbW92ZSBhbGwgY2hpbGROb2RlcyB0byB0aGUgbmV3IGlubmVyIGVsZW1lbnQgKi9cbiAgICAgICAgICAgICAgICB3aGlsZSAodGhpcy5jb250YWluZXIuY2hpbGROb2Rlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaW5uZXIuYXBwZW5kQ2hpbGQodGhpcy5jb250YWluZXIuY2hpbGROb2Rlc1swXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuY29udGFpbmVyLmFwcGVuZENoaWxkKHRvQXBwZW5kKTtcbiAgICAgICAgICAgICAgICB0aGlzLmlubmVyLnN0eWxlLm1pbldpZHRoID0gKHRoaXMuY29udGFpbmVyLnNjcm9sbFdpZHRoIC0gdGhpcy5nZXRCb3JkZXJXaWR0aCh0aGlzLmNvbnRhaW5lcikpICsgJ3B4JztcbiAgICAgICAgICAgICAgICB0aGlzLmlubmVyLnN0eWxlLm1pbkhlaWdodCA9ICh0aGlzLmNvbnRhaW5lci5zY3JvbGxIZWlnaHQgLSB0aGlzLmdldEJvcmRlcldpZHRoKHRoaXMuY29udGFpbmVyKSkgKyAncHgnO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMud2hlZWxab29tID09IHRydWUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zY2FsZUVsZW1lbnQuc3R5bGUubWluV2lkdGggPSB0aGlzLmlubmVyLnN0eWxlLm1pbldpZHRoO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNjYWxlRWxlbWVudC5zdHlsZS5taW5IZWlnaHQgPSB0aGlzLmlubmVyLnN0eWxlLm1pbkhlaWdodDtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zY2FsZUVsZW1lbnQuc3R5bGUub3ZlcmZsb3cgPSAnaGlkZGVuJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLyogc2hvdyB0aGUgZ3JpZCBvbmx5IGlmIGF0IGxlYXN0IG9uZSBvZiB0aGUgZ3JpZCB2YWx1ZXMgaXMgbm90IDEgKi9cbiAgICAgICAgICAgICAgICBpZiAoKHRoaXMub3B0aW9ucy5ncmlkWCAhPSAxIHx8IHRoaXMub3B0aW9ucy5ncmlkWSAhPSAxKSAmJiB0aGlzLm9wdGlvbnMuZ3JpZFNob3cpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGJnaSA9IFtdO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMuZ3JpZFggIT0gMSA/IGJnaS5wdXNoKCdsaW5lYXItZ3JhZGllbnQodG8gcmlnaHQsIGdyZXkgMXB4LCB0cmFuc3BhcmVudCAxcHgpJykgOiBudWxsO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMuZ3JpZFkgIT0gMSA/IGJnaS5wdXNoKCdsaW5lYXItZ3JhZGllbnQodG8gYm90dG9tLCBncmV5IDFweCwgdHJhbnNwYXJlbnQgMXB4KScpIDogbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGRCZWZvcmVDU1ModGhpcy5jbGFzc1VuaXF1ZSwgJ3dpZHRoJywgdGhpcy5pbm5lci5zdHlsZS5taW5XaWR0aCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkQmVmb3JlQ1NTKHRoaXMuY2xhc3NVbmlxdWUsICdoZWlnaHQnLCB0aGlzLmlubmVyLnN0eWxlLm1pbkhlaWdodCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkQmVmb3JlQ1NTKHRoaXMuY2xhc3NVbmlxdWUsICdiYWNrZ3JvdW5kLXNpemUnLCAodGhpcy5vcHRpb25zLmdyaWRYICE9IDEgPyB0aGlzLm9wdGlvbnMuZ3JpZFggKyAncHggJyA6ICdhdXRvICcpICsgKHRoaXMub3B0aW9ucy5ncmlkWSAhPSAxID8gdGhpcy5vcHRpb25zLmdyaWRZICsgJ3B4JyA6ICdhdXRvJykpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZEJlZm9yZUNTUyh0aGlzLmNsYXNzVW5pcXVlLCAnYmFja2dyb3VuZC1pbWFnZScsIGJnaS5qb2luKCcsICcpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5vbGRDbGllbnRXaWR0aCA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRXaWR0aDtcbiAgICAgICAgICAgICAgICB0aGlzLm9sZENsaWVudEhlaWdodCA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRIZWlnaHQ7XG4gICAgICAgICAgICAgICAgdGhpcy5pbm5lci5zdHlsZS5wYWRkaW5nTGVmdCA9IHRoaXMub3B0aW9ucy5lbGFzdGljRWdkZXMubGVmdCArICdweCc7XG4gICAgICAgICAgICAgICAgdGhpcy5pbm5lci5zdHlsZS5wYWRkaW5nUmlnaHQgPSB0aGlzLm9wdGlvbnMuZWxhc3RpY0VnZGVzLnJpZ2h0ICsgJ3B4JztcbiAgICAgICAgICAgICAgICB0aGlzLmlubmVyLnN0eWxlLnBhZGRpbmdUb3AgPSB0aGlzLm9wdGlvbnMuZWxhc3RpY0VnZGVzLnRvcCArICdweCc7XG4gICAgICAgICAgICAgICAgdGhpcy5pbm5lci5zdHlsZS5wYWRkaW5nQm90dG9tID0gdGhpcy5vcHRpb25zLmVsYXN0aWNFZ2Rlcy5ib3R0b20gKyAncHgnO1xuICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsVG8oeCwgeSwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgLyogRXZlbnQgaGFuZGxlciByZWdpc3RyYXRpb24gc3RhcnRzIGhlcmUgKi9cbiAgICAgICAgICAgICAgICAvKiBUT0RPOiBub3QgMiBkaWZmZXJlbnQgZXZlbnQgaGFuZGxlcnMgcmVnaXN0cmF0aW9ucyAtPiBkbyBpdCBpbiB0aGlzLmFkZEV2ZW50TGlzdGVuZXIoKSAqL1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMud2hlZWxTY3JvbGwgPT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5tb3VzZVNjcm9sbEhhbmRsZXIgPSBmdW5jdGlvbiAoZSkgeyByZXR1cm4gX3RoaXMuZGlzYWJsZU1vdXNlU2Nyb2xsKGUpOyB9O1xuICAgICAgICAgICAgICAgICAgICAvL3RoaXMuc2Nyb2xsRWxlbWVudC5vbm1vdXNld2hlZWwgPSB0aGlzLm1vdXNlU2Nyb2xsSGFuZGxlcjtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKHRoaXMuc2Nyb2xsRWxlbWVudCwgJ3doZWVsJywgdGhpcy5tb3VzZVNjcm9sbEhhbmRsZXIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmICh0aGlzLm9wdGlvbnMud2hlZWxTY3JvbGwgPT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm1vdXNlU2Nyb2xsSGFuZGxlciA9IGZ1bmN0aW9uIChlKSB7IHJldHVybiBfdGhpcy5hY3RpdmVNb3VzZVNjcm9sbChlKTsgfTtcbiAgICAgICAgICAgICAgICAgICAgLy90aGlzLnNjcm9sbEVsZW1lbnQub25tb3VzZXdoZWVsID0gdGhpcy5tb3VzZVNjcm9sbEhhbmRsZXI7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcih0aGlzLnNjcm9sbEVsZW1lbnQsICd3aGVlbCcsIHRoaXMubW91c2VTY3JvbGxIYW5kbGVyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLyogd2hlZWx6b29tICovXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy53aGVlbFpvb20gPT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNjYWxlVG8oMSk7IC8qIG5lZWRlZCwgd2hlbiBncmlkU2hvdyBpcyB0cnVlICovXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubW91c2Vab29tSGFuZGxlciA9IGZ1bmN0aW9uIChlKSB7IHJldHVybiBfdGhpcy5hY3RpdmVNb3VzZVpvb20oZSk7IH07XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcih0aGlzLnNjcm9sbEVsZW1lbnQsICd3aGVlbCcsIHRoaXMubW91c2Vab29tSGFuZGxlcik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8qIHNjcm9sbGhhbmRsZXIgKi9cbiAgICAgICAgICAgICAgICB0aGlzLnNjcm9sbEhhbmRsZXIgPSBmdW5jdGlvbiAoZSkgeyByZXR1cm4gX3RoaXMub25TY3JvbGwoZSk7IH07XG4gICAgICAgICAgICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKHRoaXMuY29udGFpbmVyLCAnc2Nyb2xsJywgdGhpcy5zY3JvbGxIYW5kbGVyKTtcbiAgICAgICAgICAgICAgICAvKiBpZiB0aGUgc2Nyb2xsIGVsZW1lbnQgaXMgYm9keSwgYWRqdXN0IHRoZSBpbm5lciBkaXYgd2hlbiByZXNpemluZyAqL1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmlzQm9keSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnJlc2l6ZUhhbmRsZXIgPSBmdW5jdGlvbiAoZSkgeyByZXR1cm4gX3RoaXMub25SZXNpemUoZSk7IH07IC8vVE9ETzogc2FtZSBhcyBhYm92ZSBpbiB0aGUgd2hlZWwgaGFuZGxlclxuICAgICAgICAgICAgICAgICAgICB3aW5kb3cub25yZXNpemUgPSB0aGlzLnJlc2l6ZUhhbmRsZXI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8qIGlmIGRyYWdzY3JvbGwgaXMgYWN0aXZhdGVkLCByZWdpc3RlciBtb3VzZWRvd24gZXZlbnQgKi9cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLmRyYWdTY3JvbGwgPT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmNvbnRhaW5lci5jbGFzc05hbWUgKz0gXCIgXCIgKyB0aGlzLmNsYXNzR3JhYiArIFwiIFwiO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm1vdXNlRG93bkhhbmRsZXIgPSBmdW5jdGlvbiAoZSkgeyByZXR1cm4gX3RoaXMubW91c2VEb3duKGUpOyB9O1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIodGhpcy5pbm5lciwgJ21vdXNlZG93bicsIHRoaXMubW91c2VEb3duSGFuZGxlcik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIFN3b29zaC5wcm90b3R5cGUucmVpbml0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHRoaXMuZGVzdHJveSgpO1xuICAgICAgICAgICAgICAgIHRoaXMuaW5pdCgpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogV29ya2Fyb3VuZCB0byBtYW5pcHVsYXRlIDpiZWZvcmUgQ1NTIHN0eWxlcyB3aXRoIGphdmFzY3JpcHRcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gLSB0aGUgQ1NTIGNsYXNzIG5hbWUgdG8gYWx0ZXJcbiAgICAgICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSAtIHRoZSBDU1MgcHJvcGVydHkgdG8gc2V0XG4gICAgICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gLSB0aGUgQ1NTIHZhbHVlIHRvIHNldFxuICAgICAgICAgICAgICogQHJldHVybiB7dm9pZH1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgU3dvb3NoLnByb3RvdHlwZS5hZGRCZWZvcmVDU1MgPSBmdW5jdGlvbiAoY3NzQ2xhc3MsIGNzc1Byb3BlcnR5LCBjc3NWYWx1ZSkge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgZG9jdW1lbnQuc3R5bGVTaGVldHNbMF0uaW5zZXJ0UnVsZSA9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgIGRvY3VtZW50LnN0eWxlU2hlZXRzWzBdLmluc2VydFJ1bGUoJy4nICsgY3NzQ2xhc3MgKyAnOjpiZWZvcmUgeyAnICsgY3NzUHJvcGVydHkgKyAnOiAnICsgY3NzVmFsdWUgKyAnfScsIDApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmICh0eXBlb2YgZG9jdW1lbnQuc3R5bGVTaGVldHNbMF0uYWRkUnVsZSA9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgIGRvY3VtZW50LnN0eWxlU2hlZXRzWzBdLmFkZFJ1bGUoJy4nICsgY3NzQ2xhc3MgKyAnOjpiZWZvcmUnLCBjc3NQcm9wZXJ0eSArICc6ICcgKyBjc3NWYWx1ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogR2V0IGNvbXB1dGUgcGl4ZWwgbnVtYmVyIG9mIHRoZSB3aG9sZSB3aWR0aCBvZiBhbiBlbGVtZW50cyBib3JkZXJcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSAtIHRoZSBIVE1MIGVsZW1lbnRcbiAgICAgICAgICAgICAqIEByZXR1cm4ge251bWJlcn0gLSB0aGUgYW1vdW50IG9mIHBpeGVsc1xuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBTd29vc2gucHJvdG90eXBlLmdldEJvcmRlcldpZHRoID0gZnVuY3Rpb24gKGVsKSB7XG4gICAgICAgICAgICAgICAgdmFyIGJsID0gdGhpcy5nZXRTdHlsZShlbCwgJ2JvcmRlckxlZnRXaWR0aCcpO1xuICAgICAgICAgICAgICAgIGJsID0gYmwgPT0gJ3RoaW4nID8gMSA6IGJsID09ICdtZWRpdW0nID8gMyA6IGJsID09ICd0aGljaycgPyA1IDogcGFyc2VJbnQoYmwsIDEwKSAhPSBOYU4gPyBwYXJzZUludChibCwgMTApIDogMDtcbiAgICAgICAgICAgICAgICB2YXIgYnIgPSB0aGlzLmdldFN0eWxlKGVsLCAnYm9yZGVyUmlnaHRXaWR0aCcpO1xuICAgICAgICAgICAgICAgIGJyID0gYnIgPT0gJ3RoaW4nID8gMSA6IGJyID09ICdtZWRpdW0nID8gMyA6IGJyID09ICd0aGljaycgPyA1IDogcGFyc2VJbnQoYnIsIDEwKSAhPSBOYU4gPyBwYXJzZUludChiciwgMTApIDogMDtcbiAgICAgICAgICAgICAgICB2YXIgcGwgPSB0aGlzLmdldFN0eWxlKGVsLCAncGFkZGluZ0xlZnQnKTtcbiAgICAgICAgICAgICAgICBwbCA9IHBsID09ICdhdXRvJyA/IDAgOiBwYXJzZUludChwbCwgMTApICE9IE5hTiA/IHBhcnNlSW50KHBsLCAxMCkgOiAwO1xuICAgICAgICAgICAgICAgIHZhciBwciA9IHRoaXMuZ2V0U3R5bGUoZWwsICdwYWRkaW5nUmlnaHQnKTtcbiAgICAgICAgICAgICAgICBwciA9IHByID09ICdhdXRvJyA/IDAgOiBwYXJzZUludChwciwgMTApICE9IE5hTiA/IHBhcnNlSW50KHByLCAxMCkgOiAwO1xuICAgICAgICAgICAgICAgIHZhciBtbCA9IHRoaXMuZ2V0U3R5bGUoZWwsICdtYXJnaW5MZWZ0Jyk7XG4gICAgICAgICAgICAgICAgbWwgPSBtbCA9PSAnYXV0bycgPyAwIDogcGFyc2VJbnQobWwsIDEwKSAhPSBOYU4gPyBwYXJzZUludChtbCwgMTApIDogMDtcbiAgICAgICAgICAgICAgICB2YXIgbXIgPSB0aGlzLmdldFN0eWxlKGVsLCAnbWFyZ2luUmlnaHQnKTtcbiAgICAgICAgICAgICAgICBtciA9IG1yID09ICdhdXRvJyA/IDAgOiBwYXJzZUludChtciwgMTApICE9IE5hTiA/IHBhcnNlSW50KG1yLCAxMCkgOiAwO1xuICAgICAgICAgICAgICAgIHJldHVybiAocGwgKyBwciArIGJsICsgYnIgKyBtbCArIG1yKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEdldCBjb21wdXRlIHBpeGVsIG51bWJlciBvZiB0aGUgd2hvbGUgaGVpZ2h0IG9mIGFuIGVsZW1lbnRzIGJvcmRlclxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IC0gdGhlIEhUTUwgZWxlbWVudFxuICAgICAgICAgICAgICogQHJldHVybiB7bnVtYmVyfSAtIHRoZSBhbW91bnQgb2YgcGl4ZWxzXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIFN3b29zaC5wcm90b3R5cGUuZ2V0Qm9yZGVySGVpZ2h0ID0gZnVuY3Rpb24gKGVsKSB7XG4gICAgICAgICAgICAgICAgdmFyIGJ0ID0gdGhpcy5nZXRTdHlsZShlbCwgJ2JvcmRlclRvcFdpZHRoJyk7XG4gICAgICAgICAgICAgICAgYnQgPSBidCA9PSAndGhpbicgPyAxIDogYnQgPT0gJ21lZGl1bScgPyAzIDogYnQgPT0gJ3RoaWNrJyA/IDUgOiBwYXJzZUludChidCwgMTApICE9IE5hTiA/IHBhcnNlSW50KGJ0LCAxMCkgOiAwO1xuICAgICAgICAgICAgICAgIHZhciBiYiA9IHRoaXMuZ2V0U3R5bGUoZWwsICdib3JkZXJCb3R0b21XaWR0aCcpO1xuICAgICAgICAgICAgICAgIGJiID0gYmIgPT0gJ3RoaW4nID8gMSA6IGJiID09ICdtZWRpdW0nID8gMyA6IGJiID09ICd0aGljaycgPyA1IDogcGFyc2VJbnQoYmIsIDEwKSAhPSBOYU4gPyBwYXJzZUludChiYiwgMTApIDogMDtcbiAgICAgICAgICAgICAgICB2YXIgcHQgPSB0aGlzLmdldFN0eWxlKGVsLCAncGFkZGluZ1RvcCcpO1xuICAgICAgICAgICAgICAgIHB0ID0gcHQgPT0gJ2F1dG8nID8gMCA6IHBhcnNlSW50KHB0LCAxMCkgIT0gTmFOID8gcGFyc2VJbnQocHQsIDEwKSA6IDA7XG4gICAgICAgICAgICAgICAgdmFyIHBiID0gdGhpcy5nZXRTdHlsZShlbCwgJ3BhZGRpbmdCb3R0b20nKTtcbiAgICAgICAgICAgICAgICBwYiA9IHBiID09ICdhdXRvJyA/IDAgOiBwYXJzZUludChwYiwgMTApICE9IE5hTiA/IHBhcnNlSW50KHBiLCAxMCkgOiAwO1xuICAgICAgICAgICAgICAgIHZhciBtdCA9IHRoaXMuZ2V0U3R5bGUoZWwsICdtYXJnaW5Ub3AnKTtcbiAgICAgICAgICAgICAgICBtdCA9IG10ID09ICdhdXRvJyA/IDAgOiBwYXJzZUludChtdCwgMTApICE9IE5hTiA/IHBhcnNlSW50KG10LCAxMCkgOiAwO1xuICAgICAgICAgICAgICAgIHZhciBtYiA9IHRoaXMuZ2V0U3R5bGUoZWwsICdtYXJnaW5Cb3R0b20nKTtcbiAgICAgICAgICAgICAgICBtYiA9IG1iID09ICdhdXRvJyA/IDAgOiBwYXJzZUludChtYiwgMTApICE9IE5hTiA/IHBhcnNlSW50KG1iLCAxMCkgOiAwO1xuICAgICAgICAgICAgICAgIHJldHVybiAocHQgKyBwYiArIGJ0ICsgYmIgKyBtdCArIG1iKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIERpc2FibGVzIHRoZSBzY3JvbGwgd2hlZWwgb2YgdGhlIG1vdXNlXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQHBhcmFtIHtNb3VzZVdoZWVsRXZlbnR9IGUgLSB0aGUgbW91c2Ugd2hlZWwgZXZlbnRcbiAgICAgICAgICAgICAqIEByZXR1cm4ge3ZvaWR9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIFN3b29zaC5wcm90b3R5cGUuZGlzYWJsZU1vdXNlU2Nyb2xsID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5lbGVtZW50QmVoaW5kQ3Vyc29ySXNNZShlLmNsaWVudFgsIGUuY2xpZW50WSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jbGVhclRpbWVvdXRzKCk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZSA9IHdpbmRvdy5ldmVudDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0ID8gZS5wcmV2ZW50RGVmYXVsdCgpIDogKGUucmV0dXJuVmFsdWUgPSBmYWxzZSk7XG4gICAgICAgICAgICAgICAgICAgIGUucmV0dXJuVmFsdWUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBEZXRlcm1pbmUgd2hldGhlciBhbiBlbGVtZW50IGhhcyBhIHNjcm9sbGJhciBvciBub3RcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbGVtZW50IC0gdGhlIEhUTUxFbGVtZW50XG4gICAgICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gZGlyZWN0aW9uIC0gZGV0ZXJtaW5lIHRoZSB2ZXJ0aWNhbCBvciBob3Jpem9udGFsIHNjcm9sbGJhcj9cbiAgICAgICAgICAgICAqIEByZXR1cm4ge2Jvb2xlYW59IC0gd2hldGhlciB0aGUgZWxlbWVudCBoYXMgc2Nyb2xsYmFycyBvciBub3RcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgU3dvb3NoLnByb3RvdHlwZS5oYXNTY3JvbGxiYXIgPSBmdW5jdGlvbiAoZWxlbWVudCwgZGlyZWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgdmFyIGhhcyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIHZhciBvdmVyZmxvdyA9ICdvdmVyZmxvdyc7XG4gICAgICAgICAgICAgICAgaWYgKGRpcmVjdGlvbiA9PSAndmVydGljYWwnKSB7XG4gICAgICAgICAgICAgICAgICAgIG92ZXJmbG93ID0gJ292ZXJmbG93WSc7XG4gICAgICAgICAgICAgICAgICAgIGhhcyA9IGVsZW1lbnQuc2Nyb2xsSGVpZ2h0ID4gZWxlbWVudC5jbGllbnRIZWlnaHQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKGRpcmVjdGlvbiA9PSAnaG9yaXpvbnRhbCcpIHtcbiAgICAgICAgICAgICAgICAgICAgb3ZlcmZsb3cgPSAnb3ZlcmZsb3dYJztcbiAgICAgICAgICAgICAgICAgICAgaGFzID0gZWxlbWVudC5zY3JvbGxXaWR0aCA+IGVsZW1lbnQuY2xpZW50V2lkdGg7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIENoZWNrIHRoZSBvdmVyZmxvdyBhbmQgb3ZlcmZsb3dEaXJlY3Rpb24gcHJvcGVydGllcyBmb3IgXCJhdXRvXCIgYW5kIFwidmlzaWJsZVwiIHZhbHVlc1xuICAgICAgICAgICAgICAgIGhhcyA9IHRoaXMuZ2V0U3R5bGUodGhpcy5jb250YWluZXIsICdvdmVyZmxvdycpID09IFwidmlzaWJsZVwiXG4gICAgICAgICAgICAgICAgICAgIHx8IHRoaXMuZ2V0U3R5bGUodGhpcy5jb250YWluZXIsICdvdmVyZmxvd1knKSA9PSBcInZpc2libGVcIlxuICAgICAgICAgICAgICAgICAgICB8fCAoaGFzICYmIHRoaXMuZ2V0U3R5bGUodGhpcy5jb250YWluZXIsICdvdmVyZmxvdycpID09IFwiYXV0b1wiKVxuICAgICAgICAgICAgICAgICAgICB8fCAoaGFzICYmIHRoaXMuZ2V0U3R5bGUodGhpcy5jb250YWluZXIsICdvdmVyZmxvd1knKSA9PSBcImF1dG9cIik7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGhhcztcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEVuYWJsZXMgdGhlIHNjcm9sbCB3aGVlbCBvZiB0aGUgbW91c2UgdG8gc2Nyb2xsLCBzcGVjaWFsbHkgZm9yIGRpdnMgd2l0aG91ciBzY3JvbGxiYXJcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAcGFyYW0ge01vdXNlV2hlZWxFdmVudH0gZSAtIHRoZSBtb3VzZSB3aGVlbCBldmVudFxuICAgICAgICAgICAgICogQHJldHVybiB7dm9pZH1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgU3dvb3NoLnByb3RvdHlwZS5hY3RpdmVNb3VzZVNjcm9sbCA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFlKSB7XG4gICAgICAgICAgICAgICAgICAgIGUgPSB3aW5kb3cuZXZlbnQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmVsZW1lbnRCZWhpbmRDdXJzb3JJc01lKGUuY2xpZW50WCwgZS5jbGllbnRZKSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZGlyZWN0aW9uO1xuICAgICAgICAgICAgICAgICAgICBpZiAoXCJkZWx0YVlcIiBpbiBlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkaXJlY3Rpb24gPSBlLmRlbHRhWSA+IDAgPyAnZG93bicgOiAndXAnO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKFwid2hlZWxEZWx0YVwiIGluIGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpcmVjdGlvbiA9IGUud2hlZWxEZWx0YSA+IDAgPyAndXAnIDogJ2Rvd24nO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIC8qIHVzZSB0aGUgbm9ybWFsIHNjcm9sbCwgd2hlbiB0aGVyZSBhcmUgc2Nyb2xsYmFycyBhbmQgdGhlIGRpcmVjdGlvbiBpcyBcInZlcnRpY2FsXCIgKi9cbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy53aGVlbE9wdGlvbnMuZGlyZWN0aW9uID09ICd2ZXJ0aWNhbCcgJiYgdGhpcy5oYXNTY3JvbGxiYXIodGhpcy5zY3JvbGxFbGVtZW50LCB0aGlzLm9wdGlvbnMud2hlZWxPcHRpb25zLmRpcmVjdGlvbikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghKCh0aGlzLnRyaWdnZXJlZC5jb2xsaWRlQm90dG9tICYmIGRpcmVjdGlvbiA9PSAnZG93bicpIHx8ICh0aGlzLnRyaWdnZXJlZC5jb2xsaWRlVG9wICYmIGRpcmVjdGlvbiA9PSAndXAnKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNsZWFyVGltZW91dHMoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kaXNhYmxlTW91c2VTY3JvbGwoZSk7XG4gICAgICAgICAgICAgICAgICAgIHZhciB4ID0gdGhpcy5zY3JvbGxFbGVtZW50LnNjcm9sbExlZnQ7XG4gICAgICAgICAgICAgICAgICAgIHZhciB5ID0gdGhpcy5zY3JvbGxFbGVtZW50LnNjcm9sbFRvcDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy53aGVlbE9wdGlvbnMuZGlyZWN0aW9uID09ICdob3Jpem9udGFsJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgeCA9IHRoaXMuc2Nyb2xsRWxlbWVudC5zY3JvbGxMZWZ0ICsgKGRpcmVjdGlvbiA9PSAnZG93bicgPyB0aGlzLm9wdGlvbnMud2hlZWxPcHRpb25zLnN0ZXAgOiB0aGlzLm9wdGlvbnMud2hlZWxPcHRpb25zLnN0ZXAgKiAtMSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAodGhpcy5vcHRpb25zLndoZWVsT3B0aW9ucy5kaXJlY3Rpb24gPT0gJ3ZlcnRpY2FsJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgeSA9IHRoaXMuc2Nyb2xsRWxlbWVudC5zY3JvbGxUb3AgKyAoZGlyZWN0aW9uID09ICdkb3duJyA/IHRoaXMub3B0aW9ucy53aGVlbE9wdGlvbnMuc3RlcCA6IHRoaXMub3B0aW9ucy53aGVlbE9wdGlvbnMuc3RlcCAqIC0xKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0aGlzLnNjcm9sbFRvKHgsIHkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEVuYWJsZXMgdGhlIHNjcm9sbCB3aGVlbCBvZiB0aGUgbW91c2UgdG8gem9vbVxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBwYXJhbSB7TW91c2VXaGVlbEV2ZW50fSBlIC0gdGhlIG1vdXNlIHdoZWVsIGV2ZW50XG4gICAgICAgICAgICAgKiBAcmV0dXJuIHt2b2lkfVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBTd29vc2gucHJvdG90eXBlLmFjdGl2ZU1vdXNlWm9vbSA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFlKSB7XG4gICAgICAgICAgICAgICAgICAgIGUgPSB3aW5kb3cuZXZlbnQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmVsZW1lbnRCZWhpbmRDdXJzb3JJc01lKGUuY2xpZW50WCwgZS5jbGllbnRZKSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZGlyZWN0aW9uO1xuICAgICAgICAgICAgICAgICAgICBpZiAoXCJkZWx0YVlcIiBpbiBlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkaXJlY3Rpb24gPSBlLmRlbHRhWSA+IDAgPyAnZG93bicgOiAndXAnO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKFwid2hlZWxEZWx0YVwiIGluIGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpcmVjdGlvbiA9IGUud2hlZWxEZWx0YSA+IDAgPyAndXAnIDogJ2Rvd24nO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChkaXJlY3Rpb24gPT0gdGhpcy5vcHRpb25zLnpvb21PcHRpb25zLmRpcmVjdGlvbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHNjYWxlID0gdGhpcy5nZXRTY2FsZSgpICogKDEgKyB0aGlzLm9wdGlvbnMuem9vbU9wdGlvbnMuc3RlcCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgc2NhbGUgPSB0aGlzLmdldFNjYWxlKCkgLyAoMSArIHRoaXMub3B0aW9ucy56b29tT3B0aW9ucy5zdGVwKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0aGlzLnNjYWxlVG8oc2NhbGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIENhbGN1bGF0ZXMgdGhlIHNpemUgb2YgdGhlIHZlcnRpY2FsIHNjcm9sbGJhci5cbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbCAtIFRoZSBIVE1MRWxlbWVtbnRcbiAgICAgICAgICAgICAqIEByZXR1cm4ge251bWJlcn0gLSB0aGUgYW1vdW50IG9mIHBpeGVscyB1c2VkIGJ5IHRoZSB2ZXJ0aWNhbCBzY3JvbGxiYXJcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgU3dvb3NoLnByb3RvdHlwZS5zY3JvbGxiYXJXaWR0aCA9IGZ1bmN0aW9uIChlbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBlbC5vZmZzZXRXaWR0aCAtIGVsLmNsaWVudFdpZHRoIC0gcGFyc2VJbnQodGhpcy5nZXRTdHlsZShlbCwgJ2JvcmRlckxlZnRXaWR0aCcpKSAtIHBhcnNlSW50KHRoaXMuZ2V0U3R5bGUoZWwsICdib3JkZXJSaWdodFdpZHRoJykpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQ2FsY3VsYXRlcyB0aGUgc2l6ZSBvZiB0aGUgaG9yaXpvbnRhbCBzY3JvbGxiYXIuXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWwgLSBUaGUgSFRNTEVsZW1lbW50XG4gICAgICAgICAgICAgKiBAcmV0dXJuIHtudW1iZXJ9IC0gdGhlIGFtb3VudCBvZiBwaXhlbHMgdXNlZCBieSB0aGUgaG9yaXpvbnRhbCBzY3JvbGxiYXJcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgU3dvb3NoLnByb3RvdHlwZS5zY3JvbGxiYXJIZWlnaHQgPSBmdW5jdGlvbiAoZWwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZWwub2Zmc2V0SGVpZ2h0IC0gZWwuY2xpZW50SGVpZ2h0IC0gcGFyc2VJbnQodGhpcy5nZXRTdHlsZShlbCwgJ2JvcmRlclRvcFdpZHRoJykpIC0gcGFyc2VJbnQodGhpcy5nZXRTdHlsZShlbCwgJ2JvcmRlckJvdHRvbVdpZHRoJykpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogUmV0cmlldmVzIHRoZSBjdXJyZW50IHNjYWxlIHZhbHVlIG9yIDEgaWYgaXQgaXMgbm90IHNldC5cbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHtudW1iZXJ9IC0gdGhlIGN1cnJlbnQgc2NhbGUgdmFsdWVcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgU3dvb3NoLnByb3RvdHlwZS5nZXRTY2FsZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHRoaXMuaW5uZXIuc3R5bGUudHJhbnNmb3JtICE9ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciByID0gdGhpcy5pbm5lci5zdHlsZS50cmFuc2Zvcm0ubWF0Y2goL3NjYWxlXFwoKFswLTksXFwuXSspXFwpLykgfHwgW1wiXCJdO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcGFyc2VGbG9hdChyWzFdKSB8fCAxO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFNjYWxlcyB0aGUgaW5uZXIgZWxlbWVudCBieSBhIHZhbHVlIGJhc2VkIG9uIHRoZSBjdXJyZW50IHNjYWxlIHZhbHVlLlxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSBwZXJjZW50IC0gcGVyY2VudGFnZSBvZiB0aGUgY3VycmVudCBzY2FsZSB2YWx1ZVxuICAgICAgICAgICAgICogQHBhcmFtIHtib29sZWFufSBob25vdXJMaW1pdHMgLSB3aGV0aGVyIHRvIGhvbm91ciBtYXhTY2FsZSBhbmQgdGhlIG1pbmltdW0gd2lkdGggYW5kIGhlaWdodFxuICAgICAgICAgICAgICogb2YgdGhlIGNvbnRhaW5lciBlbGVtZW50LlxuICAgICAgICAgICAgICogQHJldHVybiB7dm9pZH1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgU3dvb3NoLnByb3RvdHlwZS5zY2FsZUJ5ID0gZnVuY3Rpb24gKHBlcmNlbnQsIGhvbm91ckxpbWl0cykge1xuICAgICAgICAgICAgICAgIGlmIChob25vdXJMaW1pdHMgPT09IHZvaWQgMCkgeyBob25vdXJMaW1pdHMgPSB0cnVlOyB9XG4gICAgICAgICAgICAgICAgdmFyIHNjYWxlID0gdGhpcy5nZXRTY2FsZSgpICogKHBlcmNlbnQgLyAxMDApO1xuICAgICAgICAgICAgICAgIHRoaXMuc2NhbGVUbyhzY2FsZSwgaG9ub3VyTGltaXRzKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFNjYWxlcyB0aGUgaW5uZXIgZWxlbWVudCBieSBhbiBhYnNvbHV0ZSB2YWx1ZS5cbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0gc2NhbGUgLSB0aGUgc2NhbGVcbiAgICAgICAgICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gaG9ub3VyTGltaXRzIC0gd2hldGhlciB0byBob25vdXIgbWF4U2NhbGUgYW5kIHRoZSBtaW5pbXVtIHdpZHRoIGFuZCBoZWlnaHRcbiAgICAgICAgICAgICAqIG9mIHRoZSBjb250YWluZXIgZWxlbWVudC5cbiAgICAgICAgICAgICAqIEByZXR1cm4ge3ZvaWR9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIFN3b29zaC5wcm90b3R5cGUuc2NhbGVUbyA9IGZ1bmN0aW9uIChzY2FsZSwgaG9ub3VyTGltaXRzKSB7XG4gICAgICAgICAgICAgICAgaWYgKGhvbm91ckxpbWl0cyA9PT0gdm9pZCAwKSB7IGhvbm91ckxpbWl0cyA9IHRydWU7IH1cbiAgICAgICAgICAgICAgICB2YXIgd2lkdGggPSAocGFyc2VGbG9hdCh0aGlzLmlubmVyLnN0eWxlLm1pbldpZHRoKSAqIHNjYWxlKTtcbiAgICAgICAgICAgICAgICB2YXIgaGVpZ2h0ID0gKHBhcnNlRmxvYXQodGhpcy5pbm5lci5zdHlsZS5taW5IZWlnaHQpICogc2NhbGUpO1xuICAgICAgICAgICAgICAgIC8qIFNjcm9sbGJhcnMgaGF2ZSB3aWR0aCBhbmQgaGVpZ2h0IHRvbyAqL1xuICAgICAgICAgICAgICAgIHZhciBtaW5XaWR0aCA9IHRoaXMuY29udGFpbmVyLmNsaWVudFdpZHRoICsgdGhpcy5zY3JvbGxiYXJXaWR0aCh0aGlzLmNvbnRhaW5lcik7XG4gICAgICAgICAgICAgICAgdmFyIG1pbkhlaWdodCA9IHRoaXMuY29udGFpbmVyLmNsaWVudEhlaWdodCArIHRoaXMuc2Nyb2xsYmFySGVpZ2h0KHRoaXMuY29udGFpbmVyKTtcbiAgICAgICAgICAgICAgICBpZiAoaG9ub3VyTGltaXRzKSB7XG4gICAgICAgICAgICAgICAgICAgIC8qIGxvb3AgYXMgbG9uZyBhcyBhbGwgbGltaXRzIGFyZSBob25vdXJlZCAqL1xuICAgICAgICAgICAgICAgICAgICB3aGlsZSAoKHNjYWxlID4gdGhpcy5vcHRpb25zLnpvb21PcHRpb25zLm1heFNjYWxlICYmIHRoaXMub3B0aW9ucy56b29tT3B0aW9ucy5tYXhTY2FsZSAhPSAwKVxuICAgICAgICAgICAgICAgICAgICAgICAgfHwgKHNjYWxlIDwgdGhpcy5vcHRpb25zLnpvb21PcHRpb25zLm1pblNjYWxlICYmIHRoaXMub3B0aW9ucy56b29tT3B0aW9ucy5taW5TY2FsZSAhPSAwKVxuICAgICAgICAgICAgICAgICAgICAgICAgfHwgKHdpZHRoIDwgdGhpcy5jb250YWluZXIuY2xpZW50V2lkdGggJiYgIXRoaXMuaXNCb2R5KVxuICAgICAgICAgICAgICAgICAgICAgICAgfHwgaGVpZ2h0IDwgdGhpcy5jb250YWluZXIuY2xpZW50SGVpZ2h0ICYmICF0aGlzLmlzQm9keSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNjYWxlID4gdGhpcy5vcHRpb25zLnpvb21PcHRpb25zLm1heFNjYWxlICYmIHRoaXMub3B0aW9ucy56b29tT3B0aW9ucy5tYXhTY2FsZSAhPSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2NhbGUgPSB0aGlzLm9wdGlvbnMuem9vbU9wdGlvbnMubWF4U2NhbGU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGggPSBNYXRoLmZsb29yKHBhcnNlSW50KHRoaXMuaW5uZXIuc3R5bGUubWluV2lkdGgpICogc2NhbGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodCA9IE1hdGguZmxvb3IocGFyc2VJbnQodGhpcy5pbm5lci5zdHlsZS5taW5IZWlnaHQpICogc2NhbGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNjYWxlIDwgdGhpcy5vcHRpb25zLnpvb21PcHRpb25zLm1pblNjYWxlICYmIHRoaXMub3B0aW9ucy56b29tT3B0aW9ucy5taW5TY2FsZSAhPSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2NhbGUgPSB0aGlzLm9wdGlvbnMuem9vbU9wdGlvbnMubWluU2NhbGU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGggPSBNYXRoLmZsb29yKHBhcnNlSW50KHRoaXMuaW5uZXIuc3R5bGUubWluV2lkdGgpICogc2NhbGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodCA9IE1hdGguZmxvb3IocGFyc2VJbnQodGhpcy5pbm5lci5zdHlsZS5taW5IZWlnaHQpICogc2NhbGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHdpZHRoIDwgbWluV2lkdGggJiYgIXRoaXMuaXNCb2R5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2NhbGUgPSBzY2FsZSAvIHdpZHRoICogbWluV2lkdGg7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0ID0gTWF0aC5mbG9vcihwYXJzZUludCh0aGlzLmlubmVyLnN0eWxlLm1pbkhlaWdodCkgKiBzY2FsZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGggPSBtaW5XaWR0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChoZWlnaHQgPCBtaW5IZWlnaHQgJiYgIXRoaXMuaXNCb2R5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2NhbGUgPSBzY2FsZSAvIGhlaWdodCAqIG1pbkhlaWdodDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWR0aCA9IE1hdGguZmxvb3IocGFyc2VJbnQodGhpcy5pbm5lci5zdHlsZS5taW5XaWR0aCkgKiBzY2FsZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0ID0gbWluSGVpZ2h0O1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vY29uc29sZS5sb2coXCJzY2FsZVRvKCk6IFwiLCBzY2FsZSwgXCIgLS0tLT4gXCIsIHdpZHRoLCBcIiB4IFwiLCBoZWlnaHQsIFwiIG9yaWc6IFwiLCB0aGlzLmNvbnRhaW5lci5jbGllbnRXaWR0aCwgXCIgeCBcIiwgdGhpcy5jb250YWluZXIuY2xpZW50SGVpZ2h0LCBcIiByZWFsOiBcIiwgbWluV2lkdGgsIFwiIHggXCIsIG1pbkhlaWdodCk7XG4gICAgICAgICAgICAgICAgdGhpcy5pbm5lci5zdHlsZS50cmFuc2Zvcm0gPSAndHJhbnNsYXRlKDBweCwgMHB4KSBzY2FsZSgnICsgc2NhbGUgKyAnKSc7XG4gICAgICAgICAgICAgICAgdGhpcy5zY2FsZUVsZW1lbnQuc3R5bGUubWluV2lkdGggPSB0aGlzLnNjYWxlRWxlbWVudC5zdHlsZS53aWR0aCA9IHdpZHRoICsgJ3B4JztcbiAgICAgICAgICAgICAgICB0aGlzLnNjYWxlRWxlbWVudC5zdHlsZS5taW5IZWlnaHQgPSB0aGlzLnNjYWxlRWxlbWVudC5zdHlsZS5oZWlnaHQgPSBoZWlnaHQgKyAncHgnO1xuICAgICAgICAgICAgICAgIC8qIFRPRE86IGhlcmUgc2Nyb2xsVG8gYmFzZWQgb24gd2hlcmUgdGhlIG1vdXNlIGN1cnNvciBpcyAqL1xuICAgICAgICAgICAgICAgIC8vdGhpcy5zY3JvbGxUbygpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogRGlzYWJsZXMgdGhlIHNjcm9sbCB3aGVlbCBvZiB0aGUgbW91c2VcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0geCAtIHRoZSB4LWNvb3JkaW5hdGVzXG4gICAgICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0geSAtIHRoZSB5LWNvb3JkaW5hdGVzXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHtib29sZWFufSAtIHdoZXRoZXIgdGhlIG5lYXJlc3QgcmVsYXRlZCBwYXJlbnQgaW5uZXIgZWxlbWVudCBpcyB0aGUgb25lIG9mIHRoaXMgb2JqZWN0IGluc3RhbmNlXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIFN3b29zaC5wcm90b3R5cGUuZWxlbWVudEJlaGluZEN1cnNvcklzTWUgPSBmdW5jdGlvbiAoeCwgeSkge1xuICAgICAgICAgICAgICAgIHZhciBlbGVtZW50QmVoaW5kQ3Vyc29yID0gZG9jdW1lbnQuZWxlbWVudEZyb21Qb2ludCh4LCB5KTtcbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBJZiB0aGUgZWxlbWVudCBkaXJlY3RseSBiZWhpbmQgdGhlIGN1cnNvciBpcyBhbiBvdXRlciBlbGVtZW50IHRocm93IG91dCwgYmVjYXVzZSB3aGVuIGNsaWNraW5nIG9uIGEgc2Nyb2xsYmFyXG4gICAgICAgICAgICAgICAgICogZnJvbSBhIGRpdiwgYSBkcmFnIG9mIHRoZSBwYXJlbnQgU3dvb3NoIGVsZW1lbnQgaXMgaW5pdGlhdGVkLlxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHZhciBvdXRlclJlID0gbmV3IFJlZ0V4cChcIiBcIiArIHRoaXMuY2xhc3NPdXRlciArIFwiIFwiKTtcbiAgICAgICAgICAgICAgICBpZiAoZWxlbWVudEJlaGluZEN1cnNvci5jbGFzc05hbWUubWF0Y2gob3V0ZXJSZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvKiBmaW5kIHRoZSBuZXh0IHBhcmVudCB3aGljaCBpcyBhbiBpbm5lciBlbGVtZW50ICovXG4gICAgICAgICAgICAgICAgdmFyIGlubmVyUmUgPSBuZXcgUmVnRXhwKFwiIFwiICsgdGhpcy5jbGFzc0lubmVyICsgXCIgXCIpO1xuICAgICAgICAgICAgICAgIHdoaWxlIChlbGVtZW50QmVoaW5kQ3Vyc29yICYmICFlbGVtZW50QmVoaW5kQ3Vyc29yLmNsYXNzTmFtZS5tYXRjaChpbm5lclJlKSkge1xuICAgICAgICAgICAgICAgICAgICBlbGVtZW50QmVoaW5kQ3Vyc29yID0gZWxlbWVudEJlaGluZEN1cnNvci5wYXJlbnRFbGVtZW50O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5pbm5lciA9PSBlbGVtZW50QmVoaW5kQ3Vyc29yO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIFN3b29zaC5wcm90b3R5cGUuZ2V0VGltZXN0YW1wID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2Ygd2luZG93LnBlcmZvcm1hbmNlID09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB3aW5kb3cucGVyZm9ybWFuY2Uubm93ID8gd2luZG93LnBlcmZvcm1hbmNlLm5vdygpIDogd2luZG93LnBlcmZvcm1hbmNlLndlYmtpdE5vdygpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFNjcm9sbCBoYW5kbGVyIHRvIHRyaWdnZXIgdGhlIGN1c3RvbSBldmVudHNcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAcGFyYW0ge0V2ZW50fSBlIC0gVGhlIHNjcm9sbCBldmVudCBvYmplY3QgKFRPRE86IG5lZWRlZD8pXG4gICAgICAgICAgICAgKiBAdGhyb3dzIEV2ZW50IGNvbGxpZGVMZWZ0XG4gICAgICAgICAgICAgKiBAdGhyb3dzIEV2ZW50IGNvbGxpZGVSaWdodFxuICAgICAgICAgICAgICogQHRocm93cyBFdmVudCBjb2xsaWRlVG9wXG4gICAgICAgICAgICAgKiBAdGhyb3dzIEV2ZW50IGNvbGxpZGVCb3R0b21cbiAgICAgICAgICAgICAqIEByZXR1cm4ge3ZvaWR9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIFN3b29zaC5wcm90b3R5cGUub25TY3JvbGwgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgIHZhciB4ID0gdGhpcy5zY3JvbGxFbGVtZW50LnNjcm9sbExlZnQgfHwgdGhpcy5jb250YWluZXIuc2Nyb2xsTGVmdDtcbiAgICAgICAgICAgICAgICB2YXIgeSA9IHRoaXMuc2Nyb2xsRWxlbWVudC5zY3JvbGxUb3AgfHwgdGhpcy5jb250YWluZXIuc2Nyb2xsVG9wO1xuICAgICAgICAgICAgICAgIC8vIHRoZSBjb2xsaWRlTGVmdCBldmVudFxuICAgICAgICAgICAgICAgIGlmICh4ID09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50cmlnZ2VyZWQuY29sbGlkZUxlZnQgPyBudWxsIDogdGhpcy50cmlnZ2VyRXZlbnQodGhpcy5pbm5lciwgJ2NvbGxpZGUubGVmdCcpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnRyaWdnZXJlZC5jb2xsaWRlTGVmdCA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnRyaWdnZXJlZC5jb2xsaWRlTGVmdCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyB0aGUgY29sbGlkZVRvcCBldmVudFxuICAgICAgICAgICAgICAgIGlmICh5ID09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50cmlnZ2VyZWQuY29sbGlkZVRvcCA/IG51bGwgOiB0aGlzLnRyaWdnZXJFdmVudCh0aGlzLmlubmVyLCAnY29sbGlkZS50b3AnKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50cmlnZ2VyZWQuY29sbGlkZVRvcCA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnRyaWdnZXJlZC5jb2xsaWRlVG9wID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIHRoZSBjb2xsaWRlUmlnaHQgZXZlbnRcbiAgICAgICAgICAgICAgICBpZiAoeCA9PSB0aGlzLnNjcm9sbE1heExlZnQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50cmlnZ2VyZWQuY29sbGlkZVJpZ2h0ID8gbnVsbCA6IHRoaXMudHJpZ2dlckV2ZW50KHRoaXMuaW5uZXIsICdjb2xsaWRlLnJpZ2h0Jyk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudHJpZ2dlcmVkLmNvbGxpZGVSaWdodCA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnRyaWdnZXJlZC5jb2xsaWRlUmlnaHQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gdGhlIGNvbGxpZGVCb3R0b20gZXZlbnRcbiAgICAgICAgICAgICAgICBpZiAoeSA9PSB0aGlzLnNjcm9sbE1heFRvcCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnRyaWdnZXJlZC5jb2xsaWRlQm90dG9tID8gbnVsbCA6IHRoaXMudHJpZ2dlckV2ZW50KHRoaXMuaW5uZXIsICdjb2xsaWRlLmJvdHRvbScpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnRyaWdnZXJlZC5jb2xsaWRlQm90dG9tID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudHJpZ2dlcmVkLmNvbGxpZGVCb3R0b20gPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiB3aW5kb3cgcmVzaXplIGhhbmRsZXIgdG8gcmVjYWxjdWxhdGUgdGhlIGlubmVyIGRpdiBtaW5XaWR0aCBhbmQgbWluSGVpZ2h0XG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQHBhcmFtIHtFdmVudH0gZSAtIFRoZSB3aW5kb3cgcmVzaXplIGV2ZW50IG9iamVjdCAoVE9ETzogbmVlZGVkPylcbiAgICAgICAgICAgICAqIEByZXR1cm4ge3ZvaWR9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIFN3b29zaC5wcm90b3R5cGUub25SZXNpemUgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgICAgICAgICAgdmFyIG9uUmVzaXplID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBfdGhpcy5pbm5lci5zdHlsZS5taW5XaWR0aCA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIF90aGlzLmlubmVyLnN0eWxlLm1pbkhlaWdodCA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIC8qIHRha2UgYXdheSB0aGUgbWFyZ2luIHZhbHVlcyBvZiB0aGUgYm9keSBlbGVtZW50ICovXG4gICAgICAgICAgICAgICAgICAgIHZhciB4RGVsdGEgPSBwYXJzZUludChfdGhpcy5nZXRTdHlsZShkb2N1bWVudC5ib2R5LCAnbWFyZ2luTGVmdCcpLCAxMCkgKyBwYXJzZUludChfdGhpcy5nZXRTdHlsZShkb2N1bWVudC5ib2R5LCAnbWFyZ2luUmlnaHQnKSwgMTApO1xuICAgICAgICAgICAgICAgICAgICB2YXIgeURlbHRhID0gcGFyc2VJbnQoX3RoaXMuZ2V0U3R5bGUoZG9jdW1lbnQuYm9keSwgJ21hcmdpblRvcCcpLCAxMCkgKyBwYXJzZUludChfdGhpcy5nZXRTdHlsZShkb2N1bWVudC5ib2R5LCAnbWFyZ2luQm90dG9tJyksIDEwKTtcbiAgICAgICAgICAgICAgICAgICAgLy9UT0RPOiB3aXRoIHRoaXMuZ2V0Qm9yZGVyV2lkdGgoKSBhbmQgdGhpcy5nZXRCb3JkZXJIZWlnaHQoKVxuICAgICAgICAgICAgICAgICAgICBfdGhpcy5pbm5lci5zdHlsZS5taW5XaWR0aCA9IChkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsV2lkdGggLSB4RGVsdGEpICsgJ3B4JztcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMuaW5uZXIuc3R5bGUubWluSGVpZ2h0ID0gKGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zY3JvbGxIZWlnaHQgLSB5RGVsdGEgLSAxMDApICsgJ3B4JzsgLy9UT0RPOiBXVEY/IHdoeSAtMTAwIGZvciBJRTg/XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBUcmlnZ2VyIHRoZSBmdW5jdGlvbiBvbmx5IHdoZW4gdGhlIGNsaWVudFdpZHRoIG9yIGNsaWVudEhlaWdodCByZWFsbHkgaGF2ZSBjaGFuZ2VkLlxuICAgICAgICAgICAgICAgICAqIElFOCByZXNpZGVzIGluIGFuIGluZmluaXR5IGxvb3AgYWx3YXlzIHRyaWdnZXJpbmcgdGhlIHJlc2l0ZSBldmVudCB3aGVuIGFsdGVyaW5nIGNzcy5cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5vbGRDbGllbnRXaWR0aCAhPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50V2lkdGggfHwgdGhpcy5vbGRDbGllbnRIZWlnaHQgIT0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudEhlaWdodCkge1xuICAgICAgICAgICAgICAgICAgICB3aW5kb3cuY2xlYXJUaW1lb3V0KHRoaXMucmVzaXplVGltZW91dCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVzaXplVGltZW91dCA9IHdpbmRvdy5zZXRUaW1lb3V0KG9uUmVzaXplLCAxMCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8qIHdyaXRlIGRvd24gdGhlIG9sZCBjbGllbnRXaWR0aCBhbmQgY2xpZW50SGVpZ2h0IGZvciB0aGUgYWJvdmUgY29tcGFyc2lvbiAqL1xuICAgICAgICAgICAgICAgIHRoaXMub2xkQ2xpZW50V2lkdGggPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50V2lkdGg7XG4gICAgICAgICAgICAgICAgdGhpcy5vbGRDbGllbnRIZWlnaHQgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50SGVpZ2h0O1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIFN3b29zaC5wcm90b3R5cGUuY2xlYXJUZXh0U2VsZWN0aW9uID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmICh3aW5kb3cuZ2V0U2VsZWN0aW9uKVxuICAgICAgICAgICAgICAgICAgICB3aW5kb3cuZ2V0U2VsZWN0aW9uKCkucmVtb3ZlQWxsUmFuZ2VzKCk7XG4gICAgICAgICAgICAgICAgaWYgKGRvY3VtZW50LnNlbGVjdGlvbilcbiAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQuc2VsZWN0aW9uLmVtcHR5KCk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBCcm93c2VyIGluZGVwZW5kZW50IGV2ZW50IHJlZ2lzdHJhdGlvblxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IG9iaiAtIFRoZSBIVE1MRWxlbWVudCB0byBhdHRhY2ggdGhlIGV2ZW50IHRvXG4gICAgICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnQgLSBUaGUgZXZlbnQgbmFtZSB3aXRob3V0IHRoZSBsZWFkaW5nIFwib25cIlxuICAgICAgICAgICAgICogQHBhcmFtIHsoZTogRXZlbnQpID0+IHZvaWR9IGNhbGxiYWNrIC0gQSBjYWxsYmFjayBmdW5jdGlvbiB0byBhdHRhY2ggdG8gdGhlIGV2ZW50XG4gICAgICAgICAgICAgKiBAcmV0dXJuIHt2b2lkfVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBTd29vc2gucHJvdG90eXBlLmFkZEV2ZW50TGlzdGVuZXIgPSBmdW5jdGlvbiAob2JqLCBldmVudCwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICB2YXIgYm91bmRDYWxsYmFjayA9IGNhbGxiYWNrLmJpbmQodGhpcyk7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBvYmouYWRkRXZlbnRMaXN0ZW5lciA9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChtYXBFdmVudHNbJ29uJyArIGV2ZW50XSAmJiBvYmoudGFnTmFtZSA9PSBcIkJPRFlcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgb2JqID0gbWFwRXZlbnRzWydvbicgKyBldmVudF07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgb2JqLmFkZEV2ZW50TGlzdGVuZXIoZXZlbnQsIGJvdW5kQ2FsbGJhY2spO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmICh0eXBlb2Ygb2JqLmF0dGFjaEV2ZW50ID09ICdvYmplY3QnICYmIGh0bWxFdmVudHNbJ29uJyArIGV2ZW50XSkge1xuICAgICAgICAgICAgICAgICAgICBvYmouYXR0YWNoRXZlbnQoJ29uJyArIGV2ZW50LCBib3VuZENhbGxiYWNrKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAodHlwZW9mIG9iai5hdHRhY2hFdmVudCA9PSAnb2JqZWN0JyAmJiBtYXBFdmVudHNbJ29uJyArIGV2ZW50XSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAob2JqLnRhZ05hbWUgPT0gXCJCT0RZXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBwID0gJ29uJyArIGV2ZW50O1xuICAgICAgICAgICAgICAgICAgICAgICAgLyogZXhhbXBsZTogd2luZG93Lm9uc2Nyb2xsID0gYm91bmRDYWxsYmFjayAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgbWFwRXZlbnRzW3BdW3BdID0gYm91bmRDYWxsYmFjaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIFRPRE86IG9iai5vbnNjcm9sbCA/PyAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgb2JqLm9uc2Nyb2xsID0gYm91bmRDYWxsYmFjaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmICh0eXBlb2Ygb2JqLmF0dGFjaEV2ZW50ID09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAgICAgICAgIG9ialtldmVudF0gPSAxO1xuICAgICAgICAgICAgICAgICAgICBib3VuZENhbGxiYWNrID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIFRPRE86IGUgaXMgdGhlIG9ucHJvcGVydHljaGFuZ2UgZXZlbnQgbm90IG9uZSBvZiB0aGUgY3VzdG9tIGV2ZW50IG9iamVjdHMgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlLnByb3BlcnR5TmFtZSA9PSBldmVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBvYmouYXR0YWNoRXZlbnQoJ29ucHJvcGVydHljaGFuZ2UnLCBib3VuZENhbGxiYWNrKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIG9ialsnb24nICsgZXZlbnRdID0gYm91bmRDYWxsYmFjaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5jdXN0b21FdmVudHNbZXZlbnRdID8gbnVsbCA6ICh0aGlzLmN1c3RvbUV2ZW50c1tldmVudF0gPSBbXSk7XG4gICAgICAgICAgICAgICAgdGhpcy5jdXN0b21FdmVudHNbZXZlbnRdLnB1c2goW2NhbGxiYWNrLCBib3VuZENhbGxiYWNrXSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBCcm93c2VyIGluZGVwZW5kZW50IGV2ZW50IGRlcmVnaXN0cmF0aW9uXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gb2JqIC0gVGhlIEhUTUxFbGVtZW50IHdob3NlIGV2ZW50IHNob3VsZCBiZSBkZXRhY2hlZFxuICAgICAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50IC0gVGhlIGV2ZW50IG5hbWUgd2l0aG91dCB0aGUgbGVhZGluZyBcIm9uXCJcbiAgICAgICAgICAgICAqIEBwYXJhbSB7KGU6IEV2ZW50KSA9PiB2b2lkfSBjYWxsYmFjayAtIFRoZSBjYWxsYmFjayBmdW5jdGlvbiB3aGVuIGF0dGFjaGVkXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHt2b2lkfVxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBUT0RPOiB1bnJlZ2lzdGVyaW5nIG9mIG1hcEV2ZW50c1xuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBTd29vc2gucHJvdG90eXBlLnJlbW92ZUV2ZW50TGlzdGVuZXIgPSBmdW5jdGlvbiAob2JqLCBldmVudCwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnQgaW4gdGhpcy5jdXN0b21FdmVudHMpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSBpbiB0aGlzLmN1c3RvbUV2ZW50c1tldmVudF0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIGlmIHRoZSBldmVudCB3YXMgZm91bmQgaW4gdGhlIGFycmF5IGJ5IGl0cyBjYWxsYmFjayByZWZlcmVuY2UgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmN1c3RvbUV2ZW50c1tldmVudF1baV1bMF0gPT0gY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiByZW1vdmUgdGhlIGxpc3RlbmVyIGZyb20gdGhlIGFycmF5IGJ5IGl0cyBib3VuZCBjYWxsYmFjayByZWZlcmVuY2UgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayA9IHRoaXMuY3VzdG9tRXZlbnRzW2V2ZW50XVtpXVsxXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmN1c3RvbUV2ZW50c1tldmVudF0uc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2Ygb2JqLnJlbW92ZUV2ZW50TGlzdGVuZXIgPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICBvYmoucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudCwgY2FsbGJhY2spO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmICh0eXBlb2Ygb2JqLmRldGFjaEV2ZW50ID09ICdvYmplY3QnICYmIGh0bWxFdmVudHNbJ29uJyArIGV2ZW50XSkge1xuICAgICAgICAgICAgICAgICAgICBvYmouZGV0YWNoRXZlbnQoJ29uJyArIGV2ZW50LCBjYWxsYmFjayk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHR5cGVvZiBvYmouZGV0YWNoRXZlbnQgPT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgICAgICAgICAgb2JqLmRldGFjaEV2ZW50KCdvbnByb3BlcnR5Y2hhbmdlJywgY2FsbGJhY2spO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgb2JqWydvbicgKyBldmVudF0gPSBudWxsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEJyb3dzZXIgaW5kZXBlbmRlbnQgZXZlbnQgdHJpZ2dlciBmdW5jdGlvblxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IG9iaiAtIFRoZSBIVE1MRWxlbWVudCB3aGljaCB0cmlnZ2VycyB0aGUgZXZlbnRcbiAgICAgICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBldmVudE5hbWUgLSBUaGUgZXZlbnQgbmFtZSB3aXRob3V0IHRoZSBsZWFkaW5nIFwib25cIlxuICAgICAgICAgICAgICogQHJldHVybiB7dm9pZH1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgU3dvb3NoLnByb3RvdHlwZS50cmlnZ2VyRXZlbnQgPSBmdW5jdGlvbiAob2JqLCBldmVudE5hbWUpIHtcbiAgICAgICAgICAgICAgICB2YXIgZXZlbnQ7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB3aW5kb3cuQ3VzdG9tRXZlbnQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQgPSBuZXcgQ3VzdG9tRXZlbnQoZXZlbnROYW1lKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAodHlwZW9mIGRvY3VtZW50LmNyZWF0ZUV2ZW50ID09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudChcIkhUTUxFdmVudHNcIik7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LmluaXRFdmVudChldmVudE5hbWUsIHRydWUsIHRydWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChkb2N1bWVudC5jcmVhdGVFdmVudE9iamVjdCkge1xuICAgICAgICAgICAgICAgICAgICBldmVudCA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50T2JqZWN0KCk7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LmV2ZW50VHlwZSA9IGV2ZW50TmFtZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZXZlbnQuZXZlbnROYW1lID0gZXZlbnROYW1lO1xuICAgICAgICAgICAgICAgIGlmIChvYmouZGlzcGF0Y2hFdmVudCkge1xuICAgICAgICAgICAgICAgICAgICBvYmouZGlzcGF0Y2hFdmVudChldmVudCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKG9ialtldmVudE5hbWVdKSB7XG4gICAgICAgICAgICAgICAgICAgIG9ialtldmVudE5hbWVdKys7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKG9iai5maXJlRXZlbnQgJiYgaHRtbEV2ZW50c1snb24nICsgZXZlbnROYW1lXSkge1xuICAgICAgICAgICAgICAgICAgICBvYmouZmlyZUV2ZW50KCdvbicgKyBldmVudC5ldmVudFR5cGUsIGV2ZW50KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAob2JqW2V2ZW50TmFtZV0pIHtcbiAgICAgICAgICAgICAgICAgICAgb2JqW2V2ZW50TmFtZV0oKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAob2JqWydvbicgKyBldmVudE5hbWVdKSB7XG4gICAgICAgICAgICAgICAgICAgIG9ialsnb24nICsgZXZlbnROYW1lXSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEdldCBhIGNzcyBzdHlsZSBwcm9wZXJ0eSB2YWx1ZSBicm93c2VyIGluZGVwZW5kZW50XG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWwgLSBUaGUgSFRNTEVsZW1lbnQgdG8gbG9va3VwXG4gICAgICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30ganNQcm9wZXJ0eSAtIFRoZSBjc3MgcHJvcGVydHkgbmFtZSBpbiBqYXZhc2NyaXB0IGluIGNhbWVsQ2FzZSAoZS5nLiBcIm1hcmdpbkxlZnRcIiwgbm90IFwibWFyZ2luLWxlZnRcIilcbiAgICAgICAgICAgICAqIEByZXR1cm4ge3N0cmluZ30gLSB0aGUgcHJvcGVydHkgdmFsdWVcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgU3dvb3NoLnByb3RvdHlwZS5nZXRTdHlsZSA9IGZ1bmN0aW9uIChlbCwganNQcm9wZXJ0eSkge1xuICAgICAgICAgICAgICAgIHZhciBjc3NQcm9wZXJ0eSA9IGpzUHJvcGVydHkucmVwbGFjZSgvKFtBLVpdKS9nLCBcIi0kMVwiKS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2Ygd2luZG93LmdldENvbXB1dGVkU3R5bGUgPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gd2luZG93LmdldENvbXB1dGVkU3R5bGUoZWwpLmdldFByb3BlcnR5VmFsdWUoY3NzUHJvcGVydHkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGVsLmN1cnJlbnRTdHlsZVtqc1Byb3BlcnR5XTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgU3dvb3NoLnByb3RvdHlwZS5jbGVhclRpbWVvdXRzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLnRpbWVvdXRzKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGlkeCBpbiB0aGlzLnRpbWVvdXRzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQodGhpcy50aW1lb3V0c1tpZHhdKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy50aW1lb3V0cy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnRpbWVvdXRzID0gW107XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlbW92ZUV2ZW50TGlzdGVuZXIodGhpcy5pbm5lciwgJ2NvbGxpZGUubGVmdCcsIHRoaXMuY2xlYXJMaXN0ZW5lckxlZnQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKHRoaXMuaW5uZXIsICdjb2xsaWRlLnJpZ2h0JywgdGhpcy5jbGVhckxpc3RlbmVyUmlnaHQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKHRoaXMuaW5uZXIsICdjb2xsaWRlLnRvcCcsIHRoaXMuY2xlYXJMaXN0ZW5lclRvcCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlbW92ZUV2ZW50TGlzdGVuZXIodGhpcy5pbm5lciwgJ2NvbGxpZGUuYm90dG9tJywgdGhpcy5jbGVhckxpc3RlbmVyQm90dG9tKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIE1vdXNlIGRvd24gaGFuZGxlclxuICAgICAgICAgICAgICogUmVnaXN0ZXJzIHRoZSBtb3VzZW1vdmUgYW5kIG1vdXNldXAgaGFuZGxlcnMgYW5kIGZpbmRzIHRoZSBuZXh0IGlubmVyIGVsZW1lbnRcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAcGFyYW0ge01vdXNlRXZlbnR9IGUgLSBUaGUgbW91c2UgZG93biBldmVudCBvYmplY3RcbiAgICAgICAgICAgICAqIEByZXR1cm4ge3ZvaWR9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIFN3b29zaC5wcm90b3R5cGUubW91c2VEb3duID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICAgICAgICAgIHRoaXMuY2xlYXJUaW1lb3V0cygpO1xuICAgICAgICAgICAgICAgIC8qIGRyYWcgb25seSBpZiB0aGUgbGVmdCBtb3VzZSBidXR0b24gd2FzIHByZXNzZWQgKi9cbiAgICAgICAgICAgICAgICBpZiAoKFwid2hpY2hcIiBpbiBlICYmIGUud2hpY2ggPT0gMSkgfHwgKHR5cGVvZiBlLndoaWNoID09ICd1bmRlZmluZWQnICYmIFwiYnV0dG9uXCIgaW4gZSAmJiBlLmJ1dHRvbiA9PSAxKSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5lbGVtZW50QmVoaW5kQ3Vyc29ySXNNZShlLmNsaWVudFgsIGUuY2xpZW50WSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIHByZXZlbnQgaW1hZ2UgZHJhZ2dpbmcgYWN0aW9uICovXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgaW1ncyA9IHRoaXMuY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3JBbGwoJ2ltZycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBpbWdzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW1nc1tpXS5vbmRyYWdzdGFydCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIGZhbHNlOyB9OyAvL01TSUVcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIHNlYXJjaCB0aGUgRE9NIGZvciBleGNsdWRlIGVsZW1lbnRzICovXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLmRyYWdPcHRpb25zLmV4Y2x1ZGUubGVuZ3RoICE9IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBkcmFnIG9ubHkgaWYgdGhlIG1vdXNlIGNsaWNrZWQgb24gYW4gYWxsb3dlZCBlbGVtZW50ICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGVsID0gZG9jdW1lbnQuZWxlbWVudEZyb21Qb2ludChlLmNsaWVudFgsIGUuY2xpZW50WSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGV4Y2x1ZGVFbGVtZW50cyA9IHRoaXMuY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3JBbGwodGhpcy5vcHRpb25zLmRyYWdPcHRpb25zLmV4Y2x1ZGUuam9pbignLCAnKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogbG9vcCB0aHJvdWdoIGFsbCBwYXJlbnQgZWxlbWVudHMgdW50aWwgd2UgZW5jb3VudGVyIGFuIGlubmVyIGRpdiBvciBubyBtb3JlIHBhcmVudHMgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgaW5uZXJSZSA9IG5ldyBSZWdFeHAoXCIgXCIgKyB0aGlzLmNsYXNzSW5uZXIgKyBcIiBcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2hpbGUgKGVsICYmICFlbC5jbGFzc05hbWUubWF0Y2goaW5uZXJSZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogY29tcGFyZSBlYWNoIHBhcmVudCwgaWYgaXQgaXMgaW4gdGhlIGV4Y2x1ZGUgbGlzdCAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGV4Y2x1ZGVFbGVtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogYmFpbCBvdXQgaWYgYW4gZWxlbWVudCBtYXRjaGVzICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXhjbHVkZUVsZW1lbnRzW2ldID09IGVsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsID0gZWwucGFyZW50RWxlbWVudDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBzZWFyY2ggdGhlIERPTSBmb3Igb25seSBlbGVtZW50cywgYnV0IG9ubHkgaWYgdGhlcmUgYXJlIGVsZW1lbnRzIHNldFxuICAgICAgICAgICAgICAgICAgICAgICAgLyppZiAodGhpcy5vcHRpb25zLmRyYWdPcHRpb25zLm9ubHkubGVuZ3RoICE9IDApe1xuICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgb25seUVsZW1lbnRzID0gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvckFsbCh0aGlzLm9wdGlvbnMuZHJhZ09wdGlvbnMub25seS5qb2luKCcsICcpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gbG9vcCB0aHJvdWdoIHRoZSBub2RlbGlzdCBhbmQgY2hlY2sgZm9yIG91ciBlbGVtZW50XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBmb3VuZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGV4Y2x1ZGVFbGVtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvbmx5RWxlbWVudHNbaV0gPT0gZWwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvdW5kID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZm91bmQgPT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0qL1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5pbm5lci5jbGFzc05hbWUgKz0gXCIgXCIgKyB0aGlzLmNsYXNzR3JhYmJpbmcgKyBcIiBcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIG5vdGUgdGhlIG9yaWdpbiBwb3NpdGlvbnMgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZHJhZ09yaWdpbkxlZnQgPSBlLmNsaWVudFg7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRyYWdPcmlnaW5Ub3AgPSBlLmNsaWVudFk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRyYWdPcmlnaW5TY3JvbGxMZWZ0ID0gdGhpcy5zY3JvbGxFbGVtZW50LnNjcm9sbExlZnQ7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRyYWdPcmlnaW5TY3JvbGxUb3AgPSB0aGlzLnNjcm9sbEVsZW1lbnQuc2Nyb2xsVG9wO1xuICAgICAgICAgICAgICAgICAgICAgICAgLyogaXQgbG9va3Mgc3RyYW5nZSBpZiBzY3JvbGwtYmVoYXZpb3IgaXMgc2V0IHRvIHNtb290aCAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wYXJlbnRPcmlnaW5TdHlsZSA9IHRoaXMuaW5uZXIucGFyZW50RWxlbWVudC5zdHlsZS5jc3NUZXh0O1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB0aGlzLmlubmVyLnBhcmVudEVsZW1lbnQuc3R5bGUuc2V0UHJvcGVydHkgPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaW5uZXIucGFyZW50RWxlbWVudC5zdHlsZS5zZXRQcm9wZXJ0eSgnc2Nyb2xsLWJlaGF2aW9yJywgJ2F1dG8nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIHJlZ2lzdGVyIHRoZSBldmVudCBoYW5kbGVycyAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5tb3VzZU1vdmVIYW5kbGVyID0gdGhpcy5tb3VzZU1vdmUuYmluZCh0aGlzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcihkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQsICdtb3VzZW1vdmUnLCB0aGlzLm1vdXNlTW92ZUhhbmRsZXIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5tb3VzZVVwSGFuZGxlciA9IGZ1bmN0aW9uIChlKSB7IHJldHVybiBfdGhpcy5tb3VzZVVwKGUpOyB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCwgJ21vdXNldXAnLCB0aGlzLm1vdXNlVXBIYW5kbGVyKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIE1vdXNlIHVwIGhhbmRsZXJcbiAgICAgICAgICAgICAqIERlcmVnaXN0ZXJzIHRoZSBtb3VzZW1vdmUgYW5kIG1vdXNldXAgaGFuZGxlcnNcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAcGFyYW0ge01vdXNlRXZlbnR9IGUgLSBUaGUgbW91c2UgdXAgZXZlbnQgb2JqZWN0XG4gICAgICAgICAgICAgKiBAcmV0dXJuIHt2b2lkfVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBTd29vc2gucHJvdG90eXBlLm1vdXNlVXAgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgIHZhciB4ID0gdGhpcy5nZXRSZWFsWCh0aGlzLmRyYWdPcmlnaW5MZWZ0ICsgdGhpcy5kcmFnT3JpZ2luU2Nyb2xsTGVmdCAtIGUuY2xpZW50WCk7XG4gICAgICAgICAgICAgICAgdmFyIHkgPSB0aGlzLmdldFJlYWxZKHRoaXMuZHJhZ09yaWdpblRvcCArIHRoaXMuZHJhZ09yaWdpblNjcm9sbFRvcCAtIGUuY2xpZW50WSk7XG4gICAgICAgICAgICAgICAgdmFyIHJlID0gbmV3IFJlZ0V4cChcIiBcIiArIHRoaXMuY2xhc3NHcmFiYmluZyArIFwiIFwiKTtcbiAgICAgICAgICAgICAgICB0aGlzLmlubmVyLmNsYXNzTmFtZSA9IHRoaXMuaW5uZXIuY2xhc3NOYW1lLnJlcGxhY2UocmUsICcnKTtcbiAgICAgICAgICAgICAgICB0aGlzLmlubmVyLnBhcmVudEVsZW1lbnQuc3R5bGUuY3NzVGV4dCA9IHRoaXMucGFyZW50T3JpZ2luU3R5bGU7XG4gICAgICAgICAgICAgICAgaWYgKHkgIT0gdGhpcy5zY3JvbGxFbGVtZW50LnNjcm9sbFRvcCB8fCB4ICE9IHRoaXMuc2Nyb2xsRWxlbWVudC5zY3JvbGxMZWZ0KSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsVG8oeCwgeSwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMucmVtb3ZlRXZlbnRMaXN0ZW5lcihkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQsICdtb3VzZW1vdmUnLCB0aGlzLm1vdXNlTW92ZUhhbmRsZXIpO1xuICAgICAgICAgICAgICAgIHRoaXMucmVtb3ZlRXZlbnRMaXN0ZW5lcihkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQsICdtb3VzZXVwJywgdGhpcy5tb3VzZVVwSGFuZGxlcik7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5kcmFnT3B0aW9ucy5mYWRlICYmIHR5cGVvZiB0aGlzLnZ4ICE9ICd1bmRlZmluZWQnICYmIHR5cGVvZiB0aGlzLnZ5ICE9ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgICAgIC8qIHYgc2hvdWxkIG5vdCBleGNlZWQgdk1heCBvciAtdk1heCAtPiB3b3VsZCBiZSB0b28gZmFzdCBhbmQgc2hvdWxkIGV4Y2VlZCB2TWluIG9yIC12TWluICovXG4gICAgICAgICAgICAgICAgICAgIHZhciB2TWF4ID0gdGhpcy5vcHRpb25zLmRyYWdPcHRpb25zLm1heFNwZWVkO1xuICAgICAgICAgICAgICAgICAgICB2YXIgdk1pbiA9IHRoaXMub3B0aW9ucy5kcmFnT3B0aW9ucy5taW5TcGVlZDtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHZ4ID0gdGhpcy52eDtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHZ5ID0gdGhpcy52eTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHZ5IDwgdk1pbiAmJiB2eSA+IC12TWluICYmIHZ4IDwgdk1pbiAmJiB2eCA+IC12TWluKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdmFyIHZ4ID0gKHZ4IDw9IHZNYXggJiYgdnggPj0gLXZNYXgpID8gdnggOiAodnggPiAwID8gdk1heCA6IC12TWF4KTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHZ5ID0gKHZ5IDw9IHZNYXggJiYgdnkgPj0gLXZNYXgpID8gdnkgOiAodnkgPiAwID8gdk1heCA6IC12TWF4KTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGF4ID0gKHZ4ID4gMCA/IC0xIDogMSkgKiB0aGlzLm9wdGlvbnMuZHJhZ09wdGlvbnMuYnJha2VTcGVlZDtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGF5ID0gKHZ5ID4gMCA/IC0xIDogMSkgKiB0aGlzLm9wdGlvbnMuZHJhZ09wdGlvbnMuYnJha2VTcGVlZDtcbiAgICAgICAgICAgICAgICAgICAgeCA9ICgoMCAtIE1hdGgucG93KHZ4LCAyKSkgLyAoMiAqIGF4KSkgKyB0aGlzLnNjcm9sbEVsZW1lbnQuc2Nyb2xsTGVmdDtcbiAgICAgICAgICAgICAgICAgICAgeSA9ICgoMCAtIE1hdGgucG93KHZ5LCAyKSkgLyAoMiAqIGF5KSkgKyB0aGlzLnNjcm9sbEVsZW1lbnQuc2Nyb2xsVG9wO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmZhZGVPdXRCeUNvb3Jkcyh4LCB5KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgU3dvb3NoLnByb3RvdHlwZS5nZXRSZWFsWCA9IGZ1bmN0aW9uICh4KSB7XG4gICAgICAgICAgICAgICAgLy9zdGljayB0aGUgZWxlbWVudCB0byB0aGUgZ3JpZCwgaWYgZ3JpZCBlcXVhbHMgMSB0aGUgdmFsdWUgZG9lcyBub3QgY2hhbmdlXG4gICAgICAgICAgICAgICAgeCA9IE1hdGgucm91bmQoeCAvICh0aGlzLm9wdGlvbnMuZ3JpZFggKiB0aGlzLmdldFNjYWxlKCkpKSAqICh0aGlzLm9wdGlvbnMuZ3JpZFggKiB0aGlzLmdldFNjYWxlKCkpO1xuICAgICAgICAgICAgICAgIHZhciBzY3JvbGxNYXhMZWZ0ID0gKHRoaXMuc2Nyb2xsRWxlbWVudC5zY3JvbGxXaWR0aCAtIHRoaXMuc2Nyb2xsRWxlbWVudC5jbGllbnRXaWR0aCkgLSB0aGlzLm9wdGlvbnMuZWxhc3RpY0VnZGVzLnJpZ2h0O1xuICAgICAgICAgICAgICAgIHJldHVybiAoeCA+IHNjcm9sbE1heExlZnQpID8gc2Nyb2xsTWF4TGVmdCA6ICh4IDwgdGhpcy5vcHRpb25zLmVsYXN0aWNFZ2Rlcy5sZWZ0KSA/IHRoaXMub3B0aW9ucy5lbGFzdGljRWdkZXMubGVmdCA6IHg7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgU3dvb3NoLnByb3RvdHlwZS5nZXRSZWFsWSA9IGZ1bmN0aW9uICh5KSB7XG4gICAgICAgICAgICAgICAgLy9zdGljayB0aGUgZWxlbWVudCB0byB0aGUgZ3JpZCwgaWYgZ3JpZCBlcXVhbHMgMSB0aGUgdmFsdWUgZG9lcyBub3QgY2hhbmdlXG4gICAgICAgICAgICAgICAgeSA9IE1hdGgucm91bmQoeSAvICh0aGlzLm9wdGlvbnMuZ3JpZFkgKiB0aGlzLmdldFNjYWxlKCkpKSAqICh0aGlzLm9wdGlvbnMuZ3JpZFkgKiB0aGlzLmdldFNjYWxlKCkpO1xuICAgICAgICAgICAgICAgIHZhciBzY3JvbGxNYXhUb3AgPSAodGhpcy5zY3JvbGxFbGVtZW50LnNjcm9sbEhlaWdodCAtIHRoaXMuc2Nyb2xsRWxlbWVudC5jbGllbnRIZWlnaHQpIC0gdGhpcy5vcHRpb25zLmVsYXN0aWNFZ2Rlcy5ib3R0b207XG4gICAgICAgICAgICAgICAgcmV0dXJuICh5ID4gc2Nyb2xsTWF4VG9wKSA/IHNjcm9sbE1heFRvcCA6ICh5IDwgdGhpcy5vcHRpb25zLmVsYXN0aWNFZ2Rlcy50b3ApID8gdGhpcy5vcHRpb25zLmVsYXN0aWNFZ2Rlcy50b3AgOiB5O1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIFN3b29zaC5wcm90b3R5cGUuZmFkZU91dEJ5VmVsb2NpdHkgPSBmdW5jdGlvbiAodngsIHZ5KSB7XG4gICAgICAgICAgICAgICAgLyogVE9ETzogY2FsYyB2IGhlcmUgYW5kIHdpdGggbW9yZSBpbmZvLCBtb3JlIHByZWNpc2VseSAqL1xuICAgICAgICAgICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgICAgICAgICAgLyogY2FsY3VsYXRlIHRoZSBicmFrZSBhY2NlbGVyYXRpb24gaW4gYm90aCBkaXJlY3Rpb25zIHNlcGFyYXRlbHkgKi9cbiAgICAgICAgICAgICAgICB2YXIgYXkgPSAodnkgPiAwID8gLTEgOiAxKSAqIHRoaXMub3B0aW9ucy5kcmFnT3B0aW9ucy5icmFrZVNwZWVkO1xuICAgICAgICAgICAgICAgIHZhciBheCA9ICh2eCA+IDAgPyAtMSA6IDEpICogdGhpcy5vcHRpb25zLmRyYWdPcHRpb25zLmJyYWtlU3BlZWQ7XG4gICAgICAgICAgICAgICAgLyogZmluZCB0aGUgZGlyZWN0aW9uIHRoYXQgbmVlZHMgbG9uZ2VyIHRvIHN0b3AsIGFuZCByZWNhbGN1bGF0ZSB0aGUgYWNjZWxlcmF0aW9uICovXG4gICAgICAgICAgICAgICAgdmFyIHRtYXggPSBNYXRoLm1heCgoMCAtIHZ5KSAvIGF5LCAoMCAtIHZ4KSAvIGF4KTtcbiAgICAgICAgICAgICAgICBheCA9ICgwIC0gdngpIC8gdG1heDtcbiAgICAgICAgICAgICAgICBheSA9ICgwIC0gdnkpIC8gdG1heDtcbiAgICAgICAgICAgICAgICB2YXIgZnBzID0gdGhpcy5vcHRpb25zLmRyYWdPcHRpb25zLmZwcztcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8ICgodG1heCAqIGZwcykgKyAoMCAvIGZwcykpOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHQgPSAoKGkgKyAxKSAvIGZwcyk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBzeSA9IHRoaXMuc2Nyb2xsRWxlbWVudC5zY3JvbGxUb3AgKyAodnkgKiB0KSArICgwLjUgKiBheSAqIHQgKiB0KTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHN4ID0gdGhpcy5zY3JvbGxFbGVtZW50LnNjcm9sbExlZnQgKyAodnggKiB0KSArICgwLjUgKiBheCAqIHQgKiB0KTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50aW1lb3V0cy5wdXNoKHNldFRpbWVvdXQoKGZ1bmN0aW9uICh4LCB5LCBlbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbC5zY3JvbGxUb3AgPSB5O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsLnNjcm9sbExlZnQgPSB4O1xuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgfSkoc3gsIHN5LCB0aGlzLnNjcm9sbEVsZW1lbnQpLCAoaSArIDEpICogKDEwMDAgLyBmcHMpKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8qIHJvdW5kIHRoZSBsYXN0IHN0ZXAgYmFzZWQgb24gdGhlIGRpcmVjdGlvbiBvZiB0aGUgZmFkZSAqL1xuICAgICAgICAgICAgICAgIHN4ID0gdnggPiAwID8gTWF0aC5jZWlsKHN4KSA6IE1hdGguZmxvb3Ioc3gpO1xuICAgICAgICAgICAgICAgIHN5ID0gdnkgPiAwID8gTWF0aC5jZWlsKHN5KSA6IE1hdGguZmxvb3Ioc3kpO1xuICAgICAgICAgICAgICAgIHRoaXMudGltZW91dHMucHVzaChzZXRUaW1lb3V0KChmdW5jdGlvbiAoeCwgeSwgZWwpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsLnNjcm9sbFRvcCA9IHk7XG4gICAgICAgICAgICAgICAgICAgICAgICBlbC5zY3JvbGxMZWZ0ID0geDtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9KShzeCwgc3ksIHRoaXMuc2Nyb2xsRWxlbWVudCksIChpICsgMikgKiAoMTAwMCAvIGZwcykpKTtcbiAgICAgICAgICAgICAgICAvKiBzdG9wIHRoZSBhbmltYXRpb24gd2hlbiBjb2xsaWRpbmcgd2l0aCB0aGUgYm9yZGVycyAqL1xuICAgICAgICAgICAgICAgIHRoaXMuY2xlYXJMaXN0ZW5lckxlZnQgPSBmdW5jdGlvbiAoKSB7IHJldHVybiBfdGhpcy5jbGVhclRpbWVvdXRzOyB9O1xuICAgICAgICAgICAgICAgIHRoaXMuY2xlYXJMaXN0ZW5lclJpZ2h0ID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gX3RoaXMuY2xlYXJUaW1lb3V0czsgfTtcbiAgICAgICAgICAgICAgICB0aGlzLmNsZWFyTGlzdGVuZXJUb3AgPSBmdW5jdGlvbiAoKSB7IHJldHVybiBfdGhpcy5jbGVhclRpbWVvdXRzOyB9O1xuICAgICAgICAgICAgICAgIHRoaXMuY2xlYXJMaXN0ZW5lckJvdHRvbSA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIF90aGlzLmNsZWFyVGltZW91dHM7IH07XG4gICAgICAgICAgICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKHRoaXMuaW5uZXIsICdjb2xsaWRlLmxlZnQnLCB0aGlzLmNsZWFyTGlzdGVuZXJMZWZ0KTtcbiAgICAgICAgICAgICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIodGhpcy5pbm5lciwgJ2NvbGxpZGUucmlnaHQnLCB0aGlzLmNsZWFyTGlzdGVuZXJSaWdodCk7XG4gICAgICAgICAgICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKHRoaXMuaW5uZXIsICdjb2xsaWRlLnRvcCcsIHRoaXMuY2xlYXJMaXN0ZW5lclRvcCk7XG4gICAgICAgICAgICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKHRoaXMuaW5uZXIsICdjb2xsaWRlLmJvdHRvbScsIHRoaXMuY2xlYXJMaXN0ZW5lckJvdHRvbSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgU3dvb3NoLnByb3RvdHlwZS5mYWRlT3V0QnlDb29yZHMgPSBmdW5jdGlvbiAoeCwgeSkge1xuICAgICAgICAgICAgICAgIHggPSB0aGlzLmdldFJlYWxYKHgpO1xuICAgICAgICAgICAgICAgIHkgPSB0aGlzLmdldFJlYWxZKHkpO1xuICAgICAgICAgICAgICAgIHZhciBhID0gdGhpcy5vcHRpb25zLmRyYWdPcHRpb25zLmJyYWtlU3BlZWQgKiAtMTtcbiAgICAgICAgICAgICAgICB2YXIgdnkgPSAwIC0gKDIgKiBhICogKHkgLSB0aGlzLnNjcm9sbEVsZW1lbnQuc2Nyb2xsVG9wKSk7XG4gICAgICAgICAgICAgICAgdmFyIHZ4ID0gMCAtICgyICogYSAqICh4IC0gdGhpcy5zY3JvbGxFbGVtZW50LnNjcm9sbExlZnQpKTtcbiAgICAgICAgICAgICAgICB2eSA9ICh2eSA+IDAgPyAxIDogLTEpICogTWF0aC5zcXJ0KE1hdGguYWJzKHZ5KSk7XG4gICAgICAgICAgICAgICAgdnggPSAodnggPiAwID8gMSA6IC0xKSAqIE1hdGguc3FydChNYXRoLmFicyh2eCkpO1xuICAgICAgICAgICAgICAgIHZhciBzeCA9IHggLSB0aGlzLnNjcm9sbEVsZW1lbnQuc2Nyb2xsTGVmdDtcbiAgICAgICAgICAgICAgICB2YXIgc3kgPSB5IC0gdGhpcy5zY3JvbGxFbGVtZW50LnNjcm9sbFRvcDtcbiAgICAgICAgICAgICAgICBpZiAoTWF0aC5hYnMoc3kpID4gTWF0aC5hYnMoc3gpKSB7XG4gICAgICAgICAgICAgICAgICAgIHZ4ID0gKHZ4ID4gMCA/IDEgOiAtMSkgKiBNYXRoLmFicygoc3ggLyBzeSkgKiB2eSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB2eSA9ICh2eSA+IDAgPyAxIDogLTEpICogTWF0aC5hYnMoKHN5IC8gc3gpICogdngpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLmNsZWFyVGltZW91dHM7XG4gICAgICAgICAgICAgICAgdGhpcy5mYWRlT3V0QnlWZWxvY2l0eSh2eCwgdnkpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogTW91c2UgbW92ZSBoYW5kbGVyXG4gICAgICAgICAgICAgKiBDYWxjdWNhdGVzIHRoZSB4IGFuZCB5IGRlbHRhcyBhbmQgc2Nyb2xsc1xuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBwYXJhbSB7TW91c2VFdmVudH0gZSAtIFRoZSBtb3VzZSBtb3ZlIGV2ZW50IG9iamVjdFxuICAgICAgICAgICAgICogQHJldHVybiB7dm9pZH1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgU3dvb3NoLnByb3RvdHlwZS5tb3VzZU1vdmUgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuY2xlYXJUZXh0U2VsZWN0aW9uKCk7XG4gICAgICAgICAgICAgICAgLyogaWYgdGhlIG1vdXNlIGxlZnQgdGhlIHdpbmRvdyBhbmQgdGhlIGJ1dHRvbiBpcyBub3QgcHJlc3NlZCBhbnltb3JlLCBhYm9ydCBtb3ZpbmcgKi9cbiAgICAgICAgICAgICAgICBpZiAoKGUuYnV0dG9ucyA9PSAwICYmIGUuYnV0dG9uID09IDApIHx8ICh0eXBlb2YgZS5idXR0b25zID09ICd1bmRlZmluZWQnICYmIGUuYnV0dG9uID09IDApKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubW91c2VVcChlKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgeCA9IHRoaXMuZHJhZ09yaWdpbkxlZnQgKyB0aGlzLmRyYWdPcmlnaW5TY3JvbGxMZWZ0IC0gZS5jbGllbnRYO1xuICAgICAgICAgICAgICAgIHZhciB5ID0gdGhpcy5kcmFnT3JpZ2luVG9wICsgdGhpcy5kcmFnT3JpZ2luU2Nyb2xsVG9wIC0gZS5jbGllbnRZO1xuICAgICAgICAgICAgICAgIC8qICBjYWxjdWxhdGUgc3BlZWQgKi9cbiAgICAgICAgICAgICAgICB0aGlzLnByZXNlbnQgPSAodGhpcy5nZXRUaW1lc3RhbXAoKSAvIDEwMDApOyAvL2luIHNlY29uZHNcbiAgICAgICAgICAgICAgICB2YXIgdCA9IHRoaXMucHJlc2VudCAtICh0aGlzLnBhc3QgPyB0aGlzLnBhc3QgOiB0aGlzLnByZXNlbnQpO1xuICAgICAgICAgICAgICAgIHZhciBzeCA9IHggLSAodGhpcy5wYXN0WCA/IHRoaXMucGFzdFggOiB4KTtcbiAgICAgICAgICAgICAgICB2YXIgc3kgPSB5IC0gKHRoaXMucGFzdFkgPyB0aGlzLnBhc3RZIDogeSk7XG4gICAgICAgICAgICAgICAgdGhpcy52eCA9IHQgPT0gMCA/IDAgOiBzeCAvIHQ7XG4gICAgICAgICAgICAgICAgdGhpcy52eSA9IHQgPT0gMCA/IDAgOiBzeSAvIHQ7XG4gICAgICAgICAgICAgICAgdGhpcy5wYXN0ID0gdGhpcy5wcmVzZW50O1xuICAgICAgICAgICAgICAgIHRoaXMucGFzdFggPSB4O1xuICAgICAgICAgICAgICAgIHRoaXMucGFzdFkgPSB5O1xuICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsVG8oeCwgeSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgU3dvb3NoLnByb3RvdHlwZS5zY3JvbGxCeSA9IGZ1bmN0aW9uICh4LCB5LCBzbW9vdGgpIHtcbiAgICAgICAgICAgICAgICBpZiAoc21vb3RoID09PSB2b2lkIDApIHsgc21vb3RoID0gZmFsc2U7IH1cbiAgICAgICAgICAgICAgICB2YXIgYWJzb2x1dGVYID0gdGhpcy5zY3JvbGxFbGVtZW50LnNjcm9sbExlZnQgKyB4O1xuICAgICAgICAgICAgICAgIHZhciBhYnNvbHV0ZVkgPSB0aGlzLnNjcm9sbEVsZW1lbnQuc2Nyb2xsVG9wICsgeTtcbiAgICAgICAgICAgICAgICB0aGlzLnNjcm9sbFRvKGFic29sdXRlWCwgYWJzb2x1dGVZLCBzbW9vdGgpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogc2Nyb2xsVG8gaGVscGVyIG1ldGhvZFxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSB4IC0geC1jb29yZGluYXRlIHRvIHNjcm9sbCB0b1xuICAgICAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IHkgLSB5LWNvb3JkaW5hdGUgdG8gc2Nyb2xsIHRvXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHt2b2lkfVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBTd29vc2gucHJvdG90eXBlLnNjcm9sbFRvID0gZnVuY3Rpb24gKHgsIHksIHNtb290aCkge1xuICAgICAgICAgICAgICAgIGlmIChzbW9vdGggPT09IHZvaWQgMCkgeyBzbW9vdGggPSBmYWxzZTsgfVxuICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsTWF4TGVmdCA9ICh0aGlzLnNjcm9sbEVsZW1lbnQuc2Nyb2xsV2lkdGggLSB0aGlzLnNjcm9sbEVsZW1lbnQuY2xpZW50V2lkdGgpO1xuICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsTWF4VG9wID0gKHRoaXMuc2Nyb2xsRWxlbWVudC5zY3JvbGxIZWlnaHQgLSB0aGlzLnNjcm9sbEVsZW1lbnQuY2xpZW50SGVpZ2h0KTtcbiAgICAgICAgICAgICAgICAvKiBubyBuZWdhdGl2ZSB2YWx1ZXMgb3IgZ3JlYXRlciB0aGFuIHRoZSBtYXhpbXVtICovXG4gICAgICAgICAgICAgICAgdmFyIHggPSAoeCA+IHRoaXMuc2Nyb2xsTWF4TGVmdCkgPyB0aGlzLnNjcm9sbE1heExlZnQgOiAoeCA8IDApID8gMCA6IHg7XG4gICAgICAgICAgICAgICAgdmFyIHkgPSAoeSA+IHRoaXMuc2Nyb2xsTWF4VG9wKSA/IHRoaXMuc2Nyb2xsTWF4VG9wIDogKHkgPCAwKSA/IDAgOiB5O1xuICAgICAgICAgICAgICAgIC8qIHJlbWVtYmVyIHRoZSBvbGQgdmFsdWVzICovXG4gICAgICAgICAgICAgICAgdGhpcy5vcmlnaW5TY3JvbGxMZWZ0ID0gdGhpcy5zY3JvbGxFbGVtZW50LnNjcm9sbExlZnQ7XG4gICAgICAgICAgICAgICAgdGhpcy5vcmlnaW5TY3JvbGxUb3AgPSB0aGlzLnNjcm9sbEVsZW1lbnQuc2Nyb2xsVG9wO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMud2hlZWxPcHRpb25zLnNtb290aCAhPSB0cnVlIHx8IHNtb290aCA9PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNjcm9sbEVsZW1lbnQuc2Nyb2xsVG9wID0geTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zY3JvbGxFbGVtZW50LnNjcm9sbExlZnQgPSB4O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5mYWRlT3V0QnlDb29yZHMoeCwgeSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogUmVnaXN0ZXIgY3VzdG9tIGV2ZW50IGNhbGxiYWNrc1xuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBldmVudCAtIFRoZSBldmVudCBuYW1lXG4gICAgICAgICAgICAgKiBAcGFyYW0geyhlOiBFdmVudCkgPT4gYW55fSBjYWxsYmFjayAtIEEgY2FsbGJhY2sgZnVuY3Rpb24gdG8gZXhlY3V0ZSB3aGVuIHRoZSBldmVudCByYWlzZXNcbiAgICAgICAgICAgICAqIEByZXR1cm4ge1N3b29zaH0gLSBUaGUgU3dvb3NoIG9iamVjdCBpbnN0YW5jZVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBTd29vc2gucHJvdG90eXBlLm9uID0gZnVuY3Rpb24gKGV2ZW50LCBjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcih0aGlzLmlubmVyLCBldmVudCwgY2FsbGJhY2spO1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogRGVyZWdpc3RlciBjdXN0b20gZXZlbnQgY2FsbGJhY2tzXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50IC0gVGhlIGV2ZW50IG5hbWVcbiAgICAgICAgICAgICAqIEBwYXJhbSB7KGU6IEV2ZW50KSA9PiBhbnl9IGNhbGxiYWNrIC0gQSBjYWxsYmFjayBmdW5jdGlvbiB0byBleGVjdXRlIHdoZW4gdGhlIGV2ZW50IHJhaXNlc1xuICAgICAgICAgICAgICogQHJldHVybiB7U3dvb3NofSAtIFRoZSBTd29vc2ggb2JqZWN0IGluc3RhbmNlXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIFN3b29zaC5wcm90b3R5cGUub2ZmID0gZnVuY3Rpb24gKGV2ZW50LCBjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIHRoaXMucmVtb3ZlRXZlbnRMaXN0ZW5lcih0aGlzLmlubmVyLCBldmVudCwgY2FsbGJhY2spO1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogUmV2ZXJ0IGFsbCBET00gbWFuaXB1bGF0aW9uIGFuZCBkZXJlZ2lzdGVyIGFsbCBldmVudCBoYW5kbGVyc1xuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEByZXR1cm4ge3ZvaWR9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIFN3b29zaC5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgeCA9IHRoaXMuc2Nyb2xsRWxlbWVudC5zY3JvbGxMZWZ0IC0gdGhpcy5vcHRpb25zLmVsYXN0aWNFZ2Rlcy5sZWZ0O1xuICAgICAgICAgICAgICAgIHZhciB5ID0gdGhpcy5zY3JvbGxFbGVtZW50LnNjcm9sbFRvcCAtIHRoaXMub3B0aW9ucy5lbGFzdGljRWdkZXMudG9wO1xuICAgICAgICAgICAgICAgIC8qIHJlbW92ZSB0aGUgb3V0ZXIgYW5kIGdyYWIgQ1NTIGNsYXNzZXMgKi9cbiAgICAgICAgICAgICAgICB2YXIgcmUgPSBuZXcgUmVnRXhwKFwiIFwiICsgdGhpcy5jbGFzc091dGVyICsgXCIgXCIpO1xuICAgICAgICAgICAgICAgIHRoaXMuY29udGFpbmVyLmNsYXNzTmFtZSA9IHRoaXMuY29udGFpbmVyLmNsYXNzTmFtZS5yZXBsYWNlKHJlLCAnJyk7XG4gICAgICAgICAgICAgICAgdmFyIHJlID0gbmV3IFJlZ0V4cChcIiBcIiArIHRoaXMuY2xhc3NHcmFiICsgXCIgXCIpO1xuICAgICAgICAgICAgICAgIHRoaXMuY29udGFpbmVyLmNsYXNzTmFtZSA9IHRoaXMuY29udGFpbmVyLmNsYXNzTmFtZS5yZXBsYWNlKHJlLCAnJyk7XG4gICAgICAgICAgICAgICAgLyogbW92ZSBhbGwgY2hpbGROb2RlcyBiYWNrIHRvIHRoZSBvbGQgb3V0ZXIgZWxlbWVudCBhbmQgcmVtb3ZlIHRoZSBpbm5lciBlbGVtZW50ICovXG4gICAgICAgICAgICAgICAgd2hpbGUgKHRoaXMuaW5uZXIuY2hpbGROb2Rlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY29udGFpbmVyLmFwcGVuZENoaWxkKHRoaXMuaW5uZXIuY2hpbGROb2Rlc1swXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuY29udGFpbmVyLnJlbW92ZUNoaWxkKHRoaXMuaW5uZXIpO1xuICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsVG8oeCwgeSk7XG4gICAgICAgICAgICAgICAgdGhpcy5tb3VzZU1vdmVIYW5kbGVyID8gdGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCwgJ21vdXNlbW92ZScsIHRoaXMubW91c2VNb3ZlSGFuZGxlcikgOiBudWxsO1xuICAgICAgICAgICAgICAgIHRoaXMubW91c2VVcEhhbmRsZXIgPyB0aGlzLnJlbW92ZUV2ZW50TGlzdGVuZXIoZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LCAnbW91c2V1cCcsIHRoaXMubW91c2VVcEhhbmRsZXIpIDogbnVsbDtcbiAgICAgICAgICAgICAgICB0aGlzLm1vdXNlRG93bkhhbmRsZXIgPyB0aGlzLnJlbW92ZUV2ZW50TGlzdGVuZXIodGhpcy5pbm5lciwgJ21vdXNlZG93bicsIHRoaXMubW91c2VEb3duSGFuZGxlcikgOiBudWxsO1xuICAgICAgICAgICAgICAgIHRoaXMubW91c2VTY3JvbGxIYW5kbGVyID8gdGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKHRoaXMuc2Nyb2xsRWxlbWVudCwgJ3doZWVsJywgdGhpcy5tb3VzZVNjcm9sbEhhbmRsZXIpIDogbnVsbDtcbiAgICAgICAgICAgICAgICB0aGlzLnNjcm9sbEVsZW1lbnQgPyB0aGlzLnNjcm9sbEVsZW1lbnQub25tb3VzZXdoZWVsID0gbnVsbCA6IG51bGw7XG4gICAgICAgICAgICAgICAgdGhpcy5zY3JvbGxFbGVtZW50ID8gdGhpcy5zY3JvbGxFbGVtZW50Lm9uc2Nyb2xsID0gbnVsbCA6IG51bGw7XG4gICAgICAgICAgICAgICAgd2luZG93Lm9ucmVzaXplID0gbnVsbDtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcmV0dXJuIFN3b29zaDtcbiAgICAgICAgfSgpKTtcbiAgICAgICAgLyogcmV0dXJuIGFuIGluc3RhbmNlIG9mIHRoZSBjbGFzcyAqL1xuICAgICAgICByZXR1cm4gbmV3IFN3b29zaChjb250YWluZXIsIG9wdGlvbnMpO1xuICAgIH1cbiAgICBleHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuICAgIGV4cG9ydHNbXCJkZWZhdWx0XCJdID0gZGVmYXVsdF8xO1xufSk7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1zd29vc2guanMubWFwIl19
