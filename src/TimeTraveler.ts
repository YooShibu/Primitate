import { deepFreeze } from "./utility"

export interface TravelerState<T> {
  index: number
  canBackToThePast: boolean
  canBackToTheFuture: boolean
  memories: T[]
} 

export default class TimeTraveler<Memory, State> {
  private index: number = 0
  private isTravering: boolean = false
  private memories: Memory[] = []
  private unsubscribe: () => void
  private listeners: ( (travelerState: TravelerState<Memory> ) => void)[] = []

  constructor(
    memorize: (state: State) => Memory | void
  , private remember: ( memory: Memory ) => State
  , subscriber: ( listener: (state: State) => void ) => () => void ) {

    this.unsubscribe = subscriber( state => {
      if (!this.isTravering) {

        if (this.index > 0) {
          this.memories.splice(0, this.index);
          this.index = 0;
        }

        const memory = memorize(state);
        if (memory !== undefined && memory !== null) {
          this.memories.unshift(
            deepFreeze<Memory>(memory)
          );
        }
      }

      const ts = this.createTravelerState()
      this.listeners
        .forEach( listener => listener(ts) );
    });
  }

  protected createTravelerState(): TravelerState<Memory> {
    const travelerState =
      { index: this.index
      , canBackToThePast: this.index + 1 !== this.memories.length
      , canBackToTheFuture: this.index > 0
      , memories: [].concat(this.memories)
      }

    return travelerState
  }

  public subscribe(listener: ( travelerState: TravelerState<Memory> ) => void) {
    this.listeners.push(listener);
    listener( this.createTravelerState() );

    return this.endTravel();
  }

  public tellMyMemories(listener: <U>( memories: Memory[], arg?: any ) => U) {
    return (arg?: any) => {
      return listener([].concat(this.memories), arg);
    }
  }

  private back(canBack: (travelerState: TravelerState<Memory>) => boolean, num: number) {
    return () => {
      if (this.memories.length === 0 || !canBack(this.createTravelerState()))
        return false
      
      this.index = this.index + num;
      if (this.index === Infinity)
        throw new Error("I can not remember Infinity of memories.");

      this.isTravering = true;

      this.remember(this.memories[this.index]);
      
      this.isTravering = false;
      
      return true;
    }
  }

  public backToThePast() {
    return this.back( (travelerState: TravelerState<Memory>) => travelerState.canBackToThePast, 1);
  }

  public backToTheFuture() {
    return this.back( (travelerState: TravelerState<Memory>) => travelerState.canBackToTheFuture, -1);
  }

  public endTravel() {
    return () => {
      this.unsubscribe();
      this.memories = [];
      this.index = 0;
      this.listeners = [];
    }
  }
  
}