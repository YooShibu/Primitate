import { createAction, subscribe, Action } from "./Primitate";
export default function initAddonSample<T>(createAction: createAction<T>, subscribe: subscribe<T>): <U>(pick: (state: T) => U) => <V>(say: (previousState: U, next: number) => U) => Action<number>;
