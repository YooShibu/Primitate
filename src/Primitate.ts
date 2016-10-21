import { isObj, isArray, isExisty, deepFreeze, deepClone, deepAssign, keysToObj } from "./utility"

export type Action<NEXT, RESULT> = (next?: NEXT) => { value: () => RESULT }
export type action<S, T> = <U>(action: (prevState: T, next: U | undefined, initialState: T, stateTree: S) => T) => Action<U, T>
export type createAction<S> = <T>(pick: (state: S) => T) => action<S, T>
export type subscribe<S> = (pick: (state: S) => any) => ( listener: (state: S) => void) => () => void


function startPrimitate<STATE extends { [key: string]: any }>(initialState: STATE) {
	const P_KEY = "PrimitateKey";
	const P_LIS = "PrimitateListener"
	let state: STATE;
	const Keys = <STATE>createKeys(initialState);

	
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
	function createAction<U>(pick: (state: STATE) => U) {
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

		return <V>(action: (previousState: U, next: V | undefined, initialState: U, stateTree: STATE) => U) => {
			return (next?: V): { value: () => U } => {
				const result = action(pick(state), next, iniState, state);

				state = deepAssign<STATE>(state, keysToObj(Keys_state, result));

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
	function subscribe(...picks: ((state: STATE) => any)[]) {
		return (listener: (state: STATE) => void) => {
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
		createAction: createAction<STATE>
	, subscribe: subscribe<STATE> ) => U ) {
		return addon(createAction, subscribe);
	}


	// **********
	// main
	// **********

	if (!isObj(initialState))
		throw new TypeError("initialState must be Hash.  e.g. { counter: { count: 0 } }");

	state = deepFreeze<STATE>(initialState);

	return { createAction, subscribe, applyAddon };
}


export default startPrimitate