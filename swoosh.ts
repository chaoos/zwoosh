
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

interface elasticEgdes {
  left:number;
  right:number;
  top:number;
  bottom:number;
}

/* options object */
interface Options {
  grid?: number;
  elasticEgdes?: elasticEgdes;
  callback?: (e: any) => any;
}

/**
 * default export function of the module
 *
 * @param {HTMLElement} container - The HTMLElement to swoooosh!
 * @param {Options} options - the options object to configure Swoosh
 * @return {Swoosh} - Swoosh object instance
 */
export default function (container: HTMLElement, options: Options) {

  class Swoosh {
    public inner: HTMLElement;
    public scrollElement: HTMLElement;
    public originScrollLeft: number;
    public originScrollTop: number;
    public dragOriginTop: number;
    public dragOriginLeft: number;
    public dragOriginScrollLeft: number;
    public dragOriginScrollTop: number;
    public parentOriginStyle: string;
    public oldClientWidth: number;
    public oldClientHeight: number;
    public resizeTimeout: any;

    /* CSS style classes */
    public classInner: string = 'inner';
    public classOuter: string = 'outer';
    public classGrabbing: string = 'grabbing';

    /* mouse event handlers */
    private mouseMoveHandler: (e: MouseEvent) => void;
    private mouseUpHandler: (e: MouseEvent) => void;
    private mouseDownHandler: (e: MouseEvent) => void;
    private resizeHandler: (e: Event) => void;

    constructor(
      private container: HTMLElement,
      private options: Options) {

      this.container = container;

      /* set default options */
      this.options = {
        grid: 1, //do not align to a grid
        elasticEgdes: {
          left: 50,
          right: 50,
          top: 50,
          bottom: 50,
        },
        callback: this.always
      };

      /* merge the two option objects */
      for (var key in options) {
        if (options.hasOwnProperty(key)) this.options[key] = options[key];
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
      if(this.container.tagName == "BODY"){
        this.resizeHandler = (e) => this.resize(e);
        window.onresize = this.resizeHandler;
      }

      this.mouseDownHandler = (e) => this.mouseDown(e);
      this.addEventListener(this.inner, 'mousedown', this.mouseDownHandler);
    }

    /**
     * window resize handler to recalculate the inner div minWidth and minHeight
     *
     * @param {Event} e - The window resize event object (TODO: needed?)
     * @return {void}
     */
    private resize (e) {

      var onResize = () => {
        this.inner.style.minWidth = null;
        this.inner.style.minHeight = null;

        /* take away the margin values of the body element */
        var xDelta = parseInt(this.getStyle(document.body, 'marginLeft'), 10) + parseInt(this.getStyle(document.body, 'marginRight'), 10)
        var yDelta = parseInt(this.getStyle(document.body, 'marginTop'), 10) + parseInt(this.getStyle(document.body, 'marginBottom'), 10)

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

    /* browser independent event registration */
    /**
     * Browser independent event registration
     * 
     * @param {HTMLElement} obj - The HTMLElement to attach the event to
     * @param {string} event - The event name without the leading "on"
     * @param {(e: Event) => void} callback - A callback function to attach to the event
     * @return {void}
     */     
    private addEventListener (obj: any, event: string, callback: (e: Event) => void) {

      if (typeof obj.addEventListener == 'function') {
        obj.addEventListener(event, callback);
      } else if (typeof (<any>obj).attachEvent == 'object' && htmlEvents['on' + event]) { //MSIE: real events (e.g. 'click')
        (<any>obj).attachEvent('on' + event, callback);
      } else if (typeof (<any>obj).attachEvent == 'object') { //MSIE: custom event workaround
        document.documentElement[event] = 1;
        (<any>document.documentElement).attachEvent('onpropertychange', (e) => {
          if (e.propertyName == event) {
            /* TODO: e is the onpropertychange event not one of the custom event objects */
            /* TODO: only every Swoosh element raises the same collideLeft event */
            callback(e);
          }
        });
      } else {
        obj['on' + event] = callback;
      }
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
      if (typeof obj.removeEventListener == 'function') {
        obj.removeEventListener(event, callback);
      } else if (typeof (<any>obj).detachEvent == 'object') {
        (<any>obj).detachEvent('on' + event, callback);
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
      } else if (document.documentElement[eventName]) { //MSIE: custom events
        document.documentElement[eventName]++;
      } else if ((<any>obj).fireEvent && htmlEvents['on' + eventName]) { //MSIE: only real events
        (<any>obj).fireEvent('on' + (<any>event).eventType, event);
      } else if (obj[eventName]) {
        obj[eventName]();
      } else if (obj['on' + eventName]) {
        obj['on' + eventName]();
      }

    }

    /**
     * Get a css style value browser independent
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
      var elementBehindCursor = <HTMLElement>document.elementFromPoint(e.clientX, e.clientY);
      
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

        this.mouseMoveHandler = this.mouseMove.bind(this)
        this.addEventListener(document.documentElement, 'mousemove', this.mouseMoveHandler);

        this.mouseUpHandler = (e) => this.mouseUp(e);
        this.addEventListener(document.documentElement, 'mouseup', this.mouseUpHandler);
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

      var scrollMaxLeft = (this.scrollElement.scrollWidth - this.scrollElement.clientWidth) - this.options.elasticEgdes.left;
      var scrollMaxTop = (this.scrollElement.scrollHeight - this.scrollElement.clientHeight) - this.options.elasticEgdes.top;
      x = (x > scrollMaxLeft) ? scrollMaxLeft : (x < this.options.elasticEgdes.left) ? this.options.elasticEgdes.left : x;
      y = (y > scrollMaxTop) ? scrollMaxTop : (y < this.options.elasticEgdes.top) ? this.options.elasticEgdes.top : y;

      var re = new RegExp(" " + this.classGrabbing);
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
      var x = this.dragOriginLeft + this.dragOriginScrollLeft - e.clientX;
      var y = this.dragOriginTop + this.dragOriginScrollTop - e.clientY;

      this.scrollTo(x, y);
    }

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
    private scrollTo (x: number, y: number) {

      var scrollMaxLeft = (this.scrollElement.scrollWidth - this.scrollElement.clientWidth);
      var scrollMaxTop = (this.scrollElement.scrollHeight - this.scrollElement.clientHeight);

      /* no negative values or greater than the maximum */
      var x = (x > scrollMaxLeft) ? scrollMaxLeft : (x < 0) ? 0 : x;
      var y = (y > scrollMaxTop) ? scrollMaxTop : (y < 0) ? 0 : y;

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
    }

    /**
     * Register custom event callbacks
     *
     * @param {string} event - The event name
     * @param {(e: Event) => any} callback - A callback function to execute when the event raises
     * @return {Swoosh} - The Swoosh object instance
     */
    public on (event: string, callback: (e: Event) => any): Swoosh {
      this.addEventListener(this.inner, event, callback.bind(this));
      return this;
    }

    private always() { console.log('always()'); return true; }

  }

  /* return an instance of the class */
  return new Swoosh(container, options);
}
