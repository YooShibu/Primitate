"use strict";
function initAddonSample(createAction, subscribe) {
    return function (pick) {
        return function (say) {
            return createAction(pick)(say);
        };
    };
}
exports.__esModule = true;
exports["default"] = initAddonSample;
//# sourceMappingURL=AddonSample.js.map