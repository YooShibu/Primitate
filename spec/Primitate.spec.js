/// <reference path="../typings/globals/jasmine/index.d.ts" />

const startPrimitate = require("../lib/Primitate").default;
const addon = require("../lib/AddonSample").default;

describe("Start Primitate with initialState of", () => {
  function initialize(initialState, msg) {
    expect(() => { startPrimitate(initialState) }).toThrowError(msg);
  }


  it("non Hash", () => {
    const msg = "initialState must be Hash.  e.g. { counter: { count: 0 } }";
    initialize(undefined, msg);
    initialize(0, msg);
    initialize("Hello", msg);
    initialize(true, msg);
    initialize(new Date(), msg);
    initialize(() => {}, msg);
  });


  it("Hash. But the Hash's root value is not [object Object] or [object Array]", () => {
    const initialState = { count: 0 };
    initialize(initialState, "initialState's root value must be Hash or Array. e.g. { counter: { count: 0 } }");
  });


  it("Hash that contains null or undefined", () => {
    const initialState = { counter: { count: undefined } };
    initialize(initialState, "State can't contain null or undefined value");
  })


  it("Hash that contains non primitive value", () => {
    const initialState = { foo: { bar: new Date() } };
    const msg =
      [ "State can include primitive values or [object Object] or [object Array]." 
      , "But you included [object Date] in the state"].join(" ");
    initialize(initialState, msg);
   });


  it("right structure", () => {
    const initialState =
      { counter: { count: 0 }
      , foo: [{ bar: "Hello" }, { bar: "Good night" }]   
      };
    expect( () => { startPrimitate(initialState) }).not.toThrow();
  });

});


describe("Action", () => {
  let increment, increment$, createAction, subscribe;  

  beforeEach(() => {
    primitate = startPrimitate({ counter: { count: 0 } });
    createAction = primitate.createAction;
    subscribe = primitate.subscribe;
    increment = (currentCount) => { return { count: currentCount.count + 1 } }
    increment$ = createAction( state => state.counter )(increment);
  });
  
  
  it("needs value that store contains.", () => {
    expect( () => { createAction( state => ({ c: 0 }) )() } )
      .toThrowError('Cannot find [object Object] in state. createAction\'s argument shuld be like "state => state.counter"');
  });
  
  
  it("returns same value of source function", () => {
    const results = [{ count: 0 }, { count: 1 }, { count: 2 }, { count: 3 }];

    for (let i = 0; i < results.length - 1; i++) {
      expect(increment(results[0])).toEqual(results[1]);
      expect(increment$()).toEqual(results[1]);
      results.shift();
    }
  });


  it("recieves initialState", () => {
    const increment$ = createAction( state => state.counter )( (previousState, next, initialState) => {
      expect(initialState).toEqual({ count: 0 });
      return { count: previousState.count + 1 };
    });

    increment$();
    increment$();
  });


  it("can receive an argument", () => {
    const increment = (currentCount, next) => { return { count: currentCount.count + next } };
    const increment$ = createAction( state => state.counter )(increment);

    expect(increment$(1)).toEqual({ count: 1 });
    expect(increment$(5)).toEqual({ count: 6 });
  });

});


describe("Subscribe", () => {
  let increment, increment$, createAction, subscribe;  

  beforeEach(() => {
    primitate = startPrimitate({ counter: { count: 0 } });
    createAction = primitate.createAction;
    subscribe = primitate.subscribe;
    increment = (currentCount) => { return { count: currentCount.count + 1 } }
    increment$ = createAction( state => state.counter )(increment);
  });
  

  it("called when created", () => {
    subscribe( state => state.counter)( state => { expect(state).toEqual({ count: 0 }) } );
  });


  it("called when state changed", () => {
    let called = 0;
    subscribe( state => state.counter )( state => {
      called++;
    });

    increment$();
    increment$();
    increment$();

    expect(called).toBe(4);
  });


  it("can unsubscribe", () => {
    let called = 0;
    const unsubscribe = subscribe( state => state.counter )( state => {
      called++;
    });

    increment$();
    increment$();

    unsubscribe();
    
    increment$();

    expect(called).toBe(3);
  });
  
  
  it("cannot change state. Because all of state members are frozen.", () => {
    subscribe( state => state.counter )( state => {
      state.foo = "Hello";
      expect(state.foo).toBe(undefined);
      expect(Object.isFrozen(state)).toBe(true);
    });

    increment$();
    increment$();
  });

});


describe("Apply addon", () => {

  it("applyAddon passes createAction, subscribe and state type.", () => {
    const { subscribe, applyAddon } = startPrimitate({ counter: { count: 0 } });

    const actionSource = applyAddon(addon);
    const increment$ = actionSource( state => state.counter )( (counter, next) => {
      return { count: counter.count + next };
    });

    const results = [ { count: 0 }, { count: 1 }, { count: 10 } ];
    subscribe( state => state.counter )( state => {
      expect(state).toEqual(results[0]);
      results.shift();
    });

    increment$(1);
    increment$(9);

    expect(results.length).toBe(0);
  });

});
