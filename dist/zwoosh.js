(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.zwoosh = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
     * Export function of the module
     *
     * @param {HTMLElement} container - The HTMLElement to swoooosh!
     * @param {Options} options - the options object to configure Zwoosh
     * @return {Zwoosh} - Zwoosh object instance
     */
    function zwoosh(container, options) {
        if (options === void 0) { options = {}; }
        /**
         * Polyfill bind function for older browsers
         * The bind function is an addition to ECMA-262, 5th edition
         * @see: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind
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
         * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/indexOf
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
         * Zwoosh provides a set of functions to implement scroll by drag, zoom by mousewheel,
         * hash links inside the document and other special scroll related requirements.
         *
         * @author Roman Gruber <p1020389@yahoo.com>
         * @version 1.0.1
         */
        var Zwoosh = (function () {
            function Zwoosh(container, options) {
                this.container = container;
                this.options = options;
                /* CSS style classes */
                this.classInner = 'zw-inner';
                this.classOuter = 'zw-outer';
                this.classGrab = 'zw-grab';
                this.classNoGrab = 'zw-nograb';
                this.classGrabbing = 'zw-grabbing';
                this.classUnique = 'zw-' + Math.random().toString(36).substring(7);
                this.classScale = 'zw-scale';
                this.classIgnore = 'zw-ignore';
                this.classFakeBody = 'zw-fakebody';
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
                this.vx = [];
                this.vy = [];
                this.container = container;
                /* set default options */
                var defaultOptions = {
                    /* 1 means do not align to a grid */
                    gridX: 1,
                    gridY: 1,
                    /* shows a grid as an overlay over the element. Works only if the browser supports
                     * CSS Generated content for pseudo-elements
                     * @see http://caniuse.com/#search=%3Abefore */
                    gridShow: false,
                    /* which edge should be elastic */
                    elasticEdges: {
                        left: false,
                        right: false,
                        top: false,
                        bottom: false
                    },
                    /* activates/deactivates scrolling by drag */
                    dragScroll: true,
                    dragOptions: {
                        exclude: ['input', 'textarea', 'a', 'button', '.' + this.classIgnore, 'select'],
                        only: [],
                        /* activates a scroll fade when scrolling by drag */
                        fade: true,
                        /* fade: brake acceleration in pixels per second per second (p/s²) */
                        brakeSpeed: 2500,
                        /* fade: frames per second of the zwoosh fadeout animation (>=25 looks like motion) */
                        fps: 30,
                        /* fade: this speed will never be exceeded */
                        maxSpeed: 3000,
                        /* fade: minimum speed which triggers the fade */
                        minSpeed: 300
                    },
                    /* activates/deactivates scrolling by wheel. If the dreiction is vertical and there are
                     * scrollbars present, zwoosh lets leaves scrolling to the browser. */
                    wheelScroll: true,
                    wheelOptions: {
                        /* direction to scroll when the mouse wheel is used */
                        direction: 'vertical',
                        /* amount of pixels for one scroll step */
                        step: 114,
                        /* scroll smooth or instant */
                        smooth: true
                    },
                    /* activates/deactivates zooming by wheel. Works only with a CSS3 2D Transform capable browser.
                     * @see http://caniuse.com/#feat=transforms2d */
                    wheelZoom: false,
                    zoomOptions: {
                        /* the maximum scale, 0 means no maximum */
                        maxScale: 0,
                        /* the minimum scale, 0 means no minimum */
                        minScale: 0,
                        /* one step when using the wheel to zoom */
                        step: 0.1,
                        /* mouse wheel direction to zoom larger */
                        direction: 'up'
                    },
                    /* let zwoosh handle anchor links targeting to an anchor inside of this zwoosh element.
                     * the element outside (maybe the body) handles anchors too. If you want to prevent this,
                     * add to body as zwoosh element too. */
                    handleAnchors: true
                };
                this.options = this.mergeOptions(options, defaultOptions);
                this.init();
            }
            /**
             * Merge the default option object with the provided one
             *
             * @param {Options} options - the given options
             * @param {Options} defaultOptions - the default options
             * @return {Options} - the merged options object
             */
            Zwoosh.prototype.mergeOptions = function (options, defaultOptions) {
                /* merge the default option object with the provided one */
                for (var key in options) {
                    if (options.hasOwnProperty(key)) {
                        if (typeof options[key] === 'object') {
                            for (var okey in options[key]) {
                                if (options[key].hasOwnProperty(okey))
                                    defaultOptions[key][okey] = options[key][okey];
                            }
                        }
                        else {
                            defaultOptions[key] = options[key];
                        }
                    }
                }
                return defaultOptions;
            };
            /**
             * Initialize DOM manipulations and event handlers
             *
             * @return {void}
             */
            Zwoosh.prototype.init = function () {
                var _this = this;
                this.initBody();
                this.addClass(this.container, this.classOuter);
                this.scrollElement = this.container;
                var x = this.getScrollLeft();
                var y = this.getScrollTop();
                /* create inner div element and append it to the container with its contents in it */
                this.inner = document.createElement("div");
                this.addClass(this.inner, this.classInner);
                this.addClass(this.inner, this.classUnique);
                this.scaleElement = document.createElement("div");
                this.addClass(this.scaleElement, this.classScale);
                this.scaleElement.appendChild(this.inner);
                /* move all childNodes to the new inner element */
                while (this.container.childNodes.length > 0) {
                    this.inner.appendChild(this.container.childNodes[0]);
                }
                this.container.appendChild(this.scaleElement);
                var border = this.getBorder(this.container);
                this.inner.style.minWidth = (this.container.scrollWidth - border[0]) + 'px';
                this.inner.style.minHeight = (this.container.scrollHeight - border[1]) + 'px';
                this.scaleElement.style.minWidth = this.inner.style.minWidth;
                this.scaleElement.style.minHeight = this.inner.style.minHeight;
                this.scaleElement.style.overflow = 'hidden';
                this.initGrid();
                this.oldClientWidth = document.documentElement.clientWidth;
                this.oldClientHeight = document.documentElement.clientHeight;
                /* just call the function, to trigger possible events */
                this.onScroll();
                /* scroll to the initial position */
                this.scrollTo(x, y, false);
                /* Event handler registration start here */
                this.initWheelScroll();
                this.initWheelZoom();
                /* scrollhandler */
                this.scrollHandler = function (e) { return _this.onScroll(e); };
                this.addEventListener(this.container, 'scroll', this.scrollHandler);
                /* if the scroll element is body, adjust the inner div when resizing */
                if (this.isBody) {
                    this.resizeHandler = function (e) { return _this.onResize(e); }; //TODO: same as above in the wheel handler
                    window.onresize = this.resizeHandler;
                }
                this.initDragScroll();
                this.initAnchors();
            };
            /**
             * Reinitialize the zwoosh element
             *
             * @return {Zwoosh} - The Zwoosh object instance
             * @TODO: preserve scroll position in init()
             */
            Zwoosh.prototype.reinit = function () {
                this.destroy();
                this.classUnique = 'zw-' + Math.random().toString(36).substring(7);
                this.init();
                return this;
            };
            Zwoosh.prototype.initBody = function () {
                this.isBody = this.container.tagName === "BODY" ? true : false;
                /* Chrome solution to scroll the body is not really viable, so we create a fake body
                 * div element to scroll on */
                if (this.isBody === true) {
                    var pseudoBody = document.createElement("div");
                    this.addClass(pseudoBody, this.classFakeBody);
                    pseudoBody.style.cssText = document.body.style.cssText;
                    while (this.container.childNodes.length > 0) {
                        pseudoBody.appendChild(this.container.childNodes[0]);
                    }
                    this.container.appendChild(pseudoBody);
                    this.container = pseudoBody;
                }
            };
            Zwoosh.prototype.initGrid = function () {
                /* show the grid only if at least one of the grid values is not 1 */
                if ((this.options.gridX !== 1 || this.options.gridY !== 1) && this.options.gridShow) {
                    var bgi = [];
                    this.options.gridX !== 1 ? bgi.push('linear-gradient(to right, grey 1px, transparent 1px)') : null;
                    this.options.gridY !== 1 ? bgi.push('linear-gradient(to bottom, grey 1px, transparent 1px)') : null;
                    this.addBeforeCSS(this.classUnique, 'width', this.inner.style.minWidth);
                    this.addBeforeCSS(this.classUnique, 'height', this.inner.style.minHeight);
                    this.addBeforeCSS(this.classUnique, 'left', '-' + this.getStyle(this.container, 'paddingLeft'));
                    this.addBeforeCSS(this.classUnique, 'top', '-' + this.getStyle(this.container, 'paddingTop'));
                    this.addBeforeCSS(this.classUnique, 'background-size', (this.options.gridX !== 1 ? this.options.gridX + 'px ' : 'auto ') + (this.options.gridY !== 1 ? this.options.gridY + 'px' : 'auto'));
                    this.addBeforeCSS(this.classUnique, 'background-image', bgi.join(', '));
                }
            };
            Zwoosh.prototype.initWheelScroll = function () {
                var _this = this;
                /* TODO: not 2 different event handlers registrations -> do it in this.addEventListener() */
                if (this.options.wheelScroll === false) {
                    this.mouseScrollHandler = function (e) { return _this.disableMouseScroll(e); };
                    this.scrollElement.onmousewheel = this.mouseScrollHandler;
                    this.addEventListener(this.scrollElement, 'wheel', this.mouseScrollHandler);
                }
                else if (this.options.wheelScroll === true) {
                    this.mouseScrollHandler = function (e) { return _this.activeMouseScroll(e); };
                    this.scrollElement.onmousewheel = this.mouseScrollHandler;
                    this.addEventListener(this.scrollElement, 'wheel', this.mouseScrollHandler);
                }
            };
            /* wheelzoom */
            Zwoosh.prototype.initWheelZoom = function () {
                var _this = this;
                this.options.gridShow ? this.scaleTo(1) : null;
                if (this.options.wheelZoom === true) {
                    this.mouseZoomHandler = function (e) { return _this.activeMouseZoom(e); };
                    this.addEventListener(this.scrollElement, 'wheel', this.mouseZoomHandler);
                }
            };
            Zwoosh.prototype.initDragScroll = function () {
                var _this = this;
                /* if dragscroll is activated, register mousedown event */
                if (this.options.dragScroll === true) {
                    this.addClass(this.inner, this.classGrab);
                    this.mouseDownHandler = function (e) { return _this.mouseDown(e); };
                    this.addEventListener(this.inner, 'mousedown', this.mouseDownHandler);
                }
                else {
                    this.addClass(this.container, this.classNoGrab);
                }
            };
            Zwoosh.prototype.initAnchors = function () {
                var _this = this;
                if (this.options.handleAnchors === true) {
                    var links = this.container.querySelectorAll("a[href^='#']");
                    this.hashChangeClickHandler = function (e) {
                        var target = e ? e.target : window.event.srcElement;
                        if (typeof target !== 'undefined') {
                            /* pushState changes the hash without triggering hashchange */
                            history.pushState({}, '', target.href);
                            /* we don't want to trigger hashchange, so prevent default behavior when clicking on anchor links */
                            if (e.preventDefault) {
                                e.preventDefault();
                            }
                            else {
                                e.returnValue = false;
                            }
                        }
                        /* trigger a custom hashchange event, because pushState prevents the real hashchange event */
                        _this.triggerEvent(window, 'myhashchange');
                    };
                    /* loop trough all anchor links in the element and disable them to prevent the
                     * browser from scrolling because of the changing hash value. Instead the own
                     * event myhashchange should handle page and element scrolling */
                    for (var i = 0; i < links.length; i++) {
                        this.addEventListener(links[i], 'click', this.hashChangeClickHandler, false);
                    }
                    this.hashChangeHandler = function (e) { return _this.onHashChange(e); };
                    this.addEventListener(window, 'myhashchange', this.hashChangeHandler);
                    this.addEventListener(window, 'hashchange', this.hashChangeHandler);
                    this.onHashChange();
                }
            };
            /* @TODO: ScrollWidth and ClientWidth ScrollHeight ClientHeight */
            Zwoosh.prototype.getScrollLeft = function () {
                return this.scrollElement.scrollLeft;
            };
            Zwoosh.prototype.setScrollLeft = function (left) {
                this.scrollElement.scrollLeft = left;
            };
            Zwoosh.prototype.getScrollTop = function () {
                return this.scrollElement.scrollTop;
            };
            Zwoosh.prototype.setScrollTop = function (top) {
                this.scrollElement.scrollTop = top;
            };
            /**
             * Handle hashchanges with own scroll function
             *
             * @param {Event} e - the hashchange or myhashchange event, or nothing
             * @return {void}
             */
            Zwoosh.prototype.onHashChange = function (e) {
                if (e === void 0) { e = null; }
                var hash = window.location.hash.substr(1);
                if (hash !== '') {
                    var anchors = this.container.querySelectorAll('#' + hash);
                    for (var i = 0; i < anchors.length; i++) {
                        var element = anchors[i];
                        var container = anchors[i];
                        // find the next parent which is a container element
                        var nextContainer = element;
                        while (container && container.parentElement && this.container !== container) {
                            if (this.hasClass(container, this.classOuter)) {
                                nextContainer = container;
                            }
                            container = container.parentElement;
                        }
                        if (e !== null) {
                            if (e.type === 'hashchange') {
                                /* scrolling instantly back to origin, before do the animated scroll */
                                this.scrollTo(this.originScrollLeft, this.originScrollTop, false);
                            }
                        }
                        this.scrollToElement(nextContainer);
                        return;
                    }
                }
            };
            /**
             * Scroll to an element in the DOM
             *
             * @param {HTMLElement} element - the HTMLElement to scroll to
             */
            Zwoosh.prototype.scrollToElement = function (element) {
                /* get relative coords from the anchor element */
                var x = (element.offsetLeft - this.container.offsetLeft) * this.getScale();
                var y = (element.offsetTop - this.container.offsetTop) * this.getScale();
                this.scrollTo(x, y);
            };
            /**
             * Workaround to manipulate ::before CSS styles with javascript
             *
             * @param {string} cssClass - the CSS class name to add ::before properties
             * @param {string} cssProperty - the CSS property to set
             * @param {string} cssValue - the CSS value to set
             * @return {void}
             */
            Zwoosh.prototype.addBeforeCSS = function (cssClass, cssProperty, cssValue) {
                if (typeof document.styleSheets[0].insertRule === 'function') {
                    document.styleSheets[0].insertRule('.' + cssClass + '::before { ' + cssProperty + ': ' + cssValue + '}', 0);
                }
                else if (typeof document.styleSheets[0].addRule === 'function') {
                    document.styleSheets[0].addRule('.' + cssClass + '::before', cssProperty + ': ' + cssValue);
                }
            };
            /**
             * Get compute pixel number of the whole width and height from a border of an element
             *
             * @param {HTMLElement} el - the HTML element
             * @return {array} [width, height] - the amount of pixels
             */
            Zwoosh.prototype.getBorder = function (el) {
                var bl = convertBorder(this.getStyle(el, 'borderLeftWidth'));
                var br = convertBorder(this.getStyle(el, 'borderRightWidth'));
                var pl = convertSpan(this.getStyle(el, 'paddingLeft'));
                var pr = convertSpan(this.getStyle(el, 'paddingRight'));
                var ml = convertSpan(this.getStyle(el, 'marginLeft'));
                var mr = convertSpan(this.getStyle(el, 'marginRight'));
                var bt = convertBorder(this.getStyle(el, 'borderTopWidth'));
                var bb = convertBorder(this.getStyle(el, 'borderBottomWidth'));
                var pt = convertSpan(this.getStyle(el, 'paddingTop'));
                var pb = convertSpan(this.getStyle(el, 'paddingBottom'));
                var mt = convertSpan(this.getStyle(el, 'marginTop'));
                var mb = convertSpan(this.getStyle(el, 'marginBottom'));
                function convertBorder(b) {
                    return b === 'thin' ? 1 : b === 'medium' ? 3 : b === 'thick' ? 5 : !isNaN(parseInt(b, 10)) ? parseInt(b, 10) : 0;
                }
                function convertSpan(v) {
                    return v === 'auto' ? 0 : !isNaN(parseInt(v, 10)) ? parseInt(v, 10) : 0;
                }
                return [
                    (pl + pr + bl + br + ml + mr),
                    (pt + pb + bt + bb + mt + mb)
                ];
            };
            /**
             * Disables the scroll wheel of the mouse
             *
             * @param {MouseWheelEvent} e - the mouse wheel event
             * @return {void}
             */
            Zwoosh.prototype.disableMouseScroll = function (e) {
                if (this.elementBehindCursorIsMe(e.clientX, e.clientY)) {
                    this.clearTimeouts();
                    if (!e) {
                        e = window.event;
                    }
                    if (e.preventDefault) {
                        e.preventDefault();
                    }
                    else {
                        e.returnValue = false;
                    }
                }
            };
            /**
             * Determine whether an element has a scrollbar or not
             *
             * @param {HTMLElement} element - the HTMLElement
             * @param {string} direction - determine the vertical or horizontal scrollbar?
             * @return {boolean} - whether the element has scrollbars or not
             */
            Zwoosh.prototype.hasScrollbar = function (element, direction) {
                var has = false;
                var overflow = 'overflow';
                if (direction === 'vertical') {
                    overflow = 'overflowY';
                    has = element.scrollHeight > element.clientHeight;
                }
                else if (direction === 'horizontal') {
                    overflow = 'overflowX';
                    has = element.scrollWidth > element.clientWidth;
                }
                // Check the overflow and overflowDirection properties for "auto" and "visible" values
                has = this.getStyle(this.container, 'overflow') === "visible"
                    || this.getStyle(this.container, 'overflowY') === "visible"
                    || (has && this.getStyle(this.container, 'overflow') === "auto")
                    || (has && this.getStyle(this.container, 'overflowY') === "auto");
                return has;
            };
            /**
             * Enables the scroll wheel of the mouse to scroll, specially for divs withour scrollbar
             *
             * @param {MouseWheelEvent} e - the mouse wheel event
             * @return {void}
             */
            Zwoosh.prototype.activeMouseScroll = function (e) {
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
                    if (this.options.wheelOptions.direction === 'vertical' && this.hasScrollbar(this.scrollElement, this.options.wheelOptions.direction)) {
                        if (!((this.triggered.collideBottom && direction === 'down') || (this.triggered.collideTop && direction === 'up'))) {
                            this.clearTimeouts();
                            return;
                        }
                    }
                    this.disableMouseScroll(e);
                    var x = this.getScrollLeft();
                    var y = this.getScrollTop();
                    if (this.options.wheelOptions.direction === 'horizontal') {
                        x = this.getScrollLeft() + (direction === 'down' ? this.options.wheelOptions.step : this.options.wheelOptions.step * -1);
                    }
                    else if (this.options.wheelOptions.direction === 'vertical') {
                        y = this.getScrollTop() + (direction === 'down' ? this.options.wheelOptions.step : this.options.wheelOptions.step * -1);
                    }
                    this.scrollTo(x, y, false);
                }
            };
            /**
             * Enables the scroll wheel of the mouse to zoom
             *
             * @param {MouseWheelEvent} e - the mouse wheel event
             * @return {void}
             */
            Zwoosh.prototype.activeMouseZoom = function (e) {
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
                    var scale;
                    if (direction === this.options.zoomOptions.direction) {
                        scale = this.getScale() * (1 + this.options.zoomOptions.step);
                    }
                    else {
                        scale = this.getScale() / (1 + this.options.zoomOptions.step);
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
            Zwoosh.prototype.scrollbarWidth = function (el) {
                return el.offsetWidth - el.clientWidth - parseInt(this.getStyle(el, 'borderLeftWidth')) - parseInt(this.getStyle(el, 'borderRightWidth'));
            };
            /**
             * Calculates the size of the horizontal scrollbar.
             *
             * @param {HTMLElement} el - The HTMLElememnt
             * @return {number} - the amount of pixels used by the horizontal scrollbar
             */
            Zwoosh.prototype.scrollbarHeight = function (el) {
                return el.offsetHeight - el.clientHeight - parseInt(this.getStyle(el, 'borderTopWidth')) - parseInt(this.getStyle(el, 'borderBottomWidth'));
            };
            /**
             * Retrieves the current scale value or 1 if it is not set.
             *
             * @return {number} - the current scale value
             */
            Zwoosh.prototype.getScale = function () {
                if (typeof this.inner.style.transform !== 'undefined') {
                    var r = this.inner.style.transform.match(/scale\(([0-9,\.]+)\)/) || [""];
                    return parseFloat(r[1]) || 1;
                }
                return 1;
            };
            /**
             * Scales the inner element by a relatice value based on the current scale value.
             *
             * @param {number} percent - percentage of the current scale value
             * @param {boolean} honourLimits - whether to honour maxScale and the minimum width and height
             * of the container element.
             * @return {void}
             */
            Zwoosh.prototype.scaleBy = function (percent, honourLimits) {
                if (honourLimits === void 0) { honourLimits = true; }
                var scale = this.getScale() * (percent / 100);
                this.scaleTo(scale, honourLimits);
            };
            /**
             * Scales the inner element to an absolute value.
             *
             * @param {number} scale - the scale
             * @param {boolean} honourLimits - whether to honour maxScale and the minimum width and height
             * of the container element.
             * @return {void}
             */
            Zwoosh.prototype.scaleTo = function (scale, honourLimits) {
                if (honourLimits === void 0) { honourLimits = true; }
                var width = (parseFloat(this.inner.style.minWidth) * scale);
                var height = (parseFloat(this.inner.style.minHeight) * scale);
                /* scrollbars have width and height too */
                var minWidth = this.container.clientWidth + this.scrollbarWidth(this.container);
                var minHeight = this.container.clientHeight + this.scrollbarHeight(this.container);
                if (honourLimits) {
                    /* loop as long as all limits are honoured */
                    while ((scale > this.options.zoomOptions.maxScale && this.options.zoomOptions.maxScale !== 0)
                        || (scale < this.options.zoomOptions.minScale && this.options.zoomOptions.minScale !== 0)
                        || (width < this.container.clientWidth && !this.isBody)
                        || height < this.container.clientHeight && !this.isBody) {
                        if (scale > this.options.zoomOptions.maxScale) {
                            scale = this.options.zoomOptions.maxScale;
                        }
                        else if (scale < this.options.zoomOptions.minScale) {
                            scale = this.options.zoomOptions.minScale;
                        }
                        if (this.options.zoomOptions.maxScale !== 0) {
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
                this.inner.style.transform = 'translate(0px, 0px) scale(' + scale + ')';
                this.scaleElement.style.minWidth = this.scaleElement.style.width = width + 'px';
                this.scaleElement.style.minHeight = this.scaleElement.style.height = height + 'px';
                /* TODO: here scrollTo based on where the mouse cursor is */
            };
            /**
             * Disables the scroll wheel of the mouse
             *
             * @param {number} x - the x-coordinates
             * @param {number} y - the y-coordinates
             * @return {boolean} - whether the nearest related parent inner element is the one of this object instance
             */
            Zwoosh.prototype.elementBehindCursorIsMe = function (x, y) {
                var elementBehindCursor = document.elementFromPoint(x, y);
                /**
                 * If the element directly behind the cursor is an outer element throw out, because when clicking on a scrollbar
                 * from a div, a drag of the parent Zwoosh element is initiated.
                 */
                if (this.hasClass(elementBehindCursor, this.classOuter)) {
                    return false;
                }
                /* find the next parent which is an inner element */
                while (elementBehindCursor && !this.hasClass(elementBehindCursor, this.classInner)) {
                    elementBehindCursor = elementBehindCursor.parentElement;
                }
                return this.inner === elementBehindCursor;
            };
            Zwoosh.prototype.getTimestamp = function () {
                if (typeof window.performance === 'object') {
                    if ("now" in window.performance) {
                        return window.performance.now();
                    }
                    else if ("webkitNow" in window.performance) {
                        return window.performance.webkitNow();
                    }
                }
                return new Date().getTime();
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
            Zwoosh.prototype.onScroll = function (e) {
                var x = this.getScrollLeft();
                var y = this.getScrollTop();
                this.scrollMaxLeft = (this.scrollElement.scrollWidth - this.scrollElement.clientWidth);
                this.scrollMaxTop = (this.scrollElement.scrollHeight - this.scrollElement.clientHeight);
                // the collideLeft event
                if (x === 0) {
                    this.triggered.collideLeft ? null : this.triggerEvent(this.inner, 'collide.left');
                    this.triggered.collideLeft = true;
                }
                else {
                    this.triggered.collideLeft = false;
                }
                // the collideTop event
                if (y === 0) {
                    this.triggered.collideTop ? null : this.triggerEvent(this.inner, 'collide.top');
                    this.triggered.collideTop = true;
                }
                else {
                    this.triggered.collideTop = false;
                }
                // the collideRight event
                if (x === this.scrollMaxLeft) {
                    this.triggered.collideRight ? null : this.triggerEvent(this.inner, 'collide.right');
                    this.triggered.collideRight = true;
                }
                else {
                    this.triggered.collideRight = false;
                }
                // the collideBottom event
                if (y === this.scrollMaxTop) {
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
            Zwoosh.prototype.onResize = function (e) {
                var _this = this;
                var onResize = function () {
                    _this.inner.style.minWidth = null;
                    _this.inner.style.minHeight = null;
                    /* take away the margin values of the body element */
                    var xDelta = parseInt(_this.getStyle(document.body, 'marginLeft'), 10) + parseInt(_this.getStyle(document.body, 'marginRight'), 10);
                    var yDelta = parseInt(_this.getStyle(document.body, 'marginTop'), 10) + parseInt(_this.getStyle(document.body, 'marginBottom'), 10);
                    //TODO: with this.getBorder()
                    _this.inner.style.minWidth = (document.documentElement.scrollWidth - xDelta) + 'px';
                    _this.inner.style.minHeight = (document.documentElement.scrollHeight - yDelta - 100) + 'px'; //TODO: WTF? why -100 for IE8?
                };
                /**
                 * Trigger the function only when the clientWidth or clientHeight really have changed.
                 * IE8 resides in an infinity loop always triggering the resite event when altering css.
                 */
                if (this.oldClientWidth !== document.documentElement.clientWidth || this.oldClientHeight !== document.documentElement.clientHeight) {
                    window.clearTimeout(this.resizeTimeout);
                    this.resizeTimeout = window.setTimeout(onResize, 10);
                }
                /* write down the old clientWidth and clientHeight for the above comparsion */
                this.oldClientWidth = document.documentElement.clientWidth;
                this.oldClientHeight = document.documentElement.clientHeight;
            };
            Zwoosh.prototype.clearTextSelection = function () {
                if (window.getSelection)
                    window.getSelection().removeAllRanges();
                if (document.selection)
                    document.selection.empty();
            };
            /**
             * Browser independent event registration
             *
             * @param {any} obj - The HTMLElement to attach the event to
             * @param {string} event - The event name without the leading "on"
             * @param {(e: Event) => void} callback - A callback function to attach to the event
             * @param {boolean} bound - whether to bind the callback to the object instance or not
             * @return {void}
             */
            Zwoosh.prototype.addEventListener = function (obj, event, callback, bound) {
                if (bound === void 0) { bound = true; }
                var boundCallback = bound ? callback.bind(this) : callback;
                if (typeof obj.addEventListener === 'function') {
                    if (mapEvents['on' + event] && obj.tagName === "BODY") {
                        obj = mapEvents['on' + event];
                    }
                    obj.addEventListener(event, boundCallback);
                }
                else if (typeof obj.attachEvent === 'object' && htmlEvents['on' + event]) {
                    obj.attachEvent('on' + event, boundCallback);
                }
                else if (typeof obj.attachEvent === 'object' && mapEvents['on' + event]) {
                    if (obj.tagName === "BODY") {
                        var p = 'on' + event;
                        /* example: window.onscroll = boundCallback */
                        mapEvents[p][p] = boundCallback;
                    }
                    else {
                        /* TODO: obj.onscroll ?? */
                        obj.onscroll = boundCallback;
                    }
                }
                else if (typeof obj.attachEvent === 'object') {
                    obj[event] = 1;
                    boundCallback = function (e) {
                        /* TODO: e is the onpropertychange event not one of the custom event objects */
                        if (e.propertyName === event) {
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
             * @param {any} obj - The HTMLElement or window whose event should be detached
             * @param {string} event - The event name without the leading "on"
             * @param {(e: Event) => void} callback - The callback function when attached
             * @return {void}
             *
             * @TODO: unregistering of mapEvents
             */
            Zwoosh.prototype.removeEventListener = function (obj, event, callback) {
                if (event in this.customEvents) {
                    for (var i in this.customEvents[event]) {
                        /* if the event was found in the array by its callback reference */
                        if (this.customEvents[event][i][0] === callback) {
                            /* remove the listener from the array by its bound callback reference */
                            callback = this.customEvents[event][i][1];
                            this.customEvents[event].splice(i, 1);
                            break;
                        }
                    }
                }
                if (typeof obj.removeEventListener === 'function') {
                    obj.removeEventListener(event, callback);
                }
                else if (typeof obj.detachEvent === 'object' && htmlEvents['on' + event]) {
                    obj.detachEvent('on' + event, callback);
                }
                else if (typeof obj.detachEvent === 'object') {
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
            Zwoosh.prototype.triggerEvent = function (obj, eventName) {
                var event;
                if (typeof window.CustomEvent === 'function') {
                    event = new CustomEvent(eventName);
                }
                else if (typeof document.createEvent === 'function') {
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
            Zwoosh.prototype.addClass = function (el, cssClass) {
                if (!this.hasClass(el, cssClass)) {
                    el.className += " " + cssClass + " ";
                }
            };
            Zwoosh.prototype.removeClass = function (el, cssClass) {
                var re = new RegExp(" " + cssClass + " ", 'g');
                el.className = el.className.replace(re, '');
            };
            Zwoosh.prototype.hasClass = function (el, cssClass) {
                var re = new RegExp(" " + cssClass + " ");
                return el.className.match(re) !== null;
            };
            /**
             * Get a css style property value browser independent
             *
             * @param {HTMLElement} el - The HTMLElement to lookup
             * @param {string} jsProperty - The css property name in javascript in camelCase (e.g. "marginLeft", not "margin-left")
             * @return {string} - the property value
             */
            Zwoosh.prototype.getStyle = function (el, jsProperty) {
                var cssProperty = jsProperty.replace(/([A-Z])/g, "-$1").toLowerCase();
                if (typeof window.getComputedStyle === 'function') {
                    return window.getComputedStyle(el).getPropertyValue(cssProperty);
                }
                else {
                    return el.currentStyle[jsProperty];
                }
            };
            Zwoosh.prototype.clearTimeouts = function () {
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
            Zwoosh.prototype.mouseDown = function (e) {
                var _this = this;
                this.clearTimeouts();
                /* drag only if the left mouse button was pressed */
                if (("which" in e && e.which === 1) || (typeof e.which === 'undefined' && "button" in e && e.button === 1)) {
                    if (this.elementBehindCursorIsMe(e.clientX, e.clientY)) {
                        /* prevent image dragging action */
                        var imgs = this.container.querySelectorAll('img');
                        for (var i = 0; i < imgs.length; i++) {
                            imgs[i].ondragstart = function () { return false; }; //MSIE
                        }
                        /* search the DOM for exclude elements */
                        if (this.options.dragOptions.exclude.length !== 0) {
                            /* drag only if the mouse clicked on an allowed element */
                            var el = document.elementFromPoint(e.clientX, e.clientY);
                            var excludeElements = this.container.querySelectorAll(this.options.dragOptions.exclude.join(', '));
                            /* loop through all parent elements until we encounter an inner div or no more parents */
                            while (el && !this.hasClass(el, this.classInner)) {
                                /* compare each parent, if it is in the exclude list */
                                for (var i = 0; i < excludeElements.length; i++) {
                                    /* bail out if an element matches */
                                    if (excludeElements[i] === el) {
                                        return;
                                    }
                                    ;
                                }
                                el = el.parentElement;
                            }
                        }
                        // search the DOM for only elements, but only if there are elements set
                        /*if (this.options.dragOptions.only.length !== 0){
                          var onlyElements = this.container.querySelectorAll(this.options.dragOptions.only.join(', '));
                          // loop through the nodelist and check for our element
                          var found = false;
                          for (var i = 0; i < excludeElements.length; i++) {
                            if (onlyElements[i] === el) {
                              found = true;
                              break;
                            }
                          }
                          if (found === false) {
                            return;
                          }
                        }*/
                        this.addClass(document.body, this.classGrabbing);
                        this.dragging = true;
                        /* note the origin positions */
                        this.dragOriginLeft = e.clientX;
                        this.dragOriginTop = e.clientY;
                        this.dragOriginScrollLeft = this.getScrollLeft();
                        this.dragOriginScrollTop = this.getScrollTop();
                        /* it looks strange if scroll-behavior is set to smooth */
                        this.parentOriginStyle = this.inner.parentElement.style.cssText;
                        if (typeof this.inner.parentElement.style.setProperty === 'function') {
                            this.inner.parentElement.style.setProperty('scroll-behavior', 'auto');
                        }
                        if (e.preventDefault) {
                            e.preventDefault();
                        }
                        else {
                            e.returnValue = false;
                        }
                        this.vx = [];
                        this.vy = [];
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
            Zwoosh.prototype.mouseUp = function (e) {
                /* TODO: restore original position value */
                this.inner.style.position = '';
                this.inner.style.top = null;
                this.inner.style.left = null;
                this.present = (this.getTimestamp() / 1000); //in seconds
                var x = this.dragOriginLeft + this.dragOriginScrollLeft - e.clientX;
                var y = this.dragOriginTop + this.dragOriginScrollTop - e.clientY;
                _a = this.getRealCoords(x, y), x = _a[0], y = _a[1];
                this.removeClass(document.body, this.classGrabbing);
                this.inner.parentElement.style.cssText = this.parentOriginStyle;
                this.dragging = false;
                this.removeEventListener(document.documentElement, 'mousemove', this.mouseMoveHandler);
                this.removeEventListener(document.documentElement, 'mouseup', this.mouseUpHandler);
                if (y !== this.getScrollTop() || x !== this.getScrollLeft()) {
                    var t = this.present - (this.past ? this.past : this.present);
                    if (t > 0.05) {
                        /* just align to the grid if the mouse left unmoved for more than 0.05 seconds */
                        this.scrollTo(x, y, this.options.dragOptions.fade);
                    }
                }
                if (this.options.dragOptions.fade && typeof this.vx !== 'undefined' && typeof this.vy !== 'undefined') {
                    var vx, vy;
                    _b = this.calcAverageVelocity(0.1), vx = _b[0], vy = _b[1];
                    /* v should not exceed vMax or -vMax -> would be too fast and should exceed vMin or -vMin */
                    var vMax = this.options.dragOptions.maxSpeed;
                    var vMin = this.options.dragOptions.minSpeed;
                    /* if the speed is not without bound for fade, just do a regular scroll when there is a grid*/
                    if (vy < vMin && vy > -vMin && vx < vMin && vx > -vMin) {
                        if (this.options.gridY > 1 || this.options.gridX > 1) {
                            this.scrollTo(x, y);
                        }
                        return;
                    }
                    vx = (vx <= vMax && vx >= -vMax) ? vx : (vx > 0 ? vMax : -vMax);
                    vy = (vy <= vMax && vy >= -vMax) ? vy : (vy > 0 ? vMax : -vMax);
                    var ax = (vx > 0 ? -1 : 1) * this.options.dragOptions.brakeSpeed;
                    var ay = (vy > 0 ? -1 : 1) * this.options.dragOptions.brakeSpeed;
                    x = ((0 - Math.pow(vx, 2)) / (2 * ax)) + this.getScrollLeft();
                    y = ((0 - Math.pow(vy, 2)) / (2 * ay)) + this.getScrollTop();
                    this.scrollTo(x, y);
                }
                else {
                    /* in all other cases, do a regular scroll */
                    this.scrollTo(x, y, this.options.dragOptions.fade);
                }
                var _a, _b;
            };
            Zwoosh.prototype.calcAverageVelocity = function (timeSpan) {
                var present = (this.getTimestamp() / 1000);
                var deltaT, deltaSx, deltaSy, lastDeltaSx, lastDeltaSy;
                deltaT = deltaSx = deltaSy = lastDeltaSx = lastDeltaSy = 0;
                for (var i in this.vy) {
                    if (parseFloat(i) > (present - timeSpan)
                        && typeof lastT !== 'undefined'
                        && typeof lastSx !== 'undefined'
                        && typeof lastSy !== 'undefined') {
                        deltaT += parseFloat(i) - lastT;
                        lastDeltaSx = this.vx[i] - lastSx;
                        lastDeltaSy = this.vy[i] - lastSy;
                        deltaSx += Math.abs(lastDeltaSx);
                        deltaSy += Math.abs(lastDeltaSy);
                    }
                    var lastT = parseFloat(i);
                    var lastSx = this.vx[i];
                    var lastSy = this.vy[i];
                }
                var vx = deltaT === 0 ? 0 : lastDeltaSx > 0 ? deltaSx / deltaT : deltaSx / -deltaT;
                var vy = deltaT === 0 ? 0 : lastDeltaSy > 0 ? deltaSy / deltaT : deltaSy / -deltaT;
                return [vx, vy];
            };
            /**
             * Calculates the rounded and scaled coordinates.
             *
             * @param {number} x - the x-coordinate
             * @param {number} y - the y-coordinate
             * @return {array} [x, y] - the final coordinates
             */
            Zwoosh.prototype.getRealCoords = function (x, y) {
                //stick the element to the grid, if grid equals 1 the value does not change
                x = Math.round(x / (this.options.gridX * this.getScale())) * (this.options.gridX * this.getScale());
                y = Math.round(y / (this.options.gridY * this.getScale())) * (this.options.gridY * this.getScale());
                var scrollMaxLeft = (this.scrollElement.scrollWidth - this.scrollElement.clientWidth);
                var scrollMaxTop = (this.scrollElement.scrollHeight - this.scrollElement.clientHeight);
                return [
                    (x > scrollMaxLeft) ? scrollMaxLeft : x,
                    (y > scrollMaxTop) ? scrollMaxTop : y
                ];
            };
            Zwoosh.prototype.timedScroll = function (x, y, t) {
                var me = this;
                this.timeouts.push(setTimeout((function (x, y, me) {
                    return function () {
                        me.setScrollTop(y);
                        me.setScrollLeft(x);
                        me.originScrollLeft = x;
                        me.originScrollTop = y;
                    };
                }(x, y, me)), t));
            };
            /**
             * Calculates each step of a scroll fadeout animation based on the initial velocity.
             * Stops any currently running scroll animation.
             *
             * @param {number} vx - the initial velocity in horizontal direction
             * @param {number} vy - the initial velocity in vertical direction
             * @return {number} - the final y-coordinate
             */
            Zwoosh.prototype.fadeOutByVelocity = function (vx, vy) {
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
                    var sy = this.getScrollTop() + (vy * t) + (0.5 * ay * t * t);
                    var sx = this.getScrollLeft() + (vx * t) + (0.5 * ax * t * t);
                    this.timedScroll(sx, sy, (i + 1) * (1000 / fps));
                }
                if (i > 0) {
                    /* round the last step based on the direction of the fade */
                    sx = vx > 0 ? Math.ceil(sx) : Math.floor(sx);
                    sy = vy > 0 ? Math.ceil(sy) : Math.floor(sy);
                    this.timedScroll(sx, sy, (i + 2) * (1000 / fps));
                }
                /* stop the animation when colliding with the borders */
                this.clearListenerLeft = function () { return _this.clearTimeouts(); };
                this.clearListenerRight = function () { return _this.clearTimeouts(); };
                this.clearListenerTop = function () { return _this.clearTimeouts(); };
                this.clearListenerBottom = function () { return _this.clearTimeouts(); };
                this.addEventListener(this.inner, 'collide.left', this.clearListenerLeft);
                this.addEventListener(this.inner, 'collide.right', this.clearListenerRight);
                this.addEventListener(this.inner, 'collide.top', this.clearListenerTop);
                this.addEventListener(this.inner, 'collide.bottom', this.clearListenerBottom);
            };
            Zwoosh.prototype.fadeOutByCoords = function (x, y) {
                _a = this.getRealCoords(x, y), x = _a[0], y = _a[1];
                var a = this.options.dragOptions.brakeSpeed * -1;
                var vy = 0 - (2 * a * (y - this.getScrollTop()));
                var vx = 0 - (2 * a * (x - this.getScrollLeft()));
                vy = (vy > 0 ? 1 : -1) * Math.sqrt(Math.abs(vy));
                vx = (vx > 0 ? 1 : -1) * Math.sqrt(Math.abs(vx));
                var sx = x - this.getScrollLeft();
                var sy = y - this.getScrollTop();
                if (Math.abs(sy) > Math.abs(sx)) {
                    vx = (vx > 0 ? 1 : -1) * Math.abs((sx / sy) * vy);
                }
                else {
                    vy = (vy > 0 ? 1 : -1) * Math.abs((sy / sx) * vx);
                }
                this.clearTimeouts();
                this.fadeOutByVelocity(vx, vy);
                var _a;
            };
            /**
             * Mouse move handler
             * Calcucates the x and y deltas and scrolls
             *
             * @param {MouseEvent} e - The mouse move event object
             * @return {void}
             */
            Zwoosh.prototype.mouseMove = function (e) {
                this.present = (this.getTimestamp() / 1000); //in seconds
                this.clearTextSelection();
                /* if the mouse left the window and the button is not pressed anymore, abort moving */
                //if ((e.buttons === 0 && e.button === 0) || (typeof e.buttons === 'undefined' && e.button === 0)) {
                if (("which" in e && e.which === 0) || (typeof e.which === 'undefined' && "button" in e && e.button === 0)) {
                    this.mouseUp(e);
                    return;
                }
                var x = this.dragOriginLeft + this.dragOriginScrollLeft - e.clientX;
                var y = this.dragOriginTop + this.dragOriginScrollTop - e.clientY;
                /* if elastic edges are set, show the element pseudo scrolled by relative position */
                if (this.triggered.collideBottom && this.options.elasticEdges.bottom === true) {
                    this.inner.style.position = 'relative';
                    this.inner.style.top = ((this.getScrollTop() - y) / 2) + 'px';
                }
                if (this.triggered.collideTop && this.options.elasticEdges.top === true) {
                    this.inner.style.position = 'relative';
                    this.inner.style.top = (y / -2) + 'px';
                }
                if (this.triggered.collideLeft && this.options.elasticEdges.left === true) {
                    this.inner.style.position = 'relative';
                    this.inner.style.left = (x / -2) + 'px';
                }
                if (this.triggered.collideRight && this.options.elasticEdges.right === true) {
                    this.inner.style.position = 'relative';
                    this.inner.style.left = ((this.getScrollLeft() - x) / 2) + 'px';
                }
                this.vx[this.present] = x;
                this.vy[this.present] = y;
                this.scrollTo(x, y, false);
                this.past = this.present;
            };
            /**
             * scrollBy helper method to scroll by an amount of pixels in x- and y-direction
             *
             * @param {number} x - amount of pixels to scroll in x-direction
             * @param {number} y - amount of pixels to scroll in y-direction
             * @param {boolean} smooth - whether to scroll smooth or instant
             * @return {void}
             */
            Zwoosh.prototype.scrollBy = function (x, y, smooth) {
                if (smooth === void 0) { smooth = true; }
                var absoluteX = this.getScrollLeft() + x;
                var absoluteY = this.getScrollTop() + y;
                this.scrollTo(absoluteX, absoluteY, smooth);
            };
            /**
             * scrollBy helper method to scroll to a x- and y-coordinate
             *
             * @param {number} x - x-coordinate to scroll to
             * @param {number} y - y-coordinate to scroll to
             * @param {boolean} smooth - whether to scroll smooth or instant
             * @return {void}
             *
             * @TODO: CSS3 transitions if available in browser
             */
            Zwoosh.prototype.scrollTo = function (x, y, smooth) {
                if (smooth === void 0) { smooth = true; }
                this.clearTimeouts();
                this.scrollMaxLeft = (this.scrollElement.scrollWidth - this.scrollElement.clientWidth);
                this.scrollMaxTop = (this.scrollElement.scrollHeight - this.scrollElement.clientHeight);
                /* no negative values or values greater than the maximum */
                var x = (x > this.scrollMaxLeft) ? this.scrollMaxLeft : (x < 0) ? 0 : x;
                var y = (y > this.scrollMaxTop) ? this.scrollMaxTop : (y < 0) ? 0 : y;
                /* remember the old values */
                this.originScrollLeft = this.getScrollLeft();
                this.originScrollTop = this.getScrollTop();
                if (x !== this.getScrollLeft() || y !== this.getScrollTop()) {
                    if (this.options.wheelOptions.smooth !== true || smooth === false) {
                        this.setScrollTop(y);
                        this.setScrollLeft(x);
                    }
                    else {
                        this.fadeOutByCoords(x, y);
                    }
                }
            };
            /**
             * Register custom event callbacks
             *
             * @param {string} event - The event name
             * @param {(e: Event) => any} callback - A callback function to execute when the event raises
             * @return {Zwoosh} - The Zwoosh object instance
             */
            Zwoosh.prototype.on = function (event, callback) {
                this.addEventListener(this.inner, event, callback);
                /* set the event untriggered and call the function, to retrigger met events */
                var f = event.replace(/\.([a-z])/, String.call.bind(event.toUpperCase)).replace(/\./, '');
                this.triggered[f] = false;
                this.onScroll();
                return this;
            };
            /**
             * Deregister custom event callbacks
             *
             * @param {string} event - The event name
             * @param {(e: Event) => any} callback - A callback function to execute when the event raises
             * @return {Zwoosh} - The Zwoosh object instance
             */
            Zwoosh.prototype.off = function (event, callback) {
                this.removeEventListener(this.inner, event, callback);
                return this;
            };
            /**
             * Revert all DOM manipulations and deregister all event handlers
             *
             * @return {void}
             * @TODO: removing wheelZoomHandler does not work
             */
            Zwoosh.prototype.destroy = function () {
                var x = this.getScrollLeft();
                var y = this.getScrollTop();
                /* remove the outer and grab CSS classes */
                this.removeClass(this.container, this.classOuter);
                this.removeClass(this.inner, this.classGrab);
                this.removeClass(this.container, this.classNoGrab);
                /* move all childNodes back to the old outer element and remove the inner element */
                while (this.inner.childNodes.length > 0) {
                    this.container.appendChild(this.inner.childNodes[0]);
                }
                this.scaleElement.removeChild(this.inner);
                this.container.removeChild(this.scaleElement);
                this.scrollTo(x, y, false);
                this.scrollElement.onmousewheel = null;
                this.scrollElement.onscroll = null;
                window.onresize = null;
                /* remove all custom eventlisteners attached via this.addEventListener() */
                for (var event in this.customEvents) {
                    for (var c in this.customEvents[event]) {
                        this.removeEventListener(this.inner, event, this.customEvents[event][c][0]);
                    }
                }
                return;
            };
            return Zwoosh;
        }());
        /* return an instance of the class */
        return new Zwoosh(container, options);
    }
    return zwoosh;
});

},{}]},{},[1])(1)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiendvb3NoLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIihmdW5jdGlvbiAoZmFjdG9yeSkge1xuICAgIGlmICh0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlLmV4cG9ydHMgPT09ICdvYmplY3QnKSB7XG4gICAgICAgIHZhciB2ID0gZmFjdG9yeShyZXF1aXJlLCBleHBvcnRzKTsgaWYgKHYgIT09IHVuZGVmaW5lZCkgbW9kdWxlLmV4cG9ydHMgPSB2O1xuICAgIH1cbiAgICBlbHNlIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICAgICAgZGVmaW5lKFtcInJlcXVpcmVcIiwgXCJleHBvcnRzXCJdLCBmYWN0b3J5KTtcbiAgICB9XG59KShmdW5jdGlvbiAocmVxdWlyZSwgZXhwb3J0cykge1xuICAgIFwidXNlIHN0cmljdFwiO1xuICAgIC8qKlxuICAgICAqIEV4cG9ydCBmdW5jdGlvbiBvZiB0aGUgbW9kdWxlXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBjb250YWluZXIgLSBUaGUgSFRNTEVsZW1lbnQgdG8gc3dvb29vc2ghXG4gICAgICogQHBhcmFtIHtPcHRpb25zfSBvcHRpb25zIC0gdGhlIG9wdGlvbnMgb2JqZWN0IHRvIGNvbmZpZ3VyZSBad29vc2hcbiAgICAgKiBAcmV0dXJuIHtad29vc2h9IC0gWndvb3NoIG9iamVjdCBpbnN0YW5jZVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIHp3b29zaChjb250YWluZXIsIG9wdGlvbnMpIHtcbiAgICAgICAgaWYgKG9wdGlvbnMgPT09IHZvaWQgMCkgeyBvcHRpb25zID0ge307IH1cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFBvbHlmaWxsIGJpbmQgZnVuY3Rpb24gZm9yIG9sZGVyIGJyb3dzZXJzXG4gICAgICAgICAqIFRoZSBiaW5kIGZ1bmN0aW9uIGlzIGFuIGFkZGl0aW9uIHRvIEVDTUEtMjYyLCA1dGggZWRpdGlvblxuICAgICAgICAgKiBAc2VlOiBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9HbG9iYWxfT2JqZWN0cy9GdW5jdGlvbi9iaW5kXG4gICAgICAgICAqL1xuICAgICAgICBpZiAoIUZ1bmN0aW9uLnByb3RvdHlwZS5iaW5kKSB7XG4gICAgICAgICAgICBGdW5jdGlvbi5wcm90b3R5cGUuYmluZCA9IGZ1bmN0aW9uIChvVGhpcykge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdGhpcyAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICAvLyBjbG9zZXN0IHRoaW5nIHBvc3NpYmxlIHRvIHRoZSBFQ01BU2NyaXB0IDVcbiAgICAgICAgICAgICAgICAgICAgLy8gaW50ZXJuYWwgSXNDYWxsYWJsZSBmdW5jdGlvblxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdGdW5jdGlvbi5wcm90b3R5cGUuYmluZCAtIHdoYXQgaXMgdHJ5aW5nIHRvIGJlIGJvdW5kIGlzIG5vdCBjYWxsYWJsZScpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgYUFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpLCBmVG9CaW5kID0gdGhpcywgZk5PUCA9IGZ1bmN0aW9uICgpIHsgfSwgZkJvdW5kID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZlRvQmluZC5hcHBseSh0aGlzIGluc3RhbmNlb2YgZk5PUFxuICAgICAgICAgICAgICAgICAgICAgICAgPyB0aGlzXG4gICAgICAgICAgICAgICAgICAgICAgICA6IG9UaGlzLCBhQXJncy5jb25jYXQoQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKSkpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMucHJvdG90eXBlKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEZ1bmN0aW9uLnByb3RvdHlwZSBkb2Vzbid0IGhhdmUgYSBwcm90b3R5cGUgcHJvcGVydHlcbiAgICAgICAgICAgICAgICAgICAgZk5PUC5wcm90b3R5cGUgPSB0aGlzLnByb3RvdHlwZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZkJvdW5kLnByb3RvdHlwZSA9IG5ldyBmTk9QKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZCb3VuZDtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFBvbHlmaWxsIGFycmF5LmluZGV4T2YgZnVuY3Rpb24gZm9yIG9sZGVyIGJyb3dzZXJzXG4gICAgICAgICAqIFRoZSBpbmRleE9mKCkgZnVuY3Rpb24gd2FzIGFkZGVkIHRvIHRoZSBFQ01BLTI2MiBzdGFuZGFyZCBpbiB0aGUgNXRoIGVkaXRpb25cbiAgICAgICAgICogYXMgc3VjaCBpdCBtYXkgbm90IGJlIHByZXNlbnQgaW4gYWxsIGJyb3dzZXJzLlxuICAgICAgICAgKiBAc2VlIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0phdmFTY3JpcHQvUmVmZXJlbmNlL0dsb2JhbF9PYmplY3RzL0FycmF5L2luZGV4T2ZcbiAgICAgICAgICovXG4gICAgICAgIGlmICghQXJyYXkucHJvdG90eXBlLmluZGV4T2YpIHtcbiAgICAgICAgICAgIEFycmF5LnByb3RvdHlwZS5pbmRleE9mID0gZnVuY3Rpb24gKHNlYXJjaEVsZW1lbnQsIGZyb21JbmRleCkge1xuICAgICAgICAgICAgICAgIHZhciBrO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignXCJ0aGlzXCIgaXMgbnVsbCBvciBub3QgZGVmaW5lZCcpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgbyA9IE9iamVjdCh0aGlzKTtcbiAgICAgICAgICAgICAgICB2YXIgbGVuID0gby5sZW5ndGggPj4+IDA7XG4gICAgICAgICAgICAgICAgaWYgKGxlbiA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciBuID0gK2Zyb21JbmRleCB8fCAwO1xuICAgICAgICAgICAgICAgIGlmIChNYXRoLmFicyhuKSA9PT0gSW5maW5pdHkpIHtcbiAgICAgICAgICAgICAgICAgICAgbiA9IDA7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChuID49IGxlbikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGsgPSBNYXRoLm1heChuID49IDAgPyBuIDogbGVuIC0gTWF0aC5hYnMobiksIDApO1xuICAgICAgICAgICAgICAgIHdoaWxlIChrIDwgbGVuKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChrIGluIG8gJiYgb1trXSA9PT0gc2VhcmNoRWxlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaysrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIC8qIGxpc3Qgb2YgcmVhbCBldmVudHMgKi9cbiAgICAgICAgdmFyIGh0bWxFdmVudHMgPSB7XG4gICAgICAgICAgICAvKiA8Ym9keT4gYW5kIDxmcmFtZXNldD4gRXZlbnRzICovXG4gICAgICAgICAgICBvbmxvYWQ6IDEsXG4gICAgICAgICAgICBvbnVubG9hZDogMSxcbiAgICAgICAgICAgIC8qIEZvcm0gRXZlbnRzICovXG4gICAgICAgICAgICBvbmJsdXI6IDEsXG4gICAgICAgICAgICBvbmNoYW5nZTogMSxcbiAgICAgICAgICAgIG9uZm9jdXM6IDEsXG4gICAgICAgICAgICBvbnJlc2V0OiAxLFxuICAgICAgICAgICAgb25zZWxlY3Q6IDEsXG4gICAgICAgICAgICBvbnN1Ym1pdDogMSxcbiAgICAgICAgICAgIC8qIEltYWdlIEV2ZW50cyAqL1xuICAgICAgICAgICAgb25hYm9ydDogMSxcbiAgICAgICAgICAgIC8qIEtleWJvYXJkIEV2ZW50cyAqL1xuICAgICAgICAgICAgb25rZXlkb3duOiAxLFxuICAgICAgICAgICAgb25rZXlwcmVzczogMSxcbiAgICAgICAgICAgIG9ua2V5dXA6IDEsXG4gICAgICAgICAgICAvKiBNb3VzZSBFdmVudHMgKi9cbiAgICAgICAgICAgIG9uY2xpY2s6IDEsXG4gICAgICAgICAgICBvbmRibGNsaWNrOiAxLFxuICAgICAgICAgICAgb25tb3VzZWRvd246IDEsXG4gICAgICAgICAgICBvbm1vdXNlbW92ZTogMSxcbiAgICAgICAgICAgIG9ubW91c2VvdXQ6IDEsXG4gICAgICAgICAgICBvbm1vdXNlb3ZlcjogMSxcbiAgICAgICAgICAgIG9ubW91c2V1cDogMVxuICAgICAgICB9O1xuICAgICAgICB2YXIgbWFwRXZlbnRzID0ge1xuICAgICAgICAgICAgb25zY3JvbGw6IHdpbmRvd1xuICAgICAgICB9O1xuICAgICAgICAvKipcbiAgICAgICAgICogWndvb3NoIHByb3ZpZGVzIGEgc2V0IG9mIGZ1bmN0aW9ucyB0byBpbXBsZW1lbnQgc2Nyb2xsIGJ5IGRyYWcsIHpvb20gYnkgbW91c2V3aGVlbCxcbiAgICAgICAgICogaGFzaCBsaW5rcyBpbnNpZGUgdGhlIGRvY3VtZW50IGFuZCBvdGhlciBzcGVjaWFsIHNjcm9sbCByZWxhdGVkIHJlcXVpcmVtZW50cy5cbiAgICAgICAgICpcbiAgICAgICAgICogQGF1dGhvciBSb21hbiBHcnViZXIgPHAxMDIwMzg5QHlhaG9vLmNvbT5cbiAgICAgICAgICogQHZlcnNpb24gMS4wLjFcbiAgICAgICAgICovXG4gICAgICAgIHZhciBad29vc2ggPSAoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgZnVuY3Rpb24gWndvb3NoKGNvbnRhaW5lciwgb3B0aW9ucykge1xuICAgICAgICAgICAgICAgIHRoaXMuY29udGFpbmVyID0gY29udGFpbmVyO1xuICAgICAgICAgICAgICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG4gICAgICAgICAgICAgICAgLyogQ1NTIHN0eWxlIGNsYXNzZXMgKi9cbiAgICAgICAgICAgICAgICB0aGlzLmNsYXNzSW5uZXIgPSAnenctaW5uZXInO1xuICAgICAgICAgICAgICAgIHRoaXMuY2xhc3NPdXRlciA9ICd6dy1vdXRlcic7XG4gICAgICAgICAgICAgICAgdGhpcy5jbGFzc0dyYWIgPSAnenctZ3JhYic7XG4gICAgICAgICAgICAgICAgdGhpcy5jbGFzc05vR3JhYiA9ICd6dy1ub2dyYWInO1xuICAgICAgICAgICAgICAgIHRoaXMuY2xhc3NHcmFiYmluZyA9ICd6dy1ncmFiYmluZyc7XG4gICAgICAgICAgICAgICAgdGhpcy5jbGFzc1VuaXF1ZSA9ICd6dy0nICsgTWF0aC5yYW5kb20oKS50b1N0cmluZygzNikuc3Vic3RyaW5nKDcpO1xuICAgICAgICAgICAgICAgIHRoaXMuY2xhc3NTY2FsZSA9ICd6dy1zY2FsZSc7XG4gICAgICAgICAgICAgICAgdGhpcy5jbGFzc0lnbm9yZSA9ICd6dy1pZ25vcmUnO1xuICAgICAgICAgICAgICAgIHRoaXMuY2xhc3NGYWtlQm9keSA9ICd6dy1mYWtlYm9keSc7XG4gICAgICAgICAgICAgICAgLyogYXJyYXkgaG9sZGluZyB0aGUgY3VzdG9tIGV2ZW50cyBtYXBwaW5nIGNhbGxiYWNrcyB0byBib3VuZCBjYWxsYmFja3MgKi9cbiAgICAgICAgICAgICAgICB0aGlzLmN1c3RvbUV2ZW50cyA9IFtdO1xuICAgICAgICAgICAgICAgIHRoaXMudHJpZ2dlcmVkID0ge1xuICAgICAgICAgICAgICAgICAgICBjb2xsaWRlTGVmdDogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIGNvbGxpZGVUb3A6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBjb2xsaWRlUmlnaHQ6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBjb2xsaWRlQm90dG9tOiBmYWxzZVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgLyogZmFkZU91dCAqL1xuICAgICAgICAgICAgICAgIHRoaXMudGltZW91dHMgPSBbXTtcbiAgICAgICAgICAgICAgICB0aGlzLnZ4ID0gW107XG4gICAgICAgICAgICAgICAgdGhpcy52eSA9IFtdO1xuICAgICAgICAgICAgICAgIHRoaXMuY29udGFpbmVyID0gY29udGFpbmVyO1xuICAgICAgICAgICAgICAgIC8qIHNldCBkZWZhdWx0IG9wdGlvbnMgKi9cbiAgICAgICAgICAgICAgICB2YXIgZGVmYXVsdE9wdGlvbnMgPSB7XG4gICAgICAgICAgICAgICAgICAgIC8qIDEgbWVhbnMgZG8gbm90IGFsaWduIHRvIGEgZ3JpZCAqL1xuICAgICAgICAgICAgICAgICAgICBncmlkWDogMSxcbiAgICAgICAgICAgICAgICAgICAgZ3JpZFk6IDEsXG4gICAgICAgICAgICAgICAgICAgIC8qIHNob3dzIGEgZ3JpZCBhcyBhbiBvdmVybGF5IG92ZXIgdGhlIGVsZW1lbnQuIFdvcmtzIG9ubHkgaWYgdGhlIGJyb3dzZXIgc3VwcG9ydHNcbiAgICAgICAgICAgICAgICAgICAgICogQ1NTIEdlbmVyYXRlZCBjb250ZW50IGZvciBwc2V1ZG8tZWxlbWVudHNcbiAgICAgICAgICAgICAgICAgICAgICogQHNlZSBodHRwOi8vY2FuaXVzZS5jb20vI3NlYXJjaD0lM0FiZWZvcmUgKi9cbiAgICAgICAgICAgICAgICAgICAgZ3JpZFNob3c6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAvKiB3aGljaCBlZGdlIHNob3VsZCBiZSBlbGFzdGljICovXG4gICAgICAgICAgICAgICAgICAgIGVsYXN0aWNFZGdlczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGVmdDogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICByaWdodDogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICB0b3A6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgYm90dG9tOiBmYWxzZVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAvKiBhY3RpdmF0ZXMvZGVhY3RpdmF0ZXMgc2Nyb2xsaW5nIGJ5IGRyYWcgKi9cbiAgICAgICAgICAgICAgICAgICAgZHJhZ1Njcm9sbDogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgZHJhZ09wdGlvbnM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGV4Y2x1ZGU6IFsnaW5wdXQnLCAndGV4dGFyZWEnLCAnYScsICdidXR0b24nLCAnLicgKyB0aGlzLmNsYXNzSWdub3JlLCAnc2VsZWN0J10sXG4gICAgICAgICAgICAgICAgICAgICAgICBvbmx5OiBbXSxcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIGFjdGl2YXRlcyBhIHNjcm9sbCBmYWRlIHdoZW4gc2Nyb2xsaW5nIGJ5IGRyYWcgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIGZhZGU6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBmYWRlOiBicmFrZSBhY2NlbGVyYXRpb24gaW4gcGl4ZWxzIHBlciBzZWNvbmQgcGVyIHNlY29uZCAocC9zwrIpICovXG4gICAgICAgICAgICAgICAgICAgICAgICBicmFrZVNwZWVkOiAyNTAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgLyogZmFkZTogZnJhbWVzIHBlciBzZWNvbmQgb2YgdGhlIHp3b29zaCBmYWRlb3V0IGFuaW1hdGlvbiAoPj0yNSBsb29rcyBsaWtlIG1vdGlvbikgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIGZwczogMzAsXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBmYWRlOiB0aGlzIHNwZWVkIHdpbGwgbmV2ZXIgYmUgZXhjZWVkZWQgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIG1heFNwZWVkOiAzMDAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgLyogZmFkZTogbWluaW11bSBzcGVlZCB3aGljaCB0cmlnZ2VycyB0aGUgZmFkZSAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgbWluU3BlZWQ6IDMwMFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAvKiBhY3RpdmF0ZXMvZGVhY3RpdmF0ZXMgc2Nyb2xsaW5nIGJ5IHdoZWVsLiBJZiB0aGUgZHJlaWN0aW9uIGlzIHZlcnRpY2FsIGFuZCB0aGVyZSBhcmVcbiAgICAgICAgICAgICAgICAgICAgICogc2Nyb2xsYmFycyBwcmVzZW50LCB6d29vc2ggbGV0cyBsZWF2ZXMgc2Nyb2xsaW5nIHRvIHRoZSBicm93c2VyLiAqL1xuICAgICAgICAgICAgICAgICAgICB3aGVlbFNjcm9sbDogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgd2hlZWxPcHRpb25zOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBkaXJlY3Rpb24gdG8gc2Nyb2xsIHdoZW4gdGhlIG1vdXNlIHdoZWVsIGlzIHVzZWQgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIGRpcmVjdGlvbjogJ3ZlcnRpY2FsJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIGFtb3VudCBvZiBwaXhlbHMgZm9yIG9uZSBzY3JvbGwgc3RlcCAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RlcDogMTE0LFxuICAgICAgICAgICAgICAgICAgICAgICAgLyogc2Nyb2xsIHNtb290aCBvciBpbnN0YW50ICovXG4gICAgICAgICAgICAgICAgICAgICAgICBzbW9vdGg6IHRydWVcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgLyogYWN0aXZhdGVzL2RlYWN0aXZhdGVzIHpvb21pbmcgYnkgd2hlZWwuIFdvcmtzIG9ubHkgd2l0aCBhIENTUzMgMkQgVHJhbnNmb3JtIGNhcGFibGUgYnJvd3Nlci5cbiAgICAgICAgICAgICAgICAgICAgICogQHNlZSBodHRwOi8vY2FuaXVzZS5jb20vI2ZlYXQ9dHJhbnNmb3JtczJkICovXG4gICAgICAgICAgICAgICAgICAgIHdoZWVsWm9vbTogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIHpvb21PcHRpb25zOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvKiB0aGUgbWF4aW11bSBzY2FsZSwgMCBtZWFucyBubyBtYXhpbXVtICovXG4gICAgICAgICAgICAgICAgICAgICAgICBtYXhTY2FsZTogMCxcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIHRoZSBtaW5pbXVtIHNjYWxlLCAwIG1lYW5zIG5vIG1pbmltdW0gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIG1pblNjYWxlOiAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgLyogb25lIHN0ZXAgd2hlbiB1c2luZyB0aGUgd2hlZWwgdG8gem9vbSAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RlcDogMC4xLFxuICAgICAgICAgICAgICAgICAgICAgICAgLyogbW91c2Ugd2hlZWwgZGlyZWN0aW9uIHRvIHpvb20gbGFyZ2VyICovXG4gICAgICAgICAgICAgICAgICAgICAgICBkaXJlY3Rpb246ICd1cCdcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgLyogbGV0IHp3b29zaCBoYW5kbGUgYW5jaG9yIGxpbmtzIHRhcmdldGluZyB0byBhbiBhbmNob3IgaW5zaWRlIG9mIHRoaXMgendvb3NoIGVsZW1lbnQuXG4gICAgICAgICAgICAgICAgICAgICAqIHRoZSBlbGVtZW50IG91dHNpZGUgKG1heWJlIHRoZSBib2R5KSBoYW5kbGVzIGFuY2hvcnMgdG9vLiBJZiB5b3Ugd2FudCB0byBwcmV2ZW50IHRoaXMsXG4gICAgICAgICAgICAgICAgICAgICAqIGFkZCB0byBib2R5IGFzIHp3b29zaCBlbGVtZW50IHRvby4gKi9cbiAgICAgICAgICAgICAgICAgICAgaGFuZGxlQW5jaG9yczogdHJ1ZVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zID0gdGhpcy5tZXJnZU9wdGlvbnMob3B0aW9ucywgZGVmYXVsdE9wdGlvbnMpO1xuICAgICAgICAgICAgICAgIHRoaXMuaW5pdCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBNZXJnZSB0aGUgZGVmYXVsdCBvcHRpb24gb2JqZWN0IHdpdGggdGhlIHByb3ZpZGVkIG9uZVxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBwYXJhbSB7T3B0aW9uc30gb3B0aW9ucyAtIHRoZSBnaXZlbiBvcHRpb25zXG4gICAgICAgICAgICAgKiBAcGFyYW0ge09wdGlvbnN9IGRlZmF1bHRPcHRpb25zIC0gdGhlIGRlZmF1bHQgb3B0aW9uc1xuICAgICAgICAgICAgICogQHJldHVybiB7T3B0aW9uc30gLSB0aGUgbWVyZ2VkIG9wdGlvbnMgb2JqZWN0XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIFp3b29zaC5wcm90b3R5cGUubWVyZ2VPcHRpb25zID0gZnVuY3Rpb24gKG9wdGlvbnMsIGRlZmF1bHRPcHRpb25zKSB7XG4gICAgICAgICAgICAgICAgLyogbWVyZ2UgdGhlIGRlZmF1bHQgb3B0aW9uIG9iamVjdCB3aXRoIHRoZSBwcm92aWRlZCBvbmUgKi9cbiAgICAgICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gb3B0aW9ucykge1xuICAgICAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnNba2V5XSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBva2V5IGluIG9wdGlvbnNba2V5XSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAob3B0aW9uc1trZXldLmhhc093blByb3BlcnR5KG9rZXkpKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdE9wdGlvbnNba2V5XVtva2V5XSA9IG9wdGlvbnNba2V5XVtva2V5XTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0T3B0aW9uc1trZXldID0gb3B0aW9uc1trZXldO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBkZWZhdWx0T3B0aW9ucztcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEluaXRpYWxpemUgRE9NIG1hbmlwdWxhdGlvbnMgYW5kIGV2ZW50IGhhbmRsZXJzXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQHJldHVybiB7dm9pZH1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgWndvb3NoLnByb3RvdHlwZS5pbml0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgICAgICAgICAgdGhpcy5pbml0Qm9keSgpO1xuICAgICAgICAgICAgICAgIHRoaXMuYWRkQ2xhc3ModGhpcy5jb250YWluZXIsIHRoaXMuY2xhc3NPdXRlcik7XG4gICAgICAgICAgICAgICAgdGhpcy5zY3JvbGxFbGVtZW50ID0gdGhpcy5jb250YWluZXI7XG4gICAgICAgICAgICAgICAgdmFyIHggPSB0aGlzLmdldFNjcm9sbExlZnQoKTtcbiAgICAgICAgICAgICAgICB2YXIgeSA9IHRoaXMuZ2V0U2Nyb2xsVG9wKCk7XG4gICAgICAgICAgICAgICAgLyogY3JlYXRlIGlubmVyIGRpdiBlbGVtZW50IGFuZCBhcHBlbmQgaXQgdG8gdGhlIGNvbnRhaW5lciB3aXRoIGl0cyBjb250ZW50cyBpbiBpdCAqL1xuICAgICAgICAgICAgICAgIHRoaXMuaW5uZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgICAgICAgICAgIHRoaXMuYWRkQ2xhc3ModGhpcy5pbm5lciwgdGhpcy5jbGFzc0lubmVyKTtcbiAgICAgICAgICAgICAgICB0aGlzLmFkZENsYXNzKHRoaXMuaW5uZXIsIHRoaXMuY2xhc3NVbmlxdWUpO1xuICAgICAgICAgICAgICAgIHRoaXMuc2NhbGVFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgICAgICAgICAgICB0aGlzLmFkZENsYXNzKHRoaXMuc2NhbGVFbGVtZW50LCB0aGlzLmNsYXNzU2NhbGUpO1xuICAgICAgICAgICAgICAgIHRoaXMuc2NhbGVFbGVtZW50LmFwcGVuZENoaWxkKHRoaXMuaW5uZXIpO1xuICAgICAgICAgICAgICAgIC8qIG1vdmUgYWxsIGNoaWxkTm9kZXMgdG8gdGhlIG5ldyBpbm5lciBlbGVtZW50ICovXG4gICAgICAgICAgICAgICAgd2hpbGUgKHRoaXMuY29udGFpbmVyLmNoaWxkTm9kZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmlubmVyLmFwcGVuZENoaWxkKHRoaXMuY29udGFpbmVyLmNoaWxkTm9kZXNbMF0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLmNvbnRhaW5lci5hcHBlbmRDaGlsZCh0aGlzLnNjYWxlRWxlbWVudCk7XG4gICAgICAgICAgICAgICAgdmFyIGJvcmRlciA9IHRoaXMuZ2V0Qm9yZGVyKHRoaXMuY29udGFpbmVyKTtcbiAgICAgICAgICAgICAgICB0aGlzLmlubmVyLnN0eWxlLm1pbldpZHRoID0gKHRoaXMuY29udGFpbmVyLnNjcm9sbFdpZHRoIC0gYm9yZGVyWzBdKSArICdweCc7XG4gICAgICAgICAgICAgICAgdGhpcy5pbm5lci5zdHlsZS5taW5IZWlnaHQgPSAodGhpcy5jb250YWluZXIuc2Nyb2xsSGVpZ2h0IC0gYm9yZGVyWzFdKSArICdweCc7XG4gICAgICAgICAgICAgICAgdGhpcy5zY2FsZUVsZW1lbnQuc3R5bGUubWluV2lkdGggPSB0aGlzLmlubmVyLnN0eWxlLm1pbldpZHRoO1xuICAgICAgICAgICAgICAgIHRoaXMuc2NhbGVFbGVtZW50LnN0eWxlLm1pbkhlaWdodCA9IHRoaXMuaW5uZXIuc3R5bGUubWluSGVpZ2h0O1xuICAgICAgICAgICAgICAgIHRoaXMuc2NhbGVFbGVtZW50LnN0eWxlLm92ZXJmbG93ID0gJ2hpZGRlbic7XG4gICAgICAgICAgICAgICAgdGhpcy5pbml0R3JpZCgpO1xuICAgICAgICAgICAgICAgIHRoaXMub2xkQ2xpZW50V2lkdGggPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50V2lkdGg7XG4gICAgICAgICAgICAgICAgdGhpcy5vbGRDbGllbnRIZWlnaHQgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50SGVpZ2h0O1xuICAgICAgICAgICAgICAgIC8qIGp1c3QgY2FsbCB0aGUgZnVuY3Rpb24sIHRvIHRyaWdnZXIgcG9zc2libGUgZXZlbnRzICovXG4gICAgICAgICAgICAgICAgdGhpcy5vblNjcm9sbCgpO1xuICAgICAgICAgICAgICAgIC8qIHNjcm9sbCB0byB0aGUgaW5pdGlhbCBwb3NpdGlvbiAqL1xuICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsVG8oeCwgeSwgZmFsc2UpO1xuICAgICAgICAgICAgICAgIC8qIEV2ZW50IGhhbmRsZXIgcmVnaXN0cmF0aW9uIHN0YXJ0IGhlcmUgKi9cbiAgICAgICAgICAgICAgICB0aGlzLmluaXRXaGVlbFNjcm9sbCgpO1xuICAgICAgICAgICAgICAgIHRoaXMuaW5pdFdoZWVsWm9vbSgpO1xuICAgICAgICAgICAgICAgIC8qIHNjcm9sbGhhbmRsZXIgKi9cbiAgICAgICAgICAgICAgICB0aGlzLnNjcm9sbEhhbmRsZXIgPSBmdW5jdGlvbiAoZSkgeyByZXR1cm4gX3RoaXMub25TY3JvbGwoZSk7IH07XG4gICAgICAgICAgICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKHRoaXMuY29udGFpbmVyLCAnc2Nyb2xsJywgdGhpcy5zY3JvbGxIYW5kbGVyKTtcbiAgICAgICAgICAgICAgICAvKiBpZiB0aGUgc2Nyb2xsIGVsZW1lbnQgaXMgYm9keSwgYWRqdXN0IHRoZSBpbm5lciBkaXYgd2hlbiByZXNpemluZyAqL1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmlzQm9keSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnJlc2l6ZUhhbmRsZXIgPSBmdW5jdGlvbiAoZSkgeyByZXR1cm4gX3RoaXMub25SZXNpemUoZSk7IH07IC8vVE9ETzogc2FtZSBhcyBhYm92ZSBpbiB0aGUgd2hlZWwgaGFuZGxlclxuICAgICAgICAgICAgICAgICAgICB3aW5kb3cub25yZXNpemUgPSB0aGlzLnJlc2l6ZUhhbmRsZXI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuaW5pdERyYWdTY3JvbGwoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmluaXRBbmNob3JzKCk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBSZWluaXRpYWxpemUgdGhlIHp3b29zaCBlbGVtZW50XG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQHJldHVybiB7Wndvb3NofSAtIFRoZSBad29vc2ggb2JqZWN0IGluc3RhbmNlXG4gICAgICAgICAgICAgKiBAVE9ETzogcHJlc2VydmUgc2Nyb2xsIHBvc2l0aW9uIGluIGluaXQoKVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLnJlaW5pdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmRlc3Ryb3koKTtcbiAgICAgICAgICAgICAgICB0aGlzLmNsYXNzVW5pcXVlID0gJ3p3LScgKyBNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zdWJzdHJpbmcoNyk7XG4gICAgICAgICAgICAgICAgdGhpcy5pbml0KCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgWndvb3NoLnByb3RvdHlwZS5pbml0Qm9keSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmlzQm9keSA9IHRoaXMuY29udGFpbmVyLnRhZ05hbWUgPT09IFwiQk9EWVwiID8gdHJ1ZSA6IGZhbHNlO1xuICAgICAgICAgICAgICAgIC8qIENocm9tZSBzb2x1dGlvbiB0byBzY3JvbGwgdGhlIGJvZHkgaXMgbm90IHJlYWxseSB2aWFibGUsIHNvIHdlIGNyZWF0ZSBhIGZha2UgYm9keVxuICAgICAgICAgICAgICAgICAqIGRpdiBlbGVtZW50IHRvIHNjcm9sbCBvbiAqL1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmlzQm9keSA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgcHNldWRvQm9keSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkQ2xhc3MocHNldWRvQm9keSwgdGhpcy5jbGFzc0Zha2VCb2R5KTtcbiAgICAgICAgICAgICAgICAgICAgcHNldWRvQm9keS5zdHlsZS5jc3NUZXh0ID0gZG9jdW1lbnQuYm9keS5zdHlsZS5jc3NUZXh0O1xuICAgICAgICAgICAgICAgICAgICB3aGlsZSAodGhpcy5jb250YWluZXIuY2hpbGROb2Rlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwc2V1ZG9Cb2R5LmFwcGVuZENoaWxkKHRoaXMuY29udGFpbmVyLmNoaWxkTm9kZXNbMF0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY29udGFpbmVyLmFwcGVuZENoaWxkKHBzZXVkb0JvZHkpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmNvbnRhaW5lciA9IHBzZXVkb0JvZHk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIFp3b29zaC5wcm90b3R5cGUuaW5pdEdyaWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgLyogc2hvdyB0aGUgZ3JpZCBvbmx5IGlmIGF0IGxlYXN0IG9uZSBvZiB0aGUgZ3JpZCB2YWx1ZXMgaXMgbm90IDEgKi9cbiAgICAgICAgICAgICAgICBpZiAoKHRoaXMub3B0aW9ucy5ncmlkWCAhPT0gMSB8fCB0aGlzLm9wdGlvbnMuZ3JpZFkgIT09IDEpICYmIHRoaXMub3B0aW9ucy5ncmlkU2hvdykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgYmdpID0gW107XG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3B0aW9ucy5ncmlkWCAhPT0gMSA/IGJnaS5wdXNoKCdsaW5lYXItZ3JhZGllbnQodG8gcmlnaHQsIGdyZXkgMXB4LCB0cmFuc3BhcmVudCAxcHgpJykgOiBudWxsO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMuZ3JpZFkgIT09IDEgPyBiZ2kucHVzaCgnbGluZWFyLWdyYWRpZW50KHRvIGJvdHRvbSwgZ3JleSAxcHgsIHRyYW5zcGFyZW50IDFweCknKSA6IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkQmVmb3JlQ1NTKHRoaXMuY2xhc3NVbmlxdWUsICd3aWR0aCcsIHRoaXMuaW5uZXIuc3R5bGUubWluV2lkdGgpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZEJlZm9yZUNTUyh0aGlzLmNsYXNzVW5pcXVlLCAnaGVpZ2h0JywgdGhpcy5pbm5lci5zdHlsZS5taW5IZWlnaHQpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZEJlZm9yZUNTUyh0aGlzLmNsYXNzVW5pcXVlLCAnbGVmdCcsICctJyArIHRoaXMuZ2V0U3R5bGUodGhpcy5jb250YWluZXIsICdwYWRkaW5nTGVmdCcpKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGRCZWZvcmVDU1ModGhpcy5jbGFzc1VuaXF1ZSwgJ3RvcCcsICctJyArIHRoaXMuZ2V0U3R5bGUodGhpcy5jb250YWluZXIsICdwYWRkaW5nVG9wJykpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZEJlZm9yZUNTUyh0aGlzLmNsYXNzVW5pcXVlLCAnYmFja2dyb3VuZC1zaXplJywgKHRoaXMub3B0aW9ucy5ncmlkWCAhPT0gMSA/IHRoaXMub3B0aW9ucy5ncmlkWCArICdweCAnIDogJ2F1dG8gJykgKyAodGhpcy5vcHRpb25zLmdyaWRZICE9PSAxID8gdGhpcy5vcHRpb25zLmdyaWRZICsgJ3B4JyA6ICdhdXRvJykpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZEJlZm9yZUNTUyh0aGlzLmNsYXNzVW5pcXVlLCAnYmFja2dyb3VuZC1pbWFnZScsIGJnaS5qb2luKCcsICcpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgWndvb3NoLnByb3RvdHlwZS5pbml0V2hlZWxTY3JvbGwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgICAgICAgICAvKiBUT0RPOiBub3QgMiBkaWZmZXJlbnQgZXZlbnQgaGFuZGxlcnMgcmVnaXN0cmF0aW9ucyAtPiBkbyBpdCBpbiB0aGlzLmFkZEV2ZW50TGlzdGVuZXIoKSAqL1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMud2hlZWxTY3JvbGwgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubW91c2VTY3JvbGxIYW5kbGVyID0gZnVuY3Rpb24gKGUpIHsgcmV0dXJuIF90aGlzLmRpc2FibGVNb3VzZVNjcm9sbChlKTsgfTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zY3JvbGxFbGVtZW50Lm9ubW91c2V3aGVlbCA9IHRoaXMubW91c2VTY3JvbGxIYW5kbGVyO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIodGhpcy5zY3JvbGxFbGVtZW50LCAnd2hlZWwnLCB0aGlzLm1vdXNlU2Nyb2xsSGFuZGxlcik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHRoaXMub3B0aW9ucy53aGVlbFNjcm9sbCA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm1vdXNlU2Nyb2xsSGFuZGxlciA9IGZ1bmN0aW9uIChlKSB7IHJldHVybiBfdGhpcy5hY3RpdmVNb3VzZVNjcm9sbChlKTsgfTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zY3JvbGxFbGVtZW50Lm9ubW91c2V3aGVlbCA9IHRoaXMubW91c2VTY3JvbGxIYW5kbGVyO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIodGhpcy5zY3JvbGxFbGVtZW50LCAnd2hlZWwnLCB0aGlzLm1vdXNlU2Nyb2xsSGFuZGxlcik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIC8qIHdoZWVsem9vbSAqL1xuICAgICAgICAgICAgWndvb3NoLnByb3RvdHlwZS5pbml0V2hlZWxab29tID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zLmdyaWRTaG93ID8gdGhpcy5zY2FsZVRvKDEpIDogbnVsbDtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLndoZWVsWm9vbSA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm1vdXNlWm9vbUhhbmRsZXIgPSBmdW5jdGlvbiAoZSkgeyByZXR1cm4gX3RoaXMuYWN0aXZlTW91c2Vab29tKGUpOyB9O1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIodGhpcy5zY3JvbGxFbGVtZW50LCAnd2hlZWwnLCB0aGlzLm1vdXNlWm9vbUhhbmRsZXIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLmluaXREcmFnU2Nyb2xsID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgICAgICAgICAgLyogaWYgZHJhZ3Njcm9sbCBpcyBhY3RpdmF0ZWQsIHJlZ2lzdGVyIG1vdXNlZG93biBldmVudCAqL1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMuZHJhZ1Njcm9sbCA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZENsYXNzKHRoaXMuaW5uZXIsIHRoaXMuY2xhc3NHcmFiKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5tb3VzZURvd25IYW5kbGVyID0gZnVuY3Rpb24gKGUpIHsgcmV0dXJuIF90aGlzLm1vdXNlRG93bihlKTsgfTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKHRoaXMuaW5uZXIsICdtb3VzZWRvd24nLCB0aGlzLm1vdXNlRG93bkhhbmRsZXIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGRDbGFzcyh0aGlzLmNvbnRhaW5lciwgdGhpcy5jbGFzc05vR3JhYik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIFp3b29zaC5wcm90b3R5cGUuaW5pdEFuY2hvcnMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLmhhbmRsZUFuY2hvcnMgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGxpbmtzID0gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvckFsbChcImFbaHJlZl49JyMnXVwiKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5oYXNoQ2hhbmdlQ2xpY2tIYW5kbGVyID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0YXJnZXQgPSBlID8gZS50YXJnZXQgOiB3aW5kb3cuZXZlbnQuc3JjRWxlbWVudDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdGFyZ2V0ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIHB1c2hTdGF0ZSBjaGFuZ2VzIHRoZSBoYXNoIHdpdGhvdXQgdHJpZ2dlcmluZyBoYXNoY2hhbmdlICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGlzdG9yeS5wdXNoU3RhdGUoe30sICcnLCB0YXJnZXQuaHJlZik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogd2UgZG9uJ3Qgd2FudCB0byB0cmlnZ2VyIGhhc2hjaGFuZ2UsIHNvIHByZXZlbnQgZGVmYXVsdCBiZWhhdmlvciB3aGVuIGNsaWNraW5nIG9uIGFuY2hvciBsaW5rcyAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlLnByZXZlbnREZWZhdWx0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGUucmV0dXJuVmFsdWUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAvKiB0cmlnZ2VyIGEgY3VzdG9tIGhhc2hjaGFuZ2UgZXZlbnQsIGJlY2F1c2UgcHVzaFN0YXRlIHByZXZlbnRzIHRoZSByZWFsIGhhc2hjaGFuZ2UgZXZlbnQgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIF90aGlzLnRyaWdnZXJFdmVudCh3aW5kb3csICdteWhhc2hjaGFuZ2UnKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgLyogbG9vcCB0cm91Z2ggYWxsIGFuY2hvciBsaW5rcyBpbiB0aGUgZWxlbWVudCBhbmQgZGlzYWJsZSB0aGVtIHRvIHByZXZlbnQgdGhlXG4gICAgICAgICAgICAgICAgICAgICAqIGJyb3dzZXIgZnJvbSBzY3JvbGxpbmcgYmVjYXVzZSBvZiB0aGUgY2hhbmdpbmcgaGFzaCB2YWx1ZS4gSW5zdGVhZCB0aGUgb3duXG4gICAgICAgICAgICAgICAgICAgICAqIGV2ZW50IG15aGFzaGNoYW5nZSBzaG91bGQgaGFuZGxlIHBhZ2UgYW5kIGVsZW1lbnQgc2Nyb2xsaW5nICovXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGlua3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcihsaW5rc1tpXSwgJ2NsaWNrJywgdGhpcy5oYXNoQ2hhbmdlQ2xpY2tIYW5kbGVyLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5oYXNoQ2hhbmdlSGFuZGxlciA9IGZ1bmN0aW9uIChlKSB7IHJldHVybiBfdGhpcy5vbkhhc2hDaGFuZ2UoZSk7IH07XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcih3aW5kb3csICdteWhhc2hjaGFuZ2UnLCB0aGlzLmhhc2hDaGFuZ2VIYW5kbGVyKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKHdpbmRvdywgJ2hhc2hjaGFuZ2UnLCB0aGlzLmhhc2hDaGFuZ2VIYW5kbGVyKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vbkhhc2hDaGFuZ2UoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLyogQFRPRE86IFNjcm9sbFdpZHRoIGFuZCBDbGllbnRXaWR0aCBTY3JvbGxIZWlnaHQgQ2xpZW50SGVpZ2h0ICovXG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLmdldFNjcm9sbExlZnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuc2Nyb2xsRWxlbWVudC5zY3JvbGxMZWZ0O1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIFp3b29zaC5wcm90b3R5cGUuc2V0U2Nyb2xsTGVmdCA9IGZ1bmN0aW9uIChsZWZ0KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zY3JvbGxFbGVtZW50LnNjcm9sbExlZnQgPSBsZWZ0O1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIFp3b29zaC5wcm90b3R5cGUuZ2V0U2Nyb2xsVG9wID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnNjcm9sbEVsZW1lbnQuc2Nyb2xsVG9wO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIFp3b29zaC5wcm90b3R5cGUuc2V0U2Nyb2xsVG9wID0gZnVuY3Rpb24gKHRvcCkge1xuICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsRWxlbWVudC5zY3JvbGxUb3AgPSB0b3A7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBIYW5kbGUgaGFzaGNoYW5nZXMgd2l0aCBvd24gc2Nyb2xsIGZ1bmN0aW9uXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQHBhcmFtIHtFdmVudH0gZSAtIHRoZSBoYXNoY2hhbmdlIG9yIG15aGFzaGNoYW5nZSBldmVudCwgb3Igbm90aGluZ1xuICAgICAgICAgICAgICogQHJldHVybiB7dm9pZH1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgWndvb3NoLnByb3RvdHlwZS5vbkhhc2hDaGFuZ2UgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgIGlmIChlID09PSB2b2lkIDApIHsgZSA9IG51bGw7IH1cbiAgICAgICAgICAgICAgICB2YXIgaGFzaCA9IHdpbmRvdy5sb2NhdGlvbi5oYXNoLnN1YnN0cigxKTtcbiAgICAgICAgICAgICAgICBpZiAoaGFzaCAhPT0gJycpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGFuY2hvcnMgPSB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yQWxsKCcjJyArIGhhc2gpO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFuY2hvcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBlbGVtZW50ID0gYW5jaG9yc1tpXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjb250YWluZXIgPSBhbmNob3JzW2ldO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZmluZCB0aGUgbmV4dCBwYXJlbnQgd2hpY2ggaXMgYSBjb250YWluZXIgZWxlbWVudFxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG5leHRDb250YWluZXIgPSBlbGVtZW50O1xuICAgICAgICAgICAgICAgICAgICAgICAgd2hpbGUgKGNvbnRhaW5lciAmJiBjb250YWluZXIucGFyZW50RWxlbWVudCAmJiB0aGlzLmNvbnRhaW5lciAhPT0gY29udGFpbmVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuaGFzQ2xhc3MoY29udGFpbmVyLCB0aGlzLmNsYXNzT3V0ZXIpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5leHRDb250YWluZXIgPSBjb250YWluZXI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRhaW5lciA9IGNvbnRhaW5lci5wYXJlbnRFbGVtZW50O1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGUgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZS50eXBlID09PSAnaGFzaGNoYW5nZScpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogc2Nyb2xsaW5nIGluc3RhbnRseSBiYWNrIHRvIG9yaWdpbiwgYmVmb3JlIGRvIHRoZSBhbmltYXRlZCBzY3JvbGwgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zY3JvbGxUbyh0aGlzLm9yaWdpblNjcm9sbExlZnQsIHRoaXMub3JpZ2luU2Nyb2xsVG9wLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zY3JvbGxUb0VsZW1lbnQobmV4dENvbnRhaW5lcik7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBTY3JvbGwgdG8gYW4gZWxlbWVudCBpbiB0aGUgRE9NXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWxlbWVudCAtIHRoZSBIVE1MRWxlbWVudCB0byBzY3JvbGwgdG9cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgWndvb3NoLnByb3RvdHlwZS5zY3JvbGxUb0VsZW1lbnQgPSBmdW5jdGlvbiAoZWxlbWVudCkge1xuICAgICAgICAgICAgICAgIC8qIGdldCByZWxhdGl2ZSBjb29yZHMgZnJvbSB0aGUgYW5jaG9yIGVsZW1lbnQgKi9cbiAgICAgICAgICAgICAgICB2YXIgeCA9IChlbGVtZW50Lm9mZnNldExlZnQgLSB0aGlzLmNvbnRhaW5lci5vZmZzZXRMZWZ0KSAqIHRoaXMuZ2V0U2NhbGUoKTtcbiAgICAgICAgICAgICAgICB2YXIgeSA9IChlbGVtZW50Lm9mZnNldFRvcCAtIHRoaXMuY29udGFpbmVyLm9mZnNldFRvcCkgKiB0aGlzLmdldFNjYWxlKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5zY3JvbGxUbyh4LCB5KTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFdvcmthcm91bmQgdG8gbWFuaXB1bGF0ZSA6OmJlZm9yZSBDU1Mgc3R5bGVzIHdpdGggamF2YXNjcmlwdFxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBjc3NDbGFzcyAtIHRoZSBDU1MgY2xhc3MgbmFtZSB0byBhZGQgOjpiZWZvcmUgcHJvcGVydGllc1xuICAgICAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGNzc1Byb3BlcnR5IC0gdGhlIENTUyBwcm9wZXJ0eSB0byBzZXRcbiAgICAgICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBjc3NWYWx1ZSAtIHRoZSBDU1MgdmFsdWUgdG8gc2V0XG4gICAgICAgICAgICAgKiBAcmV0dXJuIHt2b2lkfVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLmFkZEJlZm9yZUNTUyA9IGZ1bmN0aW9uIChjc3NDbGFzcywgY3NzUHJvcGVydHksIGNzc1ZhbHVlKSB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBkb2N1bWVudC5zdHlsZVNoZWV0c1swXS5pbnNlcnRSdWxlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgIGRvY3VtZW50LnN0eWxlU2hlZXRzWzBdLmluc2VydFJ1bGUoJy4nICsgY3NzQ2xhc3MgKyAnOjpiZWZvcmUgeyAnICsgY3NzUHJvcGVydHkgKyAnOiAnICsgY3NzVmFsdWUgKyAnfScsIDApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmICh0eXBlb2YgZG9jdW1lbnQuc3R5bGVTaGVldHNbMF0uYWRkUnVsZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICBkb2N1bWVudC5zdHlsZVNoZWV0c1swXS5hZGRSdWxlKCcuJyArIGNzc0NsYXNzICsgJzo6YmVmb3JlJywgY3NzUHJvcGVydHkgKyAnOiAnICsgY3NzVmFsdWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEdldCBjb21wdXRlIHBpeGVsIG51bWJlciBvZiB0aGUgd2hvbGUgd2lkdGggYW5kIGhlaWdodCBmcm9tIGEgYm9yZGVyIG9mIGFuIGVsZW1lbnRcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbCAtIHRoZSBIVE1MIGVsZW1lbnRcbiAgICAgICAgICAgICAqIEByZXR1cm4ge2FycmF5fSBbd2lkdGgsIGhlaWdodF0gLSB0aGUgYW1vdW50IG9mIHBpeGVsc1xuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLmdldEJvcmRlciA9IGZ1bmN0aW9uIChlbCkge1xuICAgICAgICAgICAgICAgIHZhciBibCA9IGNvbnZlcnRCb3JkZXIodGhpcy5nZXRTdHlsZShlbCwgJ2JvcmRlckxlZnRXaWR0aCcpKTtcbiAgICAgICAgICAgICAgICB2YXIgYnIgPSBjb252ZXJ0Qm9yZGVyKHRoaXMuZ2V0U3R5bGUoZWwsICdib3JkZXJSaWdodFdpZHRoJykpO1xuICAgICAgICAgICAgICAgIHZhciBwbCA9IGNvbnZlcnRTcGFuKHRoaXMuZ2V0U3R5bGUoZWwsICdwYWRkaW5nTGVmdCcpKTtcbiAgICAgICAgICAgICAgICB2YXIgcHIgPSBjb252ZXJ0U3Bhbih0aGlzLmdldFN0eWxlKGVsLCAncGFkZGluZ1JpZ2h0JykpO1xuICAgICAgICAgICAgICAgIHZhciBtbCA9IGNvbnZlcnRTcGFuKHRoaXMuZ2V0U3R5bGUoZWwsICdtYXJnaW5MZWZ0JykpO1xuICAgICAgICAgICAgICAgIHZhciBtciA9IGNvbnZlcnRTcGFuKHRoaXMuZ2V0U3R5bGUoZWwsICdtYXJnaW5SaWdodCcpKTtcbiAgICAgICAgICAgICAgICB2YXIgYnQgPSBjb252ZXJ0Qm9yZGVyKHRoaXMuZ2V0U3R5bGUoZWwsICdib3JkZXJUb3BXaWR0aCcpKTtcbiAgICAgICAgICAgICAgICB2YXIgYmIgPSBjb252ZXJ0Qm9yZGVyKHRoaXMuZ2V0U3R5bGUoZWwsICdib3JkZXJCb3R0b21XaWR0aCcpKTtcbiAgICAgICAgICAgICAgICB2YXIgcHQgPSBjb252ZXJ0U3Bhbih0aGlzLmdldFN0eWxlKGVsLCAncGFkZGluZ1RvcCcpKTtcbiAgICAgICAgICAgICAgICB2YXIgcGIgPSBjb252ZXJ0U3Bhbih0aGlzLmdldFN0eWxlKGVsLCAncGFkZGluZ0JvdHRvbScpKTtcbiAgICAgICAgICAgICAgICB2YXIgbXQgPSBjb252ZXJ0U3Bhbih0aGlzLmdldFN0eWxlKGVsLCAnbWFyZ2luVG9wJykpO1xuICAgICAgICAgICAgICAgIHZhciBtYiA9IGNvbnZlcnRTcGFuKHRoaXMuZ2V0U3R5bGUoZWwsICdtYXJnaW5Cb3R0b20nKSk7XG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gY29udmVydEJvcmRlcihiKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBiID09PSAndGhpbicgPyAxIDogYiA9PT0gJ21lZGl1bScgPyAzIDogYiA9PT0gJ3RoaWNrJyA/IDUgOiAhaXNOYU4ocGFyc2VJbnQoYiwgMTApKSA/IHBhcnNlSW50KGIsIDEwKSA6IDA7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIGNvbnZlcnRTcGFuKHYpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHYgPT09ICdhdXRvJyA/IDAgOiAhaXNOYU4ocGFyc2VJbnQodiwgMTApKSA/IHBhcnNlSW50KHYsIDEwKSA6IDA7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICAgICAgICAgIChwbCArIHByICsgYmwgKyBiciArIG1sICsgbXIpLFxuICAgICAgICAgICAgICAgICAgICAocHQgKyBwYiArIGJ0ICsgYmIgKyBtdCArIG1iKVxuICAgICAgICAgICAgICAgIF07XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBEaXNhYmxlcyB0aGUgc2Nyb2xsIHdoZWVsIG9mIHRoZSBtb3VzZVxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBwYXJhbSB7TW91c2VXaGVlbEV2ZW50fSBlIC0gdGhlIG1vdXNlIHdoZWVsIGV2ZW50XG4gICAgICAgICAgICAgKiBAcmV0dXJuIHt2b2lkfVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLmRpc2FibGVNb3VzZVNjcm9sbCA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuZWxlbWVudEJlaGluZEN1cnNvcklzTWUoZS5jbGllbnRYLCBlLmNsaWVudFkpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY2xlYXJUaW1lb3V0cygpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGUgPSB3aW5kb3cuZXZlbnQ7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKGUucHJldmVudERlZmF1bHQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGUucmV0dXJuVmFsdWUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIERldGVybWluZSB3aGV0aGVyIGFuIGVsZW1lbnQgaGFzIGEgc2Nyb2xsYmFyIG9yIG5vdFxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsZW1lbnQgLSB0aGUgSFRNTEVsZW1lbnRcbiAgICAgICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBkaXJlY3Rpb24gLSBkZXRlcm1pbmUgdGhlIHZlcnRpY2FsIG9yIGhvcml6b250YWwgc2Nyb2xsYmFyP1xuICAgICAgICAgICAgICogQHJldHVybiB7Ym9vbGVhbn0gLSB3aGV0aGVyIHRoZSBlbGVtZW50IGhhcyBzY3JvbGxiYXJzIG9yIG5vdFxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLmhhc1Njcm9sbGJhciA9IGZ1bmN0aW9uIChlbGVtZW50LCBkaXJlY3Rpb24pIHtcbiAgICAgICAgICAgICAgICB2YXIgaGFzID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgdmFyIG92ZXJmbG93ID0gJ292ZXJmbG93JztcbiAgICAgICAgICAgICAgICBpZiAoZGlyZWN0aW9uID09PSAndmVydGljYWwnKSB7XG4gICAgICAgICAgICAgICAgICAgIG92ZXJmbG93ID0gJ292ZXJmbG93WSc7XG4gICAgICAgICAgICAgICAgICAgIGhhcyA9IGVsZW1lbnQuc2Nyb2xsSGVpZ2h0ID4gZWxlbWVudC5jbGllbnRIZWlnaHQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKGRpcmVjdGlvbiA9PT0gJ2hvcml6b250YWwnKSB7XG4gICAgICAgICAgICAgICAgICAgIG92ZXJmbG93ID0gJ292ZXJmbG93WCc7XG4gICAgICAgICAgICAgICAgICAgIGhhcyA9IGVsZW1lbnQuc2Nyb2xsV2lkdGggPiBlbGVtZW50LmNsaWVudFdpZHRoO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBDaGVjayB0aGUgb3ZlcmZsb3cgYW5kIG92ZXJmbG93RGlyZWN0aW9uIHByb3BlcnRpZXMgZm9yIFwiYXV0b1wiIGFuZCBcInZpc2libGVcIiB2YWx1ZXNcbiAgICAgICAgICAgICAgICBoYXMgPSB0aGlzLmdldFN0eWxlKHRoaXMuY29udGFpbmVyLCAnb3ZlcmZsb3cnKSA9PT0gXCJ2aXNpYmxlXCJcbiAgICAgICAgICAgICAgICAgICAgfHwgdGhpcy5nZXRTdHlsZSh0aGlzLmNvbnRhaW5lciwgJ292ZXJmbG93WScpID09PSBcInZpc2libGVcIlxuICAgICAgICAgICAgICAgICAgICB8fCAoaGFzICYmIHRoaXMuZ2V0U3R5bGUodGhpcy5jb250YWluZXIsICdvdmVyZmxvdycpID09PSBcImF1dG9cIilcbiAgICAgICAgICAgICAgICAgICAgfHwgKGhhcyAmJiB0aGlzLmdldFN0eWxlKHRoaXMuY29udGFpbmVyLCAnb3ZlcmZsb3dZJykgPT09IFwiYXV0b1wiKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gaGFzO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogRW5hYmxlcyB0aGUgc2Nyb2xsIHdoZWVsIG9mIHRoZSBtb3VzZSB0byBzY3JvbGwsIHNwZWNpYWxseSBmb3IgZGl2cyB3aXRob3VyIHNjcm9sbGJhclxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBwYXJhbSB7TW91c2VXaGVlbEV2ZW50fSBlIC0gdGhlIG1vdXNlIHdoZWVsIGV2ZW50XG4gICAgICAgICAgICAgKiBAcmV0dXJuIHt2b2lkfVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLmFjdGl2ZU1vdXNlU2Nyb2xsID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgICBpZiAoIWUpIHtcbiAgICAgICAgICAgICAgICAgICAgZSA9IHdpbmRvdy5ldmVudDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuZWxlbWVudEJlaGluZEN1cnNvcklzTWUoZS5jbGllbnRYLCBlLmNsaWVudFkpKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBkaXJlY3Rpb247XG4gICAgICAgICAgICAgICAgICAgIGlmIChcImRlbHRhWVwiIGluIGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpcmVjdGlvbiA9IGUuZGVsdGFZID4gMCA/ICdkb3duJyA6ICd1cCc7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoXCJ3aGVlbERlbHRhXCIgaW4gZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGlyZWN0aW9uID0gZS53aGVlbERlbHRhID4gMCA/ICd1cCcgOiAnZG93bic7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgLyogdXNlIHRoZSBub3JtYWwgc2Nyb2xsLCB3aGVuIHRoZXJlIGFyZSBzY3JvbGxiYXJzIGFuZCB0aGUgZGlyZWN0aW9uIGlzIFwidmVydGljYWxcIiAqL1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLndoZWVsT3B0aW9ucy5kaXJlY3Rpb24gPT09ICd2ZXJ0aWNhbCcgJiYgdGhpcy5oYXNTY3JvbGxiYXIodGhpcy5zY3JvbGxFbGVtZW50LCB0aGlzLm9wdGlvbnMud2hlZWxPcHRpb25zLmRpcmVjdGlvbikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghKCh0aGlzLnRyaWdnZXJlZC5jb2xsaWRlQm90dG9tICYmIGRpcmVjdGlvbiA9PT0gJ2Rvd24nKSB8fCAodGhpcy50cmlnZ2VyZWQuY29sbGlkZVRvcCAmJiBkaXJlY3Rpb24gPT09ICd1cCcpKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY2xlYXJUaW1lb3V0cygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0aGlzLmRpc2FibGVNb3VzZVNjcm9sbChlKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHggPSB0aGlzLmdldFNjcm9sbExlZnQoKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHkgPSB0aGlzLmdldFNjcm9sbFRvcCgpO1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLndoZWVsT3B0aW9ucy5kaXJlY3Rpb24gPT09ICdob3Jpem9udGFsJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgeCA9IHRoaXMuZ2V0U2Nyb2xsTGVmdCgpICsgKGRpcmVjdGlvbiA9PT0gJ2Rvd24nID8gdGhpcy5vcHRpb25zLndoZWVsT3B0aW9ucy5zdGVwIDogdGhpcy5vcHRpb25zLndoZWVsT3B0aW9ucy5zdGVwICogLTEpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKHRoaXMub3B0aW9ucy53aGVlbE9wdGlvbnMuZGlyZWN0aW9uID09PSAndmVydGljYWwnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB5ID0gdGhpcy5nZXRTY3JvbGxUb3AoKSArIChkaXJlY3Rpb24gPT09ICdkb3duJyA/IHRoaXMub3B0aW9ucy53aGVlbE9wdGlvbnMuc3RlcCA6IHRoaXMub3B0aW9ucy53aGVlbE9wdGlvbnMuc3RlcCAqIC0xKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0aGlzLnNjcm9sbFRvKHgsIHksIGZhbHNlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBFbmFibGVzIHRoZSBzY3JvbGwgd2hlZWwgb2YgdGhlIG1vdXNlIHRvIHpvb21cbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAcGFyYW0ge01vdXNlV2hlZWxFdmVudH0gZSAtIHRoZSBtb3VzZSB3aGVlbCBldmVudFxuICAgICAgICAgICAgICogQHJldHVybiB7dm9pZH1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgWndvb3NoLnByb3RvdHlwZS5hY3RpdmVNb3VzZVpvb20gPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgIGlmICghZSkge1xuICAgICAgICAgICAgICAgICAgICBlID0gd2luZG93LmV2ZW50O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5lbGVtZW50QmVoaW5kQ3Vyc29ySXNNZShlLmNsaWVudFgsIGUuY2xpZW50WSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRpcmVjdGlvbjtcbiAgICAgICAgICAgICAgICAgICAgaWYgKFwiZGVsdGFZXCIgaW4gZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGlyZWN0aW9uID0gZS5kZWx0YVkgPiAwID8gJ2Rvd24nIDogJ3VwJztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChcIndoZWVsRGVsdGFcIiBpbiBlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkaXJlY3Rpb24gPSBlLndoZWVsRGVsdGEgPiAwID8gJ3VwJyA6ICdkb3duJztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB2YXIgc2NhbGU7XG4gICAgICAgICAgICAgICAgICAgIGlmIChkaXJlY3Rpb24gPT09IHRoaXMub3B0aW9ucy56b29tT3B0aW9ucy5kaXJlY3Rpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjYWxlID0gdGhpcy5nZXRTY2FsZSgpICogKDEgKyB0aGlzLm9wdGlvbnMuem9vbU9wdGlvbnMuc3RlcCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzY2FsZSA9IHRoaXMuZ2V0U2NhbGUoKSAvICgxICsgdGhpcy5vcHRpb25zLnpvb21PcHRpb25zLnN0ZXApO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2NhbGVUbyhzY2FsZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQ2FsY3VsYXRlcyB0aGUgc2l6ZSBvZiB0aGUgdmVydGljYWwgc2Nyb2xsYmFyLlxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsIC0gVGhlIEhUTUxFbGVtZW1udFxuICAgICAgICAgICAgICogQHJldHVybiB7bnVtYmVyfSAtIHRoZSBhbW91bnQgb2YgcGl4ZWxzIHVzZWQgYnkgdGhlIHZlcnRpY2FsIHNjcm9sbGJhclxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLnNjcm9sbGJhcldpZHRoID0gZnVuY3Rpb24gKGVsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGVsLm9mZnNldFdpZHRoIC0gZWwuY2xpZW50V2lkdGggLSBwYXJzZUludCh0aGlzLmdldFN0eWxlKGVsLCAnYm9yZGVyTGVmdFdpZHRoJykpIC0gcGFyc2VJbnQodGhpcy5nZXRTdHlsZShlbCwgJ2JvcmRlclJpZ2h0V2lkdGgnKSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBDYWxjdWxhdGVzIHRoZSBzaXplIG9mIHRoZSBob3Jpem9udGFsIHNjcm9sbGJhci5cbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbCAtIFRoZSBIVE1MRWxlbWVtbnRcbiAgICAgICAgICAgICAqIEByZXR1cm4ge251bWJlcn0gLSB0aGUgYW1vdW50IG9mIHBpeGVscyB1c2VkIGJ5IHRoZSBob3Jpem9udGFsIHNjcm9sbGJhclxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLnNjcm9sbGJhckhlaWdodCA9IGZ1bmN0aW9uIChlbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBlbC5vZmZzZXRIZWlnaHQgLSBlbC5jbGllbnRIZWlnaHQgLSBwYXJzZUludCh0aGlzLmdldFN0eWxlKGVsLCAnYm9yZGVyVG9wV2lkdGgnKSkgLSBwYXJzZUludCh0aGlzLmdldFN0eWxlKGVsLCAnYm9yZGVyQm90dG9tV2lkdGgnKSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBSZXRyaWV2ZXMgdGhlIGN1cnJlbnQgc2NhbGUgdmFsdWUgb3IgMSBpZiBpdCBpcyBub3Qgc2V0LlxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEByZXR1cm4ge251bWJlcn0gLSB0aGUgY3VycmVudCBzY2FsZSB2YWx1ZVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLmdldFNjYWxlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdGhpcy5pbm5lci5zdHlsZS50cmFuc2Zvcm0gIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciByID0gdGhpcy5pbm5lci5zdHlsZS50cmFuc2Zvcm0ubWF0Y2goL3NjYWxlXFwoKFswLTksXFwuXSspXFwpLykgfHwgW1wiXCJdO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcGFyc2VGbG9hdChyWzFdKSB8fCAxO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFNjYWxlcyB0aGUgaW5uZXIgZWxlbWVudCBieSBhIHJlbGF0aWNlIHZhbHVlIGJhc2VkIG9uIHRoZSBjdXJyZW50IHNjYWxlIHZhbHVlLlxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSBwZXJjZW50IC0gcGVyY2VudGFnZSBvZiB0aGUgY3VycmVudCBzY2FsZSB2YWx1ZVxuICAgICAgICAgICAgICogQHBhcmFtIHtib29sZWFufSBob25vdXJMaW1pdHMgLSB3aGV0aGVyIHRvIGhvbm91ciBtYXhTY2FsZSBhbmQgdGhlIG1pbmltdW0gd2lkdGggYW5kIGhlaWdodFxuICAgICAgICAgICAgICogb2YgdGhlIGNvbnRhaW5lciBlbGVtZW50LlxuICAgICAgICAgICAgICogQHJldHVybiB7dm9pZH1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgWndvb3NoLnByb3RvdHlwZS5zY2FsZUJ5ID0gZnVuY3Rpb24gKHBlcmNlbnQsIGhvbm91ckxpbWl0cykge1xuICAgICAgICAgICAgICAgIGlmIChob25vdXJMaW1pdHMgPT09IHZvaWQgMCkgeyBob25vdXJMaW1pdHMgPSB0cnVlOyB9XG4gICAgICAgICAgICAgICAgdmFyIHNjYWxlID0gdGhpcy5nZXRTY2FsZSgpICogKHBlcmNlbnQgLyAxMDApO1xuICAgICAgICAgICAgICAgIHRoaXMuc2NhbGVUbyhzY2FsZSwgaG9ub3VyTGltaXRzKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFNjYWxlcyB0aGUgaW5uZXIgZWxlbWVudCB0byBhbiBhYnNvbHV0ZSB2YWx1ZS5cbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0gc2NhbGUgLSB0aGUgc2NhbGVcbiAgICAgICAgICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gaG9ub3VyTGltaXRzIC0gd2hldGhlciB0byBob25vdXIgbWF4U2NhbGUgYW5kIHRoZSBtaW5pbXVtIHdpZHRoIGFuZCBoZWlnaHRcbiAgICAgICAgICAgICAqIG9mIHRoZSBjb250YWluZXIgZWxlbWVudC5cbiAgICAgICAgICAgICAqIEByZXR1cm4ge3ZvaWR9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIFp3b29zaC5wcm90b3R5cGUuc2NhbGVUbyA9IGZ1bmN0aW9uIChzY2FsZSwgaG9ub3VyTGltaXRzKSB7XG4gICAgICAgICAgICAgICAgaWYgKGhvbm91ckxpbWl0cyA9PT0gdm9pZCAwKSB7IGhvbm91ckxpbWl0cyA9IHRydWU7IH1cbiAgICAgICAgICAgICAgICB2YXIgd2lkdGggPSAocGFyc2VGbG9hdCh0aGlzLmlubmVyLnN0eWxlLm1pbldpZHRoKSAqIHNjYWxlKTtcbiAgICAgICAgICAgICAgICB2YXIgaGVpZ2h0ID0gKHBhcnNlRmxvYXQodGhpcy5pbm5lci5zdHlsZS5taW5IZWlnaHQpICogc2NhbGUpO1xuICAgICAgICAgICAgICAgIC8qIHNjcm9sbGJhcnMgaGF2ZSB3aWR0aCBhbmQgaGVpZ2h0IHRvbyAqL1xuICAgICAgICAgICAgICAgIHZhciBtaW5XaWR0aCA9IHRoaXMuY29udGFpbmVyLmNsaWVudFdpZHRoICsgdGhpcy5zY3JvbGxiYXJXaWR0aCh0aGlzLmNvbnRhaW5lcik7XG4gICAgICAgICAgICAgICAgdmFyIG1pbkhlaWdodCA9IHRoaXMuY29udGFpbmVyLmNsaWVudEhlaWdodCArIHRoaXMuc2Nyb2xsYmFySGVpZ2h0KHRoaXMuY29udGFpbmVyKTtcbiAgICAgICAgICAgICAgICBpZiAoaG9ub3VyTGltaXRzKSB7XG4gICAgICAgICAgICAgICAgICAgIC8qIGxvb3AgYXMgbG9uZyBhcyBhbGwgbGltaXRzIGFyZSBob25vdXJlZCAqL1xuICAgICAgICAgICAgICAgICAgICB3aGlsZSAoKHNjYWxlID4gdGhpcy5vcHRpb25zLnpvb21PcHRpb25zLm1heFNjYWxlICYmIHRoaXMub3B0aW9ucy56b29tT3B0aW9ucy5tYXhTY2FsZSAhPT0gMClcbiAgICAgICAgICAgICAgICAgICAgICAgIHx8IChzY2FsZSA8IHRoaXMub3B0aW9ucy56b29tT3B0aW9ucy5taW5TY2FsZSAmJiB0aGlzLm9wdGlvbnMuem9vbU9wdGlvbnMubWluU2NhbGUgIT09IDApXG4gICAgICAgICAgICAgICAgICAgICAgICB8fCAod2lkdGggPCB0aGlzLmNvbnRhaW5lci5jbGllbnRXaWR0aCAmJiAhdGhpcy5pc0JvZHkpXG4gICAgICAgICAgICAgICAgICAgICAgICB8fCBoZWlnaHQgPCB0aGlzLmNvbnRhaW5lci5jbGllbnRIZWlnaHQgJiYgIXRoaXMuaXNCb2R5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2NhbGUgPiB0aGlzLm9wdGlvbnMuem9vbU9wdGlvbnMubWF4U2NhbGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY2FsZSA9IHRoaXMub3B0aW9ucy56b29tT3B0aW9ucy5tYXhTY2FsZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKHNjYWxlIDwgdGhpcy5vcHRpb25zLnpvb21PcHRpb25zLm1pblNjYWxlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2NhbGUgPSB0aGlzLm9wdGlvbnMuem9vbU9wdGlvbnMubWluU2NhbGU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLnpvb21PcHRpb25zLm1heFNjYWxlICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGggPSBNYXRoLmZsb29yKHBhcnNlSW50KHRoaXMuaW5uZXIuc3R5bGUubWluV2lkdGgpICogc2NhbGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodCA9IE1hdGguZmxvb3IocGFyc2VJbnQodGhpcy5pbm5lci5zdHlsZS5taW5IZWlnaHQpICogc2NhbGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHdpZHRoIDwgbWluV2lkdGggJiYgIXRoaXMuaXNCb2R5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2NhbGUgPSBzY2FsZSAvIHdpZHRoICogbWluV2lkdGg7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0ID0gTWF0aC5mbG9vcihwYXJzZUludCh0aGlzLmlubmVyLnN0eWxlLm1pbkhlaWdodCkgKiBzY2FsZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGggPSBtaW5XaWR0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChoZWlnaHQgPCBtaW5IZWlnaHQgJiYgIXRoaXMuaXNCb2R5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2NhbGUgPSBzY2FsZSAvIGhlaWdodCAqIG1pbkhlaWdodDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWR0aCA9IE1hdGguZmxvb3IocGFyc2VJbnQodGhpcy5pbm5lci5zdHlsZS5taW5XaWR0aCkgKiBzY2FsZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0ID0gbWluSGVpZ2h0O1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuaW5uZXIuc3R5bGUudHJhbnNmb3JtID0gJ3RyYW5zbGF0ZSgwcHgsIDBweCkgc2NhbGUoJyArIHNjYWxlICsgJyknO1xuICAgICAgICAgICAgICAgIHRoaXMuc2NhbGVFbGVtZW50LnN0eWxlLm1pbldpZHRoID0gdGhpcy5zY2FsZUVsZW1lbnQuc3R5bGUud2lkdGggPSB3aWR0aCArICdweCc7XG4gICAgICAgICAgICAgICAgdGhpcy5zY2FsZUVsZW1lbnQuc3R5bGUubWluSGVpZ2h0ID0gdGhpcy5zY2FsZUVsZW1lbnQuc3R5bGUuaGVpZ2h0ID0gaGVpZ2h0ICsgJ3B4JztcbiAgICAgICAgICAgICAgICAvKiBUT0RPOiBoZXJlIHNjcm9sbFRvIGJhc2VkIG9uIHdoZXJlIHRoZSBtb3VzZSBjdXJzb3IgaXMgKi9cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIERpc2FibGVzIHRoZSBzY3JvbGwgd2hlZWwgb2YgdGhlIG1vdXNlXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IHggLSB0aGUgeC1jb29yZGluYXRlc1xuICAgICAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IHkgLSB0aGUgeS1jb29yZGluYXRlc1xuICAgICAgICAgICAgICogQHJldHVybiB7Ym9vbGVhbn0gLSB3aGV0aGVyIHRoZSBuZWFyZXN0IHJlbGF0ZWQgcGFyZW50IGlubmVyIGVsZW1lbnQgaXMgdGhlIG9uZSBvZiB0aGlzIG9iamVjdCBpbnN0YW5jZVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLmVsZW1lbnRCZWhpbmRDdXJzb3JJc01lID0gZnVuY3Rpb24gKHgsIHkpIHtcbiAgICAgICAgICAgICAgICB2YXIgZWxlbWVudEJlaGluZEN1cnNvciA9IGRvY3VtZW50LmVsZW1lbnRGcm9tUG9pbnQoeCwgeSk7XG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogSWYgdGhlIGVsZW1lbnQgZGlyZWN0bHkgYmVoaW5kIHRoZSBjdXJzb3IgaXMgYW4gb3V0ZXIgZWxlbWVudCB0aHJvdyBvdXQsIGJlY2F1c2Ugd2hlbiBjbGlja2luZyBvbiBhIHNjcm9sbGJhclxuICAgICAgICAgICAgICAgICAqIGZyb20gYSBkaXYsIGEgZHJhZyBvZiB0aGUgcGFyZW50IFp3b29zaCBlbGVtZW50IGlzIGluaXRpYXRlZC5cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5oYXNDbGFzcyhlbGVtZW50QmVoaW5kQ3Vyc29yLCB0aGlzLmNsYXNzT3V0ZXIpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLyogZmluZCB0aGUgbmV4dCBwYXJlbnQgd2hpY2ggaXMgYW4gaW5uZXIgZWxlbWVudCAqL1xuICAgICAgICAgICAgICAgIHdoaWxlIChlbGVtZW50QmVoaW5kQ3Vyc29yICYmICF0aGlzLmhhc0NsYXNzKGVsZW1lbnRCZWhpbmRDdXJzb3IsIHRoaXMuY2xhc3NJbm5lcikpIHtcbiAgICAgICAgICAgICAgICAgICAgZWxlbWVudEJlaGluZEN1cnNvciA9IGVsZW1lbnRCZWhpbmRDdXJzb3IucGFyZW50RWxlbWVudDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuaW5uZXIgPT09IGVsZW1lbnRCZWhpbmRDdXJzb3I7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgWndvb3NoLnByb3RvdHlwZS5nZXRUaW1lc3RhbXAgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB3aW5kb3cucGVyZm9ybWFuY2UgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChcIm5vd1wiIGluIHdpbmRvdy5wZXJmb3JtYW5jZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHdpbmRvdy5wZXJmb3JtYW5jZS5ub3coKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChcIndlYmtpdE5vd1wiIGluIHdpbmRvdy5wZXJmb3JtYW5jZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHdpbmRvdy5wZXJmb3JtYW5jZS53ZWJraXROb3coKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBTY3JvbGwgaGFuZGxlciB0byB0cmlnZ2VyIHRoZSBjdXN0b20gZXZlbnRzXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQHBhcmFtIHtFdmVudH0gZSAtIFRoZSBzY3JvbGwgZXZlbnQgb2JqZWN0IChUT0RPOiBuZWVkZWQ/KVxuICAgICAgICAgICAgICogQHRocm93cyBFdmVudCBjb2xsaWRlTGVmdFxuICAgICAgICAgICAgICogQHRocm93cyBFdmVudCBjb2xsaWRlUmlnaHRcbiAgICAgICAgICAgICAqIEB0aHJvd3MgRXZlbnQgY29sbGlkZVRvcFxuICAgICAgICAgICAgICogQHRocm93cyBFdmVudCBjb2xsaWRlQm90dG9tXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHt2b2lkfVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLm9uU2Nyb2xsID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgICB2YXIgeCA9IHRoaXMuZ2V0U2Nyb2xsTGVmdCgpO1xuICAgICAgICAgICAgICAgIHZhciB5ID0gdGhpcy5nZXRTY3JvbGxUb3AoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnNjcm9sbE1heExlZnQgPSAodGhpcy5zY3JvbGxFbGVtZW50LnNjcm9sbFdpZHRoIC0gdGhpcy5zY3JvbGxFbGVtZW50LmNsaWVudFdpZHRoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnNjcm9sbE1heFRvcCA9ICh0aGlzLnNjcm9sbEVsZW1lbnQuc2Nyb2xsSGVpZ2h0IC0gdGhpcy5zY3JvbGxFbGVtZW50LmNsaWVudEhlaWdodCk7XG4gICAgICAgICAgICAgICAgLy8gdGhlIGNvbGxpZGVMZWZ0IGV2ZW50XG4gICAgICAgICAgICAgICAgaWYgKHggPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50cmlnZ2VyZWQuY29sbGlkZUxlZnQgPyBudWxsIDogdGhpcy50cmlnZ2VyRXZlbnQodGhpcy5pbm5lciwgJ2NvbGxpZGUubGVmdCcpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnRyaWdnZXJlZC5jb2xsaWRlTGVmdCA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnRyaWdnZXJlZC5jb2xsaWRlTGVmdCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyB0aGUgY29sbGlkZVRvcCBldmVudFxuICAgICAgICAgICAgICAgIGlmICh5ID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudHJpZ2dlcmVkLmNvbGxpZGVUb3AgPyBudWxsIDogdGhpcy50cmlnZ2VyRXZlbnQodGhpcy5pbm5lciwgJ2NvbGxpZGUudG9wJyk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudHJpZ2dlcmVkLmNvbGxpZGVUb3AgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50cmlnZ2VyZWQuY29sbGlkZVRvcCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyB0aGUgY29sbGlkZVJpZ2h0IGV2ZW50XG4gICAgICAgICAgICAgICAgaWYgKHggPT09IHRoaXMuc2Nyb2xsTWF4TGVmdCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnRyaWdnZXJlZC5jb2xsaWRlUmlnaHQgPyBudWxsIDogdGhpcy50cmlnZ2VyRXZlbnQodGhpcy5pbm5lciwgJ2NvbGxpZGUucmlnaHQnKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50cmlnZ2VyZWQuY29sbGlkZVJpZ2h0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudHJpZ2dlcmVkLmNvbGxpZGVSaWdodCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyB0aGUgY29sbGlkZUJvdHRvbSBldmVudFxuICAgICAgICAgICAgICAgIGlmICh5ID09PSB0aGlzLnNjcm9sbE1heFRvcCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnRyaWdnZXJlZC5jb2xsaWRlQm90dG9tID8gbnVsbCA6IHRoaXMudHJpZ2dlckV2ZW50KHRoaXMuaW5uZXIsICdjb2xsaWRlLmJvdHRvbScpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnRyaWdnZXJlZC5jb2xsaWRlQm90dG9tID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudHJpZ2dlcmVkLmNvbGxpZGVCb3R0b20gPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiB3aW5kb3cgcmVzaXplIGhhbmRsZXIgdG8gcmVjYWxjdWxhdGUgdGhlIGlubmVyIGRpdiBtaW5XaWR0aCBhbmQgbWluSGVpZ2h0XG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQHBhcmFtIHtFdmVudH0gZSAtIFRoZSB3aW5kb3cgcmVzaXplIGV2ZW50IG9iamVjdCAoVE9ETzogbmVlZGVkPylcbiAgICAgICAgICAgICAqIEByZXR1cm4ge3ZvaWR9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIFp3b29zaC5wcm90b3R5cGUub25SZXNpemUgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgICAgICAgICAgdmFyIG9uUmVzaXplID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBfdGhpcy5pbm5lci5zdHlsZS5taW5XaWR0aCA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIF90aGlzLmlubmVyLnN0eWxlLm1pbkhlaWdodCA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIC8qIHRha2UgYXdheSB0aGUgbWFyZ2luIHZhbHVlcyBvZiB0aGUgYm9keSBlbGVtZW50ICovXG4gICAgICAgICAgICAgICAgICAgIHZhciB4RGVsdGEgPSBwYXJzZUludChfdGhpcy5nZXRTdHlsZShkb2N1bWVudC5ib2R5LCAnbWFyZ2luTGVmdCcpLCAxMCkgKyBwYXJzZUludChfdGhpcy5nZXRTdHlsZShkb2N1bWVudC5ib2R5LCAnbWFyZ2luUmlnaHQnKSwgMTApO1xuICAgICAgICAgICAgICAgICAgICB2YXIgeURlbHRhID0gcGFyc2VJbnQoX3RoaXMuZ2V0U3R5bGUoZG9jdW1lbnQuYm9keSwgJ21hcmdpblRvcCcpLCAxMCkgKyBwYXJzZUludChfdGhpcy5nZXRTdHlsZShkb2N1bWVudC5ib2R5LCAnbWFyZ2luQm90dG9tJyksIDEwKTtcbiAgICAgICAgICAgICAgICAgICAgLy9UT0RPOiB3aXRoIHRoaXMuZ2V0Qm9yZGVyKClcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMuaW5uZXIuc3R5bGUubWluV2lkdGggPSAoZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnNjcm9sbFdpZHRoIC0geERlbHRhKSArICdweCc7XG4gICAgICAgICAgICAgICAgICAgIF90aGlzLmlubmVyLnN0eWxlLm1pbkhlaWdodCA9IChkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsSGVpZ2h0IC0geURlbHRhIC0gMTAwKSArICdweCc7IC8vVE9ETzogV1RGPyB3aHkgLTEwMCBmb3IgSUU4P1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogVHJpZ2dlciB0aGUgZnVuY3Rpb24gb25seSB3aGVuIHRoZSBjbGllbnRXaWR0aCBvciBjbGllbnRIZWlnaHQgcmVhbGx5IGhhdmUgY2hhbmdlZC5cbiAgICAgICAgICAgICAgICAgKiBJRTggcmVzaWRlcyBpbiBhbiBpbmZpbml0eSBsb29wIGFsd2F5cyB0cmlnZ2VyaW5nIHRoZSByZXNpdGUgZXZlbnQgd2hlbiBhbHRlcmluZyBjc3MuXG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMub2xkQ2xpZW50V2lkdGggIT09IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRXaWR0aCB8fCB0aGlzLm9sZENsaWVudEhlaWdodCAhPT0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudEhlaWdodCkge1xuICAgICAgICAgICAgICAgICAgICB3aW5kb3cuY2xlYXJUaW1lb3V0KHRoaXMucmVzaXplVGltZW91dCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVzaXplVGltZW91dCA9IHdpbmRvdy5zZXRUaW1lb3V0KG9uUmVzaXplLCAxMCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8qIHdyaXRlIGRvd24gdGhlIG9sZCBjbGllbnRXaWR0aCBhbmQgY2xpZW50SGVpZ2h0IGZvciB0aGUgYWJvdmUgY29tcGFyc2lvbiAqL1xuICAgICAgICAgICAgICAgIHRoaXMub2xkQ2xpZW50V2lkdGggPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50V2lkdGg7XG4gICAgICAgICAgICAgICAgdGhpcy5vbGRDbGllbnRIZWlnaHQgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50SGVpZ2h0O1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIFp3b29zaC5wcm90b3R5cGUuY2xlYXJUZXh0U2VsZWN0aW9uID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmICh3aW5kb3cuZ2V0U2VsZWN0aW9uKVxuICAgICAgICAgICAgICAgICAgICB3aW5kb3cuZ2V0U2VsZWN0aW9uKCkucmVtb3ZlQWxsUmFuZ2VzKCk7XG4gICAgICAgICAgICAgICAgaWYgKGRvY3VtZW50LnNlbGVjdGlvbilcbiAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQuc2VsZWN0aW9uLmVtcHR5KCk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBCcm93c2VyIGluZGVwZW5kZW50IGV2ZW50IHJlZ2lzdHJhdGlvblxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBwYXJhbSB7YW55fSBvYmogLSBUaGUgSFRNTEVsZW1lbnQgdG8gYXR0YWNoIHRoZSBldmVudCB0b1xuICAgICAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50IC0gVGhlIGV2ZW50IG5hbWUgd2l0aG91dCB0aGUgbGVhZGluZyBcIm9uXCJcbiAgICAgICAgICAgICAqIEBwYXJhbSB7KGU6IEV2ZW50KSA9PiB2b2lkfSBjYWxsYmFjayAtIEEgY2FsbGJhY2sgZnVuY3Rpb24gdG8gYXR0YWNoIHRvIHRoZSBldmVudFxuICAgICAgICAgICAgICogQHBhcmFtIHtib29sZWFufSBib3VuZCAtIHdoZXRoZXIgdG8gYmluZCB0aGUgY2FsbGJhY2sgdG8gdGhlIG9iamVjdCBpbnN0YW5jZSBvciBub3RcbiAgICAgICAgICAgICAqIEByZXR1cm4ge3ZvaWR9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIFp3b29zaC5wcm90b3R5cGUuYWRkRXZlbnRMaXN0ZW5lciA9IGZ1bmN0aW9uIChvYmosIGV2ZW50LCBjYWxsYmFjaywgYm91bmQpIHtcbiAgICAgICAgICAgICAgICBpZiAoYm91bmQgPT09IHZvaWQgMCkgeyBib3VuZCA9IHRydWU7IH1cbiAgICAgICAgICAgICAgICB2YXIgYm91bmRDYWxsYmFjayA9IGJvdW5kID8gY2FsbGJhY2suYmluZCh0aGlzKSA6IGNhbGxiYWNrO1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2Ygb2JqLmFkZEV2ZW50TGlzdGVuZXIgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG1hcEV2ZW50c1snb24nICsgZXZlbnRdICYmIG9iai50YWdOYW1lID09PSBcIkJPRFlcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgb2JqID0gbWFwRXZlbnRzWydvbicgKyBldmVudF07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgb2JqLmFkZEV2ZW50TGlzdGVuZXIoZXZlbnQsIGJvdW5kQ2FsbGJhY2spO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmICh0eXBlb2Ygb2JqLmF0dGFjaEV2ZW50ID09PSAnb2JqZWN0JyAmJiBodG1sRXZlbnRzWydvbicgKyBldmVudF0pIHtcbiAgICAgICAgICAgICAgICAgICAgb2JqLmF0dGFjaEV2ZW50KCdvbicgKyBldmVudCwgYm91bmRDYWxsYmFjayk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHR5cGVvZiBvYmouYXR0YWNoRXZlbnQgPT09ICdvYmplY3QnICYmIG1hcEV2ZW50c1snb24nICsgZXZlbnRdKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChvYmoudGFnTmFtZSA9PT0gXCJCT0RZXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBwID0gJ29uJyArIGV2ZW50O1xuICAgICAgICAgICAgICAgICAgICAgICAgLyogZXhhbXBsZTogd2luZG93Lm9uc2Nyb2xsID0gYm91bmRDYWxsYmFjayAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgbWFwRXZlbnRzW3BdW3BdID0gYm91bmRDYWxsYmFjaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIFRPRE86IG9iai5vbnNjcm9sbCA/PyAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgb2JqLm9uc2Nyb2xsID0gYm91bmRDYWxsYmFjaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmICh0eXBlb2Ygb2JqLmF0dGFjaEV2ZW50ID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgICAgICAgICBvYmpbZXZlbnRdID0gMTtcbiAgICAgICAgICAgICAgICAgICAgYm91bmRDYWxsYmFjayA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBUT0RPOiBlIGlzIHRoZSBvbnByb3BlcnR5Y2hhbmdlIGV2ZW50IG5vdCBvbmUgb2YgdGhlIGN1c3RvbSBldmVudCBvYmplY3RzICovXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZS5wcm9wZXJ0eU5hbWUgPT09IGV2ZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIG9iai5hdHRhY2hFdmVudCgnb25wcm9wZXJ0eWNoYW5nZScsIGJvdW5kQ2FsbGJhY2spO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgb2JqWydvbicgKyBldmVudF0gPSBib3VuZENhbGxiYWNrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLmN1c3RvbUV2ZW50c1tldmVudF0gPyBudWxsIDogKHRoaXMuY3VzdG9tRXZlbnRzW2V2ZW50XSA9IFtdKTtcbiAgICAgICAgICAgICAgICB0aGlzLmN1c3RvbUV2ZW50c1tldmVudF0ucHVzaChbY2FsbGJhY2ssIGJvdW5kQ2FsbGJhY2tdKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEJyb3dzZXIgaW5kZXBlbmRlbnQgZXZlbnQgZGVyZWdpc3RyYXRpb25cbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAcGFyYW0ge2FueX0gb2JqIC0gVGhlIEhUTUxFbGVtZW50IG9yIHdpbmRvdyB3aG9zZSBldmVudCBzaG91bGQgYmUgZGV0YWNoZWRcbiAgICAgICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBldmVudCAtIFRoZSBldmVudCBuYW1lIHdpdGhvdXQgdGhlIGxlYWRpbmcgXCJvblwiXG4gICAgICAgICAgICAgKiBAcGFyYW0geyhlOiBFdmVudCkgPT4gdm9pZH0gY2FsbGJhY2sgLSBUaGUgY2FsbGJhY2sgZnVuY3Rpb24gd2hlbiBhdHRhY2hlZFxuICAgICAgICAgICAgICogQHJldHVybiB7dm9pZH1cbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAVE9ETzogdW5yZWdpc3RlcmluZyBvZiBtYXBFdmVudHNcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgWndvb3NoLnByb3RvdHlwZS5yZW1vdmVFdmVudExpc3RlbmVyID0gZnVuY3Rpb24gKG9iaiwgZXZlbnQsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50IGluIHRoaXMuY3VzdG9tRXZlbnRzKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgaW4gdGhpcy5jdXN0b21FdmVudHNbZXZlbnRdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBpZiB0aGUgZXZlbnQgd2FzIGZvdW5kIGluIHRoZSBhcnJheSBieSBpdHMgY2FsbGJhY2sgcmVmZXJlbmNlICovXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5jdXN0b21FdmVudHNbZXZlbnRdW2ldWzBdID09PSBjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIHJlbW92ZSB0aGUgbGlzdGVuZXIgZnJvbSB0aGUgYXJyYXkgYnkgaXRzIGJvdW5kIGNhbGxiYWNrIHJlZmVyZW5jZSAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrID0gdGhpcy5jdXN0b21FdmVudHNbZXZlbnRdW2ldWzFdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY3VzdG9tRXZlbnRzW2V2ZW50XS5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBvYmoucmVtb3ZlRXZlbnRMaXN0ZW5lciA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICBvYmoucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudCwgY2FsbGJhY2spO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmICh0eXBlb2Ygb2JqLmRldGFjaEV2ZW50ID09PSAnb2JqZWN0JyAmJiBodG1sRXZlbnRzWydvbicgKyBldmVudF0pIHtcbiAgICAgICAgICAgICAgICAgICAgb2JqLmRldGFjaEV2ZW50KCdvbicgKyBldmVudCwgY2FsbGJhY2spO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmICh0eXBlb2Ygb2JqLmRldGFjaEV2ZW50ID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgICAgICAgICBvYmouZGV0YWNoRXZlbnQoJ29ucHJvcGVydHljaGFuZ2UnLCBjYWxsYmFjayk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBvYmpbJ29uJyArIGV2ZW50XSA9IG51bGw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQnJvd3NlciBpbmRlcGVuZGVudCBldmVudCB0cmlnZ2VyIGZ1bmN0aW9uXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gb2JqIC0gVGhlIEhUTUxFbGVtZW50IHdoaWNoIHRyaWdnZXJzIHRoZSBldmVudFxuICAgICAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50TmFtZSAtIFRoZSBldmVudCBuYW1lIHdpdGhvdXQgdGhlIGxlYWRpbmcgXCJvblwiXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHt2b2lkfVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLnRyaWdnZXJFdmVudCA9IGZ1bmN0aW9uIChvYmosIGV2ZW50TmFtZSkge1xuICAgICAgICAgICAgICAgIHZhciBldmVudDtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHdpbmRvdy5DdXN0b21FdmVudCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICBldmVudCA9IG5ldyBDdXN0b21FdmVudChldmVudE5hbWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmICh0eXBlb2YgZG9jdW1lbnQuY3JlYXRlRXZlbnQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudChcIkhUTUxFdmVudHNcIik7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LmluaXRFdmVudChldmVudE5hbWUsIHRydWUsIHRydWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChkb2N1bWVudC5jcmVhdGVFdmVudE9iamVjdCkge1xuICAgICAgICAgICAgICAgICAgICBldmVudCA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50T2JqZWN0KCk7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LmV2ZW50VHlwZSA9IGV2ZW50TmFtZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZXZlbnQuZXZlbnROYW1lID0gZXZlbnROYW1lO1xuICAgICAgICAgICAgICAgIGlmIChvYmouZGlzcGF0Y2hFdmVudCkge1xuICAgICAgICAgICAgICAgICAgICBvYmouZGlzcGF0Y2hFdmVudChldmVudCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKG9ialtldmVudE5hbWVdKSB7XG4gICAgICAgICAgICAgICAgICAgIG9ialtldmVudE5hbWVdKys7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKG9iai5maXJlRXZlbnQgJiYgaHRtbEV2ZW50c1snb24nICsgZXZlbnROYW1lXSkge1xuICAgICAgICAgICAgICAgICAgICBvYmouZmlyZUV2ZW50KCdvbicgKyBldmVudC5ldmVudFR5cGUsIGV2ZW50KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAob2JqW2V2ZW50TmFtZV0pIHtcbiAgICAgICAgICAgICAgICAgICAgb2JqW2V2ZW50TmFtZV0oKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAob2JqWydvbicgKyBldmVudE5hbWVdKSB7XG4gICAgICAgICAgICAgICAgICAgIG9ialsnb24nICsgZXZlbnROYW1lXSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLmFkZENsYXNzID0gZnVuY3Rpb24gKGVsLCBjc3NDbGFzcykge1xuICAgICAgICAgICAgICAgIGlmICghdGhpcy5oYXNDbGFzcyhlbCwgY3NzQ2xhc3MpKSB7XG4gICAgICAgICAgICAgICAgICAgIGVsLmNsYXNzTmFtZSArPSBcIiBcIiArIGNzc0NsYXNzICsgXCIgXCI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIFp3b29zaC5wcm90b3R5cGUucmVtb3ZlQ2xhc3MgPSBmdW5jdGlvbiAoZWwsIGNzc0NsYXNzKSB7XG4gICAgICAgICAgICAgICAgdmFyIHJlID0gbmV3IFJlZ0V4cChcIiBcIiArIGNzc0NsYXNzICsgXCIgXCIsICdnJyk7XG4gICAgICAgICAgICAgICAgZWwuY2xhc3NOYW1lID0gZWwuY2xhc3NOYW1lLnJlcGxhY2UocmUsICcnKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLmhhc0NsYXNzID0gZnVuY3Rpb24gKGVsLCBjc3NDbGFzcykge1xuICAgICAgICAgICAgICAgIHZhciByZSA9IG5ldyBSZWdFeHAoXCIgXCIgKyBjc3NDbGFzcyArIFwiIFwiKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZWwuY2xhc3NOYW1lLm1hdGNoKHJlKSAhPT0gbnVsbDtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEdldCBhIGNzcyBzdHlsZSBwcm9wZXJ0eSB2YWx1ZSBicm93c2VyIGluZGVwZW5kZW50XG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWwgLSBUaGUgSFRNTEVsZW1lbnQgdG8gbG9va3VwXG4gICAgICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30ganNQcm9wZXJ0eSAtIFRoZSBjc3MgcHJvcGVydHkgbmFtZSBpbiBqYXZhc2NyaXB0IGluIGNhbWVsQ2FzZSAoZS5nLiBcIm1hcmdpbkxlZnRcIiwgbm90IFwibWFyZ2luLWxlZnRcIilcbiAgICAgICAgICAgICAqIEByZXR1cm4ge3N0cmluZ30gLSB0aGUgcHJvcGVydHkgdmFsdWVcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgWndvb3NoLnByb3RvdHlwZS5nZXRTdHlsZSA9IGZ1bmN0aW9uIChlbCwganNQcm9wZXJ0eSkge1xuICAgICAgICAgICAgICAgIHZhciBjc3NQcm9wZXJ0eSA9IGpzUHJvcGVydHkucmVwbGFjZSgvKFtBLVpdKS9nLCBcIi0kMVwiKS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2Ygd2luZG93LmdldENvbXB1dGVkU3R5bGUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKGVsKS5nZXRQcm9wZXJ0eVZhbHVlKGNzc1Byb3BlcnR5KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBlbC5jdXJyZW50U3R5bGVbanNQcm9wZXJ0eV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIFp3b29zaC5wcm90b3R5cGUuY2xlYXJUaW1lb3V0cyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy50aW1lb3V0cykge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpZHggaW4gdGhpcy50aW1lb3V0cykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMudGltZW91dHNbaWR4XSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMudGltZW91dHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy50aW1lb3V0cyA9IFtdO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKHRoaXMuaW5uZXIsICdjb2xsaWRlLmxlZnQnLCB0aGlzLmNsZWFyTGlzdGVuZXJMZWZ0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVtb3ZlRXZlbnRMaXN0ZW5lcih0aGlzLmlubmVyLCAnY29sbGlkZS5yaWdodCcsIHRoaXMuY2xlYXJMaXN0ZW5lclJpZ2h0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVtb3ZlRXZlbnRMaXN0ZW5lcih0aGlzLmlubmVyLCAnY29sbGlkZS50b3AnLCB0aGlzLmNsZWFyTGlzdGVuZXJUb3ApO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKHRoaXMuaW5uZXIsICdjb2xsaWRlLmJvdHRvbScsIHRoaXMuY2xlYXJMaXN0ZW5lckJvdHRvbSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBNb3VzZSBkb3duIGhhbmRsZXJcbiAgICAgICAgICAgICAqIFJlZ2lzdGVycyB0aGUgbW91c2Vtb3ZlIGFuZCBtb3VzZXVwIGhhbmRsZXJzIGFuZCBmaW5kcyB0aGUgbmV4dCBpbm5lciBlbGVtZW50XG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQHBhcmFtIHtNb3VzZUV2ZW50fSBlIC0gVGhlIG1vdXNlIGRvd24gZXZlbnQgb2JqZWN0XG4gICAgICAgICAgICAgKiBAcmV0dXJuIHt2b2lkfVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLm1vdXNlRG93biA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgICAgICAgICB0aGlzLmNsZWFyVGltZW91dHMoKTtcbiAgICAgICAgICAgICAgICAvKiBkcmFnIG9ubHkgaWYgdGhlIGxlZnQgbW91c2UgYnV0dG9uIHdhcyBwcmVzc2VkICovXG4gICAgICAgICAgICAgICAgaWYgKChcIndoaWNoXCIgaW4gZSAmJiBlLndoaWNoID09PSAxKSB8fCAodHlwZW9mIGUud2hpY2ggPT09ICd1bmRlZmluZWQnICYmIFwiYnV0dG9uXCIgaW4gZSAmJiBlLmJ1dHRvbiA9PT0gMSkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuZWxlbWVudEJlaGluZEN1cnNvcklzTWUoZS5jbGllbnRYLCBlLmNsaWVudFkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBwcmV2ZW50IGltYWdlIGRyYWdnaW5nIGFjdGlvbiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGltZ3MgPSB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yQWxsKCdpbWcnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgaW1ncy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGltZ3NbaV0ub25kcmFnc3RhcnQgPSBmdW5jdGlvbiAoKSB7IHJldHVybiBmYWxzZTsgfTsgLy9NU0lFXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBzZWFyY2ggdGhlIERPTSBmb3IgZXhjbHVkZSBlbGVtZW50cyAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5kcmFnT3B0aW9ucy5leGNsdWRlLmxlbmd0aCAhPT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIGRyYWcgb25seSBpZiB0aGUgbW91c2UgY2xpY2tlZCBvbiBhbiBhbGxvd2VkIGVsZW1lbnQgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgZWwgPSBkb2N1bWVudC5lbGVtZW50RnJvbVBvaW50KGUuY2xpZW50WCwgZS5jbGllbnRZKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgZXhjbHVkZUVsZW1lbnRzID0gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvckFsbCh0aGlzLm9wdGlvbnMuZHJhZ09wdGlvbnMuZXhjbHVkZS5qb2luKCcsICcpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBsb29wIHRocm91Z2ggYWxsIHBhcmVudCBlbGVtZW50cyB1bnRpbCB3ZSBlbmNvdW50ZXIgYW4gaW5uZXIgZGl2IG9yIG5vIG1vcmUgcGFyZW50cyAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdoaWxlIChlbCAmJiAhdGhpcy5oYXNDbGFzcyhlbCwgdGhpcy5jbGFzc0lubmVyKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBjb21wYXJlIGVhY2ggcGFyZW50LCBpZiBpdCBpcyBpbiB0aGUgZXhjbHVkZSBsaXN0ICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZXhjbHVkZUVsZW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBiYWlsIG91dCBpZiBhbiBlbGVtZW50IG1hdGNoZXMgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChleGNsdWRlRWxlbWVudHNbaV0gPT09IGVsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsID0gZWwucGFyZW50RWxlbWVudDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBzZWFyY2ggdGhlIERPTSBmb3Igb25seSBlbGVtZW50cywgYnV0IG9ubHkgaWYgdGhlcmUgYXJlIGVsZW1lbnRzIHNldFxuICAgICAgICAgICAgICAgICAgICAgICAgLyppZiAodGhpcy5vcHRpb25zLmRyYWdPcHRpb25zLm9ubHkubGVuZ3RoICE9PSAwKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG9ubHlFbGVtZW50cyA9IHRoaXMuY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3JBbGwodGhpcy5vcHRpb25zLmRyYWdPcHRpb25zLm9ubHkuam9pbignLCAnKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGxvb3AgdGhyb3VnaCB0aGUgbm9kZWxpc3QgYW5kIGNoZWNrIGZvciBvdXIgZWxlbWVudFxuICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgZm91bmQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBleGNsdWRlRWxlbWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAob25seUVsZW1lbnRzW2ldID09PSBlbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm91bmQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmb3VuZCA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0qL1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGRDbGFzcyhkb2N1bWVudC5ib2R5LCB0aGlzLmNsYXNzR3JhYmJpbmcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kcmFnZ2luZyA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBub3RlIHRoZSBvcmlnaW4gcG9zaXRpb25zICovXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRyYWdPcmlnaW5MZWZ0ID0gZS5jbGllbnRYO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kcmFnT3JpZ2luVG9wID0gZS5jbGllbnRZO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kcmFnT3JpZ2luU2Nyb2xsTGVmdCA9IHRoaXMuZ2V0U2Nyb2xsTGVmdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kcmFnT3JpZ2luU2Nyb2xsVG9wID0gdGhpcy5nZXRTY3JvbGxUb3AoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIGl0IGxvb2tzIHN0cmFuZ2UgaWYgc2Nyb2xsLWJlaGF2aW9yIGlzIHNldCB0byBzbW9vdGggKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGFyZW50T3JpZ2luU3R5bGUgPSB0aGlzLmlubmVyLnBhcmVudEVsZW1lbnQuc3R5bGUuY3NzVGV4dDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdGhpcy5pbm5lci5wYXJlbnRFbGVtZW50LnN0eWxlLnNldFByb3BlcnR5ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5pbm5lci5wYXJlbnRFbGVtZW50LnN0eWxlLnNldFByb3BlcnR5KCdzY3JvbGwtYmVoYXZpb3InLCAnYXV0bycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGUucHJldmVudERlZmF1bHQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlLnJldHVyblZhbHVlID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnZ4ID0gW107XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnZ5ID0gW107XG4gICAgICAgICAgICAgICAgICAgICAgICAvKiByZWdpc3RlciB0aGUgZXZlbnQgaGFuZGxlcnMgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubW91c2VNb3ZlSGFuZGxlciA9IHRoaXMubW91c2VNb3ZlLmJpbmQodGhpcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIoZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LCAnbW91c2Vtb3ZlJywgdGhpcy5tb3VzZU1vdmVIYW5kbGVyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubW91c2VVcEhhbmRsZXIgPSBmdW5jdGlvbiAoZSkgeyByZXR1cm4gX3RoaXMubW91c2VVcChlKTsgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcihkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQsICdtb3VzZXVwJywgdGhpcy5tb3VzZVVwSGFuZGxlcik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBNb3VzZSB1cCBoYW5kbGVyXG4gICAgICAgICAgICAgKiBEZXJlZ2lzdGVycyB0aGUgbW91c2Vtb3ZlIGFuZCBtb3VzZXVwIGhhbmRsZXJzXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQHBhcmFtIHtNb3VzZUV2ZW50fSBlIC0gVGhlIG1vdXNlIHVwIGV2ZW50IG9iamVjdFxuICAgICAgICAgICAgICogQHJldHVybiB7dm9pZH1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgWndvb3NoLnByb3RvdHlwZS5tb3VzZVVwID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgICAvKiBUT0RPOiByZXN0b3JlIG9yaWdpbmFsIHBvc2l0aW9uIHZhbHVlICovXG4gICAgICAgICAgICAgICAgdGhpcy5pbm5lci5zdHlsZS5wb3NpdGlvbiA9ICcnO1xuICAgICAgICAgICAgICAgIHRoaXMuaW5uZXIuc3R5bGUudG9wID0gbnVsbDtcbiAgICAgICAgICAgICAgICB0aGlzLmlubmVyLnN0eWxlLmxlZnQgPSBudWxsO1xuICAgICAgICAgICAgICAgIHRoaXMucHJlc2VudCA9ICh0aGlzLmdldFRpbWVzdGFtcCgpIC8gMTAwMCk7IC8vaW4gc2Vjb25kc1xuICAgICAgICAgICAgICAgIHZhciB4ID0gdGhpcy5kcmFnT3JpZ2luTGVmdCArIHRoaXMuZHJhZ09yaWdpblNjcm9sbExlZnQgLSBlLmNsaWVudFg7XG4gICAgICAgICAgICAgICAgdmFyIHkgPSB0aGlzLmRyYWdPcmlnaW5Ub3AgKyB0aGlzLmRyYWdPcmlnaW5TY3JvbGxUb3AgLSBlLmNsaWVudFk7XG4gICAgICAgICAgICAgICAgX2EgPSB0aGlzLmdldFJlYWxDb29yZHMoeCwgeSksIHggPSBfYVswXSwgeSA9IF9hWzFdO1xuICAgICAgICAgICAgICAgIHRoaXMucmVtb3ZlQ2xhc3MoZG9jdW1lbnQuYm9keSwgdGhpcy5jbGFzc0dyYWJiaW5nKTtcbiAgICAgICAgICAgICAgICB0aGlzLmlubmVyLnBhcmVudEVsZW1lbnQuc3R5bGUuY3NzVGV4dCA9IHRoaXMucGFyZW50T3JpZ2luU3R5bGU7XG4gICAgICAgICAgICAgICAgdGhpcy5kcmFnZ2luZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIHRoaXMucmVtb3ZlRXZlbnRMaXN0ZW5lcihkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQsICdtb3VzZW1vdmUnLCB0aGlzLm1vdXNlTW92ZUhhbmRsZXIpO1xuICAgICAgICAgICAgICAgIHRoaXMucmVtb3ZlRXZlbnRMaXN0ZW5lcihkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQsICdtb3VzZXVwJywgdGhpcy5tb3VzZVVwSGFuZGxlcik7XG4gICAgICAgICAgICAgICAgaWYgKHkgIT09IHRoaXMuZ2V0U2Nyb2xsVG9wKCkgfHwgeCAhPT0gdGhpcy5nZXRTY3JvbGxMZWZ0KCkpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHQgPSB0aGlzLnByZXNlbnQgLSAodGhpcy5wYXN0ID8gdGhpcy5wYXN0IDogdGhpcy5wcmVzZW50KTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHQgPiAwLjA1KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBqdXN0IGFsaWduIHRvIHRoZSBncmlkIGlmIHRoZSBtb3VzZSBsZWZ0IHVubW92ZWQgZm9yIG1vcmUgdGhhbiAwLjA1IHNlY29uZHMgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsVG8oeCwgeSwgdGhpcy5vcHRpb25zLmRyYWdPcHRpb25zLmZhZGUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMuZHJhZ09wdGlvbnMuZmFkZSAmJiB0eXBlb2YgdGhpcy52eCAhPT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIHRoaXMudnkgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciB2eCwgdnk7XG4gICAgICAgICAgICAgICAgICAgIF9iID0gdGhpcy5jYWxjQXZlcmFnZVZlbG9jaXR5KDAuMSksIHZ4ID0gX2JbMF0sIHZ5ID0gX2JbMV07XG4gICAgICAgICAgICAgICAgICAgIC8qIHYgc2hvdWxkIG5vdCBleGNlZWQgdk1heCBvciAtdk1heCAtPiB3b3VsZCBiZSB0b28gZmFzdCBhbmQgc2hvdWxkIGV4Y2VlZCB2TWluIG9yIC12TWluICovXG4gICAgICAgICAgICAgICAgICAgIHZhciB2TWF4ID0gdGhpcy5vcHRpb25zLmRyYWdPcHRpb25zLm1heFNwZWVkO1xuICAgICAgICAgICAgICAgICAgICB2YXIgdk1pbiA9IHRoaXMub3B0aW9ucy5kcmFnT3B0aW9ucy5taW5TcGVlZDtcbiAgICAgICAgICAgICAgICAgICAgLyogaWYgdGhlIHNwZWVkIGlzIG5vdCB3aXRob3V0IGJvdW5kIGZvciBmYWRlLCBqdXN0IGRvIGEgcmVndWxhciBzY3JvbGwgd2hlbiB0aGVyZSBpcyBhIGdyaWQqL1xuICAgICAgICAgICAgICAgICAgICBpZiAodnkgPCB2TWluICYmIHZ5ID4gLXZNaW4gJiYgdnggPCB2TWluICYmIHZ4ID4gLXZNaW4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMuZ3JpZFkgPiAxIHx8IHRoaXMub3B0aW9ucy5ncmlkWCA+IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNjcm9sbFRvKHgsIHkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHZ4ID0gKHZ4IDw9IHZNYXggJiYgdnggPj0gLXZNYXgpID8gdnggOiAodnggPiAwID8gdk1heCA6IC12TWF4KTtcbiAgICAgICAgICAgICAgICAgICAgdnkgPSAodnkgPD0gdk1heCAmJiB2eSA+PSAtdk1heCkgPyB2eSA6ICh2eSA+IDAgPyB2TWF4IDogLXZNYXgpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgYXggPSAodnggPiAwID8gLTEgOiAxKSAqIHRoaXMub3B0aW9ucy5kcmFnT3B0aW9ucy5icmFrZVNwZWVkO1xuICAgICAgICAgICAgICAgICAgICB2YXIgYXkgPSAodnkgPiAwID8gLTEgOiAxKSAqIHRoaXMub3B0aW9ucy5kcmFnT3B0aW9ucy5icmFrZVNwZWVkO1xuICAgICAgICAgICAgICAgICAgICB4ID0gKCgwIC0gTWF0aC5wb3codngsIDIpKSAvICgyICogYXgpKSArIHRoaXMuZ2V0U2Nyb2xsTGVmdCgpO1xuICAgICAgICAgICAgICAgICAgICB5ID0gKCgwIC0gTWF0aC5wb3codnksIDIpKSAvICgyICogYXkpKSArIHRoaXMuZ2V0U2Nyb2xsVG9wKCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsVG8oeCwgeSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvKiBpbiBhbGwgb3RoZXIgY2FzZXMsIGRvIGEgcmVndWxhciBzY3JvbGwgKi9cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zY3JvbGxUbyh4LCB5LCB0aGlzLm9wdGlvbnMuZHJhZ09wdGlvbnMuZmFkZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciBfYSwgX2I7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgWndvb3NoLnByb3RvdHlwZS5jYWxjQXZlcmFnZVZlbG9jaXR5ID0gZnVuY3Rpb24gKHRpbWVTcGFuKSB7XG4gICAgICAgICAgICAgICAgdmFyIHByZXNlbnQgPSAodGhpcy5nZXRUaW1lc3RhbXAoKSAvIDEwMDApO1xuICAgICAgICAgICAgICAgIHZhciBkZWx0YVQsIGRlbHRhU3gsIGRlbHRhU3ksIGxhc3REZWx0YVN4LCBsYXN0RGVsdGFTeTtcbiAgICAgICAgICAgICAgICBkZWx0YVQgPSBkZWx0YVN4ID0gZGVsdGFTeSA9IGxhc3REZWx0YVN4ID0gbGFzdERlbHRhU3kgPSAwO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgaW4gdGhpcy52eSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAocGFyc2VGbG9hdChpKSA+IChwcmVzZW50IC0gdGltZVNwYW4pXG4gICAgICAgICAgICAgICAgICAgICAgICAmJiB0eXBlb2YgbGFzdFQgIT09ICd1bmRlZmluZWQnXG4gICAgICAgICAgICAgICAgICAgICAgICAmJiB0eXBlb2YgbGFzdFN4ICE9PSAndW5kZWZpbmVkJ1xuICAgICAgICAgICAgICAgICAgICAgICAgJiYgdHlwZW9mIGxhc3RTeSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlbHRhVCArPSBwYXJzZUZsb2F0KGkpIC0gbGFzdFQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBsYXN0RGVsdGFTeCA9IHRoaXMudnhbaV0gLSBsYXN0U3g7XG4gICAgICAgICAgICAgICAgICAgICAgICBsYXN0RGVsdGFTeSA9IHRoaXMudnlbaV0gLSBsYXN0U3k7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWx0YVN4ICs9IE1hdGguYWJzKGxhc3REZWx0YVN4KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlbHRhU3kgKz0gTWF0aC5hYnMobGFzdERlbHRhU3kpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHZhciBsYXN0VCA9IHBhcnNlRmxvYXQoaSk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBsYXN0U3ggPSB0aGlzLnZ4W2ldO1xuICAgICAgICAgICAgICAgICAgICB2YXIgbGFzdFN5ID0gdGhpcy52eVtpXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIHZ4ID0gZGVsdGFUID09PSAwID8gMCA6IGxhc3REZWx0YVN4ID4gMCA/IGRlbHRhU3ggLyBkZWx0YVQgOiBkZWx0YVN4IC8gLWRlbHRhVDtcbiAgICAgICAgICAgICAgICB2YXIgdnkgPSBkZWx0YVQgPT09IDAgPyAwIDogbGFzdERlbHRhU3kgPiAwID8gZGVsdGFTeSAvIGRlbHRhVCA6IGRlbHRhU3kgLyAtZGVsdGFUO1xuICAgICAgICAgICAgICAgIHJldHVybiBbdngsIHZ5XTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIENhbGN1bGF0ZXMgdGhlIHJvdW5kZWQgYW5kIHNjYWxlZCBjb29yZGluYXRlcy5cbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0geCAtIHRoZSB4LWNvb3JkaW5hdGVcbiAgICAgICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSB5IC0gdGhlIHktY29vcmRpbmF0ZVxuICAgICAgICAgICAgICogQHJldHVybiB7YXJyYXl9IFt4LCB5XSAtIHRoZSBmaW5hbCBjb29yZGluYXRlc1xuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLmdldFJlYWxDb29yZHMgPSBmdW5jdGlvbiAoeCwgeSkge1xuICAgICAgICAgICAgICAgIC8vc3RpY2sgdGhlIGVsZW1lbnQgdG8gdGhlIGdyaWQsIGlmIGdyaWQgZXF1YWxzIDEgdGhlIHZhbHVlIGRvZXMgbm90IGNoYW5nZVxuICAgICAgICAgICAgICAgIHggPSBNYXRoLnJvdW5kKHggLyAodGhpcy5vcHRpb25zLmdyaWRYICogdGhpcy5nZXRTY2FsZSgpKSkgKiAodGhpcy5vcHRpb25zLmdyaWRYICogdGhpcy5nZXRTY2FsZSgpKTtcbiAgICAgICAgICAgICAgICB5ID0gTWF0aC5yb3VuZCh5IC8gKHRoaXMub3B0aW9ucy5ncmlkWSAqIHRoaXMuZ2V0U2NhbGUoKSkpICogKHRoaXMub3B0aW9ucy5ncmlkWSAqIHRoaXMuZ2V0U2NhbGUoKSk7XG4gICAgICAgICAgICAgICAgdmFyIHNjcm9sbE1heExlZnQgPSAodGhpcy5zY3JvbGxFbGVtZW50LnNjcm9sbFdpZHRoIC0gdGhpcy5zY3JvbGxFbGVtZW50LmNsaWVudFdpZHRoKTtcbiAgICAgICAgICAgICAgICB2YXIgc2Nyb2xsTWF4VG9wID0gKHRoaXMuc2Nyb2xsRWxlbWVudC5zY3JvbGxIZWlnaHQgLSB0aGlzLnNjcm9sbEVsZW1lbnQuY2xpZW50SGVpZ2h0KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgICAgICAgICAoeCA+IHNjcm9sbE1heExlZnQpID8gc2Nyb2xsTWF4TGVmdCA6IHgsXG4gICAgICAgICAgICAgICAgICAgICh5ID4gc2Nyb2xsTWF4VG9wKSA/IHNjcm9sbE1heFRvcCA6IHlcbiAgICAgICAgICAgICAgICBdO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIFp3b29zaC5wcm90b3R5cGUudGltZWRTY3JvbGwgPSBmdW5jdGlvbiAoeCwgeSwgdCkge1xuICAgICAgICAgICAgICAgIHZhciBtZSA9IHRoaXM7XG4gICAgICAgICAgICAgICAgdGhpcy50aW1lb3V0cy5wdXNoKHNldFRpbWVvdXQoKGZ1bmN0aW9uICh4LCB5LCBtZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbWUuc2V0U2Nyb2xsVG9wKHkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbWUuc2V0U2Nyb2xsTGVmdCh4KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lLm9yaWdpblNjcm9sbExlZnQgPSB4O1xuICAgICAgICAgICAgICAgICAgICAgICAgbWUub3JpZ2luU2Nyb2xsVG9wID0geTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9KHgsIHksIG1lKSksIHQpKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIENhbGN1bGF0ZXMgZWFjaCBzdGVwIG9mIGEgc2Nyb2xsIGZhZGVvdXQgYW5pbWF0aW9uIGJhc2VkIG9uIHRoZSBpbml0aWFsIHZlbG9jaXR5LlxuICAgICAgICAgICAgICogU3RvcHMgYW55IGN1cnJlbnRseSBydW5uaW5nIHNjcm9sbCBhbmltYXRpb24uXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IHZ4IC0gdGhlIGluaXRpYWwgdmVsb2NpdHkgaW4gaG9yaXpvbnRhbCBkaXJlY3Rpb25cbiAgICAgICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSB2eSAtIHRoZSBpbml0aWFsIHZlbG9jaXR5IGluIHZlcnRpY2FsIGRpcmVjdGlvblxuICAgICAgICAgICAgICogQHJldHVybiB7bnVtYmVyfSAtIHRoZSBmaW5hbCB5LWNvb3JkaW5hdGVcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgWndvb3NoLnByb3RvdHlwZS5mYWRlT3V0QnlWZWxvY2l0eSA9IGZ1bmN0aW9uICh2eCwgdnkpIHtcbiAgICAgICAgICAgICAgICAvKiBUT0RPOiBjYWxjIHYgaGVyZSBhbmQgd2l0aCBtb3JlIGluZm8sIG1vcmUgcHJlY2lzZWx5ICovXG4gICAgICAgICAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgICAgICAgICAvKiBjYWxjdWxhdGUgdGhlIGJyYWtlIGFjY2VsZXJhdGlvbiBpbiBib3RoIGRpcmVjdGlvbnMgc2VwYXJhdGVseSAqL1xuICAgICAgICAgICAgICAgIHZhciBheSA9ICh2eSA+IDAgPyAtMSA6IDEpICogdGhpcy5vcHRpb25zLmRyYWdPcHRpb25zLmJyYWtlU3BlZWQ7XG4gICAgICAgICAgICAgICAgdmFyIGF4ID0gKHZ4ID4gMCA/IC0xIDogMSkgKiB0aGlzLm9wdGlvbnMuZHJhZ09wdGlvbnMuYnJha2VTcGVlZDtcbiAgICAgICAgICAgICAgICAvKiBmaW5kIHRoZSBkaXJlY3Rpb24gdGhhdCBuZWVkcyBsb25nZXIgdG8gc3RvcCwgYW5kIHJlY2FsY3VsYXRlIHRoZSBhY2NlbGVyYXRpb24gKi9cbiAgICAgICAgICAgICAgICB2YXIgdG1heCA9IE1hdGgubWF4KCgwIC0gdnkpIC8gYXksICgwIC0gdngpIC8gYXgpO1xuICAgICAgICAgICAgICAgIGF4ID0gKDAgLSB2eCkgLyB0bWF4O1xuICAgICAgICAgICAgICAgIGF5ID0gKDAgLSB2eSkgLyB0bWF4O1xuICAgICAgICAgICAgICAgIHZhciBmcHMgPSB0aGlzLm9wdGlvbnMuZHJhZ09wdGlvbnMuZnBzO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgKCh0bWF4ICogZnBzKSArICgwIC8gZnBzKSk7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgdCA9ICgoaSArIDEpIC8gZnBzKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHN5ID0gdGhpcy5nZXRTY3JvbGxUb3AoKSArICh2eSAqIHQpICsgKDAuNSAqIGF5ICogdCAqIHQpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgc3ggPSB0aGlzLmdldFNjcm9sbExlZnQoKSArICh2eCAqIHQpICsgKDAuNSAqIGF4ICogdCAqIHQpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnRpbWVkU2Nyb2xsKHN4LCBzeSwgKGkgKyAxKSAqICgxMDAwIC8gZnBzKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChpID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAvKiByb3VuZCB0aGUgbGFzdCBzdGVwIGJhc2VkIG9uIHRoZSBkaXJlY3Rpb24gb2YgdGhlIGZhZGUgKi9cbiAgICAgICAgICAgICAgICAgICAgc3ggPSB2eCA+IDAgPyBNYXRoLmNlaWwoc3gpIDogTWF0aC5mbG9vcihzeCk7XG4gICAgICAgICAgICAgICAgICAgIHN5ID0gdnkgPiAwID8gTWF0aC5jZWlsKHN5KSA6IE1hdGguZmxvb3Ioc3kpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnRpbWVkU2Nyb2xsKHN4LCBzeSwgKGkgKyAyKSAqICgxMDAwIC8gZnBzKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8qIHN0b3AgdGhlIGFuaW1hdGlvbiB3aGVuIGNvbGxpZGluZyB3aXRoIHRoZSBib3JkZXJzICovXG4gICAgICAgICAgICAgICAgdGhpcy5jbGVhckxpc3RlbmVyTGVmdCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIF90aGlzLmNsZWFyVGltZW91dHMoKTsgfTtcbiAgICAgICAgICAgICAgICB0aGlzLmNsZWFyTGlzdGVuZXJSaWdodCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIF90aGlzLmNsZWFyVGltZW91dHMoKTsgfTtcbiAgICAgICAgICAgICAgICB0aGlzLmNsZWFyTGlzdGVuZXJUb3AgPSBmdW5jdGlvbiAoKSB7IHJldHVybiBfdGhpcy5jbGVhclRpbWVvdXRzKCk7IH07XG4gICAgICAgICAgICAgICAgdGhpcy5jbGVhckxpc3RlbmVyQm90dG9tID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gX3RoaXMuY2xlYXJUaW1lb3V0cygpOyB9O1xuICAgICAgICAgICAgICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcih0aGlzLmlubmVyLCAnY29sbGlkZS5sZWZ0JywgdGhpcy5jbGVhckxpc3RlbmVyTGVmdCk7XG4gICAgICAgICAgICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKHRoaXMuaW5uZXIsICdjb2xsaWRlLnJpZ2h0JywgdGhpcy5jbGVhckxpc3RlbmVyUmlnaHQpO1xuICAgICAgICAgICAgICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcih0aGlzLmlubmVyLCAnY29sbGlkZS50b3AnLCB0aGlzLmNsZWFyTGlzdGVuZXJUb3ApO1xuICAgICAgICAgICAgICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcih0aGlzLmlubmVyLCAnY29sbGlkZS5ib3R0b20nLCB0aGlzLmNsZWFyTGlzdGVuZXJCb3R0b20pO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIFp3b29zaC5wcm90b3R5cGUuZmFkZU91dEJ5Q29vcmRzID0gZnVuY3Rpb24gKHgsIHkpIHtcbiAgICAgICAgICAgICAgICBfYSA9IHRoaXMuZ2V0UmVhbENvb3Jkcyh4LCB5KSwgeCA9IF9hWzBdLCB5ID0gX2FbMV07XG4gICAgICAgICAgICAgICAgdmFyIGEgPSB0aGlzLm9wdGlvbnMuZHJhZ09wdGlvbnMuYnJha2VTcGVlZCAqIC0xO1xuICAgICAgICAgICAgICAgIHZhciB2eSA9IDAgLSAoMiAqIGEgKiAoeSAtIHRoaXMuZ2V0U2Nyb2xsVG9wKCkpKTtcbiAgICAgICAgICAgICAgICB2YXIgdnggPSAwIC0gKDIgKiBhICogKHggLSB0aGlzLmdldFNjcm9sbExlZnQoKSkpO1xuICAgICAgICAgICAgICAgIHZ5ID0gKHZ5ID4gMCA/IDEgOiAtMSkgKiBNYXRoLnNxcnQoTWF0aC5hYnModnkpKTtcbiAgICAgICAgICAgICAgICB2eCA9ICh2eCA+IDAgPyAxIDogLTEpICogTWF0aC5zcXJ0KE1hdGguYWJzKHZ4KSk7XG4gICAgICAgICAgICAgICAgdmFyIHN4ID0geCAtIHRoaXMuZ2V0U2Nyb2xsTGVmdCgpO1xuICAgICAgICAgICAgICAgIHZhciBzeSA9IHkgLSB0aGlzLmdldFNjcm9sbFRvcCgpO1xuICAgICAgICAgICAgICAgIGlmIChNYXRoLmFicyhzeSkgPiBNYXRoLmFicyhzeCkpIHtcbiAgICAgICAgICAgICAgICAgICAgdnggPSAodnggPiAwID8gMSA6IC0xKSAqIE1hdGguYWJzKChzeCAvIHN5KSAqIHZ5KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHZ5ID0gKHZ5ID4gMCA/IDEgOiAtMSkgKiBNYXRoLmFicygoc3kgLyBzeCkgKiB2eCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuY2xlYXJUaW1lb3V0cygpO1xuICAgICAgICAgICAgICAgIHRoaXMuZmFkZU91dEJ5VmVsb2NpdHkodngsIHZ5KTtcbiAgICAgICAgICAgICAgICB2YXIgX2E7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBNb3VzZSBtb3ZlIGhhbmRsZXJcbiAgICAgICAgICAgICAqIENhbGN1Y2F0ZXMgdGhlIHggYW5kIHkgZGVsdGFzIGFuZCBzY3JvbGxzXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQHBhcmFtIHtNb3VzZUV2ZW50fSBlIC0gVGhlIG1vdXNlIG1vdmUgZXZlbnQgb2JqZWN0XG4gICAgICAgICAgICAgKiBAcmV0dXJuIHt2b2lkfVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLm1vdXNlTW92ZSA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wcmVzZW50ID0gKHRoaXMuZ2V0VGltZXN0YW1wKCkgLyAxMDAwKTsgLy9pbiBzZWNvbmRzXG4gICAgICAgICAgICAgICAgdGhpcy5jbGVhclRleHRTZWxlY3Rpb24oKTtcbiAgICAgICAgICAgICAgICAvKiBpZiB0aGUgbW91c2UgbGVmdCB0aGUgd2luZG93IGFuZCB0aGUgYnV0dG9uIGlzIG5vdCBwcmVzc2VkIGFueW1vcmUsIGFib3J0IG1vdmluZyAqL1xuICAgICAgICAgICAgICAgIC8vaWYgKChlLmJ1dHRvbnMgPT09IDAgJiYgZS5idXR0b24gPT09IDApIHx8ICh0eXBlb2YgZS5idXR0b25zID09PSAndW5kZWZpbmVkJyAmJiBlLmJ1dHRvbiA9PT0gMCkpIHtcbiAgICAgICAgICAgICAgICBpZiAoKFwid2hpY2hcIiBpbiBlICYmIGUud2hpY2ggPT09IDApIHx8ICh0eXBlb2YgZS53aGljaCA9PT0gJ3VuZGVmaW5lZCcgJiYgXCJidXR0b25cIiBpbiBlICYmIGUuYnV0dG9uID09PSAwKSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm1vdXNlVXAoZSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIHggPSB0aGlzLmRyYWdPcmlnaW5MZWZ0ICsgdGhpcy5kcmFnT3JpZ2luU2Nyb2xsTGVmdCAtIGUuY2xpZW50WDtcbiAgICAgICAgICAgICAgICB2YXIgeSA9IHRoaXMuZHJhZ09yaWdpblRvcCArIHRoaXMuZHJhZ09yaWdpblNjcm9sbFRvcCAtIGUuY2xpZW50WTtcbiAgICAgICAgICAgICAgICAvKiBpZiBlbGFzdGljIGVkZ2VzIGFyZSBzZXQsIHNob3cgdGhlIGVsZW1lbnQgcHNldWRvIHNjcm9sbGVkIGJ5IHJlbGF0aXZlIHBvc2l0aW9uICovXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMudHJpZ2dlcmVkLmNvbGxpZGVCb3R0b20gJiYgdGhpcy5vcHRpb25zLmVsYXN0aWNFZGdlcy5ib3R0b20gPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pbm5lci5zdHlsZS5wb3NpdGlvbiA9ICdyZWxhdGl2ZSc7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaW5uZXIuc3R5bGUudG9wID0gKCh0aGlzLmdldFNjcm9sbFRvcCgpIC0geSkgLyAyKSArICdweCc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh0aGlzLnRyaWdnZXJlZC5jb2xsaWRlVG9wICYmIHRoaXMub3B0aW9ucy5lbGFzdGljRWRnZXMudG9wID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaW5uZXIuc3R5bGUucG9zaXRpb24gPSAncmVsYXRpdmUnO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmlubmVyLnN0eWxlLnRvcCA9ICh5IC8gLTIpICsgJ3B4JztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMudHJpZ2dlcmVkLmNvbGxpZGVMZWZ0ICYmIHRoaXMub3B0aW9ucy5lbGFzdGljRWRnZXMubGVmdCA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmlubmVyLnN0eWxlLnBvc2l0aW9uID0gJ3JlbGF0aXZlJztcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pbm5lci5zdHlsZS5sZWZ0ID0gKHggLyAtMikgKyAncHgnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAodGhpcy50cmlnZ2VyZWQuY29sbGlkZVJpZ2h0ICYmIHRoaXMub3B0aW9ucy5lbGFzdGljRWRnZXMucmlnaHQgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pbm5lci5zdHlsZS5wb3NpdGlvbiA9ICdyZWxhdGl2ZSc7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaW5uZXIuc3R5bGUubGVmdCA9ICgodGhpcy5nZXRTY3JvbGxMZWZ0KCkgLSB4KSAvIDIpICsgJ3B4JztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy52eFt0aGlzLnByZXNlbnRdID0geDtcbiAgICAgICAgICAgICAgICB0aGlzLnZ5W3RoaXMucHJlc2VudF0gPSB5O1xuICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsVG8oeCwgeSwgZmFsc2UpO1xuICAgICAgICAgICAgICAgIHRoaXMucGFzdCA9IHRoaXMucHJlc2VudDtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIHNjcm9sbEJ5IGhlbHBlciBtZXRob2QgdG8gc2Nyb2xsIGJ5IGFuIGFtb3VudCBvZiBwaXhlbHMgaW4geC0gYW5kIHktZGlyZWN0aW9uXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IHggLSBhbW91bnQgb2YgcGl4ZWxzIHRvIHNjcm9sbCBpbiB4LWRpcmVjdGlvblxuICAgICAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IHkgLSBhbW91bnQgb2YgcGl4ZWxzIHRvIHNjcm9sbCBpbiB5LWRpcmVjdGlvblxuICAgICAgICAgICAgICogQHBhcmFtIHtib29sZWFufSBzbW9vdGggLSB3aGV0aGVyIHRvIHNjcm9sbCBzbW9vdGggb3IgaW5zdGFudFxuICAgICAgICAgICAgICogQHJldHVybiB7dm9pZH1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgWndvb3NoLnByb3RvdHlwZS5zY3JvbGxCeSA9IGZ1bmN0aW9uICh4LCB5LCBzbW9vdGgpIHtcbiAgICAgICAgICAgICAgICBpZiAoc21vb3RoID09PSB2b2lkIDApIHsgc21vb3RoID0gdHJ1ZTsgfVxuICAgICAgICAgICAgICAgIHZhciBhYnNvbHV0ZVggPSB0aGlzLmdldFNjcm9sbExlZnQoKSArIHg7XG4gICAgICAgICAgICAgICAgdmFyIGFic29sdXRlWSA9IHRoaXMuZ2V0U2Nyb2xsVG9wKCkgKyB5O1xuICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsVG8oYWJzb2x1dGVYLCBhYnNvbHV0ZVksIHNtb290aCk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBzY3JvbGxCeSBoZWxwZXIgbWV0aG9kIHRvIHNjcm9sbCB0byBhIHgtIGFuZCB5LWNvb3JkaW5hdGVcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0geCAtIHgtY29vcmRpbmF0ZSB0byBzY3JvbGwgdG9cbiAgICAgICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSB5IC0geS1jb29yZGluYXRlIHRvIHNjcm9sbCB0b1xuICAgICAgICAgICAgICogQHBhcmFtIHtib29sZWFufSBzbW9vdGggLSB3aGV0aGVyIHRvIHNjcm9sbCBzbW9vdGggb3IgaW5zdGFudFxuICAgICAgICAgICAgICogQHJldHVybiB7dm9pZH1cbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAVE9ETzogQ1NTMyB0cmFuc2l0aW9ucyBpZiBhdmFpbGFibGUgaW4gYnJvd3NlclxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLnNjcm9sbFRvID0gZnVuY3Rpb24gKHgsIHksIHNtb290aCkge1xuICAgICAgICAgICAgICAgIGlmIChzbW9vdGggPT09IHZvaWQgMCkgeyBzbW9vdGggPSB0cnVlOyB9XG4gICAgICAgICAgICAgICAgdGhpcy5jbGVhclRpbWVvdXRzKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5zY3JvbGxNYXhMZWZ0ID0gKHRoaXMuc2Nyb2xsRWxlbWVudC5zY3JvbGxXaWR0aCAtIHRoaXMuc2Nyb2xsRWxlbWVudC5jbGllbnRXaWR0aCk7XG4gICAgICAgICAgICAgICAgdGhpcy5zY3JvbGxNYXhUb3AgPSAodGhpcy5zY3JvbGxFbGVtZW50LnNjcm9sbEhlaWdodCAtIHRoaXMuc2Nyb2xsRWxlbWVudC5jbGllbnRIZWlnaHQpO1xuICAgICAgICAgICAgICAgIC8qIG5vIG5lZ2F0aXZlIHZhbHVlcyBvciB2YWx1ZXMgZ3JlYXRlciB0aGFuIHRoZSBtYXhpbXVtICovXG4gICAgICAgICAgICAgICAgdmFyIHggPSAoeCA+IHRoaXMuc2Nyb2xsTWF4TGVmdCkgPyB0aGlzLnNjcm9sbE1heExlZnQgOiAoeCA8IDApID8gMCA6IHg7XG4gICAgICAgICAgICAgICAgdmFyIHkgPSAoeSA+IHRoaXMuc2Nyb2xsTWF4VG9wKSA/IHRoaXMuc2Nyb2xsTWF4VG9wIDogKHkgPCAwKSA/IDAgOiB5O1xuICAgICAgICAgICAgICAgIC8qIHJlbWVtYmVyIHRoZSBvbGQgdmFsdWVzICovXG4gICAgICAgICAgICAgICAgdGhpcy5vcmlnaW5TY3JvbGxMZWZ0ID0gdGhpcy5nZXRTY3JvbGxMZWZ0KCk7XG4gICAgICAgICAgICAgICAgdGhpcy5vcmlnaW5TY3JvbGxUb3AgPSB0aGlzLmdldFNjcm9sbFRvcCgpO1xuICAgICAgICAgICAgICAgIGlmICh4ICE9PSB0aGlzLmdldFNjcm9sbExlZnQoKSB8fCB5ICE9PSB0aGlzLmdldFNjcm9sbFRvcCgpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMud2hlZWxPcHRpb25zLnNtb290aCAhPT0gdHJ1ZSB8fCBzbW9vdGggPT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNldFNjcm9sbFRvcCh5KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0U2Nyb2xsTGVmdCh4KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZmFkZU91dEJ5Q29vcmRzKHgsIHkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogUmVnaXN0ZXIgY3VzdG9tIGV2ZW50IGNhbGxiYWNrc1xuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBldmVudCAtIFRoZSBldmVudCBuYW1lXG4gICAgICAgICAgICAgKiBAcGFyYW0geyhlOiBFdmVudCkgPT4gYW55fSBjYWxsYmFjayAtIEEgY2FsbGJhY2sgZnVuY3Rpb24gdG8gZXhlY3V0ZSB3aGVuIHRoZSBldmVudCByYWlzZXNcbiAgICAgICAgICAgICAqIEByZXR1cm4ge1p3b29zaH0gLSBUaGUgWndvb3NoIG9iamVjdCBpbnN0YW5jZVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLm9uID0gZnVuY3Rpb24gKGV2ZW50LCBjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcih0aGlzLmlubmVyLCBldmVudCwgY2FsbGJhY2spO1xuICAgICAgICAgICAgICAgIC8qIHNldCB0aGUgZXZlbnQgdW50cmlnZ2VyZWQgYW5kIGNhbGwgdGhlIGZ1bmN0aW9uLCB0byByZXRyaWdnZXIgbWV0IGV2ZW50cyAqL1xuICAgICAgICAgICAgICAgIHZhciBmID0gZXZlbnQucmVwbGFjZSgvXFwuKFthLXpdKS8sIFN0cmluZy5jYWxsLmJpbmQoZXZlbnQudG9VcHBlckNhc2UpKS5yZXBsYWNlKC9cXC4vLCAnJyk7XG4gICAgICAgICAgICAgICAgdGhpcy50cmlnZ2VyZWRbZl0gPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB0aGlzLm9uU2Nyb2xsKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBEZXJlZ2lzdGVyIGN1c3RvbSBldmVudCBjYWxsYmFja3NcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnQgLSBUaGUgZXZlbnQgbmFtZVxuICAgICAgICAgICAgICogQHBhcmFtIHsoZTogRXZlbnQpID0+IGFueX0gY2FsbGJhY2sgLSBBIGNhbGxiYWNrIGZ1bmN0aW9uIHRvIGV4ZWN1dGUgd2hlbiB0aGUgZXZlbnQgcmFpc2VzXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHtad29vc2h9IC0gVGhlIFp3b29zaCBvYmplY3QgaW5zdGFuY2VcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgWndvb3NoLnByb3RvdHlwZS5vZmYgPSBmdW5jdGlvbiAoZXZlbnQsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKHRoaXMuaW5uZXIsIGV2ZW50LCBjYWxsYmFjayk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBSZXZlcnQgYWxsIERPTSBtYW5pcHVsYXRpb25zIGFuZCBkZXJlZ2lzdGVyIGFsbCBldmVudCBoYW5kbGVyc1xuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEByZXR1cm4ge3ZvaWR9XG4gICAgICAgICAgICAgKiBAVE9ETzogcmVtb3Zpbmcgd2hlZWxab29tSGFuZGxlciBkb2VzIG5vdCB3b3JrXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIFp3b29zaC5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgeCA9IHRoaXMuZ2V0U2Nyb2xsTGVmdCgpO1xuICAgICAgICAgICAgICAgIHZhciB5ID0gdGhpcy5nZXRTY3JvbGxUb3AoKTtcbiAgICAgICAgICAgICAgICAvKiByZW1vdmUgdGhlIG91dGVyIGFuZCBncmFiIENTUyBjbGFzc2VzICovXG4gICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVDbGFzcyh0aGlzLmNvbnRhaW5lciwgdGhpcy5jbGFzc091dGVyKTtcbiAgICAgICAgICAgICAgICB0aGlzLnJlbW92ZUNsYXNzKHRoaXMuaW5uZXIsIHRoaXMuY2xhc3NHcmFiKTtcbiAgICAgICAgICAgICAgICB0aGlzLnJlbW92ZUNsYXNzKHRoaXMuY29udGFpbmVyLCB0aGlzLmNsYXNzTm9HcmFiKTtcbiAgICAgICAgICAgICAgICAvKiBtb3ZlIGFsbCBjaGlsZE5vZGVzIGJhY2sgdG8gdGhlIG9sZCBvdXRlciBlbGVtZW50IGFuZCByZW1vdmUgdGhlIGlubmVyIGVsZW1lbnQgKi9cbiAgICAgICAgICAgICAgICB3aGlsZSAodGhpcy5pbm5lci5jaGlsZE5vZGVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jb250YWluZXIuYXBwZW5kQ2hpbGQodGhpcy5pbm5lci5jaGlsZE5vZGVzWzBdKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5zY2FsZUVsZW1lbnQucmVtb3ZlQ2hpbGQodGhpcy5pbm5lcik7XG4gICAgICAgICAgICAgICAgdGhpcy5jb250YWluZXIucmVtb3ZlQ2hpbGQodGhpcy5zY2FsZUVsZW1lbnQpO1xuICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsVG8oeCwgeSwgZmFsc2UpO1xuICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsRWxlbWVudC5vbm1vdXNld2hlZWwgPSBudWxsO1xuICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsRWxlbWVudC5vbnNjcm9sbCA9IG51bGw7XG4gICAgICAgICAgICAgICAgd2luZG93Lm9ucmVzaXplID0gbnVsbDtcbiAgICAgICAgICAgICAgICAvKiByZW1vdmUgYWxsIGN1c3RvbSBldmVudGxpc3RlbmVycyBhdHRhY2hlZCB2aWEgdGhpcy5hZGRFdmVudExpc3RlbmVyKCkgKi9cbiAgICAgICAgICAgICAgICBmb3IgKHZhciBldmVudCBpbiB0aGlzLmN1c3RvbUV2ZW50cykge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBjIGluIHRoaXMuY3VzdG9tRXZlbnRzW2V2ZW50XSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKHRoaXMuaW5uZXIsIGV2ZW50LCB0aGlzLmN1c3RvbUV2ZW50c1tldmVudF1bY11bMF0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICByZXR1cm4gWndvb3NoO1xuICAgICAgICB9KCkpO1xuICAgICAgICAvKiByZXR1cm4gYW4gaW5zdGFuY2Ugb2YgdGhlIGNsYXNzICovXG4gICAgICAgIHJldHVybiBuZXcgWndvb3NoKGNvbnRhaW5lciwgb3B0aW9ucyk7XG4gICAgfVxuICAgIHJldHVybiB6d29vc2g7XG59KTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXp3b29zaC5qcy5tYXAiXX0=
