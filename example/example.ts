/**
 * If you're using typescript you can import the module with:
 * import swoosh from '../swoosh'
 */

/* needed to suppress tsc errors TS2304, saying "cannot find swoosh" */
declare var swoosh: any;

window.onload = function () {

  var basics = swoosh(document.getElementById("basics"));

  var log = document.getElementById("log");
  swoosh(document.getElementById("events"))
    .on('collide.left', function(e){
      log.innerHTML += "collide.left Event triggered<br>"
    })
    .on('collide.top', function(e){
      log.innerHTML += "collide.top Event triggered<br>"
    })
    .on('collide.right', function(e){
      log.innerHTML += "collide.right Event triggered<br>"
    })
    .on('collide.bottom', function(e){
      log.innerHTML += "collide.bottom Event triggered<br>"
    });

  swoosh(document.getElementById("nest_outer"));

  swoosh(document.getElementById("nest_inner"));

  var custom = swoosh(document.getElementById("custom"));
  document.getElementById("scrollBy").onclick = () => {
    custom.scrollBy(50, 50);
  }

  document.getElementById("scrollTo").onclick = () => {
    custom.scrollTo(100, 100);
  }

  document.getElementById("scaleTo").onclick = () => {
    custom.scaleTo(2);
  }

  document.getElementById("scaleBy").onclick = () => {
    custom.scaleBy(90);
  }

  document.getElementById("reinit").onclick = () => {
    custom.reinit();
  }

  document.getElementById("destroy").onclick = () => {
    custom.destroy();
  }

  activeOption(custom, 'gridX');
  activeOption(custom, 'gridY');
  activeOption(custom, 'gridShow', true);

  activeOption(custom, 'elasticEdges.left');
  activeOption(custom, 'elasticEdges.top');
  activeOption(custom, 'elasticEdges.right');
  activeOption(custom, 'elasticEdges.bottom');

  activeOption(custom, 'dragScroll', true);
  activeOption(custom, 'dragOptions.minSpeed');
  activeOption(custom, 'dragOptions.maxSpeed');
  activeOption(custom, 'dragOptions.brakeSpeed');
  activeOption(custom, 'dragOptions.fps');
  activeOption(custom, 'dragOptions.fade');

  activeOption(custom, 'wheelScroll', true);
  activeOption(custom, 'wheelOptions.direction');
  activeOption(custom, 'wheelOptions.step');
  activeOption(custom, 'wheelOptions.smooth');

  activeOption(custom, 'wheelZoom', true);
  activeOption(custom, 'zoomOptions.minScale');
  activeOption(custom, 'zoomOptions.maxScale');
  activeOption(custom, 'zoomOptions.step');
  activeOption(custom, 'zoomOptions.direction');

  activeOption(custom, 'handleAnchors', true);

  document.getElementById("optionsJson").innerHTML = JSON.stringify(diff(custom.options, basics.options), null, 2);

  function activeOption (swooshElement: any, option: string, reinit = false) {
    var el = document.getElementById(option);
    var type = eval("typeof swooshElement.options." + option);
    //console.log(option, " is ", type)
    if (type == 'number') {
      (<any>el).value = eval("swooshElement.options." + option);
      el.onkeyup = () => {
        if ((option == 'gridX' || option == 'gridY') && swooshElement.options.gridShow) {reinit = true;} else {reinit = false;}
        eval("swooshElement.options." + option + " = " + parseFloat((<any>el).value) + ";");
        document.getElementById("optionsJson").innerHTML = JSON.stringify(diff(swooshElement.options, basics.options), null, 2);
        reinit == true ? swooshElement.reinit() : null;
      }
    } else if (type == 'string') {
      (<any>el).value = eval("swooshElement.options." + option);
      el.onclick = () => {
        var value = (<any>el).options[(<any>el).selectedIndex].value;
        eval("swooshElement.options." + option + " = '" + value + "';");
        document.getElementById("optionsJson").innerHTML = JSON.stringify(diff(swooshElement.options, basics.options), null, 2);
        reinit == true ? swooshElement.reinit() : null;
      }
    } else if (type == 'boolean') {
      (<any>el).checked = eval("swooshElement.options." + option);
      el.onclick = () => {
        eval("swooshElement.options." + option + " = " + (<any>el).checked + ";");
        document.getElementById("optionsJson").innerHTML = JSON.stringify(diff(swooshElement.options, basics.options), null, 2);
        reinit == true ? swooshElement.reinit() : null;
      }    
    }
  }

  function diff (obj1, obj2) {
    var diff = {};
    for(var p in obj2){
      if (typeof (obj1[p]) == 'object' && typeof (obj2[p]) == 'object'){
        for(var i in obj2[p]){
          if (JSON.stringify(obj1[p][i]) != JSON.stringify(obj2[p][i])) {
            diff[p] = diff[p] ? diff[p] : {};
            diff[p][i] = obj1[p][i];
          }
        }
      } else {
        if (JSON.stringify(obj1[p]) != JSON.stringify(obj2[p])) {
          diff[p] = obj1[p];
        }
      }
    }
    return diff;
  }

  swoosh(document.getElementById("edges"), {
    elasticEdges: {
      left: true,
      top: true,
      right: true,
      bottom: true,
    }
  });

  swoosh(document.getElementById("wheelzoom"), {
    gridX: 100,
    gridY: 50,
    gridShow: true,
    wheelScroll: false,
    wheelZoom: true,
  });

  swoosh(document.getElementById("anchors"));

  swoosh(document.body);

}