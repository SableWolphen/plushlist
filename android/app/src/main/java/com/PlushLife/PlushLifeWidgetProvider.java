package com.PlushLife;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.os.Bundle;
import android.view.View;
import android.widget.RemoteViews;
import org.json.JSONArray;
import org.json.JSONObject;

public class PlushLifeWidgetProvider extends AppWidgetProvider {
    public static final String PREFS = "plushlife_widget";
    public static final String ACTION_REFRESH = "com.PlushLife.WIDGET_REFRESH";
    public static final String ACTION_TOGGLE_TASK = "com.PlushLife.WIDGET_TOGGLE_TASK";
    public static final String PENDING_ACTIONS_KEY = "pendingTaskActions";

    private static final int[] TASK_ROW_IDS = {
        R.id.widget_task_row_0, R.id.widget_task_row_1, R.id.widget_task_row_2
    };
    private static final int[] TASK_CHECK_IDS = {
        R.id.widget_task_check_0, R.id.widget_task_check_1, R.id.widget_task_check_2
    };
    private static final int[] TASK_LABEL_IDS = {
        R.id.widget_task_label_0, R.id.widget_task_label_1, R.id.widget_task_label_2
    };

    @Override
    public void onEnabled(Context context) {
        super.onEnabled(context);
        refreshAll(context);
    }

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] appWidgetIds) {
        for (int id : appWidgetIds) updateWidget(context, manager, id);
    }

    @Override
    public void onAppWidgetOptionsChanged(Context context, AppWidgetManager manager, int appWidgetId, Bundle newOptions) {
        super.onAppWidgetOptionsChanged(context, manager, appWidgetId, newOptions);
        updateWidget(context, manager, appWidgetId);
    }

    @Override
    public void onRestored(Context context, int[] oldWidgetIds, int[] newWidgetIds) {
        super.onRestored(context, oldWidgetIds, newWidgetIds);
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        for (int id : newWidgetIds) updateWidget(context, manager, id);
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        String action = intent.getAction();
        if (ACTION_TOGGLE_TASK.equals(action)) {
            toggleTaskFromWidget(context, intent);
            refreshAll(context);
            return;
        }
        if (ACTION_REFRESH.equals(action) || Intent.ACTION_MY_PACKAGE_REPLACED.equals(action)) {
            refreshAll(context);
        }
    }

    private static void toggleTaskFromWidget(Context context, Intent intent) {
        int index = intent.getIntExtra("plushlifeTaskIndex", -1);
        if (index < 0 || index >= TASK_ROW_IDS.length) return;

        SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        boolean wasDone = prefs.getBoolean("task" + index + "Done", false);
        boolean done = !wasDone;
        String key = prefs.getString("task" + index + "Key", "");
        String label = prefs.getString("task" + index + "Label", "");

        int totalCount = Math.max(0, prefs.getInt("totalCount", 0));
        int completeCount = Math.max(0, prefs.getInt("completeCount", 0));
        if (done) completeCount++; else completeCount = Math.max(0, completeCount - 1);
        if (totalCount > 0) completeCount = Math.min(totalCount, completeCount);
        int progress = totalCount > 0
            ? Math.round((completeCount * 100f) / totalCount)
            : prefs.getInt("progress", 0);

        prefs.edit()
            .putBoolean("task" + index + "Done", done)
            .putInt("completeCount", completeCount)
            .putInt("progress", progress)
            .apply();

        queuePendingAction(prefs, key, label, done ? "done" : "undo");
    }

    private static void queuePendingAction(SharedPreferences prefs, String key, String label, String action) {
        try {
            JSONArray queue = new JSONArray(prefs.getString(PENDING_ACTIONS_KEY, "[]"));
            JSONObject item = new JSONObject();
            item.put("taskKey", key == null ? "" : key);
            item.put("taskLabel", label == null ? "" : label);
            item.put("action", action);
            queue.put(item);
            prefs.edit().putString(PENDING_ACTIONS_KEY, queue.toString()).apply();
        } catch (Exception ignored) {
            // The widget stays interactive even if the queue cannot be written.
        }
    }

    private static void refreshAll(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        int[] ids = manager.getAppWidgetIds(new ComponentName(context, PlushLifeWidgetProvider.class));
        for (int id : ids) updateWidget(context, manager, id);
    }

    static void updateWidget(Context context, AppWidgetManager manager, int widgetId) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.plushlife_widget);

        String theme = prefs.getString("theme", "soft");
        boolean night = "twilight".equals(theme) || "baby-night".equals(theme);
        int background = night ? R.drawable.plushlife_widget_night
            : "dino".equals(theme) ? R.drawable.plushlife_widget_dino
            : "baby".equals(theme) ? R.drawable.plushlife_widget_nursery
            : "pink".equals(theme) || "strawberry".equals(theme) ? R.drawable.plushlife_widget_pink
            : R.drawable.plushlife_widget_background;
        int ink = Color.parseColor(night ? "#F6EEFF" : "#4F405A");
        int muted = Color.parseColor(night ? "#D5C5EA" : "#7D6588");
        int accent = Color.parseColor(night ? "#DCA8F2" : "#B34BC7");
        int doneInk = Color.parseColor(night ? "#C7E8D7" : "#4B7F68");
        int rowBackground = night ? R.drawable.plushlife_widget_task_row_night : R.drawable.plushlife_widget_task_row;
        int rowDoneBackground = night ? R.drawable.plushlife_widget_task_row_done_night : R.drawable.plushlife_widget_task_row_done;
        int miniCardBackground = night ? R.drawable.plushlife_widget_mini_card_night : R.drawable.plushlife_widget_mini_card;

        views.setInt(R.id.widget_root, "setBackgroundResource", background);
        views.setTextColor(R.id.widget_day_type, muted);
        views.setTextColor(R.id.widget_title, ink);
        views.setTextColor(R.id.widget_today_label, muted);
        views.setTextColor(R.id.widget_week_label, muted);
        views.setTextColor(R.id.widget_refresh, accent);
        views.setTextColor(R.id.widget_hint, muted);
        views.setInt(R.id.widget_today_card, "setBackgroundResource", miniCardBackground);
        views.setInt(R.id.widget_week_card, "setBackgroundResource", miniCardBackground);

        String dayType = prefs.getString("dayType", "Today");
        views.setTextViewText(R.id.widget_day_type, "PLUSH LIFE · " + dayType.toUpperCase());
        views.setTextViewText(R.id.widget_title, prefs.getInt("progress", 0) >= 100 ? "You did enough today 💜" : "One little step ✨");
        views.setTextViewText(R.id.widget_today_label, "Today " + prefs.getInt("progress", 0) + "%");
        views.setTextViewText(R.id.widget_week_label, "Week " + prefs.getInt("weeklyProgress", 0) + "%");

        Bundle options = manager.getAppWidgetOptions(widgetId);
        int height = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT, 140);
        // Leave room for 48dp controls, readable labels and the progress footer.
        int rowCount = height >= 295 ? 3 : height >= 235 ? 2 : 1;
        views.setViewVisibility(R.id.widget_hint, height >= 280 ? View.VISIBLE : View.GONE);
        views.setViewVisibility(R.id.widget_progress_footer, height >= 205 ? View.VISIBLE : View.GONE);
        views.setInt(R.id.widget_progress_footer, "setBackgroundColor", Color.TRANSPARENT);
        views.setProgressBar(R.id.widget_progress, 100, prefs.getInt("progress", 0), false);
        views.setProgressBar(R.id.widget_weekly_progress, 100, prefs.getInt("weeklyProgress", 0), false);

        Intent refreshIntent = new Intent(context, PlushLifeWidgetProvider.class)
            .setAction(ACTION_REFRESH);
        views.setOnClickPendingIntent(
            R.id.widget_refresh,
            PendingIntent.getBroadcast(
                context,
                widgetId * 100 + 90,
                refreshIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            )
        );

        boolean anyTaskShown = false;
        boolean anyOpenTask = false;
        for (int i = 0; i < TASK_ROW_IDS.length; i++) {
            String label = prefs.getString("task" + i + "Label", "");
            if (i >= rowCount || label == null || label.isEmpty()) {
                views.setViewVisibility(TASK_ROW_IDS[i], View.GONE);
                continue;
            }

            boolean done = prefs.getBoolean("task" + i + "Done", false);
            String taskKey = prefs.getString("task" + i + "Key", "");
            views.setViewVisibility(TASK_ROW_IDS[i], View.VISIBLE);
            views.setTextViewText(TASK_CHECK_IDS[i], done ? "✓" : "○");
            views.setTextViewText(TASK_LABEL_IDS[i], label);
            views.setContentDescription(TASK_CHECK_IDS[i], (done ? "Mark incomplete: " : "Complete task: ") + label);
            views.setContentDescription(TASK_LABEL_IDS[i], "Open PlushLife for " + label);
            views.setTextColor(TASK_CHECK_IDS[i], done ? doneInk : accent);
            views.setTextColor(TASK_LABEL_IDS[i], done ? doneInk : ink);
            views.setInt(TASK_ROW_IDS[i], "setBackgroundResource",
                done ? rowDoneBackground : rowBackground);

            Intent toggle = new Intent(context, PlushLifeWidgetProvider.class)
                .setAction(ACTION_TOGGLE_TASK)
                .putExtra("plushlifeTaskIndex", i)
                .putExtra("plushlifeTaskKey", taskKey == null ? "" : taskKey)
                .putExtra("plushlifeTaskLabel", label);
            PendingIntent togglePending = PendingIntent.getBroadcast(
                context,
                widgetId * 100 + i + 1,
                toggle,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
            views.setOnClickPendingIntent(TASK_CHECK_IDS[i], togglePending);

            Intent openTask = new Intent(context, MainActivity.class)
                .setAction(Intent.ACTION_VIEW)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            views.setOnClickPendingIntent(
                TASK_LABEL_IDS[i],
                PendingIntent.getActivity(
                    context,
                    widgetId * 100 + i + 20,
                    openTask,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
                )
            );

            if (!done) anyOpenTask = true;
            anyTaskShown = true;
        }

        views.setTextViewText(R.id.widget_next_task, prefs.getString("nextTask", "Open PlushLife for one caring step"));
        views.setTextColor(R.id.widget_next_task, ink);
        views.setViewVisibility(R.id.widget_next_task, (!anyTaskShown || !anyOpenTask) ? View.VISIBLE : View.GONE);
        if (!anyTaskShown || height < 280) views.setViewVisibility(R.id.widget_hint, View.GONE);

        Intent launch = new Intent(context, MainActivity.class)
            .setAction(Intent.ACTION_VIEW)
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pending = PendingIntent.getActivity(
            context,
            widgetId,
            launch,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        views.setOnClickPendingIntent(R.id.widget_root, pending);

        manager.updateAppWidget(widgetId, views);
    }
}
