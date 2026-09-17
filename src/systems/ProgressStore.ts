import { DUMPLINGS, rollDumpling, STORE_INVENTORY } from '../data/collection.ts';
import { saveId } from './saveId.ts';
import { TRADERS, createTradingDay, negotiate, willing, type Protection, type TraderId, type TradingDay } from '../data/trading.ts';
import { SERIES, STORES, HUNT_RULES, boxPrice, canVisit, createHuntDay, rollSeries, storeById, type HuntDay, type SeriesId } from '../data/hunt.ts';

export const SAVE_KEY = 'arianna.progress.v1';
export interface SaveRepository { read(): string | null; write(value: string): void }
export class LocalSaveRepository implements SaveRepository {
  read() { return localStorage.getItem(SAVE_KEY); }
  write(value: string) { localStorage.setItem(SAVE_KEY, value); }
}
export interface SealedBox { id: string; dumplingId: string; series?: SeriesId }
export interface RevealReceipt extends SealedBox { count: number; isNew: boolean }
export interface ProgressData {
  version: 1; balance: number; collection: Record<string, number>; boxes: SealedBox[];
  creditedRounds: string[]; trip: { active: boolean; purchases: number };
  location: 'cleanup' | 'store' | 'home' | 'collection'; reveal: RevealReceipt | null;
  hunt?: HuntDay;
  trading?: TradingDay;
  protections?: Record<string, Protection>;
}
const fresh = (): ProgressData => ({ version: 1, balance: 0, collection: {}, boxes: [], creditedRounds: [], trip: { active: false, purchases: 0 }, location: 'cleanup', reveal: null });
const validId = (id: unknown) => typeof id === 'string' && DUMPLINGS.some(d => d.id === id);
function parse(raw: string | null): ProgressData {
  if (raw === null) return fresh();
  const value = JSON.parse(raw) as ProgressData;
  if (value?.version !== 1 || !Number.isSafeInteger(value.balance) || value.balance < 0
    || !value.collection || Object.values(value.collection).some(count => !Number.isSafeInteger(count) || count < 0)
    || !Array.isArray(value.boxes) || value.boxes.some(box => typeof box.id !== 'string' || !validId(box.dumplingId))
    || !Array.isArray(value.creditedRounds) || value.creditedRounds.some(id => typeof id !== 'string')
    || !value.trip || typeof value.trip.active !== 'boolean' || !Number.isSafeInteger(value.trip.purchases) || value.trip.purchases < 0
    || !['cleanup', 'store', 'home', 'collection'].includes(value.location)
    || (value.reveal !== null && (!value.reveal || !validId(value.reveal.dumplingId) || typeof value.reveal.id !== 'string' || !Number.isSafeInteger(value.reveal.count) || value.reveal.count < 1))) {
    throw new Error('Saved progress could not be read. It has not been overwritten.');
  }
  if(value.hunt){
    const h=value.hunt;
    if(!Number.isInteger(h.day)||h.day<1||!Number.isFinite(h.clockFloor)||h.clockFloor<0||h.clockFloor>HUNT_RULES.closingMinute
      ||(h.activeStore!==null&&!STORES.some(s=>s.id===h.activeStore))||!h.stores
      ||STORES.some(store=>{const s=h.stores[store.id];return !s||typeof s.rumor!=='string'||typeof s.visited!=='boolean'||!Array.isArray(s.slots)||s.slots.length>6
        ||new Set(s.slots.map(slot=>slot.site)).size!==s.slots.length||s.slots.some(slot=>!Number.isInteger(slot.site)||slot.site<0||slot.site>5||!SERIES.some(series=>series.id===slot.series)||!Number.isInteger(slot.remaining)||slot.remaining<0||slot.remaining>2||typeof slot.discovered!=='boolean');}))throw Error('Daily store save could not be read.');
  }
  if (value.protections && (typeof value.protections !== 'object' || Array.isArray(value.protections) || Object.entries(value.protections).some(([id,p]) => !validId(id) || !p || typeof p.favorite !== 'boolean' || typeof p.locked !== 'boolean'))) throw Error('Collection protections could not be read.');
  if (value.trading) {
    const t = value.trading;
    if (!Number.isSafeInteger(t.day) || t.day < 1 || !SERIES.some(s => s.id === t.series) || !t.traders || TRADERS.some(({id}) => {
      const n = t.traders[id];
      return !n || !Array.isArray(n.stock) || n.stock.length !== 6 || n.stock.some(id => !validId(id)) || new Set(n.stock).size !== n.stock.length
        || !Array.isArray(n.offer) || n.offer.length < 1 || n.offer.length > 3 || n.offer.some(id => !n.stock.includes(id)) || new Set(n.offer).size !== n.offer.length
        || !Number.isInteger(n.asks) || n.asks < 0 || n.asks > 4 || !Number.isSafeInteger(n.revision) || n.revision < 0 || typeof n.done !== 'boolean' || typeof n.message !== 'string';
    })) throw Error('Trading save could not be read.');
  }
  return value;
}

/** All economy changes are one synchronous localStorage write. Swap the repository for cloud saves later. */
export class ProgressStore {
  data: ProgressData = fresh();
  problem = '';
  constructor(private readonly repository: SaveRepository, private readonly random?: () => number, private readonly makeId = saveId) {
    try { this.data = parse(repository.read()); } catch { this.problem = 'Saved progress is unavailable. Allow local storage and reload; existing data has not been replaced.'; }
  }
  private commit<T>(change: (draft: ProgressData) => T): T {
    // Re-read before transactions, so a stale view in another tab cannot overwrite an older balance.
    let draft: ProgressData;
    try { draft = parse(this.repository.read()); } catch { throw new Error('Unable to read your save. No progress was changed.'); }
    const result = change(draft);
    try { this.repository.write(JSON.stringify(draft)); } catch { throw new Error('Unable to save. Please allow local storage and try again.'); }
    this.data = draft; this.problem = ''; return result;
  }
  refresh() { this.data = parse(this.repository.read()); }
  creditRound(id: string, amount: number) {
    if (!Number.isSafeInteger(amount) || amount < 0) throw new Error('Invalid allowance reward.');
    return this.commit(data => {
      if (data.creditedRounds.includes(id)) return false;
      data.balance += amount; data.creditedRounds.push(id);
      data.creditedRounds = data.creditedRounds.slice(-100);
      return true;
    });
  }
  startTrip() {
    this.commit(data => {
      if (!data.trip.active) data.trip = { active: true, purchases: 0 };
      data.location = 'store';
    });
  }
  ensureTradingDay(day: number) {
    if (!Number.isSafeInteger(day) || day < 1) throw Error('Invalid trading day.');
    if (this.data.trading?.day === day) return;
    this.commit(data => { if (!data.trading || data.trading.day < day) data.trading = createTradingDay(day); });
  }
  protect(id: string, kind: keyof Protection, enabled: boolean) {
    this.commit(data => {
      if (!validId(id) || !data.collection[id]) throw Error('Collect this squishy first.');
      const p = (data.protections ??= {})[id] ??= { favorite: false, locked: false };
      p[kind] = enabled;
    });
  }
  private checkTrade(data: ProgressData, day: number, trader: TraderId, revision: number, give: string[], includeLast: boolean) {
    const t = data.trading, n = t?.traders[trader];
    if (!t || t.day !== day || !n || n.done || n.revision !== revision) throw Error('This offer changed. Reopen the table to see the latest offer.');
    if (!give.length || give.length > 3 || give.some(id => !validId(id))) throw Error('Choose one to three squishies.');
    for (const id of new Set(give)) {
      const count = give.filter(item => item === id).length, p = data.protections?.[id];
      if (p?.favorite || p?.locked) throw Error('Favorites and locked squishies stay safe in your collection.');
      if ((data.collection[id] || 0) - count < (includeLast ? 0 : 1)) throw Error('Your collection changed, or this is your last copy. Choose again.');
      if (n.offer.includes(id)) throw Error('Choose a different squishy from the ones on their side.');
    }
    return t;
  }
  askTrade(day: number, trader: TraderId, revision: number, give: string[], includeLast = false) {
    this.commit(data => { const t = this.checkTrade(data, day, trader, revision, give, includeLast); negotiate(t, trader, give); });
  }
  executeTrade(day: number, trader: TraderId, revision: number, give: string[], includeLast = false) {
    return this.commit(data => {
      const t = this.checkTrade(data, day, trader, revision, give, includeLast);
      if (!willing(t, trader, give)) throw Error('They aren’t ready to agree. Try a different offer.');
      const received = [...t.traders[trader].offer];
      for (const id of give) data.collection[id]--;
      for (const id of received) data.collection[id] = (data.collection[id] || 0) + 1;
      t.traders[trader].done = true; t.traders[trader].revision++;
      t.traders[trader].message = 'Deal! Thanks, Arianna. I’ll bring more tomorrow.';
      return received;
    });
  }
  ensureHuntDay(day:number) {
    if(this.data.hunt?.day===day)return;
    this.commit(data=>{if(data.hunt?.day!==day){data.hunt=createHuntDay(day,this.random);data.trip={active:false,purchases:0};if(data.location==='store')data.location='cleanup';}});
  }
  visitStore(id:string,day:number,minutes:number) {
    return this.commit(data=>{
      if(!data.hunt||data.hunt.day!==day)throw Error('The stores need a fresh daily delivery. Try again.');
      const store=storeById(id),start=Math.max(minutes,data.hunt.clockFloor);
      if(start<900||!canVisit(store,start))throw Error('Not enough afternoon time for this trip and a little searching.');
      data.hunt.clockFloor=start+store.travelMinutes;data.hunt.activeStore=id;data.hunt.stores[id].visited=true;
      data.trip={active:true,purchases:0};data.location='store';return data.hunt.clockFloor;
    });
  }
  discover(site:number) {
    this.commit(data=>{
      const id=data.hunt?.activeStore,slot=id?data.hunt!.stores[id].slots.find(s=>s.site===site):null;
      if(data.location!=='store'||!slot||slot.remaining<1)throw Error('This display is empty. Keep looking!');
      slot.discovered=true;
    });
  }
  purchaseStock(site:number) {
    return this.commit(data=>{
      const id=data.hunt?.activeStore,slot=id?data.hunt!.stores[id].slots.find(s=>s.site===site):null;
      if(data.location!=='store'||!data.trip.active||!id||!slot||slot.remaining<1)throw Error('This display has sold out.');
      if(!slot.discovered)throw Error('Take a look at this box first.');
      if(data.trip.purchases>=HUNT_RULES.bagLimit)throw Error('Your bag is full. Bring your surprises home!');
      const store=storeById(id),price=boxPrice(store,slot.series);
      if(data.balance<price)throw Error(`This series costs $${price}. Save a little more allowance.`);
      const box:SealedBox={id:this.makeId(),dumplingId:rollSeries(slot.series,store,this.random).id,series:slot.series};
      data.balance-=price;slot.remaining--;data.boxes.push(box);data.trip.purchases++;return box.id;
    });
  }
  purchase() {
    return this.commit(data => {
      if (data.location !== 'store' || !data.trip.active) throw new Error('Visit the store to buy a box.');
      if (data.trip.purchases >= STORE_INVENTORY.tripLimit) throw new Error('Your bag is full for this trip. Time to go home!');
      if (data.balance < STORE_INVENTORY.price) throw new Error(`A box costs $${STORE_INVENTORY.price}. Earn a little more allowance first.`);
      // Seal the outcome in the receipt now: refreshing cannot reroll or lose a paid-for surprise.
      const box = { id: this.makeId(), dumplingId: rollDumpling(this.random).id };
      data.balance -= STORE_INVENTORY.price; data.boxes.push(box); data.trip.purchases++;
      return box.id;
    });
  }
  goHome() { this.commit(data => { data.location = 'home'; data.trip.active = false; if(data.hunt)data.hunt.activeStore=null; }); }
  openNext(): RevealReceipt {
    return this.commit(data => {
      if (data.location !== 'home') throw new Error('Open your boxes at home.');
      if (data.reveal) return data.reveal; // Repeated input / interrupted reveal uses the same receipt.
      const box = data.boxes.shift();
      if (!box) throw new Error('No unopened boxes. A little cleanup earns your next one!');
      const count = (data.collection[box.dumplingId] || 0) + 1;
      data.collection[box.dumplingId] = count;
      data.reveal = { ...box, count, isNew: count === 1 };
      return data.reveal;
    });
  }
  showCollection() { this.commit(data => { data.reveal = null; data.location = 'collection'; data.trip.active = false; }); }
  startCleanup() { this.commit(data => { data.location = 'cleanup'; data.trip.active = false; data.reveal = null; if(data.hunt)data.hunt.activeStore=null; }); }
}
