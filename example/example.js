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
        var s7 = swoosh_1["default"](document.body);
        var s1 = swoosh_1["default"](document.getElementById("ex1_div"));
        document.getElementById("scrollDown").onclick = function () {
            s1.scrollBy(0, 300, true);
        };
        document.getElementById("scrollUp").onclick = function () {
            s1.scrollBy(0, -100, true);
        };
        document.getElementById("optionTest").onclick = function () {
            s1.options.dragScroll = s1.options.dragScroll ? false : true;
            s1.reinit();
        };
        document.getElementById("optionTest2").onclick = function () {
            s1.options.wheelScroll = s1.options.wheelScroll ? false : true;
            s1.reinit();
        };
        var ex3_log = document.getElementById("ex3_log");
        var s3 = null;
        document.getElementById("scrollToTop").onclick = function () {
            s7.scrollTo(0, 0, true);
        };
        document.getElementById("scrollToBottom").onclick = function () {
            s7.scrollTo(0, 2000, true);
        };
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
                    .on('collide.left', function (e) {
                    ex3_log.innerHTML += "collide.left Event triggered<br>";
                })
                    .on('collide.top', function (e) {
                    ex3_log.innerHTML += "collide.top Event triggered<br>";
                })
                    .on('collide.right', function (e) {
                    ex3_log.innerHTML += "collide.right Event triggered<br>";
                })
                    .on('collide.bottom', function (e) {
                    ex3_log.innerHTML += "collide.bottom Event triggered<br>";
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
        var s6 = swoosh_1["default"](document.getElementById("ex5_div"), {
            gridX: 100,
            gridY: 50,
            gridShow: true,
            wheelScroll: false,
            wheelZoom: true
        });
    };
});
//# sourceMappingURL=example.js.map