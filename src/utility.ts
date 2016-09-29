export function toString(x: any) { return Object.prototype.toString.call(x); }
export function isExisty(x: any) { return x !== undefined && x !== null; }
export function isArray(x: any) {  return toString(x) === '[object Array]'; }
export function isObj(x: any) { return toString(x) === '[object Object]'; }

export function deepFreeze<T>(target: any): T {
	function checkExisty(x: any) {
		if (!isExisty(x))
			throw new TypeError("State can't contain null or undefined value");
	}
	
	checkExisty(target);
	if (typeof target !== "object")
		return target;

	Object.freeze(target);
				
	if (isObj(target)) {
		for (let key in target) {
			const value = target[key];	
			if ((<Object>target).hasOwnProperty(key) && typeof value === "object")
				this.deepFreeze(value);
			else
				checkExisty(value);
		}
		return target;
	}
	
	if (isArray(target)) {
		target.forEach( (value:any) => {
			if (typeof value === "object")
				this.deepFreeze(value);
			else
				checkExisty(value);
		});
		return target;
	}

	throw new TypeError(
		[ "State can include primitive values or [object Object] or [object Array]." 
		, `But you included ${toString(target)} in the state`].join(" ")
	);
}


export function deepClone<T>(target: any): T {
	if (isObj(target)) {
		const obj: { [key: string]: any } = {};

		for (let key in target) {
			const value = target[key];

			if ((<Object>target).hasOwnProperty(key)) {
				if (isObj(value) || isArray(value))
					obj[key] = deepClone(value);
				else
					obj[key] = value;
			}
		}

		return <T>obj;
	} 

	if (isArray(target)) {
		const arr: any[] = [];
		const length = (<any[]>target).length

		for (let i = 0; i < length; i++) {
			const value = target[i];

			if (isObj(value) || isArray(value))
				arr.push(deepClone(value));
			else
				arr.push(value);
		}

		return <any>arr;
	}

	return target
}

