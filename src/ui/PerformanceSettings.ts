import type {Application} from 'playcanvas';
/** Stop drawing occluded scenes, without changing shadows, resolution or frame cadence. */
export function performanceSettings(app:Application,blocked:()=>boolean){
 const details=document.createElement('details'),summary=document.createElement('summary'),readout=document.createElement('p');summary.textContent='Performance information';details.append(summary,readout);document.querySelector('.audio-settings')!.append(details);
 let frames=0,fps=0,start=performance.now();const counted=()=>{frames++;const now=performance.now();if(now-start>=1000){fps=Math.round(frames*1000/(now-start));frames=0;start=now;}};app.on('postrender',counted);
 const timer=setInterval(()=>{if(details.open)readout.textContent=`Last active render rate: ${fps} FPS · Textures: ${Math.round(app.stats.vram.tex/1048576)} MiB. Rendering pauses behind menus.`;},500);
 const render=()=>{const paused=document.hidden||blocked()||!!document.querySelector('dialog[open]');app.autoRender=!paused;app.renderNextFrame=!paused;};app.on('framerender',render);
 return()=>{clearInterval(timer);app.off('postrender',counted);app.off('framerender',render);details.remove();app.autoRender=true;};
}
