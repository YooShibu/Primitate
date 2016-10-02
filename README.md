# Primitate
[![Build Status](https://travis-ci.org/YooShibu/Primitate.svg?branch=master)](https://travis-ci.org/YooShibu/Primitate)

Primitate is a javascript library for managing the states of the data that the program handle.

In fact Primitate is an implementation of an architecture. The architecture consists of three elements. Store, Action and Subscribe.

* **Store:** Store holds current state but not appear in a code. You can store primitive values (non null or undefined) and [object Object] and [object Array]. 
* **Action:** Action is the only way to change the state. When you emit an Action, the return value of the source function automatically merged with state.
* **Subscribe:** Subscribe is a set of listener. The listener is a function. Listener receives a current state when state changed by the Action.

And Primitate provides a addon system.


## Official Addons

* [Primitate-TimeTravel](https://github.com/YooShibu/Primitate-TimeTravel): Provides a simple way to undo and redo
* [React-Primitate](https://github.com/YooShibu/React-Primitate): Connect Primitate and React


## Install
 
```sh
npm install primitate
```


## Examples

### Primitate

``` js
const startPrimitate = require("primitate").default;


const initialState = { counter: { count: 0 } };

// @params initialState: { count: 0 }
// @params stateTree: { counter: { count: } }
function increment(previousState, next, initialState, stateTree) {
  return { count: previousState.count + 1 };
}


const { createAction, subscribe } = startPrimitate(initialState);

const increment$ = createAction( state => state.counter )(increment);

const unsubscribe = subscribe( state => state.counter )( state => {
  const counter = state.counter;
  if (Object.isFrozen(counter))
    console.log(counter);
});
// console: { count: 0 }


const a = increment$();
console.log(a.value());
// a: { count: 1 }   console: { count: 1 }

const b = increment$();
console.log(b.value());
// b: { count: 2 }   console: { count: 2 }
```


## More Info
In preparation...

## Lisence
MIT