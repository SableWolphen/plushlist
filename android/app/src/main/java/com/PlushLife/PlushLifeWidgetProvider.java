package com.PlushLife;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.view.View;
import android.graphics.Color;
import android.widget.RemoteViews;

public class PlushLifeWidgetProvider extends AppWidgetProvider {
    public static final String PREFS = "plushlife_widget";
    public static final String ACTION_REFRESH = "com.PlushLife.WIDGET_REFRESH";
    private static final int[] TASK_ROW_IDS = { R.id.widget_task_0, R.id.widget_task_1, R.id.widget_task_2 };

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
        if (ACTION_REFRESH.equals(intent.getAction()) || Intent.ACTION_MY_PACKAGE_REPLACED.equals(intent.getAction())) {
            refreshAll(context);
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
        int background = night ? R.drawable.plushlife_widget_night : "dino".equals(theme) ? R.drawable.plushlife_widget_dino : "baby".equals(theme) ? R.drawable.plushlife_widget_nursery : "pink".equals(theme) || "strawberry".equals(theme) ? R.drawable.plushlife_widget_pink : R.drawable.plushlife_widget_background;
        int ink = Color.parseColor(night ? "#F6EEFF" : "#51405E");
        int muted = Color.parseColor(night ? "#D5C5EA" : "#725981");
        views.setInt(R.id.widget_root, "setBackgroundResource", background);
        views.setTextColor(R.id.widget_day_type, muted);
        views.setTextColor(R.id.widget_next_task, ink);
        views.setTextColor(R.id.widget_today_label, muted);
        views.setTextColor(R.id.widget_week_label, muted);
        views.setTextViewText(R.id.widget_day_type, "PlushLife · " + prefs.getString("dayType", "Today"));
        views.setTextViewText(R.id.widget_today_label, "Today " + prefs.getInt("progress", 0) + "%");
        views.setTextViewText(R.id.widget_week_label, "Week " + prefs.getInt("weeklyProgress", 0) + "%");
        Bundle options = manager.getAppWidgetOptions(widgetId);
        int height = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT, 140);
        int rowCount = height >= 240 ? 3 : height >= 185 ? 2 : 1;
        views.setProgressBar(R.id.widget_progress, 100, prefs.getInt("progress", 0), false);
        views.setProgressBar(R.id.widget_weekly_progress, 100, prefs.getInt("weeklyProgress", 0), false);

        boolean anyTaskShown = false;
        boolean anyOpenTask = false;
        for (int i = 0; i < TASK_ROW_IDS.length; i++) {
            String label = prefs.getString("task" + i + "Label", "");
            if (i >= rowCount || label == null || label.isEmpty()) {
                views.setViewVisibility(TASK_ROW_IDS[i], View.GONE);
                continue;
            }
            boolean done = prefs.getBoolean("task" + i + "Done", false);
            views.setTextViewText(TASK_ROW_IDS[i], (done ? "✓ " : "○ ") + label);
            views.setViewVisibility(TASK_ROW_IDS[i], View.VISIBLE);
            views.setTextColor(TASK_ROW_IDS[i], ink);
            String taskKey = prefs.getString("task" + i + "Key", "");
            if (!done) {
                anyOpenTask = true;
                Intent complete = new Intent(context, MainActivity.class)
                    .setAction("com.PlushLife.WIDGET_DONE_" + i)
                    .putExtra("plushlifeTaskAction", "done")
                    .putExtra("plushlifeTaskLabel", label)
                    .putExtra("plushlifeTaskKey", taskKey == null ? "" : taskKey)
                    .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
                PendingIntent completePending = PendingIntent.getActivity(
                    context,
                    widgetId * 10 + i + 1,
                    complete,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
                );
                views.setOnClickPendingIntent(TASK_ROW_IDS[i], completePending);
            }
            if (done) {
                Intent open = new Intent(context, MainActivity.class).setAction(Intent.ACTION_VIEW)
                    .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
                views.setOnClickPendingIntent(TASK_ROW_IDS[i], PendingIntent.getActivity(context, widgetId,
                    open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE));
            }
            anyTaskShown = true;
        }
        views.setTextViewText(R.id.widget_next_task, prefs.getString("nextTask", "Open PlushLife for one caring step"));
        views.setViewVisibility(R.id.widget_next_task, (!anyTaskShown || !anyOpenTask) ? View.VISIBLE : View.GONE);

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
