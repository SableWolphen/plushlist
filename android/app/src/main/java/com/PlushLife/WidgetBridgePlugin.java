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
        "var rows=function(){var out=[];document.querySelectorAll('input[type=checkbox],[role=checkbox],button[aria-pressed]').forEach(function(c){" +
        "if(!visible(c)||c.closest('#plushlife-gentle-panel')||c.closest('[role=dialog]'))return;" +
        "var r=c.closest('li,article,[data-task-key],[class*=task-row],[class*=task-card]')||c.parentElement;" +
        "if(r&&visible(r)&&out.indexOf(r)<0)out.push(r);});return out;};" +
        "var isDone=function(c){return !!(c&&(c.checked||c.getAttribute('aria-checked')==='true'||c.getAttribute('aria-pressed')==='true'));};" +
        "var coach=function(){try{return JSON.parse(localStorage.getItem('plushlife:habit-coach:v1')||'{}')||{};}catch(e){return {};}};" +
        "var sync=function(){try{var plugin=window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.WidgetBridge;if(!plugin)return;" +
        "if(!document.querySelector('[aria-label=\"PlushLife dashboards\"]'))return;" +
        "var all=rows(),doneCount=0,tasks=[];all.forEach(function(r){var c=r.querySelector('input[type=checkbox],[role=checkbox],button[aria-pressed]');var done=isDone(c);if(done)doneCount++;" +
        "if(tasks.length<8){var label=clean(r.textContent).replace(/^(✓|○|✔|☐|☑)\\s*/, '').slice(0,90);if(label)tasks.push({label:label,done:done});}});" +
        "var progress=all.length?Math.round(doneCount*100/all.length):0;var state=coach();var today=new Date().toISOString().slice(0,10);var anchorId=state.anchors&&state.anchors[today];var anchorLabel=anchorId&&state.history&&state.history[today]&&state.history[today][anchorId]&&state.history[today][anchorId].label;var goal=state.goals&&state.goals[today];" +
        "if(anchorLabel){var idx=tasks.findIndex(function(t){return clean(t.label).toLowerCase().indexOf(clean(anchorLabel).toLowerCase())>=0;});var anchorTask=idx>=0?tasks.splice(idx,1)[0]:{label:anchorLabel,done:false};tasks.unshift(anchorTask);}" +
        "tasks=tasks.slice(0,3);var next=tasks.filter(function(t){return !t.done;})[0];var header=goal?('Goal · '+clean(goal).slice(0,42)):(anchorLabel?'Anchor Habit':'Today');" +
        "plugin.updateWidget({dayType:header,nextTask:next?next.label:(anchorLabel?('Anchor complete · '+anchorLabel):'Open PlushLife for one caring step'),progress:progress,weeklyProgress:progress,tasks:tasks}).catch(function(){});" +
        "}catch(e){}};" +
        "var queued=false;var queue=function(){if(queued)return;queued=true;setTimeout(function(){queued=false;sync();},250);};" +
        "document.addEventListener('change',queue,true);document.addEventListener('click',queue,true);document.addEventListener('plushlife-widget-sync',queue);" +
        "window.addEventListener('plushlife:habit-coach-updated',queue);window.addEventListener('plushlife:habit-coach-hydrated',queue);" +
        "document.addEventListener('visibilitychange',function(){if(!document.hidden)queue();});" +
        "window.addEventListener('load',queue);window.addEventListener('pageshow',queue);setInterval(sync,30000);queue();" +
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
        String action = getActivity().getIntent().getStringExtra("plushlifeTaskAction");
        JSObject result = new JSObject();
        result.put("taskKey", taskKey == null ? "" : taskKey);
        result.put("action", action == null ? "" : action);
        getActivity().getIntent().removeExtra("plushlifeTaskKey");
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
