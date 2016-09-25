import { createAction, subscribe } from "./Primitate"

export default function initAddonSample<T>(createAction: createAction<T>, subscribe: subscribe<T>) {
  return <U>(pick: (state: T) => U) => {
    return <V>(say: (previousState: U, next: number) => U) => {
      return createAction(pick)(say);
    }
  }
}