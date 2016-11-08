import { Primitate } from "./Primitate"

function add(x: number, y: number) { return x + y; }
function increment(x: number) { return x + 1; }
function upper(x: string) { return x.toUpperCase(); }

const Counter = Primitate({ counter: { count: 0 } });
const add$ = Counter.createAction(add, s => s.counter.count);
const increment$ = Counter.createAction(increment, s => s.counter.count);

add$(3);
increment$()