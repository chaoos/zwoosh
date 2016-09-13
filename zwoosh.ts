/**
 * Export function of the module
 *
 * @param {HTMLElement} container - The HTMLElement to swoooosh!
 * @param {Options} options - the options object to configure Zwoosh
 * @return {Zwoosh} - Zwoosh object instance
 */
function zwoosh (container: HTMLElement, options = {}) {

  /**
   * Polyfill bind function for older browsers
   * The bind function is an addition to ECMA-262, 5th edition
   * @see: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind
   */
  if (!Function.prototype.bind) {
    Function.prototype.bind = function(oThis) {
      if (typeof this !== "function") {
        // closest thing possible to the ECMAScript 5
        // internal IsCallable function
        throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
      }

      let aArgs   = Array.prototype.slice.call(arguments, 1),
          fToBind = this,
          FNOP    = function() {},
          fBound  = function() {
            return fToBind.apply(this instanceof FNOP ? this : oThis,
                   aArgs.concat(Array.prototype.slice.call(arguments)));
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
    Array.prototype.indexOf = function(searchElement, fromIndex) {
      let k;
      if (this === null) {
        throw new TypeError("'this' is null or not defined");
      }

      let o = Object(this);
      let len = o.length >>> 0;
      if (len === 0) {
        return -1;
      }

      let n = +fromIndex || 0;
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
  let htmlEvents = {
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

  let mapEvents = {
    onscroll: window,
  };

  /* options object definition */
  interface Options {
    gridX?: number;
    gridY?: number;
    gridShow?: boolean;
    elasticEdges?: {
      left?: boolean;
      top?: boolean;
      right?: boolean;
      bottom?: boolean;
    };
    dragScroll?: boolean;
    dragOptions?: {
      exclude: Array<string>;
      only: Array<string>;
      fade?: boolean;
      brakeSpeed?: number;
      fps?: number;
      maxSpeed?: number;
      minSpeed?: number;
    };
    wheelScroll?: boolean;
    wheelOptions?: {
      direction?: string;
      step?: number;
      smooth?: boolean;
    };
    wheelZoom?: boolean;
    zoomOptions?: {
      maxScale?: number;
      minScale?: number;
      step?: number;
      direction?: string;
    };
    handleAnchors?: boolean;
  };


  /**
   * Zwoosh provides a set of functions to implement scroll by drag, zoom by mousewheel, 
   * hash links inside the document and other special scroll related requirements. 
   * 
   * @author Roman Gruber <p1020389@yahoo.com>
   * @version 1.0.1
   */
  class Zwoosh {
    public inner: HTMLElement;
    private isBody: boolean;
    public dragging: boolean;

    /* scroll */
    private scrollElement: HTMLElement;
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

    /* zoom */
    private scaleElement: HTMLElement;

    /* resize */
    public oldClientWidth: number;
    public oldClientHeight: number;
    public resizeTimeout: any;

    /* CSS style classes */
    public classInner: string = "zw-inner";
    public classOuter: string = "zw-outer";
    public classGrab: string = "zw-grab";
    public classNoGrab: string = "zw-nograb";
    public classGrabbing: string = "zw-grabbing";
    public classUnique: string = "zw-" + Math.random().toString(36).substring(7);
    public classScale: string = "zw-scale";
    public classIgnore: string = "zw-ignore";
    public classFakeBody: string = "zw-fakebody";

    /* mouse event handlers */
    private mouseMoveHandler: (e: MouseEvent) => void;
    private mouseUpHandler: (e: MouseEvent) => void;
    private mouseDownHandler: (e: MouseEvent) => void;
    private mouseScrollHandler: (e: MouseWheelEvent) => void;
    private mouseZoomHandler: (e: MouseWheelEvent) => void;
    private scrollHandler: (e: Event) => void;
    private resizeHandler: (e: Event) => void;
    private hashChangeHandler: (e: Event) => void;
    private hashChangeClickHandler: (e: Event) => void;

    /* own event handler */
    private clearListenerLeft: (e: Event) => void;
    private clearListenerRight: (e: Event) => void;
    private clearListenerTop: (e: Event) => void;
    private clearListenerBottom: (e: Event) => void;

    /* array holding the custom events mapping callbacks to bound callbacks */
    private customEvents: Array<Array<Array<(e: Event) => void>>> = [];

    private triggered = {
      collideLeft: false,
      collideTop: false,
      collideRight: false,
      collideBottom: false
    };

    /* fadeOut */
    private timeouts: Array<number> = [];

    private present: number;
    private past: number;
    private vx: Array<number> = [];
    private vy: Array<number> = [];

    constructor (
      private container: HTMLElement,
      public options: Options) {

      this.container = container;

      /* set default options */
      let defaultOptions = {
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
          bottom: false,
        },
        /* activates/deactivates scrolling by drag */
        dragScroll: true,
        dragOptions: {
          exclude: ["input", "textarea", "a", "button", "." + this.classIgnore, "select"],
          only: [], // TODO commented out
          /* activates a scroll fade when scrolling by drag */
          fade: true,
          /* fade: brake acceleration in pixels per second per second (p/s^2) */
          brakeSpeed: 2500,
          /* fade: frames per second of the zwoosh fadeout animation (>=25 looks like motion) */
          fps: 30,
          /* fade: this speed will never be exceeded */
          maxSpeed: 3000,
          /* fade: minimum speed which triggers the fade */
          minSpeed: 300,
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
          smooth: true,
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
          direction: "up",
        },
        /* let zwoosh handle anchor links targeting to an anchor inside of this zwoosh element.
         * the element outside (maybe the body) handles anchors too. If you want to prevent this,
         * add to body as zwoosh element too. */
        handleAnchors: true,
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
    private merge (options: Options, defaultOptions: Options) {
      /* merge the default option object with the provided one */
      for (let key in options) {
        if (options.hasOwnProperty(key)) {
          if (typeof options[key] === "object") {
            for (let okey in options[key]) {
              if (options[key].hasOwnProperty(okey)) defaultOptions[key][okey] = options[key][okey];
            }
          } else {
            defaultOptions[key] = options[key];
          }
        }
      }
      return defaultOptions;
    }

    /**
     * Initialize DOM manipulations and event handlers
     * 
     * @return {void}
     */
    private init () {

      this.initBody();

      this.addClass(this.container, this.classOuter);
      this.scrollElement = this.container;

      let x = this.getScrollLeft();
      let y = this.getScrollTop();

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

      let border = this.getBorder(this.container);
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
      this.scrollHandler = (e) => this.onScroll(e);
      this.addEventListener(this.container, "scroll", this.scrollHandler);

      /* if the scroll element is body, adjust the inner div when resizing */
      if (this.isBody) {
        this.resizeHandler = (e) => this.onResize(e); // TODO: same as above in the wheel handler
        window.onresize = this.resizeHandler;
      }

      this.initDragScroll();
      this.initAnchors();
    }

    /**
     * Reinitialize the zwoosh element
     * 
     * @return {Zwoosh} - The Zwoosh object instance
     * @TODO: preserve scroll position in init()
     */
    public reinit () {
      this.destroy();
      this.classUnique = "zw-" + Math.random().toString(36).substring(7);
      this.init();
      return this;
    }

    private initBody () {
      this.isBody = this.container.tagName === "BODY" ? true : false;
      /* Chrome solution to scroll the body is not really viable, so we create a fake body 
       * div element to scroll on */
      if (this.isBody === true) {
        let pseudoBody = document.createElement("div");
        this.addClass(pseudoBody, this.classFakeBody);
        pseudoBody.style.cssText = document.body.style.cssText;
        while (this.container.childNodes.length > 0) {
          pseudoBody.appendChild(this.container.childNodes[0]);
        }
        this.container.appendChild(pseudoBody);
        this.container = pseudoBody;
      }
    }

    private initGrid () {
      /* show the grid only if at least one of the grid values is not 1 */
      if ((this.options.gridX !== 1 || this.options.gridY !== 1) && this.options.gridShow) {
        let bgi = [];
        if (this.options.gridX !== 1) { bgi.push("linear-gradient(to right, grey 1px, transparent 1px)"); }
        if (this.options.gridY !== 1) { bgi.push("linear-gradient(to bottom, grey 1px, transparent 1px)"); }

        this.addBeforeCSS(this.classUnique, "width", this.inner.style.minWidth);
        this.addBeforeCSS(this.classUnique, "height", this.inner.style.minHeight);
        this.addBeforeCSS(this.classUnique, "left", "-" + this.getStyle(this.container, "paddingLeft"));
        this.addBeforeCSS(this.classUnique, "top", "-" + this.getStyle(this.container, "paddingTop"));

        this.addBeforeCSS(this.classUnique, "background-size", (this.options.gridX !== 1 ? this.options.gridX + "px " : "auto ") + (this.options.gridY !== 1 ? this.options.gridY + "px" : "auto"));
        this.addBeforeCSS(this.classUnique, "background-image", bgi.join(", "));
      }
    }

    private initWheelScroll () {
      /* TODO: not 2 different event handlers registrations -> do it in this.addEventListener() */
      if (this.options.wheelScroll === false) {
        this.mouseScrollHandler = (e) => this.disableMouseScroll(e);
        this.scrollElement.onmousewheel = this.mouseScrollHandler;
        this.addEventListener(this.scrollElement, "wheel", this.mouseScrollHandler);
      } else if (this.options.wheelScroll === true) {
        this.mouseScrollHandler = (e) => this.activeMouseScroll(e);
        this.scrollElement.onmousewheel = this.mouseScrollHandler;
        this.addEventListener(this.scrollElement, "wheel", this.mouseScrollHandler);
      }
    }

    /* wheelzoom */
    private initWheelZoom () {
      if (this.options.gridShow) { this.scaleTo(1); }
      if (this.options.wheelZoom === true) {
        this.mouseZoomHandler = (e) => this.activeMouseZoom(e);
        this.addEventListener(this.scrollElement, "wheel", this.mouseZoomHandler);
      }
    }

    private initDragScroll () {
      /* if dragscroll is activated, register mousedown event */
      if (this.options.dragScroll === true) {
        this.addClass(this.inner, this.classGrab);
        this.mouseDownHandler = (e) => this.mouseDown(e);
        this.addEventListener(this.inner, "mousedown", this.mouseDownHandler);
      } else {
        this.addClass(this.container, this.classNoGrab);
      }
    }

    private initAnchors () {
      if (this.options.handleAnchors === true) {
        let links = this.container.querySelectorAll("a[href^='#']");
        this.hashChangeClickHandler = (e) => {
          let target = e ? e.target : window.event.srcElement;
          if (typeof target !== "undefined") {
            /* pushState changes the hash without triggering hashchange */
            history.pushState({}, "", (<any>target).href);
            /* we don't want to trigger hashchange, so prevent default behavior when clicking on anchor links */
            if (e.preventDefault) { e.preventDefault(); } else { e.returnValue = false; }
          }

          /* trigger a custom hashchange event, because pushState prevents the real hashchange event */
          this.triggerEvent((<any>window), "myhashchange");
        };

        /* loop trough all anchor links in the element and disable them to prevent the 
         * browser from scrolling because of the changing hash value. Instead the own 
         * event myhashchange should handle page and element scrolling */
        for (let i = 0; i < links.length; i++) {
          this.addEventListener(links[i], "click", this.hashChangeClickHandler, false);
        }

        this.hashChangeHandler = (e) => this.onHashChange(e);
        this.addEventListener(window, "myhashchange", this.hashChangeHandler);
        this.addEventListener(window, "hashchange", this.hashChangeHandler);
        this.onHashChange();
      }
    }

    /* @TODO: ScrollWidth and ClientWidth ScrollHeight ClientHeight */
    private getScrollLeft () {
      return this.scrollElement.scrollLeft;
    }

    private setScrollLeft (left: number) {
      this.scrollElement.scrollLeft = left;
    }

    private getScrollTop () {
      return this.scrollElement.scrollTop;
    }

    private setScrollTop (top: number) {
      this.scrollElement.scrollTop = top;
    }

    /**
     * Handle hashchanges with own scroll function
     * 
     * @param {Event} e - the hashchange or myhashchange event, or nothing
     * @return {void}
     */
    private onHashChange (e: Event = null) {

      let hash = window.location.hash.substr(1);
      if (hash !== "") {
        let anchors = this.container.querySelectorAll("#" + hash);
        for (let i = 0; i < anchors.length; i++) {
          let element = (<any>anchors[i]);
          let container = (<any>anchors[i]);

          // find the next parent which is a container element
          let nextContainer = element;
          while (container && container.parentElement && this.container !== container) {
            if (this.hasClass(container, this.classOuter)) {
              nextContainer = container;
            }
            container = container.parentElement;
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
    }

    /**
     * Scroll to an element in the DOM
     *
     * @param {HTMLElement} element - the HTMLElement to scroll to
     */
    public scrollToElement (element: HTMLElement) {
      /* get relative coords from the anchor element */
      let x = (element.offsetLeft - this.container.offsetLeft) * this.getScale();
      let y = (element.offsetTop - this.container.offsetTop) * this.getScale();
      this.scrollTo(x, y);
    }

    /**
     * Workaround to manipulate ::before CSS styles with javascript
     * 
     * @param {string} cssClass - the CSS class name to add ::before properties
     * @param {string} cssProperty - the CSS property to set
     * @param {string} cssValue - the CSS value to set
     * @return {void}
     */
    private addBeforeCSS (cssClass: string, cssProperty: string, cssValue: string) {
      if (typeof (<any>document.styleSheets[0]).insertRule === "function") {
        (<any>document.styleSheets[0]).insertRule("." + cssClass + "::before { " + cssProperty + ": " + cssValue + "}", 0);
      } else if (typeof (<any>document.styleSheets[0]).addRule === "function") {
        (<any>document.styleSheets[0]).addRule("." + cssClass + "::before", cssProperty + ": " + cssValue);
      }
    }

    /**
     * Get compute pixel number of the whole width and height from a border of an element
     * 
     * @param {HTMLElement} el - the HTML element
     * @return {array} [width, height] - the amount of pixels
     */
    private getBorder (el: HTMLElement) {
      let bl = this.convertBorder(this.getStyle(el, "borderLeftWidth"));
      let br = this.convertBorder(this.getStyle(el, "borderRightWidth"));
      let pl = this.convertSpan(this.getStyle(el, "paddingLeft"));
      let pr = this.convertSpan(this.getStyle(el, "paddingRight"));
      let ml = this.convertSpan(this.getStyle(el, "marginLeft"));
      let mr = this.convertSpan(this.getStyle(el, "marginRight"));

      let bt = this.convertBorder(this.getStyle(el, "borderTopWidth"));
      let bb = this.convertBorder(this.getStyle(el, "borderBottomWidth"));
      let pt = this.convertSpan(this.getStyle(el, "paddingTop"));
      let pb = this.convertSpan(this.getStyle(el, "paddingBottom"));
      let mt = this.convertSpan(this.getStyle(el, "marginTop"));
      let mb = this.convertSpan(this.getStyle(el, "marginBottom"));

      return [
        (pl + pr + bl + br + ml + mr),
        (pt + pb + bt + bb + mt + mb)
      ];
    }

    private convertBorder (b: string) {
      return b === "thin" ? 1 : b === "medium" ? 3 : b === "thick" ? 5 : !isNaN(parseInt(b, 10)) ? parseInt(b, 10) : 0;
    }

    private convertSpan (v: string) {
      return v === "auto" ? 0 : !isNaN(parseInt(v, 10)) ? parseInt(v, 10) : 0;
    }

    /**
     * Disables the scroll wheel of the mouse
     * 
     * @param {MouseWheelEvent} e - the mouse wheel event
     * @return {void}
     */
    private disableMouseScroll (e: MouseWheelEvent) {

      if (this.elementBehindCursorIsMe(e.clientX, e.clientY)) {
        this.clearTimeouts();
        if (!e) { e = (<any>window.event); }
        if (e.preventDefault) { e.preventDefault(); } else { e.returnValue = false; }
      }
    }

    /**
     * Determine whether an element has a scrollbar or not
     * 
     * @param {HTMLElement} element - the HTMLElement
     * @param {string} direction - determine the vertical or horizontal scrollbar?
     * @return {boolean} - whether the element has scrollbars or not
     */
    private hasScrollbar (element: HTMLElement, direction: string) {
      let has = false;
      let overflow = "overflow";

      if (direction === "vertical") {
        overflow = "overflowY";
        has = element.scrollHeight > element.clientHeight;
      } else if (direction === "horizontal") {
        overflow = "overflowX";
        has = element.scrollWidth > element.clientWidth;
      }

      // Check the overflow and overflowDirection properties for "auto" and "visible" values
      has = this.getStyle(this.container, "overflow") === "visible" ||
         this.getStyle(this.container, "overflowY") === "visible" ||
         (has && this.getStyle(this.container, "overflow") === "auto") ||
         (has && this.getStyle(this.container, "overflowY") === "auto");

      return has;
    }

    /**
     * Enables the scroll wheel of the mouse to scroll, specially for divs withour scrollbar
     * 
     * @param {MouseWheelEvent} e - the mouse wheel event
     * @return {void}
     */
    private activeMouseScroll (e: MouseWheelEvent) {

      if (!e) { e = (<any>window.event); }

      if (this.elementBehindCursorIsMe(e.clientX, e.clientY)) {

        let direction: string;

        if ("deltaY" in e) {
          direction = (<any>e).deltaY > 0 ? "down" : "up";
        } else if ("wheelDelta" in e) {
          direction = e.wheelDelta > 0 ? "up" : "down";
        } else {
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
        let x = this.getScrollLeft();
        let y = this.getScrollTop();

        if (this.options.wheelOptions.direction === "horizontal") {
          x = this.getScrollLeft() + (direction === "down" ? this.options.wheelOptions.step : this.options.wheelOptions.step * -1);
        } else if (this.options.wheelOptions.direction === "vertical") {
          y = this.getScrollTop() + (direction === "down" ? this.options.wheelOptions.step : this.options.wheelOptions.step * -1);
        }

        this.scrollTo(x, y, false);
      }
    }

    /**
     * Enables the scroll wheel of the mouse to zoom
     * 
     * @param {MouseWheelEvent} e - the mouse wheel event
     * @return {void}
     */
    private activeMouseZoom (e: MouseWheelEvent) {
      if (!e) { e = (<any>window.event); }
      if (this.elementBehindCursorIsMe(e.clientX, e.clientY)) {
        let direction: string;

        if ("deltaY" in e) {
          direction = (<any>e).deltaY > 0 ? "down" : "up";
        } else if ("wheelDelta" in e) {
          direction = e.wheelDelta > 0 ? "up" : "down";
        } else {
          return;
        }

        let scale;
        if (direction === this.options.zoomOptions.direction) {
          scale = this.getScale() * (1 + this.options.zoomOptions.step);
        } else {
          scale = this.getScale() / (1 + this.options.zoomOptions.step);
        }

        this.scaleTo(scale);
      }
    }

    /**
     * Calculates the size of the vertical scrollbar.
     * 
     * @param {HTMLElement} el - The HTMLElememnt
     * @return {number} - the amount of pixels used by the vertical scrollbar
     */
    private scrollbarWidth (el: HTMLElement) {
      return el.offsetWidth - el.clientWidth - parseInt(this.getStyle(el, "borderLeftWidth")) - parseInt(this.getStyle(el, "borderRightWidth"));
    }

    /**
     * Calculates the size of the horizontal scrollbar.
     * 
     * @param {HTMLElement} el - The HTMLElememnt
     * @return {number} - the amount of pixels used by the horizontal scrollbar
     */
    private scrollbarHeight (el: HTMLElement) {
      return el.offsetHeight - el.clientHeight - parseInt(this.getStyle(el, "borderTopWidth")) - parseInt(this.getStyle(el, "borderBottomWidth"));
    }

    /**
     * Retrieves the current scale value or 1 if it is not set.
     * 
     * @return {number} - the current scale value
     */
    private getScale () {
      if (typeof this.inner.style.transform !== "undefined") {
        let r = this.inner.style.transform.match(/scale\(([0-9,\.]+)\)/) || [""];
        return parseFloat(r[1]) || 1;
      }
      return 1;
    }

    /**
     * Scales the inner element by a relatice value based on the current scale value.
     * 
     * @param {number} percent - percentage of the current scale value
     * @param {boolean} honourLimits - whether to honour maxScale and the minimum width and height
     * of the container element.
     * @return {void}
     */
    public scaleBy (percent: number, honourLimits = true) {
      let scale = this.getScale() * (percent / 100);
      this.scaleTo(scale, honourLimits);
    }

    /**
     * Scales the inner element to an absolute value.
     * 
     * @param {number} scale - the scale
     * @param {boolean} honourLimits - whether to honour maxScale and the minimum width and height
     * of the container element.
     * @return {void}
     */
    public scaleTo (scale: number, honourLimits = true) {

      let width = (parseFloat(this.inner.style.minWidth) * scale);
      let height = (parseFloat(this.inner.style.minHeight) * scale);

      /* scrollbars have width and height too */
      let minWidth = this.container.clientWidth + this.scrollbarWidth(this.container);
      let minHeight = this.container.clientHeight + this.scrollbarHeight(this.container);

      if (honourLimits) {
        /* loop as long as all limits are honoured */
        while ( (scale > this.options.zoomOptions.maxScale && this.options.zoomOptions.maxScale !== 0) ||
                (scale < this.options.zoomOptions.minScale && this.options.zoomOptions.minScale !== 0) ||
                (width < this.container.clientWidth && !this.isBody) ||
                (height < this.container.clientHeight && !this.isBody) ) {

          if (scale > this.options.zoomOptions.maxScale) {
            scale = this.options.zoomOptions.maxScale;
          } else if (scale < this.options.zoomOptions.minScale) {
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
    }

    /**
     * Disables the scroll wheel of the mouse
     * 
     * @param {number} x - the x-coordinates
     * @param {number} y - the y-coordinates
     * @return {boolean} - whether the nearest related parent inner element is the one of this object instance
     */
    private elementBehindCursorIsMe (x: number, y: number) {
      let elementBehindCursor = <HTMLElement>document.elementFromPoint(x, y);

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
    }

    private getTimestamp () {
      if (typeof window.performance === "object") {
        if ("now" in window.performance) {
          return window.performance.now();
        } else if ("webkitNow" in window.performance) {
          return (<any>window.performance).webkitNow();
        }
      }
      return new Date().getTime();
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

      let x = this.getScrollLeft();
      let y = this.getScrollTop();
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
    }

    /**
     * window resize handler to recalculate the inner div minWidth and minHeight
     *
     * @param {Event} e - The window resize event object (TODO: needed?)
     * @return {void}
     */
    private onResize (e: Event) {

      let onResize = () => {
        this.inner.style.minWidth = null;
        this.inner.style.minHeight = null;

        /* take away the margin values of the body element */
        let xDelta = parseInt(this.getStyle(document.body, "marginLeft"), 10) + parseInt(this.getStyle(document.body, "marginRight"), 10);
        let yDelta = parseInt(this.getStyle(document.body, "marginTop"), 10) + parseInt(this.getStyle(document.body, "marginBottom"), 10);

        // TODO: with this.getBorder()
        this.inner.style.minWidth = (document.documentElement.scrollWidth - xDelta) + "px";
        this.inner.style.minHeight = (document.documentElement.scrollHeight - yDelta - 100) + "px"; // TODO: WTF? why -100 for IE8?
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
    }

    private clearTextSelection() {
      if ((<any>window).getSelection) { (<any>window).getSelection().removeAllRanges(); }
      if ((<any>document).selection) { (<any>document).selection.empty(); }
    }

    /**
     * Browser independent event registration
     * 
     * @param {any} obj - The HTMLElement to attach the event to
     * @param {string} event - The event name without the leading "on"
     * @param {(e: Event) => void} callback - A callback function to attach to the event
     * @param {boolean} bound - whether to bind the callback to the object instance or not
     * @return {void}
     */
    private addEventListener (obj: any, event: string, callback: (e: Event) => void, bound = true) {
      let boundCallback = bound ? callback.bind(this) : callback;

      if (typeof obj.addEventListener === "function") {
        if (mapEvents["on" + event] && obj.tagName === "BODY") {
          obj = mapEvents["on" + event];
        }
        obj.addEventListener(event, boundCallback);
      } else if (typeof (<any>obj).attachEvent === "object" && htmlEvents["on" + event]) { // MSIE: real events (e.g. 'click')
        (<any>obj).attachEvent("on" + event, boundCallback);
      } else if (typeof (<any>obj).attachEvent === "object" && mapEvents["on" + event]) {
        if (obj.tagName === "BODY") {
          let p = "on" + event;
          /* example: window.onscroll = boundCallback */
          mapEvents[p][p] = boundCallback;
        } else {
          /* TODO: obj.onscroll ?? */
          obj.onscroll = boundCallback;
        }
      } else if (typeof (<any>obj).attachEvent === "object") { // MSIE: custom event workaround
        obj[event] = 1;
        boundCallback = (e) => {
          /* TODO: e is the onpropertychange event not one of the custom event objects */
          if (e.propertyName === event) { callback(e); }
        };
        (<any>obj).attachEvent("onpropertychange", boundCallback);
      } else {
        obj["on" + event] = boundCallback;
      }

      if (!this.customEvents[event]) { this.customEvents[event] = []; }
      this.customEvents[event].push([callback, boundCallback]);

    }

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
    private removeEventListener (obj: any, event: string, callback: (e: Event) => void) {

      if (event in this.customEvents) {
        for (let i in this.customEvents[event]) {
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
      } else if (typeof (<any>obj).detachEvent === "object" && htmlEvents["on" + event]) { // MSIE: real events (e.g. 'click')
        (<any>obj).detachEvent("on" + event, callback);
      } else if (typeof (<any>obj).detachEvent === "object") { // MSIE: custom event workaround
        (<any>obj).detachEvent("onpropertychange", callback);
      } else {
        obj["on" + event] = null;
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
      let event: Event;

      if (typeof (<any>window).CustomEvent === "function") {
        event = new CustomEvent(eventName);
      } else if (typeof document.createEvent === "function") {
        event = document.createEvent("HTMLEvents");
        event.initEvent(eventName, true, true);
      } else if ((<any>document).createEventObject) { // IE < 9
        event = (<any>document).createEventObject();
        (<any>event).eventType = eventName;
      }

      (<any>event).eventName = eventName;
      if (obj.dispatchEvent) {
        obj.dispatchEvent(event);
      } else if (obj[eventName]) { // MSIE: custom events        
        obj[eventName]++;
      } else if ((<any>obj).fireEvent && htmlEvents["on" + eventName]) { // MSIE: only real events
        (<any>obj).fireEvent("on" + (<any>event).eventType, event);
      } else if (obj[eventName]) {
        obj[eventName]();
      } else if (obj["on" + eventName]) {
        obj["on" + eventName]();
      }

    }

    private addClass (el: HTMLElement, cssClass: string) {
      if (!this.hasClass(el, cssClass)) {
        el.className += " " + cssClass + " ";
      }
    }

    private removeClass (el: HTMLElement, cssClass: string) {
      let re = new RegExp(" " + cssClass + " ", "g");
      el.className = el.className.replace(re, "");
    }

    private hasClass (el: HTMLElement, cssClass: string) {
      let re = new RegExp(" " + cssClass + " ");
      return el.className.match(re) !== null;
    }

    /**
     * Get a css style property value browser independent
     * 
     * @param {HTMLElement} el - The HTMLElement to lookup
     * @param {string} jsProperty - The css property name in javascript in camelCase (e.g. "marginLeft", not "margin-left")
     * @return {string} - the property value
     */
    private getStyle (el: HTMLElement, jsProperty: string) {
        let cssProperty = jsProperty.replace(/([A-Z])/g, "-$1").toLowerCase();
        if (typeof window.getComputedStyle === "function") {
            return window.getComputedStyle(el).getPropertyValue(cssProperty);
        } else {
            return (<any>el).currentStyle[jsProperty];
        }
    }

    private clearTimeouts () {
      if (this.timeouts) {
        for (let i in this.timeouts) {
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
    }

    /**
     * Mouse down handler
     * Registers the mousemove and mouseup handlers and finds the next inner element
     *
     * @param {MouseEvent} e - The mouse down event object
     * @return {void}
     */
    private mouseDown (e: MouseEvent): void {

      this.clearTimeouts();

      /* drag only if the left mouse button was pressed */
      if (("which" in e && e.which === 1) || (typeof e.which === "undefined" && "button" in e && e.button === 1)) {

        if (this.elementBehindCursorIsMe(e.clientX, e.clientY)) {

          /* prevent image dragging action */
          let imgs = this.container.querySelectorAll("img");
          for (let i = 0; i < imgs.length; i++) {
            (<any>imgs[i]).ondragstart = function () { return false; }; // MSIE
            /* TODO: with own event attacher */
            // this.addEventListener(imgs[i], 'dragstart', function () {return false;});
          }

          /* search the DOM for exclude elements */
          if (this.options.dragOptions.exclude.length !== 0) {
            /* drag only if the mouse clicked on an allowed element */
            let el = <HTMLElement>document.elementFromPoint(e.clientX, e.clientY);
            let excludeElements = this.container.querySelectorAll(this.options.dragOptions.exclude.join(", "));

            /* loop through all parent elements until we encounter an inner div or no more parents */
            while (el && !this.hasClass(el, this.classInner)) {
              /* compare each parent, if it is in the exclude list */
              for (let a = 0; a < excludeElements.length; a++) {
                /* bail out if an element matches */
                if (excludeElements[a] === el) { return; }
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

          if (e.preventDefault) { e.preventDefault(); } else { e.returnValue = false; }
          this.vx = [];
          this.vy = [];

          /* register the event handlers */
          this.mouseMoveHandler = this.mouseMove.bind(this);
          this.addEventListener(document.documentElement, "mousemove", this.mouseMoveHandler);
          this.mouseUpHandler = (e) => this.mouseUp(e);
          this.addEventListener(document.documentElement, "mouseup", this.mouseUpHandler);

          /* TODO: MSIE text selection disable */
          // this.addEventListener(this.inner, 'selectstart', function(){return false;});
        }
      }
    }

    /**
     * Mouse up handler
     * Deregisters the mousemove and mouseup handlers
     *
     * @param {MouseEvent} e - The mouse up event object
     * @return {void}
     */
    private mouseUp (e: MouseEvent): void {

      /* TODO: restore original position value */
      this.inner.style.position = "";
      this.inner.style.top = null;
      this.inner.style.left = null;

      this.present = (this.getTimestamp() / 1000); // seconds

      let x = this.dragOriginLeft + this.dragOriginScrollLeft - e.clientX;
      let y = this.dragOriginTop + this.dragOriginScrollTop - e.clientY;
      [x, y] = this.getRealCoords(x, y);

      this.removeClass(document.body, this.classGrabbing);
      this.inner.parentElement.style.cssText = this.parentOriginStyle;
      this.dragging = false;

      this.removeEventListener(document.documentElement, "mousemove", this.mouseMoveHandler);
      this.removeEventListener(document.documentElement, "mouseup", this.mouseUpHandler);

      if (y !== this.getScrollTop() || x !== this.getScrollLeft()) {
        let t = this.present - (this.past ? this.past : this.present);
        if (t > 0.05) {
          /* just align to the grid if the mouse left unmoved for more than 0.05 seconds */
          this.scrollTo(x, y, this.options.dragOptions.fade);
        }
      }

      if (this.options.dragOptions.fade && typeof this.vx !== "undefined" && typeof this.vy !== "undefined") {

        let vx, vy;
        [vx, vy] = this.calcAverageVelocity(0.1);

        /* v should not exceed vMax or -vMax -> would be too fast and should exceed vMin or -vMin */
        let vMax = this.options.dragOptions.maxSpeed;
        let vMin = this.options.dragOptions.minSpeed;

        /* if the speed is not without bound for fade, just do a regular scroll when there is a grid*/
        if (vy < vMin && vy > -vMin && vx < vMin && vx > -vMin) {
          if (this.options.gridY > 1 || this.options.gridX > 1) {
            this.scrollTo(x, y);
          }
          return;
        }

        vx = (vx <= vMax && vx >= -vMax) ? vx : (vx > 0 ? vMax : -vMax);
        vy = (vy <= vMax && vy >= -vMax) ? vy : (vy > 0 ? vMax : -vMax);

        let ax = (vx > 0 ? -1 : 1) * this.options.dragOptions.brakeSpeed;
        let ay = (vy > 0 ? -1 : 1) * this.options.dragOptions.brakeSpeed;

        x = ((0 - Math.pow(vx, 2)) / (2 * ax)) + this.getScrollLeft();
        y = ((0 - Math.pow(vy, 2)) / (2 * ay)) + this.getScrollTop();

        this.scrollTo(x, y);
      } else {
        /* in all other cases, do a regular scroll */
        this.scrollTo(x, y, this.options.dragOptions.fade);
      }

    }

    private calcAverageVelocity (timeSpan: number) {
      let present = (this.getTimestamp() / 1000);
      let deltaT, deltaSx, deltaSy, lastDeltaSx, lastDeltaSy, lastT, lastSx, lastSy;
      deltaT = deltaSx = deltaSy = lastDeltaSx = lastDeltaSy = 0;
      lastT = lastSx = lastSy = undefined;
      for (let i in this.vy) {
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
      let vx = deltaT === 0 ? 0 : lastDeltaSx > 0 ? deltaSx / deltaT : deltaSx / -deltaT;
      let vy = deltaT === 0 ? 0 : lastDeltaSy > 0 ? deltaSy / deltaT : deltaSy / -deltaT;
      return [vx, vy];
    }

    /**
     * Calculates the rounded and scaled coordinates.
     *
     * @param {number} x - the x-coordinate
     * @param {number} y - the y-coordinate
     * @return {array} [x, y] - the final coordinates
     */
    private getRealCoords (x: number, y: number) {
      // stick the element to the grid, if grid equals 1 the value does not change
      x = Math.round(x / (this.options.gridX * this.getScale())) * (this.options.gridX * this.getScale());
      y = Math.round(y / (this.options.gridY * this.getScale())) * (this.options.gridY * this.getScale());
      let scrollMaxLeft = (this.scrollElement.scrollWidth - this.scrollElement.clientWidth);
      let scrollMaxTop = (this.scrollElement.scrollHeight - this.scrollElement.clientHeight);
      return [
        (x > scrollMaxLeft) ? scrollMaxLeft : x,
        (y > scrollMaxTop) ? scrollMaxTop : y
      ];
    }

    private timedScroll (x, y, t: number) {
      let me = this;
      this.timeouts.push(
        setTimeout(
          (function (x, y, me) {
            return function () {
              me.setScrollTop(y);
              me.setScrollLeft(x);
              me.originScrollLeft = x;
              me.originScrollTop = y;
            };
          }(x, y, me)), t
        )
      );
    }

    /**
     * Calculates each step of a scroll fadeout animation based on the initial velocity.
     * Stops any currently running scroll animation.
     *
     * @param {number} vx - the initial velocity in horizontal direction
     * @param {number} vy - the initial velocity in vertical direction
     * @return {number} - the final y-coordinate
     */
    private fadeOutByVelocity (vx: number, vy: number) {

      /* calculate the brake acceleration in both directions separately */
      let ay = (vy > 0 ? -1 : 1) * this.options.dragOptions.brakeSpeed;
      let ax = (vx > 0 ? -1 : 1) * this.options.dragOptions.brakeSpeed;

      /* find the direction that needs longer to stop, and recalculate the acceleration */
      let tmax = Math.max((0 - vy) / ay, (0 - vx) / ax);
      ax = (0 - vx) / tmax;
      ay = (0 - vy) / tmax;

      let sx, sy, t;
      let fps = this.options.dragOptions.fps;
      let i = 0;
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
      this.clearListenerLeft = () => this.clearTimeouts();
      this.clearListenerRight = () => this.clearTimeouts();
      this.clearListenerTop = () => this.clearTimeouts();
      this.clearListenerBottom = () => this.clearTimeouts();
      this.addEventListener(this.inner, "collide.left", this.clearListenerLeft);
      this.addEventListener(this.inner, "collide.right", this.clearListenerRight);
      this.addEventListener(this.inner, "collide.top", this.clearListenerTop);
      this.addEventListener(this.inner, "collide.bottom", this.clearListenerBottom);
    }

    private fadeOutByCoords(x: number, y: number) {

      [x, y] = this.getRealCoords(x, y);

      let a = this.options.dragOptions.brakeSpeed * -1;
      let vy = 0 - (2 * a * (y - this.getScrollTop()));
      let vx = 0 - (2 * a * (x - this.getScrollLeft()));
      vy = (vy > 0 ? 1 : -1) * Math.sqrt(Math.abs(vy));
      vx = (vx > 0 ? 1 : -1) * Math.sqrt(Math.abs(vx));

      let sx = x - this.getScrollLeft();
      let sy = y - this.getScrollTop();

      if (Math.abs(sy) > Math.abs(sx)) {
        vx = (vx > 0 ? 1 : -1) * Math.abs((sx / sy) * vy);
      } else {
        vy = (vy > 0 ? 1 : -1) * Math.abs((sy / sx) * vx);
      }

      this.clearTimeouts();
      this.fadeOutByVelocity(vx, vy);
    }


    /**
     * Mouse move handler
     * Calcucates the x and y deltas and scrolls
     *
     * @param {MouseEvent} e - The mouse move event object
     * @return {void}
     */
    private mouseMove (e: MouseEvent): void {

      this.present = (this.getTimestamp() / 1000); // seconds

      this.clearTextSelection();

      /* if the mouse left the window and the button is not pressed anymore, abort moving */
      if (("which" in e && e.which === 0) || (typeof e.which === "undefined" && "button" in e && e.button === 0)) {
        this.mouseUp(e);
        return;
      }
      let x = this.dragOriginLeft + this.dragOriginScrollLeft - e.clientX;
      let y = this.dragOriginTop + this.dragOriginScrollTop - e.clientY;

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
    }

    /**
     * scrollBy helper method to scroll by an amount of pixels in x- and y-direction
     *
     * @param {number} x - amount of pixels to scroll in x-direction
     * @param {number} y - amount of pixels to scroll in y-direction
     * @param {boolean} smooth - whether to scroll smooth or instant
     * @return {void}
     */
    public scrollBy (x: number, y: number, smooth = true) {
      let absoluteX = this.getScrollLeft() + x;
      let absoluteY = this.getScrollTop() + y;
      this.scrollTo(absoluteX, absoluteY, smooth);
    }

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
    public scrollTo (x: number, y: number, smooth = true) {

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
        } else {
          this.fadeOutByCoords(x, y);
        }
      }

    }

    /**
     * Register custom event callbacks
     *
     * @param {string} event - The event name
     * @param {(e: Event) => any} callback - A callback function to execute when the event raises
     * @return {Zwoosh} - The Zwoosh object instance
     */
    public on (event: string, callback: (e: Event) => any): Zwoosh {
      this.addEventListener(this.inner, event, callback);

      /* set the event untriggered and call the function, to retrigger met events */
      let f = event.replace(/\.([a-z])/, String.call.bind(event.toUpperCase)).replace(/\./, "");
      this.triggered[f] = false;
      this.onScroll();

      return this;
    }

    /**
     * Deregister custom event callbacks
     *
     * @param {string} event - The event name
     * @param {(e: Event) => any} callback - A callback function to execute when the event raises
     * @return {Zwoosh} - The Zwoosh object instance
     */
    public off (event: string, callback: (e: Event) => any): Zwoosh {
      this.removeEventListener(this.inner, event, callback);
      return this;
    }

    /**
     * Revert all DOM manipulations and deregister all event handlers
     * 
     * @return {void}
     * @TODO: removing wheelZoomHandler does not work
     */
    public destroy () {
      let x = this.getScrollLeft();
      let y = this.getScrollTop();

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
      for (let event in this.customEvents) {
        if (this.customEvents.hasOwnProperty(event)) {
          for (let p in this.customEvents[event]) {
            if (this.customEvents[event].hasOwnProperty(p)) {
              this.removeEventListener(this.inner, event, this.customEvents[event][p][0]);
            }
          }
        }
      }

      return;
    }

  }

  /* return an instance of the class */
  return new Zwoosh(container, options);
}

export = zwoosh;
