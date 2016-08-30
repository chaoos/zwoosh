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
     * Export function of the module
     *
     * @param {HTMLElement} container - The HTMLElement to swoooosh!
     * @param {Options} options - the options object to configure Swoosh
     * @return {Swoosh} - Swoosh object instance
     */
    function swoosh(container, options) {
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
         * Swoosh provides a set of functions to implement scroll by drag, zoom by mousewheel,
         * hash links inside the document and other special scroll related requirements.
         *
         * @author Roman Gruber <p1020389@yahoo.com>
         * @version 1.0
         */
        var Swoosh = (function () {
            function Swoosh(container, options) {
                this.container = container;
                this.options = options;
                /* CSS style classes */
                this.classInner = 'sw-inner';
                this.classOuter = 'sw-outer';
                this.classGrab = 'sw-grab';
                this.classNoGrab = 'sw-nograb';
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
                        exclude: ['input', 'textarea', 'a', 'button', '.sw-ignore', 'select'],
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
                        minSpeed: 300
                    },
                    /* activates/deactivates scrolling by wheel. If the dreiction is vertical and there are
                     * scrollbars present, swoosh lets leaves scrolling to the browser. */
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
                    /* let swoosh handle anchor links targeting to an anchor inside of this swoosh element.
                     * the element outside (maybe the body) handles anchors too. If you want to prevent this,
                     * add to body as swoosh element too. */
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
            Swoosh.prototype.init = function () {
                var _this = this;
                this.isBody = this.container.tagName == "BODY" ? true : false;
                /* Chrome solution to scroll the body is not really viable, so we create a fake body
                 * div element to scroll on */
                if (this.isBody === true) {
                    var pseudoBody = document.createElement("div");
                    pseudoBody.className += " sw-fakebody ";
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
             * Reinitialize the swoosh element
             *
             * @return {Swoosh} - The Swoosh object instance
             * @TODO: preserve scroll position in init()
             */
            Swoosh.prototype.reinit = function () {
                this.destroy();
                this.classUnique = 'sw-' + Math.random().toString(36).substring(7);
                this.init();
                return this;
            };
            /* @TODO: ScrollWidth and ClientWidth ScrollHeight ClientHeight */
            Swoosh.prototype.getScrollLeft = function () {
                return this.scrollElement.scrollLeft;
            };
            Swoosh.prototype.setScrollLeft = function (left) {
                this.scrollElement.scrollLeft = left;
            };
            Swoosh.prototype.getScrollTop = function () {
                return this.scrollElement.scrollTop;
            };
            Swoosh.prototype.setScrollTop = function (top) {
                this.scrollElement.scrollTop = top;
            };
            /**
             * Handle hashchanges with own scroll function
             *
             * @param {Event} e - the hashchange or myhashchange event, or nothing
             * @return {void}
             */
            Swoosh.prototype.onHashChange = function (e) {
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
            Swoosh.prototype.scrollToElement = function (element) {
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
             * @param {HTMLElement} el - the HTML element
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
             * @param {HTMLElement} el - the HTML element
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
             * Scales the inner element by a relatice value based on the current scale value.
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
             * Scales the inner element to an absolute value.
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
            Swoosh.prototype.onScroll = function (e) {
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
             * @param {any} obj - The HTMLElement to attach the event to
             * @param {string} event - The event name without the leading "on"
             * @param {(e: Event) => void} callback - A callback function to attach to the event
             * @param {boolean} bound - whether to bind the callback to the object instance or not
             * @return {void}
             */
            Swoosh.prototype.addEventListener = function (obj, event, callback, bound) {
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
            Swoosh.prototype.mouseUp = function (e) {
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
            Swoosh.prototype.getRealX = function (x) {
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
            Swoosh.prototype.getRealY = function (y) {
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
            Swoosh.prototype.fadeOutByCoords = function (x, y) {
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
            Swoosh.prototype.mouseMove = function (e) {
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
            Swoosh.prototype.scrollBy = function (x, y, smooth) {
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
            Swoosh.prototype.scrollTo = function (x, y, smooth) {
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
             * @return {Swoosh} - The Swoosh object instance
             */
            Swoosh.prototype.on = function (event, callback) {
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
             * @return {Swoosh} - The Swoosh object instance
             */
            Swoosh.prototype.off = function (event, callback) {
                this.removeEventListener(this.inner, event, callback);
                return this;
            };
            /**
             * Revert all DOM manipulations and deregister all event handlers
             *
             * @return {void}
             * @TODO: removing wheelZoomHandler does not work
             */
            Swoosh.prototype.destroy = function () {
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
            return Swoosh;
        }());
        /* return an instance of the class */
        return new Swoosh(container, options);
    }
    return swoosh;
});

},{}]},{},[1])(1)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzd29vc2guanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiKGZ1bmN0aW9uIChmYWN0b3J5KSB7XG4gICAgaWYgKHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUuZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgdmFyIHYgPSBmYWN0b3J5KHJlcXVpcmUsIGV4cG9ydHMpOyBpZiAodiAhPT0gdW5kZWZpbmVkKSBtb2R1bGUuZXhwb3J0cyA9IHY7XG4gICAgfVxuICAgIGVsc2UgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgICAgICBkZWZpbmUoW1wicmVxdWlyZVwiLCBcImV4cG9ydHNcIl0sIGZhY3RvcnkpO1xuICAgIH1cbn0pKGZ1bmN0aW9uIChyZXF1aXJlLCBleHBvcnRzKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG4gICAgLyoqXG4gICAgICogRXhwb3J0IGZ1bmN0aW9uIG9mIHRoZSBtb2R1bGVcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGNvbnRhaW5lciAtIFRoZSBIVE1MRWxlbWVudCB0byBzd29vb29zaCFcbiAgICAgKiBAcGFyYW0ge09wdGlvbnN9IG9wdGlvbnMgLSB0aGUgb3B0aW9ucyBvYmplY3QgdG8gY29uZmlndXJlIFN3b29zaFxuICAgICAqIEByZXR1cm4ge1N3b29zaH0gLSBTd29vc2ggb2JqZWN0IGluc3RhbmNlXG4gICAgICovXG4gICAgZnVuY3Rpb24gc3dvb3NoKGNvbnRhaW5lciwgb3B0aW9ucykge1xuICAgICAgICBpZiAob3B0aW9ucyA9PT0gdm9pZCAwKSB7IG9wdGlvbnMgPSB7fTsgfVxuICAgICAgICAvKipcbiAgICAgICAgICogUG9seWZpbGwgYmluZCBmdW5jdGlvbiBmb3Igb2xkZXIgYnJvd3NlcnNcbiAgICAgICAgICogVGhlIGJpbmQgZnVuY3Rpb24gaXMgYW4gYWRkaXRpb24gdG8gRUNNQS0yNjIsIDV0aCBlZGl0aW9uXG4gICAgICAgICAqIEBzZWU6IGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0phdmFTY3JpcHQvUmVmZXJlbmNlL0dsb2JhbF9PYmplY3RzL0Z1bmN0aW9uL2JpbmRcbiAgICAgICAgICovXG4gICAgICAgIGlmICghRnVuY3Rpb24ucHJvdG90eXBlLmJpbmQpIHtcbiAgICAgICAgICAgIEZ1bmN0aW9uLnByb3RvdHlwZS5iaW5kID0gZnVuY3Rpb24gKG9UaGlzKSB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB0aGlzICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNsb3Nlc3QgdGhpbmcgcG9zc2libGUgdG8gdGhlIEVDTUFTY3JpcHQgNVxuICAgICAgICAgICAgICAgICAgICAvLyBpbnRlcm5hbCBJc0NhbGxhYmxlIGZ1bmN0aW9uXG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0Z1bmN0aW9uLnByb3RvdHlwZS5iaW5kIC0gd2hhdCBpcyB0cnlpbmcgdG8gYmUgYm91bmQgaXMgbm90IGNhbGxhYmxlJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciBhQXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSksIGZUb0JpbmQgPSB0aGlzLCBmTk9QID0gZnVuY3Rpb24gKCkgeyB9LCBmQm91bmQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmVG9CaW5kLmFwcGx5KHRoaXMgaW5zdGFuY2VvZiBmTk9QXG4gICAgICAgICAgICAgICAgICAgICAgICA/IHRoaXNcbiAgICAgICAgICAgICAgICAgICAgICAgIDogb1RoaXMsIGFBcmdzLmNvbmNhdChBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpKSk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5wcm90b3R5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gRnVuY3Rpb24ucHJvdG90eXBlIGRvZXNuJ3QgaGF2ZSBhIHByb3RvdHlwZSBwcm9wZXJ0eVxuICAgICAgICAgICAgICAgICAgICBmTk9QLnByb3RvdHlwZSA9IHRoaXMucHJvdG90eXBlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBmQm91bmQucHJvdG90eXBlID0gbmV3IGZOT1AoKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZkJvdW5kO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICAvKipcbiAgICAgICAgICogUG9seWZpbGwgYXJyYXkuaW5kZXhPZiBmdW5jdGlvbiBmb3Igb2xkZXIgYnJvd3NlcnNcbiAgICAgICAgICogVGhlIGluZGV4T2YoKSBmdW5jdGlvbiB3YXMgYWRkZWQgdG8gdGhlIEVDTUEtMjYyIHN0YW5kYXJkIGluIHRoZSA1dGggZWRpdGlvblxuICAgICAgICAgKiBhcyBzdWNoIGl0IG1heSBub3QgYmUgcHJlc2VudCBpbiBhbGwgYnJvd3NlcnMuXG4gICAgICAgICAqIEBzZWUgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSmF2YVNjcmlwdC9SZWZlcmVuY2UvR2xvYmFsX09iamVjdHMvQXJyYXkvaW5kZXhPZlxuICAgICAgICAgKi9cbiAgICAgICAgaWYgKCFBcnJheS5wcm90b3R5cGUuaW5kZXhPZikge1xuICAgICAgICAgICAgQXJyYXkucHJvdG90eXBlLmluZGV4T2YgPSBmdW5jdGlvbiAoc2VhcmNoRWxlbWVudCwgZnJvbUluZGV4KSB7XG4gICAgICAgICAgICAgICAgdmFyIGs7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMgPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdcInRoaXNcIiBpcyBudWxsIG9yIG5vdCBkZWZpbmVkJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciBvID0gT2JqZWN0KHRoaXMpO1xuICAgICAgICAgICAgICAgIHZhciBsZW4gPSBvLmxlbmd0aCA+Pj4gMDtcbiAgICAgICAgICAgICAgICBpZiAobGVuID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAtMTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIG4gPSArZnJvbUluZGV4IHx8IDA7XG4gICAgICAgICAgICAgICAgaWYgKE1hdGguYWJzKG4pID09PSBJbmZpbml0eSkge1xuICAgICAgICAgICAgICAgICAgICBuID0gMDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKG4gPj0gbGVuKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAtMTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgayA9IE1hdGgubWF4KG4gPj0gMCA/IG4gOiBsZW4gLSBNYXRoLmFicyhuKSwgMCk7XG4gICAgICAgICAgICAgICAgd2hpbGUgKGsgPCBsZW4pIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGsgaW4gbyAmJiBvW2tdID09PSBzZWFyY2hFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBrKys7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiAtMTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgLyogbGlzdCBvZiByZWFsIGV2ZW50cyAqL1xuICAgICAgICB2YXIgaHRtbEV2ZW50cyA9IHtcbiAgICAgICAgICAgIC8qIDxib2R5PiBhbmQgPGZyYW1lc2V0PiBFdmVudHMgKi9cbiAgICAgICAgICAgIG9ubG9hZDogMSxcbiAgICAgICAgICAgIG9udW5sb2FkOiAxLFxuICAgICAgICAgICAgLyogRm9ybSBFdmVudHMgKi9cbiAgICAgICAgICAgIG9uYmx1cjogMSxcbiAgICAgICAgICAgIG9uY2hhbmdlOiAxLFxuICAgICAgICAgICAgb25mb2N1czogMSxcbiAgICAgICAgICAgIG9ucmVzZXQ6IDEsXG4gICAgICAgICAgICBvbnNlbGVjdDogMSxcbiAgICAgICAgICAgIG9uc3VibWl0OiAxLFxuICAgICAgICAgICAgLyogSW1hZ2UgRXZlbnRzICovXG4gICAgICAgICAgICBvbmFib3J0OiAxLFxuICAgICAgICAgICAgLyogS2V5Ym9hcmQgRXZlbnRzICovXG4gICAgICAgICAgICBvbmtleWRvd246IDEsXG4gICAgICAgICAgICBvbmtleXByZXNzOiAxLFxuICAgICAgICAgICAgb25rZXl1cDogMSxcbiAgICAgICAgICAgIC8qIE1vdXNlIEV2ZW50cyAqL1xuICAgICAgICAgICAgb25jbGljazogMSxcbiAgICAgICAgICAgIG9uZGJsY2xpY2s6IDEsXG4gICAgICAgICAgICBvbm1vdXNlZG93bjogMSxcbiAgICAgICAgICAgIG9ubW91c2Vtb3ZlOiAxLFxuICAgICAgICAgICAgb25tb3VzZW91dDogMSxcbiAgICAgICAgICAgIG9ubW91c2VvdmVyOiAxLFxuICAgICAgICAgICAgb25tb3VzZXVwOiAxXG4gICAgICAgIH07XG4gICAgICAgIHZhciBtYXBFdmVudHMgPSB7XG4gICAgICAgICAgICBvbnNjcm9sbDogd2luZG93XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTd29vc2ggcHJvdmlkZXMgYSBzZXQgb2YgZnVuY3Rpb25zIHRvIGltcGxlbWVudCBzY3JvbGwgYnkgZHJhZywgem9vbSBieSBtb3VzZXdoZWVsLFxuICAgICAgICAgKiBoYXNoIGxpbmtzIGluc2lkZSB0aGUgZG9jdW1lbnQgYW5kIG90aGVyIHNwZWNpYWwgc2Nyb2xsIHJlbGF0ZWQgcmVxdWlyZW1lbnRzLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAYXV0aG9yIFJvbWFuIEdydWJlciA8cDEwMjAzODlAeWFob28uY29tPlxuICAgICAgICAgKiBAdmVyc2lvbiAxLjBcbiAgICAgICAgICovXG4gICAgICAgIHZhciBTd29vc2ggPSAoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgZnVuY3Rpb24gU3dvb3NoKGNvbnRhaW5lciwgb3B0aW9ucykge1xuICAgICAgICAgICAgICAgIHRoaXMuY29udGFpbmVyID0gY29udGFpbmVyO1xuICAgICAgICAgICAgICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG4gICAgICAgICAgICAgICAgLyogQ1NTIHN0eWxlIGNsYXNzZXMgKi9cbiAgICAgICAgICAgICAgICB0aGlzLmNsYXNzSW5uZXIgPSAnc3ctaW5uZXInO1xuICAgICAgICAgICAgICAgIHRoaXMuY2xhc3NPdXRlciA9ICdzdy1vdXRlcic7XG4gICAgICAgICAgICAgICAgdGhpcy5jbGFzc0dyYWIgPSAnc3ctZ3JhYic7XG4gICAgICAgICAgICAgICAgdGhpcy5jbGFzc05vR3JhYiA9ICdzdy1ub2dyYWInO1xuICAgICAgICAgICAgICAgIHRoaXMuY2xhc3NHcmFiYmluZyA9ICdzdy1ncmFiYmluZyc7XG4gICAgICAgICAgICAgICAgdGhpcy5jbGFzc1VuaXF1ZSA9ICdzdy0nICsgTWF0aC5yYW5kb20oKS50b1N0cmluZygzNikuc3Vic3RyaW5nKDcpO1xuICAgICAgICAgICAgICAgIHRoaXMuY2xhc3NTY2FsZSA9ICdzdy1zY2FsZSc7XG4gICAgICAgICAgICAgICAgLyogYXJyYXkgaG9sZGluZyB0aGUgY3VzdG9tIGV2ZW50cyBtYXBwaW5nIGNhbGxiYWNrcyB0byBib3VuZCBjYWxsYmFja3MgKi9cbiAgICAgICAgICAgICAgICB0aGlzLmN1c3RvbUV2ZW50cyA9IFtdO1xuICAgICAgICAgICAgICAgIHRoaXMudHJpZ2dlcmVkID0ge1xuICAgICAgICAgICAgICAgICAgICBjb2xsaWRlTGVmdDogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIGNvbGxpZGVUb3A6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBjb2xsaWRlUmlnaHQ6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBjb2xsaWRlQm90dG9tOiBmYWxzZVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgLyogZmFkZU91dCAqL1xuICAgICAgICAgICAgICAgIHRoaXMudGltZW91dHMgPSBbXTtcbiAgICAgICAgICAgICAgICB0aGlzLnZ4ID0gW107XG4gICAgICAgICAgICAgICAgdGhpcy52eSA9IFtdO1xuICAgICAgICAgICAgICAgIHRoaXMuY29udGFpbmVyID0gY29udGFpbmVyO1xuICAgICAgICAgICAgICAgIC8qIHNldCBkZWZhdWx0IG9wdGlvbnMgKi9cbiAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMgPSB7XG4gICAgICAgICAgICAgICAgICAgIC8qIDEgbWVhbnMgZG8gbm90IGFsaWduIHRvIGEgZ3JpZCAqL1xuICAgICAgICAgICAgICAgICAgICBncmlkWDogMSxcbiAgICAgICAgICAgICAgICAgICAgZ3JpZFk6IDEsXG4gICAgICAgICAgICAgICAgICAgIC8qIHNob3dzIGEgZ3JpZCBhcyBhbiBvdmVybGF5IG92ZXIgdGhlIGVsZW1lbnQuIFdvcmtzIG9ubHkgaWYgdGhlIGJyb3dzZXIgc3VwcG9ydHNcbiAgICAgICAgICAgICAgICAgICAgICogQ1NTIEdlbmVyYXRlZCBjb250ZW50IGZvciBwc2V1ZG8tZWxlbWVudHNcbiAgICAgICAgICAgICAgICAgICAgICogQHNlZSBodHRwOi8vY2FuaXVzZS5jb20vI3NlYXJjaD0lM0FiZWZvcmUgKi9cbiAgICAgICAgICAgICAgICAgICAgZ3JpZFNob3c6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAvKiB3aGljaCBlZGdlIHNob3VsZCBiZSBlbGFzdGljICovXG4gICAgICAgICAgICAgICAgICAgIGVsYXN0aWNFZGdlczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGVmdDogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICByaWdodDogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICB0b3A6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgYm90dG9tOiBmYWxzZVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAvKiBhY3RpdmF0ZXMvZGVhY3RpdmF0ZXMgc2Nyb2xsaW5nIGJ5IGRyYWcgKi9cbiAgICAgICAgICAgICAgICAgICAgZHJhZ1Njcm9sbDogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgZHJhZ09wdGlvbnM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGV4Y2x1ZGU6IFsnaW5wdXQnLCAndGV4dGFyZWEnLCAnYScsICdidXR0b24nLCAnLnN3LWlnbm9yZScsICdzZWxlY3QnXSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG9ubHk6IFtdLFxuICAgICAgICAgICAgICAgICAgICAgICAgLyogYWN0aXZhdGVzIGEgc2Nyb2xsIGZhZGUgd2hlbiBzY3JvbGxpbmcgYnkgZHJhZyAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgZmFkZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIGZhZGU6IGJyYWtlIGFjY2VsZXJhdGlvbiBpbiBwaXhlbHMgcGVyIHNlY29uZCBwZXIgc2Vjb25kIChwL3PCsikgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIGJyYWtlU3BlZWQ6IDI1MDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBmYWRlOiBmcmFtZXMgcGVyIHNlY29uZCBvZiB0aGUgc3dvb3NoIGZhZGVvdXQgYW5pbWF0aW9uICg+PTI1IGxvb2tzIGxpa2UgbW90aW9uKSAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgZnBzOiAzMCxcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIGZhZGU6IHRoaXMgc3BlZWQgd2lsbCBuZXZlciBiZSBleGNlZWRlZCAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgbWF4U3BlZWQ6IDMwMDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBmYWRlOiBtaW5pbXVtIHNwZWVkIHdoaWNoIHRyaWdnZXJzIHRoZSBmYWRlICovXG4gICAgICAgICAgICAgICAgICAgICAgICBtaW5TcGVlZDogMzAwXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIC8qIGFjdGl2YXRlcy9kZWFjdGl2YXRlcyBzY3JvbGxpbmcgYnkgd2hlZWwuIElmIHRoZSBkcmVpY3Rpb24gaXMgdmVydGljYWwgYW5kIHRoZXJlIGFyZVxuICAgICAgICAgICAgICAgICAgICAgKiBzY3JvbGxiYXJzIHByZXNlbnQsIHN3b29zaCBsZXRzIGxlYXZlcyBzY3JvbGxpbmcgdG8gdGhlIGJyb3dzZXIuICovXG4gICAgICAgICAgICAgICAgICAgIHdoZWVsU2Nyb2xsOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICB3aGVlbE9wdGlvbnM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIGRpcmVjdGlvbiB0byBzY3JvbGwgd2hlbiB0aGUgbW91c2Ugd2hlZWwgaXMgdXNlZCAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgZGlyZWN0aW9uOiAndmVydGljYWwnLFxuICAgICAgICAgICAgICAgICAgICAgICAgLyogYW1vdW50IG9mIHBpeGVscyBmb3Igb25lIHNjcm9sbCBzdGVwICovXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGVwOiAxMTQsXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBzY3JvbGwgc21vb3RoIG9yIGluc3RhbnQgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIHNtb290aDogdHJ1ZVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAvKiBhY3RpdmF0ZXMvZGVhY3RpdmF0ZXMgem9vbWluZyBieSB3aGVlbC4gV29ya3Mgb25seSB3aXRoIGEgQ1NTMyAyRCBUcmFuc2Zvcm0gY2FwYWJsZSBicm93c2VyLlxuICAgICAgICAgICAgICAgICAgICAgKiBAc2VlIGh0dHA6Ly9jYW5pdXNlLmNvbS8jZmVhdD10cmFuc2Zvcm1zMmQgKi9cbiAgICAgICAgICAgICAgICAgICAgd2hlZWxab29tOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgem9vbU9wdGlvbnM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIHRoZSBtYXhpbXVtIHNjYWxlLCAwIG1lYW5zIG5vIG1heGltdW0gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIG1heFNjYWxlOiAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgLyogdGhlIG1pbmltdW0gc2NhbGUsIDAgbWVhbnMgbm8gbWluaW11bSAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgbWluU2NhbGU6IDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBvbmUgc3RlcCB3aGVuIHVzaW5nIHRoZSB3aGVlbCB0byB6b29tICovXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGVwOiAwLjEsXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBtb3VzZSB3aGVlbCBkaXJlY3Rpb24gdG8gem9vbSBsYXJnZXIgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIGRpcmVjdGlvbjogJ3VwJ1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAvKiBsZXQgc3dvb3NoIGhhbmRsZSBhbmNob3IgbGlua3MgdGFyZ2V0aW5nIHRvIGFuIGFuY2hvciBpbnNpZGUgb2YgdGhpcyBzd29vc2ggZWxlbWVudC5cbiAgICAgICAgICAgICAgICAgICAgICogdGhlIGVsZW1lbnQgb3V0c2lkZSAobWF5YmUgdGhlIGJvZHkpIGhhbmRsZXMgYW5jaG9ycyB0b28uIElmIHlvdSB3YW50IHRvIHByZXZlbnQgdGhpcyxcbiAgICAgICAgICAgICAgICAgICAgICogYWRkIHRvIGJvZHkgYXMgc3dvb3NoIGVsZW1lbnQgdG9vLiAqL1xuICAgICAgICAgICAgICAgICAgICBoYW5kbGVBbmNob3JzOiB0cnVlXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAvKiBtZXJnZSB0aGUgZGVmYXVsdCBvcHRpb24gb2JqZWN0cyB3aXRoIHRoZSBwcm92aWRlZCBvbmUgKi9cbiAgICAgICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gb3B0aW9ucykge1xuICAgICAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnNba2V5XSA9PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIG9rZXkgaW4gb3B0aW9uc1trZXldKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvcHRpb25zW2tleV0uaGFzT3duUHJvcGVydHkob2tleSkpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnNba2V5XVtva2V5XSA9IG9wdGlvbnNba2V5XVtva2V5XTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnNba2V5XSA9IG9wdGlvbnNba2V5XTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLmluaXQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogSW5pdGlhbGl6ZSBET00gbWFuaXB1bGF0aW9ucyBhbmQgZXZlbnQgaGFuZGxlcnNcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHt2b2lkfVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBTd29vc2gucHJvdG90eXBlLmluaXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgICAgICAgICB0aGlzLmlzQm9keSA9IHRoaXMuY29udGFpbmVyLnRhZ05hbWUgPT0gXCJCT0RZXCIgPyB0cnVlIDogZmFsc2U7XG4gICAgICAgICAgICAgICAgLyogQ2hyb21lIHNvbHV0aW9uIHRvIHNjcm9sbCB0aGUgYm9keSBpcyBub3QgcmVhbGx5IHZpYWJsZSwgc28gd2UgY3JlYXRlIGEgZmFrZSBib2R5XG4gICAgICAgICAgICAgICAgICogZGl2IGVsZW1lbnQgdG8gc2Nyb2xsIG9uICovXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuaXNCb2R5ID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBwc2V1ZG9Cb2R5ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgICAgICAgICAgICAgICAgcHNldWRvQm9keS5jbGFzc05hbWUgKz0gXCIgc3ctZmFrZWJvZHkgXCI7XG4gICAgICAgICAgICAgICAgICAgIHBzZXVkb0JvZHkuc3R5bGUuY3NzVGV4dCA9IGRvY3VtZW50LmJvZHkuc3R5bGUuY3NzVGV4dDtcbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKHRoaXMuY29udGFpbmVyLmNoaWxkTm9kZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHNldWRvQm9keS5hcHBlbmRDaGlsZCh0aGlzLmNvbnRhaW5lci5jaGlsZE5vZGVzWzBdKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0aGlzLmNvbnRhaW5lci5hcHBlbmRDaGlsZChwc2V1ZG9Cb2R5KTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jb250YWluZXIgPSBwc2V1ZG9Cb2R5O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLmNvbnRhaW5lci5jbGFzc05hbWUgKz0gXCIgXCIgKyB0aGlzLmNsYXNzT3V0ZXIgKyBcIiBcIjtcbiAgICAgICAgICAgICAgICAvL3RoaXMuc2Nyb2xsRWxlbWVudCA9IHRoaXMuaXNCb2R5ID8gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50IDogdGhpcy5jb250YWluZXI7XG4gICAgICAgICAgICAgICAgdGhpcy5zY3JvbGxFbGVtZW50ID0gdGhpcy5jb250YWluZXI7XG4gICAgICAgICAgICAgICAgdmFyIHggPSB0aGlzLmdldFNjcm9sbExlZnQoKTtcbiAgICAgICAgICAgICAgICB2YXIgeSA9IHRoaXMuZ2V0U2Nyb2xsVG9wKCk7XG4gICAgICAgICAgICAgICAgLyogY3JlYXRlIGlubmVyIGRpdiBlbGVtZW50IGFuZCBhcHBlbmQgaXQgdG8gdGhlIGNvbnRhaW5lciB3aXRoIGl0cyBjb250ZW50cyBpbiBpdCAqL1xuICAgICAgICAgICAgICAgIHRoaXMuaW5uZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgICAgICAgICAgIC8vdmFyIHVuaXF1ZUNsYXNzID0gdGhpcy5jbGFzc0lubmVyICsgXCItXCIgKyBNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zdWJzdHJpbmcoNyk7XG4gICAgICAgICAgICAgICAgdGhpcy5pbm5lci5jbGFzc05hbWUgKz0gXCIgXCIgKyB0aGlzLmNsYXNzSW5uZXIgKyBcIiBcIiArIHRoaXMuY2xhc3NVbmlxdWUgKyBcIiBcIjtcbiAgICAgICAgICAgICAgICB0aGlzLnNjYWxlRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICAgICAgICAgICAgdGhpcy5zY2FsZUVsZW1lbnQuY2xhc3NOYW1lICs9IFwiIFwiICsgdGhpcy5jbGFzc1NjYWxlICsgXCIgXCI7XG4gICAgICAgICAgICAgICAgdGhpcy5zY2FsZUVsZW1lbnQuYXBwZW5kQ2hpbGQodGhpcy5pbm5lcik7XG4gICAgICAgICAgICAgICAgLyogbW92ZSBhbGwgY2hpbGROb2RlcyB0byB0aGUgbmV3IGlubmVyIGVsZW1lbnQgKi9cbiAgICAgICAgICAgICAgICB3aGlsZSAodGhpcy5jb250YWluZXIuY2hpbGROb2Rlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaW5uZXIuYXBwZW5kQ2hpbGQodGhpcy5jb250YWluZXIuY2hpbGROb2Rlc1swXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuY29udGFpbmVyLmFwcGVuZENoaWxkKHRoaXMuc2NhbGVFbGVtZW50KTtcbiAgICAgICAgICAgICAgICB0aGlzLmlubmVyLnN0eWxlLm1pbldpZHRoID0gKHRoaXMuY29udGFpbmVyLnNjcm9sbFdpZHRoIC0gdGhpcy5nZXRCb3JkZXJXaWR0aCh0aGlzLmNvbnRhaW5lcikpICsgJ3B4JztcbiAgICAgICAgICAgICAgICB0aGlzLmlubmVyLnN0eWxlLm1pbkhlaWdodCA9ICh0aGlzLmNvbnRhaW5lci5zY3JvbGxIZWlnaHQgLSB0aGlzLmdldEJvcmRlcldpZHRoKHRoaXMuY29udGFpbmVyKSkgKyAncHgnO1xuICAgICAgICAgICAgICAgIHRoaXMuc2NhbGVFbGVtZW50LnN0eWxlLm1pbldpZHRoID0gdGhpcy5pbm5lci5zdHlsZS5taW5XaWR0aDtcbiAgICAgICAgICAgICAgICB0aGlzLnNjYWxlRWxlbWVudC5zdHlsZS5taW5IZWlnaHQgPSB0aGlzLmlubmVyLnN0eWxlLm1pbkhlaWdodDtcbiAgICAgICAgICAgICAgICB0aGlzLnNjYWxlRWxlbWVudC5zdHlsZS5vdmVyZmxvdyA9ICdoaWRkZW4nO1xuICAgICAgICAgICAgICAgIC8qIHNob3cgdGhlIGdyaWQgb25seSBpZiBhdCBsZWFzdCBvbmUgb2YgdGhlIGdyaWQgdmFsdWVzIGlzIG5vdCAxICovXG4gICAgICAgICAgICAgICAgaWYgKCh0aGlzLm9wdGlvbnMuZ3JpZFggIT0gMSB8fCB0aGlzLm9wdGlvbnMuZ3JpZFkgIT0gMSkgJiYgdGhpcy5vcHRpb25zLmdyaWRTaG93KSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBiZ2kgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zLmdyaWRYICE9IDEgPyBiZ2kucHVzaCgnbGluZWFyLWdyYWRpZW50KHRvIHJpZ2h0LCBncmV5IDFweCwgdHJhbnNwYXJlbnQgMXB4KScpIDogbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zLmdyaWRZICE9IDEgPyBiZ2kucHVzaCgnbGluZWFyLWdyYWRpZW50KHRvIGJvdHRvbSwgZ3JleSAxcHgsIHRyYW5zcGFyZW50IDFweCknKSA6IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkQmVmb3JlQ1NTKHRoaXMuY2xhc3NVbmlxdWUsICd3aWR0aCcsIHRoaXMuaW5uZXIuc3R5bGUubWluV2lkdGgpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZEJlZm9yZUNTUyh0aGlzLmNsYXNzVW5pcXVlLCAnaGVpZ2h0JywgdGhpcy5pbm5lci5zdHlsZS5taW5IZWlnaHQpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZEJlZm9yZUNTUyh0aGlzLmNsYXNzVW5pcXVlLCAnbGVmdCcsICctJyArIHRoaXMuZ2V0U3R5bGUodGhpcy5jb250YWluZXIsICdwYWRkaW5nTGVmdCcpKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGRCZWZvcmVDU1ModGhpcy5jbGFzc1VuaXF1ZSwgJ3RvcCcsICctJyArIHRoaXMuZ2V0U3R5bGUodGhpcy5jb250YWluZXIsICdwYWRkaW5nVG9wJykpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZEJlZm9yZUNTUyh0aGlzLmNsYXNzVW5pcXVlLCAnYmFja2dyb3VuZC1zaXplJywgKHRoaXMub3B0aW9ucy5ncmlkWCAhPSAxID8gdGhpcy5vcHRpb25zLmdyaWRYICsgJ3B4ICcgOiAnYXV0byAnKSArICh0aGlzLm9wdGlvbnMuZ3JpZFkgIT0gMSA/IHRoaXMub3B0aW9ucy5ncmlkWSArICdweCcgOiAnYXV0bycpKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGRCZWZvcmVDU1ModGhpcy5jbGFzc1VuaXF1ZSwgJ2JhY2tncm91bmQtaW1hZ2UnLCBiZ2kuam9pbignLCAnKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMub2xkQ2xpZW50V2lkdGggPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50V2lkdGg7XG4gICAgICAgICAgICAgICAgdGhpcy5vbGRDbGllbnRIZWlnaHQgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50SGVpZ2h0O1xuICAgICAgICAgICAgICAgIC8qIGp1c3QgY2FsbCB0aGUgZnVuY3Rpb24sIHRvIHRyaWdnZXIgcG9zc2libGUgZXZlbnRzICovXG4gICAgICAgICAgICAgICAgdGhpcy5vblNjcm9sbCgpO1xuICAgICAgICAgICAgICAgIC8qIHNjcm9sbCB0byB0aGUgaW5pdGlhbCBwb3NpdGlvbiAqL1xuICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsVG8oeCwgeSk7XG4gICAgICAgICAgICAgICAgLyogRXZlbnQgaGFuZGxlciByZWdpc3RyYXRpb24gc3RhcnQgaGVyZSAqL1xuICAgICAgICAgICAgICAgIC8qIFRPRE86IG5vdCAyIGRpZmZlcmVudCBldmVudCBoYW5kbGVycyByZWdpc3RyYXRpb25zIC0+IGRvIGl0IGluIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcigpICovXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy53aGVlbFNjcm9sbCA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5tb3VzZVNjcm9sbEhhbmRsZXIgPSBmdW5jdGlvbiAoZSkgeyByZXR1cm4gX3RoaXMuZGlzYWJsZU1vdXNlU2Nyb2xsKGUpOyB9O1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNjcm9sbEVsZW1lbnQub25tb3VzZXdoZWVsID0gdGhpcy5tb3VzZVNjcm9sbEhhbmRsZXI7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcih0aGlzLnNjcm9sbEVsZW1lbnQsICd3aGVlbCcsIHRoaXMubW91c2VTY3JvbGxIYW5kbGVyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAodGhpcy5vcHRpb25zLndoZWVsU2Nyb2xsID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubW91c2VTY3JvbGxIYW5kbGVyID0gZnVuY3Rpb24gKGUpIHsgcmV0dXJuIF90aGlzLmFjdGl2ZU1vdXNlU2Nyb2xsKGUpOyB9O1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNjcm9sbEVsZW1lbnQub25tb3VzZXdoZWVsID0gdGhpcy5tb3VzZVNjcm9sbEhhbmRsZXI7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcih0aGlzLnNjcm9sbEVsZW1lbnQsICd3aGVlbCcsIHRoaXMubW91c2VTY3JvbGxIYW5kbGVyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLyogVE9ETzogbmVlZGVkLCB3aGVuIGdyaWRTaG93IGlzIHRydWUgKi9cbiAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMuZ3JpZFNob3cgPyB0aGlzLnNjYWxlVG8oMSkgOiBudWxsO1xuICAgICAgICAgICAgICAgIC8qIHdoZWVsem9vbSAqL1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMud2hlZWxab29tID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubW91c2Vab29tSGFuZGxlciA9IGZ1bmN0aW9uIChlKSB7IHJldHVybiBfdGhpcy5hY3RpdmVNb3VzZVpvb20oZSk7IH07XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcih0aGlzLnNjcm9sbEVsZW1lbnQsICd3aGVlbCcsIHRoaXMubW91c2Vab29tSGFuZGxlcik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8qIHNjcm9sbGhhbmRsZXIgKi9cbiAgICAgICAgICAgICAgICB0aGlzLnNjcm9sbEhhbmRsZXIgPSBmdW5jdGlvbiAoZSkgeyByZXR1cm4gX3RoaXMub25TY3JvbGwoZSk7IH07XG4gICAgICAgICAgICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKHRoaXMuY29udGFpbmVyLCAnc2Nyb2xsJywgdGhpcy5zY3JvbGxIYW5kbGVyKTtcbiAgICAgICAgICAgICAgICAvKiBpZiB0aGUgc2Nyb2xsIGVsZW1lbnQgaXMgYm9keSwgYWRqdXN0IHRoZSBpbm5lciBkaXYgd2hlbiByZXNpemluZyAqL1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmlzQm9keSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnJlc2l6ZUhhbmRsZXIgPSBmdW5jdGlvbiAoZSkgeyByZXR1cm4gX3RoaXMub25SZXNpemUoZSk7IH07IC8vVE9ETzogc2FtZSBhcyBhYm92ZSBpbiB0aGUgd2hlZWwgaGFuZGxlclxuICAgICAgICAgICAgICAgICAgICB3aW5kb3cub25yZXNpemUgPSB0aGlzLnJlc2l6ZUhhbmRsZXI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8qIGlmIGRyYWdzY3JvbGwgaXMgYWN0aXZhdGVkLCByZWdpc3RlciBtb3VzZWRvd24gZXZlbnQgKi9cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLmRyYWdTY3JvbGwgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pbm5lci5jbGFzc05hbWUgKz0gXCIgXCIgKyB0aGlzLmNsYXNzR3JhYiArIFwiIFwiO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm1vdXNlRG93bkhhbmRsZXIgPSBmdW5jdGlvbiAoZSkgeyByZXR1cm4gX3RoaXMubW91c2VEb3duKGUpOyB9O1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIodGhpcy5pbm5lciwgJ21vdXNlZG93bicsIHRoaXMubW91c2VEb3duSGFuZGxlcik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmNvbnRhaW5lci5jbGFzc05hbWUgKz0gXCIgXCIgKyB0aGlzLmNsYXNzTm9HcmFiICsgXCIgXCI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMuaGFuZGxlQW5jaG9ycyA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgbGlua3MgPSB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yQWxsKFwiYVtocmVmXj0nIyddXCIpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmhhc2hDaGFuZ2VDbGlja0hhbmRsZXIgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHRhcmdldCA9IGUgPyBlLnRhcmdldCA6IHdpbmRvdy5ldmVudC5zcmNFbGVtZW50O1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB0YXJnZXQgIT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBwdXNoU3RhdGUgY2hhbmdlcyB0aGUgaGFzaCB3aXRob3V0IHRyaWdnZXJpbmcgaGFzaGNoYW5nZSAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhpc3RvcnkucHVzaFN0YXRlKHt9LCAnJywgdGFyZ2V0LmhyZWYpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIHdlIGRvbid0IHdhbnQgdG8gdHJpZ2dlciBoYXNoY2hhbmdlLCBzbyBwcmV2ZW50IGRlZmF1bHQgYmVoYXZpb3Igd2hlbiBjbGlja2luZyBvbiBhbmNob3IgbGlua3MgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0ID8gZS5wcmV2ZW50RGVmYXVsdCgpIDogKGUucmV0dXJuVmFsdWUgPSBmYWxzZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAvKiB0cmlnZ2VyIGEgY3VzdG9tIGhhc2hjaGFuZ2UgZXZlbnQsIGJlY2F1c2UgcHVzaFN0YXRlIHByZXZlbnRzIHRoZSByZWFsIGhhc2hjaGFuZ2UgZXZlbnQgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIF90aGlzLnRyaWdnZXJFdmVudCh3aW5kb3csICdteWhhc2hjaGFuZ2UnKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgLyogbG9vcCB0cm91Z2ggYWxsIGFuY2hvciBsaW5rcyBpbiB0aGUgZWxlbWVudCBhbmQgZGlzYWJsZSB0aGVtIHRvIHByZXZlbnQgdGhlXG4gICAgICAgICAgICAgICAgICAgICAqIGJyb3dzZXIgZnJvbSBzY3JvbGxpbmcgYmVjYXVzZSBvZiB0aGUgY2hhbmdpbmcgaGFzaCB2YWx1ZS4gSW5zdGVhZCB0aGUgb3duXG4gICAgICAgICAgICAgICAgICAgICAqIGV2ZW50IG15aGFzaGNoYW5nZSBzaG91bGQgaGFuZGxlIHBhZ2UgYW5kIGVsZW1lbnQgc2Nyb2xsaW5nICovXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGlua3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcihsaW5rc1tpXSwgJ2NsaWNrJywgdGhpcy5oYXNoQ2hhbmdlQ2xpY2tIYW5kbGVyLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5oYXNoQ2hhbmdlSGFuZGxlciA9IGZ1bmN0aW9uIChlKSB7IHJldHVybiBfdGhpcy5vbkhhc2hDaGFuZ2UoZSk7IH07XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcih3aW5kb3csICdteWhhc2hjaGFuZ2UnLCB0aGlzLmhhc2hDaGFuZ2VIYW5kbGVyKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKHdpbmRvdywgJ2hhc2hjaGFuZ2UnLCB0aGlzLmhhc2hDaGFuZ2VIYW5kbGVyKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vbkhhc2hDaGFuZ2UoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBSZWluaXRpYWxpemUgdGhlIHN3b29zaCBlbGVtZW50XG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQHJldHVybiB7U3dvb3NofSAtIFRoZSBTd29vc2ggb2JqZWN0IGluc3RhbmNlXG4gICAgICAgICAgICAgKiBAVE9ETzogcHJlc2VydmUgc2Nyb2xsIHBvc2l0aW9uIGluIGluaXQoKVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBTd29vc2gucHJvdG90eXBlLnJlaW5pdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmRlc3Ryb3koKTtcbiAgICAgICAgICAgICAgICB0aGlzLmNsYXNzVW5pcXVlID0gJ3N3LScgKyBNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zdWJzdHJpbmcoNyk7XG4gICAgICAgICAgICAgICAgdGhpcy5pbml0KCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLyogQFRPRE86IFNjcm9sbFdpZHRoIGFuZCBDbGllbnRXaWR0aCBTY3JvbGxIZWlnaHQgQ2xpZW50SGVpZ2h0ICovXG4gICAgICAgICAgICBTd29vc2gucHJvdG90eXBlLmdldFNjcm9sbExlZnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuc2Nyb2xsRWxlbWVudC5zY3JvbGxMZWZ0O1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIFN3b29zaC5wcm90b3R5cGUuc2V0U2Nyb2xsTGVmdCA9IGZ1bmN0aW9uIChsZWZ0KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zY3JvbGxFbGVtZW50LnNjcm9sbExlZnQgPSBsZWZ0O1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIFN3b29zaC5wcm90b3R5cGUuZ2V0U2Nyb2xsVG9wID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnNjcm9sbEVsZW1lbnQuc2Nyb2xsVG9wO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIFN3b29zaC5wcm90b3R5cGUuc2V0U2Nyb2xsVG9wID0gZnVuY3Rpb24gKHRvcCkge1xuICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsRWxlbWVudC5zY3JvbGxUb3AgPSB0b3A7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBIYW5kbGUgaGFzaGNoYW5nZXMgd2l0aCBvd24gc2Nyb2xsIGZ1bmN0aW9uXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQHBhcmFtIHtFdmVudH0gZSAtIHRoZSBoYXNoY2hhbmdlIG9yIG15aGFzaGNoYW5nZSBldmVudCwgb3Igbm90aGluZ1xuICAgICAgICAgICAgICogQHJldHVybiB7dm9pZH1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgU3dvb3NoLnByb3RvdHlwZS5vbkhhc2hDaGFuZ2UgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgIGlmIChlID09PSB2b2lkIDApIHsgZSA9IG51bGw7IH1cbiAgICAgICAgICAgICAgICB2YXIgaGFzaCA9IHdpbmRvdy5sb2NhdGlvbi5oYXNoLnN1YnN0cigxKTtcbiAgICAgICAgICAgICAgICBpZiAoaGFzaCAhPSAnJykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgYW5jaG9ycyA9IHRoaXMuY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3JBbGwoJyMnICsgaGFzaCk7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYW5jaG9ycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGVsZW1lbnQgPSBhbmNob3JzW2ldO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGNvbnRhaW5lciA9IGFuY2hvcnNbaV07XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBmaW5kIHRoZSBuZXh0IHBhcmVudCB3aGljaCBpcyBhIGNvbnRhaW5lciBlbGVtZW50XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgb3V0ZXJSZSA9IG5ldyBSZWdFeHAoXCIgXCIgKyB0aGlzLmNsYXNzT3V0ZXIgKyBcIiBcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbmV4dENvbnRhaW5lciA9IGVsZW1lbnQ7XG4gICAgICAgICAgICAgICAgICAgICAgICB3aGlsZSAoY29udGFpbmVyICYmIGNvbnRhaW5lci5wYXJlbnRFbGVtZW50ICYmIHRoaXMuY29udGFpbmVyICE9IGNvbnRhaW5lcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjb250YWluZXIuY2xhc3NOYW1lLm1hdGNoKG91dGVyUmUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5leHRDb250YWluZXIgPSBjb250YWluZXI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRhaW5lciA9IGNvbnRhaW5lci5wYXJlbnRFbGVtZW50O1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGUgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlLnR5cGUgPT0gJ2hhc2hjaGFuZ2UnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIHNjcm9sbGluZyBpbnN0YW50bHkgYmFjayB0byBvcmlnaW4sIGJlZm9yZSBkbyB0aGUgYW5pbWF0ZWQgc2Nyb2xsICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsVG8odGhpcy5vcmlnaW5TY3JvbGxMZWZ0LCB0aGlzLm9yaWdpblNjcm9sbFRvcCwgZmFsc2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsVG9FbGVtZW50KG5leHRDb250YWluZXIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogU2Nyb2xsIHRvIGFuIGVsZW1lbnQgaW4gdGhlIERPTVxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsZW1lbnQgLSB0aGUgSFRNTEVsZW1lbnQgdG8gc2Nyb2xsIHRvXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIFN3b29zaC5wcm90b3R5cGUuc2Nyb2xsVG9FbGVtZW50ID0gZnVuY3Rpb24gKGVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAvKiBnZXQgcmVsYXRpdmUgY29vcmRzIGZyb20gdGhlIGFuY2hvciBlbGVtZW50ICovXG4gICAgICAgICAgICAgICAgdmFyIHggPSAoZWxlbWVudC5vZmZzZXRMZWZ0IC0gdGhpcy5jb250YWluZXIub2Zmc2V0TGVmdCkgKiB0aGlzLmdldFNjYWxlKCk7XG4gICAgICAgICAgICAgICAgdmFyIHkgPSAoZWxlbWVudC5vZmZzZXRUb3AgLSB0aGlzLmNvbnRhaW5lci5vZmZzZXRUb3ApICogdGhpcy5nZXRTY2FsZSgpO1xuICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsVG8oeCwgeSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBXb3JrYXJvdW5kIHRvIG1hbmlwdWxhdGUgOjpiZWZvcmUgQ1NTIHN0eWxlcyB3aXRoIGphdmFzY3JpcHRcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gY3NzQ2xhc3MgLSB0aGUgQ1NTIGNsYXNzIG5hbWUgdG8gYWRkIDo6YmVmb3JlIHByb3BlcnRpZXNcbiAgICAgICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBjc3NQcm9wZXJ0eSAtIHRoZSBDU1MgcHJvcGVydHkgdG8gc2V0XG4gICAgICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gY3NzVmFsdWUgLSB0aGUgQ1NTIHZhbHVlIHRvIHNldFxuICAgICAgICAgICAgICogQHJldHVybiB7dm9pZH1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgU3dvb3NoLnByb3RvdHlwZS5hZGRCZWZvcmVDU1MgPSBmdW5jdGlvbiAoY3NzQ2xhc3MsIGNzc1Byb3BlcnR5LCBjc3NWYWx1ZSkge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgZG9jdW1lbnQuc3R5bGVTaGVldHNbMF0uaW5zZXJ0UnVsZSA9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgIGRvY3VtZW50LnN0eWxlU2hlZXRzWzBdLmluc2VydFJ1bGUoJy4nICsgY3NzQ2xhc3MgKyAnOjpiZWZvcmUgeyAnICsgY3NzUHJvcGVydHkgKyAnOiAnICsgY3NzVmFsdWUgKyAnfScsIDApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmICh0eXBlb2YgZG9jdW1lbnQuc3R5bGVTaGVldHNbMF0uYWRkUnVsZSA9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgIGRvY3VtZW50LnN0eWxlU2hlZXRzWzBdLmFkZFJ1bGUoJy4nICsgY3NzQ2xhc3MgKyAnOjpiZWZvcmUnLCBjc3NQcm9wZXJ0eSArICc6ICcgKyBjc3NWYWx1ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogR2V0IGNvbXB1dGUgcGl4ZWwgbnVtYmVyIG9mIHRoZSB3aG9sZSB3aWR0aCBvZiBhbiBlbGVtZW50cyBib3JkZXJcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbCAtIHRoZSBIVE1MIGVsZW1lbnRcbiAgICAgICAgICAgICAqIEByZXR1cm4ge251bWJlcn0gLSB0aGUgYW1vdW50IG9mIHBpeGVsc1xuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBTd29vc2gucHJvdG90eXBlLmdldEJvcmRlcldpZHRoID0gZnVuY3Rpb24gKGVsKSB7XG4gICAgICAgICAgICAgICAgdmFyIGJsID0gdGhpcy5nZXRTdHlsZShlbCwgJ2JvcmRlckxlZnRXaWR0aCcpO1xuICAgICAgICAgICAgICAgIGJsID0gYmwgPT0gJ3RoaW4nID8gMSA6IGJsID09ICdtZWRpdW0nID8gMyA6IGJsID09ICd0aGljaycgPyA1IDogcGFyc2VJbnQoYmwsIDEwKSAhPSBOYU4gPyBwYXJzZUludChibCwgMTApIDogMDtcbiAgICAgICAgICAgICAgICB2YXIgYnIgPSB0aGlzLmdldFN0eWxlKGVsLCAnYm9yZGVyUmlnaHRXaWR0aCcpO1xuICAgICAgICAgICAgICAgIGJyID0gYnIgPT0gJ3RoaW4nID8gMSA6IGJyID09ICdtZWRpdW0nID8gMyA6IGJyID09ICd0aGljaycgPyA1IDogcGFyc2VJbnQoYnIsIDEwKSAhPSBOYU4gPyBwYXJzZUludChiciwgMTApIDogMDtcbiAgICAgICAgICAgICAgICB2YXIgcGwgPSB0aGlzLmdldFN0eWxlKGVsLCAncGFkZGluZ0xlZnQnKTtcbiAgICAgICAgICAgICAgICBwbCA9IHBsID09ICdhdXRvJyA/IDAgOiBwYXJzZUludChwbCwgMTApICE9IE5hTiA/IHBhcnNlSW50KHBsLCAxMCkgOiAwO1xuICAgICAgICAgICAgICAgIHZhciBwciA9IHRoaXMuZ2V0U3R5bGUoZWwsICdwYWRkaW5nUmlnaHQnKTtcbiAgICAgICAgICAgICAgICBwciA9IHByID09ICdhdXRvJyA/IDAgOiBwYXJzZUludChwciwgMTApICE9IE5hTiA/IHBhcnNlSW50KHByLCAxMCkgOiAwO1xuICAgICAgICAgICAgICAgIHZhciBtbCA9IHRoaXMuZ2V0U3R5bGUoZWwsICdtYXJnaW5MZWZ0Jyk7XG4gICAgICAgICAgICAgICAgbWwgPSBtbCA9PSAnYXV0bycgPyAwIDogcGFyc2VJbnQobWwsIDEwKSAhPSBOYU4gPyBwYXJzZUludChtbCwgMTApIDogMDtcbiAgICAgICAgICAgICAgICB2YXIgbXIgPSB0aGlzLmdldFN0eWxlKGVsLCAnbWFyZ2luUmlnaHQnKTtcbiAgICAgICAgICAgICAgICBtciA9IG1yID09ICdhdXRvJyA/IDAgOiBwYXJzZUludChtciwgMTApICE9IE5hTiA/IHBhcnNlSW50KG1yLCAxMCkgOiAwO1xuICAgICAgICAgICAgICAgIHJldHVybiAocGwgKyBwciArIGJsICsgYnIgKyBtbCArIG1yKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEdldCBjb21wdXRlIHBpeGVsIG51bWJlciBvZiB0aGUgd2hvbGUgaGVpZ2h0IG9mIGFuIGVsZW1lbnRzIGJvcmRlclxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsIC0gdGhlIEhUTUwgZWxlbWVudFxuICAgICAgICAgICAgICogQHJldHVybiB7bnVtYmVyfSAtIHRoZSBhbW91bnQgb2YgcGl4ZWxzXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIFN3b29zaC5wcm90b3R5cGUuZ2V0Qm9yZGVySGVpZ2h0ID0gZnVuY3Rpb24gKGVsKSB7XG4gICAgICAgICAgICAgICAgdmFyIGJ0ID0gdGhpcy5nZXRTdHlsZShlbCwgJ2JvcmRlclRvcFdpZHRoJyk7XG4gICAgICAgICAgICAgICAgYnQgPSBidCA9PSAndGhpbicgPyAxIDogYnQgPT0gJ21lZGl1bScgPyAzIDogYnQgPT0gJ3RoaWNrJyA/IDUgOiBwYXJzZUludChidCwgMTApICE9IE5hTiA/IHBhcnNlSW50KGJ0LCAxMCkgOiAwO1xuICAgICAgICAgICAgICAgIHZhciBiYiA9IHRoaXMuZ2V0U3R5bGUoZWwsICdib3JkZXJCb3R0b21XaWR0aCcpO1xuICAgICAgICAgICAgICAgIGJiID0gYmIgPT0gJ3RoaW4nID8gMSA6IGJiID09ICdtZWRpdW0nID8gMyA6IGJiID09ICd0aGljaycgPyA1IDogcGFyc2VJbnQoYmIsIDEwKSAhPSBOYU4gPyBwYXJzZUludChiYiwgMTApIDogMDtcbiAgICAgICAgICAgICAgICB2YXIgcHQgPSB0aGlzLmdldFN0eWxlKGVsLCAncGFkZGluZ1RvcCcpO1xuICAgICAgICAgICAgICAgIHB0ID0gcHQgPT0gJ2F1dG8nID8gMCA6IHBhcnNlSW50KHB0LCAxMCkgIT0gTmFOID8gcGFyc2VJbnQocHQsIDEwKSA6IDA7XG4gICAgICAgICAgICAgICAgdmFyIHBiID0gdGhpcy5nZXRTdHlsZShlbCwgJ3BhZGRpbmdCb3R0b20nKTtcbiAgICAgICAgICAgICAgICBwYiA9IHBiID09ICdhdXRvJyA/IDAgOiBwYXJzZUludChwYiwgMTApICE9IE5hTiA/IHBhcnNlSW50KHBiLCAxMCkgOiAwO1xuICAgICAgICAgICAgICAgIHZhciBtdCA9IHRoaXMuZ2V0U3R5bGUoZWwsICdtYXJnaW5Ub3AnKTtcbiAgICAgICAgICAgICAgICBtdCA9IG10ID09ICdhdXRvJyA/IDAgOiBwYXJzZUludChtdCwgMTApICE9IE5hTiA/IHBhcnNlSW50KG10LCAxMCkgOiAwO1xuICAgICAgICAgICAgICAgIHZhciBtYiA9IHRoaXMuZ2V0U3R5bGUoZWwsICdtYXJnaW5Cb3R0b20nKTtcbiAgICAgICAgICAgICAgICBtYiA9IG1iID09ICdhdXRvJyA/IDAgOiBwYXJzZUludChtYiwgMTApICE9IE5hTiA/IHBhcnNlSW50KG1iLCAxMCkgOiAwO1xuICAgICAgICAgICAgICAgIHJldHVybiAocHQgKyBwYiArIGJ0ICsgYmIgKyBtdCArIG1iKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIERpc2FibGVzIHRoZSBzY3JvbGwgd2hlZWwgb2YgdGhlIG1vdXNlXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQHBhcmFtIHtNb3VzZVdoZWVsRXZlbnR9IGUgLSB0aGUgbW91c2Ugd2hlZWwgZXZlbnRcbiAgICAgICAgICAgICAqIEByZXR1cm4ge3ZvaWR9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIFN3b29zaC5wcm90b3R5cGUuZGlzYWJsZU1vdXNlU2Nyb2xsID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5lbGVtZW50QmVoaW5kQ3Vyc29ySXNNZShlLmNsaWVudFgsIGUuY2xpZW50WSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jbGVhclRpbWVvdXRzKCk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZSA9IHdpbmRvdy5ldmVudDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0ID8gZS5wcmV2ZW50RGVmYXVsdCgpIDogKGUucmV0dXJuVmFsdWUgPSBmYWxzZSk7XG4gICAgICAgICAgICAgICAgICAgIGUucmV0dXJuVmFsdWUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBEZXRlcm1pbmUgd2hldGhlciBhbiBlbGVtZW50IGhhcyBhIHNjcm9sbGJhciBvciBub3RcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbGVtZW50IC0gdGhlIEhUTUxFbGVtZW50XG4gICAgICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gZGlyZWN0aW9uIC0gZGV0ZXJtaW5lIHRoZSB2ZXJ0aWNhbCBvciBob3Jpem9udGFsIHNjcm9sbGJhcj9cbiAgICAgICAgICAgICAqIEByZXR1cm4ge2Jvb2xlYW59IC0gd2hldGhlciB0aGUgZWxlbWVudCBoYXMgc2Nyb2xsYmFycyBvciBub3RcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgU3dvb3NoLnByb3RvdHlwZS5oYXNTY3JvbGxiYXIgPSBmdW5jdGlvbiAoZWxlbWVudCwgZGlyZWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgdmFyIGhhcyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIHZhciBvdmVyZmxvdyA9ICdvdmVyZmxvdyc7XG4gICAgICAgICAgICAgICAgaWYgKGRpcmVjdGlvbiA9PSAndmVydGljYWwnKSB7XG4gICAgICAgICAgICAgICAgICAgIG92ZXJmbG93ID0gJ292ZXJmbG93WSc7XG4gICAgICAgICAgICAgICAgICAgIGhhcyA9IGVsZW1lbnQuc2Nyb2xsSGVpZ2h0ID4gZWxlbWVudC5jbGllbnRIZWlnaHQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKGRpcmVjdGlvbiA9PSAnaG9yaXpvbnRhbCcpIHtcbiAgICAgICAgICAgICAgICAgICAgb3ZlcmZsb3cgPSAnb3ZlcmZsb3dYJztcbiAgICAgICAgICAgICAgICAgICAgaGFzID0gZWxlbWVudC5zY3JvbGxXaWR0aCA+IGVsZW1lbnQuY2xpZW50V2lkdGg7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIENoZWNrIHRoZSBvdmVyZmxvdyBhbmQgb3ZlcmZsb3dEaXJlY3Rpb24gcHJvcGVydGllcyBmb3IgXCJhdXRvXCIgYW5kIFwidmlzaWJsZVwiIHZhbHVlc1xuICAgICAgICAgICAgICAgIGhhcyA9IHRoaXMuZ2V0U3R5bGUodGhpcy5jb250YWluZXIsICdvdmVyZmxvdycpID09IFwidmlzaWJsZVwiXG4gICAgICAgICAgICAgICAgICAgIHx8IHRoaXMuZ2V0U3R5bGUodGhpcy5jb250YWluZXIsICdvdmVyZmxvd1knKSA9PSBcInZpc2libGVcIlxuICAgICAgICAgICAgICAgICAgICB8fCAoaGFzICYmIHRoaXMuZ2V0U3R5bGUodGhpcy5jb250YWluZXIsICdvdmVyZmxvdycpID09IFwiYXV0b1wiKVxuICAgICAgICAgICAgICAgICAgICB8fCAoaGFzICYmIHRoaXMuZ2V0U3R5bGUodGhpcy5jb250YWluZXIsICdvdmVyZmxvd1knKSA9PSBcImF1dG9cIik7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGhhcztcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEVuYWJsZXMgdGhlIHNjcm9sbCB3aGVlbCBvZiB0aGUgbW91c2UgdG8gc2Nyb2xsLCBzcGVjaWFsbHkgZm9yIGRpdnMgd2l0aG91ciBzY3JvbGxiYXJcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAcGFyYW0ge01vdXNlV2hlZWxFdmVudH0gZSAtIHRoZSBtb3VzZSB3aGVlbCBldmVudFxuICAgICAgICAgICAgICogQHJldHVybiB7dm9pZH1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgU3dvb3NoLnByb3RvdHlwZS5hY3RpdmVNb3VzZVNjcm9sbCA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFlKSB7XG4gICAgICAgICAgICAgICAgICAgIGUgPSB3aW5kb3cuZXZlbnQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmVsZW1lbnRCZWhpbmRDdXJzb3JJc01lKGUuY2xpZW50WCwgZS5jbGllbnRZKSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZGlyZWN0aW9uO1xuICAgICAgICAgICAgICAgICAgICBpZiAoXCJkZWx0YVlcIiBpbiBlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkaXJlY3Rpb24gPSBlLmRlbHRhWSA+IDAgPyAnZG93bicgOiAndXAnO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKFwid2hlZWxEZWx0YVwiIGluIGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpcmVjdGlvbiA9IGUud2hlZWxEZWx0YSA+IDAgPyAndXAnIDogJ2Rvd24nO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIC8qIHVzZSB0aGUgbm9ybWFsIHNjcm9sbCwgd2hlbiB0aGVyZSBhcmUgc2Nyb2xsYmFycyBhbmQgdGhlIGRpcmVjdGlvbiBpcyBcInZlcnRpY2FsXCIgKi9cbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy53aGVlbE9wdGlvbnMuZGlyZWN0aW9uID09ICd2ZXJ0aWNhbCcgJiYgdGhpcy5oYXNTY3JvbGxiYXIodGhpcy5zY3JvbGxFbGVtZW50LCB0aGlzLm9wdGlvbnMud2hlZWxPcHRpb25zLmRpcmVjdGlvbikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghKCh0aGlzLnRyaWdnZXJlZC5jb2xsaWRlQm90dG9tICYmIGRpcmVjdGlvbiA9PSAnZG93bicpIHx8ICh0aGlzLnRyaWdnZXJlZC5jb2xsaWRlVG9wICYmIGRpcmVjdGlvbiA9PSAndXAnKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNsZWFyVGltZW91dHMoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kaXNhYmxlTW91c2VTY3JvbGwoZSk7XG4gICAgICAgICAgICAgICAgICAgIHZhciB4ID0gdGhpcy5nZXRTY3JvbGxMZWZ0KCk7XG4gICAgICAgICAgICAgICAgICAgIHZhciB5ID0gdGhpcy5nZXRTY3JvbGxUb3AoKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy53aGVlbE9wdGlvbnMuZGlyZWN0aW9uID09ICdob3Jpem9udGFsJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgeCA9IHRoaXMuZ2V0U2Nyb2xsTGVmdCgpICsgKGRpcmVjdGlvbiA9PSAnZG93bicgPyB0aGlzLm9wdGlvbnMud2hlZWxPcHRpb25zLnN0ZXAgOiB0aGlzLm9wdGlvbnMud2hlZWxPcHRpb25zLnN0ZXAgKiAtMSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAodGhpcy5vcHRpb25zLndoZWVsT3B0aW9ucy5kaXJlY3Rpb24gPT0gJ3ZlcnRpY2FsJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgeSA9IHRoaXMuZ2V0U2Nyb2xsVG9wKCkgKyAoZGlyZWN0aW9uID09ICdkb3duJyA/IHRoaXMub3B0aW9ucy53aGVlbE9wdGlvbnMuc3RlcCA6IHRoaXMub3B0aW9ucy53aGVlbE9wdGlvbnMuc3RlcCAqIC0xKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0aGlzLnNjcm9sbFRvKHgsIHksIGZhbHNlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBFbmFibGVzIHRoZSBzY3JvbGwgd2hlZWwgb2YgdGhlIG1vdXNlIHRvIHpvb21cbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAcGFyYW0ge01vdXNlV2hlZWxFdmVudH0gZSAtIHRoZSBtb3VzZSB3aGVlbCBldmVudFxuICAgICAgICAgICAgICogQHJldHVybiB7dm9pZH1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgU3dvb3NoLnByb3RvdHlwZS5hY3RpdmVNb3VzZVpvb20gPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgIGlmICghZSkge1xuICAgICAgICAgICAgICAgICAgICBlID0gd2luZG93LmV2ZW50O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5lbGVtZW50QmVoaW5kQ3Vyc29ySXNNZShlLmNsaWVudFgsIGUuY2xpZW50WSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRpcmVjdGlvbjtcbiAgICAgICAgICAgICAgICAgICAgaWYgKFwiZGVsdGFZXCIgaW4gZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGlyZWN0aW9uID0gZS5kZWx0YVkgPiAwID8gJ2Rvd24nIDogJ3VwJztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChcIndoZWVsRGVsdGFcIiBpbiBlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkaXJlY3Rpb24gPSBlLndoZWVsRGVsdGEgPiAwID8gJ3VwJyA6ICdkb3duJztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoZGlyZWN0aW9uID09IHRoaXMub3B0aW9ucy56b29tT3B0aW9ucy5kaXJlY3Rpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzY2FsZSA9IHRoaXMuZ2V0U2NhbGUoKSAqICgxICsgdGhpcy5vcHRpb25zLnpvb21PcHRpb25zLnN0ZXApO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHNjYWxlID0gdGhpcy5nZXRTY2FsZSgpICogKDEgLSB0aGlzLm9wdGlvbnMuem9vbU9wdGlvbnMuc3RlcCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zY2FsZVRvKHNjYWxlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBDYWxjdWxhdGVzIHRoZSBzaXplIG9mIHRoZSB2ZXJ0aWNhbCBzY3JvbGxiYXIuXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWwgLSBUaGUgSFRNTEVsZW1lbW50XG4gICAgICAgICAgICAgKiBAcmV0dXJuIHtudW1iZXJ9IC0gdGhlIGFtb3VudCBvZiBwaXhlbHMgdXNlZCBieSB0aGUgdmVydGljYWwgc2Nyb2xsYmFyXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIFN3b29zaC5wcm90b3R5cGUuc2Nyb2xsYmFyV2lkdGggPSBmdW5jdGlvbiAoZWwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZWwub2Zmc2V0V2lkdGggLSBlbC5jbGllbnRXaWR0aCAtIHBhcnNlSW50KHRoaXMuZ2V0U3R5bGUoZWwsICdib3JkZXJMZWZ0V2lkdGgnKSkgLSBwYXJzZUludCh0aGlzLmdldFN0eWxlKGVsLCAnYm9yZGVyUmlnaHRXaWR0aCcpKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIENhbGN1bGF0ZXMgdGhlIHNpemUgb2YgdGhlIGhvcml6b250YWwgc2Nyb2xsYmFyLlxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsIC0gVGhlIEhUTUxFbGVtZW1udFxuICAgICAgICAgICAgICogQHJldHVybiB7bnVtYmVyfSAtIHRoZSBhbW91bnQgb2YgcGl4ZWxzIHVzZWQgYnkgdGhlIGhvcml6b250YWwgc2Nyb2xsYmFyXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIFN3b29zaC5wcm90b3R5cGUuc2Nyb2xsYmFySGVpZ2h0ID0gZnVuY3Rpb24gKGVsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGVsLm9mZnNldEhlaWdodCAtIGVsLmNsaWVudEhlaWdodCAtIHBhcnNlSW50KHRoaXMuZ2V0U3R5bGUoZWwsICdib3JkZXJUb3BXaWR0aCcpKSAtIHBhcnNlSW50KHRoaXMuZ2V0U3R5bGUoZWwsICdib3JkZXJCb3R0b21XaWR0aCcpKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFJldHJpZXZlcyB0aGUgY3VycmVudCBzY2FsZSB2YWx1ZSBvciAxIGlmIGl0IGlzIG5vdCBzZXQuXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQHJldHVybiB7bnVtYmVyfSAtIHRoZSBjdXJyZW50IHNjYWxlIHZhbHVlXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIFN3b29zaC5wcm90b3R5cGUuZ2V0U2NhbGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB0aGlzLmlubmVyLnN0eWxlLnRyYW5zZm9ybSAhPSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgciA9IHRoaXMuaW5uZXIuc3R5bGUudHJhbnNmb3JtLm1hdGNoKC9zY2FsZVxcKChbMC05LFxcLl0rKVxcKS8pIHx8IFtcIlwiXTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHBhcnNlRmxvYXQoclsxXSkgfHwgMTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIDE7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBTY2FsZXMgdGhlIGlubmVyIGVsZW1lbnQgYnkgYSByZWxhdGljZSB2YWx1ZSBiYXNlZCBvbiB0aGUgY3VycmVudCBzY2FsZSB2YWx1ZS5cbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0gcGVyY2VudCAtIHBlcmNlbnRhZ2Ugb2YgdGhlIGN1cnJlbnQgc2NhbGUgdmFsdWVcbiAgICAgICAgICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gaG9ub3VyTGltaXRzIC0gd2hldGhlciB0byBob25vdXIgbWF4U2NhbGUgYW5kIHRoZSBtaW5pbXVtIHdpZHRoIGFuZCBoZWlnaHRcbiAgICAgICAgICAgICAqIG9mIHRoZSBjb250YWluZXIgZWxlbWVudC5cbiAgICAgICAgICAgICAqIEByZXR1cm4ge3ZvaWR9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIFN3b29zaC5wcm90b3R5cGUuc2NhbGVCeSA9IGZ1bmN0aW9uIChwZXJjZW50LCBob25vdXJMaW1pdHMpIHtcbiAgICAgICAgICAgICAgICBpZiAoaG9ub3VyTGltaXRzID09PSB2b2lkIDApIHsgaG9ub3VyTGltaXRzID0gdHJ1ZTsgfVxuICAgICAgICAgICAgICAgIHZhciBzY2FsZSA9IHRoaXMuZ2V0U2NhbGUoKSAqIChwZXJjZW50IC8gMTAwKTtcbiAgICAgICAgICAgICAgICB0aGlzLnNjYWxlVG8oc2NhbGUsIGhvbm91ckxpbWl0cyk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBTY2FsZXMgdGhlIGlubmVyIGVsZW1lbnQgdG8gYW4gYWJzb2x1dGUgdmFsdWUuXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IHNjYWxlIC0gdGhlIHNjYWxlXG4gICAgICAgICAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IGhvbm91ckxpbWl0cyAtIHdoZXRoZXIgdG8gaG9ub3VyIG1heFNjYWxlIGFuZCB0aGUgbWluaW11bSB3aWR0aCBhbmQgaGVpZ2h0XG4gICAgICAgICAgICAgKiBvZiB0aGUgY29udGFpbmVyIGVsZW1lbnQuXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHt2b2lkfVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBTd29vc2gucHJvdG90eXBlLnNjYWxlVG8gPSBmdW5jdGlvbiAoc2NhbGUsIGhvbm91ckxpbWl0cykge1xuICAgICAgICAgICAgICAgIGlmIChob25vdXJMaW1pdHMgPT09IHZvaWQgMCkgeyBob25vdXJMaW1pdHMgPSB0cnVlOyB9XG4gICAgICAgICAgICAgICAgdmFyIHdpZHRoID0gKHBhcnNlRmxvYXQodGhpcy5pbm5lci5zdHlsZS5taW5XaWR0aCkgKiBzY2FsZSk7XG4gICAgICAgICAgICAgICAgdmFyIGhlaWdodCA9IChwYXJzZUZsb2F0KHRoaXMuaW5uZXIuc3R5bGUubWluSGVpZ2h0KSAqIHNjYWxlKTtcbiAgICAgICAgICAgICAgICAvKiBTY3JvbGxiYXJzIGhhdmUgd2lkdGggYW5kIGhlaWdodCB0b28gKi9cbiAgICAgICAgICAgICAgICB2YXIgbWluV2lkdGggPSB0aGlzLmNvbnRhaW5lci5jbGllbnRXaWR0aCArIHRoaXMuc2Nyb2xsYmFyV2lkdGgodGhpcy5jb250YWluZXIpO1xuICAgICAgICAgICAgICAgIHZhciBtaW5IZWlnaHQgPSB0aGlzLmNvbnRhaW5lci5jbGllbnRIZWlnaHQgKyB0aGlzLnNjcm9sbGJhckhlaWdodCh0aGlzLmNvbnRhaW5lcik7XG4gICAgICAgICAgICAgICAgaWYgKGhvbm91ckxpbWl0cykge1xuICAgICAgICAgICAgICAgICAgICAvKiBsb29wIGFzIGxvbmcgYXMgYWxsIGxpbWl0cyBhcmUgaG9ub3VyZWQgKi9cbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKChzY2FsZSA+IHRoaXMub3B0aW9ucy56b29tT3B0aW9ucy5tYXhTY2FsZSAmJiB0aGlzLm9wdGlvbnMuem9vbU9wdGlvbnMubWF4U2NhbGUgIT0gMClcbiAgICAgICAgICAgICAgICAgICAgICAgIHx8IChzY2FsZSA8IHRoaXMub3B0aW9ucy56b29tT3B0aW9ucy5taW5TY2FsZSAmJiB0aGlzLm9wdGlvbnMuem9vbU9wdGlvbnMubWluU2NhbGUgIT0gMClcbiAgICAgICAgICAgICAgICAgICAgICAgIHx8ICh3aWR0aCA8IHRoaXMuY29udGFpbmVyLmNsaWVudFdpZHRoICYmICF0aGlzLmlzQm9keSlcbiAgICAgICAgICAgICAgICAgICAgICAgIHx8IGhlaWdodCA8IHRoaXMuY29udGFpbmVyLmNsaWVudEhlaWdodCAmJiAhdGhpcy5pc0JvZHkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzY2FsZSA+IHRoaXMub3B0aW9ucy56b29tT3B0aW9ucy5tYXhTY2FsZSAmJiB0aGlzLm9wdGlvbnMuem9vbU9wdGlvbnMubWF4U2NhbGUgIT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjYWxlID0gdGhpcy5vcHRpb25zLnpvb21PcHRpb25zLm1heFNjYWxlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoID0gTWF0aC5mbG9vcihwYXJzZUludCh0aGlzLmlubmVyLnN0eWxlLm1pbldpZHRoKSAqIHNjYWxlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQgPSBNYXRoLmZsb29yKHBhcnNlSW50KHRoaXMuaW5uZXIuc3R5bGUubWluSGVpZ2h0KSAqIHNjYWxlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzY2FsZSA8IHRoaXMub3B0aW9ucy56b29tT3B0aW9ucy5taW5TY2FsZSAmJiB0aGlzLm9wdGlvbnMuem9vbU9wdGlvbnMubWluU2NhbGUgIT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjYWxlID0gdGhpcy5vcHRpb25zLnpvb21PcHRpb25zLm1pblNjYWxlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoID0gTWF0aC5mbG9vcihwYXJzZUludCh0aGlzLmlubmVyLnN0eWxlLm1pbldpZHRoKSAqIHNjYWxlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQgPSBNYXRoLmZsb29yKHBhcnNlSW50KHRoaXMuaW5uZXIuc3R5bGUubWluSGVpZ2h0KSAqIHNjYWxlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh3aWR0aCA8IG1pbldpZHRoICYmICF0aGlzLmlzQm9keSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjYWxlID0gc2NhbGUgLyB3aWR0aCAqIG1pbldpZHRoO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodCA9IE1hdGguZmxvb3IocGFyc2VJbnQodGhpcy5pbm5lci5zdHlsZS5taW5IZWlnaHQpICogc2NhbGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoID0gbWluV2lkdGg7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaGVpZ2h0IDwgbWluSGVpZ2h0ICYmICF0aGlzLmlzQm9keSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjYWxlID0gc2NhbGUgLyBoZWlnaHQgKiBtaW5IZWlnaHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGggPSBNYXRoLmZsb29yKHBhcnNlSW50KHRoaXMuaW5uZXIuc3R5bGUubWluV2lkdGgpICogc2NhbGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodCA9IG1pbkhlaWdodDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nKFwic2NhbGVUbygpOiBcIiwgc2NhbGUsIFwiIC0tLS0+IFwiLCB3aWR0aCwgXCIgeCBcIiwgaGVpZ2h0LCBcIiBvcmlnOiBcIiwgdGhpcy5jb250YWluZXIuY2xpZW50V2lkdGgsIFwiIHggXCIsIHRoaXMuY29udGFpbmVyLmNsaWVudEhlaWdodCwgXCIgcmVhbDogXCIsIG1pbldpZHRoLCBcIiB4IFwiLCBtaW5IZWlnaHQpO1xuICAgICAgICAgICAgICAgIHRoaXMuaW5uZXIuc3R5bGUudHJhbnNmb3JtID0gJ3RyYW5zbGF0ZSgwcHgsIDBweCkgc2NhbGUoJyArIHNjYWxlICsgJyknO1xuICAgICAgICAgICAgICAgIHRoaXMuc2NhbGVFbGVtZW50LnN0eWxlLm1pbldpZHRoID0gdGhpcy5zY2FsZUVsZW1lbnQuc3R5bGUud2lkdGggPSB3aWR0aCArICdweCc7XG4gICAgICAgICAgICAgICAgdGhpcy5zY2FsZUVsZW1lbnQuc3R5bGUubWluSGVpZ2h0ID0gdGhpcy5zY2FsZUVsZW1lbnQuc3R5bGUuaGVpZ2h0ID0gaGVpZ2h0ICsgJ3B4JztcbiAgICAgICAgICAgICAgICAvKiBUT0RPOiBoZXJlIHNjcm9sbFRvIGJhc2VkIG9uIHdoZXJlIHRoZSBtb3VzZSBjdXJzb3IgaXMgKi9cbiAgICAgICAgICAgICAgICAvL3RoaXMuc2Nyb2xsVG8oKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIERpc2FibGVzIHRoZSBzY3JvbGwgd2hlZWwgb2YgdGhlIG1vdXNlXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IHggLSB0aGUgeC1jb29yZGluYXRlc1xuICAgICAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IHkgLSB0aGUgeS1jb29yZGluYXRlc1xuICAgICAgICAgICAgICogQHJldHVybiB7Ym9vbGVhbn0gLSB3aGV0aGVyIHRoZSBuZWFyZXN0IHJlbGF0ZWQgcGFyZW50IGlubmVyIGVsZW1lbnQgaXMgdGhlIG9uZSBvZiB0aGlzIG9iamVjdCBpbnN0YW5jZVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBTd29vc2gucHJvdG90eXBlLmVsZW1lbnRCZWhpbmRDdXJzb3JJc01lID0gZnVuY3Rpb24gKHgsIHkpIHtcbiAgICAgICAgICAgICAgICB2YXIgZWxlbWVudEJlaGluZEN1cnNvciA9IGRvY3VtZW50LmVsZW1lbnRGcm9tUG9pbnQoeCwgeSk7XG4gICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICogSWYgdGhlIGVsZW1lbnQgZGlyZWN0bHkgYmVoaW5kIHRoZSBjdXJzb3IgaXMgYW4gb3V0ZXIgZWxlbWVudCB0aHJvdyBvdXQsIGJlY2F1c2Ugd2hlbiBjbGlja2luZyBvbiBhIHNjcm9sbGJhclxuICAgICAgICAgICAgICAgICAqIGZyb20gYSBkaXYsIGEgZHJhZyBvZiB0aGUgcGFyZW50IFN3b29zaCBlbGVtZW50IGlzIGluaXRpYXRlZC5cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICB2YXIgb3V0ZXJSZSA9IG5ldyBSZWdFeHAoXCIgXCIgKyB0aGlzLmNsYXNzT3V0ZXIgKyBcIiBcIik7XG4gICAgICAgICAgICAgICAgaWYgKGVsZW1lbnRCZWhpbmRDdXJzb3IuY2xhc3NOYW1lLm1hdGNoKG91dGVyUmUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLyogZmluZCB0aGUgbmV4dCBwYXJlbnQgd2hpY2ggaXMgYW4gaW5uZXIgZWxlbWVudCAqL1xuICAgICAgICAgICAgICAgIHZhciBpbm5lclJlID0gbmV3IFJlZ0V4cChcIiBcIiArIHRoaXMuY2xhc3NJbm5lciArIFwiIFwiKTtcbiAgICAgICAgICAgICAgICB3aGlsZSAoZWxlbWVudEJlaGluZEN1cnNvciAmJiAhZWxlbWVudEJlaGluZEN1cnNvci5jbGFzc05hbWUubWF0Y2goaW5uZXJSZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgZWxlbWVudEJlaGluZEN1cnNvciA9IGVsZW1lbnRCZWhpbmRDdXJzb3IucGFyZW50RWxlbWVudDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuaW5uZXIgPT0gZWxlbWVudEJlaGluZEN1cnNvcjtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBTd29vc2gucHJvdG90eXBlLmdldFRpbWVzdGFtcCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHdpbmRvdy5wZXJmb3JtYW5jZSA9PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgICAgICAgICBpZiAoXCJub3dcIiBpbiB3aW5kb3cucGVyZm9ybWFuY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB3aW5kb3cucGVyZm9ybWFuY2Uubm93KCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoXCJ3ZWJraXROb3dcIiBpbiB3aW5kb3cucGVyZm9ybWFuY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB3aW5kb3cucGVyZm9ybWFuY2Uud2Via2l0Tm93KCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogU2Nyb2xsIGhhbmRsZXIgdG8gdHJpZ2dlciB0aGUgY3VzdG9tIGV2ZW50c1xuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBwYXJhbSB7RXZlbnR9IGUgLSBUaGUgc2Nyb2xsIGV2ZW50IG9iamVjdCAoVE9ETzogbmVlZGVkPylcbiAgICAgICAgICAgICAqIEB0aHJvd3MgRXZlbnQgY29sbGlkZUxlZnRcbiAgICAgICAgICAgICAqIEB0aHJvd3MgRXZlbnQgY29sbGlkZVJpZ2h0XG4gICAgICAgICAgICAgKiBAdGhyb3dzIEV2ZW50IGNvbGxpZGVUb3BcbiAgICAgICAgICAgICAqIEB0aHJvd3MgRXZlbnQgY29sbGlkZUJvdHRvbVxuICAgICAgICAgICAgICogQHJldHVybiB7dm9pZH1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgU3dvb3NoLnByb3RvdHlwZS5vblNjcm9sbCA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgdmFyIHggPSB0aGlzLmdldFNjcm9sbExlZnQoKTtcbiAgICAgICAgICAgICAgICB2YXIgeSA9IHRoaXMuZ2V0U2Nyb2xsVG9wKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5zY3JvbGxNYXhMZWZ0ID0gKHRoaXMuc2Nyb2xsRWxlbWVudC5zY3JvbGxXaWR0aCAtIHRoaXMuc2Nyb2xsRWxlbWVudC5jbGllbnRXaWR0aCk7XG4gICAgICAgICAgICAgICAgdGhpcy5zY3JvbGxNYXhUb3AgPSAodGhpcy5zY3JvbGxFbGVtZW50LnNjcm9sbEhlaWdodCAtIHRoaXMuc2Nyb2xsRWxlbWVudC5jbGllbnRIZWlnaHQpO1xuICAgICAgICAgICAgICAgIC8vIHRoZSBjb2xsaWRlTGVmdCBldmVudFxuICAgICAgICAgICAgICAgIGlmICh4ID09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50cmlnZ2VyZWQuY29sbGlkZUxlZnQgPyBudWxsIDogdGhpcy50cmlnZ2VyRXZlbnQodGhpcy5pbm5lciwgJ2NvbGxpZGUubGVmdCcpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnRyaWdnZXJlZC5jb2xsaWRlTGVmdCA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnRyaWdnZXJlZC5jb2xsaWRlTGVmdCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyB0aGUgY29sbGlkZVRvcCBldmVudFxuICAgICAgICAgICAgICAgIGlmICh5ID09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50cmlnZ2VyZWQuY29sbGlkZVRvcCA/IG51bGwgOiB0aGlzLnRyaWdnZXJFdmVudCh0aGlzLmlubmVyLCAnY29sbGlkZS50b3AnKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50cmlnZ2VyZWQuY29sbGlkZVRvcCA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnRyaWdnZXJlZC5jb2xsaWRlVG9wID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIHRoZSBjb2xsaWRlUmlnaHQgZXZlbnRcbiAgICAgICAgICAgICAgICBpZiAoeCA9PSB0aGlzLnNjcm9sbE1heExlZnQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50cmlnZ2VyZWQuY29sbGlkZVJpZ2h0ID8gbnVsbCA6IHRoaXMudHJpZ2dlckV2ZW50KHRoaXMuaW5uZXIsICdjb2xsaWRlLnJpZ2h0Jyk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudHJpZ2dlcmVkLmNvbGxpZGVSaWdodCA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnRyaWdnZXJlZC5jb2xsaWRlUmlnaHQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gdGhlIGNvbGxpZGVCb3R0b20gZXZlbnRcbiAgICAgICAgICAgICAgICBpZiAoeSA9PSB0aGlzLnNjcm9sbE1heFRvcCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnRyaWdnZXJlZC5jb2xsaWRlQm90dG9tID8gbnVsbCA6IHRoaXMudHJpZ2dlckV2ZW50KHRoaXMuaW5uZXIsICdjb2xsaWRlLmJvdHRvbScpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnRyaWdnZXJlZC5jb2xsaWRlQm90dG9tID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudHJpZ2dlcmVkLmNvbGxpZGVCb3R0b20gPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiB3aW5kb3cgcmVzaXplIGhhbmRsZXIgdG8gcmVjYWxjdWxhdGUgdGhlIGlubmVyIGRpdiBtaW5XaWR0aCBhbmQgbWluSGVpZ2h0XG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQHBhcmFtIHtFdmVudH0gZSAtIFRoZSB3aW5kb3cgcmVzaXplIGV2ZW50IG9iamVjdCAoVE9ETzogbmVlZGVkPylcbiAgICAgICAgICAgICAqIEByZXR1cm4ge3ZvaWR9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIFN3b29zaC5wcm90b3R5cGUub25SZXNpemUgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgICAgICAgICAgdmFyIG9uUmVzaXplID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBfdGhpcy5pbm5lci5zdHlsZS5taW5XaWR0aCA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIF90aGlzLmlubmVyLnN0eWxlLm1pbkhlaWdodCA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIC8qIHRha2UgYXdheSB0aGUgbWFyZ2luIHZhbHVlcyBvZiB0aGUgYm9keSBlbGVtZW50ICovXG4gICAgICAgICAgICAgICAgICAgIHZhciB4RGVsdGEgPSBwYXJzZUludChfdGhpcy5nZXRTdHlsZShkb2N1bWVudC5ib2R5LCAnbWFyZ2luTGVmdCcpLCAxMCkgKyBwYXJzZUludChfdGhpcy5nZXRTdHlsZShkb2N1bWVudC5ib2R5LCAnbWFyZ2luUmlnaHQnKSwgMTApO1xuICAgICAgICAgICAgICAgICAgICB2YXIgeURlbHRhID0gcGFyc2VJbnQoX3RoaXMuZ2V0U3R5bGUoZG9jdW1lbnQuYm9keSwgJ21hcmdpblRvcCcpLCAxMCkgKyBwYXJzZUludChfdGhpcy5nZXRTdHlsZShkb2N1bWVudC5ib2R5LCAnbWFyZ2luQm90dG9tJyksIDEwKTtcbiAgICAgICAgICAgICAgICAgICAgLy9UT0RPOiB3aXRoIHRoaXMuZ2V0Qm9yZGVyV2lkdGgoKSBhbmQgdGhpcy5nZXRCb3JkZXJIZWlnaHQoKVxuICAgICAgICAgICAgICAgICAgICBfdGhpcy5pbm5lci5zdHlsZS5taW5XaWR0aCA9IChkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsV2lkdGggLSB4RGVsdGEpICsgJ3B4JztcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMuaW5uZXIuc3R5bGUubWluSGVpZ2h0ID0gKGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zY3JvbGxIZWlnaHQgLSB5RGVsdGEgLSAxMDApICsgJ3B4JzsgLy9UT0RPOiBXVEY/IHdoeSAtMTAwIGZvciBJRTg/XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBUcmlnZ2VyIHRoZSBmdW5jdGlvbiBvbmx5IHdoZW4gdGhlIGNsaWVudFdpZHRoIG9yIGNsaWVudEhlaWdodCByZWFsbHkgaGF2ZSBjaGFuZ2VkLlxuICAgICAgICAgICAgICAgICAqIElFOCByZXNpZGVzIGluIGFuIGluZmluaXR5IGxvb3AgYWx3YXlzIHRyaWdnZXJpbmcgdGhlIHJlc2l0ZSBldmVudCB3aGVuIGFsdGVyaW5nIGNzcy5cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5vbGRDbGllbnRXaWR0aCAhPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50V2lkdGggfHwgdGhpcy5vbGRDbGllbnRIZWlnaHQgIT0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudEhlaWdodCkge1xuICAgICAgICAgICAgICAgICAgICB3aW5kb3cuY2xlYXJUaW1lb3V0KHRoaXMucmVzaXplVGltZW91dCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVzaXplVGltZW91dCA9IHdpbmRvdy5zZXRUaW1lb3V0KG9uUmVzaXplLCAxMCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8qIHdyaXRlIGRvd24gdGhlIG9sZCBjbGllbnRXaWR0aCBhbmQgY2xpZW50SGVpZ2h0IGZvciB0aGUgYWJvdmUgY29tcGFyc2lvbiAqL1xuICAgICAgICAgICAgICAgIHRoaXMub2xkQ2xpZW50V2lkdGggPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50V2lkdGg7XG4gICAgICAgICAgICAgICAgdGhpcy5vbGRDbGllbnRIZWlnaHQgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50SGVpZ2h0O1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIFN3b29zaC5wcm90b3R5cGUuY2xlYXJUZXh0U2VsZWN0aW9uID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmICh3aW5kb3cuZ2V0U2VsZWN0aW9uKVxuICAgICAgICAgICAgICAgICAgICB3aW5kb3cuZ2V0U2VsZWN0aW9uKCkucmVtb3ZlQWxsUmFuZ2VzKCk7XG4gICAgICAgICAgICAgICAgaWYgKGRvY3VtZW50LnNlbGVjdGlvbilcbiAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQuc2VsZWN0aW9uLmVtcHR5KCk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBCcm93c2VyIGluZGVwZW5kZW50IGV2ZW50IHJlZ2lzdHJhdGlvblxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBwYXJhbSB7YW55fSBvYmogLSBUaGUgSFRNTEVsZW1lbnQgdG8gYXR0YWNoIHRoZSBldmVudCB0b1xuICAgICAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50IC0gVGhlIGV2ZW50IG5hbWUgd2l0aG91dCB0aGUgbGVhZGluZyBcIm9uXCJcbiAgICAgICAgICAgICAqIEBwYXJhbSB7KGU6IEV2ZW50KSA9PiB2b2lkfSBjYWxsYmFjayAtIEEgY2FsbGJhY2sgZnVuY3Rpb24gdG8gYXR0YWNoIHRvIHRoZSBldmVudFxuICAgICAgICAgICAgICogQHBhcmFtIHtib29sZWFufSBib3VuZCAtIHdoZXRoZXIgdG8gYmluZCB0aGUgY2FsbGJhY2sgdG8gdGhlIG9iamVjdCBpbnN0YW5jZSBvciBub3RcbiAgICAgICAgICAgICAqIEByZXR1cm4ge3ZvaWR9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIFN3b29zaC5wcm90b3R5cGUuYWRkRXZlbnRMaXN0ZW5lciA9IGZ1bmN0aW9uIChvYmosIGV2ZW50LCBjYWxsYmFjaywgYm91bmQpIHtcbiAgICAgICAgICAgICAgICBpZiAoYm91bmQgPT09IHZvaWQgMCkgeyBib3VuZCA9IHRydWU7IH1cbiAgICAgICAgICAgICAgICB2YXIgYm91bmRDYWxsYmFjayA9IGJvdW5kID8gY2FsbGJhY2suYmluZCh0aGlzKSA6IGNhbGxiYWNrO1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2Ygb2JqLmFkZEV2ZW50TGlzdGVuZXIgPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICBpZiAobWFwRXZlbnRzWydvbicgKyBldmVudF0gJiYgb2JqLnRhZ05hbWUgPT0gXCJCT0RZXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG9iaiA9IG1hcEV2ZW50c1snb24nICsgZXZlbnRdO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIG9iai5hZGRFdmVudExpc3RlbmVyKGV2ZW50LCBib3VuZENhbGxiYWNrKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAodHlwZW9mIG9iai5hdHRhY2hFdmVudCA9PSAnb2JqZWN0JyAmJiBodG1sRXZlbnRzWydvbicgKyBldmVudF0pIHtcbiAgICAgICAgICAgICAgICAgICAgb2JqLmF0dGFjaEV2ZW50KCdvbicgKyBldmVudCwgYm91bmRDYWxsYmFjayk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHR5cGVvZiBvYmouYXR0YWNoRXZlbnQgPT0gJ29iamVjdCcgJiYgbWFwRXZlbnRzWydvbicgKyBldmVudF0pIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9iai50YWdOYW1lID09IFwiQk9EWVwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcCA9ICdvbicgKyBldmVudDtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIGV4YW1wbGU6IHdpbmRvdy5vbnNjcm9sbCA9IGJvdW5kQ2FsbGJhY2sgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIG1hcEV2ZW50c1twXVtwXSA9IGJvdW5kQ2FsbGJhY2s7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBUT0RPOiBvYmoub25zY3JvbGwgPz8gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIG9iai5vbnNjcm9sbCA9IGJvdW5kQ2FsbGJhY2s7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAodHlwZW9mIG9iai5hdHRhY2hFdmVudCA9PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgICAgICAgICBvYmpbZXZlbnRdID0gMTtcbiAgICAgICAgICAgICAgICAgICAgYm91bmRDYWxsYmFjayA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBUT0RPOiBlIGlzIHRoZSBvbnByb3BlcnR5Y2hhbmdlIGV2ZW50IG5vdCBvbmUgb2YgdGhlIGN1c3RvbSBldmVudCBvYmplY3RzICovXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZS5wcm9wZXJ0eU5hbWUgPT0gZXZlbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgb2JqLmF0dGFjaEV2ZW50KCdvbnByb3BlcnR5Y2hhbmdlJywgYm91bmRDYWxsYmFjayk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBvYmpbJ29uJyArIGV2ZW50XSA9IGJvdW5kQ2FsbGJhY2s7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuY3VzdG9tRXZlbnRzW2V2ZW50XSA/IG51bGwgOiAodGhpcy5jdXN0b21FdmVudHNbZXZlbnRdID0gW10pO1xuICAgICAgICAgICAgICAgIHRoaXMuY3VzdG9tRXZlbnRzW2V2ZW50XS5wdXNoKFtjYWxsYmFjaywgYm91bmRDYWxsYmFja10pO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQnJvd3NlciBpbmRlcGVuZGVudCBldmVudCBkZXJlZ2lzdHJhdGlvblxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBwYXJhbSB7YW55fSBvYmogLSBUaGUgSFRNTEVsZW1lbnQgb3Igd2luZG93IHdob3NlIGV2ZW50IHNob3VsZCBiZSBkZXRhY2hlZFxuICAgICAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50IC0gVGhlIGV2ZW50IG5hbWUgd2l0aG91dCB0aGUgbGVhZGluZyBcIm9uXCJcbiAgICAgICAgICAgICAqIEBwYXJhbSB7KGU6IEV2ZW50KSA9PiB2b2lkfSBjYWxsYmFjayAtIFRoZSBjYWxsYmFjayBmdW5jdGlvbiB3aGVuIGF0dGFjaGVkXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHt2b2lkfVxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBUT0RPOiB1bnJlZ2lzdGVyaW5nIG9mIG1hcEV2ZW50c1xuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBTd29vc2gucHJvdG90eXBlLnJlbW92ZUV2ZW50TGlzdGVuZXIgPSBmdW5jdGlvbiAob2JqLCBldmVudCwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnQgaW4gdGhpcy5jdXN0b21FdmVudHMpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSBpbiB0aGlzLmN1c3RvbUV2ZW50c1tldmVudF0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIGlmIHRoZSBldmVudCB3YXMgZm91bmQgaW4gdGhlIGFycmF5IGJ5IGl0cyBjYWxsYmFjayByZWZlcmVuY2UgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmN1c3RvbUV2ZW50c1tldmVudF1baV1bMF0gPT0gY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiByZW1vdmUgdGhlIGxpc3RlbmVyIGZyb20gdGhlIGFycmF5IGJ5IGl0cyBib3VuZCBjYWxsYmFjayByZWZlcmVuY2UgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayA9IHRoaXMuY3VzdG9tRXZlbnRzW2V2ZW50XVtpXVsxXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmN1c3RvbUV2ZW50c1tldmVudF0uc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2Ygb2JqLnJlbW92ZUV2ZW50TGlzdGVuZXIgPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICBvYmoucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudCwgY2FsbGJhY2spO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmICh0eXBlb2Ygb2JqLmRldGFjaEV2ZW50ID09ICdvYmplY3QnICYmIGh0bWxFdmVudHNbJ29uJyArIGV2ZW50XSkge1xuICAgICAgICAgICAgICAgICAgICBvYmouZGV0YWNoRXZlbnQoJ29uJyArIGV2ZW50LCBjYWxsYmFjayk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHR5cGVvZiBvYmouZGV0YWNoRXZlbnQgPT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgICAgICAgICAgb2JqLmRldGFjaEV2ZW50KCdvbnByb3BlcnR5Y2hhbmdlJywgY2FsbGJhY2spO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgb2JqWydvbicgKyBldmVudF0gPSBudWxsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEJyb3dzZXIgaW5kZXBlbmRlbnQgZXZlbnQgdHJpZ2dlciBmdW5jdGlvblxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IG9iaiAtIFRoZSBIVE1MRWxlbWVudCB3aGljaCB0cmlnZ2VycyB0aGUgZXZlbnRcbiAgICAgICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBldmVudE5hbWUgLSBUaGUgZXZlbnQgbmFtZSB3aXRob3V0IHRoZSBsZWFkaW5nIFwib25cIlxuICAgICAgICAgICAgICogQHJldHVybiB7dm9pZH1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgU3dvb3NoLnByb3RvdHlwZS50cmlnZ2VyRXZlbnQgPSBmdW5jdGlvbiAob2JqLCBldmVudE5hbWUpIHtcbiAgICAgICAgICAgICAgICB2YXIgZXZlbnQ7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB3aW5kb3cuQ3VzdG9tRXZlbnQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQgPSBuZXcgQ3VzdG9tRXZlbnQoZXZlbnROYW1lKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAodHlwZW9mIGRvY3VtZW50LmNyZWF0ZUV2ZW50ID09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudChcIkhUTUxFdmVudHNcIik7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LmluaXRFdmVudChldmVudE5hbWUsIHRydWUsIHRydWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChkb2N1bWVudC5jcmVhdGVFdmVudE9iamVjdCkge1xuICAgICAgICAgICAgICAgICAgICBldmVudCA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50T2JqZWN0KCk7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LmV2ZW50VHlwZSA9IGV2ZW50TmFtZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZXZlbnQuZXZlbnROYW1lID0gZXZlbnROYW1lO1xuICAgICAgICAgICAgICAgIGlmIChvYmouZGlzcGF0Y2hFdmVudCkge1xuICAgICAgICAgICAgICAgICAgICBvYmouZGlzcGF0Y2hFdmVudChldmVudCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKG9ialtldmVudE5hbWVdKSB7XG4gICAgICAgICAgICAgICAgICAgIG9ialtldmVudE5hbWVdKys7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKG9iai5maXJlRXZlbnQgJiYgaHRtbEV2ZW50c1snb24nICsgZXZlbnROYW1lXSkge1xuICAgICAgICAgICAgICAgICAgICBvYmouZmlyZUV2ZW50KCdvbicgKyBldmVudC5ldmVudFR5cGUsIGV2ZW50KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAob2JqW2V2ZW50TmFtZV0pIHtcbiAgICAgICAgICAgICAgICAgICAgb2JqW2V2ZW50TmFtZV0oKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAob2JqWydvbicgKyBldmVudE5hbWVdKSB7XG4gICAgICAgICAgICAgICAgICAgIG9ialsnb24nICsgZXZlbnROYW1lXSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEdldCBhIGNzcyBzdHlsZSBwcm9wZXJ0eSB2YWx1ZSBicm93c2VyIGluZGVwZW5kZW50XG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWwgLSBUaGUgSFRNTEVsZW1lbnQgdG8gbG9va3VwXG4gICAgICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30ganNQcm9wZXJ0eSAtIFRoZSBjc3MgcHJvcGVydHkgbmFtZSBpbiBqYXZhc2NyaXB0IGluIGNhbWVsQ2FzZSAoZS5nLiBcIm1hcmdpbkxlZnRcIiwgbm90IFwibWFyZ2luLWxlZnRcIilcbiAgICAgICAgICAgICAqIEByZXR1cm4ge3N0cmluZ30gLSB0aGUgcHJvcGVydHkgdmFsdWVcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgU3dvb3NoLnByb3RvdHlwZS5nZXRTdHlsZSA9IGZ1bmN0aW9uIChlbCwganNQcm9wZXJ0eSkge1xuICAgICAgICAgICAgICAgIHZhciBjc3NQcm9wZXJ0eSA9IGpzUHJvcGVydHkucmVwbGFjZSgvKFtBLVpdKS9nLCBcIi0kMVwiKS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2Ygd2luZG93LmdldENvbXB1dGVkU3R5bGUgPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gd2luZG93LmdldENvbXB1dGVkU3R5bGUoZWwpLmdldFByb3BlcnR5VmFsdWUoY3NzUHJvcGVydHkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGVsLmN1cnJlbnRTdHlsZVtqc1Byb3BlcnR5XTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgU3dvb3NoLnByb3RvdHlwZS5jbGVhclRpbWVvdXRzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLnRpbWVvdXRzKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGlkeCBpbiB0aGlzLnRpbWVvdXRzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQodGhpcy50aW1lb3V0c1tpZHhdKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy50aW1lb3V0cy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnRpbWVvdXRzID0gW107XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlbW92ZUV2ZW50TGlzdGVuZXIodGhpcy5pbm5lciwgJ2NvbGxpZGUubGVmdCcsIHRoaXMuY2xlYXJMaXN0ZW5lckxlZnQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKHRoaXMuaW5uZXIsICdjb2xsaWRlLnJpZ2h0JywgdGhpcy5jbGVhckxpc3RlbmVyUmlnaHQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKHRoaXMuaW5uZXIsICdjb2xsaWRlLnRvcCcsIHRoaXMuY2xlYXJMaXN0ZW5lclRvcCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlbW92ZUV2ZW50TGlzdGVuZXIodGhpcy5pbm5lciwgJ2NvbGxpZGUuYm90dG9tJywgdGhpcy5jbGVhckxpc3RlbmVyQm90dG9tKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIE1vdXNlIGRvd24gaGFuZGxlclxuICAgICAgICAgICAgICogUmVnaXN0ZXJzIHRoZSBtb3VzZW1vdmUgYW5kIG1vdXNldXAgaGFuZGxlcnMgYW5kIGZpbmRzIHRoZSBuZXh0IGlubmVyIGVsZW1lbnRcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAcGFyYW0ge01vdXNlRXZlbnR9IGUgLSBUaGUgbW91c2UgZG93biBldmVudCBvYmplY3RcbiAgICAgICAgICAgICAqIEByZXR1cm4ge3ZvaWR9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIFN3b29zaC5wcm90b3R5cGUubW91c2VEb3duID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICAgICAgICAgIHRoaXMuY2xlYXJUaW1lb3V0cygpO1xuICAgICAgICAgICAgICAgIC8qIGRyYWcgb25seSBpZiB0aGUgbGVmdCBtb3VzZSBidXR0b24gd2FzIHByZXNzZWQgKi9cbiAgICAgICAgICAgICAgICBpZiAoKFwid2hpY2hcIiBpbiBlICYmIGUud2hpY2ggPT0gMSkgfHwgKHR5cGVvZiBlLndoaWNoID09ICd1bmRlZmluZWQnICYmIFwiYnV0dG9uXCIgaW4gZSAmJiBlLmJ1dHRvbiA9PSAxKSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5lbGVtZW50QmVoaW5kQ3Vyc29ySXNNZShlLmNsaWVudFgsIGUuY2xpZW50WSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIHByZXZlbnQgaW1hZ2UgZHJhZ2dpbmcgYWN0aW9uICovXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgaW1ncyA9IHRoaXMuY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3JBbGwoJ2ltZycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBpbWdzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW1nc1tpXS5vbmRyYWdzdGFydCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIGZhbHNlOyB9OyAvL01TSUVcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIHNlYXJjaCB0aGUgRE9NIGZvciBleGNsdWRlIGVsZW1lbnRzICovXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLmRyYWdPcHRpb25zLmV4Y2x1ZGUubGVuZ3RoICE9IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBkcmFnIG9ubHkgaWYgdGhlIG1vdXNlIGNsaWNrZWQgb24gYW4gYWxsb3dlZCBlbGVtZW50ICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGVsID0gZG9jdW1lbnQuZWxlbWVudEZyb21Qb2ludChlLmNsaWVudFgsIGUuY2xpZW50WSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGV4Y2x1ZGVFbGVtZW50cyA9IHRoaXMuY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3JBbGwodGhpcy5vcHRpb25zLmRyYWdPcHRpb25zLmV4Y2x1ZGUuam9pbignLCAnKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogbG9vcCB0aHJvdWdoIGFsbCBwYXJlbnQgZWxlbWVudHMgdW50aWwgd2UgZW5jb3VudGVyIGFuIGlubmVyIGRpdiBvciBubyBtb3JlIHBhcmVudHMgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgaW5uZXJSZSA9IG5ldyBSZWdFeHAoXCIgXCIgKyB0aGlzLmNsYXNzSW5uZXIgKyBcIiBcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2hpbGUgKGVsICYmICFlbC5jbGFzc05hbWUubWF0Y2goaW5uZXJSZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogY29tcGFyZSBlYWNoIHBhcmVudCwgaWYgaXQgaXMgaW4gdGhlIGV4Y2x1ZGUgbGlzdCAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGV4Y2x1ZGVFbGVtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogYmFpbCBvdXQgaWYgYW4gZWxlbWVudCBtYXRjaGVzICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXhjbHVkZUVsZW1lbnRzW2ldID09IGVsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsID0gZWwucGFyZW50RWxlbWVudDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBzZWFyY2ggdGhlIERPTSBmb3Igb25seSBlbGVtZW50cywgYnV0IG9ubHkgaWYgdGhlcmUgYXJlIGVsZW1lbnRzIHNldFxuICAgICAgICAgICAgICAgICAgICAgICAgLyppZiAodGhpcy5vcHRpb25zLmRyYWdPcHRpb25zLm9ubHkubGVuZ3RoICE9IDApe1xuICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgb25seUVsZW1lbnRzID0gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvckFsbCh0aGlzLm9wdGlvbnMuZHJhZ09wdGlvbnMub25seS5qb2luKCcsICcpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gbG9vcCB0aHJvdWdoIHRoZSBub2RlbGlzdCBhbmQgY2hlY2sgZm9yIG91ciBlbGVtZW50XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBmb3VuZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGV4Y2x1ZGVFbGVtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvbmx5RWxlbWVudHNbaV0gPT0gZWwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvdW5kID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZm91bmQgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9Ki9cbiAgICAgICAgICAgICAgICAgICAgICAgIGRvY3VtZW50LmJvZHkuY2xhc3NOYW1lICs9IFwiIFwiICsgdGhpcy5jbGFzc0dyYWJiaW5nICsgXCIgXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBub3RlIHRoZSBvcmlnaW4gcG9zaXRpb25zICovXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRyYWdPcmlnaW5MZWZ0ID0gZS5jbGllbnRYO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kcmFnT3JpZ2luVG9wID0gZS5jbGllbnRZO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kcmFnT3JpZ2luU2Nyb2xsTGVmdCA9IHRoaXMuZ2V0U2Nyb2xsTGVmdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kcmFnT3JpZ2luU2Nyb2xsVG9wID0gdGhpcy5nZXRTY3JvbGxUb3AoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIGl0IGxvb2tzIHN0cmFuZ2UgaWYgc2Nyb2xsLWJlaGF2aW9yIGlzIHNldCB0byBzbW9vdGggKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGFyZW50T3JpZ2luU3R5bGUgPSB0aGlzLmlubmVyLnBhcmVudEVsZW1lbnQuc3R5bGUuY3NzVGV4dDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdGhpcy5pbm5lci5wYXJlbnRFbGVtZW50LnN0eWxlLnNldFByb3BlcnR5ID09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmlubmVyLnBhcmVudEVsZW1lbnQuc3R5bGUuc2V0UHJvcGVydHkoJ3Njcm9sbC1iZWhhdmlvcicsICdhdXRvJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0ID8gZS5wcmV2ZW50RGVmYXVsdCgpIDogKGUucmV0dXJuVmFsdWUgPSBmYWxzZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnZ4ID0gW107XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnZ5ID0gW107XG4gICAgICAgICAgICAgICAgICAgICAgICAvKiByZWdpc3RlciB0aGUgZXZlbnQgaGFuZGxlcnMgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubW91c2VNb3ZlSGFuZGxlciA9IHRoaXMubW91c2VNb3ZlLmJpbmQodGhpcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIoZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LCAnbW91c2Vtb3ZlJywgdGhpcy5tb3VzZU1vdmVIYW5kbGVyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubW91c2VVcEhhbmRsZXIgPSBmdW5jdGlvbiAoZSkgeyByZXR1cm4gX3RoaXMubW91c2VVcChlKTsgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcihkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQsICdtb3VzZXVwJywgdGhpcy5tb3VzZVVwSGFuZGxlcik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBNb3VzZSB1cCBoYW5kbGVyXG4gICAgICAgICAgICAgKiBEZXJlZ2lzdGVycyB0aGUgbW91c2Vtb3ZlIGFuZCBtb3VzZXVwIGhhbmRsZXJzXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQHBhcmFtIHtNb3VzZUV2ZW50fSBlIC0gVGhlIG1vdXNlIHVwIGV2ZW50IG9iamVjdFxuICAgICAgICAgICAgICogQHJldHVybiB7dm9pZH1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgU3dvb3NoLnByb3RvdHlwZS5tb3VzZVVwID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgICAvKiBUT0RPOiByZXN0b3JlIG9yaWdpbmFsIHBvc2l0aW9uIHZhbHVlICovXG4gICAgICAgICAgICAgICAgdGhpcy5pbm5lci5zdHlsZS5wb3NpdGlvbiA9ICcnO1xuICAgICAgICAgICAgICAgIHRoaXMuaW5uZXIuc3R5bGUudG9wID0gbnVsbDtcbiAgICAgICAgICAgICAgICB0aGlzLmlubmVyLnN0eWxlLmxlZnQgPSBudWxsO1xuICAgICAgICAgICAgICAgIHRoaXMucHJlc2VudCA9ICh0aGlzLmdldFRpbWVzdGFtcCgpIC8gMTAwMCk7IC8vaW4gc2Vjb25kc1xuICAgICAgICAgICAgICAgIHZhciB4ID0gdGhpcy5nZXRSZWFsWCh0aGlzLmRyYWdPcmlnaW5MZWZ0ICsgdGhpcy5kcmFnT3JpZ2luU2Nyb2xsTGVmdCAtIGUuY2xpZW50WCk7XG4gICAgICAgICAgICAgICAgdmFyIHkgPSB0aGlzLmdldFJlYWxZKHRoaXMuZHJhZ09yaWdpblRvcCArIHRoaXMuZHJhZ09yaWdpblNjcm9sbFRvcCAtIGUuY2xpZW50WSk7XG4gICAgICAgICAgICAgICAgdmFyIHJlID0gbmV3IFJlZ0V4cChcIiBcIiArIHRoaXMuY2xhc3NHcmFiYmluZyArIFwiIFwiKTtcbiAgICAgICAgICAgICAgICBkb2N1bWVudC5ib2R5LmNsYXNzTmFtZSA9IGRvY3VtZW50LmJvZHkuY2xhc3NOYW1lLnJlcGxhY2UocmUsICcnKTtcbiAgICAgICAgICAgICAgICB0aGlzLmlubmVyLnBhcmVudEVsZW1lbnQuc3R5bGUuY3NzVGV4dCA9IHRoaXMucGFyZW50T3JpZ2luU3R5bGU7XG4gICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCwgJ21vdXNlbW92ZScsIHRoaXMubW91c2VNb3ZlSGFuZGxlcik7XG4gICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCwgJ21vdXNldXAnLCB0aGlzLm1vdXNlVXBIYW5kbGVyKTtcbiAgICAgICAgICAgICAgICBpZiAoeSAhPSB0aGlzLmdldFNjcm9sbFRvcCgpIHx8IHggIT0gdGhpcy5nZXRTY3JvbGxMZWZ0KCkpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHQgPSB0aGlzLnByZXNlbnQgLSAodGhpcy5wYXN0ID8gdGhpcy5wYXN0IDogdGhpcy5wcmVzZW50KTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHQgPiAwLjA1KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBqdXN0IGFsaWduIHRvIHRoZSBncmlkIGlmIHRoZSBtb3VzZSBsZWZ0IHVubW92ZWQgZm9yIG1vcmUgdGhhbiAwLjA1IHNlY29uZHMgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsVG8oeCwgeSwgdGhpcy5vcHRpb25zLmRyYWdPcHRpb25zLmZhZGUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMuZHJhZ09wdGlvbnMuZmFkZSAmJiB0eXBlb2YgdGhpcy52eCAhPSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgdGhpcy52eSAhPSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZGVsdGFULCBkZWx0YVN4LCBkZWx0YVN5LCBsYXN0RGVsdGFTeCwgbGFzdERlbHRhU3k7XG4gICAgICAgICAgICAgICAgICAgIGRlbHRhVCA9IGRlbHRhU3ggPSBkZWx0YVN5ID0gbGFzdERlbHRhU3ggPSBsYXN0RGVsdGFTeSA9IDA7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgaW4gdGhpcy52eSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBhcnNlRmxvYXQoaSkgPiAodGhpcy5wcmVzZW50IC0gMC4xKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICYmIHR5cGVvZiBsYXN0VCAhPSAndW5kZWZpbmVkJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICYmIHR5cGVvZiBsYXN0U3ggIT0gJ3VuZGVmaW5lZCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAmJiB0eXBlb2YgbGFzdFN5ICE9ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsdGFUICs9IHBhcnNlRmxvYXQoaSkgLSBsYXN0VDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYXN0RGVsdGFTeCA9IHRoaXMudnhbaV0gLSBsYXN0U3g7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGFzdERlbHRhU3kgPSB0aGlzLnZ5W2ldIC0gbGFzdFN5O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbHRhU3ggKz0gTWF0aC5hYnMobGFzdERlbHRhU3gpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbHRhU3kgKz0gTWF0aC5hYnMobGFzdERlbHRhU3kpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGxhc3RUID0gcGFyc2VGbG9hdChpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBsYXN0U3ggPSB0aGlzLnZ4W2ldO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGxhc3RTeSA9IHRoaXMudnlbaV07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdmFyIHZ4ID0gZGVsdGFUID09IDAgPyAwIDogbGFzdERlbHRhU3ggPiAwID8gZGVsdGFTeCAvIGRlbHRhVCA6IGRlbHRhU3ggLyAtZGVsdGFUO1xuICAgICAgICAgICAgICAgICAgICB2YXIgdnkgPSBkZWx0YVQgPT0gMCA/IDAgOiBsYXN0RGVsdGFTeSA+IDAgPyBkZWx0YVN5IC8gZGVsdGFUIDogZGVsdGFTeSAvIC1kZWx0YVQ7XG4gICAgICAgICAgICAgICAgICAgIC8qIHYgc2hvdWxkIG5vdCBleGNlZWQgdk1heCBvciAtdk1heCAtPiB3b3VsZCBiZSB0b28gZmFzdCBhbmQgc2hvdWxkIGV4Y2VlZCB2TWluIG9yIC12TWluICovXG4gICAgICAgICAgICAgICAgICAgIHZhciB2TWF4ID0gdGhpcy5vcHRpb25zLmRyYWdPcHRpb25zLm1heFNwZWVkO1xuICAgICAgICAgICAgICAgICAgICB2YXIgdk1pbiA9IHRoaXMub3B0aW9ucy5kcmFnT3B0aW9ucy5taW5TcGVlZDtcbiAgICAgICAgICAgICAgICAgICAgLyogaWYgdGhlIHNwZWVkIGlzIG5vdCB3aXRob3V0IGJvdW5kIGZvciBmYWRlLCBqdXN0IGRvIGEgcmVndWxhciBzY3JvbGwgd2hlbiB0aGVyZSBpcyBhIGdyaWQqL1xuICAgICAgICAgICAgICAgICAgICBpZiAodnkgPCB2TWluICYmIHZ5ID4gLXZNaW4gJiYgdnggPCB2TWluICYmIHZ4ID4gLXZNaW4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMuZ3JpZFkgPiAxIHx8IHRoaXMub3B0aW9ucy5ncmlkWCA+IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNjcm9sbFRvKHgsIHkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHZhciB2eCA9ICh2eCA8PSB2TWF4ICYmIHZ4ID49IC12TWF4KSA/IHZ4IDogKHZ4ID4gMCA/IHZNYXggOiAtdk1heCk7XG4gICAgICAgICAgICAgICAgICAgIHZhciB2eSA9ICh2eSA8PSB2TWF4ICYmIHZ5ID49IC12TWF4KSA/IHZ5IDogKHZ5ID4gMCA/IHZNYXggOiAtdk1heCk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBheCA9ICh2eCA+IDAgPyAtMSA6IDEpICogdGhpcy5vcHRpb25zLmRyYWdPcHRpb25zLmJyYWtlU3BlZWQ7XG4gICAgICAgICAgICAgICAgICAgIHZhciBheSA9ICh2eSA+IDAgPyAtMSA6IDEpICogdGhpcy5vcHRpb25zLmRyYWdPcHRpb25zLmJyYWtlU3BlZWQ7XG4gICAgICAgICAgICAgICAgICAgIHggPSAoKDAgLSBNYXRoLnBvdyh2eCwgMikpIC8gKDIgKiBheCkpICsgdGhpcy5nZXRTY3JvbGxMZWZ0KCk7XG4gICAgICAgICAgICAgICAgICAgIHkgPSAoKDAgLSBNYXRoLnBvdyh2eSwgMikpIC8gKDIgKiBheSkpICsgdGhpcy5nZXRTY3JvbGxUb3AoKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zY3JvbGxUbyh4LCB5KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8qIGluIGFsbCBvdGhlciBjYXNlcywgZG8gYSByZWd1bGFyIHNjcm9sbCAqL1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNjcm9sbFRvKHgsIHksIHRoaXMub3B0aW9ucy5kcmFnT3B0aW9ucy5mYWRlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBDYWxjdWxhdGVzIHRoZSByb3VuZGVkIGFuZCBzY2FsZWQgeC1jb29yZGluYXRlLlxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSB4IC0gdGhlIHgtY29vcmRpbmF0ZVxuICAgICAgICAgICAgICogQHJldHVybiB7bnVtYmVyfSAtIHRoZSBmaW5hbCB4LWNvb3JkaW5hdGVcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgU3dvb3NoLnByb3RvdHlwZS5nZXRSZWFsWCA9IGZ1bmN0aW9uICh4KSB7XG4gICAgICAgICAgICAgICAgLy9zdGljayB0aGUgZWxlbWVudCB0byB0aGUgZ3JpZCwgaWYgZ3JpZCBlcXVhbHMgMSB0aGUgdmFsdWUgZG9lcyBub3QgY2hhbmdlXG4gICAgICAgICAgICAgICAgeCA9IE1hdGgucm91bmQoeCAvICh0aGlzLm9wdGlvbnMuZ3JpZFggKiB0aGlzLmdldFNjYWxlKCkpKSAqICh0aGlzLm9wdGlvbnMuZ3JpZFggKiB0aGlzLmdldFNjYWxlKCkpO1xuICAgICAgICAgICAgICAgIHZhciBzY3JvbGxNYXhMZWZ0ID0gKHRoaXMuc2Nyb2xsRWxlbWVudC5zY3JvbGxXaWR0aCAtIHRoaXMuc2Nyb2xsRWxlbWVudC5jbGllbnRXaWR0aCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuICh4ID4gc2Nyb2xsTWF4TGVmdCkgPyBzY3JvbGxNYXhMZWZ0IDogeDtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIENhbGN1bGF0ZXMgdGhlIHJvdW5kZWQgYW5kIHNjYWxlZCB5LWNvb3JkaW5hdGUuXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IHkgLSB0aGUgeS1jb29yZGluYXRlXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHtudW1iZXJ9IC0gdGhlIGZpbmFsIHktY29vcmRpbmF0ZVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBTd29vc2gucHJvdG90eXBlLmdldFJlYWxZID0gZnVuY3Rpb24gKHkpIHtcbiAgICAgICAgICAgICAgICAvL3N0aWNrIHRoZSBlbGVtZW50IHRvIHRoZSBncmlkLCBpZiBncmlkIGVxdWFscyAxIHRoZSB2YWx1ZSBkb2VzIG5vdCBjaGFuZ2VcbiAgICAgICAgICAgICAgICB5ID0gTWF0aC5yb3VuZCh5IC8gKHRoaXMub3B0aW9ucy5ncmlkWSAqIHRoaXMuZ2V0U2NhbGUoKSkpICogKHRoaXMub3B0aW9ucy5ncmlkWSAqIHRoaXMuZ2V0U2NhbGUoKSk7XG4gICAgICAgICAgICAgICAgdmFyIHNjcm9sbE1heFRvcCA9ICh0aGlzLnNjcm9sbEVsZW1lbnQuc2Nyb2xsSGVpZ2h0IC0gdGhpcy5zY3JvbGxFbGVtZW50LmNsaWVudEhlaWdodCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuICh5ID4gc2Nyb2xsTWF4VG9wKSA/IHNjcm9sbE1heFRvcCA6IHk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBDYWxjdWxhdGVzIGVhY2ggc3RlcCBvZiBhIHNjcm9sbCBmYWRlb3V0IGFuaW1hdGlvbiBiYXNlZCBvbiB0aGUgaW5pdGlhbCB2ZWxvY2l0eS5cbiAgICAgICAgICAgICAqIFN0b3BzIGFueSBjdXJyZW50bHkgcnVubmluZyBzY3JvbGwgYW5pbWF0aW9uLlxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSB2eCAtIHRoZSBpbml0aWFsIHZlbG9jaXR5IGluIGhvcml6b250YWwgZGlyZWN0aW9uXG4gICAgICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0gdnkgLSB0aGUgaW5pdGlhbCB2ZWxvY2l0eSBpbiB2ZXJ0aWNhbCBkaXJlY3Rpb25cbiAgICAgICAgICAgICAqIEByZXR1cm4ge251bWJlcn0gLSB0aGUgZmluYWwgeS1jb29yZGluYXRlXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIFN3b29zaC5wcm90b3R5cGUuZmFkZU91dEJ5VmVsb2NpdHkgPSBmdW5jdGlvbiAodngsIHZ5KSB7XG4gICAgICAgICAgICAgICAgLyogVE9ETzogY2FsYyB2IGhlcmUgYW5kIHdpdGggbW9yZSBpbmZvLCBtb3JlIHByZWNpc2VseSAqL1xuICAgICAgICAgICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgICAgICAgICAgLyogY2FsY3VsYXRlIHRoZSBicmFrZSBhY2NlbGVyYXRpb24gaW4gYm90aCBkaXJlY3Rpb25zIHNlcGFyYXRlbHkgKi9cbiAgICAgICAgICAgICAgICB2YXIgYXkgPSAodnkgPiAwID8gLTEgOiAxKSAqIHRoaXMub3B0aW9ucy5kcmFnT3B0aW9ucy5icmFrZVNwZWVkO1xuICAgICAgICAgICAgICAgIHZhciBheCA9ICh2eCA+IDAgPyAtMSA6IDEpICogdGhpcy5vcHRpb25zLmRyYWdPcHRpb25zLmJyYWtlU3BlZWQ7XG4gICAgICAgICAgICAgICAgLyogZmluZCB0aGUgZGlyZWN0aW9uIHRoYXQgbmVlZHMgbG9uZ2VyIHRvIHN0b3AsIGFuZCByZWNhbGN1bGF0ZSB0aGUgYWNjZWxlcmF0aW9uICovXG4gICAgICAgICAgICAgICAgdmFyIHRtYXggPSBNYXRoLm1heCgoMCAtIHZ5KSAvIGF5LCAoMCAtIHZ4KSAvIGF4KTtcbiAgICAgICAgICAgICAgICBheCA9ICgwIC0gdngpIC8gdG1heDtcbiAgICAgICAgICAgICAgICBheSA9ICgwIC0gdnkpIC8gdG1heDtcbiAgICAgICAgICAgICAgICB2YXIgZnBzID0gdGhpcy5vcHRpb25zLmRyYWdPcHRpb25zLmZwcztcbiAgICAgICAgICAgICAgICB2YXIgbWUgPSB0aGlzO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgKCh0bWF4ICogZnBzKSArICgwIC8gZnBzKSk7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgdCA9ICgoaSArIDEpIC8gZnBzKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHN5ID0gdGhpcy5nZXRTY3JvbGxUb3AoKSArICh2eSAqIHQpICsgKDAuNSAqIGF5ICogdCAqIHQpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgc3ggPSB0aGlzLmdldFNjcm9sbExlZnQoKSArICh2eCAqIHQpICsgKDAuNSAqIGF4ICogdCAqIHQpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnRpbWVvdXRzLnB1c2goc2V0VGltZW91dCgoZnVuY3Rpb24gKHgsIHksIG1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lLnNldFNjcm9sbFRvcCh5KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZS5zZXRTY3JvbGxMZWZ0KHgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lLm9yaWdpblNjcm9sbExlZnQgPSB4O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lLm9yaWdpblNjcm9sbFRvcCA9IHk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICB9KShzeCwgc3ksIG1lKSwgKGkgKyAxKSAqICgxMDAwIC8gZnBzKSkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoaSA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgLyogcm91bmQgdGhlIGxhc3Qgc3RlcCBiYXNlZCBvbiB0aGUgZGlyZWN0aW9uIG9mIHRoZSBmYWRlICovXG4gICAgICAgICAgICAgICAgICAgIHN4ID0gdnggPiAwID8gTWF0aC5jZWlsKHN4KSA6IE1hdGguZmxvb3Ioc3gpO1xuICAgICAgICAgICAgICAgICAgICBzeSA9IHZ5ID4gMCA/IE1hdGguY2VpbChzeSkgOiBNYXRoLmZsb29yKHN5KTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50aW1lb3V0cy5wdXNoKHNldFRpbWVvdXQoKGZ1bmN0aW9uICh4LCB5LCBtZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZS5zZXRTY3JvbGxUb3AoeSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWUuc2V0U2Nyb2xsTGVmdCh4KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZS5vcmlnaW5TY3JvbGxMZWZ0ID0geDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZS5vcmlnaW5TY3JvbGxUb3AgPSB5O1xuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgfSkoc3gsIHN5LCBtZSksIChpICsgMikgKiAoMTAwMCAvIGZwcykpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLyogc3RvcCB0aGUgYW5pbWF0aW9uIHdoZW4gY29sbGlkaW5nIHdpdGggdGhlIGJvcmRlcnMgKi9cbiAgICAgICAgICAgICAgICB0aGlzLmNsZWFyTGlzdGVuZXJMZWZ0ID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gX3RoaXMuY2xlYXJUaW1lb3V0cygpOyB9O1xuICAgICAgICAgICAgICAgIHRoaXMuY2xlYXJMaXN0ZW5lclJpZ2h0ID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gX3RoaXMuY2xlYXJUaW1lb3V0cygpOyB9O1xuICAgICAgICAgICAgICAgIHRoaXMuY2xlYXJMaXN0ZW5lclRvcCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIF90aGlzLmNsZWFyVGltZW91dHMoKTsgfTtcbiAgICAgICAgICAgICAgICB0aGlzLmNsZWFyTGlzdGVuZXJCb3R0b20gPSBmdW5jdGlvbiAoKSB7IHJldHVybiBfdGhpcy5jbGVhclRpbWVvdXRzKCk7IH07XG4gICAgICAgICAgICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKHRoaXMuaW5uZXIsICdjb2xsaWRlLmxlZnQnLCB0aGlzLmNsZWFyTGlzdGVuZXJMZWZ0KTtcbiAgICAgICAgICAgICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIodGhpcy5pbm5lciwgJ2NvbGxpZGUucmlnaHQnLCB0aGlzLmNsZWFyTGlzdGVuZXJSaWdodCk7XG4gICAgICAgICAgICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKHRoaXMuaW5uZXIsICdjb2xsaWRlLnRvcCcsIHRoaXMuY2xlYXJMaXN0ZW5lclRvcCk7XG4gICAgICAgICAgICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKHRoaXMuaW5uZXIsICdjb2xsaWRlLmJvdHRvbScsIHRoaXMuY2xlYXJMaXN0ZW5lckJvdHRvbSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgU3dvb3NoLnByb3RvdHlwZS5mYWRlT3V0QnlDb29yZHMgPSBmdW5jdGlvbiAoeCwgeSkge1xuICAgICAgICAgICAgICAgIHggPSB0aGlzLmdldFJlYWxYKHgpO1xuICAgICAgICAgICAgICAgIHkgPSB0aGlzLmdldFJlYWxZKHkpO1xuICAgICAgICAgICAgICAgIHZhciBhID0gdGhpcy5vcHRpb25zLmRyYWdPcHRpb25zLmJyYWtlU3BlZWQgKiAtMTtcbiAgICAgICAgICAgICAgICB2YXIgdnkgPSAwIC0gKDIgKiBhICogKHkgLSB0aGlzLmdldFNjcm9sbFRvcCgpKSk7XG4gICAgICAgICAgICAgICAgdmFyIHZ4ID0gMCAtICgyICogYSAqICh4IC0gdGhpcy5nZXRTY3JvbGxMZWZ0KCkpKTtcbiAgICAgICAgICAgICAgICB2eSA9ICh2eSA+IDAgPyAxIDogLTEpICogTWF0aC5zcXJ0KE1hdGguYWJzKHZ5KSk7XG4gICAgICAgICAgICAgICAgdnggPSAodnggPiAwID8gMSA6IC0xKSAqIE1hdGguc3FydChNYXRoLmFicyh2eCkpO1xuICAgICAgICAgICAgICAgIHZhciBzeCA9IHggLSB0aGlzLmdldFNjcm9sbExlZnQoKTtcbiAgICAgICAgICAgICAgICB2YXIgc3kgPSB5IC0gdGhpcy5nZXRTY3JvbGxUb3AoKTtcbiAgICAgICAgICAgICAgICBpZiAoTWF0aC5hYnMoc3kpID4gTWF0aC5hYnMoc3gpKSB7XG4gICAgICAgICAgICAgICAgICAgIHZ4ID0gKHZ4ID4gMCA/IDEgOiAtMSkgKiBNYXRoLmFicygoc3ggLyBzeSkgKiB2eSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB2eSA9ICh2eSA+IDAgPyAxIDogLTEpICogTWF0aC5hYnMoKHN5IC8gc3gpICogdngpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLmNsZWFyVGltZW91dHMoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmZhZGVPdXRCeVZlbG9jaXR5KHZ4LCB2eSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBNb3VzZSBtb3ZlIGhhbmRsZXJcbiAgICAgICAgICAgICAqIENhbGN1Y2F0ZXMgdGhlIHggYW5kIHkgZGVsdGFzIGFuZCBzY3JvbGxzXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQHBhcmFtIHtNb3VzZUV2ZW50fSBlIC0gVGhlIG1vdXNlIG1vdmUgZXZlbnQgb2JqZWN0XG4gICAgICAgICAgICAgKiBAcmV0dXJuIHt2b2lkfVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBTd29vc2gucHJvdG90eXBlLm1vdXNlTW92ZSA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wcmVzZW50ID0gKHRoaXMuZ2V0VGltZXN0YW1wKCkgLyAxMDAwKTsgLy9pbiBzZWNvbmRzXG4gICAgICAgICAgICAgICAgdGhpcy5jbGVhclRleHRTZWxlY3Rpb24oKTtcbiAgICAgICAgICAgICAgICAvKiBpZiB0aGUgbW91c2UgbGVmdCB0aGUgd2luZG93IGFuZCB0aGUgYnV0dG9uIGlzIG5vdCBwcmVzc2VkIGFueW1vcmUsIGFib3J0IG1vdmluZyAqL1xuICAgICAgICAgICAgICAgIC8vaWYgKChlLmJ1dHRvbnMgPT0gMCAmJiBlLmJ1dHRvbiA9PSAwKSB8fCAodHlwZW9mIGUuYnV0dG9ucyA9PSAndW5kZWZpbmVkJyAmJiBlLmJ1dHRvbiA9PSAwKSkge1xuICAgICAgICAgICAgICAgIGlmICgoXCJ3aGljaFwiIGluIGUgJiYgZS53aGljaCA9PSAwKSB8fCAodHlwZW9mIGUud2hpY2ggPT0gJ3VuZGVmaW5lZCcgJiYgXCJidXR0b25cIiBpbiBlICYmIGUuYnV0dG9uID09IDApKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubW91c2VVcChlKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgeCA9IHRoaXMuZHJhZ09yaWdpbkxlZnQgKyB0aGlzLmRyYWdPcmlnaW5TY3JvbGxMZWZ0IC0gZS5jbGllbnRYO1xuICAgICAgICAgICAgICAgIHZhciB5ID0gdGhpcy5kcmFnT3JpZ2luVG9wICsgdGhpcy5kcmFnT3JpZ2luU2Nyb2xsVG9wIC0gZS5jbGllbnRZO1xuICAgICAgICAgICAgICAgIC8qIGlmIGVsYXN0aWMgZWRnZXMgYXJlIHNldCwgc2hvdyB0aGUgZWxlbWVudCBwc2V1ZG8gc2Nyb2xsZWQgYnkgcmVsYXRpdmUgcG9zaXRpb24gKi9cbiAgICAgICAgICAgICAgICBpZiAodGhpcy50cmlnZ2VyZWQuY29sbGlkZUJvdHRvbSAmJiB0aGlzLm9wdGlvbnMuZWxhc3RpY0VkZ2VzLmJvdHRvbSA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmlubmVyLnN0eWxlLnBvc2l0aW9uID0gJ3JlbGF0aXZlJztcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pbm5lci5zdHlsZS50b3AgPSAoKHRoaXMuZ2V0U2Nyb2xsVG9wKCkgLSB5KSAvIDIpICsgJ3B4JztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMudHJpZ2dlcmVkLmNvbGxpZGVUb3AgJiYgdGhpcy5vcHRpb25zLmVsYXN0aWNFZGdlcy50b3AgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pbm5lci5zdHlsZS5wb3NpdGlvbiA9ICdyZWxhdGl2ZSc7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaW5uZXIuc3R5bGUudG9wID0gKHkgLyAtMikgKyAncHgnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAodGhpcy50cmlnZ2VyZWQuY29sbGlkZUxlZnQgJiYgdGhpcy5vcHRpb25zLmVsYXN0aWNFZGdlcy5sZWZ0ID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaW5uZXIuc3R5bGUucG9zaXRpb24gPSAncmVsYXRpdmUnO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmlubmVyLnN0eWxlLmxlZnQgPSAoeCAvIC0yKSArICdweCc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh0aGlzLnRyaWdnZXJlZC5jb2xsaWRlUmlnaHQgJiYgdGhpcy5vcHRpb25zLmVsYXN0aWNFZGdlcy5yaWdodCA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmlubmVyLnN0eWxlLnBvc2l0aW9uID0gJ3JlbGF0aXZlJztcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pbm5lci5zdHlsZS5sZWZ0ID0gKCh0aGlzLmdldFNjcm9sbExlZnQoKSAtIHgpIC8gMikgKyAncHgnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLnZ4W3RoaXMucHJlc2VudF0gPSB4O1xuICAgICAgICAgICAgICAgIHRoaXMudnlbdGhpcy5wcmVzZW50XSA9IHk7XG4gICAgICAgICAgICAgICAgdGhpcy5zY3JvbGxUbyh4LCB5LCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgdGhpcy5wYXN0ID0gdGhpcy5wcmVzZW50O1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogc2Nyb2xsQnkgaGVscGVyIG1ldGhvZCB0byBzY3JvbGwgYnkgYW4gYW1vdW50IG9mIHBpeGVscyBpbiB4LSBhbmQgeS1kaXJlY3Rpb25cbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0geCAtIGFtb3VudCBvZiBwaXhlbHMgdG8gc2Nyb2xsIGluIHgtZGlyZWN0aW9uXG4gICAgICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0geSAtIGFtb3VudCBvZiBwaXhlbHMgdG8gc2Nyb2xsIGluIHktZGlyZWN0aW9uXG4gICAgICAgICAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IHNtb290aCAtIHdoZXRoZXIgdG8gc2Nyb2xsIHNtb290aCBvciBpbnN0YW50XG4gICAgICAgICAgICAgKiBAcmV0dXJuIHt2b2lkfVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBTd29vc2gucHJvdG90eXBlLnNjcm9sbEJ5ID0gZnVuY3Rpb24gKHgsIHksIHNtb290aCkge1xuICAgICAgICAgICAgICAgIGlmIChzbW9vdGggPT09IHZvaWQgMCkgeyBzbW9vdGggPSB0cnVlOyB9XG4gICAgICAgICAgICAgICAgdmFyIGFic29sdXRlWCA9IHRoaXMuZ2V0U2Nyb2xsTGVmdCgpICsgeDtcbiAgICAgICAgICAgICAgICB2YXIgYWJzb2x1dGVZID0gdGhpcy5nZXRTY3JvbGxUb3AoKSArIHk7XG4gICAgICAgICAgICAgICAgdGhpcy5zY3JvbGxUbyhhYnNvbHV0ZVgsIGFic29sdXRlWSwgc21vb3RoKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIHNjcm9sbEJ5IGhlbHBlciBtZXRob2QgdG8gc2Nyb2xsIHRvIGEgeC0gYW5kIHktY29vcmRpbmF0ZVxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSB4IC0geC1jb29yZGluYXRlIHRvIHNjcm9sbCB0b1xuICAgICAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IHkgLSB5LWNvb3JkaW5hdGUgdG8gc2Nyb2xsIHRvXG4gICAgICAgICAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IHNtb290aCAtIHdoZXRoZXIgdG8gc2Nyb2xsIHNtb290aCBvciBpbnN0YW50XG4gICAgICAgICAgICAgKiBAcmV0dXJuIHt2b2lkfVxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBUT0RPOiBDU1MzIHRyYW5zaXRpb25zIGlmIGF2YWlsYWJsZSBpbiBicm93c2VyXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIFN3b29zaC5wcm90b3R5cGUuc2Nyb2xsVG8gPSBmdW5jdGlvbiAoeCwgeSwgc21vb3RoKSB7XG4gICAgICAgICAgICAgICAgaWYgKHNtb290aCA9PT0gdm9pZCAwKSB7IHNtb290aCA9IHRydWU7IH1cbiAgICAgICAgICAgICAgICB0aGlzLmNsZWFyVGltZW91dHMoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnNjcm9sbE1heExlZnQgPSAodGhpcy5zY3JvbGxFbGVtZW50LnNjcm9sbFdpZHRoIC0gdGhpcy5zY3JvbGxFbGVtZW50LmNsaWVudFdpZHRoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnNjcm9sbE1heFRvcCA9ICh0aGlzLnNjcm9sbEVsZW1lbnQuc2Nyb2xsSGVpZ2h0IC0gdGhpcy5zY3JvbGxFbGVtZW50LmNsaWVudEhlaWdodCk7XG4gICAgICAgICAgICAgICAgLyogbm8gbmVnYXRpdmUgdmFsdWVzIG9yIHZhbHVlcyBncmVhdGVyIHRoYW4gdGhlIG1heGltdW0gKi9cbiAgICAgICAgICAgICAgICB2YXIgeCA9ICh4ID4gdGhpcy5zY3JvbGxNYXhMZWZ0KSA/IHRoaXMuc2Nyb2xsTWF4TGVmdCA6ICh4IDwgMCkgPyAwIDogeDtcbiAgICAgICAgICAgICAgICB2YXIgeSA9ICh5ID4gdGhpcy5zY3JvbGxNYXhUb3ApID8gdGhpcy5zY3JvbGxNYXhUb3AgOiAoeSA8IDApID8gMCA6IHk7XG4gICAgICAgICAgICAgICAgLyogcmVtZW1iZXIgdGhlIG9sZCB2YWx1ZXMgKi9cbiAgICAgICAgICAgICAgICB0aGlzLm9yaWdpblNjcm9sbExlZnQgPSB0aGlzLmdldFNjcm9sbExlZnQoKTtcbiAgICAgICAgICAgICAgICB0aGlzLm9yaWdpblNjcm9sbFRvcCA9IHRoaXMuZ2V0U2Nyb2xsVG9wKCk7XG4gICAgICAgICAgICAgICAgaWYgKHggIT0gdGhpcy5nZXRTY3JvbGxMZWZ0KCkgfHwgeSAhPSB0aGlzLmdldFNjcm9sbFRvcCgpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMud2hlZWxPcHRpb25zLnNtb290aCAhPT0gdHJ1ZSB8fCBzbW9vdGggPT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNldFNjcm9sbFRvcCh5KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0U2Nyb2xsTGVmdCh4KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZmFkZU91dEJ5Q29vcmRzKHgsIHkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogUmVnaXN0ZXIgY3VzdG9tIGV2ZW50IGNhbGxiYWNrc1xuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBldmVudCAtIFRoZSBldmVudCBuYW1lXG4gICAgICAgICAgICAgKiBAcGFyYW0geyhlOiBFdmVudCkgPT4gYW55fSBjYWxsYmFjayAtIEEgY2FsbGJhY2sgZnVuY3Rpb24gdG8gZXhlY3V0ZSB3aGVuIHRoZSBldmVudCByYWlzZXNcbiAgICAgICAgICAgICAqIEByZXR1cm4ge1N3b29zaH0gLSBUaGUgU3dvb3NoIG9iamVjdCBpbnN0YW5jZVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBTd29vc2gucHJvdG90eXBlLm9uID0gZnVuY3Rpb24gKGV2ZW50LCBjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcih0aGlzLmlubmVyLCBldmVudCwgY2FsbGJhY2spO1xuICAgICAgICAgICAgICAgIC8qIHNldCB0aGUgZXZlbnQgdW50cmlnZ2VyZWQgYW5kIGNhbGwgdGhlIGZ1bmN0aW9uLCB0byByZXRyaWdnZXIgbWV0IGV2ZW50cyAqL1xuICAgICAgICAgICAgICAgIHZhciBmID0gZXZlbnQucmVwbGFjZSgvXFwuKFthLXpdKS8sIFN0cmluZy5jYWxsLmJpbmQoZXZlbnQudG9VcHBlckNhc2UpKS5yZXBsYWNlKC9cXC4vLCAnJyk7XG4gICAgICAgICAgICAgICAgdGhpcy50cmlnZ2VyZWRbZl0gPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB0aGlzLm9uU2Nyb2xsKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBEZXJlZ2lzdGVyIGN1c3RvbSBldmVudCBjYWxsYmFja3NcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnQgLSBUaGUgZXZlbnQgbmFtZVxuICAgICAgICAgICAgICogQHBhcmFtIHsoZTogRXZlbnQpID0+IGFueX0gY2FsbGJhY2sgLSBBIGNhbGxiYWNrIGZ1bmN0aW9uIHRvIGV4ZWN1dGUgd2hlbiB0aGUgZXZlbnQgcmFpc2VzXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHtTd29vc2h9IC0gVGhlIFN3b29zaCBvYmplY3QgaW5zdGFuY2VcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgU3dvb3NoLnByb3RvdHlwZS5vZmYgPSBmdW5jdGlvbiAoZXZlbnQsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKHRoaXMuaW5uZXIsIGV2ZW50LCBjYWxsYmFjayk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBSZXZlcnQgYWxsIERPTSBtYW5pcHVsYXRpb25zIGFuZCBkZXJlZ2lzdGVyIGFsbCBldmVudCBoYW5kbGVyc1xuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEByZXR1cm4ge3ZvaWR9XG4gICAgICAgICAgICAgKiBAVE9ETzogcmVtb3Zpbmcgd2hlZWxab29tSGFuZGxlciBkb2VzIG5vdCB3b3JrXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIFN3b29zaC5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgeCA9IHRoaXMuZ2V0U2Nyb2xsTGVmdCgpO1xuICAgICAgICAgICAgICAgIHZhciB5ID0gdGhpcy5nZXRTY3JvbGxUb3AoKTtcbiAgICAgICAgICAgICAgICAvKiByZW1vdmUgdGhlIG91dGVyIGFuZCBncmFiIENTUyBjbGFzc2VzICovXG4gICAgICAgICAgICAgICAgdmFyIHJlID0gbmV3IFJlZ0V4cChcIiBcIiArIHRoaXMuY2xhc3NPdXRlciArIFwiIFwiKTtcbiAgICAgICAgICAgICAgICB0aGlzLmNvbnRhaW5lci5jbGFzc05hbWUgPSB0aGlzLmNvbnRhaW5lci5jbGFzc05hbWUucmVwbGFjZShyZSwgJycpO1xuICAgICAgICAgICAgICAgIHZhciByZSA9IG5ldyBSZWdFeHAoXCIgXCIgKyB0aGlzLmNsYXNzR3JhYiArIFwiIFwiKTtcbiAgICAgICAgICAgICAgICB0aGlzLmlubmVyLmNsYXNzTmFtZSA9IHRoaXMuaW5uZXIuY2xhc3NOYW1lLnJlcGxhY2UocmUsICcnKTtcbiAgICAgICAgICAgICAgICB2YXIgcmUgPSBuZXcgUmVnRXhwKFwiIFwiICsgdGhpcy5jbGFzc05vR3JhYiArIFwiIFwiKTtcbiAgICAgICAgICAgICAgICB0aGlzLmNvbnRhaW5lci5jbGFzc05hbWUgPSB0aGlzLmNvbnRhaW5lci5jbGFzc05hbWUucmVwbGFjZShyZSwgJycpO1xuICAgICAgICAgICAgICAgIC8qIG1vdmUgYWxsIGNoaWxkTm9kZXMgYmFjayB0byB0aGUgb2xkIG91dGVyIGVsZW1lbnQgYW5kIHJlbW92ZSB0aGUgaW5uZXIgZWxlbWVudCAqL1xuICAgICAgICAgICAgICAgIHdoaWxlICh0aGlzLmlubmVyLmNoaWxkTm9kZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmNvbnRhaW5lci5hcHBlbmRDaGlsZCh0aGlzLmlubmVyLmNoaWxkTm9kZXNbMF0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLnNjYWxlRWxlbWVudC5yZW1vdmVDaGlsZCh0aGlzLmlubmVyKTtcbiAgICAgICAgICAgICAgICB0aGlzLmNvbnRhaW5lci5yZW1vdmVDaGlsZCh0aGlzLnNjYWxlRWxlbWVudCk7XG4gICAgICAgICAgICAgICAgdGhpcy5zY3JvbGxUbyh4LCB5LCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgdGhpcy5tb3VzZU1vdmVIYW5kbGVyID8gdGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCwgJ21vdXNlbW92ZScsIHRoaXMubW91c2VNb3ZlSGFuZGxlcikgOiBudWxsO1xuICAgICAgICAgICAgICAgIHRoaXMubW91c2VVcEhhbmRsZXIgPyB0aGlzLnJlbW92ZUV2ZW50TGlzdGVuZXIoZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LCAnbW91c2V1cCcsIHRoaXMubW91c2VVcEhhbmRsZXIpIDogbnVsbDtcbiAgICAgICAgICAgICAgICB0aGlzLm1vdXNlRG93bkhhbmRsZXIgPyB0aGlzLnJlbW92ZUV2ZW50TGlzdGVuZXIodGhpcy5pbm5lciwgJ21vdXNlZG93bicsIHRoaXMubW91c2VEb3duSGFuZGxlcikgOiBudWxsO1xuICAgICAgICAgICAgICAgIHRoaXMubW91c2VTY3JvbGxIYW5kbGVyID8gdGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKHRoaXMuc2Nyb2xsRWxlbWVudCwgJ3doZWVsJywgdGhpcy5tb3VzZVNjcm9sbEhhbmRsZXIpIDogbnVsbDtcbiAgICAgICAgICAgICAgICB0aGlzLm1vdXNlWm9vbUhhbmRsZXIgPyB0aGlzLnJlbW92ZUV2ZW50TGlzdGVuZXIodGhpcy5zY3JvbGxFbGVtZW50LCAnd2hlZWwnLCB0aGlzLm1vdXNlWm9vbUhhbmRsZXIpIDogbnVsbDtcbiAgICAgICAgICAgICAgICB0aGlzLmhhc2hDaGFuZ2VIYW5kbGVyID8gdGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKHdpbmRvdywgJ215aGFzaGNoYW5nZScsIHRoaXMuaGFzaENoYW5nZUhhbmRsZXIpIDogbnVsbDtcbiAgICAgICAgICAgICAgICB0aGlzLmhhc2hDaGFuZ2VIYW5kbGVyID8gdGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKHdpbmRvdywgJ2hhc2hjaGFuZ2UnLCB0aGlzLmhhc2hDaGFuZ2VIYW5kbGVyKSA6IG51bGw7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuaGFzaENoYW5nZUNsaWNrSGFuZGxlcikge1xuICAgICAgICAgICAgICAgICAgICB2YXIgbGlua3MgPSB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yQWxsKFwiYVtocmVmXj0nIyddXCIpO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxpbmtzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlbW92ZUV2ZW50TGlzdGVuZXIobGlua3NbaV0sICdjbGljaycsIHRoaXMuaGFzaENoYW5nZUNsaWNrSGFuZGxlcik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5zY3JvbGxFbGVtZW50ID8gdGhpcy5zY3JvbGxFbGVtZW50Lm9ubW91c2V3aGVlbCA9IG51bGwgOiBudWxsO1xuICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsRWxlbWVudCA/IHRoaXMuc2Nyb2xsRWxlbWVudC5vbnNjcm9sbCA9IG51bGwgOiBudWxsO1xuICAgICAgICAgICAgICAgIHdpbmRvdy5vbnJlc2l6ZSA9IG51bGw7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHJldHVybiBTd29vc2g7XG4gICAgICAgIH0oKSk7XG4gICAgICAgIC8qIHJldHVybiBhbiBpbnN0YW5jZSBvZiB0aGUgY2xhc3MgKi9cbiAgICAgICAgcmV0dXJuIG5ldyBTd29vc2goY29udGFpbmVyLCBvcHRpb25zKTtcbiAgICB9XG4gICAgcmV0dXJuIHN3b29zaDtcbn0pO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9c3dvb3NoLmpzLm1hcCJdfQ==
