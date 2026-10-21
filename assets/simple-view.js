(function(){
  "use strict";
  const KEY="plushlife:simple-view:v1";
  const root=()=>document.getElementById("main-content");
  const read=()=>{try{return localStorage.getItem(KEY)==="on"}catch{return false}};
  let enabled=read(), observer;
  function apply(){
    const app=root();if(!app)return;
    app.classList.toggle("pl-simple-view",enabled);
    const toggle=document.getElementById("pl-simple-toggle");
    if(toggle){toggle.setAttribute("aria-pressed",String(enabled));toggle.querySelector(".pl-simple-toggle-label").textContent=enabled?"Simple view on":"Simple view off";}
    const nav=app.querySelector(".pl-app-bottom-nav");
    if(nav)nav.setAttribute("aria-label","Main navigation");
  }
  function mount(){
    const app=root();if(!app)return;
    if(!document.getElementById("pl-simple-toggle")){
      const button=document.createElement("button");
      button.type="button";button.id="pl-simple-toggle";button.className="pl-simple-toggle";
      button.setAttribute("aria-label","Switch simple view on or off");
      button.setAttribute("aria-pressed",String(enabled));
      button.innerHTML='<span aria-hidden="true">✨</span> <span class="pl-simple-toggle-label"></span>';
      button.addEventListener("click",()=>{enabled=!enabled;try{localStorage.setItem(KEY,enabled?"on":"off")}catch{};apply()});
      app.prepend(button);
    }
    apply();
  }
  function start(){
    mount();
    observer=new MutationObserver(()=>{if(!root())return; if(!document.getElementById("pl-simple-toggle"))mount();else apply()});
    observer.observe(document.getElementById("root")||document.body,{childList:true,subtree:true});
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();