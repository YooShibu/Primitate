/// <reference path="../node_modules/@types/jasmine/index.d.ts" />

const { Primitate } = require("../lib/Primitate");


function spyOnAll(obj) {
  Object.keys(obj).forEach( key => spyOn(obj, key).and.callThrough() );
}

const Err_NullUndefined = "Primitate cannot include null or undefined"
const Err_TypeofObject = "Primitate cannot include typeof 'object' except [object Object] and [object Array]";

function createErrMsgTypeDiff(Value, InitialValue) {
  return ["Primitate not allow changing the state structure."
         ,`Your value '${Value}' must be typeof '${typeof InitialValue}'`].join(" ");
}

function identity(x) { return x; }
function increment(x) { return x + 1; }
function add(x, y) { return x + y; }


describe("InitialState", () => {
  function expectNotThrow(InitialState) {
    expect( () => Primitate(InitialState)).not.toThrow();
  }

  function expectThrowError(InitialState, ErrMsg) {
    expect( () => Primitate(InitialState)).toThrowError(ErrMsg);
  }


  it("is a primitive value", () => expectNotThrow(0) );


  it("is a [object Array]", () => {
    expectNotThrow([]);
    expectNotThrow([1, 2]); 
    expectNotThrow([[1, 2,  3], [1, 2, 3]]);
    expectNotThrow([[[1, 2,  3], [1, 2, 3]], [[1, 2, 3, 4], [1, 3, 4, 5]]]);
  });


  it("is a [object Object]", () => {
    expectNotThrow({});
    expectNotThrow({ count: 0 });
  });


  it("is a complex [object Object]", () => {
    const InitialState =
    { counter: [{count: 0}, {count: 0}]
    , foo: { foo1: "", foo2: { foo3: ["Hello", "Hello"] } }
    , bar: { bar1: 0 }
    }
    expectNotThrow(InitialState);
  });


  it("cannot contains typeof object except [object Object] and [object Array]", () => {
    // error typeof object
    function eto(InitialState) { expectThrowError(InitialState, Err_TypeofObject); }
    eto(new Date());
    eto([1, 2, new Date()]);
    eto({ date: new Date()});
    eto({ foo: { bar: [new Date(), new Date()]} });
  });


  it("cannot contains null or undefined", () => {
    // error null or undefined
    function enu(InitialState) { expectThrowError(InitialState, Err_NullUndefined); }
    enu();
    enu([1, 2, undefined]);
    enu([[1, 2, 3], [1, 2, undefined]]);
    enu({ foo: { bar: [1, undefined] } });
    enu({ foo: { bar: { yoo: undefined } }, foo2: {} })
    enu({ foo: { bar: [{ count: 0 }, { count: undefined }] } });
  });


  it("cannot contains an array contains different type", () => {
    expectThrowError([1, "Hello"], createErrMsgTypeDiff("Hello", 0));
    expectThrowError({ foo: "Hello", bar: [1, 1, "Hello"]}, createErrMsgTypeDiff("Hello", 0));
  });
});


describe("Action", () => {
  describe("passes", () => {
    it("previous state", () => {
      const Counter = Primitate(0);

      const results = [0, 1, 2, 3];
      const increment$ = Counter.createAction( count => {
        expect(count).toBe(results.shift());
        return increment(count);
      });

      increment$();
      increment$();
      increment$();
      increment$();
      expect(results.length).toBe(0);
    });


    it("the pick returns value", () => {
      const Counter = Primitate({ counter: { count: 0 } });
      const increment$ = Counter.createAction(increment, s => s.counter.count);

      expect(increment$()).toBe(1);
      expect(increment$()).toBe(2);
    });


    it("next value", () => {
      const Counter = Primitate(0);
      const add$ = Counter.createAction(add);

      expect(add$(10)).toBe(10);
      expect(add$(5)).toBe(15);
    });


    it("initial state", () => {
      const Counter = Primitate(0);
      const InitialStates = [0, 0, 0];
      const incremenet$ = Counter.createAction( (count, next, initialState) => {
        expect(InitialStates.shift()).toBe(initialState);
        return increment(count);
      });

      incremenet$();
      incremenet$();
      incremenet$();
      expect(InitialStates.length).toBe(0);
    });


    it("state tree", () => {
      const Counter = Primitate({ counter: { count: 0 } });
      const states = [ { counter: { count: 0 } }, { counter: { count: 1 } }, { counter: { count: 2 } } ];
      const increment$ = Counter.createAction( (count, next, ini, stateTree) => {
        expect(states.shift()).toEqual(stateTree);
        return increment(count);
      }, s => s.counter.count );

      increment$();
      increment$();
      increment$();
      expect(states.length).toBe(0);
    });


    it("state as state tree if the state is primitive value or [object Array]", () => {
      const Source_Funcs = {
        increment(count, next, ini, stateTree) {
          expect(count).toBe(stateTree);
          return increment(count);
        }
      , twice(nums, next, ini, stateTree) {
          expect(nums).toBe(stateTree);
          return nums.map( num => num * 2 ); 
        }
      }
      spyOnAll(Source_Funcs);
      
      const Counter = Primitate(0);
      const incremenet$ = Counter.createAction(Source_Funcs.increment);
      incremenet$();
      incremenet$();
      expect(Source_Funcs.increment).toHaveBeenCalledTimes(2);

      const Nums = Primitate([1, 2, 3]);
      const twice$ = Nums.createAction(Source_Funcs.twice);
      twice$();
      twice$();
      expect(Source_Funcs.twice).toHaveBeenCalledTimes(2);
    });
  });

  describe("returns", () => {
    it("the same value as source function returns", () => {
      const SourceResult = increment(0);

      const Counter = Primitate(0);
      const incremnt$ = Counter.createAction(increment);
      const Result = incremnt$();
      expect(Result).toBe(SourceResult);
    });

    it("previous state if the state did not changed", () => {
      const Counter = Primitate({ counter: { count: 0 } });
      const add$ = Counter.createAction( (count, next) => {
        return { count: next };
      }, s => s.counter );
      expect(Object.isFrozen(add$(0))).toBe(true);
    });
  });


  describe("changes the state that type of is", () => {
    it("number", () => {
      const Counter = Primitate(0);
      const incremenet$ = Counter.createAction(increment);
      expect(incremenet$()).toBe(1);
      expect(incremenet$()).toBe(2);
    });


    it("string", () => {
      const Memo = Primitate("");
      const memo$ = Memo.createAction( (p, n) => n );
      expect(memo$("Hello")).toBe("Hello");
      expect(memo$("See you")).toBe("See you");
    });

    it("empty array", () => {
      const Users = Primitate([]);
      const addUser$ = Users.createAction( (p, n) => p.concat(n) );

      const user1 = { name: "Oda", email: "xxx" };
      const user2 = { name: "Uesugi", email: "xxx" };
      expect(addUser$(user1)).toEqual([user1]);
      expect(addUser$(user2)).toEqual([user1, user2]);
      expect(Users.getCurrentState()).toEqual([user1, user2]);
    });
  });


  describe("is safety to manage the state because", () => {
    it("passes deep freezed value", () => {
      const Source_Funcs = {
        act(prevState, next, ini, stateTree) {
          expect(Object.isFrozen(stateTree)).toBe(true);
          expect(Object.isFrozen(prevState.foo2)).toBe(true);
          expect(Object.isFrozen(prevState.foo3)).toBe(true);
          expect(Object.isFrozen(prevState.foo3.foo6)).toBe(true);
          expect(Object.isFrozen(stateTree.bar1.bar2)).toBe(true);
          return {
              foo2: { foo4: increment(prevState.foo2.foo4) }
            , foo3: { foo5: increment(prevState.foo3.foo5)
                    , foo6: { foo7: increment(prevState.foo3.foo6.foo7)}
                    }
            };
        }
      }
      spyOn(Source_Funcs, "act").and.callThrough();
      
      const P = Primitate({
        foo1: { foo2: { foo4: 0 }, foo3: { foo5: 0, foo6: { foo7: 0 }  } }
      , bar1: { bar2: { bar3: 0 } } });
      const act$ = P.createAction(Source_Funcs.act, s => s.foo1);
      act$();
      act$();
      act$();
      expect(Source_Funcs.act).toHaveBeenCalledTimes(3);
    }); 


    it("returns deep cloned value.", () => {
      function incrementCount(counter) { return { count: counter.count + 1 }; }

      const Counter = Primitate({ counter: { count: 0 } });
      const increment$ = Counter.createAction(incrementCount, s => s.counter );
      const result1 = increment$();
      result1.count = 10000;
      const result2 = increment$();
      expect(result1).toEqual({ count: 1 });
      expect(result2).toEqual({ count: 2 });
    });


    describe("throw errors when", () => {
      it("it returns null or undefined value contained", () => {
        // primitive
        const Counter = Primitate(0);
        const incremenet$ = Counter.createAction( () => undefined);
        expect(() => incremenet$()).toThrowError(Err_NullUndefined);
        
        // array
        const Nums = Primitate([0, 0, 0]);
        const act$ = Nums.createAction( () => [0, 0, undefined] );
        expect(() => act$()).toThrowError(Err_NullUndefined);

        // object
        const Counter2 = Primitate({ counter: { count: 0 } });
        const incremenet$2 = Counter2.createAction( () => ({ count: undefined }), s => s.counter );
        expect(() => incremenet$2()).toThrowError(Err_NullUndefined);
      });


      it("it returns a defferent type of value", () => {
        // primitive
        const Counter = Primitate(0);
        const act$ = Counter.createAction( () => "Hello" );
        expect(() => act$()).toThrowError(createErrMsgTypeDiff("Hello", 0));

        // array
        const Nums = Primitate([0, 1, 2]);
        const act$2 = Nums.createAction( () => [0, 1, "Hello"]);
        expect(() => act$2()).toThrowError(createErrMsgTypeDiff("Hello", 0));

        // object
        const Counter2 = Primitate({ counter: { count: 0 } });
        const act$3 = Counter2.createAction( count => {
          return { count: "GoodNight" };
        }, s => s.counter );
        expect(() => act$3()).toThrowError(createErrMsgTypeDiff("GoodNight", 0));
      });


      it("object has extra key than the initial state.", () => {
        const Counter = Primitate({ counter: { count: 0 } });
        const act$ = Counter.createAction(() => ({ count: 1, msg: "Opps" }), s => s.counter);
        expect(() => act$()).toThrowError("Cannot change the state structure. You have an extra key 'msg'");
      });

      
      it("object lacks key than the initial state.", () => {
        const Counter = Primitate({ foo: { foo1: 0, foo2: 0 } });
        const act$ = Counter.createAction(() => ({ foo1: 1 }), s => s.foo );
        expect(() => act$()).toThrowError("Cannot change the state structure. You lack key 'foo2'");
      });
    });
  });


  it([ "does not emit itself if"
      , "previous Action did not change the state"
      , "and current Action gets same arugument as previous it"
      ].join(" "), () => {
    const Source_Funcs =
    { add(count, next) { return count + next; }
    , multiple(nums, coefficient) { return nums.map( num => num * coefficient )}
    , add2(counter, next) { return { count: counter.count + next } }
    }
    spyOnAll(Source_Funcs);
    
    // primitive
    const Counter = Primitate(0);
    const add$ = Counter.createAction(Source_Funcs.add); 
    add$(0);
    add$(0);
    add$(0);
    expect(Source_Funcs.add).toHaveBeenCalledTimes(1);
    
    // array
    const Nums = Primitate([3, 1, 2]);
    const multiple$ = Nums.createAction(Source_Funcs.multiple);
    multiple$(1);
    multiple$(1);
    multiple$(1);
    expect(Source_Funcs.multiple).toHaveBeenCalledTimes(1);


    // object
    const Counter2 = Primitate({ counter: { count: 0 } });
    const add$2 = Counter2.createAction(Source_Funcs.add2, s => s.counter );
    add$2(0);
    add$2(0);
    add$2(0);
    expect(Source_Funcs.add2).toHaveBeenCalledTimes(1);
  });
});



describe("Subscribe", () => {
  it("needs a listener emitted in async and when setup", done => {
    const Counter = Primitate(0);
    Counter.subscribe(done);
  });


  it("passes current state to the listener", done => {
    const Counter = Primitate(0);
    Counter.subscribe( count => {
      expect(count).toBe(0);
      done();
    });
  });
  

  it("passes current state deep freezed", done => {
    const Counter = Primitate({ counter: { a: { count: 0 }, b: { count: 0 } } });
    Counter.subscribe( s => {
      expect(Object.isFrozen(s.counter.a)).toBe(true);
      expect(Object.isFrozen(s.counter.b)).toBe(true);
      done();
    }, [s => s.counter]);
  });


  it("emits listeners in lazy", done => {
    const Source_Funcs =
    { Lis_1(s) {
        expect(s).toEqual({ foo: 3, bar: 0 });
        expect(Source_Funcs.Lis_1).toHaveBeenCalledTimes(1);
        expect(Source_Funcs.Lis_2).toHaveBeenCalledTimes(1);
        done();
      }
    , Lis_2(s) {
        expect(s).toEqual({ foo: 3, bar: 0 });
      }
    }
    spyOnAll(Source_Funcs);

    const Sample = Primitate({ foo: 0, bar: 0 });
    const incFoo$ = Sample.createAction(increment, s => s.foo );
    const incBar$ = Sample.createAction(increment, s => s.bar );
    Sample.subscribe(Source_Funcs.Lis_1, [s => s.foo]);
    Sample.subscribe(Source_Funcs.Lis_2, [s => s.bar]);

    incFoo$();
    incFoo$();
    incFoo$();
  });
  

  it("returns a function to unsubscribe", done => {
    const Source_Funcs =
    { listener1() {}
    , listener2() {
        expect(Source_Funcs.listener1).toHaveBeenCalledTimes(1);
        expect(Source_Funcs.listener2).toHaveBeenCalledTimes(1);
        done();
      }
    };
    spyOnAll(Source_Funcs);
    
    const Counter = Primitate(0);
    const increment$ = Counter.createAction(increment);

    const unsubscribe1 = Counter.subscribe(Source_Funcs.listener1);
    const unsubscribe2 = Counter.subscribe(Source_Funcs.listener2);

    increment$();
    unsubscribe1();
    increment$();
  });


  it("can be set some picks", done => {
    const Source_Funcs =
    { Lis_Foo() {}
    , Lis_Bar() {}
    , Lis_FooBar() {}
    }
    spyOnAll(Source_Funcs)

    const Test = Primitate(false);
    const doneTest$ = Test.createAction( () => true );
    Test.subscribe( d => {
      if (d) {
        expect(Source_Funcs.Lis_Foo).toHaveBeenCalledTimes(2);
        expect(Source_Funcs.Lis_Bar).toHaveBeenCalledTimes(3);
        expect(Source_Funcs.Lis_FooBar).toHaveBeenCalledTimes(3);
        done();
      }
    });

    const Sample = Primitate({ foo: 0, bar: 0 });
    const incFoo$ = Sample.createAction(increment, s => s.foo);
    const incBar$ = Sample.createAction(increment, s => s.bar);
    Sample.subscribe(Source_Funcs.Lis_Foo, [s => s.foo]);
    Sample.subscribe(Source_Funcs.Lis_Bar, [s => s.bar]);
    Sample.subscribe(Source_Funcs.Lis_FooBar, [s => s.bar, s => s.foo]);
    incBar$();
    setTimeout(incFoo$, 10);
    setTimeout(incBar$, 20);
    setTimeout(doneTest$, 30);
  });


  it("emit listener when specified value by pick was changed", done => {
    const Source_Funcs = {
      Lis_Foo(s) { expect(s).toEqual({ foo: 0, bar: 2 }); }
    , Lis_Bar(s) { 
        expect(Source_Funcs.Lis_Foo).toHaveBeenCalledTimes(1);
        expect(Source_Funcs.Lis_Bar).toHaveBeenCalledTimes(1);
        expect(s).toEqual({ foo: 0, bar: 2 });
        done();
      }
    };
    spyOnAll(Source_Funcs);
    
    const Sample = Primitate({ foo: 0, bar: 0 });
    const incBar$ = Sample.createAction(increment, s => s.bar);
    Sample.subscribe(Source_Funcs.Lis_Bar, [s => s.bar]);
    Sample.subscribe(Source_Funcs.Lis_Foo, [s => s.foo]);
    incBar$();
    incBar$();
  });


  it("listener depth", done => {
    const Source_Funcs = {
      Lis() {}, Lis_Foo1() {}, Lis_Foo2() {}
    , Lis_Foo3() {}, Lis_Foo4() {}, Lis_Foo5() {}
    , Lis_Bar() {}
    };
    spyOnAll(Source_Funcs);
    
    const Sample = Primitate({ foo: { foo1: 0, foo2: 0, foo3: { foo4: 0, foo5: 0 } }, bar: 0 });
    const incFoo1$ = Sample.createAction( increment, s => s.foo.foo1 );
    const incFoo2$ = Sample.createAction( increment, s => s.foo.foo2 );
    const incFoo3$ = Sample.createAction( () => ({ foo4: 10, foo5: 0 }), s => s.foo.foo3);
    const incFoo4$ = Sample.createAction( increment, s => s.foo.foo3.foo4 );
    const incFoo5$ = Sample.createAction( increment, s => s.foo.foo3.foo5 );
    Sample.subscribe( Source_Funcs.Lis, [s => s.foo] );
    Sample.subscribe( Source_Funcs.Lis_Foo1, [s => s.foo.foo1]);
    Sample.subscribe( Source_Funcs.Lis_Foo2, [s => s.foo.foo2]);
    Sample.subscribe( Source_Funcs.Lis_Foo3, [s => s.foo.foo3]);
    Sample.subscribe( Source_Funcs.Lis_Foo4, [s => s.foo.foo3.foo4]);
    Sample.subscribe( Source_Funcs.Lis_Foo5, [s => s.foo.foo3.foo5]);
    Sample.subscribe( Source_Funcs.Lis_Bar, [s => s.bar]);

    setTimeout(incFoo1$, 10); // foo foo1
    setTimeout(incFoo2$, 20); // foo foo2
    setTimeout(incFoo3$, 30); // foo foo3 foo4 foo5
    setTimeout(incFoo4$, 40); // foo foo3 foo4
    setTimeout(incFoo5$, 50); // foo foo3 foo5
    setTimeout(() => {
      expect(Source_Funcs.Lis).toHaveBeenCalledTimes(6);
      expect(Source_Funcs.Lis_Foo1).toHaveBeenCalledTimes(2);
      expect(Source_Funcs.Lis_Foo2).toHaveBeenCalledTimes(2);
      expect(Source_Funcs.Lis_Foo3).toHaveBeenCalledTimes(4);
      expect(Source_Funcs.Lis_Foo4).toHaveBeenCalledTimes(3);
      expect(Source_Funcs.Lis_Foo5).toHaveBeenCalledTimes(3);
      expect(Source_Funcs.Lis_Bar).toHaveBeenCalledTimes(1);
      done();
    }, 60);
  });
});