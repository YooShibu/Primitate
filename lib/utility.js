"use strict";
function toString(x) { return Object.prototype.toString.call(x); }
exports.toString = toString;
function isExisty(x) { return x !== undefined && x !== null; }
exports.isExisty = isExisty;
function isArray(x) { return toString(x) === '[object Array]'; }
exports.isArray = isArray;
function isObj(x) { return toString(x) === '[object Object]'; }
exports.isObj = isObj;
function deepFreeze(target) {
    var _this = this;
    function checkExisty(x) {
        if (!isExisty(x))
            throw new TypeError("State can't contain null or undefined value");
    }
    checkExisty(target);
    if (typeof target !== "object")
        return target;
    Object.freeze(target);
    if (isObj(target)) {
        for (var key in target) {
            var value = target[key];
            if (target.hasOwnProperty(key) && typeof value === "object")
                this.deepFreeze(value);
            else
                checkExisty(value);
        }
        return target;
    }
    if (isArray(target)) {
        target.forEach(function (value) {
            if (typeof value === "object")
                _this.deepFreeze(value);
            else
                checkExisty(value);
        });
        return target;
    }
    throw new TypeError(["State can include primitive values or [object Object] or [object Array].",
        ("But you included " + toString(target) + " in the state")].join(" "));
}
exports.deepFreeze = deepFreeze;
function deepClone(target) {
    if (isObj(target)) {
        var obj = {};
        for (var key in target) {
            var value = target[key];
            if (target.hasOwnProperty(key)) {
                if (isObj(value) || isArray(value))
                    obj[key] = deepClone(value);
                else
                    obj[key] = value;
            }
        }
        return obj;
    }
    if (isArray(target)) {
        var arr = [];
        var length_1 = target.length;
        for (var i = 0; i < length_1; i++) {
            var value = target[i];
            if (isObj(value) || isArray(value))
                arr.push(deepClone(value));
            else
                arr.push(value);
        }
        return arr;
    }
    return target;
}
exports.deepClone = deepClone;
//# sourceMappingURL=utility.js.map