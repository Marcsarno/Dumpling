import {ticketPrizes} from '../data/ticketPrizes';
import type {ProgressStore} from '../systems/ProgressStore';
import {PopArt} from './PopArt';
import './ticket-shop.css';
export class TicketShop {
 readonly dialog=document.createElement('dialog');
 private art=new PopArt();private notice='';
 constructor(private save:ProgressStore,private day:()=>number,private changed:()=>void){
  this.dialog.id='ticket-shop';this.dialog.setAttribute('aria-label','Squishy ticket prizes');document.body.append(this.dialog);
  this.dialog.addEventListener('click',e=>{const b=(e.target as HTMLElement).closest<HTMLButtonElement>('button');if(!b)return;if(b.hasAttribute('data-close'))this.dialog.close();else if(b.dataset.prize){try{this.notice=this.save.redeemPrize(this.day(),b.dataset.prize)+' joined your collection!';this.changed();}catch(e){this.notice=(e as Error).message;}this.render();}});
 }
 async open(){this.notice='';try{this.save.ensureHuntDay(this.day());}catch(e){this.notice=(e as Error).message;}this.render();this.dialog.showModal();try{await this.art.load();this.render();}catch{this.notice='Prize pictures are loading slowly. Names and prices are ready.';this.render();}}
 private render(){const day=this.day(),sold=this.save.data.prizes?.day===day?this.save.data.prizes.sold:[],tickets=this.save.data.pop?.tickets??0;
  this.dialog.innerHTML=`<small>YOUR POPS BECOME REAL PRIZES</small><h2>Squishy prize shelf</h2><strong>🎟 ${tickets} tickets</strong><p>Pick the friend you want! One of each today. New friends arrive after sleep.</p><div class="ticket-prizes"></div><p role="status"></p><small>Every finished round earns at least 1 ticket. Your tickets never expire.</small><button data-close>Back to game</button>`;
  for(const p of ticketPrizes(day)){const card=document.createElement('article'),img=this.art.friends.get(p.item.id),owned=this.save.data.collection[p.item.id]??0;card.innerHTML=`${img?`<img src="${img.toDataURL()}" alt="">`:''}<strong>${p.item.name}</strong><small>${p.item.rarity} · ${owned?'Owned ×'+owned:'New friend!'}</small><button data-prize="${p.slot}" ${sold.includes(p.slot)||tickets<p.cost?'disabled':''}>${sold.includes(p.slot)?'Sold out':`🎟 ${p.cost} · Pick me!`}</button>`;this.dialog.querySelector('.ticket-prizes')!.append(card);}
  this.dialog.querySelector('[role="status"]')!.textContent=this.notice;
 }
}
