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
                if (typeof this !== "function") {
                    // closest thing possible to the ECMAScript 5
                    // internal IsCallable function
                    throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
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
                    throw new TypeError("'this' is null or not defined");
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
        ;
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
                this.classInner = "zw-inner";
                this.classOuter = "zw-outer";
                this.classGrab = "zw-grab";
                this.classNoGrab = "zw-nograb";
                this.classGrabbing = "zw-grabbing";
                this.classUnique = "zw-" + Math.random().toString(36).substring(7);
                this.classScale = "zw-scale";
                this.classIgnore = "zw-ignore";
                this.classFakeBody = "zw-fakebody";
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
                        exclude: ["input", "textarea", "a", "button", "." + this.classIgnore, "select"],
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
                        direction: "vertical",
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
                        direction: "up"
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
                        if (typeof options[key] === "object") {
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
                this.inner.style.minWidth = (this.container.scrollWidth - border[0]) + "px";
                this.inner.style.minHeight = (this.container.scrollHeight - border[1]) + "px";
                this.scaleElement.style.minWidth = this.inner.style.minWidth;
                this.scaleElement.style.minHeight = this.inner.style.minHeight;
                this.scaleElement.style.overflow = "hidden";
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
                this.addEventListener(this.container, "scroll", this.scrollHandler);
                /* if the scroll element is body, adjust the inner div when resizing */
                if (this.isBody) {
                    this.resizeHandler = function (e) { return _this.onResize(e); }; // TODO: same as above in the wheel handler
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
                this.classUnique = "zw-" + Math.random().toString(36).substring(7);
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
                        bgi.push("linear-gradient(to right, grey 1px, transparent 1px)");
                    }
                    if (this.options.gridY !== 1) {
                        bgi.push("linear-gradient(to bottom, grey 1px, transparent 1px)");
                    }
                    this.addBeforeCSS(this.classUnique, "width", this.inner.style.minWidth);
                    this.addBeforeCSS(this.classUnique, "height", this.inner.style.minHeight);
                    this.addBeforeCSS(this.classUnique, "left", "-" + this.getStyle(this.container, "paddingLeft"));
                    this.addBeforeCSS(this.classUnique, "top", "-" + this.getStyle(this.container, "paddingTop"));
                    this.addBeforeCSS(this.classUnique, "background-size", (this.options.gridX !== 1 ? this.options.gridX + "px " : "auto ") + (this.options.gridY !== 1 ? this.options.gridY + "px" : "auto"));
                    this.addBeforeCSS(this.classUnique, "background-image", bgi.join(", "));
                }
            };
            Zwoosh.prototype.initWheelScroll = function () {
                var _this = this;
                /* TODO: not 2 different event handlers registrations -> do it in this.addEventListener() */
                if (this.options.wheelScroll === false) {
                    this.mouseScrollHandler = function (e) { return _this.disableMouseScroll(e); };
                    this.scrollElement.onmousewheel = this.mouseScrollHandler;
                    this.addEventListener(this.scrollElement, "wheel", this.mouseScrollHandler);
                }
                else if (this.options.wheelScroll === true) {
                    this.mouseScrollHandler = function (e) { return _this.activeMouseScroll(e); };
                    this.scrollElement.onmousewheel = this.mouseScrollHandler;
                    this.addEventListener(this.scrollElement, "wheel", this.mouseScrollHandler);
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
                    this.addEventListener(this.scrollElement, "wheel", this.mouseZoomHandler);
                }
            };
            Zwoosh.prototype.initDragScroll = function () {
                var _this = this;
                /* if dragscroll is activated, register mousedown event */
                if (this.options.dragScroll === true) {
                    this.addClass(this.inner, this.classGrab);
                    this.mouseDownHandler = function (e) { return _this.mouseDown(e); };
                    this.addEventListener(this.inner, "mousedown", this.mouseDownHandler);
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
                        if (typeof target !== "undefined") {
                            /* pushState changes the hash without triggering hashchange */
                            history.pushState({}, "", target.href);
                            /* we don't want to trigger hashchange, so prevent default behavior when clicking on anchor links */
                            if (e.preventDefault) {
                                e.preventDefault();
                            }
                            else {
                                e.returnValue = false;
                            }
                        }
                        /* trigger a custom hashchange event, because pushState prevents the real hashchange event */
                        _this.triggerEvent(window, "myhashchange");
                    };
                    /* loop trough all anchor links in the element and disable them to prevent the
                     * browser from scrolling because of the changing hash value. Instead the own
                     * event myhashchange should handle page and element scrolling */
                    for (var i = 0; i < links.length; i++) {
                        this.addEventListener(links[i], "click", this.hashChangeClickHandler, false);
                    }
                    this.hashChangeHandler = function (e) { return _this.onHashChange(e); };
                    this.addEventListener(window, "myhashchange", this.hashChangeHandler);
                    this.addEventListener(window, "hashchange", this.hashChangeHandler);
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
                if (hash !== "") {
                    var anchors = this.container.querySelectorAll("#" + hash);
                    for (var i = 0; i < anchors.length; i++) {
                        var element = anchors[i];
                        var container_1 = anchors[i];
                        // find the next parent which is a container element
                        var nextContainer = element;
                        while (container_1 && container_1.parentElement && this.container !== container_1) {
                            if (this.hasClass(container_1, this.classOuter)) {
                                nextContainer = container_1;
                            }
                            container_1 = container_1.parentElement;
                        }
                        if (e !== null) {
                            if (e.type === "hashchange") {
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
                if (typeof document.styleSheets[0].insertRule === "function") {
                    document.styleSheets[0].insertRule("." + cssClass + "::before { " + cssProperty + ": " + cssValue + "}", 0);
                }
                else if (typeof document.styleSheets[0].addRule === "function") {
                    document.styleSheets[0].addRule("." + cssClass + "::before", cssProperty + ": " + cssValue);
                }
            };
            /**
             * Get compute pixel number of the whole width and height from a border of an element
             *
             * @param {HTMLElement} el - the HTML element
             * @return {array} [width, height] - the amount of pixels
             */
            Zwoosh.prototype.getBorder = function (el) {
                var bl = this.convertBorder(this.getStyle(el, "borderLeftWidth"));
                var br = this.convertBorder(this.getStyle(el, "borderRightWidth"));
                var pl = this.convertSpan(this.getStyle(el, "paddingLeft"));
                var pr = this.convertSpan(this.getStyle(el, "paddingRight"));
                var ml = this.convertSpan(this.getStyle(el, "marginLeft"));
                var mr = this.convertSpan(this.getStyle(el, "marginRight"));
                var bt = this.convertBorder(this.getStyle(el, "borderTopWidth"));
                var bb = this.convertBorder(this.getStyle(el, "borderBottomWidth"));
                var pt = this.convertSpan(this.getStyle(el, "paddingTop"));
                var pb = this.convertSpan(this.getStyle(el, "paddingBottom"));
                var mt = this.convertSpan(this.getStyle(el, "marginTop"));
                var mb = this.convertSpan(this.getStyle(el, "marginBottom"));
                return [
                    (pl + pr + bl + br + ml + mr),
                    (pt + pb + bt + bb + mt + mb)
                ];
            };
            Zwoosh.prototype.convertBorder = function (b) {
                return b === "thin" ? 1 : b === "medium" ? 3 : b === "thick" ? 5 : !isNaN(parseInt(b, 10)) ? parseInt(b, 10) : 0;
            };
            Zwoosh.prototype.convertSpan = function (v) {
                return v === "auto" ? 0 : !isNaN(parseInt(v, 10)) ? parseInt(v, 10) : 0;
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
                var overflow = "overflow";
                if (direction === "vertical") {
                    overflow = "overflowY";
                    has = element.scrollHeight > element.clientHeight;
                }
                else if (direction === "horizontal") {
                    overflow = "overflowX";
                    has = element.scrollWidth > element.clientWidth;
                }
                // Check the overflow and overflowDirection properties for "auto" and "visible" values
                has = this.getStyle(this.container, "overflow") === "visible" ||
                    this.getStyle(this.container, "overflowY") === "visible" ||
                    (has && this.getStyle(this.container, "overflow") === "auto") ||
                    (has && this.getStyle(this.container, "overflowY") === "auto");
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
                    var direction = void 0;
                    if ("deltaY" in e) {
                        direction = e.deltaY > 0 ? "down" : "up";
                    }
                    else if ("wheelDelta" in e) {
                        direction = e.wheelDelta > 0 ? "up" : "down";
                    }
                    else {
                        return;
                    }
                    /* use the normal scroll, when there are scrollbars and the direction is "vertical" */
                    if (this.options.wheelOptions.direction === "vertical" && this.hasScrollbar(this.scrollElement, this.options.wheelOptions.direction)) {
                        if (!((this.triggered.collideBottom && direction === "down") || (this.triggered.collideTop && direction === "up"))) {
                            this.clearTimeouts();
                            return;
                        }
                    }
                    this.disableMouseScroll(e);
                    var x = this.getScrollLeft();
                    var y = this.getScrollTop();
                    if (this.options.wheelOptions.direction === "horizontal") {
                        x = this.getScrollLeft() + (direction === "down" ? this.options.wheelOptions.step : this.options.wheelOptions.step * -1);
                    }
                    else if (this.options.wheelOptions.direction === "vertical") {
                        y = this.getScrollTop() + (direction === "down" ? this.options.wheelOptions.step : this.options.wheelOptions.step * -1);
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
                    var direction = void 0;
                    if ("deltaY" in e) {
                        direction = e.deltaY > 0 ? "down" : "up";
                    }
                    else if ("wheelDelta" in e) {
                        direction = e.wheelDelta > 0 ? "up" : "down";
                    }
                    else {
                        return;
                    }
                    var scale = void 0;
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
                return el.offsetWidth - el.clientWidth - parseInt(this.getStyle(el, "borderLeftWidth")) - parseInt(this.getStyle(el, "borderRightWidth"));
            };
            /**
             * Calculates the size of the horizontal scrollbar.
             *
             * @param {HTMLElement} el - The HTMLElememnt
             * @return {number} - the amount of pixels used by the horizontal scrollbar
             */
            Zwoosh.prototype.scrollbarHeight = function (el) {
                return el.offsetHeight - el.clientHeight - parseInt(this.getStyle(el, "borderTopWidth")) - parseInt(this.getStyle(el, "borderBottomWidth"));
            };
            /**
             * Retrieves the current scale value or 1 if it is not set.
             *
             * @return {number} - the current scale value
             */
            Zwoosh.prototype.getScale = function () {
                if (typeof this.inner.style.transform !== "undefined") {
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
                this.inner.style.transform = "translate(0px, 0px) scale(" + scale + ")";
                this.scaleElement.style.minWidth = this.scaleElement.style.width = width + "px";
                this.scaleElement.style.minHeight = this.scaleElement.style.height = height + "px";
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
                if (typeof window.performance === "object") {
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
                    this.triggerEvent(this.inner, "collide.left");
                }
                this.triggered.collideLeft = x === 0;
                // the collideTop event
                if (y === 0 && !this.triggered.collideTop) {
                    this.triggerEvent(this.inner, "collide.top");
                }
                this.triggered.collideTop = y === 0;
                // the collideRight event
                if (x === this.scrollMaxLeft && !this.triggered.collideRight) {
                    this.triggerEvent(this.inner, "collide.right");
                }
                this.triggered.collideRight = x === this.scrollMaxLeft;
                // the collideBottom event
                if (y === this.scrollMaxTop && !this.triggered.collideBottom) {
                    this.triggerEvent(this.inner, "collide.bottom");
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
                    var xDelta = parseInt(_this.getStyle(document.body, "marginLeft"), 10) + parseInt(_this.getStyle(document.body, "marginRight"), 10);
                    var yDelta = parseInt(_this.getStyle(document.body, "marginTop"), 10) + parseInt(_this.getStyle(document.body, "marginBottom"), 10);
                    // TODO: with this.getBorder()
                    _this.inner.style.minWidth = (document.documentElement.scrollWidth - xDelta) + "px";
                    _this.inner.style.minHeight = (document.documentElement.scrollHeight - yDelta - 100) + "px"; // TODO: WTF? why -100 for IE8?
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
                if (typeof obj.addEventListener === "function") {
                    if (mapEvents["on" + event] && obj.tagName === "BODY") {
                        obj = mapEvents["on" + event];
                    }
                    obj.addEventListener(event, boundCallback);
                }
                else if (typeof obj.attachEvent === "object" && htmlEvents["on" + event]) {
                    obj.attachEvent("on" + event, boundCallback);
                }
                else if (typeof obj.attachEvent === "object" && mapEvents["on" + event]) {
                    if (obj.tagName === "BODY") {
                        var p = "on" + event;
                        /* example: window.onscroll = boundCallback */
                        mapEvents[p][p] = boundCallback;
                    }
                    else {
                        /* TODO: obj.onscroll ?? */
                        obj.onscroll = boundCallback;
                    }
                }
                else if (typeof obj.attachEvent === "object") {
                    obj[event] = 1;
                    boundCallback = function (e) {
                        /* TODO: e is the onpropertychange event not one of the custom event objects */
                        if (e.propertyName === event) {
                            callback(e);
                        }
                    };
                    obj.attachEvent("onpropertychange", boundCallback);
                }
                else {
                    obj["on" + event] = boundCallback;
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
                if (typeof obj.removeEventListener === "function") {
                    obj.removeEventListener(event, callback);
                }
                else if (typeof obj.detachEvent === "object" && htmlEvents["on" + event]) {
                    obj.detachEvent("on" + event, callback);
                }
                else if (typeof obj.detachEvent === "object") {
                    obj.detachEvent("onpropertychange", callback);
                }
                else {
                    obj["on" + event] = null;
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
                if (typeof window.CustomEvent === "function") {
                    event = new CustomEvent(eventName);
                }
                else if (typeof document.createEvent === "function") {
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
                else if (obj.fireEvent && htmlEvents["on" + eventName]) {
                    obj.fireEvent("on" + event.eventType, event);
                }
                else if (obj[eventName]) {
                    obj[eventName]();
                }
                else if (obj["on" + eventName]) {
                    obj["on" + eventName]();
                }
            };
            Zwoosh.prototype.addClass = function (el, cssClass) {
                if (!this.hasClass(el, cssClass)) {
                    el.className += " " + cssClass + " ";
                }
            };
            Zwoosh.prototype.removeClass = function (el, cssClass) {
                var re = new RegExp(" " + cssClass + " ", "g");
                el.className = el.className.replace(re, "");
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
                if (typeof window.getComputedStyle === "function") {
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
                        this.removeEventListener(this.inner, "collide.left", this.clearListenerLeft);
                        this.removeEventListener(this.inner, "collide.right", this.clearListenerRight);
                        this.removeEventListener(this.inner, "collide.top", this.clearListenerTop);
                        this.removeEventListener(this.inner, "collide.bottom", this.clearListenerBottom);
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
                if (("which" in e && e.which === 1) || (typeof e.which === "undefined" && "button" in e && e.button === 1)) {
                    if (this.elementBehindCursorIsMe(e.clientX, e.clientY)) {
                        /* prevent image dragging action */
                        var imgs = this.container.querySelectorAll("img");
                        for (var i = 0; i < imgs.length; i++) {
                            imgs[i].ondragstart = function () { return false; }; // MSIE
                        }
                        /* search the DOM for exclude elements */
                        if (this.options.dragOptions.exclude.length !== 0) {
                            /* drag only if the mouse clicked on an allowed element */
                            var el = document.elementFromPoint(e.clientX, e.clientY);
                            var excludeElements = this.container.querySelectorAll(this.options.dragOptions.exclude.join(", "));
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
                          let onlyElements = this.container.querySelectorAll(this.options.dragOptions.only.join(', '));
                          // loop through the nodelist and check for our element
                          let found = false;
                          for (let i = 0; i < excludeElements.length; i++) {
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
                        if (typeof this.inner.parentElement.style.setProperty === "function") {
                            this.inner.parentElement.style.setProperty("scroll-behavior", "auto");
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
                        this.addEventListener(document.documentElement, "mousemove", this.mouseMoveHandler);
                        this.mouseUpHandler = function (e) { return _this.mouseUp(e); };
                        this.addEventListener(document.documentElement, "mouseup", this.mouseUpHandler);
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
                this.inner.style.position = "";
                this.inner.style.top = null;
                this.inner.style.left = null;
                this.present = (this.getTimestamp() / 1000); // seconds
                var x = this.dragOriginLeft + this.dragOriginScrollLeft - e.clientX;
                var y = this.dragOriginTop + this.dragOriginScrollTop - e.clientY;
                _a = this.getRealCoords(x, y), x = _a[0], y = _a[1];
                this.removeClass(document.body, this.classGrabbing);
                this.inner.parentElement.style.cssText = this.parentOriginStyle;
                this.dragging = false;
                this.removeEventListener(document.documentElement, "mousemove", this.mouseMoveHandler);
                this.removeEventListener(document.documentElement, "mouseup", this.mouseUpHandler);
                if (y !== this.getScrollTop() || x !== this.getScrollLeft()) {
                    var t = this.present - (this.past ? this.past : this.present);
                    if (t > 0.05) {
                        /* just align to the grid if the mouse left unmoved for more than 0.05 seconds */
                        this.scrollTo(x, y, this.options.dragOptions.fade);
                    }
                }
                if (this.options.dragOptions.fade && typeof this.vx !== "undefined" && typeof this.vy !== "undefined") {
                    var vx = void 0, vy = void 0;
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
                var deltaT, deltaSx, deltaSy, lastDeltaSx, lastDeltaSy, lastT, lastSx, lastSy;
                deltaT = deltaSx = deltaSy = lastDeltaSx = lastDeltaSy = 0;
                lastT = lastSx = lastSy = undefined;
                for (var i in this.vy) {
                    if (this.vy.hasOwnProperty(i)) {
                        if (parseFloat(i) > (present - timeSpan) &&
                            typeof lastT !== "undefined" &&
                            typeof lastSx !== "undefined" &&
                            typeof lastSy !== "undefined") {
                            deltaT += parseFloat(i) - lastT;
                            lastDeltaSx = this.vx[i] - lastSx;
                            lastDeltaSy = this.vy[i] - lastSy;
                            deltaSx += Math.abs(lastDeltaSx);
                            deltaSy += Math.abs(lastDeltaSy);
                        }
                        lastT = parseFloat(i);
                        lastSx = this.vx[i];
                        lastSy = this.vy[i];
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
                // stick the element to the grid, if grid equals 1 the value does not change
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
                var i = 0;
                for (i = 0; i < ((tmax * fps) + (0 / fps)); i++) {
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
                this.addEventListener(this.inner, "collide.left", this.clearListenerLeft);
                this.addEventListener(this.inner, "collide.right", this.clearListenerRight);
                this.addEventListener(this.inner, "collide.top", this.clearListenerTop);
                this.addEventListener(this.inner, "collide.bottom", this.clearListenerBottom);
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
                this.present = (this.getTimestamp() / 1000); // seconds
                this.clearTextSelection();
                /* if the mouse left the window and the button is not pressed anymore, abort moving */
                if (("which" in e && e.which === 0) || (typeof e.which === "undefined" && "button" in e && e.button === 0)) {
                    this.mouseUp(e);
                    return;
                }
                var x = this.dragOriginLeft + this.dragOriginScrollLeft - e.clientX;
                var y = this.dragOriginTop + this.dragOriginScrollTop - e.clientY;
                /* if elastic edges are set, show the element pseudo scrolled by relative position */
                if (this.triggered.collideBottom && this.options.elasticEdges.bottom === true) {
                    this.inner.style.position = "relative";
                    this.inner.style.top = ((this.getScrollTop() - y) / 2) + "px";
                }
                if (this.triggered.collideTop && this.options.elasticEdges.top === true) {
                    this.inner.style.position = "relative";
                    this.inner.style.top = (y / -2) + "px";
                }
                if (this.triggered.collideLeft && this.options.elasticEdges.left === true) {
                    this.inner.style.position = "relative";
                    this.inner.style.left = (x / -2) + "px";
                }
                if (this.triggered.collideRight && this.options.elasticEdges.right === true) {
                    this.inner.style.position = "relative";
                    this.inner.style.left = ((this.getScrollLeft() - x) / 2) + "px";
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
                var f = event.replace(/\.([a-z])/, String.call.bind(event.toUpperCase)).replace(/\./, "");
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
                for (var event_1 in this.customEvents) {
                    if (this.customEvents.hasOwnProperty(event_1)) {
                        for (var p in this.customEvents[event_1]) {
                            if (this.customEvents[event_1].hasOwnProperty(p)) {
                                this.removeEventListener(this.inner, event_1, this.customEvents[event_1][p][0]);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiendvb3NoLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIihmdW5jdGlvbiAoZmFjdG9yeSkge1xuICAgIGlmICh0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlLmV4cG9ydHMgPT09ICdvYmplY3QnKSB7XG4gICAgICAgIHZhciB2ID0gZmFjdG9yeShyZXF1aXJlLCBleHBvcnRzKTsgaWYgKHYgIT09IHVuZGVmaW5lZCkgbW9kdWxlLmV4cG9ydHMgPSB2O1xuICAgIH1cbiAgICBlbHNlIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICAgICAgZGVmaW5lKFtcInJlcXVpcmVcIiwgXCJleHBvcnRzXCJdLCBmYWN0b3J5KTtcbiAgICB9XG59KShmdW5jdGlvbiAocmVxdWlyZSwgZXhwb3J0cykge1xuICAgIFwidXNlIHN0cmljdFwiO1xuICAgIC8qKlxuICAgICAqIEV4cG9ydCBmdW5jdGlvbiBvZiB0aGUgbW9kdWxlXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBjb250YWluZXIgLSBUaGUgSFRNTEVsZW1lbnQgdG8gc3dvb29vc2ghXG4gICAgICogQHBhcmFtIHtPcHRpb25zfSBvcHRpb25zIC0gdGhlIG9wdGlvbnMgb2JqZWN0IHRvIGNvbmZpZ3VyZSBad29vc2hcbiAgICAgKiBAcmV0dXJuIHtad29vc2h9IC0gWndvb3NoIG9iamVjdCBpbnN0YW5jZVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIHp3b29zaChjb250YWluZXIsIG9wdGlvbnMpIHtcbiAgICAgICAgaWYgKG9wdGlvbnMgPT09IHZvaWQgMCkgeyBvcHRpb25zID0ge307IH1cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFBvbHlmaWxsIGJpbmQgZnVuY3Rpb24gZm9yIG9sZGVyIGJyb3dzZXJzXG4gICAgICAgICAqIFRoZSBiaW5kIGZ1bmN0aW9uIGlzIGFuIGFkZGl0aW9uIHRvIEVDTUEtMjYyLCA1dGggZWRpdGlvblxuICAgICAgICAgKiBAc2VlOiBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9HbG9iYWxfT2JqZWN0cy9GdW5jdGlvbi9iaW5kXG4gICAgICAgICAqL1xuICAgICAgICBpZiAoIUZ1bmN0aW9uLnByb3RvdHlwZS5iaW5kKSB7XG4gICAgICAgICAgICBGdW5jdGlvbi5wcm90b3R5cGUuYmluZCA9IGZ1bmN0aW9uIChvVGhpcykge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdGhpcyAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNsb3Nlc3QgdGhpbmcgcG9zc2libGUgdG8gdGhlIEVDTUFTY3JpcHQgNVxuICAgICAgICAgICAgICAgICAgICAvLyBpbnRlcm5hbCBJc0NhbGxhYmxlIGZ1bmN0aW9uXG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJGdW5jdGlvbi5wcm90b3R5cGUuYmluZCAtIHdoYXQgaXMgdHJ5aW5nIHRvIGJlIGJvdW5kIGlzIG5vdCBjYWxsYWJsZVwiKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIGFBcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSwgZlRvQmluZCA9IHRoaXMsIEZOT1AgPSBmdW5jdGlvbiAoKSB7IH0sIGZCb3VuZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZUb0JpbmQuYXBwbHkodGhpcyBpbnN0YW5jZW9mIEZOT1AgPyB0aGlzIDogb1RoaXMsIGFBcmdzLmNvbmNhdChBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpKSk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5wcm90b3R5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gRnVuY3Rpb24ucHJvdG90eXBlIGRvZXNuJ3QgaGF2ZSBhIHByb3RvdHlwZSBwcm9wZXJ0eVxuICAgICAgICAgICAgICAgICAgICBGTk9QLnByb3RvdHlwZSA9IHRoaXMucHJvdG90eXBlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBmQm91bmQucHJvdG90eXBlID0gbmV3IEZOT1AoKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZkJvdW5kO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICAvKipcbiAgICAgICAgICogUG9seWZpbGwgYXJyYXkuaW5kZXhPZiBmdW5jdGlvbiBmb3Igb2xkZXIgYnJvd3NlcnNcbiAgICAgICAgICogVGhlIGluZGV4T2YoKSBmdW5jdGlvbiB3YXMgYWRkZWQgdG8gdGhlIEVDTUEtMjYyIHN0YW5kYXJkIGluIHRoZSA1dGggZWRpdGlvblxuICAgICAgICAgKiBhcyBzdWNoIGl0IG1heSBub3QgYmUgcHJlc2VudCBpbiBhbGwgYnJvd3NlcnMuXG4gICAgICAgICAqIEBzZWUgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSmF2YVNjcmlwdC9SZWZlcmVuY2UvR2xvYmFsX09iamVjdHMvQXJyYXkvaW5kZXhPZlxuICAgICAgICAgKi9cbiAgICAgICAgaWYgKCFBcnJheS5wcm90b3R5cGUuaW5kZXhPZikge1xuICAgICAgICAgICAgQXJyYXkucHJvdG90eXBlLmluZGV4T2YgPSBmdW5jdGlvbiAoc2VhcmNoRWxlbWVudCwgZnJvbUluZGV4KSB7XG4gICAgICAgICAgICAgICAgdmFyIGs7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIid0aGlzJyBpcyBudWxsIG9yIG5vdCBkZWZpbmVkXCIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgbyA9IE9iamVjdCh0aGlzKTtcbiAgICAgICAgICAgICAgICB2YXIgbGVuID0gby5sZW5ndGggPj4+IDA7XG4gICAgICAgICAgICAgICAgaWYgKGxlbiA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciBuID0gK2Zyb21JbmRleCB8fCAwO1xuICAgICAgICAgICAgICAgIGlmIChNYXRoLmFicyhuKSA9PT0gSW5maW5pdHkpIHtcbiAgICAgICAgICAgICAgICAgICAgbiA9IDA7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChuID49IGxlbikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGsgPSBNYXRoLm1heChuID49IDAgPyBuIDogbGVuIC0gTWF0aC5hYnMobiksIDApO1xuICAgICAgICAgICAgICAgIHdoaWxlIChrIDwgbGVuKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChrIGluIG8gJiYgb1trXSA9PT0gc2VhcmNoRWxlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaysrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIC8qIGxpc3Qgb2YgcmVhbCBldmVudHMgKi9cbiAgICAgICAgdmFyIGh0bWxFdmVudHMgPSB7XG4gICAgICAgICAgICAvKiA8Ym9keT4gYW5kIDxmcmFtZXNldD4gRXZlbnRzICovXG4gICAgICAgICAgICBvbmxvYWQ6IDEsXG4gICAgICAgICAgICBvbnVubG9hZDogMSxcbiAgICAgICAgICAgIC8qIEZvcm0gRXZlbnRzICovXG4gICAgICAgICAgICBvbmJsdXI6IDEsXG4gICAgICAgICAgICBvbmNoYW5nZTogMSxcbiAgICAgICAgICAgIG9uZm9jdXM6IDEsXG4gICAgICAgICAgICBvbnJlc2V0OiAxLFxuICAgICAgICAgICAgb25zZWxlY3Q6IDEsXG4gICAgICAgICAgICBvbnN1Ym1pdDogMSxcbiAgICAgICAgICAgIC8qIEltYWdlIEV2ZW50cyAqL1xuICAgICAgICAgICAgb25hYm9ydDogMSxcbiAgICAgICAgICAgIC8qIEtleWJvYXJkIEV2ZW50cyAqL1xuICAgICAgICAgICAgb25rZXlkb3duOiAxLFxuICAgICAgICAgICAgb25rZXlwcmVzczogMSxcbiAgICAgICAgICAgIG9ua2V5dXA6IDEsXG4gICAgICAgICAgICAvKiBNb3VzZSBFdmVudHMgKi9cbiAgICAgICAgICAgIG9uY2xpY2s6IDEsXG4gICAgICAgICAgICBvbmRibGNsaWNrOiAxLFxuICAgICAgICAgICAgb25tb3VzZWRvd246IDEsXG4gICAgICAgICAgICBvbm1vdXNlbW92ZTogMSxcbiAgICAgICAgICAgIG9ubW91c2VvdXQ6IDEsXG4gICAgICAgICAgICBvbm1vdXNlb3ZlcjogMSxcbiAgICAgICAgICAgIG9ubW91c2V1cDogMVxuICAgICAgICB9O1xuICAgICAgICB2YXIgbWFwRXZlbnRzID0ge1xuICAgICAgICAgICAgb25zY3JvbGw6IHdpbmRvd1xuICAgICAgICB9O1xuICAgICAgICA7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBad29vc2ggcHJvdmlkZXMgYSBzZXQgb2YgZnVuY3Rpb25zIHRvIGltcGxlbWVudCBzY3JvbGwgYnkgZHJhZywgem9vbSBieSBtb3VzZXdoZWVsLFxuICAgICAgICAgKiBoYXNoIGxpbmtzIGluc2lkZSB0aGUgZG9jdW1lbnQgYW5kIG90aGVyIHNwZWNpYWwgc2Nyb2xsIHJlbGF0ZWQgcmVxdWlyZW1lbnRzLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAYXV0aG9yIFJvbWFuIEdydWJlciA8cDEwMjAzODlAeWFob28uY29tPlxuICAgICAgICAgKiBAdmVyc2lvbiAxLjAuMVxuICAgICAgICAgKi9cbiAgICAgICAgdmFyIFp3b29zaCA9IChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBmdW5jdGlvbiBad29vc2goY29udGFpbmVyLCBvcHRpb25zKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jb250YWluZXIgPSBjb250YWluZXI7XG4gICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcbiAgICAgICAgICAgICAgICAvKiBDU1Mgc3R5bGUgY2xhc3NlcyAqL1xuICAgICAgICAgICAgICAgIHRoaXMuY2xhc3NJbm5lciA9IFwienctaW5uZXJcIjtcbiAgICAgICAgICAgICAgICB0aGlzLmNsYXNzT3V0ZXIgPSBcInp3LW91dGVyXCI7XG4gICAgICAgICAgICAgICAgdGhpcy5jbGFzc0dyYWIgPSBcInp3LWdyYWJcIjtcbiAgICAgICAgICAgICAgICB0aGlzLmNsYXNzTm9HcmFiID0gXCJ6dy1ub2dyYWJcIjtcbiAgICAgICAgICAgICAgICB0aGlzLmNsYXNzR3JhYmJpbmcgPSBcInp3LWdyYWJiaW5nXCI7XG4gICAgICAgICAgICAgICAgdGhpcy5jbGFzc1VuaXF1ZSA9IFwienctXCIgKyBNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zdWJzdHJpbmcoNyk7XG4gICAgICAgICAgICAgICAgdGhpcy5jbGFzc1NjYWxlID0gXCJ6dy1zY2FsZVwiO1xuICAgICAgICAgICAgICAgIHRoaXMuY2xhc3NJZ25vcmUgPSBcInp3LWlnbm9yZVwiO1xuICAgICAgICAgICAgICAgIHRoaXMuY2xhc3NGYWtlQm9keSA9IFwienctZmFrZWJvZHlcIjtcbiAgICAgICAgICAgICAgICAvKiBhcnJheSBob2xkaW5nIHRoZSBjdXN0b20gZXZlbnRzIG1hcHBpbmcgY2FsbGJhY2tzIHRvIGJvdW5kIGNhbGxiYWNrcyAqL1xuICAgICAgICAgICAgICAgIHRoaXMuY3VzdG9tRXZlbnRzID0gW107XG4gICAgICAgICAgICAgICAgdGhpcy50cmlnZ2VyZWQgPSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbGxpZGVMZWZ0OiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgY29sbGlkZVRvcDogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIGNvbGxpZGVSaWdodDogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIGNvbGxpZGVCb3R0b206IGZhbHNlXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAvKiBmYWRlT3V0ICovXG4gICAgICAgICAgICAgICAgdGhpcy50aW1lb3V0cyA9IFtdO1xuICAgICAgICAgICAgICAgIHRoaXMudnggPSBbXTtcbiAgICAgICAgICAgICAgICB0aGlzLnZ5ID0gW107XG4gICAgICAgICAgICAgICAgdGhpcy5jb250YWluZXIgPSBjb250YWluZXI7XG4gICAgICAgICAgICAgICAgLyogc2V0IGRlZmF1bHQgb3B0aW9ucyAqL1xuICAgICAgICAgICAgICAgIHZhciBkZWZhdWx0T3B0aW9ucyA9IHtcbiAgICAgICAgICAgICAgICAgICAgLyogMSBtZWFucyBkbyBub3QgYWxpZ24gdG8gYSBncmlkICovXG4gICAgICAgICAgICAgICAgICAgIGdyaWRYOiAxLFxuICAgICAgICAgICAgICAgICAgICBncmlkWTogMSxcbiAgICAgICAgICAgICAgICAgICAgLyogc2hvd3MgYSBncmlkIGFzIGFuIG92ZXJsYXkgb3ZlciB0aGUgZWxlbWVudC4gV29ya3Mgb25seSBpZiB0aGUgYnJvd3NlciBzdXBwb3J0c1xuICAgICAgICAgICAgICAgICAgICAgKiBDU1MgR2VuZXJhdGVkIGNvbnRlbnQgZm9yIHBzZXVkby1lbGVtZW50c1xuICAgICAgICAgICAgICAgICAgICAgKiBAc2VlIGh0dHA6Ly9jYW5pdXNlLmNvbS8jc2VhcmNoPSUzQWJlZm9yZSAqL1xuICAgICAgICAgICAgICAgICAgICBncmlkU2hvdzogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIC8qIHdoaWNoIGVkZ2Ugc2hvdWxkIGJlIGVsYXN0aWMgKi9cbiAgICAgICAgICAgICAgICAgICAgZWxhc3RpY0VkZ2VzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZWZ0OiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHJpZ2h0OiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvcDogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICBib3R0b206IGZhbHNlXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIC8qIGFjdGl2YXRlcy9kZWFjdGl2YXRlcyBzY3JvbGxpbmcgYnkgZHJhZyAqL1xuICAgICAgICAgICAgICAgICAgICBkcmFnU2Nyb2xsOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBkcmFnT3B0aW9uczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgZXhjbHVkZTogW1wiaW5wdXRcIiwgXCJ0ZXh0YXJlYVwiLCBcImFcIiwgXCJidXR0b25cIiwgXCIuXCIgKyB0aGlzLmNsYXNzSWdub3JlLCBcInNlbGVjdFwiXSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG9ubHk6IFtdLFxuICAgICAgICAgICAgICAgICAgICAgICAgLyogYWN0aXZhdGVzIGEgc2Nyb2xsIGZhZGUgd2hlbiBzY3JvbGxpbmcgYnkgZHJhZyAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgZmFkZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIGZhZGU6IGJyYWtlIGFjY2VsZXJhdGlvbiBpbiBwaXhlbHMgcGVyIHNlY29uZCBwZXIgc2Vjb25kIChwL3NeMikgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIGJyYWtlU3BlZWQ6IDI1MDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBmYWRlOiBmcmFtZXMgcGVyIHNlY29uZCBvZiB0aGUgendvb3NoIGZhZGVvdXQgYW5pbWF0aW9uICg+PTI1IGxvb2tzIGxpa2UgbW90aW9uKSAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgZnBzOiAzMCxcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIGZhZGU6IHRoaXMgc3BlZWQgd2lsbCBuZXZlciBiZSBleGNlZWRlZCAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgbWF4U3BlZWQ6IDMwMDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBmYWRlOiBtaW5pbXVtIHNwZWVkIHdoaWNoIHRyaWdnZXJzIHRoZSBmYWRlICovXG4gICAgICAgICAgICAgICAgICAgICAgICBtaW5TcGVlZDogMzAwXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIC8qIGFjdGl2YXRlcy9kZWFjdGl2YXRlcyBzY3JvbGxpbmcgYnkgd2hlZWwuIElmIHRoZSBkcmVpY3Rpb24gaXMgdmVydGljYWwgYW5kIHRoZXJlIGFyZVxuICAgICAgICAgICAgICAgICAgICAgKiBzY3JvbGxiYXJzIHByZXNlbnQsIHp3b29zaCBsZXRzIGxlYXZlcyBzY3JvbGxpbmcgdG8gdGhlIGJyb3dzZXIuICovXG4gICAgICAgICAgICAgICAgICAgIHdoZWVsU2Nyb2xsOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICB3aGVlbE9wdGlvbnM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIGRpcmVjdGlvbiB0byBzY3JvbGwgd2hlbiB0aGUgbW91c2Ugd2hlZWwgaXMgdXNlZCAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgZGlyZWN0aW9uOiBcInZlcnRpY2FsXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBhbW91bnQgb2YgcGl4ZWxzIGZvciBvbmUgc2Nyb2xsIHN0ZXAgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIHN0ZXA6IDExNCxcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIHNjcm9sbCBzbW9vdGggb3IgaW5zdGFudCAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgc21vb3RoOiB0cnVlXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIC8qIGFjdGl2YXRlcy9kZWFjdGl2YXRlcyB6b29taW5nIGJ5IHdoZWVsLiBXb3JrcyBvbmx5IHdpdGggYSBDU1MzIDJEIFRyYW5zZm9ybSBjYXBhYmxlIGJyb3dzZXIuXG4gICAgICAgICAgICAgICAgICAgICAqIEBzZWUgaHR0cDovL2Nhbml1c2UuY29tLyNmZWF0PXRyYW5zZm9ybXMyZCAqL1xuICAgICAgICAgICAgICAgICAgICB3aGVlbFpvb206IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICB6b29tT3B0aW9uczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgLyogdGhlIG1heGltdW0gc2NhbGUsIDAgbWVhbnMgbm8gbWF4aW11bSAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgbWF4U2NhbGU6IDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiB0aGUgbWluaW11bSBzY2FsZSwgMCBtZWFucyBubyBtaW5pbXVtICovXG4gICAgICAgICAgICAgICAgICAgICAgICBtaW5TY2FsZTogMCxcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIG9uZSBzdGVwIHdoZW4gdXNpbmcgdGhlIHdoZWVsIHRvIHpvb20gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIHN0ZXA6IDAuMSxcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIG1vdXNlIHdoZWVsIGRpcmVjdGlvbiB0byB6b29tIGxhcmdlciAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgZGlyZWN0aW9uOiBcInVwXCJcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgLyogbGV0IHp3b29zaCBoYW5kbGUgYW5jaG9yIGxpbmtzIHRhcmdldGluZyB0byBhbiBhbmNob3IgaW5zaWRlIG9mIHRoaXMgendvb3NoIGVsZW1lbnQuXG4gICAgICAgICAgICAgICAgICAgICAqIHRoZSBlbGVtZW50IG91dHNpZGUgKG1heWJlIHRoZSBib2R5KSBoYW5kbGVzIGFuY2hvcnMgdG9vLiBJZiB5b3Ugd2FudCB0byBwcmV2ZW50IHRoaXMsXG4gICAgICAgICAgICAgICAgICAgICAqIGFkZCB0byBib2R5IGFzIHp3b29zaCBlbGVtZW50IHRvby4gKi9cbiAgICAgICAgICAgICAgICAgICAgaGFuZGxlQW5jaG9yczogdHJ1ZVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zID0gdGhpcy5tZXJnZShvcHRpb25zLCBkZWZhdWx0T3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgdGhpcy5pbml0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIE1lcmdlIHRoZSBkZWZhdWx0IG9wdGlvbiBvYmplY3Qgd2l0aCB0aGUgcHJvdmlkZWQgb25lXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQHBhcmFtIHtPcHRpb25zfSBvcHRpb25zIC0gdGhlIGdpdmVuIG9wdGlvbnNcbiAgICAgICAgICAgICAqIEBwYXJhbSB7T3B0aW9uc30gZGVmYXVsdE9wdGlvbnMgLSB0aGUgZGVmYXVsdCBvcHRpb25zXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHtPcHRpb25zfSAtIHRoZSBtZXJnZWQgb3B0aW9ucyBvYmplY3RcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgWndvb3NoLnByb3RvdHlwZS5tZXJnZSA9IGZ1bmN0aW9uIChvcHRpb25zLCBkZWZhdWx0T3B0aW9ucykge1xuICAgICAgICAgICAgICAgIC8qIG1lcmdlIHRoZSBkZWZhdWx0IG9wdGlvbiBvYmplY3Qgd2l0aCB0aGUgcHJvdmlkZWQgb25lICovXG4gICAgICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIG9wdGlvbnMpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zW2tleV0gPT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBva2V5IGluIG9wdGlvbnNba2V5XSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAob3B0aW9uc1trZXldLmhhc093blByb3BlcnR5KG9rZXkpKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdE9wdGlvbnNba2V5XVtva2V5XSA9IG9wdGlvbnNba2V5XVtva2V5XTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0T3B0aW9uc1trZXldID0gb3B0aW9uc1trZXldO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBkZWZhdWx0T3B0aW9ucztcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEluaXRpYWxpemUgRE9NIG1hbmlwdWxhdGlvbnMgYW5kIGV2ZW50IGhhbmRsZXJzXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQHJldHVybiB7dm9pZH1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgWndvb3NoLnByb3RvdHlwZS5pbml0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgICAgICAgICAgdGhpcy5pbml0Qm9keSgpO1xuICAgICAgICAgICAgICAgIHRoaXMuYWRkQ2xhc3ModGhpcy5jb250YWluZXIsIHRoaXMuY2xhc3NPdXRlcik7XG4gICAgICAgICAgICAgICAgdGhpcy5zY3JvbGxFbGVtZW50ID0gdGhpcy5jb250YWluZXI7XG4gICAgICAgICAgICAgICAgdmFyIHggPSB0aGlzLmdldFNjcm9sbExlZnQoKTtcbiAgICAgICAgICAgICAgICB2YXIgeSA9IHRoaXMuZ2V0U2Nyb2xsVG9wKCk7XG4gICAgICAgICAgICAgICAgLyogY3JlYXRlIGlubmVyIGRpdiBlbGVtZW50IGFuZCBhcHBlbmQgaXQgdG8gdGhlIGNvbnRhaW5lciB3aXRoIGl0cyBjb250ZW50cyBpbiBpdCAqL1xuICAgICAgICAgICAgICAgIHRoaXMuaW5uZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgICAgICAgICAgIHRoaXMuYWRkQ2xhc3ModGhpcy5pbm5lciwgdGhpcy5jbGFzc0lubmVyKTtcbiAgICAgICAgICAgICAgICB0aGlzLmFkZENsYXNzKHRoaXMuaW5uZXIsIHRoaXMuY2xhc3NVbmlxdWUpO1xuICAgICAgICAgICAgICAgIHRoaXMuc2NhbGVFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgICAgICAgICAgICB0aGlzLmFkZENsYXNzKHRoaXMuc2NhbGVFbGVtZW50LCB0aGlzLmNsYXNzU2NhbGUpO1xuICAgICAgICAgICAgICAgIHRoaXMuc2NhbGVFbGVtZW50LmFwcGVuZENoaWxkKHRoaXMuaW5uZXIpO1xuICAgICAgICAgICAgICAgIC8qIG1vdmUgYWxsIGNoaWxkTm9kZXMgdG8gdGhlIG5ldyBpbm5lciBlbGVtZW50ICovXG4gICAgICAgICAgICAgICAgd2hpbGUgKHRoaXMuY29udGFpbmVyLmNoaWxkTm9kZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmlubmVyLmFwcGVuZENoaWxkKHRoaXMuY29udGFpbmVyLmNoaWxkTm9kZXNbMF0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLmNvbnRhaW5lci5hcHBlbmRDaGlsZCh0aGlzLnNjYWxlRWxlbWVudCk7XG4gICAgICAgICAgICAgICAgdmFyIGJvcmRlciA9IHRoaXMuZ2V0Qm9yZGVyKHRoaXMuY29udGFpbmVyKTtcbiAgICAgICAgICAgICAgICB0aGlzLmlubmVyLnN0eWxlLm1pbldpZHRoID0gKHRoaXMuY29udGFpbmVyLnNjcm9sbFdpZHRoIC0gYm9yZGVyWzBdKSArIFwicHhcIjtcbiAgICAgICAgICAgICAgICB0aGlzLmlubmVyLnN0eWxlLm1pbkhlaWdodCA9ICh0aGlzLmNvbnRhaW5lci5zY3JvbGxIZWlnaHQgLSBib3JkZXJbMV0pICsgXCJweFwiO1xuICAgICAgICAgICAgICAgIHRoaXMuc2NhbGVFbGVtZW50LnN0eWxlLm1pbldpZHRoID0gdGhpcy5pbm5lci5zdHlsZS5taW5XaWR0aDtcbiAgICAgICAgICAgICAgICB0aGlzLnNjYWxlRWxlbWVudC5zdHlsZS5taW5IZWlnaHQgPSB0aGlzLmlubmVyLnN0eWxlLm1pbkhlaWdodDtcbiAgICAgICAgICAgICAgICB0aGlzLnNjYWxlRWxlbWVudC5zdHlsZS5vdmVyZmxvdyA9IFwiaGlkZGVuXCI7XG4gICAgICAgICAgICAgICAgdGhpcy5pbml0R3JpZCgpO1xuICAgICAgICAgICAgICAgIHRoaXMub2xkQ2xpZW50V2lkdGggPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50V2lkdGg7XG4gICAgICAgICAgICAgICAgdGhpcy5vbGRDbGllbnRIZWlnaHQgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50SGVpZ2h0O1xuICAgICAgICAgICAgICAgIC8qIGp1c3QgY2FsbCB0aGUgZnVuY3Rpb24sIHRvIHRyaWdnZXIgcG9zc2libGUgZXZlbnRzICovXG4gICAgICAgICAgICAgICAgdGhpcy5vblNjcm9sbCgpO1xuICAgICAgICAgICAgICAgIC8qIHNjcm9sbCB0byB0aGUgaW5pdGlhbCBwb3NpdGlvbiAqL1xuICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsVG8oeCwgeSwgZmFsc2UpO1xuICAgICAgICAgICAgICAgIC8qIEV2ZW50IGhhbmRsZXIgcmVnaXN0cmF0aW9uIHN0YXJ0IGhlcmUgKi9cbiAgICAgICAgICAgICAgICB0aGlzLmluaXRXaGVlbFNjcm9sbCgpO1xuICAgICAgICAgICAgICAgIHRoaXMuaW5pdFdoZWVsWm9vbSgpO1xuICAgICAgICAgICAgICAgIC8qIHNjcm9sbGhhbmRsZXIgKi9cbiAgICAgICAgICAgICAgICB0aGlzLnNjcm9sbEhhbmRsZXIgPSBmdW5jdGlvbiAoZSkgeyByZXR1cm4gX3RoaXMub25TY3JvbGwoZSk7IH07XG4gICAgICAgICAgICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKHRoaXMuY29udGFpbmVyLCBcInNjcm9sbFwiLCB0aGlzLnNjcm9sbEhhbmRsZXIpO1xuICAgICAgICAgICAgICAgIC8qIGlmIHRoZSBzY3JvbGwgZWxlbWVudCBpcyBib2R5LCBhZGp1c3QgdGhlIGlubmVyIGRpdiB3aGVuIHJlc2l6aW5nICovXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuaXNCb2R5KSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVzaXplSGFuZGxlciA9IGZ1bmN0aW9uIChlKSB7IHJldHVybiBfdGhpcy5vblJlc2l6ZShlKTsgfTsgLy8gVE9ETzogc2FtZSBhcyBhYm92ZSBpbiB0aGUgd2hlZWwgaGFuZGxlclxuICAgICAgICAgICAgICAgICAgICB3aW5kb3cub25yZXNpemUgPSB0aGlzLnJlc2l6ZUhhbmRsZXI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuaW5pdERyYWdTY3JvbGwoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmluaXRBbmNob3JzKCk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBSZWluaXRpYWxpemUgdGhlIHp3b29zaCBlbGVtZW50XG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQHJldHVybiB7Wndvb3NofSAtIFRoZSBad29vc2ggb2JqZWN0IGluc3RhbmNlXG4gICAgICAgICAgICAgKiBAVE9ETzogcHJlc2VydmUgc2Nyb2xsIHBvc2l0aW9uIGluIGluaXQoKVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLnJlaW5pdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmRlc3Ryb3koKTtcbiAgICAgICAgICAgICAgICB0aGlzLmNsYXNzVW5pcXVlID0gXCJ6dy1cIiArIE1hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpLnN1YnN0cmluZyg3KTtcbiAgICAgICAgICAgICAgICB0aGlzLmluaXQoKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLmluaXRCb2R5ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHRoaXMuaXNCb2R5ID0gdGhpcy5jb250YWluZXIudGFnTmFtZSA9PT0gXCJCT0RZXCIgPyB0cnVlIDogZmFsc2U7XG4gICAgICAgICAgICAgICAgLyogQ2hyb21lIHNvbHV0aW9uIHRvIHNjcm9sbCB0aGUgYm9keSBpcyBub3QgcmVhbGx5IHZpYWJsZSwgc28gd2UgY3JlYXRlIGEgZmFrZSBib2R5XG4gICAgICAgICAgICAgICAgICogZGl2IGVsZW1lbnQgdG8gc2Nyb2xsIG9uICovXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuaXNCb2R5ID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBwc2V1ZG9Cb2R5ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGRDbGFzcyhwc2V1ZG9Cb2R5LCB0aGlzLmNsYXNzRmFrZUJvZHkpO1xuICAgICAgICAgICAgICAgICAgICBwc2V1ZG9Cb2R5LnN0eWxlLmNzc1RleHQgPSBkb2N1bWVudC5ib2R5LnN0eWxlLmNzc1RleHQ7XG4gICAgICAgICAgICAgICAgICAgIHdoaWxlICh0aGlzLmNvbnRhaW5lci5jaGlsZE5vZGVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBzZXVkb0JvZHkuYXBwZW5kQ2hpbGQodGhpcy5jb250YWluZXIuY2hpbGROb2Rlc1swXSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jb250YWluZXIuYXBwZW5kQ2hpbGQocHNldWRvQm9keSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY29udGFpbmVyID0gcHNldWRvQm9keTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgWndvb3NoLnByb3RvdHlwZS5pbml0R3JpZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAvKiBzaG93IHRoZSBncmlkIG9ubHkgaWYgYXQgbGVhc3Qgb25lIG9mIHRoZSBncmlkIHZhbHVlcyBpcyBub3QgMSAqL1xuICAgICAgICAgICAgICAgIGlmICgodGhpcy5vcHRpb25zLmdyaWRYICE9PSAxIHx8IHRoaXMub3B0aW9ucy5ncmlkWSAhPT0gMSkgJiYgdGhpcy5vcHRpb25zLmdyaWRTaG93KSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBiZ2kgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5ncmlkWCAhPT0gMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYmdpLnB1c2goXCJsaW5lYXItZ3JhZGllbnQodG8gcmlnaHQsIGdyZXkgMXB4LCB0cmFuc3BhcmVudCAxcHgpXCIpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMuZ3JpZFkgIT09IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJnaS5wdXNoKFwibGluZWFyLWdyYWRpZW50KHRvIGJvdHRvbSwgZ3JleSAxcHgsIHRyYW5zcGFyZW50IDFweClcIik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGRCZWZvcmVDU1ModGhpcy5jbGFzc1VuaXF1ZSwgXCJ3aWR0aFwiLCB0aGlzLmlubmVyLnN0eWxlLm1pbldpZHRoKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGRCZWZvcmVDU1ModGhpcy5jbGFzc1VuaXF1ZSwgXCJoZWlnaHRcIiwgdGhpcy5pbm5lci5zdHlsZS5taW5IZWlnaHQpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZEJlZm9yZUNTUyh0aGlzLmNsYXNzVW5pcXVlLCBcImxlZnRcIiwgXCItXCIgKyB0aGlzLmdldFN0eWxlKHRoaXMuY29udGFpbmVyLCBcInBhZGRpbmdMZWZ0XCIpKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGRCZWZvcmVDU1ModGhpcy5jbGFzc1VuaXF1ZSwgXCJ0b3BcIiwgXCItXCIgKyB0aGlzLmdldFN0eWxlKHRoaXMuY29udGFpbmVyLCBcInBhZGRpbmdUb3BcIikpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZEJlZm9yZUNTUyh0aGlzLmNsYXNzVW5pcXVlLCBcImJhY2tncm91bmQtc2l6ZVwiLCAodGhpcy5vcHRpb25zLmdyaWRYICE9PSAxID8gdGhpcy5vcHRpb25zLmdyaWRYICsgXCJweCBcIiA6IFwiYXV0byBcIikgKyAodGhpcy5vcHRpb25zLmdyaWRZICE9PSAxID8gdGhpcy5vcHRpb25zLmdyaWRZICsgXCJweFwiIDogXCJhdXRvXCIpKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGRCZWZvcmVDU1ModGhpcy5jbGFzc1VuaXF1ZSwgXCJiYWNrZ3JvdW5kLWltYWdlXCIsIGJnaS5qb2luKFwiLCBcIikpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLmluaXRXaGVlbFNjcm9sbCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICAgICAgICAgIC8qIFRPRE86IG5vdCAyIGRpZmZlcmVudCBldmVudCBoYW5kbGVycyByZWdpc3RyYXRpb25zIC0+IGRvIGl0IGluIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcigpICovXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy53aGVlbFNjcm9sbCA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5tb3VzZVNjcm9sbEhhbmRsZXIgPSBmdW5jdGlvbiAoZSkgeyByZXR1cm4gX3RoaXMuZGlzYWJsZU1vdXNlU2Nyb2xsKGUpOyB9O1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNjcm9sbEVsZW1lbnQub25tb3VzZXdoZWVsID0gdGhpcy5tb3VzZVNjcm9sbEhhbmRsZXI7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcih0aGlzLnNjcm9sbEVsZW1lbnQsIFwid2hlZWxcIiwgdGhpcy5tb3VzZVNjcm9sbEhhbmRsZXIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmICh0aGlzLm9wdGlvbnMud2hlZWxTY3JvbGwgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5tb3VzZVNjcm9sbEhhbmRsZXIgPSBmdW5jdGlvbiAoZSkgeyByZXR1cm4gX3RoaXMuYWN0aXZlTW91c2VTY3JvbGwoZSk7IH07XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsRWxlbWVudC5vbm1vdXNld2hlZWwgPSB0aGlzLm1vdXNlU2Nyb2xsSGFuZGxlcjtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKHRoaXMuc2Nyb2xsRWxlbWVudCwgXCJ3aGVlbFwiLCB0aGlzLm1vdXNlU2Nyb2xsSGFuZGxlcik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIC8qIHdoZWVsem9vbSAqL1xuICAgICAgICAgICAgWndvb3NoLnByb3RvdHlwZS5pbml0V2hlZWxab29tID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5ncmlkU2hvdykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNjYWxlVG8oMSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMud2hlZWxab29tID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubW91c2Vab29tSGFuZGxlciA9IGZ1bmN0aW9uIChlKSB7IHJldHVybiBfdGhpcy5hY3RpdmVNb3VzZVpvb20oZSk7IH07XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcih0aGlzLnNjcm9sbEVsZW1lbnQsIFwid2hlZWxcIiwgdGhpcy5tb3VzZVpvb21IYW5kbGVyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgWndvb3NoLnByb3RvdHlwZS5pbml0RHJhZ1Njcm9sbCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICAgICAgICAgIC8qIGlmIGRyYWdzY3JvbGwgaXMgYWN0aXZhdGVkLCByZWdpc3RlciBtb3VzZWRvd24gZXZlbnQgKi9cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLmRyYWdTY3JvbGwgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGRDbGFzcyh0aGlzLmlubmVyLCB0aGlzLmNsYXNzR3JhYik7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubW91c2VEb3duSGFuZGxlciA9IGZ1bmN0aW9uIChlKSB7IHJldHVybiBfdGhpcy5tb3VzZURvd24oZSk7IH07XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcih0aGlzLmlubmVyLCBcIm1vdXNlZG93blwiLCB0aGlzLm1vdXNlRG93bkhhbmRsZXIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGRDbGFzcyh0aGlzLmNvbnRhaW5lciwgdGhpcy5jbGFzc05vR3JhYik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIFp3b29zaC5wcm90b3R5cGUuaW5pdEFuY2hvcnMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLmhhbmRsZUFuY2hvcnMgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGxpbmtzID0gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvckFsbChcImFbaHJlZl49JyMnXVwiKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5oYXNoQ2hhbmdlQ2xpY2tIYW5kbGVyID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0YXJnZXQgPSBlID8gZS50YXJnZXQgOiB3aW5kb3cuZXZlbnQuc3JjRWxlbWVudDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdGFyZ2V0ICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogcHVzaFN0YXRlIGNoYW5nZXMgdGhlIGhhc2ggd2l0aG91dCB0cmlnZ2VyaW5nIGhhc2hjaGFuZ2UgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoaXN0b3J5LnB1c2hTdGF0ZSh7fSwgXCJcIiwgdGFyZ2V0LmhyZWYpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIHdlIGRvbid0IHdhbnQgdG8gdHJpZ2dlciBoYXNoY2hhbmdlLCBzbyBwcmV2ZW50IGRlZmF1bHQgYmVoYXZpb3Igd2hlbiBjbGlja2luZyBvbiBhbmNob3IgbGlua3MgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZS5wcmV2ZW50RGVmYXVsdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlLnJldHVyblZhbHVlID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgLyogdHJpZ2dlciBhIGN1c3RvbSBoYXNoY2hhbmdlIGV2ZW50LCBiZWNhdXNlIHB1c2hTdGF0ZSBwcmV2ZW50cyB0aGUgcmVhbCBoYXNoY2hhbmdlIGV2ZW50ICovXG4gICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy50cmlnZ2VyRXZlbnQod2luZG93LCBcIm15aGFzaGNoYW5nZVwiKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgLyogbG9vcCB0cm91Z2ggYWxsIGFuY2hvciBsaW5rcyBpbiB0aGUgZWxlbWVudCBhbmQgZGlzYWJsZSB0aGVtIHRvIHByZXZlbnQgdGhlXG4gICAgICAgICAgICAgICAgICAgICAqIGJyb3dzZXIgZnJvbSBzY3JvbGxpbmcgYmVjYXVzZSBvZiB0aGUgY2hhbmdpbmcgaGFzaCB2YWx1ZS4gSW5zdGVhZCB0aGUgb3duXG4gICAgICAgICAgICAgICAgICAgICAqIGV2ZW50IG15aGFzaGNoYW5nZSBzaG91bGQgaGFuZGxlIHBhZ2UgYW5kIGVsZW1lbnQgc2Nyb2xsaW5nICovXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGlua3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcihsaW5rc1tpXSwgXCJjbGlja1wiLCB0aGlzLmhhc2hDaGFuZ2VDbGlja0hhbmRsZXIsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0aGlzLmhhc2hDaGFuZ2VIYW5kbGVyID0gZnVuY3Rpb24gKGUpIHsgcmV0dXJuIF90aGlzLm9uSGFzaENoYW5nZShlKTsgfTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKHdpbmRvdywgXCJteWhhc2hjaGFuZ2VcIiwgdGhpcy5oYXNoQ2hhbmdlSGFuZGxlcik7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcih3aW5kb3csIFwiaGFzaGNoYW5nZVwiLCB0aGlzLmhhc2hDaGFuZ2VIYW5kbGVyKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vbkhhc2hDaGFuZ2UoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLyogQFRPRE86IFNjcm9sbFdpZHRoIGFuZCBDbGllbnRXaWR0aCBTY3JvbGxIZWlnaHQgQ2xpZW50SGVpZ2h0ICovXG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLmdldFNjcm9sbExlZnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuc2Nyb2xsRWxlbWVudC5zY3JvbGxMZWZ0O1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIFp3b29zaC5wcm90b3R5cGUuc2V0U2Nyb2xsTGVmdCA9IGZ1bmN0aW9uIChsZWZ0KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zY3JvbGxFbGVtZW50LnNjcm9sbExlZnQgPSBsZWZ0O1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIFp3b29zaC5wcm90b3R5cGUuZ2V0U2Nyb2xsVG9wID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnNjcm9sbEVsZW1lbnQuc2Nyb2xsVG9wO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIFp3b29zaC5wcm90b3R5cGUuc2V0U2Nyb2xsVG9wID0gZnVuY3Rpb24gKHRvcCkge1xuICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsRWxlbWVudC5zY3JvbGxUb3AgPSB0b3A7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBIYW5kbGUgaGFzaGNoYW5nZXMgd2l0aCBvd24gc2Nyb2xsIGZ1bmN0aW9uXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQHBhcmFtIHtFdmVudH0gZSAtIHRoZSBoYXNoY2hhbmdlIG9yIG15aGFzaGNoYW5nZSBldmVudCwgb3Igbm90aGluZ1xuICAgICAgICAgICAgICogQHJldHVybiB7dm9pZH1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgWndvb3NoLnByb3RvdHlwZS5vbkhhc2hDaGFuZ2UgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgIGlmIChlID09PSB2b2lkIDApIHsgZSA9IG51bGw7IH1cbiAgICAgICAgICAgICAgICB2YXIgaGFzaCA9IHdpbmRvdy5sb2NhdGlvbi5oYXNoLnN1YnN0cigxKTtcbiAgICAgICAgICAgICAgICBpZiAoaGFzaCAhPT0gXCJcIikge1xuICAgICAgICAgICAgICAgICAgICB2YXIgYW5jaG9ycyA9IHRoaXMuY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3JBbGwoXCIjXCIgKyBoYXNoKTtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhbmNob3JzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgZWxlbWVudCA9IGFuY2hvcnNbaV07XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgY29udGFpbmVyXzEgPSBhbmNob3JzW2ldO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZmluZCB0aGUgbmV4dCBwYXJlbnQgd2hpY2ggaXMgYSBjb250YWluZXIgZWxlbWVudFxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG5leHRDb250YWluZXIgPSBlbGVtZW50O1xuICAgICAgICAgICAgICAgICAgICAgICAgd2hpbGUgKGNvbnRhaW5lcl8xICYmIGNvbnRhaW5lcl8xLnBhcmVudEVsZW1lbnQgJiYgdGhpcy5jb250YWluZXIgIT09IGNvbnRhaW5lcl8xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuaGFzQ2xhc3MoY29udGFpbmVyXzEsIHRoaXMuY2xhc3NPdXRlcikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV4dENvbnRhaW5lciA9IGNvbnRhaW5lcl8xO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250YWluZXJfMSA9IGNvbnRhaW5lcl8xLnBhcmVudEVsZW1lbnQ7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlLnR5cGUgPT09IFwiaGFzaGNoYW5nZVwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIHNjcm9sbGluZyBpbnN0YW50bHkgYmFjayB0byBvcmlnaW4sIGJlZm9yZSBkbyB0aGUgYW5pbWF0ZWQgc2Nyb2xsICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsVG8odGhpcy5vcmlnaW5TY3JvbGxMZWZ0LCB0aGlzLm9yaWdpblNjcm9sbFRvcCwgZmFsc2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsVG9FbGVtZW50KG5leHRDb250YWluZXIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogU2Nyb2xsIHRvIGFuIGVsZW1lbnQgaW4gdGhlIERPTVxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsZW1lbnQgLSB0aGUgSFRNTEVsZW1lbnQgdG8gc2Nyb2xsIHRvXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIFp3b29zaC5wcm90b3R5cGUuc2Nyb2xsVG9FbGVtZW50ID0gZnVuY3Rpb24gKGVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAvKiBnZXQgcmVsYXRpdmUgY29vcmRzIGZyb20gdGhlIGFuY2hvciBlbGVtZW50ICovXG4gICAgICAgICAgICAgICAgdmFyIHggPSAoZWxlbWVudC5vZmZzZXRMZWZ0IC0gdGhpcy5jb250YWluZXIub2Zmc2V0TGVmdCkgKiB0aGlzLmdldFNjYWxlKCk7XG4gICAgICAgICAgICAgICAgdmFyIHkgPSAoZWxlbWVudC5vZmZzZXRUb3AgLSB0aGlzLmNvbnRhaW5lci5vZmZzZXRUb3ApICogdGhpcy5nZXRTY2FsZSgpO1xuICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsVG8oeCwgeSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBXb3JrYXJvdW5kIHRvIG1hbmlwdWxhdGUgOjpiZWZvcmUgQ1NTIHN0eWxlcyB3aXRoIGphdmFzY3JpcHRcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gY3NzQ2xhc3MgLSB0aGUgQ1NTIGNsYXNzIG5hbWUgdG8gYWRkIDo6YmVmb3JlIHByb3BlcnRpZXNcbiAgICAgICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBjc3NQcm9wZXJ0eSAtIHRoZSBDU1MgcHJvcGVydHkgdG8gc2V0XG4gICAgICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gY3NzVmFsdWUgLSB0aGUgQ1NTIHZhbHVlIHRvIHNldFxuICAgICAgICAgICAgICogQHJldHVybiB7dm9pZH1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgWndvb3NoLnByb3RvdHlwZS5hZGRCZWZvcmVDU1MgPSBmdW5jdGlvbiAoY3NzQ2xhc3MsIGNzc1Byb3BlcnR5LCBjc3NWYWx1ZSkge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgZG9jdW1lbnQuc3R5bGVTaGVldHNbMF0uaW5zZXJ0UnVsZSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgICAgIGRvY3VtZW50LnN0eWxlU2hlZXRzWzBdLmluc2VydFJ1bGUoXCIuXCIgKyBjc3NDbGFzcyArIFwiOjpiZWZvcmUgeyBcIiArIGNzc1Byb3BlcnR5ICsgXCI6IFwiICsgY3NzVmFsdWUgKyBcIn1cIiwgMCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHR5cGVvZiBkb2N1bWVudC5zdHlsZVNoZWV0c1swXS5hZGRSdWxlID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQuc3R5bGVTaGVldHNbMF0uYWRkUnVsZShcIi5cIiArIGNzc0NsYXNzICsgXCI6OmJlZm9yZVwiLCBjc3NQcm9wZXJ0eSArIFwiOiBcIiArIGNzc1ZhbHVlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBHZXQgY29tcHV0ZSBwaXhlbCBudW1iZXIgb2YgdGhlIHdob2xlIHdpZHRoIGFuZCBoZWlnaHQgZnJvbSBhIGJvcmRlciBvZiBhbiBlbGVtZW50XG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWwgLSB0aGUgSFRNTCBlbGVtZW50XG4gICAgICAgICAgICAgKiBAcmV0dXJuIHthcnJheX0gW3dpZHRoLCBoZWlnaHRdIC0gdGhlIGFtb3VudCBvZiBwaXhlbHNcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgWndvb3NoLnByb3RvdHlwZS5nZXRCb3JkZXIgPSBmdW5jdGlvbiAoZWwpIHtcbiAgICAgICAgICAgICAgICB2YXIgYmwgPSB0aGlzLmNvbnZlcnRCb3JkZXIodGhpcy5nZXRTdHlsZShlbCwgXCJib3JkZXJMZWZ0V2lkdGhcIikpO1xuICAgICAgICAgICAgICAgIHZhciBiciA9IHRoaXMuY29udmVydEJvcmRlcih0aGlzLmdldFN0eWxlKGVsLCBcImJvcmRlclJpZ2h0V2lkdGhcIikpO1xuICAgICAgICAgICAgICAgIHZhciBwbCA9IHRoaXMuY29udmVydFNwYW4odGhpcy5nZXRTdHlsZShlbCwgXCJwYWRkaW5nTGVmdFwiKSk7XG4gICAgICAgICAgICAgICAgdmFyIHByID0gdGhpcy5jb252ZXJ0U3Bhbih0aGlzLmdldFN0eWxlKGVsLCBcInBhZGRpbmdSaWdodFwiKSk7XG4gICAgICAgICAgICAgICAgdmFyIG1sID0gdGhpcy5jb252ZXJ0U3Bhbih0aGlzLmdldFN0eWxlKGVsLCBcIm1hcmdpbkxlZnRcIikpO1xuICAgICAgICAgICAgICAgIHZhciBtciA9IHRoaXMuY29udmVydFNwYW4odGhpcy5nZXRTdHlsZShlbCwgXCJtYXJnaW5SaWdodFwiKSk7XG4gICAgICAgICAgICAgICAgdmFyIGJ0ID0gdGhpcy5jb252ZXJ0Qm9yZGVyKHRoaXMuZ2V0U3R5bGUoZWwsIFwiYm9yZGVyVG9wV2lkdGhcIikpO1xuICAgICAgICAgICAgICAgIHZhciBiYiA9IHRoaXMuY29udmVydEJvcmRlcih0aGlzLmdldFN0eWxlKGVsLCBcImJvcmRlckJvdHRvbVdpZHRoXCIpKTtcbiAgICAgICAgICAgICAgICB2YXIgcHQgPSB0aGlzLmNvbnZlcnRTcGFuKHRoaXMuZ2V0U3R5bGUoZWwsIFwicGFkZGluZ1RvcFwiKSk7XG4gICAgICAgICAgICAgICAgdmFyIHBiID0gdGhpcy5jb252ZXJ0U3Bhbih0aGlzLmdldFN0eWxlKGVsLCBcInBhZGRpbmdCb3R0b21cIikpO1xuICAgICAgICAgICAgICAgIHZhciBtdCA9IHRoaXMuY29udmVydFNwYW4odGhpcy5nZXRTdHlsZShlbCwgXCJtYXJnaW5Ub3BcIikpO1xuICAgICAgICAgICAgICAgIHZhciBtYiA9IHRoaXMuY29udmVydFNwYW4odGhpcy5nZXRTdHlsZShlbCwgXCJtYXJnaW5Cb3R0b21cIikpO1xuICAgICAgICAgICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICAgICAgICAgIChwbCArIHByICsgYmwgKyBiciArIG1sICsgbXIpLFxuICAgICAgICAgICAgICAgICAgICAocHQgKyBwYiArIGJ0ICsgYmIgKyBtdCArIG1iKVxuICAgICAgICAgICAgICAgIF07XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgWndvb3NoLnByb3RvdHlwZS5jb252ZXJ0Qm9yZGVyID0gZnVuY3Rpb24gKGIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYiA9PT0gXCJ0aGluXCIgPyAxIDogYiA9PT0gXCJtZWRpdW1cIiA/IDMgOiBiID09PSBcInRoaWNrXCIgPyA1IDogIWlzTmFOKHBhcnNlSW50KGIsIDEwKSkgPyBwYXJzZUludChiLCAxMCkgOiAwO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIFp3b29zaC5wcm90b3R5cGUuY29udmVydFNwYW4gPSBmdW5jdGlvbiAodikge1xuICAgICAgICAgICAgICAgIHJldHVybiB2ID09PSBcImF1dG9cIiA/IDAgOiAhaXNOYU4ocGFyc2VJbnQodiwgMTApKSA/IHBhcnNlSW50KHYsIDEwKSA6IDA7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBEaXNhYmxlcyB0aGUgc2Nyb2xsIHdoZWVsIG9mIHRoZSBtb3VzZVxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBwYXJhbSB7TW91c2VXaGVlbEV2ZW50fSBlIC0gdGhlIG1vdXNlIHdoZWVsIGV2ZW50XG4gICAgICAgICAgICAgKiBAcmV0dXJuIHt2b2lkfVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLmRpc2FibGVNb3VzZVNjcm9sbCA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuZWxlbWVudEJlaGluZEN1cnNvcklzTWUoZS5jbGllbnRYLCBlLmNsaWVudFkpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY2xlYXJUaW1lb3V0cygpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGUgPSB3aW5kb3cuZXZlbnQ7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKGUucHJldmVudERlZmF1bHQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGUucmV0dXJuVmFsdWUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIERldGVybWluZSB3aGV0aGVyIGFuIGVsZW1lbnQgaGFzIGEgc2Nyb2xsYmFyIG9yIG5vdFxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsZW1lbnQgLSB0aGUgSFRNTEVsZW1lbnRcbiAgICAgICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBkaXJlY3Rpb24gLSBkZXRlcm1pbmUgdGhlIHZlcnRpY2FsIG9yIGhvcml6b250YWwgc2Nyb2xsYmFyP1xuICAgICAgICAgICAgICogQHJldHVybiB7Ym9vbGVhbn0gLSB3aGV0aGVyIHRoZSBlbGVtZW50IGhhcyBzY3JvbGxiYXJzIG9yIG5vdFxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLmhhc1Njcm9sbGJhciA9IGZ1bmN0aW9uIChlbGVtZW50LCBkaXJlY3Rpb24pIHtcbiAgICAgICAgICAgICAgICB2YXIgaGFzID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgdmFyIG92ZXJmbG93ID0gXCJvdmVyZmxvd1wiO1xuICAgICAgICAgICAgICAgIGlmIChkaXJlY3Rpb24gPT09IFwidmVydGljYWxcIikge1xuICAgICAgICAgICAgICAgICAgICBvdmVyZmxvdyA9IFwib3ZlcmZsb3dZXCI7XG4gICAgICAgICAgICAgICAgICAgIGhhcyA9IGVsZW1lbnQuc2Nyb2xsSGVpZ2h0ID4gZWxlbWVudC5jbGllbnRIZWlnaHQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKGRpcmVjdGlvbiA9PT0gXCJob3Jpem9udGFsXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgb3ZlcmZsb3cgPSBcIm92ZXJmbG93WFwiO1xuICAgICAgICAgICAgICAgICAgICBoYXMgPSBlbGVtZW50LnNjcm9sbFdpZHRoID4gZWxlbWVudC5jbGllbnRXaWR0aDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gQ2hlY2sgdGhlIG92ZXJmbG93IGFuZCBvdmVyZmxvd0RpcmVjdGlvbiBwcm9wZXJ0aWVzIGZvciBcImF1dG9cIiBhbmQgXCJ2aXNpYmxlXCIgdmFsdWVzXG4gICAgICAgICAgICAgICAgaGFzID0gdGhpcy5nZXRTdHlsZSh0aGlzLmNvbnRhaW5lciwgXCJvdmVyZmxvd1wiKSA9PT0gXCJ2aXNpYmxlXCIgfHxcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5nZXRTdHlsZSh0aGlzLmNvbnRhaW5lciwgXCJvdmVyZmxvd1lcIikgPT09IFwidmlzaWJsZVwiIHx8XG4gICAgICAgICAgICAgICAgICAgIChoYXMgJiYgdGhpcy5nZXRTdHlsZSh0aGlzLmNvbnRhaW5lciwgXCJvdmVyZmxvd1wiKSA9PT0gXCJhdXRvXCIpIHx8XG4gICAgICAgICAgICAgICAgICAgIChoYXMgJiYgdGhpcy5nZXRTdHlsZSh0aGlzLmNvbnRhaW5lciwgXCJvdmVyZmxvd1lcIikgPT09IFwiYXV0b1wiKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gaGFzO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogRW5hYmxlcyB0aGUgc2Nyb2xsIHdoZWVsIG9mIHRoZSBtb3VzZSB0byBzY3JvbGwsIHNwZWNpYWxseSBmb3IgZGl2cyB3aXRob3VyIHNjcm9sbGJhclxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBwYXJhbSB7TW91c2VXaGVlbEV2ZW50fSBlIC0gdGhlIG1vdXNlIHdoZWVsIGV2ZW50XG4gICAgICAgICAgICAgKiBAcmV0dXJuIHt2b2lkfVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLmFjdGl2ZU1vdXNlU2Nyb2xsID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgICBpZiAoIWUpIHtcbiAgICAgICAgICAgICAgICAgICAgZSA9IHdpbmRvdy5ldmVudDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuZWxlbWVudEJlaGluZEN1cnNvcklzTWUoZS5jbGllbnRYLCBlLmNsaWVudFkpKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBkaXJlY3Rpb24gPSB2b2lkIDA7XG4gICAgICAgICAgICAgICAgICAgIGlmIChcImRlbHRhWVwiIGluIGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpcmVjdGlvbiA9IGUuZGVsdGFZID4gMCA/IFwiZG93blwiIDogXCJ1cFwiO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKFwid2hlZWxEZWx0YVwiIGluIGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpcmVjdGlvbiA9IGUud2hlZWxEZWx0YSA+IDAgPyBcInVwXCIgOiBcImRvd25cIjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAvKiB1c2UgdGhlIG5vcm1hbCBzY3JvbGwsIHdoZW4gdGhlcmUgYXJlIHNjcm9sbGJhcnMgYW5kIHRoZSBkaXJlY3Rpb24gaXMgXCJ2ZXJ0aWNhbFwiICovXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMud2hlZWxPcHRpb25zLmRpcmVjdGlvbiA9PT0gXCJ2ZXJ0aWNhbFwiICYmIHRoaXMuaGFzU2Nyb2xsYmFyKHRoaXMuc2Nyb2xsRWxlbWVudCwgdGhpcy5vcHRpb25zLndoZWVsT3B0aW9ucy5kaXJlY3Rpb24pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoISgodGhpcy50cmlnZ2VyZWQuY29sbGlkZUJvdHRvbSAmJiBkaXJlY3Rpb24gPT09IFwiZG93blwiKSB8fCAodGhpcy50cmlnZ2VyZWQuY29sbGlkZVRvcCAmJiBkaXJlY3Rpb24gPT09IFwidXBcIikpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jbGVhclRpbWVvdXRzKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZGlzYWJsZU1vdXNlU2Nyb2xsKGUpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgeCA9IHRoaXMuZ2V0U2Nyb2xsTGVmdCgpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgeSA9IHRoaXMuZ2V0U2Nyb2xsVG9wKCk7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMud2hlZWxPcHRpb25zLmRpcmVjdGlvbiA9PT0gXCJob3Jpem9udGFsXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHggPSB0aGlzLmdldFNjcm9sbExlZnQoKSArIChkaXJlY3Rpb24gPT09IFwiZG93blwiID8gdGhpcy5vcHRpb25zLndoZWVsT3B0aW9ucy5zdGVwIDogdGhpcy5vcHRpb25zLndoZWVsT3B0aW9ucy5zdGVwICogLTEpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKHRoaXMub3B0aW9ucy53aGVlbE9wdGlvbnMuZGlyZWN0aW9uID09PSBcInZlcnRpY2FsXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHkgPSB0aGlzLmdldFNjcm9sbFRvcCgpICsgKGRpcmVjdGlvbiA9PT0gXCJkb3duXCIgPyB0aGlzLm9wdGlvbnMud2hlZWxPcHRpb25zLnN0ZXAgOiB0aGlzLm9wdGlvbnMud2hlZWxPcHRpb25zLnN0ZXAgKiAtMSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zY3JvbGxUbyh4LCB5LCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogRW5hYmxlcyB0aGUgc2Nyb2xsIHdoZWVsIG9mIHRoZSBtb3VzZSB0byB6b29tXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQHBhcmFtIHtNb3VzZVdoZWVsRXZlbnR9IGUgLSB0aGUgbW91c2Ugd2hlZWwgZXZlbnRcbiAgICAgICAgICAgICAqIEByZXR1cm4ge3ZvaWR9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIFp3b29zaC5wcm90b3R5cGUuYWN0aXZlTW91c2Vab29tID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgICBpZiAoIWUpIHtcbiAgICAgICAgICAgICAgICAgICAgZSA9IHdpbmRvdy5ldmVudDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuZWxlbWVudEJlaGluZEN1cnNvcklzTWUoZS5jbGllbnRYLCBlLmNsaWVudFkpKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBkaXJlY3Rpb24gPSB2b2lkIDA7XG4gICAgICAgICAgICAgICAgICAgIGlmIChcImRlbHRhWVwiIGluIGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpcmVjdGlvbiA9IGUuZGVsdGFZID4gMCA/IFwiZG93blwiIDogXCJ1cFwiO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKFwid2hlZWxEZWx0YVwiIGluIGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpcmVjdGlvbiA9IGUud2hlZWxEZWx0YSA+IDAgPyBcInVwXCIgOiBcImRvd25cIjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB2YXIgc2NhbGUgPSB2b2lkIDA7XG4gICAgICAgICAgICAgICAgICAgIGlmIChkaXJlY3Rpb24gPT09IHRoaXMub3B0aW9ucy56b29tT3B0aW9ucy5kaXJlY3Rpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjYWxlID0gdGhpcy5nZXRTY2FsZSgpICogKDEgKyB0aGlzLm9wdGlvbnMuem9vbU9wdGlvbnMuc3RlcCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzY2FsZSA9IHRoaXMuZ2V0U2NhbGUoKSAvICgxICsgdGhpcy5vcHRpb25zLnpvb21PcHRpb25zLnN0ZXApO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2NhbGVUbyhzY2FsZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQ2FsY3VsYXRlcyB0aGUgc2l6ZSBvZiB0aGUgdmVydGljYWwgc2Nyb2xsYmFyLlxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsIC0gVGhlIEhUTUxFbGVtZW1udFxuICAgICAgICAgICAgICogQHJldHVybiB7bnVtYmVyfSAtIHRoZSBhbW91bnQgb2YgcGl4ZWxzIHVzZWQgYnkgdGhlIHZlcnRpY2FsIHNjcm9sbGJhclxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLnNjcm9sbGJhcldpZHRoID0gZnVuY3Rpb24gKGVsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGVsLm9mZnNldFdpZHRoIC0gZWwuY2xpZW50V2lkdGggLSBwYXJzZUludCh0aGlzLmdldFN0eWxlKGVsLCBcImJvcmRlckxlZnRXaWR0aFwiKSkgLSBwYXJzZUludCh0aGlzLmdldFN0eWxlKGVsLCBcImJvcmRlclJpZ2h0V2lkdGhcIikpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQ2FsY3VsYXRlcyB0aGUgc2l6ZSBvZiB0aGUgaG9yaXpvbnRhbCBzY3JvbGxiYXIuXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWwgLSBUaGUgSFRNTEVsZW1lbW50XG4gICAgICAgICAgICAgKiBAcmV0dXJuIHtudW1iZXJ9IC0gdGhlIGFtb3VudCBvZiBwaXhlbHMgdXNlZCBieSB0aGUgaG9yaXpvbnRhbCBzY3JvbGxiYXJcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgWndvb3NoLnByb3RvdHlwZS5zY3JvbGxiYXJIZWlnaHQgPSBmdW5jdGlvbiAoZWwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZWwub2Zmc2V0SGVpZ2h0IC0gZWwuY2xpZW50SGVpZ2h0IC0gcGFyc2VJbnQodGhpcy5nZXRTdHlsZShlbCwgXCJib3JkZXJUb3BXaWR0aFwiKSkgLSBwYXJzZUludCh0aGlzLmdldFN0eWxlKGVsLCBcImJvcmRlckJvdHRvbVdpZHRoXCIpKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFJldHJpZXZlcyB0aGUgY3VycmVudCBzY2FsZSB2YWx1ZSBvciAxIGlmIGl0IGlzIG5vdCBzZXQuXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQHJldHVybiB7bnVtYmVyfSAtIHRoZSBjdXJyZW50IHNjYWxlIHZhbHVlXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIFp3b29zaC5wcm90b3R5cGUuZ2V0U2NhbGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB0aGlzLmlubmVyLnN0eWxlLnRyYW5zZm9ybSAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAgICAgICAgICAgICB2YXIgciA9IHRoaXMuaW5uZXIuc3R5bGUudHJhbnNmb3JtLm1hdGNoKC9zY2FsZVxcKChbMC05LFxcLl0rKVxcKS8pIHx8IFtcIlwiXTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHBhcnNlRmxvYXQoclsxXSkgfHwgMTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIDE7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBTY2FsZXMgdGhlIGlubmVyIGVsZW1lbnQgYnkgYSByZWxhdGljZSB2YWx1ZSBiYXNlZCBvbiB0aGUgY3VycmVudCBzY2FsZSB2YWx1ZS5cbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0gcGVyY2VudCAtIHBlcmNlbnRhZ2Ugb2YgdGhlIGN1cnJlbnQgc2NhbGUgdmFsdWVcbiAgICAgICAgICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gaG9ub3VyTGltaXRzIC0gd2hldGhlciB0byBob25vdXIgbWF4U2NhbGUgYW5kIHRoZSBtaW5pbXVtIHdpZHRoIGFuZCBoZWlnaHRcbiAgICAgICAgICAgICAqIG9mIHRoZSBjb250YWluZXIgZWxlbWVudC5cbiAgICAgICAgICAgICAqIEByZXR1cm4ge3ZvaWR9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIFp3b29zaC5wcm90b3R5cGUuc2NhbGVCeSA9IGZ1bmN0aW9uIChwZXJjZW50LCBob25vdXJMaW1pdHMpIHtcbiAgICAgICAgICAgICAgICBpZiAoaG9ub3VyTGltaXRzID09PSB2b2lkIDApIHsgaG9ub3VyTGltaXRzID0gdHJ1ZTsgfVxuICAgICAgICAgICAgICAgIHZhciBzY2FsZSA9IHRoaXMuZ2V0U2NhbGUoKSAqIChwZXJjZW50IC8gMTAwKTtcbiAgICAgICAgICAgICAgICB0aGlzLnNjYWxlVG8oc2NhbGUsIGhvbm91ckxpbWl0cyk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBTY2FsZXMgdGhlIGlubmVyIGVsZW1lbnQgdG8gYW4gYWJzb2x1dGUgdmFsdWUuXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IHNjYWxlIC0gdGhlIHNjYWxlXG4gICAgICAgICAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IGhvbm91ckxpbWl0cyAtIHdoZXRoZXIgdG8gaG9ub3VyIG1heFNjYWxlIGFuZCB0aGUgbWluaW11bSB3aWR0aCBhbmQgaGVpZ2h0XG4gICAgICAgICAgICAgKiBvZiB0aGUgY29udGFpbmVyIGVsZW1lbnQuXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHt2b2lkfVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLnNjYWxlVG8gPSBmdW5jdGlvbiAoc2NhbGUsIGhvbm91ckxpbWl0cykge1xuICAgICAgICAgICAgICAgIGlmIChob25vdXJMaW1pdHMgPT09IHZvaWQgMCkgeyBob25vdXJMaW1pdHMgPSB0cnVlOyB9XG4gICAgICAgICAgICAgICAgdmFyIHdpZHRoID0gKHBhcnNlRmxvYXQodGhpcy5pbm5lci5zdHlsZS5taW5XaWR0aCkgKiBzY2FsZSk7XG4gICAgICAgICAgICAgICAgdmFyIGhlaWdodCA9IChwYXJzZUZsb2F0KHRoaXMuaW5uZXIuc3R5bGUubWluSGVpZ2h0KSAqIHNjYWxlKTtcbiAgICAgICAgICAgICAgICAvKiBzY3JvbGxiYXJzIGhhdmUgd2lkdGggYW5kIGhlaWdodCB0b28gKi9cbiAgICAgICAgICAgICAgICB2YXIgbWluV2lkdGggPSB0aGlzLmNvbnRhaW5lci5jbGllbnRXaWR0aCArIHRoaXMuc2Nyb2xsYmFyV2lkdGgodGhpcy5jb250YWluZXIpO1xuICAgICAgICAgICAgICAgIHZhciBtaW5IZWlnaHQgPSB0aGlzLmNvbnRhaW5lci5jbGllbnRIZWlnaHQgKyB0aGlzLnNjcm9sbGJhckhlaWdodCh0aGlzLmNvbnRhaW5lcik7XG4gICAgICAgICAgICAgICAgaWYgKGhvbm91ckxpbWl0cykge1xuICAgICAgICAgICAgICAgICAgICAvKiBsb29wIGFzIGxvbmcgYXMgYWxsIGxpbWl0cyBhcmUgaG9ub3VyZWQgKi9cbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKChzY2FsZSA+IHRoaXMub3B0aW9ucy56b29tT3B0aW9ucy5tYXhTY2FsZSAmJiB0aGlzLm9wdGlvbnMuem9vbU9wdGlvbnMubWF4U2NhbGUgIT09IDApIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAoc2NhbGUgPCB0aGlzLm9wdGlvbnMuem9vbU9wdGlvbnMubWluU2NhbGUgJiYgdGhpcy5vcHRpb25zLnpvb21PcHRpb25zLm1pblNjYWxlICE9PSAwKSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgKHdpZHRoIDwgdGhpcy5jb250YWluZXIuY2xpZW50V2lkdGggJiYgIXRoaXMuaXNCb2R5KSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgKGhlaWdodCA8IHRoaXMuY29udGFpbmVyLmNsaWVudEhlaWdodCAmJiAhdGhpcy5pc0JvZHkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2NhbGUgPiB0aGlzLm9wdGlvbnMuem9vbU9wdGlvbnMubWF4U2NhbGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY2FsZSA9IHRoaXMub3B0aW9ucy56b29tT3B0aW9ucy5tYXhTY2FsZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKHNjYWxlIDwgdGhpcy5vcHRpb25zLnpvb21PcHRpb25zLm1pblNjYWxlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2NhbGUgPSB0aGlzLm9wdGlvbnMuem9vbU9wdGlvbnMubWluU2NhbGU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLnpvb21PcHRpb25zLm1heFNjYWxlICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGggPSBNYXRoLmZsb29yKHBhcnNlSW50KHRoaXMuaW5uZXIuc3R5bGUubWluV2lkdGgpICogc2NhbGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodCA9IE1hdGguZmxvb3IocGFyc2VJbnQodGhpcy5pbm5lci5zdHlsZS5taW5IZWlnaHQpICogc2NhbGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHdpZHRoIDwgbWluV2lkdGggJiYgIXRoaXMuaXNCb2R5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2NhbGUgPSBzY2FsZSAvIHdpZHRoICogbWluV2lkdGg7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0ID0gTWF0aC5mbG9vcihwYXJzZUludCh0aGlzLmlubmVyLnN0eWxlLm1pbkhlaWdodCkgKiBzY2FsZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGggPSBtaW5XaWR0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChoZWlnaHQgPCBtaW5IZWlnaHQgJiYgIXRoaXMuaXNCb2R5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2NhbGUgPSBzY2FsZSAvIGhlaWdodCAqIG1pbkhlaWdodDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWR0aCA9IE1hdGguZmxvb3IocGFyc2VJbnQodGhpcy5pbm5lci5zdHlsZS5taW5XaWR0aCkgKiBzY2FsZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0ID0gbWluSGVpZ2h0O1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuaW5uZXIuc3R5bGUudHJhbnNmb3JtID0gXCJ0cmFuc2xhdGUoMHB4LCAwcHgpIHNjYWxlKFwiICsgc2NhbGUgKyBcIilcIjtcbiAgICAgICAgICAgICAgICB0aGlzLnNjYWxlRWxlbWVudC5zdHlsZS5taW5XaWR0aCA9IHRoaXMuc2NhbGVFbGVtZW50LnN0eWxlLndpZHRoID0gd2lkdGggKyBcInB4XCI7XG4gICAgICAgICAgICAgICAgdGhpcy5zY2FsZUVsZW1lbnQuc3R5bGUubWluSGVpZ2h0ID0gdGhpcy5zY2FsZUVsZW1lbnQuc3R5bGUuaGVpZ2h0ID0gaGVpZ2h0ICsgXCJweFwiO1xuICAgICAgICAgICAgICAgIC8qIFRPRE86IGhlcmUgc2Nyb2xsVG8gYmFzZWQgb24gd2hlcmUgdGhlIG1vdXNlIGN1cnNvciBpcyAqL1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogRGlzYWJsZXMgdGhlIHNjcm9sbCB3aGVlbCBvZiB0aGUgbW91c2VcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0geCAtIHRoZSB4LWNvb3JkaW5hdGVzXG4gICAgICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0geSAtIHRoZSB5LWNvb3JkaW5hdGVzXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHtib29sZWFufSAtIHdoZXRoZXIgdGhlIG5lYXJlc3QgcmVsYXRlZCBwYXJlbnQgaW5uZXIgZWxlbWVudCBpcyB0aGUgb25lIG9mIHRoaXMgb2JqZWN0IGluc3RhbmNlXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIFp3b29zaC5wcm90b3R5cGUuZWxlbWVudEJlaGluZEN1cnNvcklzTWUgPSBmdW5jdGlvbiAoeCwgeSkge1xuICAgICAgICAgICAgICAgIHZhciBlbGVtZW50QmVoaW5kQ3Vyc29yID0gZG9jdW1lbnQuZWxlbWVudEZyb21Qb2ludCh4LCB5KTtcbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBJZiB0aGUgZWxlbWVudCBkaXJlY3RseSBiZWhpbmQgdGhlIGN1cnNvciBpcyBhbiBvdXRlciBlbGVtZW50IHRocm93IG91dCwgYmVjYXVzZSB3aGVuIGNsaWNraW5nIG9uIGEgc2Nyb2xsYmFyXG4gICAgICAgICAgICAgICAgICogZnJvbSBhIGRpdiwgYSBkcmFnIG9mIHRoZSBwYXJlbnQgWndvb3NoIGVsZW1lbnQgaXMgaW5pdGlhdGVkLlxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmhhc0NsYXNzKGVsZW1lbnRCZWhpbmRDdXJzb3IsIHRoaXMuY2xhc3NPdXRlcikpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvKiBmaW5kIHRoZSBuZXh0IHBhcmVudCB3aGljaCBpcyBhbiBpbm5lciBlbGVtZW50ICovXG4gICAgICAgICAgICAgICAgd2hpbGUgKGVsZW1lbnRCZWhpbmRDdXJzb3IgJiYgIXRoaXMuaGFzQ2xhc3MoZWxlbWVudEJlaGluZEN1cnNvciwgdGhpcy5jbGFzc0lubmVyKSkge1xuICAgICAgICAgICAgICAgICAgICBlbGVtZW50QmVoaW5kQ3Vyc29yID0gZWxlbWVudEJlaGluZEN1cnNvci5wYXJlbnRFbGVtZW50O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5pbm5lciA9PT0gZWxlbWVudEJlaGluZEN1cnNvcjtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLmdldFRpbWVzdGFtcCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHdpbmRvdy5wZXJmb3JtYW5jZSA9PT0gXCJvYmplY3RcIikge1xuICAgICAgICAgICAgICAgICAgICBpZiAoXCJub3dcIiBpbiB3aW5kb3cucGVyZm9ybWFuY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB3aW5kb3cucGVyZm9ybWFuY2Uubm93KCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoXCJ3ZWJraXROb3dcIiBpbiB3aW5kb3cucGVyZm9ybWFuY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB3aW5kb3cucGVyZm9ybWFuY2Uud2Via2l0Tm93KCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogU2Nyb2xsIGhhbmRsZXIgdG8gdHJpZ2dlciB0aGUgY3VzdG9tIGV2ZW50c1xuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBwYXJhbSB7RXZlbnR9IGUgLSBUaGUgc2Nyb2xsIGV2ZW50IG9iamVjdCAoVE9ETzogbmVlZGVkPylcbiAgICAgICAgICAgICAqIEB0aHJvd3MgRXZlbnQgY29sbGlkZUxlZnRcbiAgICAgICAgICAgICAqIEB0aHJvd3MgRXZlbnQgY29sbGlkZVJpZ2h0XG4gICAgICAgICAgICAgKiBAdGhyb3dzIEV2ZW50IGNvbGxpZGVUb3BcbiAgICAgICAgICAgICAqIEB0aHJvd3MgRXZlbnQgY29sbGlkZUJvdHRvbVxuICAgICAgICAgICAgICogQHJldHVybiB7dm9pZH1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgWndvb3NoLnByb3RvdHlwZS5vblNjcm9sbCA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgdmFyIHggPSB0aGlzLmdldFNjcm9sbExlZnQoKTtcbiAgICAgICAgICAgICAgICB2YXIgeSA9IHRoaXMuZ2V0U2Nyb2xsVG9wKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5zY3JvbGxNYXhMZWZ0ID0gKHRoaXMuc2Nyb2xsRWxlbWVudC5zY3JvbGxXaWR0aCAtIHRoaXMuc2Nyb2xsRWxlbWVudC5jbGllbnRXaWR0aCk7XG4gICAgICAgICAgICAgICAgdGhpcy5zY3JvbGxNYXhUb3AgPSAodGhpcy5zY3JvbGxFbGVtZW50LnNjcm9sbEhlaWdodCAtIHRoaXMuc2Nyb2xsRWxlbWVudC5jbGllbnRIZWlnaHQpO1xuICAgICAgICAgICAgICAgIC8vIHRoZSBjb2xsaWRlTGVmdCBldmVudFxuICAgICAgICAgICAgICAgIGlmICh4ID09PSAwICYmICF0aGlzLnRyaWdnZXJlZC5jb2xsaWRlTGVmdCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnRyaWdnZXJFdmVudCh0aGlzLmlubmVyLCBcImNvbGxpZGUubGVmdFwiKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy50cmlnZ2VyZWQuY29sbGlkZUxlZnQgPSB4ID09PSAwO1xuICAgICAgICAgICAgICAgIC8vIHRoZSBjb2xsaWRlVG9wIGV2ZW50XG4gICAgICAgICAgICAgICAgaWYgKHkgPT09IDAgJiYgIXRoaXMudHJpZ2dlcmVkLmNvbGxpZGVUb3ApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50cmlnZ2VyRXZlbnQodGhpcy5pbm5lciwgXCJjb2xsaWRlLnRvcFwiKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy50cmlnZ2VyZWQuY29sbGlkZVRvcCA9IHkgPT09IDA7XG4gICAgICAgICAgICAgICAgLy8gdGhlIGNvbGxpZGVSaWdodCBldmVudFxuICAgICAgICAgICAgICAgIGlmICh4ID09PSB0aGlzLnNjcm9sbE1heExlZnQgJiYgIXRoaXMudHJpZ2dlcmVkLmNvbGxpZGVSaWdodCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnRyaWdnZXJFdmVudCh0aGlzLmlubmVyLCBcImNvbGxpZGUucmlnaHRcIik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMudHJpZ2dlcmVkLmNvbGxpZGVSaWdodCA9IHggPT09IHRoaXMuc2Nyb2xsTWF4TGVmdDtcbiAgICAgICAgICAgICAgICAvLyB0aGUgY29sbGlkZUJvdHRvbSBldmVudFxuICAgICAgICAgICAgICAgIGlmICh5ID09PSB0aGlzLnNjcm9sbE1heFRvcCAmJiAhdGhpcy50cmlnZ2VyZWQuY29sbGlkZUJvdHRvbSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnRyaWdnZXJFdmVudCh0aGlzLmlubmVyLCBcImNvbGxpZGUuYm90dG9tXCIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLnRyaWdnZXJlZC5jb2xsaWRlQm90dG9tID0geSA9PT0gdGhpcy5zY3JvbGxNYXhUb3A7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiB3aW5kb3cgcmVzaXplIGhhbmRsZXIgdG8gcmVjYWxjdWxhdGUgdGhlIGlubmVyIGRpdiBtaW5XaWR0aCBhbmQgbWluSGVpZ2h0XG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQHBhcmFtIHtFdmVudH0gZSAtIFRoZSB3aW5kb3cgcmVzaXplIGV2ZW50IG9iamVjdCAoVE9ETzogbmVlZGVkPylcbiAgICAgICAgICAgICAqIEByZXR1cm4ge3ZvaWR9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIFp3b29zaC5wcm90b3R5cGUub25SZXNpemUgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgICAgICAgICAgdmFyIG9uUmVzaXplID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBfdGhpcy5pbm5lci5zdHlsZS5taW5XaWR0aCA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIF90aGlzLmlubmVyLnN0eWxlLm1pbkhlaWdodCA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIC8qIHRha2UgYXdheSB0aGUgbWFyZ2luIHZhbHVlcyBvZiB0aGUgYm9keSBlbGVtZW50ICovXG4gICAgICAgICAgICAgICAgICAgIHZhciB4RGVsdGEgPSBwYXJzZUludChfdGhpcy5nZXRTdHlsZShkb2N1bWVudC5ib2R5LCBcIm1hcmdpbkxlZnRcIiksIDEwKSArIHBhcnNlSW50KF90aGlzLmdldFN0eWxlKGRvY3VtZW50LmJvZHksIFwibWFyZ2luUmlnaHRcIiksIDEwKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHlEZWx0YSA9IHBhcnNlSW50KF90aGlzLmdldFN0eWxlKGRvY3VtZW50LmJvZHksIFwibWFyZ2luVG9wXCIpLCAxMCkgKyBwYXJzZUludChfdGhpcy5nZXRTdHlsZShkb2N1bWVudC5ib2R5LCBcIm1hcmdpbkJvdHRvbVwiKSwgMTApO1xuICAgICAgICAgICAgICAgICAgICAvLyBUT0RPOiB3aXRoIHRoaXMuZ2V0Qm9yZGVyKClcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMuaW5uZXIuc3R5bGUubWluV2lkdGggPSAoZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnNjcm9sbFdpZHRoIC0geERlbHRhKSArIFwicHhcIjtcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMuaW5uZXIuc3R5bGUubWluSGVpZ2h0ID0gKGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zY3JvbGxIZWlnaHQgLSB5RGVsdGEgLSAxMDApICsgXCJweFwiOyAvLyBUT0RPOiBXVEY/IHdoeSAtMTAwIGZvciBJRTg/XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBUcmlnZ2VyIHRoZSBmdW5jdGlvbiBvbmx5IHdoZW4gdGhlIGNsaWVudFdpZHRoIG9yIGNsaWVudEhlaWdodCByZWFsbHkgaGF2ZSBjaGFuZ2VkLlxuICAgICAgICAgICAgICAgICAqIElFOCByZXNpZGVzIGluIGFuIGluZmluaXR5IGxvb3AgYWx3YXlzIHRyaWdnZXJpbmcgdGhlIHJlc2l0ZSBldmVudCB3aGVuIGFsdGVyaW5nIGNzcy5cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5vbGRDbGllbnRXaWR0aCAhPT0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudFdpZHRoIHx8XG4gICAgICAgICAgICAgICAgICAgIHRoaXMub2xkQ2xpZW50SGVpZ2h0ICE9PSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50SGVpZ2h0KSB7XG4gICAgICAgICAgICAgICAgICAgIHdpbmRvdy5jbGVhclRpbWVvdXQodGhpcy5yZXNpemVUaW1lb3V0KTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yZXNpemVUaW1lb3V0ID0gd2luZG93LnNldFRpbWVvdXQob25SZXNpemUsIDEwKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLyogd3JpdGUgZG93biB0aGUgb2xkIGNsaWVudFdpZHRoIGFuZCBjbGllbnRIZWlnaHQgZm9yIHRoZSBhYm92ZSBjb21wYXJzaW9uICovXG4gICAgICAgICAgICAgICAgdGhpcy5vbGRDbGllbnRXaWR0aCA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRXaWR0aDtcbiAgICAgICAgICAgICAgICB0aGlzLm9sZENsaWVudEhlaWdodCA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRIZWlnaHQ7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgWndvb3NoLnByb3RvdHlwZS5jbGVhclRleHRTZWxlY3Rpb24gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKHdpbmRvdy5nZXRTZWxlY3Rpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgd2luZG93LmdldFNlbGVjdGlvbigpLnJlbW92ZUFsbFJhbmdlcygpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoZG9jdW1lbnQuc2VsZWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIGRvY3VtZW50LnNlbGVjdGlvbi5lbXB0eSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEJyb3dzZXIgaW5kZXBlbmRlbnQgZXZlbnQgcmVnaXN0cmF0aW9uXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQHBhcmFtIHthbnl9IG9iaiAtIFRoZSBIVE1MRWxlbWVudCB0byBhdHRhY2ggdGhlIGV2ZW50IHRvXG4gICAgICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnQgLSBUaGUgZXZlbnQgbmFtZSB3aXRob3V0IHRoZSBsZWFkaW5nIFwib25cIlxuICAgICAgICAgICAgICogQHBhcmFtIHsoZTogRXZlbnQpID0+IHZvaWR9IGNhbGxiYWNrIC0gQSBjYWxsYmFjayBmdW5jdGlvbiB0byBhdHRhY2ggdG8gdGhlIGV2ZW50XG4gICAgICAgICAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IGJvdW5kIC0gd2hldGhlciB0byBiaW5kIHRoZSBjYWxsYmFjayB0byB0aGUgb2JqZWN0IGluc3RhbmNlIG9yIG5vdFxuICAgICAgICAgICAgICogQHJldHVybiB7dm9pZH1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgWndvb3NoLnByb3RvdHlwZS5hZGRFdmVudExpc3RlbmVyID0gZnVuY3Rpb24gKG9iaiwgZXZlbnQsIGNhbGxiYWNrLCBib3VuZCkge1xuICAgICAgICAgICAgICAgIGlmIChib3VuZCA9PT0gdm9pZCAwKSB7IGJvdW5kID0gdHJ1ZTsgfVxuICAgICAgICAgICAgICAgIHZhciBib3VuZENhbGxiYWNrID0gYm91bmQgPyBjYWxsYmFjay5iaW5kKHRoaXMpIDogY2FsbGJhY2s7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBvYmouYWRkRXZlbnRMaXN0ZW5lciA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChtYXBFdmVudHNbXCJvblwiICsgZXZlbnRdICYmIG9iai50YWdOYW1lID09PSBcIkJPRFlcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgb2JqID0gbWFwRXZlbnRzW1wib25cIiArIGV2ZW50XTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBvYmouYWRkRXZlbnRMaXN0ZW5lcihldmVudCwgYm91bmRDYWxsYmFjayk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHR5cGVvZiBvYmouYXR0YWNoRXZlbnQgPT09IFwib2JqZWN0XCIgJiYgaHRtbEV2ZW50c1tcIm9uXCIgKyBldmVudF0pIHtcbiAgICAgICAgICAgICAgICAgICAgb2JqLmF0dGFjaEV2ZW50KFwib25cIiArIGV2ZW50LCBib3VuZENhbGxiYWNrKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAodHlwZW9mIG9iai5hdHRhY2hFdmVudCA9PT0gXCJvYmplY3RcIiAmJiBtYXBFdmVudHNbXCJvblwiICsgZXZlbnRdKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChvYmoudGFnTmFtZSA9PT0gXCJCT0RZXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBwID0gXCJvblwiICsgZXZlbnQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBleGFtcGxlOiB3aW5kb3cub25zY3JvbGwgPSBib3VuZENhbGxiYWNrICovXG4gICAgICAgICAgICAgICAgICAgICAgICBtYXBFdmVudHNbcF1bcF0gPSBib3VuZENhbGxiYWNrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgLyogVE9ETzogb2JqLm9uc2Nyb2xsID8/ICovXG4gICAgICAgICAgICAgICAgICAgICAgICBvYmoub25zY3JvbGwgPSBib3VuZENhbGxiYWNrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHR5cGVvZiBvYmouYXR0YWNoRXZlbnQgPT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgICAgICAgICAgICAgb2JqW2V2ZW50XSA9IDE7XG4gICAgICAgICAgICAgICAgICAgIGJvdW5kQ2FsbGJhY2sgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLyogVE9ETzogZSBpcyB0aGUgb25wcm9wZXJ0eWNoYW5nZSBldmVudCBub3Qgb25lIG9mIHRoZSBjdXN0b20gZXZlbnQgb2JqZWN0cyAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGUucHJvcGVydHlOYW1lID09PSBldmVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBvYmouYXR0YWNoRXZlbnQoXCJvbnByb3BlcnR5Y2hhbmdlXCIsIGJvdW5kQ2FsbGJhY2spO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgb2JqW1wib25cIiArIGV2ZW50XSA9IGJvdW5kQ2FsbGJhY2s7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICghdGhpcy5jdXN0b21FdmVudHNbZXZlbnRdKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY3VzdG9tRXZlbnRzW2V2ZW50XSA9IFtdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLmN1c3RvbUV2ZW50c1tldmVudF0ucHVzaChbY2FsbGJhY2ssIGJvdW5kQ2FsbGJhY2tdKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEJyb3dzZXIgaW5kZXBlbmRlbnQgZXZlbnQgZGVyZWdpc3RyYXRpb25cbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAcGFyYW0ge2FueX0gb2JqIC0gVGhlIEhUTUxFbGVtZW50IG9yIHdpbmRvdyB3aG9zZSBldmVudCBzaG91bGQgYmUgZGV0YWNoZWRcbiAgICAgICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBldmVudCAtIFRoZSBldmVudCBuYW1lIHdpdGhvdXQgdGhlIGxlYWRpbmcgXCJvblwiXG4gICAgICAgICAgICAgKiBAcGFyYW0geyhlOiBFdmVudCkgPT4gdm9pZH0gY2FsbGJhY2sgLSBUaGUgY2FsbGJhY2sgZnVuY3Rpb24gd2hlbiBhdHRhY2hlZFxuICAgICAgICAgICAgICogQHJldHVybiB7dm9pZH1cbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAVE9ETzogdW5yZWdpc3RlcmluZyBvZiBtYXBFdmVudHNcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgWndvb3NoLnByb3RvdHlwZS5yZW1vdmVFdmVudExpc3RlbmVyID0gZnVuY3Rpb24gKG9iaiwgZXZlbnQsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50IGluIHRoaXMuY3VzdG9tRXZlbnRzKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgaW4gdGhpcy5jdXN0b21FdmVudHNbZXZlbnRdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBpZiB0aGUgZXZlbnQgd2FzIGZvdW5kIGluIHRoZSBhcnJheSBieSBpdHMgY2FsbGJhY2sgcmVmZXJlbmNlICovXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5jdXN0b21FdmVudHNbZXZlbnRdW2ldWzBdID09PSBjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIHJlbW92ZSB0aGUgbGlzdGVuZXIgZnJvbSB0aGUgYXJyYXkgYnkgaXRzIGJvdW5kIGNhbGxiYWNrIHJlZmVyZW5jZSAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrID0gdGhpcy5jdXN0b21FdmVudHNbZXZlbnRdW2ldWzFdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY3VzdG9tRXZlbnRzW2V2ZW50XS5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBvYmoucmVtb3ZlRXZlbnRMaXN0ZW5lciA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgICAgIG9iai5yZW1vdmVFdmVudExpc3RlbmVyKGV2ZW50LCBjYWxsYmFjayk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHR5cGVvZiBvYmouZGV0YWNoRXZlbnQgPT09IFwib2JqZWN0XCIgJiYgaHRtbEV2ZW50c1tcIm9uXCIgKyBldmVudF0pIHtcbiAgICAgICAgICAgICAgICAgICAgb2JqLmRldGFjaEV2ZW50KFwib25cIiArIGV2ZW50LCBjYWxsYmFjayk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHR5cGVvZiBvYmouZGV0YWNoRXZlbnQgPT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgICAgICAgICAgICAgb2JqLmRldGFjaEV2ZW50KFwib25wcm9wZXJ0eWNoYW5nZVwiLCBjYWxsYmFjayk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBvYmpbXCJvblwiICsgZXZlbnRdID0gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBCcm93c2VyIGluZGVwZW5kZW50IGV2ZW50IHRyaWdnZXIgZnVuY3Rpb25cbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBvYmogLSBUaGUgSFRNTEVsZW1lbnQgd2hpY2ggdHJpZ2dlcnMgdGhlIGV2ZW50XG4gICAgICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnROYW1lIC0gVGhlIGV2ZW50IG5hbWUgd2l0aG91dCB0aGUgbGVhZGluZyBcIm9uXCJcbiAgICAgICAgICAgICAqIEByZXR1cm4ge3ZvaWR9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIFp3b29zaC5wcm90b3R5cGUudHJpZ2dlckV2ZW50ID0gZnVuY3Rpb24gKG9iaiwgZXZlbnROYW1lKSB7XG4gICAgICAgICAgICAgICAgdmFyIGV2ZW50O1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2Ygd2luZG93LkN1c3RvbUV2ZW50ID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQgPSBuZXcgQ3VzdG9tRXZlbnQoZXZlbnROYW1lKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAodHlwZW9mIGRvY3VtZW50LmNyZWF0ZUV2ZW50ID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudChcIkhUTUxFdmVudHNcIik7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LmluaXRFdmVudChldmVudE5hbWUsIHRydWUsIHRydWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChkb2N1bWVudC5jcmVhdGVFdmVudE9iamVjdCkge1xuICAgICAgICAgICAgICAgICAgICBldmVudCA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50T2JqZWN0KCk7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LmV2ZW50VHlwZSA9IGV2ZW50TmFtZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZXZlbnQuZXZlbnROYW1lID0gZXZlbnROYW1lO1xuICAgICAgICAgICAgICAgIGlmIChvYmouZGlzcGF0Y2hFdmVudCkge1xuICAgICAgICAgICAgICAgICAgICBvYmouZGlzcGF0Y2hFdmVudChldmVudCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKG9ialtldmVudE5hbWVdKSB7XG4gICAgICAgICAgICAgICAgICAgIG9ialtldmVudE5hbWVdKys7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKG9iai5maXJlRXZlbnQgJiYgaHRtbEV2ZW50c1tcIm9uXCIgKyBldmVudE5hbWVdKSB7XG4gICAgICAgICAgICAgICAgICAgIG9iai5maXJlRXZlbnQoXCJvblwiICsgZXZlbnQuZXZlbnRUeXBlLCBldmVudCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKG9ialtldmVudE5hbWVdKSB7XG4gICAgICAgICAgICAgICAgICAgIG9ialtldmVudE5hbWVdKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKG9ialtcIm9uXCIgKyBldmVudE5hbWVdKSB7XG4gICAgICAgICAgICAgICAgICAgIG9ialtcIm9uXCIgKyBldmVudE5hbWVdKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIFp3b29zaC5wcm90b3R5cGUuYWRkQ2xhc3MgPSBmdW5jdGlvbiAoZWwsIGNzc0NsYXNzKSB7XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLmhhc0NsYXNzKGVsLCBjc3NDbGFzcykpIHtcbiAgICAgICAgICAgICAgICAgICAgZWwuY2xhc3NOYW1lICs9IFwiIFwiICsgY3NzQ2xhc3MgKyBcIiBcIjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgWndvb3NoLnByb3RvdHlwZS5yZW1vdmVDbGFzcyA9IGZ1bmN0aW9uIChlbCwgY3NzQ2xhc3MpIHtcbiAgICAgICAgICAgICAgICB2YXIgcmUgPSBuZXcgUmVnRXhwKFwiIFwiICsgY3NzQ2xhc3MgKyBcIiBcIiwgXCJnXCIpO1xuICAgICAgICAgICAgICAgIGVsLmNsYXNzTmFtZSA9IGVsLmNsYXNzTmFtZS5yZXBsYWNlKHJlLCBcIlwiKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLmhhc0NsYXNzID0gZnVuY3Rpb24gKGVsLCBjc3NDbGFzcykge1xuICAgICAgICAgICAgICAgIHZhciByZSA9IG5ldyBSZWdFeHAoXCIgXCIgKyBjc3NDbGFzcyArIFwiIFwiKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZWwuY2xhc3NOYW1lLm1hdGNoKHJlKSAhPT0gbnVsbDtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEdldCBhIGNzcyBzdHlsZSBwcm9wZXJ0eSB2YWx1ZSBicm93c2VyIGluZGVwZW5kZW50XG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWwgLSBUaGUgSFRNTEVsZW1lbnQgdG8gbG9va3VwXG4gICAgICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30ganNQcm9wZXJ0eSAtIFRoZSBjc3MgcHJvcGVydHkgbmFtZSBpbiBqYXZhc2NyaXB0IGluIGNhbWVsQ2FzZSAoZS5nLiBcIm1hcmdpbkxlZnRcIiwgbm90IFwibWFyZ2luLWxlZnRcIilcbiAgICAgICAgICAgICAqIEByZXR1cm4ge3N0cmluZ30gLSB0aGUgcHJvcGVydHkgdmFsdWVcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgWndvb3NoLnByb3RvdHlwZS5nZXRTdHlsZSA9IGZ1bmN0aW9uIChlbCwganNQcm9wZXJ0eSkge1xuICAgICAgICAgICAgICAgIHZhciBjc3NQcm9wZXJ0eSA9IGpzUHJvcGVydHkucmVwbGFjZSgvKFtBLVpdKS9nLCBcIi0kMVwiKS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2Ygd2luZG93LmdldENvbXB1dGVkU3R5bGUgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gd2luZG93LmdldENvbXB1dGVkU3R5bGUoZWwpLmdldFByb3BlcnR5VmFsdWUoY3NzUHJvcGVydHkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGVsLmN1cnJlbnRTdHlsZVtqc1Byb3BlcnR5XTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgWndvb3NoLnByb3RvdHlwZS5jbGVhclRpbWVvdXRzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLnRpbWVvdXRzKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgaW4gdGhpcy50aW1lb3V0cykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMudGltZW91dHMuaGFzT3duUHJvcGVydHkoaSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQodGhpcy50aW1lb3V0c1tpXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMudGltZW91dHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy50aW1lb3V0cyA9IFtdO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKHRoaXMuaW5uZXIsIFwiY29sbGlkZS5sZWZ0XCIsIHRoaXMuY2xlYXJMaXN0ZW5lckxlZnQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKHRoaXMuaW5uZXIsIFwiY29sbGlkZS5yaWdodFwiLCB0aGlzLmNsZWFyTGlzdGVuZXJSaWdodCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlbW92ZUV2ZW50TGlzdGVuZXIodGhpcy5pbm5lciwgXCJjb2xsaWRlLnRvcFwiLCB0aGlzLmNsZWFyTGlzdGVuZXJUb3ApO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKHRoaXMuaW5uZXIsIFwiY29sbGlkZS5ib3R0b21cIiwgdGhpcy5jbGVhckxpc3RlbmVyQm90dG9tKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIE1vdXNlIGRvd24gaGFuZGxlclxuICAgICAgICAgICAgICogUmVnaXN0ZXJzIHRoZSBtb3VzZW1vdmUgYW5kIG1vdXNldXAgaGFuZGxlcnMgYW5kIGZpbmRzIHRoZSBuZXh0IGlubmVyIGVsZW1lbnRcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAcGFyYW0ge01vdXNlRXZlbnR9IGUgLSBUaGUgbW91c2UgZG93biBldmVudCBvYmplY3RcbiAgICAgICAgICAgICAqIEByZXR1cm4ge3ZvaWR9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIFp3b29zaC5wcm90b3R5cGUubW91c2VEb3duID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICAgICAgICAgIHRoaXMuY2xlYXJUaW1lb3V0cygpO1xuICAgICAgICAgICAgICAgIC8qIGRyYWcgb25seSBpZiB0aGUgbGVmdCBtb3VzZSBidXR0b24gd2FzIHByZXNzZWQgKi9cbiAgICAgICAgICAgICAgICBpZiAoKFwid2hpY2hcIiBpbiBlICYmIGUud2hpY2ggPT09IDEpIHx8ICh0eXBlb2YgZS53aGljaCA9PT0gXCJ1bmRlZmluZWRcIiAmJiBcImJ1dHRvblwiIGluIGUgJiYgZS5idXR0b24gPT09IDEpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmVsZW1lbnRCZWhpbmRDdXJzb3JJc01lKGUuY2xpZW50WCwgZS5jbGllbnRZKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLyogcHJldmVudCBpbWFnZSBkcmFnZ2luZyBhY3Rpb24gKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBpbWdzID0gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvckFsbChcImltZ1wiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgaW1ncy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGltZ3NbaV0ub25kcmFnc3RhcnQgPSBmdW5jdGlvbiAoKSB7IHJldHVybiBmYWxzZTsgfTsgLy8gTVNJRVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgLyogc2VhcmNoIHRoZSBET00gZm9yIGV4Y2x1ZGUgZWxlbWVudHMgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMuZHJhZ09wdGlvbnMuZXhjbHVkZS5sZW5ndGggIT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBkcmFnIG9ubHkgaWYgdGhlIG1vdXNlIGNsaWNrZWQgb24gYW4gYWxsb3dlZCBlbGVtZW50ICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGVsID0gZG9jdW1lbnQuZWxlbWVudEZyb21Qb2ludChlLmNsaWVudFgsIGUuY2xpZW50WSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGV4Y2x1ZGVFbGVtZW50cyA9IHRoaXMuY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3JBbGwodGhpcy5vcHRpb25zLmRyYWdPcHRpb25zLmV4Y2x1ZGUuam9pbihcIiwgXCIpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBsb29wIHRocm91Z2ggYWxsIHBhcmVudCBlbGVtZW50cyB1bnRpbCB3ZSBlbmNvdW50ZXIgYW4gaW5uZXIgZGl2IG9yIG5vIG1vcmUgcGFyZW50cyAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdoaWxlIChlbCAmJiAhdGhpcy5oYXNDbGFzcyhlbCwgdGhpcy5jbGFzc0lubmVyKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBjb21wYXJlIGVhY2ggcGFyZW50LCBpZiBpdCBpcyBpbiB0aGUgZXhjbHVkZSBsaXN0ICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGEgPSAwOyBhIDwgZXhjbHVkZUVsZW1lbnRzLmxlbmd0aDsgYSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBiYWlsIG91dCBpZiBhbiBlbGVtZW50IG1hdGNoZXMgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChleGNsdWRlRWxlbWVudHNbYV0gPT09IGVsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsID0gZWwucGFyZW50RWxlbWVudDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBzZWFyY2ggdGhlIERPTSBmb3Igb25seSBlbGVtZW50cywgYnV0IG9ubHkgaWYgdGhlcmUgYXJlIGVsZW1lbnRzIHNldFxuICAgICAgICAgICAgICAgICAgICAgICAgLyppZiAodGhpcy5vcHRpb25zLmRyYWdPcHRpb25zLm9ubHkubGVuZ3RoICE9PSAwKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IG9ubHlFbGVtZW50cyA9IHRoaXMuY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3JBbGwodGhpcy5vcHRpb25zLmRyYWdPcHRpb25zLm9ubHkuam9pbignLCAnKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGxvb3AgdGhyb3VnaCB0aGUgbm9kZWxpc3QgYW5kIGNoZWNrIGZvciBvdXIgZWxlbWVudFxuICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgZm91bmQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBleGNsdWRlRWxlbWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAob25seUVsZW1lbnRzW2ldID09PSBlbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm91bmQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmb3VuZCA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0qL1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGRDbGFzcyhkb2N1bWVudC5ib2R5LCB0aGlzLmNsYXNzR3JhYmJpbmcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kcmFnZ2luZyA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBub3RlIHRoZSBvcmlnaW4gcG9zaXRpb25zICovXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRyYWdPcmlnaW5MZWZ0ID0gZS5jbGllbnRYO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kcmFnT3JpZ2luVG9wID0gZS5jbGllbnRZO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kcmFnT3JpZ2luU2Nyb2xsTGVmdCA9IHRoaXMuZ2V0U2Nyb2xsTGVmdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kcmFnT3JpZ2luU2Nyb2xsVG9wID0gdGhpcy5nZXRTY3JvbGxUb3AoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIGl0IGxvb2tzIHN0cmFuZ2UgaWYgc2Nyb2xsLWJlaGF2aW9yIGlzIHNldCB0byBzbW9vdGggKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGFyZW50T3JpZ2luU3R5bGUgPSB0aGlzLmlubmVyLnBhcmVudEVsZW1lbnQuc3R5bGUuY3NzVGV4dDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdGhpcy5pbm5lci5wYXJlbnRFbGVtZW50LnN0eWxlLnNldFByb3BlcnR5ID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmlubmVyLnBhcmVudEVsZW1lbnQuc3R5bGUuc2V0UHJvcGVydHkoXCJzY3JvbGwtYmVoYXZpb3JcIiwgXCJhdXRvXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGUucHJldmVudERlZmF1bHQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlLnJldHVyblZhbHVlID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnZ4ID0gW107XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnZ5ID0gW107XG4gICAgICAgICAgICAgICAgICAgICAgICAvKiByZWdpc3RlciB0aGUgZXZlbnQgaGFuZGxlcnMgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubW91c2VNb3ZlSGFuZGxlciA9IHRoaXMubW91c2VNb3ZlLmJpbmQodGhpcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIoZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LCBcIm1vdXNlbW92ZVwiLCB0aGlzLm1vdXNlTW92ZUhhbmRsZXIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5tb3VzZVVwSGFuZGxlciA9IGZ1bmN0aW9uIChlKSB7IHJldHVybiBfdGhpcy5tb3VzZVVwKGUpOyB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCwgXCJtb3VzZXVwXCIsIHRoaXMubW91c2VVcEhhbmRsZXIpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogTW91c2UgdXAgaGFuZGxlclxuICAgICAgICAgICAgICogRGVyZWdpc3RlcnMgdGhlIG1vdXNlbW92ZSBhbmQgbW91c2V1cCBoYW5kbGVyc1xuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBwYXJhbSB7TW91c2VFdmVudH0gZSAtIFRoZSBtb3VzZSB1cCBldmVudCBvYmplY3RcbiAgICAgICAgICAgICAqIEByZXR1cm4ge3ZvaWR9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIFp3b29zaC5wcm90b3R5cGUubW91c2VVcCA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgLyogVE9ETzogcmVzdG9yZSBvcmlnaW5hbCBwb3NpdGlvbiB2YWx1ZSAqL1xuICAgICAgICAgICAgICAgIHRoaXMuaW5uZXIuc3R5bGUucG9zaXRpb24gPSBcIlwiO1xuICAgICAgICAgICAgICAgIHRoaXMuaW5uZXIuc3R5bGUudG9wID0gbnVsbDtcbiAgICAgICAgICAgICAgICB0aGlzLmlubmVyLnN0eWxlLmxlZnQgPSBudWxsO1xuICAgICAgICAgICAgICAgIHRoaXMucHJlc2VudCA9ICh0aGlzLmdldFRpbWVzdGFtcCgpIC8gMTAwMCk7IC8vIHNlY29uZHNcbiAgICAgICAgICAgICAgICB2YXIgeCA9IHRoaXMuZHJhZ09yaWdpbkxlZnQgKyB0aGlzLmRyYWdPcmlnaW5TY3JvbGxMZWZ0IC0gZS5jbGllbnRYO1xuICAgICAgICAgICAgICAgIHZhciB5ID0gdGhpcy5kcmFnT3JpZ2luVG9wICsgdGhpcy5kcmFnT3JpZ2luU2Nyb2xsVG9wIC0gZS5jbGllbnRZO1xuICAgICAgICAgICAgICAgIF9hID0gdGhpcy5nZXRSZWFsQ29vcmRzKHgsIHkpLCB4ID0gX2FbMF0sIHkgPSBfYVsxXTtcbiAgICAgICAgICAgICAgICB0aGlzLnJlbW92ZUNsYXNzKGRvY3VtZW50LmJvZHksIHRoaXMuY2xhc3NHcmFiYmluZyk7XG4gICAgICAgICAgICAgICAgdGhpcy5pbm5lci5wYXJlbnRFbGVtZW50LnN0eWxlLmNzc1RleHQgPSB0aGlzLnBhcmVudE9yaWdpblN0eWxlO1xuICAgICAgICAgICAgICAgIHRoaXMuZHJhZ2dpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB0aGlzLnJlbW92ZUV2ZW50TGlzdGVuZXIoZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LCBcIm1vdXNlbW92ZVwiLCB0aGlzLm1vdXNlTW92ZUhhbmRsZXIpO1xuICAgICAgICAgICAgICAgIHRoaXMucmVtb3ZlRXZlbnRMaXN0ZW5lcihkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQsIFwibW91c2V1cFwiLCB0aGlzLm1vdXNlVXBIYW5kbGVyKTtcbiAgICAgICAgICAgICAgICBpZiAoeSAhPT0gdGhpcy5nZXRTY3JvbGxUb3AoKSB8fCB4ICE9PSB0aGlzLmdldFNjcm9sbExlZnQoKSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgdCA9IHRoaXMucHJlc2VudCAtICh0aGlzLnBhc3QgPyB0aGlzLnBhc3QgOiB0aGlzLnByZXNlbnQpO1xuICAgICAgICAgICAgICAgICAgICBpZiAodCA+IDAuMDUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIGp1c3QgYWxpZ24gdG8gdGhlIGdyaWQgaWYgdGhlIG1vdXNlIGxlZnQgdW5tb3ZlZCBmb3IgbW9yZSB0aGFuIDAuMDUgc2Vjb25kcyAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zY3JvbGxUbyh4LCB5LCB0aGlzLm9wdGlvbnMuZHJhZ09wdGlvbnMuZmFkZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5kcmFnT3B0aW9ucy5mYWRlICYmIHR5cGVvZiB0aGlzLnZ4ICE9PSBcInVuZGVmaW5lZFwiICYmIHR5cGVvZiB0aGlzLnZ5ICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciB2eCA9IHZvaWQgMCwgdnkgPSB2b2lkIDA7XG4gICAgICAgICAgICAgICAgICAgIF9iID0gdGhpcy5jYWxjQXZlcmFnZVZlbG9jaXR5KDAuMSksIHZ4ID0gX2JbMF0sIHZ5ID0gX2JbMV07XG4gICAgICAgICAgICAgICAgICAgIC8qIHYgc2hvdWxkIG5vdCBleGNlZWQgdk1heCBvciAtdk1heCAtPiB3b3VsZCBiZSB0b28gZmFzdCBhbmQgc2hvdWxkIGV4Y2VlZCB2TWluIG9yIC12TWluICovXG4gICAgICAgICAgICAgICAgICAgIHZhciB2TWF4ID0gdGhpcy5vcHRpb25zLmRyYWdPcHRpb25zLm1heFNwZWVkO1xuICAgICAgICAgICAgICAgICAgICB2YXIgdk1pbiA9IHRoaXMub3B0aW9ucy5kcmFnT3B0aW9ucy5taW5TcGVlZDtcbiAgICAgICAgICAgICAgICAgICAgLyogaWYgdGhlIHNwZWVkIGlzIG5vdCB3aXRob3V0IGJvdW5kIGZvciBmYWRlLCBqdXN0IGRvIGEgcmVndWxhciBzY3JvbGwgd2hlbiB0aGVyZSBpcyBhIGdyaWQqL1xuICAgICAgICAgICAgICAgICAgICBpZiAodnkgPCB2TWluICYmIHZ5ID4gLXZNaW4gJiYgdnggPCB2TWluICYmIHZ4ID4gLXZNaW4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMuZ3JpZFkgPiAxIHx8IHRoaXMub3B0aW9ucy5ncmlkWCA+IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNjcm9sbFRvKHgsIHkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHZ4ID0gKHZ4IDw9IHZNYXggJiYgdnggPj0gLXZNYXgpID8gdnggOiAodnggPiAwID8gdk1heCA6IC12TWF4KTtcbiAgICAgICAgICAgICAgICAgICAgdnkgPSAodnkgPD0gdk1heCAmJiB2eSA+PSAtdk1heCkgPyB2eSA6ICh2eSA+IDAgPyB2TWF4IDogLXZNYXgpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgYXggPSAodnggPiAwID8gLTEgOiAxKSAqIHRoaXMub3B0aW9ucy5kcmFnT3B0aW9ucy5icmFrZVNwZWVkO1xuICAgICAgICAgICAgICAgICAgICB2YXIgYXkgPSAodnkgPiAwID8gLTEgOiAxKSAqIHRoaXMub3B0aW9ucy5kcmFnT3B0aW9ucy5icmFrZVNwZWVkO1xuICAgICAgICAgICAgICAgICAgICB4ID0gKCgwIC0gTWF0aC5wb3codngsIDIpKSAvICgyICogYXgpKSArIHRoaXMuZ2V0U2Nyb2xsTGVmdCgpO1xuICAgICAgICAgICAgICAgICAgICB5ID0gKCgwIC0gTWF0aC5wb3codnksIDIpKSAvICgyICogYXkpKSArIHRoaXMuZ2V0U2Nyb2xsVG9wKCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsVG8oeCwgeSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvKiBpbiBhbGwgb3RoZXIgY2FzZXMsIGRvIGEgcmVndWxhciBzY3JvbGwgKi9cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zY3JvbGxUbyh4LCB5LCB0aGlzLm9wdGlvbnMuZHJhZ09wdGlvbnMuZmFkZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciBfYSwgX2I7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgWndvb3NoLnByb3RvdHlwZS5jYWxjQXZlcmFnZVZlbG9jaXR5ID0gZnVuY3Rpb24gKHRpbWVTcGFuKSB7XG4gICAgICAgICAgICAgICAgdmFyIHByZXNlbnQgPSAodGhpcy5nZXRUaW1lc3RhbXAoKSAvIDEwMDApO1xuICAgICAgICAgICAgICAgIHZhciBkZWx0YVQsIGRlbHRhU3gsIGRlbHRhU3ksIGxhc3REZWx0YVN4LCBsYXN0RGVsdGFTeSwgbGFzdFQsIGxhc3RTeCwgbGFzdFN5O1xuICAgICAgICAgICAgICAgIGRlbHRhVCA9IGRlbHRhU3ggPSBkZWx0YVN5ID0gbGFzdERlbHRhU3ggPSBsYXN0RGVsdGFTeSA9IDA7XG4gICAgICAgICAgICAgICAgbGFzdFQgPSBsYXN0U3ggPSBsYXN0U3kgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSBpbiB0aGlzLnZ5KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnZ5Lmhhc093blByb3BlcnR5KGkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocGFyc2VGbG9hdChpKSA+IChwcmVzZW50IC0gdGltZVNwYW4pICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZW9mIGxhc3RUICE9PSBcInVuZGVmaW5lZFwiICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZW9mIGxhc3RTeCAhPT0gXCJ1bmRlZmluZWRcIiAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGVvZiBsYXN0U3kgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWx0YVQgKz0gcGFyc2VGbG9hdChpKSAtIGxhc3RUO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxhc3REZWx0YVN4ID0gdGhpcy52eFtpXSAtIGxhc3RTeDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYXN0RGVsdGFTeSA9IHRoaXMudnlbaV0gLSBsYXN0U3k7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsdGFTeCArPSBNYXRoLmFicyhsYXN0RGVsdGFTeCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsdGFTeSArPSBNYXRoLmFicyhsYXN0RGVsdGFTeSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBsYXN0VCA9IHBhcnNlRmxvYXQoaSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBsYXN0U3ggPSB0aGlzLnZ4W2ldO1xuICAgICAgICAgICAgICAgICAgICAgICAgbGFzdFN5ID0gdGhpcy52eVtpXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgdnggPSBkZWx0YVQgPT09IDAgPyAwIDogbGFzdERlbHRhU3ggPiAwID8gZGVsdGFTeCAvIGRlbHRhVCA6IGRlbHRhU3ggLyAtZGVsdGFUO1xuICAgICAgICAgICAgICAgIHZhciB2eSA9IGRlbHRhVCA9PT0gMCA/IDAgOiBsYXN0RGVsdGFTeSA+IDAgPyBkZWx0YVN5IC8gZGVsdGFUIDogZGVsdGFTeSAvIC1kZWx0YVQ7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFt2eCwgdnldO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQ2FsY3VsYXRlcyB0aGUgcm91bmRlZCBhbmQgc2NhbGVkIGNvb3JkaW5hdGVzLlxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSB4IC0gdGhlIHgtY29vcmRpbmF0ZVxuICAgICAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IHkgLSB0aGUgeS1jb29yZGluYXRlXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHthcnJheX0gW3gsIHldIC0gdGhlIGZpbmFsIGNvb3JkaW5hdGVzXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIFp3b29zaC5wcm90b3R5cGUuZ2V0UmVhbENvb3JkcyA9IGZ1bmN0aW9uICh4LCB5KSB7XG4gICAgICAgICAgICAgICAgLy8gc3RpY2sgdGhlIGVsZW1lbnQgdG8gdGhlIGdyaWQsIGlmIGdyaWQgZXF1YWxzIDEgdGhlIHZhbHVlIGRvZXMgbm90IGNoYW5nZVxuICAgICAgICAgICAgICAgIHggPSBNYXRoLnJvdW5kKHggLyAodGhpcy5vcHRpb25zLmdyaWRYICogdGhpcy5nZXRTY2FsZSgpKSkgKiAodGhpcy5vcHRpb25zLmdyaWRYICogdGhpcy5nZXRTY2FsZSgpKTtcbiAgICAgICAgICAgICAgICB5ID0gTWF0aC5yb3VuZCh5IC8gKHRoaXMub3B0aW9ucy5ncmlkWSAqIHRoaXMuZ2V0U2NhbGUoKSkpICogKHRoaXMub3B0aW9ucy5ncmlkWSAqIHRoaXMuZ2V0U2NhbGUoKSk7XG4gICAgICAgICAgICAgICAgdmFyIHNjcm9sbE1heExlZnQgPSAodGhpcy5zY3JvbGxFbGVtZW50LnNjcm9sbFdpZHRoIC0gdGhpcy5zY3JvbGxFbGVtZW50LmNsaWVudFdpZHRoKTtcbiAgICAgICAgICAgICAgICB2YXIgc2Nyb2xsTWF4VG9wID0gKHRoaXMuc2Nyb2xsRWxlbWVudC5zY3JvbGxIZWlnaHQgLSB0aGlzLnNjcm9sbEVsZW1lbnQuY2xpZW50SGVpZ2h0KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgICAgICAgICAoeCA+IHNjcm9sbE1heExlZnQpID8gc2Nyb2xsTWF4TGVmdCA6IHgsXG4gICAgICAgICAgICAgICAgICAgICh5ID4gc2Nyb2xsTWF4VG9wKSA/IHNjcm9sbE1heFRvcCA6IHlcbiAgICAgICAgICAgICAgICBdO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIFp3b29zaC5wcm90b3R5cGUudGltZWRTY3JvbGwgPSBmdW5jdGlvbiAoeCwgeSwgdCkge1xuICAgICAgICAgICAgICAgIHZhciBtZSA9IHRoaXM7XG4gICAgICAgICAgICAgICAgdGhpcy50aW1lb3V0cy5wdXNoKHNldFRpbWVvdXQoKGZ1bmN0aW9uICh4LCB5LCBtZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbWUuc2V0U2Nyb2xsVG9wKHkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbWUuc2V0U2Nyb2xsTGVmdCh4KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lLm9yaWdpblNjcm9sbExlZnQgPSB4O1xuICAgICAgICAgICAgICAgICAgICAgICAgbWUub3JpZ2luU2Nyb2xsVG9wID0geTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9KHgsIHksIG1lKSksIHQpKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIENhbGN1bGF0ZXMgZWFjaCBzdGVwIG9mIGEgc2Nyb2xsIGZhZGVvdXQgYW5pbWF0aW9uIGJhc2VkIG9uIHRoZSBpbml0aWFsIHZlbG9jaXR5LlxuICAgICAgICAgICAgICogU3RvcHMgYW55IGN1cnJlbnRseSBydW5uaW5nIHNjcm9sbCBhbmltYXRpb24uXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IHZ4IC0gdGhlIGluaXRpYWwgdmVsb2NpdHkgaW4gaG9yaXpvbnRhbCBkaXJlY3Rpb25cbiAgICAgICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSB2eSAtIHRoZSBpbml0aWFsIHZlbG9jaXR5IGluIHZlcnRpY2FsIGRpcmVjdGlvblxuICAgICAgICAgICAgICogQHJldHVybiB7bnVtYmVyfSAtIHRoZSBmaW5hbCB5LWNvb3JkaW5hdGVcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgWndvb3NoLnByb3RvdHlwZS5mYWRlT3V0QnlWZWxvY2l0eSA9IGZ1bmN0aW9uICh2eCwgdnkpIHtcbiAgICAgICAgICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICAgICAgICAgIC8qIGNhbGN1bGF0ZSB0aGUgYnJha2UgYWNjZWxlcmF0aW9uIGluIGJvdGggZGlyZWN0aW9ucyBzZXBhcmF0ZWx5ICovXG4gICAgICAgICAgICAgICAgdmFyIGF5ID0gKHZ5ID4gMCA/IC0xIDogMSkgKiB0aGlzLm9wdGlvbnMuZHJhZ09wdGlvbnMuYnJha2VTcGVlZDtcbiAgICAgICAgICAgICAgICB2YXIgYXggPSAodnggPiAwID8gLTEgOiAxKSAqIHRoaXMub3B0aW9ucy5kcmFnT3B0aW9ucy5icmFrZVNwZWVkO1xuICAgICAgICAgICAgICAgIC8qIGZpbmQgdGhlIGRpcmVjdGlvbiB0aGF0IG5lZWRzIGxvbmdlciB0byBzdG9wLCBhbmQgcmVjYWxjdWxhdGUgdGhlIGFjY2VsZXJhdGlvbiAqL1xuICAgICAgICAgICAgICAgIHZhciB0bWF4ID0gTWF0aC5tYXgoKDAgLSB2eSkgLyBheSwgKDAgLSB2eCkgLyBheCk7XG4gICAgICAgICAgICAgICAgYXggPSAoMCAtIHZ4KSAvIHRtYXg7XG4gICAgICAgICAgICAgICAgYXkgPSAoMCAtIHZ5KSAvIHRtYXg7XG4gICAgICAgICAgICAgICAgdmFyIHN4LCBzeSwgdDtcbiAgICAgICAgICAgICAgICB2YXIgZnBzID0gdGhpcy5vcHRpb25zLmRyYWdPcHRpb25zLmZwcztcbiAgICAgICAgICAgICAgICB2YXIgaSA9IDA7XG4gICAgICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8ICgodG1heCAqIGZwcykgKyAoMCAvIGZwcykpOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdCA9ICgoaSArIDEpIC8gZnBzKTtcbiAgICAgICAgICAgICAgICAgICAgc3kgPSB0aGlzLmdldFNjcm9sbFRvcCgpICsgKHZ5ICogdCkgKyAoMC41ICogYXkgKiB0ICogdCk7XG4gICAgICAgICAgICAgICAgICAgIHN4ID0gdGhpcy5nZXRTY3JvbGxMZWZ0KCkgKyAodnggKiB0KSArICgwLjUgKiBheCAqIHQgKiB0KTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50aW1lZFNjcm9sbChzeCwgc3ksIChpICsgMSkgKiAoMTAwMCAvIGZwcykpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoaSA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgLyogcm91bmQgdGhlIGxhc3Qgc3RlcCBiYXNlZCBvbiB0aGUgZGlyZWN0aW9uIG9mIHRoZSBmYWRlICovXG4gICAgICAgICAgICAgICAgICAgIHN4ID0gdnggPiAwID8gTWF0aC5jZWlsKHN4KSA6IE1hdGguZmxvb3Ioc3gpO1xuICAgICAgICAgICAgICAgICAgICBzeSA9IHZ5ID4gMCA/IE1hdGguY2VpbChzeSkgOiBNYXRoLmZsb29yKHN5KTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50aW1lZFNjcm9sbChzeCwgc3ksIChpICsgMikgKiAoMTAwMCAvIGZwcykpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvKiBzdG9wIHRoZSBhbmltYXRpb24gd2hlbiBjb2xsaWRpbmcgd2l0aCB0aGUgYm9yZGVycyAqL1xuICAgICAgICAgICAgICAgIHRoaXMuY2xlYXJMaXN0ZW5lckxlZnQgPSBmdW5jdGlvbiAoKSB7IHJldHVybiBfdGhpcy5jbGVhclRpbWVvdXRzKCk7IH07XG4gICAgICAgICAgICAgICAgdGhpcy5jbGVhckxpc3RlbmVyUmlnaHQgPSBmdW5jdGlvbiAoKSB7IHJldHVybiBfdGhpcy5jbGVhclRpbWVvdXRzKCk7IH07XG4gICAgICAgICAgICAgICAgdGhpcy5jbGVhckxpc3RlbmVyVG9wID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gX3RoaXMuY2xlYXJUaW1lb3V0cygpOyB9O1xuICAgICAgICAgICAgICAgIHRoaXMuY2xlYXJMaXN0ZW5lckJvdHRvbSA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIF90aGlzLmNsZWFyVGltZW91dHMoKTsgfTtcbiAgICAgICAgICAgICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIodGhpcy5pbm5lciwgXCJjb2xsaWRlLmxlZnRcIiwgdGhpcy5jbGVhckxpc3RlbmVyTGVmdCk7XG4gICAgICAgICAgICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKHRoaXMuaW5uZXIsIFwiY29sbGlkZS5yaWdodFwiLCB0aGlzLmNsZWFyTGlzdGVuZXJSaWdodCk7XG4gICAgICAgICAgICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKHRoaXMuaW5uZXIsIFwiY29sbGlkZS50b3BcIiwgdGhpcy5jbGVhckxpc3RlbmVyVG9wKTtcbiAgICAgICAgICAgICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIodGhpcy5pbm5lciwgXCJjb2xsaWRlLmJvdHRvbVwiLCB0aGlzLmNsZWFyTGlzdGVuZXJCb3R0b20pO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIFp3b29zaC5wcm90b3R5cGUuZmFkZU91dEJ5Q29vcmRzID0gZnVuY3Rpb24gKHgsIHkpIHtcbiAgICAgICAgICAgICAgICBfYSA9IHRoaXMuZ2V0UmVhbENvb3Jkcyh4LCB5KSwgeCA9IF9hWzBdLCB5ID0gX2FbMV07XG4gICAgICAgICAgICAgICAgdmFyIGEgPSB0aGlzLm9wdGlvbnMuZHJhZ09wdGlvbnMuYnJha2VTcGVlZCAqIC0xO1xuICAgICAgICAgICAgICAgIHZhciB2eSA9IDAgLSAoMiAqIGEgKiAoeSAtIHRoaXMuZ2V0U2Nyb2xsVG9wKCkpKTtcbiAgICAgICAgICAgICAgICB2YXIgdnggPSAwIC0gKDIgKiBhICogKHggLSB0aGlzLmdldFNjcm9sbExlZnQoKSkpO1xuICAgICAgICAgICAgICAgIHZ5ID0gKHZ5ID4gMCA/IDEgOiAtMSkgKiBNYXRoLnNxcnQoTWF0aC5hYnModnkpKTtcbiAgICAgICAgICAgICAgICB2eCA9ICh2eCA+IDAgPyAxIDogLTEpICogTWF0aC5zcXJ0KE1hdGguYWJzKHZ4KSk7XG4gICAgICAgICAgICAgICAgdmFyIHN4ID0geCAtIHRoaXMuZ2V0U2Nyb2xsTGVmdCgpO1xuICAgICAgICAgICAgICAgIHZhciBzeSA9IHkgLSB0aGlzLmdldFNjcm9sbFRvcCgpO1xuICAgICAgICAgICAgICAgIGlmIChNYXRoLmFicyhzeSkgPiBNYXRoLmFicyhzeCkpIHtcbiAgICAgICAgICAgICAgICAgICAgdnggPSAodnggPiAwID8gMSA6IC0xKSAqIE1hdGguYWJzKChzeCAvIHN5KSAqIHZ5KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHZ5ID0gKHZ5ID4gMCA/IDEgOiAtMSkgKiBNYXRoLmFicygoc3kgLyBzeCkgKiB2eCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuY2xlYXJUaW1lb3V0cygpO1xuICAgICAgICAgICAgICAgIHRoaXMuZmFkZU91dEJ5VmVsb2NpdHkodngsIHZ5KTtcbiAgICAgICAgICAgICAgICB2YXIgX2E7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBNb3VzZSBtb3ZlIGhhbmRsZXJcbiAgICAgICAgICAgICAqIENhbGN1Y2F0ZXMgdGhlIHggYW5kIHkgZGVsdGFzIGFuZCBzY3JvbGxzXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQHBhcmFtIHtNb3VzZUV2ZW50fSBlIC0gVGhlIG1vdXNlIG1vdmUgZXZlbnQgb2JqZWN0XG4gICAgICAgICAgICAgKiBAcmV0dXJuIHt2b2lkfVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLm1vdXNlTW92ZSA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wcmVzZW50ID0gKHRoaXMuZ2V0VGltZXN0YW1wKCkgLyAxMDAwKTsgLy8gc2Vjb25kc1xuICAgICAgICAgICAgICAgIHRoaXMuY2xlYXJUZXh0U2VsZWN0aW9uKCk7XG4gICAgICAgICAgICAgICAgLyogaWYgdGhlIG1vdXNlIGxlZnQgdGhlIHdpbmRvdyBhbmQgdGhlIGJ1dHRvbiBpcyBub3QgcHJlc3NlZCBhbnltb3JlLCBhYm9ydCBtb3ZpbmcgKi9cbiAgICAgICAgICAgICAgICBpZiAoKFwid2hpY2hcIiBpbiBlICYmIGUud2hpY2ggPT09IDApIHx8ICh0eXBlb2YgZS53aGljaCA9PT0gXCJ1bmRlZmluZWRcIiAmJiBcImJ1dHRvblwiIGluIGUgJiYgZS5idXR0b24gPT09IDApKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubW91c2VVcChlKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgeCA9IHRoaXMuZHJhZ09yaWdpbkxlZnQgKyB0aGlzLmRyYWdPcmlnaW5TY3JvbGxMZWZ0IC0gZS5jbGllbnRYO1xuICAgICAgICAgICAgICAgIHZhciB5ID0gdGhpcy5kcmFnT3JpZ2luVG9wICsgdGhpcy5kcmFnT3JpZ2luU2Nyb2xsVG9wIC0gZS5jbGllbnRZO1xuICAgICAgICAgICAgICAgIC8qIGlmIGVsYXN0aWMgZWRnZXMgYXJlIHNldCwgc2hvdyB0aGUgZWxlbWVudCBwc2V1ZG8gc2Nyb2xsZWQgYnkgcmVsYXRpdmUgcG9zaXRpb24gKi9cbiAgICAgICAgICAgICAgICBpZiAodGhpcy50cmlnZ2VyZWQuY29sbGlkZUJvdHRvbSAmJiB0aGlzLm9wdGlvbnMuZWxhc3RpY0VkZ2VzLmJvdHRvbSA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmlubmVyLnN0eWxlLnBvc2l0aW9uID0gXCJyZWxhdGl2ZVwiO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmlubmVyLnN0eWxlLnRvcCA9ICgodGhpcy5nZXRTY3JvbGxUb3AoKSAtIHkpIC8gMikgKyBcInB4XCI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh0aGlzLnRyaWdnZXJlZC5jb2xsaWRlVG9wICYmIHRoaXMub3B0aW9ucy5lbGFzdGljRWRnZXMudG9wID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaW5uZXIuc3R5bGUucG9zaXRpb24gPSBcInJlbGF0aXZlXCI7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaW5uZXIuc3R5bGUudG9wID0gKHkgLyAtMikgKyBcInB4XCI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh0aGlzLnRyaWdnZXJlZC5jb2xsaWRlTGVmdCAmJiB0aGlzLm9wdGlvbnMuZWxhc3RpY0VkZ2VzLmxlZnQgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pbm5lci5zdHlsZS5wb3NpdGlvbiA9IFwicmVsYXRpdmVcIjtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pbm5lci5zdHlsZS5sZWZ0ID0gKHggLyAtMikgKyBcInB4XCI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh0aGlzLnRyaWdnZXJlZC5jb2xsaWRlUmlnaHQgJiYgdGhpcy5vcHRpb25zLmVsYXN0aWNFZGdlcy5yaWdodCA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmlubmVyLnN0eWxlLnBvc2l0aW9uID0gXCJyZWxhdGl2ZVwiO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmlubmVyLnN0eWxlLmxlZnQgPSAoKHRoaXMuZ2V0U2Nyb2xsTGVmdCgpIC0geCkgLyAyKSArIFwicHhcIjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy52eFt0aGlzLnByZXNlbnRdID0geDtcbiAgICAgICAgICAgICAgICB0aGlzLnZ5W3RoaXMucHJlc2VudF0gPSB5O1xuICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsVG8oeCwgeSwgZmFsc2UpO1xuICAgICAgICAgICAgICAgIHRoaXMucGFzdCA9IHRoaXMucHJlc2VudDtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIHNjcm9sbEJ5IGhlbHBlciBtZXRob2QgdG8gc2Nyb2xsIGJ5IGFuIGFtb3VudCBvZiBwaXhlbHMgaW4geC0gYW5kIHktZGlyZWN0aW9uXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IHggLSBhbW91bnQgb2YgcGl4ZWxzIHRvIHNjcm9sbCBpbiB4LWRpcmVjdGlvblxuICAgICAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IHkgLSBhbW91bnQgb2YgcGl4ZWxzIHRvIHNjcm9sbCBpbiB5LWRpcmVjdGlvblxuICAgICAgICAgICAgICogQHBhcmFtIHtib29sZWFufSBzbW9vdGggLSB3aGV0aGVyIHRvIHNjcm9sbCBzbW9vdGggb3IgaW5zdGFudFxuICAgICAgICAgICAgICogQHJldHVybiB7dm9pZH1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgWndvb3NoLnByb3RvdHlwZS5zY3JvbGxCeSA9IGZ1bmN0aW9uICh4LCB5LCBzbW9vdGgpIHtcbiAgICAgICAgICAgICAgICBpZiAoc21vb3RoID09PSB2b2lkIDApIHsgc21vb3RoID0gdHJ1ZTsgfVxuICAgICAgICAgICAgICAgIHZhciBhYnNvbHV0ZVggPSB0aGlzLmdldFNjcm9sbExlZnQoKSArIHg7XG4gICAgICAgICAgICAgICAgdmFyIGFic29sdXRlWSA9IHRoaXMuZ2V0U2Nyb2xsVG9wKCkgKyB5O1xuICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsVG8oYWJzb2x1dGVYLCBhYnNvbHV0ZVksIHNtb290aCk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBzY3JvbGxCeSBoZWxwZXIgbWV0aG9kIHRvIHNjcm9sbCB0byBhIHgtIGFuZCB5LWNvb3JkaW5hdGVcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0geCAtIHgtY29vcmRpbmF0ZSB0byBzY3JvbGwgdG9cbiAgICAgICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSB5IC0geS1jb29yZGluYXRlIHRvIHNjcm9sbCB0b1xuICAgICAgICAgICAgICogQHBhcmFtIHtib29sZWFufSBzbW9vdGggLSB3aGV0aGVyIHRvIHNjcm9sbCBzbW9vdGggb3IgaW5zdGFudFxuICAgICAgICAgICAgICogQHJldHVybiB7dm9pZH1cbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAVE9ETzogQ1NTMyB0cmFuc2l0aW9ucyBpZiBhdmFpbGFibGUgaW4gYnJvd3NlclxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBad29vc2gucHJvdG90eXBlLnNjcm9sbFRvID0gZnVuY3Rpb24gKHgsIHksIHNtb290aCkge1xuICAgICAgICAgICAgICAgIGlmIChzbW9vdGggPT09IHZvaWQgMCkgeyBzbW9vdGggPSB0cnVlOyB9XG4gICAgICAgICAgICAgICAgdGhpcy5jbGVhclRpbWVvdXRzKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5zY3JvbGxNYXhMZWZ0ID0gKHRoaXMuc2Nyb2xsRWxlbWVudC5zY3JvbGxXaWR0aCAtIHRoaXMuc2Nyb2xsRWxlbWVudC5jbGllbnRXaWR0aCk7XG4gICAgICAgICAgICAgICAgdGhpcy5zY3JvbGxNYXhUb3AgPSAodGhpcy5zY3JvbGxFbGVtZW50LnNjcm9sbEhlaWdodCAtIHRoaXMuc2Nyb2xsRWxlbWVudC5jbGllbnRIZWlnaHQpO1xuICAgICAgICAgICAgICAgIC8qIG5vIG5lZ2F0aXZlIHZhbHVlcyBvciB2YWx1ZXMgZ3JlYXRlciB0aGFuIHRoZSBtYXhpbXVtICovXG4gICAgICAgICAgICAgICAgeCA9ICh4ID4gdGhpcy5zY3JvbGxNYXhMZWZ0KSA/IHRoaXMuc2Nyb2xsTWF4TGVmdCA6ICh4IDwgMCkgPyAwIDogeDtcbiAgICAgICAgICAgICAgICB5ID0gKHkgPiB0aGlzLnNjcm9sbE1heFRvcCkgPyB0aGlzLnNjcm9sbE1heFRvcCA6ICh5IDwgMCkgPyAwIDogeTtcbiAgICAgICAgICAgICAgICAvKiByZW1lbWJlciB0aGUgb2xkIHZhbHVlcyAqL1xuICAgICAgICAgICAgICAgIHRoaXMub3JpZ2luU2Nyb2xsTGVmdCA9IHRoaXMuZ2V0U2Nyb2xsTGVmdCgpO1xuICAgICAgICAgICAgICAgIHRoaXMub3JpZ2luU2Nyb2xsVG9wID0gdGhpcy5nZXRTY3JvbGxUb3AoKTtcbiAgICAgICAgICAgICAgICBpZiAoeCAhPT0gdGhpcy5nZXRTY3JvbGxMZWZ0KCkgfHwgeSAhPT0gdGhpcy5nZXRTY3JvbGxUb3AoKSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLndoZWVsT3B0aW9ucy5zbW9vdGggIT09IHRydWUgfHwgc21vb3RoID09PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXRTY3JvbGxUb3AoeSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNldFNjcm9sbExlZnQoeCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmZhZGVPdXRCeUNvb3Jkcyh4LCB5KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFJlZ2lzdGVyIGN1c3RvbSBldmVudCBjYWxsYmFja3NcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnQgLSBUaGUgZXZlbnQgbmFtZVxuICAgICAgICAgICAgICogQHBhcmFtIHsoZTogRXZlbnQpID0+IGFueX0gY2FsbGJhY2sgLSBBIGNhbGxiYWNrIGZ1bmN0aW9uIHRvIGV4ZWN1dGUgd2hlbiB0aGUgZXZlbnQgcmFpc2VzXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHtad29vc2h9IC0gVGhlIFp3b29zaCBvYmplY3QgaW5zdGFuY2VcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgWndvb3NoLnByb3RvdHlwZS5vbiA9IGZ1bmN0aW9uIChldmVudCwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIodGhpcy5pbm5lciwgZXZlbnQsIGNhbGxiYWNrKTtcbiAgICAgICAgICAgICAgICAvKiBzZXQgdGhlIGV2ZW50IHVudHJpZ2dlcmVkIGFuZCBjYWxsIHRoZSBmdW5jdGlvbiwgdG8gcmV0cmlnZ2VyIG1ldCBldmVudHMgKi9cbiAgICAgICAgICAgICAgICB2YXIgZiA9IGV2ZW50LnJlcGxhY2UoL1xcLihbYS16XSkvLCBTdHJpbmcuY2FsbC5iaW5kKGV2ZW50LnRvVXBwZXJDYXNlKSkucmVwbGFjZSgvXFwuLywgXCJcIik7XG4gICAgICAgICAgICAgICAgdGhpcy50cmlnZ2VyZWRbZl0gPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB0aGlzLm9uU2Nyb2xsKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBEZXJlZ2lzdGVyIGN1c3RvbSBldmVudCBjYWxsYmFja3NcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnQgLSBUaGUgZXZlbnQgbmFtZVxuICAgICAgICAgICAgICogQHBhcmFtIHsoZTogRXZlbnQpID0+IGFueX0gY2FsbGJhY2sgLSBBIGNhbGxiYWNrIGZ1bmN0aW9uIHRvIGV4ZWN1dGUgd2hlbiB0aGUgZXZlbnQgcmFpc2VzXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHtad29vc2h9IC0gVGhlIFp3b29zaCBvYmplY3QgaW5zdGFuY2VcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgWndvb3NoLnByb3RvdHlwZS5vZmYgPSBmdW5jdGlvbiAoZXZlbnQsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKHRoaXMuaW5uZXIsIGV2ZW50LCBjYWxsYmFjayk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBSZXZlcnQgYWxsIERPTSBtYW5pcHVsYXRpb25zIGFuZCBkZXJlZ2lzdGVyIGFsbCBldmVudCBoYW5kbGVyc1xuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEByZXR1cm4ge3ZvaWR9XG4gICAgICAgICAgICAgKiBAVE9ETzogcmVtb3Zpbmcgd2hlZWxab29tSGFuZGxlciBkb2VzIG5vdCB3b3JrXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIFp3b29zaC5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgeCA9IHRoaXMuZ2V0U2Nyb2xsTGVmdCgpO1xuICAgICAgICAgICAgICAgIHZhciB5ID0gdGhpcy5nZXRTY3JvbGxUb3AoKTtcbiAgICAgICAgICAgICAgICAvKiByZW1vdmUgdGhlIG91dGVyIGFuZCBncmFiIENTUyBjbGFzc2VzICovXG4gICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVDbGFzcyh0aGlzLmNvbnRhaW5lciwgdGhpcy5jbGFzc091dGVyKTtcbiAgICAgICAgICAgICAgICB0aGlzLnJlbW92ZUNsYXNzKHRoaXMuaW5uZXIsIHRoaXMuY2xhc3NHcmFiKTtcbiAgICAgICAgICAgICAgICB0aGlzLnJlbW92ZUNsYXNzKHRoaXMuY29udGFpbmVyLCB0aGlzLmNsYXNzTm9HcmFiKTtcbiAgICAgICAgICAgICAgICAvKiBtb3ZlIGFsbCBjaGlsZE5vZGVzIGJhY2sgdG8gdGhlIG9sZCBvdXRlciBlbGVtZW50IGFuZCByZW1vdmUgdGhlIGlubmVyIGVsZW1lbnQgKi9cbiAgICAgICAgICAgICAgICB3aGlsZSAodGhpcy5pbm5lci5jaGlsZE5vZGVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jb250YWluZXIuYXBwZW5kQ2hpbGQodGhpcy5pbm5lci5jaGlsZE5vZGVzWzBdKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5zY2FsZUVsZW1lbnQucmVtb3ZlQ2hpbGQodGhpcy5pbm5lcik7XG4gICAgICAgICAgICAgICAgdGhpcy5jb250YWluZXIucmVtb3ZlQ2hpbGQodGhpcy5zY2FsZUVsZW1lbnQpO1xuICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsVG8oeCwgeSwgZmFsc2UpO1xuICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsRWxlbWVudC5vbm1vdXNld2hlZWwgPSBudWxsO1xuICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsRWxlbWVudC5vbnNjcm9sbCA9IG51bGw7XG4gICAgICAgICAgICAgICAgd2luZG93Lm9ucmVzaXplID0gbnVsbDtcbiAgICAgICAgICAgICAgICAvKiByZW1vdmUgYWxsIGN1c3RvbSBldmVudGxpc3RlbmVycyBhdHRhY2hlZCB2aWEgdGhpcy5hZGRFdmVudExpc3RlbmVyKCkgKi9cbiAgICAgICAgICAgICAgICBmb3IgKHZhciBldmVudF8xIGluIHRoaXMuY3VzdG9tRXZlbnRzKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmN1c3RvbUV2ZW50cy5oYXNPd25Qcm9wZXJ0eShldmVudF8xKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgcCBpbiB0aGlzLmN1c3RvbUV2ZW50c1tldmVudF8xXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmN1c3RvbUV2ZW50c1tldmVudF8xXS5oYXNPd25Qcm9wZXJ0eShwKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlbW92ZUV2ZW50TGlzdGVuZXIodGhpcy5pbm5lciwgZXZlbnRfMSwgdGhpcy5jdXN0b21FdmVudHNbZXZlbnRfMV1bcF1bMF0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcmV0dXJuIFp3b29zaDtcbiAgICAgICAgfSgpKTtcbiAgICAgICAgLyogcmV0dXJuIGFuIGluc3RhbmNlIG9mIHRoZSBjbGFzcyAqL1xuICAgICAgICByZXR1cm4gbmV3IFp3b29zaChjb250YWluZXIsIG9wdGlvbnMpO1xuICAgIH1cbiAgICByZXR1cm4gendvb3NoO1xufSk7XG4vLyMgc291cmNlTWFwcGluZ1VSTD16d29vc2guanMubWFwIl19
