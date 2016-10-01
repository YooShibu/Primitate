"use strict";
var utility_1 = require("./utility");
function startPrimitate(initialState) {
    var state;
    var pickers = {};
    var listeners = {};
    function merge(value) {
        var currentState = {};
        for (var key in state) {
            currentState[key] = value[key] || state[key];
        }
        state = Object.freeze(currentState);
    }
    function getKey(pick) {
        var pickerStr = pick.toString();
        if (pickers.hasOwnProperty(pickerStr))
            return pickers[pickerStr];
        var value = pick(state);
        for (var key in state) {
            if (state[key] === value) {
                pickers[pickerStr] = key;
                return key;
            }
        }
        throw new Error("Cannot find " + value + " in state. createAction's argument shuld be like \"state => state.counter\"");
    }
    function getState(pick) {
        var key = getKey(pick);
        return state[key];
    }
    function getInitialState(pick) {
        var key = getKey(pick);
        return initialState[key];
    }
    /**
     * Create a function returns the current state.
     *
     * @template U
     * @param {(state: T) => U} pick - Get the root value of the state's Object tree.
     */
    function createAction(pick) {
        var key = getKey(pick);
        var initialState = getInitialState(pick);
        return function (action) {
            return function (next) {
                var prevState = getState(pick);
                var currentState = utility_1.deepFreeze(action(prevState, next, initialState, state));
                merge((_a = {}, _a[key] = currentState, _a));
                if (utility_1.isExisty(listeners[key]))
                    listeners[key]
                        .forEach(function (listener) { return listener(currentState); });
                return { value: function () { return utility_1.deepClone(currentState); } };
                var _a;
            };
        };
    }
    /**
     * When state changed, listener will called.
     *
     * @template U
     * @param {(state: T) => U} pick - Get the root value of the state's Object tree.
     */
    function subscribe(pick) {
        var key = getKey(pick);
        return function (listener) {
            if (!utility_1.isExisty(listeners[key]))
                listeners[key] = [];
            var lisArr = listeners[key];
            lisArr.push(listener);
            listener(getState(pick));
            return function () {
                var lisArr = listeners[key];
                var index = lisArr.indexOf(listener);
                if (index > -1)
                    lisArr.splice(index, 1);
                if (lisArr.length === 0)
                    delete listeners[key];
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
    for (var key in initialState) {
        if (!utility_1.isObj(initialState[key]) && !utility_1.isArray(initialState[key]))
            throw new TypeError("initialState's root value must be Hash or Array. e.g. { counter: { count: 0 } }");
    }
    state = utility_1.deepFreeze(initialState);
    return { createAction: createAction, subscribe: subscribe, applyAddon: applyAddon };
}
exports.__esModule = true;
exports["default"] = startPrimitate;
//# sourceMappingURL=Primitate.js.map