(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  let hideTimer = null;

  function isCoarse(){
    return window.matchMedia?.('(hover: none), (pointer: coarse)').matches;
  }

  function showMenu(){
    const ws=$('dfWorkspace');
    if(!ws) return;
    ws.classList.add('df-menu-open');
    if(hideTimer) clearTimeout(hideTimer);
    if(isCoarse()) hideTimer=setTimeout(()=>ws.classList.remove('df-menu-open'),3200);
  }

  function hideMenu(){
    const ws=$('dfWorkspace');
    if(!ws || ws.matches(':hover') && !isCoarse()) return;
    ws.classList.remove('df-menu-open');
  }

  function ensure(){
    const ws=$('dfWorkspace');
    if(!ws || ws.dataset.autoHideMenu==='1') return;
    ws.dataset.autoHideMenu='1';

    const hotspot=document.createElement('div');
    hotspot.className='df-menu-hotspot';
    hotspot.setAttribute('aria-hidden','true');
    ws.appendChild(hotspot);

    const tab=document.createElement('button');
    tab.id='dfMenuTab';
    tab.className='df-menu-tab';
    tab.type='button';
    tab.setAttribute('aria-label','Show Different Family controls');
    tab.innerHTML='<span aria-hidden="true">•••</span><b>Controls</b>';
    ws.appendChild(tab);

    hotspot.addEventListener('mouseenter',showMenu);
    ws.querySelector('.df-canvas-bar')?.addEventListener('mouseenter',showMenu);
    ws.querySelector('.df-canvas-bar')?.addEventListener('mouseleave',()=>{
      if(!isCoarse()) setTimeout(hideMenu,350);
    });
    tab.addEventListener('click',e=>{
      e.stopPropagation();
      if(ws.classList.contains('df-menu-open')) ws.classList.remove('df-menu-open');
      else showMenu();
    });

    ws.addEventListener('pointerdown',e=>{
      if(isCoarse() && !e.target.closest('.df-canvas-bar,.df-menu-tab')) ws.classList.remove('df-menu-open');
    });

    ws.querySelectorAll('.df-canvas-actions button').forEach(btn=>btn.addEventListener('click',()=>{
      if(isCoarse()){
        if(hideTimer) clearTimeout(hideTimer);
        hideTimer=setTimeout(()=>ws.classList.remove('df-menu-open'),1800);
      }
    }));
  }

  const obs=new MutationObserver(()=>ensure());
  obs.observe(document.documentElement,{childList:true,subtree:true});
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',ensure);
  else ensure();
})();