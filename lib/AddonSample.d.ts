import { createAction, subscribe } from "./Primitate";
export default function initAddonSample<T>(createAction: createAction<T>, subscribe: subscribe<T>): <U>(pick: (state: T) => U) => <V>(say: (previousState: U, next: number) => U) => (next: number) => {
    value: () => U;
};
