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
            Zwoosh.prototype.init = function () {
                var _this = this;
                this.isBody = this.container.tagName == "BODY" ? true : false;
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
                this.container.className += " " + this.classOuter + " ";
                //this.scrollElement = this.isBody ? document.documentElement : this.container;
                this.scrollElement = this.container;
                var x = this.getScrollLeft();
                var y = this.getScrollTop();
                /* create inner div element and append it to the container with its contents in it */
                this.inner = document.createElement("div");
                //var uniqueClass = this.classInner + "-" + Math.random().toString(36).substring(7);
                this.inner.className += " " + this.classInner + " " + this.classUnique + " ";
                this.scaleElement = document.createElement("div");
                this.scaleElement.className += " " + this.classScale + " ";
                this.scaleElement.appendChild(this.inner);
                /* move all childNodes to the new inner element */
                while (this.container.childNodes.length > 0) {
                    this.inner.appendChild(this.container.childNodes[0]);
                }
                this.container.appendChild(this.scaleElement);
                this.inner.style.minWidth = (this.container.scrollWidth - this.getBorderWidth(this.container)) + 'px';
                this.inner.style.minHeight = (this.container.scrollHeight - this.getBorderWidth(this.container)) + 'px';
                this.scaleElement.style.minWidth = this.inner.style.minWidth;
                this.scaleElement.style.minHeight = this.inner.style.minHeight;
                this.scaleElement.style.overflow = 'hidden';
                /* show the grid only if at least one of the grid values is not 1 */
                if ((this.options.gridX != 1 || this.options.gridY != 1) && this.options.gridShow) {
                    var bgi = [];
                    this.options.gridX != 1 ? bgi.push('linear-gradient(to right, grey 1px, transparent 1px)') : null;
                    this.options.gridY != 1 ? bgi.push('linear-gradient(to bottom, grey 1px, transparent 1px)') : null;
                    this.addBeforeCSS(this.classUnique, 'width', this.inner.style.minWidth);
                    this.addBeforeCSS(this.classUnique, 'height', this.inner.style.minHeight);
                    this.addBeforeCSS(this.classUnique, 'left', '-' + this.getStyle(this.container, 'paddingLeft'));
                    this.addBeforeCSS(this.classUnique, 'top', '-' + this.getStyle(this.container, 'paddingTop'));
                    this.addBeforeCSS(this.classUnique, 'background-size', (this.options.gridX != 1 ? this.options.gridX + 'px ' : 'auto ') + (this.options.gridY != 1 ? this.options.gridY + 'px' : 'auto'));
                    this.addBeforeCSS(this.classUnique, 'background-image', bgi.join(', '));
                }
                this.oldClientWidth = document.documentElement.clientWidth;
                this.oldClientHeight = document.documentElement.clientHeight;
                /* just call the function, to trigger possible events */
                this.onScroll();
                /* scroll to the initial position */
                this.scrollTo(x, y);
                /* Event handler registration start here */
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
                /* TODO: needed, when gridShow is true */
                this.options.gridShow ? this.scaleTo(1) : null;
                /* wheelzoom */
                if (this.options.wheelZoom === true) {
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
                if (this.options.dragScroll === true) {
                    this.inner.className += " " + this.classGrab + " ";
                    this.mouseDownHandler = function (e) { return _this.mouseDown(e); };
                    this.addEventListener(this.inner, 'mousedown', this.mouseDownHandler);
                }
                else {
                    this.container.className += " " + this.classNoGrab + " ";
                }
                if (this.options.handleAnchors === true) {
                    var links = this.container.querySelectorAll("a[href^='#']");
                    this.hashChangeClickHandler = function (e) {
                        var target = e ? e.target : window.event.srcElement;
                        if (typeof target != 'undefined') {
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
                if (hash != '') {
                    var anchors = this.container.querySelectorAll('#' + hash);
                    for (var i = 0; i < anchors.length; i++) {
                        var element = anchors[i];
                        var container = anchors[i];
                        // find the next parent which is a container element
                        var outerRe = new RegExp(" " + this.classOuter + " ");
                        var nextContainer = element;
                        while (container && container.parentElement && this.container != container) {
                            if (container.className.match(outerRe)) {
                                nextContainer = container;
                            }
                            container = container.parentElement;
                        }
                        if (e != null) {
                            if (e.type == 'hashchange') {
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
             * @param {HTMLElement} el - the HTML element
             * @return {number} - the amount of pixels
             */
            Zwoosh.prototype.getBorderWidth = function (el) {
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
             * @param {HTMLElement} el - the HTML element
             * @return {number} - the amount of pixels
             */
            Zwoosh.prototype.getBorderHeight = function (el) {
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
                    if (this.options.wheelOptions.direction == 'vertical' && this.hasScrollbar(this.scrollElement, this.options.wheelOptions.direction)) {
                        if (!((this.triggered.collideBottom && direction == 'down') || (this.triggered.collideTop && direction == 'up'))) {
                            this.clearTimeouts();
                            return;
                        }
                    }
                    this.disableMouseScroll(e);
                    var x = this.getScrollLeft();
                    var y = this.getScrollTop();
                    if (this.options.wheelOptions.direction == 'horizontal') {
                        x = this.getScrollLeft() + (direction == 'down' ? this.options.wheelOptions.step : this.options.wheelOptions.step * -1);
                    }
                    else if (this.options.wheelOptions.direction == 'vertical') {
                        y = this.getScrollTop() + (direction == 'down' ? this.options.wheelOptions.step : this.options.wheelOptions.step * -1);
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
                    if (direction == this.options.zoomOptions.direction) {
                        var scale = this.getScale() * (1 + this.options.zoomOptions.step);
                    }
                    else {
                        var scale = this.getScale() * (1 - this.options.zoomOptions.step);
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
                if (typeof this.inner.style.transform != 'undefined') {
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
                return this.inner == elementBehindCursor;
            };
            Zwoosh.prototype.getTimestamp = function () {
                if (typeof window.performance == 'object') {
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
            Zwoosh.prototype.onResize = function (e) {
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
            Zwoosh.prototype.triggerEvent = function (obj, eventName) {
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
            Zwoosh.prototype.getStyle = function (el, jsProperty) {
                var cssProperty = jsProperty.replace(/([A-Z])/g, "-$1").toLowerCase();
                if (typeof window.getComputedStyle == 'function') {
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
                          if (found === false) {
                            return;
                          }
                        }*/
                        document.body.className += " " + this.classGrabbing + " ";
                        /* note the origin positions */
                        this.dragOriginLeft = e.clientX;
                        this.dragOriginTop = e.clientY;
                        this.dragOriginScrollLeft = this.getScrollLeft();
                        this.dragOriginScrollTop = this.getScrollTop();
                        /* it looks strange if scroll-behavior is set to smooth */
                        this.parentOriginStyle = this.inner.parentElement.style.cssText;
                        if (typeof this.inner.parentElement.style.setProperty == 'function') {
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
                this.removeEventListener(document.documentElement, 'mousemove', this.mouseMoveHandler);
                this.removeEventListener(document.documentElement, 'mouseup', this.mouseUpHandler);
                if (y != this.getScrollTop() || x != this.getScrollLeft()) {
                    var t = this.present - (this.past ? this.past : this.present);
                    if (t > 0.05) {
                        /* just align to the grid if the mouse left unmoved for more than 0.05 seconds */
                        this.scrollTo(x, y, this.options.dragOptions.fade);
                    }
                }
                if (this.options.dragOptions.fade && typeof this.vx != 'undefined' && typeof this.vy != 'undefined') {
                    var deltaT, deltaSx, deltaSy, lastDeltaSx, lastDeltaSy;
                    deltaT = deltaSx = deltaSy = lastDeltaSx = lastDeltaSy = 0;
                    for (var i in this.vy) {
                        if (parseFloat(i) > (this.present - 0.1)
                            && typeof lastT != 'undefined'
                            && typeof lastSx != 'undefined'
                            && typeof lastSy != 'undefined') {
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
                    var vx = deltaT == 0 ? 0 : lastDeltaSx > 0 ? deltaSx / deltaT : deltaSx / -deltaT;
                    var vy = deltaT == 0 ? 0 : lastDeltaSy > 0 ? deltaSy / deltaT : deltaSy / -deltaT;
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
                    })(sx, sy, me), (i + 1) * (1000 / fps)));
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
                    })(sx, sy, me), (i + 2) * (1000 / fps)));
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
                //if ((e.buttons == 0 && e.button == 0) || (typeof e.buttons == 'undefined' && e.button == 0)) {
                if (("which" in e && e.which == 0) || (typeof e.which == 'undefined' && "button" in e && e.button == 0)) {
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
                if (x != this.getScrollLeft() || y != this.getScrollTop()) {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiendvb3NoLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIoZnVuY3Rpb24gKGZhY3RvcnkpIHtcclxuICAgIGlmICh0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlLmV4cG9ydHMgPT09ICdvYmplY3QnKSB7XHJcbiAgICAgICAgdmFyIHYgPSBmYWN0b3J5KHJlcXVpcmUsIGV4cG9ydHMpOyBpZiAodiAhPT0gdW5kZWZpbmVkKSBtb2R1bGUuZXhwb3J0cyA9IHY7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcclxuICAgICAgICBkZWZpbmUoW1wicmVxdWlyZVwiLCBcImV4cG9ydHNcIl0sIGZhY3RvcnkpO1xyXG4gICAgfVxyXG59KShmdW5jdGlvbiAocmVxdWlyZSwgZXhwb3J0cykge1xyXG4gICAgXCJ1c2Ugc3RyaWN0XCI7XHJcbiAgICAvKipcclxuICAgICAqIEV4cG9ydCBmdW5jdGlvbiBvZiB0aGUgbW9kdWxlXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gY29udGFpbmVyIC0gVGhlIEhUTUxFbGVtZW50IHRvIHN3b29vb3NoIVxyXG4gICAgICogQHBhcmFtIHtPcHRpb25zfSBvcHRpb25zIC0gdGhlIG9wdGlvbnMgb2JqZWN0IHRvIGNvbmZpZ3VyZSBad29vc2hcclxuICAgICAqIEByZXR1cm4ge1p3b29zaH0gLSBad29vc2ggb2JqZWN0IGluc3RhbmNlXHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIHp3b29zaChjb250YWluZXIsIG9wdGlvbnMpIHtcclxuICAgICAgICBpZiAob3B0aW9ucyA9PT0gdm9pZCAwKSB7IG9wdGlvbnMgPSB7fTsgfVxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIFBvbHlmaWxsIGJpbmQgZnVuY3Rpb24gZm9yIG9sZGVyIGJyb3dzZXJzXHJcbiAgICAgICAgICogVGhlIGJpbmQgZnVuY3Rpb24gaXMgYW4gYWRkaXRpb24gdG8gRUNNQS0yNjIsIDV0aCBlZGl0aW9uXHJcbiAgICAgICAgICogQHNlZTogaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSmF2YVNjcmlwdC9SZWZlcmVuY2UvR2xvYmFsX09iamVjdHMvRnVuY3Rpb24vYmluZFxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIGlmICghRnVuY3Rpb24ucHJvdG90eXBlLmJpbmQpIHtcclxuICAgICAgICAgICAgRnVuY3Rpb24ucHJvdG90eXBlLmJpbmQgPSBmdW5jdGlvbiAob1RoaXMpIHtcclxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdGhpcyAhPT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIGNsb3Nlc3QgdGhpbmcgcG9zc2libGUgdG8gdGhlIEVDTUFTY3JpcHQgNVxyXG4gICAgICAgICAgICAgICAgICAgIC8vIGludGVybmFsIElzQ2FsbGFibGUgZnVuY3Rpb25cclxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdGdW5jdGlvbi5wcm90b3R5cGUuYmluZCAtIHdoYXQgaXMgdHJ5aW5nIHRvIGJlIGJvdW5kIGlzIG5vdCBjYWxsYWJsZScpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdmFyIGFBcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSwgZlRvQmluZCA9IHRoaXMsIGZOT1AgPSBmdW5jdGlvbiAoKSB7IH0sIGZCb3VuZCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZlRvQmluZC5hcHBseSh0aGlzIGluc3RhbmNlb2YgZk5PUFxyXG4gICAgICAgICAgICAgICAgICAgICAgICA/IHRoaXNcclxuICAgICAgICAgICAgICAgICAgICAgICAgOiBvVGhpcywgYUFyZ3MuY29uY2F0KEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cykpKTtcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5wcm90b3R5cGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBGdW5jdGlvbi5wcm90b3R5cGUgZG9lc24ndCBoYXZlIGEgcHJvdG90eXBlIHByb3BlcnR5XHJcbiAgICAgICAgICAgICAgICAgICAgZk5PUC5wcm90b3R5cGUgPSB0aGlzLnByb3RvdHlwZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGZCb3VuZC5wcm90b3R5cGUgPSBuZXcgZk5PUCgpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZCb3VuZDtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogUG9seWZpbGwgYXJyYXkuaW5kZXhPZiBmdW5jdGlvbiBmb3Igb2xkZXIgYnJvd3NlcnNcclxuICAgICAgICAgKiBUaGUgaW5kZXhPZigpIGZ1bmN0aW9uIHdhcyBhZGRlZCB0byB0aGUgRUNNQS0yNjIgc3RhbmRhcmQgaW4gdGhlIDV0aCBlZGl0aW9uXHJcbiAgICAgICAgICogYXMgc3VjaCBpdCBtYXkgbm90IGJlIHByZXNlbnQgaW4gYWxsIGJyb3dzZXJzLlxyXG4gICAgICAgICAqIEBzZWUgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSmF2YVNjcmlwdC9SZWZlcmVuY2UvR2xvYmFsX09iamVjdHMvQXJyYXkvaW5kZXhPZlxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIGlmICghQXJyYXkucHJvdG90eXBlLmluZGV4T2YpIHtcclxuICAgICAgICAgICAgQXJyYXkucHJvdG90eXBlLmluZGV4T2YgPSBmdW5jdGlvbiAoc2VhcmNoRWxlbWVudCwgZnJvbUluZGV4KSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgaztcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzID09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdcInRoaXNcIiBpcyBudWxsIG9yIG5vdCBkZWZpbmVkJyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB2YXIgbyA9IE9iamVjdCh0aGlzKTtcclxuICAgICAgICAgICAgICAgIHZhciBsZW4gPSBvLmxlbmd0aCA+Pj4gMDtcclxuICAgICAgICAgICAgICAgIGlmIChsZW4gPT09IDApIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gLTE7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB2YXIgbiA9ICtmcm9tSW5kZXggfHwgMDtcclxuICAgICAgICAgICAgICAgIGlmIChNYXRoLmFicyhuKSA9PT0gSW5maW5pdHkpIHtcclxuICAgICAgICAgICAgICAgICAgICBuID0gMDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChuID49IGxlbikge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAtMTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGsgPSBNYXRoLm1heChuID49IDAgPyBuIDogbGVuIC0gTWF0aC5hYnMobiksIDApO1xyXG4gICAgICAgICAgICAgICAgd2hpbGUgKGsgPCBsZW4pIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoayBpbiBvICYmIG9ba10gPT09IHNlYXJjaEVsZW1lbnQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGs7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGsrKztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiAtMTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLyogbGlzdCBvZiByZWFsIGV2ZW50cyAqL1xyXG4gICAgICAgIHZhciBodG1sRXZlbnRzID0ge1xyXG4gICAgICAgICAgICAvKiA8Ym9keT4gYW5kIDxmcmFtZXNldD4gRXZlbnRzICovXHJcbiAgICAgICAgICAgIG9ubG9hZDogMSxcclxuICAgICAgICAgICAgb251bmxvYWQ6IDEsXHJcbiAgICAgICAgICAgIC8qIEZvcm0gRXZlbnRzICovXHJcbiAgICAgICAgICAgIG9uYmx1cjogMSxcclxuICAgICAgICAgICAgb25jaGFuZ2U6IDEsXHJcbiAgICAgICAgICAgIG9uZm9jdXM6IDEsXHJcbiAgICAgICAgICAgIG9ucmVzZXQ6IDEsXHJcbiAgICAgICAgICAgIG9uc2VsZWN0OiAxLFxyXG4gICAgICAgICAgICBvbnN1Ym1pdDogMSxcclxuICAgICAgICAgICAgLyogSW1hZ2UgRXZlbnRzICovXHJcbiAgICAgICAgICAgIG9uYWJvcnQ6IDEsXHJcbiAgICAgICAgICAgIC8qIEtleWJvYXJkIEV2ZW50cyAqL1xyXG4gICAgICAgICAgICBvbmtleWRvd246IDEsXHJcbiAgICAgICAgICAgIG9ua2V5cHJlc3M6IDEsXHJcbiAgICAgICAgICAgIG9ua2V5dXA6IDEsXHJcbiAgICAgICAgICAgIC8qIE1vdXNlIEV2ZW50cyAqL1xyXG4gICAgICAgICAgICBvbmNsaWNrOiAxLFxyXG4gICAgICAgICAgICBvbmRibGNsaWNrOiAxLFxyXG4gICAgICAgICAgICBvbm1vdXNlZG93bjogMSxcclxuICAgICAgICAgICAgb25tb3VzZW1vdmU6IDEsXHJcbiAgICAgICAgICAgIG9ubW91c2VvdXQ6IDEsXHJcbiAgICAgICAgICAgIG9ubW91c2VvdmVyOiAxLFxyXG4gICAgICAgICAgICBvbm1vdXNldXA6IDFcclxuICAgICAgICB9O1xyXG4gICAgICAgIHZhciBtYXBFdmVudHMgPSB7XHJcbiAgICAgICAgICAgIG9uc2Nyb2xsOiB3aW5kb3dcclxuICAgICAgICB9O1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIFp3b29zaCBwcm92aWRlcyBhIHNldCBvZiBmdW5jdGlvbnMgdG8gaW1wbGVtZW50IHNjcm9sbCBieSBkcmFnLCB6b29tIGJ5IG1vdXNld2hlZWwsXHJcbiAgICAgICAgICogaGFzaCBsaW5rcyBpbnNpZGUgdGhlIGRvY3VtZW50IGFuZCBvdGhlciBzcGVjaWFsIHNjcm9sbCByZWxhdGVkIHJlcXVpcmVtZW50cy5cclxuICAgICAgICAgKlxyXG4gICAgICAgICAqIEBhdXRob3IgUm9tYW4gR3J1YmVyIDxwMTAyMDM4OUB5YWhvby5jb20+XHJcbiAgICAgICAgICogQHZlcnNpb24gMS4wLjFcclxuICAgICAgICAgKi9cclxuICAgICAgICB2YXIgWndvb3NoID0gKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgZnVuY3Rpb24gWndvb3NoKGNvbnRhaW5lciwgb3B0aW9ucykge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jb250YWluZXIgPSBjb250YWluZXI7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xyXG4gICAgICAgICAgICAgICAgLyogQ1NTIHN0eWxlIGNsYXNzZXMgKi9cclxuICAgICAgICAgICAgICAgIHRoaXMuY2xhc3NJbm5lciA9ICd6dy1pbm5lcic7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNsYXNzT3V0ZXIgPSAnenctb3V0ZXInO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jbGFzc0dyYWIgPSAnenctZ3JhYic7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNsYXNzTm9HcmFiID0gJ3p3LW5vZ3JhYic7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNsYXNzR3JhYmJpbmcgPSAnenctZ3JhYmJpbmcnO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jbGFzc1VuaXF1ZSA9ICd6dy0nICsgTWF0aC5yYW5kb20oKS50b1N0cmluZygzNikuc3Vic3RyaW5nKDcpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jbGFzc1NjYWxlID0gJ3p3LXNjYWxlJztcclxuICAgICAgICAgICAgICAgIHRoaXMuY2xhc3NJZ25vcmUgPSAnenctaWdub3JlJztcclxuICAgICAgICAgICAgICAgIHRoaXMuY2xhc3NGYWtlQm9keSA9ICd6dy1mYWtlYm9keSc7XHJcbiAgICAgICAgICAgICAgICAvKiBhcnJheSBob2xkaW5nIHRoZSBjdXN0b20gZXZlbnRzIG1hcHBpbmcgY2FsbGJhY2tzIHRvIGJvdW5kIGNhbGxiYWNrcyAqL1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jdXN0b21FdmVudHMgPSBbXTtcclxuICAgICAgICAgICAgICAgIHRoaXMudHJpZ2dlcmVkID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbGxpZGVMZWZ0OiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICBjb2xsaWRlVG9wOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICBjb2xsaWRlUmlnaHQ6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgICAgIGNvbGxpZGVCb3R0b206IGZhbHNlXHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgLyogZmFkZU91dCAqL1xyXG4gICAgICAgICAgICAgICAgdGhpcy50aW1lb3V0cyA9IFtdO1xyXG4gICAgICAgICAgICAgICAgdGhpcy52eCA9IFtdO1xyXG4gICAgICAgICAgICAgICAgdGhpcy52eSA9IFtdO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jb250YWluZXIgPSBjb250YWluZXI7XHJcbiAgICAgICAgICAgICAgICAvKiBzZXQgZGVmYXVsdCBvcHRpb25zICovXHJcbiAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLyogMSBtZWFucyBkbyBub3QgYWxpZ24gdG8gYSBncmlkICovXHJcbiAgICAgICAgICAgICAgICAgICAgZ3JpZFg6IDEsXHJcbiAgICAgICAgICAgICAgICAgICAgZ3JpZFk6IDEsXHJcbiAgICAgICAgICAgICAgICAgICAgLyogc2hvd3MgYSBncmlkIGFzIGFuIG92ZXJsYXkgb3ZlciB0aGUgZWxlbWVudC4gV29ya3Mgb25seSBpZiB0aGUgYnJvd3NlciBzdXBwb3J0c1xyXG4gICAgICAgICAgICAgICAgICAgICAqIENTUyBHZW5lcmF0ZWQgY29udGVudCBmb3IgcHNldWRvLWVsZW1lbnRzXHJcbiAgICAgICAgICAgICAgICAgICAgICogQHNlZSBodHRwOi8vY2FuaXVzZS5jb20vI3NlYXJjaD0lM0FiZWZvcmUgKi9cclxuICAgICAgICAgICAgICAgICAgICBncmlkU2hvdzogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgLyogd2hpY2ggZWRnZSBzaG91bGQgYmUgZWxhc3RpYyAqL1xyXG4gICAgICAgICAgICAgICAgICAgIGVsYXN0aWNFZGdlczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZWZ0OiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmlnaHQ6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0b3A6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBib3R0b206IGZhbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAvKiBhY3RpdmF0ZXMvZGVhY3RpdmF0ZXMgc2Nyb2xsaW5nIGJ5IGRyYWcgKi9cclxuICAgICAgICAgICAgICAgICAgICBkcmFnU2Nyb2xsOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgIGRyYWdPcHRpb25zOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGV4Y2x1ZGU6IFsnaW5wdXQnLCAndGV4dGFyZWEnLCAnYScsICdidXR0b24nLCAnLicgKyB0aGlzLmNsYXNzSWdub3JlLCAnc2VsZWN0J10sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG9ubHk6IFtdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBhY3RpdmF0ZXMgYSBzY3JvbGwgZmFkZSB3aGVuIHNjcm9sbGluZyBieSBkcmFnICovXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZhZGU6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIGZhZGU6IGJyYWtlIGFjY2VsZXJhdGlvbiBpbiBwaXhlbHMgcGVyIHNlY29uZCBwZXIgc2Vjb25kIChwL3PCsikgKi9cclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJha2VTcGVlZDogMjUwMCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgLyogZmFkZTogZnJhbWVzIHBlciBzZWNvbmQgb2YgdGhlIHp3b29zaCBmYWRlb3V0IGFuaW1hdGlvbiAoPj0yNSBsb29rcyBsaWtlIG1vdGlvbikgKi9cclxuICAgICAgICAgICAgICAgICAgICAgICAgZnBzOiAzMCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgLyogZmFkZTogdGhpcyBzcGVlZCB3aWxsIG5ldmVyIGJlIGV4Y2VlZGVkICovXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1heFNwZWVkOiAzMDAwLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBmYWRlOiBtaW5pbXVtIHNwZWVkIHdoaWNoIHRyaWdnZXJzIHRoZSBmYWRlICovXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1pblNwZWVkOiAzMDBcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIC8qIGFjdGl2YXRlcy9kZWFjdGl2YXRlcyBzY3JvbGxpbmcgYnkgd2hlZWwuIElmIHRoZSBkcmVpY3Rpb24gaXMgdmVydGljYWwgYW5kIHRoZXJlIGFyZVxyXG4gICAgICAgICAgICAgICAgICAgICAqIHNjcm9sbGJhcnMgcHJlc2VudCwgendvb3NoIGxldHMgbGVhdmVzIHNjcm9sbGluZyB0byB0aGUgYnJvd3Nlci4gKi9cclxuICAgICAgICAgICAgICAgICAgICB3aGVlbFNjcm9sbDogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICB3aGVlbE9wdGlvbnM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLyogZGlyZWN0aW9uIHRvIHNjcm9sbCB3aGVuIHRoZSBtb3VzZSB3aGVlbCBpcyB1c2VkICovXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpcmVjdGlvbjogJ3ZlcnRpY2FsJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgLyogYW1vdW50IG9mIHBpeGVscyBmb3Igb25lIHNjcm9sbCBzdGVwICovXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0ZXA6IDExNCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgLyogc2Nyb2xsIHNtb290aCBvciBpbnN0YW50ICovXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNtb290aDogdHJ1ZVxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgLyogYWN0aXZhdGVzL2RlYWN0aXZhdGVzIHpvb21pbmcgYnkgd2hlZWwuIFdvcmtzIG9ubHkgd2l0aCBhIENTUzMgMkQgVHJhbnNmb3JtIGNhcGFibGUgYnJvd3Nlci5cclxuICAgICAgICAgICAgICAgICAgICAgKiBAc2VlIGh0dHA6Ly9jYW5pdXNlLmNvbS8jZmVhdD10cmFuc2Zvcm1zMmQgKi9cclxuICAgICAgICAgICAgICAgICAgICB3aGVlbFpvb206IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgICAgIHpvb21PcHRpb25zOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIHRoZSBtYXhpbXVtIHNjYWxlLCAwIG1lYW5zIG5vIG1heGltdW0gKi9cclxuICAgICAgICAgICAgICAgICAgICAgICAgbWF4U2NhbGU6IDAsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIHRoZSBtaW5pbXVtIHNjYWxlLCAwIG1lYW5zIG5vIG1pbmltdW0gKi9cclxuICAgICAgICAgICAgICAgICAgICAgICAgbWluU2NhbGU6IDAsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIG9uZSBzdGVwIHdoZW4gdXNpbmcgdGhlIHdoZWVsIHRvIHpvb20gKi9cclxuICAgICAgICAgICAgICAgICAgICAgICAgc3RlcDogMC4xLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBtb3VzZSB3aGVlbCBkaXJlY3Rpb24gdG8gem9vbSBsYXJnZXIgKi9cclxuICAgICAgICAgICAgICAgICAgICAgICAgZGlyZWN0aW9uOiAndXAnXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAvKiBsZXQgendvb3NoIGhhbmRsZSBhbmNob3IgbGlua3MgdGFyZ2V0aW5nIHRvIGFuIGFuY2hvciBpbnNpZGUgb2YgdGhpcyB6d29vc2ggZWxlbWVudC5cclxuICAgICAgICAgICAgICAgICAgICAgKiB0aGUgZWxlbWVudCBvdXRzaWRlIChtYXliZSB0aGUgYm9keSkgaGFuZGxlcyBhbmNob3JzIHRvby4gSWYgeW91IHdhbnQgdG8gcHJldmVudCB0aGlzLFxyXG4gICAgICAgICAgICAgICAgICAgICAqIGFkZCB0byBib2R5IGFzIHp3b29zaCBlbGVtZW50IHRvby4gKi9cclxuICAgICAgICAgICAgICAgICAgICBoYW5kbGVBbmNob3JzOiB0cnVlXHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgLyogbWVyZ2UgdGhlIGRlZmF1bHQgb3B0aW9uIG9iamVjdHMgd2l0aCB0aGUgcHJvdmlkZWQgb25lICovXHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gb3B0aW9ucykge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLmhhc093blByb3BlcnR5KGtleSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zW2tleV0gPT0gJ29iamVjdCcpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIG9rZXkgaW4gb3B0aW9uc1trZXldKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG9wdGlvbnNba2V5XS5oYXNPd25Qcm9wZXJ0eShva2V5KSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zW2tleV1bb2tleV0gPSBvcHRpb25zW2tleV1bb2tleV07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnNba2V5XSA9IG9wdGlvbnNba2V5XTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHRoaXMuaW5pdCgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgKiBJbml0aWFsaXplIERPTSBtYW5pcHVsYXRpb25zIGFuZCBldmVudCBoYW5kbGVyc1xyXG4gICAgICAgICAgICAgKlxyXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHt2b2lkfVxyXG4gICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgWndvb3NoLnByb3RvdHlwZS5pbml0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIF90aGlzID0gdGhpcztcclxuICAgICAgICAgICAgICAgIHRoaXMuaXNCb2R5ID0gdGhpcy5jb250YWluZXIudGFnTmFtZSA9PSBcIkJPRFlcIiA/IHRydWUgOiBmYWxzZTtcclxuICAgICAgICAgICAgICAgIC8qIENocm9tZSBzb2x1dGlvbiB0byBzY3JvbGwgdGhlIGJvZHkgaXMgbm90IHJlYWxseSB2aWFibGUsIHNvIHdlIGNyZWF0ZSBhIGZha2UgYm9keVxyXG4gICAgICAgICAgICAgICAgICogZGl2IGVsZW1lbnQgdG8gc2Nyb2xsIG9uICovXHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5pc0JvZHkgPT09IHRydWUpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgcHNldWRvQm9keSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgcHNldWRvQm9keS5jbGFzc05hbWUgKz0gXCIgXCIgKyB0aGlzLmNsYXNzRmFrZUJvZHkgKyBcIiBcIjtcclxuICAgICAgICAgICAgICAgICAgICBwc2V1ZG9Cb2R5LnN0eWxlLmNzc1RleHQgPSBkb2N1bWVudC5ib2R5LnN0eWxlLmNzc1RleHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKHRoaXMuY29udGFpbmVyLmNoaWxkTm9kZXMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwc2V1ZG9Cb2R5LmFwcGVuZENoaWxkKHRoaXMuY29udGFpbmVyLmNoaWxkTm9kZXNbMF0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmNvbnRhaW5lci5hcHBlbmRDaGlsZChwc2V1ZG9Cb2R5KTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmNvbnRhaW5lciA9IHBzZXVkb0JvZHk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNvbnRhaW5lci5jbGFzc05hbWUgKz0gXCIgXCIgKyB0aGlzLmNsYXNzT3V0ZXIgKyBcIiBcIjtcclxuICAgICAgICAgICAgICAgIC8vdGhpcy5zY3JvbGxFbGVtZW50ID0gdGhpcy5pc0JvZHkgPyBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQgOiB0aGlzLmNvbnRhaW5lcjtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsRWxlbWVudCA9IHRoaXMuY29udGFpbmVyO1xyXG4gICAgICAgICAgICAgICAgdmFyIHggPSB0aGlzLmdldFNjcm9sbExlZnQoKTtcclxuICAgICAgICAgICAgICAgIHZhciB5ID0gdGhpcy5nZXRTY3JvbGxUb3AoKTtcclxuICAgICAgICAgICAgICAgIC8qIGNyZWF0ZSBpbm5lciBkaXYgZWxlbWVudCBhbmQgYXBwZW5kIGl0IHRvIHRoZSBjb250YWluZXIgd2l0aCBpdHMgY29udGVudHMgaW4gaXQgKi9cclxuICAgICAgICAgICAgICAgIHRoaXMuaW5uZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gICAgICAgICAgICAgICAgLy92YXIgdW5pcXVlQ2xhc3MgPSB0aGlzLmNsYXNzSW5uZXIgKyBcIi1cIiArIE1hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpLnN1YnN0cmluZyg3KTtcclxuICAgICAgICAgICAgICAgIHRoaXMuaW5uZXIuY2xhc3NOYW1lICs9IFwiIFwiICsgdGhpcy5jbGFzc0lubmVyICsgXCIgXCIgKyB0aGlzLmNsYXNzVW5pcXVlICsgXCIgXCI7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNjYWxlRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNjYWxlRWxlbWVudC5jbGFzc05hbWUgKz0gXCIgXCIgKyB0aGlzLmNsYXNzU2NhbGUgKyBcIiBcIjtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2NhbGVFbGVtZW50LmFwcGVuZENoaWxkKHRoaXMuaW5uZXIpO1xyXG4gICAgICAgICAgICAgICAgLyogbW92ZSBhbGwgY2hpbGROb2RlcyB0byB0aGUgbmV3IGlubmVyIGVsZW1lbnQgKi9cclxuICAgICAgICAgICAgICAgIHdoaWxlICh0aGlzLmNvbnRhaW5lci5jaGlsZE5vZGVzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmlubmVyLmFwcGVuZENoaWxkKHRoaXMuY29udGFpbmVyLmNoaWxkTm9kZXNbMF0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdGhpcy5jb250YWluZXIuYXBwZW5kQ2hpbGQodGhpcy5zY2FsZUVsZW1lbnQpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5pbm5lci5zdHlsZS5taW5XaWR0aCA9ICh0aGlzLmNvbnRhaW5lci5zY3JvbGxXaWR0aCAtIHRoaXMuZ2V0Qm9yZGVyV2lkdGgodGhpcy5jb250YWluZXIpKSArICdweCc7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmlubmVyLnN0eWxlLm1pbkhlaWdodCA9ICh0aGlzLmNvbnRhaW5lci5zY3JvbGxIZWlnaHQgLSB0aGlzLmdldEJvcmRlcldpZHRoKHRoaXMuY29udGFpbmVyKSkgKyAncHgnO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zY2FsZUVsZW1lbnQuc3R5bGUubWluV2lkdGggPSB0aGlzLmlubmVyLnN0eWxlLm1pbldpZHRoO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zY2FsZUVsZW1lbnQuc3R5bGUubWluSGVpZ2h0ID0gdGhpcy5pbm5lci5zdHlsZS5taW5IZWlnaHQ7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNjYWxlRWxlbWVudC5zdHlsZS5vdmVyZmxvdyA9ICdoaWRkZW4nO1xyXG4gICAgICAgICAgICAgICAgLyogc2hvdyB0aGUgZ3JpZCBvbmx5IGlmIGF0IGxlYXN0IG9uZSBvZiB0aGUgZ3JpZCB2YWx1ZXMgaXMgbm90IDEgKi9cclxuICAgICAgICAgICAgICAgIGlmICgodGhpcy5vcHRpb25zLmdyaWRYICE9IDEgfHwgdGhpcy5vcHRpb25zLmdyaWRZICE9IDEpICYmIHRoaXMub3B0aW9ucy5ncmlkU2hvdykge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBiZ2kgPSBbXTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMuZ3JpZFggIT0gMSA/IGJnaS5wdXNoKCdsaW5lYXItZ3JhZGllbnQodG8gcmlnaHQsIGdyZXkgMXB4LCB0cmFuc3BhcmVudCAxcHgpJykgOiBudWxsO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3B0aW9ucy5ncmlkWSAhPSAxID8gYmdpLnB1c2goJ2xpbmVhci1ncmFkaWVudCh0byBib3R0b20sIGdyZXkgMXB4LCB0cmFuc3BhcmVudCAxcHgpJykgOiBudWxsO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkQmVmb3JlQ1NTKHRoaXMuY2xhc3NVbmlxdWUsICd3aWR0aCcsIHRoaXMuaW5uZXIuc3R5bGUubWluV2lkdGgpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkQmVmb3JlQ1NTKHRoaXMuY2xhc3NVbmlxdWUsICdoZWlnaHQnLCB0aGlzLmlubmVyLnN0eWxlLm1pbkhlaWdodCk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGRCZWZvcmVDU1ModGhpcy5jbGFzc1VuaXF1ZSwgJ2xlZnQnLCAnLScgKyB0aGlzLmdldFN0eWxlKHRoaXMuY29udGFpbmVyLCAncGFkZGluZ0xlZnQnKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGRCZWZvcmVDU1ModGhpcy5jbGFzc1VuaXF1ZSwgJ3RvcCcsICctJyArIHRoaXMuZ2V0U3R5bGUodGhpcy5jb250YWluZXIsICdwYWRkaW5nVG9wJykpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkQmVmb3JlQ1NTKHRoaXMuY2xhc3NVbmlxdWUsICdiYWNrZ3JvdW5kLXNpemUnLCAodGhpcy5vcHRpb25zLmdyaWRYICE9IDEgPyB0aGlzLm9wdGlvbnMuZ3JpZFggKyAncHggJyA6ICdhdXRvICcpICsgKHRoaXMub3B0aW9ucy5ncmlkWSAhPSAxID8gdGhpcy5vcHRpb25zLmdyaWRZICsgJ3B4JyA6ICdhdXRvJykpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkQmVmb3JlQ1NTKHRoaXMuY2xhc3NVbmlxdWUsICdiYWNrZ3JvdW5kLWltYWdlJywgYmdpLmpvaW4oJywgJykpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdGhpcy5vbGRDbGllbnRXaWR0aCA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRXaWR0aDtcclxuICAgICAgICAgICAgICAgIHRoaXMub2xkQ2xpZW50SGVpZ2h0ID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudEhlaWdodDtcclxuICAgICAgICAgICAgICAgIC8qIGp1c3QgY2FsbCB0aGUgZnVuY3Rpb24sIHRvIHRyaWdnZXIgcG9zc2libGUgZXZlbnRzICovXHJcbiAgICAgICAgICAgICAgICB0aGlzLm9uU2Nyb2xsKCk7XHJcbiAgICAgICAgICAgICAgICAvKiBzY3JvbGwgdG8gdGhlIGluaXRpYWwgcG9zaXRpb24gKi9cclxuICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsVG8oeCwgeSk7XHJcbiAgICAgICAgICAgICAgICAvKiBFdmVudCBoYW5kbGVyIHJlZ2lzdHJhdGlvbiBzdGFydCBoZXJlICovXHJcbiAgICAgICAgICAgICAgICAvKiBUT0RPOiBub3QgMiBkaWZmZXJlbnQgZXZlbnQgaGFuZGxlcnMgcmVnaXN0cmF0aW9ucyAtPiBkbyBpdCBpbiB0aGlzLmFkZEV2ZW50TGlzdGVuZXIoKSAqL1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy53aGVlbFNjcm9sbCA9PT0gZmFsc2UpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm1vdXNlU2Nyb2xsSGFuZGxlciA9IGZ1bmN0aW9uIChlKSB7IHJldHVybiBfdGhpcy5kaXNhYmxlTW91c2VTY3JvbGwoZSk7IH07XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zY3JvbGxFbGVtZW50Lm9ubW91c2V3aGVlbCA9IHRoaXMubW91c2VTY3JvbGxIYW5kbGVyO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcih0aGlzLnNjcm9sbEVsZW1lbnQsICd3aGVlbCcsIHRoaXMubW91c2VTY3JvbGxIYW5kbGVyKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHRoaXMub3B0aW9ucy53aGVlbFNjcm9sbCA9PT0gdHJ1ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubW91c2VTY3JvbGxIYW5kbGVyID0gZnVuY3Rpb24gKGUpIHsgcmV0dXJuIF90aGlzLmFjdGl2ZU1vdXNlU2Nyb2xsKGUpOyB9O1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsRWxlbWVudC5vbm1vdXNld2hlZWwgPSB0aGlzLm1vdXNlU2Nyb2xsSGFuZGxlcjtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIodGhpcy5zY3JvbGxFbGVtZW50LCAnd2hlZWwnLCB0aGlzLm1vdXNlU2Nyb2xsSGFuZGxlcik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAvKiBUT0RPOiBuZWVkZWQsIHdoZW4gZ3JpZFNob3cgaXMgdHJ1ZSAqL1xyXG4gICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zLmdyaWRTaG93ID8gdGhpcy5zY2FsZVRvKDEpIDogbnVsbDtcclxuICAgICAgICAgICAgICAgIC8qIHdoZWVsem9vbSAqL1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy53aGVlbFpvb20gPT09IHRydWUpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm1vdXNlWm9vbUhhbmRsZXIgPSBmdW5jdGlvbiAoZSkgeyByZXR1cm4gX3RoaXMuYWN0aXZlTW91c2Vab29tKGUpOyB9O1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcih0aGlzLnNjcm9sbEVsZW1lbnQsICd3aGVlbCcsIHRoaXMubW91c2Vab29tSGFuZGxlcik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAvKiBzY3JvbGxoYW5kbGVyICovXHJcbiAgICAgICAgICAgICAgICB0aGlzLnNjcm9sbEhhbmRsZXIgPSBmdW5jdGlvbiAoZSkgeyByZXR1cm4gX3RoaXMub25TY3JvbGwoZSk7IH07XHJcbiAgICAgICAgICAgICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIodGhpcy5jb250YWluZXIsICdzY3JvbGwnLCB0aGlzLnNjcm9sbEhhbmRsZXIpO1xyXG4gICAgICAgICAgICAgICAgLyogaWYgdGhlIHNjcm9sbCBlbGVtZW50IGlzIGJvZHksIGFkanVzdCB0aGUgaW5uZXIgZGl2IHdoZW4gcmVzaXppbmcgKi9cclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmlzQm9keSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVzaXplSGFuZGxlciA9IGZ1bmN0aW9uIChlKSB7IHJldHVybiBfdGhpcy5vblJlc2l6ZShlKTsgfTsgLy9UT0RPOiBzYW1lIGFzIGFib3ZlIGluIHRoZSB3aGVlbCBoYW5kbGVyXHJcbiAgICAgICAgICAgICAgICAgICAgd2luZG93Lm9ucmVzaXplID0gdGhpcy5yZXNpemVIYW5kbGVyO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgLyogaWYgZHJhZ3Njcm9sbCBpcyBhY3RpdmF0ZWQsIHJlZ2lzdGVyIG1vdXNlZG93biBldmVudCAqL1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5kcmFnU2Nyb2xsID09PSB0cnVlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pbm5lci5jbGFzc05hbWUgKz0gXCIgXCIgKyB0aGlzLmNsYXNzR3JhYiArIFwiIFwiO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubW91c2VEb3duSGFuZGxlciA9IGZ1bmN0aW9uIChlKSB7IHJldHVybiBfdGhpcy5tb3VzZURvd24oZSk7IH07XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKHRoaXMuaW5uZXIsICdtb3VzZWRvd24nLCB0aGlzLm1vdXNlRG93bkhhbmRsZXIpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jb250YWluZXIuY2xhc3NOYW1lICs9IFwiIFwiICsgdGhpcy5jbGFzc05vR3JhYiArIFwiIFwiO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5oYW5kbGVBbmNob3JzID09PSB0cnVlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGxpbmtzID0gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvckFsbChcImFbaHJlZl49JyMnXVwiKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmhhc2hDaGFuZ2VDbGlja0hhbmRsZXIgPSBmdW5jdGlvbiAoZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgdGFyZ2V0ID0gZSA/IGUudGFyZ2V0IDogd2luZG93LmV2ZW50LnNyY0VsZW1lbnQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdGFyZ2V0ICE9ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBwdXNoU3RhdGUgY2hhbmdlcyB0aGUgaGFzaCB3aXRob3V0IHRyaWdnZXJpbmcgaGFzaGNoYW5nZSAqL1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGlzdG9yeS5wdXNoU3RhdGUoe30sICcnLCB0YXJnZXQuaHJlZik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiB3ZSBkb24ndCB3YW50IHRvIHRyaWdnZXIgaGFzaGNoYW5nZSwgc28gcHJldmVudCBkZWZhdWx0IGJlaGF2aW9yIHdoZW4gY2xpY2tpbmcgb24gYW5jaG9yIGxpbmtzICovXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0ID8gZS5wcmV2ZW50RGVmYXVsdCgpIDogKGUucmV0dXJuVmFsdWUgPSBmYWxzZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgLyogdHJpZ2dlciBhIGN1c3RvbSBoYXNoY2hhbmdlIGV2ZW50LCBiZWNhdXNlIHB1c2hTdGF0ZSBwcmV2ZW50cyB0aGUgcmVhbCBoYXNoY2hhbmdlIGV2ZW50ICovXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIF90aGlzLnRyaWdnZXJFdmVudCh3aW5kb3csICdteWhhc2hjaGFuZ2UnKTtcclxuICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgIC8qIGxvb3AgdHJvdWdoIGFsbCBhbmNob3IgbGlua3MgaW4gdGhlIGVsZW1lbnQgYW5kIGRpc2FibGUgdGhlbSB0byBwcmV2ZW50IHRoZVxyXG4gICAgICAgICAgICAgICAgICAgICAqIGJyb3dzZXIgZnJvbSBzY3JvbGxpbmcgYmVjYXVzZSBvZiB0aGUgY2hhbmdpbmcgaGFzaCB2YWx1ZS4gSW5zdGVhZCB0aGUgb3duXHJcbiAgICAgICAgICAgICAgICAgICAgICogZXZlbnQgbXloYXNoY2hhbmdlIHNob3VsZCBoYW5kbGUgcGFnZSBhbmQgZWxlbWVudCBzY3JvbGxpbmcgKi9cclxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxpbmtzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcihsaW5rc1tpXSwgJ2NsaWNrJywgdGhpcy5oYXNoQ2hhbmdlQ2xpY2tIYW5kbGVyLCBmYWxzZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaGFzaENoYW5nZUhhbmRsZXIgPSBmdW5jdGlvbiAoZSkgeyByZXR1cm4gX3RoaXMub25IYXNoQ2hhbmdlKGUpOyB9O1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcih3aW5kb3csICdteWhhc2hjaGFuZ2UnLCB0aGlzLmhhc2hDaGFuZ2VIYW5kbGVyKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIod2luZG93LCAnaGFzaGNoYW5nZScsIHRoaXMuaGFzaENoYW5nZUhhbmRsZXIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMub25IYXNoQ2hhbmdlKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgKiBSZWluaXRpYWxpemUgdGhlIHp3b29zaCBlbGVtZW50XHJcbiAgICAgICAgICAgICAqXHJcbiAgICAgICAgICAgICAqIEByZXR1cm4ge1p3b29zaH0gLSBUaGUgWndvb3NoIG9iamVjdCBpbnN0YW5jZVxyXG4gICAgICAgICAgICAgKiBAVE9ETzogcHJlc2VydmUgc2Nyb2xsIHBvc2l0aW9uIGluIGluaXQoKVxyXG4gICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgWndvb3NoLnByb3RvdHlwZS5yZWluaXQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRlc3Ryb3koKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuY2xhc3NVbmlxdWUgPSAnenctJyArIE1hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpLnN1YnN0cmluZyg3KTtcclxuICAgICAgICAgICAgICAgIHRoaXMuaW5pdCgpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIC8qIEBUT0RPOiBTY3JvbGxXaWR0aCBhbmQgQ2xpZW50V2lkdGggU2Nyb2xsSGVpZ2h0IENsaWVudEhlaWdodCAqL1xyXG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLmdldFNjcm9sbExlZnQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zY3JvbGxFbGVtZW50LnNjcm9sbExlZnQ7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIFp3b29zaC5wcm90b3R5cGUuc2V0U2Nyb2xsTGVmdCA9IGZ1bmN0aW9uIChsZWZ0KSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNjcm9sbEVsZW1lbnQuc2Nyb2xsTGVmdCA9IGxlZnQ7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIFp3b29zaC5wcm90b3R5cGUuZ2V0U2Nyb2xsVG9wID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuc2Nyb2xsRWxlbWVudC5zY3JvbGxUb3A7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIFp3b29zaC5wcm90b3R5cGUuc2V0U2Nyb2xsVG9wID0gZnVuY3Rpb24gKHRvcCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zY3JvbGxFbGVtZW50LnNjcm9sbFRvcCA9IHRvcDtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgICAqIEhhbmRsZSBoYXNoY2hhbmdlcyB3aXRoIG93biBzY3JvbGwgZnVuY3Rpb25cclxuICAgICAgICAgICAgICpcclxuICAgICAgICAgICAgICogQHBhcmFtIHtFdmVudH0gZSAtIHRoZSBoYXNoY2hhbmdlIG9yIG15aGFzaGNoYW5nZSBldmVudCwgb3Igbm90aGluZ1xyXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHt2b2lkfVxyXG4gICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgWndvb3NoLnByb3RvdHlwZS5vbkhhc2hDaGFuZ2UgPSBmdW5jdGlvbiAoZSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKGUgPT09IHZvaWQgMCkgeyBlID0gbnVsbDsgfVxyXG4gICAgICAgICAgICAgICAgdmFyIGhhc2ggPSB3aW5kb3cubG9jYXRpb24uaGFzaC5zdWJzdHIoMSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoaGFzaCAhPSAnJykge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBhbmNob3JzID0gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvckFsbCgnIycgKyBoYXNoKTtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFuY2hvcnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGVsZW1lbnQgPSBhbmNob3JzW2ldO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgY29udGFpbmVyID0gYW5jaG9yc1tpXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZmluZCB0aGUgbmV4dCBwYXJlbnQgd2hpY2ggaXMgYSBjb250YWluZXIgZWxlbWVudFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgb3V0ZXJSZSA9IG5ldyBSZWdFeHAoXCIgXCIgKyB0aGlzLmNsYXNzT3V0ZXIgKyBcIiBcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBuZXh0Q29udGFpbmVyID0gZWxlbWVudDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgd2hpbGUgKGNvbnRhaW5lciAmJiBjb250YWluZXIucGFyZW50RWxlbWVudCAmJiB0aGlzLmNvbnRhaW5lciAhPSBjb250YWluZXIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjb250YWluZXIuY2xhc3NOYW1lLm1hdGNoKG91dGVyUmUpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV4dENvbnRhaW5lciA9IGNvbnRhaW5lcjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRhaW5lciA9IGNvbnRhaW5lci5wYXJlbnRFbGVtZW50O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlLnR5cGUgPT0gJ2hhc2hjaGFuZ2UnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogc2Nyb2xsaW5nIGluc3RhbnRseSBiYWNrIHRvIG9yaWdpbiwgYmVmb3JlIGRvIHRoZSBhbmltYXRlZCBzY3JvbGwgKi9cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNjcm9sbFRvKHRoaXMub3JpZ2luU2Nyb2xsTGVmdCwgdGhpcy5vcmlnaW5TY3JvbGxUb3AsIGZhbHNlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNjcm9sbFRvRWxlbWVudChuZXh0Q29udGFpbmVyKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgICAqIFNjcm9sbCB0byBhbiBlbGVtZW50IGluIHRoZSBET01cclxuICAgICAgICAgICAgICpcclxuICAgICAgICAgICAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWxlbWVudCAtIHRoZSBIVE1MRWxlbWVudCB0byBzY3JvbGwgdG9cclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIFp3b29zaC5wcm90b3R5cGUuc2Nyb2xsVG9FbGVtZW50ID0gZnVuY3Rpb24gKGVsZW1lbnQpIHtcclxuICAgICAgICAgICAgICAgIC8qIGdldCByZWxhdGl2ZSBjb29yZHMgZnJvbSB0aGUgYW5jaG9yIGVsZW1lbnQgKi9cclxuICAgICAgICAgICAgICAgIHZhciB4ID0gKGVsZW1lbnQub2Zmc2V0TGVmdCAtIHRoaXMuY29udGFpbmVyLm9mZnNldExlZnQpICogdGhpcy5nZXRTY2FsZSgpO1xyXG4gICAgICAgICAgICAgICAgdmFyIHkgPSAoZWxlbWVudC5vZmZzZXRUb3AgLSB0aGlzLmNvbnRhaW5lci5vZmZzZXRUb3ApICogdGhpcy5nZXRTY2FsZSgpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zY3JvbGxUbyh4LCB5KTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgICAqIFdvcmthcm91bmQgdG8gbWFuaXB1bGF0ZSA6OmJlZm9yZSBDU1Mgc3R5bGVzIHdpdGggamF2YXNjcmlwdFxyXG4gICAgICAgICAgICAgKlxyXG4gICAgICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gY3NzQ2xhc3MgLSB0aGUgQ1NTIGNsYXNzIG5hbWUgdG8gYWRkIDo6YmVmb3JlIHByb3BlcnRpZXNcclxuICAgICAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGNzc1Byb3BlcnR5IC0gdGhlIENTUyBwcm9wZXJ0eSB0byBzZXRcclxuICAgICAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGNzc1ZhbHVlIC0gdGhlIENTUyB2YWx1ZSB0byBzZXRcclxuICAgICAgICAgICAgICogQHJldHVybiB7dm9pZH1cclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIFp3b29zaC5wcm90b3R5cGUuYWRkQmVmb3JlQ1NTID0gZnVuY3Rpb24gKGNzc0NsYXNzLCBjc3NQcm9wZXJ0eSwgY3NzVmFsdWUpIHtcclxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgZG9jdW1lbnQuc3R5bGVTaGVldHNbMF0uaW5zZXJ0UnVsZSA9PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQuc3R5bGVTaGVldHNbMF0uaW5zZXJ0UnVsZSgnLicgKyBjc3NDbGFzcyArICc6OmJlZm9yZSB7ICcgKyBjc3NQcm9wZXJ0eSArICc6ICcgKyBjc3NWYWx1ZSArICd9JywgMCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIGlmICh0eXBlb2YgZG9jdW1lbnQuc3R5bGVTaGVldHNbMF0uYWRkUnVsZSA9PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQuc3R5bGVTaGVldHNbMF0uYWRkUnVsZSgnLicgKyBjc3NDbGFzcyArICc6OmJlZm9yZScsIGNzc1Byb3BlcnR5ICsgJzogJyArIGNzc1ZhbHVlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgICAqIEdldCBjb21wdXRlIHBpeGVsIG51bWJlciBvZiB0aGUgd2hvbGUgd2lkdGggb2YgYW4gZWxlbWVudHMgYm9yZGVyXHJcbiAgICAgICAgICAgICAqXHJcbiAgICAgICAgICAgICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsIC0gdGhlIEhUTUwgZWxlbWVudFxyXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHtudW1iZXJ9IC0gdGhlIGFtb3VudCBvZiBwaXhlbHNcclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIFp3b29zaC5wcm90b3R5cGUuZ2V0Qm9yZGVyV2lkdGggPSBmdW5jdGlvbiAoZWwpIHtcclxuICAgICAgICAgICAgICAgIHZhciBibCA9IHRoaXMuZ2V0U3R5bGUoZWwsICdib3JkZXJMZWZ0V2lkdGgnKTtcclxuICAgICAgICAgICAgICAgIGJsID0gYmwgPT0gJ3RoaW4nID8gMSA6IGJsID09ICdtZWRpdW0nID8gMyA6IGJsID09ICd0aGljaycgPyA1IDogcGFyc2VJbnQoYmwsIDEwKSAhPSBOYU4gPyBwYXJzZUludChibCwgMTApIDogMDtcclxuICAgICAgICAgICAgICAgIHZhciBiciA9IHRoaXMuZ2V0U3R5bGUoZWwsICdib3JkZXJSaWdodFdpZHRoJyk7XHJcbiAgICAgICAgICAgICAgICBiciA9IGJyID09ICd0aGluJyA/IDEgOiBiciA9PSAnbWVkaXVtJyA/IDMgOiBiciA9PSAndGhpY2snID8gNSA6IHBhcnNlSW50KGJyLCAxMCkgIT0gTmFOID8gcGFyc2VJbnQoYnIsIDEwKSA6IDA7XHJcbiAgICAgICAgICAgICAgICB2YXIgcGwgPSB0aGlzLmdldFN0eWxlKGVsLCAncGFkZGluZ0xlZnQnKTtcclxuICAgICAgICAgICAgICAgIHBsID0gcGwgPT0gJ2F1dG8nID8gMCA6IHBhcnNlSW50KHBsLCAxMCkgIT0gTmFOID8gcGFyc2VJbnQocGwsIDEwKSA6IDA7XHJcbiAgICAgICAgICAgICAgICB2YXIgcHIgPSB0aGlzLmdldFN0eWxlKGVsLCAncGFkZGluZ1JpZ2h0Jyk7XHJcbiAgICAgICAgICAgICAgICBwciA9IHByID09ICdhdXRvJyA/IDAgOiBwYXJzZUludChwciwgMTApICE9IE5hTiA/IHBhcnNlSW50KHByLCAxMCkgOiAwO1xyXG4gICAgICAgICAgICAgICAgdmFyIG1sID0gdGhpcy5nZXRTdHlsZShlbCwgJ21hcmdpbkxlZnQnKTtcclxuICAgICAgICAgICAgICAgIG1sID0gbWwgPT0gJ2F1dG8nID8gMCA6IHBhcnNlSW50KG1sLCAxMCkgIT0gTmFOID8gcGFyc2VJbnQobWwsIDEwKSA6IDA7XHJcbiAgICAgICAgICAgICAgICB2YXIgbXIgPSB0aGlzLmdldFN0eWxlKGVsLCAnbWFyZ2luUmlnaHQnKTtcclxuICAgICAgICAgICAgICAgIG1yID0gbXIgPT0gJ2F1dG8nID8gMCA6IHBhcnNlSW50KG1yLCAxMCkgIT0gTmFOID8gcGFyc2VJbnQobXIsIDEwKSA6IDA7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gKHBsICsgcHIgKyBibCArIGJyICsgbWwgKyBtcik7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgKiBHZXQgY29tcHV0ZSBwaXhlbCBudW1iZXIgb2YgdGhlIHdob2xlIGhlaWdodCBvZiBhbiBlbGVtZW50cyBib3JkZXJcclxuICAgICAgICAgICAgICpcclxuICAgICAgICAgICAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWwgLSB0aGUgSFRNTCBlbGVtZW50XHJcbiAgICAgICAgICAgICAqIEByZXR1cm4ge251bWJlcn0gLSB0aGUgYW1vdW50IG9mIHBpeGVsc1xyXG4gICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgWndvb3NoLnByb3RvdHlwZS5nZXRCb3JkZXJIZWlnaHQgPSBmdW5jdGlvbiAoZWwpIHtcclxuICAgICAgICAgICAgICAgIHZhciBidCA9IHRoaXMuZ2V0U3R5bGUoZWwsICdib3JkZXJUb3BXaWR0aCcpO1xyXG4gICAgICAgICAgICAgICAgYnQgPSBidCA9PSAndGhpbicgPyAxIDogYnQgPT0gJ21lZGl1bScgPyAzIDogYnQgPT0gJ3RoaWNrJyA/IDUgOiBwYXJzZUludChidCwgMTApICE9IE5hTiA/IHBhcnNlSW50KGJ0LCAxMCkgOiAwO1xyXG4gICAgICAgICAgICAgICAgdmFyIGJiID0gdGhpcy5nZXRTdHlsZShlbCwgJ2JvcmRlckJvdHRvbVdpZHRoJyk7XHJcbiAgICAgICAgICAgICAgICBiYiA9IGJiID09ICd0aGluJyA/IDEgOiBiYiA9PSAnbWVkaXVtJyA/IDMgOiBiYiA9PSAndGhpY2snID8gNSA6IHBhcnNlSW50KGJiLCAxMCkgIT0gTmFOID8gcGFyc2VJbnQoYmIsIDEwKSA6IDA7XHJcbiAgICAgICAgICAgICAgICB2YXIgcHQgPSB0aGlzLmdldFN0eWxlKGVsLCAncGFkZGluZ1RvcCcpO1xyXG4gICAgICAgICAgICAgICAgcHQgPSBwdCA9PSAnYXV0bycgPyAwIDogcGFyc2VJbnQocHQsIDEwKSAhPSBOYU4gPyBwYXJzZUludChwdCwgMTApIDogMDtcclxuICAgICAgICAgICAgICAgIHZhciBwYiA9IHRoaXMuZ2V0U3R5bGUoZWwsICdwYWRkaW5nQm90dG9tJyk7XHJcbiAgICAgICAgICAgICAgICBwYiA9IHBiID09ICdhdXRvJyA/IDAgOiBwYXJzZUludChwYiwgMTApICE9IE5hTiA/IHBhcnNlSW50KHBiLCAxMCkgOiAwO1xyXG4gICAgICAgICAgICAgICAgdmFyIG10ID0gdGhpcy5nZXRTdHlsZShlbCwgJ21hcmdpblRvcCcpO1xyXG4gICAgICAgICAgICAgICAgbXQgPSBtdCA9PSAnYXV0bycgPyAwIDogcGFyc2VJbnQobXQsIDEwKSAhPSBOYU4gPyBwYXJzZUludChtdCwgMTApIDogMDtcclxuICAgICAgICAgICAgICAgIHZhciBtYiA9IHRoaXMuZ2V0U3R5bGUoZWwsICdtYXJnaW5Cb3R0b20nKTtcclxuICAgICAgICAgICAgICAgIG1iID0gbWIgPT0gJ2F1dG8nID8gMCA6IHBhcnNlSW50KG1iLCAxMCkgIT0gTmFOID8gcGFyc2VJbnQobWIsIDEwKSA6IDA7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gKHB0ICsgcGIgKyBidCArIGJiICsgbXQgKyBtYik7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgKiBEaXNhYmxlcyB0aGUgc2Nyb2xsIHdoZWVsIG9mIHRoZSBtb3VzZVxyXG4gICAgICAgICAgICAgKlxyXG4gICAgICAgICAgICAgKiBAcGFyYW0ge01vdXNlV2hlZWxFdmVudH0gZSAtIHRoZSBtb3VzZSB3aGVlbCBldmVudFxyXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHt2b2lkfVxyXG4gICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgWndvb3NoLnByb3RvdHlwZS5kaXNhYmxlTW91c2VTY3JvbGwgPSBmdW5jdGlvbiAoZSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuZWxlbWVudEJlaGluZEN1cnNvcklzTWUoZS5jbGllbnRYLCBlLmNsaWVudFkpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jbGVhclRpbWVvdXRzKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGUgPSB3aW5kb3cuZXZlbnQ7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQgPyBlLnByZXZlbnREZWZhdWx0KCkgOiAoZS5yZXR1cm5WYWx1ZSA9IGZhbHNlKTtcclxuICAgICAgICAgICAgICAgICAgICBlLnJldHVyblZhbHVlID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgKiBEZXRlcm1pbmUgd2hldGhlciBhbiBlbGVtZW50IGhhcyBhIHNjcm9sbGJhciBvciBub3RcclxuICAgICAgICAgICAgICpcclxuICAgICAgICAgICAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWxlbWVudCAtIHRoZSBIVE1MRWxlbWVudFxyXG4gICAgICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gZGlyZWN0aW9uIC0gZGV0ZXJtaW5lIHRoZSB2ZXJ0aWNhbCBvciBob3Jpem9udGFsIHNjcm9sbGJhcj9cclxuICAgICAgICAgICAgICogQHJldHVybiB7Ym9vbGVhbn0gLSB3aGV0aGVyIHRoZSBlbGVtZW50IGhhcyBzY3JvbGxiYXJzIG9yIG5vdFxyXG4gICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgWndvb3NoLnByb3RvdHlwZS5oYXNTY3JvbGxiYXIgPSBmdW5jdGlvbiAoZWxlbWVudCwgZGlyZWN0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgaGFzID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB2YXIgb3ZlcmZsb3cgPSAnb3ZlcmZsb3cnO1xyXG4gICAgICAgICAgICAgICAgaWYgKGRpcmVjdGlvbiA9PSAndmVydGljYWwnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgb3ZlcmZsb3cgPSAnb3ZlcmZsb3dZJztcclxuICAgICAgICAgICAgICAgICAgICBoYXMgPSBlbGVtZW50LnNjcm9sbEhlaWdodCA+IGVsZW1lbnQuY2xpZW50SGVpZ2h0O1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoZGlyZWN0aW9uID09ICdob3Jpem9udGFsJykge1xyXG4gICAgICAgICAgICAgICAgICAgIG92ZXJmbG93ID0gJ292ZXJmbG93WCc7XHJcbiAgICAgICAgICAgICAgICAgICAgaGFzID0gZWxlbWVudC5zY3JvbGxXaWR0aCA+IGVsZW1lbnQuY2xpZW50V2lkdGg7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAvLyBDaGVjayB0aGUgb3ZlcmZsb3cgYW5kIG92ZXJmbG93RGlyZWN0aW9uIHByb3BlcnRpZXMgZm9yIFwiYXV0b1wiIGFuZCBcInZpc2libGVcIiB2YWx1ZXNcclxuICAgICAgICAgICAgICAgIGhhcyA9IHRoaXMuZ2V0U3R5bGUodGhpcy5jb250YWluZXIsICdvdmVyZmxvdycpID09IFwidmlzaWJsZVwiXHJcbiAgICAgICAgICAgICAgICAgICAgfHwgdGhpcy5nZXRTdHlsZSh0aGlzLmNvbnRhaW5lciwgJ292ZXJmbG93WScpID09IFwidmlzaWJsZVwiXHJcbiAgICAgICAgICAgICAgICAgICAgfHwgKGhhcyAmJiB0aGlzLmdldFN0eWxlKHRoaXMuY29udGFpbmVyLCAnb3ZlcmZsb3cnKSA9PSBcImF1dG9cIilcclxuICAgICAgICAgICAgICAgICAgICB8fCAoaGFzICYmIHRoaXMuZ2V0U3R5bGUodGhpcy5jb250YWluZXIsICdvdmVyZmxvd1knKSA9PSBcImF1dG9cIik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gaGFzO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAvKipcclxuICAgICAgICAgICAgICogRW5hYmxlcyB0aGUgc2Nyb2xsIHdoZWVsIG9mIHRoZSBtb3VzZSB0byBzY3JvbGwsIHNwZWNpYWxseSBmb3IgZGl2cyB3aXRob3VyIHNjcm9sbGJhclxyXG4gICAgICAgICAgICAgKlxyXG4gICAgICAgICAgICAgKiBAcGFyYW0ge01vdXNlV2hlZWxFdmVudH0gZSAtIHRoZSBtb3VzZSB3aGVlbCBldmVudFxyXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHt2b2lkfVxyXG4gICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgWndvb3NoLnByb3RvdHlwZS5hY3RpdmVNb3VzZVNjcm9sbCA9IGZ1bmN0aW9uIChlKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWUpIHtcclxuICAgICAgICAgICAgICAgICAgICBlID0gd2luZG93LmV2ZW50O1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuZWxlbWVudEJlaGluZEN1cnNvcklzTWUoZS5jbGllbnRYLCBlLmNsaWVudFkpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRpcmVjdGlvbjtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoXCJkZWx0YVlcIiBpbiBlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpcmVjdGlvbiA9IGUuZGVsdGFZID4gMCA/ICdkb3duJyA6ICd1cCc7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKFwid2hlZWxEZWx0YVwiIGluIGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGlyZWN0aW9uID0gZS53aGVlbERlbHRhID4gMCA/ICd1cCcgOiAnZG93bic7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIC8qIHVzZSB0aGUgbm9ybWFsIHNjcm9sbCwgd2hlbiB0aGVyZSBhcmUgc2Nyb2xsYmFycyBhbmQgdGhlIGRpcmVjdGlvbiBpcyBcInZlcnRpY2FsXCIgKi9cclxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLndoZWVsT3B0aW9ucy5kaXJlY3Rpb24gPT0gJ3ZlcnRpY2FsJyAmJiB0aGlzLmhhc1Njcm9sbGJhcih0aGlzLnNjcm9sbEVsZW1lbnQsIHRoaXMub3B0aW9ucy53aGVlbE9wdGlvbnMuZGlyZWN0aW9uKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoISgodGhpcy50cmlnZ2VyZWQuY29sbGlkZUJvdHRvbSAmJiBkaXJlY3Rpb24gPT0gJ2Rvd24nKSB8fCAodGhpcy50cmlnZ2VyZWQuY29sbGlkZVRvcCAmJiBkaXJlY3Rpb24gPT0gJ3VwJykpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNsZWFyVGltZW91dHMoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmRpc2FibGVNb3VzZVNjcm9sbChlKTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgeCA9IHRoaXMuZ2V0U2Nyb2xsTGVmdCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciB5ID0gdGhpcy5nZXRTY3JvbGxUb3AoKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLndoZWVsT3B0aW9ucy5kaXJlY3Rpb24gPT0gJ2hvcml6b250YWwnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHggPSB0aGlzLmdldFNjcm9sbExlZnQoKSArIChkaXJlY3Rpb24gPT0gJ2Rvd24nID8gdGhpcy5vcHRpb25zLndoZWVsT3B0aW9ucy5zdGVwIDogdGhpcy5vcHRpb25zLndoZWVsT3B0aW9ucy5zdGVwICogLTEpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmICh0aGlzLm9wdGlvbnMud2hlZWxPcHRpb25zLmRpcmVjdGlvbiA9PSAndmVydGljYWwnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHkgPSB0aGlzLmdldFNjcm9sbFRvcCgpICsgKGRpcmVjdGlvbiA9PSAnZG93bicgPyB0aGlzLm9wdGlvbnMud2hlZWxPcHRpb25zLnN0ZXAgOiB0aGlzLm9wdGlvbnMud2hlZWxPcHRpb25zLnN0ZXAgKiAtMSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsVG8oeCwgeSwgZmFsc2UpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAvKipcclxuICAgICAgICAgICAgICogRW5hYmxlcyB0aGUgc2Nyb2xsIHdoZWVsIG9mIHRoZSBtb3VzZSB0byB6b29tXHJcbiAgICAgICAgICAgICAqXHJcbiAgICAgICAgICAgICAqIEBwYXJhbSB7TW91c2VXaGVlbEV2ZW50fSBlIC0gdGhlIG1vdXNlIHdoZWVsIGV2ZW50XHJcbiAgICAgICAgICAgICAqIEByZXR1cm4ge3ZvaWR9XHJcbiAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLmFjdGl2ZU1vdXNlWm9vbSA9IGZ1bmN0aW9uIChlKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWUpIHtcclxuICAgICAgICAgICAgICAgICAgICBlID0gd2luZG93LmV2ZW50O1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuZWxlbWVudEJlaGluZEN1cnNvcklzTWUoZS5jbGllbnRYLCBlLmNsaWVudFkpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRpcmVjdGlvbjtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoXCJkZWx0YVlcIiBpbiBlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpcmVjdGlvbiA9IGUuZGVsdGFZID4gMCA/ICdkb3duJyA6ICd1cCc7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKFwid2hlZWxEZWx0YVwiIGluIGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGlyZWN0aW9uID0gZS53aGVlbERlbHRhID4gMCA/ICd1cCcgOiAnZG93bic7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChkaXJlY3Rpb24gPT0gdGhpcy5vcHRpb25zLnpvb21PcHRpb25zLmRpcmVjdGlvbikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgc2NhbGUgPSB0aGlzLmdldFNjYWxlKCkgKiAoMSArIHRoaXMub3B0aW9ucy56b29tT3B0aW9ucy5zdGVwKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzY2FsZSA9IHRoaXMuZ2V0U2NhbGUoKSAqICgxIC0gdGhpcy5vcHRpb25zLnpvb21PcHRpb25zLnN0ZXApO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnNjYWxlVG8oc2NhbGUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAvKipcclxuICAgICAgICAgICAgICogQ2FsY3VsYXRlcyB0aGUgc2l6ZSBvZiB0aGUgdmVydGljYWwgc2Nyb2xsYmFyLlxyXG4gICAgICAgICAgICAgKlxyXG4gICAgICAgICAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbCAtIFRoZSBIVE1MRWxlbWVtbnRcclxuICAgICAgICAgICAgICogQHJldHVybiB7bnVtYmVyfSAtIHRoZSBhbW91bnQgb2YgcGl4ZWxzIHVzZWQgYnkgdGhlIHZlcnRpY2FsIHNjcm9sbGJhclxyXG4gICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgWndvb3NoLnByb3RvdHlwZS5zY3JvbGxiYXJXaWR0aCA9IGZ1bmN0aW9uIChlbCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGVsLm9mZnNldFdpZHRoIC0gZWwuY2xpZW50V2lkdGggLSBwYXJzZUludCh0aGlzLmdldFN0eWxlKGVsLCAnYm9yZGVyTGVmdFdpZHRoJykpIC0gcGFyc2VJbnQodGhpcy5nZXRTdHlsZShlbCwgJ2JvcmRlclJpZ2h0V2lkdGgnKSk7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgKiBDYWxjdWxhdGVzIHRoZSBzaXplIG9mIHRoZSBob3Jpem9udGFsIHNjcm9sbGJhci5cclxuICAgICAgICAgICAgICpcclxuICAgICAgICAgICAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWwgLSBUaGUgSFRNTEVsZW1lbW50XHJcbiAgICAgICAgICAgICAqIEByZXR1cm4ge251bWJlcn0gLSB0aGUgYW1vdW50IG9mIHBpeGVscyB1c2VkIGJ5IHRoZSBob3Jpem9udGFsIHNjcm9sbGJhclxyXG4gICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgWndvb3NoLnByb3RvdHlwZS5zY3JvbGxiYXJIZWlnaHQgPSBmdW5jdGlvbiAoZWwpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBlbC5vZmZzZXRIZWlnaHQgLSBlbC5jbGllbnRIZWlnaHQgLSBwYXJzZUludCh0aGlzLmdldFN0eWxlKGVsLCAnYm9yZGVyVG9wV2lkdGgnKSkgLSBwYXJzZUludCh0aGlzLmdldFN0eWxlKGVsLCAnYm9yZGVyQm90dG9tV2lkdGgnKSk7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgKiBSZXRyaWV2ZXMgdGhlIGN1cnJlbnQgc2NhbGUgdmFsdWUgb3IgMSBpZiBpdCBpcyBub3Qgc2V0LlxyXG4gICAgICAgICAgICAgKlxyXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHtudW1iZXJ9IC0gdGhlIGN1cnJlbnQgc2NhbGUgdmFsdWVcclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIFp3b29zaC5wcm90b3R5cGUuZ2V0U2NhbGUgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHRoaXMuaW5uZXIuc3R5bGUudHJhbnNmb3JtICE9ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHIgPSB0aGlzLmlubmVyLnN0eWxlLnRyYW5zZm9ybS5tYXRjaCgvc2NhbGVcXCgoWzAtOSxcXC5dKylcXCkvKSB8fCBbXCJcIl07XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHBhcnNlRmxvYXQoclsxXSkgfHwgMTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiAxO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAvKipcclxuICAgICAgICAgICAgICogU2NhbGVzIHRoZSBpbm5lciBlbGVtZW50IGJ5IGEgcmVsYXRpY2UgdmFsdWUgYmFzZWQgb24gdGhlIGN1cnJlbnQgc2NhbGUgdmFsdWUuXHJcbiAgICAgICAgICAgICAqXHJcbiAgICAgICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSBwZXJjZW50IC0gcGVyY2VudGFnZSBvZiB0aGUgY3VycmVudCBzY2FsZSB2YWx1ZVxyXG4gICAgICAgICAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IGhvbm91ckxpbWl0cyAtIHdoZXRoZXIgdG8gaG9ub3VyIG1heFNjYWxlIGFuZCB0aGUgbWluaW11bSB3aWR0aCBhbmQgaGVpZ2h0XHJcbiAgICAgICAgICAgICAqIG9mIHRoZSBjb250YWluZXIgZWxlbWVudC5cclxuICAgICAgICAgICAgICogQHJldHVybiB7dm9pZH1cclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIFp3b29zaC5wcm90b3R5cGUuc2NhbGVCeSA9IGZ1bmN0aW9uIChwZXJjZW50LCBob25vdXJMaW1pdHMpIHtcclxuICAgICAgICAgICAgICAgIGlmIChob25vdXJMaW1pdHMgPT09IHZvaWQgMCkgeyBob25vdXJMaW1pdHMgPSB0cnVlOyB9XHJcbiAgICAgICAgICAgICAgICB2YXIgc2NhbGUgPSB0aGlzLmdldFNjYWxlKCkgKiAocGVyY2VudCAvIDEwMCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNjYWxlVG8oc2NhbGUsIGhvbm91ckxpbWl0cyk7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgKiBTY2FsZXMgdGhlIGlubmVyIGVsZW1lbnQgdG8gYW4gYWJzb2x1dGUgdmFsdWUuXHJcbiAgICAgICAgICAgICAqXHJcbiAgICAgICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSBzY2FsZSAtIHRoZSBzY2FsZVxyXG4gICAgICAgICAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IGhvbm91ckxpbWl0cyAtIHdoZXRoZXIgdG8gaG9ub3VyIG1heFNjYWxlIGFuZCB0aGUgbWluaW11bSB3aWR0aCBhbmQgaGVpZ2h0XHJcbiAgICAgICAgICAgICAqIG9mIHRoZSBjb250YWluZXIgZWxlbWVudC5cclxuICAgICAgICAgICAgICogQHJldHVybiB7dm9pZH1cclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIFp3b29zaC5wcm90b3R5cGUuc2NhbGVUbyA9IGZ1bmN0aW9uIChzY2FsZSwgaG9ub3VyTGltaXRzKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoaG9ub3VyTGltaXRzID09PSB2b2lkIDApIHsgaG9ub3VyTGltaXRzID0gdHJ1ZTsgfVxyXG4gICAgICAgICAgICAgICAgdmFyIHdpZHRoID0gKHBhcnNlRmxvYXQodGhpcy5pbm5lci5zdHlsZS5taW5XaWR0aCkgKiBzY2FsZSk7XHJcbiAgICAgICAgICAgICAgICB2YXIgaGVpZ2h0ID0gKHBhcnNlRmxvYXQodGhpcy5pbm5lci5zdHlsZS5taW5IZWlnaHQpICogc2NhbGUpO1xyXG4gICAgICAgICAgICAgICAgLyogU2Nyb2xsYmFycyBoYXZlIHdpZHRoIGFuZCBoZWlnaHQgdG9vICovXHJcbiAgICAgICAgICAgICAgICB2YXIgbWluV2lkdGggPSB0aGlzLmNvbnRhaW5lci5jbGllbnRXaWR0aCArIHRoaXMuc2Nyb2xsYmFyV2lkdGgodGhpcy5jb250YWluZXIpO1xyXG4gICAgICAgICAgICAgICAgdmFyIG1pbkhlaWdodCA9IHRoaXMuY29udGFpbmVyLmNsaWVudEhlaWdodCArIHRoaXMuc2Nyb2xsYmFySGVpZ2h0KHRoaXMuY29udGFpbmVyKTtcclxuICAgICAgICAgICAgICAgIGlmIChob25vdXJMaW1pdHMpIHtcclxuICAgICAgICAgICAgICAgICAgICAvKiBsb29wIGFzIGxvbmcgYXMgYWxsIGxpbWl0cyBhcmUgaG9ub3VyZWQgKi9cclxuICAgICAgICAgICAgICAgICAgICB3aGlsZSAoKHNjYWxlID4gdGhpcy5vcHRpb25zLnpvb21PcHRpb25zLm1heFNjYWxlICYmIHRoaXMub3B0aW9ucy56b29tT3B0aW9ucy5tYXhTY2FsZSAhPSAwKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB8fCAoc2NhbGUgPCB0aGlzLm9wdGlvbnMuem9vbU9wdGlvbnMubWluU2NhbGUgJiYgdGhpcy5vcHRpb25zLnpvb21PcHRpb25zLm1pblNjYWxlICE9IDApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHx8ICh3aWR0aCA8IHRoaXMuY29udGFpbmVyLmNsaWVudFdpZHRoICYmICF0aGlzLmlzQm9keSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgfHwgaGVpZ2h0IDwgdGhpcy5jb250YWluZXIuY2xpZW50SGVpZ2h0ICYmICF0aGlzLmlzQm9keSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2NhbGUgPiB0aGlzLm9wdGlvbnMuem9vbU9wdGlvbnMubWF4U2NhbGUgJiYgdGhpcy5vcHRpb25zLnpvb21PcHRpb25zLm1heFNjYWxlICE9IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjYWxlID0gdGhpcy5vcHRpb25zLnpvb21PcHRpb25zLm1heFNjYWxlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGggPSBNYXRoLmZsb29yKHBhcnNlSW50KHRoaXMuaW5uZXIuc3R5bGUubWluV2lkdGgpICogc2NhbGUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0ID0gTWF0aC5mbG9vcihwYXJzZUludCh0aGlzLmlubmVyLnN0eWxlLm1pbkhlaWdodCkgKiBzY2FsZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNjYWxlIDwgdGhpcy5vcHRpb25zLnpvb21PcHRpb25zLm1pblNjYWxlICYmIHRoaXMub3B0aW9ucy56b29tT3B0aW9ucy5taW5TY2FsZSAhPSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY2FsZSA9IHRoaXMub3B0aW9ucy56b29tT3B0aW9ucy5taW5TY2FsZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoID0gTWF0aC5mbG9vcihwYXJzZUludCh0aGlzLmlubmVyLnN0eWxlLm1pbldpZHRoKSAqIHNjYWxlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodCA9IE1hdGguZmxvb3IocGFyc2VJbnQodGhpcy5pbm5lci5zdHlsZS5taW5IZWlnaHQpICogc2NhbGUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh3aWR0aCA8IG1pbldpZHRoICYmICF0aGlzLmlzQm9keSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2NhbGUgPSBzY2FsZSAvIHdpZHRoICogbWluV2lkdGg7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQgPSBNYXRoLmZsb29yKHBhcnNlSW50KHRoaXMuaW5uZXIuc3R5bGUubWluSGVpZ2h0KSAqIHNjYWxlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoID0gbWluV2lkdGg7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGhlaWdodCA8IG1pbkhlaWdodCAmJiAhdGhpcy5pc0JvZHkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjYWxlID0gc2NhbGUgLyBoZWlnaHQgKiBtaW5IZWlnaHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWR0aCA9IE1hdGguZmxvb3IocGFyc2VJbnQodGhpcy5pbm5lci5zdHlsZS5taW5XaWR0aCkgKiBzY2FsZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQgPSBtaW5IZWlnaHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nKFwic2NhbGVUbygpOiBcIiwgc2NhbGUsIFwiIC0tLS0+IFwiLCB3aWR0aCwgXCIgeCBcIiwgaGVpZ2h0LCBcIiBvcmlnOiBcIiwgdGhpcy5jb250YWluZXIuY2xpZW50V2lkdGgsIFwiIHggXCIsIHRoaXMuY29udGFpbmVyLmNsaWVudEhlaWdodCwgXCIgcmVhbDogXCIsIG1pbldpZHRoLCBcIiB4IFwiLCBtaW5IZWlnaHQpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5pbm5lci5zdHlsZS50cmFuc2Zvcm0gPSAndHJhbnNsYXRlKDBweCwgMHB4KSBzY2FsZSgnICsgc2NhbGUgKyAnKSc7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNjYWxlRWxlbWVudC5zdHlsZS5taW5XaWR0aCA9IHRoaXMuc2NhbGVFbGVtZW50LnN0eWxlLndpZHRoID0gd2lkdGggKyAncHgnO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zY2FsZUVsZW1lbnQuc3R5bGUubWluSGVpZ2h0ID0gdGhpcy5zY2FsZUVsZW1lbnQuc3R5bGUuaGVpZ2h0ID0gaGVpZ2h0ICsgJ3B4JztcclxuICAgICAgICAgICAgICAgIC8qIFRPRE86IGhlcmUgc2Nyb2xsVG8gYmFzZWQgb24gd2hlcmUgdGhlIG1vdXNlIGN1cnNvciBpcyAqL1xyXG4gICAgICAgICAgICAgICAgLy90aGlzLnNjcm9sbFRvKCk7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgKiBEaXNhYmxlcyB0aGUgc2Nyb2xsIHdoZWVsIG9mIHRoZSBtb3VzZVxyXG4gICAgICAgICAgICAgKlxyXG4gICAgICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0geCAtIHRoZSB4LWNvb3JkaW5hdGVzXHJcbiAgICAgICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSB5IC0gdGhlIHktY29vcmRpbmF0ZXNcclxuICAgICAgICAgICAgICogQHJldHVybiB7Ym9vbGVhbn0gLSB3aGV0aGVyIHRoZSBuZWFyZXN0IHJlbGF0ZWQgcGFyZW50IGlubmVyIGVsZW1lbnQgaXMgdGhlIG9uZSBvZiB0aGlzIG9iamVjdCBpbnN0YW5jZVxyXG4gICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgWndvb3NoLnByb3RvdHlwZS5lbGVtZW50QmVoaW5kQ3Vyc29ySXNNZSA9IGZ1bmN0aW9uICh4LCB5KSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZWxlbWVudEJlaGluZEN1cnNvciA9IGRvY3VtZW50LmVsZW1lbnRGcm9tUG9pbnQoeCwgeSk7XHJcbiAgICAgICAgICAgICAgICAvKipcclxuICAgICAgICAgICAgICAgICAqIElmIHRoZSBlbGVtZW50IGRpcmVjdGx5IGJlaGluZCB0aGUgY3Vyc29yIGlzIGFuIG91dGVyIGVsZW1lbnQgdGhyb3cgb3V0LCBiZWNhdXNlIHdoZW4gY2xpY2tpbmcgb24gYSBzY3JvbGxiYXJcclxuICAgICAgICAgICAgICAgICAqIGZyb20gYSBkaXYsIGEgZHJhZyBvZiB0aGUgcGFyZW50IFp3b29zaCBlbGVtZW50IGlzIGluaXRpYXRlZC5cclxuICAgICAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICAgICAgdmFyIG91dGVyUmUgPSBuZXcgUmVnRXhwKFwiIFwiICsgdGhpcy5jbGFzc091dGVyICsgXCIgXCIpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGVsZW1lbnRCZWhpbmRDdXJzb3IuY2xhc3NOYW1lLm1hdGNoKG91dGVyUmUpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgLyogZmluZCB0aGUgbmV4dCBwYXJlbnQgd2hpY2ggaXMgYW4gaW5uZXIgZWxlbWVudCAqL1xyXG4gICAgICAgICAgICAgICAgdmFyIGlubmVyUmUgPSBuZXcgUmVnRXhwKFwiIFwiICsgdGhpcy5jbGFzc0lubmVyICsgXCIgXCIpO1xyXG4gICAgICAgICAgICAgICAgd2hpbGUgKGVsZW1lbnRCZWhpbmRDdXJzb3IgJiYgIWVsZW1lbnRCZWhpbmRDdXJzb3IuY2xhc3NOYW1lLm1hdGNoKGlubmVyUmUpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZWxlbWVudEJlaGluZEN1cnNvciA9IGVsZW1lbnRCZWhpbmRDdXJzb3IucGFyZW50RWxlbWVudDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmlubmVyID09IGVsZW1lbnRCZWhpbmRDdXJzb3I7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIFp3b29zaC5wcm90b3R5cGUuZ2V0VGltZXN0YW1wID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB3aW5kb3cucGVyZm9ybWFuY2UgPT0gJ29iamVjdCcpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoXCJub3dcIiBpbiB3aW5kb3cucGVyZm9ybWFuY2UpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHdpbmRvdy5wZXJmb3JtYW5jZS5ub3coKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoXCJ3ZWJraXROb3dcIiBpbiB3aW5kb3cucGVyZm9ybWFuY2UpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHdpbmRvdy5wZXJmb3JtYW5jZS53ZWJraXROb3coKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IERhdGUoKS5nZXRUaW1lKCk7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgKiBTY3JvbGwgaGFuZGxlciB0byB0cmlnZ2VyIHRoZSBjdXN0b20gZXZlbnRzXHJcbiAgICAgICAgICAgICAqXHJcbiAgICAgICAgICAgICAqIEBwYXJhbSB7RXZlbnR9IGUgLSBUaGUgc2Nyb2xsIGV2ZW50IG9iamVjdCAoVE9ETzogbmVlZGVkPylcclxuICAgICAgICAgICAgICogQHRocm93cyBFdmVudCBjb2xsaWRlTGVmdFxyXG4gICAgICAgICAgICAgKiBAdGhyb3dzIEV2ZW50IGNvbGxpZGVSaWdodFxyXG4gICAgICAgICAgICAgKiBAdGhyb3dzIEV2ZW50IGNvbGxpZGVUb3BcclxuICAgICAgICAgICAgICogQHRocm93cyBFdmVudCBjb2xsaWRlQm90dG9tXHJcbiAgICAgICAgICAgICAqIEByZXR1cm4ge3ZvaWR9XHJcbiAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLm9uU2Nyb2xsID0gZnVuY3Rpb24gKGUpIHtcclxuICAgICAgICAgICAgICAgIHZhciB4ID0gdGhpcy5nZXRTY3JvbGxMZWZ0KCk7XHJcbiAgICAgICAgICAgICAgICB2YXIgeSA9IHRoaXMuZ2V0U2Nyb2xsVG9wKCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNjcm9sbE1heExlZnQgPSAodGhpcy5zY3JvbGxFbGVtZW50LnNjcm9sbFdpZHRoIC0gdGhpcy5zY3JvbGxFbGVtZW50LmNsaWVudFdpZHRoKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsTWF4VG9wID0gKHRoaXMuc2Nyb2xsRWxlbWVudC5zY3JvbGxIZWlnaHQgLSB0aGlzLnNjcm9sbEVsZW1lbnQuY2xpZW50SGVpZ2h0KTtcclxuICAgICAgICAgICAgICAgIC8vIHRoZSBjb2xsaWRlTGVmdCBldmVudFxyXG4gICAgICAgICAgICAgICAgaWYgKHggPT0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudHJpZ2dlcmVkLmNvbGxpZGVMZWZ0ID8gbnVsbCA6IHRoaXMudHJpZ2dlckV2ZW50KHRoaXMuaW5uZXIsICdjb2xsaWRlLmxlZnQnKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnRyaWdnZXJlZC5jb2xsaWRlTGVmdCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnRyaWdnZXJlZC5jb2xsaWRlTGVmdCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgLy8gdGhlIGNvbGxpZGVUb3AgZXZlbnRcclxuICAgICAgICAgICAgICAgIGlmICh5ID09IDApIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnRyaWdnZXJlZC5jb2xsaWRlVG9wID8gbnVsbCA6IHRoaXMudHJpZ2dlckV2ZW50KHRoaXMuaW5uZXIsICdjb2xsaWRlLnRvcCcpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudHJpZ2dlcmVkLmNvbGxpZGVUb3AgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50cmlnZ2VyZWQuY29sbGlkZVRvcCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgLy8gdGhlIGNvbGxpZGVSaWdodCBldmVudFxyXG4gICAgICAgICAgICAgICAgaWYgKHggPT0gdGhpcy5zY3JvbGxNYXhMZWZ0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50cmlnZ2VyZWQuY29sbGlkZVJpZ2h0ID8gbnVsbCA6IHRoaXMudHJpZ2dlckV2ZW50KHRoaXMuaW5uZXIsICdjb2xsaWRlLnJpZ2h0Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50cmlnZ2VyZWQuY29sbGlkZVJpZ2h0ID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudHJpZ2dlcmVkLmNvbGxpZGVSaWdodCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgLy8gdGhlIGNvbGxpZGVCb3R0b20gZXZlbnRcclxuICAgICAgICAgICAgICAgIGlmICh5ID09IHRoaXMuc2Nyb2xsTWF4VG9wKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50cmlnZ2VyZWQuY29sbGlkZUJvdHRvbSA/IG51bGwgOiB0aGlzLnRyaWdnZXJFdmVudCh0aGlzLmlubmVyLCAnY29sbGlkZS5ib3R0b20nKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnRyaWdnZXJlZC5jb2xsaWRlQm90dG9tID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudHJpZ2dlcmVkLmNvbGxpZGVCb3R0b20gPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgICAqIHdpbmRvdyByZXNpemUgaGFuZGxlciB0byByZWNhbGN1bGF0ZSB0aGUgaW5uZXIgZGl2IG1pbldpZHRoIGFuZCBtaW5IZWlnaHRcclxuICAgICAgICAgICAgICpcclxuICAgICAgICAgICAgICogQHBhcmFtIHtFdmVudH0gZSAtIFRoZSB3aW5kb3cgcmVzaXplIGV2ZW50IG9iamVjdCAoVE9ETzogbmVlZGVkPylcclxuICAgICAgICAgICAgICogQHJldHVybiB7dm9pZH1cclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIFp3b29zaC5wcm90b3R5cGUub25SZXNpemUgPSBmdW5jdGlvbiAoZSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIF90aGlzID0gdGhpcztcclxuICAgICAgICAgICAgICAgIHZhciBvblJlc2l6ZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICBfdGhpcy5pbm5lci5zdHlsZS5taW5XaWR0aCA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMuaW5uZXIuc3R5bGUubWluSGVpZ2h0ID0gbnVsbDtcclxuICAgICAgICAgICAgICAgICAgICAvKiB0YWtlIGF3YXkgdGhlIG1hcmdpbiB2YWx1ZXMgb2YgdGhlIGJvZHkgZWxlbWVudCAqL1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciB4RGVsdGEgPSBwYXJzZUludChfdGhpcy5nZXRTdHlsZShkb2N1bWVudC5ib2R5LCAnbWFyZ2luTGVmdCcpLCAxMCkgKyBwYXJzZUludChfdGhpcy5nZXRTdHlsZShkb2N1bWVudC5ib2R5LCAnbWFyZ2luUmlnaHQnKSwgMTApO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciB5RGVsdGEgPSBwYXJzZUludChfdGhpcy5nZXRTdHlsZShkb2N1bWVudC5ib2R5LCAnbWFyZ2luVG9wJyksIDEwKSArIHBhcnNlSW50KF90aGlzLmdldFN0eWxlKGRvY3VtZW50LmJvZHksICdtYXJnaW5Cb3R0b20nKSwgMTApO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vVE9ETzogd2l0aCB0aGlzLmdldEJvcmRlcldpZHRoKCkgYW5kIHRoaXMuZ2V0Qm9yZGVySGVpZ2h0KClcclxuICAgICAgICAgICAgICAgICAgICBfdGhpcy5pbm5lci5zdHlsZS5taW5XaWR0aCA9IChkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsV2lkdGggLSB4RGVsdGEpICsgJ3B4JztcclxuICAgICAgICAgICAgICAgICAgICBfdGhpcy5pbm5lci5zdHlsZS5taW5IZWlnaHQgPSAoZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnNjcm9sbEhlaWdodCAtIHlEZWx0YSAtIDEwMCkgKyAncHgnOyAvL1RPRE86IFdURj8gd2h5IC0xMDAgZm9yIElFOD9cclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAvKipcclxuICAgICAgICAgICAgICAgICAqIFRyaWdnZXIgdGhlIGZ1bmN0aW9uIG9ubHkgd2hlbiB0aGUgY2xpZW50V2lkdGggb3IgY2xpZW50SGVpZ2h0IHJlYWxseSBoYXZlIGNoYW5nZWQuXHJcbiAgICAgICAgICAgICAgICAgKiBJRTggcmVzaWRlcyBpbiBhbiBpbmZpbml0eSBsb29wIGFsd2F5cyB0cmlnZ2VyaW5nIHRoZSByZXNpdGUgZXZlbnQgd2hlbiBhbHRlcmluZyBjc3MuXHJcbiAgICAgICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLm9sZENsaWVudFdpZHRoICE9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRXaWR0aCB8fCB0aGlzLm9sZENsaWVudEhlaWdodCAhPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50SGVpZ2h0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgd2luZG93LmNsZWFyVGltZW91dCh0aGlzLnJlc2l6ZVRpbWVvdXQpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVzaXplVGltZW91dCA9IHdpbmRvdy5zZXRUaW1lb3V0KG9uUmVzaXplLCAxMCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAvKiB3cml0ZSBkb3duIHRoZSBvbGQgY2xpZW50V2lkdGggYW5kIGNsaWVudEhlaWdodCBmb3IgdGhlIGFib3ZlIGNvbXBhcnNpb24gKi9cclxuICAgICAgICAgICAgICAgIHRoaXMub2xkQ2xpZW50V2lkdGggPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50V2lkdGg7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm9sZENsaWVudEhlaWdodCA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRIZWlnaHQ7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIFp3b29zaC5wcm90b3R5cGUuY2xlYXJUZXh0U2VsZWN0aW9uID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHdpbmRvdy5nZXRTZWxlY3Rpb24pXHJcbiAgICAgICAgICAgICAgICAgICAgd2luZG93LmdldFNlbGVjdGlvbigpLnJlbW92ZUFsbFJhbmdlcygpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGRvY3VtZW50LnNlbGVjdGlvbilcclxuICAgICAgICAgICAgICAgICAgICBkb2N1bWVudC5zZWxlY3Rpb24uZW1wdHkoKTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgICAqIEJyb3dzZXIgaW5kZXBlbmRlbnQgZXZlbnQgcmVnaXN0cmF0aW9uXHJcbiAgICAgICAgICAgICAqXHJcbiAgICAgICAgICAgICAqIEBwYXJhbSB7YW55fSBvYmogLSBUaGUgSFRNTEVsZW1lbnQgdG8gYXR0YWNoIHRoZSBldmVudCB0b1xyXG4gICAgICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnQgLSBUaGUgZXZlbnQgbmFtZSB3aXRob3V0IHRoZSBsZWFkaW5nIFwib25cIlxyXG4gICAgICAgICAgICAgKiBAcGFyYW0geyhlOiBFdmVudCkgPT4gdm9pZH0gY2FsbGJhY2sgLSBBIGNhbGxiYWNrIGZ1bmN0aW9uIHRvIGF0dGFjaCB0byB0aGUgZXZlbnRcclxuICAgICAgICAgICAgICogQHBhcmFtIHtib29sZWFufSBib3VuZCAtIHdoZXRoZXIgdG8gYmluZCB0aGUgY2FsbGJhY2sgdG8gdGhlIG9iamVjdCBpbnN0YW5jZSBvciBub3RcclxuICAgICAgICAgICAgICogQHJldHVybiB7dm9pZH1cclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIFp3b29zaC5wcm90b3R5cGUuYWRkRXZlbnRMaXN0ZW5lciA9IGZ1bmN0aW9uIChvYmosIGV2ZW50LCBjYWxsYmFjaywgYm91bmQpIHtcclxuICAgICAgICAgICAgICAgIGlmIChib3VuZCA9PT0gdm9pZCAwKSB7IGJvdW5kID0gdHJ1ZTsgfVxyXG4gICAgICAgICAgICAgICAgdmFyIGJvdW5kQ2FsbGJhY2sgPSBib3VuZCA/IGNhbGxiYWNrLmJpbmQodGhpcykgOiBjYWxsYmFjaztcclxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2Ygb2JqLmFkZEV2ZW50TGlzdGVuZXIgPT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChtYXBFdmVudHNbJ29uJyArIGV2ZW50XSAmJiBvYmoudGFnTmFtZSA9PSBcIkJPRFlcIikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBvYmogPSBtYXBFdmVudHNbJ29uJyArIGV2ZW50XTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgb2JqLmFkZEV2ZW50TGlzdGVuZXIoZXZlbnQsIGJvdW5kQ2FsbGJhY2spO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSBpZiAodHlwZW9mIG9iai5hdHRhY2hFdmVudCA9PSAnb2JqZWN0JyAmJiBodG1sRXZlbnRzWydvbicgKyBldmVudF0pIHtcclxuICAgICAgICAgICAgICAgICAgICBvYmouYXR0YWNoRXZlbnQoJ29uJyArIGV2ZW50LCBib3VuZENhbGxiYWNrKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHR5cGVvZiBvYmouYXR0YWNoRXZlbnQgPT0gJ29iamVjdCcgJiYgbWFwRXZlbnRzWydvbicgKyBldmVudF0pIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAob2JqLnRhZ05hbWUgPT0gXCJCT0RZXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHAgPSAnb24nICsgZXZlbnQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIGV4YW1wbGU6IHdpbmRvdy5vbnNjcm9sbCA9IGJvdW5kQ2FsbGJhY2sgKi9cclxuICAgICAgICAgICAgICAgICAgICAgICAgbWFwRXZlbnRzW3BdW3BdID0gYm91bmRDYWxsYmFjaztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIFRPRE86IG9iai5vbnNjcm9sbCA/PyAqL1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBvYmoub25zY3JvbGwgPSBib3VuZENhbGxiYWNrO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHR5cGVvZiBvYmouYXR0YWNoRXZlbnQgPT0gJ29iamVjdCcpIHtcclxuICAgICAgICAgICAgICAgICAgICBvYmpbZXZlbnRdID0gMTtcclxuICAgICAgICAgICAgICAgICAgICBib3VuZENhbGxiYWNrID0gZnVuY3Rpb24gKGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLyogVE9ETzogZSBpcyB0aGUgb25wcm9wZXJ0eWNoYW5nZSBldmVudCBub3Qgb25lIG9mIHRoZSBjdXN0b20gZXZlbnQgb2JqZWN0cyAqL1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZS5wcm9wZXJ0eU5hbWUgPT0gZXZlbnQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKGUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICAgICBvYmouYXR0YWNoRXZlbnQoJ29ucHJvcGVydHljaGFuZ2UnLCBib3VuZENhbGxiYWNrKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIG9ialsnb24nICsgZXZlbnRdID0gYm91bmRDYWxsYmFjaztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHRoaXMuY3VzdG9tRXZlbnRzW2V2ZW50XSA/IG51bGwgOiAodGhpcy5jdXN0b21FdmVudHNbZXZlbnRdID0gW10pO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jdXN0b21FdmVudHNbZXZlbnRdLnB1c2goW2NhbGxiYWNrLCBib3VuZENhbGxiYWNrXSk7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgKiBCcm93c2VyIGluZGVwZW5kZW50IGV2ZW50IGRlcmVnaXN0cmF0aW9uXHJcbiAgICAgICAgICAgICAqXHJcbiAgICAgICAgICAgICAqIEBwYXJhbSB7YW55fSBvYmogLSBUaGUgSFRNTEVsZW1lbnQgb3Igd2luZG93IHdob3NlIGV2ZW50IHNob3VsZCBiZSBkZXRhY2hlZFxyXG4gICAgICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnQgLSBUaGUgZXZlbnQgbmFtZSB3aXRob3V0IHRoZSBsZWFkaW5nIFwib25cIlxyXG4gICAgICAgICAgICAgKiBAcGFyYW0geyhlOiBFdmVudCkgPT4gdm9pZH0gY2FsbGJhY2sgLSBUaGUgY2FsbGJhY2sgZnVuY3Rpb24gd2hlbiBhdHRhY2hlZFxyXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHt2b2lkfVxyXG4gICAgICAgICAgICAgKlxyXG4gICAgICAgICAgICAgKiBAVE9ETzogdW5yZWdpc3RlcmluZyBvZiBtYXBFdmVudHNcclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIFp3b29zaC5wcm90b3R5cGUucmVtb3ZlRXZlbnRMaXN0ZW5lciA9IGZ1bmN0aW9uIChvYmosIGV2ZW50LCBjYWxsYmFjaykge1xyXG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50IGluIHRoaXMuY3VzdG9tRXZlbnRzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSBpbiB0aGlzLmN1c3RvbUV2ZW50c1tldmVudF0pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLyogaWYgdGhlIGV2ZW50IHdhcyBmb3VuZCBpbiB0aGUgYXJyYXkgYnkgaXRzIGNhbGxiYWNrIHJlZmVyZW5jZSAqL1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5jdXN0b21FdmVudHNbZXZlbnRdW2ldWzBdID09IGNhbGxiYWNrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiByZW1vdmUgdGhlIGxpc3RlbmVyIGZyb20gdGhlIGFycmF5IGJ5IGl0cyBib3VuZCBjYWxsYmFjayByZWZlcmVuY2UgKi9cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrID0gdGhpcy5jdXN0b21FdmVudHNbZXZlbnRdW2ldWzFdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jdXN0b21FdmVudHNbZXZlbnRdLnNwbGljZShpLCAxKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBvYmoucmVtb3ZlRXZlbnRMaXN0ZW5lciA9PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgb2JqLnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnQsIGNhbGxiYWNrKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHR5cGVvZiBvYmouZGV0YWNoRXZlbnQgPT0gJ29iamVjdCcgJiYgaHRtbEV2ZW50c1snb24nICsgZXZlbnRdKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgb2JqLmRldGFjaEV2ZW50KCdvbicgKyBldmVudCwgY2FsbGJhY2spO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSBpZiAodHlwZW9mIG9iai5kZXRhY2hFdmVudCA9PSAnb2JqZWN0Jykge1xyXG4gICAgICAgICAgICAgICAgICAgIG9iai5kZXRhY2hFdmVudCgnb25wcm9wZXJ0eWNoYW5nZScsIGNhbGxiYWNrKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIG9ialsnb24nICsgZXZlbnRdID0gbnVsbDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgICAqIEJyb3dzZXIgaW5kZXBlbmRlbnQgZXZlbnQgdHJpZ2dlciBmdW5jdGlvblxyXG4gICAgICAgICAgICAgKlxyXG4gICAgICAgICAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBvYmogLSBUaGUgSFRNTEVsZW1lbnQgd2hpY2ggdHJpZ2dlcnMgdGhlIGV2ZW50XHJcbiAgICAgICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBldmVudE5hbWUgLSBUaGUgZXZlbnQgbmFtZSB3aXRob3V0IHRoZSBsZWFkaW5nIFwib25cIlxyXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHt2b2lkfVxyXG4gICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgWndvb3NoLnByb3RvdHlwZS50cmlnZ2VyRXZlbnQgPSBmdW5jdGlvbiAob2JqLCBldmVudE5hbWUpIHtcclxuICAgICAgICAgICAgICAgIHZhciBldmVudDtcclxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2Ygd2luZG93LkN1c3RvbUV2ZW50ID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQgPSBuZXcgQ3VzdG9tRXZlbnQoZXZlbnROYW1lKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHR5cGVvZiBkb2N1bWVudC5jcmVhdGVFdmVudCA9PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudChcIkhUTUxFdmVudHNcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQuaW5pdEV2ZW50KGV2ZW50TmFtZSwgdHJ1ZSwgdHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIGlmIChkb2N1bWVudC5jcmVhdGVFdmVudE9iamVjdCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50ID0gZG9jdW1lbnQuY3JlYXRlRXZlbnRPYmplY3QoKTtcclxuICAgICAgICAgICAgICAgICAgICBldmVudC5ldmVudFR5cGUgPSBldmVudE5hbWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBldmVudC5ldmVudE5hbWUgPSBldmVudE5hbWU7XHJcbiAgICAgICAgICAgICAgICBpZiAob2JqLmRpc3BhdGNoRXZlbnQpIHtcclxuICAgICAgICAgICAgICAgICAgICBvYmouZGlzcGF0Y2hFdmVudChldmVudCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIGlmIChvYmpbZXZlbnROYW1lXSkge1xyXG4gICAgICAgICAgICAgICAgICAgIG9ialtldmVudE5hbWVdKys7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIGlmIChvYmouZmlyZUV2ZW50ICYmIGh0bWxFdmVudHNbJ29uJyArIGV2ZW50TmFtZV0pIHtcclxuICAgICAgICAgICAgICAgICAgICBvYmouZmlyZUV2ZW50KCdvbicgKyBldmVudC5ldmVudFR5cGUsIGV2ZW50KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKG9ialtldmVudE5hbWVdKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgb2JqW2V2ZW50TmFtZV0oKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKG9ialsnb24nICsgZXZlbnROYW1lXSkge1xyXG4gICAgICAgICAgICAgICAgICAgIG9ialsnb24nICsgZXZlbnROYW1lXSgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAvKipcclxuICAgICAgICAgICAgICogR2V0IGEgY3NzIHN0eWxlIHByb3BlcnR5IHZhbHVlIGJyb3dzZXIgaW5kZXBlbmRlbnRcclxuICAgICAgICAgICAgICpcclxuICAgICAgICAgICAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWwgLSBUaGUgSFRNTEVsZW1lbnQgdG8gbG9va3VwXHJcbiAgICAgICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBqc1Byb3BlcnR5IC0gVGhlIGNzcyBwcm9wZXJ0eSBuYW1lIGluIGphdmFzY3JpcHQgaW4gY2FtZWxDYXNlIChlLmcuIFwibWFyZ2luTGVmdFwiLCBub3QgXCJtYXJnaW4tbGVmdFwiKVxyXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHtzdHJpbmd9IC0gdGhlIHByb3BlcnR5IHZhbHVlXHJcbiAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLmdldFN0eWxlID0gZnVuY3Rpb24gKGVsLCBqc1Byb3BlcnR5KSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgY3NzUHJvcGVydHkgPSBqc1Byb3BlcnR5LnJlcGxhY2UoLyhbQS1aXSkvZywgXCItJDFcIikudG9Mb3dlckNhc2UoKTtcclxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2Ygd2luZG93LmdldENvbXB1dGVkU3R5bGUgPT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShlbCkuZ2V0UHJvcGVydHlWYWx1ZShjc3NQcm9wZXJ0eSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZWwuY3VycmVudFN0eWxlW2pzUHJvcGVydHldO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLmNsZWFyVGltZW91dHMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy50aW1lb3V0cykge1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGlkeCBpbiB0aGlzLnRpbWVvdXRzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aGlzLnRpbWVvdXRzW2lkeF0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy50aW1lb3V0cy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudGltZW91dHMgPSBbXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKHRoaXMuaW5uZXIsICdjb2xsaWRlLmxlZnQnLCB0aGlzLmNsZWFyTGlzdGVuZXJMZWZ0KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKHRoaXMuaW5uZXIsICdjb2xsaWRlLnJpZ2h0JywgdGhpcy5jbGVhckxpc3RlbmVyUmlnaHQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlbW92ZUV2ZW50TGlzdGVuZXIodGhpcy5pbm5lciwgJ2NvbGxpZGUudG9wJywgdGhpcy5jbGVhckxpc3RlbmVyVG9wKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKHRoaXMuaW5uZXIsICdjb2xsaWRlLmJvdHRvbScsIHRoaXMuY2xlYXJMaXN0ZW5lckJvdHRvbSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAvKipcclxuICAgICAgICAgICAgICogTW91c2UgZG93biBoYW5kbGVyXHJcbiAgICAgICAgICAgICAqIFJlZ2lzdGVycyB0aGUgbW91c2Vtb3ZlIGFuZCBtb3VzZXVwIGhhbmRsZXJzIGFuZCBmaW5kcyB0aGUgbmV4dCBpbm5lciBlbGVtZW50XHJcbiAgICAgICAgICAgICAqXHJcbiAgICAgICAgICAgICAqIEBwYXJhbSB7TW91c2VFdmVudH0gZSAtIFRoZSBtb3VzZSBkb3duIGV2ZW50IG9iamVjdFxyXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHt2b2lkfVxyXG4gICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgWndvb3NoLnByb3RvdHlwZS5tb3VzZURvd24gPSBmdW5jdGlvbiAoZSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIF90aGlzID0gdGhpcztcclxuICAgICAgICAgICAgICAgIHRoaXMuY2xlYXJUaW1lb3V0cygpO1xyXG4gICAgICAgICAgICAgICAgLyogZHJhZyBvbmx5IGlmIHRoZSBsZWZ0IG1vdXNlIGJ1dHRvbiB3YXMgcHJlc3NlZCAqL1xyXG4gICAgICAgICAgICAgICAgaWYgKChcIndoaWNoXCIgaW4gZSAmJiBlLndoaWNoID09IDEpIHx8ICh0eXBlb2YgZS53aGljaCA9PSAndW5kZWZpbmVkJyAmJiBcImJ1dHRvblwiIGluIGUgJiYgZS5idXR0b24gPT0gMSkpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5lbGVtZW50QmVoaW5kQ3Vyc29ySXNNZShlLmNsaWVudFgsIGUuY2xpZW50WSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLyogcHJldmVudCBpbWFnZSBkcmFnZ2luZyBhY3Rpb24gKi9cclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGltZ3MgPSB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yQWxsKCdpbWcnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBpbWdzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbWdzW2ldLm9uZHJhZ3N0YXJ0ID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gZmFsc2U7IH07IC8vTVNJRVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIHNlYXJjaCB0aGUgRE9NIGZvciBleGNsdWRlIGVsZW1lbnRzICovXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMuZHJhZ09wdGlvbnMuZXhjbHVkZS5sZW5ndGggIT0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogZHJhZyBvbmx5IGlmIHRoZSBtb3VzZSBjbGlja2VkIG9uIGFuIGFsbG93ZWQgZWxlbWVudCAqL1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGVsID0gZG9jdW1lbnQuZWxlbWVudEZyb21Qb2ludChlLmNsaWVudFgsIGUuY2xpZW50WSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgZXhjbHVkZUVsZW1lbnRzID0gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvckFsbCh0aGlzLm9wdGlvbnMuZHJhZ09wdGlvbnMuZXhjbHVkZS5qb2luKCcsICcpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIGxvb3AgdGhyb3VnaCBhbGwgcGFyZW50IGVsZW1lbnRzIHVudGlsIHdlIGVuY291bnRlciBhbiBpbm5lciBkaXYgb3Igbm8gbW9yZSBwYXJlbnRzICovXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgaW5uZXJSZSA9IG5ldyBSZWdFeHAoXCIgXCIgKyB0aGlzLmNsYXNzSW5uZXIgKyBcIiBcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aGlsZSAoZWwgJiYgIWVsLmNsYXNzTmFtZS5tYXRjaChpbm5lclJlKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIGNvbXBhcmUgZWFjaCBwYXJlbnQsIGlmIGl0IGlzIGluIHRoZSBleGNsdWRlIGxpc3QgKi9cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGV4Y2x1ZGVFbGVtZW50cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBiYWlsIG91dCBpZiBhbiBlbGVtZW50IG1hdGNoZXMgKi9cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGV4Y2x1ZGVFbGVtZW50c1tpXSA9PSBlbCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWwgPSBlbC5wYXJlbnRFbGVtZW50O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHNlYXJjaCB0aGUgRE9NIGZvciBvbmx5IGVsZW1lbnRzLCBidXQgb25seSBpZiB0aGVyZSBhcmUgZWxlbWVudHMgc2V0XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qaWYgKHRoaXMub3B0aW9ucy5kcmFnT3B0aW9ucy5vbmx5Lmxlbmd0aCAhPSAwKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgb25seUVsZW1lbnRzID0gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvckFsbCh0aGlzLm9wdGlvbnMuZHJhZ09wdGlvbnMub25seS5qb2luKCcsICcpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBsb29wIHRocm91Z2ggdGhlIG5vZGVsaXN0IGFuZCBjaGVjayBmb3Igb3VyIGVsZW1lbnRcclxuICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgZm91bmQgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGV4Y2x1ZGVFbGVtZW50cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG9ubHlFbGVtZW50c1tpXSA9PSBlbCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3VuZCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZm91bmQgPT09IGZhbHNlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9Ki9cclxuICAgICAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5jbGFzc05hbWUgKz0gXCIgXCIgKyB0aGlzLmNsYXNzR3JhYmJpbmcgKyBcIiBcIjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLyogbm90ZSB0aGUgb3JpZ2luIHBvc2l0aW9ucyAqL1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRyYWdPcmlnaW5MZWZ0ID0gZS5jbGllbnRYO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRyYWdPcmlnaW5Ub3AgPSBlLmNsaWVudFk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZHJhZ09yaWdpblNjcm9sbExlZnQgPSB0aGlzLmdldFNjcm9sbExlZnQoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kcmFnT3JpZ2luU2Nyb2xsVG9wID0gdGhpcy5nZXRTY3JvbGxUb3AoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLyogaXQgbG9va3Mgc3RyYW5nZSBpZiBzY3JvbGwtYmVoYXZpb3IgaXMgc2V0IHRvIHNtb290aCAqL1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBhcmVudE9yaWdpblN0eWxlID0gdGhpcy5pbm5lci5wYXJlbnRFbGVtZW50LnN0eWxlLmNzc1RleHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdGhpcy5pbm5lci5wYXJlbnRFbGVtZW50LnN0eWxlLnNldFByb3BlcnR5ID09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaW5uZXIucGFyZW50RWxlbWVudC5zdHlsZS5zZXRQcm9wZXJ0eSgnc2Nyb2xsLWJlaGF2aW9yJywgJ2F1dG8nKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0ID8gZS5wcmV2ZW50RGVmYXVsdCgpIDogKGUucmV0dXJuVmFsdWUgPSBmYWxzZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudnggPSBbXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy52eSA9IFtdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiByZWdpc3RlciB0aGUgZXZlbnQgaGFuZGxlcnMgKi9cclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5tb3VzZU1vdmVIYW5kbGVyID0gdGhpcy5tb3VzZU1vdmUuYmluZCh0aGlzKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCwgJ21vdXNlbW92ZScsIHRoaXMubW91c2VNb3ZlSGFuZGxlcik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubW91c2VVcEhhbmRsZXIgPSBmdW5jdGlvbiAoZSkgeyByZXR1cm4gX3RoaXMubW91c2VVcChlKTsgfTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCwgJ21vdXNldXAnLCB0aGlzLm1vdXNlVXBIYW5kbGVyKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgKiBNb3VzZSB1cCBoYW5kbGVyXHJcbiAgICAgICAgICAgICAqIERlcmVnaXN0ZXJzIHRoZSBtb3VzZW1vdmUgYW5kIG1vdXNldXAgaGFuZGxlcnNcclxuICAgICAgICAgICAgICpcclxuICAgICAgICAgICAgICogQHBhcmFtIHtNb3VzZUV2ZW50fSBlIC0gVGhlIG1vdXNlIHVwIGV2ZW50IG9iamVjdFxyXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHt2b2lkfVxyXG4gICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgWndvb3NoLnByb3RvdHlwZS5tb3VzZVVwID0gZnVuY3Rpb24gKGUpIHtcclxuICAgICAgICAgICAgICAgIC8qIFRPRE86IHJlc3RvcmUgb3JpZ2luYWwgcG9zaXRpb24gdmFsdWUgKi9cclxuICAgICAgICAgICAgICAgIHRoaXMuaW5uZXIuc3R5bGUucG9zaXRpb24gPSAnJztcclxuICAgICAgICAgICAgICAgIHRoaXMuaW5uZXIuc3R5bGUudG9wID0gbnVsbDtcclxuICAgICAgICAgICAgICAgIHRoaXMuaW5uZXIuc3R5bGUubGVmdCA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnByZXNlbnQgPSAodGhpcy5nZXRUaW1lc3RhbXAoKSAvIDEwMDApOyAvL2luIHNlY29uZHNcclxuICAgICAgICAgICAgICAgIHZhciB4ID0gdGhpcy5nZXRSZWFsWCh0aGlzLmRyYWdPcmlnaW5MZWZ0ICsgdGhpcy5kcmFnT3JpZ2luU2Nyb2xsTGVmdCAtIGUuY2xpZW50WCk7XHJcbiAgICAgICAgICAgICAgICB2YXIgeSA9IHRoaXMuZ2V0UmVhbFkodGhpcy5kcmFnT3JpZ2luVG9wICsgdGhpcy5kcmFnT3JpZ2luU2Nyb2xsVG9wIC0gZS5jbGllbnRZKTtcclxuICAgICAgICAgICAgICAgIHZhciByZSA9IG5ldyBSZWdFeHAoXCIgXCIgKyB0aGlzLmNsYXNzR3JhYmJpbmcgKyBcIiBcIik7XHJcbiAgICAgICAgICAgICAgICBkb2N1bWVudC5ib2R5LmNsYXNzTmFtZSA9IGRvY3VtZW50LmJvZHkuY2xhc3NOYW1lLnJlcGxhY2UocmUsICcnKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuaW5uZXIucGFyZW50RWxlbWVudC5zdHlsZS5jc3NUZXh0ID0gdGhpcy5wYXJlbnRPcmlnaW5TdHlsZTtcclxuICAgICAgICAgICAgICAgIHRoaXMucmVtb3ZlRXZlbnRMaXN0ZW5lcihkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQsICdtb3VzZW1vdmUnLCB0aGlzLm1vdXNlTW92ZUhhbmRsZXIpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCwgJ21vdXNldXAnLCB0aGlzLm1vdXNlVXBIYW5kbGVyKTtcclxuICAgICAgICAgICAgICAgIGlmICh5ICE9IHRoaXMuZ2V0U2Nyb2xsVG9wKCkgfHwgeCAhPSB0aGlzLmdldFNjcm9sbExlZnQoKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciB0ID0gdGhpcy5wcmVzZW50IC0gKHRoaXMucGFzdCA/IHRoaXMucGFzdCA6IHRoaXMucHJlc2VudCk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHQgPiAwLjA1KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIGp1c3QgYWxpZ24gdG8gdGhlIGdyaWQgaWYgdGhlIG1vdXNlIGxlZnQgdW5tb3ZlZCBmb3IgbW9yZSB0aGFuIDAuMDUgc2Vjb25kcyAqL1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNjcm9sbFRvKHgsIHksIHRoaXMub3B0aW9ucy5kcmFnT3B0aW9ucy5mYWRlKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLmRyYWdPcHRpb25zLmZhZGUgJiYgdHlwZW9mIHRoaXMudnggIT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIHRoaXMudnkgIT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgZGVsdGFULCBkZWx0YVN4LCBkZWx0YVN5LCBsYXN0RGVsdGFTeCwgbGFzdERlbHRhU3k7XHJcbiAgICAgICAgICAgICAgICAgICAgZGVsdGFUID0gZGVsdGFTeCA9IGRlbHRhU3kgPSBsYXN0RGVsdGFTeCA9IGxhc3REZWx0YVN5ID0gMDtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpIGluIHRoaXMudnkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBhcnNlRmxvYXQoaSkgPiAodGhpcy5wcmVzZW50IC0gMC4xKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJiYgdHlwZW9mIGxhc3RUICE9ICd1bmRlZmluZWQnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAmJiB0eXBlb2YgbGFzdFN4ICE9ICd1bmRlZmluZWQnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAmJiB0eXBlb2YgbGFzdFN5ICE9ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWx0YVQgKz0gcGFyc2VGbG9hdChpKSAtIGxhc3RUO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGFzdERlbHRhU3ggPSB0aGlzLnZ4W2ldIC0gbGFzdFN4O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGFzdERlbHRhU3kgPSB0aGlzLnZ5W2ldIC0gbGFzdFN5O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsdGFTeCArPSBNYXRoLmFicyhsYXN0RGVsdGFTeCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWx0YVN5ICs9IE1hdGguYWJzKGxhc3REZWx0YVN5KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbGFzdFQgPSBwYXJzZUZsb2F0KGkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbGFzdFN4ID0gdGhpcy52eFtpXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGxhc3RTeSA9IHRoaXMudnlbaV07XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHZhciB2eCA9IGRlbHRhVCA9PSAwID8gMCA6IGxhc3REZWx0YVN4ID4gMCA/IGRlbHRhU3ggLyBkZWx0YVQgOiBkZWx0YVN4IC8gLWRlbHRhVDtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgdnkgPSBkZWx0YVQgPT0gMCA/IDAgOiBsYXN0RGVsdGFTeSA+IDAgPyBkZWx0YVN5IC8gZGVsdGFUIDogZGVsdGFTeSAvIC1kZWx0YVQ7XHJcbiAgICAgICAgICAgICAgICAgICAgLyogdiBzaG91bGQgbm90IGV4Y2VlZCB2TWF4IG9yIC12TWF4IC0+IHdvdWxkIGJlIHRvbyBmYXN0IGFuZCBzaG91bGQgZXhjZWVkIHZNaW4gb3IgLXZNaW4gKi9cclxuICAgICAgICAgICAgICAgICAgICB2YXIgdk1heCA9IHRoaXMub3B0aW9ucy5kcmFnT3B0aW9ucy5tYXhTcGVlZDtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgdk1pbiA9IHRoaXMub3B0aW9ucy5kcmFnT3B0aW9ucy5taW5TcGVlZDtcclxuICAgICAgICAgICAgICAgICAgICAvKiBpZiB0aGUgc3BlZWQgaXMgbm90IHdpdGhvdXQgYm91bmQgZm9yIGZhZGUsIGp1c3QgZG8gYSByZWd1bGFyIHNjcm9sbCB3aGVuIHRoZXJlIGlzIGEgZ3JpZCovXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHZ5IDwgdk1pbiAmJiB2eSA+IC12TWluICYmIHZ4IDwgdk1pbiAmJiB2eCA+IC12TWluKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMuZ3JpZFkgPiAxIHx8IHRoaXMub3B0aW9ucy5ncmlkWCA+IDEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsVG8oeCwgeSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB2YXIgdnggPSAodnggPD0gdk1heCAmJiB2eCA+PSAtdk1heCkgPyB2eCA6ICh2eCA+IDAgPyB2TWF4IDogLXZNYXgpO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciB2eSA9ICh2eSA8PSB2TWF4ICYmIHZ5ID49IC12TWF4KSA/IHZ5IDogKHZ5ID4gMCA/IHZNYXggOiAtdk1heCk7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGF4ID0gKHZ4ID4gMCA/IC0xIDogMSkgKiB0aGlzLm9wdGlvbnMuZHJhZ09wdGlvbnMuYnJha2VTcGVlZDtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgYXkgPSAodnkgPiAwID8gLTEgOiAxKSAqIHRoaXMub3B0aW9ucy5kcmFnT3B0aW9ucy5icmFrZVNwZWVkO1xyXG4gICAgICAgICAgICAgICAgICAgIHggPSAoKDAgLSBNYXRoLnBvdyh2eCwgMikpIC8gKDIgKiBheCkpICsgdGhpcy5nZXRTY3JvbGxMZWZ0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgeSA9ICgoMCAtIE1hdGgucG93KHZ5LCAyKSkgLyAoMiAqIGF5KSkgKyB0aGlzLmdldFNjcm9sbFRvcCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsVG8oeCwgeSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAvKiBpbiBhbGwgb3RoZXIgY2FzZXMsIGRvIGEgcmVndWxhciBzY3JvbGwgKi9cclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnNjcm9sbFRvKHgsIHksIHRoaXMub3B0aW9ucy5kcmFnT3B0aW9ucy5mYWRlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgICAqIENhbGN1bGF0ZXMgdGhlIHJvdW5kZWQgYW5kIHNjYWxlZCB4LWNvb3JkaW5hdGUuXHJcbiAgICAgICAgICAgICAqXHJcbiAgICAgICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSB4IC0gdGhlIHgtY29vcmRpbmF0ZVxyXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHtudW1iZXJ9IC0gdGhlIGZpbmFsIHgtY29vcmRpbmF0ZVxyXG4gICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgWndvb3NoLnByb3RvdHlwZS5nZXRSZWFsWCA9IGZ1bmN0aW9uICh4KSB7XHJcbiAgICAgICAgICAgICAgICAvL3N0aWNrIHRoZSBlbGVtZW50IHRvIHRoZSBncmlkLCBpZiBncmlkIGVxdWFscyAxIHRoZSB2YWx1ZSBkb2VzIG5vdCBjaGFuZ2VcclxuICAgICAgICAgICAgICAgIHggPSBNYXRoLnJvdW5kKHggLyAodGhpcy5vcHRpb25zLmdyaWRYICogdGhpcy5nZXRTY2FsZSgpKSkgKiAodGhpcy5vcHRpb25zLmdyaWRYICogdGhpcy5nZXRTY2FsZSgpKTtcclxuICAgICAgICAgICAgICAgIHZhciBzY3JvbGxNYXhMZWZ0ID0gKHRoaXMuc2Nyb2xsRWxlbWVudC5zY3JvbGxXaWR0aCAtIHRoaXMuc2Nyb2xsRWxlbWVudC5jbGllbnRXaWR0aCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gKHggPiBzY3JvbGxNYXhMZWZ0KSA/IHNjcm9sbE1heExlZnQgOiB4O1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAvKipcclxuICAgICAgICAgICAgICogQ2FsY3VsYXRlcyB0aGUgcm91bmRlZCBhbmQgc2NhbGVkIHktY29vcmRpbmF0ZS5cclxuICAgICAgICAgICAgICpcclxuICAgICAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IHkgLSB0aGUgeS1jb29yZGluYXRlXHJcbiAgICAgICAgICAgICAqIEByZXR1cm4ge251bWJlcn0gLSB0aGUgZmluYWwgeS1jb29yZGluYXRlXHJcbiAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLmdldFJlYWxZID0gZnVuY3Rpb24gKHkpIHtcclxuICAgICAgICAgICAgICAgIC8vc3RpY2sgdGhlIGVsZW1lbnQgdG8gdGhlIGdyaWQsIGlmIGdyaWQgZXF1YWxzIDEgdGhlIHZhbHVlIGRvZXMgbm90IGNoYW5nZVxyXG4gICAgICAgICAgICAgICAgeSA9IE1hdGgucm91bmQoeSAvICh0aGlzLm9wdGlvbnMuZ3JpZFkgKiB0aGlzLmdldFNjYWxlKCkpKSAqICh0aGlzLm9wdGlvbnMuZ3JpZFkgKiB0aGlzLmdldFNjYWxlKCkpO1xyXG4gICAgICAgICAgICAgICAgdmFyIHNjcm9sbE1heFRvcCA9ICh0aGlzLnNjcm9sbEVsZW1lbnQuc2Nyb2xsSGVpZ2h0IC0gdGhpcy5zY3JvbGxFbGVtZW50LmNsaWVudEhlaWdodCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gKHkgPiBzY3JvbGxNYXhUb3ApID8gc2Nyb2xsTWF4VG9wIDogeTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgICAqIENhbGN1bGF0ZXMgZWFjaCBzdGVwIG9mIGEgc2Nyb2xsIGZhZGVvdXQgYW5pbWF0aW9uIGJhc2VkIG9uIHRoZSBpbml0aWFsIHZlbG9jaXR5LlxyXG4gICAgICAgICAgICAgKiBTdG9wcyBhbnkgY3VycmVudGx5IHJ1bm5pbmcgc2Nyb2xsIGFuaW1hdGlvbi5cclxuICAgICAgICAgICAgICpcclxuICAgICAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IHZ4IC0gdGhlIGluaXRpYWwgdmVsb2NpdHkgaW4gaG9yaXpvbnRhbCBkaXJlY3Rpb25cclxuICAgICAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IHZ5IC0gdGhlIGluaXRpYWwgdmVsb2NpdHkgaW4gdmVydGljYWwgZGlyZWN0aW9uXHJcbiAgICAgICAgICAgICAqIEByZXR1cm4ge251bWJlcn0gLSB0aGUgZmluYWwgeS1jb29yZGluYXRlXHJcbiAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLmZhZGVPdXRCeVZlbG9jaXR5ID0gZnVuY3Rpb24gKHZ4LCB2eSkge1xyXG4gICAgICAgICAgICAgICAgLyogVE9ETzogY2FsYyB2IGhlcmUgYW5kIHdpdGggbW9yZSBpbmZvLCBtb3JlIHByZWNpc2VseSAqL1xyXG4gICAgICAgICAgICAgICAgdmFyIF90aGlzID0gdGhpcztcclxuICAgICAgICAgICAgICAgIC8qIGNhbGN1bGF0ZSB0aGUgYnJha2UgYWNjZWxlcmF0aW9uIGluIGJvdGggZGlyZWN0aW9ucyBzZXBhcmF0ZWx5ICovXHJcbiAgICAgICAgICAgICAgICB2YXIgYXkgPSAodnkgPiAwID8gLTEgOiAxKSAqIHRoaXMub3B0aW9ucy5kcmFnT3B0aW9ucy5icmFrZVNwZWVkO1xyXG4gICAgICAgICAgICAgICAgdmFyIGF4ID0gKHZ4ID4gMCA/IC0xIDogMSkgKiB0aGlzLm9wdGlvbnMuZHJhZ09wdGlvbnMuYnJha2VTcGVlZDtcclxuICAgICAgICAgICAgICAgIC8qIGZpbmQgdGhlIGRpcmVjdGlvbiB0aGF0IG5lZWRzIGxvbmdlciB0byBzdG9wLCBhbmQgcmVjYWxjdWxhdGUgdGhlIGFjY2VsZXJhdGlvbiAqL1xyXG4gICAgICAgICAgICAgICAgdmFyIHRtYXggPSBNYXRoLm1heCgoMCAtIHZ5KSAvIGF5LCAoMCAtIHZ4KSAvIGF4KTtcclxuICAgICAgICAgICAgICAgIGF4ID0gKDAgLSB2eCkgLyB0bWF4O1xyXG4gICAgICAgICAgICAgICAgYXkgPSAoMCAtIHZ5KSAvIHRtYXg7XHJcbiAgICAgICAgICAgICAgICB2YXIgZnBzID0gdGhpcy5vcHRpb25zLmRyYWdPcHRpb25zLmZwcztcclxuICAgICAgICAgICAgICAgIHZhciBtZSA9IHRoaXM7XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8ICgodG1heCAqIGZwcykgKyAoMCAvIGZwcykpOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgdCA9ICgoaSArIDEpIC8gZnBzKTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgc3kgPSB0aGlzLmdldFNjcm9sbFRvcCgpICsgKHZ5ICogdCkgKyAoMC41ICogYXkgKiB0ICogdCk7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHN4ID0gdGhpcy5nZXRTY3JvbGxMZWZ0KCkgKyAodnggKiB0KSArICgwLjUgKiBheCAqIHQgKiB0KTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnRpbWVvdXRzLnB1c2goc2V0VGltZW91dCgoZnVuY3Rpb24gKHgsIHksIG1lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZS5zZXRTY3JvbGxUb3AoeSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZS5zZXRTY3JvbGxMZWZ0KHgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWUub3JpZ2luU2Nyb2xsTGVmdCA9IHg7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZS5vcmlnaW5TY3JvbGxUb3AgPSB5O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgIH0pKHN4LCBzeSwgbWUpLCAoaSArIDEpICogKDEwMDAgLyBmcHMpKSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAoaSA+IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAvKiByb3VuZCB0aGUgbGFzdCBzdGVwIGJhc2VkIG9uIHRoZSBkaXJlY3Rpb24gb2YgdGhlIGZhZGUgKi9cclxuICAgICAgICAgICAgICAgICAgICBzeCA9IHZ4ID4gMCA/IE1hdGguY2VpbChzeCkgOiBNYXRoLmZsb29yKHN4KTtcclxuICAgICAgICAgICAgICAgICAgICBzeSA9IHZ5ID4gMCA/IE1hdGguY2VpbChzeSkgOiBNYXRoLmZsb29yKHN5KTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnRpbWVvdXRzLnB1c2goc2V0VGltZW91dCgoZnVuY3Rpb24gKHgsIHksIG1lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZS5zZXRTY3JvbGxUb3AoeSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZS5zZXRTY3JvbGxMZWZ0KHgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWUub3JpZ2luU2Nyb2xsTGVmdCA9IHg7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZS5vcmlnaW5TY3JvbGxUb3AgPSB5O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgIH0pKHN4LCBzeSwgbWUpLCAoaSArIDIpICogKDEwMDAgLyBmcHMpKSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAvKiBzdG9wIHRoZSBhbmltYXRpb24gd2hlbiBjb2xsaWRpbmcgd2l0aCB0aGUgYm9yZGVycyAqL1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jbGVhckxpc3RlbmVyTGVmdCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIF90aGlzLmNsZWFyVGltZW91dHMoKTsgfTtcclxuICAgICAgICAgICAgICAgIHRoaXMuY2xlYXJMaXN0ZW5lclJpZ2h0ID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gX3RoaXMuY2xlYXJUaW1lb3V0cygpOyB9O1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jbGVhckxpc3RlbmVyVG9wID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gX3RoaXMuY2xlYXJUaW1lb3V0cygpOyB9O1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jbGVhckxpc3RlbmVyQm90dG9tID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gX3RoaXMuY2xlYXJUaW1lb3V0cygpOyB9O1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKHRoaXMuaW5uZXIsICdjb2xsaWRlLmxlZnQnLCB0aGlzLmNsZWFyTGlzdGVuZXJMZWZ0KTtcclxuICAgICAgICAgICAgICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcih0aGlzLmlubmVyLCAnY29sbGlkZS5yaWdodCcsIHRoaXMuY2xlYXJMaXN0ZW5lclJpZ2h0KTtcclxuICAgICAgICAgICAgICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcih0aGlzLmlubmVyLCAnY29sbGlkZS50b3AnLCB0aGlzLmNsZWFyTGlzdGVuZXJUb3ApO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKHRoaXMuaW5uZXIsICdjb2xsaWRlLmJvdHRvbScsIHRoaXMuY2xlYXJMaXN0ZW5lckJvdHRvbSk7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIFp3b29zaC5wcm90b3R5cGUuZmFkZU91dEJ5Q29vcmRzID0gZnVuY3Rpb24gKHgsIHkpIHtcclxuICAgICAgICAgICAgICAgIHggPSB0aGlzLmdldFJlYWxYKHgpO1xyXG4gICAgICAgICAgICAgICAgeSA9IHRoaXMuZ2V0UmVhbFkoeSk7XHJcbiAgICAgICAgICAgICAgICB2YXIgYSA9IHRoaXMub3B0aW9ucy5kcmFnT3B0aW9ucy5icmFrZVNwZWVkICogLTE7XHJcbiAgICAgICAgICAgICAgICB2YXIgdnkgPSAwIC0gKDIgKiBhICogKHkgLSB0aGlzLmdldFNjcm9sbFRvcCgpKSk7XHJcbiAgICAgICAgICAgICAgICB2YXIgdnggPSAwIC0gKDIgKiBhICogKHggLSB0aGlzLmdldFNjcm9sbExlZnQoKSkpO1xyXG4gICAgICAgICAgICAgICAgdnkgPSAodnkgPiAwID8gMSA6IC0xKSAqIE1hdGguc3FydChNYXRoLmFicyh2eSkpO1xyXG4gICAgICAgICAgICAgICAgdnggPSAodnggPiAwID8gMSA6IC0xKSAqIE1hdGguc3FydChNYXRoLmFicyh2eCkpO1xyXG4gICAgICAgICAgICAgICAgdmFyIHN4ID0geCAtIHRoaXMuZ2V0U2Nyb2xsTGVmdCgpO1xyXG4gICAgICAgICAgICAgICAgdmFyIHN5ID0geSAtIHRoaXMuZ2V0U2Nyb2xsVG9wKCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoTWF0aC5hYnMoc3kpID4gTWF0aC5hYnMoc3gpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdnggPSAodnggPiAwID8gMSA6IC0xKSAqIE1hdGguYWJzKChzeCAvIHN5KSAqIHZ5KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHZ5ID0gKHZ5ID4gMCA/IDEgOiAtMSkgKiBNYXRoLmFicygoc3kgLyBzeCkgKiB2eCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNsZWFyVGltZW91dHMoKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuZmFkZU91dEJ5VmVsb2NpdHkodngsIHZ5KTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgICAqIE1vdXNlIG1vdmUgaGFuZGxlclxyXG4gICAgICAgICAgICAgKiBDYWxjdWNhdGVzIHRoZSB4IGFuZCB5IGRlbHRhcyBhbmQgc2Nyb2xsc1xyXG4gICAgICAgICAgICAgKlxyXG4gICAgICAgICAgICAgKiBAcGFyYW0ge01vdXNlRXZlbnR9IGUgLSBUaGUgbW91c2UgbW92ZSBldmVudCBvYmplY3RcclxuICAgICAgICAgICAgICogQHJldHVybiB7dm9pZH1cclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIFp3b29zaC5wcm90b3R5cGUubW91c2VNb3ZlID0gZnVuY3Rpb24gKGUpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucHJlc2VudCA9ICh0aGlzLmdldFRpbWVzdGFtcCgpIC8gMTAwMCk7IC8vaW4gc2Vjb25kc1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jbGVhclRleHRTZWxlY3Rpb24oKTtcclxuICAgICAgICAgICAgICAgIC8qIGlmIHRoZSBtb3VzZSBsZWZ0IHRoZSB3aW5kb3cgYW5kIHRoZSBidXR0b24gaXMgbm90IHByZXNzZWQgYW55bW9yZSwgYWJvcnQgbW92aW5nICovXHJcbiAgICAgICAgICAgICAgICAvL2lmICgoZS5idXR0b25zID09IDAgJiYgZS5idXR0b24gPT0gMCkgfHwgKHR5cGVvZiBlLmJ1dHRvbnMgPT0gJ3VuZGVmaW5lZCcgJiYgZS5idXR0b24gPT0gMCkpIHtcclxuICAgICAgICAgICAgICAgIGlmICgoXCJ3aGljaFwiIGluIGUgJiYgZS53aGljaCA9PSAwKSB8fCAodHlwZW9mIGUud2hpY2ggPT0gJ3VuZGVmaW5lZCcgJiYgXCJidXR0b25cIiBpbiBlICYmIGUuYnV0dG9uID09IDApKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5tb3VzZVVwKGUpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHZhciB4ID0gdGhpcy5kcmFnT3JpZ2luTGVmdCArIHRoaXMuZHJhZ09yaWdpblNjcm9sbExlZnQgLSBlLmNsaWVudFg7XHJcbiAgICAgICAgICAgICAgICB2YXIgeSA9IHRoaXMuZHJhZ09yaWdpblRvcCArIHRoaXMuZHJhZ09yaWdpblNjcm9sbFRvcCAtIGUuY2xpZW50WTtcclxuICAgICAgICAgICAgICAgIC8qIGlmIGVsYXN0aWMgZWRnZXMgYXJlIHNldCwgc2hvdyB0aGUgZWxlbWVudCBwc2V1ZG8gc2Nyb2xsZWQgYnkgcmVsYXRpdmUgcG9zaXRpb24gKi9cclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLnRyaWdnZXJlZC5jb2xsaWRlQm90dG9tICYmIHRoaXMub3B0aW9ucy5lbGFzdGljRWRnZXMuYm90dG9tID09PSB0cnVlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pbm5lci5zdHlsZS5wb3NpdGlvbiA9ICdyZWxhdGl2ZSc7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pbm5lci5zdHlsZS50b3AgPSAoKHRoaXMuZ2V0U2Nyb2xsVG9wKCkgLSB5KSAvIDIpICsgJ3B4JztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLnRyaWdnZXJlZC5jb2xsaWRlVG9wICYmIHRoaXMub3B0aW9ucy5lbGFzdGljRWRnZXMudG9wID09PSB0cnVlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pbm5lci5zdHlsZS5wb3NpdGlvbiA9ICdyZWxhdGl2ZSc7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pbm5lci5zdHlsZS50b3AgPSAoeSAvIC0yKSArICdweCc7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy50cmlnZ2VyZWQuY29sbGlkZUxlZnQgJiYgdGhpcy5vcHRpb25zLmVsYXN0aWNFZGdlcy5sZWZ0ID09PSB0cnVlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pbm5lci5zdHlsZS5wb3NpdGlvbiA9ICdyZWxhdGl2ZSc7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pbm5lci5zdHlsZS5sZWZ0ID0gKHggLyAtMikgKyAncHgnO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMudHJpZ2dlcmVkLmNvbGxpZGVSaWdodCAmJiB0aGlzLm9wdGlvbnMuZWxhc3RpY0VkZ2VzLnJpZ2h0ID09PSB0cnVlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pbm5lci5zdHlsZS5wb3NpdGlvbiA9ICdyZWxhdGl2ZSc7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pbm5lci5zdHlsZS5sZWZ0ID0gKCh0aGlzLmdldFNjcm9sbExlZnQoKSAtIHgpIC8gMikgKyAncHgnO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdGhpcy52eFt0aGlzLnByZXNlbnRdID0geDtcclxuICAgICAgICAgICAgICAgIHRoaXMudnlbdGhpcy5wcmVzZW50XSA9IHk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNjcm9sbFRvKHgsIHksIGZhbHNlKTtcclxuICAgICAgICAgICAgICAgIHRoaXMucGFzdCA9IHRoaXMucHJlc2VudDtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgICAqIHNjcm9sbEJ5IGhlbHBlciBtZXRob2QgdG8gc2Nyb2xsIGJ5IGFuIGFtb3VudCBvZiBwaXhlbHMgaW4geC0gYW5kIHktZGlyZWN0aW9uXHJcbiAgICAgICAgICAgICAqXHJcbiAgICAgICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSB4IC0gYW1vdW50IG9mIHBpeGVscyB0byBzY3JvbGwgaW4geC1kaXJlY3Rpb25cclxuICAgICAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IHkgLSBhbW91bnQgb2YgcGl4ZWxzIHRvIHNjcm9sbCBpbiB5LWRpcmVjdGlvblxyXG4gICAgICAgICAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IHNtb290aCAtIHdoZXRoZXIgdG8gc2Nyb2xsIHNtb290aCBvciBpbnN0YW50XHJcbiAgICAgICAgICAgICAqIEByZXR1cm4ge3ZvaWR9XHJcbiAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLnNjcm9sbEJ5ID0gZnVuY3Rpb24gKHgsIHksIHNtb290aCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHNtb290aCA9PT0gdm9pZCAwKSB7IHNtb290aCA9IHRydWU7IH1cclxuICAgICAgICAgICAgICAgIHZhciBhYnNvbHV0ZVggPSB0aGlzLmdldFNjcm9sbExlZnQoKSArIHg7XHJcbiAgICAgICAgICAgICAgICB2YXIgYWJzb2x1dGVZID0gdGhpcy5nZXRTY3JvbGxUb3AoKSArIHk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNjcm9sbFRvKGFic29sdXRlWCwgYWJzb2x1dGVZLCBzbW9vdGgpO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAvKipcclxuICAgICAgICAgICAgICogc2Nyb2xsQnkgaGVscGVyIG1ldGhvZCB0byBzY3JvbGwgdG8gYSB4LSBhbmQgeS1jb29yZGluYXRlXHJcbiAgICAgICAgICAgICAqXHJcbiAgICAgICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSB4IC0geC1jb29yZGluYXRlIHRvIHNjcm9sbCB0b1xyXG4gICAgICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0geSAtIHktY29vcmRpbmF0ZSB0byBzY3JvbGwgdG9cclxuICAgICAgICAgICAgICogQHBhcmFtIHtib29sZWFufSBzbW9vdGggLSB3aGV0aGVyIHRvIHNjcm9sbCBzbW9vdGggb3IgaW5zdGFudFxyXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHt2b2lkfVxyXG4gICAgICAgICAgICAgKlxyXG4gICAgICAgICAgICAgKiBAVE9ETzogQ1NTMyB0cmFuc2l0aW9ucyBpZiBhdmFpbGFibGUgaW4gYnJvd3NlclxyXG4gICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgWndvb3NoLnByb3RvdHlwZS5zY3JvbGxUbyA9IGZ1bmN0aW9uICh4LCB5LCBzbW9vdGgpIHtcclxuICAgICAgICAgICAgICAgIGlmIChzbW9vdGggPT09IHZvaWQgMCkgeyBzbW9vdGggPSB0cnVlOyB9XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNsZWFyVGltZW91dHMoKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsTWF4TGVmdCA9ICh0aGlzLnNjcm9sbEVsZW1lbnQuc2Nyb2xsV2lkdGggLSB0aGlzLnNjcm9sbEVsZW1lbnQuY2xpZW50V2lkdGgpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zY3JvbGxNYXhUb3AgPSAodGhpcy5zY3JvbGxFbGVtZW50LnNjcm9sbEhlaWdodCAtIHRoaXMuc2Nyb2xsRWxlbWVudC5jbGllbnRIZWlnaHQpO1xyXG4gICAgICAgICAgICAgICAgLyogbm8gbmVnYXRpdmUgdmFsdWVzIG9yIHZhbHVlcyBncmVhdGVyIHRoYW4gdGhlIG1heGltdW0gKi9cclxuICAgICAgICAgICAgICAgIHZhciB4ID0gKHggPiB0aGlzLnNjcm9sbE1heExlZnQpID8gdGhpcy5zY3JvbGxNYXhMZWZ0IDogKHggPCAwKSA/IDAgOiB4O1xyXG4gICAgICAgICAgICAgICAgdmFyIHkgPSAoeSA+IHRoaXMuc2Nyb2xsTWF4VG9wKSA/IHRoaXMuc2Nyb2xsTWF4VG9wIDogKHkgPCAwKSA/IDAgOiB5O1xyXG4gICAgICAgICAgICAgICAgLyogcmVtZW1iZXIgdGhlIG9sZCB2YWx1ZXMgKi9cclxuICAgICAgICAgICAgICAgIHRoaXMub3JpZ2luU2Nyb2xsTGVmdCA9IHRoaXMuZ2V0U2Nyb2xsTGVmdCgpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5vcmlnaW5TY3JvbGxUb3AgPSB0aGlzLmdldFNjcm9sbFRvcCgpO1xyXG4gICAgICAgICAgICAgICAgaWYgKHggIT0gdGhpcy5nZXRTY3JvbGxMZWZ0KCkgfHwgeSAhPSB0aGlzLmdldFNjcm9sbFRvcCgpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy53aGVlbE9wdGlvbnMuc21vb3RoICE9PSB0cnVlIHx8IHNtb290aCA9PT0gZmFsc2UpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXRTY3JvbGxUb3AoeSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0U2Nyb2xsTGVmdCh4KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZmFkZU91dEJ5Q29vcmRzKHgsIHkpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgICAqIFJlZ2lzdGVyIGN1c3RvbSBldmVudCBjYWxsYmFja3NcclxuICAgICAgICAgICAgICpcclxuICAgICAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50IC0gVGhlIGV2ZW50IG5hbWVcclxuICAgICAgICAgICAgICogQHBhcmFtIHsoZTogRXZlbnQpID0+IGFueX0gY2FsbGJhY2sgLSBBIGNhbGxiYWNrIGZ1bmN0aW9uIHRvIGV4ZWN1dGUgd2hlbiB0aGUgZXZlbnQgcmFpc2VzXHJcbiAgICAgICAgICAgICAqIEByZXR1cm4ge1p3b29zaH0gLSBUaGUgWndvb3NoIG9iamVjdCBpbnN0YW5jZVxyXG4gICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgWndvb3NoLnByb3RvdHlwZS5vbiA9IGZ1bmN0aW9uIChldmVudCwgY2FsbGJhY2spIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcih0aGlzLmlubmVyLCBldmVudCwgY2FsbGJhY2spO1xyXG4gICAgICAgICAgICAgICAgLyogc2V0IHRoZSBldmVudCB1bnRyaWdnZXJlZCBhbmQgY2FsbCB0aGUgZnVuY3Rpb24sIHRvIHJldHJpZ2dlciBtZXQgZXZlbnRzICovXHJcbiAgICAgICAgICAgICAgICB2YXIgZiA9IGV2ZW50LnJlcGxhY2UoL1xcLihbYS16XSkvLCBTdHJpbmcuY2FsbC5iaW5kKGV2ZW50LnRvVXBwZXJDYXNlKSkucmVwbGFjZSgvXFwuLywgJycpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy50cmlnZ2VyZWRbZl0gPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIHRoaXMub25TY3JvbGwoKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAvKipcclxuICAgICAgICAgICAgICogRGVyZWdpc3RlciBjdXN0b20gZXZlbnQgY2FsbGJhY2tzXHJcbiAgICAgICAgICAgICAqXHJcbiAgICAgICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBldmVudCAtIFRoZSBldmVudCBuYW1lXHJcbiAgICAgICAgICAgICAqIEBwYXJhbSB7KGU6IEV2ZW50KSA9PiBhbnl9IGNhbGxiYWNrIC0gQSBjYWxsYmFjayBmdW5jdGlvbiB0byBleGVjdXRlIHdoZW4gdGhlIGV2ZW50IHJhaXNlc1xyXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHtad29vc2h9IC0gVGhlIFp3b29zaCBvYmplY3QgaW5zdGFuY2VcclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIFp3b29zaC5wcm90b3R5cGUub2ZmID0gZnVuY3Rpb24gKGV2ZW50LCBjYWxsYmFjaykge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKHRoaXMuaW5uZXIsIGV2ZW50LCBjYWxsYmFjayk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgICAqIFJldmVydCBhbGwgRE9NIG1hbmlwdWxhdGlvbnMgYW5kIGRlcmVnaXN0ZXIgYWxsIGV2ZW50IGhhbmRsZXJzXHJcbiAgICAgICAgICAgICAqXHJcbiAgICAgICAgICAgICAqIEByZXR1cm4ge3ZvaWR9XHJcbiAgICAgICAgICAgICAqIEBUT0RPOiByZW1vdmluZyB3aGVlbFpvb21IYW5kbGVyIGRvZXMgbm90IHdvcmtcclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIFp3b29zaC5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHZhciB4ID0gdGhpcy5nZXRTY3JvbGxMZWZ0KCk7XHJcbiAgICAgICAgICAgICAgICB2YXIgeSA9IHRoaXMuZ2V0U2Nyb2xsVG9wKCk7XHJcbiAgICAgICAgICAgICAgICAvKiByZW1vdmUgdGhlIG91dGVyIGFuZCBncmFiIENTUyBjbGFzc2VzICovXHJcbiAgICAgICAgICAgICAgICB2YXIgcmUgPSBuZXcgUmVnRXhwKFwiIFwiICsgdGhpcy5jbGFzc091dGVyICsgXCIgXCIpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jb250YWluZXIuY2xhc3NOYW1lID0gdGhpcy5jb250YWluZXIuY2xhc3NOYW1lLnJlcGxhY2UocmUsICcnKTtcclxuICAgICAgICAgICAgICAgIHZhciByZSA9IG5ldyBSZWdFeHAoXCIgXCIgKyB0aGlzLmNsYXNzR3JhYiArIFwiIFwiKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuaW5uZXIuY2xhc3NOYW1lID0gdGhpcy5pbm5lci5jbGFzc05hbWUucmVwbGFjZShyZSwgJycpO1xyXG4gICAgICAgICAgICAgICAgdmFyIHJlID0gbmV3IFJlZ0V4cChcIiBcIiArIHRoaXMuY2xhc3NOb0dyYWIgKyBcIiBcIik7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNvbnRhaW5lci5jbGFzc05hbWUgPSB0aGlzLmNvbnRhaW5lci5jbGFzc05hbWUucmVwbGFjZShyZSwgJycpO1xyXG4gICAgICAgICAgICAgICAgLyogbW92ZSBhbGwgY2hpbGROb2RlcyBiYWNrIHRvIHRoZSBvbGQgb3V0ZXIgZWxlbWVudCBhbmQgcmVtb3ZlIHRoZSBpbm5lciBlbGVtZW50ICovXHJcbiAgICAgICAgICAgICAgICB3aGlsZSAodGhpcy5pbm5lci5jaGlsZE5vZGVzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmNvbnRhaW5lci5hcHBlbmRDaGlsZCh0aGlzLmlubmVyLmNoaWxkTm9kZXNbMF0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdGhpcy5zY2FsZUVsZW1lbnQucmVtb3ZlQ2hpbGQodGhpcy5pbm5lcik7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNvbnRhaW5lci5yZW1vdmVDaGlsZCh0aGlzLnNjYWxlRWxlbWVudCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNjcm9sbFRvKHgsIHksIGZhbHNlKTtcclxuICAgICAgICAgICAgICAgIHRoaXMubW91c2VNb3ZlSGFuZGxlciA/IHRoaXMucmVtb3ZlRXZlbnRMaXN0ZW5lcihkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQsICdtb3VzZW1vdmUnLCB0aGlzLm1vdXNlTW92ZUhhbmRsZXIpIDogbnVsbDtcclxuICAgICAgICAgICAgICAgIHRoaXMubW91c2VVcEhhbmRsZXIgPyB0aGlzLnJlbW92ZUV2ZW50TGlzdGVuZXIoZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LCAnbW91c2V1cCcsIHRoaXMubW91c2VVcEhhbmRsZXIpIDogbnVsbDtcclxuICAgICAgICAgICAgICAgIHRoaXMubW91c2VEb3duSGFuZGxlciA/IHRoaXMucmVtb3ZlRXZlbnRMaXN0ZW5lcih0aGlzLmlubmVyLCAnbW91c2Vkb3duJywgdGhpcy5tb3VzZURvd25IYW5kbGVyKSA6IG51bGw7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm1vdXNlU2Nyb2xsSGFuZGxlciA/IHRoaXMucmVtb3ZlRXZlbnRMaXN0ZW5lcih0aGlzLnNjcm9sbEVsZW1lbnQsICd3aGVlbCcsIHRoaXMubW91c2VTY3JvbGxIYW5kbGVyKSA6IG51bGw7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm1vdXNlWm9vbUhhbmRsZXIgPyB0aGlzLnJlbW92ZUV2ZW50TGlzdGVuZXIodGhpcy5zY3JvbGxFbGVtZW50LCAnd2hlZWwnLCB0aGlzLm1vdXNlWm9vbUhhbmRsZXIpIDogbnVsbDtcclxuICAgICAgICAgICAgICAgIHRoaXMuaGFzaENoYW5nZUhhbmRsZXIgPyB0aGlzLnJlbW92ZUV2ZW50TGlzdGVuZXIod2luZG93LCAnbXloYXNoY2hhbmdlJywgdGhpcy5oYXNoQ2hhbmdlSGFuZGxlcikgOiBudWxsO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5oYXNoQ2hhbmdlSGFuZGxlciA/IHRoaXMucmVtb3ZlRXZlbnRMaXN0ZW5lcih3aW5kb3csICdoYXNoY2hhbmdlJywgdGhpcy5oYXNoQ2hhbmdlSGFuZGxlcikgOiBudWxsO1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuaGFzaENoYW5nZUNsaWNrSGFuZGxlcikge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBsaW5rcyA9IHRoaXMuY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3JBbGwoXCJhW2hyZWZePScjJ11cIik7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsaW5rcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlbW92ZUV2ZW50TGlzdGVuZXIobGlua3NbaV0sICdjbGljaycsIHRoaXMuaGFzaENoYW5nZUNsaWNrSGFuZGxlcik7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdGhpcy5zY3JvbGxFbGVtZW50ID8gdGhpcy5zY3JvbGxFbGVtZW50Lm9ubW91c2V3aGVlbCA9IG51bGwgOiBudWxsO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zY3JvbGxFbGVtZW50ID8gdGhpcy5zY3JvbGxFbGVtZW50Lm9uc2Nyb2xsID0gbnVsbCA6IG51bGw7XHJcbiAgICAgICAgICAgICAgICB3aW5kb3cub25yZXNpemUgPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgLyogcmVtb3ZlIGFsbCBjdXN0b20gZXZlbnRsaXN0ZW5lcnMgYXR0YWNoZWQgdmlhIG9uKCkgKi9cclxuICAgICAgICAgICAgICAgIGZvciAodmFyIGV2ZW50IGluIHRoaXMuY3VzdG9tRXZlbnRzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgYyBpbiB0aGlzLmN1c3RvbUV2ZW50c1tldmVudF0pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKHRoaXMuaW5uZXIsIGV2ZW50LCB0aGlzLmN1c3RvbUV2ZW50c1tldmVudF1bY11bMF0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgcmV0dXJuIFp3b29zaDtcclxuICAgICAgICB9KCkpO1xyXG4gICAgICAgIC8qIHJldHVybiBhbiBpbnN0YW5jZSBvZiB0aGUgY2xhc3MgKi9cclxuICAgICAgICByZXR1cm4gbmV3IFp3b29zaChjb250YWluZXIsIG9wdGlvbnMpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHp3b29zaDtcclxufSk7XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXp3b29zaC5qcy5tYXAiXX0=
