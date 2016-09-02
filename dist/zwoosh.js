(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.zwoosh = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
     * @version 1.0
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
            return;
        };
        return Zwoosh;
    }());
    /* return an instance of the class */
    return new Zwoosh(container, options);
}
module.exports = zwoosh;

},{}]},{},[1])(1)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJ6d29vc2guanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIlwidXNlIHN0cmljdFwiO1xuLyoqXG4gKiBFeHBvcnQgZnVuY3Rpb24gb2YgdGhlIG1vZHVsZVxuICpcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGNvbnRhaW5lciAtIFRoZSBIVE1MRWxlbWVudCB0byBzd29vb29zaCFcbiAqIEBwYXJhbSB7T3B0aW9uc30gb3B0aW9ucyAtIHRoZSBvcHRpb25zIG9iamVjdCB0byBjb25maWd1cmUgWndvb3NoXG4gKiBAcmV0dXJuIHtad29vc2h9IC0gWndvb3NoIG9iamVjdCBpbnN0YW5jZVxuICovXG5mdW5jdGlvbiB6d29vc2goY29udGFpbmVyLCBvcHRpb25zKSB7XG4gICAgaWYgKG9wdGlvbnMgPT09IHZvaWQgMCkgeyBvcHRpb25zID0ge307IH1cbiAgICAvKipcbiAgICAgKiBQb2x5ZmlsbCBiaW5kIGZ1bmN0aW9uIGZvciBvbGRlciBicm93c2Vyc1xuICAgICAqIFRoZSBiaW5kIGZ1bmN0aW9uIGlzIGFuIGFkZGl0aW9uIHRvIEVDTUEtMjYyLCA1dGggZWRpdGlvblxuICAgICAqIEBzZWU6IGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0phdmFTY3JpcHQvUmVmZXJlbmNlL0dsb2JhbF9PYmplY3RzL0Z1bmN0aW9uL2JpbmRcbiAgICAgKi9cbiAgICBpZiAoIUZ1bmN0aW9uLnByb3RvdHlwZS5iaW5kKSB7XG4gICAgICAgIEZ1bmN0aW9uLnByb3RvdHlwZS5iaW5kID0gZnVuY3Rpb24gKG9UaGlzKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHRoaXMgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAvLyBjbG9zZXN0IHRoaW5nIHBvc3NpYmxlIHRvIHRoZSBFQ01BU2NyaXB0IDVcbiAgICAgICAgICAgICAgICAvLyBpbnRlcm5hbCBJc0NhbGxhYmxlIGZ1bmN0aW9uXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignRnVuY3Rpb24ucHJvdG90eXBlLmJpbmQgLSB3aGF0IGlzIHRyeWluZyB0byBiZSBib3VuZCBpcyBub3QgY2FsbGFibGUnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBhQXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSksIGZUb0JpbmQgPSB0aGlzLCBmTk9QID0gZnVuY3Rpb24gKCkgeyB9LCBmQm91bmQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZUb0JpbmQuYXBwbHkodGhpcyBpbnN0YW5jZW9mIGZOT1BcbiAgICAgICAgICAgICAgICAgICAgPyB0aGlzXG4gICAgICAgICAgICAgICAgICAgIDogb1RoaXMsIGFBcmdzLmNvbmNhdChBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpKSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgaWYgKHRoaXMucHJvdG90eXBlKSB7XG4gICAgICAgICAgICAgICAgLy8gRnVuY3Rpb24ucHJvdG90eXBlIGRvZXNuJ3QgaGF2ZSBhIHByb3RvdHlwZSBwcm9wZXJ0eVxuICAgICAgICAgICAgICAgIGZOT1AucHJvdG90eXBlID0gdGhpcy5wcm90b3R5cGU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmQm91bmQucHJvdG90eXBlID0gbmV3IGZOT1AoKTtcbiAgICAgICAgICAgIHJldHVybiBmQm91bmQ7XG4gICAgICAgIH07XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFBvbHlmaWxsIGFycmF5LmluZGV4T2YgZnVuY3Rpb24gZm9yIG9sZGVyIGJyb3dzZXJzXG4gICAgICogVGhlIGluZGV4T2YoKSBmdW5jdGlvbiB3YXMgYWRkZWQgdG8gdGhlIEVDTUEtMjYyIHN0YW5kYXJkIGluIHRoZSA1dGggZWRpdGlvblxuICAgICAqIGFzIHN1Y2ggaXQgbWF5IG5vdCBiZSBwcmVzZW50IGluIGFsbCBicm93c2Vycy5cbiAgICAgKiBAc2VlIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0phdmFTY3JpcHQvUmVmZXJlbmNlL0dsb2JhbF9PYmplY3RzL0FycmF5L2luZGV4T2ZcbiAgICAgKi9cbiAgICBpZiAoIUFycmF5LnByb3RvdHlwZS5pbmRleE9mKSB7XG4gICAgICAgIEFycmF5LnByb3RvdHlwZS5pbmRleE9mID0gZnVuY3Rpb24gKHNlYXJjaEVsZW1lbnQsIGZyb21JbmRleCkge1xuICAgICAgICAgICAgdmFyIGs7XG4gICAgICAgICAgICBpZiAodGhpcyA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignXCJ0aGlzXCIgaXMgbnVsbCBvciBub3QgZGVmaW5lZCcpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIG8gPSBPYmplY3QodGhpcyk7XG4gICAgICAgICAgICB2YXIgbGVuID0gby5sZW5ndGggPj4+IDA7XG4gICAgICAgICAgICBpZiAobGVuID09PSAwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIG4gPSArZnJvbUluZGV4IHx8IDA7XG4gICAgICAgICAgICBpZiAoTWF0aC5hYnMobikgPT09IEluZmluaXR5KSB7XG4gICAgICAgICAgICAgICAgbiA9IDA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAobiA+PSBsZW4pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBrID0gTWF0aC5tYXgobiA+PSAwID8gbiA6IGxlbiAtIE1hdGguYWJzKG4pLCAwKTtcbiAgICAgICAgICAgIHdoaWxlIChrIDwgbGVuKSB7XG4gICAgICAgICAgICAgICAgaWYgKGsgaW4gbyAmJiBvW2tdID09PSBzZWFyY2hFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBrKys7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgIH07XG4gICAgfVxuICAgIC8qIGxpc3Qgb2YgcmVhbCBldmVudHMgKi9cbiAgICB2YXIgaHRtbEV2ZW50cyA9IHtcbiAgICAgICAgLyogPGJvZHk+IGFuZCA8ZnJhbWVzZXQ+IEV2ZW50cyAqL1xuICAgICAgICBvbmxvYWQ6IDEsXG4gICAgICAgIG9udW5sb2FkOiAxLFxuICAgICAgICAvKiBGb3JtIEV2ZW50cyAqL1xuICAgICAgICBvbmJsdXI6IDEsXG4gICAgICAgIG9uY2hhbmdlOiAxLFxuICAgICAgICBvbmZvY3VzOiAxLFxuICAgICAgICBvbnJlc2V0OiAxLFxuICAgICAgICBvbnNlbGVjdDogMSxcbiAgICAgICAgb25zdWJtaXQ6IDEsXG4gICAgICAgIC8qIEltYWdlIEV2ZW50cyAqL1xuICAgICAgICBvbmFib3J0OiAxLFxuICAgICAgICAvKiBLZXlib2FyZCBFdmVudHMgKi9cbiAgICAgICAgb25rZXlkb3duOiAxLFxuICAgICAgICBvbmtleXByZXNzOiAxLFxuICAgICAgICBvbmtleXVwOiAxLFxuICAgICAgICAvKiBNb3VzZSBFdmVudHMgKi9cbiAgICAgICAgb25jbGljazogMSxcbiAgICAgICAgb25kYmxjbGljazogMSxcbiAgICAgICAgb25tb3VzZWRvd246IDEsXG4gICAgICAgIG9ubW91c2Vtb3ZlOiAxLFxuICAgICAgICBvbm1vdXNlb3V0OiAxLFxuICAgICAgICBvbm1vdXNlb3ZlcjogMSxcbiAgICAgICAgb25tb3VzZXVwOiAxXG4gICAgfTtcbiAgICB2YXIgbWFwRXZlbnRzID0ge1xuICAgICAgICBvbnNjcm9sbDogd2luZG93XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBad29vc2ggcHJvdmlkZXMgYSBzZXQgb2YgZnVuY3Rpb25zIHRvIGltcGxlbWVudCBzY3JvbGwgYnkgZHJhZywgem9vbSBieSBtb3VzZXdoZWVsLFxuICAgICAqIGhhc2ggbGlua3MgaW5zaWRlIHRoZSBkb2N1bWVudCBhbmQgb3RoZXIgc3BlY2lhbCBzY3JvbGwgcmVsYXRlZCByZXF1aXJlbWVudHMuXG4gICAgICpcbiAgICAgKiBAYXV0aG9yIFJvbWFuIEdydWJlciA8cDEwMjAzODlAeWFob28uY29tPlxuICAgICAqIEB2ZXJzaW9uIDEuMFxuICAgICAqL1xuICAgIHZhciBad29vc2ggPSAoZnVuY3Rpb24gKCkge1xuICAgICAgICBmdW5jdGlvbiBad29vc2goY29udGFpbmVyLCBvcHRpb25zKSB7XG4gICAgICAgICAgICB0aGlzLmNvbnRhaW5lciA9IGNvbnRhaW5lcjtcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG4gICAgICAgICAgICAvKiBDU1Mgc3R5bGUgY2xhc3NlcyAqL1xuICAgICAgICAgICAgdGhpcy5jbGFzc0lubmVyID0gJ3p3LWlubmVyJztcbiAgICAgICAgICAgIHRoaXMuY2xhc3NPdXRlciA9ICd6dy1vdXRlcic7XG4gICAgICAgICAgICB0aGlzLmNsYXNzR3JhYiA9ICd6dy1ncmFiJztcbiAgICAgICAgICAgIHRoaXMuY2xhc3NOb0dyYWIgPSAnenctbm9ncmFiJztcbiAgICAgICAgICAgIHRoaXMuY2xhc3NHcmFiYmluZyA9ICd6dy1ncmFiYmluZyc7XG4gICAgICAgICAgICB0aGlzLmNsYXNzVW5pcXVlID0gJ3p3LScgKyBNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zdWJzdHJpbmcoNyk7XG4gICAgICAgICAgICB0aGlzLmNsYXNzU2NhbGUgPSAnenctc2NhbGUnO1xuICAgICAgICAgICAgdGhpcy5jbGFzc0lnbm9yZSA9ICd6dy1pZ25vcmUnO1xuICAgICAgICAgICAgdGhpcy5jbGFzc0Zha2VCb2R5ID0gJ3p3LWZha2Vib2R5JztcbiAgICAgICAgICAgIC8qIGFycmF5IGhvbGRpbmcgdGhlIGN1c3RvbSBldmVudHMgbWFwcGluZyBjYWxsYmFja3MgdG8gYm91bmQgY2FsbGJhY2tzICovXG4gICAgICAgICAgICB0aGlzLmN1c3RvbUV2ZW50cyA9IFtdO1xuICAgICAgICAgICAgdGhpcy50cmlnZ2VyZWQgPSB7XG4gICAgICAgICAgICAgICAgY29sbGlkZUxlZnQ6IGZhbHNlLFxuICAgICAgICAgICAgICAgIGNvbGxpZGVUb3A6IGZhbHNlLFxuICAgICAgICAgICAgICAgIGNvbGxpZGVSaWdodDogZmFsc2UsXG4gICAgICAgICAgICAgICAgY29sbGlkZUJvdHRvbTogZmFsc2VcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvKiBmYWRlT3V0ICovXG4gICAgICAgICAgICB0aGlzLnRpbWVvdXRzID0gW107XG4gICAgICAgICAgICB0aGlzLnZ4ID0gW107XG4gICAgICAgICAgICB0aGlzLnZ5ID0gW107XG4gICAgICAgICAgICB0aGlzLmNvbnRhaW5lciA9IGNvbnRhaW5lcjtcbiAgICAgICAgICAgIC8qIHNldCBkZWZhdWx0IG9wdGlvbnMgKi9cbiAgICAgICAgICAgIHRoaXMub3B0aW9ucyA9IHtcbiAgICAgICAgICAgICAgICAvKiAxIG1lYW5zIGRvIG5vdCBhbGlnbiB0byBhIGdyaWQgKi9cbiAgICAgICAgICAgICAgICBncmlkWDogMSxcbiAgICAgICAgICAgICAgICBncmlkWTogMSxcbiAgICAgICAgICAgICAgICAvKiBzaG93cyBhIGdyaWQgYXMgYW4gb3ZlcmxheSBvdmVyIHRoZSBlbGVtZW50LiBXb3JrcyBvbmx5IGlmIHRoZSBicm93c2VyIHN1cHBvcnRzXG4gICAgICAgICAgICAgICAgICogQ1NTIEdlbmVyYXRlZCBjb250ZW50IGZvciBwc2V1ZG8tZWxlbWVudHNcbiAgICAgICAgICAgICAgICAgKiBAc2VlIGh0dHA6Ly9jYW5pdXNlLmNvbS8jc2VhcmNoPSUzQWJlZm9yZSAqL1xuICAgICAgICAgICAgICAgIGdyaWRTaG93OiBmYWxzZSxcbiAgICAgICAgICAgICAgICAvKiB3aGljaCBlZGdlIHNob3VsZCBiZSBlbGFzdGljICovXG4gICAgICAgICAgICAgICAgZWxhc3RpY0VkZ2VzOiB7XG4gICAgICAgICAgICAgICAgICAgIGxlZnQ6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICByaWdodDogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIHRvcDogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIGJvdHRvbTogZmFsc2VcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIC8qIGFjdGl2YXRlcy9kZWFjdGl2YXRlcyBzY3JvbGxpbmcgYnkgZHJhZyAqL1xuICAgICAgICAgICAgICAgIGRyYWdTY3JvbGw6IHRydWUsXG4gICAgICAgICAgICAgICAgZHJhZ09wdGlvbnM6IHtcbiAgICAgICAgICAgICAgICAgICAgZXhjbHVkZTogWydpbnB1dCcsICd0ZXh0YXJlYScsICdhJywgJ2J1dHRvbicsICcuJyArIHRoaXMuY2xhc3NJZ25vcmUsICdzZWxlY3QnXSxcbiAgICAgICAgICAgICAgICAgICAgb25seTogW10sXG4gICAgICAgICAgICAgICAgICAgIC8qIGFjdGl2YXRlcyBhIHNjcm9sbCBmYWRlIHdoZW4gc2Nyb2xsaW5nIGJ5IGRyYWcgKi9cbiAgICAgICAgICAgICAgICAgICAgZmFkZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgLyogZmFkZTogYnJha2UgYWNjZWxlcmF0aW9uIGluIHBpeGVscyBwZXIgc2Vjb25kIHBlciBzZWNvbmQgKHAvc8KyKSAqL1xuICAgICAgICAgICAgICAgICAgICBicmFrZVNwZWVkOiAyNTAwLFxuICAgICAgICAgICAgICAgICAgICAvKiBmYWRlOiBmcmFtZXMgcGVyIHNlY29uZCBvZiB0aGUgendvb3NoIGZhZGVvdXQgYW5pbWF0aW9uICg+PTI1IGxvb2tzIGxpa2UgbW90aW9uKSAqL1xuICAgICAgICAgICAgICAgICAgICBmcHM6IDMwLFxuICAgICAgICAgICAgICAgICAgICAvKiBmYWRlOiB0aGlzIHNwZWVkIHdpbGwgbmV2ZXIgYmUgZXhjZWVkZWQgKi9cbiAgICAgICAgICAgICAgICAgICAgbWF4U3BlZWQ6IDMwMDAsXG4gICAgICAgICAgICAgICAgICAgIC8qIGZhZGU6IG1pbmltdW0gc3BlZWQgd2hpY2ggdHJpZ2dlcnMgdGhlIGZhZGUgKi9cbiAgICAgICAgICAgICAgICAgICAgbWluU3BlZWQ6IDMwMFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgLyogYWN0aXZhdGVzL2RlYWN0aXZhdGVzIHNjcm9sbGluZyBieSB3aGVlbC4gSWYgdGhlIGRyZWljdGlvbiBpcyB2ZXJ0aWNhbCBhbmQgdGhlcmUgYXJlXG4gICAgICAgICAgICAgICAgICogc2Nyb2xsYmFycyBwcmVzZW50LCB6d29vc2ggbGV0cyBsZWF2ZXMgc2Nyb2xsaW5nIHRvIHRoZSBicm93c2VyLiAqL1xuICAgICAgICAgICAgICAgIHdoZWVsU2Nyb2xsOiB0cnVlLFxuICAgICAgICAgICAgICAgIHdoZWVsT3B0aW9uczoge1xuICAgICAgICAgICAgICAgICAgICAvKiBkaXJlY3Rpb24gdG8gc2Nyb2xsIHdoZW4gdGhlIG1vdXNlIHdoZWVsIGlzIHVzZWQgKi9cbiAgICAgICAgICAgICAgICAgICAgZGlyZWN0aW9uOiAndmVydGljYWwnLFxuICAgICAgICAgICAgICAgICAgICAvKiBhbW91bnQgb2YgcGl4ZWxzIGZvciBvbmUgc2Nyb2xsIHN0ZXAgKi9cbiAgICAgICAgICAgICAgICAgICAgc3RlcDogMTE0LFxuICAgICAgICAgICAgICAgICAgICAvKiBzY3JvbGwgc21vb3RoIG9yIGluc3RhbnQgKi9cbiAgICAgICAgICAgICAgICAgICAgc21vb3RoOiB0cnVlXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAvKiBhY3RpdmF0ZXMvZGVhY3RpdmF0ZXMgem9vbWluZyBieSB3aGVlbC4gV29ya3Mgb25seSB3aXRoIGEgQ1NTMyAyRCBUcmFuc2Zvcm0gY2FwYWJsZSBicm93c2VyLlxuICAgICAgICAgICAgICAgICAqIEBzZWUgaHR0cDovL2Nhbml1c2UuY29tLyNmZWF0PXRyYW5zZm9ybXMyZCAqL1xuICAgICAgICAgICAgICAgIHdoZWVsWm9vbTogZmFsc2UsXG4gICAgICAgICAgICAgICAgem9vbU9wdGlvbnM6IHtcbiAgICAgICAgICAgICAgICAgICAgLyogdGhlIG1heGltdW0gc2NhbGUsIDAgbWVhbnMgbm8gbWF4aW11bSAqL1xuICAgICAgICAgICAgICAgICAgICBtYXhTY2FsZTogMCxcbiAgICAgICAgICAgICAgICAgICAgLyogdGhlIG1pbmltdW0gc2NhbGUsIDAgbWVhbnMgbm8gbWluaW11bSAqL1xuICAgICAgICAgICAgICAgICAgICBtaW5TY2FsZTogMCxcbiAgICAgICAgICAgICAgICAgICAgLyogb25lIHN0ZXAgd2hlbiB1c2luZyB0aGUgd2hlZWwgdG8gem9vbSAqL1xuICAgICAgICAgICAgICAgICAgICBzdGVwOiAwLjEsXG4gICAgICAgICAgICAgICAgICAgIC8qIG1vdXNlIHdoZWVsIGRpcmVjdGlvbiB0byB6b29tIGxhcmdlciAqL1xuICAgICAgICAgICAgICAgICAgICBkaXJlY3Rpb246ICd1cCdcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIC8qIGxldCB6d29vc2ggaGFuZGxlIGFuY2hvciBsaW5rcyB0YXJnZXRpbmcgdG8gYW4gYW5jaG9yIGluc2lkZSBvZiB0aGlzIHp3b29zaCBlbGVtZW50LlxuICAgICAgICAgICAgICAgICAqIHRoZSBlbGVtZW50IG91dHNpZGUgKG1heWJlIHRoZSBib2R5KSBoYW5kbGVzIGFuY2hvcnMgdG9vLiBJZiB5b3Ugd2FudCB0byBwcmV2ZW50IHRoaXMsXG4gICAgICAgICAgICAgICAgICogYWRkIHRvIGJvZHkgYXMgendvb3NoIGVsZW1lbnQgdG9vLiAqL1xuICAgICAgICAgICAgICAgIGhhbmRsZUFuY2hvcnM6IHRydWVcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvKiBtZXJnZSB0aGUgZGVmYXVsdCBvcHRpb24gb2JqZWN0cyB3aXRoIHRoZSBwcm92aWRlZCBvbmUgKi9cbiAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiBvcHRpb25zKSB7XG4gICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnNba2V5XSA9PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgb2tleSBpbiBvcHRpb25zW2tleV0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAob3B0aW9uc1trZXldLmhhc093blByb3BlcnR5KG9rZXkpKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnNba2V5XVtva2V5XSA9IG9wdGlvbnNba2V5XVtva2V5XTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMub3B0aW9uc1trZXldID0gb3B0aW9uc1trZXldO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5pbml0KCk7XG4gICAgICAgIH1cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEluaXRpYWxpemUgRE9NIG1hbmlwdWxhdGlvbnMgYW5kIGV2ZW50IGhhbmRsZXJzXG4gICAgICAgICAqXG4gICAgICAgICAqIEByZXR1cm4ge3ZvaWR9XG4gICAgICAgICAqL1xuICAgICAgICBad29vc2gucHJvdG90eXBlLmluaXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICAgICAgdGhpcy5pc0JvZHkgPSB0aGlzLmNvbnRhaW5lci50YWdOYW1lID09IFwiQk9EWVwiID8gdHJ1ZSA6IGZhbHNlO1xuICAgICAgICAgICAgLyogQ2hyb21lIHNvbHV0aW9uIHRvIHNjcm9sbCB0aGUgYm9keSBpcyBub3QgcmVhbGx5IHZpYWJsZSwgc28gd2UgY3JlYXRlIGEgZmFrZSBib2R5XG4gICAgICAgICAgICAgKiBkaXYgZWxlbWVudCB0byBzY3JvbGwgb24gKi9cbiAgICAgICAgICAgIGlmICh0aGlzLmlzQm9keSA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgIHZhciBwc2V1ZG9Cb2R5ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgICAgICAgICAgICBwc2V1ZG9Cb2R5LmNsYXNzTmFtZSArPSBcIiBcIiArIHRoaXMuY2xhc3NGYWtlQm9keSArIFwiIFwiO1xuICAgICAgICAgICAgICAgIHBzZXVkb0JvZHkuc3R5bGUuY3NzVGV4dCA9IGRvY3VtZW50LmJvZHkuc3R5bGUuY3NzVGV4dDtcbiAgICAgICAgICAgICAgICB3aGlsZSAodGhpcy5jb250YWluZXIuY2hpbGROb2Rlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHBzZXVkb0JvZHkuYXBwZW5kQ2hpbGQodGhpcy5jb250YWluZXIuY2hpbGROb2Rlc1swXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuY29udGFpbmVyLmFwcGVuZENoaWxkKHBzZXVkb0JvZHkpO1xuICAgICAgICAgICAgICAgIHRoaXMuY29udGFpbmVyID0gcHNldWRvQm9keTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuY29udGFpbmVyLmNsYXNzTmFtZSArPSBcIiBcIiArIHRoaXMuY2xhc3NPdXRlciArIFwiIFwiO1xuICAgICAgICAgICAgLy90aGlzLnNjcm9sbEVsZW1lbnQgPSB0aGlzLmlzQm9keSA/IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCA6IHRoaXMuY29udGFpbmVyO1xuICAgICAgICAgICAgdGhpcy5zY3JvbGxFbGVtZW50ID0gdGhpcy5jb250YWluZXI7XG4gICAgICAgICAgICB2YXIgeCA9IHRoaXMuZ2V0U2Nyb2xsTGVmdCgpO1xuICAgICAgICAgICAgdmFyIHkgPSB0aGlzLmdldFNjcm9sbFRvcCgpO1xuICAgICAgICAgICAgLyogY3JlYXRlIGlubmVyIGRpdiBlbGVtZW50IGFuZCBhcHBlbmQgaXQgdG8gdGhlIGNvbnRhaW5lciB3aXRoIGl0cyBjb250ZW50cyBpbiBpdCAqL1xuICAgICAgICAgICAgdGhpcy5pbm5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICAgICAgICAvL3ZhciB1bmlxdWVDbGFzcyA9IHRoaXMuY2xhc3NJbm5lciArIFwiLVwiICsgTWF0aC5yYW5kb20oKS50b1N0cmluZygzNikuc3Vic3RyaW5nKDcpO1xuICAgICAgICAgICAgdGhpcy5pbm5lci5jbGFzc05hbWUgKz0gXCIgXCIgKyB0aGlzLmNsYXNzSW5uZXIgKyBcIiBcIiArIHRoaXMuY2xhc3NVbmlxdWUgKyBcIiBcIjtcbiAgICAgICAgICAgIHRoaXMuc2NhbGVFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgICAgICAgIHRoaXMuc2NhbGVFbGVtZW50LmNsYXNzTmFtZSArPSBcIiBcIiArIHRoaXMuY2xhc3NTY2FsZSArIFwiIFwiO1xuICAgICAgICAgICAgdGhpcy5zY2FsZUVsZW1lbnQuYXBwZW5kQ2hpbGQodGhpcy5pbm5lcik7XG4gICAgICAgICAgICAvKiBtb3ZlIGFsbCBjaGlsZE5vZGVzIHRvIHRoZSBuZXcgaW5uZXIgZWxlbWVudCAqL1xuICAgICAgICAgICAgd2hpbGUgKHRoaXMuY29udGFpbmVyLmNoaWxkTm9kZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIHRoaXMuaW5uZXIuYXBwZW5kQ2hpbGQodGhpcy5jb250YWluZXIuY2hpbGROb2Rlc1swXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmNvbnRhaW5lci5hcHBlbmRDaGlsZCh0aGlzLnNjYWxlRWxlbWVudCk7XG4gICAgICAgICAgICB0aGlzLmlubmVyLnN0eWxlLm1pbldpZHRoID0gKHRoaXMuY29udGFpbmVyLnNjcm9sbFdpZHRoIC0gdGhpcy5nZXRCb3JkZXJXaWR0aCh0aGlzLmNvbnRhaW5lcikpICsgJ3B4JztcbiAgICAgICAgICAgIHRoaXMuaW5uZXIuc3R5bGUubWluSGVpZ2h0ID0gKHRoaXMuY29udGFpbmVyLnNjcm9sbEhlaWdodCAtIHRoaXMuZ2V0Qm9yZGVyV2lkdGgodGhpcy5jb250YWluZXIpKSArICdweCc7XG4gICAgICAgICAgICB0aGlzLnNjYWxlRWxlbWVudC5zdHlsZS5taW5XaWR0aCA9IHRoaXMuaW5uZXIuc3R5bGUubWluV2lkdGg7XG4gICAgICAgICAgICB0aGlzLnNjYWxlRWxlbWVudC5zdHlsZS5taW5IZWlnaHQgPSB0aGlzLmlubmVyLnN0eWxlLm1pbkhlaWdodDtcbiAgICAgICAgICAgIHRoaXMuc2NhbGVFbGVtZW50LnN0eWxlLm92ZXJmbG93ID0gJ2hpZGRlbic7XG4gICAgICAgICAgICAvKiBzaG93IHRoZSBncmlkIG9ubHkgaWYgYXQgbGVhc3Qgb25lIG9mIHRoZSBncmlkIHZhbHVlcyBpcyBub3QgMSAqL1xuICAgICAgICAgICAgaWYgKCh0aGlzLm9wdGlvbnMuZ3JpZFggIT0gMSB8fCB0aGlzLm9wdGlvbnMuZ3JpZFkgIT0gMSkgJiYgdGhpcy5vcHRpb25zLmdyaWRTaG93KSB7XG4gICAgICAgICAgICAgICAgdmFyIGJnaSA9IFtdO1xuICAgICAgICAgICAgICAgIHRoaXMub3B0aW9ucy5ncmlkWCAhPSAxID8gYmdpLnB1c2goJ2xpbmVhci1ncmFkaWVudCh0byByaWdodCwgZ3JleSAxcHgsIHRyYW5zcGFyZW50IDFweCknKSA6IG51bGw7XG4gICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zLmdyaWRZICE9IDEgPyBiZ2kucHVzaCgnbGluZWFyLWdyYWRpZW50KHRvIGJvdHRvbSwgZ3JleSAxcHgsIHRyYW5zcGFyZW50IDFweCknKSA6IG51bGw7XG4gICAgICAgICAgICAgICAgdGhpcy5hZGRCZWZvcmVDU1ModGhpcy5jbGFzc1VuaXF1ZSwgJ3dpZHRoJywgdGhpcy5pbm5lci5zdHlsZS5taW5XaWR0aCk7XG4gICAgICAgICAgICAgICAgdGhpcy5hZGRCZWZvcmVDU1ModGhpcy5jbGFzc1VuaXF1ZSwgJ2hlaWdodCcsIHRoaXMuaW5uZXIuc3R5bGUubWluSGVpZ2h0KTtcbiAgICAgICAgICAgICAgICB0aGlzLmFkZEJlZm9yZUNTUyh0aGlzLmNsYXNzVW5pcXVlLCAnbGVmdCcsICctJyArIHRoaXMuZ2V0U3R5bGUodGhpcy5jb250YWluZXIsICdwYWRkaW5nTGVmdCcpKTtcbiAgICAgICAgICAgICAgICB0aGlzLmFkZEJlZm9yZUNTUyh0aGlzLmNsYXNzVW5pcXVlLCAndG9wJywgJy0nICsgdGhpcy5nZXRTdHlsZSh0aGlzLmNvbnRhaW5lciwgJ3BhZGRpbmdUb3AnKSk7XG4gICAgICAgICAgICAgICAgdGhpcy5hZGRCZWZvcmVDU1ModGhpcy5jbGFzc1VuaXF1ZSwgJ2JhY2tncm91bmQtc2l6ZScsICh0aGlzLm9wdGlvbnMuZ3JpZFggIT0gMSA/IHRoaXMub3B0aW9ucy5ncmlkWCArICdweCAnIDogJ2F1dG8gJykgKyAodGhpcy5vcHRpb25zLmdyaWRZICE9IDEgPyB0aGlzLm9wdGlvbnMuZ3JpZFkgKyAncHgnIDogJ2F1dG8nKSk7XG4gICAgICAgICAgICAgICAgdGhpcy5hZGRCZWZvcmVDU1ModGhpcy5jbGFzc1VuaXF1ZSwgJ2JhY2tncm91bmQtaW1hZ2UnLCBiZ2kuam9pbignLCAnKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLm9sZENsaWVudFdpZHRoID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudFdpZHRoO1xuICAgICAgICAgICAgdGhpcy5vbGRDbGllbnRIZWlnaHQgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50SGVpZ2h0O1xuICAgICAgICAgICAgLyoganVzdCBjYWxsIHRoZSBmdW5jdGlvbiwgdG8gdHJpZ2dlciBwb3NzaWJsZSBldmVudHMgKi9cbiAgICAgICAgICAgIHRoaXMub25TY3JvbGwoKTtcbiAgICAgICAgICAgIC8qIHNjcm9sbCB0byB0aGUgaW5pdGlhbCBwb3NpdGlvbiAqL1xuICAgICAgICAgICAgdGhpcy5zY3JvbGxUbyh4LCB5KTtcbiAgICAgICAgICAgIC8qIEV2ZW50IGhhbmRsZXIgcmVnaXN0cmF0aW9uIHN0YXJ0IGhlcmUgKi9cbiAgICAgICAgICAgIC8qIFRPRE86IG5vdCAyIGRpZmZlcmVudCBldmVudCBoYW5kbGVycyByZWdpc3RyYXRpb25zIC0+IGRvIGl0IGluIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcigpICovXG4gICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLndoZWVsU2Nyb2xsID09PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgIHRoaXMubW91c2VTY3JvbGxIYW5kbGVyID0gZnVuY3Rpb24gKGUpIHsgcmV0dXJuIF90aGlzLmRpc2FibGVNb3VzZVNjcm9sbChlKTsgfTtcbiAgICAgICAgICAgICAgICB0aGlzLnNjcm9sbEVsZW1lbnQub25tb3VzZXdoZWVsID0gdGhpcy5tb3VzZVNjcm9sbEhhbmRsZXI7XG4gICAgICAgICAgICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKHRoaXMuc2Nyb2xsRWxlbWVudCwgJ3doZWVsJywgdGhpcy5tb3VzZVNjcm9sbEhhbmRsZXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAodGhpcy5vcHRpb25zLndoZWVsU2Nyb2xsID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5tb3VzZVNjcm9sbEhhbmRsZXIgPSBmdW5jdGlvbiAoZSkgeyByZXR1cm4gX3RoaXMuYWN0aXZlTW91c2VTY3JvbGwoZSk7IH07XG4gICAgICAgICAgICAgICAgdGhpcy5zY3JvbGxFbGVtZW50Lm9ubW91c2V3aGVlbCA9IHRoaXMubW91c2VTY3JvbGxIYW5kbGVyO1xuICAgICAgICAgICAgICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcih0aGlzLnNjcm9sbEVsZW1lbnQsICd3aGVlbCcsIHRoaXMubW91c2VTY3JvbGxIYW5kbGVyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8qIFRPRE86IG5lZWRlZCwgd2hlbiBncmlkU2hvdyBpcyB0cnVlICovXG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMuZ3JpZFNob3cgPyB0aGlzLnNjYWxlVG8oMSkgOiBudWxsO1xuICAgICAgICAgICAgLyogd2hlZWx6b29tICovXG4gICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLndoZWVsWm9vbSA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgIHRoaXMubW91c2Vab29tSGFuZGxlciA9IGZ1bmN0aW9uIChlKSB7IHJldHVybiBfdGhpcy5hY3RpdmVNb3VzZVpvb20oZSk7IH07XG4gICAgICAgICAgICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKHRoaXMuc2Nyb2xsRWxlbWVudCwgJ3doZWVsJywgdGhpcy5tb3VzZVpvb21IYW5kbGVyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8qIHNjcm9sbGhhbmRsZXIgKi9cbiAgICAgICAgICAgIHRoaXMuc2Nyb2xsSGFuZGxlciA9IGZ1bmN0aW9uIChlKSB7IHJldHVybiBfdGhpcy5vblNjcm9sbChlKTsgfTtcbiAgICAgICAgICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcih0aGlzLmNvbnRhaW5lciwgJ3Njcm9sbCcsIHRoaXMuc2Nyb2xsSGFuZGxlcik7XG4gICAgICAgICAgICAvKiBpZiB0aGUgc2Nyb2xsIGVsZW1lbnQgaXMgYm9keSwgYWRqdXN0IHRoZSBpbm5lciBkaXYgd2hlbiByZXNpemluZyAqL1xuICAgICAgICAgICAgaWYgKHRoaXMuaXNCb2R5KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZXNpemVIYW5kbGVyID0gZnVuY3Rpb24gKGUpIHsgcmV0dXJuIF90aGlzLm9uUmVzaXplKGUpOyB9OyAvL1RPRE86IHNhbWUgYXMgYWJvdmUgaW4gdGhlIHdoZWVsIGhhbmRsZXJcbiAgICAgICAgICAgICAgICB3aW5kb3cub25yZXNpemUgPSB0aGlzLnJlc2l6ZUhhbmRsZXI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvKiBpZiBkcmFnc2Nyb2xsIGlzIGFjdGl2YXRlZCwgcmVnaXN0ZXIgbW91c2Vkb3duIGV2ZW50ICovXG4gICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLmRyYWdTY3JvbGwgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmlubmVyLmNsYXNzTmFtZSArPSBcIiBcIiArIHRoaXMuY2xhc3NHcmFiICsgXCIgXCI7XG4gICAgICAgICAgICAgICAgdGhpcy5tb3VzZURvd25IYW5kbGVyID0gZnVuY3Rpb24gKGUpIHsgcmV0dXJuIF90aGlzLm1vdXNlRG93bihlKTsgfTtcbiAgICAgICAgICAgICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIodGhpcy5pbm5lciwgJ21vdXNlZG93bicsIHRoaXMubW91c2VEb3duSGFuZGxlcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNvbnRhaW5lci5jbGFzc05hbWUgKz0gXCIgXCIgKyB0aGlzLmNsYXNzTm9HcmFiICsgXCIgXCI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLmhhbmRsZUFuY2hvcnMgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICB2YXIgbGlua3MgPSB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yQWxsKFwiYVtocmVmXj0nIyddXCIpO1xuICAgICAgICAgICAgICAgIHRoaXMuaGFzaENoYW5nZUNsaWNrSGFuZGxlciA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciB0YXJnZXQgPSBlID8gZS50YXJnZXQgOiB3aW5kb3cuZXZlbnQuc3JjRWxlbWVudDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB0YXJnZXQgIT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIHB1c2hTdGF0ZSBjaGFuZ2VzIHRoZSBoYXNoIHdpdGhvdXQgdHJpZ2dlcmluZyBoYXNoY2hhbmdlICovXG4gICAgICAgICAgICAgICAgICAgICAgICBoaXN0b3J5LnB1c2hTdGF0ZSh7fSwgJycsIHRhcmdldC5ocmVmKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIHdlIGRvbid0IHdhbnQgdG8gdHJpZ2dlciBoYXNoY2hhbmdlLCBzbyBwcmV2ZW50IGRlZmF1bHQgYmVoYXZpb3Igd2hlbiBjbGlja2luZyBvbiBhbmNob3IgbGlua3MgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQgPyBlLnByZXZlbnREZWZhdWx0KCkgOiAoZS5yZXR1cm5WYWx1ZSA9IGZhbHNlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAvKiB0cmlnZ2VyIGEgY3VzdG9tIGhhc2hjaGFuZ2UgZXZlbnQsIGJlY2F1c2UgcHVzaFN0YXRlIHByZXZlbnRzIHRoZSByZWFsIGhhc2hjaGFuZ2UgZXZlbnQgKi9cbiAgICAgICAgICAgICAgICAgICAgX3RoaXMudHJpZ2dlckV2ZW50KHdpbmRvdywgJ215aGFzaGNoYW5nZScpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgLyogbG9vcCB0cm91Z2ggYWxsIGFuY2hvciBsaW5rcyBpbiB0aGUgZWxlbWVudCBhbmQgZGlzYWJsZSB0aGVtIHRvIHByZXZlbnQgdGhlXG4gICAgICAgICAgICAgICAgICogYnJvd3NlciBmcm9tIHNjcm9sbGluZyBiZWNhdXNlIG9mIHRoZSBjaGFuZ2luZyBoYXNoIHZhbHVlLiBJbnN0ZWFkIHRoZSBvd25cbiAgICAgICAgICAgICAgICAgKiBldmVudCBteWhhc2hjaGFuZ2Ugc2hvdWxkIGhhbmRsZSBwYWdlIGFuZCBlbGVtZW50IHNjcm9sbGluZyAqL1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGlua3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKGxpbmtzW2ldLCAnY2xpY2snLCB0aGlzLmhhc2hDaGFuZ2VDbGlja0hhbmRsZXIsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5oYXNoQ2hhbmdlSGFuZGxlciA9IGZ1bmN0aW9uIChlKSB7IHJldHVybiBfdGhpcy5vbkhhc2hDaGFuZ2UoZSk7IH07XG4gICAgICAgICAgICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKHdpbmRvdywgJ215aGFzaGNoYW5nZScsIHRoaXMuaGFzaENoYW5nZUhhbmRsZXIpO1xuICAgICAgICAgICAgICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcih3aW5kb3csICdoYXNoY2hhbmdlJywgdGhpcy5oYXNoQ2hhbmdlSGFuZGxlcik7XG4gICAgICAgICAgICAgICAgdGhpcy5vbkhhc2hDaGFuZ2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJlaW5pdGlhbGl6ZSB0aGUgendvb3NoIGVsZW1lbnRcbiAgICAgICAgICpcbiAgICAgICAgICogQHJldHVybiB7Wndvb3NofSAtIFRoZSBad29vc2ggb2JqZWN0IGluc3RhbmNlXG4gICAgICAgICAqIEBUT0RPOiBwcmVzZXJ2ZSBzY3JvbGwgcG9zaXRpb24gaW4gaW5pdCgpXG4gICAgICAgICAqL1xuICAgICAgICBad29vc2gucHJvdG90eXBlLnJlaW5pdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMuZGVzdHJveSgpO1xuICAgICAgICAgICAgdGhpcy5jbGFzc1VuaXF1ZSA9ICd6dy0nICsgTWF0aC5yYW5kb20oKS50b1N0cmluZygzNikuc3Vic3RyaW5nKDcpO1xuICAgICAgICAgICAgdGhpcy5pbml0KCk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfTtcbiAgICAgICAgLyogQFRPRE86IFNjcm9sbFdpZHRoIGFuZCBDbGllbnRXaWR0aCBTY3JvbGxIZWlnaHQgQ2xpZW50SGVpZ2h0ICovXG4gICAgICAgIFp3b29zaC5wcm90b3R5cGUuZ2V0U2Nyb2xsTGVmdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnNjcm9sbEVsZW1lbnQuc2Nyb2xsTGVmdDtcbiAgICAgICAgfTtcbiAgICAgICAgWndvb3NoLnByb3RvdHlwZS5zZXRTY3JvbGxMZWZ0ID0gZnVuY3Rpb24gKGxlZnQpIHtcbiAgICAgICAgICAgIHRoaXMuc2Nyb2xsRWxlbWVudC5zY3JvbGxMZWZ0ID0gbGVmdDtcbiAgICAgICAgfTtcbiAgICAgICAgWndvb3NoLnByb3RvdHlwZS5nZXRTY3JvbGxUb3AgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5zY3JvbGxFbGVtZW50LnNjcm9sbFRvcDtcbiAgICAgICAgfTtcbiAgICAgICAgWndvb3NoLnByb3RvdHlwZS5zZXRTY3JvbGxUb3AgPSBmdW5jdGlvbiAodG9wKSB7XG4gICAgICAgICAgICB0aGlzLnNjcm9sbEVsZW1lbnQuc2Nyb2xsVG9wID0gdG9wO1xuICAgICAgICB9O1xuICAgICAgICAvKipcbiAgICAgICAgICogSGFuZGxlIGhhc2hjaGFuZ2VzIHdpdGggb3duIHNjcm9sbCBmdW5jdGlvblxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge0V2ZW50fSBlIC0gdGhlIGhhc2hjaGFuZ2Ugb3IgbXloYXNoY2hhbmdlIGV2ZW50LCBvciBub3RoaW5nXG4gICAgICAgICAqIEByZXR1cm4ge3ZvaWR9XG4gICAgICAgICAqL1xuICAgICAgICBad29vc2gucHJvdG90eXBlLm9uSGFzaENoYW5nZSA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICBpZiAoZSA9PT0gdm9pZCAwKSB7IGUgPSBudWxsOyB9XG4gICAgICAgICAgICB2YXIgaGFzaCA9IHdpbmRvdy5sb2NhdGlvbi5oYXNoLnN1YnN0cigxKTtcbiAgICAgICAgICAgIGlmIChoYXNoICE9ICcnKSB7XG4gICAgICAgICAgICAgICAgdmFyIGFuY2hvcnMgPSB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yQWxsKCcjJyArIGhhc2gpO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYW5jaG9ycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZWxlbWVudCA9IGFuY2hvcnNbaV07XG4gICAgICAgICAgICAgICAgICAgIHZhciBjb250YWluZXIgPSBhbmNob3JzW2ldO1xuICAgICAgICAgICAgICAgICAgICAvLyBmaW5kIHRoZSBuZXh0IHBhcmVudCB3aGljaCBpcyBhIGNvbnRhaW5lciBlbGVtZW50XG4gICAgICAgICAgICAgICAgICAgIHZhciBvdXRlclJlID0gbmV3IFJlZ0V4cChcIiBcIiArIHRoaXMuY2xhc3NPdXRlciArIFwiIFwiKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5leHRDb250YWluZXIgPSBlbGVtZW50O1xuICAgICAgICAgICAgICAgICAgICB3aGlsZSAoY29udGFpbmVyICYmIGNvbnRhaW5lci5wYXJlbnRFbGVtZW50ICYmIHRoaXMuY29udGFpbmVyICE9IGNvbnRhaW5lcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvbnRhaW5lci5jbGFzc05hbWUubWF0Y2gob3V0ZXJSZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXh0Q29udGFpbmVyID0gY29udGFpbmVyO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGFpbmVyID0gY29udGFpbmVyLnBhcmVudEVsZW1lbnQ7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKGUgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGUudHlwZSA9PSAnaGFzaGNoYW5nZScpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBzY3JvbGxpbmcgaW5zdGFudGx5IGJhY2sgdG8gb3JpZ2luLCBiZWZvcmUgZG8gdGhlIGFuaW1hdGVkIHNjcm9sbCAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsVG8odGhpcy5vcmlnaW5TY3JvbGxMZWZ0LCB0aGlzLm9yaWdpblNjcm9sbFRvcCwgZmFsc2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsVG9FbGVtZW50KG5leHRDb250YWluZXIpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICAvKipcbiAgICAgICAgICogU2Nyb2xsIHRvIGFuIGVsZW1lbnQgaW4gdGhlIERPTVxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbGVtZW50IC0gdGhlIEhUTUxFbGVtZW50IHRvIHNjcm9sbCB0b1xuICAgICAgICAgKi9cbiAgICAgICAgWndvb3NoLnByb3RvdHlwZS5zY3JvbGxUb0VsZW1lbnQgPSBmdW5jdGlvbiAoZWxlbWVudCkge1xuICAgICAgICAgICAgLyogZ2V0IHJlbGF0aXZlIGNvb3JkcyBmcm9tIHRoZSBhbmNob3IgZWxlbWVudCAqL1xuICAgICAgICAgICAgdmFyIHggPSAoZWxlbWVudC5vZmZzZXRMZWZ0IC0gdGhpcy5jb250YWluZXIub2Zmc2V0TGVmdCkgKiB0aGlzLmdldFNjYWxlKCk7XG4gICAgICAgICAgICB2YXIgeSA9IChlbGVtZW50Lm9mZnNldFRvcCAtIHRoaXMuY29udGFpbmVyLm9mZnNldFRvcCkgKiB0aGlzLmdldFNjYWxlKCk7XG4gICAgICAgICAgICB0aGlzLnNjcm9sbFRvKHgsIHkpO1xuICAgICAgICB9O1xuICAgICAgICAvKipcbiAgICAgICAgICogV29ya2Fyb3VuZCB0byBtYW5pcHVsYXRlIDo6YmVmb3JlIENTUyBzdHlsZXMgd2l0aCBqYXZhc2NyaXB0XG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBjc3NDbGFzcyAtIHRoZSBDU1MgY2xhc3MgbmFtZSB0byBhZGQgOjpiZWZvcmUgcHJvcGVydGllc1xuICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gY3NzUHJvcGVydHkgLSB0aGUgQ1NTIHByb3BlcnR5IHRvIHNldFxuICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gY3NzVmFsdWUgLSB0aGUgQ1NTIHZhbHVlIHRvIHNldFxuICAgICAgICAgKiBAcmV0dXJuIHt2b2lkfVxuICAgICAgICAgKi9cbiAgICAgICAgWndvb3NoLnByb3RvdHlwZS5hZGRCZWZvcmVDU1MgPSBmdW5jdGlvbiAoY3NzQ2xhc3MsIGNzc1Byb3BlcnR5LCBjc3NWYWx1ZSkge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBkb2N1bWVudC5zdHlsZVNoZWV0c1swXS5pbnNlcnRSdWxlID09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICBkb2N1bWVudC5zdHlsZVNoZWV0c1swXS5pbnNlcnRSdWxlKCcuJyArIGNzc0NsYXNzICsgJzo6YmVmb3JlIHsgJyArIGNzc1Byb3BlcnR5ICsgJzogJyArIGNzc1ZhbHVlICsgJ30nLCAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKHR5cGVvZiBkb2N1bWVudC5zdHlsZVNoZWV0c1swXS5hZGRSdWxlID09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICBkb2N1bWVudC5zdHlsZVNoZWV0c1swXS5hZGRSdWxlKCcuJyArIGNzc0NsYXNzICsgJzo6YmVmb3JlJywgY3NzUHJvcGVydHkgKyAnOiAnICsgY3NzVmFsdWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICAvKipcbiAgICAgICAgICogR2V0IGNvbXB1dGUgcGl4ZWwgbnVtYmVyIG9mIHRoZSB3aG9sZSB3aWR0aCBvZiBhbiBlbGVtZW50cyBib3JkZXJcbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWwgLSB0aGUgSFRNTCBlbGVtZW50XG4gICAgICAgICAqIEByZXR1cm4ge251bWJlcn0gLSB0aGUgYW1vdW50IG9mIHBpeGVsc1xuICAgICAgICAgKi9cbiAgICAgICAgWndvb3NoLnByb3RvdHlwZS5nZXRCb3JkZXJXaWR0aCA9IGZ1bmN0aW9uIChlbCkge1xuICAgICAgICAgICAgdmFyIGJsID0gdGhpcy5nZXRTdHlsZShlbCwgJ2JvcmRlckxlZnRXaWR0aCcpO1xuICAgICAgICAgICAgYmwgPSBibCA9PSAndGhpbicgPyAxIDogYmwgPT0gJ21lZGl1bScgPyAzIDogYmwgPT0gJ3RoaWNrJyA/IDUgOiBwYXJzZUludChibCwgMTApICE9IE5hTiA/IHBhcnNlSW50KGJsLCAxMCkgOiAwO1xuICAgICAgICAgICAgdmFyIGJyID0gdGhpcy5nZXRTdHlsZShlbCwgJ2JvcmRlclJpZ2h0V2lkdGgnKTtcbiAgICAgICAgICAgIGJyID0gYnIgPT0gJ3RoaW4nID8gMSA6IGJyID09ICdtZWRpdW0nID8gMyA6IGJyID09ICd0aGljaycgPyA1IDogcGFyc2VJbnQoYnIsIDEwKSAhPSBOYU4gPyBwYXJzZUludChiciwgMTApIDogMDtcbiAgICAgICAgICAgIHZhciBwbCA9IHRoaXMuZ2V0U3R5bGUoZWwsICdwYWRkaW5nTGVmdCcpO1xuICAgICAgICAgICAgcGwgPSBwbCA9PSAnYXV0bycgPyAwIDogcGFyc2VJbnQocGwsIDEwKSAhPSBOYU4gPyBwYXJzZUludChwbCwgMTApIDogMDtcbiAgICAgICAgICAgIHZhciBwciA9IHRoaXMuZ2V0U3R5bGUoZWwsICdwYWRkaW5nUmlnaHQnKTtcbiAgICAgICAgICAgIHByID0gcHIgPT0gJ2F1dG8nID8gMCA6IHBhcnNlSW50KHByLCAxMCkgIT0gTmFOID8gcGFyc2VJbnQocHIsIDEwKSA6IDA7XG4gICAgICAgICAgICB2YXIgbWwgPSB0aGlzLmdldFN0eWxlKGVsLCAnbWFyZ2luTGVmdCcpO1xuICAgICAgICAgICAgbWwgPSBtbCA9PSAnYXV0bycgPyAwIDogcGFyc2VJbnQobWwsIDEwKSAhPSBOYU4gPyBwYXJzZUludChtbCwgMTApIDogMDtcbiAgICAgICAgICAgIHZhciBtciA9IHRoaXMuZ2V0U3R5bGUoZWwsICdtYXJnaW5SaWdodCcpO1xuICAgICAgICAgICAgbXIgPSBtciA9PSAnYXV0bycgPyAwIDogcGFyc2VJbnQobXIsIDEwKSAhPSBOYU4gPyBwYXJzZUludChtciwgMTApIDogMDtcbiAgICAgICAgICAgIHJldHVybiAocGwgKyBwciArIGJsICsgYnIgKyBtbCArIG1yKTtcbiAgICAgICAgfTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEdldCBjb21wdXRlIHBpeGVsIG51bWJlciBvZiB0aGUgd2hvbGUgaGVpZ2h0IG9mIGFuIGVsZW1lbnRzIGJvcmRlclxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbCAtIHRoZSBIVE1MIGVsZW1lbnRcbiAgICAgICAgICogQHJldHVybiB7bnVtYmVyfSAtIHRoZSBhbW91bnQgb2YgcGl4ZWxzXG4gICAgICAgICAqL1xuICAgICAgICBad29vc2gucHJvdG90eXBlLmdldEJvcmRlckhlaWdodCA9IGZ1bmN0aW9uIChlbCkge1xuICAgICAgICAgICAgdmFyIGJ0ID0gdGhpcy5nZXRTdHlsZShlbCwgJ2JvcmRlclRvcFdpZHRoJyk7XG4gICAgICAgICAgICBidCA9IGJ0ID09ICd0aGluJyA/IDEgOiBidCA9PSAnbWVkaXVtJyA/IDMgOiBidCA9PSAndGhpY2snID8gNSA6IHBhcnNlSW50KGJ0LCAxMCkgIT0gTmFOID8gcGFyc2VJbnQoYnQsIDEwKSA6IDA7XG4gICAgICAgICAgICB2YXIgYmIgPSB0aGlzLmdldFN0eWxlKGVsLCAnYm9yZGVyQm90dG9tV2lkdGgnKTtcbiAgICAgICAgICAgIGJiID0gYmIgPT0gJ3RoaW4nID8gMSA6IGJiID09ICdtZWRpdW0nID8gMyA6IGJiID09ICd0aGljaycgPyA1IDogcGFyc2VJbnQoYmIsIDEwKSAhPSBOYU4gPyBwYXJzZUludChiYiwgMTApIDogMDtcbiAgICAgICAgICAgIHZhciBwdCA9IHRoaXMuZ2V0U3R5bGUoZWwsICdwYWRkaW5nVG9wJyk7XG4gICAgICAgICAgICBwdCA9IHB0ID09ICdhdXRvJyA/IDAgOiBwYXJzZUludChwdCwgMTApICE9IE5hTiA/IHBhcnNlSW50KHB0LCAxMCkgOiAwO1xuICAgICAgICAgICAgdmFyIHBiID0gdGhpcy5nZXRTdHlsZShlbCwgJ3BhZGRpbmdCb3R0b20nKTtcbiAgICAgICAgICAgIHBiID0gcGIgPT0gJ2F1dG8nID8gMCA6IHBhcnNlSW50KHBiLCAxMCkgIT0gTmFOID8gcGFyc2VJbnQocGIsIDEwKSA6IDA7XG4gICAgICAgICAgICB2YXIgbXQgPSB0aGlzLmdldFN0eWxlKGVsLCAnbWFyZ2luVG9wJyk7XG4gICAgICAgICAgICBtdCA9IG10ID09ICdhdXRvJyA/IDAgOiBwYXJzZUludChtdCwgMTApICE9IE5hTiA/IHBhcnNlSW50KG10LCAxMCkgOiAwO1xuICAgICAgICAgICAgdmFyIG1iID0gdGhpcy5nZXRTdHlsZShlbCwgJ21hcmdpbkJvdHRvbScpO1xuICAgICAgICAgICAgbWIgPSBtYiA9PSAnYXV0bycgPyAwIDogcGFyc2VJbnQobWIsIDEwKSAhPSBOYU4gPyBwYXJzZUludChtYiwgMTApIDogMDtcbiAgICAgICAgICAgIHJldHVybiAocHQgKyBwYiArIGJ0ICsgYmIgKyBtdCArIG1iKTtcbiAgICAgICAgfTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIERpc2FibGVzIHRoZSBzY3JvbGwgd2hlZWwgb2YgdGhlIG1vdXNlXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7TW91c2VXaGVlbEV2ZW50fSBlIC0gdGhlIG1vdXNlIHdoZWVsIGV2ZW50XG4gICAgICAgICAqIEByZXR1cm4ge3ZvaWR9XG4gICAgICAgICAqL1xuICAgICAgICBad29vc2gucHJvdG90eXBlLmRpc2FibGVNb3VzZVNjcm9sbCA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5lbGVtZW50QmVoaW5kQ3Vyc29ySXNNZShlLmNsaWVudFgsIGUuY2xpZW50WSkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNsZWFyVGltZW91dHMoKTtcbiAgICAgICAgICAgICAgICBpZiAoIWUpIHtcbiAgICAgICAgICAgICAgICAgICAgZSA9IHdpbmRvdy5ldmVudDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCA/IGUucHJldmVudERlZmF1bHQoKSA6IChlLnJldHVyblZhbHVlID0gZmFsc2UpO1xuICAgICAgICAgICAgICAgIGUucmV0dXJuVmFsdWUgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIERldGVybWluZSB3aGV0aGVyIGFuIGVsZW1lbnQgaGFzIGEgc2Nyb2xsYmFyIG9yIG5vdFxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbGVtZW50IC0gdGhlIEhUTUxFbGVtZW50XG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBkaXJlY3Rpb24gLSBkZXRlcm1pbmUgdGhlIHZlcnRpY2FsIG9yIGhvcml6b250YWwgc2Nyb2xsYmFyP1xuICAgICAgICAgKiBAcmV0dXJuIHtib29sZWFufSAtIHdoZXRoZXIgdGhlIGVsZW1lbnQgaGFzIHNjcm9sbGJhcnMgb3Igbm90XG4gICAgICAgICAqL1xuICAgICAgICBad29vc2gucHJvdG90eXBlLmhhc1Njcm9sbGJhciA9IGZ1bmN0aW9uIChlbGVtZW50LCBkaXJlY3Rpb24pIHtcbiAgICAgICAgICAgIHZhciBoYXMgPSBmYWxzZTtcbiAgICAgICAgICAgIHZhciBvdmVyZmxvdyA9ICdvdmVyZmxvdyc7XG4gICAgICAgICAgICBpZiAoZGlyZWN0aW9uID09ICd2ZXJ0aWNhbCcpIHtcbiAgICAgICAgICAgICAgICBvdmVyZmxvdyA9ICdvdmVyZmxvd1knO1xuICAgICAgICAgICAgICAgIGhhcyA9IGVsZW1lbnQuc2Nyb2xsSGVpZ2h0ID4gZWxlbWVudC5jbGllbnRIZWlnaHQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChkaXJlY3Rpb24gPT0gJ2hvcml6b250YWwnKSB7XG4gICAgICAgICAgICAgICAgb3ZlcmZsb3cgPSAnb3ZlcmZsb3dYJztcbiAgICAgICAgICAgICAgICBoYXMgPSBlbGVtZW50LnNjcm9sbFdpZHRoID4gZWxlbWVudC5jbGllbnRXaWR0aDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIENoZWNrIHRoZSBvdmVyZmxvdyBhbmQgb3ZlcmZsb3dEaXJlY3Rpb24gcHJvcGVydGllcyBmb3IgXCJhdXRvXCIgYW5kIFwidmlzaWJsZVwiIHZhbHVlc1xuICAgICAgICAgICAgaGFzID0gdGhpcy5nZXRTdHlsZSh0aGlzLmNvbnRhaW5lciwgJ292ZXJmbG93JykgPT0gXCJ2aXNpYmxlXCJcbiAgICAgICAgICAgICAgICB8fCB0aGlzLmdldFN0eWxlKHRoaXMuY29udGFpbmVyLCAnb3ZlcmZsb3dZJykgPT0gXCJ2aXNpYmxlXCJcbiAgICAgICAgICAgICAgICB8fCAoaGFzICYmIHRoaXMuZ2V0U3R5bGUodGhpcy5jb250YWluZXIsICdvdmVyZmxvdycpID09IFwiYXV0b1wiKVxuICAgICAgICAgICAgICAgIHx8IChoYXMgJiYgdGhpcy5nZXRTdHlsZSh0aGlzLmNvbnRhaW5lciwgJ292ZXJmbG93WScpID09IFwiYXV0b1wiKTtcbiAgICAgICAgICAgIHJldHVybiBoYXM7XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBFbmFibGVzIHRoZSBzY3JvbGwgd2hlZWwgb2YgdGhlIG1vdXNlIHRvIHNjcm9sbCwgc3BlY2lhbGx5IGZvciBkaXZzIHdpdGhvdXIgc2Nyb2xsYmFyXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7TW91c2VXaGVlbEV2ZW50fSBlIC0gdGhlIG1vdXNlIHdoZWVsIGV2ZW50XG4gICAgICAgICAqIEByZXR1cm4ge3ZvaWR9XG4gICAgICAgICAqL1xuICAgICAgICBad29vc2gucHJvdG90eXBlLmFjdGl2ZU1vdXNlU2Nyb2xsID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgIGlmICghZSkge1xuICAgICAgICAgICAgICAgIGUgPSB3aW5kb3cuZXZlbnQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy5lbGVtZW50QmVoaW5kQ3Vyc29ySXNNZShlLmNsaWVudFgsIGUuY2xpZW50WSkpIHtcbiAgICAgICAgICAgICAgICB2YXIgZGlyZWN0aW9uO1xuICAgICAgICAgICAgICAgIGlmIChcImRlbHRhWVwiIGluIGUpIHtcbiAgICAgICAgICAgICAgICAgICAgZGlyZWN0aW9uID0gZS5kZWx0YVkgPiAwID8gJ2Rvd24nIDogJ3VwJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoXCJ3aGVlbERlbHRhXCIgaW4gZSkge1xuICAgICAgICAgICAgICAgICAgICBkaXJlY3Rpb24gPSBlLndoZWVsRGVsdGEgPiAwID8gJ3VwJyA6ICdkb3duJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLyogdXNlIHRoZSBub3JtYWwgc2Nyb2xsLCB3aGVuIHRoZXJlIGFyZSBzY3JvbGxiYXJzIGFuZCB0aGUgZGlyZWN0aW9uIGlzIFwidmVydGljYWxcIiAqL1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMud2hlZWxPcHRpb25zLmRpcmVjdGlvbiA9PSAndmVydGljYWwnICYmIHRoaXMuaGFzU2Nyb2xsYmFyKHRoaXMuc2Nyb2xsRWxlbWVudCwgdGhpcy5vcHRpb25zLndoZWVsT3B0aW9ucy5kaXJlY3Rpb24pKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghKCh0aGlzLnRyaWdnZXJlZC5jb2xsaWRlQm90dG9tICYmIGRpcmVjdGlvbiA9PSAnZG93bicpIHx8ICh0aGlzLnRyaWdnZXJlZC5jb2xsaWRlVG9wICYmIGRpcmVjdGlvbiA9PSAndXAnKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY2xlYXJUaW1lb3V0cygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuZGlzYWJsZU1vdXNlU2Nyb2xsKGUpO1xuICAgICAgICAgICAgICAgIHZhciB4ID0gdGhpcy5nZXRTY3JvbGxMZWZ0KCk7XG4gICAgICAgICAgICAgICAgdmFyIHkgPSB0aGlzLmdldFNjcm9sbFRvcCgpO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMud2hlZWxPcHRpb25zLmRpcmVjdGlvbiA9PSAnaG9yaXpvbnRhbCcpIHtcbiAgICAgICAgICAgICAgICAgICAgeCA9IHRoaXMuZ2V0U2Nyb2xsTGVmdCgpICsgKGRpcmVjdGlvbiA9PSAnZG93bicgPyB0aGlzLm9wdGlvbnMud2hlZWxPcHRpb25zLnN0ZXAgOiB0aGlzLm9wdGlvbnMud2hlZWxPcHRpb25zLnN0ZXAgKiAtMSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHRoaXMub3B0aW9ucy53aGVlbE9wdGlvbnMuZGlyZWN0aW9uID09ICd2ZXJ0aWNhbCcpIHtcbiAgICAgICAgICAgICAgICAgICAgeSA9IHRoaXMuZ2V0U2Nyb2xsVG9wKCkgKyAoZGlyZWN0aW9uID09ICdkb3duJyA/IHRoaXMub3B0aW9ucy53aGVlbE9wdGlvbnMuc3RlcCA6IHRoaXMub3B0aW9ucy53aGVlbE9wdGlvbnMuc3RlcCAqIC0xKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5zY3JvbGxUbyh4LCB5LCBmYWxzZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBFbmFibGVzIHRoZSBzY3JvbGwgd2hlZWwgb2YgdGhlIG1vdXNlIHRvIHpvb21cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtNb3VzZVdoZWVsRXZlbnR9IGUgLSB0aGUgbW91c2Ugd2hlZWwgZXZlbnRcbiAgICAgICAgICogQHJldHVybiB7dm9pZH1cbiAgICAgICAgICovXG4gICAgICAgIFp3b29zaC5wcm90b3R5cGUuYWN0aXZlTW91c2Vab29tID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgIGlmICghZSkge1xuICAgICAgICAgICAgICAgIGUgPSB3aW5kb3cuZXZlbnQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy5lbGVtZW50QmVoaW5kQ3Vyc29ySXNNZShlLmNsaWVudFgsIGUuY2xpZW50WSkpIHtcbiAgICAgICAgICAgICAgICB2YXIgZGlyZWN0aW9uO1xuICAgICAgICAgICAgICAgIGlmIChcImRlbHRhWVwiIGluIGUpIHtcbiAgICAgICAgICAgICAgICAgICAgZGlyZWN0aW9uID0gZS5kZWx0YVkgPiAwID8gJ2Rvd24nIDogJ3VwJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoXCJ3aGVlbERlbHRhXCIgaW4gZSkge1xuICAgICAgICAgICAgICAgICAgICBkaXJlY3Rpb24gPSBlLndoZWVsRGVsdGEgPiAwID8gJ3VwJyA6ICdkb3duJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGRpcmVjdGlvbiA9PSB0aGlzLm9wdGlvbnMuem9vbU9wdGlvbnMuZGlyZWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBzY2FsZSA9IHRoaXMuZ2V0U2NhbGUoKSAqICgxICsgdGhpcy5vcHRpb25zLnpvb21PcHRpb25zLnN0ZXApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHNjYWxlID0gdGhpcy5nZXRTY2FsZSgpICogKDEgLSB0aGlzLm9wdGlvbnMuem9vbU9wdGlvbnMuc3RlcCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuc2NhbGVUbyhzY2FsZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDYWxjdWxhdGVzIHRoZSBzaXplIG9mIHRoZSB2ZXJ0aWNhbCBzY3JvbGxiYXIuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsIC0gVGhlIEhUTUxFbGVtZW1udFxuICAgICAgICAgKiBAcmV0dXJuIHtudW1iZXJ9IC0gdGhlIGFtb3VudCBvZiBwaXhlbHMgdXNlZCBieSB0aGUgdmVydGljYWwgc2Nyb2xsYmFyXG4gICAgICAgICAqL1xuICAgICAgICBad29vc2gucHJvdG90eXBlLnNjcm9sbGJhcldpZHRoID0gZnVuY3Rpb24gKGVsKSB7XG4gICAgICAgICAgICByZXR1cm4gZWwub2Zmc2V0V2lkdGggLSBlbC5jbGllbnRXaWR0aCAtIHBhcnNlSW50KHRoaXMuZ2V0U3R5bGUoZWwsICdib3JkZXJMZWZ0V2lkdGgnKSkgLSBwYXJzZUludCh0aGlzLmdldFN0eWxlKGVsLCAnYm9yZGVyUmlnaHRXaWR0aCcpKTtcbiAgICAgICAgfTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIENhbGN1bGF0ZXMgdGhlIHNpemUgb2YgdGhlIGhvcml6b250YWwgc2Nyb2xsYmFyLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbCAtIFRoZSBIVE1MRWxlbWVtbnRcbiAgICAgICAgICogQHJldHVybiB7bnVtYmVyfSAtIHRoZSBhbW91bnQgb2YgcGl4ZWxzIHVzZWQgYnkgdGhlIGhvcml6b250YWwgc2Nyb2xsYmFyXG4gICAgICAgICAqL1xuICAgICAgICBad29vc2gucHJvdG90eXBlLnNjcm9sbGJhckhlaWdodCA9IGZ1bmN0aW9uIChlbCkge1xuICAgICAgICAgICAgcmV0dXJuIGVsLm9mZnNldEhlaWdodCAtIGVsLmNsaWVudEhlaWdodCAtIHBhcnNlSW50KHRoaXMuZ2V0U3R5bGUoZWwsICdib3JkZXJUb3BXaWR0aCcpKSAtIHBhcnNlSW50KHRoaXMuZ2V0U3R5bGUoZWwsICdib3JkZXJCb3R0b21XaWR0aCcpKTtcbiAgICAgICAgfTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJldHJpZXZlcyB0aGUgY3VycmVudCBzY2FsZSB2YWx1ZSBvciAxIGlmIGl0IGlzIG5vdCBzZXQuXG4gICAgICAgICAqXG4gICAgICAgICAqIEByZXR1cm4ge251bWJlcn0gLSB0aGUgY3VycmVudCBzY2FsZSB2YWx1ZVxuICAgICAgICAgKi9cbiAgICAgICAgWndvb3NoLnByb3RvdHlwZS5nZXRTY2FsZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgdGhpcy5pbm5lci5zdHlsZS50cmFuc2Zvcm0gIT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICB2YXIgciA9IHRoaXMuaW5uZXIuc3R5bGUudHJhbnNmb3JtLm1hdGNoKC9zY2FsZVxcKChbMC05LFxcLl0rKVxcKS8pIHx8IFtcIlwiXTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyc2VGbG9hdChyWzFdKSB8fCAxO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIDE7XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTY2FsZXMgdGhlIGlubmVyIGVsZW1lbnQgYnkgYSByZWxhdGljZSB2YWx1ZSBiYXNlZCBvbiB0aGUgY3VycmVudCBzY2FsZSB2YWx1ZS5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IHBlcmNlbnQgLSBwZXJjZW50YWdlIG9mIHRoZSBjdXJyZW50IHNjYWxlIHZhbHVlXG4gICAgICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gaG9ub3VyTGltaXRzIC0gd2hldGhlciB0byBob25vdXIgbWF4U2NhbGUgYW5kIHRoZSBtaW5pbXVtIHdpZHRoIGFuZCBoZWlnaHRcbiAgICAgICAgICogb2YgdGhlIGNvbnRhaW5lciBlbGVtZW50LlxuICAgICAgICAgKiBAcmV0dXJuIHt2b2lkfVxuICAgICAgICAgKi9cbiAgICAgICAgWndvb3NoLnByb3RvdHlwZS5zY2FsZUJ5ID0gZnVuY3Rpb24gKHBlcmNlbnQsIGhvbm91ckxpbWl0cykge1xuICAgICAgICAgICAgaWYgKGhvbm91ckxpbWl0cyA9PT0gdm9pZCAwKSB7IGhvbm91ckxpbWl0cyA9IHRydWU7IH1cbiAgICAgICAgICAgIHZhciBzY2FsZSA9IHRoaXMuZ2V0U2NhbGUoKSAqIChwZXJjZW50IC8gMTAwKTtcbiAgICAgICAgICAgIHRoaXMuc2NhbGVUbyhzY2FsZSwgaG9ub3VyTGltaXRzKTtcbiAgICAgICAgfTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFNjYWxlcyB0aGUgaW5uZXIgZWxlbWVudCB0byBhbiBhYnNvbHV0ZSB2YWx1ZS5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IHNjYWxlIC0gdGhlIHNjYWxlXG4gICAgICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gaG9ub3VyTGltaXRzIC0gd2hldGhlciB0byBob25vdXIgbWF4U2NhbGUgYW5kIHRoZSBtaW5pbXVtIHdpZHRoIGFuZCBoZWlnaHRcbiAgICAgICAgICogb2YgdGhlIGNvbnRhaW5lciBlbGVtZW50LlxuICAgICAgICAgKiBAcmV0dXJuIHt2b2lkfVxuICAgICAgICAgKi9cbiAgICAgICAgWndvb3NoLnByb3RvdHlwZS5zY2FsZVRvID0gZnVuY3Rpb24gKHNjYWxlLCBob25vdXJMaW1pdHMpIHtcbiAgICAgICAgICAgIGlmIChob25vdXJMaW1pdHMgPT09IHZvaWQgMCkgeyBob25vdXJMaW1pdHMgPSB0cnVlOyB9XG4gICAgICAgICAgICB2YXIgd2lkdGggPSAocGFyc2VGbG9hdCh0aGlzLmlubmVyLnN0eWxlLm1pbldpZHRoKSAqIHNjYWxlKTtcbiAgICAgICAgICAgIHZhciBoZWlnaHQgPSAocGFyc2VGbG9hdCh0aGlzLmlubmVyLnN0eWxlLm1pbkhlaWdodCkgKiBzY2FsZSk7XG4gICAgICAgICAgICAvKiBTY3JvbGxiYXJzIGhhdmUgd2lkdGggYW5kIGhlaWdodCB0b28gKi9cbiAgICAgICAgICAgIHZhciBtaW5XaWR0aCA9IHRoaXMuY29udGFpbmVyLmNsaWVudFdpZHRoICsgdGhpcy5zY3JvbGxiYXJXaWR0aCh0aGlzLmNvbnRhaW5lcik7XG4gICAgICAgICAgICB2YXIgbWluSGVpZ2h0ID0gdGhpcy5jb250YWluZXIuY2xpZW50SGVpZ2h0ICsgdGhpcy5zY3JvbGxiYXJIZWlnaHQodGhpcy5jb250YWluZXIpO1xuICAgICAgICAgICAgaWYgKGhvbm91ckxpbWl0cykge1xuICAgICAgICAgICAgICAgIC8qIGxvb3AgYXMgbG9uZyBhcyBhbGwgbGltaXRzIGFyZSBob25vdXJlZCAqL1xuICAgICAgICAgICAgICAgIHdoaWxlICgoc2NhbGUgPiB0aGlzLm9wdGlvbnMuem9vbU9wdGlvbnMubWF4U2NhbGUgJiYgdGhpcy5vcHRpb25zLnpvb21PcHRpb25zLm1heFNjYWxlICE9IDApXG4gICAgICAgICAgICAgICAgICAgIHx8IChzY2FsZSA8IHRoaXMub3B0aW9ucy56b29tT3B0aW9ucy5taW5TY2FsZSAmJiB0aGlzLm9wdGlvbnMuem9vbU9wdGlvbnMubWluU2NhbGUgIT0gMClcbiAgICAgICAgICAgICAgICAgICAgfHwgKHdpZHRoIDwgdGhpcy5jb250YWluZXIuY2xpZW50V2lkdGggJiYgIXRoaXMuaXNCb2R5KVxuICAgICAgICAgICAgICAgICAgICB8fCBoZWlnaHQgPCB0aGlzLmNvbnRhaW5lci5jbGllbnRIZWlnaHQgJiYgIXRoaXMuaXNCb2R5KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzY2FsZSA+IHRoaXMub3B0aW9ucy56b29tT3B0aW9ucy5tYXhTY2FsZSAmJiB0aGlzLm9wdGlvbnMuem9vbU9wdGlvbnMubWF4U2NhbGUgIT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2NhbGUgPSB0aGlzLm9wdGlvbnMuem9vbU9wdGlvbnMubWF4U2NhbGU7XG4gICAgICAgICAgICAgICAgICAgICAgICB3aWR0aCA9IE1hdGguZmxvb3IocGFyc2VJbnQodGhpcy5pbm5lci5zdHlsZS5taW5XaWR0aCkgKiBzY2FsZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQgPSBNYXRoLmZsb29yKHBhcnNlSW50KHRoaXMuaW5uZXIuc3R5bGUubWluSGVpZ2h0KSAqIHNjYWxlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoc2NhbGUgPCB0aGlzLm9wdGlvbnMuem9vbU9wdGlvbnMubWluU2NhbGUgJiYgdGhpcy5vcHRpb25zLnpvb21PcHRpb25zLm1pblNjYWxlICE9IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjYWxlID0gdGhpcy5vcHRpb25zLnpvb21PcHRpb25zLm1pblNjYWxlO1xuICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGggPSBNYXRoLmZsb29yKHBhcnNlSW50KHRoaXMuaW5uZXIuc3R5bGUubWluV2lkdGgpICogc2NhbGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0ID0gTWF0aC5mbG9vcihwYXJzZUludCh0aGlzLmlubmVyLnN0eWxlLm1pbkhlaWdodCkgKiBzY2FsZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKHdpZHRoIDwgbWluV2lkdGggJiYgIXRoaXMuaXNCb2R5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzY2FsZSA9IHNjYWxlIC8gd2lkdGggKiBtaW5XaWR0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodCA9IE1hdGguZmxvb3IocGFyc2VJbnQodGhpcy5pbm5lci5zdHlsZS5taW5IZWlnaHQpICogc2NhbGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGggPSBtaW5XaWR0aDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoaGVpZ2h0IDwgbWluSGVpZ2h0ICYmICF0aGlzLmlzQm9keSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2NhbGUgPSBzY2FsZSAvIGhlaWdodCAqIG1pbkhlaWdodDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoID0gTWF0aC5mbG9vcihwYXJzZUludCh0aGlzLmlubmVyLnN0eWxlLm1pbldpZHRoKSAqIHNjYWxlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodCA9IG1pbkhlaWdodDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vY29uc29sZS5sb2coXCJzY2FsZVRvKCk6IFwiLCBzY2FsZSwgXCIgLS0tLT4gXCIsIHdpZHRoLCBcIiB4IFwiLCBoZWlnaHQsIFwiIG9yaWc6IFwiLCB0aGlzLmNvbnRhaW5lci5jbGllbnRXaWR0aCwgXCIgeCBcIiwgdGhpcy5jb250YWluZXIuY2xpZW50SGVpZ2h0LCBcIiByZWFsOiBcIiwgbWluV2lkdGgsIFwiIHggXCIsIG1pbkhlaWdodCk7XG4gICAgICAgICAgICB0aGlzLmlubmVyLnN0eWxlLnRyYW5zZm9ybSA9ICd0cmFuc2xhdGUoMHB4LCAwcHgpIHNjYWxlKCcgKyBzY2FsZSArICcpJztcbiAgICAgICAgICAgIHRoaXMuc2NhbGVFbGVtZW50LnN0eWxlLm1pbldpZHRoID0gdGhpcy5zY2FsZUVsZW1lbnQuc3R5bGUud2lkdGggPSB3aWR0aCArICdweCc7XG4gICAgICAgICAgICB0aGlzLnNjYWxlRWxlbWVudC5zdHlsZS5taW5IZWlnaHQgPSB0aGlzLnNjYWxlRWxlbWVudC5zdHlsZS5oZWlnaHQgPSBoZWlnaHQgKyAncHgnO1xuICAgICAgICAgICAgLyogVE9ETzogaGVyZSBzY3JvbGxUbyBiYXNlZCBvbiB3aGVyZSB0aGUgbW91c2UgY3Vyc29yIGlzICovXG4gICAgICAgICAgICAvL3RoaXMuc2Nyb2xsVG8oKTtcbiAgICAgICAgfTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIERpc2FibGVzIHRoZSBzY3JvbGwgd2hlZWwgb2YgdGhlIG1vdXNlXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSB4IC0gdGhlIHgtY29vcmRpbmF0ZXNcbiAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IHkgLSB0aGUgeS1jb29yZGluYXRlc1xuICAgICAgICAgKiBAcmV0dXJuIHtib29sZWFufSAtIHdoZXRoZXIgdGhlIG5lYXJlc3QgcmVsYXRlZCBwYXJlbnQgaW5uZXIgZWxlbWVudCBpcyB0aGUgb25lIG9mIHRoaXMgb2JqZWN0IGluc3RhbmNlXG4gICAgICAgICAqL1xuICAgICAgICBad29vc2gucHJvdG90eXBlLmVsZW1lbnRCZWhpbmRDdXJzb3JJc01lID0gZnVuY3Rpb24gKHgsIHkpIHtcbiAgICAgICAgICAgIHZhciBlbGVtZW50QmVoaW5kQ3Vyc29yID0gZG9jdW1lbnQuZWxlbWVudEZyb21Qb2ludCh4LCB5KTtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogSWYgdGhlIGVsZW1lbnQgZGlyZWN0bHkgYmVoaW5kIHRoZSBjdXJzb3IgaXMgYW4gb3V0ZXIgZWxlbWVudCB0aHJvdyBvdXQsIGJlY2F1c2Ugd2hlbiBjbGlja2luZyBvbiBhIHNjcm9sbGJhclxuICAgICAgICAgICAgICogZnJvbSBhIGRpdiwgYSBkcmFnIG9mIHRoZSBwYXJlbnQgWndvb3NoIGVsZW1lbnQgaXMgaW5pdGlhdGVkLlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICB2YXIgb3V0ZXJSZSA9IG5ldyBSZWdFeHAoXCIgXCIgKyB0aGlzLmNsYXNzT3V0ZXIgKyBcIiBcIik7XG4gICAgICAgICAgICBpZiAoZWxlbWVudEJlaGluZEN1cnNvci5jbGFzc05hbWUubWF0Y2gob3V0ZXJSZSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvKiBmaW5kIHRoZSBuZXh0IHBhcmVudCB3aGljaCBpcyBhbiBpbm5lciBlbGVtZW50ICovXG4gICAgICAgICAgICB2YXIgaW5uZXJSZSA9IG5ldyBSZWdFeHAoXCIgXCIgKyB0aGlzLmNsYXNzSW5uZXIgKyBcIiBcIik7XG4gICAgICAgICAgICB3aGlsZSAoZWxlbWVudEJlaGluZEN1cnNvciAmJiAhZWxlbWVudEJlaGluZEN1cnNvci5jbGFzc05hbWUubWF0Y2goaW5uZXJSZSkpIHtcbiAgICAgICAgICAgICAgICBlbGVtZW50QmVoaW5kQ3Vyc29yID0gZWxlbWVudEJlaGluZEN1cnNvci5wYXJlbnRFbGVtZW50O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuaW5uZXIgPT0gZWxlbWVudEJlaGluZEN1cnNvcjtcbiAgICAgICAgfTtcbiAgICAgICAgWndvb3NoLnByb3RvdHlwZS5nZXRUaW1lc3RhbXAgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHdpbmRvdy5wZXJmb3JtYW5jZSA9PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgICAgIGlmIChcIm5vd1wiIGluIHdpbmRvdy5wZXJmb3JtYW5jZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gd2luZG93LnBlcmZvcm1hbmNlLm5vdygpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChcIndlYmtpdE5vd1wiIGluIHdpbmRvdy5wZXJmb3JtYW5jZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gd2luZG93LnBlcmZvcm1hbmNlLndlYmtpdE5vdygpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgICAgICAgfTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFNjcm9sbCBoYW5kbGVyIHRvIHRyaWdnZXIgdGhlIGN1c3RvbSBldmVudHNcbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtFdmVudH0gZSAtIFRoZSBzY3JvbGwgZXZlbnQgb2JqZWN0IChUT0RPOiBuZWVkZWQ/KVxuICAgICAgICAgKiBAdGhyb3dzIEV2ZW50IGNvbGxpZGVMZWZ0XG4gICAgICAgICAqIEB0aHJvd3MgRXZlbnQgY29sbGlkZVJpZ2h0XG4gICAgICAgICAqIEB0aHJvd3MgRXZlbnQgY29sbGlkZVRvcFxuICAgICAgICAgKiBAdGhyb3dzIEV2ZW50IGNvbGxpZGVCb3R0b21cbiAgICAgICAgICogQHJldHVybiB7dm9pZH1cbiAgICAgICAgICovXG4gICAgICAgIFp3b29zaC5wcm90b3R5cGUub25TY3JvbGwgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgdmFyIHggPSB0aGlzLmdldFNjcm9sbExlZnQoKTtcbiAgICAgICAgICAgIHZhciB5ID0gdGhpcy5nZXRTY3JvbGxUb3AoKTtcbiAgICAgICAgICAgIHRoaXMuc2Nyb2xsTWF4TGVmdCA9ICh0aGlzLnNjcm9sbEVsZW1lbnQuc2Nyb2xsV2lkdGggLSB0aGlzLnNjcm9sbEVsZW1lbnQuY2xpZW50V2lkdGgpO1xuICAgICAgICAgICAgdGhpcy5zY3JvbGxNYXhUb3AgPSAodGhpcy5zY3JvbGxFbGVtZW50LnNjcm9sbEhlaWdodCAtIHRoaXMuc2Nyb2xsRWxlbWVudC5jbGllbnRIZWlnaHQpO1xuICAgICAgICAgICAgLy8gdGhlIGNvbGxpZGVMZWZ0IGV2ZW50XG4gICAgICAgICAgICBpZiAoeCA9PSAwKSB7XG4gICAgICAgICAgICAgICAgdGhpcy50cmlnZ2VyZWQuY29sbGlkZUxlZnQgPyBudWxsIDogdGhpcy50cmlnZ2VyRXZlbnQodGhpcy5pbm5lciwgJ2NvbGxpZGUubGVmdCcpO1xuICAgICAgICAgICAgICAgIHRoaXMudHJpZ2dlcmVkLmNvbGxpZGVMZWZ0ID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMudHJpZ2dlcmVkLmNvbGxpZGVMZWZ0ID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyB0aGUgY29sbGlkZVRvcCBldmVudFxuICAgICAgICAgICAgaWYgKHkgPT0gMCkge1xuICAgICAgICAgICAgICAgIHRoaXMudHJpZ2dlcmVkLmNvbGxpZGVUb3AgPyBudWxsIDogdGhpcy50cmlnZ2VyRXZlbnQodGhpcy5pbm5lciwgJ2NvbGxpZGUudG9wJyk7XG4gICAgICAgICAgICAgICAgdGhpcy50cmlnZ2VyZWQuY29sbGlkZVRvcCA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLnRyaWdnZXJlZC5jb2xsaWRlVG9wID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyB0aGUgY29sbGlkZVJpZ2h0IGV2ZW50XG4gICAgICAgICAgICBpZiAoeCA9PSB0aGlzLnNjcm9sbE1heExlZnQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnRyaWdnZXJlZC5jb2xsaWRlUmlnaHQgPyBudWxsIDogdGhpcy50cmlnZ2VyRXZlbnQodGhpcy5pbm5lciwgJ2NvbGxpZGUucmlnaHQnKTtcbiAgICAgICAgICAgICAgICB0aGlzLnRyaWdnZXJlZC5jb2xsaWRlUmlnaHQgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy50cmlnZ2VyZWQuY29sbGlkZVJpZ2h0ID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyB0aGUgY29sbGlkZUJvdHRvbSBldmVudFxuICAgICAgICAgICAgaWYgKHkgPT0gdGhpcy5zY3JvbGxNYXhUb3ApIHtcbiAgICAgICAgICAgICAgICB0aGlzLnRyaWdnZXJlZC5jb2xsaWRlQm90dG9tID8gbnVsbCA6IHRoaXMudHJpZ2dlckV2ZW50KHRoaXMuaW5uZXIsICdjb2xsaWRlLmJvdHRvbScpO1xuICAgICAgICAgICAgICAgIHRoaXMudHJpZ2dlcmVkLmNvbGxpZGVCb3R0b20gPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy50cmlnZ2VyZWQuY29sbGlkZUJvdHRvbSA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICAvKipcbiAgICAgICAgICogd2luZG93IHJlc2l6ZSBoYW5kbGVyIHRvIHJlY2FsY3VsYXRlIHRoZSBpbm5lciBkaXYgbWluV2lkdGggYW5kIG1pbkhlaWdodFxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge0V2ZW50fSBlIC0gVGhlIHdpbmRvdyByZXNpemUgZXZlbnQgb2JqZWN0IChUT0RPOiBuZWVkZWQ/KVxuICAgICAgICAgKiBAcmV0dXJuIHt2b2lkfVxuICAgICAgICAgKi9cbiAgICAgICAgWndvb3NoLnByb3RvdHlwZS5vblJlc2l6ZSA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICAgICAgdmFyIG9uUmVzaXplID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIF90aGlzLmlubmVyLnN0eWxlLm1pbldpZHRoID0gbnVsbDtcbiAgICAgICAgICAgICAgICBfdGhpcy5pbm5lci5zdHlsZS5taW5IZWlnaHQgPSBudWxsO1xuICAgICAgICAgICAgICAgIC8qIHRha2UgYXdheSB0aGUgbWFyZ2luIHZhbHVlcyBvZiB0aGUgYm9keSBlbGVtZW50ICovXG4gICAgICAgICAgICAgICAgdmFyIHhEZWx0YSA9IHBhcnNlSW50KF90aGlzLmdldFN0eWxlKGRvY3VtZW50LmJvZHksICdtYXJnaW5MZWZ0JyksIDEwKSArIHBhcnNlSW50KF90aGlzLmdldFN0eWxlKGRvY3VtZW50LmJvZHksICdtYXJnaW5SaWdodCcpLCAxMCk7XG4gICAgICAgICAgICAgICAgdmFyIHlEZWx0YSA9IHBhcnNlSW50KF90aGlzLmdldFN0eWxlKGRvY3VtZW50LmJvZHksICdtYXJnaW5Ub3AnKSwgMTApICsgcGFyc2VJbnQoX3RoaXMuZ2V0U3R5bGUoZG9jdW1lbnQuYm9keSwgJ21hcmdpbkJvdHRvbScpLCAxMCk7XG4gICAgICAgICAgICAgICAgLy9UT0RPOiB3aXRoIHRoaXMuZ2V0Qm9yZGVyV2lkdGgoKSBhbmQgdGhpcy5nZXRCb3JkZXJIZWlnaHQoKVxuICAgICAgICAgICAgICAgIF90aGlzLmlubmVyLnN0eWxlLm1pbldpZHRoID0gKGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zY3JvbGxXaWR0aCAtIHhEZWx0YSkgKyAncHgnO1xuICAgICAgICAgICAgICAgIF90aGlzLmlubmVyLnN0eWxlLm1pbkhlaWdodCA9IChkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsSGVpZ2h0IC0geURlbHRhIC0gMTAwKSArICdweCc7IC8vVE9ETzogV1RGPyB3aHkgLTEwMCBmb3IgSUU4P1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogVHJpZ2dlciB0aGUgZnVuY3Rpb24gb25seSB3aGVuIHRoZSBjbGllbnRXaWR0aCBvciBjbGllbnRIZWlnaHQgcmVhbGx5IGhhdmUgY2hhbmdlZC5cbiAgICAgICAgICAgICAqIElFOCByZXNpZGVzIGluIGFuIGluZmluaXR5IGxvb3AgYWx3YXlzIHRyaWdnZXJpbmcgdGhlIHJlc2l0ZSBldmVudCB3aGVuIGFsdGVyaW5nIGNzcy5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgaWYgKHRoaXMub2xkQ2xpZW50V2lkdGggIT0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudFdpZHRoIHx8IHRoaXMub2xkQ2xpZW50SGVpZ2h0ICE9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRIZWlnaHQpIHtcbiAgICAgICAgICAgICAgICB3aW5kb3cuY2xlYXJUaW1lb3V0KHRoaXMucmVzaXplVGltZW91dCk7XG4gICAgICAgICAgICAgICAgdGhpcy5yZXNpemVUaW1lb3V0ID0gd2luZG93LnNldFRpbWVvdXQob25SZXNpemUsIDEwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8qIHdyaXRlIGRvd24gdGhlIG9sZCBjbGllbnRXaWR0aCBhbmQgY2xpZW50SGVpZ2h0IGZvciB0aGUgYWJvdmUgY29tcGFyc2lvbiAqL1xuICAgICAgICAgICAgdGhpcy5vbGRDbGllbnRXaWR0aCA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRXaWR0aDtcbiAgICAgICAgICAgIHRoaXMub2xkQ2xpZW50SGVpZ2h0ID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudEhlaWdodDtcbiAgICAgICAgfTtcbiAgICAgICAgWndvb3NoLnByb3RvdHlwZS5jbGVhclRleHRTZWxlY3Rpb24gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAod2luZG93LmdldFNlbGVjdGlvbilcbiAgICAgICAgICAgICAgICB3aW5kb3cuZ2V0U2VsZWN0aW9uKCkucmVtb3ZlQWxsUmFuZ2VzKCk7XG4gICAgICAgICAgICBpZiAoZG9jdW1lbnQuc2VsZWN0aW9uKVxuICAgICAgICAgICAgICAgIGRvY3VtZW50LnNlbGVjdGlvbi5lbXB0eSgpO1xuICAgICAgICB9O1xuICAgICAgICAvKipcbiAgICAgICAgICogQnJvd3NlciBpbmRlcGVuZGVudCBldmVudCByZWdpc3RyYXRpb25cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHthbnl9IG9iaiAtIFRoZSBIVE1MRWxlbWVudCB0byBhdHRhY2ggdGhlIGV2ZW50IHRvXG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBldmVudCAtIFRoZSBldmVudCBuYW1lIHdpdGhvdXQgdGhlIGxlYWRpbmcgXCJvblwiXG4gICAgICAgICAqIEBwYXJhbSB7KGU6IEV2ZW50KSA9PiB2b2lkfSBjYWxsYmFjayAtIEEgY2FsbGJhY2sgZnVuY3Rpb24gdG8gYXR0YWNoIHRvIHRoZSBldmVudFxuICAgICAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IGJvdW5kIC0gd2hldGhlciB0byBiaW5kIHRoZSBjYWxsYmFjayB0byB0aGUgb2JqZWN0IGluc3RhbmNlIG9yIG5vdFxuICAgICAgICAgKiBAcmV0dXJuIHt2b2lkfVxuICAgICAgICAgKi9cbiAgICAgICAgWndvb3NoLnByb3RvdHlwZS5hZGRFdmVudExpc3RlbmVyID0gZnVuY3Rpb24gKG9iaiwgZXZlbnQsIGNhbGxiYWNrLCBib3VuZCkge1xuICAgICAgICAgICAgaWYgKGJvdW5kID09PSB2b2lkIDApIHsgYm91bmQgPSB0cnVlOyB9XG4gICAgICAgICAgICB2YXIgYm91bmRDYWxsYmFjayA9IGJvdW5kID8gY2FsbGJhY2suYmluZCh0aGlzKSA6IGNhbGxiYWNrO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBvYmouYWRkRXZlbnRMaXN0ZW5lciA9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgaWYgKG1hcEV2ZW50c1snb24nICsgZXZlbnRdICYmIG9iai50YWdOYW1lID09IFwiQk9EWVwiKSB7XG4gICAgICAgICAgICAgICAgICAgIG9iaiA9IG1hcEV2ZW50c1snb24nICsgZXZlbnRdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBvYmouYWRkRXZlbnRMaXN0ZW5lcihldmVudCwgYm91bmRDYWxsYmFjayk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmICh0eXBlb2Ygb2JqLmF0dGFjaEV2ZW50ID09ICdvYmplY3QnICYmIGh0bWxFdmVudHNbJ29uJyArIGV2ZW50XSkge1xuICAgICAgICAgICAgICAgIG9iai5hdHRhY2hFdmVudCgnb24nICsgZXZlbnQsIGJvdW5kQ2FsbGJhY2spO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAodHlwZW9mIG9iai5hdHRhY2hFdmVudCA9PSAnb2JqZWN0JyAmJiBtYXBFdmVudHNbJ29uJyArIGV2ZW50XSkge1xuICAgICAgICAgICAgICAgIGlmIChvYmoudGFnTmFtZSA9PSBcIkJPRFlcIikge1xuICAgICAgICAgICAgICAgICAgICB2YXIgcCA9ICdvbicgKyBldmVudDtcbiAgICAgICAgICAgICAgICAgICAgLyogZXhhbXBsZTogd2luZG93Lm9uc2Nyb2xsID0gYm91bmRDYWxsYmFjayAqL1xuICAgICAgICAgICAgICAgICAgICBtYXBFdmVudHNbcF1bcF0gPSBib3VuZENhbGxiYWNrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLyogVE9ETzogb2JqLm9uc2Nyb2xsID8/ICovXG4gICAgICAgICAgICAgICAgICAgIG9iai5vbnNjcm9sbCA9IGJvdW5kQ2FsbGJhY2s7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAodHlwZW9mIG9iai5hdHRhY2hFdmVudCA9PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgICAgIG9ialtldmVudF0gPSAxO1xuICAgICAgICAgICAgICAgIGJvdW5kQ2FsbGJhY2sgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgICAgICAvKiBUT0RPOiBlIGlzIHRoZSBvbnByb3BlcnR5Y2hhbmdlIGV2ZW50IG5vdCBvbmUgb2YgdGhlIGN1c3RvbSBldmVudCBvYmplY3RzICovXG4gICAgICAgICAgICAgICAgICAgIGlmIChlLnByb3BlcnR5TmFtZSA9PSBldmVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIG9iai5hdHRhY2hFdmVudCgnb25wcm9wZXJ0eWNoYW5nZScsIGJvdW5kQ2FsbGJhY2spO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgb2JqWydvbicgKyBldmVudF0gPSBib3VuZENhbGxiYWNrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5jdXN0b21FdmVudHNbZXZlbnRdID8gbnVsbCA6ICh0aGlzLmN1c3RvbUV2ZW50c1tldmVudF0gPSBbXSk7XG4gICAgICAgICAgICB0aGlzLmN1c3RvbUV2ZW50c1tldmVudF0ucHVzaChbY2FsbGJhY2ssIGJvdW5kQ2FsbGJhY2tdKTtcbiAgICAgICAgfTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEJyb3dzZXIgaW5kZXBlbmRlbnQgZXZlbnQgZGVyZWdpc3RyYXRpb25cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHthbnl9IG9iaiAtIFRoZSBIVE1MRWxlbWVudCBvciB3aW5kb3cgd2hvc2UgZXZlbnQgc2hvdWxkIGJlIGRldGFjaGVkXG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBldmVudCAtIFRoZSBldmVudCBuYW1lIHdpdGhvdXQgdGhlIGxlYWRpbmcgXCJvblwiXG4gICAgICAgICAqIEBwYXJhbSB7KGU6IEV2ZW50KSA9PiB2b2lkfSBjYWxsYmFjayAtIFRoZSBjYWxsYmFjayBmdW5jdGlvbiB3aGVuIGF0dGFjaGVkXG4gICAgICAgICAqIEByZXR1cm4ge3ZvaWR9XG4gICAgICAgICAqXG4gICAgICAgICAqIEBUT0RPOiB1bnJlZ2lzdGVyaW5nIG9mIG1hcEV2ZW50c1xuICAgICAgICAgKi9cbiAgICAgICAgWndvb3NoLnByb3RvdHlwZS5yZW1vdmVFdmVudExpc3RlbmVyID0gZnVuY3Rpb24gKG9iaiwgZXZlbnQsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBpZiAoZXZlbnQgaW4gdGhpcy5jdXN0b21FdmVudHMpIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpIGluIHRoaXMuY3VzdG9tRXZlbnRzW2V2ZW50XSkge1xuICAgICAgICAgICAgICAgICAgICAvKiBpZiB0aGUgZXZlbnQgd2FzIGZvdW5kIGluIHRoZSBhcnJheSBieSBpdHMgY2FsbGJhY2sgcmVmZXJlbmNlICovXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmN1c3RvbUV2ZW50c1tldmVudF1baV1bMF0gPT0gY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIHJlbW92ZSB0aGUgbGlzdGVuZXIgZnJvbSB0aGUgYXJyYXkgYnkgaXRzIGJvdW5kIGNhbGxiYWNrIHJlZmVyZW5jZSAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2sgPSB0aGlzLmN1c3RvbUV2ZW50c1tldmVudF1baV1bMV07XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmN1c3RvbUV2ZW50c1tldmVudF0uc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodHlwZW9mIG9iai5yZW1vdmVFdmVudExpc3RlbmVyID09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICBvYmoucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudCwgY2FsbGJhY2spO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAodHlwZW9mIG9iai5kZXRhY2hFdmVudCA9PSAnb2JqZWN0JyAmJiBodG1sRXZlbnRzWydvbicgKyBldmVudF0pIHtcbiAgICAgICAgICAgICAgICBvYmouZGV0YWNoRXZlbnQoJ29uJyArIGV2ZW50LCBjYWxsYmFjayk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmICh0eXBlb2Ygb2JqLmRldGFjaEV2ZW50ID09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAgICAgb2JqLmRldGFjaEV2ZW50KCdvbnByb3BlcnR5Y2hhbmdlJywgY2FsbGJhY2spO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgb2JqWydvbicgKyBldmVudF0gPSBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICAvKipcbiAgICAgICAgICogQnJvd3NlciBpbmRlcGVuZGVudCBldmVudCB0cmlnZ2VyIGZ1bmN0aW9uXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IG9iaiAtIFRoZSBIVE1MRWxlbWVudCB3aGljaCB0cmlnZ2VycyB0aGUgZXZlbnRcbiAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50TmFtZSAtIFRoZSBldmVudCBuYW1lIHdpdGhvdXQgdGhlIGxlYWRpbmcgXCJvblwiXG4gICAgICAgICAqIEByZXR1cm4ge3ZvaWR9XG4gICAgICAgICAqL1xuICAgICAgICBad29vc2gucHJvdG90eXBlLnRyaWdnZXJFdmVudCA9IGZ1bmN0aW9uIChvYmosIGV2ZW50TmFtZSkge1xuICAgICAgICAgICAgdmFyIGV2ZW50O1xuICAgICAgICAgICAgaWYgKHR5cGVvZiB3aW5kb3cuQ3VzdG9tRXZlbnQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICBldmVudCA9IG5ldyBDdXN0b21FdmVudChldmVudE5hbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAodHlwZW9mIGRvY3VtZW50LmNyZWF0ZUV2ZW50ID09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICBldmVudCA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KFwiSFRNTEV2ZW50c1wiKTtcbiAgICAgICAgICAgICAgICBldmVudC5pbml0RXZlbnQoZXZlbnROYW1lLCB0cnVlLCB0cnVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGRvY3VtZW50LmNyZWF0ZUV2ZW50T2JqZWN0KSB7XG4gICAgICAgICAgICAgICAgZXZlbnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudE9iamVjdCgpO1xuICAgICAgICAgICAgICAgIGV2ZW50LmV2ZW50VHlwZSA9IGV2ZW50TmFtZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGV2ZW50LmV2ZW50TmFtZSA9IGV2ZW50TmFtZTtcbiAgICAgICAgICAgIGlmIChvYmouZGlzcGF0Y2hFdmVudCkge1xuICAgICAgICAgICAgICAgIG9iai5kaXNwYXRjaEV2ZW50KGV2ZW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKG9ialtldmVudE5hbWVdKSB7XG4gICAgICAgICAgICAgICAgb2JqW2V2ZW50TmFtZV0rKztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKG9iai5maXJlRXZlbnQgJiYgaHRtbEV2ZW50c1snb24nICsgZXZlbnROYW1lXSkge1xuICAgICAgICAgICAgICAgIG9iai5maXJlRXZlbnQoJ29uJyArIGV2ZW50LmV2ZW50VHlwZSwgZXZlbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAob2JqW2V2ZW50TmFtZV0pIHtcbiAgICAgICAgICAgICAgICBvYmpbZXZlbnROYW1lXSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAob2JqWydvbicgKyBldmVudE5hbWVdKSB7XG4gICAgICAgICAgICAgICAgb2JqWydvbicgKyBldmVudE5hbWVdKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBHZXQgYSBjc3Mgc3R5bGUgcHJvcGVydHkgdmFsdWUgYnJvd3NlciBpbmRlcGVuZGVudFxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbCAtIFRoZSBIVE1MRWxlbWVudCB0byBsb29rdXBcbiAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGpzUHJvcGVydHkgLSBUaGUgY3NzIHByb3BlcnR5IG5hbWUgaW4gamF2YXNjcmlwdCBpbiBjYW1lbENhc2UgKGUuZy4gXCJtYXJnaW5MZWZ0XCIsIG5vdCBcIm1hcmdpbi1sZWZ0XCIpXG4gICAgICAgICAqIEByZXR1cm4ge3N0cmluZ30gLSB0aGUgcHJvcGVydHkgdmFsdWVcbiAgICAgICAgICovXG4gICAgICAgIFp3b29zaC5wcm90b3R5cGUuZ2V0U3R5bGUgPSBmdW5jdGlvbiAoZWwsIGpzUHJvcGVydHkpIHtcbiAgICAgICAgICAgIHZhciBjc3NQcm9wZXJ0eSA9IGpzUHJvcGVydHkucmVwbGFjZSgvKFtBLVpdKS9nLCBcIi0kMVwiKS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZSA9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKGVsKS5nZXRQcm9wZXJ0eVZhbHVlKGNzc1Byb3BlcnR5KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBlbC5jdXJyZW50U3R5bGVbanNQcm9wZXJ0eV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIFp3b29zaC5wcm90b3R5cGUuY2xlYXJUaW1lb3V0cyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnRpbWVvdXRzKSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaWR4IGluIHRoaXMudGltZW91dHMpIHtcbiAgICAgICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMudGltZW91dHNbaWR4XSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh0aGlzLnRpbWVvdXRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50aW1lb3V0cyA9IFtdO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnJlbW92ZUV2ZW50TGlzdGVuZXIodGhpcy5pbm5lciwgJ2NvbGxpZGUubGVmdCcsIHRoaXMuY2xlYXJMaXN0ZW5lckxlZnQpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnJlbW92ZUV2ZW50TGlzdGVuZXIodGhpcy5pbm5lciwgJ2NvbGxpZGUucmlnaHQnLCB0aGlzLmNsZWFyTGlzdGVuZXJSaWdodCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVtb3ZlRXZlbnRMaXN0ZW5lcih0aGlzLmlubmVyLCAnY29sbGlkZS50b3AnLCB0aGlzLmNsZWFyTGlzdGVuZXJUb3ApO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnJlbW92ZUV2ZW50TGlzdGVuZXIodGhpcy5pbm5lciwgJ2NvbGxpZGUuYm90dG9tJywgdGhpcy5jbGVhckxpc3RlbmVyQm90dG9tKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBNb3VzZSBkb3duIGhhbmRsZXJcbiAgICAgICAgICogUmVnaXN0ZXJzIHRoZSBtb3VzZW1vdmUgYW5kIG1vdXNldXAgaGFuZGxlcnMgYW5kIGZpbmRzIHRoZSBuZXh0IGlubmVyIGVsZW1lbnRcbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtNb3VzZUV2ZW50fSBlIC0gVGhlIG1vdXNlIGRvd24gZXZlbnQgb2JqZWN0XG4gICAgICAgICAqIEByZXR1cm4ge3ZvaWR9XG4gICAgICAgICAqL1xuICAgICAgICBad29vc2gucHJvdG90eXBlLm1vdXNlRG93biA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICAgICAgdGhpcy5jbGVhclRpbWVvdXRzKCk7XG4gICAgICAgICAgICAvKiBkcmFnIG9ubHkgaWYgdGhlIGxlZnQgbW91c2UgYnV0dG9uIHdhcyBwcmVzc2VkICovXG4gICAgICAgICAgICBpZiAoKFwid2hpY2hcIiBpbiBlICYmIGUud2hpY2ggPT0gMSkgfHwgKHR5cGVvZiBlLndoaWNoID09ICd1bmRlZmluZWQnICYmIFwiYnV0dG9uXCIgaW4gZSAmJiBlLmJ1dHRvbiA9PSAxKSkge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmVsZW1lbnRCZWhpbmRDdXJzb3JJc01lKGUuY2xpZW50WCwgZS5jbGllbnRZKSkge1xuICAgICAgICAgICAgICAgICAgICAvKiBwcmV2ZW50IGltYWdlIGRyYWdnaW5nIGFjdGlvbiAqL1xuICAgICAgICAgICAgICAgICAgICB2YXIgaW1ncyA9IHRoaXMuY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3JBbGwoJ2ltZycpO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGltZ3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGltZ3NbaV0ub25kcmFnc3RhcnQgPSBmdW5jdGlvbiAoKSB7IHJldHVybiBmYWxzZTsgfTsgLy9NU0lFXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgLyogc2VhcmNoIHRoZSBET00gZm9yIGV4Y2x1ZGUgZWxlbWVudHMgKi9cbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5kcmFnT3B0aW9ucy5leGNsdWRlLmxlbmd0aCAhPSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBkcmFnIG9ubHkgaWYgdGhlIG1vdXNlIGNsaWNrZWQgb24gYW4gYWxsb3dlZCBlbGVtZW50ICovXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgZWwgPSBkb2N1bWVudC5lbGVtZW50RnJvbVBvaW50KGUuY2xpZW50WCwgZS5jbGllbnRZKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBleGNsdWRlRWxlbWVudHMgPSB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yQWxsKHRoaXMub3B0aW9ucy5kcmFnT3B0aW9ucy5leGNsdWRlLmpvaW4oJywgJykpO1xuICAgICAgICAgICAgICAgICAgICAgICAgLyogbG9vcCB0aHJvdWdoIGFsbCBwYXJlbnQgZWxlbWVudHMgdW50aWwgd2UgZW5jb3VudGVyIGFuIGlubmVyIGRpdiBvciBubyBtb3JlIHBhcmVudHMgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBpbm5lclJlID0gbmV3IFJlZ0V4cChcIiBcIiArIHRoaXMuY2xhc3NJbm5lciArIFwiIFwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdoaWxlIChlbCAmJiAhZWwuY2xhc3NOYW1lLm1hdGNoKGlubmVyUmUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogY29tcGFyZSBlYWNoIHBhcmVudCwgaWYgaXQgaXMgaW4gdGhlIGV4Y2x1ZGUgbGlzdCAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZXhjbHVkZUVsZW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIGJhaWwgb3V0IGlmIGFuIGVsZW1lbnQgbWF0Y2hlcyAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXhjbHVkZUVsZW1lbnRzW2ldID09IGVsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbCA9IGVsLnBhcmVudEVsZW1lbnQ7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgLy8gc2VhcmNoIHRoZSBET00gZm9yIG9ubHkgZWxlbWVudHMsIGJ1dCBvbmx5IGlmIHRoZXJlIGFyZSBlbGVtZW50cyBzZXRcbiAgICAgICAgICAgICAgICAgICAgLyppZiAodGhpcy5vcHRpb25zLmRyYWdPcHRpb25zLm9ubHkubGVuZ3RoICE9IDApe1xuICAgICAgICAgICAgICAgICAgICAgIHZhciBvbmx5RWxlbWVudHMgPSB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yQWxsKHRoaXMub3B0aW9ucy5kcmFnT3B0aW9ucy5vbmx5LmpvaW4oJywgJykpO1xuICAgICAgICAgICAgICAgICAgICAgIC8vIGxvb3AgdGhyb3VnaCB0aGUgbm9kZWxpc3QgYW5kIGNoZWNrIGZvciBvdXIgZWxlbWVudFxuICAgICAgICAgICAgICAgICAgICAgIHZhciBmb3VuZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZXhjbHVkZUVsZW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAob25seUVsZW1lbnRzW2ldID09IGVsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGZvdW5kID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgIGlmIChmb3VuZCA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0qL1xuICAgICAgICAgICAgICAgICAgICBkb2N1bWVudC5ib2R5LmNsYXNzTmFtZSArPSBcIiBcIiArIHRoaXMuY2xhc3NHcmFiYmluZyArIFwiIFwiO1xuICAgICAgICAgICAgICAgICAgICAvKiBub3RlIHRoZSBvcmlnaW4gcG9zaXRpb25zICovXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZHJhZ09yaWdpbkxlZnQgPSBlLmNsaWVudFg7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZHJhZ09yaWdpblRvcCA9IGUuY2xpZW50WTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kcmFnT3JpZ2luU2Nyb2xsTGVmdCA9IHRoaXMuZ2V0U2Nyb2xsTGVmdCgpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmRyYWdPcmlnaW5TY3JvbGxUb3AgPSB0aGlzLmdldFNjcm9sbFRvcCgpO1xuICAgICAgICAgICAgICAgICAgICAvKiBpdCBsb29rcyBzdHJhbmdlIGlmIHNjcm9sbC1iZWhhdmlvciBpcyBzZXQgdG8gc21vb3RoICovXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucGFyZW50T3JpZ2luU3R5bGUgPSB0aGlzLmlubmVyLnBhcmVudEVsZW1lbnQuc3R5bGUuY3NzVGV4dDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB0aGlzLmlubmVyLnBhcmVudEVsZW1lbnQuc3R5bGUuc2V0UHJvcGVydHkgPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5pbm5lci5wYXJlbnRFbGVtZW50LnN0eWxlLnNldFByb3BlcnR5KCdzY3JvbGwtYmVoYXZpb3InLCAnYXV0bycpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQgPyBlLnByZXZlbnREZWZhdWx0KCkgOiAoZS5yZXR1cm5WYWx1ZSA9IGZhbHNlKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy52eCA9IFtdO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnZ5ID0gW107XG4gICAgICAgICAgICAgICAgICAgIC8qIHJlZ2lzdGVyIHRoZSBldmVudCBoYW5kbGVycyAqL1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm1vdXNlTW92ZUhhbmRsZXIgPSB0aGlzLm1vdXNlTW92ZS5iaW5kKHRoaXMpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIoZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LCAnbW91c2Vtb3ZlJywgdGhpcy5tb3VzZU1vdmVIYW5kbGVyKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5tb3VzZVVwSGFuZGxlciA9IGZ1bmN0aW9uIChlKSB7IHJldHVybiBfdGhpcy5tb3VzZVVwKGUpOyB9O1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIoZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LCAnbW91c2V1cCcsIHRoaXMubW91c2VVcEhhbmRsZXIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIE1vdXNlIHVwIGhhbmRsZXJcbiAgICAgICAgICogRGVyZWdpc3RlcnMgdGhlIG1vdXNlbW92ZSBhbmQgbW91c2V1cCBoYW5kbGVyc1xuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge01vdXNlRXZlbnR9IGUgLSBUaGUgbW91c2UgdXAgZXZlbnQgb2JqZWN0XG4gICAgICAgICAqIEByZXR1cm4ge3ZvaWR9XG4gICAgICAgICAqL1xuICAgICAgICBad29vc2gucHJvdG90eXBlLm1vdXNlVXAgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgLyogVE9ETzogcmVzdG9yZSBvcmlnaW5hbCBwb3NpdGlvbiB2YWx1ZSAqL1xuICAgICAgICAgICAgdGhpcy5pbm5lci5zdHlsZS5wb3NpdGlvbiA9ICcnO1xuICAgICAgICAgICAgdGhpcy5pbm5lci5zdHlsZS50b3AgPSBudWxsO1xuICAgICAgICAgICAgdGhpcy5pbm5lci5zdHlsZS5sZWZ0ID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMucHJlc2VudCA9ICh0aGlzLmdldFRpbWVzdGFtcCgpIC8gMTAwMCk7IC8vaW4gc2Vjb25kc1xuICAgICAgICAgICAgdmFyIHggPSB0aGlzLmdldFJlYWxYKHRoaXMuZHJhZ09yaWdpbkxlZnQgKyB0aGlzLmRyYWdPcmlnaW5TY3JvbGxMZWZ0IC0gZS5jbGllbnRYKTtcbiAgICAgICAgICAgIHZhciB5ID0gdGhpcy5nZXRSZWFsWSh0aGlzLmRyYWdPcmlnaW5Ub3AgKyB0aGlzLmRyYWdPcmlnaW5TY3JvbGxUb3AgLSBlLmNsaWVudFkpO1xuICAgICAgICAgICAgdmFyIHJlID0gbmV3IFJlZ0V4cChcIiBcIiArIHRoaXMuY2xhc3NHcmFiYmluZyArIFwiIFwiKTtcbiAgICAgICAgICAgIGRvY3VtZW50LmJvZHkuY2xhc3NOYW1lID0gZG9jdW1lbnQuYm9keS5jbGFzc05hbWUucmVwbGFjZShyZSwgJycpO1xuICAgICAgICAgICAgdGhpcy5pbm5lci5wYXJlbnRFbGVtZW50LnN0eWxlLmNzc1RleHQgPSB0aGlzLnBhcmVudE9yaWdpblN0eWxlO1xuICAgICAgICAgICAgdGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCwgJ21vdXNlbW92ZScsIHRoaXMubW91c2VNb3ZlSGFuZGxlcik7XG4gICAgICAgICAgICB0aGlzLnJlbW92ZUV2ZW50TGlzdGVuZXIoZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LCAnbW91c2V1cCcsIHRoaXMubW91c2VVcEhhbmRsZXIpO1xuICAgICAgICAgICAgaWYgKHkgIT0gdGhpcy5nZXRTY3JvbGxUb3AoKSB8fCB4ICE9IHRoaXMuZ2V0U2Nyb2xsTGVmdCgpKSB7XG4gICAgICAgICAgICAgICAgdmFyIHQgPSB0aGlzLnByZXNlbnQgLSAodGhpcy5wYXN0ID8gdGhpcy5wYXN0IDogdGhpcy5wcmVzZW50KTtcbiAgICAgICAgICAgICAgICBpZiAodCA+IDAuMDUpIHtcbiAgICAgICAgICAgICAgICAgICAgLyoganVzdCBhbGlnbiB0byB0aGUgZ3JpZCBpZiB0aGUgbW91c2UgbGVmdCB1bm1vdmVkIGZvciBtb3JlIHRoYW4gMC4wNSBzZWNvbmRzICovXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsVG8oeCwgeSwgdGhpcy5vcHRpb25zLmRyYWdPcHRpb25zLmZhZGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMuZHJhZ09wdGlvbnMuZmFkZSAmJiB0eXBlb2YgdGhpcy52eCAhPSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgdGhpcy52eSAhPSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIHZhciBkZWx0YVQsIGRlbHRhU3gsIGRlbHRhU3ksIGxhc3REZWx0YVN4LCBsYXN0RGVsdGFTeTtcbiAgICAgICAgICAgICAgICBkZWx0YVQgPSBkZWx0YVN4ID0gZGVsdGFTeSA9IGxhc3REZWx0YVN4ID0gbGFzdERlbHRhU3kgPSAwO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgaW4gdGhpcy52eSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAocGFyc2VGbG9hdChpKSA+ICh0aGlzLnByZXNlbnQgLSAwLjEpXG4gICAgICAgICAgICAgICAgICAgICAgICAmJiB0eXBlb2YgbGFzdFQgIT0gJ3VuZGVmaW5lZCdcbiAgICAgICAgICAgICAgICAgICAgICAgICYmIHR5cGVvZiBsYXN0U3ggIT0gJ3VuZGVmaW5lZCdcbiAgICAgICAgICAgICAgICAgICAgICAgICYmIHR5cGVvZiBsYXN0U3kgIT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlbHRhVCArPSBwYXJzZUZsb2F0KGkpIC0gbGFzdFQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBsYXN0RGVsdGFTeCA9IHRoaXMudnhbaV0gLSBsYXN0U3g7XG4gICAgICAgICAgICAgICAgICAgICAgICBsYXN0RGVsdGFTeSA9IHRoaXMudnlbaV0gLSBsYXN0U3k7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWx0YVN4ICs9IE1hdGguYWJzKGxhc3REZWx0YVN4KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlbHRhU3kgKz0gTWF0aC5hYnMobGFzdERlbHRhU3kpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHZhciBsYXN0VCA9IHBhcnNlRmxvYXQoaSk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBsYXN0U3ggPSB0aGlzLnZ4W2ldO1xuICAgICAgICAgICAgICAgICAgICB2YXIgbGFzdFN5ID0gdGhpcy52eVtpXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIHZ4ID0gZGVsdGFUID09IDAgPyAwIDogbGFzdERlbHRhU3ggPiAwID8gZGVsdGFTeCAvIGRlbHRhVCA6IGRlbHRhU3ggLyAtZGVsdGFUO1xuICAgICAgICAgICAgICAgIHZhciB2eSA9IGRlbHRhVCA9PSAwID8gMCA6IGxhc3REZWx0YVN5ID4gMCA/IGRlbHRhU3kgLyBkZWx0YVQgOiBkZWx0YVN5IC8gLWRlbHRhVDtcbiAgICAgICAgICAgICAgICAvKiB2IHNob3VsZCBub3QgZXhjZWVkIHZNYXggb3IgLXZNYXggLT4gd291bGQgYmUgdG9vIGZhc3QgYW5kIHNob3VsZCBleGNlZWQgdk1pbiBvciAtdk1pbiAqL1xuICAgICAgICAgICAgICAgIHZhciB2TWF4ID0gdGhpcy5vcHRpb25zLmRyYWdPcHRpb25zLm1heFNwZWVkO1xuICAgICAgICAgICAgICAgIHZhciB2TWluID0gdGhpcy5vcHRpb25zLmRyYWdPcHRpb25zLm1pblNwZWVkO1xuICAgICAgICAgICAgICAgIC8qIGlmIHRoZSBzcGVlZCBpcyBub3Qgd2l0aG91dCBib3VuZCBmb3IgZmFkZSwganVzdCBkbyBhIHJlZ3VsYXIgc2Nyb2xsIHdoZW4gdGhlcmUgaXMgYSBncmlkKi9cbiAgICAgICAgICAgICAgICBpZiAodnkgPCB2TWluICYmIHZ5ID4gLXZNaW4gJiYgdnggPCB2TWluICYmIHZ4ID4gLXZNaW4pIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5ncmlkWSA+IDEgfHwgdGhpcy5vcHRpb25zLmdyaWRYID4gMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zY3JvbGxUbyh4LCB5KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciB2eCA9ICh2eCA8PSB2TWF4ICYmIHZ4ID49IC12TWF4KSA/IHZ4IDogKHZ4ID4gMCA/IHZNYXggOiAtdk1heCk7XG4gICAgICAgICAgICAgICAgdmFyIHZ5ID0gKHZ5IDw9IHZNYXggJiYgdnkgPj0gLXZNYXgpID8gdnkgOiAodnkgPiAwID8gdk1heCA6IC12TWF4KTtcbiAgICAgICAgICAgICAgICB2YXIgYXggPSAodnggPiAwID8gLTEgOiAxKSAqIHRoaXMub3B0aW9ucy5kcmFnT3B0aW9ucy5icmFrZVNwZWVkO1xuICAgICAgICAgICAgICAgIHZhciBheSA9ICh2eSA+IDAgPyAtMSA6IDEpICogdGhpcy5vcHRpb25zLmRyYWdPcHRpb25zLmJyYWtlU3BlZWQ7XG4gICAgICAgICAgICAgICAgeCA9ICgoMCAtIE1hdGgucG93KHZ4LCAyKSkgLyAoMiAqIGF4KSkgKyB0aGlzLmdldFNjcm9sbExlZnQoKTtcbiAgICAgICAgICAgICAgICB5ID0gKCgwIC0gTWF0aC5wb3codnksIDIpKSAvICgyICogYXkpKSArIHRoaXMuZ2V0U2Nyb2xsVG9wKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5zY3JvbGxUbyh4LCB5KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIC8qIGluIGFsbCBvdGhlciBjYXNlcywgZG8gYSByZWd1bGFyIHNjcm9sbCAqL1xuICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsVG8oeCwgeSwgdGhpcy5vcHRpb25zLmRyYWdPcHRpb25zLmZhZGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICAvKipcbiAgICAgICAgICogQ2FsY3VsYXRlcyB0aGUgcm91bmRlZCBhbmQgc2NhbGVkIHgtY29vcmRpbmF0ZS5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IHggLSB0aGUgeC1jb29yZGluYXRlXG4gICAgICAgICAqIEByZXR1cm4ge251bWJlcn0gLSB0aGUgZmluYWwgeC1jb29yZGluYXRlXG4gICAgICAgICAqL1xuICAgICAgICBad29vc2gucHJvdG90eXBlLmdldFJlYWxYID0gZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgICAgIC8vc3RpY2sgdGhlIGVsZW1lbnQgdG8gdGhlIGdyaWQsIGlmIGdyaWQgZXF1YWxzIDEgdGhlIHZhbHVlIGRvZXMgbm90IGNoYW5nZVxuICAgICAgICAgICAgeCA9IE1hdGgucm91bmQoeCAvICh0aGlzLm9wdGlvbnMuZ3JpZFggKiB0aGlzLmdldFNjYWxlKCkpKSAqICh0aGlzLm9wdGlvbnMuZ3JpZFggKiB0aGlzLmdldFNjYWxlKCkpO1xuICAgICAgICAgICAgdmFyIHNjcm9sbE1heExlZnQgPSAodGhpcy5zY3JvbGxFbGVtZW50LnNjcm9sbFdpZHRoIC0gdGhpcy5zY3JvbGxFbGVtZW50LmNsaWVudFdpZHRoKTtcbiAgICAgICAgICAgIHJldHVybiAoeCA+IHNjcm9sbE1heExlZnQpID8gc2Nyb2xsTWF4TGVmdCA6IHg7XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDYWxjdWxhdGVzIHRoZSByb3VuZGVkIGFuZCBzY2FsZWQgeS1jb29yZGluYXRlLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0geSAtIHRoZSB5LWNvb3JkaW5hdGVcbiAgICAgICAgICogQHJldHVybiB7bnVtYmVyfSAtIHRoZSBmaW5hbCB5LWNvb3JkaW5hdGVcbiAgICAgICAgICovXG4gICAgICAgIFp3b29zaC5wcm90b3R5cGUuZ2V0UmVhbFkgPSBmdW5jdGlvbiAoeSkge1xuICAgICAgICAgICAgLy9zdGljayB0aGUgZWxlbWVudCB0byB0aGUgZ3JpZCwgaWYgZ3JpZCBlcXVhbHMgMSB0aGUgdmFsdWUgZG9lcyBub3QgY2hhbmdlXG4gICAgICAgICAgICB5ID0gTWF0aC5yb3VuZCh5IC8gKHRoaXMub3B0aW9ucy5ncmlkWSAqIHRoaXMuZ2V0U2NhbGUoKSkpICogKHRoaXMub3B0aW9ucy5ncmlkWSAqIHRoaXMuZ2V0U2NhbGUoKSk7XG4gICAgICAgICAgICB2YXIgc2Nyb2xsTWF4VG9wID0gKHRoaXMuc2Nyb2xsRWxlbWVudC5zY3JvbGxIZWlnaHQgLSB0aGlzLnNjcm9sbEVsZW1lbnQuY2xpZW50SGVpZ2h0KTtcbiAgICAgICAgICAgIHJldHVybiAoeSA+IHNjcm9sbE1heFRvcCkgPyBzY3JvbGxNYXhUb3AgOiB5O1xuICAgICAgICB9O1xuICAgICAgICAvKipcbiAgICAgICAgICogQ2FsY3VsYXRlcyBlYWNoIHN0ZXAgb2YgYSBzY3JvbGwgZmFkZW91dCBhbmltYXRpb24gYmFzZWQgb24gdGhlIGluaXRpYWwgdmVsb2NpdHkuXG4gICAgICAgICAqIFN0b3BzIGFueSBjdXJyZW50bHkgcnVubmluZyBzY3JvbGwgYW5pbWF0aW9uLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0gdnggLSB0aGUgaW5pdGlhbCB2ZWxvY2l0eSBpbiBob3Jpem9udGFsIGRpcmVjdGlvblxuICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0gdnkgLSB0aGUgaW5pdGlhbCB2ZWxvY2l0eSBpbiB2ZXJ0aWNhbCBkaXJlY3Rpb25cbiAgICAgICAgICogQHJldHVybiB7bnVtYmVyfSAtIHRoZSBmaW5hbCB5LWNvb3JkaW5hdGVcbiAgICAgICAgICovXG4gICAgICAgIFp3b29zaC5wcm90b3R5cGUuZmFkZU91dEJ5VmVsb2NpdHkgPSBmdW5jdGlvbiAodngsIHZ5KSB7XG4gICAgICAgICAgICAvKiBUT0RPOiBjYWxjIHYgaGVyZSBhbmQgd2l0aCBtb3JlIGluZm8sIG1vcmUgcHJlY2lzZWx5ICovXG4gICAgICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICAgICAgLyogY2FsY3VsYXRlIHRoZSBicmFrZSBhY2NlbGVyYXRpb24gaW4gYm90aCBkaXJlY3Rpb25zIHNlcGFyYXRlbHkgKi9cbiAgICAgICAgICAgIHZhciBheSA9ICh2eSA+IDAgPyAtMSA6IDEpICogdGhpcy5vcHRpb25zLmRyYWdPcHRpb25zLmJyYWtlU3BlZWQ7XG4gICAgICAgICAgICB2YXIgYXggPSAodnggPiAwID8gLTEgOiAxKSAqIHRoaXMub3B0aW9ucy5kcmFnT3B0aW9ucy5icmFrZVNwZWVkO1xuICAgICAgICAgICAgLyogZmluZCB0aGUgZGlyZWN0aW9uIHRoYXQgbmVlZHMgbG9uZ2VyIHRvIHN0b3AsIGFuZCByZWNhbGN1bGF0ZSB0aGUgYWNjZWxlcmF0aW9uICovXG4gICAgICAgICAgICB2YXIgdG1heCA9IE1hdGgubWF4KCgwIC0gdnkpIC8gYXksICgwIC0gdngpIC8gYXgpO1xuICAgICAgICAgICAgYXggPSAoMCAtIHZ4KSAvIHRtYXg7XG4gICAgICAgICAgICBheSA9ICgwIC0gdnkpIC8gdG1heDtcbiAgICAgICAgICAgIHZhciBmcHMgPSB0aGlzLm9wdGlvbnMuZHJhZ09wdGlvbnMuZnBzO1xuICAgICAgICAgICAgdmFyIG1lID0gdGhpcztcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgKCh0bWF4ICogZnBzKSArICgwIC8gZnBzKSk7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciB0ID0gKChpICsgMSkgLyBmcHMpO1xuICAgICAgICAgICAgICAgIHZhciBzeSA9IHRoaXMuZ2V0U2Nyb2xsVG9wKCkgKyAodnkgKiB0KSArICgwLjUgKiBheSAqIHQgKiB0KTtcbiAgICAgICAgICAgICAgICB2YXIgc3ggPSB0aGlzLmdldFNjcm9sbExlZnQoKSArICh2eCAqIHQpICsgKDAuNSAqIGF4ICogdCAqIHQpO1xuICAgICAgICAgICAgICAgIHRoaXMudGltZW91dHMucHVzaChzZXRUaW1lb3V0KChmdW5jdGlvbiAoeCwgeSwgbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lLnNldFNjcm9sbFRvcCh5KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lLnNldFNjcm9sbExlZnQoeCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBtZS5vcmlnaW5TY3JvbGxMZWZ0ID0geDtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lLm9yaWdpblNjcm9sbFRvcCA9IHk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfSkoc3gsIHN5LCBtZSksIChpICsgMSkgKiAoMTAwMCAvIGZwcykpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChpID4gMCkge1xuICAgICAgICAgICAgICAgIC8qIHJvdW5kIHRoZSBsYXN0IHN0ZXAgYmFzZWQgb24gdGhlIGRpcmVjdGlvbiBvZiB0aGUgZmFkZSAqL1xuICAgICAgICAgICAgICAgIHN4ID0gdnggPiAwID8gTWF0aC5jZWlsKHN4KSA6IE1hdGguZmxvb3Ioc3gpO1xuICAgICAgICAgICAgICAgIHN5ID0gdnkgPiAwID8gTWF0aC5jZWlsKHN5KSA6IE1hdGguZmxvb3Ioc3kpO1xuICAgICAgICAgICAgICAgIHRoaXMudGltZW91dHMucHVzaChzZXRUaW1lb3V0KChmdW5jdGlvbiAoeCwgeSwgbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lLnNldFNjcm9sbFRvcCh5KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lLnNldFNjcm9sbExlZnQoeCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBtZS5vcmlnaW5TY3JvbGxMZWZ0ID0geDtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lLm9yaWdpblNjcm9sbFRvcCA9IHk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfSkoc3gsIHN5LCBtZSksIChpICsgMikgKiAoMTAwMCAvIGZwcykpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8qIHN0b3AgdGhlIGFuaW1hdGlvbiB3aGVuIGNvbGxpZGluZyB3aXRoIHRoZSBib3JkZXJzICovXG4gICAgICAgICAgICB0aGlzLmNsZWFyTGlzdGVuZXJMZWZ0ID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gX3RoaXMuY2xlYXJUaW1lb3V0cygpOyB9O1xuICAgICAgICAgICAgdGhpcy5jbGVhckxpc3RlbmVyUmlnaHQgPSBmdW5jdGlvbiAoKSB7IHJldHVybiBfdGhpcy5jbGVhclRpbWVvdXRzKCk7IH07XG4gICAgICAgICAgICB0aGlzLmNsZWFyTGlzdGVuZXJUb3AgPSBmdW5jdGlvbiAoKSB7IHJldHVybiBfdGhpcy5jbGVhclRpbWVvdXRzKCk7IH07XG4gICAgICAgICAgICB0aGlzLmNsZWFyTGlzdGVuZXJCb3R0b20gPSBmdW5jdGlvbiAoKSB7IHJldHVybiBfdGhpcy5jbGVhclRpbWVvdXRzKCk7IH07XG4gICAgICAgICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIodGhpcy5pbm5lciwgJ2NvbGxpZGUubGVmdCcsIHRoaXMuY2xlYXJMaXN0ZW5lckxlZnQpO1xuICAgICAgICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKHRoaXMuaW5uZXIsICdjb2xsaWRlLnJpZ2h0JywgdGhpcy5jbGVhckxpc3RlbmVyUmlnaHQpO1xuICAgICAgICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKHRoaXMuaW5uZXIsICdjb2xsaWRlLnRvcCcsIHRoaXMuY2xlYXJMaXN0ZW5lclRvcCk7XG4gICAgICAgICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIodGhpcy5pbm5lciwgJ2NvbGxpZGUuYm90dG9tJywgdGhpcy5jbGVhckxpc3RlbmVyQm90dG9tKTtcbiAgICAgICAgfTtcbiAgICAgICAgWndvb3NoLnByb3RvdHlwZS5mYWRlT3V0QnlDb29yZHMgPSBmdW5jdGlvbiAoeCwgeSkge1xuICAgICAgICAgICAgeCA9IHRoaXMuZ2V0UmVhbFgoeCk7XG4gICAgICAgICAgICB5ID0gdGhpcy5nZXRSZWFsWSh5KTtcbiAgICAgICAgICAgIHZhciBhID0gdGhpcy5vcHRpb25zLmRyYWdPcHRpb25zLmJyYWtlU3BlZWQgKiAtMTtcbiAgICAgICAgICAgIHZhciB2eSA9IDAgLSAoMiAqIGEgKiAoeSAtIHRoaXMuZ2V0U2Nyb2xsVG9wKCkpKTtcbiAgICAgICAgICAgIHZhciB2eCA9IDAgLSAoMiAqIGEgKiAoeCAtIHRoaXMuZ2V0U2Nyb2xsTGVmdCgpKSk7XG4gICAgICAgICAgICB2eSA9ICh2eSA+IDAgPyAxIDogLTEpICogTWF0aC5zcXJ0KE1hdGguYWJzKHZ5KSk7XG4gICAgICAgICAgICB2eCA9ICh2eCA+IDAgPyAxIDogLTEpICogTWF0aC5zcXJ0KE1hdGguYWJzKHZ4KSk7XG4gICAgICAgICAgICB2YXIgc3ggPSB4IC0gdGhpcy5nZXRTY3JvbGxMZWZ0KCk7XG4gICAgICAgICAgICB2YXIgc3kgPSB5IC0gdGhpcy5nZXRTY3JvbGxUb3AoKTtcbiAgICAgICAgICAgIGlmIChNYXRoLmFicyhzeSkgPiBNYXRoLmFicyhzeCkpIHtcbiAgICAgICAgICAgICAgICB2eCA9ICh2eCA+IDAgPyAxIDogLTEpICogTWF0aC5hYnMoKHN4IC8gc3kpICogdnkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdnkgPSAodnkgPiAwID8gMSA6IC0xKSAqIE1hdGguYWJzKChzeSAvIHN4KSAqIHZ4KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuY2xlYXJUaW1lb3V0cygpO1xuICAgICAgICAgICAgdGhpcy5mYWRlT3V0QnlWZWxvY2l0eSh2eCwgdnkpO1xuICAgICAgICB9O1xuICAgICAgICAvKipcbiAgICAgICAgICogTW91c2UgbW92ZSBoYW5kbGVyXG4gICAgICAgICAqIENhbGN1Y2F0ZXMgdGhlIHggYW5kIHkgZGVsdGFzIGFuZCBzY3JvbGxzXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7TW91c2VFdmVudH0gZSAtIFRoZSBtb3VzZSBtb3ZlIGV2ZW50IG9iamVjdFxuICAgICAgICAgKiBAcmV0dXJuIHt2b2lkfVxuICAgICAgICAgKi9cbiAgICAgICAgWndvb3NoLnByb3RvdHlwZS5tb3VzZU1vdmUgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgdGhpcy5wcmVzZW50ID0gKHRoaXMuZ2V0VGltZXN0YW1wKCkgLyAxMDAwKTsgLy9pbiBzZWNvbmRzXG4gICAgICAgICAgICB0aGlzLmNsZWFyVGV4dFNlbGVjdGlvbigpO1xuICAgICAgICAgICAgLyogaWYgdGhlIG1vdXNlIGxlZnQgdGhlIHdpbmRvdyBhbmQgdGhlIGJ1dHRvbiBpcyBub3QgcHJlc3NlZCBhbnltb3JlLCBhYm9ydCBtb3ZpbmcgKi9cbiAgICAgICAgICAgIC8vaWYgKChlLmJ1dHRvbnMgPT0gMCAmJiBlLmJ1dHRvbiA9PSAwKSB8fCAodHlwZW9mIGUuYnV0dG9ucyA9PSAndW5kZWZpbmVkJyAmJiBlLmJ1dHRvbiA9PSAwKSkge1xuICAgICAgICAgICAgaWYgKChcIndoaWNoXCIgaW4gZSAmJiBlLndoaWNoID09IDApIHx8ICh0eXBlb2YgZS53aGljaCA9PSAndW5kZWZpbmVkJyAmJiBcImJ1dHRvblwiIGluIGUgJiYgZS5idXR0b24gPT0gMCkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm1vdXNlVXAoZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIHggPSB0aGlzLmRyYWdPcmlnaW5MZWZ0ICsgdGhpcy5kcmFnT3JpZ2luU2Nyb2xsTGVmdCAtIGUuY2xpZW50WDtcbiAgICAgICAgICAgIHZhciB5ID0gdGhpcy5kcmFnT3JpZ2luVG9wICsgdGhpcy5kcmFnT3JpZ2luU2Nyb2xsVG9wIC0gZS5jbGllbnRZO1xuICAgICAgICAgICAgLyogaWYgZWxhc3RpYyBlZGdlcyBhcmUgc2V0LCBzaG93IHRoZSBlbGVtZW50IHBzZXVkbyBzY3JvbGxlZCBieSByZWxhdGl2ZSBwb3NpdGlvbiAqL1xuICAgICAgICAgICAgaWYgKHRoaXMudHJpZ2dlcmVkLmNvbGxpZGVCb3R0b20gJiYgdGhpcy5vcHRpb25zLmVsYXN0aWNFZGdlcy5ib3R0b20gPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmlubmVyLnN0eWxlLnBvc2l0aW9uID0gJ3JlbGF0aXZlJztcbiAgICAgICAgICAgICAgICB0aGlzLmlubmVyLnN0eWxlLnRvcCA9ICgodGhpcy5nZXRTY3JvbGxUb3AoKSAtIHkpIC8gMikgKyAncHgnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRoaXMudHJpZ2dlcmVkLmNvbGxpZGVUb3AgJiYgdGhpcy5vcHRpb25zLmVsYXN0aWNFZGdlcy50b3AgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmlubmVyLnN0eWxlLnBvc2l0aW9uID0gJ3JlbGF0aXZlJztcbiAgICAgICAgICAgICAgICB0aGlzLmlubmVyLnN0eWxlLnRvcCA9ICh5IC8gLTIpICsgJ3B4JztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzLnRyaWdnZXJlZC5jb2xsaWRlTGVmdCAmJiB0aGlzLm9wdGlvbnMuZWxhc3RpY0VkZ2VzLmxlZnQgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmlubmVyLnN0eWxlLnBvc2l0aW9uID0gJ3JlbGF0aXZlJztcbiAgICAgICAgICAgICAgICB0aGlzLmlubmVyLnN0eWxlLmxlZnQgPSAoeCAvIC0yKSArICdweCc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy50cmlnZ2VyZWQuY29sbGlkZVJpZ2h0ICYmIHRoaXMub3B0aW9ucy5lbGFzdGljRWRnZXMucmlnaHQgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmlubmVyLnN0eWxlLnBvc2l0aW9uID0gJ3JlbGF0aXZlJztcbiAgICAgICAgICAgICAgICB0aGlzLmlubmVyLnN0eWxlLmxlZnQgPSAoKHRoaXMuZ2V0U2Nyb2xsTGVmdCgpIC0geCkgLyAyKSArICdweCc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnZ4W3RoaXMucHJlc2VudF0gPSB4O1xuICAgICAgICAgICAgdGhpcy52eVt0aGlzLnByZXNlbnRdID0geTtcbiAgICAgICAgICAgIHRoaXMuc2Nyb2xsVG8oeCwgeSwgZmFsc2UpO1xuICAgICAgICAgICAgdGhpcy5wYXN0ID0gdGhpcy5wcmVzZW50O1xuICAgICAgICB9O1xuICAgICAgICAvKipcbiAgICAgICAgICogc2Nyb2xsQnkgaGVscGVyIG1ldGhvZCB0byBzY3JvbGwgYnkgYW4gYW1vdW50IG9mIHBpeGVscyBpbiB4LSBhbmQgeS1kaXJlY3Rpb25cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IHggLSBhbW91bnQgb2YgcGl4ZWxzIHRvIHNjcm9sbCBpbiB4LWRpcmVjdGlvblxuICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0geSAtIGFtb3VudCBvZiBwaXhlbHMgdG8gc2Nyb2xsIGluIHktZGlyZWN0aW9uXG4gICAgICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gc21vb3RoIC0gd2hldGhlciB0byBzY3JvbGwgc21vb3RoIG9yIGluc3RhbnRcbiAgICAgICAgICogQHJldHVybiB7dm9pZH1cbiAgICAgICAgICovXG4gICAgICAgIFp3b29zaC5wcm90b3R5cGUuc2Nyb2xsQnkgPSBmdW5jdGlvbiAoeCwgeSwgc21vb3RoKSB7XG4gICAgICAgICAgICBpZiAoc21vb3RoID09PSB2b2lkIDApIHsgc21vb3RoID0gdHJ1ZTsgfVxuICAgICAgICAgICAgdmFyIGFic29sdXRlWCA9IHRoaXMuZ2V0U2Nyb2xsTGVmdCgpICsgeDtcbiAgICAgICAgICAgIHZhciBhYnNvbHV0ZVkgPSB0aGlzLmdldFNjcm9sbFRvcCgpICsgeTtcbiAgICAgICAgICAgIHRoaXMuc2Nyb2xsVG8oYWJzb2x1dGVYLCBhYnNvbHV0ZVksIHNtb290aCk7XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBzY3JvbGxCeSBoZWxwZXIgbWV0aG9kIHRvIHNjcm9sbCB0byBhIHgtIGFuZCB5LWNvb3JkaW5hdGVcbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IHggLSB4LWNvb3JkaW5hdGUgdG8gc2Nyb2xsIHRvXG4gICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSB5IC0geS1jb29yZGluYXRlIHRvIHNjcm9sbCB0b1xuICAgICAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IHNtb290aCAtIHdoZXRoZXIgdG8gc2Nyb2xsIHNtb290aCBvciBpbnN0YW50XG4gICAgICAgICAqIEByZXR1cm4ge3ZvaWR9XG4gICAgICAgICAqXG4gICAgICAgICAqIEBUT0RPOiBDU1MzIHRyYW5zaXRpb25zIGlmIGF2YWlsYWJsZSBpbiBicm93c2VyXG4gICAgICAgICAqL1xuICAgICAgICBad29vc2gucHJvdG90eXBlLnNjcm9sbFRvID0gZnVuY3Rpb24gKHgsIHksIHNtb290aCkge1xuICAgICAgICAgICAgaWYgKHNtb290aCA9PT0gdm9pZCAwKSB7IHNtb290aCA9IHRydWU7IH1cbiAgICAgICAgICAgIHRoaXMuY2xlYXJUaW1lb3V0cygpO1xuICAgICAgICAgICAgdGhpcy5zY3JvbGxNYXhMZWZ0ID0gKHRoaXMuc2Nyb2xsRWxlbWVudC5zY3JvbGxXaWR0aCAtIHRoaXMuc2Nyb2xsRWxlbWVudC5jbGllbnRXaWR0aCk7XG4gICAgICAgICAgICB0aGlzLnNjcm9sbE1heFRvcCA9ICh0aGlzLnNjcm9sbEVsZW1lbnQuc2Nyb2xsSGVpZ2h0IC0gdGhpcy5zY3JvbGxFbGVtZW50LmNsaWVudEhlaWdodCk7XG4gICAgICAgICAgICAvKiBubyBuZWdhdGl2ZSB2YWx1ZXMgb3IgdmFsdWVzIGdyZWF0ZXIgdGhhbiB0aGUgbWF4aW11bSAqL1xuICAgICAgICAgICAgdmFyIHggPSAoeCA+IHRoaXMuc2Nyb2xsTWF4TGVmdCkgPyB0aGlzLnNjcm9sbE1heExlZnQgOiAoeCA8IDApID8gMCA6IHg7XG4gICAgICAgICAgICB2YXIgeSA9ICh5ID4gdGhpcy5zY3JvbGxNYXhUb3ApID8gdGhpcy5zY3JvbGxNYXhUb3AgOiAoeSA8IDApID8gMCA6IHk7XG4gICAgICAgICAgICAvKiByZW1lbWJlciB0aGUgb2xkIHZhbHVlcyAqL1xuICAgICAgICAgICAgdGhpcy5vcmlnaW5TY3JvbGxMZWZ0ID0gdGhpcy5nZXRTY3JvbGxMZWZ0KCk7XG4gICAgICAgICAgICB0aGlzLm9yaWdpblNjcm9sbFRvcCA9IHRoaXMuZ2V0U2Nyb2xsVG9wKCk7XG4gICAgICAgICAgICBpZiAoeCAhPSB0aGlzLmdldFNjcm9sbExlZnQoKSB8fCB5ICE9IHRoaXMuZ2V0U2Nyb2xsVG9wKCkpIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLndoZWVsT3B0aW9ucy5zbW9vdGggIT09IHRydWUgfHwgc21vb3RoID09PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNldFNjcm9sbFRvcCh5KTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXRTY3JvbGxMZWZ0KHgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5mYWRlT3V0QnlDb29yZHMoeCwgeSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICAvKipcbiAgICAgICAgICogUmVnaXN0ZXIgY3VzdG9tIGV2ZW50IGNhbGxiYWNrc1xuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnQgLSBUaGUgZXZlbnQgbmFtZVxuICAgICAgICAgKiBAcGFyYW0geyhlOiBFdmVudCkgPT4gYW55fSBjYWxsYmFjayAtIEEgY2FsbGJhY2sgZnVuY3Rpb24gdG8gZXhlY3V0ZSB3aGVuIHRoZSBldmVudCByYWlzZXNcbiAgICAgICAgICogQHJldHVybiB7Wndvb3NofSAtIFRoZSBad29vc2ggb2JqZWN0IGluc3RhbmNlXG4gICAgICAgICAqL1xuICAgICAgICBad29vc2gucHJvdG90eXBlLm9uID0gZnVuY3Rpb24gKGV2ZW50LCBjYWxsYmFjaykge1xuICAgICAgICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKHRoaXMuaW5uZXIsIGV2ZW50LCBjYWxsYmFjayk7XG4gICAgICAgICAgICAvKiBzZXQgdGhlIGV2ZW50IHVudHJpZ2dlcmVkIGFuZCBjYWxsIHRoZSBmdW5jdGlvbiwgdG8gcmV0cmlnZ2VyIG1ldCBldmVudHMgKi9cbiAgICAgICAgICAgIHZhciBmID0gZXZlbnQucmVwbGFjZSgvXFwuKFthLXpdKS8sIFN0cmluZy5jYWxsLmJpbmQoZXZlbnQudG9VcHBlckNhc2UpKS5yZXBsYWNlKC9cXC4vLCAnJyk7XG4gICAgICAgICAgICB0aGlzLnRyaWdnZXJlZFtmXSA9IGZhbHNlO1xuICAgICAgICAgICAgdGhpcy5vblNjcm9sbCgpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBEZXJlZ2lzdGVyIGN1c3RvbSBldmVudCBjYWxsYmFja3NcbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50IC0gVGhlIGV2ZW50IG5hbWVcbiAgICAgICAgICogQHBhcmFtIHsoZTogRXZlbnQpID0+IGFueX0gY2FsbGJhY2sgLSBBIGNhbGxiYWNrIGZ1bmN0aW9uIHRvIGV4ZWN1dGUgd2hlbiB0aGUgZXZlbnQgcmFpc2VzXG4gICAgICAgICAqIEByZXR1cm4ge1p3b29zaH0gLSBUaGUgWndvb3NoIG9iamVjdCBpbnN0YW5jZVxuICAgICAgICAgKi9cbiAgICAgICAgWndvb3NoLnByb3RvdHlwZS5vZmYgPSBmdW5jdGlvbiAoZXZlbnQsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICB0aGlzLnJlbW92ZUV2ZW50TGlzdGVuZXIodGhpcy5pbm5lciwgZXZlbnQsIGNhbGxiYWNrKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9O1xuICAgICAgICAvKipcbiAgICAgICAgICogUmV2ZXJ0IGFsbCBET00gbWFuaXB1bGF0aW9ucyBhbmQgZGVyZWdpc3RlciBhbGwgZXZlbnQgaGFuZGxlcnNcbiAgICAgICAgICpcbiAgICAgICAgICogQHJldHVybiB7dm9pZH1cbiAgICAgICAgICogQFRPRE86IHJlbW92aW5nIHdoZWVsWm9vbUhhbmRsZXIgZG9lcyBub3Qgd29ya1xuICAgICAgICAgKi9cbiAgICAgICAgWndvb3NoLnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHggPSB0aGlzLmdldFNjcm9sbExlZnQoKTtcbiAgICAgICAgICAgIHZhciB5ID0gdGhpcy5nZXRTY3JvbGxUb3AoKTtcbiAgICAgICAgICAgIC8qIHJlbW92ZSB0aGUgb3V0ZXIgYW5kIGdyYWIgQ1NTIGNsYXNzZXMgKi9cbiAgICAgICAgICAgIHZhciByZSA9IG5ldyBSZWdFeHAoXCIgXCIgKyB0aGlzLmNsYXNzT3V0ZXIgKyBcIiBcIik7XG4gICAgICAgICAgICB0aGlzLmNvbnRhaW5lci5jbGFzc05hbWUgPSB0aGlzLmNvbnRhaW5lci5jbGFzc05hbWUucmVwbGFjZShyZSwgJycpO1xuICAgICAgICAgICAgdmFyIHJlID0gbmV3IFJlZ0V4cChcIiBcIiArIHRoaXMuY2xhc3NHcmFiICsgXCIgXCIpO1xuICAgICAgICAgICAgdGhpcy5pbm5lci5jbGFzc05hbWUgPSB0aGlzLmlubmVyLmNsYXNzTmFtZS5yZXBsYWNlKHJlLCAnJyk7XG4gICAgICAgICAgICB2YXIgcmUgPSBuZXcgUmVnRXhwKFwiIFwiICsgdGhpcy5jbGFzc05vR3JhYiArIFwiIFwiKTtcbiAgICAgICAgICAgIHRoaXMuY29udGFpbmVyLmNsYXNzTmFtZSA9IHRoaXMuY29udGFpbmVyLmNsYXNzTmFtZS5yZXBsYWNlKHJlLCAnJyk7XG4gICAgICAgICAgICAvKiBtb3ZlIGFsbCBjaGlsZE5vZGVzIGJhY2sgdG8gdGhlIG9sZCBvdXRlciBlbGVtZW50IGFuZCByZW1vdmUgdGhlIGlubmVyIGVsZW1lbnQgKi9cbiAgICAgICAgICAgIHdoaWxlICh0aGlzLmlubmVyLmNoaWxkTm9kZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIHRoaXMuY29udGFpbmVyLmFwcGVuZENoaWxkKHRoaXMuaW5uZXIuY2hpbGROb2Rlc1swXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnNjYWxlRWxlbWVudC5yZW1vdmVDaGlsZCh0aGlzLmlubmVyKTtcbiAgICAgICAgICAgIHRoaXMuY29udGFpbmVyLnJlbW92ZUNoaWxkKHRoaXMuc2NhbGVFbGVtZW50KTtcbiAgICAgICAgICAgIHRoaXMuc2Nyb2xsVG8oeCwgeSwgZmFsc2UpO1xuICAgICAgICAgICAgdGhpcy5tb3VzZU1vdmVIYW5kbGVyID8gdGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCwgJ21vdXNlbW92ZScsIHRoaXMubW91c2VNb3ZlSGFuZGxlcikgOiBudWxsO1xuICAgICAgICAgICAgdGhpcy5tb3VzZVVwSGFuZGxlciA/IHRoaXMucmVtb3ZlRXZlbnRMaXN0ZW5lcihkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQsICdtb3VzZXVwJywgdGhpcy5tb3VzZVVwSGFuZGxlcikgOiBudWxsO1xuICAgICAgICAgICAgdGhpcy5tb3VzZURvd25IYW5kbGVyID8gdGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKHRoaXMuaW5uZXIsICdtb3VzZWRvd24nLCB0aGlzLm1vdXNlRG93bkhhbmRsZXIpIDogbnVsbDtcbiAgICAgICAgICAgIHRoaXMubW91c2VTY3JvbGxIYW5kbGVyID8gdGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKHRoaXMuc2Nyb2xsRWxlbWVudCwgJ3doZWVsJywgdGhpcy5tb3VzZVNjcm9sbEhhbmRsZXIpIDogbnVsbDtcbiAgICAgICAgICAgIHRoaXMubW91c2Vab29tSGFuZGxlciA/IHRoaXMucmVtb3ZlRXZlbnRMaXN0ZW5lcih0aGlzLnNjcm9sbEVsZW1lbnQsICd3aGVlbCcsIHRoaXMubW91c2Vab29tSGFuZGxlcikgOiBudWxsO1xuICAgICAgICAgICAgdGhpcy5oYXNoQ2hhbmdlSGFuZGxlciA/IHRoaXMucmVtb3ZlRXZlbnRMaXN0ZW5lcih3aW5kb3csICdteWhhc2hjaGFuZ2UnLCB0aGlzLmhhc2hDaGFuZ2VIYW5kbGVyKSA6IG51bGw7XG4gICAgICAgICAgICB0aGlzLmhhc2hDaGFuZ2VIYW5kbGVyID8gdGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKHdpbmRvdywgJ2hhc2hjaGFuZ2UnLCB0aGlzLmhhc2hDaGFuZ2VIYW5kbGVyKSA6IG51bGw7XG4gICAgICAgICAgICBpZiAodGhpcy5oYXNoQ2hhbmdlQ2xpY2tIYW5kbGVyKSB7XG4gICAgICAgICAgICAgICAgdmFyIGxpbmtzID0gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvckFsbChcImFbaHJlZl49JyMnXVwiKTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxpbmtzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVtb3ZlRXZlbnRMaXN0ZW5lcihsaW5rc1tpXSwgJ2NsaWNrJywgdGhpcy5oYXNoQ2hhbmdlQ2xpY2tIYW5kbGVyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnNjcm9sbEVsZW1lbnQgPyB0aGlzLnNjcm9sbEVsZW1lbnQub25tb3VzZXdoZWVsID0gbnVsbCA6IG51bGw7XG4gICAgICAgICAgICB0aGlzLnNjcm9sbEVsZW1lbnQgPyB0aGlzLnNjcm9sbEVsZW1lbnQub25zY3JvbGwgPSBudWxsIDogbnVsbDtcbiAgICAgICAgICAgIHdpbmRvdy5vbnJlc2l6ZSA9IG51bGw7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBad29vc2g7XG4gICAgfSgpKTtcbiAgICAvKiByZXR1cm4gYW4gaW5zdGFuY2Ugb2YgdGhlIGNsYXNzICovXG4gICAgcmV0dXJuIG5ldyBad29vc2goY29udGFpbmVyLCBvcHRpb25zKTtcbn1cbm1vZHVsZS5leHBvcnRzID0gendvb3NoO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9endvb3NoLmpzLm1hcCJdfQ==
