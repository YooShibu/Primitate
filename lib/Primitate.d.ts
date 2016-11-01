export declare class PrimitateClass<State> {
    protected _state: State;
    protected _initialState: State;
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
    createAction<Target>(pick: (state: State) => Target): <NextValue>(action: (prevState: Target, next: NextValue | undefined, initialState: Target, state: State) => Target) => (NextValue?: NextValue | undefined) => Target;
    /**
     * Listener will emitted when state changed.
     *
     * @param {Pick<State, any>[]} picks - Returns the state that listener will emitted when it was changed
     */
    subscribe(...pickers: ((state: State) => any)[]): (listener: (state: State) => void) => () => void;
}
export declare function Primitate<State>(initialState: State): PrimitateClass<State>;
