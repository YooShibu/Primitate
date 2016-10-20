export declare type Action<NEXT, RESULT> = (next?: NEXT) => {
    value: () => RESULT;
};
export declare type action<S, T> = <U>(action: (prevState: T, next: U | undefined, initialState: T, stateTree: S) => T) => Action<U, T>;
export declare type createAction<S> = <T>(pick: (state: S) => T) => action<S, T>;
export declare type subscribe<S> = <T>(pick: (state: S) => T) => (listener: (state: T) => void) => () => void;
declare function startPrimitate<T extends {
    [key: string]: any;
}>(initialState: T): {
    createAction: <U>(pick: (state: T) => U) => <V>(action: (previousState: U, next: V, initialState: U, stateTree: T) => U) => (next?: V) => {
        value: () => U;
    };
    subscribe: <U>(...picks: ((state: T) => U)[]) => (listener: (state: T) => void) => () => void;
    applyAddon: <U>(addon: (createAction: createAction<T>, subscribe: subscribe<T>) => U) => U;
};
export default startPrimitate;
