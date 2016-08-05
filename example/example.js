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
    var div1 = document.getElementById("div1");
    var div2 = document.getElementById("div2");
    var div3 = document.getElementById("div3");
    var body = document.body;
    var s4 = swoosh_1["default"](body, {
        elasticEgdes: {
            left: 0,
            right: 0,
            top: 50,
            bottom: 50
        }
    });
    var s1 = swoosh_1["default"](div1, {
        grid: 50,
        callback: function (e) {
            console.log('inside the options callback, obj-instance: ', this, 'event: ', e);
            return true;
        } })
        .on('collideLeft', function (e) {
        console.log('inside 2nd callback (collideLeft event): instance: ', this, 'event: ', e);
        return true;
    })
        .on('collideTop', function (e) {
        console.log('inside 2nd callback (collideTop event): instance: ', this, 'event: ', e);
        return true;
    })
        .on('collideRight', function (e) {
        console.log('inside 2nd callback (collideRight event): instance: ', this, 'event: ', e);
        return true;
    })
        .on('collideBottom', function (e) {
        console.log('inside 2nd callback (collideBottom event): instance: ', this, 'event: ', e);
        return true;
    });
    var s2 = swoosh_1["default"](div2, {
        elasticEgdes: {
            left: 100,
            right: 100,
            top: 200,
            bottom: 200
        }
    });
    var s3 = swoosh_1["default"](div3, {});
});
//# sourceMappingURL=example.js.map