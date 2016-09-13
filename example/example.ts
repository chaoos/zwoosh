/**
 * If you're using typescript you can import the module with:
 * import zwoosh = require("../zwoosh");
 */

/* needed to suppress Typescript compiler errors TS2304, saying "cannot find zwoosh" */
declare var zwoosh: any;

window.onload = function () {


  let basics = zwoosh(document.getElementById("basics"));

  let log = document.getElementById("log");
  zwoosh(document.getElementById("events"))
    .on("collide.left", function(e){
      log.innerHTML += "collide.left Event triggered<br>";
    })
    .on("collide.top", function(e){
      log.innerHTML += "collide.top Event triggered<br>";
    })
    .on("collide.right", function(e){
      log.innerHTML += "collide.right Event triggered<br>";
    })
    .on("collide.bottom", function(e){
      log.innerHTML += "collide.bottom Event triggered<br>";
    });

  zwoosh(document.getElementById("nest_outer"));

  zwoosh(document.getElementById("nest_inner"));

  let custom = zwoosh(document.getElementById("custom"));
  document.getElementById("scrollBy").onclick = () => {
    custom.scrollBy(50, 50);
  };

  document.getElementById("scrollTo").onclick = () => {
    custom.scrollTo(100, 100);
  };

  document.getElementById("scaleTo").onclick = () => {
    custom.scaleTo(2);
  };

  document.getElementById("scaleBy").onclick = () => {
    custom.scaleBy(90);
  };

  document.getElementById("reinit").onclick = () => {
    custom.reinit();
  };

  document.getElementById("destroy").onclick = () => {
    custom.destroy();
  };

  activeOption(custom, "gridX");
  activeOption(custom, "gridY");
  activeOption(custom, "gridShow", true);

  activeOption(custom, "elasticEdges.left");
  activeOption(custom, "elasticEdges.top");
  activeOption(custom, "elasticEdges.right");
  activeOption(custom, "elasticEdges.bottom");

  activeOption(custom, "dragScroll", true);
  activeOption(custom, "dragOptions.minSpeed");
  activeOption(custom, "dragOptions.maxSpeed");
  activeOption(custom, "dragOptions.brakeSpeed");
  activeOption(custom, "dragOptions.fps");
  activeOption(custom, "dragOptions.fade");

  activeOption(custom, "wheelScroll", true);
  activeOption(custom, "wheelOptions.direction");
  activeOption(custom, "wheelOptions.step");
  activeOption(custom, "wheelOptions.smooth");

  activeOption(custom, "wheelZoom", true);
  activeOption(custom, "zoomOptions.minScale");
  activeOption(custom, "zoomOptions.maxScale");
  activeOption(custom, "zoomOptions.step");
  activeOption(custom, "zoomOptions.direction");

  activeOption(custom, "handleAnchors", true);

  let json = document.getElementById("optionsJson");
  json.innerHTML = JSON.stringify(diff(custom.options, basics.options), null, 2);

  function activeOption (zwooshElement: any, option: string, reinit = false) {
    let type;
    let el = document.getElementById(option);
    let opts = option.split(".");
    if (opts.length === 1) {
      type = typeof zwooshElement.options[option];
    } else {
      type = typeof zwooshElement.options[opts[0]][opts[1]];
    }
    if (type === "number") {
      (<any>el).value = eval("zwooshElement.options." + option);
      el.onkeyup = () => {
        if ((option === "gridX" || option === "gridY") && zwooshElement.options.gridShow) { reinit = true; } else { reinit = false; }
        eval("zwooshElement.options." + option + " = " + parseFloat((<any>el).value) + ";");
        json.innerHTML = JSON.stringify(diff(zwooshElement.options, basics.options), null, 2);
        if (reinit === true) { zwooshElement.reinit(); }
      };
    } else if (type === "string") {
      (<any>el).value = eval("zwooshElement.options." + option);
      el.onclick = () => {
        let value = (<any>el).options[(<any>el).selectedIndex].value;
        eval("zwooshElement.options." + option + " = '" + value + "';");
        json.innerHTML = JSON.stringify(diff(zwooshElement.options, basics.options), null, 2);
        if (reinit === true) { zwooshElement.reinit(); }
      };
    } else if (type === "boolean") {
      (<any>el).checked = eval("zwooshElement.options." + option);
      el.onclick = () => {
        eval("zwooshElement.options." + option + " = " + (<any>el).checked + ";");
        json.innerHTML = JSON.stringify(diff(zwooshElement.options, basics.options), null, 2);
        if (reinit === true) { zwooshElement.reinit(); }
      };
    }
  }

  function diff (obj1, obj2) {
    let d = {};
    for (let p in obj2) {
      if (typeof (obj1[p]) === "object" && typeof (obj2[p]) === "object") {
        for (let i in obj2[p]) {
          if (JSON.stringify(obj1[p][i]) !== JSON.stringify(obj2[p][i])) {
            d[p] = d[p] ? d[p] : {};
            d[p][i] = obj1[p][i];
          }
        }
      } else if (JSON.stringify(obj1[p]) !== JSON.stringify(obj2[p])) {
        d[p] = obj1[p];
      }
    }
    return d;
  }

  zwoosh(document.getElementById("edges"), {
    elasticEdges: {
      left: true,
      top: true,
      right: true,
      bottom: true,
    }
  });

  zwoosh(document.getElementById("wheelzoom"), {
    gridX: 100,
    gridY: 50,
    gridShow: true,
    wheelScroll: false,
    wheelZoom: true,
  });

  zwoosh(document.getElementById("anchors"));

  zwoosh(document.body);

};