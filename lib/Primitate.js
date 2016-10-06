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
        var Keys_state = pick(Keys)[P_KEY].split(".");
        var Keys_listeners = Keys_state.concat().reverse()
            .map(function (key, i, keys) { return keys.concat().splice(0, i + 1).join("."); });
        var Keys_listeners_length = Keys_listeners.length;
        var iniState = pick(initialState);
        return function (action) {
            return function (next) {
                var result = action(pick(state), next, iniState, state);
                state = utility_1.deepAssign(state, utility_1.keysToObj(Keys_state, result));
                for (var i = 0; i < Keys_listeners_length; i++) {
                    var Key_listener = Keys_listeners[i];
                    if (Listeners.hasOwnProperty(Key_listener)) {
                        var listener = Listeners[Key_listener];
                        for (var j = 0; j < listener.length; j++)
                            listener[j](state);
                    }
                }
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
    state = utility_1.deepFreeze(initialState);
    return { createAction: createAction, subscribe: subscribe, applyAddon: applyAddon };
}
exports.__esModule = true;
exports["default"] = startPrimitate;
//# sourceMappingURL=Primitate.js.map