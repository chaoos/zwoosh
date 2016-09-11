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
             * @return {array} - the amount of pixels [width, height]
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
                        if (scale > this.options.zoomOptions.maxScale && this.options.zoomOptions.maxScale !== 0) {
                            scale = this.options.zoomOptions.maxScale;
                            width = Math.floor(parseInt(this.inner.style.minWidth) * scale);
                            height = Math.floor(parseInt(this.inner.style.minHeight) * scale);
                        }
                        if (scale < this.options.zoomOptions.minScale && this.options.zoomOptions.minScale !== 0) {
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
                var x = this.getRealX(this.dragOriginLeft + this.dragOriginScrollLeft - e.clientX);
                var y = this.getRealY(this.dragOriginTop + this.dragOriginScrollTop - e.clientY);
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
            };
            /**
             * Calculates the rounded and scaled x-coordinate.
             *
             * @param {number} x - the x-coordinate
             * @return {number} - the final x-coordinate
             */
            Zwoosh.prototype.getRealX = function (x) {
                //stick the element to the grid, if grid equals 1 the value does not change
                x = Math.round(x / (this.options.gridX * this.getScale())) * (this.options.gridX * this.getScale());
                var scrollMaxLeft = (this.scrollElement.scrollWidth - this.scrollElement.clientWidth);
                return (x > scrollMaxLeft) ? scrollMaxLeft : x;
            };
            /**
             * Calculates the rounded and scaled y-coordinate.
             *
             * @param {number} y - the y-coordinate
             * @return {number} - the final y-coordinate
             */
            Zwoosh.prototype.getRealY = function (y) {
                //stick the element to the grid, if grid equals 1 the value does not change
                y = Math.round(y / (this.options.gridY * this.getScale())) * (this.options.gridY * this.getScale());
                var scrollMaxTop = (this.scrollElement.scrollHeight - this.scrollElement.clientHeight);
                return (y > scrollMaxTop) ? scrollMaxTop : y;
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
                var me = this;
                for (var i = 0; i < ((tmax * fps) + (0 / fps)); i++) {
                    var t = ((i + 1) / fps);
                    var sy = this.getScrollTop() + (vy * t) + (0.5 * ay * t * t);
                    var sx = this.getScrollLeft() + (vx * t) + (0.5 * ax * t * t);
                    this.timeouts.push(setTimeout((function (x, y, me) {
                        return function () {
                            me.setScrollTop(y);
                            me.setScrollLeft(x);
                            me.originScrollLeft = x;
                            me.originScrollTop = y;
                        };
                    }(sx, sy, me)), (i + 1) * (1000 / fps)));
                }
                if (i > 0) {
                    /* round the last step based on the direction of the fade */
                    sx = vx > 0 ? Math.ceil(sx) : Math.floor(sx);
                    sy = vy > 0 ? Math.ceil(sy) : Math.floor(sy);
                    this.timeouts.push(setTimeout((function (x, y, me) {
                        return function () {
                            me.setScrollTop(y);
                            me.setScrollLeft(x);
                            me.originScrollLeft = x;
                            me.originScrollTop = y;
                        };
                    }(sx, sy, me)), (i + 2) * (1000 / fps)));
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
                x = this.getRealX(x);
                y = this.getRealY(y);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiendvb3NoLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIihmdW5jdGlvbiAoZmFjdG9yeSkge1xyXG4gICAgaWYgKHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUuZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcclxuICAgICAgICB2YXIgdiA9IGZhY3RvcnkocmVxdWlyZSwgZXhwb3J0cyk7IGlmICh2ICE9PSB1bmRlZmluZWQpIG1vZHVsZS5leHBvcnRzID0gdjtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xyXG4gICAgICAgIGRlZmluZShbXCJyZXF1aXJlXCIsIFwiZXhwb3J0c1wiXSwgZmFjdG9yeSk7XHJcbiAgICB9XHJcbn0pKGZ1bmN0aW9uIChyZXF1aXJlLCBleHBvcnRzKSB7XHJcbiAgICBcInVzZSBzdHJpY3RcIjtcclxuICAgIC8qKlxyXG4gICAgICogRXhwb3J0IGZ1bmN0aW9uIG9mIHRoZSBtb2R1bGVcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBjb250YWluZXIgLSBUaGUgSFRNTEVsZW1lbnQgdG8gc3dvb29vc2ghXHJcbiAgICAgKiBAcGFyYW0ge09wdGlvbnN9IG9wdGlvbnMgLSB0aGUgb3B0aW9ucyBvYmplY3QgdG8gY29uZmlndXJlIFp3b29zaFxyXG4gICAgICogQHJldHVybiB7Wndvb3NofSAtIFp3b29zaCBvYmplY3QgaW5zdGFuY2VcclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gendvb3NoKGNvbnRhaW5lciwgb3B0aW9ucykge1xyXG4gICAgICAgIGlmIChvcHRpb25zID09PSB2b2lkIDApIHsgb3B0aW9ucyA9IHt9OyB9XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogUG9seWZpbGwgYmluZCBmdW5jdGlvbiBmb3Igb2xkZXIgYnJvd3NlcnNcclxuICAgICAgICAgKiBUaGUgYmluZCBmdW5jdGlvbiBpcyBhbiBhZGRpdGlvbiB0byBFQ01BLTI2MiwgNXRoIGVkaXRpb25cclxuICAgICAgICAgKiBAc2VlOiBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9HbG9iYWxfT2JqZWN0cy9GdW5jdGlvbi9iaW5kXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgaWYgKCFGdW5jdGlvbi5wcm90b3R5cGUuYmluZCkge1xyXG4gICAgICAgICAgICBGdW5jdGlvbi5wcm90b3R5cGUuYmluZCA9IGZ1bmN0aW9uIChvVGhpcykge1xyXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB0aGlzICE9PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gY2xvc2VzdCB0aGluZyBwb3NzaWJsZSB0byB0aGUgRUNNQVNjcmlwdCA1XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gaW50ZXJuYWwgSXNDYWxsYWJsZSBmdW5jdGlvblxyXG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0Z1bmN0aW9uLnByb3RvdHlwZS5iaW5kIC0gd2hhdCBpcyB0cnlpbmcgdG8gYmUgYm91bmQgaXMgbm90IGNhbGxhYmxlJyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB2YXIgYUFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpLCBmVG9CaW5kID0gdGhpcywgZk5PUCA9IGZ1bmN0aW9uICgpIHsgfSwgZkJvdW5kID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmVG9CaW5kLmFwcGx5KHRoaXMgaW5zdGFuY2VvZiBmTk9QXHJcbiAgICAgICAgICAgICAgICAgICAgICAgID8gdGhpc1xyXG4gICAgICAgICAgICAgICAgICAgICAgICA6IG9UaGlzLCBhQXJncy5jb25jYXQoQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKSkpO1xyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLnByb3RvdHlwZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIEZ1bmN0aW9uLnByb3RvdHlwZSBkb2Vzbid0IGhhdmUgYSBwcm90b3R5cGUgcHJvcGVydHlcclxuICAgICAgICAgICAgICAgICAgICBmTk9QLnByb3RvdHlwZSA9IHRoaXMucHJvdG90eXBlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZkJvdW5kLnByb3RvdHlwZSA9IG5ldyBmTk9QKCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZkJvdW5kO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH1cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBQb2x5ZmlsbCBhcnJheS5pbmRleE9mIGZ1bmN0aW9uIGZvciBvbGRlciBicm93c2Vyc1xyXG4gICAgICAgICAqIFRoZSBpbmRleE9mKCkgZnVuY3Rpb24gd2FzIGFkZGVkIHRvIHRoZSBFQ01BLTI2MiBzdGFuZGFyZCBpbiB0aGUgNXRoIGVkaXRpb25cclxuICAgICAgICAgKiBhcyBzdWNoIGl0IG1heSBub3QgYmUgcHJlc2VudCBpbiBhbGwgYnJvd3NlcnMuXHJcbiAgICAgICAgICogQHNlZSBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9HbG9iYWxfT2JqZWN0cy9BcnJheS9pbmRleE9mXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgaWYgKCFBcnJheS5wcm90b3R5cGUuaW5kZXhPZikge1xyXG4gICAgICAgICAgICBBcnJheS5wcm90b3R5cGUuaW5kZXhPZiA9IGZ1bmN0aW9uIChzZWFyY2hFbGVtZW50LCBmcm9tSW5kZXgpIHtcclxuICAgICAgICAgICAgICAgIHZhciBrO1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMgPT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1widGhpc1wiIGlzIG51bGwgb3Igbm90IGRlZmluZWQnKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHZhciBvID0gT2JqZWN0KHRoaXMpO1xyXG4gICAgICAgICAgICAgICAgdmFyIGxlbiA9IG8ubGVuZ3RoID4+PiAwO1xyXG4gICAgICAgICAgICAgICAgaWYgKGxlbiA9PT0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAtMTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHZhciBuID0gK2Zyb21JbmRleCB8fCAwO1xyXG4gICAgICAgICAgICAgICAgaWYgKE1hdGguYWJzKG4pID09PSBJbmZpbml0eSkge1xyXG4gICAgICAgICAgICAgICAgICAgIG4gPSAwO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKG4gPj0gbGVuKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIC0xO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgayA9IE1hdGgubWF4KG4gPj0gMCA/IG4gOiBsZW4gLSBNYXRoLmFicyhuKSwgMCk7XHJcbiAgICAgICAgICAgICAgICB3aGlsZSAoayA8IGxlbikge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChrIGluIG8gJiYgb1trXSA9PT0gc2VhcmNoRWxlbWVudCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gaztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgaysrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIC0xO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH1cclxuICAgICAgICAvKiBsaXN0IG9mIHJlYWwgZXZlbnRzICovXHJcbiAgICAgICAgdmFyIGh0bWxFdmVudHMgPSB7XHJcbiAgICAgICAgICAgIC8qIDxib2R5PiBhbmQgPGZyYW1lc2V0PiBFdmVudHMgKi9cclxuICAgICAgICAgICAgb25sb2FkOiAxLFxyXG4gICAgICAgICAgICBvbnVubG9hZDogMSxcclxuICAgICAgICAgICAgLyogRm9ybSBFdmVudHMgKi9cclxuICAgICAgICAgICAgb25ibHVyOiAxLFxyXG4gICAgICAgICAgICBvbmNoYW5nZTogMSxcclxuICAgICAgICAgICAgb25mb2N1czogMSxcclxuICAgICAgICAgICAgb25yZXNldDogMSxcclxuICAgICAgICAgICAgb25zZWxlY3Q6IDEsXHJcbiAgICAgICAgICAgIG9uc3VibWl0OiAxLFxyXG4gICAgICAgICAgICAvKiBJbWFnZSBFdmVudHMgKi9cclxuICAgICAgICAgICAgb25hYm9ydDogMSxcclxuICAgICAgICAgICAgLyogS2V5Ym9hcmQgRXZlbnRzICovXHJcbiAgICAgICAgICAgIG9ua2V5ZG93bjogMSxcclxuICAgICAgICAgICAgb25rZXlwcmVzczogMSxcclxuICAgICAgICAgICAgb25rZXl1cDogMSxcclxuICAgICAgICAgICAgLyogTW91c2UgRXZlbnRzICovXHJcbiAgICAgICAgICAgIG9uY2xpY2s6IDEsXHJcbiAgICAgICAgICAgIG9uZGJsY2xpY2s6IDEsXHJcbiAgICAgICAgICAgIG9ubW91c2Vkb3duOiAxLFxyXG4gICAgICAgICAgICBvbm1vdXNlbW92ZTogMSxcclxuICAgICAgICAgICAgb25tb3VzZW91dDogMSxcclxuICAgICAgICAgICAgb25tb3VzZW92ZXI6IDEsXHJcbiAgICAgICAgICAgIG9ubW91c2V1cDogMVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgdmFyIG1hcEV2ZW50cyA9IHtcclxuICAgICAgICAgICAgb25zY3JvbGw6IHdpbmRvd1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogWndvb3NoIHByb3ZpZGVzIGEgc2V0IG9mIGZ1bmN0aW9ucyB0byBpbXBsZW1lbnQgc2Nyb2xsIGJ5IGRyYWcsIHpvb20gYnkgbW91c2V3aGVlbCxcclxuICAgICAgICAgKiBoYXNoIGxpbmtzIGluc2lkZSB0aGUgZG9jdW1lbnQgYW5kIG90aGVyIHNwZWNpYWwgc2Nyb2xsIHJlbGF0ZWQgcmVxdWlyZW1lbnRzLlxyXG4gICAgICAgICAqXHJcbiAgICAgICAgICogQGF1dGhvciBSb21hbiBHcnViZXIgPHAxMDIwMzg5QHlhaG9vLmNvbT5cclxuICAgICAgICAgKiBAdmVyc2lvbiAxLjAuMVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHZhciBad29vc2ggPSAoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBmdW5jdGlvbiBad29vc2goY29udGFpbmVyLCBvcHRpb25zKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNvbnRhaW5lciA9IGNvbnRhaW5lcjtcclxuICAgICAgICAgICAgICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XHJcbiAgICAgICAgICAgICAgICAvKiBDU1Mgc3R5bGUgY2xhc3NlcyAqL1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jbGFzc0lubmVyID0gJ3p3LWlubmVyJztcclxuICAgICAgICAgICAgICAgIHRoaXMuY2xhc3NPdXRlciA9ICd6dy1vdXRlcic7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNsYXNzR3JhYiA9ICd6dy1ncmFiJztcclxuICAgICAgICAgICAgICAgIHRoaXMuY2xhc3NOb0dyYWIgPSAnenctbm9ncmFiJztcclxuICAgICAgICAgICAgICAgIHRoaXMuY2xhc3NHcmFiYmluZyA9ICd6dy1ncmFiYmluZyc7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNsYXNzVW5pcXVlID0gJ3p3LScgKyBNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zdWJzdHJpbmcoNyk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNsYXNzU2NhbGUgPSAnenctc2NhbGUnO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jbGFzc0lnbm9yZSA9ICd6dy1pZ25vcmUnO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jbGFzc0Zha2VCb2R5ID0gJ3p3LWZha2Vib2R5JztcclxuICAgICAgICAgICAgICAgIC8qIGFycmF5IGhvbGRpbmcgdGhlIGN1c3RvbSBldmVudHMgbWFwcGluZyBjYWxsYmFja3MgdG8gYm91bmQgY2FsbGJhY2tzICovXHJcbiAgICAgICAgICAgICAgICB0aGlzLmN1c3RvbUV2ZW50cyA9IFtdO1xyXG4gICAgICAgICAgICAgICAgdGhpcy50cmlnZ2VyZWQgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29sbGlkZUxlZnQ6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgICAgIGNvbGxpZGVUb3A6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgICAgIGNvbGxpZGVSaWdodDogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgY29sbGlkZUJvdHRvbTogZmFsc2VcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAvKiBmYWRlT3V0ICovXHJcbiAgICAgICAgICAgICAgICB0aGlzLnRpbWVvdXRzID0gW107XHJcbiAgICAgICAgICAgICAgICB0aGlzLnZ4ID0gW107XHJcbiAgICAgICAgICAgICAgICB0aGlzLnZ5ID0gW107XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNvbnRhaW5lciA9IGNvbnRhaW5lcjtcclxuICAgICAgICAgICAgICAgIC8qIHNldCBkZWZhdWx0IG9wdGlvbnMgKi9cclxuICAgICAgICAgICAgICAgIHRoaXMub3B0aW9ucyA9IHtcclxuICAgICAgICAgICAgICAgICAgICAvKiAxIG1lYW5zIGRvIG5vdCBhbGlnbiB0byBhIGdyaWQgKi9cclxuICAgICAgICAgICAgICAgICAgICBncmlkWDogMSxcclxuICAgICAgICAgICAgICAgICAgICBncmlkWTogMSxcclxuICAgICAgICAgICAgICAgICAgICAvKiBzaG93cyBhIGdyaWQgYXMgYW4gb3ZlcmxheSBvdmVyIHRoZSBlbGVtZW50LiBXb3JrcyBvbmx5IGlmIHRoZSBicm93c2VyIHN1cHBvcnRzXHJcbiAgICAgICAgICAgICAgICAgICAgICogQ1NTIEdlbmVyYXRlZCBjb250ZW50IGZvciBwc2V1ZG8tZWxlbWVudHNcclxuICAgICAgICAgICAgICAgICAgICAgKiBAc2VlIGh0dHA6Ly9jYW5pdXNlLmNvbS8jc2VhcmNoPSUzQWJlZm9yZSAqL1xyXG4gICAgICAgICAgICAgICAgICAgIGdyaWRTaG93OiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICAvKiB3aGljaCBlZGdlIHNob3VsZCBiZSBlbGFzdGljICovXHJcbiAgICAgICAgICAgICAgICAgICAgZWxhc3RpY0VkZ2VzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxlZnQ6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICByaWdodDogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvcDogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJvdHRvbTogZmFsc2VcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIC8qIGFjdGl2YXRlcy9kZWFjdGl2YXRlcyBzY3JvbGxpbmcgYnkgZHJhZyAqL1xyXG4gICAgICAgICAgICAgICAgICAgIGRyYWdTY3JvbGw6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgZHJhZ09wdGlvbnM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZXhjbHVkZTogWydpbnB1dCcsICd0ZXh0YXJlYScsICdhJywgJ2J1dHRvbicsICcuJyArIHRoaXMuY2xhc3NJZ25vcmUsICdzZWxlY3QnXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgb25seTogW10sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIGFjdGl2YXRlcyBhIHNjcm9sbCBmYWRlIHdoZW4gc2Nyb2xsaW5nIGJ5IGRyYWcgKi9cclxuICAgICAgICAgICAgICAgICAgICAgICAgZmFkZTogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgLyogZmFkZTogYnJha2UgYWNjZWxlcmF0aW9uIGluIHBpeGVscyBwZXIgc2Vjb25kIHBlciBzZWNvbmQgKHAvc8KyKSAqL1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmFrZVNwZWVkOiAyNTAwLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBmYWRlOiBmcmFtZXMgcGVyIHNlY29uZCBvZiB0aGUgendvb3NoIGZhZGVvdXQgYW5pbWF0aW9uICg+PTI1IGxvb2tzIGxpa2UgbW90aW9uKSAqL1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBmcHM6IDMwLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBmYWRlOiB0aGlzIHNwZWVkIHdpbGwgbmV2ZXIgYmUgZXhjZWVkZWQgKi9cclxuICAgICAgICAgICAgICAgICAgICAgICAgbWF4U3BlZWQ6IDMwMDAsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIGZhZGU6IG1pbmltdW0gc3BlZWQgd2hpY2ggdHJpZ2dlcnMgdGhlIGZhZGUgKi9cclxuICAgICAgICAgICAgICAgICAgICAgICAgbWluU3BlZWQ6IDMwMFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgLyogYWN0aXZhdGVzL2RlYWN0aXZhdGVzIHNjcm9sbGluZyBieSB3aGVlbC4gSWYgdGhlIGRyZWljdGlvbiBpcyB2ZXJ0aWNhbCBhbmQgdGhlcmUgYXJlXHJcbiAgICAgICAgICAgICAgICAgICAgICogc2Nyb2xsYmFycyBwcmVzZW50LCB6d29vc2ggbGV0cyBsZWF2ZXMgc2Nyb2xsaW5nIHRvIHRoZSBicm93c2VyLiAqL1xyXG4gICAgICAgICAgICAgICAgICAgIHdoZWVsU2Nyb2xsOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgIHdoZWVsT3B0aW9uczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBkaXJlY3Rpb24gdG8gc2Nyb2xsIHdoZW4gdGhlIG1vdXNlIHdoZWVsIGlzIHVzZWQgKi9cclxuICAgICAgICAgICAgICAgICAgICAgICAgZGlyZWN0aW9uOiAndmVydGljYWwnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBhbW91bnQgb2YgcGl4ZWxzIGZvciBvbmUgc2Nyb2xsIHN0ZXAgKi9cclxuICAgICAgICAgICAgICAgICAgICAgICAgc3RlcDogMTE0LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBzY3JvbGwgc21vb3RoIG9yIGluc3RhbnQgKi9cclxuICAgICAgICAgICAgICAgICAgICAgICAgc21vb3RoOiB0cnVlXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAvKiBhY3RpdmF0ZXMvZGVhY3RpdmF0ZXMgem9vbWluZyBieSB3aGVlbC4gV29ya3Mgb25seSB3aXRoIGEgQ1NTMyAyRCBUcmFuc2Zvcm0gY2FwYWJsZSBicm93c2VyLlxyXG4gICAgICAgICAgICAgICAgICAgICAqIEBzZWUgaHR0cDovL2Nhbml1c2UuY29tLyNmZWF0PXRyYW5zZm9ybXMyZCAqL1xyXG4gICAgICAgICAgICAgICAgICAgIHdoZWVsWm9vbTogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgem9vbU9wdGlvbnM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLyogdGhlIG1heGltdW0gc2NhbGUsIDAgbWVhbnMgbm8gbWF4aW11bSAqL1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBtYXhTY2FsZTogMCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgLyogdGhlIG1pbmltdW0gc2NhbGUsIDAgbWVhbnMgbm8gbWluaW11bSAqL1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBtaW5TY2FsZTogMCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgLyogb25lIHN0ZXAgd2hlbiB1c2luZyB0aGUgd2hlZWwgdG8gem9vbSAqL1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGVwOiAwLjEsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIG1vdXNlIHdoZWVsIGRpcmVjdGlvbiB0byB6b29tIGxhcmdlciAqL1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkaXJlY3Rpb246ICd1cCdcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIC8qIGxldCB6d29vc2ggaGFuZGxlIGFuY2hvciBsaW5rcyB0YXJnZXRpbmcgdG8gYW4gYW5jaG9yIGluc2lkZSBvZiB0aGlzIHp3b29zaCBlbGVtZW50LlxyXG4gICAgICAgICAgICAgICAgICAgICAqIHRoZSBlbGVtZW50IG91dHNpZGUgKG1heWJlIHRoZSBib2R5KSBoYW5kbGVzIGFuY2hvcnMgdG9vLiBJZiB5b3Ugd2FudCB0byBwcmV2ZW50IHRoaXMsXHJcbiAgICAgICAgICAgICAgICAgICAgICogYWRkIHRvIGJvZHkgYXMgendvb3NoIGVsZW1lbnQgdG9vLiAqL1xyXG4gICAgICAgICAgICAgICAgICAgIGhhbmRsZUFuY2hvcnM6IHRydWVcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAvKiBtZXJnZSB0aGUgZGVmYXVsdCBvcHRpb24gb2JqZWN0cyB3aXRoIHRoZSBwcm92aWRlZCBvbmUgKi9cclxuICAgICAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiBvcHRpb25zKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMuaGFzT3duUHJvcGVydHkoa2V5KSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnNba2V5XSA9PT0gJ29iamVjdCcpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIG9rZXkgaW4gb3B0aW9uc1trZXldKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG9wdGlvbnNba2V5XS5oYXNPd25Qcm9wZXJ0eShva2V5KSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zW2tleV1bb2tleV0gPSBvcHRpb25zW2tleV1bb2tleV07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnNba2V5XSA9IG9wdGlvbnNba2V5XTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHRoaXMuaW5pdCgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgKiBJbml0aWFsaXplIERPTSBtYW5pcHVsYXRpb25zIGFuZCBldmVudCBoYW5kbGVyc1xyXG4gICAgICAgICAgICAgKlxyXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHt2b2lkfVxyXG4gICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgWndvb3NoLnByb3RvdHlwZS5pbml0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIF90aGlzID0gdGhpcztcclxuICAgICAgICAgICAgICAgIHRoaXMuaW5pdEJvZHkoKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuY29udGFpbmVyLmNsYXNzTmFtZSArPSBcIiBcIiArIHRoaXMuY2xhc3NPdXRlciArIFwiIFwiO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zY3JvbGxFbGVtZW50ID0gdGhpcy5jb250YWluZXI7XHJcbiAgICAgICAgICAgICAgICB2YXIgeCA9IHRoaXMuZ2V0U2Nyb2xsTGVmdCgpO1xyXG4gICAgICAgICAgICAgICAgdmFyIHkgPSB0aGlzLmdldFNjcm9sbFRvcCgpO1xyXG4gICAgICAgICAgICAgICAgLyogY3JlYXRlIGlubmVyIGRpdiBlbGVtZW50IGFuZCBhcHBlbmQgaXQgdG8gdGhlIGNvbnRhaW5lciB3aXRoIGl0cyBjb250ZW50cyBpbiBpdCAqL1xyXG4gICAgICAgICAgICAgICAgdGhpcy5pbm5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmlubmVyLmNsYXNzTmFtZSArPSBcIiBcIiArIHRoaXMuY2xhc3NJbm5lciArIFwiIFwiICsgdGhpcy5jbGFzc1VuaXF1ZSArIFwiIFwiO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zY2FsZUVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zY2FsZUVsZW1lbnQuY2xhc3NOYW1lICs9IFwiIFwiICsgdGhpcy5jbGFzc1NjYWxlICsgXCIgXCI7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNjYWxlRWxlbWVudC5hcHBlbmRDaGlsZCh0aGlzLmlubmVyKTtcclxuICAgICAgICAgICAgICAgIC8qIG1vdmUgYWxsIGNoaWxkTm9kZXMgdG8gdGhlIG5ldyBpbm5lciBlbGVtZW50ICovXHJcbiAgICAgICAgICAgICAgICB3aGlsZSAodGhpcy5jb250YWluZXIuY2hpbGROb2Rlcy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pbm5lci5hcHBlbmRDaGlsZCh0aGlzLmNvbnRhaW5lci5jaGlsZE5vZGVzWzBdKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHRoaXMuY29udGFpbmVyLmFwcGVuZENoaWxkKHRoaXMuc2NhbGVFbGVtZW50KTtcclxuICAgICAgICAgICAgICAgIHZhciBib3JkZXIgPSB0aGlzLmdldEJvcmRlcih0aGlzLmNvbnRhaW5lcik7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmlubmVyLnN0eWxlLm1pbldpZHRoID0gKHRoaXMuY29udGFpbmVyLnNjcm9sbFdpZHRoIC0gYm9yZGVyWzBdKSArICdweCc7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmlubmVyLnN0eWxlLm1pbkhlaWdodCA9ICh0aGlzLmNvbnRhaW5lci5zY3JvbGxIZWlnaHQgLSBib3JkZXJbMV0pICsgJ3B4JztcclxuICAgICAgICAgICAgICAgIHRoaXMuc2NhbGVFbGVtZW50LnN0eWxlLm1pbldpZHRoID0gdGhpcy5pbm5lci5zdHlsZS5taW5XaWR0aDtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2NhbGVFbGVtZW50LnN0eWxlLm1pbkhlaWdodCA9IHRoaXMuaW5uZXIuc3R5bGUubWluSGVpZ2h0O1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zY2FsZUVsZW1lbnQuc3R5bGUub3ZlcmZsb3cgPSAnaGlkZGVuJztcclxuICAgICAgICAgICAgICAgIHRoaXMuaW5pdEdyaWQoKTtcclxuICAgICAgICAgICAgICAgIHRoaXMub2xkQ2xpZW50V2lkdGggPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50V2lkdGg7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm9sZENsaWVudEhlaWdodCA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRIZWlnaHQ7XHJcbiAgICAgICAgICAgICAgICAvKiBqdXN0IGNhbGwgdGhlIGZ1bmN0aW9uLCB0byB0cmlnZ2VyIHBvc3NpYmxlIGV2ZW50cyAqL1xyXG4gICAgICAgICAgICAgICAgdGhpcy5vblNjcm9sbCgpO1xyXG4gICAgICAgICAgICAgICAgLyogc2Nyb2xsIHRvIHRoZSBpbml0aWFsIHBvc2l0aW9uICovXHJcbiAgICAgICAgICAgICAgICB0aGlzLnNjcm9sbFRvKHgsIHksIGZhbHNlKTtcclxuICAgICAgICAgICAgICAgIC8qIEV2ZW50IGhhbmRsZXIgcmVnaXN0cmF0aW9uIHN0YXJ0IGhlcmUgKi9cclxuICAgICAgICAgICAgICAgIHRoaXMuaW5pdFdoZWVsU2Nyb2xsKCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmluaXRXaGVlbFpvb20oKTtcclxuICAgICAgICAgICAgICAgIC8qIHNjcm9sbGhhbmRsZXIgKi9cclxuICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsSGFuZGxlciA9IGZ1bmN0aW9uIChlKSB7IHJldHVybiBfdGhpcy5vblNjcm9sbChlKTsgfTtcclxuICAgICAgICAgICAgICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcih0aGlzLmNvbnRhaW5lciwgJ3Njcm9sbCcsIHRoaXMuc2Nyb2xsSGFuZGxlcik7XHJcbiAgICAgICAgICAgICAgICAvKiBpZiB0aGUgc2Nyb2xsIGVsZW1lbnQgaXMgYm9keSwgYWRqdXN0IHRoZSBpbm5lciBkaXYgd2hlbiByZXNpemluZyAqL1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuaXNCb2R5KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yZXNpemVIYW5kbGVyID0gZnVuY3Rpb24gKGUpIHsgcmV0dXJuIF90aGlzLm9uUmVzaXplKGUpOyB9OyAvL1RPRE86IHNhbWUgYXMgYWJvdmUgaW4gdGhlIHdoZWVsIGhhbmRsZXJcclxuICAgICAgICAgICAgICAgICAgICB3aW5kb3cub25yZXNpemUgPSB0aGlzLnJlc2l6ZUhhbmRsZXI7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB0aGlzLmluaXREcmFnU2Nyb2xsKCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmluaXRBbmNob3JzKCk7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgKiBSZWluaXRpYWxpemUgdGhlIHp3b29zaCBlbGVtZW50XHJcbiAgICAgICAgICAgICAqXHJcbiAgICAgICAgICAgICAqIEByZXR1cm4ge1p3b29zaH0gLSBUaGUgWndvb3NoIG9iamVjdCBpbnN0YW5jZVxyXG4gICAgICAgICAgICAgKiBAVE9ETzogcHJlc2VydmUgc2Nyb2xsIHBvc2l0aW9uIGluIGluaXQoKVxyXG4gICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgWndvb3NoLnByb3RvdHlwZS5yZWluaXQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRlc3Ryb3koKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuY2xhc3NVbmlxdWUgPSAnenctJyArIE1hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpLnN1YnN0cmluZyg3KTtcclxuICAgICAgICAgICAgICAgIHRoaXMuaW5pdCgpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIFp3b29zaC5wcm90b3R5cGUuaW5pdEJvZHkgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmlzQm9keSA9IHRoaXMuY29udGFpbmVyLnRhZ05hbWUgPT09IFwiQk9EWVwiID8gdHJ1ZSA6IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgLyogQ2hyb21lIHNvbHV0aW9uIHRvIHNjcm9sbCB0aGUgYm9keSBpcyBub3QgcmVhbGx5IHZpYWJsZSwgc28gd2UgY3JlYXRlIGEgZmFrZSBib2R5XHJcbiAgICAgICAgICAgICAgICAgKiBkaXYgZWxlbWVudCB0byBzY3JvbGwgb24gKi9cclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmlzQm9keSA9PT0gdHJ1ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBwc2V1ZG9Cb2R5ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcclxuICAgICAgICAgICAgICAgICAgICBwc2V1ZG9Cb2R5LmNsYXNzTmFtZSArPSBcIiBcIiArIHRoaXMuY2xhc3NGYWtlQm9keSArIFwiIFwiO1xyXG4gICAgICAgICAgICAgICAgICAgIHBzZXVkb0JvZHkuc3R5bGUuY3NzVGV4dCA9IGRvY3VtZW50LmJvZHkuc3R5bGUuY3NzVGV4dDtcclxuICAgICAgICAgICAgICAgICAgICB3aGlsZSAodGhpcy5jb250YWluZXIuY2hpbGROb2Rlcy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBzZXVkb0JvZHkuYXBwZW5kQ2hpbGQodGhpcy5jb250YWluZXIuY2hpbGROb2Rlc1swXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY29udGFpbmVyLmFwcGVuZENoaWxkKHBzZXVkb0JvZHkpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY29udGFpbmVyID0gcHNldWRvQm9keTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgWndvb3NoLnByb3RvdHlwZS5pbml0R3JpZCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIC8qIHNob3cgdGhlIGdyaWQgb25seSBpZiBhdCBsZWFzdCBvbmUgb2YgdGhlIGdyaWQgdmFsdWVzIGlzIG5vdCAxICovXHJcbiAgICAgICAgICAgICAgICBpZiAoKHRoaXMub3B0aW9ucy5ncmlkWCAhPT0gMSB8fCB0aGlzLm9wdGlvbnMuZ3JpZFkgIT09IDEpICYmIHRoaXMub3B0aW9ucy5ncmlkU2hvdykge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBiZ2kgPSBbXTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMuZ3JpZFggIT09IDEgPyBiZ2kucHVzaCgnbGluZWFyLWdyYWRpZW50KHRvIHJpZ2h0LCBncmV5IDFweCwgdHJhbnNwYXJlbnQgMXB4KScpIDogbnVsbDtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMuZ3JpZFkgIT09IDEgPyBiZ2kucHVzaCgnbGluZWFyLWdyYWRpZW50KHRvIGJvdHRvbSwgZ3JleSAxcHgsIHRyYW5zcGFyZW50IDFweCknKSA6IG51bGw7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGRCZWZvcmVDU1ModGhpcy5jbGFzc1VuaXF1ZSwgJ3dpZHRoJywgdGhpcy5pbm5lci5zdHlsZS5taW5XaWR0aCk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGRCZWZvcmVDU1ModGhpcy5jbGFzc1VuaXF1ZSwgJ2hlaWdodCcsIHRoaXMuaW5uZXIuc3R5bGUubWluSGVpZ2h0KTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZEJlZm9yZUNTUyh0aGlzLmNsYXNzVW5pcXVlLCAnbGVmdCcsICctJyArIHRoaXMuZ2V0U3R5bGUodGhpcy5jb250YWluZXIsICdwYWRkaW5nTGVmdCcpKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZEJlZm9yZUNTUyh0aGlzLmNsYXNzVW5pcXVlLCAndG9wJywgJy0nICsgdGhpcy5nZXRTdHlsZSh0aGlzLmNvbnRhaW5lciwgJ3BhZGRpbmdUb3AnKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGRCZWZvcmVDU1ModGhpcy5jbGFzc1VuaXF1ZSwgJ2JhY2tncm91bmQtc2l6ZScsICh0aGlzLm9wdGlvbnMuZ3JpZFggIT09IDEgPyB0aGlzLm9wdGlvbnMuZ3JpZFggKyAncHggJyA6ICdhdXRvICcpICsgKHRoaXMub3B0aW9ucy5ncmlkWSAhPT0gMSA/IHRoaXMub3B0aW9ucy5ncmlkWSArICdweCcgOiAnYXV0bycpKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZEJlZm9yZUNTUyh0aGlzLmNsYXNzVW5pcXVlLCAnYmFja2dyb3VuZC1pbWFnZScsIGJnaS5qb2luKCcsICcpKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgWndvb3NoLnByb3RvdHlwZS5pbml0V2hlZWxTY3JvbGwgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xyXG4gICAgICAgICAgICAgICAgLyogVE9ETzogbm90IDIgZGlmZmVyZW50IGV2ZW50IGhhbmRsZXJzIHJlZ2lzdHJhdGlvbnMgLT4gZG8gaXQgaW4gdGhpcy5hZGRFdmVudExpc3RlbmVyKCkgKi9cclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMud2hlZWxTY3JvbGwgPT09IGZhbHNlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5tb3VzZVNjcm9sbEhhbmRsZXIgPSBmdW5jdGlvbiAoZSkgeyByZXR1cm4gX3RoaXMuZGlzYWJsZU1vdXNlU2Nyb2xsKGUpOyB9O1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsRWxlbWVudC5vbm1vdXNld2hlZWwgPSB0aGlzLm1vdXNlU2Nyb2xsSGFuZGxlcjtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIodGhpcy5zY3JvbGxFbGVtZW50LCAnd2hlZWwnLCB0aGlzLm1vdXNlU2Nyb2xsSGFuZGxlcik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIGlmICh0aGlzLm9wdGlvbnMud2hlZWxTY3JvbGwgPT09IHRydWUpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm1vdXNlU2Nyb2xsSGFuZGxlciA9IGZ1bmN0aW9uIChlKSB7IHJldHVybiBfdGhpcy5hY3RpdmVNb3VzZVNjcm9sbChlKTsgfTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnNjcm9sbEVsZW1lbnQub25tb3VzZXdoZWVsID0gdGhpcy5tb3VzZVNjcm9sbEhhbmRsZXI7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKHRoaXMuc2Nyb2xsRWxlbWVudCwgJ3doZWVsJywgdGhpcy5tb3VzZVNjcm9sbEhhbmRsZXIpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAvKiB3aGVlbHpvb20gKi9cclxuICAgICAgICAgICAgWndvb3NoLnByb3RvdHlwZS5pbml0V2hlZWxab29tID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIF90aGlzID0gdGhpcztcclxuICAgICAgICAgICAgICAgIHRoaXMub3B0aW9ucy5ncmlkU2hvdyA/IHRoaXMuc2NhbGVUbygxKSA6IG51bGw7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLndoZWVsWm9vbSA9PT0gdHJ1ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubW91c2Vab29tSGFuZGxlciA9IGZ1bmN0aW9uIChlKSB7IHJldHVybiBfdGhpcy5hY3RpdmVNb3VzZVpvb20oZSk7IH07XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKHRoaXMuc2Nyb2xsRWxlbWVudCwgJ3doZWVsJywgdGhpcy5tb3VzZVpvb21IYW5kbGVyKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgWndvb3NoLnByb3RvdHlwZS5pbml0RHJhZ1Njcm9sbCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XHJcbiAgICAgICAgICAgICAgICAvKiBpZiBkcmFnc2Nyb2xsIGlzIGFjdGl2YXRlZCwgcmVnaXN0ZXIgbW91c2Vkb3duIGV2ZW50ICovXHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLmRyYWdTY3JvbGwgPT09IHRydWUpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmlubmVyLmNsYXNzTmFtZSArPSBcIiBcIiArIHRoaXMuY2xhc3NHcmFiICsgXCIgXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5tb3VzZURvd25IYW5kbGVyID0gZnVuY3Rpb24gKGUpIHsgcmV0dXJuIF90aGlzLm1vdXNlRG93bihlKTsgfTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIodGhpcy5pbm5lciwgJ21vdXNlZG93bicsIHRoaXMubW91c2VEb3duSGFuZGxlcik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmNvbnRhaW5lci5jbGFzc05hbWUgKz0gXCIgXCIgKyB0aGlzLmNsYXNzTm9HcmFiICsgXCIgXCI7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIFp3b29zaC5wcm90b3R5cGUuaW5pdEFuY2hvcnMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5oYW5kbGVBbmNob3JzID09PSB0cnVlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGxpbmtzID0gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvckFsbChcImFbaHJlZl49JyMnXVwiKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmhhc2hDaGFuZ2VDbGlja0hhbmRsZXIgPSBmdW5jdGlvbiAoZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgdGFyZ2V0ID0gZSA/IGUudGFyZ2V0IDogd2luZG93LmV2ZW50LnNyY0VsZW1lbnQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdGFyZ2V0ICE9PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogcHVzaFN0YXRlIGNoYW5nZXMgdGhlIGhhc2ggd2l0aG91dCB0cmlnZ2VyaW5nIGhhc2hjaGFuZ2UgKi9cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhpc3RvcnkucHVzaFN0YXRlKHt9LCAnJywgdGFyZ2V0LmhyZWYpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogd2UgZG9uJ3Qgd2FudCB0byB0cmlnZ2VyIGhhc2hjaGFuZ2UsIHNvIHByZXZlbnQgZGVmYXVsdCBiZWhhdmlvciB3aGVuIGNsaWNraW5nIG9uIGFuY2hvciBsaW5rcyAqL1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCA/IGUucHJldmVudERlZmF1bHQoKSA6IChlLnJldHVyblZhbHVlID0gZmFsc2UpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIHRyaWdnZXIgYSBjdXN0b20gaGFzaGNoYW5nZSBldmVudCwgYmVjYXVzZSBwdXNoU3RhdGUgcHJldmVudHMgdGhlIHJlYWwgaGFzaGNoYW5nZSBldmVudCAqL1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy50cmlnZ2VyRXZlbnQod2luZG93LCAnbXloYXNoY2hhbmdlJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICAgICAvKiBsb29wIHRyb3VnaCBhbGwgYW5jaG9yIGxpbmtzIGluIHRoZSBlbGVtZW50IGFuZCBkaXNhYmxlIHRoZW0gdG8gcHJldmVudCB0aGVcclxuICAgICAgICAgICAgICAgICAgICAgKiBicm93c2VyIGZyb20gc2Nyb2xsaW5nIGJlY2F1c2Ugb2YgdGhlIGNoYW5naW5nIGhhc2ggdmFsdWUuIEluc3RlYWQgdGhlIG93blxyXG4gICAgICAgICAgICAgICAgICAgICAqIGV2ZW50IG15aGFzaGNoYW5nZSBzaG91bGQgaGFuZGxlIHBhZ2UgYW5kIGVsZW1lbnQgc2Nyb2xsaW5nICovXHJcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsaW5rcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIobGlua3NbaV0sICdjbGljaycsIHRoaXMuaGFzaENoYW5nZUNsaWNrSGFuZGxlciwgZmFsc2UpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmhhc2hDaGFuZ2VIYW5kbGVyID0gZnVuY3Rpb24gKGUpIHsgcmV0dXJuIF90aGlzLm9uSGFzaENoYW5nZShlKTsgfTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIod2luZG93LCAnbXloYXNoY2hhbmdlJywgdGhpcy5oYXNoQ2hhbmdlSGFuZGxlcik7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKHdpbmRvdywgJ2hhc2hjaGFuZ2UnLCB0aGlzLmhhc2hDaGFuZ2VIYW5kbGVyKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm9uSGFzaENoYW5nZSgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAvKiBAVE9ETzogU2Nyb2xsV2lkdGggYW5kIENsaWVudFdpZHRoIFNjcm9sbEhlaWdodCBDbGllbnRIZWlnaHQgKi9cclxuICAgICAgICAgICAgWndvb3NoLnByb3RvdHlwZS5nZXRTY3JvbGxMZWZ0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuc2Nyb2xsRWxlbWVudC5zY3JvbGxMZWZ0O1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLnNldFNjcm9sbExlZnQgPSBmdW5jdGlvbiAobGVmdCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zY3JvbGxFbGVtZW50LnNjcm9sbExlZnQgPSBsZWZ0O1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLmdldFNjcm9sbFRvcCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnNjcm9sbEVsZW1lbnQuc2Nyb2xsVG9wO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLnNldFNjcm9sbFRvcCA9IGZ1bmN0aW9uICh0b3ApIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsRWxlbWVudC5zY3JvbGxUb3AgPSB0b3A7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgKiBIYW5kbGUgaGFzaGNoYW5nZXMgd2l0aCBvd24gc2Nyb2xsIGZ1bmN0aW9uXHJcbiAgICAgICAgICAgICAqXHJcbiAgICAgICAgICAgICAqIEBwYXJhbSB7RXZlbnR9IGUgLSB0aGUgaGFzaGNoYW5nZSBvciBteWhhc2hjaGFuZ2UgZXZlbnQsIG9yIG5vdGhpbmdcclxuICAgICAgICAgICAgICogQHJldHVybiB7dm9pZH1cclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIFp3b29zaC5wcm90b3R5cGUub25IYXNoQ2hhbmdlID0gZnVuY3Rpb24gKGUpIHtcclxuICAgICAgICAgICAgICAgIGlmIChlID09PSB2b2lkIDApIHsgZSA9IG51bGw7IH1cclxuICAgICAgICAgICAgICAgIHZhciBoYXNoID0gd2luZG93LmxvY2F0aW9uLmhhc2guc3Vic3RyKDEpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGhhc2ggIT09ICcnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGFuY2hvcnMgPSB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yQWxsKCcjJyArIGhhc2gpO1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYW5jaG9ycy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgZWxlbWVudCA9IGFuY2hvcnNbaV07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjb250YWluZXIgPSBhbmNob3JzW2ldO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBmaW5kIHRoZSBuZXh0IHBhcmVudCB3aGljaCBpcyBhIGNvbnRhaW5lciBlbGVtZW50XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBvdXRlclJlID0gbmV3IFJlZ0V4cChcIiBcIiArIHRoaXMuY2xhc3NPdXRlciArIFwiIFwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG5leHRDb250YWluZXIgPSBlbGVtZW50O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB3aGlsZSAoY29udGFpbmVyICYmIGNvbnRhaW5lci5wYXJlbnRFbGVtZW50ICYmIHRoaXMuY29udGFpbmVyICE9PSBjb250YWluZXIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjb250YWluZXIuY2xhc3NOYW1lLm1hdGNoKG91dGVyUmUpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV4dENvbnRhaW5lciA9IGNvbnRhaW5lcjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRhaW5lciA9IGNvbnRhaW5lci5wYXJlbnRFbGVtZW50O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlICE9PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZS50eXBlID09PSAnaGFzaGNoYW5nZScpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBzY3JvbGxpbmcgaW5zdGFudGx5IGJhY2sgdG8gb3JpZ2luLCBiZWZvcmUgZG8gdGhlIGFuaW1hdGVkIHNjcm9sbCAqL1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsVG8odGhpcy5vcmlnaW5TY3JvbGxMZWZ0LCB0aGlzLm9yaWdpblNjcm9sbFRvcCwgZmFsc2UpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsVG9FbGVtZW50KG5leHRDb250YWluZXIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAvKipcclxuICAgICAgICAgICAgICogU2Nyb2xsIHRvIGFuIGVsZW1lbnQgaW4gdGhlIERPTVxyXG4gICAgICAgICAgICAgKlxyXG4gICAgICAgICAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbGVtZW50IC0gdGhlIEhUTUxFbGVtZW50IHRvIHNjcm9sbCB0b1xyXG4gICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgWndvb3NoLnByb3RvdHlwZS5zY3JvbGxUb0VsZW1lbnQgPSBmdW5jdGlvbiAoZWxlbWVudCkge1xyXG4gICAgICAgICAgICAgICAgLyogZ2V0IHJlbGF0aXZlIGNvb3JkcyBmcm9tIHRoZSBhbmNob3IgZWxlbWVudCAqL1xyXG4gICAgICAgICAgICAgICAgdmFyIHggPSAoZWxlbWVudC5vZmZzZXRMZWZ0IC0gdGhpcy5jb250YWluZXIub2Zmc2V0TGVmdCkgKiB0aGlzLmdldFNjYWxlKCk7XHJcbiAgICAgICAgICAgICAgICB2YXIgeSA9IChlbGVtZW50Lm9mZnNldFRvcCAtIHRoaXMuY29udGFpbmVyLm9mZnNldFRvcCkgKiB0aGlzLmdldFNjYWxlKCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNjcm9sbFRvKHgsIHkpO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAvKipcclxuICAgICAgICAgICAgICogV29ya2Fyb3VuZCB0byBtYW5pcHVsYXRlIDo6YmVmb3JlIENTUyBzdHlsZXMgd2l0aCBqYXZhc2NyaXB0XHJcbiAgICAgICAgICAgICAqXHJcbiAgICAgICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBjc3NDbGFzcyAtIHRoZSBDU1MgY2xhc3MgbmFtZSB0byBhZGQgOjpiZWZvcmUgcHJvcGVydGllc1xyXG4gICAgICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gY3NzUHJvcGVydHkgLSB0aGUgQ1NTIHByb3BlcnR5IHRvIHNldFxyXG4gICAgICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gY3NzVmFsdWUgLSB0aGUgQ1NTIHZhbHVlIHRvIHNldFxyXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHt2b2lkfVxyXG4gICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgWndvb3NoLnByb3RvdHlwZS5hZGRCZWZvcmVDU1MgPSBmdW5jdGlvbiAoY3NzQ2xhc3MsIGNzc1Byb3BlcnR5LCBjc3NWYWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBkb2N1bWVudC5zdHlsZVNoZWV0c1swXS5pbnNlcnRSdWxlID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQuc3R5bGVTaGVldHNbMF0uaW5zZXJ0UnVsZSgnLicgKyBjc3NDbGFzcyArICc6OmJlZm9yZSB7ICcgKyBjc3NQcm9wZXJ0eSArICc6ICcgKyBjc3NWYWx1ZSArICd9JywgMCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIGlmICh0eXBlb2YgZG9jdW1lbnQuc3R5bGVTaGVldHNbMF0uYWRkUnVsZSA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgICAgICAgICAgICAgIGRvY3VtZW50LnN0eWxlU2hlZXRzWzBdLmFkZFJ1bGUoJy4nICsgY3NzQ2xhc3MgKyAnOjpiZWZvcmUnLCBjc3NQcm9wZXJ0eSArICc6ICcgKyBjc3NWYWx1ZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgKiBHZXQgY29tcHV0ZSBwaXhlbCBudW1iZXIgb2YgdGhlIHdob2xlIHdpZHRoIGFuZCBoZWlnaHQgZnJvbSBhIGJvcmRlciBvZiBhbiBlbGVtZW50XHJcbiAgICAgICAgICAgICAqXHJcbiAgICAgICAgICAgICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsIC0gdGhlIEhUTUwgZWxlbWVudFxyXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHthcnJheX0gLSB0aGUgYW1vdW50IG9mIHBpeGVscyBbd2lkdGgsIGhlaWdodF1cclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIFp3b29zaC5wcm90b3R5cGUuZ2V0Qm9yZGVyID0gZnVuY3Rpb24gKGVsKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgYmwgPSB0aGlzLmdldFN0eWxlKGVsLCAnYm9yZGVyTGVmdFdpZHRoJyk7XHJcbiAgICAgICAgICAgICAgICBibCA9IGJsID09PSAndGhpbicgPyAxIDogYmwgPT09ICdtZWRpdW0nID8gMyA6IGJsID09PSAndGhpY2snID8gNSA6IHBhcnNlSW50KGJsLCAxMCkgIT09IE5hTiA/IHBhcnNlSW50KGJsLCAxMCkgOiAwO1xyXG4gICAgICAgICAgICAgICAgdmFyIGJyID0gdGhpcy5nZXRTdHlsZShlbCwgJ2JvcmRlclJpZ2h0V2lkdGgnKTtcclxuICAgICAgICAgICAgICAgIGJyID0gYnIgPT09ICd0aGluJyA/IDEgOiBiciA9PT0gJ21lZGl1bScgPyAzIDogYnIgPT09ICd0aGljaycgPyA1IDogcGFyc2VJbnQoYnIsIDEwKSAhPT0gTmFOID8gcGFyc2VJbnQoYnIsIDEwKSA6IDA7XHJcbiAgICAgICAgICAgICAgICB2YXIgcGwgPSB0aGlzLmdldFN0eWxlKGVsLCAncGFkZGluZ0xlZnQnKTtcclxuICAgICAgICAgICAgICAgIHBsID0gcGwgPT09ICdhdXRvJyA/IDAgOiBwYXJzZUludChwbCwgMTApICE9PSBOYU4gPyBwYXJzZUludChwbCwgMTApIDogMDtcclxuICAgICAgICAgICAgICAgIHZhciBwciA9IHRoaXMuZ2V0U3R5bGUoZWwsICdwYWRkaW5nUmlnaHQnKTtcclxuICAgICAgICAgICAgICAgIHByID0gcHIgPT09ICdhdXRvJyA/IDAgOiBwYXJzZUludChwciwgMTApICE9PSBOYU4gPyBwYXJzZUludChwciwgMTApIDogMDtcclxuICAgICAgICAgICAgICAgIHZhciBtbCA9IHRoaXMuZ2V0U3R5bGUoZWwsICdtYXJnaW5MZWZ0Jyk7XHJcbiAgICAgICAgICAgICAgICBtbCA9IG1sID09PSAnYXV0bycgPyAwIDogcGFyc2VJbnQobWwsIDEwKSAhPT0gTmFOID8gcGFyc2VJbnQobWwsIDEwKSA6IDA7XHJcbiAgICAgICAgICAgICAgICB2YXIgbXIgPSB0aGlzLmdldFN0eWxlKGVsLCAnbWFyZ2luUmlnaHQnKTtcclxuICAgICAgICAgICAgICAgIG1yID0gbXIgPT09ICdhdXRvJyA/IDAgOiBwYXJzZUludChtciwgMTApICE9PSBOYU4gPyBwYXJzZUludChtciwgMTApIDogMDtcclxuICAgICAgICAgICAgICAgIHZhciBidCA9IHRoaXMuZ2V0U3R5bGUoZWwsICdib3JkZXJUb3BXaWR0aCcpO1xyXG4gICAgICAgICAgICAgICAgYnQgPSBidCA9PT0gJ3RoaW4nID8gMSA6IGJ0ID09PSAnbWVkaXVtJyA/IDMgOiBidCA9PT0gJ3RoaWNrJyA/IDUgOiBwYXJzZUludChidCwgMTApICE9PSBOYU4gPyBwYXJzZUludChidCwgMTApIDogMDtcclxuICAgICAgICAgICAgICAgIHZhciBiYiA9IHRoaXMuZ2V0U3R5bGUoZWwsICdib3JkZXJCb3R0b21XaWR0aCcpO1xyXG4gICAgICAgICAgICAgICAgYmIgPSBiYiA9PT0gJ3RoaW4nID8gMSA6IGJiID09PSAnbWVkaXVtJyA/IDMgOiBiYiA9PT0gJ3RoaWNrJyA/IDUgOiBwYXJzZUludChiYiwgMTApICE9PSBOYU4gPyBwYXJzZUludChiYiwgMTApIDogMDtcclxuICAgICAgICAgICAgICAgIHZhciBwdCA9IHRoaXMuZ2V0U3R5bGUoZWwsICdwYWRkaW5nVG9wJyk7XHJcbiAgICAgICAgICAgICAgICBwdCA9IHB0ID09PSAnYXV0bycgPyAwIDogcGFyc2VJbnQocHQsIDEwKSAhPT0gTmFOID8gcGFyc2VJbnQocHQsIDEwKSA6IDA7XHJcbiAgICAgICAgICAgICAgICB2YXIgcGIgPSB0aGlzLmdldFN0eWxlKGVsLCAncGFkZGluZ0JvdHRvbScpO1xyXG4gICAgICAgICAgICAgICAgcGIgPSBwYiA9PT0gJ2F1dG8nID8gMCA6IHBhcnNlSW50KHBiLCAxMCkgIT09IE5hTiA/IHBhcnNlSW50KHBiLCAxMCkgOiAwO1xyXG4gICAgICAgICAgICAgICAgdmFyIG10ID0gdGhpcy5nZXRTdHlsZShlbCwgJ21hcmdpblRvcCcpO1xyXG4gICAgICAgICAgICAgICAgbXQgPSBtdCA9PT0gJ2F1dG8nID8gMCA6IHBhcnNlSW50KG10LCAxMCkgIT09IE5hTiA/IHBhcnNlSW50KG10LCAxMCkgOiAwO1xyXG4gICAgICAgICAgICAgICAgdmFyIG1iID0gdGhpcy5nZXRTdHlsZShlbCwgJ21hcmdpbkJvdHRvbScpO1xyXG4gICAgICAgICAgICAgICAgbWIgPSBtYiA9PT0gJ2F1dG8nID8gMCA6IHBhcnNlSW50KG1iLCAxMCkgIT09IE5hTiA/IHBhcnNlSW50KG1iLCAxMCkgOiAwO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFtcclxuICAgICAgICAgICAgICAgICAgICAocGwgKyBwciArIGJsICsgYnIgKyBtbCArIG1yKSxcclxuICAgICAgICAgICAgICAgICAgICAocHQgKyBwYiArIGJ0ICsgYmIgKyBtdCArIG1iKVxyXG4gICAgICAgICAgICAgICAgXTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgICAqIERpc2FibGVzIHRoZSBzY3JvbGwgd2hlZWwgb2YgdGhlIG1vdXNlXHJcbiAgICAgICAgICAgICAqXHJcbiAgICAgICAgICAgICAqIEBwYXJhbSB7TW91c2VXaGVlbEV2ZW50fSBlIC0gdGhlIG1vdXNlIHdoZWVsIGV2ZW50XHJcbiAgICAgICAgICAgICAqIEByZXR1cm4ge3ZvaWR9XHJcbiAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLmRpc2FibGVNb3VzZVNjcm9sbCA9IGZ1bmN0aW9uIChlKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5lbGVtZW50QmVoaW5kQ3Vyc29ySXNNZShlLmNsaWVudFgsIGUuY2xpZW50WSkpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmNsZWFyVGltZW91dHMoKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIWUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZSA9IHdpbmRvdy5ldmVudDtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCA/IGUucHJldmVudERlZmF1bHQoKSA6IChlLnJldHVyblZhbHVlID0gZmFsc2UpO1xyXG4gICAgICAgICAgICAgICAgICAgIGUucmV0dXJuVmFsdWUgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgICAqIERldGVybWluZSB3aGV0aGVyIGFuIGVsZW1lbnQgaGFzIGEgc2Nyb2xsYmFyIG9yIG5vdFxyXG4gICAgICAgICAgICAgKlxyXG4gICAgICAgICAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbGVtZW50IC0gdGhlIEhUTUxFbGVtZW50XHJcbiAgICAgICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBkaXJlY3Rpb24gLSBkZXRlcm1pbmUgdGhlIHZlcnRpY2FsIG9yIGhvcml6b250YWwgc2Nyb2xsYmFyP1xyXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHtib29sZWFufSAtIHdoZXRoZXIgdGhlIGVsZW1lbnQgaGFzIHNjcm9sbGJhcnMgb3Igbm90XHJcbiAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLmhhc1Njcm9sbGJhciA9IGZ1bmN0aW9uIChlbGVtZW50LCBkaXJlY3Rpb24pIHtcclxuICAgICAgICAgICAgICAgIHZhciBoYXMgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIHZhciBvdmVyZmxvdyA9ICdvdmVyZmxvdyc7XHJcbiAgICAgICAgICAgICAgICBpZiAoZGlyZWN0aW9uID09PSAndmVydGljYWwnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgb3ZlcmZsb3cgPSAnb3ZlcmZsb3dZJztcclxuICAgICAgICAgICAgICAgICAgICBoYXMgPSBlbGVtZW50LnNjcm9sbEhlaWdodCA+IGVsZW1lbnQuY2xpZW50SGVpZ2h0O1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoZGlyZWN0aW9uID09PSAnaG9yaXpvbnRhbCcpIHtcclxuICAgICAgICAgICAgICAgICAgICBvdmVyZmxvdyA9ICdvdmVyZmxvd1gnO1xyXG4gICAgICAgICAgICAgICAgICAgIGhhcyA9IGVsZW1lbnQuc2Nyb2xsV2lkdGggPiBlbGVtZW50LmNsaWVudFdpZHRoO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgLy8gQ2hlY2sgdGhlIG92ZXJmbG93IGFuZCBvdmVyZmxvd0RpcmVjdGlvbiBwcm9wZXJ0aWVzIGZvciBcImF1dG9cIiBhbmQgXCJ2aXNpYmxlXCIgdmFsdWVzXHJcbiAgICAgICAgICAgICAgICBoYXMgPSB0aGlzLmdldFN0eWxlKHRoaXMuY29udGFpbmVyLCAnb3ZlcmZsb3cnKSA9PT0gXCJ2aXNpYmxlXCJcclxuICAgICAgICAgICAgICAgICAgICB8fCB0aGlzLmdldFN0eWxlKHRoaXMuY29udGFpbmVyLCAnb3ZlcmZsb3dZJykgPT09IFwidmlzaWJsZVwiXHJcbiAgICAgICAgICAgICAgICAgICAgfHwgKGhhcyAmJiB0aGlzLmdldFN0eWxlKHRoaXMuY29udGFpbmVyLCAnb3ZlcmZsb3cnKSA9PT0gXCJhdXRvXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgfHwgKGhhcyAmJiB0aGlzLmdldFN0eWxlKHRoaXMuY29udGFpbmVyLCAnb3ZlcmZsb3dZJykgPT09IFwiYXV0b1wiKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBoYXM7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgKiBFbmFibGVzIHRoZSBzY3JvbGwgd2hlZWwgb2YgdGhlIG1vdXNlIHRvIHNjcm9sbCwgc3BlY2lhbGx5IGZvciBkaXZzIHdpdGhvdXIgc2Nyb2xsYmFyXHJcbiAgICAgICAgICAgICAqXHJcbiAgICAgICAgICAgICAqIEBwYXJhbSB7TW91c2VXaGVlbEV2ZW50fSBlIC0gdGhlIG1vdXNlIHdoZWVsIGV2ZW50XHJcbiAgICAgICAgICAgICAqIEByZXR1cm4ge3ZvaWR9XHJcbiAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLmFjdGl2ZU1vdXNlU2Nyb2xsID0gZnVuY3Rpb24gKGUpIHtcclxuICAgICAgICAgICAgICAgIGlmICghZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGUgPSB3aW5kb3cuZXZlbnQ7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5lbGVtZW50QmVoaW5kQ3Vyc29ySXNNZShlLmNsaWVudFgsIGUuY2xpZW50WSkpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgZGlyZWN0aW9uO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChcImRlbHRhWVwiIGluIGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGlyZWN0aW9uID0gZS5kZWx0YVkgPiAwID8gJ2Rvd24nIDogJ3VwJztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoXCJ3aGVlbERlbHRhXCIgaW4gZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkaXJlY3Rpb24gPSBlLndoZWVsRGVsdGEgPiAwID8gJ3VwJyA6ICdkb3duJztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgLyogdXNlIHRoZSBub3JtYWwgc2Nyb2xsLCB3aGVuIHRoZXJlIGFyZSBzY3JvbGxiYXJzIGFuZCB0aGUgZGlyZWN0aW9uIGlzIFwidmVydGljYWxcIiAqL1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMud2hlZWxPcHRpb25zLmRpcmVjdGlvbiA9PT0gJ3ZlcnRpY2FsJyAmJiB0aGlzLmhhc1Njcm9sbGJhcih0aGlzLnNjcm9sbEVsZW1lbnQsIHRoaXMub3B0aW9ucy53aGVlbE9wdGlvbnMuZGlyZWN0aW9uKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoISgodGhpcy50cmlnZ2VyZWQuY29sbGlkZUJvdHRvbSAmJiBkaXJlY3Rpb24gPT09ICdkb3duJykgfHwgKHRoaXMudHJpZ2dlcmVkLmNvbGxpZGVUb3AgJiYgZGlyZWN0aW9uID09PSAndXAnKSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY2xlYXJUaW1lb3V0cygpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZGlzYWJsZU1vdXNlU2Nyb2xsKGUpO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciB4ID0gdGhpcy5nZXRTY3JvbGxMZWZ0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHkgPSB0aGlzLmdldFNjcm9sbFRvcCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMud2hlZWxPcHRpb25zLmRpcmVjdGlvbiA9PT0gJ2hvcml6b250YWwnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHggPSB0aGlzLmdldFNjcm9sbExlZnQoKSArIChkaXJlY3Rpb24gPT09ICdkb3duJyA/IHRoaXMub3B0aW9ucy53aGVlbE9wdGlvbnMuc3RlcCA6IHRoaXMub3B0aW9ucy53aGVlbE9wdGlvbnMuc3RlcCAqIC0xKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAodGhpcy5vcHRpb25zLndoZWVsT3B0aW9ucy5kaXJlY3Rpb24gPT09ICd2ZXJ0aWNhbCcpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgeSA9IHRoaXMuZ2V0U2Nyb2xsVG9wKCkgKyAoZGlyZWN0aW9uID09PSAnZG93bicgPyB0aGlzLm9wdGlvbnMud2hlZWxPcHRpb25zLnN0ZXAgOiB0aGlzLm9wdGlvbnMud2hlZWxPcHRpb25zLnN0ZXAgKiAtMSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsVG8oeCwgeSwgZmFsc2UpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAvKipcclxuICAgICAgICAgICAgICogRW5hYmxlcyB0aGUgc2Nyb2xsIHdoZWVsIG9mIHRoZSBtb3VzZSB0byB6b29tXHJcbiAgICAgICAgICAgICAqXHJcbiAgICAgICAgICAgICAqIEBwYXJhbSB7TW91c2VXaGVlbEV2ZW50fSBlIC0gdGhlIG1vdXNlIHdoZWVsIGV2ZW50XHJcbiAgICAgICAgICAgICAqIEByZXR1cm4ge3ZvaWR9XHJcbiAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLmFjdGl2ZU1vdXNlWm9vbSA9IGZ1bmN0aW9uIChlKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWUpIHtcclxuICAgICAgICAgICAgICAgICAgICBlID0gd2luZG93LmV2ZW50O1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuZWxlbWVudEJlaGluZEN1cnNvcklzTWUoZS5jbGllbnRYLCBlLmNsaWVudFkpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRpcmVjdGlvbjtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoXCJkZWx0YVlcIiBpbiBlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpcmVjdGlvbiA9IGUuZGVsdGFZID4gMCA/ICdkb3duJyA6ICd1cCc7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKFwid2hlZWxEZWx0YVwiIGluIGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGlyZWN0aW9uID0gZS53aGVlbERlbHRhID4gMCA/ICd1cCcgOiAnZG93bic7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChkaXJlY3Rpb24gPT09IHRoaXMub3B0aW9ucy56b29tT3B0aW9ucy5kaXJlY3Rpb24pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHNjYWxlID0gdGhpcy5nZXRTY2FsZSgpICogKDEgKyB0aGlzLm9wdGlvbnMuem9vbU9wdGlvbnMuc3RlcCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgc2NhbGUgPSB0aGlzLmdldFNjYWxlKCkgLyAoMSArIHRoaXMub3B0aW9ucy56b29tT3B0aW9ucy5zdGVwKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zY2FsZVRvKHNjYWxlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgICAqIENhbGN1bGF0ZXMgdGhlIHNpemUgb2YgdGhlIHZlcnRpY2FsIHNjcm9sbGJhci5cclxuICAgICAgICAgICAgICpcclxuICAgICAgICAgICAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWwgLSBUaGUgSFRNTEVsZW1lbW50XHJcbiAgICAgICAgICAgICAqIEByZXR1cm4ge251bWJlcn0gLSB0aGUgYW1vdW50IG9mIHBpeGVscyB1c2VkIGJ5IHRoZSB2ZXJ0aWNhbCBzY3JvbGxiYXJcclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIFp3b29zaC5wcm90b3R5cGUuc2Nyb2xsYmFyV2lkdGggPSBmdW5jdGlvbiAoZWwpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBlbC5vZmZzZXRXaWR0aCAtIGVsLmNsaWVudFdpZHRoIC0gcGFyc2VJbnQodGhpcy5nZXRTdHlsZShlbCwgJ2JvcmRlckxlZnRXaWR0aCcpKSAtIHBhcnNlSW50KHRoaXMuZ2V0U3R5bGUoZWwsICdib3JkZXJSaWdodFdpZHRoJykpO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAvKipcclxuICAgICAgICAgICAgICogQ2FsY3VsYXRlcyB0aGUgc2l6ZSBvZiB0aGUgaG9yaXpvbnRhbCBzY3JvbGxiYXIuXHJcbiAgICAgICAgICAgICAqXHJcbiAgICAgICAgICAgICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsIC0gVGhlIEhUTUxFbGVtZW1udFxyXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHtudW1iZXJ9IC0gdGhlIGFtb3VudCBvZiBwaXhlbHMgdXNlZCBieSB0aGUgaG9yaXpvbnRhbCBzY3JvbGxiYXJcclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIFp3b29zaC5wcm90b3R5cGUuc2Nyb2xsYmFySGVpZ2h0ID0gZnVuY3Rpb24gKGVsKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZWwub2Zmc2V0SGVpZ2h0IC0gZWwuY2xpZW50SGVpZ2h0IC0gcGFyc2VJbnQodGhpcy5nZXRTdHlsZShlbCwgJ2JvcmRlclRvcFdpZHRoJykpIC0gcGFyc2VJbnQodGhpcy5nZXRTdHlsZShlbCwgJ2JvcmRlckJvdHRvbVdpZHRoJykpO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAvKipcclxuICAgICAgICAgICAgICogUmV0cmlldmVzIHRoZSBjdXJyZW50IHNjYWxlIHZhbHVlIG9yIDEgaWYgaXQgaXMgbm90IHNldC5cclxuICAgICAgICAgICAgICpcclxuICAgICAgICAgICAgICogQHJldHVybiB7bnVtYmVyfSAtIHRoZSBjdXJyZW50IHNjYWxlIHZhbHVlXHJcbiAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLmdldFNjYWxlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB0aGlzLmlubmVyLnN0eWxlLnRyYW5zZm9ybSAhPT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgciA9IHRoaXMuaW5uZXIuc3R5bGUudHJhbnNmb3JtLm1hdGNoKC9zY2FsZVxcKChbMC05LFxcLl0rKVxcKS8pIHx8IFtcIlwiXTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcGFyc2VGbG9hdChyWzFdKSB8fCAxO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIDE7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgKiBTY2FsZXMgdGhlIGlubmVyIGVsZW1lbnQgYnkgYSByZWxhdGljZSB2YWx1ZSBiYXNlZCBvbiB0aGUgY3VycmVudCBzY2FsZSB2YWx1ZS5cclxuICAgICAgICAgICAgICpcclxuICAgICAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IHBlcmNlbnQgLSBwZXJjZW50YWdlIG9mIHRoZSBjdXJyZW50IHNjYWxlIHZhbHVlXHJcbiAgICAgICAgICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gaG9ub3VyTGltaXRzIC0gd2hldGhlciB0byBob25vdXIgbWF4U2NhbGUgYW5kIHRoZSBtaW5pbXVtIHdpZHRoIGFuZCBoZWlnaHRcclxuICAgICAgICAgICAgICogb2YgdGhlIGNvbnRhaW5lciBlbGVtZW50LlxyXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHt2b2lkfVxyXG4gICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgWndvb3NoLnByb3RvdHlwZS5zY2FsZUJ5ID0gZnVuY3Rpb24gKHBlcmNlbnQsIGhvbm91ckxpbWl0cykge1xyXG4gICAgICAgICAgICAgICAgaWYgKGhvbm91ckxpbWl0cyA9PT0gdm9pZCAwKSB7IGhvbm91ckxpbWl0cyA9IHRydWU7IH1cclxuICAgICAgICAgICAgICAgIHZhciBzY2FsZSA9IHRoaXMuZ2V0U2NhbGUoKSAqIChwZXJjZW50IC8gMTAwKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2NhbGVUbyhzY2FsZSwgaG9ub3VyTGltaXRzKTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgICAqIFNjYWxlcyB0aGUgaW5uZXIgZWxlbWVudCB0byBhbiBhYnNvbHV0ZSB2YWx1ZS5cclxuICAgICAgICAgICAgICpcclxuICAgICAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IHNjYWxlIC0gdGhlIHNjYWxlXHJcbiAgICAgICAgICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gaG9ub3VyTGltaXRzIC0gd2hldGhlciB0byBob25vdXIgbWF4U2NhbGUgYW5kIHRoZSBtaW5pbXVtIHdpZHRoIGFuZCBoZWlnaHRcclxuICAgICAgICAgICAgICogb2YgdGhlIGNvbnRhaW5lciBlbGVtZW50LlxyXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHt2b2lkfVxyXG4gICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgWndvb3NoLnByb3RvdHlwZS5zY2FsZVRvID0gZnVuY3Rpb24gKHNjYWxlLCBob25vdXJMaW1pdHMpIHtcclxuICAgICAgICAgICAgICAgIGlmIChob25vdXJMaW1pdHMgPT09IHZvaWQgMCkgeyBob25vdXJMaW1pdHMgPSB0cnVlOyB9XHJcbiAgICAgICAgICAgICAgICB2YXIgd2lkdGggPSAocGFyc2VGbG9hdCh0aGlzLmlubmVyLnN0eWxlLm1pbldpZHRoKSAqIHNjYWxlKTtcclxuICAgICAgICAgICAgICAgIHZhciBoZWlnaHQgPSAocGFyc2VGbG9hdCh0aGlzLmlubmVyLnN0eWxlLm1pbkhlaWdodCkgKiBzY2FsZSk7XHJcbiAgICAgICAgICAgICAgICAvKiBTY3JvbGxiYXJzIGhhdmUgd2lkdGggYW5kIGhlaWdodCB0b28gKi9cclxuICAgICAgICAgICAgICAgIHZhciBtaW5XaWR0aCA9IHRoaXMuY29udGFpbmVyLmNsaWVudFdpZHRoICsgdGhpcy5zY3JvbGxiYXJXaWR0aCh0aGlzLmNvbnRhaW5lcik7XHJcbiAgICAgICAgICAgICAgICB2YXIgbWluSGVpZ2h0ID0gdGhpcy5jb250YWluZXIuY2xpZW50SGVpZ2h0ICsgdGhpcy5zY3JvbGxiYXJIZWlnaHQodGhpcy5jb250YWluZXIpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGhvbm91ckxpbWl0cykge1xyXG4gICAgICAgICAgICAgICAgICAgIC8qIGxvb3AgYXMgbG9uZyBhcyBhbGwgbGltaXRzIGFyZSBob25vdXJlZCAqL1xyXG4gICAgICAgICAgICAgICAgICAgIHdoaWxlICgoc2NhbGUgPiB0aGlzLm9wdGlvbnMuem9vbU9wdGlvbnMubWF4U2NhbGUgJiYgdGhpcy5vcHRpb25zLnpvb21PcHRpb25zLm1heFNjYWxlICE9PSAwKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB8fCAoc2NhbGUgPCB0aGlzLm9wdGlvbnMuem9vbU9wdGlvbnMubWluU2NhbGUgJiYgdGhpcy5vcHRpb25zLnpvb21PcHRpb25zLm1pblNjYWxlICE9PSAwKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB8fCAod2lkdGggPCB0aGlzLmNvbnRhaW5lci5jbGllbnRXaWR0aCAmJiAhdGhpcy5pc0JvZHkpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHx8IGhlaWdodCA8IHRoaXMuY29udGFpbmVyLmNsaWVudEhlaWdodCAmJiAhdGhpcy5pc0JvZHkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNjYWxlID4gdGhpcy5vcHRpb25zLnpvb21PcHRpb25zLm1heFNjYWxlICYmIHRoaXMub3B0aW9ucy56b29tT3B0aW9ucy5tYXhTY2FsZSAhPT0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2NhbGUgPSB0aGlzLm9wdGlvbnMuem9vbU9wdGlvbnMubWF4U2NhbGU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWR0aCA9IE1hdGguZmxvb3IocGFyc2VJbnQodGhpcy5pbm5lci5zdHlsZS5taW5XaWR0aCkgKiBzY2FsZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQgPSBNYXRoLmZsb29yKHBhcnNlSW50KHRoaXMuaW5uZXIuc3R5bGUubWluSGVpZ2h0KSAqIHNjYWxlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2NhbGUgPCB0aGlzLm9wdGlvbnMuem9vbU9wdGlvbnMubWluU2NhbGUgJiYgdGhpcy5vcHRpb25zLnpvb21PcHRpb25zLm1pblNjYWxlICE9PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY2FsZSA9IHRoaXMub3B0aW9ucy56b29tT3B0aW9ucy5taW5TY2FsZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoID0gTWF0aC5mbG9vcihwYXJzZUludCh0aGlzLmlubmVyLnN0eWxlLm1pbldpZHRoKSAqIHNjYWxlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodCA9IE1hdGguZmxvb3IocGFyc2VJbnQodGhpcy5pbm5lci5zdHlsZS5taW5IZWlnaHQpICogc2NhbGUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh3aWR0aCA8IG1pbldpZHRoICYmICF0aGlzLmlzQm9keSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2NhbGUgPSBzY2FsZSAvIHdpZHRoICogbWluV2lkdGg7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQgPSBNYXRoLmZsb29yKHBhcnNlSW50KHRoaXMuaW5uZXIuc3R5bGUubWluSGVpZ2h0KSAqIHNjYWxlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoID0gbWluV2lkdGg7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGhlaWdodCA8IG1pbkhlaWdodCAmJiAhdGhpcy5pc0JvZHkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjYWxlID0gc2NhbGUgLyBoZWlnaHQgKiBtaW5IZWlnaHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWR0aCA9IE1hdGguZmxvb3IocGFyc2VJbnQodGhpcy5pbm5lci5zdHlsZS5taW5XaWR0aCkgKiBzY2FsZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQgPSBtaW5IZWlnaHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nKFwic2NhbGVUbygpOiBcIiwgc2NhbGUsIFwiIC0tLS0+IFwiLCB3aWR0aCwgXCIgeCBcIiwgaGVpZ2h0LCBcIiBvcmlnOiBcIiwgdGhpcy5jb250YWluZXIuY2xpZW50V2lkdGgsIFwiIHggXCIsIHRoaXMuY29udGFpbmVyLmNsaWVudEhlaWdodCwgXCIgcmVhbDogXCIsIG1pbldpZHRoLCBcIiB4IFwiLCBtaW5IZWlnaHQpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5pbm5lci5zdHlsZS50cmFuc2Zvcm0gPSAndHJhbnNsYXRlKDBweCwgMHB4KSBzY2FsZSgnICsgc2NhbGUgKyAnKSc7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNjYWxlRWxlbWVudC5zdHlsZS5taW5XaWR0aCA9IHRoaXMuc2NhbGVFbGVtZW50LnN0eWxlLndpZHRoID0gd2lkdGggKyAncHgnO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zY2FsZUVsZW1lbnQuc3R5bGUubWluSGVpZ2h0ID0gdGhpcy5zY2FsZUVsZW1lbnQuc3R5bGUuaGVpZ2h0ID0gaGVpZ2h0ICsgJ3B4JztcclxuICAgICAgICAgICAgICAgIC8qIFRPRE86IGhlcmUgc2Nyb2xsVG8gYmFzZWQgb24gd2hlcmUgdGhlIG1vdXNlIGN1cnNvciBpcyAqL1xyXG4gICAgICAgICAgICAgICAgLy90aGlzLnNjcm9sbFRvKCk7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgKiBEaXNhYmxlcyB0aGUgc2Nyb2xsIHdoZWVsIG9mIHRoZSBtb3VzZVxyXG4gICAgICAgICAgICAgKlxyXG4gICAgICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0geCAtIHRoZSB4LWNvb3JkaW5hdGVzXHJcbiAgICAgICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSB5IC0gdGhlIHktY29vcmRpbmF0ZXNcclxuICAgICAgICAgICAgICogQHJldHVybiB7Ym9vbGVhbn0gLSB3aGV0aGVyIHRoZSBuZWFyZXN0IHJlbGF0ZWQgcGFyZW50IGlubmVyIGVsZW1lbnQgaXMgdGhlIG9uZSBvZiB0aGlzIG9iamVjdCBpbnN0YW5jZVxyXG4gICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgWndvb3NoLnByb3RvdHlwZS5lbGVtZW50QmVoaW5kQ3Vyc29ySXNNZSA9IGZ1bmN0aW9uICh4LCB5KSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZWxlbWVudEJlaGluZEN1cnNvciA9IGRvY3VtZW50LmVsZW1lbnRGcm9tUG9pbnQoeCwgeSk7XHJcbiAgICAgICAgICAgICAgICAvKipcclxuICAgICAgICAgICAgICAgICAqIElmIHRoZSBlbGVtZW50IGRpcmVjdGx5IGJlaGluZCB0aGUgY3Vyc29yIGlzIGFuIG91dGVyIGVsZW1lbnQgdGhyb3cgb3V0LCBiZWNhdXNlIHdoZW4gY2xpY2tpbmcgb24gYSBzY3JvbGxiYXJcclxuICAgICAgICAgICAgICAgICAqIGZyb20gYSBkaXYsIGEgZHJhZyBvZiB0aGUgcGFyZW50IFp3b29zaCBlbGVtZW50IGlzIGluaXRpYXRlZC5cclxuICAgICAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICAgICAgdmFyIG91dGVyUmUgPSBuZXcgUmVnRXhwKFwiIFwiICsgdGhpcy5jbGFzc091dGVyICsgXCIgXCIpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGVsZW1lbnRCZWhpbmRDdXJzb3IuY2xhc3NOYW1lLm1hdGNoKG91dGVyUmUpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgLyogZmluZCB0aGUgbmV4dCBwYXJlbnQgd2hpY2ggaXMgYW4gaW5uZXIgZWxlbWVudCAqL1xyXG4gICAgICAgICAgICAgICAgdmFyIGlubmVyUmUgPSBuZXcgUmVnRXhwKFwiIFwiICsgdGhpcy5jbGFzc0lubmVyICsgXCIgXCIpO1xyXG4gICAgICAgICAgICAgICAgd2hpbGUgKGVsZW1lbnRCZWhpbmRDdXJzb3IgJiYgIWVsZW1lbnRCZWhpbmRDdXJzb3IuY2xhc3NOYW1lLm1hdGNoKGlubmVyUmUpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZWxlbWVudEJlaGluZEN1cnNvciA9IGVsZW1lbnRCZWhpbmRDdXJzb3IucGFyZW50RWxlbWVudDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmlubmVyID09PSBlbGVtZW50QmVoaW5kQ3Vyc29yO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLmdldFRpbWVzdGFtcCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2Ygd2luZG93LnBlcmZvcm1hbmNlID09PSAnb2JqZWN0Jykge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChcIm5vd1wiIGluIHdpbmRvdy5wZXJmb3JtYW5jZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gd2luZG93LnBlcmZvcm1hbmNlLm5vdygpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChcIndlYmtpdE5vd1wiIGluIHdpbmRvdy5wZXJmb3JtYW5jZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gd2luZG93LnBlcmZvcm1hbmNlLndlYmtpdE5vdygpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgICAqIFNjcm9sbCBoYW5kbGVyIHRvIHRyaWdnZXIgdGhlIGN1c3RvbSBldmVudHNcclxuICAgICAgICAgICAgICpcclxuICAgICAgICAgICAgICogQHBhcmFtIHtFdmVudH0gZSAtIFRoZSBzY3JvbGwgZXZlbnQgb2JqZWN0IChUT0RPOiBuZWVkZWQ/KVxyXG4gICAgICAgICAgICAgKiBAdGhyb3dzIEV2ZW50IGNvbGxpZGVMZWZ0XHJcbiAgICAgICAgICAgICAqIEB0aHJvd3MgRXZlbnQgY29sbGlkZVJpZ2h0XHJcbiAgICAgICAgICAgICAqIEB0aHJvd3MgRXZlbnQgY29sbGlkZVRvcFxyXG4gICAgICAgICAgICAgKiBAdGhyb3dzIEV2ZW50IGNvbGxpZGVCb3R0b21cclxuICAgICAgICAgICAgICogQHJldHVybiB7dm9pZH1cclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIFp3b29zaC5wcm90b3R5cGUub25TY3JvbGwgPSBmdW5jdGlvbiAoZSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHggPSB0aGlzLmdldFNjcm9sbExlZnQoKTtcclxuICAgICAgICAgICAgICAgIHZhciB5ID0gdGhpcy5nZXRTY3JvbGxUb3AoKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsTWF4TGVmdCA9ICh0aGlzLnNjcm9sbEVsZW1lbnQuc2Nyb2xsV2lkdGggLSB0aGlzLnNjcm9sbEVsZW1lbnQuY2xpZW50V2lkdGgpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zY3JvbGxNYXhUb3AgPSAodGhpcy5zY3JvbGxFbGVtZW50LnNjcm9sbEhlaWdodCAtIHRoaXMuc2Nyb2xsRWxlbWVudC5jbGllbnRIZWlnaHQpO1xyXG4gICAgICAgICAgICAgICAgLy8gdGhlIGNvbGxpZGVMZWZ0IGV2ZW50XHJcbiAgICAgICAgICAgICAgICBpZiAoeCA9PT0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudHJpZ2dlcmVkLmNvbGxpZGVMZWZ0ID8gbnVsbCA6IHRoaXMudHJpZ2dlckV2ZW50KHRoaXMuaW5uZXIsICdjb2xsaWRlLmxlZnQnKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnRyaWdnZXJlZC5jb2xsaWRlTGVmdCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnRyaWdnZXJlZC5jb2xsaWRlTGVmdCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgLy8gdGhlIGNvbGxpZGVUb3AgZXZlbnRcclxuICAgICAgICAgICAgICAgIGlmICh5ID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50cmlnZ2VyZWQuY29sbGlkZVRvcCA/IG51bGwgOiB0aGlzLnRyaWdnZXJFdmVudCh0aGlzLmlubmVyLCAnY29sbGlkZS50b3AnKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnRyaWdnZXJlZC5jb2xsaWRlVG9wID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudHJpZ2dlcmVkLmNvbGxpZGVUb3AgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIC8vIHRoZSBjb2xsaWRlUmlnaHQgZXZlbnRcclxuICAgICAgICAgICAgICAgIGlmICh4ID09PSB0aGlzLnNjcm9sbE1heExlZnQpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnRyaWdnZXJlZC5jb2xsaWRlUmlnaHQgPyBudWxsIDogdGhpcy50cmlnZ2VyRXZlbnQodGhpcy5pbm5lciwgJ2NvbGxpZGUucmlnaHQnKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnRyaWdnZXJlZC5jb2xsaWRlUmlnaHQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50cmlnZ2VyZWQuY29sbGlkZVJpZ2h0ID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAvLyB0aGUgY29sbGlkZUJvdHRvbSBldmVudFxyXG4gICAgICAgICAgICAgICAgaWYgKHkgPT09IHRoaXMuc2Nyb2xsTWF4VG9wKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50cmlnZ2VyZWQuY29sbGlkZUJvdHRvbSA/IG51bGwgOiB0aGlzLnRyaWdnZXJFdmVudCh0aGlzLmlubmVyLCAnY29sbGlkZS5ib3R0b20nKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnRyaWdnZXJlZC5jb2xsaWRlQm90dG9tID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudHJpZ2dlcmVkLmNvbGxpZGVCb3R0b20gPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgICAqIHdpbmRvdyByZXNpemUgaGFuZGxlciB0byByZWNhbGN1bGF0ZSB0aGUgaW5uZXIgZGl2IG1pbldpZHRoIGFuZCBtaW5IZWlnaHRcclxuICAgICAgICAgICAgICpcclxuICAgICAgICAgICAgICogQHBhcmFtIHtFdmVudH0gZSAtIFRoZSB3aW5kb3cgcmVzaXplIGV2ZW50IG9iamVjdCAoVE9ETzogbmVlZGVkPylcclxuICAgICAgICAgICAgICogQHJldHVybiB7dm9pZH1cclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIFp3b29zaC5wcm90b3R5cGUub25SZXNpemUgPSBmdW5jdGlvbiAoZSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIF90aGlzID0gdGhpcztcclxuICAgICAgICAgICAgICAgIHZhciBvblJlc2l6ZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICBfdGhpcy5pbm5lci5zdHlsZS5taW5XaWR0aCA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMuaW5uZXIuc3R5bGUubWluSGVpZ2h0ID0gbnVsbDtcclxuICAgICAgICAgICAgICAgICAgICAvKiB0YWtlIGF3YXkgdGhlIG1hcmdpbiB2YWx1ZXMgb2YgdGhlIGJvZHkgZWxlbWVudCAqL1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciB4RGVsdGEgPSBwYXJzZUludChfdGhpcy5nZXRTdHlsZShkb2N1bWVudC5ib2R5LCAnbWFyZ2luTGVmdCcpLCAxMCkgKyBwYXJzZUludChfdGhpcy5nZXRTdHlsZShkb2N1bWVudC5ib2R5LCAnbWFyZ2luUmlnaHQnKSwgMTApO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciB5RGVsdGEgPSBwYXJzZUludChfdGhpcy5nZXRTdHlsZShkb2N1bWVudC5ib2R5LCAnbWFyZ2luVG9wJyksIDEwKSArIHBhcnNlSW50KF90aGlzLmdldFN0eWxlKGRvY3VtZW50LmJvZHksICdtYXJnaW5Cb3R0b20nKSwgMTApO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vVE9ETzogd2l0aCB0aGlzLmdldEJvcmRlcigpXHJcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMuaW5uZXIuc3R5bGUubWluV2lkdGggPSAoZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnNjcm9sbFdpZHRoIC0geERlbHRhKSArICdweCc7XHJcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMuaW5uZXIuc3R5bGUubWluSGVpZ2h0ID0gKGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zY3JvbGxIZWlnaHQgLSB5RGVsdGEgLSAxMDApICsgJ3B4JzsgLy9UT0RPOiBXVEY/IHdoeSAtMTAwIGZvciBJRTg/XHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgICAgICAgKiBUcmlnZ2VyIHRoZSBmdW5jdGlvbiBvbmx5IHdoZW4gdGhlIGNsaWVudFdpZHRoIG9yIGNsaWVudEhlaWdodCByZWFsbHkgaGF2ZSBjaGFuZ2VkLlxyXG4gICAgICAgICAgICAgICAgICogSUU4IHJlc2lkZXMgaW4gYW4gaW5maW5pdHkgbG9vcCBhbHdheXMgdHJpZ2dlcmluZyB0aGUgcmVzaXRlIGV2ZW50IHdoZW4gYWx0ZXJpbmcgY3NzLlxyXG4gICAgICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5vbGRDbGllbnRXaWR0aCAhPT0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudFdpZHRoIHx8IHRoaXMub2xkQ2xpZW50SGVpZ2h0ICE9PSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50SGVpZ2h0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgd2luZG93LmNsZWFyVGltZW91dCh0aGlzLnJlc2l6ZVRpbWVvdXQpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVzaXplVGltZW91dCA9IHdpbmRvdy5zZXRUaW1lb3V0KG9uUmVzaXplLCAxMCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAvKiB3cml0ZSBkb3duIHRoZSBvbGQgY2xpZW50V2lkdGggYW5kIGNsaWVudEhlaWdodCBmb3IgdGhlIGFib3ZlIGNvbXBhcnNpb24gKi9cclxuICAgICAgICAgICAgICAgIHRoaXMub2xkQ2xpZW50V2lkdGggPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50V2lkdGg7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm9sZENsaWVudEhlaWdodCA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRIZWlnaHQ7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIFp3b29zaC5wcm90b3R5cGUuY2xlYXJUZXh0U2VsZWN0aW9uID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHdpbmRvdy5nZXRTZWxlY3Rpb24pXHJcbiAgICAgICAgICAgICAgICAgICAgd2luZG93LmdldFNlbGVjdGlvbigpLnJlbW92ZUFsbFJhbmdlcygpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGRvY3VtZW50LnNlbGVjdGlvbilcclxuICAgICAgICAgICAgICAgICAgICBkb2N1bWVudC5zZWxlY3Rpb24uZW1wdHkoKTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgICAqIEJyb3dzZXIgaW5kZXBlbmRlbnQgZXZlbnQgcmVnaXN0cmF0aW9uXHJcbiAgICAgICAgICAgICAqXHJcbiAgICAgICAgICAgICAqIEBwYXJhbSB7YW55fSBvYmogLSBUaGUgSFRNTEVsZW1lbnQgdG8gYXR0YWNoIHRoZSBldmVudCB0b1xyXG4gICAgICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnQgLSBUaGUgZXZlbnQgbmFtZSB3aXRob3V0IHRoZSBsZWFkaW5nIFwib25cIlxyXG4gICAgICAgICAgICAgKiBAcGFyYW0geyhlOiBFdmVudCkgPT4gdm9pZH0gY2FsbGJhY2sgLSBBIGNhbGxiYWNrIGZ1bmN0aW9uIHRvIGF0dGFjaCB0byB0aGUgZXZlbnRcclxuICAgICAgICAgICAgICogQHBhcmFtIHtib29sZWFufSBib3VuZCAtIHdoZXRoZXIgdG8gYmluZCB0aGUgY2FsbGJhY2sgdG8gdGhlIG9iamVjdCBpbnN0YW5jZSBvciBub3RcclxuICAgICAgICAgICAgICogQHJldHVybiB7dm9pZH1cclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIFp3b29zaC5wcm90b3R5cGUuYWRkRXZlbnRMaXN0ZW5lciA9IGZ1bmN0aW9uIChvYmosIGV2ZW50LCBjYWxsYmFjaywgYm91bmQpIHtcclxuICAgICAgICAgICAgICAgIGlmIChib3VuZCA9PT0gdm9pZCAwKSB7IGJvdW5kID0gdHJ1ZTsgfVxyXG4gICAgICAgICAgICAgICAgdmFyIGJvdW5kQ2FsbGJhY2sgPSBib3VuZCA/IGNhbGxiYWNrLmJpbmQodGhpcykgOiBjYWxsYmFjaztcclxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2Ygb2JqLmFkZEV2ZW50TGlzdGVuZXIgPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAobWFwRXZlbnRzWydvbicgKyBldmVudF0gJiYgb2JqLnRhZ05hbWUgPT09IFwiQk9EWVwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG9iaiA9IG1hcEV2ZW50c1snb24nICsgZXZlbnRdO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBvYmouYWRkRXZlbnRMaXN0ZW5lcihldmVudCwgYm91bmRDYWxsYmFjayk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIGlmICh0eXBlb2Ygb2JqLmF0dGFjaEV2ZW50ID09PSAnb2JqZWN0JyAmJiBodG1sRXZlbnRzWydvbicgKyBldmVudF0pIHtcclxuICAgICAgICAgICAgICAgICAgICBvYmouYXR0YWNoRXZlbnQoJ29uJyArIGV2ZW50LCBib3VuZENhbGxiYWNrKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHR5cGVvZiBvYmouYXR0YWNoRXZlbnQgPT09ICdvYmplY3QnICYmIG1hcEV2ZW50c1snb24nICsgZXZlbnRdKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9iai50YWdOYW1lID09PSBcIkJPRFlcIikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcCA9ICdvbicgKyBldmVudDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLyogZXhhbXBsZTogd2luZG93Lm9uc2Nyb2xsID0gYm91bmRDYWxsYmFjayAqL1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBtYXBFdmVudHNbcF1bcF0gPSBib3VuZENhbGxiYWNrO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLyogVE9ETzogb2JqLm9uc2Nyb2xsID8/ICovXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG9iai5vbnNjcm9sbCA9IGJvdW5kQ2FsbGJhY2s7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSBpZiAodHlwZW9mIG9iai5hdHRhY2hFdmVudCA9PT0gJ29iamVjdCcpIHtcclxuICAgICAgICAgICAgICAgICAgICBvYmpbZXZlbnRdID0gMTtcclxuICAgICAgICAgICAgICAgICAgICBib3VuZENhbGxiYWNrID0gZnVuY3Rpb24gKGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLyogVE9ETzogZSBpcyB0aGUgb25wcm9wZXJ0eWNoYW5nZSBldmVudCBub3Qgb25lIG9mIHRoZSBjdXN0b20gZXZlbnQgb2JqZWN0cyAqL1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZS5wcm9wZXJ0eU5hbWUgPT09IGV2ZW50KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAgICAgb2JqLmF0dGFjaEV2ZW50KCdvbnByb3BlcnR5Y2hhbmdlJywgYm91bmRDYWxsYmFjayk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBvYmpbJ29uJyArIGV2ZW50XSA9IGJvdW5kQ2FsbGJhY2s7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB0aGlzLmN1c3RvbUV2ZW50c1tldmVudF0gPyBudWxsIDogKHRoaXMuY3VzdG9tRXZlbnRzW2V2ZW50XSA9IFtdKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuY3VzdG9tRXZlbnRzW2V2ZW50XS5wdXNoKFtjYWxsYmFjaywgYm91bmRDYWxsYmFja10pO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAvKipcclxuICAgICAgICAgICAgICogQnJvd3NlciBpbmRlcGVuZGVudCBldmVudCBkZXJlZ2lzdHJhdGlvblxyXG4gICAgICAgICAgICAgKlxyXG4gICAgICAgICAgICAgKiBAcGFyYW0ge2FueX0gb2JqIC0gVGhlIEhUTUxFbGVtZW50IG9yIHdpbmRvdyB3aG9zZSBldmVudCBzaG91bGQgYmUgZGV0YWNoZWRcclxuICAgICAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50IC0gVGhlIGV2ZW50IG5hbWUgd2l0aG91dCB0aGUgbGVhZGluZyBcIm9uXCJcclxuICAgICAgICAgICAgICogQHBhcmFtIHsoZTogRXZlbnQpID0+IHZvaWR9IGNhbGxiYWNrIC0gVGhlIGNhbGxiYWNrIGZ1bmN0aW9uIHdoZW4gYXR0YWNoZWRcclxuICAgICAgICAgICAgICogQHJldHVybiB7dm9pZH1cclxuICAgICAgICAgICAgICpcclxuICAgICAgICAgICAgICogQFRPRE86IHVucmVnaXN0ZXJpbmcgb2YgbWFwRXZlbnRzXHJcbiAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLnJlbW92ZUV2ZW50TGlzdGVuZXIgPSBmdW5jdGlvbiAob2JqLCBldmVudCwgY2FsbGJhY2spIHtcclxuICAgICAgICAgICAgICAgIGlmIChldmVudCBpbiB0aGlzLmN1c3RvbUV2ZW50cykge1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgaW4gdGhpcy5jdXN0b21FdmVudHNbZXZlbnRdKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIGlmIHRoZSBldmVudCB3YXMgZm91bmQgaW4gdGhlIGFycmF5IGJ5IGl0cyBjYWxsYmFjayByZWZlcmVuY2UgKi9cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuY3VzdG9tRXZlbnRzW2V2ZW50XVtpXVswXSA9PT0gY2FsbGJhY2spIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIHJlbW92ZSB0aGUgbGlzdGVuZXIgZnJvbSB0aGUgYXJyYXkgYnkgaXRzIGJvdW5kIGNhbGxiYWNrIHJlZmVyZW5jZSAqL1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2sgPSB0aGlzLmN1c3RvbUV2ZW50c1tldmVudF1baV1bMV07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmN1c3RvbUV2ZW50c1tldmVudF0uc3BsaWNlKGksIDEpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIG9iai5yZW1vdmVFdmVudExpc3RlbmVyID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgb2JqLnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnQsIGNhbGxiYWNrKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHR5cGVvZiBvYmouZGV0YWNoRXZlbnQgPT09ICdvYmplY3QnICYmIGh0bWxFdmVudHNbJ29uJyArIGV2ZW50XSkge1xyXG4gICAgICAgICAgICAgICAgICAgIG9iai5kZXRhY2hFdmVudCgnb24nICsgZXZlbnQsIGNhbGxiYWNrKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHR5cGVvZiBvYmouZGV0YWNoRXZlbnQgPT09ICdvYmplY3QnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgb2JqLmRldGFjaEV2ZW50KCdvbnByb3BlcnR5Y2hhbmdlJywgY2FsbGJhY2spO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgb2JqWydvbicgKyBldmVudF0gPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAvKipcclxuICAgICAgICAgICAgICogQnJvd3NlciBpbmRlcGVuZGVudCBldmVudCB0cmlnZ2VyIGZ1bmN0aW9uXHJcbiAgICAgICAgICAgICAqXHJcbiAgICAgICAgICAgICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IG9iaiAtIFRoZSBIVE1MRWxlbWVudCB3aGljaCB0cmlnZ2VycyB0aGUgZXZlbnRcclxuICAgICAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50TmFtZSAtIFRoZSBldmVudCBuYW1lIHdpdGhvdXQgdGhlIGxlYWRpbmcgXCJvblwiXHJcbiAgICAgICAgICAgICAqIEByZXR1cm4ge3ZvaWR9XHJcbiAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLnRyaWdnZXJFdmVudCA9IGZ1bmN0aW9uIChvYmosIGV2ZW50TmFtZSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGV2ZW50O1xyXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB3aW5kb3cuQ3VzdG9tRXZlbnQgPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICAgICAgICAgICAgICBldmVudCA9IG5ldyBDdXN0b21FdmVudChldmVudE5hbWUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSBpZiAodHlwZW9mIGRvY3VtZW50LmNyZWF0ZUV2ZW50ID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudChcIkhUTUxFdmVudHNcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQuaW5pdEV2ZW50KGV2ZW50TmFtZSwgdHJ1ZSwgdHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIGlmIChkb2N1bWVudC5jcmVhdGVFdmVudE9iamVjdCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50ID0gZG9jdW1lbnQuY3JlYXRlRXZlbnRPYmplY3QoKTtcclxuICAgICAgICAgICAgICAgICAgICBldmVudC5ldmVudFR5cGUgPSBldmVudE5hbWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBldmVudC5ldmVudE5hbWUgPSBldmVudE5hbWU7XHJcbiAgICAgICAgICAgICAgICBpZiAob2JqLmRpc3BhdGNoRXZlbnQpIHtcclxuICAgICAgICAgICAgICAgICAgICBvYmouZGlzcGF0Y2hFdmVudChldmVudCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIGlmIChvYmpbZXZlbnROYW1lXSkge1xyXG4gICAgICAgICAgICAgICAgICAgIG9ialtldmVudE5hbWVdKys7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIGlmIChvYmouZmlyZUV2ZW50ICYmIGh0bWxFdmVudHNbJ29uJyArIGV2ZW50TmFtZV0pIHtcclxuICAgICAgICAgICAgICAgICAgICBvYmouZmlyZUV2ZW50KCdvbicgKyBldmVudC5ldmVudFR5cGUsIGV2ZW50KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKG9ialtldmVudE5hbWVdKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgb2JqW2V2ZW50TmFtZV0oKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKG9ialsnb24nICsgZXZlbnROYW1lXSkge1xyXG4gICAgICAgICAgICAgICAgICAgIG9ialsnb24nICsgZXZlbnROYW1lXSgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAvKipcclxuICAgICAgICAgICAgICogR2V0IGEgY3NzIHN0eWxlIHByb3BlcnR5IHZhbHVlIGJyb3dzZXIgaW5kZXBlbmRlbnRcclxuICAgICAgICAgICAgICpcclxuICAgICAgICAgICAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWwgLSBUaGUgSFRNTEVsZW1lbnQgdG8gbG9va3VwXHJcbiAgICAgICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBqc1Byb3BlcnR5IC0gVGhlIGNzcyBwcm9wZXJ0eSBuYW1lIGluIGphdmFzY3JpcHQgaW4gY2FtZWxDYXNlIChlLmcuIFwibWFyZ2luTGVmdFwiLCBub3QgXCJtYXJnaW4tbGVmdFwiKVxyXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHtzdHJpbmd9IC0gdGhlIHByb3BlcnR5IHZhbHVlXHJcbiAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLmdldFN0eWxlID0gZnVuY3Rpb24gKGVsLCBqc1Byb3BlcnR5KSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgY3NzUHJvcGVydHkgPSBqc1Byb3BlcnR5LnJlcGxhY2UoLyhbQS1aXSkvZywgXCItJDFcIikudG9Mb3dlckNhc2UoKTtcclxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2Ygd2luZG93LmdldENvbXB1dGVkU3R5bGUgPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gd2luZG93LmdldENvbXB1dGVkU3R5bGUoZWwpLmdldFByb3BlcnR5VmFsdWUoY3NzUHJvcGVydHkpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGVsLmN1cnJlbnRTdHlsZVtqc1Byb3BlcnR5XTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgWndvb3NoLnByb3RvdHlwZS5jbGVhclRpbWVvdXRzID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMudGltZW91dHMpIHtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpZHggaW4gdGhpcy50aW1lb3V0cykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQodGhpcy50aW1lb3V0c1tpZHhdKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMudGltZW91dHMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnRpbWVvdXRzID0gW107XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVtb3ZlRXZlbnRMaXN0ZW5lcih0aGlzLmlubmVyLCAnY29sbGlkZS5sZWZ0JywgdGhpcy5jbGVhckxpc3RlbmVyTGVmdCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVtb3ZlRXZlbnRMaXN0ZW5lcih0aGlzLmlubmVyLCAnY29sbGlkZS5yaWdodCcsIHRoaXMuY2xlYXJMaXN0ZW5lclJpZ2h0KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKHRoaXMuaW5uZXIsICdjb2xsaWRlLnRvcCcsIHRoaXMuY2xlYXJMaXN0ZW5lclRvcCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVtb3ZlRXZlbnRMaXN0ZW5lcih0aGlzLmlubmVyLCAnY29sbGlkZS5ib3R0b20nLCB0aGlzLmNsZWFyTGlzdGVuZXJCb3R0b20pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgICAqIE1vdXNlIGRvd24gaGFuZGxlclxyXG4gICAgICAgICAgICAgKiBSZWdpc3RlcnMgdGhlIG1vdXNlbW92ZSBhbmQgbW91c2V1cCBoYW5kbGVycyBhbmQgZmluZHMgdGhlIG5leHQgaW5uZXIgZWxlbWVudFxyXG4gICAgICAgICAgICAgKlxyXG4gICAgICAgICAgICAgKiBAcGFyYW0ge01vdXNlRXZlbnR9IGUgLSBUaGUgbW91c2UgZG93biBldmVudCBvYmplY3RcclxuICAgICAgICAgICAgICogQHJldHVybiB7dm9pZH1cclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIFp3b29zaC5wcm90b3R5cGUubW91c2VEb3duID0gZnVuY3Rpb24gKGUpIHtcclxuICAgICAgICAgICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNsZWFyVGltZW91dHMoKTtcclxuICAgICAgICAgICAgICAgIC8qIGRyYWcgb25seSBpZiB0aGUgbGVmdCBtb3VzZSBidXR0b24gd2FzIHByZXNzZWQgKi9cclxuICAgICAgICAgICAgICAgIGlmICgoXCJ3aGljaFwiIGluIGUgJiYgZS53aGljaCA9PT0gMSkgfHwgKHR5cGVvZiBlLndoaWNoID09PSAndW5kZWZpbmVkJyAmJiBcImJ1dHRvblwiIGluIGUgJiYgZS5idXR0b24gPT09IDEpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuZWxlbWVudEJlaGluZEN1cnNvcklzTWUoZS5jbGllbnRYLCBlLmNsaWVudFkpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIHByZXZlbnQgaW1hZ2UgZHJhZ2dpbmcgYWN0aW9uICovXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBpbWdzID0gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvckFsbCgnaW1nJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgaW1ncy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW1nc1tpXS5vbmRyYWdzdGFydCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIGZhbHNlOyB9OyAvL01TSUVcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBzZWFyY2ggdGhlIERPTSBmb3IgZXhjbHVkZSBlbGVtZW50cyAqL1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLmRyYWdPcHRpb25zLmV4Y2x1ZGUubGVuZ3RoICE9PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBkcmFnIG9ubHkgaWYgdGhlIG1vdXNlIGNsaWNrZWQgb24gYW4gYWxsb3dlZCBlbGVtZW50ICovXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgZWwgPSBkb2N1bWVudC5lbGVtZW50RnJvbVBvaW50KGUuY2xpZW50WCwgZS5jbGllbnRZKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBleGNsdWRlRWxlbWVudHMgPSB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yQWxsKHRoaXMub3B0aW9ucy5kcmFnT3B0aW9ucy5leGNsdWRlLmpvaW4oJywgJykpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogbG9vcCB0aHJvdWdoIGFsbCBwYXJlbnQgZWxlbWVudHMgdW50aWwgd2UgZW5jb3VudGVyIGFuIGlubmVyIGRpdiBvciBubyBtb3JlIHBhcmVudHMgKi9cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBpbm5lclJlID0gbmV3IFJlZ0V4cChcIiBcIiArIHRoaXMuY2xhc3NJbm5lciArIFwiIFwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdoaWxlIChlbCAmJiAhZWwuY2xhc3NOYW1lLm1hdGNoKGlubmVyUmUpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogY29tcGFyZSBlYWNoIHBhcmVudCwgaWYgaXQgaXMgaW4gdGhlIGV4Y2x1ZGUgbGlzdCAqL1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZXhjbHVkZUVsZW1lbnRzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIGJhaWwgb3V0IGlmIGFuIGVsZW1lbnQgbWF0Y2hlcyAqL1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXhjbHVkZUVsZW1lbnRzW2ldID09PSBlbCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWwgPSBlbC5wYXJlbnRFbGVtZW50O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHNlYXJjaCB0aGUgRE9NIGZvciBvbmx5IGVsZW1lbnRzLCBidXQgb25seSBpZiB0aGVyZSBhcmUgZWxlbWVudHMgc2V0XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qaWYgKHRoaXMub3B0aW9ucy5kcmFnT3B0aW9ucy5vbmx5Lmxlbmd0aCAhPT0gMCl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG9ubHlFbGVtZW50cyA9IHRoaXMuY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3JBbGwodGhpcy5vcHRpb25zLmRyYWdPcHRpb25zLm9ubHkuam9pbignLCAnKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gbG9vcCB0aHJvdWdoIHRoZSBub2RlbGlzdCBhbmQgY2hlY2sgZm9yIG91ciBlbGVtZW50XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGZvdW5kID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBleGNsdWRlRWxlbWVudHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvbmx5RWxlbWVudHNbaV0gPT09IGVsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvdW5kID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmb3VuZCA9PT0gZmFsc2UpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0qL1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkb2N1bWVudC5ib2R5LmNsYXNzTmFtZSArPSBcIiBcIiArIHRoaXMuY2xhc3NHcmFiYmluZyArIFwiIFwiO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRyYWdnaW5nID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLyogbm90ZSB0aGUgb3JpZ2luIHBvc2l0aW9ucyAqL1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRyYWdPcmlnaW5MZWZ0ID0gZS5jbGllbnRYO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRyYWdPcmlnaW5Ub3AgPSBlLmNsaWVudFk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZHJhZ09yaWdpblNjcm9sbExlZnQgPSB0aGlzLmdldFNjcm9sbExlZnQoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kcmFnT3JpZ2luU2Nyb2xsVG9wID0gdGhpcy5nZXRTY3JvbGxUb3AoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLyogaXQgbG9va3Mgc3RyYW5nZSBpZiBzY3JvbGwtYmVoYXZpb3IgaXMgc2V0IHRvIHNtb290aCAqL1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBhcmVudE9yaWdpblN0eWxlID0gdGhpcy5pbm5lci5wYXJlbnRFbGVtZW50LnN0eWxlLmNzc1RleHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdGhpcy5pbm5lci5wYXJlbnRFbGVtZW50LnN0eWxlLnNldFByb3BlcnR5ID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmlubmVyLnBhcmVudEVsZW1lbnQuc3R5bGUuc2V0UHJvcGVydHkoJ3Njcm9sbC1iZWhhdmlvcicsICdhdXRvJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCA/IGUucHJldmVudERlZmF1bHQoKSA6IChlLnJldHVyblZhbHVlID0gZmFsc2UpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnZ4ID0gW107XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudnkgPSBbXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLyogcmVnaXN0ZXIgdGhlIGV2ZW50IGhhbmRsZXJzICovXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubW91c2VNb3ZlSGFuZGxlciA9IHRoaXMubW91c2VNb3ZlLmJpbmQodGhpcyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcihkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQsICdtb3VzZW1vdmUnLCB0aGlzLm1vdXNlTW92ZUhhbmRsZXIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm1vdXNlVXBIYW5kbGVyID0gZnVuY3Rpb24gKGUpIHsgcmV0dXJuIF90aGlzLm1vdXNlVXAoZSk7IH07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcihkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQsICdtb3VzZXVwJywgdGhpcy5tb3VzZVVwSGFuZGxlcik7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAvKipcclxuICAgICAgICAgICAgICogTW91c2UgdXAgaGFuZGxlclxyXG4gICAgICAgICAgICAgKiBEZXJlZ2lzdGVycyB0aGUgbW91c2Vtb3ZlIGFuZCBtb3VzZXVwIGhhbmRsZXJzXHJcbiAgICAgICAgICAgICAqXHJcbiAgICAgICAgICAgICAqIEBwYXJhbSB7TW91c2VFdmVudH0gZSAtIFRoZSBtb3VzZSB1cCBldmVudCBvYmplY3RcclxuICAgICAgICAgICAgICogQHJldHVybiB7dm9pZH1cclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIFp3b29zaC5wcm90b3R5cGUubW91c2VVcCA9IGZ1bmN0aW9uIChlKSB7XHJcbiAgICAgICAgICAgICAgICAvKiBUT0RPOiByZXN0b3JlIG9yaWdpbmFsIHBvc2l0aW9uIHZhbHVlICovXHJcbiAgICAgICAgICAgICAgICB0aGlzLmlubmVyLnN0eWxlLnBvc2l0aW9uID0gJyc7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmlubmVyLnN0eWxlLnRvcCA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmlubmVyLnN0eWxlLmxlZnQgPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wcmVzZW50ID0gKHRoaXMuZ2V0VGltZXN0YW1wKCkgLyAxMDAwKTsgLy9pbiBzZWNvbmRzXHJcbiAgICAgICAgICAgICAgICB2YXIgeCA9IHRoaXMuZ2V0UmVhbFgodGhpcy5kcmFnT3JpZ2luTGVmdCArIHRoaXMuZHJhZ09yaWdpblNjcm9sbExlZnQgLSBlLmNsaWVudFgpO1xyXG4gICAgICAgICAgICAgICAgdmFyIHkgPSB0aGlzLmdldFJlYWxZKHRoaXMuZHJhZ09yaWdpblRvcCArIHRoaXMuZHJhZ09yaWdpblNjcm9sbFRvcCAtIGUuY2xpZW50WSk7XHJcbiAgICAgICAgICAgICAgICB2YXIgcmUgPSBuZXcgUmVnRXhwKFwiIFwiICsgdGhpcy5jbGFzc0dyYWJiaW5nICsgXCIgXCIpO1xyXG4gICAgICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5jbGFzc05hbWUgPSBkb2N1bWVudC5ib2R5LmNsYXNzTmFtZS5yZXBsYWNlKHJlLCAnJyk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmlubmVyLnBhcmVudEVsZW1lbnQuc3R5bGUuY3NzVGV4dCA9IHRoaXMucGFyZW50T3JpZ2luU3R5bGU7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRyYWdnaW5nID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnJlbW92ZUV2ZW50TGlzdGVuZXIoZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LCAnbW91c2Vtb3ZlJywgdGhpcy5tb3VzZU1vdmVIYW5kbGVyKTtcclxuICAgICAgICAgICAgICAgIHRoaXMucmVtb3ZlRXZlbnRMaXN0ZW5lcihkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQsICdtb3VzZXVwJywgdGhpcy5tb3VzZVVwSGFuZGxlcik7XHJcbiAgICAgICAgICAgICAgICBpZiAoeSAhPT0gdGhpcy5nZXRTY3JvbGxUb3AoKSB8fCB4ICE9PSB0aGlzLmdldFNjcm9sbExlZnQoKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciB0ID0gdGhpcy5wcmVzZW50IC0gKHRoaXMucGFzdCA/IHRoaXMucGFzdCA6IHRoaXMucHJlc2VudCk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHQgPiAwLjA1KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIGp1c3QgYWxpZ24gdG8gdGhlIGdyaWQgaWYgdGhlIG1vdXNlIGxlZnQgdW5tb3ZlZCBmb3IgbW9yZSB0aGFuIDAuMDUgc2Vjb25kcyAqL1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNjcm9sbFRvKHgsIHksIHRoaXMub3B0aW9ucy5kcmFnT3B0aW9ucy5mYWRlKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLmRyYWdPcHRpb25zLmZhZGUgJiYgdHlwZW9mIHRoaXMudnggIT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiB0aGlzLnZ5ICE9PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBkZWx0YVQsIGRlbHRhU3gsIGRlbHRhU3ksIGxhc3REZWx0YVN4LCBsYXN0RGVsdGFTeTtcclxuICAgICAgICAgICAgICAgICAgICBkZWx0YVQgPSBkZWx0YVN4ID0gZGVsdGFTeSA9IGxhc3REZWx0YVN4ID0gbGFzdERlbHRhU3kgPSAwO1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgaW4gdGhpcy52eSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocGFyc2VGbG9hdChpKSA+ICh0aGlzLnByZXNlbnQgLSAwLjEpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAmJiB0eXBlb2YgbGFzdFQgIT09ICd1bmRlZmluZWQnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAmJiB0eXBlb2YgbGFzdFN4ICE9PSAndW5kZWZpbmVkJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJiYgdHlwZW9mIGxhc3RTeSAhPT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbHRhVCArPSBwYXJzZUZsb2F0KGkpIC0gbGFzdFQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYXN0RGVsdGFTeCA9IHRoaXMudnhbaV0gLSBsYXN0U3g7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYXN0RGVsdGFTeSA9IHRoaXMudnlbaV0gLSBsYXN0U3k7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWx0YVN4ICs9IE1hdGguYWJzKGxhc3REZWx0YVN4KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbHRhU3kgKz0gTWF0aC5hYnMobGFzdERlbHRhU3kpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBsYXN0VCA9IHBhcnNlRmxvYXQoaSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBsYXN0U3ggPSB0aGlzLnZ4W2ldO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbGFzdFN5ID0gdGhpcy52eVtpXTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHZ4ID0gZGVsdGFUID09PSAwID8gMCA6IGxhc3REZWx0YVN4ID4gMCA/IGRlbHRhU3ggLyBkZWx0YVQgOiBkZWx0YVN4IC8gLWRlbHRhVDtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgdnkgPSBkZWx0YVQgPT09IDAgPyAwIDogbGFzdERlbHRhU3kgPiAwID8gZGVsdGFTeSAvIGRlbHRhVCA6IGRlbHRhU3kgLyAtZGVsdGFUO1xyXG4gICAgICAgICAgICAgICAgICAgIC8qIHYgc2hvdWxkIG5vdCBleGNlZWQgdk1heCBvciAtdk1heCAtPiB3b3VsZCBiZSB0b28gZmFzdCBhbmQgc2hvdWxkIGV4Y2VlZCB2TWluIG9yIC12TWluICovXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHZNYXggPSB0aGlzLm9wdGlvbnMuZHJhZ09wdGlvbnMubWF4U3BlZWQ7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHZNaW4gPSB0aGlzLm9wdGlvbnMuZHJhZ09wdGlvbnMubWluU3BlZWQ7XHJcbiAgICAgICAgICAgICAgICAgICAgLyogaWYgdGhlIHNwZWVkIGlzIG5vdCB3aXRob3V0IGJvdW5kIGZvciBmYWRlLCBqdXN0IGRvIGEgcmVndWxhciBzY3JvbGwgd2hlbiB0aGVyZSBpcyBhIGdyaWQqL1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh2eSA8IHZNaW4gJiYgdnkgPiAtdk1pbiAmJiB2eCA8IHZNaW4gJiYgdnggPiAtdk1pbikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLmdyaWRZID4gMSB8fCB0aGlzLm9wdGlvbnMuZ3JpZFggPiAxKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNjcm9sbFRvKHgsIHkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHZ4ID0gKHZ4IDw9IHZNYXggJiYgdnggPj0gLXZNYXgpID8gdnggOiAodnggPiAwID8gdk1heCA6IC12TWF4KTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgdnkgPSAodnkgPD0gdk1heCAmJiB2eSA+PSAtdk1heCkgPyB2eSA6ICh2eSA+IDAgPyB2TWF4IDogLXZNYXgpO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBheCA9ICh2eCA+IDAgPyAtMSA6IDEpICogdGhpcy5vcHRpb25zLmRyYWdPcHRpb25zLmJyYWtlU3BlZWQ7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGF5ID0gKHZ5ID4gMCA/IC0xIDogMSkgKiB0aGlzLm9wdGlvbnMuZHJhZ09wdGlvbnMuYnJha2VTcGVlZDtcclxuICAgICAgICAgICAgICAgICAgICB4ID0gKCgwIC0gTWF0aC5wb3codngsIDIpKSAvICgyICogYXgpKSArIHRoaXMuZ2V0U2Nyb2xsTGVmdCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIHkgPSAoKDAgLSBNYXRoLnBvdyh2eSwgMikpIC8gKDIgKiBheSkpICsgdGhpcy5nZXRTY3JvbGxUb3AoKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnNjcm9sbFRvKHgsIHkpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLyogaW4gYWxsIG90aGVyIGNhc2VzLCBkbyBhIHJlZ3VsYXIgc2Nyb2xsICovXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zY3JvbGxUbyh4LCB5LCB0aGlzLm9wdGlvbnMuZHJhZ09wdGlvbnMuZmFkZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgKiBDYWxjdWxhdGVzIHRoZSByb3VuZGVkIGFuZCBzY2FsZWQgeC1jb29yZGluYXRlLlxyXG4gICAgICAgICAgICAgKlxyXG4gICAgICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0geCAtIHRoZSB4LWNvb3JkaW5hdGVcclxuICAgICAgICAgICAgICogQHJldHVybiB7bnVtYmVyfSAtIHRoZSBmaW5hbCB4LWNvb3JkaW5hdGVcclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIFp3b29zaC5wcm90b3R5cGUuZ2V0UmVhbFggPSBmdW5jdGlvbiAoeCkge1xyXG4gICAgICAgICAgICAgICAgLy9zdGljayB0aGUgZWxlbWVudCB0byB0aGUgZ3JpZCwgaWYgZ3JpZCBlcXVhbHMgMSB0aGUgdmFsdWUgZG9lcyBub3QgY2hhbmdlXHJcbiAgICAgICAgICAgICAgICB4ID0gTWF0aC5yb3VuZCh4IC8gKHRoaXMub3B0aW9ucy5ncmlkWCAqIHRoaXMuZ2V0U2NhbGUoKSkpICogKHRoaXMub3B0aW9ucy5ncmlkWCAqIHRoaXMuZ2V0U2NhbGUoKSk7XHJcbiAgICAgICAgICAgICAgICB2YXIgc2Nyb2xsTWF4TGVmdCA9ICh0aGlzLnNjcm9sbEVsZW1lbnQuc2Nyb2xsV2lkdGggLSB0aGlzLnNjcm9sbEVsZW1lbnQuY2xpZW50V2lkdGgpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuICh4ID4gc2Nyb2xsTWF4TGVmdCkgPyBzY3JvbGxNYXhMZWZ0IDogeDtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgICAqIENhbGN1bGF0ZXMgdGhlIHJvdW5kZWQgYW5kIHNjYWxlZCB5LWNvb3JkaW5hdGUuXHJcbiAgICAgICAgICAgICAqXHJcbiAgICAgICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSB5IC0gdGhlIHktY29vcmRpbmF0ZVxyXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHtudW1iZXJ9IC0gdGhlIGZpbmFsIHktY29vcmRpbmF0ZVxyXG4gICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgWndvb3NoLnByb3RvdHlwZS5nZXRSZWFsWSA9IGZ1bmN0aW9uICh5KSB7XHJcbiAgICAgICAgICAgICAgICAvL3N0aWNrIHRoZSBlbGVtZW50IHRvIHRoZSBncmlkLCBpZiBncmlkIGVxdWFscyAxIHRoZSB2YWx1ZSBkb2VzIG5vdCBjaGFuZ2VcclxuICAgICAgICAgICAgICAgIHkgPSBNYXRoLnJvdW5kKHkgLyAodGhpcy5vcHRpb25zLmdyaWRZICogdGhpcy5nZXRTY2FsZSgpKSkgKiAodGhpcy5vcHRpb25zLmdyaWRZICogdGhpcy5nZXRTY2FsZSgpKTtcclxuICAgICAgICAgICAgICAgIHZhciBzY3JvbGxNYXhUb3AgPSAodGhpcy5zY3JvbGxFbGVtZW50LnNjcm9sbEhlaWdodCAtIHRoaXMuc2Nyb2xsRWxlbWVudC5jbGllbnRIZWlnaHQpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuICh5ID4gc2Nyb2xsTWF4VG9wKSA/IHNjcm9sbE1heFRvcCA6IHk7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgKiBDYWxjdWxhdGVzIGVhY2ggc3RlcCBvZiBhIHNjcm9sbCBmYWRlb3V0IGFuaW1hdGlvbiBiYXNlZCBvbiB0aGUgaW5pdGlhbCB2ZWxvY2l0eS5cclxuICAgICAgICAgICAgICogU3RvcHMgYW55IGN1cnJlbnRseSBydW5uaW5nIHNjcm9sbCBhbmltYXRpb24uXHJcbiAgICAgICAgICAgICAqXHJcbiAgICAgICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSB2eCAtIHRoZSBpbml0aWFsIHZlbG9jaXR5IGluIGhvcml6b250YWwgZGlyZWN0aW9uXHJcbiAgICAgICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSB2eSAtIHRoZSBpbml0aWFsIHZlbG9jaXR5IGluIHZlcnRpY2FsIGRpcmVjdGlvblxyXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHtudW1iZXJ9IC0gdGhlIGZpbmFsIHktY29vcmRpbmF0ZVxyXG4gICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgWndvb3NoLnByb3RvdHlwZS5mYWRlT3V0QnlWZWxvY2l0eSA9IGZ1bmN0aW9uICh2eCwgdnkpIHtcclxuICAgICAgICAgICAgICAgIC8qIFRPRE86IGNhbGMgdiBoZXJlIGFuZCB3aXRoIG1vcmUgaW5mbywgbW9yZSBwcmVjaXNlbHkgKi9cclxuICAgICAgICAgICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XHJcbiAgICAgICAgICAgICAgICAvKiBjYWxjdWxhdGUgdGhlIGJyYWtlIGFjY2VsZXJhdGlvbiBpbiBib3RoIGRpcmVjdGlvbnMgc2VwYXJhdGVseSAqL1xyXG4gICAgICAgICAgICAgICAgdmFyIGF5ID0gKHZ5ID4gMCA/IC0xIDogMSkgKiB0aGlzLm9wdGlvbnMuZHJhZ09wdGlvbnMuYnJha2VTcGVlZDtcclxuICAgICAgICAgICAgICAgIHZhciBheCA9ICh2eCA+IDAgPyAtMSA6IDEpICogdGhpcy5vcHRpb25zLmRyYWdPcHRpb25zLmJyYWtlU3BlZWQ7XHJcbiAgICAgICAgICAgICAgICAvKiBmaW5kIHRoZSBkaXJlY3Rpb24gdGhhdCBuZWVkcyBsb25nZXIgdG8gc3RvcCwgYW5kIHJlY2FsY3VsYXRlIHRoZSBhY2NlbGVyYXRpb24gKi9cclxuICAgICAgICAgICAgICAgIHZhciB0bWF4ID0gTWF0aC5tYXgoKDAgLSB2eSkgLyBheSwgKDAgLSB2eCkgLyBheCk7XHJcbiAgICAgICAgICAgICAgICBheCA9ICgwIC0gdngpIC8gdG1heDtcclxuICAgICAgICAgICAgICAgIGF5ID0gKDAgLSB2eSkgLyB0bWF4O1xyXG4gICAgICAgICAgICAgICAgdmFyIGZwcyA9IHRoaXMub3B0aW9ucy5kcmFnT3B0aW9ucy5mcHM7XHJcbiAgICAgICAgICAgICAgICB2YXIgbWUgPSB0aGlzO1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCAoKHRtYXggKiBmcHMpICsgKDAgLyBmcHMpKTsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHQgPSAoKGkgKyAxKSAvIGZwcyk7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHN5ID0gdGhpcy5nZXRTY3JvbGxUb3AoKSArICh2eSAqIHQpICsgKDAuNSAqIGF5ICogdCAqIHQpO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBzeCA9IHRoaXMuZ2V0U2Nyb2xsTGVmdCgpICsgKHZ4ICogdCkgKyAoMC41ICogYXggKiB0ICogdCk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50aW1lb3V0cy5wdXNoKHNldFRpbWVvdXQoKGZ1bmN0aW9uICh4LCB5LCBtZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWUuc2V0U2Nyb2xsVG9wKHkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWUuc2V0U2Nyb2xsTGVmdCh4KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lLm9yaWdpblNjcm9sbExlZnQgPSB4O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWUub3JpZ2luU2Nyb2xsVG9wID0geTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICAgICB9KHN4LCBzeSwgbWUpKSwgKGkgKyAxKSAqICgxMDAwIC8gZnBzKSkpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKGkgPiAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLyogcm91bmQgdGhlIGxhc3Qgc3RlcCBiYXNlZCBvbiB0aGUgZGlyZWN0aW9uIG9mIHRoZSBmYWRlICovXHJcbiAgICAgICAgICAgICAgICAgICAgc3ggPSB2eCA+IDAgPyBNYXRoLmNlaWwoc3gpIDogTWF0aC5mbG9vcihzeCk7XHJcbiAgICAgICAgICAgICAgICAgICAgc3kgPSB2eSA+IDAgPyBNYXRoLmNlaWwoc3kpIDogTWF0aC5mbG9vcihzeSk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50aW1lb3V0cy5wdXNoKHNldFRpbWVvdXQoKGZ1bmN0aW9uICh4LCB5LCBtZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWUuc2V0U2Nyb2xsVG9wKHkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWUuc2V0U2Nyb2xsTGVmdCh4KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lLm9yaWdpblNjcm9sbExlZnQgPSB4O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWUub3JpZ2luU2Nyb2xsVG9wID0geTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICAgICB9KHN4LCBzeSwgbWUpKSwgKGkgKyAyKSAqICgxMDAwIC8gZnBzKSkpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgLyogc3RvcCB0aGUgYW5pbWF0aW9uIHdoZW4gY29sbGlkaW5nIHdpdGggdGhlIGJvcmRlcnMgKi9cclxuICAgICAgICAgICAgICAgIHRoaXMuY2xlYXJMaXN0ZW5lckxlZnQgPSBmdW5jdGlvbiAoKSB7IHJldHVybiBfdGhpcy5jbGVhclRpbWVvdXRzKCk7IH07XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNsZWFyTGlzdGVuZXJSaWdodCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIF90aGlzLmNsZWFyVGltZW91dHMoKTsgfTtcclxuICAgICAgICAgICAgICAgIHRoaXMuY2xlYXJMaXN0ZW5lclRvcCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIF90aGlzLmNsZWFyVGltZW91dHMoKTsgfTtcclxuICAgICAgICAgICAgICAgIHRoaXMuY2xlYXJMaXN0ZW5lckJvdHRvbSA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIF90aGlzLmNsZWFyVGltZW91dHMoKTsgfTtcclxuICAgICAgICAgICAgICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcih0aGlzLmlubmVyLCAnY29sbGlkZS5sZWZ0JywgdGhpcy5jbGVhckxpc3RlbmVyTGVmdCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIodGhpcy5pbm5lciwgJ2NvbGxpZGUucmlnaHQnLCB0aGlzLmNsZWFyTGlzdGVuZXJSaWdodCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIodGhpcy5pbm5lciwgJ2NvbGxpZGUudG9wJywgdGhpcy5jbGVhckxpc3RlbmVyVG9wKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcih0aGlzLmlubmVyLCAnY29sbGlkZS5ib3R0b20nLCB0aGlzLmNsZWFyTGlzdGVuZXJCb3R0b20pO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLmZhZGVPdXRCeUNvb3JkcyA9IGZ1bmN0aW9uICh4LCB5KSB7XHJcbiAgICAgICAgICAgICAgICB4ID0gdGhpcy5nZXRSZWFsWCh4KTtcclxuICAgICAgICAgICAgICAgIHkgPSB0aGlzLmdldFJlYWxZKHkpO1xyXG4gICAgICAgICAgICAgICAgdmFyIGEgPSB0aGlzLm9wdGlvbnMuZHJhZ09wdGlvbnMuYnJha2VTcGVlZCAqIC0xO1xyXG4gICAgICAgICAgICAgICAgdmFyIHZ5ID0gMCAtICgyICogYSAqICh5IC0gdGhpcy5nZXRTY3JvbGxUb3AoKSkpO1xyXG4gICAgICAgICAgICAgICAgdmFyIHZ4ID0gMCAtICgyICogYSAqICh4IC0gdGhpcy5nZXRTY3JvbGxMZWZ0KCkpKTtcclxuICAgICAgICAgICAgICAgIHZ5ID0gKHZ5ID4gMCA/IDEgOiAtMSkgKiBNYXRoLnNxcnQoTWF0aC5hYnModnkpKTtcclxuICAgICAgICAgICAgICAgIHZ4ID0gKHZ4ID4gMCA/IDEgOiAtMSkgKiBNYXRoLnNxcnQoTWF0aC5hYnModngpKTtcclxuICAgICAgICAgICAgICAgIHZhciBzeCA9IHggLSB0aGlzLmdldFNjcm9sbExlZnQoKTtcclxuICAgICAgICAgICAgICAgIHZhciBzeSA9IHkgLSB0aGlzLmdldFNjcm9sbFRvcCgpO1xyXG4gICAgICAgICAgICAgICAgaWYgKE1hdGguYWJzKHN5KSA+IE1hdGguYWJzKHN4KSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZ4ID0gKHZ4ID4gMCA/IDEgOiAtMSkgKiBNYXRoLmFicygoc3ggLyBzeSkgKiB2eSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB2eSA9ICh2eSA+IDAgPyAxIDogLTEpICogTWF0aC5hYnMoKHN5IC8gc3gpICogdngpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdGhpcy5jbGVhclRpbWVvdXRzKCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmZhZGVPdXRCeVZlbG9jaXR5KHZ4LCB2eSk7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgKiBNb3VzZSBtb3ZlIGhhbmRsZXJcclxuICAgICAgICAgICAgICogQ2FsY3VjYXRlcyB0aGUgeCBhbmQgeSBkZWx0YXMgYW5kIHNjcm9sbHNcclxuICAgICAgICAgICAgICpcclxuICAgICAgICAgICAgICogQHBhcmFtIHtNb3VzZUV2ZW50fSBlIC0gVGhlIG1vdXNlIG1vdmUgZXZlbnQgb2JqZWN0XHJcbiAgICAgICAgICAgICAqIEByZXR1cm4ge3ZvaWR9XHJcbiAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLm1vdXNlTW92ZSA9IGZ1bmN0aW9uIChlKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnByZXNlbnQgPSAodGhpcy5nZXRUaW1lc3RhbXAoKSAvIDEwMDApOyAvL2luIHNlY29uZHNcclxuICAgICAgICAgICAgICAgIHRoaXMuY2xlYXJUZXh0U2VsZWN0aW9uKCk7XHJcbiAgICAgICAgICAgICAgICAvKiBpZiB0aGUgbW91c2UgbGVmdCB0aGUgd2luZG93IGFuZCB0aGUgYnV0dG9uIGlzIG5vdCBwcmVzc2VkIGFueW1vcmUsIGFib3J0IG1vdmluZyAqL1xyXG4gICAgICAgICAgICAgICAgLy9pZiAoKGUuYnV0dG9ucyA9PT0gMCAmJiBlLmJ1dHRvbiA9PT0gMCkgfHwgKHR5cGVvZiBlLmJ1dHRvbnMgPT09ICd1bmRlZmluZWQnICYmIGUuYnV0dG9uID09PSAwKSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKChcIndoaWNoXCIgaW4gZSAmJiBlLndoaWNoID09PSAwKSB8fCAodHlwZW9mIGUud2hpY2ggPT09ICd1bmRlZmluZWQnICYmIFwiYnV0dG9uXCIgaW4gZSAmJiBlLmJ1dHRvbiA9PT0gMCkpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm1vdXNlVXAoZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdmFyIHggPSB0aGlzLmRyYWdPcmlnaW5MZWZ0ICsgdGhpcy5kcmFnT3JpZ2luU2Nyb2xsTGVmdCAtIGUuY2xpZW50WDtcclxuICAgICAgICAgICAgICAgIHZhciB5ID0gdGhpcy5kcmFnT3JpZ2luVG9wICsgdGhpcy5kcmFnT3JpZ2luU2Nyb2xsVG9wIC0gZS5jbGllbnRZO1xyXG4gICAgICAgICAgICAgICAgLyogaWYgZWxhc3RpYyBlZGdlcyBhcmUgc2V0LCBzaG93IHRoZSBlbGVtZW50IHBzZXVkbyBzY3JvbGxlZCBieSByZWxhdGl2ZSBwb3NpdGlvbiAqL1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMudHJpZ2dlcmVkLmNvbGxpZGVCb3R0b20gJiYgdGhpcy5vcHRpb25zLmVsYXN0aWNFZGdlcy5ib3R0b20gPT09IHRydWUpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmlubmVyLnN0eWxlLnBvc2l0aW9uID0gJ3JlbGF0aXZlJztcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmlubmVyLnN0eWxlLnRvcCA9ICgodGhpcy5nZXRTY3JvbGxUb3AoKSAtIHkpIC8gMikgKyAncHgnO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMudHJpZ2dlcmVkLmNvbGxpZGVUb3AgJiYgdGhpcy5vcHRpb25zLmVsYXN0aWNFZGdlcy50b3AgPT09IHRydWUpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmlubmVyLnN0eWxlLnBvc2l0aW9uID0gJ3JlbGF0aXZlJztcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmlubmVyLnN0eWxlLnRvcCA9ICh5IC8gLTIpICsgJ3B4JztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLnRyaWdnZXJlZC5jb2xsaWRlTGVmdCAmJiB0aGlzLm9wdGlvbnMuZWxhc3RpY0VkZ2VzLmxlZnQgPT09IHRydWUpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmlubmVyLnN0eWxlLnBvc2l0aW9uID0gJ3JlbGF0aXZlJztcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmlubmVyLnN0eWxlLmxlZnQgPSAoeCAvIC0yKSArICdweCc7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy50cmlnZ2VyZWQuY29sbGlkZVJpZ2h0ICYmIHRoaXMub3B0aW9ucy5lbGFzdGljRWRnZXMucmlnaHQgPT09IHRydWUpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmlubmVyLnN0eWxlLnBvc2l0aW9uID0gJ3JlbGF0aXZlJztcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmlubmVyLnN0eWxlLmxlZnQgPSAoKHRoaXMuZ2V0U2Nyb2xsTGVmdCgpIC0geCkgLyAyKSArICdweCc7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB0aGlzLnZ4W3RoaXMucHJlc2VudF0gPSB4O1xyXG4gICAgICAgICAgICAgICAgdGhpcy52eVt0aGlzLnByZXNlbnRdID0geTtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsVG8oeCwgeSwgZmFsc2UpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wYXN0ID0gdGhpcy5wcmVzZW50O1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAvKipcclxuICAgICAgICAgICAgICogc2Nyb2xsQnkgaGVscGVyIG1ldGhvZCB0byBzY3JvbGwgYnkgYW4gYW1vdW50IG9mIHBpeGVscyBpbiB4LSBhbmQgeS1kaXJlY3Rpb25cclxuICAgICAgICAgICAgICpcclxuICAgICAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IHggLSBhbW91bnQgb2YgcGl4ZWxzIHRvIHNjcm9sbCBpbiB4LWRpcmVjdGlvblxyXG4gICAgICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0geSAtIGFtb3VudCBvZiBwaXhlbHMgdG8gc2Nyb2xsIGluIHktZGlyZWN0aW9uXHJcbiAgICAgICAgICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gc21vb3RoIC0gd2hldGhlciB0byBzY3JvbGwgc21vb3RoIG9yIGluc3RhbnRcclxuICAgICAgICAgICAgICogQHJldHVybiB7dm9pZH1cclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIFp3b29zaC5wcm90b3R5cGUuc2Nyb2xsQnkgPSBmdW5jdGlvbiAoeCwgeSwgc21vb3RoKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoc21vb3RoID09PSB2b2lkIDApIHsgc21vb3RoID0gdHJ1ZTsgfVxyXG4gICAgICAgICAgICAgICAgdmFyIGFic29sdXRlWCA9IHRoaXMuZ2V0U2Nyb2xsTGVmdCgpICsgeDtcclxuICAgICAgICAgICAgICAgIHZhciBhYnNvbHV0ZVkgPSB0aGlzLmdldFNjcm9sbFRvcCgpICsgeTtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsVG8oYWJzb2x1dGVYLCBhYnNvbHV0ZVksIHNtb290aCk7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgKiBzY3JvbGxCeSBoZWxwZXIgbWV0aG9kIHRvIHNjcm9sbCB0byBhIHgtIGFuZCB5LWNvb3JkaW5hdGVcclxuICAgICAgICAgICAgICpcclxuICAgICAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IHggLSB4LWNvb3JkaW5hdGUgdG8gc2Nyb2xsIHRvXHJcbiAgICAgICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSB5IC0geS1jb29yZGluYXRlIHRvIHNjcm9sbCB0b1xyXG4gICAgICAgICAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IHNtb290aCAtIHdoZXRoZXIgdG8gc2Nyb2xsIHNtb290aCBvciBpbnN0YW50XHJcbiAgICAgICAgICAgICAqIEByZXR1cm4ge3ZvaWR9XHJcbiAgICAgICAgICAgICAqXHJcbiAgICAgICAgICAgICAqIEBUT0RPOiBDU1MzIHRyYW5zaXRpb25zIGlmIGF2YWlsYWJsZSBpbiBicm93c2VyXHJcbiAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLnNjcm9sbFRvID0gZnVuY3Rpb24gKHgsIHksIHNtb290aCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHNtb290aCA9PT0gdm9pZCAwKSB7IHNtb290aCA9IHRydWU7IH1cclxuICAgICAgICAgICAgICAgIHRoaXMuY2xlYXJUaW1lb3V0cygpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zY3JvbGxNYXhMZWZ0ID0gKHRoaXMuc2Nyb2xsRWxlbWVudC5zY3JvbGxXaWR0aCAtIHRoaXMuc2Nyb2xsRWxlbWVudC5jbGllbnRXaWR0aCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNjcm9sbE1heFRvcCA9ICh0aGlzLnNjcm9sbEVsZW1lbnQuc2Nyb2xsSGVpZ2h0IC0gdGhpcy5zY3JvbGxFbGVtZW50LmNsaWVudEhlaWdodCk7XHJcbiAgICAgICAgICAgICAgICAvKiBubyBuZWdhdGl2ZSB2YWx1ZXMgb3IgdmFsdWVzIGdyZWF0ZXIgdGhhbiB0aGUgbWF4aW11bSAqL1xyXG4gICAgICAgICAgICAgICAgdmFyIHggPSAoeCA+IHRoaXMuc2Nyb2xsTWF4TGVmdCkgPyB0aGlzLnNjcm9sbE1heExlZnQgOiAoeCA8IDApID8gMCA6IHg7XHJcbiAgICAgICAgICAgICAgICB2YXIgeSA9ICh5ID4gdGhpcy5zY3JvbGxNYXhUb3ApID8gdGhpcy5zY3JvbGxNYXhUb3AgOiAoeSA8IDApID8gMCA6IHk7XHJcbiAgICAgICAgICAgICAgICAvKiByZW1lbWJlciB0aGUgb2xkIHZhbHVlcyAqL1xyXG4gICAgICAgICAgICAgICAgdGhpcy5vcmlnaW5TY3JvbGxMZWZ0ID0gdGhpcy5nZXRTY3JvbGxMZWZ0KCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm9yaWdpblNjcm9sbFRvcCA9IHRoaXMuZ2V0U2Nyb2xsVG9wKCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoeCAhPT0gdGhpcy5nZXRTY3JvbGxMZWZ0KCkgfHwgeSAhPT0gdGhpcy5nZXRTY3JvbGxUb3AoKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMud2hlZWxPcHRpb25zLnNtb290aCAhPT0gdHJ1ZSB8fCBzbW9vdGggPT09IGZhbHNlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0U2Nyb2xsVG9wKHkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNldFNjcm9sbExlZnQoeCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmZhZGVPdXRCeUNvb3Jkcyh4LCB5KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgKiBSZWdpc3RlciBjdXN0b20gZXZlbnQgY2FsbGJhY2tzXHJcbiAgICAgICAgICAgICAqXHJcbiAgICAgICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBldmVudCAtIFRoZSBldmVudCBuYW1lXHJcbiAgICAgICAgICAgICAqIEBwYXJhbSB7KGU6IEV2ZW50KSA9PiBhbnl9IGNhbGxiYWNrIC0gQSBjYWxsYmFjayBmdW5jdGlvbiB0byBleGVjdXRlIHdoZW4gdGhlIGV2ZW50IHJhaXNlc1xyXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHtad29vc2h9IC0gVGhlIFp3b29zaCBvYmplY3QgaW5zdGFuY2VcclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIFp3b29zaC5wcm90b3R5cGUub24gPSBmdW5jdGlvbiAoZXZlbnQsIGNhbGxiYWNrKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIodGhpcy5pbm5lciwgZXZlbnQsIGNhbGxiYWNrKTtcclxuICAgICAgICAgICAgICAgIC8qIHNldCB0aGUgZXZlbnQgdW50cmlnZ2VyZWQgYW5kIGNhbGwgdGhlIGZ1bmN0aW9uLCB0byByZXRyaWdnZXIgbWV0IGV2ZW50cyAqL1xyXG4gICAgICAgICAgICAgICAgdmFyIGYgPSBldmVudC5yZXBsYWNlKC9cXC4oW2Etel0pLywgU3RyaW5nLmNhbGwuYmluZChldmVudC50b1VwcGVyQ2FzZSkpLnJlcGxhY2UoL1xcLi8sICcnKTtcclxuICAgICAgICAgICAgICAgIHRoaXMudHJpZ2dlcmVkW2ZdID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm9uU2Nyb2xsKCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgICAqIERlcmVnaXN0ZXIgY3VzdG9tIGV2ZW50IGNhbGxiYWNrc1xyXG4gICAgICAgICAgICAgKlxyXG4gICAgICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnQgLSBUaGUgZXZlbnQgbmFtZVxyXG4gICAgICAgICAgICAgKiBAcGFyYW0geyhlOiBFdmVudCkgPT4gYW55fSBjYWxsYmFjayAtIEEgY2FsbGJhY2sgZnVuY3Rpb24gdG8gZXhlY3V0ZSB3aGVuIHRoZSBldmVudCByYWlzZXNcclxuICAgICAgICAgICAgICogQHJldHVybiB7Wndvb3NofSAtIFRoZSBad29vc2ggb2JqZWN0IGluc3RhbmNlXHJcbiAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLm9mZiA9IGZ1bmN0aW9uIChldmVudCwgY2FsbGJhY2spIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucmVtb3ZlRXZlbnRMaXN0ZW5lcih0aGlzLmlubmVyLCBldmVudCwgY2FsbGJhY2spO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgKiBSZXZlcnQgYWxsIERPTSBtYW5pcHVsYXRpb25zIGFuZCBkZXJlZ2lzdGVyIGFsbCBldmVudCBoYW5kbGVyc1xyXG4gICAgICAgICAgICAgKlxyXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHt2b2lkfVxyXG4gICAgICAgICAgICAgKiBAVE9ETzogcmVtb3Zpbmcgd2hlZWxab29tSGFuZGxlciBkb2VzIG5vdCB3b3JrXHJcbiAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgeCA9IHRoaXMuZ2V0U2Nyb2xsTGVmdCgpO1xyXG4gICAgICAgICAgICAgICAgdmFyIHkgPSB0aGlzLmdldFNjcm9sbFRvcCgpO1xyXG4gICAgICAgICAgICAgICAgLyogcmVtb3ZlIHRoZSBvdXRlciBhbmQgZ3JhYiBDU1MgY2xhc3NlcyAqL1xyXG4gICAgICAgICAgICAgICAgdmFyIHJlID0gbmV3IFJlZ0V4cChcIiBcIiArIHRoaXMuY2xhc3NPdXRlciArIFwiIFwiKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuY29udGFpbmVyLmNsYXNzTmFtZSA9IHRoaXMuY29udGFpbmVyLmNsYXNzTmFtZS5yZXBsYWNlKHJlLCAnJyk7XHJcbiAgICAgICAgICAgICAgICB2YXIgcmUgPSBuZXcgUmVnRXhwKFwiIFwiICsgdGhpcy5jbGFzc0dyYWIgKyBcIiBcIik7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmlubmVyLmNsYXNzTmFtZSA9IHRoaXMuaW5uZXIuY2xhc3NOYW1lLnJlcGxhY2UocmUsICcnKTtcclxuICAgICAgICAgICAgICAgIHZhciByZSA9IG5ldyBSZWdFeHAoXCIgXCIgKyB0aGlzLmNsYXNzTm9HcmFiICsgXCIgXCIpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jb250YWluZXIuY2xhc3NOYW1lID0gdGhpcy5jb250YWluZXIuY2xhc3NOYW1lLnJlcGxhY2UocmUsICcnKTtcclxuICAgICAgICAgICAgICAgIC8qIG1vdmUgYWxsIGNoaWxkTm9kZXMgYmFjayB0byB0aGUgb2xkIG91dGVyIGVsZW1lbnQgYW5kIHJlbW92ZSB0aGUgaW5uZXIgZWxlbWVudCAqL1xyXG4gICAgICAgICAgICAgICAgd2hpbGUgKHRoaXMuaW5uZXIuY2hpbGROb2Rlcy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jb250YWluZXIuYXBwZW5kQ2hpbGQodGhpcy5pbm5lci5jaGlsZE5vZGVzWzBdKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHRoaXMuc2NhbGVFbGVtZW50LnJlbW92ZUNoaWxkKHRoaXMuaW5uZXIpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jb250YWluZXIucmVtb3ZlQ2hpbGQodGhpcy5zY2FsZUVsZW1lbnQpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zY3JvbGxUbyh4LCB5LCBmYWxzZSk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm1vdXNlTW92ZUhhbmRsZXIgPyB0aGlzLnJlbW92ZUV2ZW50TGlzdGVuZXIoZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LCAnbW91c2Vtb3ZlJywgdGhpcy5tb3VzZU1vdmVIYW5kbGVyKSA6IG51bGw7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm1vdXNlVXBIYW5kbGVyID8gdGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCwgJ21vdXNldXAnLCB0aGlzLm1vdXNlVXBIYW5kbGVyKSA6IG51bGw7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm1vdXNlRG93bkhhbmRsZXIgPyB0aGlzLnJlbW92ZUV2ZW50TGlzdGVuZXIodGhpcy5pbm5lciwgJ21vdXNlZG93bicsIHRoaXMubW91c2VEb3duSGFuZGxlcikgOiBudWxsO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5tb3VzZVNjcm9sbEhhbmRsZXIgPyB0aGlzLnJlbW92ZUV2ZW50TGlzdGVuZXIodGhpcy5zY3JvbGxFbGVtZW50LCAnd2hlZWwnLCB0aGlzLm1vdXNlU2Nyb2xsSGFuZGxlcikgOiBudWxsO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5tb3VzZVpvb21IYW5kbGVyID8gdGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKHRoaXMuc2Nyb2xsRWxlbWVudCwgJ3doZWVsJywgdGhpcy5tb3VzZVpvb21IYW5kbGVyKSA6IG51bGw7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmhhc2hDaGFuZ2VIYW5kbGVyID8gdGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKHdpbmRvdywgJ215aGFzaGNoYW5nZScsIHRoaXMuaGFzaENoYW5nZUhhbmRsZXIpIDogbnVsbDtcclxuICAgICAgICAgICAgICAgIHRoaXMuaGFzaENoYW5nZUhhbmRsZXIgPyB0aGlzLnJlbW92ZUV2ZW50TGlzdGVuZXIod2luZG93LCAnaGFzaGNoYW5nZScsIHRoaXMuaGFzaENoYW5nZUhhbmRsZXIpIDogbnVsbDtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmhhc2hDaGFuZ2VDbGlja0hhbmRsZXIpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgbGlua3MgPSB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yQWxsKFwiYVtocmVmXj0nIyddXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGlua3MubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKGxpbmtzW2ldLCAnY2xpY2snLCB0aGlzLmhhc2hDaGFuZ2VDbGlja0hhbmRsZXIpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsRWxlbWVudCA/IHRoaXMuc2Nyb2xsRWxlbWVudC5vbm1vdXNld2hlZWwgPSBudWxsIDogbnVsbDtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsRWxlbWVudCA/IHRoaXMuc2Nyb2xsRWxlbWVudC5vbnNjcm9sbCA9IG51bGwgOiBudWxsO1xyXG4gICAgICAgICAgICAgICAgd2luZG93Lm9ucmVzaXplID0gbnVsbDtcclxuICAgICAgICAgICAgICAgIC8qIHJlbW92ZSBhbGwgY3VzdG9tIGV2ZW50bGlzdGVuZXJzIGF0dGFjaGVkIHZpYSBvbigpICovXHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBldmVudCBpbiB0aGlzLmN1c3RvbUV2ZW50cykge1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGMgaW4gdGhpcy5jdXN0b21FdmVudHNbZXZlbnRdKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVtb3ZlRXZlbnRMaXN0ZW5lcih0aGlzLmlubmVyLCBldmVudCwgdGhpcy5jdXN0b21FdmVudHNbZXZlbnRdW2NdWzBdKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIHJldHVybiBad29vc2g7XHJcbiAgICAgICAgfSgpKTtcclxuICAgICAgICAvKiByZXR1cm4gYW4gaW5zdGFuY2Ugb2YgdGhlIGNsYXNzICovXHJcbiAgICAgICAgcmV0dXJuIG5ldyBad29vc2goY29udGFpbmVyLCBvcHRpb25zKTtcclxuICAgIH1cclxuICAgIHJldHVybiB6d29vc2g7XHJcbn0pO1xyXG4vLyMgc291cmNlTWFwcGluZ1VSTD16d29vc2guanMubWFwIl19
