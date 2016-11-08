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
     * Create a function that to change the current state.
     *
     * @template State
     * @param {Pick<Satate, Target>} pick - Get the state you want to manage.
     */
    createAction<Target, NextValue>(actionSource: ActionSource<State, Target, NextValue>, pick?: (state: State) => Target): (NextValue?: NextValue | undefined) => Target;
    /**
     * Listener will emitted when state changed.
     *
     * @param {Pick<State, any>[]} picks - Returns the state that listener will emitted when it was changed
     */
    subscribe(listener: (state: State) => void, ...pickers: ((state: State) => any)[]): () => void;
    getCurrentState(): State;
    getInitialState(): State;
}
export declare function Primitate<State>(initialState: State): PrimitateClass<State>;
