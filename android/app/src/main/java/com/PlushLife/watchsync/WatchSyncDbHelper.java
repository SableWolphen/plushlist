package com.PlushLife.watchsync;

import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.List;

// Purely local, on-device cache for watch-originated task changes. This is
// deliberately not Room: it is one small file with two small tables, and
// adding Room's annotation processor to a Capacitor project for that is not
// worth the build-time cost. Nothing here is a source of truth — Supabase
// still is. This is only a fast local buffer so a watch tap can update the
// phone instantly with zero network round trip, plus a short-lived queue so
// that write eventually reaches Supabase once the web app is running.
public class WatchSyncDbHelper extends SQLiteOpenHelper {
    private static final String DB_NAME = "watch_sync.db";
    private static final int DB_VERSION = 1;

    public WatchSyncDbHelper(Context context) {
        super(context.getApplicationContext(), DB_NAME, null, DB_VERSION);
    }

    @Override
    public void onCreate(SQLiteDatabase db) {
        db.execSQL("CREATE TABLE watch_secrets (" +
            "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
            "secret_hash TEXT UNIQUE NOT NULL, " +
            "device_name TEXT NOT NULL DEFAULT 'Watch', " +
            "created_at INTEGER NOT NULL, " +
            "last_seen_at INTEGER)");
        db.execSQL("CREATE TABLE pending_task_changes (" +
            "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
            "task_key TEXT NOT NULL, " +
            "completed INTEGER NOT NULL, " +
            "change_date TEXT NOT NULL, " +
            "created_at INTEGER NOT NULL, " +
            "synced INTEGER NOT NULL DEFAULT 0)");
    }

    @Override
    public void onUpgrade(SQLiteDatabase db, int oldVersion, int newVersion) {
        // No prior versions yet.
    }

    // --- Pairing -------------------------------------------------------

    public static String sha256Hex(String value) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(value.getBytes("UTF-8"));
            StringBuilder hex = new StringBuilder();
            for (byte b : digest) hex.append(String.format("%02x", b));
            return hex.toString();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    /** Registers a brand-new device secret and returns the raw (unhashed) value. Only the hash is ever stored. */
    public String registerNewSecret(String deviceName) {
        byte[] bytes = new byte[32];
        new SecureRandom().nextBytes(bytes);
        StringBuilder hex = new StringBuilder();
        for (byte b : bytes) hex.append(String.format("%02x", b));
        String rawSecret = hex.toString();

        ContentValues values = new ContentValues();
        values.put("secret_hash", sha256Hex(rawSecret));
        values.put("device_name", deviceName == null || deviceName.isEmpty() ? "Watch" : deviceName);
        values.put("created_at", System.currentTimeMillis());
        getWritableDatabase().insertOrThrow("watch_secrets", null, values);
        return rawSecret;
    }

    public boolean isValidSecret(String rawSecret) {
        if (rawSecret == null || rawSecret.isEmpty()) return false;
        Cursor cursor = getReadableDatabase().rawQuery(
            "SELECT id FROM watch_secrets WHERE secret_hash = ?", new String[] { sha256Hex(rawSecret) });
        boolean found = cursor.moveToFirst();
        cursor.close();
        if (found) {
            ContentValues touch = new ContentValues();
            touch.put("last_seen_at", System.currentTimeMillis());
            getWritableDatabase().update("watch_secrets", touch, "secret_hash = ?", new String[] { sha256Hex(rawSecret) });
        }
        return found;
    }

    // --- Pending changes -------------------------------------------------

    /** Applies a change to the local cache and queues it for later Supabase reconciliation. */
    public void recordChange(String taskKey, boolean completed, String changeDate) {
        ContentValues values = new ContentValues();
        values.put("task_key", taskKey);
        values.put("completed", completed ? 1 : 0);
        values.put("change_date", changeDate);
        values.put("created_at", System.currentTimeMillis());
        values.put("synced", 0);
        getWritableDatabase().insertOrThrow("pending_task_changes", null, values);
    }

    public static class PendingChange {
        public final long id;
        public final String taskKey;
        public final boolean completed;
        public final String changeDate;

        PendingChange(long id, String taskKey, boolean completed, String changeDate) {
            this.id = id;
            this.taskKey = taskKey;
            this.completed = completed;
            this.changeDate = changeDate;
        }
    }

    public List<PendingChange> unsyncedChanges() {
        List<PendingChange> result = new ArrayList<>();
        Cursor cursor = getReadableDatabase().rawQuery(
            "SELECT id, task_key, completed, change_date FROM pending_task_changes WHERE synced = 0 ORDER BY created_at ASC LIMIT 200",
            null);
        while (cursor.moveToNext()) {
            result.add(new PendingChange(
                cursor.getLong(0), cursor.getString(1), cursor.getInt(2) == 1, cursor.getString(3)));
        }
        cursor.close();
        return result;
    }

    public void markSynced(List<Long> ids) {
        SQLiteDatabase db = getWritableDatabase();
        db.beginTransaction();
        try {
            for (Long id : ids) {
                db.execSQL("UPDATE pending_task_changes SET synced = 1 WHERE id = ?", new Object[] { id });
            }
            // Keep the table small — synced rows older than a day serve no purpose.
            db.execSQL("DELETE FROM pending_task_changes WHERE synced = 1 AND created_at < ?",
                new Object[] { System.currentTimeMillis() - 24L * 60 * 60 * 1000 });
            db.setTransactionSuccessful();
        } finally {
            db.endTransaction();
        }
    }
}
