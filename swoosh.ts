
/**
 * Polyfill bind function for older browsers
 * The bind function is an addition to ECMA-262, 5th edition
 * See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind
 */
if (!Function.prototype.bind) {
  Function.prototype.bind = function(oThis) {
    if (typeof this !== 'function') {
      // closest thing possible to the ECMAScript 5
      // internal IsCallable function
      throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');
    }

    var aArgs   = Array.prototype.slice.call(arguments, 1),
        fToBind = this,
        fNOP    = function() {},
        fBound  = function() {
          return fToBind.apply(this instanceof fNOP
                 ? this
                 : oThis,
                 aArgs.concat(Array.prototype.slice.call(arguments)));
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
 * See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/indexOf
 */
if (!Array.prototype.indexOf) {
  Array.prototype.indexOf = function(searchElement, fromIndex) {
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
  onload:1,
  onunload:1,
  /* Form Events */
  onblur:1,
  onchange:1,
  onfocus:1,
  onreset:1,
  onselect:1,
  onsubmit:1,
  /* Image Events */
  onabort:1,
  /* Keyboard Events */
  onkeydown:1,
  onkeypress:1,
  onkeyup:1,
  /* Mouse Events */
  onclick:1,
  ondblclick:1,
  onmousedown:1,
  onmousemove:1,
  onmouseout:1,
  onmouseover:1,
  onmouseup:1
}

/* options object definition */
interface Options {
  grid?: number;
  elasticEgdes?: {
    left?:number;
    right?:number;
    top?:number;
    bottom?:number;
  };
  dragScroll?: boolean;
  dragOptions?: {
    exclude: Array<string>;
    only: Array<string>;
  };
  wheelScroll?: boolean; 
  wheelOptions?: {
    direction?: string;
    step?: number;
  };
  callback?: (e: any) => any; //TODO: remove
}

/**
 * default export function of the module
 *
 * @param {HTMLElement} container - The HTMLElement to swoooosh!
 * @param {Options} options - the options object to configure Swoosh
 * @return {Swoosh} - Swoosh object instance
 */
export default function (container: HTMLElement, options: Options = {}) {

  class Swoosh {
    public inner: HTMLElement;

    /* scroll */
    public scrollElement: HTMLElement;
    public originScrollLeft: number;
    public originScrollTop: number;
    private scrollMaxLeft: number;
    private scrollMaxTop: number;

    /* drag */
    public dragOriginTop: number;
    public dragOriginLeft: number;
    public dragOriginScrollLeft: number;
    public dragOriginScrollTop: number;
    public parentOriginStyle: string;

    /* resize */
    public oldClientWidth: number;
    public oldClientHeight: number;
    public resizeTimeout: any;

    /* CSS style classes */
    public classInner: string = 'sw-inner';
    public classOuter: string = 'sw-outer';
    public classGrab: string = 'sw-grab';
    public classGrabbing: string = 'sw-grabbing';

    /* mouse event handlers */
    private mouseMoveHandler: (e: MouseEvent) => void;
    private mouseUpHandler: (e: MouseEvent) => void;
    private mouseDownHandler: (e: MouseEvent) => void;
    private mouseWheelHandler: (e: MouseWheelEvent) => void;
    private scrollHandler: (e: Event) => void;

    private resizeHandler: (e: Event) => void;

    /* array holding the custom events mapping callbacks to bound callbacks */
    private customEvents: Array<Array<Array<(e: Event) => void>>> = [];

    private triggered = {
      collideLeft: false,
      collideTop: false,
      collideRight: false,
      collideBottom: false
    };

    constructor (
      private container: HTMLElement,
      private options: Options) {

      this.container = container;

      /* set default options */
      this.options = {
        grid: 1, /* do not align to a grid */
        elasticEgdes: {
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
        },
        dragScroll: true,
        dragOptions: {
          exclude: ['input', 'textarea', 'a', 'button', '.sw-ignore'],
          only: [],
        },
        wheelScroll: true,
        wheelOptions: {
          direction: 'vertical', //TODO: body horizontal scrolling
          step: 114,
        },        
        callback: this.always
      };

      /* merge the default option objects with the provided one */
      for (var key in options) {
        if (options.hasOwnProperty(key)) {
          if (typeof options[key] == 'object') {
            for (var okey in options[key]) {
              if (options[key].hasOwnProperty(okey)) this.options[key][okey] = options[key][okey];
            }
          } else {
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
    private init () {

      this.container.className += " " + this.classOuter + " ";
      this.scrollElement = this.container.tagName == "BODY" ? document.documentElement : this.container;

      var x = this.scrollElement.scrollLeft + this.options.elasticEgdes.left;
      var y = this.scrollElement.scrollTop + this.options.elasticEgdes.top;

      /* create inner div element and append it to the container with its contents in it */
      this.inner = document.createElement("div");
      this.inner.className += " " + this.classInner + " ";

      /* move all childNodes to the new inner element */
      while (this.container.childNodes.length > 0) {
        this.inner.appendChild(this.container.childNodes[0]);
      }

      this.container.appendChild(this.inner);

      this.inner.style.minWidth = (this.container.scrollWidth - this.getBorderWidth(this.container)) + 'px';
      this.inner.style.minHeight = (this.container.scrollHeight - this.getBorderWidth(this.container)) + 'px';

      this.oldClientWidth = document.documentElement.clientWidth;
      this.oldClientHeight = document.documentElement.clientHeight;

      this.inner.style.paddingLeft = this.options.elasticEgdes.left + 'px';
      this.inner.style.paddingRight = this.options.elasticEgdes.right + 'px';
      this.inner.style.paddingTop = this.options.elasticEgdes.top + 'px';
      this.inner.style.paddingBottom = this.options.elasticEgdes.bottom + 'px';

      this.scrollTo(x, y);

      /* Event handler registration starts here */

      /* TODO: not 2 different event handlers registrations -> do it in this.addEventListener() */
      if (this.options.wheelScroll == false) {
        this.mouseWheelHandler = (e) => this.disableMouseScroll(e);
        this.scrollElement.onmousewheel = this.mouseWheelHandler;
        this.addEventListener(this.scrollElement, 'wheel', this.mouseWheelHandler);
      } else if (this.options.wheelScroll == true && this.container.tagName != "BODY") {
        this.mouseWheelHandler = (e) => this.activeMouseScroll(e);
        this.scrollElement.onmousewheel = this.mouseWheelHandler;
        this.addEventListener(this.scrollElement, 'wheel', this.mouseWheelHandler);
      }

      /* if the scroll element is body, adjust the inner div when resizing */
      if(this.container.tagName == "BODY"){
        this.resizeHandler = (e) => this.onResize(e); //TODO: same as above in the wheel handler
        window.onresize = this.resizeHandler;
      }

      this.scrollHandler = (e) => this.onScroll(e);
      //this.addEventListener(this.scrollElement, 'scroll', this.scrollHandler);
      this.scrollElement.onscroll = this.scrollHandler; //TODO: same as above in the wheel handler

      if (this.options.dragScroll == true) {
        this.container.className += " " + this.classGrab + " ";
        this.mouseDownHandler = (e) => this.mouseDown(e);
        this.addEventListener(this.inner, 'mousedown', this.mouseDownHandler);
      }

    }

    /**
     * Get compute pixel number of the whole width of an elements border
     * 
     * @param {HTMLElement} - the HTML element
     * @return {number} - the amount of pixels
     */
    private getBorderWidth (el: HTMLElement) {

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

      return  (pl + pr + bl + br + ml + mr);
      }

    /**
     * Get compute pixel number of the whole height of an elements border
     * 
     * @param {HTMLElement} - the HTML element
     * @return {number} - the amount of pixels
     */
    private getBorderHeight (el: HTMLElement) {
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
      
      return  (pt + pb + bt + bb + mt + mb);
      }

    /**
     * Disables the scroll wheel of the mouse
     * 
     * @param {MouseWheelEvent} e - the mouse wheel event
     * @return {void}
     */
    private disableMouseScroll (e: MouseWheelEvent) {
      if (!e) { e = (<any>window.event); }
      e.preventDefault ? e.preventDefault() : (e.returnValue = false);
      e.returnValue = false;
    }

    /**
     * Enables the scroll wheel of the mouse, specially for div withour scrollbar
     * 
     * @param {MouseWheelEvent} e - the mouse wheel event
     * @return {void}
     */
    private activeMouseScroll (e: MouseWheelEvent) {

      if (!e) { e = (<any>window.event); }

      if (this.elementBehindCursorIsMe(e.clientX, e.clientY)) {
        var direction: string;

        if ("deltaY" in e) {
          direction = (<any>e).deltaY > 0 ? 'down' : 'up'
        } else if ("wheelDelta" in e) {
          direction = e.wheelDelta > 0 ? 'up' : 'down'
        } else {
          return;
        }
        
        var x = this.scrollElement.scrollLeft;
        var y = this.scrollElement.scrollTop;

        if (this.options.wheelOptions.direction == 'horizontal') {
          x = this.scrollElement.scrollLeft + (direction == 'down' ? this.options.wheelOptions.step : this.options.wheelOptions.step*-1);
        } else if (this.options.wheelOptions.direction == 'vertical') {
          y = this.scrollElement.scrollTop + (direction == 'down' ? this.options.wheelOptions.step : this.options.wheelOptions.step*-1);
        }

        this.scrollTo(x, y);
      }
    }

    /**
     * Disables the scroll wheel of the mouse
     * 
     * @param {number} x - the x-coordinates
     * @param {number} y - the y-coordinates
     * @return {boolean} - whether the nearest related parent inner element is the one of this object instance
     */
    private elementBehindCursorIsMe (x: number, y: number) {
      var elementBehindCursor = <HTMLElement>document.elementFromPoint(x, y);

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
    }

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
    private onScroll (e?: Event) {

      var x = this.scrollElement.scrollLeft;
      var y = this.scrollElement.scrollTop;

      // the collideLeft event
      if (x == 0) {
        this.triggered.collideLeft ? null : this.triggerEvent(this.inner, 'collideLeft');
        this.triggered.collideLeft = true;
      } else {
        this.triggered.collideLeft = false;
      }

      // the collideTop event
      if (y == 0) {
        this.triggered.collideTop ? null : this.triggerEvent(this.inner, 'collideTop');
        this.triggered.collideTop = true;
      } else {
        this.triggered.collideTop = false;
      }

      // the collideRight event
      if (x == this.scrollMaxLeft) {
        this.triggered.collideRight ? null : this.triggerEvent(this.inner, 'collideRight');
        this.triggered.collideRight = true;
      } else {
        this.triggered.collideRight = false;
      }        

      // the collideBottom event
      if (y == this.scrollMaxTop) {
        this.triggered.collideBottom ? null : this.triggerEvent(this.inner, 'collideBottom');
        this.triggered.collideBottom = true;
      } else {
        this.triggered.collideBottom = false;
      }     

    }

    /**
     * window resize handler to recalculate the inner div minWidth and minHeight
     *
     * @param {Event} e - The window resize event object (TODO: needed?)
     * @return {void}
     */
    private onResize (e: Event) {

      var onResize = () => {
        this.inner.style.minWidth = null;
        this.inner.style.minHeight = null;

        /* take away the margin values of the body element */
        var xDelta = parseInt(this.getStyle(document.body, 'marginLeft'), 10) + parseInt(this.getStyle(document.body, 'marginRight'), 10)
        var yDelta = parseInt(this.getStyle(document.body, 'marginTop'), 10) + parseInt(this.getStyle(document.body, 'marginBottom'), 10)

        //TODO: with this.getBorderWidth() and this.getBorderHeight()
        this.inner.style.minWidth = (document.documentElement.scrollWidth - xDelta) + 'px';
        this.inner.style.minHeight = (document.documentElement.scrollHeight - yDelta - 100) + 'px'; //TODO: WTF? why -100 for IE8?
      }

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
    }

    private clearTextSelection() {
      if ((<any>window).getSelection) (<any>window).getSelection().removeAllRanges();
      if ((<any>document).selection) (<any>document).selection.empty();
    }

    /**
     * Browser independent event registration
     * 
     * @param {HTMLElement} obj - The HTMLElement to attach the event to
     * @param {string} event - The event name without the leading "on"
     * @param {(e: Event) => void} callback - A callback function to attach to the event
     * @return {void}
     */     
    private addEventListener (obj: any, event: string, callback: (e: Event) => void) {

      var boundCallback = callback.bind(this);

      if (typeof obj.addEventListener == 'function') {
        obj.addEventListener(event, boundCallback);
      } else if (typeof (<any>obj).attachEvent == 'object' && htmlEvents['on' + event]) { //MSIE: real events (e.g. 'click')
        (<any>obj).attachEvent('on' + event, boundCallback);
      } else if (typeof (<any>obj).attachEvent == 'object') { //MSIE: custom event workaround
        obj[event] = 1;
        boundCallback = (e) => {
          /* TODO: e is the onpropertychange event not one of the custom event objects */
          if (e.propertyName == event) { callback(e); }
        };
        (<any>obj).attachEvent('onpropertychange', boundCallback);
      } else {
        obj['on' + event] = boundCallback;
      }

      this.customEvents[event] ? null : (this.customEvents[event] = []);
      this.customEvents[event].push([callback, boundCallback]);

    }

    /**
     * Browser independent event deregistration
     * 
     * @param {HTMLElement} obj - The HTMLElement whose event should be detached
     * @param {string} event - The event name without the leading "on"
     * @param {(e: Event) => void} callback - The callback function when attached
     * @return {void}
     */    
    private removeEventListener (obj: HTMLElement, event: string, callback: (e: Event) => void) {

      if (event in this.customEvents) {
        for (let i in this.customEvents[event]) {
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
      } else if (typeof (<any>obj).detachEvent == 'object' && htmlEvents['on' + event]) { //MSIE: real events (e.g. 'click')
        (<any>obj).detachEvent('on' + event, callback);
      } else if (typeof (<any>obj).detachEvent == 'object') { //MSIE: custom event workaround
        (<any>obj).detachEvent('onpropertychange', callback);
      } else {
        obj['on' + event] = null;
      }
    }

    /**
     * Browser independent event trigger function
     * 
     * @param {HTMLElement} obj - The HTMLElement which triggers the event
     * @param {string} eventName - The event name without the leading "on"
     * @return {void}
     */
    private triggerEvent (obj: HTMLElement, eventName: string) {
      var event: Event;

      if (typeof (<any>window).CustomEvent === 'function') {
        event = new CustomEvent(eventName);
      } else if (typeof document.createEvent == 'function') {
        event = document.createEvent("HTMLEvents");
        event.initEvent(eventName, true, true);
      } else if ((<any>document).createEventObject) { // IE < 9
        event = (<any>document).createEventObject();
        (<any>event).eventType = eventName;
      }

      (<any>event).eventName = eventName;
      if (obj.dispatchEvent) {
        obj.dispatchEvent(event);
      } else if (obj[eventName]) { //MSIE: custom events        
        obj[eventName]++;
      } else if ((<any>obj).fireEvent && htmlEvents['on' + eventName]) { //MSIE: only real events
        (<any>obj).fireEvent('on' + (<any>event).eventType, event);
      } else if (obj[eventName]) {
        obj[eventName]();
      } else if (obj['on' + eventName]) {
        obj['on' + eventName]();
      }

    }

    /**
     * Get a css style property value browser independent
     * 
     * @param {HTMLElement} el - The HTMLElement to lookup
     * @param {string} jsProperty - The css property name in javascript in camelCase (e.g. "marginLeft", not "margin-left")
     * @return {string} - the property value
     */
    private getStyle (el: HTMLElement, jsProperty: string) {
        var cssProperty = jsProperty.replace(/([A-Z])/g, "-$1").toLowerCase(); 
        if (typeof window.getComputedStyle == 'function') {
            return window.getComputedStyle(el).getPropertyValue(cssProperty);
        } else {
            return (<any>el).currentStyle[jsProperty];
        }
    }

    /**
     * Mouse down handler
     * Registers the mousemove and mouseup handlers and finds the next inner element
     *
     * @param {MouseEvent} e - The mouse down event object
     * @return {void}
     */
    private mouseDown (e: MouseEvent): void {

      /* drag only if the left mouse button was pressed */
      if (("which" in e && e.which == 1) || (typeof e.which == 'undefined' && "button" in e && e.button == 1)) {

        /* drag only if the mouse clicked on an allowed element */
        var el = <HTMLElement>document.elementFromPoint(e.clientX, e.clientY);

        if (this.elementBehindCursorIsMe(e.clientX, e.clientY)) {

          /* search the DOM for exclude elements */
          var excludeElements = this.container.querySelectorAll(this.options.dragOptions.exclude.join(', '));

          /* loop through the nodelist and check for our element */
          for (var i = 0; i < excludeElements.length; i++) {
            if (excludeElements[i] == el) {
              return;
            }
          }

          /* search the DOM for only elements, but only if there are elements set */
          if (this.options.dragOptions.only.length != 0){
            var onlyElements = this.container.querySelectorAll(this.options.dragOptions.only.join(', '));
            /* loop through the nodelist and check for our element */
            var found = false;
            for (var i = 0; i < excludeElements.length; i++) {
              if (onlyElements[i] == el) {
                found = true;
                break;
              }
            }
            if (found == false) {
              return;
            }
          }

          this.inner.className += " " + this.classGrabbing + " ";

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

          this.mouseMoveHandler = this.mouseMove.bind(this)
          this.addEventListener(document.documentElement, 'mousemove', this.mouseMoveHandler);

          this.mouseUpHandler = (e) => this.mouseUp(e);
          this.addEventListener(document.documentElement, 'mouseup', this.mouseUpHandler);

          /* TODO: MSIE text selection disable */
          //this.addEventListener(this.inner, 'selectstart', function(){return false;});
        }
      }
    }

    /**
     * Mouse up handler
     * Deregisters the mousemove and mouseup handlers and aligns the element to a grid
     *
     * @param {MouseEvent} e - The mouse up event object
     * @return {void}
     */
    private mouseUp (e: MouseEvent): void {
      //stick the element to the grid, if grid equals 1 the value does not change
      var x = Math.round((this.dragOriginLeft + this.dragOriginScrollLeft - e.clientX) / this.options.grid) * this.options.grid
      var y = Math.round((this.dragOriginTop + this.dragOriginScrollTop - e.clientY) / this.options.grid) * this.options.grid;

      this.scrollMaxLeft = (this.scrollElement.scrollWidth - this.scrollElement.clientWidth) - this.options.elasticEgdes.left;
      this.scrollMaxTop = (this.scrollElement.scrollHeight - this.scrollElement.clientHeight) - this.options.elasticEgdes.top;
      x = (x > this.scrollMaxLeft) ? this.scrollMaxLeft : (x < this.options.elasticEgdes.left) ? this.options.elasticEgdes.left : x;
      y = (y > this.scrollMaxTop) ? this.scrollMaxTop : (y < this.options.elasticEgdes.top) ? this.options.elasticEgdes.top : y;

      var re = new RegExp(" " + this.classGrabbing + " ");
      this.inner.className = this.inner.className.replace(re,'');
      this.inner.parentElement.style.cssText = this.parentOriginStyle;

      this.scrollTo(x, y);

      this.removeEventListener(document.documentElement, 'mousemove', this.mouseMoveHandler);
      this.removeEventListener(document.documentElement, 'mouseup', this.mouseUpHandler);
    }

    /**
     * Mouse move handler
     * Calcucates the x and y deltas and scrolls
     *
     * @param {MouseEvent} e - The mouse move event object
     * @return {void}
     */
    private mouseMove (e: MouseEvent): void {

      this.clearTextSelection();

      /* if the mouse left the window and the button is not pressed anymore, abort moving */
      if ((e.buttons == 0 && e.button == 0) || (typeof e.buttons == 'undefined' && e.button == 0)) {
        this.mouseUp(e);
        return;
      }
      var x = this.dragOriginLeft + this.dragOriginScrollLeft - e.clientX;
      var y = this.dragOriginTop + this.dragOriginScrollTop - e.clientY;

      this.scrollTo(x, y);
    }

    /**
     * scrollTo helper method
     *
     * @param {number} x - x-coordinate to scroll to
     * @param {number} y - y-coordinate to scroll to
     * @return {void}
     */
    private scrollTo (x: number, y: number) {

      this.scrollMaxLeft = (this.scrollElement.scrollWidth - this.scrollElement.clientWidth);
      this.scrollMaxTop = (this.scrollElement.scrollHeight - this.scrollElement.clientHeight);

      /* no negative values or greater than the maximum */
      var x = (x > this.scrollMaxLeft) ? this.scrollMaxLeft : (x < 0) ? 0 : x;
      var y = (y > this.scrollMaxTop) ? this.scrollMaxTop : (y < 0) ? 0 : y;

      /* remember the old values */
      this.originScrollLeft = this.scrollElement.scrollLeft;
      this.originScrollTop = this.scrollElement.scrollTop;      

      if (typeof (<any>this.scrollElement).scrollTo == 'function') {
        (<any>this.scrollElement).scrollTo(x, y);
      } else {
        //IE8 has no scrollTo method
        this.scrollElement.scrollTop = y;
        this.scrollElement.scrollLeft = x;        
      }
    }

    /**
     * Register custom event callbacks
     *
     * @param {string} event - The event name
     * @param {(e: Event) => any} callback - A callback function to execute when the event raises
     * @return {Swoosh} - The Swoosh object instance
     */
    public on (event: string, callback: (e: Event) => any): Swoosh {
      this.addEventListener(this.inner, event, callback);
      return this;
    }

    /**
     * Deregister custom event callbacks
     *
     * @param {string} event - The event name
     * @param {(e: Event) => any} callback - A callback function to execute when the event raises
     * @return {Swoosh} - The Swoosh object instance
     */
    public off (event: string, callback: (e: Event) => any): Swoosh {
      this.removeEventListener(this.inner, event, callback);
      return this;
    }

    /**
     * Revert all DOM manipulation and deregister all event handlers
     * 
     * @return {void}
     */
    public destroy () {
      var x = this.scrollElement.scrollLeft - this.options.elasticEgdes.left;
      var y = this.scrollElement.scrollTop - this.options.elasticEgdes.top;

      /* remove the outer and grab CSS classes */
      var re = new RegExp(" " + this.classOuter + " ");
      this.container.className = this.container.className.replace(re,'');
      var re = new RegExp(" " + this.classGrab + " ");
      this.container.className = this.container.className.replace(re,'');

      /* move all childNodes back to the old outer element and remove the inner element */
      while (this.inner.childNodes.length > 0) {
        this.container.appendChild(this.inner.childNodes[0]);
      }
      this.container.removeChild(this.inner);

      this.scrollTo(x, y);

      this.mouseMoveHandler ? this.removeEventListener(document.documentElement, 'mousemove', this.mouseMoveHandler) : null;
      this.mouseUpHandler ? this.removeEventListener(document.documentElement, 'mouseup', this.mouseUpHandler) : null;
      this.mouseDownHandler ? this.removeEventListener(this.inner, 'mousedown', this.mouseDownHandler) : null;
      this.mouseWheelHandler ? this.removeEventListener(this.scrollElement, 'wheel', this.mouseWheelHandler) : null;
      this.scrollElement ? this.scrollElement.onmousewheel = null : null;
      this.scrollElement ? this.scrollElement.onscroll = null : null;
      window.onresize = null;

      return;
    }

    private always() { console.log('always()'); return true; }

  }

  /* return an instance of the class */
  return new Swoosh(container, options);
}
