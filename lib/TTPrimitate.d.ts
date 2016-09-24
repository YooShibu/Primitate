import TimeTraveler from "./TimeTraveler";
declare function startTTPrimitate<T extends {
    [key: string]: any;
}>(initialState: T): {
    createAction: <U>(pick: (state: T) => U) => <V>(action: (previousState: U, next?: V, initialState?: U) => U) => (next?: V) => U;
    subscribe: <U>(pick: (state: T) => U) => (listener: (state: U) => void) => () => void;
    createTimeTraveler: <U>(pick: (state: T) => U) => <V>(memorize: (state: U) => V, remember: (memory: V, state: U) => U) => TimeTraveler<V, U>;
};
export default startTTPrimitate;
