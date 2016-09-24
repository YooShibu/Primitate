# Primitate

Primitate is a javascript library for managing the states of the data that the program handle.

In fact Primitate is an implementation of an architecture. The architecture consists of three elements. Store, Action and Subscribe.

* **Store:** Store holds current state but not appear in a code. You can store primitive values (non null or undefined) and [object Object] and [object Array]. 
* **Action:** Action is the only way to change the state. When you emit an Action, the return value of the source function automatically merged with state.
* **Subscribe:** Subscribe is a set of listener. The listener is a function. Listener receives a current state when state changed by the Action.

And Primitate provides a simple way to undo and redo.

## Install
 
```sh
npm install primitate
```

## Examples

### Primitate

``` js
const { startPrimitate } = require("primitate");


const initialState = { counter: { count: 0 } };

function increment(previousState, next, initialState) {
  return { count: previousState.count + 1 };
}


const { createAction, subscribe } = startPrimitate(initialState);

const increment$ = createAction( state => state.counter )(increment);

const unsubscribe = subscribe( state => state.counter )( counter => {
  if (Object.isFrozen(counter))
    console.log(counter);
});
// console: { count: 0 }


const a = increment$();
if (Object.isFrozen(a)) console.log(a);
// a: { count: 1 }   console: { count: 1 }

const b = increment$();
if (Object.isFrozen(b)) console.log(b);
// b: { count: 2 }   console: { count: 2 }
```

### Time Travelable Primitate

``` js
const { startTTPrimitate } = require("primitate");


const initialState = { counter: { count: 0 } };

function increment(previousState, next, initialState) {
  return { count: previousState.count + next };
}


const { createAction, subscribe, createTimeTraveler } = startTTPrimitate(initialState);

const increment$ = createAction( state => state.counter )(increment);

const unsubscribe = subscribe( state => state.counter )( counter => {
  console.log(counter);
});
// console: { count: 0 }


const traveler = createTimeTraveler( state => state.counter )(
  state => state.count,   // memorize
  count => ({ count })    // remember
);
const undo = traveler.backToThePast();
const redo = traveler.backToTheFuture();


increment$(3); // console: { count: 3 }
increment$(7); // console: { count: 10 }

// Start time travel!

undo(); // console: { count: 3 }
redo(); // console: { count: 10 }

undo(); // console: { count: 3 }
undo(); // console: { count: 0 }
undo(); // listener does not called
redo(); // console: { count: 3 }
redo(); // console: { count: 10 }
redo(); // listener does not called
```

## More Info
In preparation...

## Lisence
MIT