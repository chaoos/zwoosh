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
                var aArgs = Array.prototype.slice.call(arguments, 1), fToBind = this, FNOP = function () { }, fBound = function () {
                    return fToBind.apply(this instanceof FNOP ? this : oThis, aArgs.concat(Array.prototype.slice.call(arguments)));
                };
                if (this.prototype) {
                    // Function.prototype doesn't have a prototype property
                    FNOP.prototype = this.prototype;
                }
                fBound.prototype = new FNOP();
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
                if (this === null) {
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
                        /* fade: brake acceleration in pixels per second per second (p/s^2) */
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
                this.options = this.merge(options, defaultOptions);
                this.init();
            }
            /**
             * Merge the default option object with the provided one
             *
             * @param {Options} options - the given options
             * @param {Options} defaultOptions - the default options
             * @return {Options} - the merged options object
             */
            Zwoosh.prototype.merge = function (options, defaultOptions) {
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
                    if (this.options.gridX !== 1) {
                        bgi.push('linear-gradient(to right, grey 1px, transparent 1px)');
                    }
                    if (this.options.gridY !== 1) {
                        bgi.push('linear-gradient(to bottom, grey 1px, transparent 1px)');
                    }
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
                if (this.options.gridShow) {
                    this.scaleTo(1);
                }
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
                var bl = this.convertBorder(this.getStyle(el, 'borderLeftWidth'));
                var br = this.convertBorder(this.getStyle(el, 'borderRightWidth'));
                var pl = this.convertSpan(this.getStyle(el, 'paddingLeft'));
                var pr = this.convertSpan(this.getStyle(el, 'paddingRight'));
                var ml = this.convertSpan(this.getStyle(el, 'marginLeft'));
                var mr = this.convertSpan(this.getStyle(el, 'marginRight'));
                var bt = this.convertBorder(this.getStyle(el, 'borderTopWidth'));
                var bb = this.convertBorder(this.getStyle(el, 'borderBottomWidth'));
                var pt = this.convertSpan(this.getStyle(el, 'paddingTop'));
                var pb = this.convertSpan(this.getStyle(el, 'paddingBottom'));
                var mt = this.convertSpan(this.getStyle(el, 'marginTop'));
                var mb = this.convertSpan(this.getStyle(el, 'marginBottom'));
                return [
                    (pl + pr + bl + br + ml + mr),
                    (pt + pb + bt + bb + mt + mb)
                ];
            };
            Zwoosh.prototype.convertBorder = function (b) {
                return b === 'thin' ? 1 : b === 'medium' ? 3 : b === 'thick' ? 5 : !isNaN(parseInt(b, 10)) ? parseInt(b, 10) : 0;
            };
            Zwoosh.prototype.convertSpan = function (v) {
                return v === 'auto' ? 0 : !isNaN(parseInt(v, 10)) ? parseInt(v, 10) : 0;
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
                has = this.getStyle(this.container, 'overflow') === "visible" ||
                    this.getStyle(this.container, 'overflowY') === "visible" ||
                    (has && this.getStyle(this.container, 'overflow') === "auto") ||
                    (has && this.getStyle(this.container, 'overflowY') === "auto");
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
                    while ((scale > this.options.zoomOptions.maxScale && this.options.zoomOptions.maxScale !== 0) ||
                        (scale < this.options.zoomOptions.minScale && this.options.zoomOptions.minScale !== 0) ||
                        (width < this.container.clientWidth && !this.isBody) ||
                        (height < this.container.clientHeight && !this.isBody)) {
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
                if (x === 0 && !this.triggered.collideLeft) {
                    this.triggerEvent(this.inner, 'collide.left');
                }
                this.triggered.collideLeft = x === 0;
                // the collideTop event
                if (y === 0 && !this.triggered.collideTop) {
                    this.triggerEvent(this.inner, 'collide.top');
                }
                this.triggered.collideTop = y === 0;
                // the collideRight event
                if (x === this.scrollMaxLeft && !this.triggered.collideRight) {
                    this.triggerEvent(this.inner, 'collide.right');
                }
                this.triggered.collideRight = x === this.scrollMaxLeft;
                // the collideBottom event
                if (y === this.scrollMaxTop && !this.triggered.collideBottom) {
                    this.triggerEvent(this.inner, 'collide.bottom');
                }
                this.triggered.collideBottom = y === this.scrollMaxTop;
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
                if (this.oldClientWidth !== document.documentElement.clientWidth ||
                    this.oldClientHeight !== document.documentElement.clientHeight) {
                    window.clearTimeout(this.resizeTimeout);
                    this.resizeTimeout = window.setTimeout(onResize, 10);
                }
                /* write down the old clientWidth and clientHeight for the above comparsion */
                this.oldClientWidth = document.documentElement.clientWidth;
                this.oldClientHeight = document.documentElement.clientHeight;
            };
            Zwoosh.prototype.clearTextSelection = function () {
                if (window.getSelection) {
                    window.getSelection().removeAllRanges();
                }
                if (document.selection) {
                    document.selection.empty();
                }
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
                if (!this.customEvents[event]) {
                    this.customEvents[event] = [];
                }
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
                    for (var i in this.timeouts) {
                        if (this.timeouts.hasOwnProperty(i)) {
                            clearTimeout(this.timeouts[i]);
                        }
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
                                for (var a = 0; a < excludeElements.length; a++) {
                                    /* bail out if an element matches */
                                    if (excludeElements[a] === el) {
                                        return;
                                    }
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
                    if (this.vy.hasOwnProperty(i)) {
                        if (parseFloat(i) > (present - timeSpan) &&
                            typeof lastT !== 'undefined' &&
                            typeof lastSx !== 'undefined' &&
                            typeof lastSy !== 'undefined') {
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
                var _this = this;
                /* calculate the brake acceleration in both directions separately */
                var ay = (vy > 0 ? -1 : 1) * this.options.dragOptions.brakeSpeed;
                var ax = (vx > 0 ? -1 : 1) * this.options.dragOptions.brakeSpeed;
                /* find the direction that needs longer to stop, and recalculate the acceleration */
                var tmax = Math.max((0 - vy) / ay, (0 - vx) / ax);
                ax = (0 - vx) / tmax;
                ay = (0 - vy) / tmax;
                var sx, sy, t;
                var fps = this.options.dragOptions.fps;
                for (var i = 0; i < ((tmax * fps) + (0 / fps)); i++) {
                    t = ((i + 1) / fps);
                    sy = this.getScrollTop() + (vy * t) + (0.5 * ay * t * t);
                    sx = this.getScrollLeft() + (vx * t) + (0.5 * ax * t * t);
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
                x = (x > this.scrollMaxLeft) ? this.scrollMaxLeft : (x < 0) ? 0 : x;
                y = (y > this.scrollMaxTop) ? this.scrollMaxTop : (y < 0) ? 0 : y;
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
                    if (this.customEvents.hasOwnProperty(event)) {
                        for (var p in this.customEvents[event]) {
                            if (this.customEvents[event].hasOwnProperty(p)) {
                                this.removeEventListener(this.inner, event, this.customEvents[event][p][0]);
                            }
                        }
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiendvb3NoLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiKGZ1bmN0aW9uIChmYWN0b3J5KSB7XG4gICAgaWYgKHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUuZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgdmFyIHYgPSBmYWN0b3J5KHJlcXVpcmUsIGV4cG9ydHMpOyBpZiAodiAhPT0gdW5kZWZpbmVkKSBtb2R1bGUuZXhwb3J0cyA9IHY7XG4gICAgfVxuICAgIGVsc2UgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgICAgICBkZWZpbmUoW1wicmVxdWlyZVwiLCBcImV4cG9ydHNcIl0sIGZhY3RvcnkpO1xuICAgIH1cbn0pKGZ1bmN0aW9uIChyZXF1aXJlLCBleHBvcnRzKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG4gICAgLyoqXG4gICAgICogRXhwb3J0IGZ1bmN0aW9uIG9mIHRoZSBtb2R1bGVcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGNvbnRhaW5lciAtIFRoZSBIVE1MRWxlbWVudCB0byBzd29vb29zaCFcbiAgICAgKiBAcGFyYW0ge09wdGlvbnN9IG9wdGlvbnMgLSB0aGUgb3B0aW9ucyBvYmplY3QgdG8gY29uZmlndXJlIFp3b29zaFxuICAgICAqIEByZXR1cm4ge1p3b29zaH0gLSBad29vc2ggb2JqZWN0IGluc3RhbmNlXG4gICAgICovXG4gICAgZnVuY3Rpb24gendvb3NoKGNvbnRhaW5lciwgb3B0aW9ucykge1xuICAgICAgICBpZiAob3B0aW9ucyA9PT0gdm9pZCAwKSB7IG9wdGlvbnMgPSB7fTsgfVxuICAgICAgICAvKipcbiAgICAgICAgICogUG9seWZpbGwgYmluZCBmdW5jdGlvbiBmb3Igb2xkZXIgYnJvd3NlcnNcbiAgICAgICAgICogVGhlIGJpbmQgZnVuY3Rpb24gaXMgYW4gYWRkaXRpb24gdG8gRUNNQS0yNjIsIDV0aCBlZGl0aW9uXG4gICAgICAgICAqIEBzZWU6IGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0phdmFTY3JpcHQvUmVmZXJlbmNlL0dsb2JhbF9PYmplY3RzL0Z1bmN0aW9uL2JpbmRcbiAgICAgICAgICovXG4gICAgICAgIGlmICghRnVuY3Rpb24ucHJvdG90eXBlLmJpbmQpIHtcbiAgICAgICAgICAgIEZ1bmN0aW9uLnByb3RvdHlwZS5iaW5kID0gZnVuY3Rpb24gKG9UaGlzKSB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB0aGlzICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNsb3Nlc3QgdGhpbmcgcG9zc2libGUgdG8gdGhlIEVDTUFTY3JpcHQgNVxuICAgICAgICAgICAgICAgICAgICAvLyBpbnRlcm5hbCBJc0NhbGxhYmxlIGZ1bmN0aW9uXG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0Z1bmN0aW9uLnByb3RvdHlwZS5iaW5kIC0gd2hhdCBpcyB0cnlpbmcgdG8gYmUgYm91bmQgaXMgbm90IGNhbGxhYmxlJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciBhQXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSksIGZUb0JpbmQgPSB0aGlzLCBGTk9QID0gZnVuY3Rpb24gKCkgeyB9LCBmQm91bmQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmVG9CaW5kLmFwcGx5KHRoaXMgaW5zdGFuY2VvZiBGTk9QID8gdGhpcyA6IG9UaGlzLCBhQXJncy5jb25jYXQoQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKSkpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMucHJvdG90eXBlKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEZ1bmN0aW9uLnByb3RvdHlwZSBkb2Vzbid0IGhhdmUgYSBwcm90b3R5cGUgcHJvcGVydHlcbiAgICAgICAgICAgICAgICAgICAgRk5PUC5wcm90b3R5cGUgPSB0aGlzLnByb3RvdHlwZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZkJvdW5kLnByb3RvdHlwZSA9IG5ldyBGTk9QKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZCb3VuZDtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFBvbHlmaWxsIGFycmF5LmluZGV4T2YgZnVuY3Rpb24gZm9yIG9sZGVyIGJyb3dzZXJzXG4gICAgICAgICAqIFRoZSBpbmRleE9mKCkgZnVuY3Rpb24gd2FzIGFkZGVkIHRvIHRoZSBFQ01BLTI2MiBzdGFuZGFyZCBpbiB0aGUgNXRoIGVkaXRpb25cbiAgICAgICAgICogYXMgc3VjaCBpdCBtYXkgbm90IGJlIHByZXNlbnQgaW4gYWxsIGJyb3dzZXJzLlxuICAgICAgICAgKiBAc2VlIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0phdmFTY3JpcHQvUmVmZXJlbmNlL0dsb2JhbF9PYmplY3RzL0FycmF5L2luZGV4T2ZcbiAgICAgICAgICovXG4gICAgICAgIGlmICghQXJyYXkucHJvdG90eXBlLmluZGV4T2YpIHtcbiAgICAgICAgICAgIEFycmF5LnByb3RvdHlwZS5pbmRleE9mID0gZnVuY3Rpb24gKHNlYXJjaEVsZW1lbnQsIGZyb21JbmRleCkge1xuICAgICAgICAgICAgICAgIHZhciBrO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1widGhpc1wiIGlzIG51bGwgb3Igbm90IGRlZmluZWQnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIG8gPSBPYmplY3QodGhpcyk7XG4gICAgICAgICAgICAgICAgdmFyIGxlbiA9IG8ubGVuZ3RoID4+PiAwO1xuICAgICAgICAgICAgICAgIGlmIChsZW4gPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgbiA9ICtmcm9tSW5kZXggfHwgMDtcbiAgICAgICAgICAgICAgICBpZiAoTWF0aC5hYnMobikgPT09IEluZmluaXR5KSB7XG4gICAgICAgICAgICAgICAgICAgIG4gPSAwO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAobiA+PSBsZW4pIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBrID0gTWF0aC5tYXgobiA+PSAwID8gbiA6IGxlbiAtIE1hdGguYWJzKG4pLCAwKTtcbiAgICAgICAgICAgICAgICB3aGlsZSAoayA8IGxlbikge1xuICAgICAgICAgICAgICAgICAgICBpZiAoayBpbiBvICYmIG9ba10gPT09IHNlYXJjaEVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGsrKztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICAvKiBsaXN0IG9mIHJlYWwgZXZlbnRzICovXG4gICAgICAgIHZhciBodG1sRXZlbnRzID0ge1xuICAgICAgICAgICAgLyogPGJvZHk+IGFuZCA8ZnJhbWVzZXQ+IEV2ZW50cyAqL1xuICAgICAgICAgICAgb25sb2FkOiAxLFxuICAgICAgICAgICAgb251bmxvYWQ6IDEsXG4gICAgICAgICAgICAvKiBGb3JtIEV2ZW50cyAqL1xuICAgICAgICAgICAgb25ibHVyOiAxLFxuICAgICAgICAgICAgb25jaGFuZ2U6IDEsXG4gICAgICAgICAgICBvbmZvY3VzOiAxLFxuICAgICAgICAgICAgb25yZXNldDogMSxcbiAgICAgICAgICAgIG9uc2VsZWN0OiAxLFxuICAgICAgICAgICAgb25zdWJtaXQ6IDEsXG4gICAgICAgICAgICAvKiBJbWFnZSBFdmVudHMgKi9cbiAgICAgICAgICAgIG9uYWJvcnQ6IDEsXG4gICAgICAgICAgICAvKiBLZXlib2FyZCBFdmVudHMgKi9cbiAgICAgICAgICAgIG9ua2V5ZG93bjogMSxcbiAgICAgICAgICAgIG9ua2V5cHJlc3M6IDEsXG4gICAgICAgICAgICBvbmtleXVwOiAxLFxuICAgICAgICAgICAgLyogTW91c2UgRXZlbnRzICovXG4gICAgICAgICAgICBvbmNsaWNrOiAxLFxuICAgICAgICAgICAgb25kYmxjbGljazogMSxcbiAgICAgICAgICAgIG9ubW91c2Vkb3duOiAxLFxuICAgICAgICAgICAgb25tb3VzZW1vdmU6IDEsXG4gICAgICAgICAgICBvbm1vdXNlb3V0OiAxLFxuICAgICAgICAgICAgb25tb3VzZW92ZXI6IDEsXG4gICAgICAgICAgICBvbm1vdXNldXA6IDFcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIG1hcEV2ZW50cyA9IHtcbiAgICAgICAgICAgIG9uc2Nyb2xsOiB3aW5kb3dcbiAgICAgICAgfTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFp3b29zaCBwcm92aWRlcyBhIHNldCBvZiBmdW5jdGlvbnMgdG8gaW1wbGVtZW50IHNjcm9sbCBieSBkcmFnLCB6b29tIGJ5IG1vdXNld2hlZWwsXG4gICAgICAgICAqIGhhc2ggbGlua3MgaW5zaWRlIHRoZSBkb2N1bWVudCBhbmQgb3RoZXIgc3BlY2lhbCBzY3JvbGwgcmVsYXRlZCByZXF1aXJlbWVudHMuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBhdXRob3IgUm9tYW4gR3J1YmVyIDxwMTAyMDM4OUB5YWhvby5jb20+XG4gICAgICAgICAqIEB2ZXJzaW9uIDEuMC4xXG4gICAgICAgICAqL1xuICAgICAgICB2YXIgWndvb3NoID0gKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGZ1bmN0aW9uIFp3b29zaChjb250YWluZXIsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNvbnRhaW5lciA9IGNvbnRhaW5lcjtcbiAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuICAgICAgICAgICAgICAgIC8qIENTUyBzdHlsZSBjbGFzc2VzICovXG4gICAgICAgICAgICAgICAgdGhpcy5jbGFzc0lubmVyID0gJ3p3LWlubmVyJztcbiAgICAgICAgICAgICAgICB0aGlzLmNsYXNzT3V0ZXIgPSAnenctb3V0ZXInO1xuICAgICAgICAgICAgICAgIHRoaXMuY2xhc3NHcmFiID0gJ3p3LWdyYWInO1xuICAgICAgICAgICAgICAgIHRoaXMuY2xhc3NOb0dyYWIgPSAnenctbm9ncmFiJztcbiAgICAgICAgICAgICAgICB0aGlzLmNsYXNzR3JhYmJpbmcgPSAnenctZ3JhYmJpbmcnO1xuICAgICAgICAgICAgICAgIHRoaXMuY2xhc3NVbmlxdWUgPSAnenctJyArIE1hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpLnN1YnN0cmluZyg3KTtcbiAgICAgICAgICAgICAgICB0aGlzLmNsYXNzU2NhbGUgPSAnenctc2NhbGUnO1xuICAgICAgICAgICAgICAgIHRoaXMuY2xhc3NJZ25vcmUgPSAnenctaWdub3JlJztcbiAgICAgICAgICAgICAgICB0aGlzLmNsYXNzRmFrZUJvZHkgPSAnenctZmFrZWJvZHknO1xuICAgICAgICAgICAgICAgIC8qIGFycmF5IGhvbGRpbmcgdGhlIGN1c3RvbSBldmVudHMgbWFwcGluZyBjYWxsYmFja3MgdG8gYm91bmQgY2FsbGJhY2tzICovXG4gICAgICAgICAgICAgICAgdGhpcy5jdXN0b21FdmVudHMgPSBbXTtcbiAgICAgICAgICAgICAgICB0aGlzLnRyaWdnZXJlZCA9IHtcbiAgICAgICAgICAgICAgICAgICAgY29sbGlkZUxlZnQ6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBjb2xsaWRlVG9wOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgY29sbGlkZVJpZ2h0OiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgY29sbGlkZUJvdHRvbTogZmFsc2VcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIC8qIGZhZGVPdXQgKi9cbiAgICAgICAgICAgICAgICB0aGlzLnRpbWVvdXRzID0gW107XG4gICAgICAgICAgICAgICAgdGhpcy52eCA9IFtdO1xuICAgICAgICAgICAgICAgIHRoaXMudnkgPSBbXTtcbiAgICAgICAgICAgICAgICB0aGlzLmNvbnRhaW5lciA9IGNvbnRhaW5lcjtcbiAgICAgICAgICAgICAgICAvKiBzZXQgZGVmYXVsdCBvcHRpb25zICovXG4gICAgICAgICAgICAgICAgdmFyIGRlZmF1bHRPcHRpb25zID0ge1xuICAgICAgICAgICAgICAgICAgICAvKiAxIG1lYW5zIGRvIG5vdCBhbGlnbiB0byBhIGdyaWQgKi9cbiAgICAgICAgICAgICAgICAgICAgZ3JpZFg6IDEsXG4gICAgICAgICAgICAgICAgICAgIGdyaWRZOiAxLFxuICAgICAgICAgICAgICAgICAgICAvKiBzaG93cyBhIGdyaWQgYXMgYW4gb3ZlcmxheSBvdmVyIHRoZSBlbGVtZW50LiBXb3JrcyBvbmx5IGlmIHRoZSBicm93c2VyIHN1cHBvcnRzXG4gICAgICAgICAgICAgICAgICAgICAqIENTUyBHZW5lcmF0ZWQgY29udGVudCBmb3IgcHNldWRvLWVsZW1lbnRzXG4gICAgICAgICAgICAgICAgICAgICAqIEBzZWUgaHR0cDovL2Nhbml1c2UuY29tLyNzZWFyY2g9JTNBYmVmb3JlICovXG4gICAgICAgICAgICAgICAgICAgIGdyaWRTaG93OiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgLyogd2hpY2ggZWRnZSBzaG91bGQgYmUgZWxhc3RpYyAqL1xuICAgICAgICAgICAgICAgICAgICBlbGFzdGljRWRnZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxlZnQ6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgcmlnaHQ6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgdG9wOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGJvdHRvbTogZmFsc2VcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgLyogYWN0aXZhdGVzL2RlYWN0aXZhdGVzIHNjcm9sbGluZyBieSBkcmFnICovXG4gICAgICAgICAgICAgICAgICAgIGRyYWdTY3JvbGw6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIGRyYWdPcHRpb25zOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBleGNsdWRlOiBbJ2lucHV0JywgJ3RleHRhcmVhJywgJ2EnLCAnYnV0dG9uJywgJy4nICsgdGhpcy5jbGFzc0lnbm9yZSwgJ3NlbGVjdCddLFxuICAgICAgICAgICAgICAgICAgICAgICAgb25seTogW10sXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBhY3RpdmF0ZXMgYSBzY3JvbGwgZmFkZSB3aGVuIHNjcm9sbGluZyBieSBkcmFnICovXG4gICAgICAgICAgICAgICAgICAgICAgICBmYWRlOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgLyogZmFkZTogYnJha2UgYWNjZWxlcmF0aW9uIGluIHBpeGVscyBwZXIgc2Vjb25kIHBlciBzZWNvbmQgKHAvc14yKSAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJha2VTcGVlZDogMjUwMCxcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIGZhZGU6IGZyYW1lcyBwZXIgc2Vjb25kIG9mIHRoZSB6d29vc2ggZmFkZW91dCBhbmltYXRpb24gKD49MjUgbG9va3MgbGlrZSBtb3Rpb24pICovXG4gICAgICAgICAgICAgICAgICAgICAgICBmcHM6IDMwLFxuICAgICAgICAgICAgICAgICAgICAgICAgLyogZmFkZTogdGhpcyBzcGVlZCB3aWxsIG5ldmVyIGJlIGV4Y2VlZGVkICovXG4gICAgICAgICAgICAgICAgICAgICAgICBtYXhTcGVlZDogMzAwMCxcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIGZhZGU6IG1pbmltdW0gc3BlZWQgd2hpY2ggdHJpZ2dlcnMgdGhlIGZhZGUgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIG1pblNwZWVkOiAzMDBcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgLyogYWN0aXZhdGVzL2RlYWN0aXZhdGVzIHNjcm9sbGluZyBieSB3aGVlbC4gSWYgdGhlIGRyZWljdGlvbiBpcyB2ZXJ0aWNhbCBhbmQgdGhlcmUgYXJlXG4gICAgICAgICAgICAgICAgICAgICAqIHNjcm9sbGJhcnMgcHJlc2VudCwgendvb3NoIGxldHMgbGVhdmVzIHNjcm9sbGluZyB0byB0aGUgYnJvd3Nlci4gKi9cbiAgICAgICAgICAgICAgICAgICAgd2hlZWxTY3JvbGw6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIHdoZWVsT3B0aW9uczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgLyogZGlyZWN0aW9uIHRvIHNjcm9sbCB3aGVuIHRoZSBtb3VzZSB3aGVlbCBpcyB1c2VkICovXG4gICAgICAgICAgICAgICAgICAgICAgICBkaXJlY3Rpb246ICd2ZXJ0aWNhbCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBhbW91bnQgb2YgcGl4ZWxzIGZvciBvbmUgc2Nyb2xsIHN0ZXAgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIHN0ZXA6IDExNCxcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIHNjcm9sbCBzbW9vdGggb3IgaW5zdGFudCAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgc21vb3RoOiB0cnVlXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIC8qIGFjdGl2YXRlcy9kZWFjdGl2YXRlcyB6b29taW5nIGJ5IHdoZWVsLiBXb3JrcyBvbmx5IHdpdGggYSBDU1MzIDJEIFRyYW5zZm9ybSBjYXBhYmxlIGJyb3dzZXIuXG4gICAgICAgICAgICAgICAgICAgICAqIEBzZWUgaHR0cDovL2Nhbml1c2UuY29tLyNmZWF0PXRyYW5zZm9ybXMyZCAqL1xuICAgICAgICAgICAgICAgICAgICB3aGVlbFpvb206IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICB6b29tT3B0aW9uczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgLyogdGhlIG1heGltdW0gc2NhbGUsIDAgbWVhbnMgbm8gbWF4aW11bSAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgbWF4U2NhbGU6IDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiB0aGUgbWluaW11bSBzY2FsZSwgMCBtZWFucyBubyBtaW5pbXVtICovXG4gICAgICAgICAgICAgICAgICAgICAgICBtaW5TY2FsZTogMCxcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIG9uZSBzdGVwIHdoZW4gdXNpbmcgdGhlIHdoZWVsIHRvIHpvb20gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIHN0ZXA6IDAuMSxcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIG1vdXNlIHdoZWVsIGRpcmVjdGlvbiB0byB6b29tIGxhcmdlciAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgZGlyZWN0aW9uOiAndXAnXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIC8qIGxldCB6d29vc2ggaGFuZGxlIGFuY2hvciBsaW5rcyB0YXJnZXRpbmcgdG8gYW4gYW5jaG9yIGluc2lkZSBvZiB0aGlzIHp3b29zaCBlbGVtZW50LlxuICAgICAgICAgICAgICAgICAgICAgKiB0aGUgZWxlbWVudCBvdXRzaWRlIChtYXliZSB0aGUgYm9keSkgaGFuZGxlcyBhbmNob3JzIHRvby4gSWYgeW91IHdhbnQgdG8gcHJldmVudCB0aGlzLFxuICAgICAgICAgICAgICAgICAgICAgKiBhZGQgdG8gYm9keSBhcyB6d29vc2ggZWxlbWVudCB0b28uICovXG4gICAgICAgICAgICAgICAgICAgIGhhbmRsZUFuY2hvcnM6IHRydWVcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHRoaXMub3B0aW9ucyA9IHRoaXMubWVyZ2Uob3B0aW9ucywgZGVmYXVsdE9wdGlvbnMpO1xuICAgICAgICAgICAgICAgIHRoaXMuaW5pdCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBNZXJnZSB0aGUgZGVmYXVsdCBvcHRpb24gb2JqZWN0IHdpdGggdGhlIHByb3ZpZGVkIG9uZVxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBwYXJhbSB7T3B0aW9uc30gb3B0aW9ucyAtIHRoZSBnaXZlbiBvcHRpb25zXG4gICAgICAgICAgICAgKiBAcGFyYW0ge09wdGlvbnN9IGRlZmF1bHRPcHRpb25zIC0gdGhlIGRlZmF1bHQgb3B0aW9uc1xuICAgICAgICAgICAgICogQHJldHVybiB7T3B0aW9uc30gLSB0aGUgbWVyZ2VkIG9wdGlvbnMgb2JqZWN0XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIFp3b29zaC5wcm90b3R5cGUubWVyZ2UgPSBmdW5jdGlvbiAob3B0aW9ucywgZGVmYXVsdE9wdGlvbnMpIHtcbiAgICAgICAgICAgICAgICAvKiBtZXJnZSB0aGUgZGVmYXVsdCBvcHRpb24gb2JqZWN0IHdpdGggdGhlIHByb3ZpZGVkIG9uZSAqL1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiBvcHRpb25zKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2Ygb3B0aW9uc1trZXldID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIG9rZXkgaW4gb3B0aW9uc1trZXldKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvcHRpb25zW2tleV0uaGFzT3duUHJvcGVydHkob2tleSkpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0T3B0aW9uc1trZXldW29rZXldID0gb3B0aW9uc1trZXldW29rZXldO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHRPcHRpb25zW2tleV0gPSBvcHRpb25zW2tleV07XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGRlZmF1bHRPcHRpb25zO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogSW5pdGlhbGl6ZSBET00gbWFuaXB1bGF0aW9ucyBhbmQgZXZlbnQgaGFuZGxlcnNcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHt2b2lkfVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLmluaXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgICAgICAgICB0aGlzLmluaXRCb2R5KCk7XG4gICAgICAgICAgICAgICAgdGhpcy5hZGRDbGFzcyh0aGlzLmNvbnRhaW5lciwgdGhpcy5jbGFzc091dGVyKTtcbiAgICAgICAgICAgICAgICB0aGlzLnNjcm9sbEVsZW1lbnQgPSB0aGlzLmNvbnRhaW5lcjtcbiAgICAgICAgICAgICAgICB2YXIgeCA9IHRoaXMuZ2V0U2Nyb2xsTGVmdCgpO1xuICAgICAgICAgICAgICAgIHZhciB5ID0gdGhpcy5nZXRTY3JvbGxUb3AoKTtcbiAgICAgICAgICAgICAgICAvKiBjcmVhdGUgaW5uZXIgZGl2IGVsZW1lbnQgYW5kIGFwcGVuZCBpdCB0byB0aGUgY29udGFpbmVyIHdpdGggaXRzIGNvbnRlbnRzIGluIGl0ICovXG4gICAgICAgICAgICAgICAgdGhpcy5pbm5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICAgICAgICAgICAgdGhpcy5hZGRDbGFzcyh0aGlzLmlubmVyLCB0aGlzLmNsYXNzSW5uZXIpO1xuICAgICAgICAgICAgICAgIHRoaXMuYWRkQ2xhc3ModGhpcy5pbm5lciwgdGhpcy5jbGFzc1VuaXF1ZSk7XG4gICAgICAgICAgICAgICAgdGhpcy5zY2FsZUVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgICAgICAgICAgIHRoaXMuYWRkQ2xhc3ModGhpcy5zY2FsZUVsZW1lbnQsIHRoaXMuY2xhc3NTY2FsZSk7XG4gICAgICAgICAgICAgICAgdGhpcy5zY2FsZUVsZW1lbnQuYXBwZW5kQ2hpbGQodGhpcy5pbm5lcik7XG4gICAgICAgICAgICAgICAgLyogbW92ZSBhbGwgY2hpbGROb2RlcyB0byB0aGUgbmV3IGlubmVyIGVsZW1lbnQgKi9cbiAgICAgICAgICAgICAgICB3aGlsZSAodGhpcy5jb250YWluZXIuY2hpbGROb2Rlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaW5uZXIuYXBwZW5kQ2hpbGQodGhpcy5jb250YWluZXIuY2hpbGROb2Rlc1swXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuY29udGFpbmVyLmFwcGVuZENoaWxkKHRoaXMuc2NhbGVFbGVtZW50KTtcbiAgICAgICAgICAgICAgICB2YXIgYm9yZGVyID0gdGhpcy5nZXRCb3JkZXIodGhpcy5jb250YWluZXIpO1xuICAgICAgICAgICAgICAgIHRoaXMuaW5uZXIuc3R5bGUubWluV2lkdGggPSAodGhpcy5jb250YWluZXIuc2Nyb2xsV2lkdGggLSBib3JkZXJbMF0pICsgJ3B4JztcbiAgICAgICAgICAgICAgICB0aGlzLmlubmVyLnN0eWxlLm1pbkhlaWdodCA9ICh0aGlzLmNvbnRhaW5lci5zY3JvbGxIZWlnaHQgLSBib3JkZXJbMV0pICsgJ3B4JztcbiAgICAgICAgICAgICAgICB0aGlzLnNjYWxlRWxlbWVudC5zdHlsZS5taW5XaWR0aCA9IHRoaXMuaW5uZXIuc3R5bGUubWluV2lkdGg7XG4gICAgICAgICAgICAgICAgdGhpcy5zY2FsZUVsZW1lbnQuc3R5bGUubWluSGVpZ2h0ID0gdGhpcy5pbm5lci5zdHlsZS5taW5IZWlnaHQ7XG4gICAgICAgICAgICAgICAgdGhpcy5zY2FsZUVsZW1lbnQuc3R5bGUub3ZlcmZsb3cgPSAnaGlkZGVuJztcbiAgICAgICAgICAgICAgICB0aGlzLmluaXRHcmlkKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5vbGRDbGllbnRXaWR0aCA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRXaWR0aDtcbiAgICAgICAgICAgICAgICB0aGlzLm9sZENsaWVudEhlaWdodCA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRIZWlnaHQ7XG4gICAgICAgICAgICAgICAgLyoganVzdCBjYWxsIHRoZSBmdW5jdGlvbiwgdG8gdHJpZ2dlciBwb3NzaWJsZSBldmVudHMgKi9cbiAgICAgICAgICAgICAgICB0aGlzLm9uU2Nyb2xsKCk7XG4gICAgICAgICAgICAgICAgLyogc2Nyb2xsIHRvIHRoZSBpbml0aWFsIHBvc2l0aW9uICovXG4gICAgICAgICAgICAgICAgdGhpcy5zY3JvbGxUbyh4LCB5LCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgLyogRXZlbnQgaGFuZGxlciByZWdpc3RyYXRpb24gc3RhcnQgaGVyZSAqL1xuICAgICAgICAgICAgICAgIHRoaXMuaW5pdFdoZWVsU2Nyb2xsKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5pbml0V2hlZWxab29tKCk7XG4gICAgICAgICAgICAgICAgLyogc2Nyb2xsaGFuZGxlciAqL1xuICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsSGFuZGxlciA9IGZ1bmN0aW9uIChlKSB7IHJldHVybiBfdGhpcy5vblNjcm9sbChlKTsgfTtcbiAgICAgICAgICAgICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIodGhpcy5jb250YWluZXIsICdzY3JvbGwnLCB0aGlzLnNjcm9sbEhhbmRsZXIpO1xuICAgICAgICAgICAgICAgIC8qIGlmIHRoZSBzY3JvbGwgZWxlbWVudCBpcyBib2R5LCBhZGp1c3QgdGhlIGlubmVyIGRpdiB3aGVuIHJlc2l6aW5nICovXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuaXNCb2R5KSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVzaXplSGFuZGxlciA9IGZ1bmN0aW9uIChlKSB7IHJldHVybiBfdGhpcy5vblJlc2l6ZShlKTsgfTsgLy9UT0RPOiBzYW1lIGFzIGFib3ZlIGluIHRoZSB3aGVlbCBoYW5kbGVyXG4gICAgICAgICAgICAgICAgICAgIHdpbmRvdy5vbnJlc2l6ZSA9IHRoaXMucmVzaXplSGFuZGxlcjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5pbml0RHJhZ1Njcm9sbCgpO1xuICAgICAgICAgICAgICAgIHRoaXMuaW5pdEFuY2hvcnMoKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFJlaW5pdGlhbGl6ZSB0aGUgendvb3NoIGVsZW1lbnRcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHtad29vc2h9IC0gVGhlIFp3b29zaCBvYmplY3QgaW5zdGFuY2VcbiAgICAgICAgICAgICAqIEBUT0RPOiBwcmVzZXJ2ZSBzY3JvbGwgcG9zaXRpb24gaW4gaW5pdCgpXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIFp3b29zaC5wcm90b3R5cGUucmVpbml0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHRoaXMuZGVzdHJveSgpO1xuICAgICAgICAgICAgICAgIHRoaXMuY2xhc3NVbmlxdWUgPSAnenctJyArIE1hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpLnN1YnN0cmluZyg3KTtcbiAgICAgICAgICAgICAgICB0aGlzLmluaXQoKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLmluaXRCb2R5ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHRoaXMuaXNCb2R5ID0gdGhpcy5jb250YWluZXIudGFnTmFtZSA9PT0gXCJCT0RZXCIgPyB0cnVlIDogZmFsc2U7XG4gICAgICAgICAgICAgICAgLyogQ2hyb21lIHNvbHV0aW9uIHRvIHNjcm9sbCB0aGUgYm9keSBpcyBub3QgcmVhbGx5IHZpYWJsZSwgc28gd2UgY3JlYXRlIGEgZmFrZSBib2R5XG4gICAgICAgICAgICAgICAgICogZGl2IGVsZW1lbnQgdG8gc2Nyb2xsIG9uICovXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuaXNCb2R5ID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBwc2V1ZG9Cb2R5ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGRDbGFzcyhwc2V1ZG9Cb2R5LCB0aGlzLmNsYXNzRmFrZUJvZHkpO1xuICAgICAgICAgICAgICAgICAgICBwc2V1ZG9Cb2R5LnN0eWxlLmNzc1RleHQgPSBkb2N1bWVudC5ib2R5LnN0eWxlLmNzc1RleHQ7XG4gICAgICAgICAgICAgICAgICAgIHdoaWxlICh0aGlzLmNvbnRhaW5lci5jaGlsZE5vZGVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBzZXVkb0JvZHkuYXBwZW5kQ2hpbGQodGhpcy5jb250YWluZXIuY2hpbGROb2Rlc1swXSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jb250YWluZXIuYXBwZW5kQ2hpbGQocHNldWRvQm9keSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY29udGFpbmVyID0gcHNldWRvQm9keTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgWndvb3NoLnByb3RvdHlwZS5pbml0R3JpZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAvKiBzaG93IHRoZSBncmlkIG9ubHkgaWYgYXQgbGVhc3Qgb25lIG9mIHRoZSBncmlkIHZhbHVlcyBpcyBub3QgMSAqL1xuICAgICAgICAgICAgICAgIGlmICgodGhpcy5vcHRpb25zLmdyaWRYICE9PSAxIHx8IHRoaXMub3B0aW9ucy5ncmlkWSAhPT0gMSkgJiYgdGhpcy5vcHRpb25zLmdyaWRTaG93KSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBiZ2kgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5ncmlkWCAhPT0gMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYmdpLnB1c2goJ2xpbmVhci1ncmFkaWVudCh0byByaWdodCwgZ3JleSAxcHgsIHRyYW5zcGFyZW50IDFweCknKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLmdyaWRZICE9PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBiZ2kucHVzaCgnbGluZWFyLWdyYWRpZW50KHRvIGJvdHRvbSwgZ3JleSAxcHgsIHRyYW5zcGFyZW50IDFweCknKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZEJlZm9yZUNTUyh0aGlzLmNsYXNzVW5pcXVlLCAnd2lkdGgnLCB0aGlzLmlubmVyLnN0eWxlLm1pbldpZHRoKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGRCZWZvcmVDU1ModGhpcy5jbGFzc1VuaXF1ZSwgJ2hlaWdodCcsIHRoaXMuaW5uZXIuc3R5bGUubWluSGVpZ2h0KTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGRCZWZvcmVDU1ModGhpcy5jbGFzc1VuaXF1ZSwgJ2xlZnQnLCAnLScgKyB0aGlzLmdldFN0eWxlKHRoaXMuY29udGFpbmVyLCAncGFkZGluZ0xlZnQnKSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkQmVmb3JlQ1NTKHRoaXMuY2xhc3NVbmlxdWUsICd0b3AnLCAnLScgKyB0aGlzLmdldFN0eWxlKHRoaXMuY29udGFpbmVyLCAncGFkZGluZ1RvcCcpKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGRCZWZvcmVDU1ModGhpcy5jbGFzc1VuaXF1ZSwgJ2JhY2tncm91bmQtc2l6ZScsICh0aGlzLm9wdGlvbnMuZ3JpZFggIT09IDEgPyB0aGlzLm9wdGlvbnMuZ3JpZFggKyAncHggJyA6ICdhdXRvICcpICsgKHRoaXMub3B0aW9ucy5ncmlkWSAhPT0gMSA/IHRoaXMub3B0aW9ucy5ncmlkWSArICdweCcgOiAnYXV0bycpKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGRCZWZvcmVDU1ModGhpcy5jbGFzc1VuaXF1ZSwgJ2JhY2tncm91bmQtaW1hZ2UnLCBiZ2kuam9pbignLCAnKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIFp3b29zaC5wcm90b3R5cGUuaW5pdFdoZWVsU2Nyb2xsID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgICAgICAgICAgLyogVE9ETzogbm90IDIgZGlmZmVyZW50IGV2ZW50IGhhbmRsZXJzIHJlZ2lzdHJhdGlvbnMgLT4gZG8gaXQgaW4gdGhpcy5hZGRFdmVudExpc3RlbmVyKCkgKi9cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLndoZWVsU2Nyb2xsID09PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm1vdXNlU2Nyb2xsSGFuZGxlciA9IGZ1bmN0aW9uIChlKSB7IHJldHVybiBfdGhpcy5kaXNhYmxlTW91c2VTY3JvbGwoZSk7IH07XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsRWxlbWVudC5vbm1vdXNld2hlZWwgPSB0aGlzLm1vdXNlU2Nyb2xsSGFuZGxlcjtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKHRoaXMuc2Nyb2xsRWxlbWVudCwgJ3doZWVsJywgdGhpcy5tb3VzZVNjcm9sbEhhbmRsZXIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmICh0aGlzLm9wdGlvbnMud2hlZWxTY3JvbGwgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5tb3VzZVNjcm9sbEhhbmRsZXIgPSBmdW5jdGlvbiAoZSkgeyByZXR1cm4gX3RoaXMuYWN0aXZlTW91c2VTY3JvbGwoZSk7IH07XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsRWxlbWVudC5vbm1vdXNld2hlZWwgPSB0aGlzLm1vdXNlU2Nyb2xsSGFuZGxlcjtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKHRoaXMuc2Nyb2xsRWxlbWVudCwgJ3doZWVsJywgdGhpcy5tb3VzZVNjcm9sbEhhbmRsZXIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvKiB3aGVlbHpvb20gKi9cbiAgICAgICAgICAgIFp3b29zaC5wcm90b3R5cGUuaW5pdFdoZWVsWm9vbSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMuZ3JpZFNob3cpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zY2FsZVRvKDEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLndoZWVsWm9vbSA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm1vdXNlWm9vbUhhbmRsZXIgPSBmdW5jdGlvbiAoZSkgeyByZXR1cm4gX3RoaXMuYWN0aXZlTW91c2Vab29tKGUpOyB9O1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIodGhpcy5zY3JvbGxFbGVtZW50LCAnd2hlZWwnLCB0aGlzLm1vdXNlWm9vbUhhbmRsZXIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLmluaXREcmFnU2Nyb2xsID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgICAgICAgICAgLyogaWYgZHJhZ3Njcm9sbCBpcyBhY3RpdmF0ZWQsIHJlZ2lzdGVyIG1vdXNlZG93biBldmVudCAqL1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMuZHJhZ1Njcm9sbCA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZENsYXNzKHRoaXMuaW5uZXIsIHRoaXMuY2xhc3NHcmFiKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5tb3VzZURvd25IYW5kbGVyID0gZnVuY3Rpb24gKGUpIHsgcmV0dXJuIF90aGlzLm1vdXNlRG93bihlKTsgfTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKHRoaXMuaW5uZXIsICdtb3VzZWRvd24nLCB0aGlzLm1vdXNlRG93bkhhbmRsZXIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGRDbGFzcyh0aGlzLmNvbnRhaW5lciwgdGhpcy5jbGFzc05vR3JhYik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIFp3b29zaC5wcm90b3R5cGUuaW5pdEFuY2hvcnMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLmhhbmRsZUFuY2hvcnMgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGxpbmtzID0gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvckFsbChcImFbaHJlZl49JyMnXVwiKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5oYXNoQ2hhbmdlQ2xpY2tIYW5kbGVyID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0YXJnZXQgPSBlID8gZS50YXJnZXQgOiB3aW5kb3cuZXZlbnQuc3JjRWxlbWVudDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdGFyZ2V0ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIHB1c2hTdGF0ZSBjaGFuZ2VzIHRoZSBoYXNoIHdpdGhvdXQgdHJpZ2dlcmluZyBoYXNoY2hhbmdlICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGlzdG9yeS5wdXNoU3RhdGUoe30sICcnLCB0YXJnZXQuaHJlZik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogd2UgZG9uJ3Qgd2FudCB0byB0cmlnZ2VyIGhhc2hjaGFuZ2UsIHNvIHByZXZlbnQgZGVmYXVsdCBiZWhhdmlvciB3aGVuIGNsaWNraW5nIG9uIGFuY2hvciBsaW5rcyAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlLnByZXZlbnREZWZhdWx0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGUucmV0dXJuVmFsdWUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAvKiB0cmlnZ2VyIGEgY3VzdG9tIGhhc2hjaGFuZ2UgZXZlbnQsIGJlY2F1c2UgcHVzaFN0YXRlIHByZXZlbnRzIHRoZSByZWFsIGhhc2hjaGFuZ2UgZXZlbnQgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIF90aGlzLnRyaWdnZXJFdmVudCh3aW5kb3csICdteWhhc2hjaGFuZ2UnKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgLyogbG9vcCB0cm91Z2ggYWxsIGFuY2hvciBsaW5rcyBpbiB0aGUgZWxlbWVudCBhbmQgZGlzYWJsZSB0aGVtIHRvIHByZXZlbnQgdGhlXG4gICAgICAgICAgICAgICAgICAgICAqIGJyb3dzZXIgZnJvbSBzY3JvbGxpbmcgYmVjYXVzZSBvZiB0aGUgY2hhbmdpbmcgaGFzaCB2YWx1ZS4gSW5zdGVhZCB0aGUgb3duXG4gICAgICAgICAgICAgICAgICAgICAqIGV2ZW50IG15aGFzaGNoYW5nZSBzaG91bGQgaGFuZGxlIHBhZ2UgYW5kIGVsZW1lbnQgc2Nyb2xsaW5nICovXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGlua3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcihsaW5rc1tpXSwgJ2NsaWNrJywgdGhpcy5oYXNoQ2hhbmdlQ2xpY2tIYW5kbGVyLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5oYXNoQ2hhbmdlSGFuZGxlciA9IGZ1bmN0aW9uIChlKSB7IHJldHVybiBfdGhpcy5vbkhhc2hDaGFuZ2UoZSk7IH07XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcih3aW5kb3csICdteWhhc2hjaGFuZ2UnLCB0aGlzLmhhc2hDaGFuZ2VIYW5kbGVyKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKHdpbmRvdywgJ2hhc2hjaGFuZ2UnLCB0aGlzLmhhc2hDaGFuZ2VIYW5kbGVyKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vbkhhc2hDaGFuZ2UoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLyogQFRPRE86IFNjcm9sbFdpZHRoIGFuZCBDbGllbnRXaWR0aCBTY3JvbGxIZWlnaHQgQ2xpZW50SGVpZ2h0ICovXG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLmdldFNjcm9sbExlZnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuc2Nyb2xsRWxlbWVudC5zY3JvbGxMZWZ0O1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIFp3b29zaC5wcm90b3R5cGUuc2V0U2Nyb2xsTGVmdCA9IGZ1bmN0aW9uIChsZWZ0KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zY3JvbGxFbGVtZW50LnNjcm9sbExlZnQgPSBsZWZ0O1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIFp3b29zaC5wcm90b3R5cGUuZ2V0U2Nyb2xsVG9wID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnNjcm9sbEVsZW1lbnQuc2Nyb2xsVG9wO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIFp3b29zaC5wcm90b3R5cGUuc2V0U2Nyb2xsVG9wID0gZnVuY3Rpb24gKHRvcCkge1xuICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsRWxlbWVudC5zY3JvbGxUb3AgPSB0b3A7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBIYW5kbGUgaGFzaGNoYW5nZXMgd2l0aCBvd24gc2Nyb2xsIGZ1bmN0aW9uXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQHBhcmFtIHtFdmVudH0gZSAtIHRoZSBoYXNoY2hhbmdlIG9yIG15aGFzaGNoYW5nZSBldmVudCwgb3Igbm90aGluZ1xuICAgICAgICAgICAgICogQHJldHVybiB7dm9pZH1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgWndvb3NoLnByb3RvdHlwZS5vbkhhc2hDaGFuZ2UgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgIGlmIChlID09PSB2b2lkIDApIHsgZSA9IG51bGw7IH1cbiAgICAgICAgICAgICAgICB2YXIgaGFzaCA9IHdpbmRvdy5sb2NhdGlvbi5oYXNoLnN1YnN0cigxKTtcbiAgICAgICAgICAgICAgICBpZiAoaGFzaCAhPT0gJycpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGFuY2hvcnMgPSB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yQWxsKCcjJyArIGhhc2gpO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFuY2hvcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBlbGVtZW50ID0gYW5jaG9yc1tpXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjb250YWluZXIgPSBhbmNob3JzW2ldO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZmluZCB0aGUgbmV4dCBwYXJlbnQgd2hpY2ggaXMgYSBjb250YWluZXIgZWxlbWVudFxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG5leHRDb250YWluZXIgPSBlbGVtZW50O1xuICAgICAgICAgICAgICAgICAgICAgICAgd2hpbGUgKGNvbnRhaW5lciAmJiBjb250YWluZXIucGFyZW50RWxlbWVudCAmJiB0aGlzLmNvbnRhaW5lciAhPT0gY29udGFpbmVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuaGFzQ2xhc3MoY29udGFpbmVyLCB0aGlzLmNsYXNzT3V0ZXIpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5leHRDb250YWluZXIgPSBjb250YWluZXI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRhaW5lciA9IGNvbnRhaW5lci5wYXJlbnRFbGVtZW50O1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGUgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZS50eXBlID09PSAnaGFzaGNoYW5nZScpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogc2Nyb2xsaW5nIGluc3RhbnRseSBiYWNrIHRvIG9yaWdpbiwgYmVmb3JlIGRvIHRoZSBhbmltYXRlZCBzY3JvbGwgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zY3JvbGxUbyh0aGlzLm9yaWdpblNjcm9sbExlZnQsIHRoaXMub3JpZ2luU2Nyb2xsVG9wLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zY3JvbGxUb0VsZW1lbnQobmV4dENvbnRhaW5lcik7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBTY3JvbGwgdG8gYW4gZWxlbWVudCBpbiB0aGUgRE9NXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWxlbWVudCAtIHRoZSBIVE1MRWxlbWVudCB0byBzY3JvbGwgdG9cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgWndvb3NoLnByb3RvdHlwZS5zY3JvbGxUb0VsZW1lbnQgPSBmdW5jdGlvbiAoZWxlbWVudCkge1xuICAgICAgICAgICAgICAgIC8qIGdldCByZWxhdGl2ZSBjb29yZHMgZnJvbSB0aGUgYW5jaG9yIGVsZW1lbnQgKi9cbiAgICAgICAgICAgICAgICB2YXIgeCA9IChlbGVtZW50Lm9mZnNldExlZnQgLSB0aGlzLmNvbnRhaW5lci5vZmZzZXRMZWZ0KSAqIHRoaXMuZ2V0U2NhbGUoKTtcbiAgICAgICAgICAgICAgICB2YXIgeSA9IChlbGVtZW50Lm9mZnNldFRvcCAtIHRoaXMuY29udGFpbmVyLm9mZnNldFRvcCkgKiB0aGlzLmdldFNjYWxlKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5zY3JvbGxUbyh4LCB5KTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFdvcmthcm91bmQgdG8gbWFuaXB1bGF0ZSA6OmJlZm9yZSBDU1Mgc3R5bGVzIHdpdGggamF2YXNjcmlwdFxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBjc3NDbGFzcyAtIHRoZSBDU1MgY2xhc3MgbmFtZSB0byBhZGQgOjpiZWZvcmUgcHJvcGVydGllc1xuICAgICAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGNzc1Byb3BlcnR5IC0gdGhlIENTUyBwcm9wZXJ0eSB0byBzZXRcbiAgICAgICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBjc3NWYWx1ZSAtIHRoZSBDU1MgdmFsdWUgdG8gc2V0XG4gICAgICAgICAgICAgKiBAcmV0dXJuIHt2b2lkfVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLmFkZEJlZm9yZUNTUyA9IGZ1bmN0aW9uIChjc3NDbGFzcywgY3NzUHJvcGVydHksIGNzc1ZhbHVlKSB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBkb2N1bWVudC5zdHlsZVNoZWV0c1swXS5pbnNlcnRSdWxlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgIGRvY3VtZW50LnN0eWxlU2hlZXRzWzBdLmluc2VydFJ1bGUoJy4nICsgY3NzQ2xhc3MgKyAnOjpiZWZvcmUgeyAnICsgY3NzUHJvcGVydHkgKyAnOiAnICsgY3NzVmFsdWUgKyAnfScsIDApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmICh0eXBlb2YgZG9jdW1lbnQuc3R5bGVTaGVldHNbMF0uYWRkUnVsZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICBkb2N1bWVudC5zdHlsZVNoZWV0c1swXS5hZGRSdWxlKCcuJyArIGNzc0NsYXNzICsgJzo6YmVmb3JlJywgY3NzUHJvcGVydHkgKyAnOiAnICsgY3NzVmFsdWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEdldCBjb21wdXRlIHBpeGVsIG51bWJlciBvZiB0aGUgd2hvbGUgd2lkdGggYW5kIGhlaWdodCBmcm9tIGEgYm9yZGVyIG9mIGFuIGVsZW1lbnRcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbCAtIHRoZSBIVE1MIGVsZW1lbnRcbiAgICAgICAgICAgICAqIEByZXR1cm4ge2FycmF5fSBbd2lkdGgsIGhlaWdodF0gLSB0aGUgYW1vdW50IG9mIHBpeGVsc1xuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLmdldEJvcmRlciA9IGZ1bmN0aW9uIChlbCkge1xuICAgICAgICAgICAgICAgIHZhciBibCA9IHRoaXMuY29udmVydEJvcmRlcih0aGlzLmdldFN0eWxlKGVsLCAnYm9yZGVyTGVmdFdpZHRoJykpO1xuICAgICAgICAgICAgICAgIHZhciBiciA9IHRoaXMuY29udmVydEJvcmRlcih0aGlzLmdldFN0eWxlKGVsLCAnYm9yZGVyUmlnaHRXaWR0aCcpKTtcbiAgICAgICAgICAgICAgICB2YXIgcGwgPSB0aGlzLmNvbnZlcnRTcGFuKHRoaXMuZ2V0U3R5bGUoZWwsICdwYWRkaW5nTGVmdCcpKTtcbiAgICAgICAgICAgICAgICB2YXIgcHIgPSB0aGlzLmNvbnZlcnRTcGFuKHRoaXMuZ2V0U3R5bGUoZWwsICdwYWRkaW5nUmlnaHQnKSk7XG4gICAgICAgICAgICAgICAgdmFyIG1sID0gdGhpcy5jb252ZXJ0U3Bhbih0aGlzLmdldFN0eWxlKGVsLCAnbWFyZ2luTGVmdCcpKTtcbiAgICAgICAgICAgICAgICB2YXIgbXIgPSB0aGlzLmNvbnZlcnRTcGFuKHRoaXMuZ2V0U3R5bGUoZWwsICdtYXJnaW5SaWdodCcpKTtcbiAgICAgICAgICAgICAgICB2YXIgYnQgPSB0aGlzLmNvbnZlcnRCb3JkZXIodGhpcy5nZXRTdHlsZShlbCwgJ2JvcmRlclRvcFdpZHRoJykpO1xuICAgICAgICAgICAgICAgIHZhciBiYiA9IHRoaXMuY29udmVydEJvcmRlcih0aGlzLmdldFN0eWxlKGVsLCAnYm9yZGVyQm90dG9tV2lkdGgnKSk7XG4gICAgICAgICAgICAgICAgdmFyIHB0ID0gdGhpcy5jb252ZXJ0U3Bhbih0aGlzLmdldFN0eWxlKGVsLCAncGFkZGluZ1RvcCcpKTtcbiAgICAgICAgICAgICAgICB2YXIgcGIgPSB0aGlzLmNvbnZlcnRTcGFuKHRoaXMuZ2V0U3R5bGUoZWwsICdwYWRkaW5nQm90dG9tJykpO1xuICAgICAgICAgICAgICAgIHZhciBtdCA9IHRoaXMuY29udmVydFNwYW4odGhpcy5nZXRTdHlsZShlbCwgJ21hcmdpblRvcCcpKTtcbiAgICAgICAgICAgICAgICB2YXIgbWIgPSB0aGlzLmNvbnZlcnRTcGFuKHRoaXMuZ2V0U3R5bGUoZWwsICdtYXJnaW5Cb3R0b20nKSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgICAgICAgICAgKHBsICsgcHIgKyBibCArIGJyICsgbWwgKyBtciksXG4gICAgICAgICAgICAgICAgICAgIChwdCArIHBiICsgYnQgKyBiYiArIG10ICsgbWIpXG4gICAgICAgICAgICAgICAgXTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLmNvbnZlcnRCb3JkZXIgPSBmdW5jdGlvbiAoYikge1xuICAgICAgICAgICAgICAgIHJldHVybiBiID09PSAndGhpbicgPyAxIDogYiA9PT0gJ21lZGl1bScgPyAzIDogYiA9PT0gJ3RoaWNrJyA/IDUgOiAhaXNOYU4ocGFyc2VJbnQoYiwgMTApKSA/IHBhcnNlSW50KGIsIDEwKSA6IDA7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgWndvb3NoLnByb3RvdHlwZS5jb252ZXJ0U3BhbiA9IGZ1bmN0aW9uICh2KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHYgPT09ICdhdXRvJyA/IDAgOiAhaXNOYU4ocGFyc2VJbnQodiwgMTApKSA/IHBhcnNlSW50KHYsIDEwKSA6IDA7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBEaXNhYmxlcyB0aGUgc2Nyb2xsIHdoZWVsIG9mIHRoZSBtb3VzZVxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBwYXJhbSB7TW91c2VXaGVlbEV2ZW50fSBlIC0gdGhlIG1vdXNlIHdoZWVsIGV2ZW50XG4gICAgICAgICAgICAgKiBAcmV0dXJuIHt2b2lkfVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLmRpc2FibGVNb3VzZVNjcm9sbCA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuZWxlbWVudEJlaGluZEN1cnNvcklzTWUoZS5jbGllbnRYLCBlLmNsaWVudFkpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY2xlYXJUaW1lb3V0cygpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGUgPSB3aW5kb3cuZXZlbnQ7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKGUucHJldmVudERlZmF1bHQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGUucmV0dXJuVmFsdWUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIERldGVybWluZSB3aGV0aGVyIGFuIGVsZW1lbnQgaGFzIGEgc2Nyb2xsYmFyIG9yIG5vdFxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsZW1lbnQgLSB0aGUgSFRNTEVsZW1lbnRcbiAgICAgICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBkaXJlY3Rpb24gLSBkZXRlcm1pbmUgdGhlIHZlcnRpY2FsIG9yIGhvcml6b250YWwgc2Nyb2xsYmFyP1xuICAgICAgICAgICAgICogQHJldHVybiB7Ym9vbGVhbn0gLSB3aGV0aGVyIHRoZSBlbGVtZW50IGhhcyBzY3JvbGxiYXJzIG9yIG5vdFxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLmhhc1Njcm9sbGJhciA9IGZ1bmN0aW9uIChlbGVtZW50LCBkaXJlY3Rpb24pIHtcbiAgICAgICAgICAgICAgICB2YXIgaGFzID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgdmFyIG92ZXJmbG93ID0gJ292ZXJmbG93JztcbiAgICAgICAgICAgICAgICBpZiAoZGlyZWN0aW9uID09PSAndmVydGljYWwnKSB7XG4gICAgICAgICAgICAgICAgICAgIG92ZXJmbG93ID0gJ292ZXJmbG93WSc7XG4gICAgICAgICAgICAgICAgICAgIGhhcyA9IGVsZW1lbnQuc2Nyb2xsSGVpZ2h0ID4gZWxlbWVudC5jbGllbnRIZWlnaHQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKGRpcmVjdGlvbiA9PT0gJ2hvcml6b250YWwnKSB7XG4gICAgICAgICAgICAgICAgICAgIG92ZXJmbG93ID0gJ292ZXJmbG93WCc7XG4gICAgICAgICAgICAgICAgICAgIGhhcyA9IGVsZW1lbnQuc2Nyb2xsV2lkdGggPiBlbGVtZW50LmNsaWVudFdpZHRoO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBDaGVjayB0aGUgb3ZlcmZsb3cgYW5kIG92ZXJmbG93RGlyZWN0aW9uIHByb3BlcnRpZXMgZm9yIFwiYXV0b1wiIGFuZCBcInZpc2libGVcIiB2YWx1ZXNcbiAgICAgICAgICAgICAgICBoYXMgPSB0aGlzLmdldFN0eWxlKHRoaXMuY29udGFpbmVyLCAnb3ZlcmZsb3cnKSA9PT0gXCJ2aXNpYmxlXCIgfHxcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5nZXRTdHlsZSh0aGlzLmNvbnRhaW5lciwgJ292ZXJmbG93WScpID09PSBcInZpc2libGVcIiB8fFxuICAgICAgICAgICAgICAgICAgICAoaGFzICYmIHRoaXMuZ2V0U3R5bGUodGhpcy5jb250YWluZXIsICdvdmVyZmxvdycpID09PSBcImF1dG9cIikgfHxcbiAgICAgICAgICAgICAgICAgICAgKGhhcyAmJiB0aGlzLmdldFN0eWxlKHRoaXMuY29udGFpbmVyLCAnb3ZlcmZsb3dZJykgPT09IFwiYXV0b1wiKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gaGFzO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogRW5hYmxlcyB0aGUgc2Nyb2xsIHdoZWVsIG9mIHRoZSBtb3VzZSB0byBzY3JvbGwsIHNwZWNpYWxseSBmb3IgZGl2cyB3aXRob3VyIHNjcm9sbGJhclxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBwYXJhbSB7TW91c2VXaGVlbEV2ZW50fSBlIC0gdGhlIG1vdXNlIHdoZWVsIGV2ZW50XG4gICAgICAgICAgICAgKiBAcmV0dXJuIHt2b2lkfVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLmFjdGl2ZU1vdXNlU2Nyb2xsID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgICBpZiAoIWUpIHtcbiAgICAgICAgICAgICAgICAgICAgZSA9IHdpbmRvdy5ldmVudDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuZWxlbWVudEJlaGluZEN1cnNvcklzTWUoZS5jbGllbnRYLCBlLmNsaWVudFkpKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBkaXJlY3Rpb247XG4gICAgICAgICAgICAgICAgICAgIGlmIChcImRlbHRhWVwiIGluIGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpcmVjdGlvbiA9IGUuZGVsdGFZID4gMCA/ICdkb3duJyA6ICd1cCc7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoXCJ3aGVlbERlbHRhXCIgaW4gZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGlyZWN0aW9uID0gZS53aGVlbERlbHRhID4gMCA/ICd1cCcgOiAnZG93bic7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgLyogdXNlIHRoZSBub3JtYWwgc2Nyb2xsLCB3aGVuIHRoZXJlIGFyZSBzY3JvbGxiYXJzIGFuZCB0aGUgZGlyZWN0aW9uIGlzIFwidmVydGljYWxcIiAqL1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLndoZWVsT3B0aW9ucy5kaXJlY3Rpb24gPT09ICd2ZXJ0aWNhbCcgJiYgdGhpcy5oYXNTY3JvbGxiYXIodGhpcy5zY3JvbGxFbGVtZW50LCB0aGlzLm9wdGlvbnMud2hlZWxPcHRpb25zLmRpcmVjdGlvbikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghKCh0aGlzLnRyaWdnZXJlZC5jb2xsaWRlQm90dG9tICYmIGRpcmVjdGlvbiA9PT0gJ2Rvd24nKSB8fCAodGhpcy50cmlnZ2VyZWQuY29sbGlkZVRvcCAmJiBkaXJlY3Rpb24gPT09ICd1cCcpKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY2xlYXJUaW1lb3V0cygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0aGlzLmRpc2FibGVNb3VzZVNjcm9sbChlKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHggPSB0aGlzLmdldFNjcm9sbExlZnQoKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHkgPSB0aGlzLmdldFNjcm9sbFRvcCgpO1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLndoZWVsT3B0aW9ucy5kaXJlY3Rpb24gPT09ICdob3Jpem9udGFsJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgeCA9IHRoaXMuZ2V0U2Nyb2xsTGVmdCgpICsgKGRpcmVjdGlvbiA9PT0gJ2Rvd24nID8gdGhpcy5vcHRpb25zLndoZWVsT3B0aW9ucy5zdGVwIDogdGhpcy5vcHRpb25zLndoZWVsT3B0aW9ucy5zdGVwICogLTEpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKHRoaXMub3B0aW9ucy53aGVlbE9wdGlvbnMuZGlyZWN0aW9uID09PSAndmVydGljYWwnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB5ID0gdGhpcy5nZXRTY3JvbGxUb3AoKSArIChkaXJlY3Rpb24gPT09ICdkb3duJyA/IHRoaXMub3B0aW9ucy53aGVlbE9wdGlvbnMuc3RlcCA6IHRoaXMub3B0aW9ucy53aGVlbE9wdGlvbnMuc3RlcCAqIC0xKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0aGlzLnNjcm9sbFRvKHgsIHksIGZhbHNlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBFbmFibGVzIHRoZSBzY3JvbGwgd2hlZWwgb2YgdGhlIG1vdXNlIHRvIHpvb21cbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAcGFyYW0ge01vdXNlV2hlZWxFdmVudH0gZSAtIHRoZSBtb3VzZSB3aGVlbCBldmVudFxuICAgICAgICAgICAgICogQHJldHVybiB7dm9pZH1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgWndvb3NoLnByb3RvdHlwZS5hY3RpdmVNb3VzZVpvb20gPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgIGlmICghZSkge1xuICAgICAgICAgICAgICAgICAgICBlID0gd2luZG93LmV2ZW50O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5lbGVtZW50QmVoaW5kQ3Vyc29ySXNNZShlLmNsaWVudFgsIGUuY2xpZW50WSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRpcmVjdGlvbjtcbiAgICAgICAgICAgICAgICAgICAgaWYgKFwiZGVsdGFZXCIgaW4gZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGlyZWN0aW9uID0gZS5kZWx0YVkgPiAwID8gJ2Rvd24nIDogJ3VwJztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChcIndoZWVsRGVsdGFcIiBpbiBlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkaXJlY3Rpb24gPSBlLndoZWVsRGVsdGEgPiAwID8gJ3VwJyA6ICdkb3duJztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB2YXIgc2NhbGU7XG4gICAgICAgICAgICAgICAgICAgIGlmIChkaXJlY3Rpb24gPT09IHRoaXMub3B0aW9ucy56b29tT3B0aW9ucy5kaXJlY3Rpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjYWxlID0gdGhpcy5nZXRTY2FsZSgpICogKDEgKyB0aGlzLm9wdGlvbnMuem9vbU9wdGlvbnMuc3RlcCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzY2FsZSA9IHRoaXMuZ2V0U2NhbGUoKSAvICgxICsgdGhpcy5vcHRpb25zLnpvb21PcHRpb25zLnN0ZXApO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2NhbGVUbyhzY2FsZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQ2FsY3VsYXRlcyB0aGUgc2l6ZSBvZiB0aGUgdmVydGljYWwgc2Nyb2xsYmFyLlxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsIC0gVGhlIEhUTUxFbGVtZW1udFxuICAgICAgICAgICAgICogQHJldHVybiB7bnVtYmVyfSAtIHRoZSBhbW91bnQgb2YgcGl4ZWxzIHVzZWQgYnkgdGhlIHZlcnRpY2FsIHNjcm9sbGJhclxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLnNjcm9sbGJhcldpZHRoID0gZnVuY3Rpb24gKGVsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGVsLm9mZnNldFdpZHRoIC0gZWwuY2xpZW50V2lkdGggLSBwYXJzZUludCh0aGlzLmdldFN0eWxlKGVsLCAnYm9yZGVyTGVmdFdpZHRoJykpIC0gcGFyc2VJbnQodGhpcy5nZXRTdHlsZShlbCwgJ2JvcmRlclJpZ2h0V2lkdGgnKSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBDYWxjdWxhdGVzIHRoZSBzaXplIG9mIHRoZSBob3Jpem9udGFsIHNjcm9sbGJhci5cbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbCAtIFRoZSBIVE1MRWxlbWVtbnRcbiAgICAgICAgICAgICAqIEByZXR1cm4ge251bWJlcn0gLSB0aGUgYW1vdW50IG9mIHBpeGVscyB1c2VkIGJ5IHRoZSBob3Jpem9udGFsIHNjcm9sbGJhclxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLnNjcm9sbGJhckhlaWdodCA9IGZ1bmN0aW9uIChlbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBlbC5vZmZzZXRIZWlnaHQgLSBlbC5jbGllbnRIZWlnaHQgLSBwYXJzZUludCh0aGlzLmdldFN0eWxlKGVsLCAnYm9yZGVyVG9wV2lkdGgnKSkgLSBwYXJzZUludCh0aGlzLmdldFN0eWxlKGVsLCAnYm9yZGVyQm90dG9tV2lkdGgnKSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBSZXRyaWV2ZXMgdGhlIGN1cnJlbnQgc2NhbGUgdmFsdWUgb3IgMSBpZiBpdCBpcyBub3Qgc2V0LlxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEByZXR1cm4ge251bWJlcn0gLSB0aGUgY3VycmVudCBzY2FsZSB2YWx1ZVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLmdldFNjYWxlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdGhpcy5pbm5lci5zdHlsZS50cmFuc2Zvcm0gIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciByID0gdGhpcy5pbm5lci5zdHlsZS50cmFuc2Zvcm0ubWF0Y2goL3NjYWxlXFwoKFswLTksXFwuXSspXFwpLykgfHwgW1wiXCJdO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcGFyc2VGbG9hdChyWzFdKSB8fCAxO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFNjYWxlcyB0aGUgaW5uZXIgZWxlbWVudCBieSBhIHJlbGF0aWNlIHZhbHVlIGJhc2VkIG9uIHRoZSBjdXJyZW50IHNjYWxlIHZhbHVlLlxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSBwZXJjZW50IC0gcGVyY2VudGFnZSBvZiB0aGUgY3VycmVudCBzY2FsZSB2YWx1ZVxuICAgICAgICAgICAgICogQHBhcmFtIHtib29sZWFufSBob25vdXJMaW1pdHMgLSB3aGV0aGVyIHRvIGhvbm91ciBtYXhTY2FsZSBhbmQgdGhlIG1pbmltdW0gd2lkdGggYW5kIGhlaWdodFxuICAgICAgICAgICAgICogb2YgdGhlIGNvbnRhaW5lciBlbGVtZW50LlxuICAgICAgICAgICAgICogQHJldHVybiB7dm9pZH1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgWndvb3NoLnByb3RvdHlwZS5zY2FsZUJ5ID0gZnVuY3Rpb24gKHBlcmNlbnQsIGhvbm91ckxpbWl0cykge1xuICAgICAgICAgICAgICAgIGlmIChob25vdXJMaW1pdHMgPT09IHZvaWQgMCkgeyBob25vdXJMaW1pdHMgPSB0cnVlOyB9XG4gICAgICAgICAgICAgICAgdmFyIHNjYWxlID0gdGhpcy5nZXRTY2FsZSgpICogKHBlcmNlbnQgLyAxMDApO1xuICAgICAgICAgICAgICAgIHRoaXMuc2NhbGVUbyhzY2FsZSwgaG9ub3VyTGltaXRzKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFNjYWxlcyB0aGUgaW5uZXIgZWxlbWVudCB0byBhbiBhYnNvbHV0ZSB2YWx1ZS5cbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0gc2NhbGUgLSB0aGUgc2NhbGVcbiAgICAgICAgICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gaG9ub3VyTGltaXRzIC0gd2hldGhlciB0byBob25vdXIgbWF4U2NhbGUgYW5kIHRoZSBtaW5pbXVtIHdpZHRoIGFuZCBoZWlnaHRcbiAgICAgICAgICAgICAqIG9mIHRoZSBjb250YWluZXIgZWxlbWVudC5cbiAgICAgICAgICAgICAqIEByZXR1cm4ge3ZvaWR9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIFp3b29zaC5wcm90b3R5cGUuc2NhbGVUbyA9IGZ1bmN0aW9uIChzY2FsZSwgaG9ub3VyTGltaXRzKSB7XG4gICAgICAgICAgICAgICAgaWYgKGhvbm91ckxpbWl0cyA9PT0gdm9pZCAwKSB7IGhvbm91ckxpbWl0cyA9IHRydWU7IH1cbiAgICAgICAgICAgICAgICB2YXIgd2lkdGggPSAocGFyc2VGbG9hdCh0aGlzLmlubmVyLnN0eWxlLm1pbldpZHRoKSAqIHNjYWxlKTtcbiAgICAgICAgICAgICAgICB2YXIgaGVpZ2h0ID0gKHBhcnNlRmxvYXQodGhpcy5pbm5lci5zdHlsZS5taW5IZWlnaHQpICogc2NhbGUpO1xuICAgICAgICAgICAgICAgIC8qIHNjcm9sbGJhcnMgaGF2ZSB3aWR0aCBhbmQgaGVpZ2h0IHRvbyAqL1xuICAgICAgICAgICAgICAgIHZhciBtaW5XaWR0aCA9IHRoaXMuY29udGFpbmVyLmNsaWVudFdpZHRoICsgdGhpcy5zY3JvbGxiYXJXaWR0aCh0aGlzLmNvbnRhaW5lcik7XG4gICAgICAgICAgICAgICAgdmFyIG1pbkhlaWdodCA9IHRoaXMuY29udGFpbmVyLmNsaWVudEhlaWdodCArIHRoaXMuc2Nyb2xsYmFySGVpZ2h0KHRoaXMuY29udGFpbmVyKTtcbiAgICAgICAgICAgICAgICBpZiAoaG9ub3VyTGltaXRzKSB7XG4gICAgICAgICAgICAgICAgICAgIC8qIGxvb3AgYXMgbG9uZyBhcyBhbGwgbGltaXRzIGFyZSBob25vdXJlZCAqL1xuICAgICAgICAgICAgICAgICAgICB3aGlsZSAoKHNjYWxlID4gdGhpcy5vcHRpb25zLnpvb21PcHRpb25zLm1heFNjYWxlICYmIHRoaXMub3B0aW9ucy56b29tT3B0aW9ucy5tYXhTY2FsZSAhPT0gMCkgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIChzY2FsZSA8IHRoaXMub3B0aW9ucy56b29tT3B0aW9ucy5taW5TY2FsZSAmJiB0aGlzLm9wdGlvbnMuem9vbU9wdGlvbnMubWluU2NhbGUgIT09IDApIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAod2lkdGggPCB0aGlzLmNvbnRhaW5lci5jbGllbnRXaWR0aCAmJiAhdGhpcy5pc0JvZHkpIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAoaGVpZ2h0IDwgdGhpcy5jb250YWluZXIuY2xpZW50SGVpZ2h0ICYmICF0aGlzLmlzQm9keSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzY2FsZSA+IHRoaXMub3B0aW9ucy56b29tT3B0aW9ucy5tYXhTY2FsZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjYWxlID0gdGhpcy5vcHRpb25zLnpvb21PcHRpb25zLm1heFNjYWxlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoc2NhbGUgPCB0aGlzLm9wdGlvbnMuem9vbU9wdGlvbnMubWluU2NhbGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY2FsZSA9IHRoaXMub3B0aW9ucy56b29tT3B0aW9ucy5taW5TY2FsZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMuem9vbU9wdGlvbnMubWF4U2NhbGUgIT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWR0aCA9IE1hdGguZmxvb3IocGFyc2VJbnQodGhpcy5pbm5lci5zdHlsZS5taW5XaWR0aCkgKiBzY2FsZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0ID0gTWF0aC5mbG9vcihwYXJzZUludCh0aGlzLmlubmVyLnN0eWxlLm1pbkhlaWdodCkgKiBzY2FsZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAod2lkdGggPCBtaW5XaWR0aCAmJiAhdGhpcy5pc0JvZHkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY2FsZSA9IHNjYWxlIC8gd2lkdGggKiBtaW5XaWR0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQgPSBNYXRoLmZsb29yKHBhcnNlSW50KHRoaXMuaW5uZXIuc3R5bGUubWluSGVpZ2h0KSAqIHNjYWxlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWR0aCA9IG1pbldpZHRoO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGhlaWdodCA8IG1pbkhlaWdodCAmJiAhdGhpcy5pc0JvZHkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY2FsZSA9IHNjYWxlIC8gaGVpZ2h0ICogbWluSGVpZ2h0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoID0gTWF0aC5mbG9vcihwYXJzZUludCh0aGlzLmlubmVyLnN0eWxlLm1pbldpZHRoKSAqIHNjYWxlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQgPSBtaW5IZWlnaHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5pbm5lci5zdHlsZS50cmFuc2Zvcm0gPSAndHJhbnNsYXRlKDBweCwgMHB4KSBzY2FsZSgnICsgc2NhbGUgKyAnKSc7XG4gICAgICAgICAgICAgICAgdGhpcy5zY2FsZUVsZW1lbnQuc3R5bGUubWluV2lkdGggPSB0aGlzLnNjYWxlRWxlbWVudC5zdHlsZS53aWR0aCA9IHdpZHRoICsgJ3B4JztcbiAgICAgICAgICAgICAgICB0aGlzLnNjYWxlRWxlbWVudC5zdHlsZS5taW5IZWlnaHQgPSB0aGlzLnNjYWxlRWxlbWVudC5zdHlsZS5oZWlnaHQgPSBoZWlnaHQgKyAncHgnO1xuICAgICAgICAgICAgICAgIC8qIFRPRE86IGhlcmUgc2Nyb2xsVG8gYmFzZWQgb24gd2hlcmUgdGhlIG1vdXNlIGN1cnNvciBpcyAqL1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogRGlzYWJsZXMgdGhlIHNjcm9sbCB3aGVlbCBvZiB0aGUgbW91c2VcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0geCAtIHRoZSB4LWNvb3JkaW5hdGVzXG4gICAgICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0geSAtIHRoZSB5LWNvb3JkaW5hdGVzXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHtib29sZWFufSAtIHdoZXRoZXIgdGhlIG5lYXJlc3QgcmVsYXRlZCBwYXJlbnQgaW5uZXIgZWxlbWVudCBpcyB0aGUgb25lIG9mIHRoaXMgb2JqZWN0IGluc3RhbmNlXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIFp3b29zaC5wcm90b3R5cGUuZWxlbWVudEJlaGluZEN1cnNvcklzTWUgPSBmdW5jdGlvbiAoeCwgeSkge1xuICAgICAgICAgICAgICAgIHZhciBlbGVtZW50QmVoaW5kQ3Vyc29yID0gZG9jdW1lbnQuZWxlbWVudEZyb21Qb2ludCh4LCB5KTtcbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBJZiB0aGUgZWxlbWVudCBkaXJlY3RseSBiZWhpbmQgdGhlIGN1cnNvciBpcyBhbiBvdXRlciBlbGVtZW50IHRocm93IG91dCwgYmVjYXVzZSB3aGVuIGNsaWNraW5nIG9uIGEgc2Nyb2xsYmFyXG4gICAgICAgICAgICAgICAgICogZnJvbSBhIGRpdiwgYSBkcmFnIG9mIHRoZSBwYXJlbnQgWndvb3NoIGVsZW1lbnQgaXMgaW5pdGlhdGVkLlxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmhhc0NsYXNzKGVsZW1lbnRCZWhpbmRDdXJzb3IsIHRoaXMuY2xhc3NPdXRlcikpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvKiBmaW5kIHRoZSBuZXh0IHBhcmVudCB3aGljaCBpcyBhbiBpbm5lciBlbGVtZW50ICovXG4gICAgICAgICAgICAgICAgd2hpbGUgKGVsZW1lbnRCZWhpbmRDdXJzb3IgJiYgIXRoaXMuaGFzQ2xhc3MoZWxlbWVudEJlaGluZEN1cnNvciwgdGhpcy5jbGFzc0lubmVyKSkge1xuICAgICAgICAgICAgICAgICAgICBlbGVtZW50QmVoaW5kQ3Vyc29yID0gZWxlbWVudEJlaGluZEN1cnNvci5wYXJlbnRFbGVtZW50O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5pbm5lciA9PT0gZWxlbWVudEJlaGluZEN1cnNvcjtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLmdldFRpbWVzdGFtcCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHdpbmRvdy5wZXJmb3JtYW5jZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKFwibm93XCIgaW4gd2luZG93LnBlcmZvcm1hbmNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gd2luZG93LnBlcmZvcm1hbmNlLm5vdygpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKFwid2Via2l0Tm93XCIgaW4gd2luZG93LnBlcmZvcm1hbmNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gd2luZG93LnBlcmZvcm1hbmNlLndlYmtpdE5vdygpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFNjcm9sbCBoYW5kbGVyIHRvIHRyaWdnZXIgdGhlIGN1c3RvbSBldmVudHNcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAcGFyYW0ge0V2ZW50fSBlIC0gVGhlIHNjcm9sbCBldmVudCBvYmplY3QgKFRPRE86IG5lZWRlZD8pXG4gICAgICAgICAgICAgKiBAdGhyb3dzIEV2ZW50IGNvbGxpZGVMZWZ0XG4gICAgICAgICAgICAgKiBAdGhyb3dzIEV2ZW50IGNvbGxpZGVSaWdodFxuICAgICAgICAgICAgICogQHRocm93cyBFdmVudCBjb2xsaWRlVG9wXG4gICAgICAgICAgICAgKiBAdGhyb3dzIEV2ZW50IGNvbGxpZGVCb3R0b21cbiAgICAgICAgICAgICAqIEByZXR1cm4ge3ZvaWR9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIFp3b29zaC5wcm90b3R5cGUub25TY3JvbGwgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgIHZhciB4ID0gdGhpcy5nZXRTY3JvbGxMZWZ0KCk7XG4gICAgICAgICAgICAgICAgdmFyIHkgPSB0aGlzLmdldFNjcm9sbFRvcCgpO1xuICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsTWF4TGVmdCA9ICh0aGlzLnNjcm9sbEVsZW1lbnQuc2Nyb2xsV2lkdGggLSB0aGlzLnNjcm9sbEVsZW1lbnQuY2xpZW50V2lkdGgpO1xuICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsTWF4VG9wID0gKHRoaXMuc2Nyb2xsRWxlbWVudC5zY3JvbGxIZWlnaHQgLSB0aGlzLnNjcm9sbEVsZW1lbnQuY2xpZW50SGVpZ2h0KTtcbiAgICAgICAgICAgICAgICAvLyB0aGUgY29sbGlkZUxlZnQgZXZlbnRcbiAgICAgICAgICAgICAgICBpZiAoeCA9PT0gMCAmJiAhdGhpcy50cmlnZ2VyZWQuY29sbGlkZUxlZnQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50cmlnZ2VyRXZlbnQodGhpcy5pbm5lciwgJ2NvbGxpZGUubGVmdCcpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLnRyaWdnZXJlZC5jb2xsaWRlTGVmdCA9IHggPT09IDA7XG4gICAgICAgICAgICAgICAgLy8gdGhlIGNvbGxpZGVUb3AgZXZlbnRcbiAgICAgICAgICAgICAgICBpZiAoeSA9PT0gMCAmJiAhdGhpcy50cmlnZ2VyZWQuY29sbGlkZVRvcCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnRyaWdnZXJFdmVudCh0aGlzLmlubmVyLCAnY29sbGlkZS50b3AnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy50cmlnZ2VyZWQuY29sbGlkZVRvcCA9IHkgPT09IDA7XG4gICAgICAgICAgICAgICAgLy8gdGhlIGNvbGxpZGVSaWdodCBldmVudFxuICAgICAgICAgICAgICAgIGlmICh4ID09PSB0aGlzLnNjcm9sbE1heExlZnQgJiYgIXRoaXMudHJpZ2dlcmVkLmNvbGxpZGVSaWdodCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnRyaWdnZXJFdmVudCh0aGlzLmlubmVyLCAnY29sbGlkZS5yaWdodCcpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLnRyaWdnZXJlZC5jb2xsaWRlUmlnaHQgPSB4ID09PSB0aGlzLnNjcm9sbE1heExlZnQ7XG4gICAgICAgICAgICAgICAgLy8gdGhlIGNvbGxpZGVCb3R0b20gZXZlbnRcbiAgICAgICAgICAgICAgICBpZiAoeSA9PT0gdGhpcy5zY3JvbGxNYXhUb3AgJiYgIXRoaXMudHJpZ2dlcmVkLmNvbGxpZGVCb3R0b20pIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50cmlnZ2VyRXZlbnQodGhpcy5pbm5lciwgJ2NvbGxpZGUuYm90dG9tJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMudHJpZ2dlcmVkLmNvbGxpZGVCb3R0b20gPSB5ID09PSB0aGlzLnNjcm9sbE1heFRvcDtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIHdpbmRvdyByZXNpemUgaGFuZGxlciB0byByZWNhbGN1bGF0ZSB0aGUgaW5uZXIgZGl2IG1pbldpZHRoIGFuZCBtaW5IZWlnaHRcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAcGFyYW0ge0V2ZW50fSBlIC0gVGhlIHdpbmRvdyByZXNpemUgZXZlbnQgb2JqZWN0IChUT0RPOiBuZWVkZWQ/KVxuICAgICAgICAgICAgICogQHJldHVybiB7dm9pZH1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgWndvb3NoLnByb3RvdHlwZS5vblJlc2l6ZSA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgICAgICAgICB2YXIgb25SZXNpemUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIF90aGlzLmlubmVyLnN0eWxlLm1pbldpZHRoID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMuaW5uZXIuc3R5bGUubWluSGVpZ2h0ID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgLyogdGFrZSBhd2F5IHRoZSBtYXJnaW4gdmFsdWVzIG9mIHRoZSBib2R5IGVsZW1lbnQgKi9cbiAgICAgICAgICAgICAgICAgICAgdmFyIHhEZWx0YSA9IHBhcnNlSW50KF90aGlzLmdldFN0eWxlKGRvY3VtZW50LmJvZHksICdtYXJnaW5MZWZ0JyksIDEwKSArIHBhcnNlSW50KF90aGlzLmdldFN0eWxlKGRvY3VtZW50LmJvZHksICdtYXJnaW5SaWdodCcpLCAxMCk7XG4gICAgICAgICAgICAgICAgICAgIHZhciB5RGVsdGEgPSBwYXJzZUludChfdGhpcy5nZXRTdHlsZShkb2N1bWVudC5ib2R5LCAnbWFyZ2luVG9wJyksIDEwKSArIHBhcnNlSW50KF90aGlzLmdldFN0eWxlKGRvY3VtZW50LmJvZHksICdtYXJnaW5Cb3R0b20nKSwgMTApO1xuICAgICAgICAgICAgICAgICAgICAvL1RPRE86IHdpdGggdGhpcy5nZXRCb3JkZXIoKVxuICAgICAgICAgICAgICAgICAgICBfdGhpcy5pbm5lci5zdHlsZS5taW5XaWR0aCA9IChkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsV2lkdGggLSB4RGVsdGEpICsgJ3B4JztcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMuaW5uZXIuc3R5bGUubWluSGVpZ2h0ID0gKGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zY3JvbGxIZWlnaHQgLSB5RGVsdGEgLSAxMDApICsgJ3B4JzsgLy9UT0RPOiBXVEY/IHdoeSAtMTAwIGZvciBJRTg/XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBUcmlnZ2VyIHRoZSBmdW5jdGlvbiBvbmx5IHdoZW4gdGhlIGNsaWVudFdpZHRoIG9yIGNsaWVudEhlaWdodCByZWFsbHkgaGF2ZSBjaGFuZ2VkLlxuICAgICAgICAgICAgICAgICAqIElFOCByZXNpZGVzIGluIGFuIGluZmluaXR5IGxvb3AgYWx3YXlzIHRyaWdnZXJpbmcgdGhlIHJlc2l0ZSBldmVudCB3aGVuIGFsdGVyaW5nIGNzcy5cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5vbGRDbGllbnRXaWR0aCAhPT0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudFdpZHRoIHx8XG4gICAgICAgICAgICAgICAgICAgIHRoaXMub2xkQ2xpZW50SGVpZ2h0ICE9PSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50SGVpZ2h0KSB7XG4gICAgICAgICAgICAgICAgICAgIHdpbmRvdy5jbGVhclRpbWVvdXQodGhpcy5yZXNpemVUaW1lb3V0KTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yZXNpemVUaW1lb3V0ID0gd2luZG93LnNldFRpbWVvdXQob25SZXNpemUsIDEwKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLyogd3JpdGUgZG93biB0aGUgb2xkIGNsaWVudFdpZHRoIGFuZCBjbGllbnRIZWlnaHQgZm9yIHRoZSBhYm92ZSBjb21wYXJzaW9uICovXG4gICAgICAgICAgICAgICAgdGhpcy5vbGRDbGllbnRXaWR0aCA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRXaWR0aDtcbiAgICAgICAgICAgICAgICB0aGlzLm9sZENsaWVudEhlaWdodCA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRIZWlnaHQ7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgWndvb3NoLnByb3RvdHlwZS5jbGVhclRleHRTZWxlY3Rpb24gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKHdpbmRvdy5nZXRTZWxlY3Rpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgd2luZG93LmdldFNlbGVjdGlvbigpLnJlbW92ZUFsbFJhbmdlcygpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoZG9jdW1lbnQuc2VsZWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIGRvY3VtZW50LnNlbGVjdGlvbi5lbXB0eSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEJyb3dzZXIgaW5kZXBlbmRlbnQgZXZlbnQgcmVnaXN0cmF0aW9uXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQHBhcmFtIHthbnl9IG9iaiAtIFRoZSBIVE1MRWxlbWVudCB0byBhdHRhY2ggdGhlIGV2ZW50IHRvXG4gICAgICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnQgLSBUaGUgZXZlbnQgbmFtZSB3aXRob3V0IHRoZSBsZWFkaW5nIFwib25cIlxuICAgICAgICAgICAgICogQHBhcmFtIHsoZTogRXZlbnQpID0+IHZvaWR9IGNhbGxiYWNrIC0gQSBjYWxsYmFjayBmdW5jdGlvbiB0byBhdHRhY2ggdG8gdGhlIGV2ZW50XG4gICAgICAgICAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IGJvdW5kIC0gd2hldGhlciB0byBiaW5kIHRoZSBjYWxsYmFjayB0byB0aGUgb2JqZWN0IGluc3RhbmNlIG9yIG5vdFxuICAgICAgICAgICAgICogQHJldHVybiB7dm9pZH1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgWndvb3NoLnByb3RvdHlwZS5hZGRFdmVudExpc3RlbmVyID0gZnVuY3Rpb24gKG9iaiwgZXZlbnQsIGNhbGxiYWNrLCBib3VuZCkge1xuICAgICAgICAgICAgICAgIGlmIChib3VuZCA9PT0gdm9pZCAwKSB7IGJvdW5kID0gdHJ1ZTsgfVxuICAgICAgICAgICAgICAgIHZhciBib3VuZENhbGxiYWNrID0gYm91bmQgPyBjYWxsYmFjay5iaW5kKHRoaXMpIDogY2FsbGJhY2s7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBvYmouYWRkRXZlbnRMaXN0ZW5lciA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICBpZiAobWFwRXZlbnRzWydvbicgKyBldmVudF0gJiYgb2JqLnRhZ05hbWUgPT09IFwiQk9EWVwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBvYmogPSBtYXBFdmVudHNbJ29uJyArIGV2ZW50XTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBvYmouYWRkRXZlbnRMaXN0ZW5lcihldmVudCwgYm91bmRDYWxsYmFjayk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHR5cGVvZiBvYmouYXR0YWNoRXZlbnQgPT09ICdvYmplY3QnICYmIGh0bWxFdmVudHNbJ29uJyArIGV2ZW50XSkge1xuICAgICAgICAgICAgICAgICAgICBvYmouYXR0YWNoRXZlbnQoJ29uJyArIGV2ZW50LCBib3VuZENhbGxiYWNrKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAodHlwZW9mIG9iai5hdHRhY2hFdmVudCA9PT0gJ29iamVjdCcgJiYgbWFwRXZlbnRzWydvbicgKyBldmVudF0pIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9iai50YWdOYW1lID09PSBcIkJPRFlcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHAgPSAnb24nICsgZXZlbnQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBleGFtcGxlOiB3aW5kb3cub25zY3JvbGwgPSBib3VuZENhbGxiYWNrICovXG4gICAgICAgICAgICAgICAgICAgICAgICBtYXBFdmVudHNbcF1bcF0gPSBib3VuZENhbGxiYWNrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgLyogVE9ETzogb2JqLm9uc2Nyb2xsID8/ICovXG4gICAgICAgICAgICAgICAgICAgICAgICBvYmoub25zY3JvbGwgPSBib3VuZENhbGxiYWNrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHR5cGVvZiBvYmouYXR0YWNoRXZlbnQgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAgICAgICAgIG9ialtldmVudF0gPSAxO1xuICAgICAgICAgICAgICAgICAgICBib3VuZENhbGxiYWNrID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIFRPRE86IGUgaXMgdGhlIG9ucHJvcGVydHljaGFuZ2UgZXZlbnQgbm90IG9uZSBvZiB0aGUgY3VzdG9tIGV2ZW50IG9iamVjdHMgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlLnByb3BlcnR5TmFtZSA9PT0gZXZlbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgb2JqLmF0dGFjaEV2ZW50KCdvbnByb3BlcnR5Y2hhbmdlJywgYm91bmRDYWxsYmFjayk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBvYmpbJ29uJyArIGV2ZW50XSA9IGJvdW5kQ2FsbGJhY2s7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICghdGhpcy5jdXN0b21FdmVudHNbZXZlbnRdKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY3VzdG9tRXZlbnRzW2V2ZW50XSA9IFtdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLmN1c3RvbUV2ZW50c1tldmVudF0ucHVzaChbY2FsbGJhY2ssIGJvdW5kQ2FsbGJhY2tdKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEJyb3dzZXIgaW5kZXBlbmRlbnQgZXZlbnQgZGVyZWdpc3RyYXRpb25cbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAcGFyYW0ge2FueX0gb2JqIC0gVGhlIEhUTUxFbGVtZW50IG9yIHdpbmRvdyB3aG9zZSBldmVudCBzaG91bGQgYmUgZGV0YWNoZWRcbiAgICAgICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBldmVudCAtIFRoZSBldmVudCBuYW1lIHdpdGhvdXQgdGhlIGxlYWRpbmcgXCJvblwiXG4gICAgICAgICAgICAgKiBAcGFyYW0geyhlOiBFdmVudCkgPT4gdm9pZH0gY2FsbGJhY2sgLSBUaGUgY2FsbGJhY2sgZnVuY3Rpb24gd2hlbiBhdHRhY2hlZFxuICAgICAgICAgICAgICogQHJldHVybiB7dm9pZH1cbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAVE9ETzogdW5yZWdpc3RlcmluZyBvZiBtYXBFdmVudHNcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgWndvb3NoLnByb3RvdHlwZS5yZW1vdmVFdmVudExpc3RlbmVyID0gZnVuY3Rpb24gKG9iaiwgZXZlbnQsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50IGluIHRoaXMuY3VzdG9tRXZlbnRzKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgaW4gdGhpcy5jdXN0b21FdmVudHNbZXZlbnRdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBpZiB0aGUgZXZlbnQgd2FzIGZvdW5kIGluIHRoZSBhcnJheSBieSBpdHMgY2FsbGJhY2sgcmVmZXJlbmNlICovXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5jdXN0b21FdmVudHNbZXZlbnRdW2ldWzBdID09PSBjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIHJlbW92ZSB0aGUgbGlzdGVuZXIgZnJvbSB0aGUgYXJyYXkgYnkgaXRzIGJvdW5kIGNhbGxiYWNrIHJlZmVyZW5jZSAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrID0gdGhpcy5jdXN0b21FdmVudHNbZXZlbnRdW2ldWzFdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY3VzdG9tRXZlbnRzW2V2ZW50XS5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBvYmoucmVtb3ZlRXZlbnRMaXN0ZW5lciA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICBvYmoucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudCwgY2FsbGJhY2spO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmICh0eXBlb2Ygb2JqLmRldGFjaEV2ZW50ID09PSAnb2JqZWN0JyAmJiBodG1sRXZlbnRzWydvbicgKyBldmVudF0pIHtcbiAgICAgICAgICAgICAgICAgICAgb2JqLmRldGFjaEV2ZW50KCdvbicgKyBldmVudCwgY2FsbGJhY2spO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmICh0eXBlb2Ygb2JqLmRldGFjaEV2ZW50ID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgICAgICAgICBvYmouZGV0YWNoRXZlbnQoJ29ucHJvcGVydHljaGFuZ2UnLCBjYWxsYmFjayk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBvYmpbJ29uJyArIGV2ZW50XSA9IG51bGw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQnJvd3NlciBpbmRlcGVuZGVudCBldmVudCB0cmlnZ2VyIGZ1bmN0aW9uXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gb2JqIC0gVGhlIEhUTUxFbGVtZW50IHdoaWNoIHRyaWdnZXJzIHRoZSBldmVudFxuICAgICAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50TmFtZSAtIFRoZSBldmVudCBuYW1lIHdpdGhvdXQgdGhlIGxlYWRpbmcgXCJvblwiXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHt2b2lkfVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLnRyaWdnZXJFdmVudCA9IGZ1bmN0aW9uIChvYmosIGV2ZW50TmFtZSkge1xuICAgICAgICAgICAgICAgIHZhciBldmVudDtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHdpbmRvdy5DdXN0b21FdmVudCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICBldmVudCA9IG5ldyBDdXN0b21FdmVudChldmVudE5hbWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmICh0eXBlb2YgZG9jdW1lbnQuY3JlYXRlRXZlbnQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudChcIkhUTUxFdmVudHNcIik7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LmluaXRFdmVudChldmVudE5hbWUsIHRydWUsIHRydWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChkb2N1bWVudC5jcmVhdGVFdmVudE9iamVjdCkge1xuICAgICAgICAgICAgICAgICAgICBldmVudCA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50T2JqZWN0KCk7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LmV2ZW50VHlwZSA9IGV2ZW50TmFtZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZXZlbnQuZXZlbnROYW1lID0gZXZlbnROYW1lO1xuICAgICAgICAgICAgICAgIGlmIChvYmouZGlzcGF0Y2hFdmVudCkge1xuICAgICAgICAgICAgICAgICAgICBvYmouZGlzcGF0Y2hFdmVudChldmVudCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKG9ialtldmVudE5hbWVdKSB7XG4gICAgICAgICAgICAgICAgICAgIG9ialtldmVudE5hbWVdKys7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKG9iai5maXJlRXZlbnQgJiYgaHRtbEV2ZW50c1snb24nICsgZXZlbnROYW1lXSkge1xuICAgICAgICAgICAgICAgICAgICBvYmouZmlyZUV2ZW50KCdvbicgKyBldmVudC5ldmVudFR5cGUsIGV2ZW50KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAob2JqW2V2ZW50TmFtZV0pIHtcbiAgICAgICAgICAgICAgICAgICAgb2JqW2V2ZW50TmFtZV0oKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAob2JqWydvbicgKyBldmVudE5hbWVdKSB7XG4gICAgICAgICAgICAgICAgICAgIG9ialsnb24nICsgZXZlbnROYW1lXSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLmFkZENsYXNzID0gZnVuY3Rpb24gKGVsLCBjc3NDbGFzcykge1xuICAgICAgICAgICAgICAgIGlmICghdGhpcy5oYXNDbGFzcyhlbCwgY3NzQ2xhc3MpKSB7XG4gICAgICAgICAgICAgICAgICAgIGVsLmNsYXNzTmFtZSArPSBcIiBcIiArIGNzc0NsYXNzICsgXCIgXCI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIFp3b29zaC5wcm90b3R5cGUucmVtb3ZlQ2xhc3MgPSBmdW5jdGlvbiAoZWwsIGNzc0NsYXNzKSB7XG4gICAgICAgICAgICAgICAgdmFyIHJlID0gbmV3IFJlZ0V4cChcIiBcIiArIGNzc0NsYXNzICsgXCIgXCIsICdnJyk7XG4gICAgICAgICAgICAgICAgZWwuY2xhc3NOYW1lID0gZWwuY2xhc3NOYW1lLnJlcGxhY2UocmUsICcnKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLmhhc0NsYXNzID0gZnVuY3Rpb24gKGVsLCBjc3NDbGFzcykge1xuICAgICAgICAgICAgICAgIHZhciByZSA9IG5ldyBSZWdFeHAoXCIgXCIgKyBjc3NDbGFzcyArIFwiIFwiKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZWwuY2xhc3NOYW1lLm1hdGNoKHJlKSAhPT0gbnVsbDtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEdldCBhIGNzcyBzdHlsZSBwcm9wZXJ0eSB2YWx1ZSBicm93c2VyIGluZGVwZW5kZW50XG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWwgLSBUaGUgSFRNTEVsZW1lbnQgdG8gbG9va3VwXG4gICAgICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30ganNQcm9wZXJ0eSAtIFRoZSBjc3MgcHJvcGVydHkgbmFtZSBpbiBqYXZhc2NyaXB0IGluIGNhbWVsQ2FzZSAoZS5nLiBcIm1hcmdpbkxlZnRcIiwgbm90IFwibWFyZ2luLWxlZnRcIilcbiAgICAgICAgICAgICAqIEByZXR1cm4ge3N0cmluZ30gLSB0aGUgcHJvcGVydHkgdmFsdWVcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgWndvb3NoLnByb3RvdHlwZS5nZXRTdHlsZSA9IGZ1bmN0aW9uIChlbCwganNQcm9wZXJ0eSkge1xuICAgICAgICAgICAgICAgIHZhciBjc3NQcm9wZXJ0eSA9IGpzUHJvcGVydHkucmVwbGFjZSgvKFtBLVpdKS9nLCBcIi0kMVwiKS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2Ygd2luZG93LmdldENvbXB1dGVkU3R5bGUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKGVsKS5nZXRQcm9wZXJ0eVZhbHVlKGNzc1Byb3BlcnR5KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBlbC5jdXJyZW50U3R5bGVbanNQcm9wZXJ0eV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIFp3b29zaC5wcm90b3R5cGUuY2xlYXJUaW1lb3V0cyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy50aW1lb3V0cykge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpIGluIHRoaXMudGltZW91dHMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnRpbWVvdXRzLmhhc093blByb3BlcnR5KGkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMudGltZW91dHNbaV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnRpbWVvdXRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudGltZW91dHMgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVtb3ZlRXZlbnRMaXN0ZW5lcih0aGlzLmlubmVyLCAnY29sbGlkZS5sZWZ0JywgdGhpcy5jbGVhckxpc3RlbmVyTGVmdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlbW92ZUV2ZW50TGlzdGVuZXIodGhpcy5pbm5lciwgJ2NvbGxpZGUucmlnaHQnLCB0aGlzLmNsZWFyTGlzdGVuZXJSaWdodCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlbW92ZUV2ZW50TGlzdGVuZXIodGhpcy5pbm5lciwgJ2NvbGxpZGUudG9wJywgdGhpcy5jbGVhckxpc3RlbmVyVG9wKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVtb3ZlRXZlbnRMaXN0ZW5lcih0aGlzLmlubmVyLCAnY29sbGlkZS5ib3R0b20nLCB0aGlzLmNsZWFyTGlzdGVuZXJCb3R0b20pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogTW91c2UgZG93biBoYW5kbGVyXG4gICAgICAgICAgICAgKiBSZWdpc3RlcnMgdGhlIG1vdXNlbW92ZSBhbmQgbW91c2V1cCBoYW5kbGVycyBhbmQgZmluZHMgdGhlIG5leHQgaW5uZXIgZWxlbWVudFxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBwYXJhbSB7TW91c2VFdmVudH0gZSAtIFRoZSBtb3VzZSBkb3duIGV2ZW50IG9iamVjdFxuICAgICAgICAgICAgICogQHJldHVybiB7dm9pZH1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgWndvb3NoLnByb3RvdHlwZS5tb3VzZURvd24gPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgICAgICAgICAgdGhpcy5jbGVhclRpbWVvdXRzKCk7XG4gICAgICAgICAgICAgICAgLyogZHJhZyBvbmx5IGlmIHRoZSBsZWZ0IG1vdXNlIGJ1dHRvbiB3YXMgcHJlc3NlZCAqL1xuICAgICAgICAgICAgICAgIGlmICgoXCJ3aGljaFwiIGluIGUgJiYgZS53aGljaCA9PT0gMSkgfHwgKHR5cGVvZiBlLndoaWNoID09PSAndW5kZWZpbmVkJyAmJiBcImJ1dHRvblwiIGluIGUgJiYgZS5idXR0b24gPT09IDEpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmVsZW1lbnRCZWhpbmRDdXJzb3JJc01lKGUuY2xpZW50WCwgZS5jbGllbnRZKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLyogcHJldmVudCBpbWFnZSBkcmFnZ2luZyBhY3Rpb24gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBpbWdzID0gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvckFsbCgnaW1nJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGltZ3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbWdzW2ldLm9uZHJhZ3N0YXJ0ID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gZmFsc2U7IH07IC8vTVNJRVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgLyogc2VhcmNoIHRoZSBET00gZm9yIGV4Y2x1ZGUgZWxlbWVudHMgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMuZHJhZ09wdGlvbnMuZXhjbHVkZS5sZW5ndGggIT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBkcmFnIG9ubHkgaWYgdGhlIG1vdXNlIGNsaWNrZWQgb24gYW4gYWxsb3dlZCBlbGVtZW50ICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGVsID0gZG9jdW1lbnQuZWxlbWVudEZyb21Qb2ludChlLmNsaWVudFgsIGUuY2xpZW50WSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGV4Y2x1ZGVFbGVtZW50cyA9IHRoaXMuY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3JBbGwodGhpcy5vcHRpb25zLmRyYWdPcHRpb25zLmV4Y2x1ZGUuam9pbignLCAnKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogbG9vcCB0aHJvdWdoIGFsbCBwYXJlbnQgZWxlbWVudHMgdW50aWwgd2UgZW5jb3VudGVyIGFuIGlubmVyIGRpdiBvciBubyBtb3JlIHBhcmVudHMgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aGlsZSAoZWwgJiYgIXRoaXMuaGFzQ2xhc3MoZWwsIHRoaXMuY2xhc3NJbm5lcikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogY29tcGFyZSBlYWNoIHBhcmVudCwgaWYgaXQgaXMgaW4gdGhlIGV4Y2x1ZGUgbGlzdCAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBhID0gMDsgYSA8IGV4Y2x1ZGVFbGVtZW50cy5sZW5ndGg7IGErKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogYmFpbCBvdXQgaWYgYW4gZWxlbWVudCBtYXRjaGVzICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXhjbHVkZUVsZW1lbnRzW2FdID09PSBlbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbCA9IGVsLnBhcmVudEVsZW1lbnQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gc2VhcmNoIHRoZSBET00gZm9yIG9ubHkgZWxlbWVudHMsIGJ1dCBvbmx5IGlmIHRoZXJlIGFyZSBlbGVtZW50cyBzZXRcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qaWYgKHRoaXMub3B0aW9ucy5kcmFnT3B0aW9ucy5vbmx5Lmxlbmd0aCAhPT0gMCl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBvbmx5RWxlbWVudHMgPSB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yQWxsKHRoaXMub3B0aW9ucy5kcmFnT3B0aW9ucy5vbmx5LmpvaW4oJywgJykpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBsb29wIHRocm91Z2ggdGhlIG5vZGVsaXN0IGFuZCBjaGVjayBmb3Igb3VyIGVsZW1lbnRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGZvdW5kID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZXhjbHVkZUVsZW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG9ubHlFbGVtZW50c1tpXSA9PT0gZWwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvdW5kID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZm91bmQgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9Ki9cbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkQ2xhc3MoZG9jdW1lbnQuYm9keSwgdGhpcy5jbGFzc0dyYWJiaW5nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZHJhZ2dpbmcgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgLyogbm90ZSB0aGUgb3JpZ2luIHBvc2l0aW9ucyAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kcmFnT3JpZ2luTGVmdCA9IGUuY2xpZW50WDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZHJhZ09yaWdpblRvcCA9IGUuY2xpZW50WTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZHJhZ09yaWdpblNjcm9sbExlZnQgPSB0aGlzLmdldFNjcm9sbExlZnQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZHJhZ09yaWdpblNjcm9sbFRvcCA9IHRoaXMuZ2V0U2Nyb2xsVG9wKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBpdCBsb29rcyBzdHJhbmdlIGlmIHNjcm9sbC1iZWhhdmlvciBpcyBzZXQgdG8gc21vb3RoICovXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBhcmVudE9yaWdpblN0eWxlID0gdGhpcy5pbm5lci5wYXJlbnRFbGVtZW50LnN0eWxlLmNzc1RleHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHRoaXMuaW5uZXIucGFyZW50RWxlbWVudC5zdHlsZS5zZXRQcm9wZXJ0eSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaW5uZXIucGFyZW50RWxlbWVudC5zdHlsZS5zZXRQcm9wZXJ0eSgnc2Nyb2xsLWJlaGF2aW9yJywgJ2F1dG8nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlLnByZXZlbnREZWZhdWx0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZS5yZXR1cm5WYWx1ZSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy52eCA9IFtdO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy52eSA9IFtdO1xuICAgICAgICAgICAgICAgICAgICAgICAgLyogcmVnaXN0ZXIgdGhlIGV2ZW50IGhhbmRsZXJzICovXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm1vdXNlTW92ZUhhbmRsZXIgPSB0aGlzLm1vdXNlTW92ZS5iaW5kKHRoaXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCwgJ21vdXNlbW92ZScsIHRoaXMubW91c2VNb3ZlSGFuZGxlcik7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm1vdXNlVXBIYW5kbGVyID0gZnVuY3Rpb24gKGUpIHsgcmV0dXJuIF90aGlzLm1vdXNlVXAoZSk7IH07XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIoZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LCAnbW91c2V1cCcsIHRoaXMubW91c2VVcEhhbmRsZXIpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogTW91c2UgdXAgaGFuZGxlclxuICAgICAgICAgICAgICogRGVyZWdpc3RlcnMgdGhlIG1vdXNlbW92ZSBhbmQgbW91c2V1cCBoYW5kbGVyc1xuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBwYXJhbSB7TW91c2VFdmVudH0gZSAtIFRoZSBtb3VzZSB1cCBldmVudCBvYmplY3RcbiAgICAgICAgICAgICAqIEByZXR1cm4ge3ZvaWR9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIFp3b29zaC5wcm90b3R5cGUubW91c2VVcCA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgLyogVE9ETzogcmVzdG9yZSBvcmlnaW5hbCBwb3NpdGlvbiB2YWx1ZSAqL1xuICAgICAgICAgICAgICAgIHRoaXMuaW5uZXIuc3R5bGUucG9zaXRpb24gPSAnJztcbiAgICAgICAgICAgICAgICB0aGlzLmlubmVyLnN0eWxlLnRvcCA9IG51bGw7XG4gICAgICAgICAgICAgICAgdGhpcy5pbm5lci5zdHlsZS5sZWZ0ID0gbnVsbDtcbiAgICAgICAgICAgICAgICB0aGlzLnByZXNlbnQgPSAodGhpcy5nZXRUaW1lc3RhbXAoKSAvIDEwMDApOyAvL2luIHNlY29uZHNcbiAgICAgICAgICAgICAgICB2YXIgeCA9IHRoaXMuZHJhZ09yaWdpbkxlZnQgKyB0aGlzLmRyYWdPcmlnaW5TY3JvbGxMZWZ0IC0gZS5jbGllbnRYO1xuICAgICAgICAgICAgICAgIHZhciB5ID0gdGhpcy5kcmFnT3JpZ2luVG9wICsgdGhpcy5kcmFnT3JpZ2luU2Nyb2xsVG9wIC0gZS5jbGllbnRZO1xuICAgICAgICAgICAgICAgIF9hID0gdGhpcy5nZXRSZWFsQ29vcmRzKHgsIHkpLCB4ID0gX2FbMF0sIHkgPSBfYVsxXTtcbiAgICAgICAgICAgICAgICB0aGlzLnJlbW92ZUNsYXNzKGRvY3VtZW50LmJvZHksIHRoaXMuY2xhc3NHcmFiYmluZyk7XG4gICAgICAgICAgICAgICAgdGhpcy5pbm5lci5wYXJlbnRFbGVtZW50LnN0eWxlLmNzc1RleHQgPSB0aGlzLnBhcmVudE9yaWdpblN0eWxlO1xuICAgICAgICAgICAgICAgIHRoaXMuZHJhZ2dpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB0aGlzLnJlbW92ZUV2ZW50TGlzdGVuZXIoZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LCAnbW91c2Vtb3ZlJywgdGhpcy5tb3VzZU1vdmVIYW5kbGVyKTtcbiAgICAgICAgICAgICAgICB0aGlzLnJlbW92ZUV2ZW50TGlzdGVuZXIoZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LCAnbW91c2V1cCcsIHRoaXMubW91c2VVcEhhbmRsZXIpO1xuICAgICAgICAgICAgICAgIGlmICh5ICE9PSB0aGlzLmdldFNjcm9sbFRvcCgpIHx8IHggIT09IHRoaXMuZ2V0U2Nyb2xsTGVmdCgpKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciB0ID0gdGhpcy5wcmVzZW50IC0gKHRoaXMucGFzdCA/IHRoaXMucGFzdCA6IHRoaXMucHJlc2VudCk7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0ID4gMC4wNSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLyoganVzdCBhbGlnbiB0byB0aGUgZ3JpZCBpZiB0aGUgbW91c2UgbGVmdCB1bm1vdmVkIGZvciBtb3JlIHRoYW4gMC4wNSBzZWNvbmRzICovXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNjcm9sbFRvKHgsIHksIHRoaXMub3B0aW9ucy5kcmFnT3B0aW9ucy5mYWRlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLmRyYWdPcHRpb25zLmZhZGUgJiYgdHlwZW9mIHRoaXMudnggIT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiB0aGlzLnZ5ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgdngsIHZ5O1xuICAgICAgICAgICAgICAgICAgICBfYiA9IHRoaXMuY2FsY0F2ZXJhZ2VWZWxvY2l0eSgwLjEpLCB2eCA9IF9iWzBdLCB2eSA9IF9iWzFdO1xuICAgICAgICAgICAgICAgICAgICAvKiB2IHNob3VsZCBub3QgZXhjZWVkIHZNYXggb3IgLXZNYXggLT4gd291bGQgYmUgdG9vIGZhc3QgYW5kIHNob3VsZCBleGNlZWQgdk1pbiBvciAtdk1pbiAqL1xuICAgICAgICAgICAgICAgICAgICB2YXIgdk1heCA9IHRoaXMub3B0aW9ucy5kcmFnT3B0aW9ucy5tYXhTcGVlZDtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHZNaW4gPSB0aGlzLm9wdGlvbnMuZHJhZ09wdGlvbnMubWluU3BlZWQ7XG4gICAgICAgICAgICAgICAgICAgIC8qIGlmIHRoZSBzcGVlZCBpcyBub3Qgd2l0aG91dCBib3VuZCBmb3IgZmFkZSwganVzdCBkbyBhIHJlZ3VsYXIgc2Nyb2xsIHdoZW4gdGhlcmUgaXMgYSBncmlkKi9cbiAgICAgICAgICAgICAgICAgICAgaWYgKHZ5IDwgdk1pbiAmJiB2eSA+IC12TWluICYmIHZ4IDwgdk1pbiAmJiB2eCA+IC12TWluKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLmdyaWRZID4gMSB8fCB0aGlzLm9wdGlvbnMuZ3JpZFggPiAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zY3JvbGxUbyh4LCB5KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB2eCA9ICh2eCA8PSB2TWF4ICYmIHZ4ID49IC12TWF4KSA/IHZ4IDogKHZ4ID4gMCA/IHZNYXggOiAtdk1heCk7XG4gICAgICAgICAgICAgICAgICAgIHZ5ID0gKHZ5IDw9IHZNYXggJiYgdnkgPj0gLXZNYXgpID8gdnkgOiAodnkgPiAwID8gdk1heCA6IC12TWF4KTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGF4ID0gKHZ4ID4gMCA/IC0xIDogMSkgKiB0aGlzLm9wdGlvbnMuZHJhZ09wdGlvbnMuYnJha2VTcGVlZDtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGF5ID0gKHZ5ID4gMCA/IC0xIDogMSkgKiB0aGlzLm9wdGlvbnMuZHJhZ09wdGlvbnMuYnJha2VTcGVlZDtcbiAgICAgICAgICAgICAgICAgICAgeCA9ICgoMCAtIE1hdGgucG93KHZ4LCAyKSkgLyAoMiAqIGF4KSkgKyB0aGlzLmdldFNjcm9sbExlZnQoKTtcbiAgICAgICAgICAgICAgICAgICAgeSA9ICgoMCAtIE1hdGgucG93KHZ5LCAyKSkgLyAoMiAqIGF5KSkgKyB0aGlzLmdldFNjcm9sbFRvcCgpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNjcm9sbFRvKHgsIHkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLyogaW4gYWxsIG90aGVyIGNhc2VzLCBkbyBhIHJlZ3VsYXIgc2Nyb2xsICovXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsVG8oeCwgeSwgdGhpcy5vcHRpb25zLmRyYWdPcHRpb25zLmZhZGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgX2EsIF9iO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIFp3b29zaC5wcm90b3R5cGUuY2FsY0F2ZXJhZ2VWZWxvY2l0eSA9IGZ1bmN0aW9uICh0aW1lU3Bhbikge1xuICAgICAgICAgICAgICAgIHZhciBwcmVzZW50ID0gKHRoaXMuZ2V0VGltZXN0YW1wKCkgLyAxMDAwKTtcbiAgICAgICAgICAgICAgICB2YXIgZGVsdGFULCBkZWx0YVN4LCBkZWx0YVN5LCBsYXN0RGVsdGFTeCwgbGFzdERlbHRhU3k7XG4gICAgICAgICAgICAgICAgZGVsdGFUID0gZGVsdGFTeCA9IGRlbHRhU3kgPSBsYXN0RGVsdGFTeCA9IGxhc3REZWx0YVN5ID0gMDtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpIGluIHRoaXMudnkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMudnkuaGFzT3duUHJvcGVydHkoaSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwYXJzZUZsb2F0KGkpID4gKHByZXNlbnQgLSB0aW1lU3BhbikgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlb2YgbGFzdFQgIT09ICd1bmRlZmluZWQnICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZW9mIGxhc3RTeCAhPT0gJ3VuZGVmaW5lZCcgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlb2YgbGFzdFN5ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbHRhVCArPSBwYXJzZUZsb2F0KGkpIC0gbGFzdFQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGFzdERlbHRhU3ggPSB0aGlzLnZ4W2ldIC0gbGFzdFN4O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxhc3REZWx0YVN5ID0gdGhpcy52eVtpXSAtIGxhc3RTeTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWx0YVN4ICs9IE1hdGguYWJzKGxhc3REZWx0YVN4KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWx0YVN5ICs9IE1hdGguYWJzKGxhc3REZWx0YVN5KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBsYXN0VCA9IHBhcnNlRmxvYXQoaSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbGFzdFN4ID0gdGhpcy52eFtpXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBsYXN0U3kgPSB0aGlzLnZ5W2ldO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciB2eCA9IGRlbHRhVCA9PT0gMCA/IDAgOiBsYXN0RGVsdGFTeCA+IDAgPyBkZWx0YVN4IC8gZGVsdGFUIDogZGVsdGFTeCAvIC1kZWx0YVQ7XG4gICAgICAgICAgICAgICAgdmFyIHZ5ID0gZGVsdGFUID09PSAwID8gMCA6IGxhc3REZWx0YVN5ID4gMCA/IGRlbHRhU3kgLyBkZWx0YVQgOiBkZWx0YVN5IC8gLWRlbHRhVDtcbiAgICAgICAgICAgICAgICByZXR1cm4gW3Z4LCB2eV07XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBDYWxjdWxhdGVzIHRoZSByb3VuZGVkIGFuZCBzY2FsZWQgY29vcmRpbmF0ZXMuXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IHggLSB0aGUgeC1jb29yZGluYXRlXG4gICAgICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0geSAtIHRoZSB5LWNvb3JkaW5hdGVcbiAgICAgICAgICAgICAqIEByZXR1cm4ge2FycmF5fSBbeCwgeV0gLSB0aGUgZmluYWwgY29vcmRpbmF0ZXNcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgWndvb3NoLnByb3RvdHlwZS5nZXRSZWFsQ29vcmRzID0gZnVuY3Rpb24gKHgsIHkpIHtcbiAgICAgICAgICAgICAgICAvL3N0aWNrIHRoZSBlbGVtZW50IHRvIHRoZSBncmlkLCBpZiBncmlkIGVxdWFscyAxIHRoZSB2YWx1ZSBkb2VzIG5vdCBjaGFuZ2VcbiAgICAgICAgICAgICAgICB4ID0gTWF0aC5yb3VuZCh4IC8gKHRoaXMub3B0aW9ucy5ncmlkWCAqIHRoaXMuZ2V0U2NhbGUoKSkpICogKHRoaXMub3B0aW9ucy5ncmlkWCAqIHRoaXMuZ2V0U2NhbGUoKSk7XG4gICAgICAgICAgICAgICAgeSA9IE1hdGgucm91bmQoeSAvICh0aGlzLm9wdGlvbnMuZ3JpZFkgKiB0aGlzLmdldFNjYWxlKCkpKSAqICh0aGlzLm9wdGlvbnMuZ3JpZFkgKiB0aGlzLmdldFNjYWxlKCkpO1xuICAgICAgICAgICAgICAgIHZhciBzY3JvbGxNYXhMZWZ0ID0gKHRoaXMuc2Nyb2xsRWxlbWVudC5zY3JvbGxXaWR0aCAtIHRoaXMuc2Nyb2xsRWxlbWVudC5jbGllbnRXaWR0aCk7XG4gICAgICAgICAgICAgICAgdmFyIHNjcm9sbE1heFRvcCA9ICh0aGlzLnNjcm9sbEVsZW1lbnQuc2Nyb2xsSGVpZ2h0IC0gdGhpcy5zY3JvbGxFbGVtZW50LmNsaWVudEhlaWdodCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgICAgICAgICAgKHggPiBzY3JvbGxNYXhMZWZ0KSA/IHNjcm9sbE1heExlZnQgOiB4LFxuICAgICAgICAgICAgICAgICAgICAoeSA+IHNjcm9sbE1heFRvcCkgPyBzY3JvbGxNYXhUb3AgOiB5XG4gICAgICAgICAgICAgICAgXTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLnRpbWVkU2Nyb2xsID0gZnVuY3Rpb24gKHgsIHksIHQpIHtcbiAgICAgICAgICAgICAgICB2YXIgbWUgPSB0aGlzO1xuICAgICAgICAgICAgICAgIHRoaXMudGltZW91dHMucHVzaChzZXRUaW1lb3V0KChmdW5jdGlvbiAoeCwgeSwgbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lLnNldFNjcm9sbFRvcCh5KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lLnNldFNjcm9sbExlZnQoeCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBtZS5vcmlnaW5TY3JvbGxMZWZ0ID0geDtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lLm9yaWdpblNjcm9sbFRvcCA9IHk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfSh4LCB5LCBtZSkpLCB0KSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBDYWxjdWxhdGVzIGVhY2ggc3RlcCBvZiBhIHNjcm9sbCBmYWRlb3V0IGFuaW1hdGlvbiBiYXNlZCBvbiB0aGUgaW5pdGlhbCB2ZWxvY2l0eS5cbiAgICAgICAgICAgICAqIFN0b3BzIGFueSBjdXJyZW50bHkgcnVubmluZyBzY3JvbGwgYW5pbWF0aW9uLlxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSB2eCAtIHRoZSBpbml0aWFsIHZlbG9jaXR5IGluIGhvcml6b250YWwgZGlyZWN0aW9uXG4gICAgICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0gdnkgLSB0aGUgaW5pdGlhbCB2ZWxvY2l0eSBpbiB2ZXJ0aWNhbCBkaXJlY3Rpb25cbiAgICAgICAgICAgICAqIEByZXR1cm4ge251bWJlcn0gLSB0aGUgZmluYWwgeS1jb29yZGluYXRlXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIFp3b29zaC5wcm90b3R5cGUuZmFkZU91dEJ5VmVsb2NpdHkgPSBmdW5jdGlvbiAodngsIHZ5KSB7XG4gICAgICAgICAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgICAgICAgICAvKiBjYWxjdWxhdGUgdGhlIGJyYWtlIGFjY2VsZXJhdGlvbiBpbiBib3RoIGRpcmVjdGlvbnMgc2VwYXJhdGVseSAqL1xuICAgICAgICAgICAgICAgIHZhciBheSA9ICh2eSA+IDAgPyAtMSA6IDEpICogdGhpcy5vcHRpb25zLmRyYWdPcHRpb25zLmJyYWtlU3BlZWQ7XG4gICAgICAgICAgICAgICAgdmFyIGF4ID0gKHZ4ID4gMCA/IC0xIDogMSkgKiB0aGlzLm9wdGlvbnMuZHJhZ09wdGlvbnMuYnJha2VTcGVlZDtcbiAgICAgICAgICAgICAgICAvKiBmaW5kIHRoZSBkaXJlY3Rpb24gdGhhdCBuZWVkcyBsb25nZXIgdG8gc3RvcCwgYW5kIHJlY2FsY3VsYXRlIHRoZSBhY2NlbGVyYXRpb24gKi9cbiAgICAgICAgICAgICAgICB2YXIgdG1heCA9IE1hdGgubWF4KCgwIC0gdnkpIC8gYXksICgwIC0gdngpIC8gYXgpO1xuICAgICAgICAgICAgICAgIGF4ID0gKDAgLSB2eCkgLyB0bWF4O1xuICAgICAgICAgICAgICAgIGF5ID0gKDAgLSB2eSkgLyB0bWF4O1xuICAgICAgICAgICAgICAgIHZhciBzeCwgc3ksIHQ7XG4gICAgICAgICAgICAgICAgdmFyIGZwcyA9IHRoaXMub3B0aW9ucy5kcmFnT3B0aW9ucy5mcHM7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCAoKHRtYXggKiBmcHMpICsgKDAgLyBmcHMpKTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHQgPSAoKGkgKyAxKSAvIGZwcyk7XG4gICAgICAgICAgICAgICAgICAgIHN5ID0gdGhpcy5nZXRTY3JvbGxUb3AoKSArICh2eSAqIHQpICsgKDAuNSAqIGF5ICogdCAqIHQpO1xuICAgICAgICAgICAgICAgICAgICBzeCA9IHRoaXMuZ2V0U2Nyb2xsTGVmdCgpICsgKHZ4ICogdCkgKyAoMC41ICogYXggKiB0ICogdCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudGltZWRTY3JvbGwoc3gsIHN5LCAoaSArIDEpICogKDEwMDAgLyBmcHMpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGkgPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIC8qIHJvdW5kIHRoZSBsYXN0IHN0ZXAgYmFzZWQgb24gdGhlIGRpcmVjdGlvbiBvZiB0aGUgZmFkZSAqL1xuICAgICAgICAgICAgICAgICAgICBzeCA9IHZ4ID4gMCA/IE1hdGguY2VpbChzeCkgOiBNYXRoLmZsb29yKHN4KTtcbiAgICAgICAgICAgICAgICAgICAgc3kgPSB2eSA+IDAgPyBNYXRoLmNlaWwoc3kpIDogTWF0aC5mbG9vcihzeSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudGltZWRTY3JvbGwoc3gsIHN5LCAoaSArIDIpICogKDEwMDAgLyBmcHMpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLyogc3RvcCB0aGUgYW5pbWF0aW9uIHdoZW4gY29sbGlkaW5nIHdpdGggdGhlIGJvcmRlcnMgKi9cbiAgICAgICAgICAgICAgICB0aGlzLmNsZWFyTGlzdGVuZXJMZWZ0ID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gX3RoaXMuY2xlYXJUaW1lb3V0cygpOyB9O1xuICAgICAgICAgICAgICAgIHRoaXMuY2xlYXJMaXN0ZW5lclJpZ2h0ID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gX3RoaXMuY2xlYXJUaW1lb3V0cygpOyB9O1xuICAgICAgICAgICAgICAgIHRoaXMuY2xlYXJMaXN0ZW5lclRvcCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIF90aGlzLmNsZWFyVGltZW91dHMoKTsgfTtcbiAgICAgICAgICAgICAgICB0aGlzLmNsZWFyTGlzdGVuZXJCb3R0b20gPSBmdW5jdGlvbiAoKSB7IHJldHVybiBfdGhpcy5jbGVhclRpbWVvdXRzKCk7IH07XG4gICAgICAgICAgICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKHRoaXMuaW5uZXIsICdjb2xsaWRlLmxlZnQnLCB0aGlzLmNsZWFyTGlzdGVuZXJMZWZ0KTtcbiAgICAgICAgICAgICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIodGhpcy5pbm5lciwgJ2NvbGxpZGUucmlnaHQnLCB0aGlzLmNsZWFyTGlzdGVuZXJSaWdodCk7XG4gICAgICAgICAgICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKHRoaXMuaW5uZXIsICdjb2xsaWRlLnRvcCcsIHRoaXMuY2xlYXJMaXN0ZW5lclRvcCk7XG4gICAgICAgICAgICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKHRoaXMuaW5uZXIsICdjb2xsaWRlLmJvdHRvbScsIHRoaXMuY2xlYXJMaXN0ZW5lckJvdHRvbSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgWndvb3NoLnByb3RvdHlwZS5mYWRlT3V0QnlDb29yZHMgPSBmdW5jdGlvbiAoeCwgeSkge1xuICAgICAgICAgICAgICAgIF9hID0gdGhpcy5nZXRSZWFsQ29vcmRzKHgsIHkpLCB4ID0gX2FbMF0sIHkgPSBfYVsxXTtcbiAgICAgICAgICAgICAgICB2YXIgYSA9IHRoaXMub3B0aW9ucy5kcmFnT3B0aW9ucy5icmFrZVNwZWVkICogLTE7XG4gICAgICAgICAgICAgICAgdmFyIHZ5ID0gMCAtICgyICogYSAqICh5IC0gdGhpcy5nZXRTY3JvbGxUb3AoKSkpO1xuICAgICAgICAgICAgICAgIHZhciB2eCA9IDAgLSAoMiAqIGEgKiAoeCAtIHRoaXMuZ2V0U2Nyb2xsTGVmdCgpKSk7XG4gICAgICAgICAgICAgICAgdnkgPSAodnkgPiAwID8gMSA6IC0xKSAqIE1hdGguc3FydChNYXRoLmFicyh2eSkpO1xuICAgICAgICAgICAgICAgIHZ4ID0gKHZ4ID4gMCA/IDEgOiAtMSkgKiBNYXRoLnNxcnQoTWF0aC5hYnModngpKTtcbiAgICAgICAgICAgICAgICB2YXIgc3ggPSB4IC0gdGhpcy5nZXRTY3JvbGxMZWZ0KCk7XG4gICAgICAgICAgICAgICAgdmFyIHN5ID0geSAtIHRoaXMuZ2V0U2Nyb2xsVG9wKCk7XG4gICAgICAgICAgICAgICAgaWYgKE1hdGguYWJzKHN5KSA+IE1hdGguYWJzKHN4KSkge1xuICAgICAgICAgICAgICAgICAgICB2eCA9ICh2eCA+IDAgPyAxIDogLTEpICogTWF0aC5hYnMoKHN4IC8gc3kpICogdnkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdnkgPSAodnkgPiAwID8gMSA6IC0xKSAqIE1hdGguYWJzKChzeSAvIHN4KSAqIHZ4KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5jbGVhclRpbWVvdXRzKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5mYWRlT3V0QnlWZWxvY2l0eSh2eCwgdnkpO1xuICAgICAgICAgICAgICAgIHZhciBfYTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIE1vdXNlIG1vdmUgaGFuZGxlclxuICAgICAgICAgICAgICogQ2FsY3VjYXRlcyB0aGUgeCBhbmQgeSBkZWx0YXMgYW5kIHNjcm9sbHNcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAcGFyYW0ge01vdXNlRXZlbnR9IGUgLSBUaGUgbW91c2UgbW92ZSBldmVudCBvYmplY3RcbiAgICAgICAgICAgICAqIEByZXR1cm4ge3ZvaWR9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIFp3b29zaC5wcm90b3R5cGUubW91c2VNb3ZlID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnByZXNlbnQgPSAodGhpcy5nZXRUaW1lc3RhbXAoKSAvIDEwMDApOyAvL2luIHNlY29uZHNcbiAgICAgICAgICAgICAgICB0aGlzLmNsZWFyVGV4dFNlbGVjdGlvbigpO1xuICAgICAgICAgICAgICAgIC8qIGlmIHRoZSBtb3VzZSBsZWZ0IHRoZSB3aW5kb3cgYW5kIHRoZSBidXR0b24gaXMgbm90IHByZXNzZWQgYW55bW9yZSwgYWJvcnQgbW92aW5nICovXG4gICAgICAgICAgICAgICAgLy9pZiAoKGUuYnV0dG9ucyA9PT0gMCAmJiBlLmJ1dHRvbiA9PT0gMCkgfHwgKHR5cGVvZiBlLmJ1dHRvbnMgPT09ICd1bmRlZmluZWQnICYmIGUuYnV0dG9uID09PSAwKSkge1xuICAgICAgICAgICAgICAgIGlmICgoXCJ3aGljaFwiIGluIGUgJiYgZS53aGljaCA9PT0gMCkgfHwgKHR5cGVvZiBlLndoaWNoID09PSAndW5kZWZpbmVkJyAmJiBcImJ1dHRvblwiIGluIGUgJiYgZS5idXR0b24gPT09IDApKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubW91c2VVcChlKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgeCA9IHRoaXMuZHJhZ09yaWdpbkxlZnQgKyB0aGlzLmRyYWdPcmlnaW5TY3JvbGxMZWZ0IC0gZS5jbGllbnRYO1xuICAgICAgICAgICAgICAgIHZhciB5ID0gdGhpcy5kcmFnT3JpZ2luVG9wICsgdGhpcy5kcmFnT3JpZ2luU2Nyb2xsVG9wIC0gZS5jbGllbnRZO1xuICAgICAgICAgICAgICAgIC8qIGlmIGVsYXN0aWMgZWRnZXMgYXJlIHNldCwgc2hvdyB0aGUgZWxlbWVudCBwc2V1ZG8gc2Nyb2xsZWQgYnkgcmVsYXRpdmUgcG9zaXRpb24gKi9cbiAgICAgICAgICAgICAgICBpZiAodGhpcy50cmlnZ2VyZWQuY29sbGlkZUJvdHRvbSAmJiB0aGlzLm9wdGlvbnMuZWxhc3RpY0VkZ2VzLmJvdHRvbSA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmlubmVyLnN0eWxlLnBvc2l0aW9uID0gJ3JlbGF0aXZlJztcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pbm5lci5zdHlsZS50b3AgPSAoKHRoaXMuZ2V0U2Nyb2xsVG9wKCkgLSB5KSAvIDIpICsgJ3B4JztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMudHJpZ2dlcmVkLmNvbGxpZGVUb3AgJiYgdGhpcy5vcHRpb25zLmVsYXN0aWNFZGdlcy50b3AgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pbm5lci5zdHlsZS5wb3NpdGlvbiA9ICdyZWxhdGl2ZSc7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaW5uZXIuc3R5bGUudG9wID0gKHkgLyAtMikgKyAncHgnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAodGhpcy50cmlnZ2VyZWQuY29sbGlkZUxlZnQgJiYgdGhpcy5vcHRpb25zLmVsYXN0aWNFZGdlcy5sZWZ0ID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaW5uZXIuc3R5bGUucG9zaXRpb24gPSAncmVsYXRpdmUnO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmlubmVyLnN0eWxlLmxlZnQgPSAoeCAvIC0yKSArICdweCc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh0aGlzLnRyaWdnZXJlZC5jb2xsaWRlUmlnaHQgJiYgdGhpcy5vcHRpb25zLmVsYXN0aWNFZGdlcy5yaWdodCA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmlubmVyLnN0eWxlLnBvc2l0aW9uID0gJ3JlbGF0aXZlJztcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pbm5lci5zdHlsZS5sZWZ0ID0gKCh0aGlzLmdldFNjcm9sbExlZnQoKSAtIHgpIC8gMikgKyAncHgnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLnZ4W3RoaXMucHJlc2VudF0gPSB4O1xuICAgICAgICAgICAgICAgIHRoaXMudnlbdGhpcy5wcmVzZW50XSA9IHk7XG4gICAgICAgICAgICAgICAgdGhpcy5zY3JvbGxUbyh4LCB5LCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgdGhpcy5wYXN0ID0gdGhpcy5wcmVzZW50O1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogc2Nyb2xsQnkgaGVscGVyIG1ldGhvZCB0byBzY3JvbGwgYnkgYW4gYW1vdW50IG9mIHBpeGVscyBpbiB4LSBhbmQgeS1kaXJlY3Rpb25cbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0geCAtIGFtb3VudCBvZiBwaXhlbHMgdG8gc2Nyb2xsIGluIHgtZGlyZWN0aW9uXG4gICAgICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0geSAtIGFtb3VudCBvZiBwaXhlbHMgdG8gc2Nyb2xsIGluIHktZGlyZWN0aW9uXG4gICAgICAgICAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IHNtb290aCAtIHdoZXRoZXIgdG8gc2Nyb2xsIHNtb290aCBvciBpbnN0YW50XG4gICAgICAgICAgICAgKiBAcmV0dXJuIHt2b2lkfVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLnNjcm9sbEJ5ID0gZnVuY3Rpb24gKHgsIHksIHNtb290aCkge1xuICAgICAgICAgICAgICAgIGlmIChzbW9vdGggPT09IHZvaWQgMCkgeyBzbW9vdGggPSB0cnVlOyB9XG4gICAgICAgICAgICAgICAgdmFyIGFic29sdXRlWCA9IHRoaXMuZ2V0U2Nyb2xsTGVmdCgpICsgeDtcbiAgICAgICAgICAgICAgICB2YXIgYWJzb2x1dGVZID0gdGhpcy5nZXRTY3JvbGxUb3AoKSArIHk7XG4gICAgICAgICAgICAgICAgdGhpcy5zY3JvbGxUbyhhYnNvbHV0ZVgsIGFic29sdXRlWSwgc21vb3RoKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIHNjcm9sbEJ5IGhlbHBlciBtZXRob2QgdG8gc2Nyb2xsIHRvIGEgeC0gYW5kIHktY29vcmRpbmF0ZVxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSB4IC0geC1jb29yZGluYXRlIHRvIHNjcm9sbCB0b1xuICAgICAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IHkgLSB5LWNvb3JkaW5hdGUgdG8gc2Nyb2xsIHRvXG4gICAgICAgICAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IHNtb290aCAtIHdoZXRoZXIgdG8gc2Nyb2xsIHNtb290aCBvciBpbnN0YW50XG4gICAgICAgICAgICAgKiBAcmV0dXJuIHt2b2lkfVxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBUT0RPOiBDU1MzIHRyYW5zaXRpb25zIGlmIGF2YWlsYWJsZSBpbiBicm93c2VyXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIFp3b29zaC5wcm90b3R5cGUuc2Nyb2xsVG8gPSBmdW5jdGlvbiAoeCwgeSwgc21vb3RoKSB7XG4gICAgICAgICAgICAgICAgaWYgKHNtb290aCA9PT0gdm9pZCAwKSB7IHNtb290aCA9IHRydWU7IH1cbiAgICAgICAgICAgICAgICB0aGlzLmNsZWFyVGltZW91dHMoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnNjcm9sbE1heExlZnQgPSAodGhpcy5zY3JvbGxFbGVtZW50LnNjcm9sbFdpZHRoIC0gdGhpcy5zY3JvbGxFbGVtZW50LmNsaWVudFdpZHRoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnNjcm9sbE1heFRvcCA9ICh0aGlzLnNjcm9sbEVsZW1lbnQuc2Nyb2xsSGVpZ2h0IC0gdGhpcy5zY3JvbGxFbGVtZW50LmNsaWVudEhlaWdodCk7XG4gICAgICAgICAgICAgICAgLyogbm8gbmVnYXRpdmUgdmFsdWVzIG9yIHZhbHVlcyBncmVhdGVyIHRoYW4gdGhlIG1heGltdW0gKi9cbiAgICAgICAgICAgICAgICB4ID0gKHggPiB0aGlzLnNjcm9sbE1heExlZnQpID8gdGhpcy5zY3JvbGxNYXhMZWZ0IDogKHggPCAwKSA/IDAgOiB4O1xuICAgICAgICAgICAgICAgIHkgPSAoeSA+IHRoaXMuc2Nyb2xsTWF4VG9wKSA/IHRoaXMuc2Nyb2xsTWF4VG9wIDogKHkgPCAwKSA/IDAgOiB5O1xuICAgICAgICAgICAgICAgIC8qIHJlbWVtYmVyIHRoZSBvbGQgdmFsdWVzICovXG4gICAgICAgICAgICAgICAgdGhpcy5vcmlnaW5TY3JvbGxMZWZ0ID0gdGhpcy5nZXRTY3JvbGxMZWZ0KCk7XG4gICAgICAgICAgICAgICAgdGhpcy5vcmlnaW5TY3JvbGxUb3AgPSB0aGlzLmdldFNjcm9sbFRvcCgpO1xuICAgICAgICAgICAgICAgIGlmICh4ICE9PSB0aGlzLmdldFNjcm9sbExlZnQoKSB8fCB5ICE9PSB0aGlzLmdldFNjcm9sbFRvcCgpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMud2hlZWxPcHRpb25zLnNtb290aCAhPT0gdHJ1ZSB8fCBzbW9vdGggPT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNldFNjcm9sbFRvcCh5KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0U2Nyb2xsTGVmdCh4KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZmFkZU91dEJ5Q29vcmRzKHgsIHkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogUmVnaXN0ZXIgY3VzdG9tIGV2ZW50IGNhbGxiYWNrc1xuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBldmVudCAtIFRoZSBldmVudCBuYW1lXG4gICAgICAgICAgICAgKiBAcGFyYW0geyhlOiBFdmVudCkgPT4gYW55fSBjYWxsYmFjayAtIEEgY2FsbGJhY2sgZnVuY3Rpb24gdG8gZXhlY3V0ZSB3aGVuIHRoZSBldmVudCByYWlzZXNcbiAgICAgICAgICAgICAqIEByZXR1cm4ge1p3b29zaH0gLSBUaGUgWndvb3NoIG9iamVjdCBpbnN0YW5jZVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLm9uID0gZnVuY3Rpb24gKGV2ZW50LCBjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcih0aGlzLmlubmVyLCBldmVudCwgY2FsbGJhY2spO1xuICAgICAgICAgICAgICAgIC8qIHNldCB0aGUgZXZlbnQgdW50cmlnZ2VyZWQgYW5kIGNhbGwgdGhlIGZ1bmN0aW9uLCB0byByZXRyaWdnZXIgbWV0IGV2ZW50cyAqL1xuICAgICAgICAgICAgICAgIHZhciBmID0gZXZlbnQucmVwbGFjZSgvXFwuKFthLXpdKS8sIFN0cmluZy5jYWxsLmJpbmQoZXZlbnQudG9VcHBlckNhc2UpKS5yZXBsYWNlKC9cXC4vLCAnJyk7XG4gICAgICAgICAgICAgICAgdGhpcy50cmlnZ2VyZWRbZl0gPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB0aGlzLm9uU2Nyb2xsKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBEZXJlZ2lzdGVyIGN1c3RvbSBldmVudCBjYWxsYmFja3NcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnQgLSBUaGUgZXZlbnQgbmFtZVxuICAgICAgICAgICAgICogQHBhcmFtIHsoZTogRXZlbnQpID0+IGFueX0gY2FsbGJhY2sgLSBBIGNhbGxiYWNrIGZ1bmN0aW9uIHRvIGV4ZWN1dGUgd2hlbiB0aGUgZXZlbnQgcmFpc2VzXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHtad29vc2h9IC0gVGhlIFp3b29zaCBvYmplY3QgaW5zdGFuY2VcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgWndvb3NoLnByb3RvdHlwZS5vZmYgPSBmdW5jdGlvbiAoZXZlbnQsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKHRoaXMuaW5uZXIsIGV2ZW50LCBjYWxsYmFjayk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBSZXZlcnQgYWxsIERPTSBtYW5pcHVsYXRpb25zIGFuZCBkZXJlZ2lzdGVyIGFsbCBldmVudCBoYW5kbGVyc1xuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEByZXR1cm4ge3ZvaWR9XG4gICAgICAgICAgICAgKiBAVE9ETzogcmVtb3Zpbmcgd2hlZWxab29tSGFuZGxlciBkb2VzIG5vdCB3b3JrXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIFp3b29zaC5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgeCA9IHRoaXMuZ2V0U2Nyb2xsTGVmdCgpO1xuICAgICAgICAgICAgICAgIHZhciB5ID0gdGhpcy5nZXRTY3JvbGxUb3AoKTtcbiAgICAgICAgICAgICAgICAvKiByZW1vdmUgdGhlIG91dGVyIGFuZCBncmFiIENTUyBjbGFzc2VzICovXG4gICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVDbGFzcyh0aGlzLmNvbnRhaW5lciwgdGhpcy5jbGFzc091dGVyKTtcbiAgICAgICAgICAgICAgICB0aGlzLnJlbW92ZUNsYXNzKHRoaXMuaW5uZXIsIHRoaXMuY2xhc3NHcmFiKTtcbiAgICAgICAgICAgICAgICB0aGlzLnJlbW92ZUNsYXNzKHRoaXMuY29udGFpbmVyLCB0aGlzLmNsYXNzTm9HcmFiKTtcbiAgICAgICAgICAgICAgICAvKiBtb3ZlIGFsbCBjaGlsZE5vZGVzIGJhY2sgdG8gdGhlIG9sZCBvdXRlciBlbGVtZW50IGFuZCByZW1vdmUgdGhlIGlubmVyIGVsZW1lbnQgKi9cbiAgICAgICAgICAgICAgICB3aGlsZSAodGhpcy5pbm5lci5jaGlsZE5vZGVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jb250YWluZXIuYXBwZW5kQ2hpbGQodGhpcy5pbm5lci5jaGlsZE5vZGVzWzBdKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5zY2FsZUVsZW1lbnQucmVtb3ZlQ2hpbGQodGhpcy5pbm5lcik7XG4gICAgICAgICAgICAgICAgdGhpcy5jb250YWluZXIucmVtb3ZlQ2hpbGQodGhpcy5zY2FsZUVsZW1lbnQpO1xuICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsVG8oeCwgeSwgZmFsc2UpO1xuICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsRWxlbWVudC5vbm1vdXNld2hlZWwgPSBudWxsO1xuICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsRWxlbWVudC5vbnNjcm9sbCA9IG51bGw7XG4gICAgICAgICAgICAgICAgd2luZG93Lm9ucmVzaXplID0gbnVsbDtcbiAgICAgICAgICAgICAgICAvKiByZW1vdmUgYWxsIGN1c3RvbSBldmVudGxpc3RlbmVycyBhdHRhY2hlZCB2aWEgdGhpcy5hZGRFdmVudExpc3RlbmVyKCkgKi9cbiAgICAgICAgICAgICAgICBmb3IgKHZhciBldmVudCBpbiB0aGlzLmN1c3RvbUV2ZW50cykge1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5jdXN0b21FdmVudHMuaGFzT3duUHJvcGVydHkoZXZlbnQpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBwIGluIHRoaXMuY3VzdG9tRXZlbnRzW2V2ZW50XSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmN1c3RvbUV2ZW50c1tldmVudF0uaGFzT3duUHJvcGVydHkocCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKHRoaXMuaW5uZXIsIGV2ZW50LCB0aGlzLmN1c3RvbUV2ZW50c1tldmVudF1bcF1bMF0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcmV0dXJuIFp3b29zaDtcbiAgICAgICAgfSgpKTtcbiAgICAgICAgLyogcmV0dXJuIGFuIGluc3RhbmNlIG9mIHRoZSBjbGFzcyAqL1xuICAgICAgICByZXR1cm4gbmV3IFp3b29zaChjb250YWluZXIsIG9wdGlvbnMpO1xuICAgIH1cbiAgICByZXR1cm4gendvb3NoO1xufSk7XG4vLyMgc291cmNlTWFwcGluZ1VSTD16d29vc2guanMubWFwIl19
