export declare type Action<Next, Target> = (next?: Next) => Target;
export declare type ActionSource<State, Target, NextValue> = (prevState: Target, next: NextValue | undefined, initialState: Target, stateTree: State) => Target;
export declare class PrimitateClass<State> {
    protected _State_Current: State;
    protected _State_Initial: State;
    protected _stateWasChanged: boolean;
    private _ActionTools;
    private _PrimitateTree;
    constructor(initialState: State);
    private _action<Target, NextValue>(Action, ActionTools);
    /**
     *
     * Create a function that to change the current state.
     *
     * @template Target
     * @template NextValue
     * @param {(prev: State, next: NextValue | undefined, initialState: Target, stateTree)} actionSource
     * @param {(state: State) => Target} [pick=identity]
     * @returns {(next?: NextValue) => Target}
     *
     * @memberOf PrimitateClass
     */
    createAction<Target, NextValue>(actionSource: ActionSource<State, Target, NextValue>, pick?: (state: State) => Target): (NextValue?: NextValue | undefined) => Target;
    /**
     *
     * Listener will emitted when state changed.
     *
     * @param {(state: State) => void} listener
     * @param {((state: State) =>any)[]} [pickers=[identity]]
     * @returns {() => void} unsubscribe
     *
     * @memberOf PrimitateClass
     */
    subscribe(listener: (state: State) => void, pickers?: ((state: State) => any)[]): () => void;
    getCurrentState(): State;
    getInitialState(): State;
}
export declare function Primitate<State>(initialState: State): PrimitateClass<State>;
