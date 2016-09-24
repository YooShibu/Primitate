"use strict";
var Primitate_1 = require("./Primitate");
var TimeTraveler_1 = require("./TimeTraveler");
// Time Travelable Primitate
function startTTPrimitate(initialState) {
    var _a = Primitate_1["default"](initialState), createAction = _a.createAction, subscribe = _a.subscribe;
    /**
     * Create Time Traveler
     *
     * @template U
     * @param {(state: T) => U} pick - Get the root value of the state Object tree
     * @returns {(memorize: (state: U) => V), (remember: (memory: V, state: U) => U) => {TimeTraveler} }
     *
     * @memberOf TTStore
     */
    function createTimeTraveler(pick) {
        /**
         * Create Time Traveler
         *
         * @template V
         * @param {(state: U) => V} memorize - Time traveler memorize the return value of the memorize function when state changed
         * @param {(memory: V, state: U) => U} remember - Remember the state value from memories and current state.
         * @returns {TimeTraveler}
         *
         */
        return function (memorize, remember) {
            var remember$ = createAction(pick)(function (previousState, memory) { return remember(memory, previousState); });
            return new TimeTraveler_1["default"](memorize, remember$, subscribe(pick));
        };
    }
    return { createAction: createAction, subscribe: subscribe, createTimeTraveler: createTimeTraveler };
}
exports.__esModule = true;
exports["default"] = startTTPrimitate;
//# sourceMappingURL=TTPrimitate.js.map