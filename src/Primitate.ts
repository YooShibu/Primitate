import { isObj, isArray, isExisty, deepFreeze } from "./utility"

export type createAction<T> = <U>(pick: (state: T) => U) => <V>(action: (previousState: U, next?: V, initialState?: U) => U) => (next: V) => U
export type subscribe<T> = <U>(pick: (state: T) => U) => ( listener: (state: U) => void) => () => void


function startPrimitate<T extends { [key: string]: any }>(initialState: T) {
	let state: T = <T>{}
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
	 * A value that action returns is a currentState.
	 * So action accept a first argument as a previousState
	 * 
	 * @template U
	 * @param {(state: T) => U} pick - Get the root value of the state's Object tree.
	 * 
	 * @memberOf Store
	 */
	 function createAction<U>(pick: (state: T) => U) {
		const key = getKey(pick);
		const initialState = getInitialState(pick);

		return <V>(action: (previousState: U, next?: V, initialState?: U) => U) => {
			return (next?: V): U => {
				const previousState = getState(pick);
				const currentState = deepFreeze<U>(
					action(previousState, next, initialState)
				);

				merge({ [key]: currentState});

				if (isExisty(listeners[key]))
					listeners[key]
						.forEach( listener => listener(currentState) );
				
				return currentState;
			}
		}
	}

	/**
	 * When state changed, listener will called.
	 * 
	 * @template U
	 * @param {(state: T) => U} pick - Get the root value of the state's Object tree.
	 * 
	 * @memberOf Store
	 */
	function subscribe<U>(pick: (state: T) => U) {
		const key = getKey(pick);
		
		return (listener: (state: U) => void) => {
			if (!isExisty(listeners[key]))
				listeners[key] = [];

			const lisArr = listeners[key];
			lisArr.push(listener);
			
			listener(getState(pick));
			
			return () => {
				const lisArr = listeners[key];
				const index = lisArr.indexOf(listener);
				if (index > -1)
					lisArr.splice(index, 1);
				if (lisArr.length === 0)
					delete listeners[key];
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