"use strict";
var utility_1 = require("./utility");
function startPrimitate(initialState) {
    var P_KEY = "PrimitateKey";
    var P_LIS = "PrimitateListener";
    var state;
    var Keys = createKeys(initialState);
    function createKeys(target) {
        var keysArr = [];
        var lisArr = [];
        function ck(target) {
            var obj = {};
            for (var key in target) {
                var arr = [];
                obj[key] = {};
                obj[key][P_KEY] = key;
                obj[key][P_LIS] = [arr];
                if (Object.prototype.toString.call(target[key]) === "[object Object]") {
                    keysArr.push(key);
                    lisArr.push(arr);
                    var subKeys = ck(target[key]);
                    for (var subKey in subKeys) {
                        subKeys[subKey][P_KEY] = keysArr.concat(subKeys[subKey][P_KEY]).reverse().join(".");
                        subKeys[subKey][P_LIS] = lisArr.concat(subKeys[subKey][P_LIS]).reverse();
                        obj[key][subKey] = subKeys[subKey];
                    }
                    keysArr.pop();
                    lisArr.pop();
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
        var iniState = pick(initialState);
        // Keep the refs of listeners to avoid to get listeners whenever emit an Action.
        var subListeners = (function getListeners(obj, lis) {
            for (var key in obj) {
                if (utility_1.isObj(obj[key])) {
                    lis.push(obj[key][P_LIS][0]);
                    getListeners(obj[key], lis);
                }
            }
            return lis;
        }(pick(Keys), []));
        var mainListeners = pick(Keys)[P_LIS];
        var listeners = [mainListeners, subListeners];
        return function (action) {
            return function (next) {
                var result = action(pick(state), next, iniState, state);
                state = utility_1.deepAssign(state, utility_1.keysToObj(Keys_state, result));
                for (var i = 0; i < 2; i++) {
                    var lis_1 = listeners[i];
                    for (var j = 0; j < lis_1.length; j++) {
                        var lis_2 = lis_1[j];
                        for (var k = 0; k < lis_2.length; k++) {
                            lis_2[k](state);
                        }
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
        return function (listener) {
            picks.forEach(function (pick) {
                return pick(Keys)[P_LIS][0].push(listener);
            });
            listener(state);
            return function () {
                var listenersArr = picks.map(function (pick) { return pick(Keys)[P_LIS][0]; });
                listenersArr.forEach(function (listeners) {
                    var index = listeners.indexOf(listener);
                    if (index > -1)
                        listeners.splice(index, 1);
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