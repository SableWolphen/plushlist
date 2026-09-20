(function(){
  if(typeof window==="undefined"||typeof document==="undefined")return;
  const normal=[
    "What feels most true for you today?",
    "What kind of energy are you bringing into today?",
    "Where are you at right now?",
    "What does today feel like from the inside?",
    "What feeling is taking up the most space today?",
    "How is your mind and body meeting today?",
    "What is your energy asking for today?",
    "How gentle does today need to be?",
    "What pace feels realistic today?",
    "What is the closest match for how you feel?",
    "How much do you have to give today?",
    "What would fit the day you are actually having?",
    "What is your system telling you today?",
    "How full is your battery today?",
    "What does your capacity look like today?",
    "What kind of support would make today easier?",
    "How are you arriving into today?",
    "What feels manageable today?",
    "What kind of day can you honestly hold?",
    "What does caring for yourself look like today?",
    "What is your starting point today?"
  ];
  const baby=[
    "How is my little self feeling today?",
    "How much cozy energy does my little self have?",
    "Where is my little self at right now?",
    "What does today feel like inside my little self?",
    "What feeling is biggest for my little self today?",
    "How are my little mind and body doing today?",
    "What is my little energy asking for today?",
    "How soft does my little day need to be?",
    "What pace feels comfy for my little self today?",
    "Which feeling is closest for my little self?",
    "How much does my little self have to give today?",
    "What would fit the little day I am actually having?",
    "What is my little body telling me today?",
    "How full is my little battery today?",
    "How much room does my little self have today?",
    "What would help my little self feel cared for today?",
    "How is my little self arriving into today?",
    "What feels manageable for my little self today?",
    "What kind of little day can I comfortably hold?",
    "What does caring for my little self look like today?",
    "What is my little starting point today?"
  ];
  function dayIndex(){
    const d=new Date(), noon=new Date(d.getFullYear(),d.getMonth(),d.getDate(),12);
    return Math.floor(noon.getTime()/86400000)%normal.length;
  }
  function refresh(){
    const title=document.getElementById("checkin-popup-title");
    if(!title)return;
    const isBaby=!!document.querySelector(".baby-mode");
    title.textContent=(isBaby?baby:normal)[dayIndex()];
  }
  new MutationObserver(refresh).observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener("click",refresh,true);
  window.addEventListener("focus",refresh);
  refresh();
  window.PlushLifeDailyCheckInCopy={refresh,normal,baby};
})();