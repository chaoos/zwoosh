(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.swoosh = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*
names:
infinite
inifinity room / space / mirror
1-sphere
tardis
tesseract
4th dimension
Dimensionally transindental

pic:
https://en.wikipedia.org/wiki/Infinity_mirror

*/
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
    /**
     * default export function of the module
     *
     * @param {HTMLElement} container - The HTMLElement to swoooosh!
     * @param {Options} options - the options object to configure Swoosh
     * @return {Swoosh} - Swoosh object instance
     */
    function default_1(container, options) {
        var Swoosh = (function () {
            function Swoosh(container, options) {
                var _this = this;
                this.container = container;
                this.options = options;
                /* CSS style classes */
                this.classInner = 'inner';
                this.classOuter = 'outer';
                this.classGrabbing = 'grabbing';
                this.container = container;
                /* set default options */
                this.options = {
                    grid: 1,
                    elasticEgdes: {
                        left: 50,
                        right: 50,
                        top: 50,
                        bottom: 50
                    },
                    callback: this.always
                };
                /* merge the two option objects */
                for (var key in options) {
                    if (options.hasOwnProperty(key))
                        this.options[key] = options[key];
                }
                this.container.className += " outer";
                /* create inner div element and append it to the container with its contents in it */
                this.inner = document.createElement("div");
                this.inner.className += " " + this.classInner;
                /* move all childNodes to the new inner element */
                while (this.container.childNodes.length > 0) {
                    this.inner.appendChild(this.container.childNodes[0]);
                }
                this.container.appendChild(this.inner);
                this.scrollElement = this.container.tagName == "BODY" ? document.documentElement : this.container;
                this.inner.style.minWidth = this.container.scrollWidth + 'px';
                this.inner.style.minHeight = this.container.scrollHeight + 'px';
                this.oldClientWidth = document.documentElement.clientWidth;
                this.oldClientHeight = document.documentElement.clientHeight;
                this.inner.style.paddingLeft = this.options.elasticEgdes.left + 'px';
                this.inner.style.paddingRight = this.options.elasticEgdes.right + 'px';
                this.inner.style.paddingTop = this.options.elasticEgdes.top + 'px';
                this.inner.style.paddingBottom = this.options.elasticEgdes.bottom + 'px';
                this.scrollTo(this.options.elasticEgdes.left, this.options.elasticEgdes.top);
                /*this.container.addEventListener('wheel', function(e){
                  console.log('scroll: ', e);
                  if (e.preventDefault)
                      e.preventDefault();
                  e.returnValue = false;
                });*/
                /* if the scroll element is body, adjust the inner div when resizing */
                if (this.container.tagName == "BODY") {
                    this.resizeHandler = function (e) { return _this.resize(e); };
                    window.onresize = this.resizeHandler;
                }
                this.mouseDownHandler = function (e) { return _this.mouseDown(e); };
                this.addEventListener(this.inner, 'mousedown', this.mouseDownHandler);
            }
            /**
             * window resize handler to recalculate the inner div minWidth and minHeight
             *
             * @param {Event} e - The window resize event object (TODO: needed?)
             * @return {void}
             */
            Swoosh.prototype.resize = function (e) {
                var _this = this;
                var onResize = function () {
                    _this.inner.style.minWidth = null;
                    _this.inner.style.minHeight = null;
                    /* take away the margin values of the body element */
                    var xDelta = parseInt(_this.getStyle(document.body, 'marginLeft'), 10) + parseInt(_this.getStyle(document.body, 'marginRight'), 10);
                    var yDelta = parseInt(_this.getStyle(document.body, 'marginTop'), 10) + parseInt(_this.getStyle(document.body, 'marginBottom'), 10);
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
            /* browser independent event registration */
            /**
             * Browser independent event registration
             *
             * @param {HTMLElement} obj - The HTMLElement to attach the event to
             * @param {string} event - The event name without the leading "on"
             * @param {(e: Event) => void} callback - A callback function to attach to the event
             * @return {void}
             */
            Swoosh.prototype.addEventListener = function (obj, event, callback) {
                if (typeof obj.addEventListener == 'function') {
                    obj.addEventListener(event, callback);
                }
                else if (typeof obj.attachEvent == 'object' && htmlEvents['on' + event]) {
                    obj.attachEvent('on' + event, callback);
                }
                else if (typeof obj.attachEvent == 'object') {
                    document.documentElement[event] = 1;
                    document.documentElement.attachEvent('onpropertychange', function (e) {
                        if (e.propertyName == event) {
                            /* TODO: e is the onpropertychange event not one of the custom event objects */
                            /* TODO: only every Swoosh element raises the same collideLeft event */
                            callback(e);
                        }
                    });
                }
                else {
                    obj['on' + event] = callback;
                }
            };
            /**
             * Browser independent event deregistration
             *
             * @param {HTMLElement} obj - The HTMLElement whose event should be detached
             * @param {string} event - The event name without the leading "on"
             * @param {(e: Event) => void} callback - The callback function when attached
             * @return {void}
             */
            Swoosh.prototype.removeEventListener = function (obj, event, callback) {
                if (typeof obj.removeEventListener == 'function') {
                    obj.removeEventListener(event, callback);
                }
                else if (typeof obj.detachEvent == 'object') {
                    obj.detachEvent('on' + event, callback);
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
                else if (document.documentElement[eventName]) {
                    document.documentElement[eventName]++;
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
             * Get a css style value browser independent
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
            /**
             * Mouse down handler
             * Registers the mousemove and mouseup handlers and finds the next inner element
             *
             * @param {MouseEvent} e - The mouse down event object
             * @return {void}
             */
            Swoosh.prototype.mouseDown = function (e) {
                var _this = this;
                var elementBehindCursor = document.elementFromPoint(e.clientX, e.clientY);
                /* find the next parent which is an inner element */
                var re = new RegExp(" " + this.classInner);
                while (elementBehindCursor && !elementBehindCursor.className.match(re)) {
                    elementBehindCursor = elementBehindCursor.parentElement;
                }
                if (this.inner == elementBehindCursor) {
                    this.inner.className += ' ' + this.classGrabbing;
                    /* note the origin positions */
                    this.dragOriginLeft = e.clientX;
                    this.dragOriginTop = e.clientY;
                    this.dragOriginScrollLeft = this.scrollElement.scrollLeft;
                    this.dragOriginScrollTop = this.scrollElement.scrollTop;
                    /* it looks strane if scroll-behavior is set to smooth */
                    this.parentOriginStyle = this.inner.parentElement.style.cssText;
                    if (typeof this.inner.parentElement.style.setProperty == 'function') {
                        this.inner.parentElement.style.setProperty('scroll-behavior', 'auto');
                    }
                    this.mouseMoveHandler = this.mouseMove.bind(this);
                    this.addEventListener(document.documentElement, 'mousemove', this.mouseMoveHandler);
                    this.mouseUpHandler = function (e) { return _this.mouseUp(e); };
                    this.addEventListener(document.documentElement, 'mouseup', this.mouseUpHandler);
                }
            };
            /**
             * Mouse up handler
             * Deregisters the mousemove and mouseup handlers and aligns the element to a grid
             *
             * @param {MouseEvent} e - The mouse up event object
             * @return {void}
             */
            Swoosh.prototype.mouseUp = function (e) {
                //stick the element to the grid, if grid equals 1 the value does not change
                var x = Math.round((this.dragOriginLeft + this.dragOriginScrollLeft - e.clientX) / this.options.grid) * this.options.grid;
                var y = Math.round((this.dragOriginTop + this.dragOriginScrollTop - e.clientY) / this.options.grid) * this.options.grid;
                var scrollMaxLeft = (this.scrollElement.scrollWidth - this.scrollElement.clientWidth) - this.options.elasticEgdes.left;
                var scrollMaxTop = (this.scrollElement.scrollHeight - this.scrollElement.clientHeight) - this.options.elasticEgdes.top;
                x = (x > scrollMaxLeft) ? scrollMaxLeft : (x < this.options.elasticEgdes.left) ? this.options.elasticEgdes.left : x;
                y = (y > scrollMaxTop) ? scrollMaxTop : (y < this.options.elasticEgdes.top) ? this.options.elasticEgdes.top : y;
                var re = new RegExp(" " + this.classGrabbing);
                this.inner.className = this.inner.className.replace(re, '');
                this.inner.parentElement.style.cssText = this.parentOriginStyle;
                this.scrollTo(x, y);
                this.removeEventListener(document.documentElement, 'mousemove', this.mouseMoveHandler);
                this.removeEventListener(document.documentElement, 'mouseup', this.mouseUpHandler);
            };
            /**
             * Mouse move handler
             * Calcucates the x and y deltas and scrolls
             *
             * @param {MouseEvent} e - The mouse move event object
             * @return {void}
             */
            Swoosh.prototype.mouseMove = function (e) {
                var x = this.dragOriginLeft + this.dragOriginScrollLeft - e.clientX;
                var y = this.dragOriginTop + this.dragOriginScrollTop - e.clientY;
                this.scrollTo(x, y);
            };
            /**
             * scroll helper method
             *
             * @param {number} x - x-coordinate to scroll to
             * @param {number} y - y-coordinate to scroll to
             * @throws Event collideLeft
             * @throws Event collideRight
             * @throws Event collideTop
             * @throws Event collideBottom
             * @return {void}
             */
            Swoosh.prototype.scrollTo = function (x, y) {
                var scrollMaxLeft = (this.scrollElement.scrollWidth - this.scrollElement.clientWidth);
                var scrollMaxTop = (this.scrollElement.scrollHeight - this.scrollElement.clientHeight);
                /* no negative values or greater than the maximum */
                var x = (x > scrollMaxLeft) ? scrollMaxLeft : (x < 0) ? 0 : x;
                var y = (y > scrollMaxTop) ? scrollMaxTop : (y < 0) ? 0 : y;
                /* remember the old values */
                this.originScrollLeft = this.scrollElement.scrollLeft;
                this.originScrollTop = this.scrollElement.scrollTop;
                if (typeof this.scrollElement.scrollTo == 'function') {
                    this.scrollElement.scrollTo(x, y);
                }
                else {
                    //IE8 has no scrollTo method
                    this.scrollElement.scrollTop = y;
                    this.scrollElement.scrollLeft = x;
                }
                /* the collideLeft event */
                if (x == 0 && this.originScrollLeft != x) {
                    this.triggerEvent(this.inner, 'collideLeft');
                }
                /* the collideTop event */
                if (y == 0 && this.originScrollTop != y) {
                    this.triggerEvent(this.inner, 'collideTop');
                }
                /* the collideRight event */
                if (x == scrollMaxLeft && this.originScrollLeft != x) {
                    this.triggerEvent(this.inner, 'collideRight');
                }
                /* the collideBottom event */
                if (y == scrollMaxTop && this.originScrollTop != y) {
                    this.triggerEvent(this.inner, 'collideBottom');
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
                this.addEventListener(this.inner, event, callback.bind(this));
                return this;
            };
            Swoosh.prototype.always = function () { console.log('always()'); return true; };
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzd29vc2guanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKlxubmFtZXM6XG5pbmZpbml0ZVxuaW5pZmluaXR5IHJvb20gLyBzcGFjZSAvIG1pcnJvclxuMS1zcGhlcmVcbnRhcmRpc1xudGVzc2VyYWN0XG40dGggZGltZW5zaW9uXG5EaW1lbnNpb25hbGx5IHRyYW5zaW5kZW50YWxcblxucGljOlxuaHR0cHM6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvSW5maW5pdHlfbWlycm9yXG5cbiovXG4oZnVuY3Rpb24gKGZhY3RvcnkpIHtcbiAgICBpZiAodHlwZW9mIG1vZHVsZSA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIG1vZHVsZS5leHBvcnRzID09PSAnb2JqZWN0Jykge1xuICAgICAgICB2YXIgdiA9IGZhY3RvcnkocmVxdWlyZSwgZXhwb3J0cyk7IGlmICh2ICE9PSB1bmRlZmluZWQpIG1vZHVsZS5leHBvcnRzID0gdjtcbiAgICB9XG4gICAgZWxzZSBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gICAgICAgIGRlZmluZShbXCJyZXF1aXJlXCIsIFwiZXhwb3J0c1wiXSwgZmFjdG9yeSk7XG4gICAgfVxufSkoZnVuY3Rpb24gKHJlcXVpcmUsIGV4cG9ydHMpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcbiAgICAvKipcbiAgICAgKiBQb2x5ZmlsbCBiaW5kIGZ1bmN0aW9uIGZvciBvbGRlciBicm93c2Vyc1xuICAgICAqIFRoZSBiaW5kIGZ1bmN0aW9uIGlzIGFuIGFkZGl0aW9uIHRvIEVDTUEtMjYyLCA1dGggZWRpdGlvblxuICAgICAqIFNlZTogaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSmF2YVNjcmlwdC9SZWZlcmVuY2UvR2xvYmFsX09iamVjdHMvRnVuY3Rpb24vYmluZFxuICAgICAqL1xuICAgIGlmICghRnVuY3Rpb24ucHJvdG90eXBlLmJpbmQpIHtcbiAgICAgICAgRnVuY3Rpb24ucHJvdG90eXBlLmJpbmQgPSBmdW5jdGlvbiAob1RoaXMpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgdGhpcyAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgIC8vIGNsb3Nlc3QgdGhpbmcgcG9zc2libGUgdG8gdGhlIEVDTUFTY3JpcHQgNVxuICAgICAgICAgICAgICAgIC8vIGludGVybmFsIElzQ2FsbGFibGUgZnVuY3Rpb25cbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdGdW5jdGlvbi5wcm90b3R5cGUuYmluZCAtIHdoYXQgaXMgdHJ5aW5nIHRvIGJlIGJvdW5kIGlzIG5vdCBjYWxsYWJsZScpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGFBcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSwgZlRvQmluZCA9IHRoaXMsIGZOT1AgPSBmdW5jdGlvbiAoKSB7IH0sIGZCb3VuZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZlRvQmluZC5hcHBseSh0aGlzIGluc3RhbmNlb2YgZk5PUFxuICAgICAgICAgICAgICAgICAgICA/IHRoaXNcbiAgICAgICAgICAgICAgICAgICAgOiBvVGhpcywgYUFyZ3MuY29uY2F0KEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cykpKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBpZiAodGhpcy5wcm90b3R5cGUpIHtcbiAgICAgICAgICAgICAgICAvLyBGdW5jdGlvbi5wcm90b3R5cGUgZG9lc24ndCBoYXZlIGEgcHJvdG90eXBlIHByb3BlcnR5XG4gICAgICAgICAgICAgICAgZk5PUC5wcm90b3R5cGUgPSB0aGlzLnByb3RvdHlwZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZCb3VuZC5wcm90b3R5cGUgPSBuZXcgZk5PUCgpO1xuICAgICAgICAgICAgcmV0dXJuIGZCb3VuZDtcbiAgICAgICAgfTtcbiAgICB9XG4gICAgLyogbGlzdCBvZiByZWFsIGV2ZW50cyAqL1xuICAgIHZhciBodG1sRXZlbnRzID0ge1xuICAgICAgICAvKiA8Ym9keT4gYW5kIDxmcmFtZXNldD4gRXZlbnRzICovXG4gICAgICAgIG9ubG9hZDogMSxcbiAgICAgICAgb251bmxvYWQ6IDEsXG4gICAgICAgIC8qIEZvcm0gRXZlbnRzICovXG4gICAgICAgIG9uYmx1cjogMSxcbiAgICAgICAgb25jaGFuZ2U6IDEsXG4gICAgICAgIG9uZm9jdXM6IDEsXG4gICAgICAgIG9ucmVzZXQ6IDEsXG4gICAgICAgIG9uc2VsZWN0OiAxLFxuICAgICAgICBvbnN1Ym1pdDogMSxcbiAgICAgICAgLyogSW1hZ2UgRXZlbnRzICovXG4gICAgICAgIG9uYWJvcnQ6IDEsXG4gICAgICAgIC8qIEtleWJvYXJkIEV2ZW50cyAqL1xuICAgICAgICBvbmtleWRvd246IDEsXG4gICAgICAgIG9ua2V5cHJlc3M6IDEsXG4gICAgICAgIG9ua2V5dXA6IDEsXG4gICAgICAgIC8qIE1vdXNlIEV2ZW50cyAqL1xuICAgICAgICBvbmNsaWNrOiAxLFxuICAgICAgICBvbmRibGNsaWNrOiAxLFxuICAgICAgICBvbm1vdXNlZG93bjogMSxcbiAgICAgICAgb25tb3VzZW1vdmU6IDEsXG4gICAgICAgIG9ubW91c2VvdXQ6IDEsXG4gICAgICAgIG9ubW91c2VvdmVyOiAxLFxuICAgICAgICBvbm1vdXNldXA6IDFcbiAgICB9O1xuICAgIC8qKlxuICAgICAqIGRlZmF1bHQgZXhwb3J0IGZ1bmN0aW9uIG9mIHRoZSBtb2R1bGVcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGNvbnRhaW5lciAtIFRoZSBIVE1MRWxlbWVudCB0byBzd29vb29zaCFcbiAgICAgKiBAcGFyYW0ge09wdGlvbnN9IG9wdGlvbnMgLSB0aGUgb3B0aW9ucyBvYmplY3QgdG8gY29uZmlndXJlIFN3b29zaFxuICAgICAqIEByZXR1cm4ge1N3b29zaH0gLSBTd29vc2ggb2JqZWN0IGluc3RhbmNlXG4gICAgICovXG4gICAgZnVuY3Rpb24gZGVmYXVsdF8xKGNvbnRhaW5lciwgb3B0aW9ucykge1xuICAgICAgICB2YXIgU3dvb3NoID0gKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGZ1bmN0aW9uIFN3b29zaChjb250YWluZXIsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICAgICAgICAgIHRoaXMuY29udGFpbmVyID0gY29udGFpbmVyO1xuICAgICAgICAgICAgICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG4gICAgICAgICAgICAgICAgLyogQ1NTIHN0eWxlIGNsYXNzZXMgKi9cbiAgICAgICAgICAgICAgICB0aGlzLmNsYXNzSW5uZXIgPSAnaW5uZXInO1xuICAgICAgICAgICAgICAgIHRoaXMuY2xhc3NPdXRlciA9ICdvdXRlcic7XG4gICAgICAgICAgICAgICAgdGhpcy5jbGFzc0dyYWJiaW5nID0gJ2dyYWJiaW5nJztcbiAgICAgICAgICAgICAgICB0aGlzLmNvbnRhaW5lciA9IGNvbnRhaW5lcjtcbiAgICAgICAgICAgICAgICAvKiBzZXQgZGVmYXVsdCBvcHRpb25zICovXG4gICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zID0ge1xuICAgICAgICAgICAgICAgICAgICBncmlkOiAxLFxuICAgICAgICAgICAgICAgICAgICBlbGFzdGljRWdkZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxlZnQ6IDUwLFxuICAgICAgICAgICAgICAgICAgICAgICAgcmlnaHQ6IDUwLFxuICAgICAgICAgICAgICAgICAgICAgICAgdG9wOiA1MCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGJvdHRvbTogNTBcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2s6IHRoaXMuYWx3YXlzXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAvKiBtZXJnZSB0aGUgdHdvIG9wdGlvbiBvYmplY3RzICovXG4gICAgICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIG9wdGlvbnMpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMuaGFzT3duUHJvcGVydHkoa2V5KSlcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMub3B0aW9uc1trZXldID0gb3B0aW9uc1trZXldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLmNvbnRhaW5lci5jbGFzc05hbWUgKz0gXCIgb3V0ZXJcIjtcbiAgICAgICAgICAgICAgICAvKiBjcmVhdGUgaW5uZXIgZGl2IGVsZW1lbnQgYW5kIGFwcGVuZCBpdCB0byB0aGUgY29udGFpbmVyIHdpdGggaXRzIGNvbnRlbnRzIGluIGl0ICovXG4gICAgICAgICAgICAgICAgdGhpcy5pbm5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICAgICAgICAgICAgdGhpcy5pbm5lci5jbGFzc05hbWUgKz0gXCIgXCIgKyB0aGlzLmNsYXNzSW5uZXI7XG4gICAgICAgICAgICAgICAgLyogbW92ZSBhbGwgY2hpbGROb2RlcyB0byB0aGUgbmV3IGlubmVyIGVsZW1lbnQgKi9cbiAgICAgICAgICAgICAgICB3aGlsZSAodGhpcy5jb250YWluZXIuY2hpbGROb2Rlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaW5uZXIuYXBwZW5kQ2hpbGQodGhpcy5jb250YWluZXIuY2hpbGROb2Rlc1swXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuY29udGFpbmVyLmFwcGVuZENoaWxkKHRoaXMuaW5uZXIpO1xuICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsRWxlbWVudCA9IHRoaXMuY29udGFpbmVyLnRhZ05hbWUgPT0gXCJCT0RZXCIgPyBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQgOiB0aGlzLmNvbnRhaW5lcjtcbiAgICAgICAgICAgICAgICB0aGlzLmlubmVyLnN0eWxlLm1pbldpZHRoID0gdGhpcy5jb250YWluZXIuc2Nyb2xsV2lkdGggKyAncHgnO1xuICAgICAgICAgICAgICAgIHRoaXMuaW5uZXIuc3R5bGUubWluSGVpZ2h0ID0gdGhpcy5jb250YWluZXIuc2Nyb2xsSGVpZ2h0ICsgJ3B4JztcbiAgICAgICAgICAgICAgICB0aGlzLm9sZENsaWVudFdpZHRoID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudFdpZHRoO1xuICAgICAgICAgICAgICAgIHRoaXMub2xkQ2xpZW50SGVpZ2h0ID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudEhlaWdodDtcbiAgICAgICAgICAgICAgICB0aGlzLmlubmVyLnN0eWxlLnBhZGRpbmdMZWZ0ID0gdGhpcy5vcHRpb25zLmVsYXN0aWNFZ2Rlcy5sZWZ0ICsgJ3B4JztcbiAgICAgICAgICAgICAgICB0aGlzLmlubmVyLnN0eWxlLnBhZGRpbmdSaWdodCA9IHRoaXMub3B0aW9ucy5lbGFzdGljRWdkZXMucmlnaHQgKyAncHgnO1xuICAgICAgICAgICAgICAgIHRoaXMuaW5uZXIuc3R5bGUucGFkZGluZ1RvcCA9IHRoaXMub3B0aW9ucy5lbGFzdGljRWdkZXMudG9wICsgJ3B4JztcbiAgICAgICAgICAgICAgICB0aGlzLmlubmVyLnN0eWxlLnBhZGRpbmdCb3R0b20gPSB0aGlzLm9wdGlvbnMuZWxhc3RpY0VnZGVzLmJvdHRvbSArICdweCc7XG4gICAgICAgICAgICAgICAgdGhpcy5zY3JvbGxUbyh0aGlzLm9wdGlvbnMuZWxhc3RpY0VnZGVzLmxlZnQsIHRoaXMub3B0aW9ucy5lbGFzdGljRWdkZXMudG9wKTtcbiAgICAgICAgICAgICAgICAvKnRoaXMuY29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoJ3doZWVsJywgZnVuY3Rpb24oZSl7XG4gICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnc2Nyb2xsOiAnLCBlKTtcbiAgICAgICAgICAgICAgICAgIGlmIChlLnByZXZlbnREZWZhdWx0KVxuICAgICAgICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgIGUucmV0dXJuVmFsdWUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9KTsqL1xuICAgICAgICAgICAgICAgIC8qIGlmIHRoZSBzY3JvbGwgZWxlbWVudCBpcyBib2R5LCBhZGp1c3QgdGhlIGlubmVyIGRpdiB3aGVuIHJlc2l6aW5nICovXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuY29udGFpbmVyLnRhZ05hbWUgPT0gXCJCT0RZXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yZXNpemVIYW5kbGVyID0gZnVuY3Rpb24gKGUpIHsgcmV0dXJuIF90aGlzLnJlc2l6ZShlKTsgfTtcbiAgICAgICAgICAgICAgICAgICAgd2luZG93Lm9ucmVzaXplID0gdGhpcy5yZXNpemVIYW5kbGVyO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLm1vdXNlRG93bkhhbmRsZXIgPSBmdW5jdGlvbiAoZSkgeyByZXR1cm4gX3RoaXMubW91c2VEb3duKGUpOyB9O1xuICAgICAgICAgICAgICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcih0aGlzLmlubmVyLCAnbW91c2Vkb3duJywgdGhpcy5tb3VzZURvd25IYW5kbGVyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogd2luZG93IHJlc2l6ZSBoYW5kbGVyIHRvIHJlY2FsY3VsYXRlIHRoZSBpbm5lciBkaXYgbWluV2lkdGggYW5kIG1pbkhlaWdodFxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBwYXJhbSB7RXZlbnR9IGUgLSBUaGUgd2luZG93IHJlc2l6ZSBldmVudCBvYmplY3QgKFRPRE86IG5lZWRlZD8pXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHt2b2lkfVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBTd29vc2gucHJvdG90eXBlLnJlc2l6ZSA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgICAgICAgICB2YXIgb25SZXNpemUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIF90aGlzLmlubmVyLnN0eWxlLm1pbldpZHRoID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMuaW5uZXIuc3R5bGUubWluSGVpZ2h0ID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgLyogdGFrZSBhd2F5IHRoZSBtYXJnaW4gdmFsdWVzIG9mIHRoZSBib2R5IGVsZW1lbnQgKi9cbiAgICAgICAgICAgICAgICAgICAgdmFyIHhEZWx0YSA9IHBhcnNlSW50KF90aGlzLmdldFN0eWxlKGRvY3VtZW50LmJvZHksICdtYXJnaW5MZWZ0JyksIDEwKSArIHBhcnNlSW50KF90aGlzLmdldFN0eWxlKGRvY3VtZW50LmJvZHksICdtYXJnaW5SaWdodCcpLCAxMCk7XG4gICAgICAgICAgICAgICAgICAgIHZhciB5RGVsdGEgPSBwYXJzZUludChfdGhpcy5nZXRTdHlsZShkb2N1bWVudC5ib2R5LCAnbWFyZ2luVG9wJyksIDEwKSArIHBhcnNlSW50KF90aGlzLmdldFN0eWxlKGRvY3VtZW50LmJvZHksICdtYXJnaW5Cb3R0b20nKSwgMTApO1xuICAgICAgICAgICAgICAgICAgICBfdGhpcy5pbm5lci5zdHlsZS5taW5XaWR0aCA9IChkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsV2lkdGggLSB4RGVsdGEpICsgJ3B4JztcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMuaW5uZXIuc3R5bGUubWluSGVpZ2h0ID0gKGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zY3JvbGxIZWlnaHQgLSB5RGVsdGEgLSAxMDApICsgJ3B4JzsgLy9UT0RPOiBXVEY/IHdoeSAtMTAwIGZvciBJRTg/XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBUcmlnZ2VyIHRoZSBmdW5jdGlvbiBvbmx5IHdoZW4gdGhlIGNsaWVudFdpZHRoIG9yIGNsaWVudEhlaWdodCByZWFsbHkgaGF2ZSBjaGFuZ2VkLlxuICAgICAgICAgICAgICAgICAqIElFOCByZXNpZGVzIGluIGFuIGluZmluaXR5IGxvb3AgYWx3YXlzIHRyaWdnZXJpbmcgdGhlIHJlc2l0ZSBldmVudCB3aGVuIGFsdGVyaW5nIGNzcy5cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5vbGRDbGllbnRXaWR0aCAhPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50V2lkdGggfHwgdGhpcy5vbGRDbGllbnRIZWlnaHQgIT0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudEhlaWdodCkge1xuICAgICAgICAgICAgICAgICAgICB3aW5kb3cuY2xlYXJUaW1lb3V0KHRoaXMucmVzaXplVGltZW91dCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVzaXplVGltZW91dCA9IHdpbmRvdy5zZXRUaW1lb3V0KG9uUmVzaXplLCAxMCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8qIHdyaXRlIGRvd24gdGhlIG9sZCBjbGllbnRXaWR0aCBhbmQgY2xpZW50SGVpZ2h0IGZvciB0aGUgYWJvdmUgY29tcGFyc2lvbiAqL1xuICAgICAgICAgICAgICAgIHRoaXMub2xkQ2xpZW50V2lkdGggPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50V2lkdGg7XG4gICAgICAgICAgICAgICAgdGhpcy5vbGRDbGllbnRIZWlnaHQgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50SGVpZ2h0O1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIC8qIGJyb3dzZXIgaW5kZXBlbmRlbnQgZXZlbnQgcmVnaXN0cmF0aW9uICovXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEJyb3dzZXIgaW5kZXBlbmRlbnQgZXZlbnQgcmVnaXN0cmF0aW9uXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gb2JqIC0gVGhlIEhUTUxFbGVtZW50IHRvIGF0dGFjaCB0aGUgZXZlbnQgdG9cbiAgICAgICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBldmVudCAtIFRoZSBldmVudCBuYW1lIHdpdGhvdXQgdGhlIGxlYWRpbmcgXCJvblwiXG4gICAgICAgICAgICAgKiBAcGFyYW0geyhlOiBFdmVudCkgPT4gdm9pZH0gY2FsbGJhY2sgLSBBIGNhbGxiYWNrIGZ1bmN0aW9uIHRvIGF0dGFjaCB0byB0aGUgZXZlbnRcbiAgICAgICAgICAgICAqIEByZXR1cm4ge3ZvaWR9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIFN3b29zaC5wcm90b3R5cGUuYWRkRXZlbnRMaXN0ZW5lciA9IGZ1bmN0aW9uIChvYmosIGV2ZW50LCBjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2Ygb2JqLmFkZEV2ZW50TGlzdGVuZXIgPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICBvYmouYWRkRXZlbnRMaXN0ZW5lcihldmVudCwgY2FsbGJhY2spO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmICh0eXBlb2Ygb2JqLmF0dGFjaEV2ZW50ID09ICdvYmplY3QnICYmIGh0bWxFdmVudHNbJ29uJyArIGV2ZW50XSkge1xuICAgICAgICAgICAgICAgICAgICBvYmouYXR0YWNoRXZlbnQoJ29uJyArIGV2ZW50LCBjYWxsYmFjayk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHR5cGVvZiBvYmouYXR0YWNoRXZlbnQgPT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50W2V2ZW50XSA9IDE7XG4gICAgICAgICAgICAgICAgICAgIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5hdHRhY2hFdmVudCgnb25wcm9wZXJ0eWNoYW5nZScsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZS5wcm9wZXJ0eU5hbWUgPT0gZXZlbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBUT0RPOiBlIGlzIHRoZSBvbnByb3BlcnR5Y2hhbmdlIGV2ZW50IG5vdCBvbmUgb2YgdGhlIGN1c3RvbSBldmVudCBvYmplY3RzICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogVE9ETzogb25seSBldmVyeSBTd29vc2ggZWxlbWVudCByYWlzZXMgdGhlIHNhbWUgY29sbGlkZUxlZnQgZXZlbnQgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBvYmpbJ29uJyArIGV2ZW50XSA9IGNhbGxiYWNrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEJyb3dzZXIgaW5kZXBlbmRlbnQgZXZlbnQgZGVyZWdpc3RyYXRpb25cbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBvYmogLSBUaGUgSFRNTEVsZW1lbnQgd2hvc2UgZXZlbnQgc2hvdWxkIGJlIGRldGFjaGVkXG4gICAgICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnQgLSBUaGUgZXZlbnQgbmFtZSB3aXRob3V0IHRoZSBsZWFkaW5nIFwib25cIlxuICAgICAgICAgICAgICogQHBhcmFtIHsoZTogRXZlbnQpID0+IHZvaWR9IGNhbGxiYWNrIC0gVGhlIGNhbGxiYWNrIGZ1bmN0aW9uIHdoZW4gYXR0YWNoZWRcbiAgICAgICAgICAgICAqIEByZXR1cm4ge3ZvaWR9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIFN3b29zaC5wcm90b3R5cGUucmVtb3ZlRXZlbnRMaXN0ZW5lciA9IGZ1bmN0aW9uIChvYmosIGV2ZW50LCBjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2Ygb2JqLnJlbW92ZUV2ZW50TGlzdGVuZXIgPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICBvYmoucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudCwgY2FsbGJhY2spO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmICh0eXBlb2Ygb2JqLmRldGFjaEV2ZW50ID09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAgICAgICAgIG9iai5kZXRhY2hFdmVudCgnb24nICsgZXZlbnQsIGNhbGxiYWNrKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIG9ialsnb24nICsgZXZlbnRdID0gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBCcm93c2VyIGluZGVwZW5kZW50IGV2ZW50IHRyaWdnZXIgZnVuY3Rpb25cbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBvYmogLSBUaGUgSFRNTEVsZW1lbnQgd2hpY2ggdHJpZ2dlcnMgdGhlIGV2ZW50XG4gICAgICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnROYW1lIC0gVGhlIGV2ZW50IG5hbWUgd2l0aG91dCB0aGUgbGVhZGluZyBcIm9uXCJcbiAgICAgICAgICAgICAqIEByZXR1cm4ge3ZvaWR9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIFN3b29zaC5wcm90b3R5cGUudHJpZ2dlckV2ZW50ID0gZnVuY3Rpb24gKG9iaiwgZXZlbnROYW1lKSB7XG4gICAgICAgICAgICAgICAgdmFyIGV2ZW50O1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2Ygd2luZG93LkN1c3RvbUV2ZW50ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50ID0gbmV3IEN1c3RvbUV2ZW50KGV2ZW50TmFtZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHR5cGVvZiBkb2N1bWVudC5jcmVhdGVFdmVudCA9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50ID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoXCJIVE1MRXZlbnRzXCIpO1xuICAgICAgICAgICAgICAgICAgICBldmVudC5pbml0RXZlbnQoZXZlbnROYW1lLCB0cnVlLCB0cnVlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoZG9jdW1lbnQuY3JlYXRlRXZlbnRPYmplY3QpIHtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudE9iamVjdCgpO1xuICAgICAgICAgICAgICAgICAgICBldmVudC5ldmVudFR5cGUgPSBldmVudE5hbWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGV2ZW50LmV2ZW50TmFtZSA9IGV2ZW50TmFtZTtcbiAgICAgICAgICAgICAgICBpZiAob2JqLmRpc3BhdGNoRXZlbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgb2JqLmRpc3BhdGNoRXZlbnQoZXZlbnQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChkb2N1bWVudC5kb2N1bWVudEVsZW1lbnRbZXZlbnROYW1lXSkge1xuICAgICAgICAgICAgICAgICAgICBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnRbZXZlbnROYW1lXSsrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChvYmouZmlyZUV2ZW50ICYmIGh0bWxFdmVudHNbJ29uJyArIGV2ZW50TmFtZV0pIHtcbiAgICAgICAgICAgICAgICAgICAgb2JqLmZpcmVFdmVudCgnb24nICsgZXZlbnQuZXZlbnRUeXBlLCBldmVudCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKG9ialtldmVudE5hbWVdKSB7XG4gICAgICAgICAgICAgICAgICAgIG9ialtldmVudE5hbWVdKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKG9ialsnb24nICsgZXZlbnROYW1lXSkge1xuICAgICAgICAgICAgICAgICAgICBvYmpbJ29uJyArIGV2ZW50TmFtZV0oKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBHZXQgYSBjc3Mgc3R5bGUgdmFsdWUgYnJvd3NlciBpbmRlcGVuZGVudFxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsIC0gVGhlIEhUTUxFbGVtZW50IHRvIGxvb2t1cFxuICAgICAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGpzUHJvcGVydHkgLSBUaGUgY3NzIHByb3BlcnR5IG5hbWUgaW4gamF2YXNjcmlwdCBpbiBjYW1lbENhc2UgKGUuZy4gXCJtYXJnaW5MZWZ0XCIsIG5vdCBcIm1hcmdpbi1sZWZ0XCIpXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHtzdHJpbmd9IC0gdGhlIHByb3BlcnR5IHZhbHVlXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIFN3b29zaC5wcm90b3R5cGUuZ2V0U3R5bGUgPSBmdW5jdGlvbiAoZWwsIGpzUHJvcGVydHkpIHtcbiAgICAgICAgICAgICAgICB2YXIgY3NzUHJvcGVydHkgPSBqc1Byb3BlcnR5LnJlcGxhY2UoLyhbQS1aXSkvZywgXCItJDFcIikudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlID09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKGVsKS5nZXRQcm9wZXJ0eVZhbHVlKGNzc1Byb3BlcnR5KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBlbC5jdXJyZW50U3R5bGVbanNQcm9wZXJ0eV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogTW91c2UgZG93biBoYW5kbGVyXG4gICAgICAgICAgICAgKiBSZWdpc3RlcnMgdGhlIG1vdXNlbW92ZSBhbmQgbW91c2V1cCBoYW5kbGVycyBhbmQgZmluZHMgdGhlIG5leHQgaW5uZXIgZWxlbWVudFxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBwYXJhbSB7TW91c2VFdmVudH0gZSAtIFRoZSBtb3VzZSBkb3duIGV2ZW50IG9iamVjdFxuICAgICAgICAgICAgICogQHJldHVybiB7dm9pZH1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgU3dvb3NoLnByb3RvdHlwZS5tb3VzZURvd24gPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgICAgICAgICAgdmFyIGVsZW1lbnRCZWhpbmRDdXJzb3IgPSBkb2N1bWVudC5lbGVtZW50RnJvbVBvaW50KGUuY2xpZW50WCwgZS5jbGllbnRZKTtcbiAgICAgICAgICAgICAgICAvKiBmaW5kIHRoZSBuZXh0IHBhcmVudCB3aGljaCBpcyBhbiBpbm5lciBlbGVtZW50ICovXG4gICAgICAgICAgICAgICAgdmFyIHJlID0gbmV3IFJlZ0V4cChcIiBcIiArIHRoaXMuY2xhc3NJbm5lcik7XG4gICAgICAgICAgICAgICAgd2hpbGUgKGVsZW1lbnRCZWhpbmRDdXJzb3IgJiYgIWVsZW1lbnRCZWhpbmRDdXJzb3IuY2xhc3NOYW1lLm1hdGNoKHJlKSkge1xuICAgICAgICAgICAgICAgICAgICBlbGVtZW50QmVoaW5kQ3Vyc29yID0gZWxlbWVudEJlaGluZEN1cnNvci5wYXJlbnRFbGVtZW50O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5pbm5lciA9PSBlbGVtZW50QmVoaW5kQ3Vyc29yKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaW5uZXIuY2xhc3NOYW1lICs9ICcgJyArIHRoaXMuY2xhc3NHcmFiYmluZztcbiAgICAgICAgICAgICAgICAgICAgLyogbm90ZSB0aGUgb3JpZ2luIHBvc2l0aW9ucyAqL1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmRyYWdPcmlnaW5MZWZ0ID0gZS5jbGllbnRYO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmRyYWdPcmlnaW5Ub3AgPSBlLmNsaWVudFk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZHJhZ09yaWdpblNjcm9sbExlZnQgPSB0aGlzLnNjcm9sbEVsZW1lbnQuc2Nyb2xsTGVmdDtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kcmFnT3JpZ2luU2Nyb2xsVG9wID0gdGhpcy5zY3JvbGxFbGVtZW50LnNjcm9sbFRvcDtcbiAgICAgICAgICAgICAgICAgICAgLyogaXQgbG9va3Mgc3RyYW5lIGlmIHNjcm9sbC1iZWhhdmlvciBpcyBzZXQgdG8gc21vb3RoICovXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucGFyZW50T3JpZ2luU3R5bGUgPSB0aGlzLmlubmVyLnBhcmVudEVsZW1lbnQuc3R5bGUuY3NzVGV4dDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB0aGlzLmlubmVyLnBhcmVudEVsZW1lbnQuc3R5bGUuc2V0UHJvcGVydHkgPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5pbm5lci5wYXJlbnRFbGVtZW50LnN0eWxlLnNldFByb3BlcnR5KCdzY3JvbGwtYmVoYXZpb3InLCAnYXV0bycpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubW91c2VNb3ZlSGFuZGxlciA9IHRoaXMubW91c2VNb3ZlLmJpbmQodGhpcyk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcihkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQsICdtb3VzZW1vdmUnLCB0aGlzLm1vdXNlTW92ZUhhbmRsZXIpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm1vdXNlVXBIYW5kbGVyID0gZnVuY3Rpb24gKGUpIHsgcmV0dXJuIF90aGlzLm1vdXNlVXAoZSk7IH07XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcihkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQsICdtb3VzZXVwJywgdGhpcy5tb3VzZVVwSGFuZGxlcik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogTW91c2UgdXAgaGFuZGxlclxuICAgICAgICAgICAgICogRGVyZWdpc3RlcnMgdGhlIG1vdXNlbW92ZSBhbmQgbW91c2V1cCBoYW5kbGVycyBhbmQgYWxpZ25zIHRoZSBlbGVtZW50IHRvIGEgZ3JpZFxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBwYXJhbSB7TW91c2VFdmVudH0gZSAtIFRoZSBtb3VzZSB1cCBldmVudCBvYmplY3RcbiAgICAgICAgICAgICAqIEByZXR1cm4ge3ZvaWR9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIFN3b29zaC5wcm90b3R5cGUubW91c2VVcCA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgLy9zdGljayB0aGUgZWxlbWVudCB0byB0aGUgZ3JpZCwgaWYgZ3JpZCBlcXVhbHMgMSB0aGUgdmFsdWUgZG9lcyBub3QgY2hhbmdlXG4gICAgICAgICAgICAgICAgdmFyIHggPSBNYXRoLnJvdW5kKCh0aGlzLmRyYWdPcmlnaW5MZWZ0ICsgdGhpcy5kcmFnT3JpZ2luU2Nyb2xsTGVmdCAtIGUuY2xpZW50WCkgLyB0aGlzLm9wdGlvbnMuZ3JpZCkgKiB0aGlzLm9wdGlvbnMuZ3JpZDtcbiAgICAgICAgICAgICAgICB2YXIgeSA9IE1hdGgucm91bmQoKHRoaXMuZHJhZ09yaWdpblRvcCArIHRoaXMuZHJhZ09yaWdpblNjcm9sbFRvcCAtIGUuY2xpZW50WSkgLyB0aGlzLm9wdGlvbnMuZ3JpZCkgKiB0aGlzLm9wdGlvbnMuZ3JpZDtcbiAgICAgICAgICAgICAgICB2YXIgc2Nyb2xsTWF4TGVmdCA9ICh0aGlzLnNjcm9sbEVsZW1lbnQuc2Nyb2xsV2lkdGggLSB0aGlzLnNjcm9sbEVsZW1lbnQuY2xpZW50V2lkdGgpIC0gdGhpcy5vcHRpb25zLmVsYXN0aWNFZ2Rlcy5sZWZ0O1xuICAgICAgICAgICAgICAgIHZhciBzY3JvbGxNYXhUb3AgPSAodGhpcy5zY3JvbGxFbGVtZW50LnNjcm9sbEhlaWdodCAtIHRoaXMuc2Nyb2xsRWxlbWVudC5jbGllbnRIZWlnaHQpIC0gdGhpcy5vcHRpb25zLmVsYXN0aWNFZ2Rlcy50b3A7XG4gICAgICAgICAgICAgICAgeCA9ICh4ID4gc2Nyb2xsTWF4TGVmdCkgPyBzY3JvbGxNYXhMZWZ0IDogKHggPCB0aGlzLm9wdGlvbnMuZWxhc3RpY0VnZGVzLmxlZnQpID8gdGhpcy5vcHRpb25zLmVsYXN0aWNFZ2Rlcy5sZWZ0IDogeDtcbiAgICAgICAgICAgICAgICB5ID0gKHkgPiBzY3JvbGxNYXhUb3ApID8gc2Nyb2xsTWF4VG9wIDogKHkgPCB0aGlzLm9wdGlvbnMuZWxhc3RpY0VnZGVzLnRvcCkgPyB0aGlzLm9wdGlvbnMuZWxhc3RpY0VnZGVzLnRvcCA6IHk7XG4gICAgICAgICAgICAgICAgdmFyIHJlID0gbmV3IFJlZ0V4cChcIiBcIiArIHRoaXMuY2xhc3NHcmFiYmluZyk7XG4gICAgICAgICAgICAgICAgdGhpcy5pbm5lci5jbGFzc05hbWUgPSB0aGlzLmlubmVyLmNsYXNzTmFtZS5yZXBsYWNlKHJlLCAnJyk7XG4gICAgICAgICAgICAgICAgdGhpcy5pbm5lci5wYXJlbnRFbGVtZW50LnN0eWxlLmNzc1RleHQgPSB0aGlzLnBhcmVudE9yaWdpblN0eWxlO1xuICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsVG8oeCwgeSk7XG4gICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCwgJ21vdXNlbW92ZScsIHRoaXMubW91c2VNb3ZlSGFuZGxlcik7XG4gICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCwgJ21vdXNldXAnLCB0aGlzLm1vdXNlVXBIYW5kbGVyKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIE1vdXNlIG1vdmUgaGFuZGxlclxuICAgICAgICAgICAgICogQ2FsY3VjYXRlcyB0aGUgeCBhbmQgeSBkZWx0YXMgYW5kIHNjcm9sbHNcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAcGFyYW0ge01vdXNlRXZlbnR9IGUgLSBUaGUgbW91c2UgbW92ZSBldmVudCBvYmplY3RcbiAgICAgICAgICAgICAqIEByZXR1cm4ge3ZvaWR9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIFN3b29zaC5wcm90b3R5cGUubW91c2VNb3ZlID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgICB2YXIgeCA9IHRoaXMuZHJhZ09yaWdpbkxlZnQgKyB0aGlzLmRyYWdPcmlnaW5TY3JvbGxMZWZ0IC0gZS5jbGllbnRYO1xuICAgICAgICAgICAgICAgIHZhciB5ID0gdGhpcy5kcmFnT3JpZ2luVG9wICsgdGhpcy5kcmFnT3JpZ2luU2Nyb2xsVG9wIC0gZS5jbGllbnRZO1xuICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsVG8oeCwgeSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBzY3JvbGwgaGVscGVyIG1ldGhvZFxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSB4IC0geC1jb29yZGluYXRlIHRvIHNjcm9sbCB0b1xuICAgICAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IHkgLSB5LWNvb3JkaW5hdGUgdG8gc2Nyb2xsIHRvXG4gICAgICAgICAgICAgKiBAdGhyb3dzIEV2ZW50IGNvbGxpZGVMZWZ0XG4gICAgICAgICAgICAgKiBAdGhyb3dzIEV2ZW50IGNvbGxpZGVSaWdodFxuICAgICAgICAgICAgICogQHRocm93cyBFdmVudCBjb2xsaWRlVG9wXG4gICAgICAgICAgICAgKiBAdGhyb3dzIEV2ZW50IGNvbGxpZGVCb3R0b21cbiAgICAgICAgICAgICAqIEByZXR1cm4ge3ZvaWR9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIFN3b29zaC5wcm90b3R5cGUuc2Nyb2xsVG8gPSBmdW5jdGlvbiAoeCwgeSkge1xuICAgICAgICAgICAgICAgIHZhciBzY3JvbGxNYXhMZWZ0ID0gKHRoaXMuc2Nyb2xsRWxlbWVudC5zY3JvbGxXaWR0aCAtIHRoaXMuc2Nyb2xsRWxlbWVudC5jbGllbnRXaWR0aCk7XG4gICAgICAgICAgICAgICAgdmFyIHNjcm9sbE1heFRvcCA9ICh0aGlzLnNjcm9sbEVsZW1lbnQuc2Nyb2xsSGVpZ2h0IC0gdGhpcy5zY3JvbGxFbGVtZW50LmNsaWVudEhlaWdodCk7XG4gICAgICAgICAgICAgICAgLyogbm8gbmVnYXRpdmUgdmFsdWVzIG9yIGdyZWF0ZXIgdGhhbiB0aGUgbWF4aW11bSAqL1xuICAgICAgICAgICAgICAgIHZhciB4ID0gKHggPiBzY3JvbGxNYXhMZWZ0KSA/IHNjcm9sbE1heExlZnQgOiAoeCA8IDApID8gMCA6IHg7XG4gICAgICAgICAgICAgICAgdmFyIHkgPSAoeSA+IHNjcm9sbE1heFRvcCkgPyBzY3JvbGxNYXhUb3AgOiAoeSA8IDApID8gMCA6IHk7XG4gICAgICAgICAgICAgICAgLyogcmVtZW1iZXIgdGhlIG9sZCB2YWx1ZXMgKi9cbiAgICAgICAgICAgICAgICB0aGlzLm9yaWdpblNjcm9sbExlZnQgPSB0aGlzLnNjcm9sbEVsZW1lbnQuc2Nyb2xsTGVmdDtcbiAgICAgICAgICAgICAgICB0aGlzLm9yaWdpblNjcm9sbFRvcCA9IHRoaXMuc2Nyb2xsRWxlbWVudC5zY3JvbGxUb3A7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB0aGlzLnNjcm9sbEVsZW1lbnQuc2Nyb2xsVG8gPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNjcm9sbEVsZW1lbnQuc2Nyb2xsVG8oeCwgeSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvL0lFOCBoYXMgbm8gc2Nyb2xsVG8gbWV0aG9kXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsRWxlbWVudC5zY3JvbGxUb3AgPSB5O1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNjcm9sbEVsZW1lbnQuc2Nyb2xsTGVmdCA9IHg7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8qIHRoZSBjb2xsaWRlTGVmdCBldmVudCAqL1xuICAgICAgICAgICAgICAgIGlmICh4ID09IDAgJiYgdGhpcy5vcmlnaW5TY3JvbGxMZWZ0ICE9IHgpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50cmlnZ2VyRXZlbnQodGhpcy5pbm5lciwgJ2NvbGxpZGVMZWZ0Jyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8qIHRoZSBjb2xsaWRlVG9wIGV2ZW50ICovXG4gICAgICAgICAgICAgICAgaWYgKHkgPT0gMCAmJiB0aGlzLm9yaWdpblNjcm9sbFRvcCAhPSB5KSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudHJpZ2dlckV2ZW50KHRoaXMuaW5uZXIsICdjb2xsaWRlVG9wJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8qIHRoZSBjb2xsaWRlUmlnaHQgZXZlbnQgKi9cbiAgICAgICAgICAgICAgICBpZiAoeCA9PSBzY3JvbGxNYXhMZWZ0ICYmIHRoaXMub3JpZ2luU2Nyb2xsTGVmdCAhPSB4KSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudHJpZ2dlckV2ZW50KHRoaXMuaW5uZXIsICdjb2xsaWRlUmlnaHQnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLyogdGhlIGNvbGxpZGVCb3R0b20gZXZlbnQgKi9cbiAgICAgICAgICAgICAgICBpZiAoeSA9PSBzY3JvbGxNYXhUb3AgJiYgdGhpcy5vcmlnaW5TY3JvbGxUb3AgIT0geSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnRyaWdnZXJFdmVudCh0aGlzLmlubmVyLCAnY29sbGlkZUJvdHRvbScpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFJlZ2lzdGVyIGN1c3RvbSBldmVudCBjYWxsYmFja3NcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnQgLSBUaGUgZXZlbnQgbmFtZVxuICAgICAgICAgICAgICogQHBhcmFtIHsoZTogRXZlbnQpID0+IGFueX0gY2FsbGJhY2sgLSBBIGNhbGxiYWNrIGZ1bmN0aW9uIHRvIGV4ZWN1dGUgd2hlbiB0aGUgZXZlbnQgcmFpc2VzXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHtTd29vc2h9IC0gVGhlIFN3b29zaCBvYmplY3QgaW5zdGFuY2VcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgU3dvb3NoLnByb3RvdHlwZS5vbiA9IGZ1bmN0aW9uIChldmVudCwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIodGhpcy5pbm5lciwgZXZlbnQsIGNhbGxiYWNrLmJpbmQodGhpcykpO1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIFN3b29zaC5wcm90b3R5cGUuYWx3YXlzID0gZnVuY3Rpb24gKCkgeyBjb25zb2xlLmxvZygnYWx3YXlzKCknKTsgcmV0dXJuIHRydWU7IH07XG4gICAgICAgICAgICByZXR1cm4gU3dvb3NoO1xuICAgICAgICB9KCkpO1xuICAgICAgICAvKiByZXR1cm4gYW4gaW5zdGFuY2Ugb2YgdGhlIGNsYXNzICovXG4gICAgICAgIHJldHVybiBuZXcgU3dvb3NoKGNvbnRhaW5lciwgb3B0aW9ucyk7XG4gICAgfVxuICAgIGV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG4gICAgZXhwb3J0c1tcImRlZmF1bHRcIl0gPSBkZWZhdWx0XzE7XG59KTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXN3b29zaC5qcy5tYXAiXX0=
