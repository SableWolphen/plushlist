package com.PlushLife;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import org.json.JSONException;
import org.json.JSONObject;

@CapacitorPlugin(name = "WidgetBridge")
public class WidgetBridgePlugin extends Plugin {
    private static final String INSTALL_WIDGET_SYNC_SCRIPT =
        "(function(){" +
        "if(window.__plushlifeWidgetSyncInstalled)return;" +
        "window.__plushlifeWidgetSyncInstalled=true;" +
        "var clean=function(v){return String(v||'').replace(/\\s+/g,' ').trim();};" +
        "var visible=function(n){return !!(n&&n.getClientRects&&n.getClientRects().length);};" +
        "var controlFor=function(r){return r&&r.querySelector('input[type=checkbox],[role=checkbox],button[aria-pressed]');};" +
        "var rows=function(){var out=[];document.querySelectorAll('input[type=checkbox],[role=checkbox],button[aria-pressed]').forEach(function(c){" +
        "if(!visible(c)||c.closest('#plushlife-gentle-panel')||c.closest('[role=dialog]'))return;" +
        "var r=c.closest('li,article,[data-task-key],[class*=task-row],[class*=task-card]')||c.parentElement;" +
        "if(r&&visible(r)&&out.indexOf(r)<0)out.push(r);});return out;};" +
        "var isDone=function(c){return !!(c&&(c.checked||c.getAttribute('aria-checked')==='true'||c.getAttribute('aria-pressed')==='true'));};" +
        "var taskKey=function(r,c){return clean((r&&r.getAttribute&&r.getAttribute('data-task-key'))||(c&&c.getAttribute&&c.getAttribute('data-task-key'))||(c&&c.value)||'');};" +
        "var taskLabel=function(r){return clean(r&&r.textContent).replace(/^(✓|○|✔|☐|☑)\\s*/, '').slice(0,90);};" +
        "var coach=function(){try{return JSON.parse(localStorage.getItem('plushlife:habit-coach:v1')||'{}')||{};}catch(e){return {};}};" +
        "var dayMode=function(){var text=clean(document.body&&document.body.innerText);var m=text.match(/(?:☀️|🌤️|🌱|↺|🌴)?\\s*(Full|Soft|Tiny|Recovery|Rest) Day\\b/i);return m?(m[1].charAt(0).toUpperCase()+m[1].slice(1).toLowerCase()+' Day'):'Today';};" +
        "var sync=function(){try{var plugin=window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.WidgetBridge;if(!plugin)return;" +
        "if(!document.querySelector('[aria-label=\"PlushLife dashboards\"]'))return;" +
        "var all=rows(),doneCount=0,tasks=[];all.forEach(function(r){var c=controlFor(r);var done=isDone(c);if(done)doneCount++;" +
        "if(tasks.length<8){var label=taskLabel(r);if(label)tasks.push({label:label,done:done,key:taskKey(r,c)});}});" +
        "var progress=all.length?Math.round(doneCount*100/all.length):0;var state=coach();var today=new Date().toISOString().slice(0,10);var anchorId=state.anchors&&state.anchors[today];var anchorLabel=anchorId&&state.history&&state.history[today]&&state.history[today][anchorId]&&state.history[today][anchorId].label;" +
        "if(anchorLabel){var idx=tasks.findIndex(function(t){return clean(t.label).toLowerCase().indexOf(clean(anchorLabel).toLowerCase())>=0;});var anchorTask=idx>=0?tasks.splice(idx,1)[0]:{label:anchorLabel,done:false,key:''};tasks.unshift(anchorTask);}" +
        "var next=tasks.filter(function(t){return !t.done;})[0];tasks=tasks.slice(0,3);" +
        "plugin.updateWidget({dayType:dayMode(),nextTask:next?next.label:(all.length&&doneCount>=all.length?'You’re good for today 💜':'Open PlushLife for one caring step'),progress:progress,weeklyProgress:progress,tasks:tasks}).catch(function(){});" +
        "}catch(e){}};" +
        "var findTask=function(label,key){var wanted=clean(label).toLowerCase();var wantedKey=clean(key);var list=rows();for(var i=0;i<list.length;i++){var r=list[i],c=controlFor(r);if(!c)continue;var keyMatch=wantedKey&&taskKey(r,c)===wantedKey;var text=taskLabel(r).toLowerCase();var labelMatch=wanted&&(text===wanted||text.indexOf(wanted)>=0||wanted.indexOf(text)>=0);if(keyMatch||labelMatch)return {row:r,control:c};}return null;};" +
        "var consumeAction=function(){try{var plugin=window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.WidgetBridge;if(!plugin||!plugin.consumeWidgetAction)return;plugin.consumeWidgetAction().then(function(action){if(!action||action.action!=='done')return;var found=findTask(action.taskLabel,action.taskKey);if(!found||isDone(found.control))return;found.control.click();setTimeout(sync,350);}).catch(function(){});}catch(e){}};" +
        "var queued=false;var queue=function(){if(queued)return;queued=true;setTimeout(function(){queued=false;sync();},250);};" +
        "document.addEventListener('change',queue,true);document.addEventListener('click',queue,true);document.addEventListener('plushlife-widget-sync',queue);document.addEventListener('plushlife-widget-action',consumeAction);" +
        "window.addEventListener('plushlife:habit-coach-updated',queue);window.addEventListener('plushlife:habit-coach-hydrated',queue);" +
        "document.addEventListener('visibilitychange',function(){if(!document.hidden){queue();consumeAction();}});" +
        "window.addEventListener('load',function(){queue();consumeAction();});window.addEventListener('pageshow',function(){queue();consumeAction();});setInterval(sync,30000);queue();consumeAction();" +
        "})();";

    @Override
    public void load() {
        getBridge().getWebView().postDelayed(() ->
            getBridge().getWebView().evaluateJavascript(INSTALL_WIDGET_SYNC_SCRIPT, null), 1200);
        getBridge().getWebView().postDelayed(() ->
            getBridge().getWebView().evaluateJavascript(INSTALL_WIDGET_SYNC_SCRIPT, null), 4000);
    }

    @PluginMethod
    public void updateWidget(PluginCall call) {
        String nextTask = call.getString("nextTask", "Open PlushLife for one caring step");
        String dayType = call.getString("dayType", "Today");
        int progress = Math.max(0, Math.min(100, call.getInt("progress", 0)));
        int weeklyProgress = Math.max(0, Math.min(100, call.getInt("weeklyProgress", progress)));
        JSArray tasks = call.getArray("tasks");

        SharedPreferences.Editor editor = getContext()
            .getSharedPreferences(PlushLifeWidgetProvider.PREFS, Context.MODE_PRIVATE)
            .edit()
            .putString("nextTask", nextTask)
            .putString("dayType", dayType)
            .putInt("progress", progress)
            .putInt("weeklyProgress", weeklyProgress);

        for (int i = 0; i < 3; i++) {
            String label = "";
            boolean done = false;
            String taskKey = "";
            if (tasks != null && i < tasks.length()) {
                try {
                    JSONObject task = tasks.getJSONObject(i);
                    label = task.optString("label", "");
                    done = task.optBoolean("done", false);
                    taskKey = task.optString("key", "");
                } catch (JSONException ignored) {
                }
            }
            editor.putString("task" + i + "Label", label);
            editor.putBoolean("task" + i + "Done", done);
            editor.putString("task" + i + "Key", taskKey);
        }
        editor.apply();

        getContext().sendBroadcast(new Intent(getContext(), PlushLifeWidgetProvider.class)
            .setAction(PlushLifeWidgetProvider.ACTION_REFRESH));
        JSObject result = new JSObject();
        result.put("updated", true);
        call.resolve(result);
    }

    @PluginMethod
    public void consumeWidgetAction(PluginCall call) {
        String taskKey = getActivity().getIntent().getStringExtra("plushlifeTaskKey");
        String taskLabel = getActivity().getIntent().getStringExtra("plushlifeTaskLabel");
        String action = getActivity().getIntent().getStringExtra("plushlifeTaskAction");
        JSObject result = new JSObject();
        result.put("taskKey", taskKey == null ? "" : taskKey);
        result.put("taskLabel", taskLabel == null ? "" : taskLabel);
        result.put("action", action == null ? "" : action);
        getActivity().getIntent().removeExtra("plushlifeTaskKey");
        getActivity().getIntent().removeExtra("plushlifeTaskLabel");
        getActivity().getIntent().removeExtra("plushlifeTaskAction");
        call.resolve(result);
    }

    @PluginMethod
    public void clearWidget(PluginCall call) {
        getContext()
            .getSharedPreferences(PlushLifeWidgetProvider.PREFS, Context.MODE_PRIVATE)
            .edit()
            .clear()
            .apply();
        getContext().sendBroadcast(new Intent(getContext(), PlushLifeWidgetProvider.class)
            .setAction(PlushLifeWidgetProvider.ACTION_REFRESH));
        call.resolve();
    }
}
