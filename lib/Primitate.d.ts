export declare type Action<NEXT, RESULT> = (next?: NEXT) => {
    value: () => RESULT;
};
export declare type action<S, T> = <U>(action: (prevState: T, next: U | undefined, initialState: T, stateTree: S) => T) => Action<U, T>;
export declare type createAction<S> = <T>(pick: (state: S) => T) => action<S, T>;
export declare type subscribe<S> = (pick: (state: S) => any) => (listener: (state: S) => void) => () => void;
declare function startPrimitate<STATE extends {
    [key: string]: any;
}>(initialState: STATE): {
    createAction: <U>(pick: (state: STATE) => U) => <V>(action: (previousState: U, next: V, initialState: U, stateTree: STATE) => U) => (next?: V) => {
        value: () => U;
    };
    subscribe: (...picks: ((state: STATE) => any)[]) => (listener: (state: STATE) => void) => () => void;
    applyAddon: <U>(addon: (createAction: createAction<STATE>, subscribe: subscribe<STATE>) => U) => U;
};
export default startPrimitate;
