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
    function default_1(container, options) {
        var Swoosh = (function () {
            function Swoosh(container, options) {
                var _this = this;
                this.container = container;
                this.options = options;
                this.container = container;
                /* set default options */
                this.options = {
                    grid: 1,
                    elasticEgdes: {
                        left: 50,
                        right: 50,
                        top: 50,
                        bottom: 50,
                    },
                    callback: this.always
                };
                Object.assign(this.options, options); //merge options object
                console.log(this.options);
                this.container.className += " outer";
                /* create inner div element and append it to the container with its contents in it */
                this.inner = document.createElement("div");
                this.inner.className += " inner";
                /* move all childNodes to the new inner element */
                while (this.container.childNodes.length > 0) {
                    this.inner.appendChild(this.container.childNodes[0]);
                }
                this.container.appendChild(this.inner);
                this.inner.style.minWidth = this.container.scrollWidth + 'px';
                this.inner.style.minHeight = this.container.scrollHeight + 'px';
                this.inner.style.paddingLeft = this.options.elasticEgdes.left + 'px';
                this.inner.style.paddingRight = this.options.elasticEgdes.right + 'px';
                this.inner.style.paddingTop = this.options.elasticEgdes.top + 'px';
                this.inner.style.paddingBottom = this.options.elasticEgdes.bottom + 'px';
                this.scrollElement = this.inner.parentElement.tagName == "BODY" ? document.documentElement : this.inner.parentElement;
                console.log(this.options.elasticEgdes.left);
                this.scrollTo(this.options.elasticEgdes.left, this.options.elasticEgdes.top);
                /*this.container.addEventListener('wheel', function(e){
                  console.log('scroll: ', e);
                  if (e.preventDefault)
                      e.preventDefault();
                  e.returnValue = false;
                });*/
                this.mouseDownHandler = function (e) { return _this.mouseDown(e); };
                this.inner.addEventListener('mousedown', this.mouseDownHandler);
            }
            Swoosh.prototype.mouseDown = function (e) {
                var _this = this;
                var elementBehindCursor = document.elementFromPoint(e.clientX, e.clientY);
                /* find the next parent which is an inner element */
                while (elementBehindCursor && !elementBehindCursor.classList.contains('inner')) {
                    elementBehindCursor = elementBehindCursor.parentElement;
                }
                if (this.inner == elementBehindCursor) {
                    this.inner.className += ' grabbing';
                    /* note the origin positions */
                    this.dragOriginLeft = e.clientX;
                    this.dragOriginTop = e.clientY;
                    this.dragOriginScrollLeft = this.scrollElement.scrollLeft;
                    this.dragOriginScrollTop = this.scrollElement.scrollTop;
                    /* it looks strane if scroll-behavior is set to smooth */
                    this.parentOriginStyle = this.inner.parentElement.style.cssText;
                    this.inner.parentElement.style.setProperty('scroll-behavior', 'auto');
                    this.mouseMoveHandler = this.mouseMove.bind(this);
                    document.addEventListener('mousemove', this.mouseMoveHandler);
                    this.mouseUpHandler = function (e) { return _this.mouseUp(e); };
                    document.addEventListener('mouseup', this.mouseUpHandler);
                }
            };
            Swoosh.prototype.mouseUp = function (e) {
                //stick the element to the grid
                var x = Math.round((this.dragOriginLeft + this.dragOriginScrollLeft - e.clientX) / this.options.grid) * this.options.grid;
                var y = Math.round((this.dragOriginTop + this.dragOriginScrollTop - e.clientY) / this.options.grid) * this.options.grid;
                var scrollMaxLeft = (this.scrollElement.scrollWidth - this.scrollElement.clientWidth) - this.options.elasticEgdes.left;
                var scrollMaxTop = (this.scrollElement.scrollHeight - this.scrollElement.clientHeight) - this.options.elasticEgdes.top;
                x = (x > scrollMaxLeft) ? scrollMaxLeft : (x < this.options.elasticEgdes.left) ? this.options.elasticEgdes.left : x;
                y = (y > scrollMaxTop) ? scrollMaxTop : (y < this.options.elasticEgdes.top) ? this.options.elasticEgdes.top : y;
                this.inner.className = this.inner.className.replace(/\b grabbing\b/, '');
                this.inner.parentElement.style.cssText = this.parentOriginStyle;
                this.scrollTo(x, y);
                document.removeEventListener('mousemove', this.mouseMoveHandler);
                document.removeEventListener('mouseup', this.mouseUpHandler);
            };
            Swoosh.prototype.mouseMove = function (e) {
                e.preventDefault();
                var x = this.dragOriginLeft + this.dragOriginScrollLeft - e.clientX;
                var y = this.dragOriginTop + this.dragOriginScrollTop - e.clientY;
                this.scrollTo(x, y);
            };
            /* scroll helper method */
            Swoosh.prototype.scrollTo = function (x, y) {
                var scrollMaxLeft = (this.scrollElement.scrollWidth - this.scrollElement.clientWidth);
                var scrollMaxTop = (this.scrollElement.scrollHeight - this.scrollElement.clientHeight);
                /* no negative values or greater than the maximum */
                var x = (x > scrollMaxLeft) ? scrollMaxLeft : (x < 0) ? 0 : x;
                var y = (y > scrollMaxTop) ? scrollMaxTop : (y < 0) ? 0 : y;
                /* remember the old values */
                this.originScrollLeft = this.scrollElement.scrollLeft;
                this.originScrollTop = this.scrollElement.scrollTop;
                this.scrollElement.scrollTo(x, y);
                /* the collideLeft event */
                if (x == 0 && this.originScrollLeft != x) {
                    var event = document.createEvent("HTMLEvents");
                    event.initEvent("collideLeft", true, true);
                    this.inner.dispatchEvent(event);
                }
                /* the collideTop event */
                if (y == 0 && this.originScrollTop != y) {
                    var event = document.createEvent("HTMLEvents");
                    event.initEvent("collideTop", true, true);
                    this.inner.dispatchEvent(event);
                }
                /* the collideRight event */
                if (x == scrollMaxLeft && this.originScrollLeft != x) {
                    var event = document.createEvent("HTMLEvents");
                    event.initEvent("collideRight", true, true);
                    this.inner.dispatchEvent(event);
                }
                /* the collideBottom event */
                if (y == scrollMaxTop && this.originScrollTop != y) {
                    var event = document.createEvent("HTMLEvents");
                    event.initEvent("collideBottom", true, true);
                    this.inner.dispatchEvent(event);
                }
            };
            /* method to register custom event callbacks */
            Swoosh.prototype.on = function (event, callback) {
                console.log('on() event callback register', event);
                this.inner.addEventListener(event, callback.bind(this));
                return this;
            };
            Swoosh.prototype.always = function () { console.log('always()'); return true; };
            return Swoosh;
        }());
        /* return an instance of the object */
        return new Swoosh(container, options);
    }
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = default_1;
});

},{}]},{},[1])(1)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzd29vc2guanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLypcbm5hbWVzOlxuaW5maW5pdGVcbmluaWZpbml0eSByb29tIC8gc3BhY2UgLyBtaXJyb3JcbjEtc3BoZXJlXG50YXJkaXNcbnRlc3NlcmFjdFxuNHRoIGRpbWVuc2lvblxuRGltZW5zaW9uYWxseSB0cmFuc2luZGVudGFsXG5cbnBpYzpcbmh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0luZmluaXR5X21pcnJvclxuXG4qL1xuKGZ1bmN0aW9uIChmYWN0b3J5KSB7XG4gICAgaWYgKHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUuZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgdmFyIHYgPSBmYWN0b3J5KHJlcXVpcmUsIGV4cG9ydHMpOyBpZiAodiAhPT0gdW5kZWZpbmVkKSBtb2R1bGUuZXhwb3J0cyA9IHY7XG4gICAgfVxuICAgIGVsc2UgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgICAgICBkZWZpbmUoW1wicmVxdWlyZVwiLCBcImV4cG9ydHNcIl0sIGZhY3RvcnkpO1xuICAgIH1cbn0pKGZ1bmN0aW9uIChyZXF1aXJlLCBleHBvcnRzKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG4gICAgZnVuY3Rpb24gZGVmYXVsdF8xKGNvbnRhaW5lciwgb3B0aW9ucykge1xuICAgICAgICB2YXIgU3dvb3NoID0gKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGZ1bmN0aW9uIFN3b29zaChjb250YWluZXIsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICAgICAgICAgIHRoaXMuY29udGFpbmVyID0gY29udGFpbmVyO1xuICAgICAgICAgICAgICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG4gICAgICAgICAgICAgICAgdGhpcy5jb250YWluZXIgPSBjb250YWluZXI7XG4gICAgICAgICAgICAgICAgLyogc2V0IGRlZmF1bHQgb3B0aW9ucyAqL1xuICAgICAgICAgICAgICAgIHRoaXMub3B0aW9ucyA9IHtcbiAgICAgICAgICAgICAgICAgICAgZ3JpZDogMSxcbiAgICAgICAgICAgICAgICAgICAgZWxhc3RpY0VnZGVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZWZ0OiA1MCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHJpZ2h0OiA1MCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvcDogNTAsXG4gICAgICAgICAgICAgICAgICAgICAgICBib3R0b206IDUwLFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjazogdGhpcy5hbHdheXNcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIE9iamVjdC5hc3NpZ24odGhpcy5vcHRpb25zLCBvcHRpb25zKTsgLy9tZXJnZSBvcHRpb25zIG9iamVjdFxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHRoaXMub3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgdGhpcy5jb250YWluZXIuY2xhc3NOYW1lICs9IFwiIG91dGVyXCI7XG4gICAgICAgICAgICAgICAgLyogY3JlYXRlIGlubmVyIGRpdiBlbGVtZW50IGFuZCBhcHBlbmQgaXQgdG8gdGhlIGNvbnRhaW5lciB3aXRoIGl0cyBjb250ZW50cyBpbiBpdCAqL1xuICAgICAgICAgICAgICAgIHRoaXMuaW5uZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgICAgICAgICAgIHRoaXMuaW5uZXIuY2xhc3NOYW1lICs9IFwiIGlubmVyXCI7XG4gICAgICAgICAgICAgICAgLyogbW92ZSBhbGwgY2hpbGROb2RlcyB0byB0aGUgbmV3IGlubmVyIGVsZW1lbnQgKi9cbiAgICAgICAgICAgICAgICB3aGlsZSAodGhpcy5jb250YWluZXIuY2hpbGROb2Rlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaW5uZXIuYXBwZW5kQ2hpbGQodGhpcy5jb250YWluZXIuY2hpbGROb2Rlc1swXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuY29udGFpbmVyLmFwcGVuZENoaWxkKHRoaXMuaW5uZXIpO1xuICAgICAgICAgICAgICAgIHRoaXMuaW5uZXIuc3R5bGUubWluV2lkdGggPSB0aGlzLmNvbnRhaW5lci5zY3JvbGxXaWR0aCArICdweCc7XG4gICAgICAgICAgICAgICAgdGhpcy5pbm5lci5zdHlsZS5taW5IZWlnaHQgPSB0aGlzLmNvbnRhaW5lci5zY3JvbGxIZWlnaHQgKyAncHgnO1xuICAgICAgICAgICAgICAgIHRoaXMuaW5uZXIuc3R5bGUucGFkZGluZ0xlZnQgPSB0aGlzLm9wdGlvbnMuZWxhc3RpY0VnZGVzLmxlZnQgKyAncHgnO1xuICAgICAgICAgICAgICAgIHRoaXMuaW5uZXIuc3R5bGUucGFkZGluZ1JpZ2h0ID0gdGhpcy5vcHRpb25zLmVsYXN0aWNFZ2Rlcy5yaWdodCArICdweCc7XG4gICAgICAgICAgICAgICAgdGhpcy5pbm5lci5zdHlsZS5wYWRkaW5nVG9wID0gdGhpcy5vcHRpb25zLmVsYXN0aWNFZ2Rlcy50b3AgKyAncHgnO1xuICAgICAgICAgICAgICAgIHRoaXMuaW5uZXIuc3R5bGUucGFkZGluZ0JvdHRvbSA9IHRoaXMub3B0aW9ucy5lbGFzdGljRWdkZXMuYm90dG9tICsgJ3B4JztcbiAgICAgICAgICAgICAgICB0aGlzLnNjcm9sbEVsZW1lbnQgPSB0aGlzLmlubmVyLnBhcmVudEVsZW1lbnQudGFnTmFtZSA9PSBcIkJPRFlcIiA/IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCA6IHRoaXMuaW5uZXIucGFyZW50RWxlbWVudDtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyh0aGlzLm9wdGlvbnMuZWxhc3RpY0VnZGVzLmxlZnQpO1xuICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsVG8odGhpcy5vcHRpb25zLmVsYXN0aWNFZ2Rlcy5sZWZ0LCB0aGlzLm9wdGlvbnMuZWxhc3RpY0VnZGVzLnRvcCk7XG4gICAgICAgICAgICAgICAgLyp0aGlzLmNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKCd3aGVlbCcsIGZ1bmN0aW9uKGUpe1xuICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ3Njcm9sbDogJywgZSk7XG4gICAgICAgICAgICAgICAgICBpZiAoZS5wcmV2ZW50RGVmYXVsdClcbiAgICAgICAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICBlLnJldHVyblZhbHVlID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfSk7Ki9cbiAgICAgICAgICAgICAgICB0aGlzLm1vdXNlRG93bkhhbmRsZXIgPSBmdW5jdGlvbiAoZSkgeyByZXR1cm4gX3RoaXMubW91c2VEb3duKGUpOyB9O1xuICAgICAgICAgICAgICAgIHRoaXMuaW5uZXIuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5tb3VzZURvd25IYW5kbGVyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFN3b29zaC5wcm90b3R5cGUubW91c2VEb3duID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICAgICAgICAgIHZhciBlbGVtZW50QmVoaW5kQ3Vyc29yID0gZG9jdW1lbnQuZWxlbWVudEZyb21Qb2ludChlLmNsaWVudFgsIGUuY2xpZW50WSk7XG4gICAgICAgICAgICAgICAgLyogZmluZCB0aGUgbmV4dCBwYXJlbnQgd2hpY2ggaXMgYW4gaW5uZXIgZWxlbWVudCAqL1xuICAgICAgICAgICAgICAgIHdoaWxlIChlbGVtZW50QmVoaW5kQ3Vyc29yICYmICFlbGVtZW50QmVoaW5kQ3Vyc29yLmNsYXNzTGlzdC5jb250YWlucygnaW5uZXInKSkge1xuICAgICAgICAgICAgICAgICAgICBlbGVtZW50QmVoaW5kQ3Vyc29yID0gZWxlbWVudEJlaGluZEN1cnNvci5wYXJlbnRFbGVtZW50O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5pbm5lciA9PSBlbGVtZW50QmVoaW5kQ3Vyc29yKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaW5uZXIuY2xhc3NOYW1lICs9ICcgZ3JhYmJpbmcnO1xuICAgICAgICAgICAgICAgICAgICAvKiBub3RlIHRoZSBvcmlnaW4gcG9zaXRpb25zICovXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZHJhZ09yaWdpbkxlZnQgPSBlLmNsaWVudFg7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZHJhZ09yaWdpblRvcCA9IGUuY2xpZW50WTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kcmFnT3JpZ2luU2Nyb2xsTGVmdCA9IHRoaXMuc2Nyb2xsRWxlbWVudC5zY3JvbGxMZWZ0O1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmRyYWdPcmlnaW5TY3JvbGxUb3AgPSB0aGlzLnNjcm9sbEVsZW1lbnQuc2Nyb2xsVG9wO1xuICAgICAgICAgICAgICAgICAgICAvKiBpdCBsb29rcyBzdHJhbmUgaWYgc2Nyb2xsLWJlaGF2aW9yIGlzIHNldCB0byBzbW9vdGggKi9cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wYXJlbnRPcmlnaW5TdHlsZSA9IHRoaXMuaW5uZXIucGFyZW50RWxlbWVudC5zdHlsZS5jc3NUZXh0O1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmlubmVyLnBhcmVudEVsZW1lbnQuc3R5bGUuc2V0UHJvcGVydHkoJ3Njcm9sbC1iZWhhdmlvcicsICdhdXRvJyk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubW91c2VNb3ZlSGFuZGxlciA9IHRoaXMubW91c2VNb3ZlLmJpbmQodGhpcyk7XG4gICAgICAgICAgICAgICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIHRoaXMubW91c2VNb3ZlSGFuZGxlcik7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubW91c2VVcEhhbmRsZXIgPSBmdW5jdGlvbiAoZSkgeyByZXR1cm4gX3RoaXMubW91c2VVcChlKTsgfTtcbiAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIHRoaXMubW91c2VVcEhhbmRsZXIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBTd29vc2gucHJvdG90eXBlLm1vdXNlVXAgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgIC8vc3RpY2sgdGhlIGVsZW1lbnQgdG8gdGhlIGdyaWRcbiAgICAgICAgICAgICAgICB2YXIgeCA9IE1hdGgucm91bmQoKHRoaXMuZHJhZ09yaWdpbkxlZnQgKyB0aGlzLmRyYWdPcmlnaW5TY3JvbGxMZWZ0IC0gZS5jbGllbnRYKSAvIHRoaXMub3B0aW9ucy5ncmlkKSAqIHRoaXMub3B0aW9ucy5ncmlkO1xuICAgICAgICAgICAgICAgIHZhciB5ID0gTWF0aC5yb3VuZCgodGhpcy5kcmFnT3JpZ2luVG9wICsgdGhpcy5kcmFnT3JpZ2luU2Nyb2xsVG9wIC0gZS5jbGllbnRZKSAvIHRoaXMub3B0aW9ucy5ncmlkKSAqIHRoaXMub3B0aW9ucy5ncmlkO1xuICAgICAgICAgICAgICAgIHZhciBzY3JvbGxNYXhMZWZ0ID0gKHRoaXMuc2Nyb2xsRWxlbWVudC5zY3JvbGxXaWR0aCAtIHRoaXMuc2Nyb2xsRWxlbWVudC5jbGllbnRXaWR0aCkgLSB0aGlzLm9wdGlvbnMuZWxhc3RpY0VnZGVzLmxlZnQ7XG4gICAgICAgICAgICAgICAgdmFyIHNjcm9sbE1heFRvcCA9ICh0aGlzLnNjcm9sbEVsZW1lbnQuc2Nyb2xsSGVpZ2h0IC0gdGhpcy5zY3JvbGxFbGVtZW50LmNsaWVudEhlaWdodCkgLSB0aGlzLm9wdGlvbnMuZWxhc3RpY0VnZGVzLnRvcDtcbiAgICAgICAgICAgICAgICB4ID0gKHggPiBzY3JvbGxNYXhMZWZ0KSA/IHNjcm9sbE1heExlZnQgOiAoeCA8IHRoaXMub3B0aW9ucy5lbGFzdGljRWdkZXMubGVmdCkgPyB0aGlzLm9wdGlvbnMuZWxhc3RpY0VnZGVzLmxlZnQgOiB4O1xuICAgICAgICAgICAgICAgIHkgPSAoeSA+IHNjcm9sbE1heFRvcCkgPyBzY3JvbGxNYXhUb3AgOiAoeSA8IHRoaXMub3B0aW9ucy5lbGFzdGljRWdkZXMudG9wKSA/IHRoaXMub3B0aW9ucy5lbGFzdGljRWdkZXMudG9wIDogeTtcbiAgICAgICAgICAgICAgICB0aGlzLmlubmVyLmNsYXNzTmFtZSA9IHRoaXMuaW5uZXIuY2xhc3NOYW1lLnJlcGxhY2UoL1xcYiBncmFiYmluZ1xcYi8sICcnKTtcbiAgICAgICAgICAgICAgICB0aGlzLmlubmVyLnBhcmVudEVsZW1lbnQuc3R5bGUuY3NzVGV4dCA9IHRoaXMucGFyZW50T3JpZ2luU3R5bGU7XG4gICAgICAgICAgICAgICAgdGhpcy5zY3JvbGxUbyh4LCB5KTtcbiAgICAgICAgICAgICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCB0aGlzLm1vdXNlTW92ZUhhbmRsZXIpO1xuICAgICAgICAgICAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCB0aGlzLm1vdXNlVXBIYW5kbGVyKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBTd29vc2gucHJvdG90eXBlLm1vdXNlTW92ZSA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgIHZhciB4ID0gdGhpcy5kcmFnT3JpZ2luTGVmdCArIHRoaXMuZHJhZ09yaWdpblNjcm9sbExlZnQgLSBlLmNsaWVudFg7XG4gICAgICAgICAgICAgICAgdmFyIHkgPSB0aGlzLmRyYWdPcmlnaW5Ub3AgKyB0aGlzLmRyYWdPcmlnaW5TY3JvbGxUb3AgLSBlLmNsaWVudFk7XG4gICAgICAgICAgICAgICAgdGhpcy5zY3JvbGxUbyh4LCB5KTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvKiBzY3JvbGwgaGVscGVyIG1ldGhvZCAqL1xuICAgICAgICAgICAgU3dvb3NoLnByb3RvdHlwZS5zY3JvbGxUbyA9IGZ1bmN0aW9uICh4LCB5KSB7XG4gICAgICAgICAgICAgICAgdmFyIHNjcm9sbE1heExlZnQgPSAodGhpcy5zY3JvbGxFbGVtZW50LnNjcm9sbFdpZHRoIC0gdGhpcy5zY3JvbGxFbGVtZW50LmNsaWVudFdpZHRoKTtcbiAgICAgICAgICAgICAgICB2YXIgc2Nyb2xsTWF4VG9wID0gKHRoaXMuc2Nyb2xsRWxlbWVudC5zY3JvbGxIZWlnaHQgLSB0aGlzLnNjcm9sbEVsZW1lbnQuY2xpZW50SGVpZ2h0KTtcbiAgICAgICAgICAgICAgICAvKiBubyBuZWdhdGl2ZSB2YWx1ZXMgb3IgZ3JlYXRlciB0aGFuIHRoZSBtYXhpbXVtICovXG4gICAgICAgICAgICAgICAgdmFyIHggPSAoeCA+IHNjcm9sbE1heExlZnQpID8gc2Nyb2xsTWF4TGVmdCA6ICh4IDwgMCkgPyAwIDogeDtcbiAgICAgICAgICAgICAgICB2YXIgeSA9ICh5ID4gc2Nyb2xsTWF4VG9wKSA/IHNjcm9sbE1heFRvcCA6ICh5IDwgMCkgPyAwIDogeTtcbiAgICAgICAgICAgICAgICAvKiByZW1lbWJlciB0aGUgb2xkIHZhbHVlcyAqL1xuICAgICAgICAgICAgICAgIHRoaXMub3JpZ2luU2Nyb2xsTGVmdCA9IHRoaXMuc2Nyb2xsRWxlbWVudC5zY3JvbGxMZWZ0O1xuICAgICAgICAgICAgICAgIHRoaXMub3JpZ2luU2Nyb2xsVG9wID0gdGhpcy5zY3JvbGxFbGVtZW50LnNjcm9sbFRvcDtcbiAgICAgICAgICAgICAgICB0aGlzLnNjcm9sbEVsZW1lbnQuc2Nyb2xsVG8oeCwgeSk7XG4gICAgICAgICAgICAgICAgLyogdGhlIGNvbGxpZGVMZWZ0IGV2ZW50ICovXG4gICAgICAgICAgICAgICAgaWYgKHggPT0gMCAmJiB0aGlzLm9yaWdpblNjcm9sbExlZnQgIT0geCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZXZlbnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudChcIkhUTUxFdmVudHNcIik7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LmluaXRFdmVudChcImNvbGxpZGVMZWZ0XCIsIHRydWUsIHRydWUpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmlubmVyLmRpc3BhdGNoRXZlbnQoZXZlbnQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvKiB0aGUgY29sbGlkZVRvcCBldmVudCAqL1xuICAgICAgICAgICAgICAgIGlmICh5ID09IDAgJiYgdGhpcy5vcmlnaW5TY3JvbGxUb3AgIT0geSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZXZlbnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudChcIkhUTUxFdmVudHNcIik7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LmluaXRFdmVudChcImNvbGxpZGVUb3BcIiwgdHJ1ZSwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaW5uZXIuZGlzcGF0Y2hFdmVudChldmVudCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8qIHRoZSBjb2xsaWRlUmlnaHQgZXZlbnQgKi9cbiAgICAgICAgICAgICAgICBpZiAoeCA9PSBzY3JvbGxNYXhMZWZ0ICYmIHRoaXMub3JpZ2luU2Nyb2xsTGVmdCAhPSB4KSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBldmVudCA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KFwiSFRNTEV2ZW50c1wiKTtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQuaW5pdEV2ZW50KFwiY29sbGlkZVJpZ2h0XCIsIHRydWUsIHRydWUpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmlubmVyLmRpc3BhdGNoRXZlbnQoZXZlbnQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvKiB0aGUgY29sbGlkZUJvdHRvbSBldmVudCAqL1xuICAgICAgICAgICAgICAgIGlmICh5ID09IHNjcm9sbE1heFRvcCAmJiB0aGlzLm9yaWdpblNjcm9sbFRvcCAhPSB5KSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBldmVudCA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KFwiSFRNTEV2ZW50c1wiKTtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQuaW5pdEV2ZW50KFwiY29sbGlkZUJvdHRvbVwiLCB0cnVlLCB0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pbm5lci5kaXNwYXRjaEV2ZW50KGV2ZW50KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLyogbWV0aG9kIHRvIHJlZ2lzdGVyIGN1c3RvbSBldmVudCBjYWxsYmFja3MgKi9cbiAgICAgICAgICAgIFN3b29zaC5wcm90b3R5cGUub24gPSBmdW5jdGlvbiAoZXZlbnQsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ29uKCkgZXZlbnQgY2FsbGJhY2sgcmVnaXN0ZXInLCBldmVudCk7XG4gICAgICAgICAgICAgICAgdGhpcy5pbm5lci5hZGRFdmVudExpc3RlbmVyKGV2ZW50LCBjYWxsYmFjay5iaW5kKHRoaXMpKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBTd29vc2gucHJvdG90eXBlLmFsd2F5cyA9IGZ1bmN0aW9uICgpIHsgY29uc29sZS5sb2coJ2Fsd2F5cygpJyk7IHJldHVybiB0cnVlOyB9O1xuICAgICAgICAgICAgcmV0dXJuIFN3b29zaDtcbiAgICAgICAgfSgpKTtcbiAgICAgICAgLyogcmV0dXJuIGFuIGluc3RhbmNlIG9mIHRoZSBvYmplY3QgKi9cbiAgICAgICAgcmV0dXJuIG5ldyBTd29vc2goY29udGFpbmVyLCBvcHRpb25zKTtcbiAgICB9XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuICAgIGV4cG9ydHMuZGVmYXVsdCA9IGRlZmF1bHRfMTtcbn0pO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9c3dvb3NoLmpzLm1hcCJdfQ==
