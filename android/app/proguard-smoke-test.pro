# Only loaded by -PplushlifeSmokeTest; never applied to Play bundles.
# AndroidJUnitRunner uses tracing from a shared runtime dependency.
-keep class androidx.tracing.** { *; }
