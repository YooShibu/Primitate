type Dictionary = { [key :string]: any }

// *************
// utilities
// *****************************************************

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
			return cloneFreezeDeepObject<T>(Target_Initial, Target);
		case "[object Array]":
			return cloneFreezeDeepArray<T>(Target_Initial, Target);
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

function cloneFreezeDeepArray<T>(Target_Initial: any, Target: any): T {
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
		const _it: any = Stack.pop();
		const it: any = _it === undefined ? t[0] : _it[0]; 
		const r = Stack.pop()!;  
		
		throwNullLike(t);
		
		let i = -1;
		while(++i < t.length) {
			const t_current = t[i];
			throwNullLike(t_current);
			if (typeof t_current === "object" && isFrozen(t_current)) {
				continue;
			}

			switch(toString.call(t_current)) {
				case "[object Object]":          
					r[i] = cloneFreezeDeepObject(it, t_current);
					break;
				case "[object Array]":
					throwTypeDiff(it, t_current);
					const newR = new Array(t_current.length);
					r[i] = newR;
					const stack_l = Stack.length;
					Stack[stack_l] = newR;
					Stack[stack_l + 1] = it;
					Stack[stack_l + 2] = t_current;
					break;
				default:
					throwObjType(t_current);
					throwTypeDiff(it, t_current);
					r[i] = t_current;
			}
		}
		Object.freeze(r);
	}
	return Result as any;
}

function cloneFreezeDeepObject<T>(InitialTarget: any, Target: any): T {
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
				r[key] = cloneFreezeDeepArray(t_current, it[key]);
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
type Next<Next, Result> = (next?: Next) => { value: () => Result }
type Action<State, Target, NextValue>
	 = (prevState: Target, next: NextValue | undefined, initialState: Target, stateTree: State) => Target
type CreateAction<State>
	= <Target>(pick: (state: State) => Target)
		=> <NextValue>( action: (prevState: Target, next: NextValue | undefined, initialState: Target, stateTree: State) => Target )
			=> Target

interface ActionTools<State, Target> {
	pick: (State: State) => Target
, ActState_Initial: Target
, convActResultToState: (ActResult: Target) => State
, cloneFreezeDeepActResult: (ActState_Initial: Target, ActResult: Target) => Target 
}
 
// Listener
type Listener<State> = (state: State) => void
type Subscribe<State>
	= (...picks: ((state: State) => any)[])
		=> ( listener: (err: Error | string | null, state: State) => void )
			=> () => void


const Key_ObjectPath = "__PriOP";
const Key_Listener = "__PriL";
const Key_ID_Timer_Initial = "__PriTI";

class PrimitateTree<State> {
	private _tree: Dictionary
	private _isEmitting = false;
	private _Stack_removeListener: (() => void)[] = [];

	constructor(State_Initial: State) {
		const Key_L = Key_Listener;
		const Key_O = Key_ObjectPath;
		const Key_I = Key_ID_Timer_Initial;

		if (isArray(State_Initial) || isPrimitive(State_Initial)) {
			this._tree = { [Key_L]: [[]], [Key_O]: [], [Key_I]: [] }
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

	public getObjectPath(pick: Pick<State, any>): string[] {
		return pick(this._tree as State)[Key_ObjectPath];
	}

	public addListener(pickers: Pick<State, any>[], listener: Listener<State>, getState: () => State) {
		const ID_Timer_Initial = setTimeout( () => listener(getState()), 0);

		let i = -1;
		const _tree = this._tree;
		let item: Dictionary;
		while (++i < pickers.length) {
			item = pickers[i](_tree as State);
			(item[Key_Listener] as Listener<State>[][])[0].push(listener);
			item[Key_ID_Timer_Initial] = ID_Timer_Initial;
		}
			
		return once(() => {
			if (this._isEmitting)
				this._Stack_removeListener.push(() => this.removeListener(pickers, listener));
			else
				this.removeListener(pickers, listener);
		});
	}

	public removeListener(pickers: Pick<State, any>[], listener: Listener<State>) {
		let i = -1;
		let listeners: Listener<State>[]
		let index: number
		while (++i < pickers.length) {
			listeners = (pickers[i](this._tree as State)[Key_Listener] as Listener<State>[][])[0];
			index = listeners.indexOf(listener);
			spliceOne(listeners, listeners.indexOf(listener));
		}
	}

	private _emitListener(Item_PrimitateTree: Dictionary, state: State): void {
		const Stack_removeListener = this._Stack_removeListener;
		while(Stack_removeListener.length)
			Stack_removeListener.pop()!()
		this._isEmitting = false;
		
		clearTimeout(Item_PrimitateTree[Key_ID_Timer_Initial] as number);
		Item_PrimitateTree[Key_ID_Timer_Initial] = undefined;

		const ListenersArr = Item_PrimitateTree[Key_Listener] as Listener<State>[][];
		let i = -1;
		let j = -1;
		let Listeners: Listener<State>[]
		while(++i < ListenersArr.length) {
			Listeners = ListenersArr[i];
			while(++j < Listeners.length) {
				Listeners[j](state);
			}
			j = -1;
		}
	}

	public emitListener(pick: Pick<State, any>, state: State): void {
		this._isEmitting = true;
		const Item_PrimitateTree = pick(this._tree as State);
		clearTimeout(Item_PrimitateTree[Key_ID_Timer_Initial]);
		Item_PrimitateTree[Key_ID_Timer_Initial]
			= setTimeout( () => this._emitListener(Item_PrimitateTree, state), 0);
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
		this._PrimitateTree = new PrimitateTree(initialState);
	}

	private _action<Target, NextValue>(Action: Action<State, Target, NextValue>, ActionTools: ActionTools<State, Target>) {
		let NextValue_Prev: NextValue | undefined;
		const { pick, cloneFreezeDeepActResult, ActState_Initial, convActResultToState } = ActionTools;
		const _tree = this._PrimitateTree;
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
			_tree.emitListener(pick, State_Current);
			return Result;
		} 
	}

	/**
	 * Create a function that to change the current state.
	 * 
	 * @template State
	 * @param {Pick<Satate, Target>} pick - Get the state you want to manage.
	 */
	public createAction<Target>(pick: (state: State) => Target) {
		const Path_Object_Arr = this._PrimitateTree.getObjectPath(pick);
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
							Type_ActState === "[object Object]" ? cloneFreezeDeepObject
						: Type_ActState === "[object Array]" ? cloneFreezeDeepArray
						: checkPrimitiveValue
				 }
			this._ActionTools[Path_Object] = ActionTools
		}

		return <NextValue>(
			action: (prevState: Target, next: NextValue | undefined, initialState: Target, state: State) => Target
		) => this._action(action, ActionTools)
	}

	/**
	 * Listener will emitted when state changed.
	 * 
	 * @param {Pick<State, any>[]} picks - Returns the state that listener will emitted when it was changed	   
	 */
	public subscribe(...pickers: ((state: State) =>any)[]) {
		return (listener: (state: State) => void) => {
			return  this._PrimitateTree.addListener(pickers, listener, () => this._State_Current)
		}
	}

	public getCurrentState() { return this._State_Current; }
	public getInitialState() { return this._State_Initial; }
}

export function Primitate<State>(initialState: State) {
	return new PrimitateClass(initialState);
}