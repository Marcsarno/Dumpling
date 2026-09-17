import { DUMPLINGS } from '../data/collection';
import { SERIES } from '../data/hunt';
import { TRADERS, definition, willing, type TraderId } from '../data/trading';
import type { ProgressStore } from '../systems/ProgressStore';
import { dumplingPortrait } from '../game/dumplingVisual';
import './trading.css';

export class TradingUI {
  readonly dialog = document.createElement('dialog');
  readonly leave = document.createElement('button');
  private trader: TraderId = 'rarity';
  private give: string[] = [];
  private includeLast = false;
  private notice = '';
  private day = 1;
  private revision = 0;
  constructor(private save: ProgressStore, private changed: () => void, private exit: () => void) {
    this.dialog.id = 'trading-dialog'; this.dialog.setAttribute('aria-labelledby', 'trade-title');
    // Action opens on pointer-down. Its release must not select the card now under that finger.
    let pressed: EventTarget | null = null;
    this.dialog.addEventListener('pointerdown',e=>{pressed=e.target;});
    this.dialog.addEventListener('click',e=>{if(e.detail>0&&pressed!==e.target){e.preventDefault();e.stopImmediatePropagation();}pressed=null;},true);
    this.dialog.addEventListener('cancel', e => { e.preventDefault(); this.close(); });
    this.leave.id = 'leave-recess'; this.leave.className = 'loop-button'; this.leave.textContent = 'Leave recess →'; this.leave.hidden = true;
    this.leave.onclick = exit;
    document.querySelector('#game')!.append(this.dialog, this.leave);
  }
  open(id: TraderId, day: number) {
    this.save.refresh();
    this.save.ensureTradingDay(day); this.trader = id; this.day = day; this.give = []; this.includeLast = false; this.notice = '';
    this.render(); this.dialog.showModal();
    this.dialog.querySelector('.trade-scroll')!.scrollTop=0;
  }
  close() { this.dialog.close(); this.give = []; }
  private attempt(fn: () => void) { try { fn(); } catch (error) { this.notice = (error as Error).message; this.give=[]; try { this.save.refresh(); } catch {} } this.render(); }
  private picture(id: string) {
    const img = document.createElement('img'); img.src = dumplingPortrait(definition(id), false); img.alt = ''; return img;
  }
  private render() {
    const scrollTop=this.dialog.querySelector('.trade-scroll')?.scrollTop??0;
    const trader = TRADERS.find(t => t.id === this.trader)!, day = this.save.data.trading!, npc = day.traders[this.trader];
    this.revision = npc.revision;
    const series = SERIES.find(s => s.id === day.series)!.name;
    this.dialog.style.setProperty('--trader', trader.color);
    this.dialog.innerHTML = `<header class="trade-header"><span class="eyebrow">RECESS · DAY ${this.day}</span><h2 id="trade-title">${trader.icon} ${trader.name}</h2><strong>${trader.title}</strong><p>${this.trader === 'series' ? `I’m collecting ${series}. I’ll trade extra for those!` : trader.hint}</p></header>
      <div class="trade-scroll"><section><h3>Their side <small>you receive</small></h3><div id="npc-offer" class="trade-slots"></div></section>
      <p class="trade-speech" role="status" aria-live="polite"></p>
      <section><h3>Your side <small>tap to take back · ${this.give.length}/3</small></h3><div id="player-offer" class="trade-slots"></div></section>
      <div class="trade-bag-heading"><h3>Your trading bag</h3><label><input id="trade-singles" type="checkbox" ${this.includeLast ? 'checked' : ''}> Include last copies</label></div>
      <p class="trade-safety">Extras first. Keep one of each. ♥ favorites and 🔒 locks cannot be traded.</p><div id="trade-inventory"></div></div>
      <div class="trade-footer"><p id="trade-readiness"></p><div class="trade-controls"><button id="trade-cancel" aria-label="Walk away">✕<small>Walk away</small></button><button id="trade-add" aria-label="Ask them to add">+<small>Add more?</small></button><button id="trade-accept" aria-label="Accept trade">✓<small>Trade</small></button></div></div>`;
    const q = <T extends HTMLElement = HTMLElement>(selector: string) => this.dialog.querySelector<T>(selector)!;
    q('.trade-speech').textContent = this.notice || npc.message;
    for (const id of npc.offer) {
      const card = document.createElement('article'); card.className = 'trade-item'; card.dataset.id = id;
      const label = document.createElement('strong'); label.textContent = definition(id).name;
      const rarity = document.createElement('small'); rarity.textContent = `${definition(id).rarity}${this.save.data.collection[id] ? '' : ' · NEW!'}`;
      card.append(this.picture(id), label, rarity); q('#npc-offer').append(card);
    }
    this.give.forEach((id, index) => {
      const b = document.createElement('button'); b.className = 'trade-item'; b.setAttribute('aria-label', `Remove ${definition(id).name}`);
      const label = document.createElement('strong'); label.textContent = definition(id).name;
      b.append(this.picture(id), label); b.onclick = () => { this.give.splice(index, 1); this.notice = ''; this.render(); }; q('#player-offer').append(b);
    });
    if (!this.give.length) q('#player-offer').innerHTML = `<p class="trade-empty">${npc.done ? 'All done! Bring your next finds tomorrow.' : 'Pick up to three squishies below.'}</p>`;
    const owned = DUMPLINGS.filter(d => this.save.data.collection[d.id] > 0).sort((a,b) => (this.save.data.collection[b.id] > 1 ? 1 : 0) - (this.save.data.collection[a.id] > 1 ? 1 : 0));
    for (const d of owned) {
      const count = this.save.data.collection[d.id], selected = this.give.filter(id => id === d.id).length, p = this.save.data.protections?.[d.id];
      const protectedItem = p?.favorite || p?.locked;
      const b = document.createElement('button'); b.className = 'trade-bag-item'; b.dataset.id = d.id;
      b.disabled = npc.done || !!protectedItem || count - selected <= (this.includeLast ? 0 : 1) || this.give.length >= 3 || npc.offer.includes(d.id);
      b.setAttribute('aria-label', `Offer ${d.name}`);
      const text = document.createElement('span'); const name = document.createElement('strong'); name.textContent = d.name;
      const detail = document.createElement('small'); detail.textContent = `${d.rarity} · ×${count} · ${protectedItem ? (p?.favorite ? '♥ Favorite' : '🔒 Locked') : npc.offer.includes(d.id) ? 'On their side' : count === 1 ? 'Last copy' : `${Math.max(0,count - selected - 1)} spare`}`;
      text.append(name, detail); b.append(this.picture(d.id), text); b.onclick = () => { this.give.push(d.id); this.notice = ''; this.render(); }; q('#trade-inventory').append(b);
    }
    if (!owned.length) q('#trade-inventory').innerHTML = '<p class="trade-empty">Your bag is empty. Open store boxes at home, then bring your extras to recess. Your classmates will be here!</p>';
    const ready = willing(day, this.trader, this.give);
    q('#trade-readiness').textContent = npc.done ? 'Trade complete · More tomorrow' : ready ? '“Yes! I’d make that trade.”' : this.give.length ? '“Could you try a different offer?”' : 'Choose your offer. You can always walk away.';
    q<HTMLButtonElement>('#trade-add').disabled = npc.done || !this.give.length || npc.asks >= 4;
    q<HTMLButtonElement>('#trade-accept').disabled = !ready;
    q('#trade-cancel').onclick = () => this.close();
    q<HTMLInputElement>('#trade-singles').onchange = e => { this.includeLast = (e.target as HTMLInputElement).checked; this.give = []; this.notice = ''; this.render(); };
    q('#trade-add').onclick = () => { this.attempt(() => { this.notice = ''; this.save.askTrade(this.day, this.trader, this.revision, this.give, this.includeLast); this.changed(); }); this.dialog.querySelector('.trade-scroll')!.scrollTop=0; };
    q('#trade-accept').onclick = () => { this.attempt(() => {
      const last = [...new Set(this.give)].filter(id => this.save.data.collection[id] === this.give.filter(x => x === id).length);
      if (last.length && !window.confirm(`Trade your last ${last.map(id => definition(id).name).join(', ')}? You will have none left.`)) return;
      const received = this.save.executeTrade(this.day, this.trader, this.revision, this.give, this.includeLast);
      this.notice = `Deal! You received ${received.map(id => definition(id).name).join(', ')}. Saved to your collection.`; this.give = []; this.changed();
    }); this.dialog.querySelector('.trade-scroll')!.scrollTop=0; };
    q('.trade-scroll').scrollTop=scrollTop;
  }
  destroy() { this.dialog.remove(); this.leave.remove(); }
}
