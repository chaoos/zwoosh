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

/* missing typescript definition for ObjectConstructor */
interface ObjectCtor extends ObjectConstructor {
  assign(target: any, ...sources: any[]): any;
}
declare var Object: ObjectCtor;

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

    /* mouse event handlers */
    private mouseMoveHandler: (e: MouseEvent) => void;
    private mouseUpHandler: (e: MouseEvent) => void;
    private mouseDownHandler: (e: MouseEvent) => void;

    constructor(
      private container: HTMLElement,
      private options: Options) {

      this.container = container;

      /* set default options */
      this.options = {
        grid: 1, //do not align to a grid
        elasticEgdes: {
          left:50,
          right:50,
          top:50,
          bottom:50,
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

      this.mouseDownHandler = (e) => this.mouseDown(e);
      this.inner.addEventListener('mousedown', this.mouseDownHandler);
    }

    private mouseDown (e: MouseEvent): void {
      var elementBehindCursor = <HTMLElement>document.elementFromPoint(e.clientX, e.clientY);
      
      /* find the next parent which is an inner element */
      while (elementBehindCursor && !elementBehindCursor.classList.contains('inner')) {
        elementBehindCursor = elementBehindCursor.parentElement;
      }

      if (this.inner == elementBehindCursor) { //TODO: not everytime
        this.inner.className += ' grabbing';

        /* note the origin positions */
        this.dragOriginLeft = e.clientX;
        this.dragOriginTop = e.clientY;
        this.dragOriginScrollLeft = this.scrollElement.scrollLeft;
        this.dragOriginScrollTop = this.scrollElement.scrollTop;

        /* it looks strane if scroll-behavior is set to smooth */
        this.parentOriginStyle = this.inner.parentElement.style.cssText;
        this.inner.parentElement.style.setProperty('scroll-behavior', 'auto');

        this.mouseMoveHandler = this.mouseMove.bind(this)
        document.addEventListener('mousemove', this.mouseMoveHandler);

        this.mouseUpHandler = (e) => this.mouseUp(e);
        document.addEventListener('mouseup', this.mouseUpHandler);
      }      
    }

    private mouseUp (e: MouseEvent): void {
      //stick the element to the grid
      var x = Math.round((this.dragOriginLeft + this.dragOriginScrollLeft - e.clientX)/this.options.grid)*this.options.grid
      var y = Math.round((this.dragOriginTop + this.dragOriginScrollTop - e.clientY)/this.options.grid)*this.options.grid;

      var scrollMaxLeft = (this.scrollElement.scrollWidth - this.scrollElement.clientWidth) - this.options.elasticEgdes.left;
      var scrollMaxTop = (this.scrollElement.scrollHeight - this.scrollElement.clientHeight) - this.options.elasticEgdes.top;
      x = (x > scrollMaxLeft) ? scrollMaxLeft : (x < this.options.elasticEgdes.left) ? this.options.elasticEgdes.left : x;
      y = (y > scrollMaxTop) ? scrollMaxTop : (y < this.options.elasticEgdes.top) ? this.options.elasticEgdes.top : y;


      this.inner.className = this.inner.className.replace(/\b grabbing\b/,'');
      this.inner.parentElement.style.cssText = this.parentOriginStyle;

      this.scrollTo(x, y);

      document.removeEventListener('mousemove', this.mouseMoveHandler);
      document.removeEventListener('mouseup', this.mouseUpHandler);
    }

    private mouseMove (e: MouseEvent): void {
      e.preventDefault();
      var x = this.dragOriginLeft + this.dragOriginScrollLeft - e.clientX;
      var y = this.dragOriginTop + this.dragOriginScrollTop - e.clientY;

      this.scrollTo(x, y);
    }

    /* scroll helper method */
    private scrollTo (x: number, y: number) {

      var scrollMaxLeft = (this.scrollElement.scrollWidth - this.scrollElement.clientWidth);
      var scrollMaxTop = (this.scrollElement.scrollHeight - this.scrollElement.clientHeight);

      /* no negative values or greater than the maximum */
      var x = (x > scrollMaxLeft) ? scrollMaxLeft : (x < 0) ? 0 : x;
      var y = (y > scrollMaxTop) ? scrollMaxTop : (y < 0) ? 0 : y;

      /* remember the old values */
      this.originScrollLeft = this.scrollElement.scrollLeft;
      this.originScrollTop = this.scrollElement.scrollTop;      

      (<any>this.scrollElement).scrollTo(x, y);

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
    }

    /* method to register custom event callbacks */
    public on (event: string, callback: (e: Event) => any): Swoosh {
      console.log('on() event callback register', event);
      this.inner.addEventListener(event, callback.bind(this));
      return this;
    }

    private always() { console.log('always()'); return true; }

  }

  /* return an instance of the object */
  return new Swoosh(container, options);
}
