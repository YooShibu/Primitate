"use strict";
var utility_1 = require("./utility");
var TimeTraveler = (function () {
    function TimeTraveler(memorize, remember, subscriber) {
        var _this = this;
        this.remember = remember;
        this.index = 0;
        this.isTravering = false;
        this.memories = [];
        this.listeners = [];
        this.unsubscribe = subscriber(function (state) {
            if (!_this.isTravering) {
                if (_this.index > 0) {
                    _this.memories.splice(0, _this.index);
                    _this.index = 0;
                }
                var memory = memorize(state);
                if (memory !== undefined && memory !== null) {
                    _this.memories.unshift(utility_1.deepFreeze(memory));
                }
            }
            var ts = _this.createTravelerState();
            _this.listeners
                .forEach(function (listener) { return listener(ts); });
        });
    }
    TimeTraveler.prototype.createTravelerState = function () {
        var travelerState = { index: this.index,
            canBackToThePast: this.index + 1 !== this.memories.length,
            canBackToTheFuture: this.index > 0,
            memories: [].concat(this.memories)
        };
        return travelerState;
    };
    TimeTraveler.prototype.subscribe = function (listener) {
        this.listeners.push(listener);
        listener(this.createTravelerState());
        return this.endTravel();
    };
    TimeTraveler.prototype.tellMyMemories = function (listener) {
        var _this = this;
        return function (arg) {
            return listener([].concat(_this.memories), arg);
        };
    };
    TimeTraveler.prototype.back = function (canBack, num) {
        var _this = this;
        return function () {
            if (_this.memories.length === 0 || !canBack(_this.createTravelerState()))
                return false;
            _this.index = _this.index + num;
            if (_this.index === Infinity)
                throw new Error("I can not remember Infinity of memories.");
            _this.isTravering = true;
            _this.remember(_this.memories[_this.index]);
            _this.isTravering = false;
            return true;
        };
    };
    TimeTraveler.prototype.backToThePast = function () {
        return this.back(function (travelerState) { return travelerState.canBackToThePast; }, 1);
    };
    TimeTraveler.prototype.backToTheFuture = function () {
        return this.back(function (travelerState) { return travelerState.canBackToTheFuture; }, -1);
    };
    TimeTraveler.prototype.endTravel = function () {
        var _this = this;
        return function () {
            _this.unsubscribe();
            _this.memories = [];
            _this.index = 0;
            _this.listeners = [];
        };
    };
    return TimeTraveler;
}());
exports.__esModule = true;
exports["default"] = TimeTraveler;
//# sourceMappingURL=TimeTraveler.js.map