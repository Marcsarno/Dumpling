import { TASKS, type MissionSystem } from '../systems/MissionSystem';
import type { Interaction } from '../game/cleanupProps';
import type { CarrySystem } from '../components/CarrySystem';

export class CleanupHUD {
  private readonly clock = document.querySelector<HTMLElement>('#mission-clock')!;
  private readonly allowance = document.querySelector<HTMLElement>('#allowance')!;
  private readonly count = document.querySelector<HTMLElement>('#task-count')!;
  private readonly hint = document.querySelector<HTMLElement>('#cleanup-hint')!;
  private readonly actionTitle = document.querySelector<HTMLElement>('#action-title')!;
  private readonly actionDetail = document.querySelector<HTMLElement>('#action-detail')!;
  private readonly actionIcon = document.querySelector<HTMLElement>('#action-icon')!;
  private readonly tasks = document.querySelector<HTMLElement>('#task-list')!;
  private readonly announcement = document.querySelector<HTMLElement>('#cleanup-announcement')!;
  readonly dialog = document.querySelector<HTMLDialogElement>('#results')!;
  private readonly abort = new AbortController();
  constructor(readonly button: HTMLButtonElement, replay: () => void) {
    for (const task of TASKS) {
      const entry = document.createElement('li'); entry.dataset.task = task.id;
      const icon = document.createElement('span'); icon.textContent = task.icon; icon.setAttribute('aria-hidden', 'true');
      const name = document.createElement('span'); name.textContent = task.name;
      entry.append(icon, name); this.tasks.append(entry);
    }
    document.querySelector('#replay')!.addEventListener('click', replay, { signal: this.abort.signal });
    this.dialog.addEventListener('cancel', event => event.preventDefault(), { signal: this.abort.signal });
  }
  private text(element: HTMLElement, value: string) { if (element.textContent !== value) element.textContent = value; }
  announce(text: string) { this.announcement.textContent = text; }
  update(mission: MissionSystem, carry: CarrySystem, focus: Interaction | null, busy: boolean, progress: number) {
    const seconds = Math.ceil(mission.remaining / 1000);
    this.text(this.clock, `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`);
    this.clock.classList.toggle('soon', seconds <= 10 && mission.state === 'running');
    this.text(this.allowance, `$${mission.allowance}`);
    this.text(this.count, `${mission.completed.size} / 5`);
    for (const task of TASKS) {
      const entry = this.tasks.querySelector<HTMLElement>(`[data-task="${task.id}"]`)!;
      const done = mission.completed.has(task.id);
      entry.classList.toggle('done', done); entry.setAttribute('aria-label', `${task.name}: ${done ? 'complete' : 'to do'}`);
    }
    const enabled = !!focus && !busy && mission.state !== 'finished';
    this.button.disabled = !enabled;
    this.button.dataset.target = enabled ? focus!.id : '';
    this.button.style.setProperty('--hold-progress', `${progress * 360}deg`);
    this.button.classList.toggle('holding', progress > 0);
    let title = 'Action', detail = 'Come closer', icon = '✋';
    if (focus) {
      title = { pickup: 'Pick up', place: 'Put away', crayons: 'Tidy up', vacuum: 'Hold to clean' }[focus.kind];
      detail = focus.name; icon = focus.icon;
    }
    if (busy) { title = 'Tidying…'; detail = 'Crayons'; }
    if (mission.state === 'finished') { title = 'Well done'; detail = 'Round complete'; icon = '♡'; }
    this.text(this.actionTitle, title); this.text(this.actionDetail, detail); this.text(this.actionIcon, icon);
    this.button.setAttribute('aria-label', `${title}: ${detail}${focus?.kind === 'vacuum' ? '. Hold for just over one second.' : ''}`);
    let hint = 'Find an item. Walk close, then tap Action.';
    if (mission.state === 'ready') hint = 'Move to start · 60 seconds · $1 per task';
    else if (carry.item) {
      hint = { teddy: '🧸 Take Teddy to the glowing toy chest.', shirt: '👕 Take the shirt to the glowing hamper.', book: '📘 Take the book to the glowing bookshelf.', vacuum: '✦ Go to the dirt, then hold Action to vacuum.' }[carry.item.id];
    } else if (focus?.kind === 'crayons') hint = '🖍 Tap Action to put the crayons in their cup.';
    if (mission.state === 'finished') hint = 'Every little bit helps. Nice work, Arianna!';
    this.text(this.hint, hint);
  }
  showResults(mission: MissionSystem) {
    if (this.dialog.open) return;
    document.querySelector('#results-title')!.textContent = mission.reason === 'complete' ? 'Room ready!' : 'Nice helping!';
    document.querySelector('#results-summary')!.textContent = mission.reason === 'complete'
      ? 'All five tasks done. Your cozy room is ready!'
      : mission.completed.size ? 'Look at what you did in one little minute.' : 'A little practice goes a long way. Let’s try again!';
    document.querySelector('#results-tasks')!.textContent = `${mission.completed.size} / 5`;
    document.querySelector('#results-money')!.textContent = `$${mission.allowance}`;
    const bonus = document.querySelector<HTMLElement>('#results-bonus')!;
    bonus.hidden = !mission.bonus; bonus.textContent = `Includes a $${mission.bonus} all-clean bonus ✦`;
    const list = document.querySelector('#results-list')!; list.replaceChildren();
    for (const task of TASKS) {
      const row = document.createElement('li');
      row.textContent = `${mission.completed.has(task.id) ? '✓' : '○'} ${task.name}`;
      row.classList.toggle('done', mission.completed.has(task.id)); list.append(row);
    }
    this.dialog.showModal();
    document.querySelector<HTMLButtonElement>('#replay')!.focus();
  }
  reset() { this.dialog.close(); this.announcement.textContent = ''; }
  destroy() { this.abort.abort(); this.dialog.close(); this.tasks.replaceChildren(); }
}
