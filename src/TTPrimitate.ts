import startPrimitate from "./Primitate"
import TimeTraveler from "./TimeTraveler"

// Time Travelable Primitate
function startTTPrimitate<T extends { [key: string]: any}>(initialState: T) {
    const { createAction, subscribe } = startPrimitate(initialState);
    /**
     * Create Time Traveler
     * 
     * @template U
     * @param {(state: T) => U} pick - Get the root value of the state Object tree
     * @returns {(memorize: (state: U) => V), (remember: (memory: V, state: U) => U) => {TimeTraveler} }
     * 
     * @memberOf TTStore
     */
    function createTimeTraveler<U>(pick: (state: T) => U) {
      
      /**
       * Create Time Traveler
       * 
       * @template V
       * @param {(state: U) => V} memorize - Time traveler memorize the return value of the memorize function when state changed
       * @param {(memory: V, state: U) => U} remember - Remember the state value from memories and current state.
       * @returns {TimeTraveler}
       * 
       */
      return <V>( memorize: (state: U) => V, remember: ( memory: V, state: U ) => U ) => {
        const remember$ = createAction(pick)<V>( (previousState, memory) =>  remember(memory, previousState) );
        
        return new TimeTraveler(
          memorize, remember$, subscribe(pick)
        );
      }
    }

    return { createAction, subscribe, createTimeTraveler };
}

export default startTTPrimitate 