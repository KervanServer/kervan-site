export const ANIMATION_KEY = "kervan-animations";
export const ANIMATION_EVENT = "kervan:animations-change";

// Resolve the mouse-effects preference before hydration. Ambient motion is independent.
export const ANIMATION_INIT = `(()=>{var p;try{p=localStorage.getItem("${ANIMATION_KEY}")}catch{}var r=document.documentElement;var v=p==='on'||p==='off'?p:'system';r.dataset.animationPreference=v;r.dataset.backgroundAnimations=v==='on'||(v==='system'&&!matchMedia('(prefers-reduced-motion: reduce)').matches)?'on':'off'})()`;
