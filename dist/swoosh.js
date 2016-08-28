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
                        minSpeed: 400
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
                    //this.scrollElement.onmousewheel = this.mouseScrollHandler;
                    this.addEventListener(this.scrollElement, 'wheel', this.mouseScrollHandler);
                }
                else if (this.options.wheelScroll === true) {
                    this.mouseScrollHandler = function (e) { return _this.activeMouseScroll(e); };
                    //this.scrollElement.onmousewheel = this.mouseScrollHandler;
                    this.addEventListener(this.scrollElement, 'wheel', this.mouseScrollHandler);
                }
                /* TODO: needed, when gridShow is true */
                this.options.gridShow ? this.scaleTo(1) : null;
                /* wheelzoom */
                if (this.options.wheelZoom === true) {
                    //this.scaleTo(1); /* needed, when gridShow is true */
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
                this.vx = this.vy = 0;
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
                        this.past = (this.getTimestamp() / 1000); //in seconds
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
                var x = this.getRealX(this.dragOriginLeft + this.dragOriginScrollLeft - e.clientX);
                var y = this.getRealY(this.dragOriginTop + this.dragOriginScrollTop - e.clientY);
                var re = new RegExp(" " + this.classGrabbing + " ");
                document.body.className = document.body.className.replace(re, '');
                this.inner.parentElement.style.cssText = this.parentOriginStyle;
                this.removeEventListener(document.documentElement, 'mousemove', this.mouseMoveHandler);
                this.removeEventListener(document.documentElement, 'mouseup', this.mouseUpHandler);
                if (y != this.getScrollTop() || x != this.getScrollLeft()) {
                    this.present = (this.getTimestamp() / 1000); //in seconds
                    var t = this.present - (this.past ? this.past : this.present);
                    if (t > 0.05) {
                        /* just align to the grid if the mouse left unmoved for more than 0.1 seconds */
                        this.scrollTo(x, y, this.options.dragOptions.fade);
                    }
                }
                if (this.options.dragOptions.fade && typeof this.vx != 'undefined' && typeof this.vy != 'undefined') {
                    /* v should not exceed vMax or -vMax -> would be too fast and should exceed vMin or -vMin */
                    var vMax = this.options.dragOptions.maxSpeed;
                    var vMin = this.options.dragOptions.minSpeed;
                    var vx = this.vx;
                    var vy = this.vy;
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
                if ((e.buttons == 0 && e.button == 0) || (typeof e.buttons == 'undefined' && e.button == 0)) {
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
                /*  calculate speed */
                var t = this.present - ((typeof this.past != 'undefined') ? this.past : this.present);
                var sx = x - (this.pastX ? this.pastX : x);
                var sy = y - (this.pastY ? this.pastY : y);
                this.vx = t == 0 ? 0 : sx / t;
                this.vy = t == 0 ? 0 : sy / t;
                this.scrollTo(x, y, false);
                this.past = this.present;
                this.pastX = x;
                this.pastY = y;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzd29vc2guanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIihmdW5jdGlvbiAoZmFjdG9yeSkge1xuICAgIGlmICh0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlLmV4cG9ydHMgPT09ICdvYmplY3QnKSB7XG4gICAgICAgIHZhciB2ID0gZmFjdG9yeShyZXF1aXJlLCBleHBvcnRzKTsgaWYgKHYgIT09IHVuZGVmaW5lZCkgbW9kdWxlLmV4cG9ydHMgPSB2O1xuICAgIH1cbiAgICBlbHNlIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICAgICAgZGVmaW5lKFtcInJlcXVpcmVcIiwgXCJleHBvcnRzXCJdLCBmYWN0b3J5KTtcbiAgICB9XG59KShmdW5jdGlvbiAocmVxdWlyZSwgZXhwb3J0cykge1xuICAgIFwidXNlIHN0cmljdFwiO1xuICAgIC8qKlxuICAgICAqIEV4cG9ydCBmdW5jdGlvbiBvZiB0aGUgbW9kdWxlXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBjb250YWluZXIgLSBUaGUgSFRNTEVsZW1lbnQgdG8gc3dvb29vc2ghXG4gICAgICogQHBhcmFtIHtPcHRpb25zfSBvcHRpb25zIC0gdGhlIG9wdGlvbnMgb2JqZWN0IHRvIGNvbmZpZ3VyZSBTd29vc2hcbiAgICAgKiBAcmV0dXJuIHtTd29vc2h9IC0gU3dvb3NoIG9iamVjdCBpbnN0YW5jZVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIHN3b29zaChjb250YWluZXIsIG9wdGlvbnMpIHtcbiAgICAgICAgaWYgKG9wdGlvbnMgPT09IHZvaWQgMCkgeyBvcHRpb25zID0ge307IH1cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFBvbHlmaWxsIGJpbmQgZnVuY3Rpb24gZm9yIG9sZGVyIGJyb3dzZXJzXG4gICAgICAgICAqIFRoZSBiaW5kIGZ1bmN0aW9uIGlzIGFuIGFkZGl0aW9uIHRvIEVDTUEtMjYyLCA1dGggZWRpdGlvblxuICAgICAgICAgKiBAc2VlOiBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9HbG9iYWxfT2JqZWN0cy9GdW5jdGlvbi9iaW5kXG4gICAgICAgICAqL1xuICAgICAgICBpZiAoIUZ1bmN0aW9uLnByb3RvdHlwZS5iaW5kKSB7XG4gICAgICAgICAgICBGdW5jdGlvbi5wcm90b3R5cGUuYmluZCA9IGZ1bmN0aW9uIChvVGhpcykge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdGhpcyAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICAvLyBjbG9zZXN0IHRoaW5nIHBvc3NpYmxlIHRvIHRoZSBFQ01BU2NyaXB0IDVcbiAgICAgICAgICAgICAgICAgICAgLy8gaW50ZXJuYWwgSXNDYWxsYWJsZSBmdW5jdGlvblxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdGdW5jdGlvbi5wcm90b3R5cGUuYmluZCAtIHdoYXQgaXMgdHJ5aW5nIHRvIGJlIGJvdW5kIGlzIG5vdCBjYWxsYWJsZScpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgYUFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpLCBmVG9CaW5kID0gdGhpcywgZk5PUCA9IGZ1bmN0aW9uICgpIHsgfSwgZkJvdW5kID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZlRvQmluZC5hcHBseSh0aGlzIGluc3RhbmNlb2YgZk5PUFxuICAgICAgICAgICAgICAgICAgICAgICAgPyB0aGlzXG4gICAgICAgICAgICAgICAgICAgICAgICA6IG9UaGlzLCBhQXJncy5jb25jYXQoQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKSkpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMucHJvdG90eXBlKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEZ1bmN0aW9uLnByb3RvdHlwZSBkb2Vzbid0IGhhdmUgYSBwcm90b3R5cGUgcHJvcGVydHlcbiAgICAgICAgICAgICAgICAgICAgZk5PUC5wcm90b3R5cGUgPSB0aGlzLnByb3RvdHlwZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZkJvdW5kLnByb3RvdHlwZSA9IG5ldyBmTk9QKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZCb3VuZDtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFBvbHlmaWxsIGFycmF5LmluZGV4T2YgZnVuY3Rpb24gZm9yIG9sZGVyIGJyb3dzZXJzXG4gICAgICAgICAqIFRoZSBpbmRleE9mKCkgZnVuY3Rpb24gd2FzIGFkZGVkIHRvIHRoZSBFQ01BLTI2MiBzdGFuZGFyZCBpbiB0aGUgNXRoIGVkaXRpb25cbiAgICAgICAgICogYXMgc3VjaCBpdCBtYXkgbm90IGJlIHByZXNlbnQgaW4gYWxsIGJyb3dzZXJzLlxuICAgICAgICAgKiBAc2VlIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0phdmFTY3JpcHQvUmVmZXJlbmNlL0dsb2JhbF9PYmplY3RzL0FycmF5L2luZGV4T2ZcbiAgICAgICAgICovXG4gICAgICAgIGlmICghQXJyYXkucHJvdG90eXBlLmluZGV4T2YpIHtcbiAgICAgICAgICAgIEFycmF5LnByb3RvdHlwZS5pbmRleE9mID0gZnVuY3Rpb24gKHNlYXJjaEVsZW1lbnQsIGZyb21JbmRleCkge1xuICAgICAgICAgICAgICAgIHZhciBrO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignXCJ0aGlzXCIgaXMgbnVsbCBvciBub3QgZGVmaW5lZCcpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgbyA9IE9iamVjdCh0aGlzKTtcbiAgICAgICAgICAgICAgICB2YXIgbGVuID0gby5sZW5ndGggPj4+IDA7XG4gICAgICAgICAgICAgICAgaWYgKGxlbiA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciBuID0gK2Zyb21JbmRleCB8fCAwO1xuICAgICAgICAgICAgICAgIGlmIChNYXRoLmFicyhuKSA9PT0gSW5maW5pdHkpIHtcbiAgICAgICAgICAgICAgICAgICAgbiA9IDA7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChuID49IGxlbikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGsgPSBNYXRoLm1heChuID49IDAgPyBuIDogbGVuIC0gTWF0aC5hYnMobiksIDApO1xuICAgICAgICAgICAgICAgIHdoaWxlIChrIDwgbGVuKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChrIGluIG8gJiYgb1trXSA9PT0gc2VhcmNoRWxlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaysrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIC8qIGxpc3Qgb2YgcmVhbCBldmVudHMgKi9cbiAgICAgICAgdmFyIGh0bWxFdmVudHMgPSB7XG4gICAgICAgICAgICAvKiA8Ym9keT4gYW5kIDxmcmFtZXNldD4gRXZlbnRzICovXG4gICAgICAgICAgICBvbmxvYWQ6IDEsXG4gICAgICAgICAgICBvbnVubG9hZDogMSxcbiAgICAgICAgICAgIC8qIEZvcm0gRXZlbnRzICovXG4gICAgICAgICAgICBvbmJsdXI6IDEsXG4gICAgICAgICAgICBvbmNoYW5nZTogMSxcbiAgICAgICAgICAgIG9uZm9jdXM6IDEsXG4gICAgICAgICAgICBvbnJlc2V0OiAxLFxuICAgICAgICAgICAgb25zZWxlY3Q6IDEsXG4gICAgICAgICAgICBvbnN1Ym1pdDogMSxcbiAgICAgICAgICAgIC8qIEltYWdlIEV2ZW50cyAqL1xuICAgICAgICAgICAgb25hYm9ydDogMSxcbiAgICAgICAgICAgIC8qIEtleWJvYXJkIEV2ZW50cyAqL1xuICAgICAgICAgICAgb25rZXlkb3duOiAxLFxuICAgICAgICAgICAgb25rZXlwcmVzczogMSxcbiAgICAgICAgICAgIG9ua2V5dXA6IDEsXG4gICAgICAgICAgICAvKiBNb3VzZSBFdmVudHMgKi9cbiAgICAgICAgICAgIG9uY2xpY2s6IDEsXG4gICAgICAgICAgICBvbmRibGNsaWNrOiAxLFxuICAgICAgICAgICAgb25tb3VzZWRvd246IDEsXG4gICAgICAgICAgICBvbm1vdXNlbW92ZTogMSxcbiAgICAgICAgICAgIG9ubW91c2VvdXQ6IDEsXG4gICAgICAgICAgICBvbm1vdXNlb3ZlcjogMSxcbiAgICAgICAgICAgIG9ubW91c2V1cDogMVxuICAgICAgICB9O1xuICAgICAgICB2YXIgbWFwRXZlbnRzID0ge1xuICAgICAgICAgICAgb25zY3JvbGw6IHdpbmRvd1xuICAgICAgICB9O1xuICAgICAgICAvKipcbiAgICAgICAgICogU3dvb3NoIHByb3ZpZGVzIGEgc2V0IG9mIGZ1bmN0aW9ucyB0byBpbXBsZW1lbnQgc2Nyb2xsIGJ5IGRyYWcsIHpvb20gYnkgbW91c2V3aGVlbCxcbiAgICAgICAgICogaGFzaCBsaW5rcyBpbnNpZGUgdGhlIGRvY3VtZW50IGFuZCBvdGhlciBzcGVjaWFsIHNjcm9sbCByZWxhdGVkIHJlcXVpcmVtZW50cy5cbiAgICAgICAgICpcbiAgICAgICAgICogQGF1dGhvciBSb21hbiBHcnViZXIgPHAxMDIwMzg5QHlhaG9vLmNvbT5cbiAgICAgICAgICogQHZlcnNpb24gMS4wXG4gICAgICAgICAqL1xuICAgICAgICB2YXIgU3dvb3NoID0gKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGZ1bmN0aW9uIFN3b29zaChjb250YWluZXIsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNvbnRhaW5lciA9IGNvbnRhaW5lcjtcbiAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuICAgICAgICAgICAgICAgIC8qIENTUyBzdHlsZSBjbGFzc2VzICovXG4gICAgICAgICAgICAgICAgdGhpcy5jbGFzc0lubmVyID0gJ3N3LWlubmVyJztcbiAgICAgICAgICAgICAgICB0aGlzLmNsYXNzT3V0ZXIgPSAnc3ctb3V0ZXInO1xuICAgICAgICAgICAgICAgIHRoaXMuY2xhc3NHcmFiID0gJ3N3LWdyYWInO1xuICAgICAgICAgICAgICAgIHRoaXMuY2xhc3NOb0dyYWIgPSAnc3ctbm9ncmFiJztcbiAgICAgICAgICAgICAgICB0aGlzLmNsYXNzR3JhYmJpbmcgPSAnc3ctZ3JhYmJpbmcnO1xuICAgICAgICAgICAgICAgIHRoaXMuY2xhc3NVbmlxdWUgPSAnc3ctJyArIE1hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpLnN1YnN0cmluZyg3KTtcbiAgICAgICAgICAgICAgICB0aGlzLmNsYXNzU2NhbGUgPSAnc3ctc2NhbGUnO1xuICAgICAgICAgICAgICAgIC8qIGFycmF5IGhvbGRpbmcgdGhlIGN1c3RvbSBldmVudHMgbWFwcGluZyBjYWxsYmFja3MgdG8gYm91bmQgY2FsbGJhY2tzICovXG4gICAgICAgICAgICAgICAgdGhpcy5jdXN0b21FdmVudHMgPSBbXTtcbiAgICAgICAgICAgICAgICB0aGlzLnRyaWdnZXJlZCA9IHtcbiAgICAgICAgICAgICAgICAgICAgY29sbGlkZUxlZnQ6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBjb2xsaWRlVG9wOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgY29sbGlkZVJpZ2h0OiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgY29sbGlkZUJvdHRvbTogZmFsc2VcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIC8qIGZhZGVPdXQgKi9cbiAgICAgICAgICAgICAgICB0aGlzLnRpbWVvdXRzID0gW107XG4gICAgICAgICAgICAgICAgdGhpcy5jb250YWluZXIgPSBjb250YWluZXI7XG4gICAgICAgICAgICAgICAgLyogc2V0IGRlZmF1bHQgb3B0aW9ucyAqL1xuICAgICAgICAgICAgICAgIHRoaXMub3B0aW9ucyA9IHtcbiAgICAgICAgICAgICAgICAgICAgLyogMSBtZWFucyBkbyBub3QgYWxpZ24gdG8gYSBncmlkICovXG4gICAgICAgICAgICAgICAgICAgIGdyaWRYOiAxLFxuICAgICAgICAgICAgICAgICAgICBncmlkWTogMSxcbiAgICAgICAgICAgICAgICAgICAgLyogc2hvd3MgYSBncmlkIGFzIGFuIG92ZXJsYXkgb3ZlciB0aGUgZWxlbWVudC4gV29ya3Mgb25seSBpZiB0aGUgYnJvd3NlciBzdXBwb3J0c1xuICAgICAgICAgICAgICAgICAgICAgKiBDU1MgR2VuZXJhdGVkIGNvbnRlbnQgZm9yIHBzZXVkby1lbGVtZW50c1xuICAgICAgICAgICAgICAgICAgICAgKiBAc2VlIGh0dHA6Ly9jYW5pdXNlLmNvbS8jc2VhcmNoPSUzQWJlZm9yZSAqL1xuICAgICAgICAgICAgICAgICAgICBncmlkU2hvdzogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIC8qIHdoaWNoIGVkZ2Ugc2hvdWxkIGJlIGVsYXN0aWMgKi9cbiAgICAgICAgICAgICAgICAgICAgZWxhc3RpY0VkZ2VzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZWZ0OiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHJpZ2h0OiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvcDogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICBib3R0b206IGZhbHNlXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIC8qIGFjdGl2YXRlcy9kZWFjdGl2YXRlcyBzY3JvbGxpbmcgYnkgZHJhZyAqL1xuICAgICAgICAgICAgICAgICAgICBkcmFnU2Nyb2xsOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBkcmFnT3B0aW9uczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgZXhjbHVkZTogWydpbnB1dCcsICd0ZXh0YXJlYScsICdhJywgJ2J1dHRvbicsICcuc3ctaWdub3JlJywgJ3NlbGVjdCddLFxuICAgICAgICAgICAgICAgICAgICAgICAgb25seTogW10sXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBhY3RpdmF0ZXMgYSBzY3JvbGwgZmFkZSB3aGVuIHNjcm9sbGluZyBieSBkcmFnICovXG4gICAgICAgICAgICAgICAgICAgICAgICBmYWRlOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgLyogZmFkZTogYnJha2UgYWNjZWxlcmF0aW9uIGluIHBpeGVscyBwZXIgc2Vjb25kIHBlciBzZWNvbmQgKHAvc8KyKSAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJha2VTcGVlZDogMjUwMCxcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIGZhZGU6IGZyYW1lcyBwZXIgc2Vjb25kIG9mIHRoZSBzd29vc2ggZmFkZW91dCBhbmltYXRpb24gKD49MjUgbG9va3MgbGlrZSBtb3Rpb24pICovXG4gICAgICAgICAgICAgICAgICAgICAgICBmcHM6IDMwLFxuICAgICAgICAgICAgICAgICAgICAgICAgLyogZmFkZTogdGhpcyBzcGVlZCB3aWxsIG5ldmVyIGJlIGV4Y2VlZGVkICovXG4gICAgICAgICAgICAgICAgICAgICAgICBtYXhTcGVlZDogMzAwMCxcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIGZhZGU6IG1pbmltdW0gc3BlZWQgd2hpY2ggdHJpZ2dlcnMgdGhlIGZhZGUgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIG1pblNwZWVkOiA0MDBcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgLyogYWN0aXZhdGVzL2RlYWN0aXZhdGVzIHNjcm9sbGluZyBieSB3aGVlbC4gSWYgdGhlIGRyZWljdGlvbiBpcyB2ZXJ0aWNhbCBhbmQgdGhlcmUgYXJlXG4gICAgICAgICAgICAgICAgICAgICAqIHNjcm9sbGJhcnMgcHJlc2VudCwgc3dvb3NoIGxldHMgbGVhdmVzIHNjcm9sbGluZyB0byB0aGUgYnJvd3Nlci4gKi9cbiAgICAgICAgICAgICAgICAgICAgd2hlZWxTY3JvbGw6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIHdoZWVsT3B0aW9uczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgLyogZGlyZWN0aW9uIHRvIHNjcm9sbCB3aGVuIHRoZSBtb3VzZSB3aGVlbCBpcyB1c2VkICovXG4gICAgICAgICAgICAgICAgICAgICAgICBkaXJlY3Rpb246ICd2ZXJ0aWNhbCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBhbW91bnQgb2YgcGl4ZWxzIGZvciBvbmUgc2Nyb2xsIHN0ZXAgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIHN0ZXA6IDExNCxcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIHNjcm9sbCBzbW9vdGggb3IgaW5zdGFudCAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgc21vb3RoOiB0cnVlXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIC8qIGFjdGl2YXRlcy9kZWFjdGl2YXRlcyB6b29taW5nIGJ5IHdoZWVsLiBXb3JrcyBvbmx5IHdpdGggYSBDU1MzIDJEIFRyYW5zZm9ybSBjYXBhYmxlIGJyb3dzZXIuXG4gICAgICAgICAgICAgICAgICAgICAqIEBzZWUgaHR0cDovL2Nhbml1c2UuY29tLyNmZWF0PXRyYW5zZm9ybXMyZCAqL1xuICAgICAgICAgICAgICAgICAgICB3aGVlbFpvb206IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICB6b29tT3B0aW9uczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgLyogdGhlIG1heGltdW0gc2NhbGUsIDAgbWVhbnMgbm8gbWF4aW11bSAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgbWF4U2NhbGU6IDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiB0aGUgbWluaW11bSBzY2FsZSwgMCBtZWFucyBubyBtaW5pbXVtICovXG4gICAgICAgICAgICAgICAgICAgICAgICBtaW5TY2FsZTogMCxcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIG9uZSBzdGVwIHdoZW4gdXNpbmcgdGhlIHdoZWVsIHRvIHpvb20gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIHN0ZXA6IDAuMSxcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIG1vdXNlIHdoZWVsIGRpcmVjdGlvbiB0byB6b29tIGxhcmdlciAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgZGlyZWN0aW9uOiAndXAnXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIC8qIGxldCBzd29vc2ggaGFuZGxlIGFuY2hvciBsaW5rcyB0YXJnZXRpbmcgdG8gYW4gYW5jaG9yIGluc2lkZSBvZiB0aGlzIHN3b29zaCBlbGVtZW50LlxuICAgICAgICAgICAgICAgICAgICAgKiB0aGUgZWxlbWVudCBvdXRzaWRlIChtYXliZSB0aGUgYm9keSkgaGFuZGxlcyBhbmNob3JzIHRvby4gSWYgeW91IHdhbnQgdG8gcHJldmVudCB0aGlzLFxuICAgICAgICAgICAgICAgICAgICAgKiBhZGQgdG8gYm9keSBhcyBzd29vc2ggZWxlbWVudCB0b28uICovXG4gICAgICAgICAgICAgICAgICAgIGhhbmRsZUFuY2hvcnM6IHRydWVcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIC8qIG1lcmdlIHRoZSBkZWZhdWx0IG9wdGlvbiBvYmplY3RzIHdpdGggdGhlIHByb3ZpZGVkIG9uZSAqL1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiBvcHRpb25zKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2Ygb3B0aW9uc1trZXldID09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgb2tleSBpbiBvcHRpb25zW2tleV0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG9wdGlvbnNba2V5XS5oYXNPd25Qcm9wZXJ0eShva2V5KSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMub3B0aW9uc1trZXldW29rZXldID0gb3B0aW9uc1trZXldW29rZXldO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMub3B0aW9uc1trZXldID0gb3B0aW9uc1trZXldO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuaW5pdCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBJbml0aWFsaXplIERPTSBtYW5pcHVsYXRpb25zIGFuZCBldmVudCBoYW5kbGVyc1xuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEByZXR1cm4ge3ZvaWR9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIFN3b29zaC5wcm90b3R5cGUuaW5pdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICAgICAgICAgIHRoaXMuaXNCb2R5ID0gdGhpcy5jb250YWluZXIudGFnTmFtZSA9PSBcIkJPRFlcIiA/IHRydWUgOiBmYWxzZTtcbiAgICAgICAgICAgICAgICAvKiBDaHJvbWUgc29sdXRpb24gdG8gc2Nyb2xsIHRoZSBib2R5IGlzIG5vdCByZWFsbHkgdmlhYmxlLCBzbyB3ZSBjcmVhdGUgYSBmYWtlIGJvZHlcbiAgICAgICAgICAgICAgICAgKiBkaXYgZWxlbWVudCB0byBzY3JvbGwgb24gKi9cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5pc0JvZHkgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHBzZXVkb0JvZHkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgICAgICAgICAgICAgICBwc2V1ZG9Cb2R5LmNsYXNzTmFtZSArPSBcIiBzdy1mYWtlYm9keSBcIjtcbiAgICAgICAgICAgICAgICAgICAgcHNldWRvQm9keS5zdHlsZS5jc3NUZXh0ID0gZG9jdW1lbnQuYm9keS5zdHlsZS5jc3NUZXh0O1xuICAgICAgICAgICAgICAgICAgICB3aGlsZSAodGhpcy5jb250YWluZXIuY2hpbGROb2Rlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwc2V1ZG9Cb2R5LmFwcGVuZENoaWxkKHRoaXMuY29udGFpbmVyLmNoaWxkTm9kZXNbMF0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY29udGFpbmVyLmFwcGVuZENoaWxkKHBzZXVkb0JvZHkpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmNvbnRhaW5lciA9IHBzZXVkb0JvZHk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuY29udGFpbmVyLmNsYXNzTmFtZSArPSBcIiBcIiArIHRoaXMuY2xhc3NPdXRlciArIFwiIFwiO1xuICAgICAgICAgICAgICAgIC8vdGhpcy5zY3JvbGxFbGVtZW50ID0gdGhpcy5pc0JvZHkgPyBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQgOiB0aGlzLmNvbnRhaW5lcjtcbiAgICAgICAgICAgICAgICB0aGlzLnNjcm9sbEVsZW1lbnQgPSB0aGlzLmNvbnRhaW5lcjtcbiAgICAgICAgICAgICAgICB2YXIgeCA9IHRoaXMuZ2V0U2Nyb2xsTGVmdCgpO1xuICAgICAgICAgICAgICAgIHZhciB5ID0gdGhpcy5nZXRTY3JvbGxUb3AoKTtcbiAgICAgICAgICAgICAgICAvKiBjcmVhdGUgaW5uZXIgZGl2IGVsZW1lbnQgYW5kIGFwcGVuZCBpdCB0byB0aGUgY29udGFpbmVyIHdpdGggaXRzIGNvbnRlbnRzIGluIGl0ICovXG4gICAgICAgICAgICAgICAgdGhpcy5pbm5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICAgICAgICAgICAgLy92YXIgdW5pcXVlQ2xhc3MgPSB0aGlzLmNsYXNzSW5uZXIgKyBcIi1cIiArIE1hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpLnN1YnN0cmluZyg3KTtcbiAgICAgICAgICAgICAgICB0aGlzLmlubmVyLmNsYXNzTmFtZSArPSBcIiBcIiArIHRoaXMuY2xhc3NJbm5lciArIFwiIFwiICsgdGhpcy5jbGFzc1VuaXF1ZSArIFwiIFwiO1xuICAgICAgICAgICAgICAgIHRoaXMuc2NhbGVFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgICAgICAgICAgICB0aGlzLnNjYWxlRWxlbWVudC5jbGFzc05hbWUgKz0gXCIgXCIgKyB0aGlzLmNsYXNzU2NhbGUgKyBcIiBcIjtcbiAgICAgICAgICAgICAgICB0aGlzLnNjYWxlRWxlbWVudC5hcHBlbmRDaGlsZCh0aGlzLmlubmVyKTtcbiAgICAgICAgICAgICAgICAvKiBtb3ZlIGFsbCBjaGlsZE5vZGVzIHRvIHRoZSBuZXcgaW5uZXIgZWxlbWVudCAqL1xuICAgICAgICAgICAgICAgIHdoaWxlICh0aGlzLmNvbnRhaW5lci5jaGlsZE5vZGVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pbm5lci5hcHBlbmRDaGlsZCh0aGlzLmNvbnRhaW5lci5jaGlsZE5vZGVzWzBdKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5jb250YWluZXIuYXBwZW5kQ2hpbGQodGhpcy5zY2FsZUVsZW1lbnQpO1xuICAgICAgICAgICAgICAgIHRoaXMuaW5uZXIuc3R5bGUubWluV2lkdGggPSAodGhpcy5jb250YWluZXIuc2Nyb2xsV2lkdGggLSB0aGlzLmdldEJvcmRlcldpZHRoKHRoaXMuY29udGFpbmVyKSkgKyAncHgnO1xuICAgICAgICAgICAgICAgIHRoaXMuaW5uZXIuc3R5bGUubWluSGVpZ2h0ID0gKHRoaXMuY29udGFpbmVyLnNjcm9sbEhlaWdodCAtIHRoaXMuZ2V0Qm9yZGVyV2lkdGgodGhpcy5jb250YWluZXIpKSArICdweCc7XG4gICAgICAgICAgICAgICAgdGhpcy5zY2FsZUVsZW1lbnQuc3R5bGUubWluV2lkdGggPSB0aGlzLmlubmVyLnN0eWxlLm1pbldpZHRoO1xuICAgICAgICAgICAgICAgIHRoaXMuc2NhbGVFbGVtZW50LnN0eWxlLm1pbkhlaWdodCA9IHRoaXMuaW5uZXIuc3R5bGUubWluSGVpZ2h0O1xuICAgICAgICAgICAgICAgIHRoaXMuc2NhbGVFbGVtZW50LnN0eWxlLm92ZXJmbG93ID0gJ2hpZGRlbic7XG4gICAgICAgICAgICAgICAgLyogc2hvdyB0aGUgZ3JpZCBvbmx5IGlmIGF0IGxlYXN0IG9uZSBvZiB0aGUgZ3JpZCB2YWx1ZXMgaXMgbm90IDEgKi9cbiAgICAgICAgICAgICAgICBpZiAoKHRoaXMub3B0aW9ucy5ncmlkWCAhPSAxIHx8IHRoaXMub3B0aW9ucy5ncmlkWSAhPSAxKSAmJiB0aGlzLm9wdGlvbnMuZ3JpZFNob3cpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGJnaSA9IFtdO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMuZ3JpZFggIT0gMSA/IGJnaS5wdXNoKCdsaW5lYXItZ3JhZGllbnQodG8gcmlnaHQsIGdyZXkgMXB4LCB0cmFuc3BhcmVudCAxcHgpJykgOiBudWxsO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMuZ3JpZFkgIT0gMSA/IGJnaS5wdXNoKCdsaW5lYXItZ3JhZGllbnQodG8gYm90dG9tLCBncmV5IDFweCwgdHJhbnNwYXJlbnQgMXB4KScpIDogbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGRCZWZvcmVDU1ModGhpcy5jbGFzc1VuaXF1ZSwgJ3dpZHRoJywgdGhpcy5pbm5lci5zdHlsZS5taW5XaWR0aCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkQmVmb3JlQ1NTKHRoaXMuY2xhc3NVbmlxdWUsICdoZWlnaHQnLCB0aGlzLmlubmVyLnN0eWxlLm1pbkhlaWdodCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkQmVmb3JlQ1NTKHRoaXMuY2xhc3NVbmlxdWUsICdsZWZ0JywgJy0nICsgdGhpcy5nZXRTdHlsZSh0aGlzLmNvbnRhaW5lciwgJ3BhZGRpbmdMZWZ0JykpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZEJlZm9yZUNTUyh0aGlzLmNsYXNzVW5pcXVlLCAndG9wJywgJy0nICsgdGhpcy5nZXRTdHlsZSh0aGlzLmNvbnRhaW5lciwgJ3BhZGRpbmdUb3AnKSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkQmVmb3JlQ1NTKHRoaXMuY2xhc3NVbmlxdWUsICdiYWNrZ3JvdW5kLXNpemUnLCAodGhpcy5vcHRpb25zLmdyaWRYICE9IDEgPyB0aGlzLm9wdGlvbnMuZ3JpZFggKyAncHggJyA6ICdhdXRvICcpICsgKHRoaXMub3B0aW9ucy5ncmlkWSAhPSAxID8gdGhpcy5vcHRpb25zLmdyaWRZICsgJ3B4JyA6ICdhdXRvJykpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZEJlZm9yZUNTUyh0aGlzLmNsYXNzVW5pcXVlLCAnYmFja2dyb3VuZC1pbWFnZScsIGJnaS5qb2luKCcsICcpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5vbGRDbGllbnRXaWR0aCA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRXaWR0aDtcbiAgICAgICAgICAgICAgICB0aGlzLm9sZENsaWVudEhlaWdodCA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRIZWlnaHQ7XG4gICAgICAgICAgICAgICAgLyoganVzdCBjYWxsIHRoZSBmdW5jdGlvbiwgdG8gdHJpZ2dlciBwb3NzaWJsZSBldmVudHMgKi9cbiAgICAgICAgICAgICAgICB0aGlzLm9uU2Nyb2xsKCk7XG4gICAgICAgICAgICAgICAgLyogc2Nyb2xsIHRvIHRoZSBpbml0aWFsIHBvc2l0aW9uICovXG4gICAgICAgICAgICAgICAgdGhpcy5zY3JvbGxUbyh4LCB5KTtcbiAgICAgICAgICAgICAgICAvKiBFdmVudCBoYW5kbGVyIHJlZ2lzdHJhdGlvbiBzdGFydCBoZXJlICovXG4gICAgICAgICAgICAgICAgLyogVE9ETzogbm90IDIgZGlmZmVyZW50IGV2ZW50IGhhbmRsZXJzIHJlZ2lzdHJhdGlvbnMgLT4gZG8gaXQgaW4gdGhpcy5hZGRFdmVudExpc3RlbmVyKCkgKi9cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLndoZWVsU2Nyb2xsID09PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm1vdXNlU2Nyb2xsSGFuZGxlciA9IGZ1bmN0aW9uIChlKSB7IHJldHVybiBfdGhpcy5kaXNhYmxlTW91c2VTY3JvbGwoZSk7IH07XG4gICAgICAgICAgICAgICAgICAgIC8vdGhpcy5zY3JvbGxFbGVtZW50Lm9ubW91c2V3aGVlbCA9IHRoaXMubW91c2VTY3JvbGxIYW5kbGVyO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIodGhpcy5zY3JvbGxFbGVtZW50LCAnd2hlZWwnLCB0aGlzLm1vdXNlU2Nyb2xsSGFuZGxlcik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHRoaXMub3B0aW9ucy53aGVlbFNjcm9sbCA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm1vdXNlU2Nyb2xsSGFuZGxlciA9IGZ1bmN0aW9uIChlKSB7IHJldHVybiBfdGhpcy5hY3RpdmVNb3VzZVNjcm9sbChlKTsgfTtcbiAgICAgICAgICAgICAgICAgICAgLy90aGlzLnNjcm9sbEVsZW1lbnQub25tb3VzZXdoZWVsID0gdGhpcy5tb3VzZVNjcm9sbEhhbmRsZXI7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcih0aGlzLnNjcm9sbEVsZW1lbnQsICd3aGVlbCcsIHRoaXMubW91c2VTY3JvbGxIYW5kbGVyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLyogVE9ETzogbmVlZGVkLCB3aGVuIGdyaWRTaG93IGlzIHRydWUgKi9cbiAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMuZ3JpZFNob3cgPyB0aGlzLnNjYWxlVG8oMSkgOiBudWxsO1xuICAgICAgICAgICAgICAgIC8qIHdoZWVsem9vbSAqL1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMud2hlZWxab29tID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vdGhpcy5zY2FsZVRvKDEpOyAvKiBuZWVkZWQsIHdoZW4gZ3JpZFNob3cgaXMgdHJ1ZSAqL1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm1vdXNlWm9vbUhhbmRsZXIgPSBmdW5jdGlvbiAoZSkgeyByZXR1cm4gX3RoaXMuYWN0aXZlTW91c2Vab29tKGUpOyB9O1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIodGhpcy5zY3JvbGxFbGVtZW50LCAnd2hlZWwnLCB0aGlzLm1vdXNlWm9vbUhhbmRsZXIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvKiBzY3JvbGxoYW5kbGVyICovXG4gICAgICAgICAgICAgICAgdGhpcy5zY3JvbGxIYW5kbGVyID0gZnVuY3Rpb24gKGUpIHsgcmV0dXJuIF90aGlzLm9uU2Nyb2xsKGUpOyB9O1xuICAgICAgICAgICAgICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcih0aGlzLmNvbnRhaW5lciwgJ3Njcm9sbCcsIHRoaXMuc2Nyb2xsSGFuZGxlcik7XG4gICAgICAgICAgICAgICAgLyogaWYgdGhlIHNjcm9sbCBlbGVtZW50IGlzIGJvZHksIGFkanVzdCB0aGUgaW5uZXIgZGl2IHdoZW4gcmVzaXppbmcgKi9cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5pc0JvZHkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yZXNpemVIYW5kbGVyID0gZnVuY3Rpb24gKGUpIHsgcmV0dXJuIF90aGlzLm9uUmVzaXplKGUpOyB9OyAvL1RPRE86IHNhbWUgYXMgYWJvdmUgaW4gdGhlIHdoZWVsIGhhbmRsZXJcbiAgICAgICAgICAgICAgICAgICAgd2luZG93Lm9ucmVzaXplID0gdGhpcy5yZXNpemVIYW5kbGVyO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvKiBpZiBkcmFnc2Nyb2xsIGlzIGFjdGl2YXRlZCwgcmVnaXN0ZXIgbW91c2Vkb3duIGV2ZW50ICovXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5kcmFnU2Nyb2xsID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaW5uZXIuY2xhc3NOYW1lICs9IFwiIFwiICsgdGhpcy5jbGFzc0dyYWIgKyBcIiBcIjtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5tb3VzZURvd25IYW5kbGVyID0gZnVuY3Rpb24gKGUpIHsgcmV0dXJuIF90aGlzLm1vdXNlRG93bihlKTsgfTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKHRoaXMuaW5uZXIsICdtb3VzZWRvd24nLCB0aGlzLm1vdXNlRG93bkhhbmRsZXIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jb250YWluZXIuY2xhc3NOYW1lICs9IFwiIFwiICsgdGhpcy5jbGFzc05vR3JhYiArIFwiIFwiO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLmhhbmRsZUFuY2hvcnMgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGxpbmtzID0gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvckFsbChcImFbaHJlZl49JyMnXVwiKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5oYXNoQ2hhbmdlQ2xpY2tIYW5kbGVyID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0YXJnZXQgPSBlID8gZS50YXJnZXQgOiB3aW5kb3cuZXZlbnQuc3JjRWxlbWVudDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdGFyZ2V0ICE9ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogcHVzaFN0YXRlIGNoYW5nZXMgdGhlIGhhc2ggd2l0aG91dCB0cmlnZ2VyaW5nIGhhc2hjaGFuZ2UgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoaXN0b3J5LnB1c2hTdGF0ZSh7fSwgJycsIHRhcmdldC5ocmVmKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiB3ZSBkb24ndCB3YW50IHRvIHRyaWdnZXIgaGFzaGNoYW5nZSwgc28gcHJldmVudCBkZWZhdWx0IGJlaGF2aW9yIHdoZW4gY2xpY2tpbmcgb24gYW5jaG9yIGxpbmtzICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCA/IGUucHJldmVudERlZmF1bHQoKSA6IChlLnJldHVyblZhbHVlID0gZmFsc2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgLyogdHJpZ2dlciBhIGN1c3RvbSBoYXNoY2hhbmdlIGV2ZW50LCBiZWNhdXNlIHB1c2hTdGF0ZSBwcmV2ZW50cyB0aGUgcmVhbCBoYXNoY2hhbmdlIGV2ZW50ICovXG4gICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy50cmlnZ2VyRXZlbnQod2luZG93LCAnbXloYXNoY2hhbmdlJyk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIC8qIGxvb3AgdHJvdWdoIGFsbCBhbmNob3IgbGlua3MgaW4gdGhlIGVsZW1lbnQgYW5kIGRpc2FibGUgdGhlbSB0byBwcmV2ZW50IHRoZVxuICAgICAgICAgICAgICAgICAgICAgKiBicm93c2VyIGZyb20gc2Nyb2xsaW5nIGJlY2F1c2Ugb2YgdGhlIGNoYW5naW5nIGhhc2ggdmFsdWUuIEluc3RlYWQgdGhlIG93blxuICAgICAgICAgICAgICAgICAgICAgKiBldmVudCBteWhhc2hjaGFuZ2Ugc2hvdWxkIGhhbmRsZSBwYWdlIGFuZCBlbGVtZW50IHNjcm9sbGluZyAqL1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxpbmtzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIobGlua3NbaV0sICdjbGljaycsIHRoaXMuaGFzaENoYW5nZUNsaWNrSGFuZGxlciwgZmFsc2UpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaGFzaENoYW5nZUhhbmRsZXIgPSBmdW5jdGlvbiAoZSkgeyByZXR1cm4gX3RoaXMub25IYXNoQ2hhbmdlKGUpOyB9O1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIod2luZG93LCAnbXloYXNoY2hhbmdlJywgdGhpcy5oYXNoQ2hhbmdlSGFuZGxlcik7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcih3aW5kb3csICdoYXNoY2hhbmdlJywgdGhpcy5oYXNoQ2hhbmdlSGFuZGxlcik7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMub25IYXNoQ2hhbmdlKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogUmVpbml0aWFsaXplIHRoZSBzd29vc2ggZWxlbWVudFxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEByZXR1cm4ge1N3b29zaH0gLSBUaGUgU3dvb3NoIG9iamVjdCBpbnN0YW5jZVxuICAgICAgICAgICAgICogQFRPRE86IHByZXNlcnZlIHNjcm9sbCBwb3NpdGlvbiBpbiBpbml0KClcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgU3dvb3NoLnByb3RvdHlwZS5yZWluaXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5kZXN0cm95KCk7XG4gICAgICAgICAgICAgICAgdGhpcy5jbGFzc1VuaXF1ZSA9ICdzdy0nICsgTWF0aC5yYW5kb20oKS50b1N0cmluZygzNikuc3Vic3RyaW5nKDcpO1xuICAgICAgICAgICAgICAgIHRoaXMuaW5pdCgpO1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIC8qIEBUT0RPOiBTY3JvbGxXaWR0aCBhbmQgQ2xpZW50V2lkdGggU2Nyb2xsSGVpZ2h0IENsaWVudEhlaWdodCAqL1xuICAgICAgICAgICAgU3dvb3NoLnByb3RvdHlwZS5nZXRTY3JvbGxMZWZ0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnNjcm9sbEVsZW1lbnQuc2Nyb2xsTGVmdDtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBTd29vc2gucHJvdG90eXBlLnNldFNjcm9sbExlZnQgPSBmdW5jdGlvbiAobGVmdCkge1xuICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsRWxlbWVudC5zY3JvbGxMZWZ0ID0gbGVmdDtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBTd29vc2gucHJvdG90eXBlLmdldFNjcm9sbFRvcCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zY3JvbGxFbGVtZW50LnNjcm9sbFRvcDtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBTd29vc2gucHJvdG90eXBlLnNldFNjcm9sbFRvcCA9IGZ1bmN0aW9uICh0b3ApIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNjcm9sbEVsZW1lbnQuc2Nyb2xsVG9wID0gdG9wO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogSGFuZGxlIGhhc2hjaGFuZ2VzIHdpdGggb3duIHNjcm9sbCBmdW5jdGlvblxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBwYXJhbSB7RXZlbnR9IGUgLSB0aGUgaGFzaGNoYW5nZSBvciBteWhhc2hjaGFuZ2UgZXZlbnQsIG9yIG5vdGhpbmdcbiAgICAgICAgICAgICAqIEByZXR1cm4ge3ZvaWR9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIFN3b29zaC5wcm90b3R5cGUub25IYXNoQ2hhbmdlID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgICBpZiAoZSA9PT0gdm9pZCAwKSB7IGUgPSBudWxsOyB9XG4gICAgICAgICAgICAgICAgdmFyIGhhc2ggPSB3aW5kb3cubG9jYXRpb24uaGFzaC5zdWJzdHIoMSk7XG4gICAgICAgICAgICAgICAgaWYgKGhhc2ggIT0gJycpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGFuY2hvcnMgPSB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yQWxsKCcjJyArIGhhc2gpO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFuY2hvcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBlbGVtZW50ID0gYW5jaG9yc1tpXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjb250YWluZXIgPSBhbmNob3JzW2ldO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZmluZCB0aGUgbmV4dCBwYXJlbnQgd2hpY2ggaXMgYSBjb250YWluZXIgZWxlbWVudFxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG91dGVyUmUgPSBuZXcgUmVnRXhwKFwiIFwiICsgdGhpcy5jbGFzc091dGVyICsgXCIgXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG5leHRDb250YWluZXIgPSBlbGVtZW50O1xuICAgICAgICAgICAgICAgICAgICAgICAgd2hpbGUgKGNvbnRhaW5lciAmJiBjb250YWluZXIucGFyZW50RWxlbWVudCAmJiB0aGlzLmNvbnRhaW5lciAhPSBjb250YWluZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29udGFpbmVyLmNsYXNzTmFtZS5tYXRjaChvdXRlclJlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXh0Q29udGFpbmVyID0gY29udGFpbmVyO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250YWluZXIgPSBjb250YWluZXIucGFyZW50RWxlbWVudDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZS50eXBlID09ICdoYXNoY2hhbmdlJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBzY3JvbGxpbmcgaW5zdGFudGx5IGJhY2sgdG8gb3JpZ2luLCBiZWZvcmUgZG8gdGhlIGFuaW1hdGVkIHNjcm9sbCAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNjcm9sbFRvKHRoaXMub3JpZ2luU2Nyb2xsTGVmdCwgdGhpcy5vcmlnaW5TY3JvbGxUb3AsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNjcm9sbFRvRWxlbWVudChuZXh0Q29udGFpbmVyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFNjcm9sbCB0byBhbiBlbGVtZW50IGluIHRoZSBET01cbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbGVtZW50IC0gdGhlIEhUTUxFbGVtZW50IHRvIHNjcm9sbCB0b1xuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBTd29vc2gucHJvdG90eXBlLnNjcm9sbFRvRWxlbWVudCA9IGZ1bmN0aW9uIChlbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgLyogZ2V0IHJlbGF0aXZlIGNvb3JkcyBmcm9tIHRoZSBhbmNob3IgZWxlbWVudCAqL1xuICAgICAgICAgICAgICAgIHZhciB4ID0gKGVsZW1lbnQub2Zmc2V0TGVmdCAtIHRoaXMuY29udGFpbmVyLm9mZnNldExlZnQpICogdGhpcy5nZXRTY2FsZSgpO1xuICAgICAgICAgICAgICAgIHZhciB5ID0gKGVsZW1lbnQub2Zmc2V0VG9wIC0gdGhpcy5jb250YWluZXIub2Zmc2V0VG9wKSAqIHRoaXMuZ2V0U2NhbGUoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnNjcm9sbFRvKHgsIHkpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogV29ya2Fyb3VuZCB0byBtYW5pcHVsYXRlIDo6YmVmb3JlIENTUyBzdHlsZXMgd2l0aCBqYXZhc2NyaXB0XG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGNzc0NsYXNzIC0gdGhlIENTUyBjbGFzcyBuYW1lIHRvIGFkZCA6OmJlZm9yZSBwcm9wZXJ0aWVzXG4gICAgICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gY3NzUHJvcGVydHkgLSB0aGUgQ1NTIHByb3BlcnR5IHRvIHNldFxuICAgICAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGNzc1ZhbHVlIC0gdGhlIENTUyB2YWx1ZSB0byBzZXRcbiAgICAgICAgICAgICAqIEByZXR1cm4ge3ZvaWR9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIFN3b29zaC5wcm90b3R5cGUuYWRkQmVmb3JlQ1NTID0gZnVuY3Rpb24gKGNzc0NsYXNzLCBjc3NQcm9wZXJ0eSwgY3NzVmFsdWUpIHtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGRvY3VtZW50LnN0eWxlU2hlZXRzWzBdLmluc2VydFJ1bGUgPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICBkb2N1bWVudC5zdHlsZVNoZWV0c1swXS5pbnNlcnRSdWxlKCcuJyArIGNzc0NsYXNzICsgJzo6YmVmb3JlIHsgJyArIGNzc1Byb3BlcnR5ICsgJzogJyArIGNzc1ZhbHVlICsgJ30nLCAwKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAodHlwZW9mIGRvY3VtZW50LnN0eWxlU2hlZXRzWzBdLmFkZFJ1bGUgPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICBkb2N1bWVudC5zdHlsZVNoZWV0c1swXS5hZGRSdWxlKCcuJyArIGNzc0NsYXNzICsgJzo6YmVmb3JlJywgY3NzUHJvcGVydHkgKyAnOiAnICsgY3NzVmFsdWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEdldCBjb21wdXRlIHBpeGVsIG51bWJlciBvZiB0aGUgd2hvbGUgd2lkdGggb2YgYW4gZWxlbWVudHMgYm9yZGVyXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWwgLSB0aGUgSFRNTCBlbGVtZW50XG4gICAgICAgICAgICAgKiBAcmV0dXJuIHtudW1iZXJ9IC0gdGhlIGFtb3VudCBvZiBwaXhlbHNcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgU3dvb3NoLnByb3RvdHlwZS5nZXRCb3JkZXJXaWR0aCA9IGZ1bmN0aW9uIChlbCkge1xuICAgICAgICAgICAgICAgIHZhciBibCA9IHRoaXMuZ2V0U3R5bGUoZWwsICdib3JkZXJMZWZ0V2lkdGgnKTtcbiAgICAgICAgICAgICAgICBibCA9IGJsID09ICd0aGluJyA/IDEgOiBibCA9PSAnbWVkaXVtJyA/IDMgOiBibCA9PSAndGhpY2snID8gNSA6IHBhcnNlSW50KGJsLCAxMCkgIT0gTmFOID8gcGFyc2VJbnQoYmwsIDEwKSA6IDA7XG4gICAgICAgICAgICAgICAgdmFyIGJyID0gdGhpcy5nZXRTdHlsZShlbCwgJ2JvcmRlclJpZ2h0V2lkdGgnKTtcbiAgICAgICAgICAgICAgICBiciA9IGJyID09ICd0aGluJyA/IDEgOiBiciA9PSAnbWVkaXVtJyA/IDMgOiBiciA9PSAndGhpY2snID8gNSA6IHBhcnNlSW50KGJyLCAxMCkgIT0gTmFOID8gcGFyc2VJbnQoYnIsIDEwKSA6IDA7XG4gICAgICAgICAgICAgICAgdmFyIHBsID0gdGhpcy5nZXRTdHlsZShlbCwgJ3BhZGRpbmdMZWZ0Jyk7XG4gICAgICAgICAgICAgICAgcGwgPSBwbCA9PSAnYXV0bycgPyAwIDogcGFyc2VJbnQocGwsIDEwKSAhPSBOYU4gPyBwYXJzZUludChwbCwgMTApIDogMDtcbiAgICAgICAgICAgICAgICB2YXIgcHIgPSB0aGlzLmdldFN0eWxlKGVsLCAncGFkZGluZ1JpZ2h0Jyk7XG4gICAgICAgICAgICAgICAgcHIgPSBwciA9PSAnYXV0bycgPyAwIDogcGFyc2VJbnQocHIsIDEwKSAhPSBOYU4gPyBwYXJzZUludChwciwgMTApIDogMDtcbiAgICAgICAgICAgICAgICB2YXIgbWwgPSB0aGlzLmdldFN0eWxlKGVsLCAnbWFyZ2luTGVmdCcpO1xuICAgICAgICAgICAgICAgIG1sID0gbWwgPT0gJ2F1dG8nID8gMCA6IHBhcnNlSW50KG1sLCAxMCkgIT0gTmFOID8gcGFyc2VJbnQobWwsIDEwKSA6IDA7XG4gICAgICAgICAgICAgICAgdmFyIG1yID0gdGhpcy5nZXRTdHlsZShlbCwgJ21hcmdpblJpZ2h0Jyk7XG4gICAgICAgICAgICAgICAgbXIgPSBtciA9PSAnYXV0bycgPyAwIDogcGFyc2VJbnQobXIsIDEwKSAhPSBOYU4gPyBwYXJzZUludChtciwgMTApIDogMDtcbiAgICAgICAgICAgICAgICByZXR1cm4gKHBsICsgcHIgKyBibCArIGJyICsgbWwgKyBtcik7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBHZXQgY29tcHV0ZSBwaXhlbCBudW1iZXIgb2YgdGhlIHdob2xlIGhlaWdodCBvZiBhbiBlbGVtZW50cyBib3JkZXJcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbCAtIHRoZSBIVE1MIGVsZW1lbnRcbiAgICAgICAgICAgICAqIEByZXR1cm4ge251bWJlcn0gLSB0aGUgYW1vdW50IG9mIHBpeGVsc1xuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBTd29vc2gucHJvdG90eXBlLmdldEJvcmRlckhlaWdodCA9IGZ1bmN0aW9uIChlbCkge1xuICAgICAgICAgICAgICAgIHZhciBidCA9IHRoaXMuZ2V0U3R5bGUoZWwsICdib3JkZXJUb3BXaWR0aCcpO1xuICAgICAgICAgICAgICAgIGJ0ID0gYnQgPT0gJ3RoaW4nID8gMSA6IGJ0ID09ICdtZWRpdW0nID8gMyA6IGJ0ID09ICd0aGljaycgPyA1IDogcGFyc2VJbnQoYnQsIDEwKSAhPSBOYU4gPyBwYXJzZUludChidCwgMTApIDogMDtcbiAgICAgICAgICAgICAgICB2YXIgYmIgPSB0aGlzLmdldFN0eWxlKGVsLCAnYm9yZGVyQm90dG9tV2lkdGgnKTtcbiAgICAgICAgICAgICAgICBiYiA9IGJiID09ICd0aGluJyA/IDEgOiBiYiA9PSAnbWVkaXVtJyA/IDMgOiBiYiA9PSAndGhpY2snID8gNSA6IHBhcnNlSW50KGJiLCAxMCkgIT0gTmFOID8gcGFyc2VJbnQoYmIsIDEwKSA6IDA7XG4gICAgICAgICAgICAgICAgdmFyIHB0ID0gdGhpcy5nZXRTdHlsZShlbCwgJ3BhZGRpbmdUb3AnKTtcbiAgICAgICAgICAgICAgICBwdCA9IHB0ID09ICdhdXRvJyA/IDAgOiBwYXJzZUludChwdCwgMTApICE9IE5hTiA/IHBhcnNlSW50KHB0LCAxMCkgOiAwO1xuICAgICAgICAgICAgICAgIHZhciBwYiA9IHRoaXMuZ2V0U3R5bGUoZWwsICdwYWRkaW5nQm90dG9tJyk7XG4gICAgICAgICAgICAgICAgcGIgPSBwYiA9PSAnYXV0bycgPyAwIDogcGFyc2VJbnQocGIsIDEwKSAhPSBOYU4gPyBwYXJzZUludChwYiwgMTApIDogMDtcbiAgICAgICAgICAgICAgICB2YXIgbXQgPSB0aGlzLmdldFN0eWxlKGVsLCAnbWFyZ2luVG9wJyk7XG4gICAgICAgICAgICAgICAgbXQgPSBtdCA9PSAnYXV0bycgPyAwIDogcGFyc2VJbnQobXQsIDEwKSAhPSBOYU4gPyBwYXJzZUludChtdCwgMTApIDogMDtcbiAgICAgICAgICAgICAgICB2YXIgbWIgPSB0aGlzLmdldFN0eWxlKGVsLCAnbWFyZ2luQm90dG9tJyk7XG4gICAgICAgICAgICAgICAgbWIgPSBtYiA9PSAnYXV0bycgPyAwIDogcGFyc2VJbnQobWIsIDEwKSAhPSBOYU4gPyBwYXJzZUludChtYiwgMTApIDogMDtcbiAgICAgICAgICAgICAgICByZXR1cm4gKHB0ICsgcGIgKyBidCArIGJiICsgbXQgKyBtYik7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBEaXNhYmxlcyB0aGUgc2Nyb2xsIHdoZWVsIG9mIHRoZSBtb3VzZVxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBwYXJhbSB7TW91c2VXaGVlbEV2ZW50fSBlIC0gdGhlIG1vdXNlIHdoZWVsIGV2ZW50XG4gICAgICAgICAgICAgKiBAcmV0dXJuIHt2b2lkfVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBTd29vc2gucHJvdG90eXBlLmRpc2FibGVNb3VzZVNjcm9sbCA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuZWxlbWVudEJlaGluZEN1cnNvcklzTWUoZS5jbGllbnRYLCBlLmNsaWVudFkpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY2xlYXJUaW1lb3V0cygpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGUgPSB3aW5kb3cuZXZlbnQ7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCA/IGUucHJldmVudERlZmF1bHQoKSA6IChlLnJldHVyblZhbHVlID0gZmFsc2UpO1xuICAgICAgICAgICAgICAgICAgICBlLnJldHVyblZhbHVlID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogRGV0ZXJtaW5lIHdoZXRoZXIgYW4gZWxlbWVudCBoYXMgYSBzY3JvbGxiYXIgb3Igbm90XG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWxlbWVudCAtIHRoZSBIVE1MRWxlbWVudFxuICAgICAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGRpcmVjdGlvbiAtIGRldGVybWluZSB0aGUgdmVydGljYWwgb3IgaG9yaXpvbnRhbCBzY3JvbGxiYXI/XG4gICAgICAgICAgICAgKiBAcmV0dXJuIHtib29sZWFufSAtIHdoZXRoZXIgdGhlIGVsZW1lbnQgaGFzIHNjcm9sbGJhcnMgb3Igbm90XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIFN3b29zaC5wcm90b3R5cGUuaGFzU2Nyb2xsYmFyID0gZnVuY3Rpb24gKGVsZW1lbnQsIGRpcmVjdGlvbikge1xuICAgICAgICAgICAgICAgIHZhciBoYXMgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB2YXIgb3ZlcmZsb3cgPSAnb3ZlcmZsb3cnO1xuICAgICAgICAgICAgICAgIGlmIChkaXJlY3Rpb24gPT0gJ3ZlcnRpY2FsJykge1xuICAgICAgICAgICAgICAgICAgICBvdmVyZmxvdyA9ICdvdmVyZmxvd1knO1xuICAgICAgICAgICAgICAgICAgICBoYXMgPSBlbGVtZW50LnNjcm9sbEhlaWdodCA+IGVsZW1lbnQuY2xpZW50SGVpZ2h0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChkaXJlY3Rpb24gPT0gJ2hvcml6b250YWwnKSB7XG4gICAgICAgICAgICAgICAgICAgIG92ZXJmbG93ID0gJ292ZXJmbG93WCc7XG4gICAgICAgICAgICAgICAgICAgIGhhcyA9IGVsZW1lbnQuc2Nyb2xsV2lkdGggPiBlbGVtZW50LmNsaWVudFdpZHRoO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBDaGVjayB0aGUgb3ZlcmZsb3cgYW5kIG92ZXJmbG93RGlyZWN0aW9uIHByb3BlcnRpZXMgZm9yIFwiYXV0b1wiIGFuZCBcInZpc2libGVcIiB2YWx1ZXNcbiAgICAgICAgICAgICAgICBoYXMgPSB0aGlzLmdldFN0eWxlKHRoaXMuY29udGFpbmVyLCAnb3ZlcmZsb3cnKSA9PSBcInZpc2libGVcIlxuICAgICAgICAgICAgICAgICAgICB8fCB0aGlzLmdldFN0eWxlKHRoaXMuY29udGFpbmVyLCAnb3ZlcmZsb3dZJykgPT0gXCJ2aXNpYmxlXCJcbiAgICAgICAgICAgICAgICAgICAgfHwgKGhhcyAmJiB0aGlzLmdldFN0eWxlKHRoaXMuY29udGFpbmVyLCAnb3ZlcmZsb3cnKSA9PSBcImF1dG9cIilcbiAgICAgICAgICAgICAgICAgICAgfHwgKGhhcyAmJiB0aGlzLmdldFN0eWxlKHRoaXMuY29udGFpbmVyLCAnb3ZlcmZsb3dZJykgPT0gXCJhdXRvXCIpO1xuICAgICAgICAgICAgICAgIHJldHVybiBoYXM7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBFbmFibGVzIHRoZSBzY3JvbGwgd2hlZWwgb2YgdGhlIG1vdXNlIHRvIHNjcm9sbCwgc3BlY2lhbGx5IGZvciBkaXZzIHdpdGhvdXIgc2Nyb2xsYmFyXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQHBhcmFtIHtNb3VzZVdoZWVsRXZlbnR9IGUgLSB0aGUgbW91c2Ugd2hlZWwgZXZlbnRcbiAgICAgICAgICAgICAqIEByZXR1cm4ge3ZvaWR9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIFN3b29zaC5wcm90b3R5cGUuYWN0aXZlTW91c2VTY3JvbGwgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgIGlmICghZSkge1xuICAgICAgICAgICAgICAgICAgICBlID0gd2luZG93LmV2ZW50O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5lbGVtZW50QmVoaW5kQ3Vyc29ySXNNZShlLmNsaWVudFgsIGUuY2xpZW50WSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRpcmVjdGlvbjtcbiAgICAgICAgICAgICAgICAgICAgaWYgKFwiZGVsdGFZXCIgaW4gZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGlyZWN0aW9uID0gZS5kZWx0YVkgPiAwID8gJ2Rvd24nIDogJ3VwJztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChcIndoZWVsRGVsdGFcIiBpbiBlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkaXJlY3Rpb24gPSBlLndoZWVsRGVsdGEgPiAwID8gJ3VwJyA6ICdkb3duJztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAvKiB1c2UgdGhlIG5vcm1hbCBzY3JvbGwsIHdoZW4gdGhlcmUgYXJlIHNjcm9sbGJhcnMgYW5kIHRoZSBkaXJlY3Rpb24gaXMgXCJ2ZXJ0aWNhbFwiICovXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMud2hlZWxPcHRpb25zLmRpcmVjdGlvbiA9PSAndmVydGljYWwnICYmIHRoaXMuaGFzU2Nyb2xsYmFyKHRoaXMuc2Nyb2xsRWxlbWVudCwgdGhpcy5vcHRpb25zLndoZWVsT3B0aW9ucy5kaXJlY3Rpb24pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoISgodGhpcy50cmlnZ2VyZWQuY29sbGlkZUJvdHRvbSAmJiBkaXJlY3Rpb24gPT0gJ2Rvd24nKSB8fCAodGhpcy50cmlnZ2VyZWQuY29sbGlkZVRvcCAmJiBkaXJlY3Rpb24gPT0gJ3VwJykpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jbGVhclRpbWVvdXRzKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZGlzYWJsZU1vdXNlU2Nyb2xsKGUpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgeCA9IHRoaXMuZ2V0U2Nyb2xsTGVmdCgpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgeSA9IHRoaXMuZ2V0U2Nyb2xsVG9wKCk7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMud2hlZWxPcHRpb25zLmRpcmVjdGlvbiA9PSAnaG9yaXpvbnRhbCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHggPSB0aGlzLmdldFNjcm9sbExlZnQoKSArIChkaXJlY3Rpb24gPT0gJ2Rvd24nID8gdGhpcy5vcHRpb25zLndoZWVsT3B0aW9ucy5zdGVwIDogdGhpcy5vcHRpb25zLndoZWVsT3B0aW9ucy5zdGVwICogLTEpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKHRoaXMub3B0aW9ucy53aGVlbE9wdGlvbnMuZGlyZWN0aW9uID09ICd2ZXJ0aWNhbCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHkgPSB0aGlzLmdldFNjcm9sbFRvcCgpICsgKGRpcmVjdGlvbiA9PSAnZG93bicgPyB0aGlzLm9wdGlvbnMud2hlZWxPcHRpb25zLnN0ZXAgOiB0aGlzLm9wdGlvbnMud2hlZWxPcHRpb25zLnN0ZXAgKiAtMSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zY3JvbGxUbyh4LCB5LCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogRW5hYmxlcyB0aGUgc2Nyb2xsIHdoZWVsIG9mIHRoZSBtb3VzZSB0byB6b29tXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQHBhcmFtIHtNb3VzZVdoZWVsRXZlbnR9IGUgLSB0aGUgbW91c2Ugd2hlZWwgZXZlbnRcbiAgICAgICAgICAgICAqIEByZXR1cm4ge3ZvaWR9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIFN3b29zaC5wcm90b3R5cGUuYWN0aXZlTW91c2Vab29tID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgICBpZiAoIWUpIHtcbiAgICAgICAgICAgICAgICAgICAgZSA9IHdpbmRvdy5ldmVudDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuZWxlbWVudEJlaGluZEN1cnNvcklzTWUoZS5jbGllbnRYLCBlLmNsaWVudFkpKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBkaXJlY3Rpb247XG4gICAgICAgICAgICAgICAgICAgIGlmIChcImRlbHRhWVwiIGluIGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpcmVjdGlvbiA9IGUuZGVsdGFZID4gMCA/ICdkb3duJyA6ICd1cCc7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoXCJ3aGVlbERlbHRhXCIgaW4gZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGlyZWN0aW9uID0gZS53aGVlbERlbHRhID4gMCA/ICd1cCcgOiAnZG93bic7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKGRpcmVjdGlvbiA9PSB0aGlzLm9wdGlvbnMuem9vbU9wdGlvbnMuZGlyZWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgc2NhbGUgPSB0aGlzLmdldFNjYWxlKCkgKiAoMSArIHRoaXMub3B0aW9ucy56b29tT3B0aW9ucy5zdGVwKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzY2FsZSA9IHRoaXMuZ2V0U2NhbGUoKSAvICgxICsgdGhpcy5vcHRpb25zLnpvb21PcHRpb25zLnN0ZXApO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2NhbGVUbyhzY2FsZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQ2FsY3VsYXRlcyB0aGUgc2l6ZSBvZiB0aGUgdmVydGljYWwgc2Nyb2xsYmFyLlxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsIC0gVGhlIEhUTUxFbGVtZW1udFxuICAgICAgICAgICAgICogQHJldHVybiB7bnVtYmVyfSAtIHRoZSBhbW91bnQgb2YgcGl4ZWxzIHVzZWQgYnkgdGhlIHZlcnRpY2FsIHNjcm9sbGJhclxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBTd29vc2gucHJvdG90eXBlLnNjcm9sbGJhcldpZHRoID0gZnVuY3Rpb24gKGVsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGVsLm9mZnNldFdpZHRoIC0gZWwuY2xpZW50V2lkdGggLSBwYXJzZUludCh0aGlzLmdldFN0eWxlKGVsLCAnYm9yZGVyTGVmdFdpZHRoJykpIC0gcGFyc2VJbnQodGhpcy5nZXRTdHlsZShlbCwgJ2JvcmRlclJpZ2h0V2lkdGgnKSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBDYWxjdWxhdGVzIHRoZSBzaXplIG9mIHRoZSBob3Jpem9udGFsIHNjcm9sbGJhci5cbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbCAtIFRoZSBIVE1MRWxlbWVtbnRcbiAgICAgICAgICAgICAqIEByZXR1cm4ge251bWJlcn0gLSB0aGUgYW1vdW50IG9mIHBpeGVscyB1c2VkIGJ5IHRoZSBob3Jpem9udGFsIHNjcm9sbGJhclxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBTd29vc2gucHJvdG90eXBlLnNjcm9sbGJhckhlaWdodCA9IGZ1bmN0aW9uIChlbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBlbC5vZmZzZXRIZWlnaHQgLSBlbC5jbGllbnRIZWlnaHQgLSBwYXJzZUludCh0aGlzLmdldFN0eWxlKGVsLCAnYm9yZGVyVG9wV2lkdGgnKSkgLSBwYXJzZUludCh0aGlzLmdldFN0eWxlKGVsLCAnYm9yZGVyQm90dG9tV2lkdGgnKSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBSZXRyaWV2ZXMgdGhlIGN1cnJlbnQgc2NhbGUgdmFsdWUgb3IgMSBpZiBpdCBpcyBub3Qgc2V0LlxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEByZXR1cm4ge251bWJlcn0gLSB0aGUgY3VycmVudCBzY2FsZSB2YWx1ZVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBTd29vc2gucHJvdG90eXBlLmdldFNjYWxlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdGhpcy5pbm5lci5zdHlsZS50cmFuc2Zvcm0gIT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHIgPSB0aGlzLmlubmVyLnN0eWxlLnRyYW5zZm9ybS5tYXRjaCgvc2NhbGVcXCgoWzAtOSxcXC5dKylcXCkvKSB8fCBbXCJcIl07XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBwYXJzZUZsb2F0KHJbMV0pIHx8IDE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiAxO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogU2NhbGVzIHRoZSBpbm5lciBlbGVtZW50IGJ5IGEgcmVsYXRpY2UgdmFsdWUgYmFzZWQgb24gdGhlIGN1cnJlbnQgc2NhbGUgdmFsdWUuXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IHBlcmNlbnQgLSBwZXJjZW50YWdlIG9mIHRoZSBjdXJyZW50IHNjYWxlIHZhbHVlXG4gICAgICAgICAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IGhvbm91ckxpbWl0cyAtIHdoZXRoZXIgdG8gaG9ub3VyIG1heFNjYWxlIGFuZCB0aGUgbWluaW11bSB3aWR0aCBhbmQgaGVpZ2h0XG4gICAgICAgICAgICAgKiBvZiB0aGUgY29udGFpbmVyIGVsZW1lbnQuXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHt2b2lkfVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBTd29vc2gucHJvdG90eXBlLnNjYWxlQnkgPSBmdW5jdGlvbiAocGVyY2VudCwgaG9ub3VyTGltaXRzKSB7XG4gICAgICAgICAgICAgICAgaWYgKGhvbm91ckxpbWl0cyA9PT0gdm9pZCAwKSB7IGhvbm91ckxpbWl0cyA9IHRydWU7IH1cbiAgICAgICAgICAgICAgICB2YXIgc2NhbGUgPSB0aGlzLmdldFNjYWxlKCkgKiAocGVyY2VudCAvIDEwMCk7XG4gICAgICAgICAgICAgICAgdGhpcy5zY2FsZVRvKHNjYWxlLCBob25vdXJMaW1pdHMpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogU2NhbGVzIHRoZSBpbm5lciBlbGVtZW50IHRvIGFuIGFic29sdXRlIHZhbHVlLlxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSBzY2FsZSAtIHRoZSBzY2FsZVxuICAgICAgICAgICAgICogQHBhcmFtIHtib29sZWFufSBob25vdXJMaW1pdHMgLSB3aGV0aGVyIHRvIGhvbm91ciBtYXhTY2FsZSBhbmQgdGhlIG1pbmltdW0gd2lkdGggYW5kIGhlaWdodFxuICAgICAgICAgICAgICogb2YgdGhlIGNvbnRhaW5lciBlbGVtZW50LlxuICAgICAgICAgICAgICogQHJldHVybiB7dm9pZH1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgU3dvb3NoLnByb3RvdHlwZS5zY2FsZVRvID0gZnVuY3Rpb24gKHNjYWxlLCBob25vdXJMaW1pdHMpIHtcbiAgICAgICAgICAgICAgICBpZiAoaG9ub3VyTGltaXRzID09PSB2b2lkIDApIHsgaG9ub3VyTGltaXRzID0gdHJ1ZTsgfVxuICAgICAgICAgICAgICAgIHZhciB3aWR0aCA9IChwYXJzZUZsb2F0KHRoaXMuaW5uZXIuc3R5bGUubWluV2lkdGgpICogc2NhbGUpO1xuICAgICAgICAgICAgICAgIHZhciBoZWlnaHQgPSAocGFyc2VGbG9hdCh0aGlzLmlubmVyLnN0eWxlLm1pbkhlaWdodCkgKiBzY2FsZSk7XG4gICAgICAgICAgICAgICAgLyogU2Nyb2xsYmFycyBoYXZlIHdpZHRoIGFuZCBoZWlnaHQgdG9vICovXG4gICAgICAgICAgICAgICAgdmFyIG1pbldpZHRoID0gdGhpcy5jb250YWluZXIuY2xpZW50V2lkdGggKyB0aGlzLnNjcm9sbGJhcldpZHRoKHRoaXMuY29udGFpbmVyKTtcbiAgICAgICAgICAgICAgICB2YXIgbWluSGVpZ2h0ID0gdGhpcy5jb250YWluZXIuY2xpZW50SGVpZ2h0ICsgdGhpcy5zY3JvbGxiYXJIZWlnaHQodGhpcy5jb250YWluZXIpO1xuICAgICAgICAgICAgICAgIGlmIChob25vdXJMaW1pdHMpIHtcbiAgICAgICAgICAgICAgICAgICAgLyogbG9vcCBhcyBsb25nIGFzIGFsbCBsaW1pdHMgYXJlIGhvbm91cmVkICovXG4gICAgICAgICAgICAgICAgICAgIHdoaWxlICgoc2NhbGUgPiB0aGlzLm9wdGlvbnMuem9vbU9wdGlvbnMubWF4U2NhbGUgJiYgdGhpcy5vcHRpb25zLnpvb21PcHRpb25zLm1heFNjYWxlICE9IDApXG4gICAgICAgICAgICAgICAgICAgICAgICB8fCAoc2NhbGUgPCB0aGlzLm9wdGlvbnMuem9vbU9wdGlvbnMubWluU2NhbGUgJiYgdGhpcy5vcHRpb25zLnpvb21PcHRpb25zLm1pblNjYWxlICE9IDApXG4gICAgICAgICAgICAgICAgICAgICAgICB8fCAod2lkdGggPCB0aGlzLmNvbnRhaW5lci5jbGllbnRXaWR0aCAmJiAhdGhpcy5pc0JvZHkpXG4gICAgICAgICAgICAgICAgICAgICAgICB8fCBoZWlnaHQgPCB0aGlzLmNvbnRhaW5lci5jbGllbnRIZWlnaHQgJiYgIXRoaXMuaXNCb2R5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2NhbGUgPiB0aGlzLm9wdGlvbnMuem9vbU9wdGlvbnMubWF4U2NhbGUgJiYgdGhpcy5vcHRpb25zLnpvb21PcHRpb25zLm1heFNjYWxlICE9IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY2FsZSA9IHRoaXMub3B0aW9ucy56b29tT3B0aW9ucy5tYXhTY2FsZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWR0aCA9IE1hdGguZmxvb3IocGFyc2VJbnQodGhpcy5pbm5lci5zdHlsZS5taW5XaWR0aCkgKiBzY2FsZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0ID0gTWF0aC5mbG9vcihwYXJzZUludCh0aGlzLmlubmVyLnN0eWxlLm1pbkhlaWdodCkgKiBzY2FsZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2NhbGUgPCB0aGlzLm9wdGlvbnMuem9vbU9wdGlvbnMubWluU2NhbGUgJiYgdGhpcy5vcHRpb25zLnpvb21PcHRpb25zLm1pblNjYWxlICE9IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY2FsZSA9IHRoaXMub3B0aW9ucy56b29tT3B0aW9ucy5taW5TY2FsZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWR0aCA9IE1hdGguZmxvb3IocGFyc2VJbnQodGhpcy5pbm5lci5zdHlsZS5taW5XaWR0aCkgKiBzY2FsZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0ID0gTWF0aC5mbG9vcihwYXJzZUludCh0aGlzLmlubmVyLnN0eWxlLm1pbkhlaWdodCkgKiBzY2FsZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAod2lkdGggPCBtaW5XaWR0aCAmJiAhdGhpcy5pc0JvZHkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY2FsZSA9IHNjYWxlIC8gd2lkdGggKiBtaW5XaWR0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQgPSBNYXRoLmZsb29yKHBhcnNlSW50KHRoaXMuaW5uZXIuc3R5bGUubWluSGVpZ2h0KSAqIHNjYWxlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWR0aCA9IG1pbldpZHRoO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGhlaWdodCA8IG1pbkhlaWdodCAmJiAhdGhpcy5pc0JvZHkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY2FsZSA9IHNjYWxlIC8gaGVpZ2h0ICogbWluSGVpZ2h0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoID0gTWF0aC5mbG9vcihwYXJzZUludCh0aGlzLmlubmVyLnN0eWxlLm1pbldpZHRoKSAqIHNjYWxlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQgPSBtaW5IZWlnaHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy9jb25zb2xlLmxvZyhcInNjYWxlVG8oKTogXCIsIHNjYWxlLCBcIiAtLS0tPiBcIiwgd2lkdGgsIFwiIHggXCIsIGhlaWdodCwgXCIgb3JpZzogXCIsIHRoaXMuY29udGFpbmVyLmNsaWVudFdpZHRoLCBcIiB4IFwiLCB0aGlzLmNvbnRhaW5lci5jbGllbnRIZWlnaHQsIFwiIHJlYWw6IFwiLCBtaW5XaWR0aCwgXCIgeCBcIiwgbWluSGVpZ2h0KTtcbiAgICAgICAgICAgICAgICB0aGlzLmlubmVyLnN0eWxlLnRyYW5zZm9ybSA9ICd0cmFuc2xhdGUoMHB4LCAwcHgpIHNjYWxlKCcgKyBzY2FsZSArICcpJztcbiAgICAgICAgICAgICAgICB0aGlzLnNjYWxlRWxlbWVudC5zdHlsZS5taW5XaWR0aCA9IHRoaXMuc2NhbGVFbGVtZW50LnN0eWxlLndpZHRoID0gd2lkdGggKyAncHgnO1xuICAgICAgICAgICAgICAgIHRoaXMuc2NhbGVFbGVtZW50LnN0eWxlLm1pbkhlaWdodCA9IHRoaXMuc2NhbGVFbGVtZW50LnN0eWxlLmhlaWdodCA9IGhlaWdodCArICdweCc7XG4gICAgICAgICAgICAgICAgLyogVE9ETzogaGVyZSBzY3JvbGxUbyBiYXNlZCBvbiB3aGVyZSB0aGUgbW91c2UgY3Vyc29yIGlzICovXG4gICAgICAgICAgICAgICAgLy90aGlzLnNjcm9sbFRvKCk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBEaXNhYmxlcyB0aGUgc2Nyb2xsIHdoZWVsIG9mIHRoZSBtb3VzZVxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSB4IC0gdGhlIHgtY29vcmRpbmF0ZXNcbiAgICAgICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSB5IC0gdGhlIHktY29vcmRpbmF0ZXNcbiAgICAgICAgICAgICAqIEByZXR1cm4ge2Jvb2xlYW59IC0gd2hldGhlciB0aGUgbmVhcmVzdCByZWxhdGVkIHBhcmVudCBpbm5lciBlbGVtZW50IGlzIHRoZSBvbmUgb2YgdGhpcyBvYmplY3QgaW5zdGFuY2VcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgU3dvb3NoLnByb3RvdHlwZS5lbGVtZW50QmVoaW5kQ3Vyc29ySXNNZSA9IGZ1bmN0aW9uICh4LCB5KSB7XG4gICAgICAgICAgICAgICAgdmFyIGVsZW1lbnRCZWhpbmRDdXJzb3IgPSBkb2N1bWVudC5lbGVtZW50RnJvbVBvaW50KHgsIHkpO1xuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIElmIHRoZSBlbGVtZW50IGRpcmVjdGx5IGJlaGluZCB0aGUgY3Vyc29yIGlzIGFuIG91dGVyIGVsZW1lbnQgdGhyb3cgb3V0LCBiZWNhdXNlIHdoZW4gY2xpY2tpbmcgb24gYSBzY3JvbGxiYXJcbiAgICAgICAgICAgICAgICAgKiBmcm9tIGEgZGl2LCBhIGRyYWcgb2YgdGhlIHBhcmVudCBTd29vc2ggZWxlbWVudCBpcyBpbml0aWF0ZWQuXG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgdmFyIG91dGVyUmUgPSBuZXcgUmVnRXhwKFwiIFwiICsgdGhpcy5jbGFzc091dGVyICsgXCIgXCIpO1xuICAgICAgICAgICAgICAgIGlmIChlbGVtZW50QmVoaW5kQ3Vyc29yLmNsYXNzTmFtZS5tYXRjaChvdXRlclJlKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8qIGZpbmQgdGhlIG5leHQgcGFyZW50IHdoaWNoIGlzIGFuIGlubmVyIGVsZW1lbnQgKi9cbiAgICAgICAgICAgICAgICB2YXIgaW5uZXJSZSA9IG5ldyBSZWdFeHAoXCIgXCIgKyB0aGlzLmNsYXNzSW5uZXIgKyBcIiBcIik7XG4gICAgICAgICAgICAgICAgd2hpbGUgKGVsZW1lbnRCZWhpbmRDdXJzb3IgJiYgIWVsZW1lbnRCZWhpbmRDdXJzb3IuY2xhc3NOYW1lLm1hdGNoKGlubmVyUmUpKSB7XG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnRCZWhpbmRDdXJzb3IgPSBlbGVtZW50QmVoaW5kQ3Vyc29yLnBhcmVudEVsZW1lbnQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmlubmVyID09IGVsZW1lbnRCZWhpbmRDdXJzb3I7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgU3dvb3NoLnByb3RvdHlwZS5nZXRUaW1lc3RhbXAgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB3aW5kb3cucGVyZm9ybWFuY2UgPT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHdpbmRvdy5wZXJmb3JtYW5jZS5ub3cgPyB3aW5kb3cucGVyZm9ybWFuY2Uubm93KCkgOiB3aW5kb3cucGVyZm9ybWFuY2Uud2Via2l0Tm93KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogU2Nyb2xsIGhhbmRsZXIgdG8gdHJpZ2dlciB0aGUgY3VzdG9tIGV2ZW50c1xuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBwYXJhbSB7RXZlbnR9IGUgLSBUaGUgc2Nyb2xsIGV2ZW50IG9iamVjdCAoVE9ETzogbmVlZGVkPylcbiAgICAgICAgICAgICAqIEB0aHJvd3MgRXZlbnQgY29sbGlkZUxlZnRcbiAgICAgICAgICAgICAqIEB0aHJvd3MgRXZlbnQgY29sbGlkZVJpZ2h0XG4gICAgICAgICAgICAgKiBAdGhyb3dzIEV2ZW50IGNvbGxpZGVUb3BcbiAgICAgICAgICAgICAqIEB0aHJvd3MgRXZlbnQgY29sbGlkZUJvdHRvbVxuICAgICAgICAgICAgICogQHJldHVybiB7dm9pZH1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgU3dvb3NoLnByb3RvdHlwZS5vblNjcm9sbCA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgdmFyIHggPSB0aGlzLmdldFNjcm9sbExlZnQoKTtcbiAgICAgICAgICAgICAgICB2YXIgeSA9IHRoaXMuZ2V0U2Nyb2xsVG9wKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5zY3JvbGxNYXhMZWZ0ID0gKHRoaXMuc2Nyb2xsRWxlbWVudC5zY3JvbGxXaWR0aCAtIHRoaXMuc2Nyb2xsRWxlbWVudC5jbGllbnRXaWR0aCk7XG4gICAgICAgICAgICAgICAgdGhpcy5zY3JvbGxNYXhUb3AgPSAodGhpcy5zY3JvbGxFbGVtZW50LnNjcm9sbEhlaWdodCAtIHRoaXMuc2Nyb2xsRWxlbWVudC5jbGllbnRIZWlnaHQpO1xuICAgICAgICAgICAgICAgIC8vIHRoZSBjb2xsaWRlTGVmdCBldmVudFxuICAgICAgICAgICAgICAgIGlmICh4ID09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50cmlnZ2VyZWQuY29sbGlkZUxlZnQgPyBudWxsIDogdGhpcy50cmlnZ2VyRXZlbnQodGhpcy5pbm5lciwgJ2NvbGxpZGUubGVmdCcpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnRyaWdnZXJlZC5jb2xsaWRlTGVmdCA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnRyaWdnZXJlZC5jb2xsaWRlTGVmdCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyB0aGUgY29sbGlkZVRvcCBldmVudFxuICAgICAgICAgICAgICAgIGlmICh5ID09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50cmlnZ2VyZWQuY29sbGlkZVRvcCA/IG51bGwgOiB0aGlzLnRyaWdnZXJFdmVudCh0aGlzLmlubmVyLCAnY29sbGlkZS50b3AnKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50cmlnZ2VyZWQuY29sbGlkZVRvcCA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnRyaWdnZXJlZC5jb2xsaWRlVG9wID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIHRoZSBjb2xsaWRlUmlnaHQgZXZlbnRcbiAgICAgICAgICAgICAgICBpZiAoeCA9PSB0aGlzLnNjcm9sbE1heExlZnQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50cmlnZ2VyZWQuY29sbGlkZVJpZ2h0ID8gbnVsbCA6IHRoaXMudHJpZ2dlckV2ZW50KHRoaXMuaW5uZXIsICdjb2xsaWRlLnJpZ2h0Jyk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudHJpZ2dlcmVkLmNvbGxpZGVSaWdodCA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnRyaWdnZXJlZC5jb2xsaWRlUmlnaHQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gdGhlIGNvbGxpZGVCb3R0b20gZXZlbnRcbiAgICAgICAgICAgICAgICBpZiAoeSA9PSB0aGlzLnNjcm9sbE1heFRvcCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnRyaWdnZXJlZC5jb2xsaWRlQm90dG9tID8gbnVsbCA6IHRoaXMudHJpZ2dlckV2ZW50KHRoaXMuaW5uZXIsICdjb2xsaWRlLmJvdHRvbScpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnRyaWdnZXJlZC5jb2xsaWRlQm90dG9tID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudHJpZ2dlcmVkLmNvbGxpZGVCb3R0b20gPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiB3aW5kb3cgcmVzaXplIGhhbmRsZXIgdG8gcmVjYWxjdWxhdGUgdGhlIGlubmVyIGRpdiBtaW5XaWR0aCBhbmQgbWluSGVpZ2h0XG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQHBhcmFtIHtFdmVudH0gZSAtIFRoZSB3aW5kb3cgcmVzaXplIGV2ZW50IG9iamVjdCAoVE9ETzogbmVlZGVkPylcbiAgICAgICAgICAgICAqIEByZXR1cm4ge3ZvaWR9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIFN3b29zaC5wcm90b3R5cGUub25SZXNpemUgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgICAgICAgICAgdmFyIG9uUmVzaXplID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBfdGhpcy5pbm5lci5zdHlsZS5taW5XaWR0aCA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIF90aGlzLmlubmVyLnN0eWxlLm1pbkhlaWdodCA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIC8qIHRha2UgYXdheSB0aGUgbWFyZ2luIHZhbHVlcyBvZiB0aGUgYm9keSBlbGVtZW50ICovXG4gICAgICAgICAgICAgICAgICAgIHZhciB4RGVsdGEgPSBwYXJzZUludChfdGhpcy5nZXRTdHlsZShkb2N1bWVudC5ib2R5LCAnbWFyZ2luTGVmdCcpLCAxMCkgKyBwYXJzZUludChfdGhpcy5nZXRTdHlsZShkb2N1bWVudC5ib2R5LCAnbWFyZ2luUmlnaHQnKSwgMTApO1xuICAgICAgICAgICAgICAgICAgICB2YXIgeURlbHRhID0gcGFyc2VJbnQoX3RoaXMuZ2V0U3R5bGUoZG9jdW1lbnQuYm9keSwgJ21hcmdpblRvcCcpLCAxMCkgKyBwYXJzZUludChfdGhpcy5nZXRTdHlsZShkb2N1bWVudC5ib2R5LCAnbWFyZ2luQm90dG9tJyksIDEwKTtcbiAgICAgICAgICAgICAgICAgICAgLy9UT0RPOiB3aXRoIHRoaXMuZ2V0Qm9yZGVyV2lkdGgoKSBhbmQgdGhpcy5nZXRCb3JkZXJIZWlnaHQoKVxuICAgICAgICAgICAgICAgICAgICBfdGhpcy5pbm5lci5zdHlsZS5taW5XaWR0aCA9IChkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsV2lkdGggLSB4RGVsdGEpICsgJ3B4JztcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMuaW5uZXIuc3R5bGUubWluSGVpZ2h0ID0gKGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zY3JvbGxIZWlnaHQgLSB5RGVsdGEgLSAxMDApICsgJ3B4JzsgLy9UT0RPOiBXVEY/IHdoeSAtMTAwIGZvciBJRTg/XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBUcmlnZ2VyIHRoZSBmdW5jdGlvbiBvbmx5IHdoZW4gdGhlIGNsaWVudFdpZHRoIG9yIGNsaWVudEhlaWdodCByZWFsbHkgaGF2ZSBjaGFuZ2VkLlxuICAgICAgICAgICAgICAgICAqIElFOCByZXNpZGVzIGluIGFuIGluZmluaXR5IGxvb3AgYWx3YXlzIHRyaWdnZXJpbmcgdGhlIHJlc2l0ZSBldmVudCB3aGVuIGFsdGVyaW5nIGNzcy5cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5vbGRDbGllbnRXaWR0aCAhPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50V2lkdGggfHwgdGhpcy5vbGRDbGllbnRIZWlnaHQgIT0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudEhlaWdodCkge1xuICAgICAgICAgICAgICAgICAgICB3aW5kb3cuY2xlYXJUaW1lb3V0KHRoaXMucmVzaXplVGltZW91dCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVzaXplVGltZW91dCA9IHdpbmRvdy5zZXRUaW1lb3V0KG9uUmVzaXplLCAxMCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8qIHdyaXRlIGRvd24gdGhlIG9sZCBjbGllbnRXaWR0aCBhbmQgY2xpZW50SGVpZ2h0IGZvciB0aGUgYWJvdmUgY29tcGFyc2lvbiAqL1xuICAgICAgICAgICAgICAgIHRoaXMub2xkQ2xpZW50V2lkdGggPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50V2lkdGg7XG4gICAgICAgICAgICAgICAgdGhpcy5vbGRDbGllbnRIZWlnaHQgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50SGVpZ2h0O1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIFN3b29zaC5wcm90b3R5cGUuY2xlYXJUZXh0U2VsZWN0aW9uID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmICh3aW5kb3cuZ2V0U2VsZWN0aW9uKVxuICAgICAgICAgICAgICAgICAgICB3aW5kb3cuZ2V0U2VsZWN0aW9uKCkucmVtb3ZlQWxsUmFuZ2VzKCk7XG4gICAgICAgICAgICAgICAgaWYgKGRvY3VtZW50LnNlbGVjdGlvbilcbiAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQuc2VsZWN0aW9uLmVtcHR5KCk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBCcm93c2VyIGluZGVwZW5kZW50IGV2ZW50IHJlZ2lzdHJhdGlvblxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBwYXJhbSB7YW55fSBvYmogLSBUaGUgSFRNTEVsZW1lbnQgdG8gYXR0YWNoIHRoZSBldmVudCB0b1xuICAgICAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50IC0gVGhlIGV2ZW50IG5hbWUgd2l0aG91dCB0aGUgbGVhZGluZyBcIm9uXCJcbiAgICAgICAgICAgICAqIEBwYXJhbSB7KGU6IEV2ZW50KSA9PiB2b2lkfSBjYWxsYmFjayAtIEEgY2FsbGJhY2sgZnVuY3Rpb24gdG8gYXR0YWNoIHRvIHRoZSBldmVudFxuICAgICAgICAgICAgICogQHBhcmFtIHtib29sZWFufSBib3VuZCAtIHdoZXRoZXIgdG8gYmluZCB0aGUgY2FsbGJhY2sgdG8gdGhlIG9iamVjdCBpbnN0YW5jZSBvciBub3RcbiAgICAgICAgICAgICAqIEByZXR1cm4ge3ZvaWR9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIFN3b29zaC5wcm90b3R5cGUuYWRkRXZlbnRMaXN0ZW5lciA9IGZ1bmN0aW9uIChvYmosIGV2ZW50LCBjYWxsYmFjaywgYm91bmQpIHtcbiAgICAgICAgICAgICAgICBpZiAoYm91bmQgPT09IHZvaWQgMCkgeyBib3VuZCA9IHRydWU7IH1cbiAgICAgICAgICAgICAgICB2YXIgYm91bmRDYWxsYmFjayA9IGJvdW5kID8gY2FsbGJhY2suYmluZCh0aGlzKSA6IGNhbGxiYWNrO1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2Ygb2JqLmFkZEV2ZW50TGlzdGVuZXIgPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICBpZiAobWFwRXZlbnRzWydvbicgKyBldmVudF0gJiYgb2JqLnRhZ05hbWUgPT0gXCJCT0RZXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG9iaiA9IG1hcEV2ZW50c1snb24nICsgZXZlbnRdO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIG9iai5hZGRFdmVudExpc3RlbmVyKGV2ZW50LCBib3VuZENhbGxiYWNrKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAodHlwZW9mIG9iai5hdHRhY2hFdmVudCA9PSAnb2JqZWN0JyAmJiBodG1sRXZlbnRzWydvbicgKyBldmVudF0pIHtcbiAgICAgICAgICAgICAgICAgICAgb2JqLmF0dGFjaEV2ZW50KCdvbicgKyBldmVudCwgYm91bmRDYWxsYmFjayk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHR5cGVvZiBvYmouYXR0YWNoRXZlbnQgPT0gJ29iamVjdCcgJiYgbWFwRXZlbnRzWydvbicgKyBldmVudF0pIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9iai50YWdOYW1lID09IFwiQk9EWVwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcCA9ICdvbicgKyBldmVudDtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIGV4YW1wbGU6IHdpbmRvdy5vbnNjcm9sbCA9IGJvdW5kQ2FsbGJhY2sgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIG1hcEV2ZW50c1twXVtwXSA9IGJvdW5kQ2FsbGJhY2s7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBUT0RPOiBvYmoub25zY3JvbGwgPz8gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIG9iai5vbnNjcm9sbCA9IGJvdW5kQ2FsbGJhY2s7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAodHlwZW9mIG9iai5hdHRhY2hFdmVudCA9PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgICAgICAgICBvYmpbZXZlbnRdID0gMTtcbiAgICAgICAgICAgICAgICAgICAgYm91bmRDYWxsYmFjayA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBUT0RPOiBlIGlzIHRoZSBvbnByb3BlcnR5Y2hhbmdlIGV2ZW50IG5vdCBvbmUgb2YgdGhlIGN1c3RvbSBldmVudCBvYmplY3RzICovXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZS5wcm9wZXJ0eU5hbWUgPT0gZXZlbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgb2JqLmF0dGFjaEV2ZW50KCdvbnByb3BlcnR5Y2hhbmdlJywgYm91bmRDYWxsYmFjayk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBvYmpbJ29uJyArIGV2ZW50XSA9IGJvdW5kQ2FsbGJhY2s7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuY3VzdG9tRXZlbnRzW2V2ZW50XSA/IG51bGwgOiAodGhpcy5jdXN0b21FdmVudHNbZXZlbnRdID0gW10pO1xuICAgICAgICAgICAgICAgIHRoaXMuY3VzdG9tRXZlbnRzW2V2ZW50XS5wdXNoKFtjYWxsYmFjaywgYm91bmRDYWxsYmFja10pO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQnJvd3NlciBpbmRlcGVuZGVudCBldmVudCBkZXJlZ2lzdHJhdGlvblxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBwYXJhbSB7YW55fSBvYmogLSBUaGUgSFRNTEVsZW1lbnQgb3Igd2luZG93IHdob3NlIGV2ZW50IHNob3VsZCBiZSBkZXRhY2hlZFxuICAgICAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50IC0gVGhlIGV2ZW50IG5hbWUgd2l0aG91dCB0aGUgbGVhZGluZyBcIm9uXCJcbiAgICAgICAgICAgICAqIEBwYXJhbSB7KGU6IEV2ZW50KSA9PiB2b2lkfSBjYWxsYmFjayAtIFRoZSBjYWxsYmFjayBmdW5jdGlvbiB3aGVuIGF0dGFjaGVkXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHt2b2lkfVxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBUT0RPOiB1bnJlZ2lzdGVyaW5nIG9mIG1hcEV2ZW50c1xuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBTd29vc2gucHJvdG90eXBlLnJlbW92ZUV2ZW50TGlzdGVuZXIgPSBmdW5jdGlvbiAob2JqLCBldmVudCwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnQgaW4gdGhpcy5jdXN0b21FdmVudHMpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSBpbiB0aGlzLmN1c3RvbUV2ZW50c1tldmVudF0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIGlmIHRoZSBldmVudCB3YXMgZm91bmQgaW4gdGhlIGFycmF5IGJ5IGl0cyBjYWxsYmFjayByZWZlcmVuY2UgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmN1c3RvbUV2ZW50c1tldmVudF1baV1bMF0gPT0gY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiByZW1vdmUgdGhlIGxpc3RlbmVyIGZyb20gdGhlIGFycmF5IGJ5IGl0cyBib3VuZCBjYWxsYmFjayByZWZlcmVuY2UgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayA9IHRoaXMuY3VzdG9tRXZlbnRzW2V2ZW50XVtpXVsxXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmN1c3RvbUV2ZW50c1tldmVudF0uc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2Ygb2JqLnJlbW92ZUV2ZW50TGlzdGVuZXIgPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICBvYmoucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudCwgY2FsbGJhY2spO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmICh0eXBlb2Ygb2JqLmRldGFjaEV2ZW50ID09ICdvYmplY3QnICYmIGh0bWxFdmVudHNbJ29uJyArIGV2ZW50XSkge1xuICAgICAgICAgICAgICAgICAgICBvYmouZGV0YWNoRXZlbnQoJ29uJyArIGV2ZW50LCBjYWxsYmFjayk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHR5cGVvZiBvYmouZGV0YWNoRXZlbnQgPT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgICAgICAgICAgb2JqLmRldGFjaEV2ZW50KCdvbnByb3BlcnR5Y2hhbmdlJywgY2FsbGJhY2spO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgb2JqWydvbicgKyBldmVudF0gPSBudWxsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEJyb3dzZXIgaW5kZXBlbmRlbnQgZXZlbnQgdHJpZ2dlciBmdW5jdGlvblxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IG9iaiAtIFRoZSBIVE1MRWxlbWVudCB3aGljaCB0cmlnZ2VycyB0aGUgZXZlbnRcbiAgICAgICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBldmVudE5hbWUgLSBUaGUgZXZlbnQgbmFtZSB3aXRob3V0IHRoZSBsZWFkaW5nIFwib25cIlxuICAgICAgICAgICAgICogQHJldHVybiB7dm9pZH1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgU3dvb3NoLnByb3RvdHlwZS50cmlnZ2VyRXZlbnQgPSBmdW5jdGlvbiAob2JqLCBldmVudE5hbWUpIHtcbiAgICAgICAgICAgICAgICB2YXIgZXZlbnQ7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB3aW5kb3cuQ3VzdG9tRXZlbnQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQgPSBuZXcgQ3VzdG9tRXZlbnQoZXZlbnROYW1lKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAodHlwZW9mIGRvY3VtZW50LmNyZWF0ZUV2ZW50ID09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudChcIkhUTUxFdmVudHNcIik7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LmluaXRFdmVudChldmVudE5hbWUsIHRydWUsIHRydWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChkb2N1bWVudC5jcmVhdGVFdmVudE9iamVjdCkge1xuICAgICAgICAgICAgICAgICAgICBldmVudCA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50T2JqZWN0KCk7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LmV2ZW50VHlwZSA9IGV2ZW50TmFtZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZXZlbnQuZXZlbnROYW1lID0gZXZlbnROYW1lO1xuICAgICAgICAgICAgICAgIGlmIChvYmouZGlzcGF0Y2hFdmVudCkge1xuICAgICAgICAgICAgICAgICAgICBvYmouZGlzcGF0Y2hFdmVudChldmVudCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKG9ialtldmVudE5hbWVdKSB7XG4gICAgICAgICAgICAgICAgICAgIG9ialtldmVudE5hbWVdKys7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKG9iai5maXJlRXZlbnQgJiYgaHRtbEV2ZW50c1snb24nICsgZXZlbnROYW1lXSkge1xuICAgICAgICAgICAgICAgICAgICBvYmouZmlyZUV2ZW50KCdvbicgKyBldmVudC5ldmVudFR5cGUsIGV2ZW50KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAob2JqW2V2ZW50TmFtZV0pIHtcbiAgICAgICAgICAgICAgICAgICAgb2JqW2V2ZW50TmFtZV0oKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAob2JqWydvbicgKyBldmVudE5hbWVdKSB7XG4gICAgICAgICAgICAgICAgICAgIG9ialsnb24nICsgZXZlbnROYW1lXSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEdldCBhIGNzcyBzdHlsZSBwcm9wZXJ0eSB2YWx1ZSBicm93c2VyIGluZGVwZW5kZW50XG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWwgLSBUaGUgSFRNTEVsZW1lbnQgdG8gbG9va3VwXG4gICAgICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30ganNQcm9wZXJ0eSAtIFRoZSBjc3MgcHJvcGVydHkgbmFtZSBpbiBqYXZhc2NyaXB0IGluIGNhbWVsQ2FzZSAoZS5nLiBcIm1hcmdpbkxlZnRcIiwgbm90IFwibWFyZ2luLWxlZnRcIilcbiAgICAgICAgICAgICAqIEByZXR1cm4ge3N0cmluZ30gLSB0aGUgcHJvcGVydHkgdmFsdWVcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgU3dvb3NoLnByb3RvdHlwZS5nZXRTdHlsZSA9IGZ1bmN0aW9uIChlbCwganNQcm9wZXJ0eSkge1xuICAgICAgICAgICAgICAgIHZhciBjc3NQcm9wZXJ0eSA9IGpzUHJvcGVydHkucmVwbGFjZSgvKFtBLVpdKS9nLCBcIi0kMVwiKS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2Ygd2luZG93LmdldENvbXB1dGVkU3R5bGUgPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gd2luZG93LmdldENvbXB1dGVkU3R5bGUoZWwpLmdldFByb3BlcnR5VmFsdWUoY3NzUHJvcGVydHkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGVsLmN1cnJlbnRTdHlsZVtqc1Byb3BlcnR5XTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgU3dvb3NoLnByb3RvdHlwZS5jbGVhclRpbWVvdXRzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLnRpbWVvdXRzKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGlkeCBpbiB0aGlzLnRpbWVvdXRzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQodGhpcy50aW1lb3V0c1tpZHhdKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy50aW1lb3V0cy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnRpbWVvdXRzID0gW107XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlbW92ZUV2ZW50TGlzdGVuZXIodGhpcy5pbm5lciwgJ2NvbGxpZGUubGVmdCcsIHRoaXMuY2xlYXJMaXN0ZW5lckxlZnQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKHRoaXMuaW5uZXIsICdjb2xsaWRlLnJpZ2h0JywgdGhpcy5jbGVhckxpc3RlbmVyUmlnaHQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKHRoaXMuaW5uZXIsICdjb2xsaWRlLnRvcCcsIHRoaXMuY2xlYXJMaXN0ZW5lclRvcCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlbW92ZUV2ZW50TGlzdGVuZXIodGhpcy5pbm5lciwgJ2NvbGxpZGUuYm90dG9tJywgdGhpcy5jbGVhckxpc3RlbmVyQm90dG9tKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIE1vdXNlIGRvd24gaGFuZGxlclxuICAgICAgICAgICAgICogUmVnaXN0ZXJzIHRoZSBtb3VzZW1vdmUgYW5kIG1vdXNldXAgaGFuZGxlcnMgYW5kIGZpbmRzIHRoZSBuZXh0IGlubmVyIGVsZW1lbnRcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAcGFyYW0ge01vdXNlRXZlbnR9IGUgLSBUaGUgbW91c2UgZG93biBldmVudCBvYmplY3RcbiAgICAgICAgICAgICAqIEByZXR1cm4ge3ZvaWR9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIFN3b29zaC5wcm90b3R5cGUubW91c2VEb3duID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICAgICAgICAgIHRoaXMuY2xlYXJUaW1lb3V0cygpO1xuICAgICAgICAgICAgICAgIHRoaXMudnggPSB0aGlzLnZ5ID0gMDtcbiAgICAgICAgICAgICAgICAvKiBkcmFnIG9ubHkgaWYgdGhlIGxlZnQgbW91c2UgYnV0dG9uIHdhcyBwcmVzc2VkICovXG4gICAgICAgICAgICAgICAgaWYgKChcIndoaWNoXCIgaW4gZSAmJiBlLndoaWNoID09IDEpIHx8ICh0eXBlb2YgZS53aGljaCA9PSAndW5kZWZpbmVkJyAmJiBcImJ1dHRvblwiIGluIGUgJiYgZS5idXR0b24gPT0gMSkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuZWxlbWVudEJlaGluZEN1cnNvcklzTWUoZS5jbGllbnRYLCBlLmNsaWVudFkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBwcmV2ZW50IGltYWdlIGRyYWdnaW5nIGFjdGlvbiAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGltZ3MgPSB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yQWxsKCdpbWcnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgaW1ncy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGltZ3NbaV0ub25kcmFnc3RhcnQgPSBmdW5jdGlvbiAoKSB7IHJldHVybiBmYWxzZTsgfTsgLy9NU0lFXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBzZWFyY2ggdGhlIERPTSBmb3IgZXhjbHVkZSBlbGVtZW50cyAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5kcmFnT3B0aW9ucy5leGNsdWRlLmxlbmd0aCAhPSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogZHJhZyBvbmx5IGlmIHRoZSBtb3VzZSBjbGlja2VkIG9uIGFuIGFsbG93ZWQgZWxlbWVudCAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBlbCA9IGRvY3VtZW50LmVsZW1lbnRGcm9tUG9pbnQoZS5jbGllbnRYLCBlLmNsaWVudFkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBleGNsdWRlRWxlbWVudHMgPSB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yQWxsKHRoaXMub3B0aW9ucy5kcmFnT3B0aW9ucy5leGNsdWRlLmpvaW4oJywgJykpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIGxvb3AgdGhyb3VnaCBhbGwgcGFyZW50IGVsZW1lbnRzIHVudGlsIHdlIGVuY291bnRlciBhbiBpbm5lciBkaXYgb3Igbm8gbW9yZSBwYXJlbnRzICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGlubmVyUmUgPSBuZXcgUmVnRXhwKFwiIFwiICsgdGhpcy5jbGFzc0lubmVyICsgXCIgXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdoaWxlIChlbCAmJiAhZWwuY2xhc3NOYW1lLm1hdGNoKGlubmVyUmUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIGNvbXBhcmUgZWFjaCBwYXJlbnQsIGlmIGl0IGlzIGluIHRoZSBleGNsdWRlIGxpc3QgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBleGNsdWRlRWxlbWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIGJhaWwgb3V0IGlmIGFuIGVsZW1lbnQgbWF0Y2hlcyAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGV4Y2x1ZGVFbGVtZW50c1tpXSA9PSBlbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbCA9IGVsLnBhcmVudEVsZW1lbnQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gc2VhcmNoIHRoZSBET00gZm9yIG9ubHkgZWxlbWVudHMsIGJ1dCBvbmx5IGlmIHRoZXJlIGFyZSBlbGVtZW50cyBzZXRcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qaWYgKHRoaXMub3B0aW9ucy5kcmFnT3B0aW9ucy5vbmx5Lmxlbmd0aCAhPSAwKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG9ubHlFbGVtZW50cyA9IHRoaXMuY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3JBbGwodGhpcy5vcHRpb25zLmRyYWdPcHRpb25zLm9ubHkuam9pbignLCAnKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGxvb3AgdGhyb3VnaCB0aGUgbm9kZWxpc3QgYW5kIGNoZWNrIGZvciBvdXIgZWxlbWVudFxuICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgZm91bmQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBleGNsdWRlRWxlbWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAob25seUVsZW1lbnRzW2ldID09IGVsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3VuZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGZvdW5kID09PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSovXG4gICAgICAgICAgICAgICAgICAgICAgICBkb2N1bWVudC5ib2R5LmNsYXNzTmFtZSArPSBcIiBcIiArIHRoaXMuY2xhc3NHcmFiYmluZyArIFwiIFwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgLyogbm90ZSB0aGUgb3JpZ2luIHBvc2l0aW9ucyAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kcmFnT3JpZ2luTGVmdCA9IGUuY2xpZW50WDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZHJhZ09yaWdpblRvcCA9IGUuY2xpZW50WTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZHJhZ09yaWdpblNjcm9sbExlZnQgPSB0aGlzLmdldFNjcm9sbExlZnQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZHJhZ09yaWdpblNjcm9sbFRvcCA9IHRoaXMuZ2V0U2Nyb2xsVG9wKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBpdCBsb29rcyBzdHJhbmdlIGlmIHNjcm9sbC1iZWhhdmlvciBpcyBzZXQgdG8gc21vb3RoICovXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBhcmVudE9yaWdpblN0eWxlID0gdGhpcy5pbm5lci5wYXJlbnRFbGVtZW50LnN0eWxlLmNzc1RleHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHRoaXMuaW5uZXIucGFyZW50RWxlbWVudC5zdHlsZS5zZXRQcm9wZXJ0eSA9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5pbm5lci5wYXJlbnRFbGVtZW50LnN0eWxlLnNldFByb3BlcnR5KCdzY3JvbGwtYmVoYXZpb3InLCAnYXV0bycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCA/IGUucHJldmVudERlZmF1bHQoKSA6IChlLnJldHVyblZhbHVlID0gZmFsc2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wYXN0ID0gKHRoaXMuZ2V0VGltZXN0YW1wKCkgLyAxMDAwKTsgLy9pbiBzZWNvbmRzXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiByZWdpc3RlciB0aGUgZXZlbnQgaGFuZGxlcnMgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubW91c2VNb3ZlSGFuZGxlciA9IHRoaXMubW91c2VNb3ZlLmJpbmQodGhpcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIoZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LCAnbW91c2Vtb3ZlJywgdGhpcy5tb3VzZU1vdmVIYW5kbGVyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubW91c2VVcEhhbmRsZXIgPSBmdW5jdGlvbiAoZSkgeyByZXR1cm4gX3RoaXMubW91c2VVcChlKTsgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcihkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQsICdtb3VzZXVwJywgdGhpcy5tb3VzZVVwSGFuZGxlcik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBNb3VzZSB1cCBoYW5kbGVyXG4gICAgICAgICAgICAgKiBEZXJlZ2lzdGVycyB0aGUgbW91c2Vtb3ZlIGFuZCBtb3VzZXVwIGhhbmRsZXJzXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQHBhcmFtIHtNb3VzZUV2ZW50fSBlIC0gVGhlIG1vdXNlIHVwIGV2ZW50IG9iamVjdFxuICAgICAgICAgICAgICogQHJldHVybiB7dm9pZH1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgU3dvb3NoLnByb3RvdHlwZS5tb3VzZVVwID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgICAvKiBUT0RPOiByZXN0b3JlIG9yaWdpbmFsIHBvc2l0aW9uIHZhbHVlICovXG4gICAgICAgICAgICAgICAgdGhpcy5pbm5lci5zdHlsZS5wb3NpdGlvbiA9ICcnO1xuICAgICAgICAgICAgICAgIHRoaXMuaW5uZXIuc3R5bGUudG9wID0gbnVsbDtcbiAgICAgICAgICAgICAgICB0aGlzLmlubmVyLnN0eWxlLmxlZnQgPSBudWxsO1xuICAgICAgICAgICAgICAgIHZhciB4ID0gdGhpcy5nZXRSZWFsWCh0aGlzLmRyYWdPcmlnaW5MZWZ0ICsgdGhpcy5kcmFnT3JpZ2luU2Nyb2xsTGVmdCAtIGUuY2xpZW50WCk7XG4gICAgICAgICAgICAgICAgdmFyIHkgPSB0aGlzLmdldFJlYWxZKHRoaXMuZHJhZ09yaWdpblRvcCArIHRoaXMuZHJhZ09yaWdpblNjcm9sbFRvcCAtIGUuY2xpZW50WSk7XG4gICAgICAgICAgICAgICAgdmFyIHJlID0gbmV3IFJlZ0V4cChcIiBcIiArIHRoaXMuY2xhc3NHcmFiYmluZyArIFwiIFwiKTtcbiAgICAgICAgICAgICAgICBkb2N1bWVudC5ib2R5LmNsYXNzTmFtZSA9IGRvY3VtZW50LmJvZHkuY2xhc3NOYW1lLnJlcGxhY2UocmUsICcnKTtcbiAgICAgICAgICAgICAgICB0aGlzLmlubmVyLnBhcmVudEVsZW1lbnQuc3R5bGUuY3NzVGV4dCA9IHRoaXMucGFyZW50T3JpZ2luU3R5bGU7XG4gICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCwgJ21vdXNlbW92ZScsIHRoaXMubW91c2VNb3ZlSGFuZGxlcik7XG4gICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCwgJ21vdXNldXAnLCB0aGlzLm1vdXNlVXBIYW5kbGVyKTtcbiAgICAgICAgICAgICAgICBpZiAoeSAhPSB0aGlzLmdldFNjcm9sbFRvcCgpIHx8IHggIT0gdGhpcy5nZXRTY3JvbGxMZWZ0KCkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wcmVzZW50ID0gKHRoaXMuZ2V0VGltZXN0YW1wKCkgLyAxMDAwKTsgLy9pbiBzZWNvbmRzXG4gICAgICAgICAgICAgICAgICAgIHZhciB0ID0gdGhpcy5wcmVzZW50IC0gKHRoaXMucGFzdCA/IHRoaXMucGFzdCA6IHRoaXMucHJlc2VudCk7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0ID4gMC4wNSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLyoganVzdCBhbGlnbiB0byB0aGUgZ3JpZCBpZiB0aGUgbW91c2UgbGVmdCB1bm1vdmVkIGZvciBtb3JlIHRoYW4gMC4xIHNlY29uZHMgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsVG8oeCwgeSwgdGhpcy5vcHRpb25zLmRyYWdPcHRpb25zLmZhZGUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMuZHJhZ09wdGlvbnMuZmFkZSAmJiB0eXBlb2YgdGhpcy52eCAhPSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgdGhpcy52eSAhPSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgICAgICAvKiB2IHNob3VsZCBub3QgZXhjZWVkIHZNYXggb3IgLXZNYXggLT4gd291bGQgYmUgdG9vIGZhc3QgYW5kIHNob3VsZCBleGNlZWQgdk1pbiBvciAtdk1pbiAqL1xuICAgICAgICAgICAgICAgICAgICB2YXIgdk1heCA9IHRoaXMub3B0aW9ucy5kcmFnT3B0aW9ucy5tYXhTcGVlZDtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHZNaW4gPSB0aGlzLm9wdGlvbnMuZHJhZ09wdGlvbnMubWluU3BlZWQ7XG4gICAgICAgICAgICAgICAgICAgIHZhciB2eCA9IHRoaXMudng7XG4gICAgICAgICAgICAgICAgICAgIHZhciB2eSA9IHRoaXMudnk7XG4gICAgICAgICAgICAgICAgICAgIC8qIGlmIHRoZSBzcGVlZCBpcyBub3Qgd2l0aG91dCBib3VuZCBmb3IgZmFkZSwganVzdCBkbyBhIHJlZ3VsYXIgc2Nyb2xsIHdoZW4gdGhlcmUgaXMgYSBncmlkKi9cbiAgICAgICAgICAgICAgICAgICAgaWYgKHZ5IDwgdk1pbiAmJiB2eSA+IC12TWluICYmIHZ4IDwgdk1pbiAmJiB2eCA+IC12TWluKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLmdyaWRZID4gMSB8fCB0aGlzLm9wdGlvbnMuZ3JpZFggPiAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zY3JvbGxUbyh4LCB5KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB2YXIgdnggPSAodnggPD0gdk1heCAmJiB2eCA+PSAtdk1heCkgPyB2eCA6ICh2eCA+IDAgPyB2TWF4IDogLXZNYXgpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgdnkgPSAodnkgPD0gdk1heCAmJiB2eSA+PSAtdk1heCkgPyB2eSA6ICh2eSA+IDAgPyB2TWF4IDogLXZNYXgpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgYXggPSAodnggPiAwID8gLTEgOiAxKSAqIHRoaXMub3B0aW9ucy5kcmFnT3B0aW9ucy5icmFrZVNwZWVkO1xuICAgICAgICAgICAgICAgICAgICB2YXIgYXkgPSAodnkgPiAwID8gLTEgOiAxKSAqIHRoaXMub3B0aW9ucy5kcmFnT3B0aW9ucy5icmFrZVNwZWVkO1xuICAgICAgICAgICAgICAgICAgICB4ID0gKCgwIC0gTWF0aC5wb3codngsIDIpKSAvICgyICogYXgpKSArIHRoaXMuZ2V0U2Nyb2xsTGVmdCgpO1xuICAgICAgICAgICAgICAgICAgICB5ID0gKCgwIC0gTWF0aC5wb3codnksIDIpKSAvICgyICogYXkpKSArIHRoaXMuZ2V0U2Nyb2xsVG9wKCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsVG8oeCwgeSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvKiBpbiBhbGwgb3RoZXIgY2FzZXMsIGRvIGEgcmVndWxhciBzY3JvbGwgKi9cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zY3JvbGxUbyh4LCB5LCB0aGlzLm9wdGlvbnMuZHJhZ09wdGlvbnMuZmFkZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQ2FsY3VsYXRlcyB0aGUgcm91bmRlZCBhbmQgc2NhbGVkIHgtY29vcmRpbmF0ZS5cbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0geCAtIHRoZSB4LWNvb3JkaW5hdGVcbiAgICAgICAgICAgICAqIEByZXR1cm4ge251bWJlcn0gLSB0aGUgZmluYWwgeC1jb29yZGluYXRlXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIFN3b29zaC5wcm90b3R5cGUuZ2V0UmVhbFggPSBmdW5jdGlvbiAoeCkge1xuICAgICAgICAgICAgICAgIC8vc3RpY2sgdGhlIGVsZW1lbnQgdG8gdGhlIGdyaWQsIGlmIGdyaWQgZXF1YWxzIDEgdGhlIHZhbHVlIGRvZXMgbm90IGNoYW5nZVxuICAgICAgICAgICAgICAgIHggPSBNYXRoLnJvdW5kKHggLyAodGhpcy5vcHRpb25zLmdyaWRYICogdGhpcy5nZXRTY2FsZSgpKSkgKiAodGhpcy5vcHRpb25zLmdyaWRYICogdGhpcy5nZXRTY2FsZSgpKTtcbiAgICAgICAgICAgICAgICB2YXIgc2Nyb2xsTWF4TGVmdCA9ICh0aGlzLnNjcm9sbEVsZW1lbnQuc2Nyb2xsV2lkdGggLSB0aGlzLnNjcm9sbEVsZW1lbnQuY2xpZW50V2lkdGgpO1xuICAgICAgICAgICAgICAgIHJldHVybiAoeCA+IHNjcm9sbE1heExlZnQpID8gc2Nyb2xsTWF4TGVmdCA6IHg7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBDYWxjdWxhdGVzIHRoZSByb3VuZGVkIGFuZCBzY2FsZWQgeS1jb29yZGluYXRlLlxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSB5IC0gdGhlIHktY29vcmRpbmF0ZVxuICAgICAgICAgICAgICogQHJldHVybiB7bnVtYmVyfSAtIHRoZSBmaW5hbCB5LWNvb3JkaW5hdGVcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgU3dvb3NoLnByb3RvdHlwZS5nZXRSZWFsWSA9IGZ1bmN0aW9uICh5KSB7XG4gICAgICAgICAgICAgICAgLy9zdGljayB0aGUgZWxlbWVudCB0byB0aGUgZ3JpZCwgaWYgZ3JpZCBlcXVhbHMgMSB0aGUgdmFsdWUgZG9lcyBub3QgY2hhbmdlXG4gICAgICAgICAgICAgICAgeSA9IE1hdGgucm91bmQoeSAvICh0aGlzLm9wdGlvbnMuZ3JpZFkgKiB0aGlzLmdldFNjYWxlKCkpKSAqICh0aGlzLm9wdGlvbnMuZ3JpZFkgKiB0aGlzLmdldFNjYWxlKCkpO1xuICAgICAgICAgICAgICAgIHZhciBzY3JvbGxNYXhUb3AgPSAodGhpcy5zY3JvbGxFbGVtZW50LnNjcm9sbEhlaWdodCAtIHRoaXMuc2Nyb2xsRWxlbWVudC5jbGllbnRIZWlnaHQpO1xuICAgICAgICAgICAgICAgIHJldHVybiAoeSA+IHNjcm9sbE1heFRvcCkgPyBzY3JvbGxNYXhUb3AgOiB5O1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQ2FsY3VsYXRlcyBlYWNoIHN0ZXAgb2YgYSBzY3JvbGwgZmFkZW91dCBhbmltYXRpb24gYmFzZWQgb24gdGhlIGluaXRpYWwgdmVsb2NpdHkuXG4gICAgICAgICAgICAgKiBTdG9wcyBhbnkgY3VycmVudGx5IHJ1bm5pbmcgc2Nyb2xsIGFuaW1hdGlvbi5cbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0gdnggLSB0aGUgaW5pdGlhbCB2ZWxvY2l0eSBpbiBob3Jpem9udGFsIGRpcmVjdGlvblxuICAgICAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IHZ5IC0gdGhlIGluaXRpYWwgdmVsb2NpdHkgaW4gdmVydGljYWwgZGlyZWN0aW9uXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHtudW1iZXJ9IC0gdGhlIGZpbmFsIHktY29vcmRpbmF0ZVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBTd29vc2gucHJvdG90eXBlLmZhZGVPdXRCeVZlbG9jaXR5ID0gZnVuY3Rpb24gKHZ4LCB2eSkge1xuICAgICAgICAgICAgICAgIC8qIFRPRE86IGNhbGMgdiBoZXJlIGFuZCB3aXRoIG1vcmUgaW5mbywgbW9yZSBwcmVjaXNlbHkgKi9cbiAgICAgICAgICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICAgICAgICAgIC8qIGNhbGN1bGF0ZSB0aGUgYnJha2UgYWNjZWxlcmF0aW9uIGluIGJvdGggZGlyZWN0aW9ucyBzZXBhcmF0ZWx5ICovXG4gICAgICAgICAgICAgICAgdmFyIGF5ID0gKHZ5ID4gMCA/IC0xIDogMSkgKiB0aGlzLm9wdGlvbnMuZHJhZ09wdGlvbnMuYnJha2VTcGVlZDtcbiAgICAgICAgICAgICAgICB2YXIgYXggPSAodnggPiAwID8gLTEgOiAxKSAqIHRoaXMub3B0aW9ucy5kcmFnT3B0aW9ucy5icmFrZVNwZWVkO1xuICAgICAgICAgICAgICAgIC8qIGZpbmQgdGhlIGRpcmVjdGlvbiB0aGF0IG5lZWRzIGxvbmdlciB0byBzdG9wLCBhbmQgcmVjYWxjdWxhdGUgdGhlIGFjY2VsZXJhdGlvbiAqL1xuICAgICAgICAgICAgICAgIHZhciB0bWF4ID0gTWF0aC5tYXgoKDAgLSB2eSkgLyBheSwgKDAgLSB2eCkgLyBheCk7XG4gICAgICAgICAgICAgICAgYXggPSAoMCAtIHZ4KSAvIHRtYXg7XG4gICAgICAgICAgICAgICAgYXkgPSAoMCAtIHZ5KSAvIHRtYXg7XG4gICAgICAgICAgICAgICAgdmFyIGZwcyA9IHRoaXMub3B0aW9ucy5kcmFnT3B0aW9ucy5mcHM7XG4gICAgICAgICAgICAgICAgdmFyIG1lID0gdGhpcztcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8ICgodG1heCAqIGZwcykgKyAoMCAvIGZwcykpOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHQgPSAoKGkgKyAxKSAvIGZwcyk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBzeSA9IHRoaXMuZ2V0U2Nyb2xsVG9wKCkgKyAodnkgKiB0KSArICgwLjUgKiBheSAqIHQgKiB0KTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHN4ID0gdGhpcy5nZXRTY3JvbGxMZWZ0KCkgKyAodnggKiB0KSArICgwLjUgKiBheCAqIHQgKiB0KTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50aW1lb3V0cy5wdXNoKHNldFRpbWVvdXQoKGZ1bmN0aW9uICh4LCB5LCBtZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZS5zZXRTY3JvbGxUb3AoeSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWUuc2V0U2Nyb2xsTGVmdCh4KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZS5vcmlnaW5TY3JvbGxMZWZ0ID0geDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZS5vcmlnaW5TY3JvbGxUb3AgPSB5O1xuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgfSkoc3gsIHN5LCBtZSksIChpICsgMSkgKiAoMTAwMCAvIGZwcykpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGkgPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIC8qIHJvdW5kIHRoZSBsYXN0IHN0ZXAgYmFzZWQgb24gdGhlIGRpcmVjdGlvbiBvZiB0aGUgZmFkZSAqL1xuICAgICAgICAgICAgICAgICAgICBzeCA9IHZ4ID4gMCA/IE1hdGguY2VpbChzeCkgOiBNYXRoLmZsb29yKHN4KTtcbiAgICAgICAgICAgICAgICAgICAgc3kgPSB2eSA+IDAgPyBNYXRoLmNlaWwoc3kpIDogTWF0aC5mbG9vcihzeSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudGltZW91dHMucHVzaChzZXRUaW1lb3V0KChmdW5jdGlvbiAoeCwgeSwgbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWUuc2V0U2Nyb2xsVG9wKHkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lLnNldFNjcm9sbExlZnQoeCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWUub3JpZ2luU2Nyb2xsTGVmdCA9IHg7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWUub3JpZ2luU2Nyb2xsVG9wID0geTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIH0pKHN4LCBzeSwgbWUpLCAoaSArIDIpICogKDEwMDAgLyBmcHMpKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8qIHN0b3AgdGhlIGFuaW1hdGlvbiB3aGVuIGNvbGxpZGluZyB3aXRoIHRoZSBib3JkZXJzICovXG4gICAgICAgICAgICAgICAgdGhpcy5jbGVhckxpc3RlbmVyTGVmdCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIF90aGlzLmNsZWFyVGltZW91dHMoKTsgfTtcbiAgICAgICAgICAgICAgICB0aGlzLmNsZWFyTGlzdGVuZXJSaWdodCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIF90aGlzLmNsZWFyVGltZW91dHMoKTsgfTtcbiAgICAgICAgICAgICAgICB0aGlzLmNsZWFyTGlzdGVuZXJUb3AgPSBmdW5jdGlvbiAoKSB7IHJldHVybiBfdGhpcy5jbGVhclRpbWVvdXRzKCk7IH07XG4gICAgICAgICAgICAgICAgdGhpcy5jbGVhckxpc3RlbmVyQm90dG9tID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gX3RoaXMuY2xlYXJUaW1lb3V0cygpOyB9O1xuICAgICAgICAgICAgICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcih0aGlzLmlubmVyLCAnY29sbGlkZS5sZWZ0JywgdGhpcy5jbGVhckxpc3RlbmVyTGVmdCk7XG4gICAgICAgICAgICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKHRoaXMuaW5uZXIsICdjb2xsaWRlLnJpZ2h0JywgdGhpcy5jbGVhckxpc3RlbmVyUmlnaHQpO1xuICAgICAgICAgICAgICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcih0aGlzLmlubmVyLCAnY29sbGlkZS50b3AnLCB0aGlzLmNsZWFyTGlzdGVuZXJUb3ApO1xuICAgICAgICAgICAgICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcih0aGlzLmlubmVyLCAnY29sbGlkZS5ib3R0b20nLCB0aGlzLmNsZWFyTGlzdGVuZXJCb3R0b20pO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIFN3b29zaC5wcm90b3R5cGUuZmFkZU91dEJ5Q29vcmRzID0gZnVuY3Rpb24gKHgsIHkpIHtcbiAgICAgICAgICAgICAgICB4ID0gdGhpcy5nZXRSZWFsWCh4KTtcbiAgICAgICAgICAgICAgICB5ID0gdGhpcy5nZXRSZWFsWSh5KTtcbiAgICAgICAgICAgICAgICB2YXIgYSA9IHRoaXMub3B0aW9ucy5kcmFnT3B0aW9ucy5icmFrZVNwZWVkICogLTE7XG4gICAgICAgICAgICAgICAgdmFyIHZ5ID0gMCAtICgyICogYSAqICh5IC0gdGhpcy5nZXRTY3JvbGxUb3AoKSkpO1xuICAgICAgICAgICAgICAgIHZhciB2eCA9IDAgLSAoMiAqIGEgKiAoeCAtIHRoaXMuZ2V0U2Nyb2xsTGVmdCgpKSk7XG4gICAgICAgICAgICAgICAgdnkgPSAodnkgPiAwID8gMSA6IC0xKSAqIE1hdGguc3FydChNYXRoLmFicyh2eSkpO1xuICAgICAgICAgICAgICAgIHZ4ID0gKHZ4ID4gMCA/IDEgOiAtMSkgKiBNYXRoLnNxcnQoTWF0aC5hYnModngpKTtcbiAgICAgICAgICAgICAgICB2YXIgc3ggPSB4IC0gdGhpcy5nZXRTY3JvbGxMZWZ0KCk7XG4gICAgICAgICAgICAgICAgdmFyIHN5ID0geSAtIHRoaXMuZ2V0U2Nyb2xsVG9wKCk7XG4gICAgICAgICAgICAgICAgaWYgKE1hdGguYWJzKHN5KSA+IE1hdGguYWJzKHN4KSkge1xuICAgICAgICAgICAgICAgICAgICB2eCA9ICh2eCA+IDAgPyAxIDogLTEpICogTWF0aC5hYnMoKHN4IC8gc3kpICogdnkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdnkgPSAodnkgPiAwID8gMSA6IC0xKSAqIE1hdGguYWJzKChzeSAvIHN4KSAqIHZ4KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5jbGVhclRpbWVvdXRzKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5mYWRlT3V0QnlWZWxvY2l0eSh2eCwgdnkpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogTW91c2UgbW92ZSBoYW5kbGVyXG4gICAgICAgICAgICAgKiBDYWxjdWNhdGVzIHRoZSB4IGFuZCB5IGRlbHRhcyBhbmQgc2Nyb2xsc1xuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBwYXJhbSB7TW91c2VFdmVudH0gZSAtIFRoZSBtb3VzZSBtb3ZlIGV2ZW50IG9iamVjdFxuICAgICAgICAgICAgICogQHJldHVybiB7dm9pZH1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgU3dvb3NoLnByb3RvdHlwZS5tb3VzZU1vdmUgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgIHRoaXMucHJlc2VudCA9ICh0aGlzLmdldFRpbWVzdGFtcCgpIC8gMTAwMCk7IC8vaW4gc2Vjb25kc1xuICAgICAgICAgICAgICAgIHRoaXMuY2xlYXJUZXh0U2VsZWN0aW9uKCk7XG4gICAgICAgICAgICAgICAgLyogaWYgdGhlIG1vdXNlIGxlZnQgdGhlIHdpbmRvdyBhbmQgdGhlIGJ1dHRvbiBpcyBub3QgcHJlc3NlZCBhbnltb3JlLCBhYm9ydCBtb3ZpbmcgKi9cbiAgICAgICAgICAgICAgICBpZiAoKGUuYnV0dG9ucyA9PSAwICYmIGUuYnV0dG9uID09IDApIHx8ICh0eXBlb2YgZS5idXR0b25zID09ICd1bmRlZmluZWQnICYmIGUuYnV0dG9uID09IDApKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubW91c2VVcChlKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgeCA9IHRoaXMuZHJhZ09yaWdpbkxlZnQgKyB0aGlzLmRyYWdPcmlnaW5TY3JvbGxMZWZ0IC0gZS5jbGllbnRYO1xuICAgICAgICAgICAgICAgIHZhciB5ID0gdGhpcy5kcmFnT3JpZ2luVG9wICsgdGhpcy5kcmFnT3JpZ2luU2Nyb2xsVG9wIC0gZS5jbGllbnRZO1xuICAgICAgICAgICAgICAgIC8qIGlmIGVsYXN0aWMgZWRnZXMgYXJlIHNldCwgc2hvdyB0aGUgZWxlbWVudCBwc2V1ZG8gc2Nyb2xsZWQgYnkgcmVsYXRpdmUgcG9zaXRpb24gKi9cbiAgICAgICAgICAgICAgICBpZiAodGhpcy50cmlnZ2VyZWQuY29sbGlkZUJvdHRvbSAmJiB0aGlzLm9wdGlvbnMuZWxhc3RpY0VkZ2VzLmJvdHRvbSA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmlubmVyLnN0eWxlLnBvc2l0aW9uID0gJ3JlbGF0aXZlJztcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pbm5lci5zdHlsZS50b3AgPSAoKHRoaXMuZ2V0U2Nyb2xsVG9wKCkgLSB5KSAvIDIpICsgJ3B4JztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMudHJpZ2dlcmVkLmNvbGxpZGVUb3AgJiYgdGhpcy5vcHRpb25zLmVsYXN0aWNFZGdlcy50b3AgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pbm5lci5zdHlsZS5wb3NpdGlvbiA9ICdyZWxhdGl2ZSc7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaW5uZXIuc3R5bGUudG9wID0gKHkgLyAtMikgKyAncHgnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAodGhpcy50cmlnZ2VyZWQuY29sbGlkZUxlZnQgJiYgdGhpcy5vcHRpb25zLmVsYXN0aWNFZGdlcy5sZWZ0ID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaW5uZXIuc3R5bGUucG9zaXRpb24gPSAncmVsYXRpdmUnO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmlubmVyLnN0eWxlLmxlZnQgPSAoeCAvIC0yKSArICdweCc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh0aGlzLnRyaWdnZXJlZC5jb2xsaWRlUmlnaHQgJiYgdGhpcy5vcHRpb25zLmVsYXN0aWNFZGdlcy5yaWdodCA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmlubmVyLnN0eWxlLnBvc2l0aW9uID0gJ3JlbGF0aXZlJztcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pbm5lci5zdHlsZS5sZWZ0ID0gKCh0aGlzLmdldFNjcm9sbExlZnQoKSAtIHgpIC8gMikgKyAncHgnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvKiAgY2FsY3VsYXRlIHNwZWVkICovXG4gICAgICAgICAgICAgICAgdmFyIHQgPSB0aGlzLnByZXNlbnQgLSAoKHR5cGVvZiB0aGlzLnBhc3QgIT0gJ3VuZGVmaW5lZCcpID8gdGhpcy5wYXN0IDogdGhpcy5wcmVzZW50KTtcbiAgICAgICAgICAgICAgICB2YXIgc3ggPSB4IC0gKHRoaXMucGFzdFggPyB0aGlzLnBhc3RYIDogeCk7XG4gICAgICAgICAgICAgICAgdmFyIHN5ID0geSAtICh0aGlzLnBhc3RZID8gdGhpcy5wYXN0WSA6IHkpO1xuICAgICAgICAgICAgICAgIHRoaXMudnggPSB0ID09IDAgPyAwIDogc3ggLyB0O1xuICAgICAgICAgICAgICAgIHRoaXMudnkgPSB0ID09IDAgPyAwIDogc3kgLyB0O1xuICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsVG8oeCwgeSwgZmFsc2UpO1xuICAgICAgICAgICAgICAgIHRoaXMucGFzdCA9IHRoaXMucHJlc2VudDtcbiAgICAgICAgICAgICAgICB0aGlzLnBhc3RYID0geDtcbiAgICAgICAgICAgICAgICB0aGlzLnBhc3RZID0geTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIHNjcm9sbEJ5IGhlbHBlciBtZXRob2QgdG8gc2Nyb2xsIGJ5IGFuIGFtb3VudCBvZiBwaXhlbHMgaW4geC0gYW5kIHktZGlyZWN0aW9uXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IHggLSBhbW91bnQgb2YgcGl4ZWxzIHRvIHNjcm9sbCBpbiB4LWRpcmVjdGlvblxuICAgICAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IHkgLSBhbW91bnQgb2YgcGl4ZWxzIHRvIHNjcm9sbCBpbiB5LWRpcmVjdGlvblxuICAgICAgICAgICAgICogQHBhcmFtIHtib29sZWFufSBzbW9vdGggLSB3aGV0aGVyIHRvIHNjcm9sbCBzbW9vdGggb3IgaW5zdGFudFxuICAgICAgICAgICAgICogQHJldHVybiB7dm9pZH1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgU3dvb3NoLnByb3RvdHlwZS5zY3JvbGxCeSA9IGZ1bmN0aW9uICh4LCB5LCBzbW9vdGgpIHtcbiAgICAgICAgICAgICAgICBpZiAoc21vb3RoID09PSB2b2lkIDApIHsgc21vb3RoID0gdHJ1ZTsgfVxuICAgICAgICAgICAgICAgIHZhciBhYnNvbHV0ZVggPSB0aGlzLmdldFNjcm9sbExlZnQoKSArIHg7XG4gICAgICAgICAgICAgICAgdmFyIGFic29sdXRlWSA9IHRoaXMuZ2V0U2Nyb2xsVG9wKCkgKyB5O1xuICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsVG8oYWJzb2x1dGVYLCBhYnNvbHV0ZVksIHNtb290aCk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBzY3JvbGxCeSBoZWxwZXIgbWV0aG9kIHRvIHNjcm9sbCB0byBhIHgtIGFuZCB5LWNvb3JkaW5hdGVcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0geCAtIHgtY29vcmRpbmF0ZSB0byBzY3JvbGwgdG9cbiAgICAgICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSB5IC0geS1jb29yZGluYXRlIHRvIHNjcm9sbCB0b1xuICAgICAgICAgICAgICogQHBhcmFtIHtib29sZWFufSBzbW9vdGggLSB3aGV0aGVyIHRvIHNjcm9sbCBzbW9vdGggb3IgaW5zdGFudFxuICAgICAgICAgICAgICogQHJldHVybiB7dm9pZH1cbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAVE9ETzogQ1NTMyB0cmFuc2l0aW9ucyBpZiBhdmFpbGFibGUgaW4gYnJvd3NlclxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBTd29vc2gucHJvdG90eXBlLnNjcm9sbFRvID0gZnVuY3Rpb24gKHgsIHksIHNtb290aCkge1xuICAgICAgICAgICAgICAgIGlmIChzbW9vdGggPT09IHZvaWQgMCkgeyBzbW9vdGggPSB0cnVlOyB9XG4gICAgICAgICAgICAgICAgdGhpcy5jbGVhclRpbWVvdXRzKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5zY3JvbGxNYXhMZWZ0ID0gKHRoaXMuc2Nyb2xsRWxlbWVudC5zY3JvbGxXaWR0aCAtIHRoaXMuc2Nyb2xsRWxlbWVudC5jbGllbnRXaWR0aCk7XG4gICAgICAgICAgICAgICAgdGhpcy5zY3JvbGxNYXhUb3AgPSAodGhpcy5zY3JvbGxFbGVtZW50LnNjcm9sbEhlaWdodCAtIHRoaXMuc2Nyb2xsRWxlbWVudC5jbGllbnRIZWlnaHQpO1xuICAgICAgICAgICAgICAgIC8qIG5vIG5lZ2F0aXZlIHZhbHVlcyBvciB2YWx1ZXMgZ3JlYXRlciB0aGFuIHRoZSBtYXhpbXVtICovXG4gICAgICAgICAgICAgICAgdmFyIHggPSAoeCA+IHRoaXMuc2Nyb2xsTWF4TGVmdCkgPyB0aGlzLnNjcm9sbE1heExlZnQgOiAoeCA8IDApID8gMCA6IHg7XG4gICAgICAgICAgICAgICAgdmFyIHkgPSAoeSA+IHRoaXMuc2Nyb2xsTWF4VG9wKSA/IHRoaXMuc2Nyb2xsTWF4VG9wIDogKHkgPCAwKSA/IDAgOiB5O1xuICAgICAgICAgICAgICAgIC8qIHJlbWVtYmVyIHRoZSBvbGQgdmFsdWVzICovXG4gICAgICAgICAgICAgICAgdGhpcy5vcmlnaW5TY3JvbGxMZWZ0ID0gdGhpcy5nZXRTY3JvbGxMZWZ0KCk7XG4gICAgICAgICAgICAgICAgdGhpcy5vcmlnaW5TY3JvbGxUb3AgPSB0aGlzLmdldFNjcm9sbFRvcCgpO1xuICAgICAgICAgICAgICAgIGlmICh4ICE9IHRoaXMuZ2V0U2Nyb2xsTGVmdCgpIHx8IHkgIT0gdGhpcy5nZXRTY3JvbGxUb3AoKSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLndoZWVsT3B0aW9ucy5zbW9vdGggIT09IHRydWUgfHwgc21vb3RoID09PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXRTY3JvbGxUb3AoeSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNldFNjcm9sbExlZnQoeCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmZhZGVPdXRCeUNvb3Jkcyh4LCB5KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFJlZ2lzdGVyIGN1c3RvbSBldmVudCBjYWxsYmFja3NcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnQgLSBUaGUgZXZlbnQgbmFtZVxuICAgICAgICAgICAgICogQHBhcmFtIHsoZTogRXZlbnQpID0+IGFueX0gY2FsbGJhY2sgLSBBIGNhbGxiYWNrIGZ1bmN0aW9uIHRvIGV4ZWN1dGUgd2hlbiB0aGUgZXZlbnQgcmFpc2VzXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHtTd29vc2h9IC0gVGhlIFN3b29zaCBvYmplY3QgaW5zdGFuY2VcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgU3dvb3NoLnByb3RvdHlwZS5vbiA9IGZ1bmN0aW9uIChldmVudCwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIodGhpcy5pbm5lciwgZXZlbnQsIGNhbGxiYWNrKTtcbiAgICAgICAgICAgICAgICAvKiBzZXQgdGhlIGV2ZW50IHVudHJpZ2dlcmVkIGFuZCBjYWxsIHRoZSBmdW5jdGlvbiwgdG8gcmV0cmlnZ2VyIG1ldCBldmVudHMgKi9cbiAgICAgICAgICAgICAgICB2YXIgZiA9IGV2ZW50LnJlcGxhY2UoL1xcLihbYS16XSkvLCBTdHJpbmcuY2FsbC5iaW5kKGV2ZW50LnRvVXBwZXJDYXNlKSkucmVwbGFjZSgvXFwuLywgJycpO1xuICAgICAgICAgICAgICAgIHRoaXMudHJpZ2dlcmVkW2ZdID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgdGhpcy5vblNjcm9sbCgpO1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogRGVyZWdpc3RlciBjdXN0b20gZXZlbnQgY2FsbGJhY2tzXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50IC0gVGhlIGV2ZW50IG5hbWVcbiAgICAgICAgICAgICAqIEBwYXJhbSB7KGU6IEV2ZW50KSA9PiBhbnl9IGNhbGxiYWNrIC0gQSBjYWxsYmFjayBmdW5jdGlvbiB0byBleGVjdXRlIHdoZW4gdGhlIGV2ZW50IHJhaXNlc1xuICAgICAgICAgICAgICogQHJldHVybiB7U3dvb3NofSAtIFRoZSBTd29vc2ggb2JqZWN0IGluc3RhbmNlXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIFN3b29zaC5wcm90b3R5cGUub2ZmID0gZnVuY3Rpb24gKGV2ZW50LCBjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIHRoaXMucmVtb3ZlRXZlbnRMaXN0ZW5lcih0aGlzLmlubmVyLCBldmVudCwgY2FsbGJhY2spO1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogUmV2ZXJ0IGFsbCBET00gbWFuaXB1bGF0aW9ucyBhbmQgZGVyZWdpc3RlciBhbGwgZXZlbnQgaGFuZGxlcnNcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHt2b2lkfVxuICAgICAgICAgICAgICogQFRPRE86IHJlbW92aW5nIHdoZWVsWm9vbUhhbmRsZXIgZG9lcyBub3Qgd29ya1xuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBTd29vc2gucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIHggPSB0aGlzLmdldFNjcm9sbExlZnQoKTtcbiAgICAgICAgICAgICAgICB2YXIgeSA9IHRoaXMuZ2V0U2Nyb2xsVG9wKCk7XG4gICAgICAgICAgICAgICAgLyogcmVtb3ZlIHRoZSBvdXRlciBhbmQgZ3JhYiBDU1MgY2xhc3NlcyAqL1xuICAgICAgICAgICAgICAgIHZhciByZSA9IG5ldyBSZWdFeHAoXCIgXCIgKyB0aGlzLmNsYXNzT3V0ZXIgKyBcIiBcIik7XG4gICAgICAgICAgICAgICAgdGhpcy5jb250YWluZXIuY2xhc3NOYW1lID0gdGhpcy5jb250YWluZXIuY2xhc3NOYW1lLnJlcGxhY2UocmUsICcnKTtcbiAgICAgICAgICAgICAgICB2YXIgcmUgPSBuZXcgUmVnRXhwKFwiIFwiICsgdGhpcy5jbGFzc0dyYWIgKyBcIiBcIik7XG4gICAgICAgICAgICAgICAgdGhpcy5pbm5lci5jbGFzc05hbWUgPSB0aGlzLmlubmVyLmNsYXNzTmFtZS5yZXBsYWNlKHJlLCAnJyk7XG4gICAgICAgICAgICAgICAgdmFyIHJlID0gbmV3IFJlZ0V4cChcIiBcIiArIHRoaXMuY2xhc3NOb0dyYWIgKyBcIiBcIik7XG4gICAgICAgICAgICAgICAgdGhpcy5jb250YWluZXIuY2xhc3NOYW1lID0gdGhpcy5jb250YWluZXIuY2xhc3NOYW1lLnJlcGxhY2UocmUsICcnKTtcbiAgICAgICAgICAgICAgICAvKiBtb3ZlIGFsbCBjaGlsZE5vZGVzIGJhY2sgdG8gdGhlIG9sZCBvdXRlciBlbGVtZW50IGFuZCByZW1vdmUgdGhlIGlubmVyIGVsZW1lbnQgKi9cbiAgICAgICAgICAgICAgICB3aGlsZSAodGhpcy5pbm5lci5jaGlsZE5vZGVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jb250YWluZXIuYXBwZW5kQ2hpbGQodGhpcy5pbm5lci5jaGlsZE5vZGVzWzBdKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5zY2FsZUVsZW1lbnQucmVtb3ZlQ2hpbGQodGhpcy5pbm5lcik7XG4gICAgICAgICAgICAgICAgdGhpcy5jb250YWluZXIucmVtb3ZlQ2hpbGQodGhpcy5zY2FsZUVsZW1lbnQpO1xuICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsVG8oeCwgeSwgZmFsc2UpO1xuICAgICAgICAgICAgICAgIHRoaXMubW91c2VNb3ZlSGFuZGxlciA/IHRoaXMucmVtb3ZlRXZlbnRMaXN0ZW5lcihkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQsICdtb3VzZW1vdmUnLCB0aGlzLm1vdXNlTW92ZUhhbmRsZXIpIDogbnVsbDtcbiAgICAgICAgICAgICAgICB0aGlzLm1vdXNlVXBIYW5kbGVyID8gdGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCwgJ21vdXNldXAnLCB0aGlzLm1vdXNlVXBIYW5kbGVyKSA6IG51bGw7XG4gICAgICAgICAgICAgICAgdGhpcy5tb3VzZURvd25IYW5kbGVyID8gdGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKHRoaXMuaW5uZXIsICdtb3VzZWRvd24nLCB0aGlzLm1vdXNlRG93bkhhbmRsZXIpIDogbnVsbDtcbiAgICAgICAgICAgICAgICB0aGlzLm1vdXNlU2Nyb2xsSGFuZGxlciA/IHRoaXMucmVtb3ZlRXZlbnRMaXN0ZW5lcih0aGlzLnNjcm9sbEVsZW1lbnQsICd3aGVlbCcsIHRoaXMubW91c2VTY3JvbGxIYW5kbGVyKSA6IG51bGw7XG4gICAgICAgICAgICAgICAgdGhpcy5tb3VzZVpvb21IYW5kbGVyID8gdGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKHRoaXMuc2Nyb2xsRWxlbWVudCwgJ3doZWVsJywgdGhpcy5tb3VzZVpvb21IYW5kbGVyKSA6IG51bGw7XG4gICAgICAgICAgICAgICAgdGhpcy5oYXNoQ2hhbmdlSGFuZGxlciA/IHRoaXMucmVtb3ZlRXZlbnRMaXN0ZW5lcih3aW5kb3csICdteWhhc2hjaGFuZ2UnLCB0aGlzLmhhc2hDaGFuZ2VIYW5kbGVyKSA6IG51bGw7XG4gICAgICAgICAgICAgICAgdGhpcy5oYXNoQ2hhbmdlSGFuZGxlciA/IHRoaXMucmVtb3ZlRXZlbnRMaXN0ZW5lcih3aW5kb3csICdoYXNoY2hhbmdlJywgdGhpcy5oYXNoQ2hhbmdlSGFuZGxlcikgOiBudWxsO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmhhc2hDaGFuZ2VDbGlja0hhbmRsZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGxpbmtzID0gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvckFsbChcImFbaHJlZl49JyMnXVwiKTtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsaW5rcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKGxpbmtzW2ldLCAnY2xpY2snLCB0aGlzLmhhc2hDaGFuZ2VDbGlja0hhbmRsZXIpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsRWxlbWVudCA/IHRoaXMuc2Nyb2xsRWxlbWVudC5vbm1vdXNld2hlZWwgPSBudWxsIDogbnVsbDtcbiAgICAgICAgICAgICAgICB0aGlzLnNjcm9sbEVsZW1lbnQgPyB0aGlzLnNjcm9sbEVsZW1lbnQub25zY3JvbGwgPSBudWxsIDogbnVsbDtcbiAgICAgICAgICAgICAgICB3aW5kb3cub25yZXNpemUgPSBudWxsO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICByZXR1cm4gU3dvb3NoO1xuICAgICAgICB9KCkpO1xuICAgICAgICAvKiByZXR1cm4gYW4gaW5zdGFuY2Ugb2YgdGhlIGNsYXNzICovXG4gICAgICAgIHJldHVybiBuZXcgU3dvb3NoKGNvbnRhaW5lciwgb3B0aW9ucyk7XG4gICAgfVxuICAgIHJldHVybiBzd29vc2g7XG59KTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXN3b29zaC5qcy5tYXAiXX0=
