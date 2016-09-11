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
                this.options = {
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
                /* merge the default option objects with the provided one */
                for (var key in options) {
                    if (options.hasOwnProperty(key)) {
                        if (typeof options[key] === 'object') {
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
            Zwoosh.prototype.init = function () {
                var _this = this;
                this.initBody();
                this.container.className += " " + this.classOuter + " ";
                this.scrollElement = this.container;
                var x = this.getScrollLeft();
                var y = this.getScrollTop();
                /* create inner div element and append it to the container with its contents in it */
                this.inner = document.createElement("div");
                this.inner.className += " " + this.classInner + " " + this.classUnique + " ";
                this.scaleElement = document.createElement("div");
                this.scaleElement.className += " " + this.classScale + " ";
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
                    pseudoBody.className += " " + this.classFakeBody + " ";
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
                    this.inner.className += " " + this.classGrab + " ";
                    this.mouseDownHandler = function (e) { return _this.mouseDown(e); };
                    this.addEventListener(this.inner, 'mousedown', this.mouseDownHandler);
                }
                else {
                    this.container.className += " " + this.classNoGrab + " ";
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
                            e.preventDefault ? e.preventDefault() : (e.returnValue = false);
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
                        var outerRe = new RegExp(" " + this.classOuter + " ");
                        var nextContainer = element;
                        while (container && container.parentElement && this.container !== container) {
                            if (container.className.match(outerRe)) {
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
                var bl = this.getStyle(el, 'borderLeftWidth');
                bl = bl === 'thin' ? 1 : bl === 'medium' ? 3 : bl === 'thick' ? 5 : parseInt(bl, 10) !== NaN ? parseInt(bl, 10) : 0;
                var br = this.getStyle(el, 'borderRightWidth');
                br = br === 'thin' ? 1 : br === 'medium' ? 3 : br === 'thick' ? 5 : parseInt(br, 10) !== NaN ? parseInt(br, 10) : 0;
                var pl = this.getStyle(el, 'paddingLeft');
                pl = pl === 'auto' ? 0 : parseInt(pl, 10) !== NaN ? parseInt(pl, 10) : 0;
                var pr = this.getStyle(el, 'paddingRight');
                pr = pr === 'auto' ? 0 : parseInt(pr, 10) !== NaN ? parseInt(pr, 10) : 0;
                var ml = this.getStyle(el, 'marginLeft');
                ml = ml === 'auto' ? 0 : parseInt(ml, 10) !== NaN ? parseInt(ml, 10) : 0;
                var mr = this.getStyle(el, 'marginRight');
                mr = mr === 'auto' ? 0 : parseInt(mr, 10) !== NaN ? parseInt(mr, 10) : 0;
                var bt = this.getStyle(el, 'borderTopWidth');
                bt = bt === 'thin' ? 1 : bt === 'medium' ? 3 : bt === 'thick' ? 5 : parseInt(bt, 10) !== NaN ? parseInt(bt, 10) : 0;
                var bb = this.getStyle(el, 'borderBottomWidth');
                bb = bb === 'thin' ? 1 : bb === 'medium' ? 3 : bb === 'thick' ? 5 : parseInt(bb, 10) !== NaN ? parseInt(bb, 10) : 0;
                var pt = this.getStyle(el, 'paddingTop');
                pt = pt === 'auto' ? 0 : parseInt(pt, 10) !== NaN ? parseInt(pt, 10) : 0;
                var pb = this.getStyle(el, 'paddingBottom');
                pb = pb === 'auto' ? 0 : parseInt(pb, 10) !== NaN ? parseInt(pb, 10) : 0;
                var mt = this.getStyle(el, 'marginTop');
                mt = mt === 'auto' ? 0 : parseInt(mt, 10) !== NaN ? parseInt(mt, 10) : 0;
                var mb = this.getStyle(el, 'marginBottom');
                mb = mb === 'auto' ? 0 : parseInt(mb, 10) !== NaN ? parseInt(mb, 10) : 0;
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
                    if (direction === this.options.zoomOptions.direction) {
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
                /* Scrollbars have width and height too */
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
            Zwoosh.prototype.elementBehindCursorIsMe = function (x, y) {
                var elementBehindCursor = document.elementFromPoint(x, y);
                /**
                 * If the element directly behind the cursor is an outer element throw out, because when clicking on a scrollbar
                 * from a div, a drag of the parent Zwoosh element is initiated.
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
                            var innerRe = new RegExp(" " + this.classInner + " ");
                            while (el && !el.className.match(innerRe)) {
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
                        document.body.className += " " + this.classGrabbing + " ";
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
                        e.preventDefault ? e.preventDefault() : (e.returnValue = false);
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
                var re = new RegExp(" " + this.classGrabbing + " ");
                document.body.className = document.body.className.replace(re, '');
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
                    var deltaT, deltaSx, deltaSy, lastDeltaSx, lastDeltaSy;
                    deltaT = deltaSx = deltaSy = lastDeltaSx = lastDeltaSy = 0;
                    for (var i in this.vy) {
                        if (parseFloat(i) > (this.present - 0.1)
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
                    var vx = (vx <= vMax && vx >= -vMax) ? vx : (vx > 0 ? vMax : -vMax);
                    var vy = (vy <= vMax && vy >= -vMax) ? vy : (vy > 0 ? vMax : -vMax);
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
                var _a;
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
                var re = new RegExp(" " + this.classOuter + " ");
                this.container.className = this.container.className.replace(re, '');
                var re = new RegExp(" " + this.classGrab + " ");
                this.inner.className = this.inner.className.replace(re, '');
                var re = new RegExp(" " + this.classNoGrab + " ");
                this.container.className = this.container.className.replace(re, '');
                /* move all childNodes back to the old outer element and remove the inner element */
                while (this.inner.childNodes.length > 0) {
                    this.container.appendChild(this.inner.childNodes[0]);
                }
                this.scaleElement.removeChild(this.inner);
                this.container.removeChild(this.scaleElement);
                this.scrollTo(x, y, false);
                this.mouseMoveHandler ? this.removeEventListener(document.documentElement, 'mousemove', this.mouseMoveHandler) : null;
                this.mouseUpHandler ? this.removeEventListener(document.documentElement, 'mouseup', this.mouseUpHandler) : null;
                this.mouseDownHandler ? this.removeEventListener(this.inner, 'mousedown', this.mouseDownHandler) : null;
                this.mouseScrollHandler ? this.removeEventListener(this.scrollElement, 'wheel', this.mouseScrollHandler) : null;
                this.mouseZoomHandler ? this.removeEventListener(this.scrollElement, 'wheel', this.mouseZoomHandler) : null;
                this.hashChangeHandler ? this.removeEventListener(window, 'myhashchange', this.hashChangeHandler) : null;
                this.hashChangeHandler ? this.removeEventListener(window, 'hashchange', this.hashChangeHandler) : null;
                if (this.hashChangeClickHandler) {
                    var links = this.container.querySelectorAll("a[href^='#']");
                    for (var i = 0; i < links.length; i++) {
                        this.removeEventListener(links[i], 'click', this.hashChangeClickHandler);
                    }
                }
                this.scrollElement ? this.scrollElement.onmousewheel = null : null;
                this.scrollElement ? this.scrollElement.onscroll = null : null;
                window.onresize = null;
                /* remove all custom eventlisteners attached via on() */
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiendvb3NoLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiKGZ1bmN0aW9uIChmYWN0b3J5KSB7XHJcbiAgICBpZiAodHlwZW9mIG1vZHVsZSA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIG1vZHVsZS5leHBvcnRzID09PSAnb2JqZWN0Jykge1xyXG4gICAgICAgIHZhciB2ID0gZmFjdG9yeShyZXF1aXJlLCBleHBvcnRzKTsgaWYgKHYgIT09IHVuZGVmaW5lZCkgbW9kdWxlLmV4cG9ydHMgPSB2O1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XHJcbiAgICAgICAgZGVmaW5lKFtcInJlcXVpcmVcIiwgXCJleHBvcnRzXCJdLCBmYWN0b3J5KTtcclxuICAgIH1cclxufSkoZnVuY3Rpb24gKHJlcXVpcmUsIGV4cG9ydHMpIHtcclxuICAgIFwidXNlIHN0cmljdFwiO1xyXG4gICAgLyoqXHJcbiAgICAgKiBFeHBvcnQgZnVuY3Rpb24gb2YgdGhlIG1vZHVsZVxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGNvbnRhaW5lciAtIFRoZSBIVE1MRWxlbWVudCB0byBzd29vb29zaCFcclxuICAgICAqIEBwYXJhbSB7T3B0aW9uc30gb3B0aW9ucyAtIHRoZSBvcHRpb25zIG9iamVjdCB0byBjb25maWd1cmUgWndvb3NoXHJcbiAgICAgKiBAcmV0dXJuIHtad29vc2h9IC0gWndvb3NoIG9iamVjdCBpbnN0YW5jZVxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiB6d29vc2goY29udGFpbmVyLCBvcHRpb25zKSB7XHJcbiAgICAgICAgaWYgKG9wdGlvbnMgPT09IHZvaWQgMCkgeyBvcHRpb25zID0ge307IH1cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBQb2x5ZmlsbCBiaW5kIGZ1bmN0aW9uIGZvciBvbGRlciBicm93c2Vyc1xyXG4gICAgICAgICAqIFRoZSBiaW5kIGZ1bmN0aW9uIGlzIGFuIGFkZGl0aW9uIHRvIEVDTUEtMjYyLCA1dGggZWRpdGlvblxyXG4gICAgICAgICAqIEBzZWU6IGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0phdmFTY3JpcHQvUmVmZXJlbmNlL0dsb2JhbF9PYmplY3RzL0Z1bmN0aW9uL2JpbmRcclxuICAgICAgICAgKi9cclxuICAgICAgICBpZiAoIUZ1bmN0aW9uLnByb3RvdHlwZS5iaW5kKSB7XHJcbiAgICAgICAgICAgIEZ1bmN0aW9uLnByb3RvdHlwZS5iaW5kID0gZnVuY3Rpb24gKG9UaGlzKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHRoaXMgIT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBjbG9zZXN0IHRoaW5nIHBvc3NpYmxlIHRvIHRoZSBFQ01BU2NyaXB0IDVcclxuICAgICAgICAgICAgICAgICAgICAvLyBpbnRlcm5hbCBJc0NhbGxhYmxlIGZ1bmN0aW9uXHJcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignRnVuY3Rpb24ucHJvdG90eXBlLmJpbmQgLSB3aGF0IGlzIHRyeWluZyB0byBiZSBib3VuZCBpcyBub3QgY2FsbGFibGUnKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHZhciBhQXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSksIGZUb0JpbmQgPSB0aGlzLCBmTk9QID0gZnVuY3Rpb24gKCkgeyB9LCBmQm91bmQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZUb0JpbmQuYXBwbHkodGhpcyBpbnN0YW5jZW9mIGZOT1BcclxuICAgICAgICAgICAgICAgICAgICAgICAgPyB0aGlzXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDogb1RoaXMsIGFBcmdzLmNvbmNhdChBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpKSk7XHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMucHJvdG90eXBlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gRnVuY3Rpb24ucHJvdG90eXBlIGRvZXNuJ3QgaGF2ZSBhIHByb3RvdHlwZSBwcm9wZXJ0eVxyXG4gICAgICAgICAgICAgICAgICAgIGZOT1AucHJvdG90eXBlID0gdGhpcy5wcm90b3R5cGU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBmQm91bmQucHJvdG90eXBlID0gbmV3IGZOT1AoKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmQm91bmQ7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIFBvbHlmaWxsIGFycmF5LmluZGV4T2YgZnVuY3Rpb24gZm9yIG9sZGVyIGJyb3dzZXJzXHJcbiAgICAgICAgICogVGhlIGluZGV4T2YoKSBmdW5jdGlvbiB3YXMgYWRkZWQgdG8gdGhlIEVDTUEtMjYyIHN0YW5kYXJkIGluIHRoZSA1dGggZWRpdGlvblxyXG4gICAgICAgICAqIGFzIHN1Y2ggaXQgbWF5IG5vdCBiZSBwcmVzZW50IGluIGFsbCBicm93c2Vycy5cclxuICAgICAgICAgKiBAc2VlIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0phdmFTY3JpcHQvUmVmZXJlbmNlL0dsb2JhbF9PYmplY3RzL0FycmF5L2luZGV4T2ZcclxuICAgICAgICAgKi9cclxuICAgICAgICBpZiAoIUFycmF5LnByb3RvdHlwZS5pbmRleE9mKSB7XHJcbiAgICAgICAgICAgIEFycmF5LnByb3RvdHlwZS5pbmRleE9mID0gZnVuY3Rpb24gKHNlYXJjaEVsZW1lbnQsIGZyb21JbmRleCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGs7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcyA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignXCJ0aGlzXCIgaXMgbnVsbCBvciBub3QgZGVmaW5lZCcpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdmFyIG8gPSBPYmplY3QodGhpcyk7XHJcbiAgICAgICAgICAgICAgICB2YXIgbGVuID0gby5sZW5ndGggPj4+IDA7XHJcbiAgICAgICAgICAgICAgICBpZiAobGVuID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIC0xO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdmFyIG4gPSArZnJvbUluZGV4IHx8IDA7XHJcbiAgICAgICAgICAgICAgICBpZiAoTWF0aC5hYnMobikgPT09IEluZmluaXR5KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbiA9IDA7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAobiA+PSBsZW4pIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gLTE7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBrID0gTWF0aC5tYXgobiA+PSAwID8gbiA6IGxlbiAtIE1hdGguYWJzKG4pLCAwKTtcclxuICAgICAgICAgICAgICAgIHdoaWxlIChrIDwgbGVuKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGsgaW4gbyAmJiBvW2tdID09PSBzZWFyY2hFbGVtZW50KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBrO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBrKys7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gLTE7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8qIGxpc3Qgb2YgcmVhbCBldmVudHMgKi9cclxuICAgICAgICB2YXIgaHRtbEV2ZW50cyA9IHtcclxuICAgICAgICAgICAgLyogPGJvZHk+IGFuZCA8ZnJhbWVzZXQ+IEV2ZW50cyAqL1xyXG4gICAgICAgICAgICBvbmxvYWQ6IDEsXHJcbiAgICAgICAgICAgIG9udW5sb2FkOiAxLFxyXG4gICAgICAgICAgICAvKiBGb3JtIEV2ZW50cyAqL1xyXG4gICAgICAgICAgICBvbmJsdXI6IDEsXHJcbiAgICAgICAgICAgIG9uY2hhbmdlOiAxLFxyXG4gICAgICAgICAgICBvbmZvY3VzOiAxLFxyXG4gICAgICAgICAgICBvbnJlc2V0OiAxLFxyXG4gICAgICAgICAgICBvbnNlbGVjdDogMSxcclxuICAgICAgICAgICAgb25zdWJtaXQ6IDEsXHJcbiAgICAgICAgICAgIC8qIEltYWdlIEV2ZW50cyAqL1xyXG4gICAgICAgICAgICBvbmFib3J0OiAxLFxyXG4gICAgICAgICAgICAvKiBLZXlib2FyZCBFdmVudHMgKi9cclxuICAgICAgICAgICAgb25rZXlkb3duOiAxLFxyXG4gICAgICAgICAgICBvbmtleXByZXNzOiAxLFxyXG4gICAgICAgICAgICBvbmtleXVwOiAxLFxyXG4gICAgICAgICAgICAvKiBNb3VzZSBFdmVudHMgKi9cclxuICAgICAgICAgICAgb25jbGljazogMSxcclxuICAgICAgICAgICAgb25kYmxjbGljazogMSxcclxuICAgICAgICAgICAgb25tb3VzZWRvd246IDEsXHJcbiAgICAgICAgICAgIG9ubW91c2Vtb3ZlOiAxLFxyXG4gICAgICAgICAgICBvbm1vdXNlb3V0OiAxLFxyXG4gICAgICAgICAgICBvbm1vdXNlb3ZlcjogMSxcclxuICAgICAgICAgICAgb25tb3VzZXVwOiAxXHJcbiAgICAgICAgfTtcclxuICAgICAgICB2YXIgbWFwRXZlbnRzID0ge1xyXG4gICAgICAgICAgICBvbnNjcm9sbDogd2luZG93XHJcbiAgICAgICAgfTtcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBad29vc2ggcHJvdmlkZXMgYSBzZXQgb2YgZnVuY3Rpb25zIHRvIGltcGxlbWVudCBzY3JvbGwgYnkgZHJhZywgem9vbSBieSBtb3VzZXdoZWVsLFxyXG4gICAgICAgICAqIGhhc2ggbGlua3MgaW5zaWRlIHRoZSBkb2N1bWVudCBhbmQgb3RoZXIgc3BlY2lhbCBzY3JvbGwgcmVsYXRlZCByZXF1aXJlbWVudHMuXHJcbiAgICAgICAgICpcclxuICAgICAgICAgKiBAYXV0aG9yIFJvbWFuIEdydWJlciA8cDEwMjAzODlAeWFob28uY29tPlxyXG4gICAgICAgICAqIEB2ZXJzaW9uIDEuMC4xXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdmFyIFp3b29zaCA9IChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGZ1bmN0aW9uIFp3b29zaChjb250YWluZXIsIG9wdGlvbnMpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuY29udGFpbmVyID0gY29udGFpbmVyO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcclxuICAgICAgICAgICAgICAgIC8qIENTUyBzdHlsZSBjbGFzc2VzICovXHJcbiAgICAgICAgICAgICAgICB0aGlzLmNsYXNzSW5uZXIgPSAnenctaW5uZXInO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jbGFzc091dGVyID0gJ3p3LW91dGVyJztcclxuICAgICAgICAgICAgICAgIHRoaXMuY2xhc3NHcmFiID0gJ3p3LWdyYWInO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jbGFzc05vR3JhYiA9ICd6dy1ub2dyYWInO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jbGFzc0dyYWJiaW5nID0gJ3p3LWdyYWJiaW5nJztcclxuICAgICAgICAgICAgICAgIHRoaXMuY2xhc3NVbmlxdWUgPSAnenctJyArIE1hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpLnN1YnN0cmluZyg3KTtcclxuICAgICAgICAgICAgICAgIHRoaXMuY2xhc3NTY2FsZSA9ICd6dy1zY2FsZSc7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNsYXNzSWdub3JlID0gJ3p3LWlnbm9yZSc7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNsYXNzRmFrZUJvZHkgPSAnenctZmFrZWJvZHknO1xyXG4gICAgICAgICAgICAgICAgLyogYXJyYXkgaG9sZGluZyB0aGUgY3VzdG9tIGV2ZW50cyBtYXBwaW5nIGNhbGxiYWNrcyB0byBib3VuZCBjYWxsYmFja3MgKi9cclxuICAgICAgICAgICAgICAgIHRoaXMuY3VzdG9tRXZlbnRzID0gW107XHJcbiAgICAgICAgICAgICAgICB0aGlzLnRyaWdnZXJlZCA9IHtcclxuICAgICAgICAgICAgICAgICAgICBjb2xsaWRlTGVmdDogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgY29sbGlkZVRvcDogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgY29sbGlkZVJpZ2h0OiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICBjb2xsaWRlQm90dG9tOiBmYWxzZVxyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgIC8qIGZhZGVPdXQgKi9cclxuICAgICAgICAgICAgICAgIHRoaXMudGltZW91dHMgPSBbXTtcclxuICAgICAgICAgICAgICAgIHRoaXMudnggPSBbXTtcclxuICAgICAgICAgICAgICAgIHRoaXMudnkgPSBbXTtcclxuICAgICAgICAgICAgICAgIHRoaXMuY29udGFpbmVyID0gY29udGFpbmVyO1xyXG4gICAgICAgICAgICAgICAgLyogc2V0IGRlZmF1bHQgb3B0aW9ucyAqL1xyXG4gICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIC8qIDEgbWVhbnMgZG8gbm90IGFsaWduIHRvIGEgZ3JpZCAqL1xyXG4gICAgICAgICAgICAgICAgICAgIGdyaWRYOiAxLFxyXG4gICAgICAgICAgICAgICAgICAgIGdyaWRZOiAxLFxyXG4gICAgICAgICAgICAgICAgICAgIC8qIHNob3dzIGEgZ3JpZCBhcyBhbiBvdmVybGF5IG92ZXIgdGhlIGVsZW1lbnQuIFdvcmtzIG9ubHkgaWYgdGhlIGJyb3dzZXIgc3VwcG9ydHNcclxuICAgICAgICAgICAgICAgICAgICAgKiBDU1MgR2VuZXJhdGVkIGNvbnRlbnQgZm9yIHBzZXVkby1lbGVtZW50c1xyXG4gICAgICAgICAgICAgICAgICAgICAqIEBzZWUgaHR0cDovL2Nhbml1c2UuY29tLyNzZWFyY2g9JTNBYmVmb3JlICovXHJcbiAgICAgICAgICAgICAgICAgICAgZ3JpZFNob3c6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgICAgIC8qIHdoaWNoIGVkZ2Ugc2hvdWxkIGJlIGVsYXN0aWMgKi9cclxuICAgICAgICAgICAgICAgICAgICBlbGFzdGljRWRnZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGVmdDogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJpZ2h0OiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdG9wOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgYm90dG9tOiBmYWxzZVxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgLyogYWN0aXZhdGVzL2RlYWN0aXZhdGVzIHNjcm9sbGluZyBieSBkcmFnICovXHJcbiAgICAgICAgICAgICAgICAgICAgZHJhZ1Njcm9sbDogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICBkcmFnT3B0aW9uczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBleGNsdWRlOiBbJ2lucHV0JywgJ3RleHRhcmVhJywgJ2EnLCAnYnV0dG9uJywgJy4nICsgdGhpcy5jbGFzc0lnbm9yZSwgJ3NlbGVjdCddLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBvbmx5OiBbXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgLyogYWN0aXZhdGVzIGEgc2Nyb2xsIGZhZGUgd2hlbiBzY3JvbGxpbmcgYnkgZHJhZyAqL1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBmYWRlOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBmYWRlOiBicmFrZSBhY2NlbGVyYXRpb24gaW4gcGl4ZWxzIHBlciBzZWNvbmQgcGVyIHNlY29uZCAocC9zwrIpICovXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyYWtlU3BlZWQ6IDI1MDAsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIGZhZGU6IGZyYW1lcyBwZXIgc2Vjb25kIG9mIHRoZSB6d29vc2ggZmFkZW91dCBhbmltYXRpb24gKD49MjUgbG9va3MgbGlrZSBtb3Rpb24pICovXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZwczogMzAsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIGZhZGU6IHRoaXMgc3BlZWQgd2lsbCBuZXZlciBiZSBleGNlZWRlZCAqL1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBtYXhTcGVlZDogMzAwMCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgLyogZmFkZTogbWluaW11bSBzcGVlZCB3aGljaCB0cmlnZ2VycyB0aGUgZmFkZSAqL1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBtaW5TcGVlZDogMzAwXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAvKiBhY3RpdmF0ZXMvZGVhY3RpdmF0ZXMgc2Nyb2xsaW5nIGJ5IHdoZWVsLiBJZiB0aGUgZHJlaWN0aW9uIGlzIHZlcnRpY2FsIGFuZCB0aGVyZSBhcmVcclxuICAgICAgICAgICAgICAgICAgICAgKiBzY3JvbGxiYXJzIHByZXNlbnQsIHp3b29zaCBsZXRzIGxlYXZlcyBzY3JvbGxpbmcgdG8gdGhlIGJyb3dzZXIuICovXHJcbiAgICAgICAgICAgICAgICAgICAgd2hlZWxTY3JvbGw6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgd2hlZWxPcHRpb25zOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIGRpcmVjdGlvbiB0byBzY3JvbGwgd2hlbiB0aGUgbW91c2Ugd2hlZWwgaXMgdXNlZCAqL1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkaXJlY3Rpb246ICd2ZXJ0aWNhbCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIGFtb3VudCBvZiBwaXhlbHMgZm9yIG9uZSBzY3JvbGwgc3RlcCAqL1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGVwOiAxMTQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIHNjcm9sbCBzbW9vdGggb3IgaW5zdGFudCAqL1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzbW9vdGg6IHRydWVcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIC8qIGFjdGl2YXRlcy9kZWFjdGl2YXRlcyB6b29taW5nIGJ5IHdoZWVsLiBXb3JrcyBvbmx5IHdpdGggYSBDU1MzIDJEIFRyYW5zZm9ybSBjYXBhYmxlIGJyb3dzZXIuXHJcbiAgICAgICAgICAgICAgICAgICAgICogQHNlZSBodHRwOi8vY2FuaXVzZS5jb20vI2ZlYXQ9dHJhbnNmb3JtczJkICovXHJcbiAgICAgICAgICAgICAgICAgICAgd2hlZWxab29tOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICB6b29tT3B0aW9uczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiB0aGUgbWF4aW11bSBzY2FsZSwgMCBtZWFucyBubyBtYXhpbXVtICovXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1heFNjYWxlOiAwLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiB0aGUgbWluaW11bSBzY2FsZSwgMCBtZWFucyBubyBtaW5pbXVtICovXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1pblNjYWxlOiAwLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBvbmUgc3RlcCB3aGVuIHVzaW5nIHRoZSB3aGVlbCB0byB6b29tICovXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0ZXA6IDAuMSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgLyogbW91c2Ugd2hlZWwgZGlyZWN0aW9uIHRvIHpvb20gbGFyZ2VyICovXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpcmVjdGlvbjogJ3VwJ1xyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgLyogbGV0IHp3b29zaCBoYW5kbGUgYW5jaG9yIGxpbmtzIHRhcmdldGluZyB0byBhbiBhbmNob3IgaW5zaWRlIG9mIHRoaXMgendvb3NoIGVsZW1lbnQuXHJcbiAgICAgICAgICAgICAgICAgICAgICogdGhlIGVsZW1lbnQgb3V0c2lkZSAobWF5YmUgdGhlIGJvZHkpIGhhbmRsZXMgYW5jaG9ycyB0b28uIElmIHlvdSB3YW50IHRvIHByZXZlbnQgdGhpcyxcclxuICAgICAgICAgICAgICAgICAgICAgKiBhZGQgdG8gYm9keSBhcyB6d29vc2ggZWxlbWVudCB0b28uICovXHJcbiAgICAgICAgICAgICAgICAgICAgaGFuZGxlQW5jaG9yczogdHJ1ZVxyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgIC8qIG1lcmdlIHRoZSBkZWZhdWx0IG9wdGlvbiBvYmplY3RzIHdpdGggdGhlIHByb3ZpZGVkIG9uZSAqL1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIG9wdGlvbnMpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2Ygb3B0aW9uc1trZXldID09PSAnb2JqZWN0Jykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgb2tleSBpbiBvcHRpb25zW2tleV0pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAob3B0aW9uc1trZXldLmhhc093blByb3BlcnR5KG9rZXkpKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnNba2V5XVtva2V5XSA9IG9wdGlvbnNba2V5XVtva2V5XTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMub3B0aW9uc1trZXldID0gb3B0aW9uc1trZXldO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdGhpcy5pbml0KCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgICAqIEluaXRpYWxpemUgRE9NIG1hbmlwdWxhdGlvbnMgYW5kIGV2ZW50IGhhbmRsZXJzXHJcbiAgICAgICAgICAgICAqXHJcbiAgICAgICAgICAgICAqIEByZXR1cm4ge3ZvaWR9XHJcbiAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLmluaXQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5pbml0Qm9keSgpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jb250YWluZXIuY2xhc3NOYW1lICs9IFwiIFwiICsgdGhpcy5jbGFzc091dGVyICsgXCIgXCI7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNjcm9sbEVsZW1lbnQgPSB0aGlzLmNvbnRhaW5lcjtcclxuICAgICAgICAgICAgICAgIHZhciB4ID0gdGhpcy5nZXRTY3JvbGxMZWZ0KCk7XHJcbiAgICAgICAgICAgICAgICB2YXIgeSA9IHRoaXMuZ2V0U2Nyb2xsVG9wKCk7XHJcbiAgICAgICAgICAgICAgICAvKiBjcmVhdGUgaW5uZXIgZGl2IGVsZW1lbnQgYW5kIGFwcGVuZCBpdCB0byB0aGUgY29udGFpbmVyIHdpdGggaXRzIGNvbnRlbnRzIGluIGl0ICovXHJcbiAgICAgICAgICAgICAgICB0aGlzLmlubmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuaW5uZXIuY2xhc3NOYW1lICs9IFwiIFwiICsgdGhpcy5jbGFzc0lubmVyICsgXCIgXCIgKyB0aGlzLmNsYXNzVW5pcXVlICsgXCIgXCI7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNjYWxlRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNjYWxlRWxlbWVudC5jbGFzc05hbWUgKz0gXCIgXCIgKyB0aGlzLmNsYXNzU2NhbGUgKyBcIiBcIjtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2NhbGVFbGVtZW50LmFwcGVuZENoaWxkKHRoaXMuaW5uZXIpO1xyXG4gICAgICAgICAgICAgICAgLyogbW92ZSBhbGwgY2hpbGROb2RlcyB0byB0aGUgbmV3IGlubmVyIGVsZW1lbnQgKi9cclxuICAgICAgICAgICAgICAgIHdoaWxlICh0aGlzLmNvbnRhaW5lci5jaGlsZE5vZGVzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmlubmVyLmFwcGVuZENoaWxkKHRoaXMuY29udGFpbmVyLmNoaWxkTm9kZXNbMF0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdGhpcy5jb250YWluZXIuYXBwZW5kQ2hpbGQodGhpcy5zY2FsZUVsZW1lbnQpO1xyXG4gICAgICAgICAgICAgICAgdmFyIGJvcmRlciA9IHRoaXMuZ2V0Qm9yZGVyKHRoaXMuY29udGFpbmVyKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuaW5uZXIuc3R5bGUubWluV2lkdGggPSAodGhpcy5jb250YWluZXIuc2Nyb2xsV2lkdGggLSBib3JkZXJbMF0pICsgJ3B4JztcclxuICAgICAgICAgICAgICAgIHRoaXMuaW5uZXIuc3R5bGUubWluSGVpZ2h0ID0gKHRoaXMuY29udGFpbmVyLnNjcm9sbEhlaWdodCAtIGJvcmRlclsxXSkgKyAncHgnO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zY2FsZUVsZW1lbnQuc3R5bGUubWluV2lkdGggPSB0aGlzLmlubmVyLnN0eWxlLm1pbldpZHRoO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zY2FsZUVsZW1lbnQuc3R5bGUubWluSGVpZ2h0ID0gdGhpcy5pbm5lci5zdHlsZS5taW5IZWlnaHQ7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNjYWxlRWxlbWVudC5zdHlsZS5vdmVyZmxvdyA9ICdoaWRkZW4nO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5pbml0R3JpZCgpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5vbGRDbGllbnRXaWR0aCA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRXaWR0aDtcclxuICAgICAgICAgICAgICAgIHRoaXMub2xkQ2xpZW50SGVpZ2h0ID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudEhlaWdodDtcclxuICAgICAgICAgICAgICAgIC8qIGp1c3QgY2FsbCB0aGUgZnVuY3Rpb24sIHRvIHRyaWdnZXIgcG9zc2libGUgZXZlbnRzICovXHJcbiAgICAgICAgICAgICAgICB0aGlzLm9uU2Nyb2xsKCk7XHJcbiAgICAgICAgICAgICAgICAvKiBzY3JvbGwgdG8gdGhlIGluaXRpYWwgcG9zaXRpb24gKi9cclxuICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsVG8oeCwgeSwgZmFsc2UpO1xyXG4gICAgICAgICAgICAgICAgLyogRXZlbnQgaGFuZGxlciByZWdpc3RyYXRpb24gc3RhcnQgaGVyZSAqL1xyXG4gICAgICAgICAgICAgICAgdGhpcy5pbml0V2hlZWxTY3JvbGwoKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuaW5pdFdoZWVsWm9vbSgpO1xyXG4gICAgICAgICAgICAgICAgLyogc2Nyb2xsaGFuZGxlciAqL1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zY3JvbGxIYW5kbGVyID0gZnVuY3Rpb24gKGUpIHsgcmV0dXJuIF90aGlzLm9uU2Nyb2xsKGUpOyB9O1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKHRoaXMuY29udGFpbmVyLCAnc2Nyb2xsJywgdGhpcy5zY3JvbGxIYW5kbGVyKTtcclxuICAgICAgICAgICAgICAgIC8qIGlmIHRoZSBzY3JvbGwgZWxlbWVudCBpcyBib2R5LCBhZGp1c3QgdGhlIGlubmVyIGRpdiB3aGVuIHJlc2l6aW5nICovXHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5pc0JvZHkpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnJlc2l6ZUhhbmRsZXIgPSBmdW5jdGlvbiAoZSkgeyByZXR1cm4gX3RoaXMub25SZXNpemUoZSk7IH07IC8vVE9ETzogc2FtZSBhcyBhYm92ZSBpbiB0aGUgd2hlZWwgaGFuZGxlclxyXG4gICAgICAgICAgICAgICAgICAgIHdpbmRvdy5vbnJlc2l6ZSA9IHRoaXMucmVzaXplSGFuZGxlcjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHRoaXMuaW5pdERyYWdTY3JvbGwoKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuaW5pdEFuY2hvcnMoKTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgICAqIFJlaW5pdGlhbGl6ZSB0aGUgendvb3NoIGVsZW1lbnRcclxuICAgICAgICAgICAgICpcclxuICAgICAgICAgICAgICogQHJldHVybiB7Wndvb3NofSAtIFRoZSBad29vc2ggb2JqZWN0IGluc3RhbmNlXHJcbiAgICAgICAgICAgICAqIEBUT0RPOiBwcmVzZXJ2ZSBzY3JvbGwgcG9zaXRpb24gaW4gaW5pdCgpXHJcbiAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLnJlaW5pdCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZGVzdHJveSgpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jbGFzc1VuaXF1ZSA9ICd6dy0nICsgTWF0aC5yYW5kb20oKS50b1N0cmluZygzNikuc3Vic3RyaW5nKDcpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5pbml0KCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgWndvb3NoLnByb3RvdHlwZS5pbml0Qm9keSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuaXNCb2R5ID0gdGhpcy5jb250YWluZXIudGFnTmFtZSA9PT0gXCJCT0RZXCIgPyB0cnVlIDogZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAvKiBDaHJvbWUgc29sdXRpb24gdG8gc2Nyb2xsIHRoZSBib2R5IGlzIG5vdCByZWFsbHkgdmlhYmxlLCBzbyB3ZSBjcmVhdGUgYSBmYWtlIGJvZHlcclxuICAgICAgICAgICAgICAgICAqIGRpdiBlbGVtZW50IHRvIHNjcm9sbCBvbiAqL1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuaXNCb2R5ID09PSB0cnVlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHBzZXVkb0JvZHkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHBzZXVkb0JvZHkuY2xhc3NOYW1lICs9IFwiIFwiICsgdGhpcy5jbGFzc0Zha2VCb2R5ICsgXCIgXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgcHNldWRvQm9keS5zdHlsZS5jc3NUZXh0ID0gZG9jdW1lbnQuYm9keS5zdHlsZS5jc3NUZXh0O1xyXG4gICAgICAgICAgICAgICAgICAgIHdoaWxlICh0aGlzLmNvbnRhaW5lci5jaGlsZE5vZGVzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcHNldWRvQm9keS5hcHBlbmRDaGlsZCh0aGlzLmNvbnRhaW5lci5jaGlsZE5vZGVzWzBdKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jb250YWluZXIuYXBwZW5kQ2hpbGQocHNldWRvQm9keSk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jb250YWluZXIgPSBwc2V1ZG9Cb2R5O1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLmluaXRHcmlkID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgLyogc2hvdyB0aGUgZ3JpZCBvbmx5IGlmIGF0IGxlYXN0IG9uZSBvZiB0aGUgZ3JpZCB2YWx1ZXMgaXMgbm90IDEgKi9cclxuICAgICAgICAgICAgICAgIGlmICgodGhpcy5vcHRpb25zLmdyaWRYICE9PSAxIHx8IHRoaXMub3B0aW9ucy5ncmlkWSAhPT0gMSkgJiYgdGhpcy5vcHRpb25zLmdyaWRTaG93KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGJnaSA9IFtdO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3B0aW9ucy5ncmlkWCAhPT0gMSA/IGJnaS5wdXNoKCdsaW5lYXItZ3JhZGllbnQodG8gcmlnaHQsIGdyZXkgMXB4LCB0cmFuc3BhcmVudCAxcHgpJykgOiBudWxsO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3B0aW9ucy5ncmlkWSAhPT0gMSA/IGJnaS5wdXNoKCdsaW5lYXItZ3JhZGllbnQodG8gYm90dG9tLCBncmV5IDFweCwgdHJhbnNwYXJlbnQgMXB4KScpIDogbnVsbDtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZEJlZm9yZUNTUyh0aGlzLmNsYXNzVW5pcXVlLCAnd2lkdGgnLCB0aGlzLmlubmVyLnN0eWxlLm1pbldpZHRoKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZEJlZm9yZUNTUyh0aGlzLmNsYXNzVW5pcXVlLCAnaGVpZ2h0JywgdGhpcy5pbm5lci5zdHlsZS5taW5IZWlnaHQpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkQmVmb3JlQ1NTKHRoaXMuY2xhc3NVbmlxdWUsICdsZWZ0JywgJy0nICsgdGhpcy5nZXRTdHlsZSh0aGlzLmNvbnRhaW5lciwgJ3BhZGRpbmdMZWZ0JykpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkQmVmb3JlQ1NTKHRoaXMuY2xhc3NVbmlxdWUsICd0b3AnLCAnLScgKyB0aGlzLmdldFN0eWxlKHRoaXMuY29udGFpbmVyLCAncGFkZGluZ1RvcCcpKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZEJlZm9yZUNTUyh0aGlzLmNsYXNzVW5pcXVlLCAnYmFja2dyb3VuZC1zaXplJywgKHRoaXMub3B0aW9ucy5ncmlkWCAhPT0gMSA/IHRoaXMub3B0aW9ucy5ncmlkWCArICdweCAnIDogJ2F1dG8gJykgKyAodGhpcy5vcHRpb25zLmdyaWRZICE9PSAxID8gdGhpcy5vcHRpb25zLmdyaWRZICsgJ3B4JyA6ICdhdXRvJykpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkQmVmb3JlQ1NTKHRoaXMuY2xhc3NVbmlxdWUsICdiYWNrZ3JvdW5kLWltYWdlJywgYmdpLmpvaW4oJywgJykpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLmluaXRXaGVlbFNjcm9sbCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XHJcbiAgICAgICAgICAgICAgICAvKiBUT0RPOiBub3QgMiBkaWZmZXJlbnQgZXZlbnQgaGFuZGxlcnMgcmVnaXN0cmF0aW9ucyAtPiBkbyBpdCBpbiB0aGlzLmFkZEV2ZW50TGlzdGVuZXIoKSAqL1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy53aGVlbFNjcm9sbCA9PT0gZmFsc2UpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm1vdXNlU2Nyb2xsSGFuZGxlciA9IGZ1bmN0aW9uIChlKSB7IHJldHVybiBfdGhpcy5kaXNhYmxlTW91c2VTY3JvbGwoZSk7IH07XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zY3JvbGxFbGVtZW50Lm9ubW91c2V3aGVlbCA9IHRoaXMubW91c2VTY3JvbGxIYW5kbGVyO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcih0aGlzLnNjcm9sbEVsZW1lbnQsICd3aGVlbCcsIHRoaXMubW91c2VTY3JvbGxIYW5kbGVyKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHRoaXMub3B0aW9ucy53aGVlbFNjcm9sbCA9PT0gdHJ1ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubW91c2VTY3JvbGxIYW5kbGVyID0gZnVuY3Rpb24gKGUpIHsgcmV0dXJuIF90aGlzLmFjdGl2ZU1vdXNlU2Nyb2xsKGUpOyB9O1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsRWxlbWVudC5vbm1vdXNld2hlZWwgPSB0aGlzLm1vdXNlU2Nyb2xsSGFuZGxlcjtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIodGhpcy5zY3JvbGxFbGVtZW50LCAnd2hlZWwnLCB0aGlzLm1vdXNlU2Nyb2xsSGFuZGxlcik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIC8qIHdoZWVsem9vbSAqL1xyXG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLmluaXRXaGVlbFpvb20gPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zLmdyaWRTaG93ID8gdGhpcy5zY2FsZVRvKDEpIDogbnVsbDtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMud2hlZWxab29tID09PSB0cnVlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5tb3VzZVpvb21IYW5kbGVyID0gZnVuY3Rpb24gKGUpIHsgcmV0dXJuIF90aGlzLmFjdGl2ZU1vdXNlWm9vbShlKTsgfTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIodGhpcy5zY3JvbGxFbGVtZW50LCAnd2hlZWwnLCB0aGlzLm1vdXNlWm9vbUhhbmRsZXIpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLmluaXREcmFnU2Nyb2xsID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIF90aGlzID0gdGhpcztcclxuICAgICAgICAgICAgICAgIC8qIGlmIGRyYWdzY3JvbGwgaXMgYWN0aXZhdGVkLCByZWdpc3RlciBtb3VzZWRvd24gZXZlbnQgKi9cclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMuZHJhZ1Njcm9sbCA9PT0gdHJ1ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaW5uZXIuY2xhc3NOYW1lICs9IFwiIFwiICsgdGhpcy5jbGFzc0dyYWIgKyBcIiBcIjtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm1vdXNlRG93bkhhbmRsZXIgPSBmdW5jdGlvbiAoZSkgeyByZXR1cm4gX3RoaXMubW91c2VEb3duKGUpOyB9O1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcih0aGlzLmlubmVyLCAnbW91c2Vkb3duJywgdGhpcy5tb3VzZURvd25IYW5kbGVyKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY29udGFpbmVyLmNsYXNzTmFtZSArPSBcIiBcIiArIHRoaXMuY2xhc3NOb0dyYWIgKyBcIiBcIjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgWndvb3NoLnByb3RvdHlwZS5pbml0QW5jaG9ycyA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLmhhbmRsZUFuY2hvcnMgPT09IHRydWUpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgbGlua3MgPSB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yQWxsKFwiYVtocmVmXj0nIyddXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaGFzaENoYW5nZUNsaWNrSGFuZGxlciA9IGZ1bmN0aW9uIChlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0YXJnZXQgPSBlID8gZS50YXJnZXQgOiB3aW5kb3cuZXZlbnQuc3JjRWxlbWVudDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB0YXJnZXQgIT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBwdXNoU3RhdGUgY2hhbmdlcyB0aGUgaGFzaCB3aXRob3V0IHRyaWdnZXJpbmcgaGFzaGNoYW5nZSAqL1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGlzdG9yeS5wdXNoU3RhdGUoe30sICcnLCB0YXJnZXQuaHJlZik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiB3ZSBkb24ndCB3YW50IHRvIHRyaWdnZXIgaGFzaGNoYW5nZSwgc28gcHJldmVudCBkZWZhdWx0IGJlaGF2aW9yIHdoZW4gY2xpY2tpbmcgb24gYW5jaG9yIGxpbmtzICovXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0ID8gZS5wcmV2ZW50RGVmYXVsdCgpIDogKGUucmV0dXJuVmFsdWUgPSBmYWxzZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgLyogdHJpZ2dlciBhIGN1c3RvbSBoYXNoY2hhbmdlIGV2ZW50LCBiZWNhdXNlIHB1c2hTdGF0ZSBwcmV2ZW50cyB0aGUgcmVhbCBoYXNoY2hhbmdlIGV2ZW50ICovXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIF90aGlzLnRyaWdnZXJFdmVudCh3aW5kb3csICdteWhhc2hjaGFuZ2UnKTtcclxuICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgIC8qIGxvb3AgdHJvdWdoIGFsbCBhbmNob3IgbGlua3MgaW4gdGhlIGVsZW1lbnQgYW5kIGRpc2FibGUgdGhlbSB0byBwcmV2ZW50IHRoZVxyXG4gICAgICAgICAgICAgICAgICAgICAqIGJyb3dzZXIgZnJvbSBzY3JvbGxpbmcgYmVjYXVzZSBvZiB0aGUgY2hhbmdpbmcgaGFzaCB2YWx1ZS4gSW5zdGVhZCB0aGUgb3duXHJcbiAgICAgICAgICAgICAgICAgICAgICogZXZlbnQgbXloYXNoY2hhbmdlIHNob3VsZCBoYW5kbGUgcGFnZSBhbmQgZWxlbWVudCBzY3JvbGxpbmcgKi9cclxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxpbmtzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcihsaW5rc1tpXSwgJ2NsaWNrJywgdGhpcy5oYXNoQ2hhbmdlQ2xpY2tIYW5kbGVyLCBmYWxzZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaGFzaENoYW5nZUhhbmRsZXIgPSBmdW5jdGlvbiAoZSkgeyByZXR1cm4gX3RoaXMub25IYXNoQ2hhbmdlKGUpOyB9O1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcih3aW5kb3csICdteWhhc2hjaGFuZ2UnLCB0aGlzLmhhc2hDaGFuZ2VIYW5kbGVyKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIod2luZG93LCAnaGFzaGNoYW5nZScsIHRoaXMuaGFzaENoYW5nZUhhbmRsZXIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMub25IYXNoQ2hhbmdlKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIC8qIEBUT0RPOiBTY3JvbGxXaWR0aCBhbmQgQ2xpZW50V2lkdGggU2Nyb2xsSGVpZ2h0IENsaWVudEhlaWdodCAqL1xyXG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLmdldFNjcm9sbExlZnQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zY3JvbGxFbGVtZW50LnNjcm9sbExlZnQ7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIFp3b29zaC5wcm90b3R5cGUuc2V0U2Nyb2xsTGVmdCA9IGZ1bmN0aW9uIChsZWZ0KSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNjcm9sbEVsZW1lbnQuc2Nyb2xsTGVmdCA9IGxlZnQ7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIFp3b29zaC5wcm90b3R5cGUuZ2V0U2Nyb2xsVG9wID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuc2Nyb2xsRWxlbWVudC5zY3JvbGxUb3A7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIFp3b29zaC5wcm90b3R5cGUuc2V0U2Nyb2xsVG9wID0gZnVuY3Rpb24gKHRvcCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zY3JvbGxFbGVtZW50LnNjcm9sbFRvcCA9IHRvcDtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgICAqIEhhbmRsZSBoYXNoY2hhbmdlcyB3aXRoIG93biBzY3JvbGwgZnVuY3Rpb25cclxuICAgICAgICAgICAgICpcclxuICAgICAgICAgICAgICogQHBhcmFtIHtFdmVudH0gZSAtIHRoZSBoYXNoY2hhbmdlIG9yIG15aGFzaGNoYW5nZSBldmVudCwgb3Igbm90aGluZ1xyXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHt2b2lkfVxyXG4gICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgWndvb3NoLnByb3RvdHlwZS5vbkhhc2hDaGFuZ2UgPSBmdW5jdGlvbiAoZSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKGUgPT09IHZvaWQgMCkgeyBlID0gbnVsbDsgfVxyXG4gICAgICAgICAgICAgICAgdmFyIGhhc2ggPSB3aW5kb3cubG9jYXRpb24uaGFzaC5zdWJzdHIoMSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoaGFzaCAhPT0gJycpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgYW5jaG9ycyA9IHRoaXMuY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3JBbGwoJyMnICsgaGFzaCk7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhbmNob3JzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBlbGVtZW50ID0gYW5jaG9yc1tpXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGNvbnRhaW5lciA9IGFuY2hvcnNbaV07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGZpbmQgdGhlIG5leHQgcGFyZW50IHdoaWNoIGlzIGEgY29udGFpbmVyIGVsZW1lbnRcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG91dGVyUmUgPSBuZXcgUmVnRXhwKFwiIFwiICsgdGhpcy5jbGFzc091dGVyICsgXCIgXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbmV4dENvbnRhaW5lciA9IGVsZW1lbnQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHdoaWxlIChjb250YWluZXIgJiYgY29udGFpbmVyLnBhcmVudEVsZW1lbnQgJiYgdGhpcy5jb250YWluZXIgIT09IGNvbnRhaW5lcikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvbnRhaW5lci5jbGFzc05hbWUubWF0Y2gob3V0ZXJSZSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXh0Q29udGFpbmVyID0gY29udGFpbmVyO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGFpbmVyID0gY29udGFpbmVyLnBhcmVudEVsZW1lbnQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGUgIT09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlLnR5cGUgPT09ICdoYXNoY2hhbmdlJykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIHNjcm9sbGluZyBpbnN0YW50bHkgYmFjayB0byBvcmlnaW4sIGJlZm9yZSBkbyB0aGUgYW5pbWF0ZWQgc2Nyb2xsICovXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zY3JvbGxUbyh0aGlzLm9yaWdpblNjcm9sbExlZnQsIHRoaXMub3JpZ2luU2Nyb2xsVG9wLCBmYWxzZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zY3JvbGxUb0VsZW1lbnQobmV4dENvbnRhaW5lcik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgKiBTY3JvbGwgdG8gYW4gZWxlbWVudCBpbiB0aGUgRE9NXHJcbiAgICAgICAgICAgICAqXHJcbiAgICAgICAgICAgICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsZW1lbnQgLSB0aGUgSFRNTEVsZW1lbnQgdG8gc2Nyb2xsIHRvXHJcbiAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLnNjcm9sbFRvRWxlbWVudCA9IGZ1bmN0aW9uIChlbGVtZW50KSB7XHJcbiAgICAgICAgICAgICAgICAvKiBnZXQgcmVsYXRpdmUgY29vcmRzIGZyb20gdGhlIGFuY2hvciBlbGVtZW50ICovXHJcbiAgICAgICAgICAgICAgICB2YXIgeCA9IChlbGVtZW50Lm9mZnNldExlZnQgLSB0aGlzLmNvbnRhaW5lci5vZmZzZXRMZWZ0KSAqIHRoaXMuZ2V0U2NhbGUoKTtcclxuICAgICAgICAgICAgICAgIHZhciB5ID0gKGVsZW1lbnQub2Zmc2V0VG9wIC0gdGhpcy5jb250YWluZXIub2Zmc2V0VG9wKSAqIHRoaXMuZ2V0U2NhbGUoKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsVG8oeCwgeSk7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgKiBXb3JrYXJvdW5kIHRvIG1hbmlwdWxhdGUgOjpiZWZvcmUgQ1NTIHN0eWxlcyB3aXRoIGphdmFzY3JpcHRcclxuICAgICAgICAgICAgICpcclxuICAgICAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGNzc0NsYXNzIC0gdGhlIENTUyBjbGFzcyBuYW1lIHRvIGFkZCA6OmJlZm9yZSBwcm9wZXJ0aWVzXHJcbiAgICAgICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBjc3NQcm9wZXJ0eSAtIHRoZSBDU1MgcHJvcGVydHkgdG8gc2V0XHJcbiAgICAgICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBjc3NWYWx1ZSAtIHRoZSBDU1MgdmFsdWUgdG8gc2V0XHJcbiAgICAgICAgICAgICAqIEByZXR1cm4ge3ZvaWR9XHJcbiAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLmFkZEJlZm9yZUNTUyA9IGZ1bmN0aW9uIChjc3NDbGFzcywgY3NzUHJvcGVydHksIGNzc1ZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGRvY3VtZW50LnN0eWxlU2hlZXRzWzBdLmluc2VydFJ1bGUgPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICAgICAgICAgICAgICBkb2N1bWVudC5zdHlsZVNoZWV0c1swXS5pbnNlcnRSdWxlKCcuJyArIGNzc0NsYXNzICsgJzo6YmVmb3JlIHsgJyArIGNzc1Byb3BlcnR5ICsgJzogJyArIGNzc1ZhbHVlICsgJ30nLCAwKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHR5cGVvZiBkb2N1bWVudC5zdHlsZVNoZWV0c1swXS5hZGRSdWxlID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQuc3R5bGVTaGVldHNbMF0uYWRkUnVsZSgnLicgKyBjc3NDbGFzcyArICc6OmJlZm9yZScsIGNzc1Byb3BlcnR5ICsgJzogJyArIGNzc1ZhbHVlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgICAqIEdldCBjb21wdXRlIHBpeGVsIG51bWJlciBvZiB0aGUgd2hvbGUgd2lkdGggYW5kIGhlaWdodCBmcm9tIGEgYm9yZGVyIG9mIGFuIGVsZW1lbnRcclxuICAgICAgICAgICAgICpcclxuICAgICAgICAgICAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWwgLSB0aGUgSFRNTCBlbGVtZW50XHJcbiAgICAgICAgICAgICAqIEByZXR1cm4ge2FycmF5fSBbd2lkdGgsIGhlaWdodF0gLSB0aGUgYW1vdW50IG9mIHBpeGVsc1xyXG4gICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgWndvb3NoLnByb3RvdHlwZS5nZXRCb3JkZXIgPSBmdW5jdGlvbiAoZWwpIHtcclxuICAgICAgICAgICAgICAgIHZhciBibCA9IHRoaXMuZ2V0U3R5bGUoZWwsICdib3JkZXJMZWZ0V2lkdGgnKTtcclxuICAgICAgICAgICAgICAgIGJsID0gYmwgPT09ICd0aGluJyA/IDEgOiBibCA9PT0gJ21lZGl1bScgPyAzIDogYmwgPT09ICd0aGljaycgPyA1IDogcGFyc2VJbnQoYmwsIDEwKSAhPT0gTmFOID8gcGFyc2VJbnQoYmwsIDEwKSA6IDA7XHJcbiAgICAgICAgICAgICAgICB2YXIgYnIgPSB0aGlzLmdldFN0eWxlKGVsLCAnYm9yZGVyUmlnaHRXaWR0aCcpO1xyXG4gICAgICAgICAgICAgICAgYnIgPSBiciA9PT0gJ3RoaW4nID8gMSA6IGJyID09PSAnbWVkaXVtJyA/IDMgOiBiciA9PT0gJ3RoaWNrJyA/IDUgOiBwYXJzZUludChiciwgMTApICE9PSBOYU4gPyBwYXJzZUludChiciwgMTApIDogMDtcclxuICAgICAgICAgICAgICAgIHZhciBwbCA9IHRoaXMuZ2V0U3R5bGUoZWwsICdwYWRkaW5nTGVmdCcpO1xyXG4gICAgICAgICAgICAgICAgcGwgPSBwbCA9PT0gJ2F1dG8nID8gMCA6IHBhcnNlSW50KHBsLCAxMCkgIT09IE5hTiA/IHBhcnNlSW50KHBsLCAxMCkgOiAwO1xyXG4gICAgICAgICAgICAgICAgdmFyIHByID0gdGhpcy5nZXRTdHlsZShlbCwgJ3BhZGRpbmdSaWdodCcpO1xyXG4gICAgICAgICAgICAgICAgcHIgPSBwciA9PT0gJ2F1dG8nID8gMCA6IHBhcnNlSW50KHByLCAxMCkgIT09IE5hTiA/IHBhcnNlSW50KHByLCAxMCkgOiAwO1xyXG4gICAgICAgICAgICAgICAgdmFyIG1sID0gdGhpcy5nZXRTdHlsZShlbCwgJ21hcmdpbkxlZnQnKTtcclxuICAgICAgICAgICAgICAgIG1sID0gbWwgPT09ICdhdXRvJyA/IDAgOiBwYXJzZUludChtbCwgMTApICE9PSBOYU4gPyBwYXJzZUludChtbCwgMTApIDogMDtcclxuICAgICAgICAgICAgICAgIHZhciBtciA9IHRoaXMuZ2V0U3R5bGUoZWwsICdtYXJnaW5SaWdodCcpO1xyXG4gICAgICAgICAgICAgICAgbXIgPSBtciA9PT0gJ2F1dG8nID8gMCA6IHBhcnNlSW50KG1yLCAxMCkgIT09IE5hTiA/IHBhcnNlSW50KG1yLCAxMCkgOiAwO1xyXG4gICAgICAgICAgICAgICAgdmFyIGJ0ID0gdGhpcy5nZXRTdHlsZShlbCwgJ2JvcmRlclRvcFdpZHRoJyk7XHJcbiAgICAgICAgICAgICAgICBidCA9IGJ0ID09PSAndGhpbicgPyAxIDogYnQgPT09ICdtZWRpdW0nID8gMyA6IGJ0ID09PSAndGhpY2snID8gNSA6IHBhcnNlSW50KGJ0LCAxMCkgIT09IE5hTiA/IHBhcnNlSW50KGJ0LCAxMCkgOiAwO1xyXG4gICAgICAgICAgICAgICAgdmFyIGJiID0gdGhpcy5nZXRTdHlsZShlbCwgJ2JvcmRlckJvdHRvbVdpZHRoJyk7XHJcbiAgICAgICAgICAgICAgICBiYiA9IGJiID09PSAndGhpbicgPyAxIDogYmIgPT09ICdtZWRpdW0nID8gMyA6IGJiID09PSAndGhpY2snID8gNSA6IHBhcnNlSW50KGJiLCAxMCkgIT09IE5hTiA/IHBhcnNlSW50KGJiLCAxMCkgOiAwO1xyXG4gICAgICAgICAgICAgICAgdmFyIHB0ID0gdGhpcy5nZXRTdHlsZShlbCwgJ3BhZGRpbmdUb3AnKTtcclxuICAgICAgICAgICAgICAgIHB0ID0gcHQgPT09ICdhdXRvJyA/IDAgOiBwYXJzZUludChwdCwgMTApICE9PSBOYU4gPyBwYXJzZUludChwdCwgMTApIDogMDtcclxuICAgICAgICAgICAgICAgIHZhciBwYiA9IHRoaXMuZ2V0U3R5bGUoZWwsICdwYWRkaW5nQm90dG9tJyk7XHJcbiAgICAgICAgICAgICAgICBwYiA9IHBiID09PSAnYXV0bycgPyAwIDogcGFyc2VJbnQocGIsIDEwKSAhPT0gTmFOID8gcGFyc2VJbnQocGIsIDEwKSA6IDA7XHJcbiAgICAgICAgICAgICAgICB2YXIgbXQgPSB0aGlzLmdldFN0eWxlKGVsLCAnbWFyZ2luVG9wJyk7XHJcbiAgICAgICAgICAgICAgICBtdCA9IG10ID09PSAnYXV0bycgPyAwIDogcGFyc2VJbnQobXQsIDEwKSAhPT0gTmFOID8gcGFyc2VJbnQobXQsIDEwKSA6IDA7XHJcbiAgICAgICAgICAgICAgICB2YXIgbWIgPSB0aGlzLmdldFN0eWxlKGVsLCAnbWFyZ2luQm90dG9tJyk7XHJcbiAgICAgICAgICAgICAgICBtYiA9IG1iID09PSAnYXV0bycgPyAwIDogcGFyc2VJbnQobWIsIDEwKSAhPT0gTmFOID8gcGFyc2VJbnQobWIsIDEwKSA6IDA7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gW1xyXG4gICAgICAgICAgICAgICAgICAgIChwbCArIHByICsgYmwgKyBiciArIG1sICsgbXIpLFxyXG4gICAgICAgICAgICAgICAgICAgIChwdCArIHBiICsgYnQgKyBiYiArIG10ICsgbWIpXHJcbiAgICAgICAgICAgICAgICBdO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAvKipcclxuICAgICAgICAgICAgICogRGlzYWJsZXMgdGhlIHNjcm9sbCB3aGVlbCBvZiB0aGUgbW91c2VcclxuICAgICAgICAgICAgICpcclxuICAgICAgICAgICAgICogQHBhcmFtIHtNb3VzZVdoZWVsRXZlbnR9IGUgLSB0aGUgbW91c2Ugd2hlZWwgZXZlbnRcclxuICAgICAgICAgICAgICogQHJldHVybiB7dm9pZH1cclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIFp3b29zaC5wcm90b3R5cGUuZGlzYWJsZU1vdXNlU2Nyb2xsID0gZnVuY3Rpb24gKGUpIHtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmVsZW1lbnRCZWhpbmRDdXJzb3JJc01lKGUuY2xpZW50WCwgZS5jbGllbnRZKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY2xlYXJUaW1lb3V0cygpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBlID0gd2luZG93LmV2ZW50O1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0ID8gZS5wcmV2ZW50RGVmYXVsdCgpIDogKGUucmV0dXJuVmFsdWUgPSBmYWxzZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgZS5yZXR1cm5WYWx1ZSA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAvKipcclxuICAgICAgICAgICAgICogRGV0ZXJtaW5lIHdoZXRoZXIgYW4gZWxlbWVudCBoYXMgYSBzY3JvbGxiYXIgb3Igbm90XHJcbiAgICAgICAgICAgICAqXHJcbiAgICAgICAgICAgICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsZW1lbnQgLSB0aGUgSFRNTEVsZW1lbnRcclxuICAgICAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGRpcmVjdGlvbiAtIGRldGVybWluZSB0aGUgdmVydGljYWwgb3IgaG9yaXpvbnRhbCBzY3JvbGxiYXI/XHJcbiAgICAgICAgICAgICAqIEByZXR1cm4ge2Jvb2xlYW59IC0gd2hldGhlciB0aGUgZWxlbWVudCBoYXMgc2Nyb2xsYmFycyBvciBub3RcclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIFp3b29zaC5wcm90b3R5cGUuaGFzU2Nyb2xsYmFyID0gZnVuY3Rpb24gKGVsZW1lbnQsIGRpcmVjdGlvbikge1xyXG4gICAgICAgICAgICAgICAgdmFyIGhhcyA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgdmFyIG92ZXJmbG93ID0gJ292ZXJmbG93JztcclxuICAgICAgICAgICAgICAgIGlmIChkaXJlY3Rpb24gPT09ICd2ZXJ0aWNhbCcpIHtcclxuICAgICAgICAgICAgICAgICAgICBvdmVyZmxvdyA9ICdvdmVyZmxvd1knO1xyXG4gICAgICAgICAgICAgICAgICAgIGhhcyA9IGVsZW1lbnQuc2Nyb2xsSGVpZ2h0ID4gZWxlbWVudC5jbGllbnRIZWlnaHQ7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIGlmIChkaXJlY3Rpb24gPT09ICdob3Jpem9udGFsJykge1xyXG4gICAgICAgICAgICAgICAgICAgIG92ZXJmbG93ID0gJ292ZXJmbG93WCc7XHJcbiAgICAgICAgICAgICAgICAgICAgaGFzID0gZWxlbWVudC5zY3JvbGxXaWR0aCA+IGVsZW1lbnQuY2xpZW50V2lkdGg7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAvLyBDaGVjayB0aGUgb3ZlcmZsb3cgYW5kIG92ZXJmbG93RGlyZWN0aW9uIHByb3BlcnRpZXMgZm9yIFwiYXV0b1wiIGFuZCBcInZpc2libGVcIiB2YWx1ZXNcclxuICAgICAgICAgICAgICAgIGhhcyA9IHRoaXMuZ2V0U3R5bGUodGhpcy5jb250YWluZXIsICdvdmVyZmxvdycpID09PSBcInZpc2libGVcIlxyXG4gICAgICAgICAgICAgICAgICAgIHx8IHRoaXMuZ2V0U3R5bGUodGhpcy5jb250YWluZXIsICdvdmVyZmxvd1knKSA9PT0gXCJ2aXNpYmxlXCJcclxuICAgICAgICAgICAgICAgICAgICB8fCAoaGFzICYmIHRoaXMuZ2V0U3R5bGUodGhpcy5jb250YWluZXIsICdvdmVyZmxvdycpID09PSBcImF1dG9cIilcclxuICAgICAgICAgICAgICAgICAgICB8fCAoaGFzICYmIHRoaXMuZ2V0U3R5bGUodGhpcy5jb250YWluZXIsICdvdmVyZmxvd1knKSA9PT0gXCJhdXRvXCIpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGhhcztcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgICAqIEVuYWJsZXMgdGhlIHNjcm9sbCB3aGVlbCBvZiB0aGUgbW91c2UgdG8gc2Nyb2xsLCBzcGVjaWFsbHkgZm9yIGRpdnMgd2l0aG91ciBzY3JvbGxiYXJcclxuICAgICAgICAgICAgICpcclxuICAgICAgICAgICAgICogQHBhcmFtIHtNb3VzZVdoZWVsRXZlbnR9IGUgLSB0aGUgbW91c2Ugd2hlZWwgZXZlbnRcclxuICAgICAgICAgICAgICogQHJldHVybiB7dm9pZH1cclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIFp3b29zaC5wcm90b3R5cGUuYWN0aXZlTW91c2VTY3JvbGwgPSBmdW5jdGlvbiAoZSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCFlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZSA9IHdpbmRvdy5ldmVudDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmVsZW1lbnRCZWhpbmRDdXJzb3JJc01lKGUuY2xpZW50WCwgZS5jbGllbnRZKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBkaXJlY3Rpb247XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKFwiZGVsdGFZXCIgaW4gZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkaXJlY3Rpb24gPSBlLmRlbHRhWSA+IDAgPyAnZG93bicgOiAndXAnO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChcIndoZWVsRGVsdGFcIiBpbiBlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpcmVjdGlvbiA9IGUud2hlZWxEZWx0YSA+IDAgPyAndXAnIDogJ2Rvd24nO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAvKiB1c2UgdGhlIG5vcm1hbCBzY3JvbGwsIHdoZW4gdGhlcmUgYXJlIHNjcm9sbGJhcnMgYW5kIHRoZSBkaXJlY3Rpb24gaXMgXCJ2ZXJ0aWNhbFwiICovXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy53aGVlbE9wdGlvbnMuZGlyZWN0aW9uID09PSAndmVydGljYWwnICYmIHRoaXMuaGFzU2Nyb2xsYmFyKHRoaXMuc2Nyb2xsRWxlbWVudCwgdGhpcy5vcHRpb25zLndoZWVsT3B0aW9ucy5kaXJlY3Rpb24pKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghKCh0aGlzLnRyaWdnZXJlZC5jb2xsaWRlQm90dG9tICYmIGRpcmVjdGlvbiA9PT0gJ2Rvd24nKSB8fCAodGhpcy50cmlnZ2VyZWQuY29sbGlkZVRvcCAmJiBkaXJlY3Rpb24gPT09ICd1cCcpKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jbGVhclRpbWVvdXRzKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kaXNhYmxlTW91c2VTY3JvbGwoZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHggPSB0aGlzLmdldFNjcm9sbExlZnQoKTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgeSA9IHRoaXMuZ2V0U2Nyb2xsVG9wKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy53aGVlbE9wdGlvbnMuZGlyZWN0aW9uID09PSAnaG9yaXpvbnRhbCcpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgeCA9IHRoaXMuZ2V0U2Nyb2xsTGVmdCgpICsgKGRpcmVjdGlvbiA9PT0gJ2Rvd24nID8gdGhpcy5vcHRpb25zLndoZWVsT3B0aW9ucy5zdGVwIDogdGhpcy5vcHRpb25zLndoZWVsT3B0aW9ucy5zdGVwICogLTEpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmICh0aGlzLm9wdGlvbnMud2hlZWxPcHRpb25zLmRpcmVjdGlvbiA9PT0gJ3ZlcnRpY2FsJykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB5ID0gdGhpcy5nZXRTY3JvbGxUb3AoKSArIChkaXJlY3Rpb24gPT09ICdkb3duJyA/IHRoaXMub3B0aW9ucy53aGVlbE9wdGlvbnMuc3RlcCA6IHRoaXMub3B0aW9ucy53aGVlbE9wdGlvbnMuc3RlcCAqIC0xKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zY3JvbGxUbyh4LCB5LCBmYWxzZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgKiBFbmFibGVzIHRoZSBzY3JvbGwgd2hlZWwgb2YgdGhlIG1vdXNlIHRvIHpvb21cclxuICAgICAgICAgICAgICpcclxuICAgICAgICAgICAgICogQHBhcmFtIHtNb3VzZVdoZWVsRXZlbnR9IGUgLSB0aGUgbW91c2Ugd2hlZWwgZXZlbnRcclxuICAgICAgICAgICAgICogQHJldHVybiB7dm9pZH1cclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIFp3b29zaC5wcm90b3R5cGUuYWN0aXZlTW91c2Vab29tID0gZnVuY3Rpb24gKGUpIHtcclxuICAgICAgICAgICAgICAgIGlmICghZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGUgPSB3aW5kb3cuZXZlbnQ7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5lbGVtZW50QmVoaW5kQ3Vyc29ySXNNZShlLmNsaWVudFgsIGUuY2xpZW50WSkpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgZGlyZWN0aW9uO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChcImRlbHRhWVwiIGluIGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGlyZWN0aW9uID0gZS5kZWx0YVkgPiAwID8gJ2Rvd24nIDogJ3VwJztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoXCJ3aGVlbERlbHRhXCIgaW4gZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkaXJlY3Rpb24gPSBlLndoZWVsRGVsdGEgPiAwID8gJ3VwJyA6ICdkb3duJztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRpcmVjdGlvbiA9PT0gdGhpcy5vcHRpb25zLnpvb21PcHRpb25zLmRpcmVjdGlvbikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgc2NhbGUgPSB0aGlzLmdldFNjYWxlKCkgKiAoMSArIHRoaXMub3B0aW9ucy56b29tT3B0aW9ucy5zdGVwKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzY2FsZSA9IHRoaXMuZ2V0U2NhbGUoKSAvICgxICsgdGhpcy5vcHRpb25zLnpvb21PcHRpb25zLnN0ZXApO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnNjYWxlVG8oc2NhbGUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAvKipcclxuICAgICAgICAgICAgICogQ2FsY3VsYXRlcyB0aGUgc2l6ZSBvZiB0aGUgdmVydGljYWwgc2Nyb2xsYmFyLlxyXG4gICAgICAgICAgICAgKlxyXG4gICAgICAgICAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbCAtIFRoZSBIVE1MRWxlbWVtbnRcclxuICAgICAgICAgICAgICogQHJldHVybiB7bnVtYmVyfSAtIHRoZSBhbW91bnQgb2YgcGl4ZWxzIHVzZWQgYnkgdGhlIHZlcnRpY2FsIHNjcm9sbGJhclxyXG4gICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgWndvb3NoLnByb3RvdHlwZS5zY3JvbGxiYXJXaWR0aCA9IGZ1bmN0aW9uIChlbCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGVsLm9mZnNldFdpZHRoIC0gZWwuY2xpZW50V2lkdGggLSBwYXJzZUludCh0aGlzLmdldFN0eWxlKGVsLCAnYm9yZGVyTGVmdFdpZHRoJykpIC0gcGFyc2VJbnQodGhpcy5nZXRTdHlsZShlbCwgJ2JvcmRlclJpZ2h0V2lkdGgnKSk7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgKiBDYWxjdWxhdGVzIHRoZSBzaXplIG9mIHRoZSBob3Jpem9udGFsIHNjcm9sbGJhci5cclxuICAgICAgICAgICAgICpcclxuICAgICAgICAgICAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWwgLSBUaGUgSFRNTEVsZW1lbW50XHJcbiAgICAgICAgICAgICAqIEByZXR1cm4ge251bWJlcn0gLSB0aGUgYW1vdW50IG9mIHBpeGVscyB1c2VkIGJ5IHRoZSBob3Jpem9udGFsIHNjcm9sbGJhclxyXG4gICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgWndvb3NoLnByb3RvdHlwZS5zY3JvbGxiYXJIZWlnaHQgPSBmdW5jdGlvbiAoZWwpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBlbC5vZmZzZXRIZWlnaHQgLSBlbC5jbGllbnRIZWlnaHQgLSBwYXJzZUludCh0aGlzLmdldFN0eWxlKGVsLCAnYm9yZGVyVG9wV2lkdGgnKSkgLSBwYXJzZUludCh0aGlzLmdldFN0eWxlKGVsLCAnYm9yZGVyQm90dG9tV2lkdGgnKSk7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgKiBSZXRyaWV2ZXMgdGhlIGN1cnJlbnQgc2NhbGUgdmFsdWUgb3IgMSBpZiBpdCBpcyBub3Qgc2V0LlxyXG4gICAgICAgICAgICAgKlxyXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHtudW1iZXJ9IC0gdGhlIGN1cnJlbnQgc2NhbGUgdmFsdWVcclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIFp3b29zaC5wcm90b3R5cGUuZ2V0U2NhbGUgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHRoaXMuaW5uZXIuc3R5bGUudHJhbnNmb3JtICE9PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciByID0gdGhpcy5pbm5lci5zdHlsZS50cmFuc2Zvcm0ubWF0Y2goL3NjYWxlXFwoKFswLTksXFwuXSspXFwpLykgfHwgW1wiXCJdO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBwYXJzZUZsb2F0KHJbMV0pIHx8IDE7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gMTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgICAqIFNjYWxlcyB0aGUgaW5uZXIgZWxlbWVudCBieSBhIHJlbGF0aWNlIHZhbHVlIGJhc2VkIG9uIHRoZSBjdXJyZW50IHNjYWxlIHZhbHVlLlxyXG4gICAgICAgICAgICAgKlxyXG4gICAgICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0gcGVyY2VudCAtIHBlcmNlbnRhZ2Ugb2YgdGhlIGN1cnJlbnQgc2NhbGUgdmFsdWVcclxuICAgICAgICAgICAgICogQHBhcmFtIHtib29sZWFufSBob25vdXJMaW1pdHMgLSB3aGV0aGVyIHRvIGhvbm91ciBtYXhTY2FsZSBhbmQgdGhlIG1pbmltdW0gd2lkdGggYW5kIGhlaWdodFxyXG4gICAgICAgICAgICAgKiBvZiB0aGUgY29udGFpbmVyIGVsZW1lbnQuXHJcbiAgICAgICAgICAgICAqIEByZXR1cm4ge3ZvaWR9XHJcbiAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLnNjYWxlQnkgPSBmdW5jdGlvbiAocGVyY2VudCwgaG9ub3VyTGltaXRzKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoaG9ub3VyTGltaXRzID09PSB2b2lkIDApIHsgaG9ub3VyTGltaXRzID0gdHJ1ZTsgfVxyXG4gICAgICAgICAgICAgICAgdmFyIHNjYWxlID0gdGhpcy5nZXRTY2FsZSgpICogKHBlcmNlbnQgLyAxMDApO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zY2FsZVRvKHNjYWxlLCBob25vdXJMaW1pdHMpO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAvKipcclxuICAgICAgICAgICAgICogU2NhbGVzIHRoZSBpbm5lciBlbGVtZW50IHRvIGFuIGFic29sdXRlIHZhbHVlLlxyXG4gICAgICAgICAgICAgKlxyXG4gICAgICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0gc2NhbGUgLSB0aGUgc2NhbGVcclxuICAgICAgICAgICAgICogQHBhcmFtIHtib29sZWFufSBob25vdXJMaW1pdHMgLSB3aGV0aGVyIHRvIGhvbm91ciBtYXhTY2FsZSBhbmQgdGhlIG1pbmltdW0gd2lkdGggYW5kIGhlaWdodFxyXG4gICAgICAgICAgICAgKiBvZiB0aGUgY29udGFpbmVyIGVsZW1lbnQuXHJcbiAgICAgICAgICAgICAqIEByZXR1cm4ge3ZvaWR9XHJcbiAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLnNjYWxlVG8gPSBmdW5jdGlvbiAoc2NhbGUsIGhvbm91ckxpbWl0cykge1xyXG4gICAgICAgICAgICAgICAgaWYgKGhvbm91ckxpbWl0cyA9PT0gdm9pZCAwKSB7IGhvbm91ckxpbWl0cyA9IHRydWU7IH1cclxuICAgICAgICAgICAgICAgIHZhciB3aWR0aCA9IChwYXJzZUZsb2F0KHRoaXMuaW5uZXIuc3R5bGUubWluV2lkdGgpICogc2NhbGUpO1xyXG4gICAgICAgICAgICAgICAgdmFyIGhlaWdodCA9IChwYXJzZUZsb2F0KHRoaXMuaW5uZXIuc3R5bGUubWluSGVpZ2h0KSAqIHNjYWxlKTtcclxuICAgICAgICAgICAgICAgIC8qIFNjcm9sbGJhcnMgaGF2ZSB3aWR0aCBhbmQgaGVpZ2h0IHRvbyAqL1xyXG4gICAgICAgICAgICAgICAgdmFyIG1pbldpZHRoID0gdGhpcy5jb250YWluZXIuY2xpZW50V2lkdGggKyB0aGlzLnNjcm9sbGJhcldpZHRoKHRoaXMuY29udGFpbmVyKTtcclxuICAgICAgICAgICAgICAgIHZhciBtaW5IZWlnaHQgPSB0aGlzLmNvbnRhaW5lci5jbGllbnRIZWlnaHQgKyB0aGlzLnNjcm9sbGJhckhlaWdodCh0aGlzLmNvbnRhaW5lcik7XHJcbiAgICAgICAgICAgICAgICBpZiAoaG9ub3VyTGltaXRzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLyogbG9vcCBhcyBsb25nIGFzIGFsbCBsaW1pdHMgYXJlIGhvbm91cmVkICovXHJcbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKChzY2FsZSA+IHRoaXMub3B0aW9ucy56b29tT3B0aW9ucy5tYXhTY2FsZSAmJiB0aGlzLm9wdGlvbnMuem9vbU9wdGlvbnMubWF4U2NhbGUgIT09IDApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHx8IChzY2FsZSA8IHRoaXMub3B0aW9ucy56b29tT3B0aW9ucy5taW5TY2FsZSAmJiB0aGlzLm9wdGlvbnMuem9vbU9wdGlvbnMubWluU2NhbGUgIT09IDApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHx8ICh3aWR0aCA8IHRoaXMuY29udGFpbmVyLmNsaWVudFdpZHRoICYmICF0aGlzLmlzQm9keSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgfHwgaGVpZ2h0IDwgdGhpcy5jb250YWluZXIuY2xpZW50SGVpZ2h0ICYmICF0aGlzLmlzQm9keSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2NhbGUgPiB0aGlzLm9wdGlvbnMuem9vbU9wdGlvbnMubWF4U2NhbGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjYWxlID0gdGhpcy5vcHRpb25zLnpvb21PcHRpb25zLm1heFNjYWxlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKHNjYWxlIDwgdGhpcy5vcHRpb25zLnpvb21PcHRpb25zLm1pblNjYWxlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY2FsZSA9IHRoaXMub3B0aW9ucy56b29tT3B0aW9ucy5taW5TY2FsZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLnpvb21PcHRpb25zLm1heFNjYWxlICE9PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWR0aCA9IE1hdGguZmxvb3IocGFyc2VJbnQodGhpcy5pbm5lci5zdHlsZS5taW5XaWR0aCkgKiBzY2FsZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQgPSBNYXRoLmZsb29yKHBhcnNlSW50KHRoaXMuaW5uZXIuc3R5bGUubWluSGVpZ2h0KSAqIHNjYWxlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAod2lkdGggPCBtaW5XaWR0aCAmJiAhdGhpcy5pc0JvZHkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjYWxlID0gc2NhbGUgLyB3aWR0aCAqIG1pbldpZHRoO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0ID0gTWF0aC5mbG9vcihwYXJzZUludCh0aGlzLmlubmVyLnN0eWxlLm1pbkhlaWdodCkgKiBzY2FsZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWR0aCA9IG1pbldpZHRoO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChoZWlnaHQgPCBtaW5IZWlnaHQgJiYgIXRoaXMuaXNCb2R5KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY2FsZSA9IHNjYWxlIC8gaGVpZ2h0ICogbWluSGVpZ2h0O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGggPSBNYXRoLmZsb29yKHBhcnNlSW50KHRoaXMuaW5uZXIuc3R5bGUubWluV2lkdGgpICogc2NhbGUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0ID0gbWluSGVpZ2h0O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgLy9jb25zb2xlLmxvZyhcInNjYWxlVG8oKTogXCIsIHNjYWxlLCBcIiAtLS0tPiBcIiwgd2lkdGgsIFwiIHggXCIsIGhlaWdodCwgXCIgb3JpZzogXCIsIHRoaXMuY29udGFpbmVyLmNsaWVudFdpZHRoLCBcIiB4IFwiLCB0aGlzLmNvbnRhaW5lci5jbGllbnRIZWlnaHQsIFwiIHJlYWw6IFwiLCBtaW5XaWR0aCwgXCIgeCBcIiwgbWluSGVpZ2h0KTtcclxuICAgICAgICAgICAgICAgIHRoaXMuaW5uZXIuc3R5bGUudHJhbnNmb3JtID0gJ3RyYW5zbGF0ZSgwcHgsIDBweCkgc2NhbGUoJyArIHNjYWxlICsgJyknO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zY2FsZUVsZW1lbnQuc3R5bGUubWluV2lkdGggPSB0aGlzLnNjYWxlRWxlbWVudC5zdHlsZS53aWR0aCA9IHdpZHRoICsgJ3B4JztcclxuICAgICAgICAgICAgICAgIHRoaXMuc2NhbGVFbGVtZW50LnN0eWxlLm1pbkhlaWdodCA9IHRoaXMuc2NhbGVFbGVtZW50LnN0eWxlLmhlaWdodCA9IGhlaWdodCArICdweCc7XHJcbiAgICAgICAgICAgICAgICAvKiBUT0RPOiBoZXJlIHNjcm9sbFRvIGJhc2VkIG9uIHdoZXJlIHRoZSBtb3VzZSBjdXJzb3IgaXMgKi9cclxuICAgICAgICAgICAgICAgIC8vdGhpcy5zY3JvbGxUbygpO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAvKipcclxuICAgICAgICAgICAgICogRGlzYWJsZXMgdGhlIHNjcm9sbCB3aGVlbCBvZiB0aGUgbW91c2VcclxuICAgICAgICAgICAgICpcclxuICAgICAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IHggLSB0aGUgeC1jb29yZGluYXRlc1xyXG4gICAgICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0geSAtIHRoZSB5LWNvb3JkaW5hdGVzXHJcbiAgICAgICAgICAgICAqIEByZXR1cm4ge2Jvb2xlYW59IC0gd2hldGhlciB0aGUgbmVhcmVzdCByZWxhdGVkIHBhcmVudCBpbm5lciBlbGVtZW50IGlzIHRoZSBvbmUgb2YgdGhpcyBvYmplY3QgaW5zdGFuY2VcclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIFp3b29zaC5wcm90b3R5cGUuZWxlbWVudEJlaGluZEN1cnNvcklzTWUgPSBmdW5jdGlvbiAoeCwgeSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGVsZW1lbnRCZWhpbmRDdXJzb3IgPSBkb2N1bWVudC5lbGVtZW50RnJvbVBvaW50KHgsIHkpO1xyXG4gICAgICAgICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgICAgICAgKiBJZiB0aGUgZWxlbWVudCBkaXJlY3RseSBiZWhpbmQgdGhlIGN1cnNvciBpcyBhbiBvdXRlciBlbGVtZW50IHRocm93IG91dCwgYmVjYXVzZSB3aGVuIGNsaWNraW5nIG9uIGEgc2Nyb2xsYmFyXHJcbiAgICAgICAgICAgICAgICAgKiBmcm9tIGEgZGl2LCBhIGRyYWcgb2YgdGhlIHBhcmVudCBad29vc2ggZWxlbWVudCBpcyBpbml0aWF0ZWQuXHJcbiAgICAgICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgICAgIHZhciBvdXRlclJlID0gbmV3IFJlZ0V4cChcIiBcIiArIHRoaXMuY2xhc3NPdXRlciArIFwiIFwiKTtcclxuICAgICAgICAgICAgICAgIGlmIChlbGVtZW50QmVoaW5kQ3Vyc29yLmNsYXNzTmFtZS5tYXRjaChvdXRlclJlKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIC8qIGZpbmQgdGhlIG5leHQgcGFyZW50IHdoaWNoIGlzIGFuIGlubmVyIGVsZW1lbnQgKi9cclxuICAgICAgICAgICAgICAgIHZhciBpbm5lclJlID0gbmV3IFJlZ0V4cChcIiBcIiArIHRoaXMuY2xhc3NJbm5lciArIFwiIFwiKTtcclxuICAgICAgICAgICAgICAgIHdoaWxlIChlbGVtZW50QmVoaW5kQ3Vyc29yICYmICFlbGVtZW50QmVoaW5kQ3Vyc29yLmNsYXNzTmFtZS5tYXRjaChpbm5lclJlKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnRCZWhpbmRDdXJzb3IgPSBlbGVtZW50QmVoaW5kQ3Vyc29yLnBhcmVudEVsZW1lbnQ7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5pbm5lciA9PT0gZWxlbWVudEJlaGluZEN1cnNvcjtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgWndvb3NoLnByb3RvdHlwZS5nZXRUaW1lc3RhbXAgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHdpbmRvdy5wZXJmb3JtYW5jZSA9PT0gJ29iamVjdCcpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoXCJub3dcIiBpbiB3aW5kb3cucGVyZm9ybWFuY2UpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHdpbmRvdy5wZXJmb3JtYW5jZS5ub3coKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoXCJ3ZWJraXROb3dcIiBpbiB3aW5kb3cucGVyZm9ybWFuY2UpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHdpbmRvdy5wZXJmb3JtYW5jZS53ZWJraXROb3coKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IERhdGUoKS5nZXRUaW1lKCk7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgKiBTY3JvbGwgaGFuZGxlciB0byB0cmlnZ2VyIHRoZSBjdXN0b20gZXZlbnRzXHJcbiAgICAgICAgICAgICAqXHJcbiAgICAgICAgICAgICAqIEBwYXJhbSB7RXZlbnR9IGUgLSBUaGUgc2Nyb2xsIGV2ZW50IG9iamVjdCAoVE9ETzogbmVlZGVkPylcclxuICAgICAgICAgICAgICogQHRocm93cyBFdmVudCBjb2xsaWRlTGVmdFxyXG4gICAgICAgICAgICAgKiBAdGhyb3dzIEV2ZW50IGNvbGxpZGVSaWdodFxyXG4gICAgICAgICAgICAgKiBAdGhyb3dzIEV2ZW50IGNvbGxpZGVUb3BcclxuICAgICAgICAgICAgICogQHRocm93cyBFdmVudCBjb2xsaWRlQm90dG9tXHJcbiAgICAgICAgICAgICAqIEByZXR1cm4ge3ZvaWR9XHJcbiAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLm9uU2Nyb2xsID0gZnVuY3Rpb24gKGUpIHtcclxuICAgICAgICAgICAgICAgIHZhciB4ID0gdGhpcy5nZXRTY3JvbGxMZWZ0KCk7XHJcbiAgICAgICAgICAgICAgICB2YXIgeSA9IHRoaXMuZ2V0U2Nyb2xsVG9wKCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNjcm9sbE1heExlZnQgPSAodGhpcy5zY3JvbGxFbGVtZW50LnNjcm9sbFdpZHRoIC0gdGhpcy5zY3JvbGxFbGVtZW50LmNsaWVudFdpZHRoKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsTWF4VG9wID0gKHRoaXMuc2Nyb2xsRWxlbWVudC5zY3JvbGxIZWlnaHQgLSB0aGlzLnNjcm9sbEVsZW1lbnQuY2xpZW50SGVpZ2h0KTtcclxuICAgICAgICAgICAgICAgIC8vIHRoZSBjb2xsaWRlTGVmdCBldmVudFxyXG4gICAgICAgICAgICAgICAgaWYgKHggPT09IDApIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnRyaWdnZXJlZC5jb2xsaWRlTGVmdCA/IG51bGwgOiB0aGlzLnRyaWdnZXJFdmVudCh0aGlzLmlubmVyLCAnY29sbGlkZS5sZWZ0Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50cmlnZ2VyZWQuY29sbGlkZUxlZnQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50cmlnZ2VyZWQuY29sbGlkZUxlZnQgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIC8vIHRoZSBjb2xsaWRlVG9wIGV2ZW50XHJcbiAgICAgICAgICAgICAgICBpZiAoeSA9PT0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudHJpZ2dlcmVkLmNvbGxpZGVUb3AgPyBudWxsIDogdGhpcy50cmlnZ2VyRXZlbnQodGhpcy5pbm5lciwgJ2NvbGxpZGUudG9wJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50cmlnZ2VyZWQuY29sbGlkZVRvcCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnRyaWdnZXJlZC5jb2xsaWRlVG9wID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAvLyB0aGUgY29sbGlkZVJpZ2h0IGV2ZW50XHJcbiAgICAgICAgICAgICAgICBpZiAoeCA9PT0gdGhpcy5zY3JvbGxNYXhMZWZ0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50cmlnZ2VyZWQuY29sbGlkZVJpZ2h0ID8gbnVsbCA6IHRoaXMudHJpZ2dlckV2ZW50KHRoaXMuaW5uZXIsICdjb2xsaWRlLnJpZ2h0Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50cmlnZ2VyZWQuY29sbGlkZVJpZ2h0ID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudHJpZ2dlcmVkLmNvbGxpZGVSaWdodCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgLy8gdGhlIGNvbGxpZGVCb3R0b20gZXZlbnRcclxuICAgICAgICAgICAgICAgIGlmICh5ID09PSB0aGlzLnNjcm9sbE1heFRvcCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudHJpZ2dlcmVkLmNvbGxpZGVCb3R0b20gPyBudWxsIDogdGhpcy50cmlnZ2VyRXZlbnQodGhpcy5pbm5lciwgJ2NvbGxpZGUuYm90dG9tJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50cmlnZ2VyZWQuY29sbGlkZUJvdHRvbSA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnRyaWdnZXJlZC5jb2xsaWRlQm90dG9tID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgKiB3aW5kb3cgcmVzaXplIGhhbmRsZXIgdG8gcmVjYWxjdWxhdGUgdGhlIGlubmVyIGRpdiBtaW5XaWR0aCBhbmQgbWluSGVpZ2h0XHJcbiAgICAgICAgICAgICAqXHJcbiAgICAgICAgICAgICAqIEBwYXJhbSB7RXZlbnR9IGUgLSBUaGUgd2luZG93IHJlc2l6ZSBldmVudCBvYmplY3QgKFRPRE86IG5lZWRlZD8pXHJcbiAgICAgICAgICAgICAqIEByZXR1cm4ge3ZvaWR9XHJcbiAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLm9uUmVzaXplID0gZnVuY3Rpb24gKGUpIHtcclxuICAgICAgICAgICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XHJcbiAgICAgICAgICAgICAgICB2YXIgb25SZXNpemUgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMuaW5uZXIuc3R5bGUubWluV2lkdGggPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgICAgIF90aGlzLmlubmVyLnN0eWxlLm1pbkhlaWdodCA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICAgICAgLyogdGFrZSBhd2F5IHRoZSBtYXJnaW4gdmFsdWVzIG9mIHRoZSBib2R5IGVsZW1lbnQgKi9cclxuICAgICAgICAgICAgICAgICAgICB2YXIgeERlbHRhID0gcGFyc2VJbnQoX3RoaXMuZ2V0U3R5bGUoZG9jdW1lbnQuYm9keSwgJ21hcmdpbkxlZnQnKSwgMTApICsgcGFyc2VJbnQoX3RoaXMuZ2V0U3R5bGUoZG9jdW1lbnQuYm9keSwgJ21hcmdpblJpZ2h0JyksIDEwKTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgeURlbHRhID0gcGFyc2VJbnQoX3RoaXMuZ2V0U3R5bGUoZG9jdW1lbnQuYm9keSwgJ21hcmdpblRvcCcpLCAxMCkgKyBwYXJzZUludChfdGhpcy5nZXRTdHlsZShkb2N1bWVudC5ib2R5LCAnbWFyZ2luQm90dG9tJyksIDEwKTtcclxuICAgICAgICAgICAgICAgICAgICAvL1RPRE86IHdpdGggdGhpcy5nZXRCb3JkZXIoKVxyXG4gICAgICAgICAgICAgICAgICAgIF90aGlzLmlubmVyLnN0eWxlLm1pbldpZHRoID0gKGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zY3JvbGxXaWR0aCAtIHhEZWx0YSkgKyAncHgnO1xyXG4gICAgICAgICAgICAgICAgICAgIF90aGlzLmlubmVyLnN0eWxlLm1pbkhlaWdodCA9IChkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsSGVpZ2h0IC0geURlbHRhIC0gMTAwKSArICdweCc7IC8vVE9ETzogV1RGPyB3aHkgLTEwMCBmb3IgSUU4P1xyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgICAgICogVHJpZ2dlciB0aGUgZnVuY3Rpb24gb25seSB3aGVuIHRoZSBjbGllbnRXaWR0aCBvciBjbGllbnRIZWlnaHQgcmVhbGx5IGhhdmUgY2hhbmdlZC5cclxuICAgICAgICAgICAgICAgICAqIElFOCByZXNpZGVzIGluIGFuIGluZmluaXR5IGxvb3AgYWx3YXlzIHRyaWdnZXJpbmcgdGhlIHJlc2l0ZSBldmVudCB3aGVuIGFsdGVyaW5nIGNzcy5cclxuICAgICAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMub2xkQ2xpZW50V2lkdGggIT09IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRXaWR0aCB8fCB0aGlzLm9sZENsaWVudEhlaWdodCAhPT0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudEhlaWdodCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHdpbmRvdy5jbGVhclRpbWVvdXQodGhpcy5yZXNpemVUaW1lb3V0KTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnJlc2l6ZVRpbWVvdXQgPSB3aW5kb3cuc2V0VGltZW91dChvblJlc2l6ZSwgMTApO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgLyogd3JpdGUgZG93biB0aGUgb2xkIGNsaWVudFdpZHRoIGFuZCBjbGllbnRIZWlnaHQgZm9yIHRoZSBhYm92ZSBjb21wYXJzaW9uICovXHJcbiAgICAgICAgICAgICAgICB0aGlzLm9sZENsaWVudFdpZHRoID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudFdpZHRoO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5vbGRDbGllbnRIZWlnaHQgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50SGVpZ2h0O1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLmNsZWFyVGV4dFNlbGVjdGlvbiA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIGlmICh3aW5kb3cuZ2V0U2VsZWN0aW9uKVxyXG4gICAgICAgICAgICAgICAgICAgIHdpbmRvdy5nZXRTZWxlY3Rpb24oKS5yZW1vdmVBbGxSYW5nZXMoKTtcclxuICAgICAgICAgICAgICAgIGlmIChkb2N1bWVudC5zZWxlY3Rpb24pXHJcbiAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQuc2VsZWN0aW9uLmVtcHR5KCk7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgKiBCcm93c2VyIGluZGVwZW5kZW50IGV2ZW50IHJlZ2lzdHJhdGlvblxyXG4gICAgICAgICAgICAgKlxyXG4gICAgICAgICAgICAgKiBAcGFyYW0ge2FueX0gb2JqIC0gVGhlIEhUTUxFbGVtZW50IHRvIGF0dGFjaCB0aGUgZXZlbnQgdG9cclxuICAgICAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50IC0gVGhlIGV2ZW50IG5hbWUgd2l0aG91dCB0aGUgbGVhZGluZyBcIm9uXCJcclxuICAgICAgICAgICAgICogQHBhcmFtIHsoZTogRXZlbnQpID0+IHZvaWR9IGNhbGxiYWNrIC0gQSBjYWxsYmFjayBmdW5jdGlvbiB0byBhdHRhY2ggdG8gdGhlIGV2ZW50XHJcbiAgICAgICAgICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gYm91bmQgLSB3aGV0aGVyIHRvIGJpbmQgdGhlIGNhbGxiYWNrIHRvIHRoZSBvYmplY3QgaW5zdGFuY2Ugb3Igbm90XHJcbiAgICAgICAgICAgICAqIEByZXR1cm4ge3ZvaWR9XHJcbiAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLmFkZEV2ZW50TGlzdGVuZXIgPSBmdW5jdGlvbiAob2JqLCBldmVudCwgY2FsbGJhY2ssIGJvdW5kKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoYm91bmQgPT09IHZvaWQgMCkgeyBib3VuZCA9IHRydWU7IH1cclxuICAgICAgICAgICAgICAgIHZhciBib3VuZENhbGxiYWNrID0gYm91bmQgPyBjYWxsYmFjay5iaW5kKHRoaXMpIDogY2FsbGJhY2s7XHJcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIG9iai5hZGRFdmVudExpc3RlbmVyID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG1hcEV2ZW50c1snb24nICsgZXZlbnRdICYmIG9iai50YWdOYW1lID09PSBcIkJPRFlcIikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBvYmogPSBtYXBFdmVudHNbJ29uJyArIGV2ZW50XTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgb2JqLmFkZEV2ZW50TGlzdGVuZXIoZXZlbnQsIGJvdW5kQ2FsbGJhY2spO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSBpZiAodHlwZW9mIG9iai5hdHRhY2hFdmVudCA9PT0gJ29iamVjdCcgJiYgaHRtbEV2ZW50c1snb24nICsgZXZlbnRdKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgb2JqLmF0dGFjaEV2ZW50KCdvbicgKyBldmVudCwgYm91bmRDYWxsYmFjayk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIGlmICh0eXBlb2Ygb2JqLmF0dGFjaEV2ZW50ID09PSAnb2JqZWN0JyAmJiBtYXBFdmVudHNbJ29uJyArIGV2ZW50XSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChvYmoudGFnTmFtZSA9PT0gXCJCT0RZXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHAgPSAnb24nICsgZXZlbnQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIGV4YW1wbGU6IHdpbmRvdy5vbnNjcm9sbCA9IGJvdW5kQ2FsbGJhY2sgKi9cclxuICAgICAgICAgICAgICAgICAgICAgICAgbWFwRXZlbnRzW3BdW3BdID0gYm91bmRDYWxsYmFjaztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIFRPRE86IG9iai5vbnNjcm9sbCA/PyAqL1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBvYmoub25zY3JvbGwgPSBib3VuZENhbGxiYWNrO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHR5cGVvZiBvYmouYXR0YWNoRXZlbnQgPT09ICdvYmplY3QnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgb2JqW2V2ZW50XSA9IDE7XHJcbiAgICAgICAgICAgICAgICAgICAgYm91bmRDYWxsYmFjayA9IGZ1bmN0aW9uIChlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIFRPRE86IGUgaXMgdGhlIG9ucHJvcGVydHljaGFuZ2UgZXZlbnQgbm90IG9uZSBvZiB0aGUgY3VzdG9tIGV2ZW50IG9iamVjdHMgKi9cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGUucHJvcGVydHlOYW1lID09PSBldmVudCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgIG9iai5hdHRhY2hFdmVudCgnb25wcm9wZXJ0eWNoYW5nZScsIGJvdW5kQ2FsbGJhY2spO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgb2JqWydvbicgKyBldmVudF0gPSBib3VuZENhbGxiYWNrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdGhpcy5jdXN0b21FdmVudHNbZXZlbnRdID8gbnVsbCA6ICh0aGlzLmN1c3RvbUV2ZW50c1tldmVudF0gPSBbXSk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmN1c3RvbUV2ZW50c1tldmVudF0ucHVzaChbY2FsbGJhY2ssIGJvdW5kQ2FsbGJhY2tdKTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgICAqIEJyb3dzZXIgaW5kZXBlbmRlbnQgZXZlbnQgZGVyZWdpc3RyYXRpb25cclxuICAgICAgICAgICAgICpcclxuICAgICAgICAgICAgICogQHBhcmFtIHthbnl9IG9iaiAtIFRoZSBIVE1MRWxlbWVudCBvciB3aW5kb3cgd2hvc2UgZXZlbnQgc2hvdWxkIGJlIGRldGFjaGVkXHJcbiAgICAgICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBldmVudCAtIFRoZSBldmVudCBuYW1lIHdpdGhvdXQgdGhlIGxlYWRpbmcgXCJvblwiXHJcbiAgICAgICAgICAgICAqIEBwYXJhbSB7KGU6IEV2ZW50KSA9PiB2b2lkfSBjYWxsYmFjayAtIFRoZSBjYWxsYmFjayBmdW5jdGlvbiB3aGVuIGF0dGFjaGVkXHJcbiAgICAgICAgICAgICAqIEByZXR1cm4ge3ZvaWR9XHJcbiAgICAgICAgICAgICAqXHJcbiAgICAgICAgICAgICAqIEBUT0RPOiB1bnJlZ2lzdGVyaW5nIG9mIG1hcEV2ZW50c1xyXG4gICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgWndvb3NoLnByb3RvdHlwZS5yZW1vdmVFdmVudExpc3RlbmVyID0gZnVuY3Rpb24gKG9iaiwgZXZlbnQsIGNhbGxiYWNrKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnQgaW4gdGhpcy5jdXN0b21FdmVudHMpIHtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpIGluIHRoaXMuY3VzdG9tRXZlbnRzW2V2ZW50XSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBpZiB0aGUgZXZlbnQgd2FzIGZvdW5kIGluIHRoZSBhcnJheSBieSBpdHMgY2FsbGJhY2sgcmVmZXJlbmNlICovXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmN1c3RvbUV2ZW50c1tldmVudF1baV1bMF0gPT09IGNhbGxiYWNrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiByZW1vdmUgdGhlIGxpc3RlbmVyIGZyb20gdGhlIGFycmF5IGJ5IGl0cyBib3VuZCBjYWxsYmFjayByZWZlcmVuY2UgKi9cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrID0gdGhpcy5jdXN0b21FdmVudHNbZXZlbnRdW2ldWzFdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jdXN0b21FdmVudHNbZXZlbnRdLnNwbGljZShpLCAxKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBvYmoucmVtb3ZlRXZlbnRMaXN0ZW5lciA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgICAgICAgICAgICAgIG9iai5yZW1vdmVFdmVudExpc3RlbmVyKGV2ZW50LCBjYWxsYmFjayk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIGlmICh0eXBlb2Ygb2JqLmRldGFjaEV2ZW50ID09PSAnb2JqZWN0JyAmJiBodG1sRXZlbnRzWydvbicgKyBldmVudF0pIHtcclxuICAgICAgICAgICAgICAgICAgICBvYmouZGV0YWNoRXZlbnQoJ29uJyArIGV2ZW50LCBjYWxsYmFjayk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIGlmICh0eXBlb2Ygb2JqLmRldGFjaEV2ZW50ID09PSAnb2JqZWN0Jykge1xyXG4gICAgICAgICAgICAgICAgICAgIG9iai5kZXRhY2hFdmVudCgnb25wcm9wZXJ0eWNoYW5nZScsIGNhbGxiYWNrKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIG9ialsnb24nICsgZXZlbnRdID0gbnVsbDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgICAqIEJyb3dzZXIgaW5kZXBlbmRlbnQgZXZlbnQgdHJpZ2dlciBmdW5jdGlvblxyXG4gICAgICAgICAgICAgKlxyXG4gICAgICAgICAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBvYmogLSBUaGUgSFRNTEVsZW1lbnQgd2hpY2ggdHJpZ2dlcnMgdGhlIGV2ZW50XHJcbiAgICAgICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBldmVudE5hbWUgLSBUaGUgZXZlbnQgbmFtZSB3aXRob3V0IHRoZSBsZWFkaW5nIFwib25cIlxyXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHt2b2lkfVxyXG4gICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgWndvb3NoLnByb3RvdHlwZS50cmlnZ2VyRXZlbnQgPSBmdW5jdGlvbiAob2JqLCBldmVudE5hbWUpIHtcclxuICAgICAgICAgICAgICAgIHZhciBldmVudDtcclxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2Ygd2luZG93LkN1c3RvbUV2ZW50ID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQgPSBuZXcgQ3VzdG9tRXZlbnQoZXZlbnROYW1lKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHR5cGVvZiBkb2N1bWVudC5jcmVhdGVFdmVudCA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50ID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoXCJIVE1MRXZlbnRzXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LmluaXRFdmVudChldmVudE5hbWUsIHRydWUsIHRydWUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoZG9jdW1lbnQuY3JlYXRlRXZlbnRPYmplY3QpIHtcclxuICAgICAgICAgICAgICAgICAgICBldmVudCA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50T2JqZWN0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQuZXZlbnRUeXBlID0gZXZlbnROYW1lO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZXZlbnQuZXZlbnROYW1lID0gZXZlbnROYW1lO1xyXG4gICAgICAgICAgICAgICAgaWYgKG9iai5kaXNwYXRjaEV2ZW50KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgb2JqLmRpc3BhdGNoRXZlbnQoZXZlbnQpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSBpZiAob2JqW2V2ZW50TmFtZV0pIHtcclxuICAgICAgICAgICAgICAgICAgICBvYmpbZXZlbnROYW1lXSsrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSBpZiAob2JqLmZpcmVFdmVudCAmJiBodG1sRXZlbnRzWydvbicgKyBldmVudE5hbWVdKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgb2JqLmZpcmVFdmVudCgnb24nICsgZXZlbnQuZXZlbnRUeXBlLCBldmVudCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIGlmIChvYmpbZXZlbnROYW1lXSkge1xyXG4gICAgICAgICAgICAgICAgICAgIG9ialtldmVudE5hbWVdKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIGlmIChvYmpbJ29uJyArIGV2ZW50TmFtZV0pIHtcclxuICAgICAgICAgICAgICAgICAgICBvYmpbJ29uJyArIGV2ZW50TmFtZV0oKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgICAqIEdldCBhIGNzcyBzdHlsZSBwcm9wZXJ0eSB2YWx1ZSBicm93c2VyIGluZGVwZW5kZW50XHJcbiAgICAgICAgICAgICAqXHJcbiAgICAgICAgICAgICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsIC0gVGhlIEhUTUxFbGVtZW50IHRvIGxvb2t1cFxyXG4gICAgICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30ganNQcm9wZXJ0eSAtIFRoZSBjc3MgcHJvcGVydHkgbmFtZSBpbiBqYXZhc2NyaXB0IGluIGNhbWVsQ2FzZSAoZS5nLiBcIm1hcmdpbkxlZnRcIiwgbm90IFwibWFyZ2luLWxlZnRcIilcclxuICAgICAgICAgICAgICogQHJldHVybiB7c3RyaW5nfSAtIHRoZSBwcm9wZXJ0eSB2YWx1ZVxyXG4gICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgWndvb3NoLnByb3RvdHlwZS5nZXRTdHlsZSA9IGZ1bmN0aW9uIChlbCwganNQcm9wZXJ0eSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGNzc1Byb3BlcnR5ID0ganNQcm9wZXJ0eS5yZXBsYWNlKC8oW0EtWl0pL2csIFwiLSQxXCIpLnRvTG93ZXJDYXNlKCk7XHJcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKGVsKS5nZXRQcm9wZXJ0eVZhbHVlKGNzc1Byb3BlcnR5KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBlbC5jdXJyZW50U3R5bGVbanNQcm9wZXJ0eV07XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIFp3b29zaC5wcm90b3R5cGUuY2xlYXJUaW1lb3V0cyA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLnRpbWVvdXRzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaWR4IGluIHRoaXMudGltZW91dHMpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMudGltZW91dHNbaWR4XSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnRpbWVvdXRzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy50aW1lb3V0cyA9IFtdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlbW92ZUV2ZW50TGlzdGVuZXIodGhpcy5pbm5lciwgJ2NvbGxpZGUubGVmdCcsIHRoaXMuY2xlYXJMaXN0ZW5lckxlZnQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlbW92ZUV2ZW50TGlzdGVuZXIodGhpcy5pbm5lciwgJ2NvbGxpZGUucmlnaHQnLCB0aGlzLmNsZWFyTGlzdGVuZXJSaWdodCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVtb3ZlRXZlbnRMaXN0ZW5lcih0aGlzLmlubmVyLCAnY29sbGlkZS50b3AnLCB0aGlzLmNsZWFyTGlzdGVuZXJUb3ApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlbW92ZUV2ZW50TGlzdGVuZXIodGhpcy5pbm5lciwgJ2NvbGxpZGUuYm90dG9tJywgdGhpcy5jbGVhckxpc3RlbmVyQm90dG9tKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgKiBNb3VzZSBkb3duIGhhbmRsZXJcclxuICAgICAgICAgICAgICogUmVnaXN0ZXJzIHRoZSBtb3VzZW1vdmUgYW5kIG1vdXNldXAgaGFuZGxlcnMgYW5kIGZpbmRzIHRoZSBuZXh0IGlubmVyIGVsZW1lbnRcclxuICAgICAgICAgICAgICpcclxuICAgICAgICAgICAgICogQHBhcmFtIHtNb3VzZUV2ZW50fSBlIC0gVGhlIG1vdXNlIGRvd24gZXZlbnQgb2JqZWN0XHJcbiAgICAgICAgICAgICAqIEByZXR1cm4ge3ZvaWR9XHJcbiAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLm1vdXNlRG93biA9IGZ1bmN0aW9uIChlKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jbGVhclRpbWVvdXRzKCk7XHJcbiAgICAgICAgICAgICAgICAvKiBkcmFnIG9ubHkgaWYgdGhlIGxlZnQgbW91c2UgYnV0dG9uIHdhcyBwcmVzc2VkICovXHJcbiAgICAgICAgICAgICAgICBpZiAoKFwid2hpY2hcIiBpbiBlICYmIGUud2hpY2ggPT09IDEpIHx8ICh0eXBlb2YgZS53aGljaCA9PT0gJ3VuZGVmaW5lZCcgJiYgXCJidXR0b25cIiBpbiBlICYmIGUuYnV0dG9uID09PSAxKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmVsZW1lbnRCZWhpbmRDdXJzb3JJc01lKGUuY2xpZW50WCwgZS5jbGllbnRZKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBwcmV2ZW50IGltYWdlIGRyYWdnaW5nIGFjdGlvbiAqL1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgaW1ncyA9IHRoaXMuY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3JBbGwoJ2ltZycpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGltZ3MubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGltZ3NbaV0ub25kcmFnc3RhcnQgPSBmdW5jdGlvbiAoKSB7IHJldHVybiBmYWxzZTsgfTsgLy9NU0lFXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgLyogc2VhcmNoIHRoZSBET00gZm9yIGV4Y2x1ZGUgZWxlbWVudHMgKi9cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5kcmFnT3B0aW9ucy5leGNsdWRlLmxlbmd0aCAhPT0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogZHJhZyBvbmx5IGlmIHRoZSBtb3VzZSBjbGlja2VkIG9uIGFuIGFsbG93ZWQgZWxlbWVudCAqL1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGVsID0gZG9jdW1lbnQuZWxlbWVudEZyb21Qb2ludChlLmNsaWVudFgsIGUuY2xpZW50WSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgZXhjbHVkZUVsZW1lbnRzID0gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvckFsbCh0aGlzLm9wdGlvbnMuZHJhZ09wdGlvbnMuZXhjbHVkZS5qb2luKCcsICcpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIGxvb3AgdGhyb3VnaCBhbGwgcGFyZW50IGVsZW1lbnRzIHVudGlsIHdlIGVuY291bnRlciBhbiBpbm5lciBkaXYgb3Igbm8gbW9yZSBwYXJlbnRzICovXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgaW5uZXJSZSA9IG5ldyBSZWdFeHAoXCIgXCIgKyB0aGlzLmNsYXNzSW5uZXIgKyBcIiBcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aGlsZSAoZWwgJiYgIWVsLmNsYXNzTmFtZS5tYXRjaChpbm5lclJlKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIGNvbXBhcmUgZWFjaCBwYXJlbnQsIGlmIGl0IGlzIGluIHRoZSBleGNsdWRlIGxpc3QgKi9cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGV4Y2x1ZGVFbGVtZW50cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBiYWlsIG91dCBpZiBhbiBlbGVtZW50IG1hdGNoZXMgKi9cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGV4Y2x1ZGVFbGVtZW50c1tpXSA9PT0gZWwpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsID0gZWwucGFyZW50RWxlbWVudDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBzZWFyY2ggdGhlIERPTSBmb3Igb25seSBlbGVtZW50cywgYnV0IG9ubHkgaWYgdGhlcmUgYXJlIGVsZW1lbnRzIHNldFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvKmlmICh0aGlzLm9wdGlvbnMuZHJhZ09wdGlvbnMub25seS5sZW5ndGggIT09IDApe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBvbmx5RWxlbWVudHMgPSB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yQWxsKHRoaXMub3B0aW9ucy5kcmFnT3B0aW9ucy5vbmx5LmpvaW4oJywgJykpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGxvb3AgdGhyb3VnaCB0aGUgbm9kZWxpc3QgYW5kIGNoZWNrIGZvciBvdXIgZWxlbWVudFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBmb3VuZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZXhjbHVkZUVsZW1lbnRzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAob25seUVsZW1lbnRzW2ldID09PSBlbCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3VuZCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZm91bmQgPT09IGZhbHNlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9Ki9cclxuICAgICAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5jbGFzc05hbWUgKz0gXCIgXCIgKyB0aGlzLmNsYXNzR3JhYmJpbmcgKyBcIiBcIjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kcmFnZ2luZyA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIG5vdGUgdGhlIG9yaWdpbiBwb3NpdGlvbnMgKi9cclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kcmFnT3JpZ2luTGVmdCA9IGUuY2xpZW50WDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kcmFnT3JpZ2luVG9wID0gZS5jbGllbnRZO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRyYWdPcmlnaW5TY3JvbGxMZWZ0ID0gdGhpcy5nZXRTY3JvbGxMZWZ0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZHJhZ09yaWdpblNjcm9sbFRvcCA9IHRoaXMuZ2V0U2Nyb2xsVG9wKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIGl0IGxvb2tzIHN0cmFuZ2UgaWYgc2Nyb2xsLWJlaGF2aW9yIGlzIHNldCB0byBzbW9vdGggKi9cclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wYXJlbnRPcmlnaW5TdHlsZSA9IHRoaXMuaW5uZXIucGFyZW50RWxlbWVudC5zdHlsZS5jc3NUZXh0O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHRoaXMuaW5uZXIucGFyZW50RWxlbWVudC5zdHlsZS5zZXRQcm9wZXJ0eSA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5pbm5lci5wYXJlbnRFbGVtZW50LnN0eWxlLnNldFByb3BlcnR5KCdzY3JvbGwtYmVoYXZpb3InLCAnYXV0bycpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQgPyBlLnByZXZlbnREZWZhdWx0KCkgOiAoZS5yZXR1cm5WYWx1ZSA9IGZhbHNlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy52eCA9IFtdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnZ5ID0gW107XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIHJlZ2lzdGVyIHRoZSBldmVudCBoYW5kbGVycyAqL1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm1vdXNlTW92ZUhhbmRsZXIgPSB0aGlzLm1vdXNlTW92ZS5iaW5kKHRoaXMpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIoZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LCAnbW91c2Vtb3ZlJywgdGhpcy5tb3VzZU1vdmVIYW5kbGVyKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5tb3VzZVVwSGFuZGxlciA9IGZ1bmN0aW9uIChlKSB7IHJldHVybiBfdGhpcy5tb3VzZVVwKGUpOyB9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIoZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LCAnbW91c2V1cCcsIHRoaXMubW91c2VVcEhhbmRsZXIpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgICAqIE1vdXNlIHVwIGhhbmRsZXJcclxuICAgICAgICAgICAgICogRGVyZWdpc3RlcnMgdGhlIG1vdXNlbW92ZSBhbmQgbW91c2V1cCBoYW5kbGVyc1xyXG4gICAgICAgICAgICAgKlxyXG4gICAgICAgICAgICAgKiBAcGFyYW0ge01vdXNlRXZlbnR9IGUgLSBUaGUgbW91c2UgdXAgZXZlbnQgb2JqZWN0XHJcbiAgICAgICAgICAgICAqIEByZXR1cm4ge3ZvaWR9XHJcbiAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLm1vdXNlVXAgPSBmdW5jdGlvbiAoZSkge1xyXG4gICAgICAgICAgICAgICAgLyogVE9ETzogcmVzdG9yZSBvcmlnaW5hbCBwb3NpdGlvbiB2YWx1ZSAqL1xyXG4gICAgICAgICAgICAgICAgdGhpcy5pbm5lci5zdHlsZS5wb3NpdGlvbiA9ICcnO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5pbm5lci5zdHlsZS50b3AgPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5pbm5lci5zdHlsZS5sZWZ0ID0gbnVsbDtcclxuICAgICAgICAgICAgICAgIHRoaXMucHJlc2VudCA9ICh0aGlzLmdldFRpbWVzdGFtcCgpIC8gMTAwMCk7IC8vaW4gc2Vjb25kc1xyXG4gICAgICAgICAgICAgICAgdmFyIHggPSB0aGlzLmRyYWdPcmlnaW5MZWZ0ICsgdGhpcy5kcmFnT3JpZ2luU2Nyb2xsTGVmdCAtIGUuY2xpZW50WDtcclxuICAgICAgICAgICAgICAgIHZhciB5ID0gdGhpcy5kcmFnT3JpZ2luVG9wICsgdGhpcy5kcmFnT3JpZ2luU2Nyb2xsVG9wIC0gZS5jbGllbnRZO1xyXG4gICAgICAgICAgICAgICAgX2EgPSB0aGlzLmdldFJlYWxDb29yZHMoeCwgeSksIHggPSBfYVswXSwgeSA9IF9hWzFdO1xyXG4gICAgICAgICAgICAgICAgdmFyIHJlID0gbmV3IFJlZ0V4cChcIiBcIiArIHRoaXMuY2xhc3NHcmFiYmluZyArIFwiIFwiKTtcclxuICAgICAgICAgICAgICAgIGRvY3VtZW50LmJvZHkuY2xhc3NOYW1lID0gZG9jdW1lbnQuYm9keS5jbGFzc05hbWUucmVwbGFjZShyZSwgJycpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5pbm5lci5wYXJlbnRFbGVtZW50LnN0eWxlLmNzc1RleHQgPSB0aGlzLnBhcmVudE9yaWdpblN0eWxlO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5kcmFnZ2luZyA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCwgJ21vdXNlbW92ZScsIHRoaXMubW91c2VNb3ZlSGFuZGxlcik7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnJlbW92ZUV2ZW50TGlzdGVuZXIoZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LCAnbW91c2V1cCcsIHRoaXMubW91c2VVcEhhbmRsZXIpO1xyXG4gICAgICAgICAgICAgICAgaWYgKHkgIT09IHRoaXMuZ2V0U2Nyb2xsVG9wKCkgfHwgeCAhPT0gdGhpcy5nZXRTY3JvbGxMZWZ0KCkpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgdCA9IHRoaXMucHJlc2VudCAtICh0aGlzLnBhc3QgPyB0aGlzLnBhc3QgOiB0aGlzLnByZXNlbnQpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0ID4gMC4wNSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBqdXN0IGFsaWduIHRvIHRoZSBncmlkIGlmIHRoZSBtb3VzZSBsZWZ0IHVubW92ZWQgZm9yIG1vcmUgdGhhbiAwLjA1IHNlY29uZHMgKi9cclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zY3JvbGxUbyh4LCB5LCB0aGlzLm9wdGlvbnMuZHJhZ09wdGlvbnMuZmFkZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5kcmFnT3B0aW9ucy5mYWRlICYmIHR5cGVvZiB0aGlzLnZ4ICE9PSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgdGhpcy52eSAhPT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgZGVsdGFULCBkZWx0YVN4LCBkZWx0YVN5LCBsYXN0RGVsdGFTeCwgbGFzdERlbHRhU3k7XHJcbiAgICAgICAgICAgICAgICAgICAgZGVsdGFUID0gZGVsdGFTeCA9IGRlbHRhU3kgPSBsYXN0RGVsdGFTeCA9IGxhc3REZWx0YVN5ID0gMDtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpIGluIHRoaXMudnkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBhcnNlRmxvYXQoaSkgPiAodGhpcy5wcmVzZW50IC0gMC4xKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJiYgdHlwZW9mIGxhc3RUICE9PSAndW5kZWZpbmVkJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJiYgdHlwZW9mIGxhc3RTeCAhPT0gJ3VuZGVmaW5lZCdcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICYmIHR5cGVvZiBsYXN0U3kgIT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWx0YVQgKz0gcGFyc2VGbG9hdChpKSAtIGxhc3RUO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGFzdERlbHRhU3ggPSB0aGlzLnZ4W2ldIC0gbGFzdFN4O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGFzdERlbHRhU3kgPSB0aGlzLnZ5W2ldIC0gbGFzdFN5O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsdGFTeCArPSBNYXRoLmFicyhsYXN0RGVsdGFTeCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWx0YVN5ICs9IE1hdGguYWJzKGxhc3REZWx0YVN5KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbGFzdFQgPSBwYXJzZUZsb2F0KGkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbGFzdFN4ID0gdGhpcy52eFtpXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGxhc3RTeSA9IHRoaXMudnlbaV07XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHZhciB2eCA9IGRlbHRhVCA9PT0gMCA/IDAgOiBsYXN0RGVsdGFTeCA+IDAgPyBkZWx0YVN4IC8gZGVsdGFUIDogZGVsdGFTeCAvIC1kZWx0YVQ7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHZ5ID0gZGVsdGFUID09PSAwID8gMCA6IGxhc3REZWx0YVN5ID4gMCA/IGRlbHRhU3kgLyBkZWx0YVQgOiBkZWx0YVN5IC8gLWRlbHRhVDtcclxuICAgICAgICAgICAgICAgICAgICAvKiB2IHNob3VsZCBub3QgZXhjZWVkIHZNYXggb3IgLXZNYXggLT4gd291bGQgYmUgdG9vIGZhc3QgYW5kIHNob3VsZCBleGNlZWQgdk1pbiBvciAtdk1pbiAqL1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciB2TWF4ID0gdGhpcy5vcHRpb25zLmRyYWdPcHRpb25zLm1heFNwZWVkO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciB2TWluID0gdGhpcy5vcHRpb25zLmRyYWdPcHRpb25zLm1pblNwZWVkO1xyXG4gICAgICAgICAgICAgICAgICAgIC8qIGlmIHRoZSBzcGVlZCBpcyBub3Qgd2l0aG91dCBib3VuZCBmb3IgZmFkZSwganVzdCBkbyBhIHJlZ3VsYXIgc2Nyb2xsIHdoZW4gdGhlcmUgaXMgYSBncmlkKi9cclxuICAgICAgICAgICAgICAgICAgICBpZiAodnkgPCB2TWluICYmIHZ5ID4gLXZNaW4gJiYgdnggPCB2TWluICYmIHZ4ID4gLXZNaW4pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5ncmlkWSA+IDEgfHwgdGhpcy5vcHRpb25zLmdyaWRYID4gMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zY3JvbGxUbyh4LCB5KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHZhciB2eCA9ICh2eCA8PSB2TWF4ICYmIHZ4ID49IC12TWF4KSA/IHZ4IDogKHZ4ID4gMCA/IHZNYXggOiAtdk1heCk7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHZ5ID0gKHZ5IDw9IHZNYXggJiYgdnkgPj0gLXZNYXgpID8gdnkgOiAodnkgPiAwID8gdk1heCA6IC12TWF4KTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgYXggPSAodnggPiAwID8gLTEgOiAxKSAqIHRoaXMub3B0aW9ucy5kcmFnT3B0aW9ucy5icmFrZVNwZWVkO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBheSA9ICh2eSA+IDAgPyAtMSA6IDEpICogdGhpcy5vcHRpb25zLmRyYWdPcHRpb25zLmJyYWtlU3BlZWQ7XHJcbiAgICAgICAgICAgICAgICAgICAgeCA9ICgoMCAtIE1hdGgucG93KHZ4LCAyKSkgLyAoMiAqIGF4KSkgKyB0aGlzLmdldFNjcm9sbExlZnQoKTtcclxuICAgICAgICAgICAgICAgICAgICB5ID0gKCgwIC0gTWF0aC5wb3codnksIDIpKSAvICgyICogYXkpKSArIHRoaXMuZ2V0U2Nyb2xsVG9wKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zY3JvbGxUbyh4LCB5KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIC8qIGluIGFsbCBvdGhlciBjYXNlcywgZG8gYSByZWd1bGFyIHNjcm9sbCAqL1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsVG8oeCwgeSwgdGhpcy5vcHRpb25zLmRyYWdPcHRpb25zLmZhZGUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdmFyIF9hO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAvKipcclxuICAgICAgICAgICAgICogQ2FsY3VsYXRlcyB0aGUgcm91bmRlZCBhbmQgc2NhbGVkIGNvb3JkaW5hdGVzLlxyXG4gICAgICAgICAgICAgKlxyXG4gICAgICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0geCAtIHRoZSB4LWNvb3JkaW5hdGVcclxuICAgICAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IHkgLSB0aGUgeS1jb29yZGluYXRlXHJcbiAgICAgICAgICAgICAqIEByZXR1cm4ge2FycmF5fSBbeCwgeV0gLSB0aGUgZmluYWwgY29vcmRpbmF0ZXNcclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIFp3b29zaC5wcm90b3R5cGUuZ2V0UmVhbENvb3JkcyA9IGZ1bmN0aW9uICh4LCB5KSB7XHJcbiAgICAgICAgICAgICAgICAvL3N0aWNrIHRoZSBlbGVtZW50IHRvIHRoZSBncmlkLCBpZiBncmlkIGVxdWFscyAxIHRoZSB2YWx1ZSBkb2VzIG5vdCBjaGFuZ2VcclxuICAgICAgICAgICAgICAgIHggPSBNYXRoLnJvdW5kKHggLyAodGhpcy5vcHRpb25zLmdyaWRYICogdGhpcy5nZXRTY2FsZSgpKSkgKiAodGhpcy5vcHRpb25zLmdyaWRYICogdGhpcy5nZXRTY2FsZSgpKTtcclxuICAgICAgICAgICAgICAgIHkgPSBNYXRoLnJvdW5kKHkgLyAodGhpcy5vcHRpb25zLmdyaWRZICogdGhpcy5nZXRTY2FsZSgpKSkgKiAodGhpcy5vcHRpb25zLmdyaWRZICogdGhpcy5nZXRTY2FsZSgpKTtcclxuICAgICAgICAgICAgICAgIHZhciBzY3JvbGxNYXhMZWZ0ID0gKHRoaXMuc2Nyb2xsRWxlbWVudC5zY3JvbGxXaWR0aCAtIHRoaXMuc2Nyb2xsRWxlbWVudC5jbGllbnRXaWR0aCk7XHJcbiAgICAgICAgICAgICAgICB2YXIgc2Nyb2xsTWF4VG9wID0gKHRoaXMuc2Nyb2xsRWxlbWVudC5zY3JvbGxIZWlnaHQgLSB0aGlzLnNjcm9sbEVsZW1lbnQuY2xpZW50SGVpZ2h0KTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBbXHJcbiAgICAgICAgICAgICAgICAgICAgKHggPiBzY3JvbGxNYXhMZWZ0KSA/IHNjcm9sbE1heExlZnQgOiB4LFxyXG4gICAgICAgICAgICAgICAgICAgICh5ID4gc2Nyb2xsTWF4VG9wKSA/IHNjcm9sbE1heFRvcCA6IHlcclxuICAgICAgICAgICAgICAgIF07XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIFp3b29zaC5wcm90b3R5cGUudGltZWRTY3JvbGwgPSBmdW5jdGlvbiAoeCwgeSwgdCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIG1lID0gdGhpcztcclxuICAgICAgICAgICAgICAgIHRoaXMudGltZW91dHMucHVzaChzZXRUaW1lb3V0KChmdW5jdGlvbiAoeCwgeSwgbWUpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBtZS5zZXRTY3JvbGxUb3AoeSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lLnNldFNjcm9sbExlZnQoeCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lLm9yaWdpblNjcm9sbExlZnQgPSB4O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBtZS5vcmlnaW5TY3JvbGxUb3AgPSB5O1xyXG4gICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICB9KHgsIHksIG1lKSksIHQpKTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgICAqIENhbGN1bGF0ZXMgZWFjaCBzdGVwIG9mIGEgc2Nyb2xsIGZhZGVvdXQgYW5pbWF0aW9uIGJhc2VkIG9uIHRoZSBpbml0aWFsIHZlbG9jaXR5LlxyXG4gICAgICAgICAgICAgKiBTdG9wcyBhbnkgY3VycmVudGx5IHJ1bm5pbmcgc2Nyb2xsIGFuaW1hdGlvbi5cclxuICAgICAgICAgICAgICpcclxuICAgICAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IHZ4IC0gdGhlIGluaXRpYWwgdmVsb2NpdHkgaW4gaG9yaXpvbnRhbCBkaXJlY3Rpb25cclxuICAgICAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IHZ5IC0gdGhlIGluaXRpYWwgdmVsb2NpdHkgaW4gdmVydGljYWwgZGlyZWN0aW9uXHJcbiAgICAgICAgICAgICAqIEByZXR1cm4ge251bWJlcn0gLSB0aGUgZmluYWwgeS1jb29yZGluYXRlXHJcbiAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLmZhZGVPdXRCeVZlbG9jaXR5ID0gZnVuY3Rpb24gKHZ4LCB2eSkge1xyXG4gICAgICAgICAgICAgICAgLyogVE9ETzogY2FsYyB2IGhlcmUgYW5kIHdpdGggbW9yZSBpbmZvLCBtb3JlIHByZWNpc2VseSAqL1xyXG4gICAgICAgICAgICAgICAgdmFyIF90aGlzID0gdGhpcztcclxuICAgICAgICAgICAgICAgIC8qIGNhbGN1bGF0ZSB0aGUgYnJha2UgYWNjZWxlcmF0aW9uIGluIGJvdGggZGlyZWN0aW9ucyBzZXBhcmF0ZWx5ICovXHJcbiAgICAgICAgICAgICAgICB2YXIgYXkgPSAodnkgPiAwID8gLTEgOiAxKSAqIHRoaXMub3B0aW9ucy5kcmFnT3B0aW9ucy5icmFrZVNwZWVkO1xyXG4gICAgICAgICAgICAgICAgdmFyIGF4ID0gKHZ4ID4gMCA/IC0xIDogMSkgKiB0aGlzLm9wdGlvbnMuZHJhZ09wdGlvbnMuYnJha2VTcGVlZDtcclxuICAgICAgICAgICAgICAgIC8qIGZpbmQgdGhlIGRpcmVjdGlvbiB0aGF0IG5lZWRzIGxvbmdlciB0byBzdG9wLCBhbmQgcmVjYWxjdWxhdGUgdGhlIGFjY2VsZXJhdGlvbiAqL1xyXG4gICAgICAgICAgICAgICAgdmFyIHRtYXggPSBNYXRoLm1heCgoMCAtIHZ5KSAvIGF5LCAoMCAtIHZ4KSAvIGF4KTtcclxuICAgICAgICAgICAgICAgIGF4ID0gKDAgLSB2eCkgLyB0bWF4O1xyXG4gICAgICAgICAgICAgICAgYXkgPSAoMCAtIHZ5KSAvIHRtYXg7XHJcbiAgICAgICAgICAgICAgICB2YXIgZnBzID0gdGhpcy5vcHRpb25zLmRyYWdPcHRpb25zLmZwcztcclxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgKCh0bWF4ICogZnBzKSArICgwIC8gZnBzKSk7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciB0ID0gKChpICsgMSkgLyBmcHMpO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBzeSA9IHRoaXMuZ2V0U2Nyb2xsVG9wKCkgKyAodnkgKiB0KSArICgwLjUgKiBheSAqIHQgKiB0KTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgc3ggPSB0aGlzLmdldFNjcm9sbExlZnQoKSArICh2eCAqIHQpICsgKDAuNSAqIGF4ICogdCAqIHQpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudGltZWRTY3JvbGwoc3gsIHN5LCAoaSArIDEpICogKDEwMDAgLyBmcHMpKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChpID4gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8qIHJvdW5kIHRoZSBsYXN0IHN0ZXAgYmFzZWQgb24gdGhlIGRpcmVjdGlvbiBvZiB0aGUgZmFkZSAqL1xyXG4gICAgICAgICAgICAgICAgICAgIHN4ID0gdnggPiAwID8gTWF0aC5jZWlsKHN4KSA6IE1hdGguZmxvb3Ioc3gpO1xyXG4gICAgICAgICAgICAgICAgICAgIHN5ID0gdnkgPiAwID8gTWF0aC5jZWlsKHN5KSA6IE1hdGguZmxvb3Ioc3kpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudGltZWRTY3JvbGwoc3gsIHN5LCAoaSArIDIpICogKDEwMDAgLyBmcHMpKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIC8qIHN0b3AgdGhlIGFuaW1hdGlvbiB3aGVuIGNvbGxpZGluZyB3aXRoIHRoZSBib3JkZXJzICovXHJcbiAgICAgICAgICAgICAgICB0aGlzLmNsZWFyTGlzdGVuZXJMZWZ0ID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gX3RoaXMuY2xlYXJUaW1lb3V0cygpOyB9O1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jbGVhckxpc3RlbmVyUmlnaHQgPSBmdW5jdGlvbiAoKSB7IHJldHVybiBfdGhpcy5jbGVhclRpbWVvdXRzKCk7IH07XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNsZWFyTGlzdGVuZXJUb3AgPSBmdW5jdGlvbiAoKSB7IHJldHVybiBfdGhpcy5jbGVhclRpbWVvdXRzKCk7IH07XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNsZWFyTGlzdGVuZXJCb3R0b20gPSBmdW5jdGlvbiAoKSB7IHJldHVybiBfdGhpcy5jbGVhclRpbWVvdXRzKCk7IH07XHJcbiAgICAgICAgICAgICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIodGhpcy5pbm5lciwgJ2NvbGxpZGUubGVmdCcsIHRoaXMuY2xlYXJMaXN0ZW5lckxlZnQpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKHRoaXMuaW5uZXIsICdjb2xsaWRlLnJpZ2h0JywgdGhpcy5jbGVhckxpc3RlbmVyUmlnaHQpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKHRoaXMuaW5uZXIsICdjb2xsaWRlLnRvcCcsIHRoaXMuY2xlYXJMaXN0ZW5lclRvcCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIodGhpcy5pbm5lciwgJ2NvbGxpZGUuYm90dG9tJywgdGhpcy5jbGVhckxpc3RlbmVyQm90dG9tKTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgWndvb3NoLnByb3RvdHlwZS5mYWRlT3V0QnlDb29yZHMgPSBmdW5jdGlvbiAoeCwgeSkge1xyXG4gICAgICAgICAgICAgICAgX2EgPSB0aGlzLmdldFJlYWxDb29yZHMoeCwgeSksIHggPSBfYVswXSwgeSA9IF9hWzFdO1xyXG4gICAgICAgICAgICAgICAgdmFyIGEgPSB0aGlzLm9wdGlvbnMuZHJhZ09wdGlvbnMuYnJha2VTcGVlZCAqIC0xO1xyXG4gICAgICAgICAgICAgICAgdmFyIHZ5ID0gMCAtICgyICogYSAqICh5IC0gdGhpcy5nZXRTY3JvbGxUb3AoKSkpO1xyXG4gICAgICAgICAgICAgICAgdmFyIHZ4ID0gMCAtICgyICogYSAqICh4IC0gdGhpcy5nZXRTY3JvbGxMZWZ0KCkpKTtcclxuICAgICAgICAgICAgICAgIHZ5ID0gKHZ5ID4gMCA/IDEgOiAtMSkgKiBNYXRoLnNxcnQoTWF0aC5hYnModnkpKTtcclxuICAgICAgICAgICAgICAgIHZ4ID0gKHZ4ID4gMCA/IDEgOiAtMSkgKiBNYXRoLnNxcnQoTWF0aC5hYnModngpKTtcclxuICAgICAgICAgICAgICAgIHZhciBzeCA9IHggLSB0aGlzLmdldFNjcm9sbExlZnQoKTtcclxuICAgICAgICAgICAgICAgIHZhciBzeSA9IHkgLSB0aGlzLmdldFNjcm9sbFRvcCgpO1xyXG4gICAgICAgICAgICAgICAgaWYgKE1hdGguYWJzKHN5KSA+IE1hdGguYWJzKHN4KSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZ4ID0gKHZ4ID4gMCA/IDEgOiAtMSkgKiBNYXRoLmFicygoc3ggLyBzeSkgKiB2eSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB2eSA9ICh2eSA+IDAgPyAxIDogLTEpICogTWF0aC5hYnMoKHN5IC8gc3gpICogdngpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdGhpcy5jbGVhclRpbWVvdXRzKCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmZhZGVPdXRCeVZlbG9jaXR5KHZ4LCB2eSk7XHJcbiAgICAgICAgICAgICAgICB2YXIgX2E7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgKiBNb3VzZSBtb3ZlIGhhbmRsZXJcclxuICAgICAgICAgICAgICogQ2FsY3VjYXRlcyB0aGUgeCBhbmQgeSBkZWx0YXMgYW5kIHNjcm9sbHNcclxuICAgICAgICAgICAgICpcclxuICAgICAgICAgICAgICogQHBhcmFtIHtNb3VzZUV2ZW50fSBlIC0gVGhlIG1vdXNlIG1vdmUgZXZlbnQgb2JqZWN0XHJcbiAgICAgICAgICAgICAqIEByZXR1cm4ge3ZvaWR9XHJcbiAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLm1vdXNlTW92ZSA9IGZ1bmN0aW9uIChlKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnByZXNlbnQgPSAodGhpcy5nZXRUaW1lc3RhbXAoKSAvIDEwMDApOyAvL2luIHNlY29uZHNcclxuICAgICAgICAgICAgICAgIHRoaXMuY2xlYXJUZXh0U2VsZWN0aW9uKCk7XHJcbiAgICAgICAgICAgICAgICAvKiBpZiB0aGUgbW91c2UgbGVmdCB0aGUgd2luZG93IGFuZCB0aGUgYnV0dG9uIGlzIG5vdCBwcmVzc2VkIGFueW1vcmUsIGFib3J0IG1vdmluZyAqL1xyXG4gICAgICAgICAgICAgICAgLy9pZiAoKGUuYnV0dG9ucyA9PT0gMCAmJiBlLmJ1dHRvbiA9PT0gMCkgfHwgKHR5cGVvZiBlLmJ1dHRvbnMgPT09ICd1bmRlZmluZWQnICYmIGUuYnV0dG9uID09PSAwKSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKChcIndoaWNoXCIgaW4gZSAmJiBlLndoaWNoID09PSAwKSB8fCAodHlwZW9mIGUud2hpY2ggPT09ICd1bmRlZmluZWQnICYmIFwiYnV0dG9uXCIgaW4gZSAmJiBlLmJ1dHRvbiA9PT0gMCkpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm1vdXNlVXAoZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdmFyIHggPSB0aGlzLmRyYWdPcmlnaW5MZWZ0ICsgdGhpcy5kcmFnT3JpZ2luU2Nyb2xsTGVmdCAtIGUuY2xpZW50WDtcclxuICAgICAgICAgICAgICAgIHZhciB5ID0gdGhpcy5kcmFnT3JpZ2luVG9wICsgdGhpcy5kcmFnT3JpZ2luU2Nyb2xsVG9wIC0gZS5jbGllbnRZO1xyXG4gICAgICAgICAgICAgICAgLyogaWYgZWxhc3RpYyBlZGdlcyBhcmUgc2V0LCBzaG93IHRoZSBlbGVtZW50IHBzZXVkbyBzY3JvbGxlZCBieSByZWxhdGl2ZSBwb3NpdGlvbiAqL1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMudHJpZ2dlcmVkLmNvbGxpZGVCb3R0b20gJiYgdGhpcy5vcHRpb25zLmVsYXN0aWNFZGdlcy5ib3R0b20gPT09IHRydWUpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmlubmVyLnN0eWxlLnBvc2l0aW9uID0gJ3JlbGF0aXZlJztcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmlubmVyLnN0eWxlLnRvcCA9ICgodGhpcy5nZXRTY3JvbGxUb3AoKSAtIHkpIC8gMikgKyAncHgnO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMudHJpZ2dlcmVkLmNvbGxpZGVUb3AgJiYgdGhpcy5vcHRpb25zLmVsYXN0aWNFZGdlcy50b3AgPT09IHRydWUpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmlubmVyLnN0eWxlLnBvc2l0aW9uID0gJ3JlbGF0aXZlJztcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmlubmVyLnN0eWxlLnRvcCA9ICh5IC8gLTIpICsgJ3B4JztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLnRyaWdnZXJlZC5jb2xsaWRlTGVmdCAmJiB0aGlzLm9wdGlvbnMuZWxhc3RpY0VkZ2VzLmxlZnQgPT09IHRydWUpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmlubmVyLnN0eWxlLnBvc2l0aW9uID0gJ3JlbGF0aXZlJztcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmlubmVyLnN0eWxlLmxlZnQgPSAoeCAvIC0yKSArICdweCc7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy50cmlnZ2VyZWQuY29sbGlkZVJpZ2h0ICYmIHRoaXMub3B0aW9ucy5lbGFzdGljRWRnZXMucmlnaHQgPT09IHRydWUpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmlubmVyLnN0eWxlLnBvc2l0aW9uID0gJ3JlbGF0aXZlJztcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmlubmVyLnN0eWxlLmxlZnQgPSAoKHRoaXMuZ2V0U2Nyb2xsTGVmdCgpIC0geCkgLyAyKSArICdweCc7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB0aGlzLnZ4W3RoaXMucHJlc2VudF0gPSB4O1xyXG4gICAgICAgICAgICAgICAgdGhpcy52eVt0aGlzLnByZXNlbnRdID0geTtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsVG8oeCwgeSwgZmFsc2UpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wYXN0ID0gdGhpcy5wcmVzZW50O1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAvKipcclxuICAgICAgICAgICAgICogc2Nyb2xsQnkgaGVscGVyIG1ldGhvZCB0byBzY3JvbGwgYnkgYW4gYW1vdW50IG9mIHBpeGVscyBpbiB4LSBhbmQgeS1kaXJlY3Rpb25cclxuICAgICAgICAgICAgICpcclxuICAgICAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IHggLSBhbW91bnQgb2YgcGl4ZWxzIHRvIHNjcm9sbCBpbiB4LWRpcmVjdGlvblxyXG4gICAgICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0geSAtIGFtb3VudCBvZiBwaXhlbHMgdG8gc2Nyb2xsIGluIHktZGlyZWN0aW9uXHJcbiAgICAgICAgICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gc21vb3RoIC0gd2hldGhlciB0byBzY3JvbGwgc21vb3RoIG9yIGluc3RhbnRcclxuICAgICAgICAgICAgICogQHJldHVybiB7dm9pZH1cclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIFp3b29zaC5wcm90b3R5cGUuc2Nyb2xsQnkgPSBmdW5jdGlvbiAoeCwgeSwgc21vb3RoKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoc21vb3RoID09PSB2b2lkIDApIHsgc21vb3RoID0gdHJ1ZTsgfVxyXG4gICAgICAgICAgICAgICAgdmFyIGFic29sdXRlWCA9IHRoaXMuZ2V0U2Nyb2xsTGVmdCgpICsgeDtcclxuICAgICAgICAgICAgICAgIHZhciBhYnNvbHV0ZVkgPSB0aGlzLmdldFNjcm9sbFRvcCgpICsgeTtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsVG8oYWJzb2x1dGVYLCBhYnNvbHV0ZVksIHNtb290aCk7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgKiBzY3JvbGxCeSBoZWxwZXIgbWV0aG9kIHRvIHNjcm9sbCB0byBhIHgtIGFuZCB5LWNvb3JkaW5hdGVcclxuICAgICAgICAgICAgICpcclxuICAgICAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IHggLSB4LWNvb3JkaW5hdGUgdG8gc2Nyb2xsIHRvXHJcbiAgICAgICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSB5IC0geS1jb29yZGluYXRlIHRvIHNjcm9sbCB0b1xyXG4gICAgICAgICAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IHNtb290aCAtIHdoZXRoZXIgdG8gc2Nyb2xsIHNtb290aCBvciBpbnN0YW50XHJcbiAgICAgICAgICAgICAqIEByZXR1cm4ge3ZvaWR9XHJcbiAgICAgICAgICAgICAqXHJcbiAgICAgICAgICAgICAqIEBUT0RPOiBDU1MzIHRyYW5zaXRpb25zIGlmIGF2YWlsYWJsZSBpbiBicm93c2VyXHJcbiAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLnNjcm9sbFRvID0gZnVuY3Rpb24gKHgsIHksIHNtb290aCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHNtb290aCA9PT0gdm9pZCAwKSB7IHNtb290aCA9IHRydWU7IH1cclxuICAgICAgICAgICAgICAgIHRoaXMuY2xlYXJUaW1lb3V0cygpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zY3JvbGxNYXhMZWZ0ID0gKHRoaXMuc2Nyb2xsRWxlbWVudC5zY3JvbGxXaWR0aCAtIHRoaXMuc2Nyb2xsRWxlbWVudC5jbGllbnRXaWR0aCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNjcm9sbE1heFRvcCA9ICh0aGlzLnNjcm9sbEVsZW1lbnQuc2Nyb2xsSGVpZ2h0IC0gdGhpcy5zY3JvbGxFbGVtZW50LmNsaWVudEhlaWdodCk7XHJcbiAgICAgICAgICAgICAgICAvKiBubyBuZWdhdGl2ZSB2YWx1ZXMgb3IgdmFsdWVzIGdyZWF0ZXIgdGhhbiB0aGUgbWF4aW11bSAqL1xyXG4gICAgICAgICAgICAgICAgdmFyIHggPSAoeCA+IHRoaXMuc2Nyb2xsTWF4TGVmdCkgPyB0aGlzLnNjcm9sbE1heExlZnQgOiAoeCA8IDApID8gMCA6IHg7XHJcbiAgICAgICAgICAgICAgICB2YXIgeSA9ICh5ID4gdGhpcy5zY3JvbGxNYXhUb3ApID8gdGhpcy5zY3JvbGxNYXhUb3AgOiAoeSA8IDApID8gMCA6IHk7XHJcbiAgICAgICAgICAgICAgICAvKiByZW1lbWJlciB0aGUgb2xkIHZhbHVlcyAqL1xyXG4gICAgICAgICAgICAgICAgdGhpcy5vcmlnaW5TY3JvbGxMZWZ0ID0gdGhpcy5nZXRTY3JvbGxMZWZ0KCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm9yaWdpblNjcm9sbFRvcCA9IHRoaXMuZ2V0U2Nyb2xsVG9wKCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoeCAhPT0gdGhpcy5nZXRTY3JvbGxMZWZ0KCkgfHwgeSAhPT0gdGhpcy5nZXRTY3JvbGxUb3AoKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMud2hlZWxPcHRpb25zLnNtb290aCAhPT0gdHJ1ZSB8fCBzbW9vdGggPT09IGZhbHNlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0U2Nyb2xsVG9wKHkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNldFNjcm9sbExlZnQoeCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmZhZGVPdXRCeUNvb3Jkcyh4LCB5KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgKiBSZWdpc3RlciBjdXN0b20gZXZlbnQgY2FsbGJhY2tzXHJcbiAgICAgICAgICAgICAqXHJcbiAgICAgICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBldmVudCAtIFRoZSBldmVudCBuYW1lXHJcbiAgICAgICAgICAgICAqIEBwYXJhbSB7KGU6IEV2ZW50KSA9PiBhbnl9IGNhbGxiYWNrIC0gQSBjYWxsYmFjayBmdW5jdGlvbiB0byBleGVjdXRlIHdoZW4gdGhlIGV2ZW50IHJhaXNlc1xyXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHtad29vc2h9IC0gVGhlIFp3b29zaCBvYmplY3QgaW5zdGFuY2VcclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIFp3b29zaC5wcm90b3R5cGUub24gPSBmdW5jdGlvbiAoZXZlbnQsIGNhbGxiYWNrKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIodGhpcy5pbm5lciwgZXZlbnQsIGNhbGxiYWNrKTtcclxuICAgICAgICAgICAgICAgIC8qIHNldCB0aGUgZXZlbnQgdW50cmlnZ2VyZWQgYW5kIGNhbGwgdGhlIGZ1bmN0aW9uLCB0byByZXRyaWdnZXIgbWV0IGV2ZW50cyAqL1xyXG4gICAgICAgICAgICAgICAgdmFyIGYgPSBldmVudC5yZXBsYWNlKC9cXC4oW2Etel0pLywgU3RyaW5nLmNhbGwuYmluZChldmVudC50b1VwcGVyQ2FzZSkpLnJlcGxhY2UoL1xcLi8sICcnKTtcclxuICAgICAgICAgICAgICAgIHRoaXMudHJpZ2dlcmVkW2ZdID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm9uU2Nyb2xsKCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgICAqIERlcmVnaXN0ZXIgY3VzdG9tIGV2ZW50IGNhbGxiYWNrc1xyXG4gICAgICAgICAgICAgKlxyXG4gICAgICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnQgLSBUaGUgZXZlbnQgbmFtZVxyXG4gICAgICAgICAgICAgKiBAcGFyYW0geyhlOiBFdmVudCkgPT4gYW55fSBjYWxsYmFjayAtIEEgY2FsbGJhY2sgZnVuY3Rpb24gdG8gZXhlY3V0ZSB3aGVuIHRoZSBldmVudCByYWlzZXNcclxuICAgICAgICAgICAgICogQHJldHVybiB7Wndvb3NofSAtIFRoZSBad29vc2ggb2JqZWN0IGluc3RhbmNlXHJcbiAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLm9mZiA9IGZ1bmN0aW9uIChldmVudCwgY2FsbGJhY2spIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucmVtb3ZlRXZlbnRMaXN0ZW5lcih0aGlzLmlubmVyLCBldmVudCwgY2FsbGJhY2spO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgKiBSZXZlcnQgYWxsIERPTSBtYW5pcHVsYXRpb25zIGFuZCBkZXJlZ2lzdGVyIGFsbCBldmVudCBoYW5kbGVyc1xyXG4gICAgICAgICAgICAgKlxyXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHt2b2lkfVxyXG4gICAgICAgICAgICAgKiBAVE9ETzogcmVtb3Zpbmcgd2hlZWxab29tSGFuZGxlciBkb2VzIG5vdCB3b3JrXHJcbiAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgeCA9IHRoaXMuZ2V0U2Nyb2xsTGVmdCgpO1xyXG4gICAgICAgICAgICAgICAgdmFyIHkgPSB0aGlzLmdldFNjcm9sbFRvcCgpO1xyXG4gICAgICAgICAgICAgICAgLyogcmVtb3ZlIHRoZSBvdXRlciBhbmQgZ3JhYiBDU1MgY2xhc3NlcyAqL1xyXG4gICAgICAgICAgICAgICAgdmFyIHJlID0gbmV3IFJlZ0V4cChcIiBcIiArIHRoaXMuY2xhc3NPdXRlciArIFwiIFwiKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuY29udGFpbmVyLmNsYXNzTmFtZSA9IHRoaXMuY29udGFpbmVyLmNsYXNzTmFtZS5yZXBsYWNlKHJlLCAnJyk7XHJcbiAgICAgICAgICAgICAgICB2YXIgcmUgPSBuZXcgUmVnRXhwKFwiIFwiICsgdGhpcy5jbGFzc0dyYWIgKyBcIiBcIik7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmlubmVyLmNsYXNzTmFtZSA9IHRoaXMuaW5uZXIuY2xhc3NOYW1lLnJlcGxhY2UocmUsICcnKTtcclxuICAgICAgICAgICAgICAgIHZhciByZSA9IG5ldyBSZWdFeHAoXCIgXCIgKyB0aGlzLmNsYXNzTm9HcmFiICsgXCIgXCIpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jb250YWluZXIuY2xhc3NOYW1lID0gdGhpcy5jb250YWluZXIuY2xhc3NOYW1lLnJlcGxhY2UocmUsICcnKTtcclxuICAgICAgICAgICAgICAgIC8qIG1vdmUgYWxsIGNoaWxkTm9kZXMgYmFjayB0byB0aGUgb2xkIG91dGVyIGVsZW1lbnQgYW5kIHJlbW92ZSB0aGUgaW5uZXIgZWxlbWVudCAqL1xyXG4gICAgICAgICAgICAgICAgd2hpbGUgKHRoaXMuaW5uZXIuY2hpbGROb2Rlcy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jb250YWluZXIuYXBwZW5kQ2hpbGQodGhpcy5pbm5lci5jaGlsZE5vZGVzWzBdKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHRoaXMuc2NhbGVFbGVtZW50LnJlbW92ZUNoaWxkKHRoaXMuaW5uZXIpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jb250YWluZXIucmVtb3ZlQ2hpbGQodGhpcy5zY2FsZUVsZW1lbnQpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zY3JvbGxUbyh4LCB5LCBmYWxzZSk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm1vdXNlTW92ZUhhbmRsZXIgPyB0aGlzLnJlbW92ZUV2ZW50TGlzdGVuZXIoZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LCAnbW91c2Vtb3ZlJywgdGhpcy5tb3VzZU1vdmVIYW5kbGVyKSA6IG51bGw7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm1vdXNlVXBIYW5kbGVyID8gdGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCwgJ21vdXNldXAnLCB0aGlzLm1vdXNlVXBIYW5kbGVyKSA6IG51bGw7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm1vdXNlRG93bkhhbmRsZXIgPyB0aGlzLnJlbW92ZUV2ZW50TGlzdGVuZXIodGhpcy5pbm5lciwgJ21vdXNlZG93bicsIHRoaXMubW91c2VEb3duSGFuZGxlcikgOiBudWxsO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5tb3VzZVNjcm9sbEhhbmRsZXIgPyB0aGlzLnJlbW92ZUV2ZW50TGlzdGVuZXIodGhpcy5zY3JvbGxFbGVtZW50LCAnd2hlZWwnLCB0aGlzLm1vdXNlU2Nyb2xsSGFuZGxlcikgOiBudWxsO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5tb3VzZVpvb21IYW5kbGVyID8gdGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKHRoaXMuc2Nyb2xsRWxlbWVudCwgJ3doZWVsJywgdGhpcy5tb3VzZVpvb21IYW5kbGVyKSA6IG51bGw7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmhhc2hDaGFuZ2VIYW5kbGVyID8gdGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKHdpbmRvdywgJ215aGFzaGNoYW5nZScsIHRoaXMuaGFzaENoYW5nZUhhbmRsZXIpIDogbnVsbDtcclxuICAgICAgICAgICAgICAgIHRoaXMuaGFzaENoYW5nZUhhbmRsZXIgPyB0aGlzLnJlbW92ZUV2ZW50TGlzdGVuZXIod2luZG93LCAnaGFzaGNoYW5nZScsIHRoaXMuaGFzaENoYW5nZUhhbmRsZXIpIDogbnVsbDtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmhhc2hDaGFuZ2VDbGlja0hhbmRsZXIpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgbGlua3MgPSB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yQWxsKFwiYVtocmVmXj0nIyddXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGlua3MubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKGxpbmtzW2ldLCAnY2xpY2snLCB0aGlzLmhhc2hDaGFuZ2VDbGlja0hhbmRsZXIpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsRWxlbWVudCA/IHRoaXMuc2Nyb2xsRWxlbWVudC5vbm1vdXNld2hlZWwgPSBudWxsIDogbnVsbDtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsRWxlbWVudCA/IHRoaXMuc2Nyb2xsRWxlbWVudC5vbnNjcm9sbCA9IG51bGwgOiBudWxsO1xyXG4gICAgICAgICAgICAgICAgd2luZG93Lm9ucmVzaXplID0gbnVsbDtcclxuICAgICAgICAgICAgICAgIC8qIHJlbW92ZSBhbGwgY3VzdG9tIGV2ZW50bGlzdGVuZXJzIGF0dGFjaGVkIHZpYSBvbigpICovXHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBldmVudCBpbiB0aGlzLmN1c3RvbUV2ZW50cykge1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGMgaW4gdGhpcy5jdXN0b21FdmVudHNbZXZlbnRdKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVtb3ZlRXZlbnRMaXN0ZW5lcih0aGlzLmlubmVyLCBldmVudCwgdGhpcy5jdXN0b21FdmVudHNbZXZlbnRdW2NdWzBdKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIHJldHVybiBad29vc2g7XHJcbiAgICAgICAgfSgpKTtcclxuICAgICAgICAvKiByZXR1cm4gYW4gaW5zdGFuY2Ugb2YgdGhlIGNsYXNzICovXHJcbiAgICAgICAgcmV0dXJuIG5ldyBad29vc2goY29udGFpbmVyLCBvcHRpb25zKTtcclxuICAgIH1cclxuICAgIHJldHVybiB6d29vc2g7XHJcbn0pO1xyXG4vLyMgc291cmNlTWFwcGluZ1VSTD16d29vc2guanMubWFwIl19
