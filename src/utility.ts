export function toString(x: any) { return Object.prototype.toString.call(x); }
export function isExisty(x: any) { return x !== undefined && x !== null; }
export function isArray(x: any) {  return toString(x) === '[object Array]'; }
export function isObj(x: any) { return toString(x) === '[object Object]'; }

function checkExisty(x: any) {
	if (!isExisty(x))
		throw new TypeError("State can't contain null or undefined value");
}

export function keysToObj(sourceKeys: string[], value: any) {
  const keys = sourceKeys.concat();
	
  function co(key: string, val: any): any {
    const obj: { [key: string]: any } = {};
    obj[key] = val;
    
    if (keys.length > 0) {
      keys.shift();
      return co(keys[0], obj);
    }
    
    return val
  }
  
  return co(keys[0], value);
}

export function deepFreeze<T>(target: any): T {
	
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

export function deepAssign<S>(source: any, target: any): S {
  const obj: { [key: string]: any } = {};
  
  for (let key_1 in source)
    obj[key_1] = source[key_1];
  
  Object.seal(obj);
  
  for (let key_2 in target) {
    if (Object.prototype.toString.call(target[key_2]) === "[object Object]") {
      obj[key_2] = deepAssign(source[key_2], target[key_2]);
		} else {
			checkExisty(target[key_2]);
      obj[key_2] = target[key_2];
		}
  }
  
  return <S>Object.freeze(obj);
}

