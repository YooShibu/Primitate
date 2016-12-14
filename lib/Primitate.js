"use strict";
// *************
// utilities
// *****************************************************
function identity(x) { return x; }
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
// function forEach<T>(arr: T[], fun: (arg: T) => void) {
// 	let i = 0;
// 	while(i < arr.length)
// }
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
            return cloneFreezeObjectDeep(Target_Initial, Target);
        case "[object Array]":
            return cloneFreezeArrayDeep(Target_Initial, Target);
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
function cloneFreezeArrayDeep(Target_Initial, Target) {
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
        var _t_ini = Stack.pop();
        var t_ini = _t_ini.length === 0 ? t[0] : _t_ini[0];
        var r = Stack.pop();
        throwNullLike(t);
        var i = -1;
        while (++i < t.length) {
            var t_current = t[i];
            throwNullLike(t_current);
            if (typeof t_current === "object" && isFrozen(t_current)) {
                r[i] = t_current;
                continue;
            }
            switch (toString.call(t_current)) {
                case "[object Object]":
                    r[i] = cloneFreezeObjectDeep(t_ini, t_current);
                    break;
                case "[object Array]":
                    throwTypeDiff(t_ini, t_current);
                    var newR = new Array(t_current.length);
                    r[i] = newR;
                    var stack_l = Stack.length;
                    Stack[stack_l] = newR;
                    Stack[stack_l + 1] = t_ini;
                    Stack[stack_l + 2] = t_current;
                    break;
                default:
                    throwObjType(t_current);
                    throwTypeDiff(t_ini, t_current);
                    r[i] = t_current;
            }
        }
        Object.freeze(r);
    }
    return Result;
}
function cloneFreezeObjectDeep(InitialTarget, Target) {
    throwNullLike(Target);
    throwObjType(Target);
    var result = {};
    var stack = [result, InitialTarget, Target];
    var isFrozen = Object.isFrozen;
    while (stack.length) {
        var t = stack.pop();
        var it_1 = stack.pop();
        var r = stack.pop();
        if (it_1)
            for (var key in it_1)
                if (!t.hasOwnProperty(key))
                    throw new TypeError("Cannot change the state structure. You lack key '" + key + "'");
        for (var key in t) {
            var t_current = t[key];
            throwNullLike(t_current);
            if (it_1 && !it_1.hasOwnProperty(key))
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
                    stack[stack_l + 1] = it_1 ? it_1[key] : undefined;
                    stack[stack_l + 2] = t_current;
                    break;
                case "[object Array]":
                    r[key] = cloneFreezeArrayDeep(t_current, it_1[key]);
                    break;
                default:
                    throwObjType(t_current);
                    throwTypeDiff(it_1[key], t_current);
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
    function PrimitateTree(State_Initial, getCurrentState) {
        this.getCurrentState = getCurrentState;
        this._isEmitting = false;
        this._Stack_removeListener = [];
        var Key_L = Key_Listener;
        var Key_O = Key_ObjectPath;
        var Key_I = Key_ID_Timer_Initial;
        if (isArray(State_Initial) || isPrimitive(State_Initial)) {
            this._tree = (_a = {}, _a[Key_L] = [[]], _a[Key_O] = [], _a[Key_I] = undefined, _a);
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
        return pick(this._tree).__PriOP;
    };
    PrimitateTree.prototype.addListener = function (Listener, isLazy, pickers) {
        var _this = this;
        var ListenerItem_New = { Listener: Listener, isLazy: isLazy, TimerID: undefined };
        var i = 0;
        var _tree = this._tree;
        while (i < pickers.length) {
            var item = pickers[i++](_tree);
            (item.__PriL)[0].push(ListenerItem_New);
        }
        return once(function () {
            if (_this._isEmitting)
                _this._Stack_removeListener.push(function () { return _this.removeListener(pickers, ListenerItem_New); });
            else
                _this.removeListener(pickers, ListenerItem_New);
        });
    };
    PrimitateTree.prototype.removeListener = function (pickers, listener) {
        var i = -1;
        while (++i < pickers.length) {
            var listeners = pickers[i](this._tree).__PriL[0];
            spliceOne(listeners, listeners.indexOf(listener));
        }
    };
    PrimitateTree.prototype._doRemoveListeners = function () {
        var Stack_removeListener = this._Stack_removeListener;
        var i = 0;
        while (Stack_removeListener.length > 0)
            Stack_removeListener.pop()();
    };
    PrimitateTree.prototype.emitListener = function (pick) {
        var _this = this;
        this._isEmitting = true;
        var __PriL = pick(this._tree).__PriL;
        var Listeners_Count_Length = __PriL.reduce(function (m, arr) { return m + arr.length; }, 0);
        var Listeners_Count_Current = 0;
        var getCurrentState = this.getCurrentState;
        var State_Current = getCurrentState();
        var i = 0;
        while (i < __PriL.length) {
            var Listeners = __PriL[i++];
            var j = 0;
            var _loop_1 = function() {
                var Listener = Listeners[j++];
                Listeners_Count_Current++;
                if (Listener.isLazy) {
                    if (Listener.TimerID)
                        clearTimeout(Listener.TimerID);
                    if (Listeners_Count_Current === Listeners_Count_Length)
                        Listener.TimerID = setTimeout(function () {
                            Listener.Listener(getCurrentState());
                            _this._doRemoveListeners();
                        }, 0);
                    else
                        Listener.TimerID = setTimeout(function () { return Listener.Listener(getCurrentState()); }, 0);
                }
                else
                    Listener.Listener(State_Current);
            };
            while (j < Listeners.length) {
                _loop_1();
            }
        }
        if (Listeners_Count_Current === Listeners_Count_Length)
            this._doRemoveListeners();
    };
    return PrimitateTree;
}());
var PrimitateClass = (function () {
    function PrimitateClass(initialState) {
        var _this = this;
        this._stateWasChanged = true;
        this._ActionTools = {};
        this._State_Current = cloneFreezeDeep(initialState, initialState);
        this._State_Initial = this._State_Current;
        this._PrimitateTree = new PrimitateTree(initialState, function () { return _this._State_Current; });
    }
    PrimitateClass.prototype._action = function (Action, ActionTools) {
        var _this = this;
        var NextValue_Prev;
        var pick = ActionTools.pick, cloneFreezeDeepActResult = ActionTools.cloneFreezeDeepActResult, ActState_Initial = ActionTools.ActState_Initial, convActResultToState = ActionTools.convActResultToState;
        var _tree = this._PrimitateTree;
        var _getCurrentState = function () { return _this.getCurrentState(); };
        return function (NextValue) {
            if (!_this._stateWasChanged && NextValue_Prev !== undefined && isEqualDeep(NextValue, NextValue_Prev))
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
            _tree.emitListener(pick);
            return Result;
        };
    };
    /**
     *
     * Create a function that to change the current state.
     *
     * @template Target
     * @template NextValue
     * @param {(prev: State, next: NextValue | undefined, initialState: Target, stateTree)} actionSource
     * @param {(state: State) => Target} [pick=identity]
     * @returns {(next?: NextValue) => Target}
     *
     * @memberOf PrimitateClass
     */
    PrimitateClass.prototype.createAction = function (actionSource, pick) {
        var _this = this;
        if (pick === void 0) { pick = identity; }
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
                    cloneFreezeDeepActResult: Type_ActState === "[object Object]" ? cloneFreezeObjectDeep
                        : Type_ActState === "[object Array]" ? cloneFreezeArrayDeep
                            : checkPrimitiveValue
                };
            this._ActionTools[Path_Object] = ActionTools;
        }
        return this._action(actionSource, ActionTools);
    };
    /**
     *
     * Listener will emitted when state changed.
     *
     * @param {(state: State) => void} listener
     * @param {((state: State) =>any)[]} [pickers=[identity]]
     * @param {boolean} [isLazy=true]
     * @returns {() => void} unsubscribe
     *
     * @memberOf PrimitateClass
     */
    PrimitateClass.prototype.subscribe = function (listener, pickers, isLazy) {
        if (pickers === void 0) { pickers = [identity]; }
        if (isLazy === void 0) { isLazy = true; }
        return this._PrimitateTree.addListener(listener, isLazy, pickers);
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