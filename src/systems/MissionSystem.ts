export const TASKS = [
  { id: 'teddy', name: 'Teddy', icon: '🧸' },
  { id: 'shirt', name: 'Shirt', icon: '👕' },
  { id: 'book', name: 'Book', icon: '📘' },
  { id: 'crayons', name: 'Crayons', icon: '🖍' },
  { id: 'dirt', name: 'Dirt', icon: '✦' },
] as const;
export type TaskId = typeof TASKS[number]['id'];

/** A round owns its money. No save data or permanent progression. Times are monotonic ms. */
export class MissionSystem {
  readonly duration = 60_000;
  readonly reward = 1;
  readonly allCleanBonus = 2;
  readonly completed = new Set<TaskId>();
  state: 'ready' | 'running' | 'finished' = 'ready';
  reason: 'complete' | 'time' | null = null;
  allowance = 0;
  bonus = 0;
  remaining = this.duration;
  finishedAt = 0;
  private deadline = 0;
  start(now: number) {
    if (this.state !== 'ready') return;
    this.state = 'running';
    this.deadline = now + this.duration;
  }
  tick(now: number) {
    if (this.state !== 'running') return;
    this.remaining = Math.max(0, this.deadline - now);
    if (this.remaining === 0) this.finish('time', now);
  }
  complete(task: TaskId, now: number): boolean {
    this.tick(now); // A late input/hold can never score after the deadline.
    if (this.state !== 'running' || this.completed.has(task)) return false;
    this.completed.add(task);
    this.allowance += this.reward;
    if (this.completed.size === TASKS.length) {
      this.bonus = this.allCleanBonus;
      this.allowance += this.bonus;
      this.finish('complete', now);
    }
    return true;
  }
  private finish(reason: 'complete' | 'time', now: number) {
    this.state = 'finished'; this.reason = reason; this.finishedAt = now;
  }
  reset() {
    this.state = 'ready'; this.reason = null; this.allowance = 0; this.bonus = 0;
    this.remaining = this.duration; this.deadline = 0; this.finishedAt = 0;
    this.completed.clear();
  }
}
