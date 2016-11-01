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
``` js
/* import { Primitate } from "primitate"  // ES2015 modules style */
const { Primitate } = require("primitate");

// ---------------------------
// 1. Create Primitate
// ---------------------------
const Counter = Primitate(0);


// ---------------------------
// 2. Create Action
// ---------------------------
function increment(x) { return x + 1; }
const increment$ = Counter.createAction( state => state )(increment);


// ---------------------------
// 3. Subscribe
// ---------------------------
const unsubscribe =
  Counter.subscribe( state => state )( count => console.log(count) );


// ---------------------------
// 4. Emit Action !!
// ---------------------------
increment$();
increment$();
// console.log: 2
```


## What means `state => state` ?
It means 'I want to manage state of the state'. In the 'How to Use', Primitate gets 0 as the initial state. So the state is a value of number.

If your initial state is an object and you want to manage value of the object. Write like this.
```js
const Counter = Primitate({ counter: { count: 0 } });

function increment = function(x) { return x + 1; }
// I want to manage count...
const increment$ = Counter.createAction( state => state.counter.count )(increment);
```


## Documentation
In preparation...


## Lisence
MIT