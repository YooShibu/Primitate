declare function startPrimitate<T extends {
    [key: string]: any;
}>(initialState: T): {
    createAction: <U>(pick: (state: T) => U) => <V>(action: (previousState: U, next?: V, initialState?: U) => U) => (next?: V) => U;
    subscribe: <U>(pick: (state: T) => U) => (listener: (state: U) => void) => () => void;
};
export default startPrimitate;
