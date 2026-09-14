import type { MissionSystem, TaskDefinition } from '../systems/MissionSystem';
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
  private taskDefinitions: readonly TaskDefinition[] | null = null;
  constructor(readonly button: HTMLButtonElement, replay: () => void) {
    document.querySelector('#replay')!.addEventListener('click', replay, { signal: this.abort.signal });
    this.dialog.addEventListener('cancel', event => event.preventDefault(), { signal: this.abort.signal });
  }
  private setTasks(tasks: readonly TaskDefinition[]) {
    if (this.taskDefinitions === tasks) return;
    this.taskDefinitions = tasks; this.tasks.replaceChildren();
    for (const task of tasks) {
      const entry = document.createElement('li'); entry.dataset.task = task.id;
      entry.title = task.room ? `${task.room}: ${task.name}` : task.name;
      const icon = document.createElement('span'); icon.textContent = task.icon; icon.setAttribute('aria-hidden', 'true');
      const name = document.createElement('span'); name.textContent = task.name;
      entry.append(icon, name); this.tasks.append(entry);
    }
  }
  private text(element: HTMLElement, value: string) { if (element.textContent !== value) element.textContent = value; }
  announce(text: string) { this.announcement.textContent = text; }
  update(mission: MissionSystem, carry: CarrySystem, focus: Interaction | null, busy: boolean, progress: number, animation: string | null = null) {
    this.setTasks(mission.tasks);
    const seconds = Math.ceil(mission.remaining / 1000);
    this.text(this.clock, mission.timed ? `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}` : '∞');
    this.clock.classList.toggle('soon', seconds <= 10 && mission.state === 'running');
    this.text(this.allowance, `$${mission.allowance}`);
    this.text(this.count, `${mission.completed.size} / ${mission.tasks.length}`);
    for (const task of mission.tasks) {
      const entry = this.tasks.querySelector<HTMLElement>(`[data-task="${task.id}"]`)!;
      const done = mission.completed.has(task.id);
      this.text(entry.firstElementChild as HTMLElement, done ? '✓' : task.icon);
      entry.classList.toggle('done', done); entry.setAttribute('aria-label', `${task.room ? `${task.room}: ` : ''}${task.name}: ${done ? 'complete' : 'to do'}`);
    }
    const enabled = !!focus && !busy && !animation && mission.state !== 'finished';
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
    if (animation) { title = animation === 'PickUp' ? 'Picking up…' : animation === 'PutDown' ? 'Putting away…' : 'Lovely!'; detail = 'One moment'; }
    if (mission.state === 'finished') { title = 'Well done'; detail = 'Round complete'; icon = '♡'; }
    this.text(this.actionTitle, title); this.text(this.actionDetail, detail); this.text(this.actionIcon, icon);
    this.button.setAttribute('aria-label', `${title}: ${detail}${focus?.kind === 'vacuum' ? '. Hold for just over one second.' : ''}`);
    let hint = 'Find an item. Walk close, then tap Action.';
    if (mission.state === 'ready') hint = 'Move to start · 60 seconds · $1 per task';
    else if (carry.item) {
      const destination = document.querySelector<HTMLElement>('.cleanup-marker.destination')?.textContent;
      hint = carry.item.id === 'vacuum' ? '✦ Go to the dirt, then hold Action to vacuum.' : `${carry.item.icon} Take ${carry.item.name.toLowerCase()} to ${destination || 'the glowing destination'}.`;
    } else if (focus?.kind === 'crayons') hint = '🖍 Tap Action to put the crayons in their cup.';
    if (mission.state === 'finished') hint = 'Every little bit helps. Nice work, Arianna!';
    if (!mission.timed && !carry.item && mission.state !== 'finished') hint = 'Explore freely · Practice tasks · No timer or allowance';
    this.text(this.hint, hint);
  }
  showResults(mission: MissionSystem) {
    if (this.dialog.open) return;
    document.querySelector('#results-title')!.textContent = mission.reason === 'complete' ? (mission.tasks.length === 6 ? 'House ready!' : mission.tasks.length === 5 ? 'Room ready!' : 'All tidied up!') : 'Nice helping!';
    document.querySelector('#results-summary')!.textContent = mission.reason === 'complete'
      ? `All ${mission.tasks.length} tasks done. A little helping makes a happy home!`
      : mission.completed.size ? 'Look at what you did in one little minute.' : 'A little practice goes a long way. Let’s try again!';
    document.querySelector('#results-tasks')!.textContent = `${mission.completed.size} / ${mission.tasks.length}`;
    document.querySelector('#results-money')!.textContent = `$${mission.allowance}`;
    const bonus = document.querySelector<HTMLElement>('#results-bonus')!;
    bonus.hidden = !mission.bonus; bonus.textContent = `Includes a $${mission.bonus} all-clean bonus ✦`;
    const list = document.querySelector('#results-list')!; list.replaceChildren();
    for (const task of mission.tasks) {
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
