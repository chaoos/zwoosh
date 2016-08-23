(function (factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        var v = factory(require, exports); if (v !== undefined) module.exports = v;
    }
    else if (typeof define === 'function' && define.amd) {
        define(["require", "exports", '../swoosh'], factory);
    }
})(function (require, exports) {
    "use strict";
    var swoosh_1 = require('../swoosh');
    window.onload = function () {
        var div2 = document.getElementById("div2");
        var div3 = document.getElementById("div3");
        var basics = swoosh_1["default"](document.getElementById("basics"));
        var log = document.getElementById("log");
        var events = swoosh_1["default"](document.getElementById("events"))
            .on('collide.left', function (e) {
            log.innerHTML += "collide.left Event triggered<br>";
        })
            .on('collide.top', function (e) {
            log.innerHTML += "collide.top Event triggered<br>";
        })
            .on('collide.right', function (e) {
            log.innerHTML += "collide.right Event triggered<br>";
        })
            .on('collide.bottom', function (e) {
            log.innerHTML += "collide.bottom Event triggered<br>";
        });
        /*
        var ex3_log = document.getElementById("ex3_log");
        var s3 = null;
        document.getElementById("ex3_toogle").onclick = () => {
          if (s3 == null) {
            s3 = swoosh(document.getElementById("ex3_div"), {
              elasticEgdes: {
                left:50,
                right:50,
                top:50,
                bottom:50,
              },
            })
            .on('collide.left', function(e){
              ex3_log.innerHTML += "collide.left Event triggered<br>"
            })
            .on('collide.top', function(e){
              ex3_log.innerHTML += "collide.top Event triggered<br>"
            })
            .on('collide.right', function(e){
              ex3_log.innerHTML += "collide.right Event triggered<br>"
            })
            .on('collide.bottom', function(e){
              ex3_log.innerHTML += "collide.bottom Event triggered<br>"
            });
          } else {
            s3.destroy();
            s3 = null;
          }
        };*/
        var nest_outer = swoosh_1["default"](document.getElementById("nest_outer"));
        /*var s4 = swoosh(document.getElementById("nest_outer"), {
          elasticEgdes: {
            left:100,
            right:100,
            top:200,
            bottom:200,
          },
          wheelOptions: { direction: 'horizontal' },
        });*/
        var nest_inner = swoosh_1["default"](document.getElementById("nest_inner"));
        var custom = swoosh_1["default"](document.getElementById("custom"));
        document.getElementById("scrollBy").onclick = function () {
            custom.scrollBy(50, 50, true);
        };
        document.getElementById("scrollTo").onclick = function () {
            custom.scrollTo(100, 100, true);
        };
        document.getElementById("scaleTo").onclick = function () {
            custom.scaleTo(2);
        };
        document.getElementById("scaleBy").onclick = function () {
            custom.scaleBy(90);
        };
        document.getElementById("reinit").onclick = function () {
            custom.reinit();
        };
        document.getElementById("destroy").onclick = function () {
            custom.destroy();
        };
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
        function activeOption(swooshElement, option, reinit) {
            if (reinit === void 0) { reinit = false; }
            var el = document.getElementById(option);
            var type = eval("typeof swooshElement.options." + option);
            //console.log(option, " is ", type)
            if (type == 'number') {
                el.value = eval("swooshElement.options." + option);
                el.onkeyup = function () {
                    if ((option == 'gridX' || option == 'gridY') && swooshElement.options.gridShow) {
                        reinit = true;
                    }
                    else {
                        reinit = false;
                    }
                    console.log(option, reinit);
                    eval("swooshElement.options." + option + " = " + parseFloat(el.value) + ";");
                    document.getElementById("optionsJson").innerHTML = JSON.stringify(diff(swooshElement.options, basics.options), null, 2);
                    reinit == true ? swooshElement.reinit() : null;
                };
            }
            else if (type == 'string') {
                el.value = eval("swooshElement.options." + option);
                el.onclick = function () {
                    var value = el.options[el.selectedIndex].value;
                    eval("swooshElement.options." + option + " = '" + value + "';");
                    document.getElementById("optionsJson").innerHTML = JSON.stringify(diff(swooshElement.options, basics.options), null, 2);
                    reinit == true ? swooshElement.reinit() : null;
                };
            }
            else if (type == 'boolean') {
                el.checked = eval("swooshElement.options." + option);
                el.onclick = function () {
                    eval("swooshElement.options." + option + " = " + el.checked + ";");
                    document.getElementById("optionsJson").innerHTML = JSON.stringify(diff(swooshElement.options, basics.options), null, 2);
                    reinit == true ? swooshElement.reinit() : null;
                };
            }
        }
        function diff(obj1, obj2) {
            var diff = {};
            for (var p in obj2) {
                if (typeof (obj1[p]) == 'object' && typeof (obj2[p]) == 'object') {
                    for (var i in obj2[p]) {
                        if (JSON.stringify(obj1[p][i]) != JSON.stringify(obj2[p][i])) {
                            diff[p] = diff[p] ? diff[p] : {};
                            diff[p][i] = obj1[p][i];
                        }
                    }
                }
                else {
                    if (JSON.stringify(obj1[p]) != JSON.stringify(obj2[p])) {
                        diff[p] = obj1[p];
                    }
                }
            }
            return diff;
        }
        var edges = swoosh_1["default"](document.getElementById("edges"), {
            elasticEdges: {
                left: true,
                top: true,
                right: true,
                bottom: true
            }
        });
        var wheelzoom = swoosh_1["default"](document.getElementById("wheelzoom"), {
            gridX: 100,
            gridY: 50,
            gridShow: true,
            wheelScroll: false,
            wheelZoom: true
        });
        var anchors = swoosh_1["default"](document.getElementById("anchors"));
        var body = swoosh_1["default"](document.body);
    };
});
//# sourceMappingURL=example.js.map