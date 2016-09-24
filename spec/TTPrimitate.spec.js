/// <reference path="../typings/globals/jasmine/index.d.ts" />

const startTTPrimitate = require("../lib/TTPrimitate").default

describe("Time Travelable Store creates time traveler that", () => {

  let createAction, subscribe, createTimeTraveler, picker, increment;
  
  beforeEach(() => {
    ttprimitate = startTTPrimitate({ counter: { count: 0 } });
    createAction = ttprimitate.createAction;
    subscribe = ttprimitate.subscribe;
    createTimeTraveler = ttprimitate.createTimeTraveler;
    picker = state => state.counter
    increment = createAction(picker)( counter => ({ count: counter.count + 1}) );
  });
  

  it("can back to the past", () => {
    const traveler = createTimeTraveler( state => state.counter )(
      counter => counter.count
    , memory => ({ count: memory }) 
    );
    const undo = traveler.backToThePast();

    let results = [ { count: 0 }, { count: 1 }, { count: 2 }, { count: 3 }, { count: 2 }, { count: 1 }, { count: 0 } ];
    
    subscribe( state => state.counter )( state => {
      expect(state).toEqual(results[0]);
      results.shift();
    });

    increment();
    increment();
    increment();

    expect(undo()).toBe(true);
    expect(undo()).toBe(true);
    expect(undo()).toBe(true);
    expect(undo()).toBe(false);
    expect(undo()).toBe(false);

    expect(results.length).toBe(0);
  });


  it("can back to the future", () => {
    const traveler = createTimeTraveler(picker)(
      state => state.count
    , memory => ({ count: memory })
    );
    const undo = traveler.backToThePast();
    const redo = traveler.backToTheFuture();

    const result = [ { count: 0 }, { count: 1 }, { count: 2 }, { count: 1 }, { count: 0 }, { count: 1 }, { count: 2 } ];
    const unsubscribe = subscribe(picker)( state => {
      expect(state).toEqual(result[0]);
      result.shift();
    });

    increment();
    increment();

    undo();
    undo();
    expect(undo()).toBe(false);
    expect(redo()).toBe(true);
    expect(redo()).toBe(true);
    expect(redo()).toBe(false);
    expect(redo()).toBe(false);

    expect(result.length).toBe(0);
  });


  it("when cannot 'back to the past' or 'back to the future', store not subscribe.", () => {
    const traveler = createTimeTraveler(state => state.counter)(
      counter => counter.count
    , memory => ({ count })
    );
    const redo = traveler.backToTheFuture();
    const undo = traveler.backToThePast();

    let count = 0;
    subscribe( state => state.counter )( state => {
      count++;
    }); // count: 1

    expect(redo()).toBe(false);
    expect(redo()).toBe(false);

    increment(); // count: 2

    expect(undo()).toBe(true); // count: 3
    expect(undo()).toBe(false);
    expect(undo()).toBe(false);

    expect(count).toBe(3);
  });


  it("not memorize when memorize function returns null or undefiend", () => {
    const traveler = createTimeTraveler(picker)(
      counter => undefined
    , count => ({ count })
    );
    const undo = traveler.backToThePast();

    const results = [ { count: 0 }, { count: 1 }];
    const unsubscribe = subscribe(picker)( state => {
      expect(state).toEqual(results[0]);
      results.shift();
    });

    increment();

    expect(undo()).toBe(false);
    expect(results.length).toBe(0);
  });


  it("can tell travelers state when every time the state changed.", () => {
    const traveler = createTimeTraveler(picker)(
      counter => counter.count
    , count => ({ count })
    );

    const indexs = [ 0, 0, 0, 0, 1, 2, 1, 0 ];
    const canBackToThePast = [ false, true, true, true, true, true, true, true ];
    const canBackToTheFuture = [ false, false, false, false, true, true, true, false ];

    traveler.subscribe( travelerState => {
      expect(travelerState.index).toBe(indexs[0]);
      expect(travelerState.canBackToThePast).toBe(canBackToThePast[0]);
      expect(travelerState.canBackToTheFuture).toBe(canBackToTheFuture[0]);
      indexs.shift();
      canBackToThePast.shift();
      canBackToTheFuture.shift();
    }); // index: 0

    const undo = traveler.backToThePast();
    const redo = traveler.backToTheFuture();

    increment(); // index: 0
    increment(); // index: 0
    increment(); // index: 0
    undo(); // index: 1
    undo(); // index: 2
    redo(); // index: 1
    redo(); // index: 0
    expect(redo()).toBe(false);
    
    expect(indexs.length).toBe(0);
    expect(canBackToThePast.length).toBe(0);
    expect(canBackToTheFuture.length).toBe(0);
  });


  it("reset memories before current travlers index when state chenged during the time travel.", () => {
    const traveler = createTimeTraveler(picker)(
      counter => counter.count
    , count => ({ count })
    );
    const undo = traveler.backToThePast();
    const redo = traveler.backToTheFuture();
    
    increment();
    increment();
    increment();

    undo();
    expect(redo()).toBe(true);
    undo();

    increment();

    expect(redo()).toBe(false);
  });


  it("tells us travelerself memories from the latest.", () => {
    const traveler = createTimeTraveler(picker)(
      counter => counter.count
    , count => ({ count })
    );

    const listen = traveler.tellMyMemories( (memories, msg) => {
      expect(memories).toEqual([3, 2, 1, 0]);
      return msg + "It's a wonderfull memories!"
    });

    increment();
    increment();
    increment();

    expect(listen("Wow! ")).toBe("Wow! It's a wonderfull memories!");
  });

});
