import { DUMPLINGS, rollDumpling, STORE_INVENTORY } from '../data/collection.ts';
import { saveId } from './saveId.ts';

export const SAVE_KEY = 'arianna.progress.v1';
export interface SaveRepository { read(): string | null; write(value: string): void }
export class LocalSaveRepository implements SaveRepository {
  read() { return localStorage.getItem(SAVE_KEY); }
  write(value: string) { localStorage.setItem(SAVE_KEY, value); }
}
export interface SealedBox { id: string; dumplingId: string }
export interface RevealReceipt extends SealedBox { count: number; isNew: boolean }
export interface ProgressData {
  version: 1; balance: number; collection: Record<string, number>; boxes: SealedBox[];
  creditedRounds: string[]; trip: { active: boolean; purchases: number };
  location: 'cleanup' | 'store' | 'home' | 'collection'; reveal: RevealReceipt | null;
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
  goHome() { this.commit(data => { data.location = 'home'; data.trip.active = false; }); }
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
  startCleanup() { this.commit(data => { data.location = 'cleanup'; data.trip.active = false; data.reveal = null; }); }
}
