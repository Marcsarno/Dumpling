import { STORES, SERIES, type HuntDay } from '../data/hunt';
import './hunt.css';

export class HuntUI {
  readonly dialog=document.createElement('dialog');
  readonly time=document.createElement('p');
  readonly panel=document.createElement('section');
  readonly travel=document.createElement('section');
  private cards=new Map<string,HTMLButtonElement>();
  private balance=document.createElement('p');
  private notice=document.createElement('p');
  constructor(choose:(id:string)=>void){
    this.dialog.id='hunt-routes';this.dialog.setAttribute('aria-labelledby','hunt-title');
    this.dialog.innerHTML='<span class="eyebrow">AN AFTERNOON OF LITTLE FINDS</span><h2 id="hunt-title">Where shall we look?</h2>';
    this.balance.className='hunt-budget';this.dialog.append(this.balance);
    for(const store of STORES){
      const card=document.createElement('button');card.type='button';card.className='store-choice';card.dataset.store=store.id;
      const prices=store.series.map(s=>SERIES.find(x=>x.id===s.id)!.price+store.markup);
      card.innerHTML=`<span class="store-icon" aria-hidden="true">${store.icon}</span><span><strong>${store.name}</strong><small>$${Math.min(...prices)}–${Math.max(...prices)} / box · Take your time</small><small>${store.subtitle}</small><em class="rumor"></em><small class="route-status"></small></span>`;
      card.style.setProperty('--shop-color',store.palette[0]);card.addEventListener('click',()=>choose(store.id));this.cards.set(store.id,card);this.dialog.append(card);
    }
    this.notice.className='hunt-explainer';this.notice.textContent='Visit two different stores each day. No shopping timer! Stock refreshes tomorrow.';this.dialog.append(this.notice);
    const back=document.createElement('button');back.className='loop-button';back.textContent='Back to game';back.addEventListener('click',()=>this.dialog.close());this.dialog.append(back);
    this.time.id='shopping-time';this.time.hidden=true;
    this.panel.id='hunt-find';this.panel.hidden=true;this.panel.setAttribute('aria-live','polite');
    this.travel.id='hunt-travel';this.travel.hidden=true;this.travel.setAttribute('role','status');
    document.querySelector('#game')!.append(this.dialog,this.time,this.panel,this.travel);
    document.querySelector('#day-label')!.after(this.time);
  }
  routes(hunt:HuntDay,minutes:number,balance:number){this.refresh(hunt,minutes,balance);if(!this.dialog.open)this.dialog.showModal();}
  refresh(hunt:HuntDay,minutes:number,balance:number){
    const used=Object.values(hunt.stores).filter(s=>s.visited).length;
    this.balance.textContent=`${Math.max(0,2-used)} store visits left today · Wallet $${balance}`;
    for(const store of STORES){const card=this.cards.get(store.id)!;card.disabled=used>=2||hunt.stores[store.id].visited;
      card.querySelector('.rumor')!.textContent=hunt.stores[store.id].rumor;
      card.querySelector('.route-status')!.textContent=hunt.stores[store.id].visited?'Visited today':used>=2?'More adventures tomorrow':'Travel here →';
    }
  }
  showTravel(name:string){this.dialog.close();this.travel.innerHTML='<span>🛍</span><h2></h2><p>A little outing…</p>';this.travel.querySelector('h2')!.textContent=name;this.travel.hidden=false;}
  clock(_minutes:number,_visible:boolean){this.time.hidden=true;}
  find(title:string,detail:string,note:string){this.panel.hidden=false;this.panel.replaceChildren();const h=document.createElement('strong'),p=document.createElement('p'),small=document.createElement('small');h.textContent=title;p.textContent=detail;small.textContent=note;this.panel.append(h,p,small);}
  destroy(){this.dialog.remove();this.time.remove();this.panel.remove();this.travel.remove();}
}
