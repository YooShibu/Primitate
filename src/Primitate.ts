import { isObj, isArray, isExisty, deepFreeze, deepClone } from "./utility"

export type Action<NEXT, RESULT> = (next: NEXT) => { value: () => RESULT }
export type action<T> = <U>(action: (prevState: T, next?: U, initialState?: T, stateTree?: T) => T) => Action<U, T>
export type createAction<T> = <U>(pick: (state: T) => U) => action<U>
export type subscribe<T> = <U>(pick: (state: T) => U) => ( listener: (state: T) => void) => () => void


function startPrimitate<T extends { [key: string]: any }>(initialState: T) {
	let state: any;
	const pickers: { [key: string]: string } = {}
	const listeners: { [key: string]: Function[] }= {} 
	

	function merge(value: { [key: string]: any } ) {
		let currentState = <T>{}
		for (let key in state) {
			currentState[key] = value[key] || state[key]
		}
		state = Object.freeze(currentState);
	}
	

	function getKey<U>(pick: (state: T) => U) {
		const pickerStr = pick.toString();

		if ((<Object>pickers).hasOwnProperty(pickerStr))
			return pickers[pickerStr];
		
		const value = pick(state);
		for (let key in state) {
			if (state[key] === value) {
				pickers[pickerStr] = key;
				return key; 
			}
		}
		throw new Error(`Cannot find ${value} in state. createAction's argument shuld be like "state => state.counter"`)
	}
	

	function getState<U>(pick: (state: T) => U): U {
		const key = getKey(pick);
		return state[key];
	}


	function getInitialState<U>(pick: (state: T) => U): U {
		const key = getKey(pick);
		return initialState[key];
	}


	/**
	 * Create a function returns the current state.
	 * 
	 * @template U
	 * @param {(state: T) => U} pick - Get the root value of the state's Object tree.
	 */
	 function createAction<U>(pick: (state: T) => U) {
		const key = getKey(pick);
		const initialState = getInitialState(pick);

		return <V>(action: (previousState: U, next?: V, initialState?: U, stateTree?: T) => U) => {
			return (next?: V): { value: () => U } => {
				const prevState = getState(pick);
				const currentState = deepFreeze<U>(
					action(prevState, next, initialState, state)
				);

				merge({ [key]: currentState});

				if (isExisty(listeners[key]))
					listeners[key]
						.forEach( listener => listener(state) );
				
				return { value: () => deepClone<U>(currentState) };
			}
		}
	}

	/**
	 * When state changed, listener will called.
	 * 
	 * @template U
	 * @param {(state: T) => U} pick - Emit listener when U changed.
	 */
	function subscribe<U>(...picks: ((state: T) => U)[]) {
		const keys = picks.map( pick => getKey(pick));
		keys.forEach( key => {
			if (!isExisty(listeners[key]))
				listeners[key] = [];
		});
		
		return (listener: (state: T) => void) => {
			keys.forEach( key => {
				listeners[key].push(listener);
			});
			
			listener(state);
			
			return () => {
				keys.forEach( key => {
					const lisArr = listeners[key];
					const index = lisArr.indexOf(listener);
					if (index > -1)
						lisArr.splice(index, 1);
					if (lisArr.length === 0)
						delete listeners[key];
				});
			}
		}
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
	function applyAddon<U>(addon: (
		createAction: createAction<T>
	, subscribe: subscribe<T> ) => U ) {
		return addon(createAction, subscribe);
	}


	// **********
	// main
	// **********

	if (!isObj(initialState))
		throw new TypeError("initialState must be Hash.  e.g. { counter: { count: 0 } }");

	for (let key in initialState) {
		if (!isObj(initialState[key]) && !isArray(initialState[key]))
			throw new TypeError("initialState's root value must be Hash or Array. e.g. { counter: { count: 0 } }");
	}

	state = deepFreeze<T>(initialState);

	return { createAction, subscribe, applyAddon };
}


export default startPrimitate