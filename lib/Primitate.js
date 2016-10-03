"use strict";
var utility_1 = require("./utility");
function startPrimitate(initialState) {
    var P_KEY = "PrimitateKey";
    var state;
    var Keys = createKeys(initialState);
    var Listeners = {};
    var pickers = {};
    function createKeys(target) {
        var keysArr = [];
        function ck(target) {
            var obj = {};
            for (var key in target) {
                obj[key] = {};
                obj[key][P_KEY] = key;
                if (Object.prototype.toString.call(target[key]) === "[object Object]") {
                    keysArr.push(key);
                    var subKeys = ck(target[key]);
                    for (var subKey in subKeys) {
                        subKeys[subKey][P_KEY] = keysArr.concat(subKeys[subKey][P_KEY]).reverse().join(".");
                        obj[key][subKey] = subKeys[subKey];
                    }
                    keysArr.pop();
                }
            }
            return obj;
        }
        return ck(target);
    }
    /**
     * Create a function returns the current state.
     *
     * @template U
     * @param {(state: T) => U} pick - Get the root value of the state's Object tree.
     */
    function createAction(pick) {
        var keysArr = pick(Keys)[P_KEY].split(".");
        var key_Keys = keysArr.concat().reverse();
        var iniState = pick(initialState);
        return function (action) {
            return function (next) {
                var prevState = pick(state);
                var result = action(prevState, next, iniState, state);
                state = utility_1.deepAssign(state, utility_1.keysToObj(keysArr, result));
                for (var key_Listener in Listeners)
                    if (key_Keys[0] === key_Listener.split(".")[0])
                        Listeners[key_Listener].forEach(function (listener) { return listener(state); });
                return { value: function () { return utility_1.deepClone(result); } };
            };
        };
    }
    /**
     * When state changed, listener will called.
     *
     * @template U
     * @param {(state: T) => U} pick - Emit listener when U changed.
     */
    function subscribe() {
        var picks = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            picks[_i - 0] = arguments[_i];
        }
        var keys = picks.map(function (pick) {
            return pick(Keys)[P_KEY].split(".").reverse().join(".");
        });
        return function (listener) {
            keys.forEach(function (key) {
                if (!Listeners.hasOwnProperty(key))
                    Listeners[key] = [listener];
                else
                    Listeners[key].push(listener);
            });
            listener(state);
            return function () {
                keys.forEach(function (key) {
                    var lisArr = Listeners[key];
                    var index = lisArr.indexOf(listener);
                    if (index > -1)
                        lisArr.splice(index, 1);
                    if (lisArr.length === 0)
                        delete Listeners[key];
                });
            };
        };
    }
    /**
     * Create Addon and pass the state type
     *
     * @template U
     * @param {(
     * 		createAction: <V>(pick: (state: T) => V) => <W>(previousState: V, next?: W, initialState?: V) => V
     * 	, subscribe: <V>(pick: (state: T) => V) => (listener: V) => () => void ) => U} addon
     * @returns
     */
    function applyAddon(addon) {
        return addon(createAction, subscribe);
    }
    // **********
    // main
    // **********
    if (!utility_1.isObj(initialState))
        throw new TypeError("initialState must be Hash.  e.g. { counter: { count: 0 } }");
    // for (let key in initialState) {
    // 	if (!isObj(initialState[key]) && !isArray(initialState[key]))
    // 		throw new TypeError("initialState's root value must be Hash or Array. e.g. { counter: { count: 0 } }");
    // }
    state = utility_1.deepFreeze(initialState);
    return { createAction: createAction, subscribe: subscribe, applyAddon: applyAddon };
}
exports.__esModule = true;
exports["default"] = startPrimitate;
//# sourceMappingURL=Primitate.js.map