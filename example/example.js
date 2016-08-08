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
    var div2 = document.getElementById("div2");
    var div3 = document.getElementById("div3");
    var body = document.body;
    var s6 = swoosh_1["default"](body, {
        elasticEgdes: {
            left: 0,
            right: 0
        }
    });
    swoosh_1["default"](document.getElementById("ex1_div"));
    var ex3_log = document.getElementById("ex3_log");
    var s3 = null;
    document.getElementById("ex3_toogle").onclick = function () {
        if (s3 == null) {
            s3 = swoosh_1["default"](document.getElementById("ex3_div"), {
                elasticEgdes: {
                    left: 50,
                    right: 50,
                    top: 50,
                    bottom: 50
                }
            })
                .on('collideLeft', function (e) {
                ex3_log.innerHTML += "collideLeft Event triggered<br>";
            })
                .on('collideTop', function (e) {
                ex3_log.innerHTML += "collideTop Event triggered<br>";
            })
                .on('collideRight', function (e) {
                ex3_log.innerHTML += "collideRight Event triggered<br>";
            })
                .on('collideBottom', function (e) {
                ex3_log.innerHTML += "collideBottom Event triggered<br>";
            });
        }
        else {
            s3.destroy();
            s3 = null;
        }
    };
    var s4 = swoosh_1["default"](div2, {
        elasticEgdes: {
            left: 100,
            right: 100,
            top: 200,
            bottom: 200
        },
        wheelOptions: { direction: 'horizontal' }
    });
    var s5 = swoosh_1["default"](div3, {});
});
//# sourceMappingURL=example.js.map