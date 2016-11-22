type Dictionary = { [key :string]: any }

// *************
// utilities
// *****************************************************

function identity<T>(x: T) { return x; }
const toString = Object.prototype.toString;
function isObj(obj: any) { return toString.call(obj) === "[object Object]"; }
function isArray(arr: any) { return toString.call(arr) === "[object Array]"; }
function isPrimitive(x: any) { return x != null && typeof x !== "object"; }

function throwNullLike(x: any) {
  if (x == null)
    throw new TypeError("Primitate cannot include null or undefined");
}

function throwObjType(x: any) {
	if (typeof x === "object" && !(isObj(x) || isArray(x)))
  	throw new TypeError("Primitate cannot include typeof 'object' except [object Object] and [object Array]");
}

function throwTypeDiff(a: any, b: any) {
	if(typeof a !== typeof b)
		throw new TypeError(
			["Primitate not allow changing the state structure."
			,`Your value '${b}' must be typeof '${typeof a}'`].join(" "));
}

// function forEach<T>(arr: T[], fun: (arg: T) => void) {
// 	let i = 0;
// 	while(i < arr.length)
// }

function once<T extends Function>(fun: T): T {
	let emitted = false, result: any;
	return function() {
		if (emitted) return result;
		emitted = true;
		return result = fun.apply(null, arguments);
	} as any as T
}

function spliceOne(list: any[], index: number) {
	for (let i = index, j = i + 1, n = list.length; j < n; i += 1, j += 1)
		list[i] = list[j]
	list.pop();
}

function isEqualDeep(a: any, b: any) {
	if (a === b)
		return true;
	
	const isP = isPrimitive;
	if (a !== b && isP(a))
		return false;
	
	const toString = Object.prototype.toString;
	let stack = [a, b];

	while(stack.length) {
		const c_b = stack.pop();
		const c_a = stack.pop();

		switch (toString.call(c_a)) {
			case "[object Object]":
				for (let key in c_a) {
					const v_c_a = c_a[key];
					const v_c_b = c_b[key];
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
				let i = -1;
				while(++i < c_a.length) {
					const v_c_a = c_a[i];
					const v_c_b = c_b[i];
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

function cloneFreezeDeep<T>(Target_Initial: any, Target: any): T {
	throwNullLike(Target);
	throwObjType(Target);

	switch(toString.call(Target)) {
		case "[object Object]":
			return cloneFreezeObjectDeep<T>(Target_Initial, Target);
		case "[object Array]":
			return cloneFreezeArrayDeep<T>(Target_Initial, Target);
		default:
			return checkPrimitiveValue<T>(Target_Initial, Target);
	}
}

function checkPrimitiveValue<T>(Target_Initial: any, Target: any): T {
	throwNullLike(Target);
	throwObjType(Target);
	throwTypeDiff(Target_Initial, Target);
	return Target;
}

function cloneFreezeArrayDeep<T>(Target_Initial: any, Target: any): T {
	throwNullLike(Target);
	throwObjType(Target);

	const isFrozen = Object.isFrozen;
	if (typeof Target === "object" && isFrozen(Target))
		return Target;
	
	if (Target.length === 0)
		return Object.freeze([]) as any;
	
	const Result: any[] = new Array(Target.length);
	const Stack = [Result, Target_Initial, Target];
	
	while(Stack.length) {
		const t = Stack.pop()!;
		const _t_ini: any = Stack.pop();
		const t_ini: any = _t_ini.length === 0 ? t[0] : _t_ini[0]; 
		const r = Stack.pop()!;  
		
		throwNullLike(t);
		
		let i = -1;
		while(++i < t.length) {
			const t_current = t[i];
			throwNullLike(t_current);
			if (typeof t_current === "object" && isFrozen(t_current)) {
				r[i] = t_current;
				continue;
			}

			switch(toString.call(t_current)) {
				case "[object Object]":          
					r[i] = cloneFreezeObjectDeep(t_ini, t_current);
					break;
				case "[object Array]":
					throwTypeDiff(t_ini, t_current);
					const newR = new Array(t_current.length);
					r[i] = newR;
					const stack_l = Stack.length;
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
	return Result as any;
}

function cloneFreezeObjectDeep<T>(InitialTarget: any, Target: any): T {
	throwNullLike(Target);
	throwObjType(Target);

	const result = <T>{};
	const stack: any[] = [result, InitialTarget, Target];
	const isFrozen = Object.isFrozen;
	
	while(stack.length) {
		const t = stack.pop()!;
		const it = stack.pop();
		const r = stack.pop()!;  
	
	if (it)
		for (let key in it)
			if (!t.hasOwnProperty(key))
				throw new TypeError(`Cannot change the state structure. You lack key '${key}'`);
		
	for (let key in t) {
		const t_current = t[key];
		
		throwNullLike(t_current);
		
		if (it && !it.hasOwnProperty(key))
			throw new TypeError(`Cannot change the state structure. You have an extra key '${key}'`);

		const t_isObjType = typeof t_current === "object";
		if (t_isObjType && isFrozen(t_current))
			continue;
		
		switch (toString.call(t_current)) {
			case "[object Object]":
				const newR = {};
				r[key] = newR;
				const stack_l = stack.length;
				stack[stack_l] = newR;
				stack[stack_l + 1] = it ? it[key] : undefined;
				stack[stack_l + 2] = t_current;
				break;
			case "[object Array]":
				r[key] = cloneFreezeArrayDeep(t_current, it[key]);
				break;
			default:
				throwObjType(t_current);
				throwTypeDiff(it[key], t_current);
				r[key] = t_current;
			}
		}
		Object.freeze(r);    
	}
	
	return result;
}

function mergeDeep<T extends Dictionary>(source: T, paths: string[], target: any): T {
	const result = <T>{}
	const max = paths.length - 1;
	const path_last = paths[0];
	
	let i = paths.length;
	let stack_r: Dictionary = result;
	let stack_s: Dictionary = source;
	
	if (max === 0) {
		for (let key in stack_s) {
			stack_r[key] = stack_s[key];
		}
	} else {
		while(--i) {
			const k = paths[i]
			const newS: Dictionary = stack_s[k]
			const newR: Dictionary = {};
			
			for (let key in stack_s) {
				stack_r[key] = stack_s[key];
			}
			
			for (let key in newS) {
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


// *************
// Primitate
// *****************************************************
type Pick<T, U> = (state: T) => U

// Action
export type Action<Next, Target> = (next?: Next) => Target
export type ActionSource<State, Target, NextValue>
	 = (prevState: Target, next: NextValue | undefined, initialState: Target, stateTree: State) => Target

interface ActionTools<State, Target> {
	pick: (State: State) => Target
, ActState_Initial: Target
, convActResultToState: (ActResult: Target) => State
, cloneFreezeDeepActResult: (ActState_Initial: Target, ActResult: Target) => Target 
}
 
// Listener
type Listener<State> = (state: State) => void
interface ListenerItem<State> {
	Listener: Listener<State>
, isLazy: boolean
, TimerID: number | undefined
}
type Subscribe<State>
	= (...picks: ((state: State) => any)[])
		=> ( listener: (err: Error | string | null, state: State) => void )
			=> () => void

const Key_ObjectPath = "__PriOP";
const Key_Listener = "__PriL";
const Key_ID_Timer_Initial = "__PriTI";

interface TreeItem<State> {
	__PriOP: string[]
	__PriL: ListenerItem<State>[][]
}

interface Tree<State> {
	[key: string]: Tree<State> | TreeItem<State>
}

class PrimitateTree<State> {
	private _tree: Tree<State>
	private _isEmitting = false;
	private _Stack_removeListener: (() => void)[] = [];

	constructor(State_Initial: State, private getCurrentState: () => State) {
		const Key_L = Key_Listener;
		const Key_O = Key_ObjectPath;
		const Key_I = Key_ID_Timer_Initial;

		if (isArray(State_Initial) || isPrimitive(State_Initial)) {
			this._tree = { [Key_L]: [[]], [Key_O]: [], [Key_I]: undefined } as any;
			return;
		}

		const Result = {};
		const Stack: any[] = [Result, State_Initial];
		const Stack_Source_Roots: any[] = []; // [key, listeners]
		
		let Stack_L_Children: any[] = [];
		let Stack_L_Parents: any[] = [];
		let Stack_Key: string[] = [];
		
		while (Stack.length) {
			// s: current source
			// r: current result
			// k: current key
			const s = Stack.pop()
			const r = Stack.pop()
			const k = Stack.pop();
			const l = Stack.pop();

			if (!isObj(s))
				continue;

			if (k) {
				if (isObj(s)) {
					Stack_Key.push(k);
					Stack_L_Parents.push(l);
				} else {
					Stack_Key.pop();
					Stack_L_Parents.pop();
				}
				
				// Came back to the root of the source
				if (Stack_Source_Roots[Stack_Source_Roots.length - 2] === k) {
					Stack_L_Children = [Stack_Source_Roots.pop()!]; // [[[]]]
					Stack_L_Parents = Stack_L_Children[0].concat();
					Stack_Key = [Stack_Source_Roots.pop()!];
				}
			}
			
			const Stack_L_C_Length = Stack_L_Children.length;
			const Keys_CurrentDepth = Stack_Key.concat();
			
			for (let key in s) {
				const newS = s[key];
				const newR: Dictionary = {};
				const newLs = [[]].concat(Stack_L_Parents);

				newR[Key_L] = newLs
				newR[Key_O] = Keys_CurrentDepth.concat(key).reverse();
				newR[Key_I] = undefined;
				r[key] = newR;
				
				const s_isObj = isObj(newS);
				if (s_isObj)
					Stack_L_Children.push(newLs);
				
				for (let i = 0; i < Stack_L_C_Length; i++) {
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
	}

	public getObjectPath(pick: Pick<Tree<State>, TreeItem<State>>): string[] {
		return pick(this._tree).__PriOP;
	}

	public addListener(Listener: Listener<State>, isLazy: boolean, pickers: Pick<Tree<State>, TreeItem<State>>[]) {
		const ListenerItem_New: ListenerItem<State> = { Listener, isLazy, TimerID: undefined };

		let i = 0;
		const _tree = this._tree;
		while (i < pickers.length) {
			const item = pickers[i++](_tree);
			(item.__PriL)[0].push(ListenerItem_New);
		}
			
		return once(() => {
			if (this._isEmitting)
				this._Stack_removeListener.push(() => this.removeListener(pickers, ListenerItem_New));
			else
				this.removeListener(pickers, ListenerItem_New);
		});
	}

	public removeListener(pickers: Pick<Tree<State>, TreeItem<State>>[], listener: ListenerItem<State>) {
		let i = -1;
		while (++i < pickers.length) {
			const listeners = pickers[i](this._tree).__PriL[0];
			spliceOne(listeners, listeners.indexOf(listener));
		}
	}

	private _doRemoveListeners() {
		const Stack_removeListener = this._Stack_removeListener;
		let i = 0;
		while(Stack_removeListener.length > 0)
			Stack_removeListener.pop()!();
	}

	public emitListener(pick: Pick<Tree<State>, TreeItem<State>>): void {
		this._isEmitting = true;
		const { __PriL } = pick(this._tree);
		const Listeners_Count_Length	=
			__PriL.reduce( (m, arr) => m + arr.length , 0);
		let Listeners_Count_Current = 0;
		const getCurrentState = this.getCurrentState;
		const State_Current = getCurrentState();
		let i = 0
		while (i < __PriL.length) {
			const Listeners = __PriL[i++];
			let j = 0;
			while (j < Listeners.length) {
				const Listener = Listeners[j++];
				Listeners_Count_Current++;
				if (Listener.isLazy) {
					if (Listener.TimerID) clearTimeout(Listener.TimerID);
					if (Listeners_Count_Current === Listeners_Count_Length)
						Listener.TimerID = setTimeout( () => {
							Listener.Listener(getCurrentState());
							this._doRemoveListeners();
						}, 0);
					else
						Listener.TimerID = setTimeout( () => Listener.Listener(getCurrentState()), 0);
				} else
					Listener.Listener(State_Current);
			}
		}
		if (Listeners_Count_Current === Listeners_Count_Length)
			this._doRemoveListeners();
	}
}


export class PrimitateClass<State> {
	protected _State_Current: State
	protected _State_Initial: State
	protected _stateWasChanged = true

	private _ActionTools = <{ [key: string] : ActionTools<State, any> }>{}
	private _PrimitateTree: PrimitateTree<State>

	constructor(initialState: State) {
		this._State_Current = cloneFreezeDeep<State>(initialState, initialState);
		this._State_Initial = this._State_Current;
		this._PrimitateTree = new PrimitateTree(initialState, () => this._State_Current);
	}

	private _action<Target, NextValue>(Action: ActionSource<State, Target, NextValue>, ActionTools: ActionTools<State, Target>) {
		let NextValue_Prev: NextValue | undefined;
		const { pick, cloneFreezeDeepActResult, ActState_Initial, convActResultToState } = ActionTools;
		const _tree = this._PrimitateTree;
		const _getCurrentState = () => this.getCurrentState();
		
		return (NextValue?: NextValue) => {
			if (!this._stateWasChanged && isEqualDeep(NextValue, NextValue_Prev))
				return ActionTools.pick(this._State_Current);

			NextValue_Prev = NextValue;
			const State_Prev = this._State_Current;
			const ActState_Prev = pick(State_Prev);

			const _Result = Action(ActState_Prev, NextValue, ActState_Initial, State_Prev);
			if (isEqualDeep(ActState_Prev, _Result)) {
				this._stateWasChanged = false;
				return ActState_Prev;
			}
			
			const Result = cloneFreezeDeepActResult(ActState_Initial, _Result);
			
			const State_Current = convActResultToState(Result);
			this._State_Current = State_Current;
			this._stateWasChanged = true;
			_tree.emitListener(pick as any);
			return Result;
		} 
	}

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
	public createAction<Target, NextValue>(
		actionSource: ActionSource<State, Target, NextValue>
	, pick: (state: State) => Target = identity) {
		const Path_Object_Arr = this._PrimitateTree.getObjectPath(pick as any);
		const Path_Object = Path_Object_Arr.join(".")
		let ActionTools: ActionTools<State, Target>;

		if ((<Object>this._ActionTools).hasOwnProperty(Path_Object)) {
			ActionTools = this._ActionTools[Path_Object];
		} else {
			const ActState_Initial = pick(this._State_Current);
			const Type_ActState = toString.call(ActState_Initial);

			ActionTools =
				{ pick
				, ActState_Initial
				, convActResultToState:
							toString.call(this._State_Current) === "[object Object]"
						? (Result: Target) => mergeDeep<State>(this._State_Current, Path_Object_Arr, Result)
						: (Result: Target) => Result as any as State
				, cloneFreezeDeepActResult: 
							Type_ActState === "[object Object]" ? cloneFreezeObjectDeep
						: Type_ActState === "[object Array]" ? cloneFreezeArrayDeep
						: checkPrimitiveValue
				 }
			this._ActionTools[Path_Object] = ActionTools
		}

		return this._action(actionSource, ActionTools)
	}

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
	public subscribe(
		listener: (state: State) => void
	, pickers: ((state: State) =>any)[] = [identity]
	, isLazy = true) {
		return this._PrimitateTree.addListener(listener, isLazy, pickers as any);
	}

	public getCurrentState() { return this._State_Current; }
	public getInitialState() { return this._State_Initial; }
}

export function Primitate<State>(initialState: State) {
	return new PrimitateClass(initialState);
}