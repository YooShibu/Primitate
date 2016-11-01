"use strict";
// *************
// utilities
// *****************************************************
var toString = Object.prototype.toString;
function isObj(obj) { return toString.call(obj) === "[object Object]"; }
function isArray(arr) { return toString.call(arr) === "[object Array]"; }
function isPrimitive(x) { return x != null && typeof x !== "object"; }
function throwNullLike(x) {
    if (x == null)
        throw new TypeError("Primitate cannot include null or undefined");
}
function throwObjType(x) {
    if (typeof x === "object" && !(isObj(x) || isArray(x)))
        throw new TypeError("Primitate cannot include typeof 'object' except [object Object] and [object Array]");
}
function throwTypeDiff(a, b) {
    if (typeof a !== typeof b)
        throw new TypeError(["Primitate not allow changing the state structure.",
            ("Your value '" + b + "' must be typeof '" + typeof a + "'")].join(" "));
}
function once(fun) {
    var emitted = false, result;
    return function () {
        if (emitted)
            return result;
        emitted = true;
        return result = fun.apply(null, arguments);
    };
}
function spliceOne(list, index) {
    for (var i = index, j = i + 1, n = list.length; j < n; i += 1, j += 1)
        list[i] = list[j];
    list.pop();
}
function isEqualDeep(a, b) {
    if (a === b)
        return true;
    var isP = isPrimitive;
    if (a !== b && isP(a))
        return false;
    var toString = Object.prototype.toString;
    var stack = [a, b];
    while (stack.length) {
        var c_b = stack.pop();
        var c_a = stack.pop();
        switch (toString.call(c_a)) {
            case "[object Object]":
                for (var key in c_a) {
                    var v_c_a = c_a[key];
                    var v_c_b = c_b[key];
                    if (v_c_a === v_c_b)
                        continue;
                    if (isP(v_c_a))
                        return false;
                    stack[stack.length] = v_c_a;
                    stack[stack.length] = v_c_b;
                }
                break;
            case "[object Array]":
                if (c_a.length !== c_b.length)
                    return false;
                var i = -1;
                while (++i < c_a.length) {
                    var v_c_a = c_a[i];
                    var v_c_b = c_b[i];
                    if (v_c_a === v_c_b)
                        continue;
                    if (isP(v_c_a))
                        return false;
                    stack[stack.length] = v_c_a;
                    stack[stack.length] = v_c_b;
                }
                break;
            default:
                if (c_a !== c_b)
                    return false;
        }
    }
    return true;
}
function cloneFreezeDeep(Target_Initial, Target) {
    throwNullLike(Target);
    throwObjType(Target);
    switch (toString.call(Target)) {
        case "[object Object]":
            return cloneFreezeDeepObject(Target_Initial, Target);
        case "[object Array]":
            return cloneFreezeDeepArray(Target_Initial, Target);
        default:
            return checkPrimitiveValue(Target_Initial, Target);
    }
}
function checkPrimitiveValue(Target_Initial, Target) {
    throwNullLike(Target);
    throwObjType(Target);
    throwTypeDiff(Target_Initial, Target);
    return Target;
}
function cloneFreezeDeepArray(Target_Initial, Target) {
    throwNullLike(Target);
    throwObjType(Target);
    var isFrozen = Object.isFrozen;
    if (typeof Target === "object" && isFrozen(Target))
        return Target;
    if (Target.length === 0)
        return Object.freeze([]);
    var Result = new Array(Target.length);
    var Stack = [Result, Target_Initial, Target];
    while (Stack.length) {
        var t = Stack.pop();
        var _it = Stack.pop();
        var it_1 = _it === undefined ? t[0] : _it[0];
        var r = Stack.pop();
        throwNullLike(t);
        var i = -1;
        while (++i < t.length) {
            var t_current = t[i];
            throwNullLike(t_current);
            if (typeof t_current === "object" && isFrozen(t_current)) {
                continue;
            }
            switch (toString.call(t_current)) {
                case "[object Object]":
                    r[i] = cloneFreezeDeepObject(it_1, t_current);
                    break;
                case "[object Array]":
                    throwTypeDiff(it_1, t_current);
                    var newR = new Array(t_current.length);
                    r[i] = newR;
                    var stack_l = Stack.length;
                    Stack[stack_l] = newR;
                    Stack[stack_l + 1] = it_1;
                    Stack[stack_l + 2] = t_current;
                    break;
                default:
                    throwObjType(t_current);
                    throwTypeDiff(it_1, t_current);
                    r[i] = t_current;
            }
        }
        Object.freeze(r);
    }
    return Result;
}
function cloneFreezeDeepObject(InitialTarget, Target) {
    throwNullLike(Target);
    throwObjType(Target);
    var result = {};
    var stack = [result, InitialTarget, Target];
    var isFrozen = Object.isFrozen;
    while (stack.length) {
        var t = stack.pop();
        var it_2 = stack.pop();
        var r = stack.pop();
        if (it_2)
            for (var key in it_2)
                if (!t.hasOwnProperty(key))
                    throw new TypeError("Cannot change the state structure. You lack key '" + key + "'");
        for (var key in t) {
            var t_current = t[key];
            throwNullLike(t_current);
            if (it_2 && !it_2.hasOwnProperty(key))
                throw new TypeError("Cannot change the state structure. You have an extra key '" + key + "'");
            var t_isObjType = typeof t_current === "object";
            if (t_isObjType && isFrozen(t_current))
                continue;
            switch (toString.call(t_current)) {
                case "[object Object]":
                    var newR = {};
                    r[key] = newR;
                    var stack_l = stack.length;
                    stack[stack_l] = newR;
                    stack[stack_l + 1] = it_2 ? it_2[key] : undefined;
                    stack[stack_l + 2] = t_current;
                    break;
                case "[object Array]":
                    r[key] = cloneFreezeDeepArray(t_current, it_2[key]);
                    break;
                default:
                    throwObjType(t_current);
                    throwTypeDiff(it_2[key], t_current);
                    r[key] = t_current;
            }
        }
        Object.freeze(r);
    }
    return result;
}
function mergeDeep(source, paths, target) {
    var result = {};
    var max = paths.length - 1;
    var path_last = paths[0];
    var i = paths.length;
    var stack_r = result;
    var stack_s = source;
    if (max === 0) {
        for (var key in stack_s) {
            stack_r[key] = stack_s[key];
        }
    }
    else {
        while (--i) {
            var k = paths[i];
            var newS = stack_s[k];
            var newR = {};
            for (var key in stack_s) {
                stack_r[key] = stack_s[key];
            }
            for (var key in newS) {
                newR[key] = newS[key];
            }
            stack_r[k] = newR;
            Object.freeze(stack_r);
            stack_r = newR;
            stack_s = newS;
        }
    }
    stack_r[path_last] = target;
    Object.freeze(stack_r);
    return result;
}
var Key_ObjectPath = "__PriOP";
var Key_Listener = "__PriL";
var Key_ID_Timer_Initial = "__PriTI";
var PrimitateTree = (function () {
    function PrimitateTree(State_Initial) {
        this._isEmitting = false;
        this._Stack_removeListener = [];
        var Key_L = Key_Listener;
        var Key_O = Key_ObjectPath;
        var Key_I = Key_ID_Timer_Initial;
        if (isArray(State_Initial) || isPrimitive(State_Initial)) {
            this._tree = (_a = {}, _a[Key_L] = [[]], _a[Key_O] = [], _a[Key_I] = [], _a);
            return;
        }
        var Result = {};
        var Stack = [Result, State_Initial];
        var Stack_Source_Roots = []; // [key, listeners]
        var Stack_L_Children = [];
        var Stack_L_Parents = [];
        var Stack_Key = [];
        while (Stack.length) {
            // s: current source
            // r: current result
            // k: current key
            var s = Stack.pop();
            var r = Stack.pop();
            var k = Stack.pop();
            var l = Stack.pop();
            if (!isObj(s))
                continue;
            if (k) {
                if (isObj(s)) {
                    Stack_Key.push(k);
                    Stack_L_Parents.push(l);
                }
                else {
                    Stack_Key.pop();
                    Stack_L_Parents.pop();
                }
                // Came back to the root of the source
                if (Stack_Source_Roots[Stack_Source_Roots.length - 2] === k) {
                    Stack_L_Children = [Stack_Source_Roots.pop()]; // [[[]]]
                    Stack_L_Parents = Stack_L_Children[0].concat();
                    Stack_Key = [Stack_Source_Roots.pop()];
                }
            }
            var Stack_L_C_Length = Stack_L_Children.length;
            var Keys_CurrentDepth = Stack_Key.concat();
            for (var key in s) {
                var newS = s[key];
                var newR = {};
                var newLs = [[]].concat(Stack_L_Parents);
                newR[Key_L] = newLs;
                newR[Key_O] = Keys_CurrentDepth.concat(key).reverse();
                newR[Key_I] = undefined;
                r[key] = newR;
                var s_isObj = isObj(newS);
                if (s_isObj)
                    Stack_L_Children.push(newLs);
                for (var i = 0; i < Stack_L_C_Length; i++) {
                    Stack_L_Children[i].push(newLs[0]);
                }
                if (!r.hasOwnProperty(Key_L)) {
                    Stack_Source_Roots.push(key);
                    Stack_Source_Roots.push(newLs);
                }
                Stack.push(newLs[0]);
                Stack.push(key);
                Stack.push(newR);
                Stack.push(newS);
            }
        }
        this._tree = Result;
        var _a;
    }
    PrimitateTree.prototype.getObjectPath = function (pick) {
        return pick(this._tree)[Key_ObjectPath];
    };
    PrimitateTree.prototype.addListener = function (pickers, listener, getState) {
        var _this = this;
        var ID_Timer_Initial = setTimeout(function () { return listener(getState()); }, 0);
        var i = -1;
        var _tree = this._tree;
        var item;
        while (++i < pickers.length) {
            item = pickers[i](_tree);
            item[Key_Listener][0].push(listener);
            item[Key_ID_Timer_Initial] = ID_Timer_Initial;
        }
        return once(function () {
            if (_this._isEmitting)
                _this._Stack_removeListener.push(function () { return _this.removeListener(pickers, listener); });
            else
                _this.removeListener(pickers, listener);
        });
    };
    PrimitateTree.prototype.removeListener = function (pickers, listener) {
        var i = -1;
        var listeners;
        var index;
        while (++i < pickers.length) {
            listeners = pickers[i](this._tree)[Key_Listener][0];
            index = listeners.indexOf(listener);
            spliceOne(listeners, listeners.indexOf(listener));
        }
    };
    PrimitateTree.prototype._emitListener = function (Item_PrimitateTree, state) {
        var Stack_removeListener = this._Stack_removeListener;
        while (Stack_removeListener.length)
            Stack_removeListener.pop()();
        this._isEmitting = false;
        clearTimeout(Item_PrimitateTree[Key_ID_Timer_Initial]);
        Item_PrimitateTree[Key_ID_Timer_Initial] = undefined;
        var ListenersArr = Item_PrimitateTree[Key_Listener];
        var i = -1;
        var j = -1;
        var Listeners;
        while (++i < ListenersArr.length) {
            Listeners = ListenersArr[i];
            while (++j < Listeners.length) {
                Listeners[j](state);
            }
            j = -1;
        }
    };
    PrimitateTree.prototype.emitListener = function (pick, state) {
        var _this = this;
        this._isEmitting = true;
        var Item_PrimitateTree = pick(this._tree);
        clearTimeout(Item_PrimitateTree[Key_ID_Timer_Initial]);
        Item_PrimitateTree[Key_ID_Timer_Initial]
            = setTimeout(function () { return _this._emitListener(Item_PrimitateTree, state); }, 0);
    };
    return PrimitateTree;
}());
var PrimitateClass = (function () {
    function PrimitateClass(initialState) {
        this._stateWasChanged = true;
        this._ActionTools = {};
        this._State_Current = cloneFreezeDeep(initialState, initialState);
        this._State_Initial = this._State_Current;
        this._PrimitateTree = new PrimitateTree(initialState);
    }
    PrimitateClass.prototype._action = function (Action, ActionTools) {
        var _this = this;
        var NextValue_Prev;
        var pick = ActionTools.pick, cloneFreezeDeepActResult = ActionTools.cloneFreezeDeepActResult, ActState_Initial = ActionTools.ActState_Initial, convActResultToState = ActionTools.convActResultToState;
        var _tree = this._PrimitateTree;
        return function (NextValue) {
            if (!_this._stateWasChanged && isEqualDeep(NextValue, NextValue_Prev))
                return ActionTools.pick(_this._State_Current);
            NextValue_Prev = NextValue;
            var State_Prev = _this._State_Current;
            var ActState_Prev = pick(State_Prev);
            var _Result = Action(ActState_Prev, NextValue, ActState_Initial, State_Prev);
            if (isEqualDeep(ActState_Prev, _Result)) {
                _this._stateWasChanged = false;
                return ActState_Prev;
            }
            var Result = cloneFreezeDeepActResult(ActState_Initial, _Result);
            var State_Current = convActResultToState(Result);
            _this._State_Current = State_Current;
            _this._stateWasChanged = true;
            _tree.emitListener(pick, State_Current);
            return Result;
        };
    };
    /**
     * Create a function that to change the current state.
     *
     * @template State
     * @param {Pick<Satate, Target>} pick - Get the state you want to manage.
     */
    PrimitateClass.prototype.createAction = function (pick) {
        var _this = this;
        var Path_Object_Arr = this._PrimitateTree.getObjectPath(pick);
        var Path_Object = Path_Object_Arr.join(".");
        var ActionTools;
        if (this._ActionTools.hasOwnProperty(Path_Object)) {
            ActionTools = this._ActionTools[Path_Object];
        }
        else {
            var ActState_Initial = pick(this._State_Current);
            var Type_ActState = toString.call(ActState_Initial);
            ActionTools =
                { pick: pick,
                    ActState_Initial: ActState_Initial,
                    convActResultToState: toString.call(this._State_Current) === "[object Object]"
                        ? function (Result) { return mergeDeep(_this._State_Current, Path_Object_Arr, Result); }
                        : function (Result) { return Result; },
                    cloneFreezeDeepActResult: Type_ActState === "[object Object]" ? cloneFreezeDeepObject
                        : Type_ActState === "[object Array]" ? cloneFreezeDeepArray
                            : checkPrimitiveValue
                };
            this._ActionTools[Path_Object] = ActionTools;
        }
        return function (action) {
            return _this._action(action, ActionTools);
        };
    };
    /**
     * Listener will emitted when state changed.
     *
     * @param {Pick<State, any>[]} picks - Returns the state that listener will emitted when it was changed
     */
    PrimitateClass.prototype.subscribe = function () {
        var _this = this;
        var pickers = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            pickers[_i - 0] = arguments[_i];
        }
        return function (listener) {
            return _this._PrimitateTree.addListener(pickers, listener, function () { return _this._State_Current; });
        };
    };
    PrimitateClass.prototype.getCurrentState = function () { return this._State_Current; };
    PrimitateClass.prototype.getInitialState = function () { return this._State_Initial; };
    return PrimitateClass;
}());
exports.PrimitateClass = PrimitateClass;
function Primitate(initialState) {
    return new PrimitateClass(initialState);
}
exports.Primitate = Primitate;
//# sourceMappingURL=Primitate.js.map