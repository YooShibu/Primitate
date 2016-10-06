import { isObj, isArray, isExisty, deepFreeze, deepClone, deepAssign, keysToObj } from "./utility"

export type Action<NEXT, RESULT> = (next?: NEXT) => { value: () => RESULT }
export type action<T> = <U>(action: (prevState: T, next: U, initialState: T, stateTree: T) => T) => Action<U, T>
export type createAction<T> = <U>(pick: (state: T) => U) => action<U>
export type subscribe<T> = <U>(pick: (state: T) => U) => ( listener: (state: T) => void) => () => void


function startPrimitate<T extends { [key: string]: any }>(initialState: T) {
	const P_KEY = "PrimitateKey";
	let state: T;
	const Keys = <T>createKeys(initialState);
	const Listeners: { [key: string]: Function[] }= {} 
	const pickers: { [key: string]: string } = {}

	
	function createKeys(target: any) {
		const keysArr: string[] = [];

		function ck(target: any) {
			const obj: { [key: string]: any } = {};
					
			for (let key in target) {
				obj[key] = {};
				obj[key][P_KEY] = key;

				if (Object.prototype.toString.call(target[key]) === "[object Object]") {
					keysArr.push(key);
					const subKeys = ck(target[key]);
					
					for (let subKey in subKeys) {
						subKeys[subKey][P_KEY] = keysArr.concat(subKeys[subKey][P_KEY]).reverse().join("."); 
						obj[key][subKey] = subKeys[subKey];
					}
					keysArr.pop();
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
	function createAction<U>(pick: (state: T) => U) {
		const Keys_state = (<string>(pick(Keys) as { [key: string]: any })[P_KEY]).split(".");
		const Keys_listeners = Keys_state.concat().reverse()
			.map( (key, i, keys) => keys.concat().splice(0, i + 1).join(".") );
		const Keys_listeners_length = Keys_listeners.length;
		const iniState = pick(initialState);

		return <V>(action: (previousState: U, next?: V, initialState?: U, stateTree?: T) => U) => {
			return (next?: V): { value: () => U } => {
				const result = action(pick(state), next, iniState, state);

				state = deepAssign<T>(state, keysToObj(Keys_state, result));

				for (let i = 0; i < Keys_listeners_length; i++) {
					const Key_listener = Keys_listeners[i];
					if ((<Object>Listeners).hasOwnProperty(Key_listener)) {
						const listener = Listeners[Key_listener];
						for (let j = 0; j < listener.length; j++)
							listener[j](state);
					}
				}
				
				return { value: () => deepClone<U>(result) };
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
		const keys = picks.map( pick =>
			(<string>(pick(Keys) as { [key: string]: any })[P_KEY]).split(".").reverse().join(".")
		);
		
		return (listener: (state: T) => void) => {
			keys.forEach( key => {
				if (!(<Object>Listeners).hasOwnProperty(key))
					Listeners[key] = [listener];
				else
					Listeners[key].push(listener);
			});
			
			listener(state);
			
			return () => {
				keys.forEach( key => {
					const lisArr = Listeners[key];
					const index = lisArr.indexOf(listener);
					if (index > -1)
						lisArr.splice(index, 1);
					if (lisArr.length === 0)
						delete Listeners[key];
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

	state = deepFreeze<T>(initialState);

	return { createAction, subscribe, applyAddon };
}


export default startPrimitate