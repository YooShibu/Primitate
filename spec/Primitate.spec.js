/// <reference path="../typings/globals/jasmine/index.d.ts" />

const startPrimitate = require("../lib/Primitate").default;
const addon = require("../lib/AddonSample").default;
const deepClone = require("../lib/utility").deepClone;

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


  // it("Hash. But the Hash's root value is not [object Object] or [object Array]", () => {
  //   const initialState = { count: 0 };
  //   initialize(initialState, "initialState's root value must be Hash or Array. e.g. { counter: { count: 0 } }");
  // });


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


describe("deepClone", () => {
  it("create another value", () => {
    const val = { foo: [3, 2, { bar: [ 9, 22, { foo2: "Hello" }, { foo2: 342 } ]} ] };
    const dcVal = deepClone(val);

    expect(val.foo[2].bar[3].foo2).toBe(dcVal.foo[2].bar[3].foo2);
    expect(val.foo[2].bar[3]).not.toBe(dcVal.foo[2].bar[3]);
  });
});


describe("Action", () => {
  let increment, increment$, createAction, subscribe;  

  beforeEach(() => {
    primitate = startPrimitate({ counter: { count: 0 } });
    createAction = primitate.createAction;
    subscribe = primitate.subscribe;
    increment = x => x + 1;
    increment$ = createAction( state => state.counter.count )(increment);
  });
  
  
  // it("needs value that store contains.", () => {
  //   expect( () => { createAction( state => ({ c: 0 }) )() } )
  //     .toThrowError('Cannot find [object Object] in state. createAction\'s argument shuld be like "state => state.counter"');
  // });
  
  
  it("returns same value of source function", () => {
    const results = [0, 1, 2, 3];
    
    for (let i = 0; i < results.length - 1; i++) {
      expect(increment(results[0])).toEqual(results[1]);
      expect(increment$().value()).toEqual(results[1]);
      results.shift();
    }
  });


  it("recieves initialState and state tree", () => {
    const results = [ { counter: { count: 0 } }, { counter: { count: 1 } }, { counter: { count: 2 } } ];

    const increment$ = createAction( state => state.counter )( (previousState, next, initialState, stateTree) => {
      expect(initialState).toEqual({ count: 0 });
      expect(stateTree).toEqual(results[0]);
      results.shift();
      return { count: previousState.count + 1 };
    });

    increment$();
    increment$();
    increment$();

    expect(results.length).toBe(0);
  });


  it("can receive an argument", () => {
    const increment = (currentCount, next) => { return { count: currentCount.count + next } };
    const increment$ = createAction( state => state.counter )(increment);

    expect(increment$(1).value()).toEqual({ count: 1 });
    expect(increment$(5).value()).toEqual({ count: 6 });
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
    subscribe( state => state.counter )( state => {
      expect(state).toEqual({ counter: { count: 0 } })
    });
  });


  it("called when state changed", () => {
    let called = 0;
    const results = [ { count: 0 }, { count: 1 }, { count: 2 }, { count: 3 } ];

    subscribe( state => state.counter )( state => {
      expect(state).toEqual({ counter: results[0] });
      results.shift();
      called++;
    });

    increment$();
    increment$();
    increment$();

    expect(called).toBe(4);
    expect(results.length).toBe(0);
  });


  it("set some picks", () => {
    const { createAction, subscribe } = startPrimitate({
      counter1: { count: 0 }
    , counter2: { count: 0 }
    });

    function increment(prev) {
      return { count: prev.count + 1 };
    }

    const increment1$ = createAction( state => state.counter1 )(increment);
    const increment2$ = createAction( state => state.counter2 )(increment);

    let count = 0;

    const unsubscribe = subscribe(
      state => state.counter1
    , state => state.counter2
    )( state => count++ );

    increment1$();
    increment1$();
    increment2$();

    expect(count).toBe(4);
  });

  it("listener is emitted when return value of function changed", () => {
    const { createAction, subscribe } = startPrimitate({
      counter1: { count: 0 },
      counter2: { count: 0 }
    });

    function increment(prev) {
      return { count: prev.count + 1 };
    }

    const increment1$ = createAction( state => state.counter1 )(increment);
    const increment2$ = createAction( state => state.counter2 )(increment);

    let count = 0;

    const unsubscribe = subscribe(
      state => state.counter1
    )( state => count++ );

    increment1$();
    increment1$();
    increment2$();

    expect(count).toBe(3);
  });


  it("listeners are emitted whenever the value of pick returned was changed", () => {
    const { createAction, subscribe } = startPrimitate({ user: { name: "", age: 0 } });

    const setUser$ = createAction( state => state.user)( prev => prev );
    const setUserName$ = createAction( state => state.user.name )( (prev, next) => next );

    let count_user = 0
      , count_name = 0
      , count_age = 0;

    subscribe( state => state.user )( () => count_user++ );
    subscribe( state => state.user.name )( () => count_name++ );
    subscribe( state => state.user.age )( () => count_age++ );

    setUserName$("");
    setUser$();
    setUserName$(""); 
    setUserName$("");

    expect(count_user).toBe(5); 
    expect(count_name).toBe(5); 
    expect(count_age).toBe(2); 
  })


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
      expect(state).toEqual({ counter: results[0] });
      results.shift();
    });

    increment$(1);
    increment$(9);

    expect(results.length).toBe(0);
  });

});
