"use strict";
function toString(x) { return Object.prototype.toString.call(x); }
exports.toString = toString;
function isExisty(x) { return x !== undefined && x !== null; }
exports.isExisty = isExisty;
function isArray(x) { return toString(x) === '[object Array]'; }
exports.isArray = isArray;
function isObj(x) { return toString(x) === '[object Object]'; }
exports.isObj = isObj;
function checkExisty(x) {
    if (!isExisty(x))
        throw new TypeError("State can't contain null or undefined value");
}
function keysToObj(sourceKeys, value) {
    var keys = sourceKeys.concat();
    function co(key, val) {
        var obj = {};
        obj[key] = val;
        if (keys.length > 0) {
            keys.shift();
            return co(keys[0], obj);
        }
        return val;
    }
    return co(keys[0], value);
}
exports.keysToObj = keysToObj;
function deepFreeze(target) {
    var _this = this;
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
function deepAssign(source, target) {
    var obj = {};
    for (var key_1 in source)
        obj[key_1] = source[key_1];
    Object.seal(obj);
    for (var key_2 in target) {
        if (Object.prototype.toString.call(target[key_2]) === "[object Object]") {
            obj[key_2] = deepAssign(source[key_2], target[key_2]);
        }
        else {
            checkExisty(target[key_2]);
            obj[key_2] = target[key_2];
        }
    }
    return Object.freeze(obj);
}
exports.deepAssign = deepAssign;
//# sourceMappingURL=utility.js.map