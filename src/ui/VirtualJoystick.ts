import { Vec2 } from 'playcanvas';

/** DOM Pointer Events cover touch, pen and mouse with pointer capture. */
export class VirtualJoystick {
  readonly value = new Vec2();
  private pointer: number | null = null;
  private readonly abort = new AbortController();
  constructor(private readonly element: HTMLElement, private readonly knob: HTMLElement) {
    const options = { signal: this.abort.signal };
    element.addEventListener('pointerdown', this.down, options);
    element.addEventListener('pointermove', this.move, options);
    element.addEventListener('pointerup', this.up, options);
    element.addEventListener('pointercancel', this.up, options);
    element.addEventListener('lostpointercapture', this.up, options);
    window.addEventListener('blur', this.reset, options);
    window.addEventListener('resize', this.reset, options);
    document.addEventListener('visibilitychange', this.reset, options);
    element.addEventListener('contextmenu', event => event.preventDefault(), options);
  }
  private down = (event: PointerEvent) => {
    if (this.pointer !== null || event.button !== 0) return;
    event.preventDefault();
    this.pointer = event.pointerId;
    this.element.setPointerCapture(event.pointerId);
    this.element.classList.add('dragging');
    this.move(event);
  };
  private move = (event: PointerEvent) => {
    if (event.pointerId !== this.pointer) return;
    event.preventDefault();
    const rect = this.element.getBoundingClientRect();
    const radius = rect.width * 0.29;
    const x = event.clientX - rect.left - rect.width / 2;
    const y = event.clientY - rect.top - rect.height / 2;
    const length = Math.hypot(x, y);
    const scale = length > radius ? radius / length : 1;
    this.knob.style.transform = `translate(${x * scale}px, ${y * scale}px)`;
    // Dead zone prevents jitter; rescale the remaining range to preserve analog speed.
    const magnitude = Math.max(0, (Math.min(length / radius, 1) - 0.12) / 0.88);
    this.value.set(length ? x / length * magnitude : 0, length ? -y / length * magnitude : 0);
  };
  private up = (event: PointerEvent) => {
    if (event.pointerId === this.pointer) this.reset();
  };
  reset = () => {
    const id = this.pointer;
    this.pointer = null;
    if (id !== null && this.element.hasPointerCapture(id)) this.element.releasePointerCapture(id);
    this.value.set(0, 0);
    this.knob.style.transform = '';
    this.element.classList.remove('dragging');
  };
  destroy() { this.reset(); this.abort.abort(); }
}
