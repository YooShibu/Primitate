import { isObj, isArray, isExisty, deepFreeze, deepClone, deepAssign, keysToObj } from "./utility"

export type Action<NEXT, RESULT> = (next?: NEXT) => { value: () => RESULT }
export type action<S, T> = <U>(action: (prevState: T, next: U, initialState: T, stateTree: S) => T) => Action<U, T>
export type createAction<S> = <T>(pick: (state: S) => T) => action<S, T>
export type subscribe<S> = <T>(pick: (state: S) => T) => ( listener: (state: T) => void) => () => void


function startPrimitate<T extends { [key: string]: any }>(initialState: T) {
	const P_KEY = "PrimitateKey";
	const P_LIS = "PrimitateListener"
	let state: T;
	const Keys = <T>createKeys(initialState);

	
	function createKeys(target: any) {
		const keysArr: string[] = [];
		const lisArr: Function[][] = [];

		function ck(target: any) {
			const obj: { [key: string]: any } = {};
			
			for (let key in target) {
				const arr: Function[] = [];
				obj[key] = {};
				obj[key][P_KEY] = key;
				obj[key][P_LIS] = [arr];

				if (Object.prototype.toString.call(target[key]) === "[object Object]") {
					keysArr.push(key);
					lisArr.push(arr);
					const subKeys = ck(target[key]);
					
					for (let subKey in subKeys) {
						subKeys[subKey][P_KEY] = keysArr.concat(subKeys[subKey][P_KEY]).reverse().join("."); 
						subKeys[subKey][P_LIS] = lisArr.concat(subKeys[subKey][P_LIS]).reverse();
						obj[key][subKey] = subKeys[subKey];
					}
					keysArr.pop();
					lisArr.pop();
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
		const iniState = pick(initialState);

		// Keep the refs of listeners to avoid to get listeners whenever emit an Action.
		const subListeners = (function getListeners(obj: any, lis:Function[][]) {
			for (let key in obj) {
				if (isObj(obj[key])) {
					lis.push((<Function[][]>obj[key][P_LIS])[0]);
					getListeners(obj[key], lis);
				}
			}
			return lis;
		}(pick(Keys), []));
		const mainListeners = (<Function[][]>(pick(Keys) as { [key: string]: any})[P_LIS]);
		const listeners = [mainListeners, subListeners];

		return <V>(action: (previousState: U, next?: V, initialState?: U, stateTree?: T) => U) => {
			return (next?: V): { value: () => U } => {
				const result = action(pick(state), next, iniState, state);

				state = deepAssign<T>(state, keysToObj(Keys_state, result));

				for (let i = 0; i < 2; i++) {
					const lis_1 = listeners[i];
					for (let j = 0; j < lis_1.length; j++) {
						const lis_2 = lis_1[j];
						for (let k = 0; k < lis_2.length; k++) {
							lis_2[k](state);
						}
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
		return (listener: (state: T) => void) => {
			picks.forEach( pick =>
				(<Function[][]>(pick(Keys) as { [key: string]: any })[P_LIS])[0].push(listener)
			);
			
			listener(state);
			
			return () => {
				const listenersArr =  
					picks.map( pick => (<Function[][]>(pick(Keys) as { [key: string]: any})[P_LIS])[0] );

				listenersArr.forEach( listeners => {
					const index = listeners.indexOf(listener);
					if (index > -1)
						listeners.splice(index, 1);
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