// Synthetic browser regression fixture: real theme picker plus legacy discovery helper.
import { AppearanceThemePicker } from "../../src/components/appearance-theme-picker.jsx";
import { ThemeWorldContext } from "../../src/components/theme-world.jsx";
function Fixture(){
 const [preferences,setPreferences]=React.useState({appearance_theme:"none",nickname_style:"warm",dark_mode:false,dino_theme:false}),[expansions,setExpansions]=React.useState(0);
 return <ThemeWorldContext.Provider value={{world:"soft"}}><main id="main-content" data-pl-world="soft" data-pl-dark="false" className="pl-calm-shell" style={{maxWidth:500,margin:"auto",padding:20}}>
 <h1>Settings control regression check</h1><p>Synthetic data only. No account or network connection.</p>
 {Array.from({length:7},(_,i)=><section key={i}><button type="button" aria-pressed={false}>Setting {i+1}</button></section>)}
 <AppearanceThemePicker preferences={preferences} appearanceTheme={preferences.appearance_theme} dinoTheme={preferences.dino_theme} updatePreference={patch=>setPreferences(p=>({...p,...patch}))} selectAppearanceTheme={id=>setPreferences(p=>({...p,appearance_theme:id,dino_theme:false,nickname_style:"warm"}))}/>
 <button type="button" onClick={()=>setExpansions(n=>n+1)}>Show all tasks</button><p role="status">Automatic list expansions: {expansions}</p>
 <ul className="pl-storybook-list">{Array.from({length:8},(_,i)=><li key={i}><button type="button" aria-pressed={false}>Task {i+1}</button><span>Synthetic task {i+1}</span></li>)}</ul>
 </main></ThemeWorldContext.Provider>;
}
ReactDOM.createRoot(document.getElementById("root")).render(<Fixture/>);
