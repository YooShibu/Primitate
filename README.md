# Primitate
[![Build Status](https://travis-ci.org/YooShibu/Primitate.svg?branch=master)](https://travis-ci.org/YooShibu/Primitate)

Primitate is a javascript library for managing state of your app by the only two methods.

## Methods
* **createAction:** Create a function the only way to change the state.
* **subscribe:** Emit functions when state was changed by the Action.


## Official packages
* **[react-primitate](https://github.com/YooShibu/React-Primitate)** React binding 


## Install
```sh
npm install --save primitate
```


## How to use

### Case 1: Initial state is a primitive value or Array
``` js
/* import { Primitate } from "primitate"  // ES2015 modules style */
const { Primitate } = require("primitate");

// ---------------------------
// 1. Create Primitate Item
// ---------------------------
const Counter = Primitate(0);


// ---------------------------
// 2. Create Action
// ---------------------------
function increment(x) { return x + 1; }
const increment$ = Counter.createAction(increment);


// ---------------------------
// 3. Subscribe
// ---------------------------
const unsubscribe =
  Counter.subscribe( count => console.log(count) );


// ---------------------------
// 4. Emit Action !!
// ---------------------------
increment$();
increment$();
// console.log: 2
```

### Case 2: Initial state is an object
```js
const { Primitate } = require("primitate");


// ---------------------------
// 1. Create Primitate Item
// ---------------------------
const Counter = Primitate({ counter: 0 });


// ---------------------------
// 2. Create Action
// ---------------------------
function increment(x) {
  return x + 1;
}
const increment$ = Counter.createAction(
    increment,
    state => state.counter
  );


// ---------------------------
// 3. Subscribe
// ---------------------------
const unsubscribe = Counter.subscribe(
    state => console.log(state),
    state => state.counter
  );

  
// ---------------------------
// 4. Emit Action !!
// ---------------------------
increment$();
increment$();
// console.log({ counter: 2 });
```


## Documentation
In preparation...


## Lisence
MIT