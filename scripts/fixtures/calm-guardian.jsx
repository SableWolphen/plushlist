import { DARK_THEME_PALETTES } from "../../src/theme-atmosphere.js";
import { StorybookHome } from "../../src/components/storybook-home.jsx";
import { MAIN_DESTINATIONS } from "../../src/navigation.mjs";
// Local visual fixture. Uses real components with synthetic data; never signs in.
import { GuardianPanel } from "../../src/components/guardian-panel.jsx";
import { WhatsChanged } from "../../src/components/whats-changed.jsx";
import { ThemeWorldContext, DesignIcon } from "../../src/components/theme-world.jsx";
const link={id:"demo-link",owner_user_id:"demo-owner",caregiver_email:"alex@example.invalid",label:"Alex",active:true,accepted_at:"2026-11-07",can_view_progress:false};
let agreement={id:"demo-agreement",caregiver_link_id:link.id,owner_user_id:"demo-owner",guardian_user_id:"demo-alex",proposed_by:"demo-owner",mode:"supportive",status:"accepted",expectations:"Small steps and honest check-ins.",boundaries:"Ask first. Either person can stop anytime.",accepted_by:"demo-alex"};
let tasks=[{id:"walk",agreement_id:agreement.id,body:"Take a short walk together",assignee_user_id:"demo-owner",proposed_by:"demo-alex",status:"accepted"},{id:"tea",agreement_id:agreement.id,body:"Make time for tea",assignee_user_id:"demo-owner",proposed_by:"demo-alex",status:"proposed"}];
let moods=[{id:"mood-demo",agreement_id:agreement.id,author_user_id:"demo-alex",body:"A little tired today. Quiet company sounds really nice.",shared:true}];
const client={from(table){const filters=[];const q={select(){return q},eq(k,v){filters.push([k,v]);return q},in(){return q},order(){return q},limit(){return q},then(resolve,reject){const all=table==="guardian_agreements"?[agreement]:table==="guardian_agreement_tasks"?tasks:moods;return Promise.resolve({data:all.filter(row=>filters.every(([k,v])=>row[k]===v)),error:null}).then(resolve,reject)}};return q;},async rpc(name,args){if(name==="guardian_agreement_task_action")tasks=tasks.map(t=>t.id===args.p_id?{...t,status:args.p_action==="complete"?"completed":args.p_action==="accept"?"accepted":"declined"}:t);if(name==="guardian_agreement_action"&&args.p_action==="revoke")agreement={...agreement,status:"revoked"};if(name==="guardian_agreement_mood_action"&&args.p_action==="create")moods=[{id:String(Date.now()),agreement_id:agreement.id,author_user_id:"demo-owner",body:args.p_body,shared:args.p_shared},...moods];return {data:{},error:null};}};
const noop=()=>{};
const base={open:true,client,user:{id:"demo-owner"},guardianLinksReady:true,supportViewMode:"mine",supportOwnerId:"demo-owner",ownedSupportLinks:[link],period:{date:"2026-11-07"},restDatesSet:new Set(),supportRewards:[],supportNotes:[],supportRequestType:"company",supportRequestGuardian:link.caregiver_email,suggestionSectionsById:{},supportMessage:"",supportPercent:0,supportWeeklyPercent:0,setSupportRequestType:noop,setSupportRequestGuardian:noop,setSupportRequestText:noop,sendGuardianSupportRequest:noop,onClose:noop};
for(const key of ["pendingSupportInvites","supportPeople","invitedSupportLinks","supportRelationships","guardianSupportRequests","supportAchievements","supportDailyEssentialKeys","supportScheduledTodayKeys","taskSuggestions","GUARDIAN_ROLE_PRESETS"])base[key]=[];
function Preview() {
  const [updates,setUpdates]=React.useState(false), [read,setRead]=React.useState(false);
  const [theme,setTheme]=React.useState("soft"), [dark,setDark]=React.useState(false), [page,setPage]=React.useState("guardian");
  const world=theme==="baby" && dark ? "baby-night" : theme;
  const none={background:dark?"#1F1D25":"#F8F7FA",surface:dark?"#2A2732":"#FFFFFF",surface2:dark?"#34303E":"#F0EDF3",ink:dark?"#F7F2FB":"#3F3946",muted:dark?"#C2B7CC":"#746B7C",line:dark?"#484150":"#DDD7E2",accent:dark?"#B9A6C8":"#806F8C"};
  const palette=theme==="none" ? none : (dark ? DARK_THEME_PALETTES[world] : window.PlushLifeThemeCopy.worlds[world]);
  const navigate=id=>{setPage(id);setUpdates(false);};
  return <><div style={{padding:8,background:"#fff",color:"#222",position:"relative",zIndex:20}} aria-label="Local preview controls">
    <label>Preview theme <select value={theme} onChange={e=>setTheme(e.target.value)}>{["none","dino","baby",...window.PlushLifeContent.APPEARANCE_THEMES.map(t=>t.id)].map(id=><option key={id}>{id}</option>)}</select></label>
    <button type="button" onClick={()=>setDark(!dark)} aria-pressed={dark}>Dark preview</button>
    <button type="button" onClick={()=>navigate("home")}>Preview Today</button><button type="button" onClick={()=>navigate("guardian")}>Preview Guardian</button>
  </div><ThemeWorldContext.Provider value={{world,voice:"motherly"}}><div id="main-content" data-pl-world={world} data-pl-dark={String(dark)} className={`pl-calm-shell ${theme==="baby"?"baby-mode":theme==="dino"?"dino-theme":""} ${page==="guardian"?"guardian-view dashboard-guardian":"dashboard-home"} appearance-${["baby","dino"].includes(theme)?"none":theme}`} style={{minHeight:"100vh",padding:"26px 18px",background:palette.background,...Object.fromEntries(Object.entries({bg:palette.background,surface:palette.surface,"surface-2":palette.surface2,ink:palette.ink,muted:palette.muted,line:palette.line,accent:palette.accent,"accent-2":palette.accent,"on-accent":dark||theme==="twilight"?palette.background:"#FFFFFF"}).map(([k,v])=>["--pl-theme-"+k,v]))}}>
    <aside className="pl-desktop-navigation"><h2>PlushLife</h2>{MAIN_DESTINATIONS.map(({id,label,icon})=><button key={id} type="button" onClick={()=>navigate(id)} aria-current={id===page&&!updates?"page":undefined}><DesignIcon name={icon}/>{label}</button>)}<div className="pl-navigation-personal"><button type="button" onClick={()=>setUpdates(true)}>What changed{!read&&<span className="pl-calm-unread-dot"/>}</button></div></aside>
    <div className="plushlife-app-column" style={{margin:"0 auto"}}><div className="pl-calm-mobile-top"><span>PlushLife</span><button type="button" onClick={()=>setUpdates(true)}>What changed{!read&&<span className="pl-calm-unread-dot"/>}</button></div>
      {updates?<WhatsChanged unread={!read} onMarkRead={()=>{setRead(true);return true;}} onClose={()=>setUpdates(false)}/>:page==="guardian"?<GuardianPanel {...base}/>:<StorybookHome userId="theme-fixture" world={world} darkMode={dark} rows={[{key:"walk",label:"Take a short walk",sourceTask:{}}]} period={base.period} selectDayType={noop} toggle={noop} displayName="Cozy"/>}
    </div><nav className="pl-app-bottom-nav" aria-label="Main navigation">{MAIN_DESTINATIONS.map(({id,label,icon})=><button key={id} type="button" className="pl-app-nav-btn" onClick={()=>navigate(id)} aria-current={id===page&&!updates?"page":undefined}><DesignIcon name={icon}/><span>{label}</span></button>)}</nav>
  </div></ThemeWorldContext.Provider></>;
}
ReactDOM.createRoot(document.getElementById("root")).render(<Preview/>);
