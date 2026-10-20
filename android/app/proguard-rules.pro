# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# If your project uses WebView with JS, uncomment the following
# and specify the fully qualified class name to the JavaScript interface
# class:
#-keepclassmembers class fqcn.of.javascript.interface.for.webview {
#   public *;
#}

# Uncomment this to preserve the line number information for
# debugging stack traces.
#-keepattributes SourceFile,LineNumberTable

# If you keep the line number information, uncomment this to
# hide the original source file name.
#-renamesourcefileattribute SourceFile

# Firebase Cloud Messaging (used by @capacitor/push-notifications) discovers
# some of its startup components via reflection/manifest metadata rather than
# normal class references, so R8 can't always see that they're still needed
# and may strip or rename them — which surfaces as a crash on real devices
# the moment a push-notifications call touches Firebase, even though nothing
# looks wrong in a debug build. Keeping these wholesale is the standard,
# low-risk fix (it only prevents removal/renaming, it can't hide real bugs).
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.firebase.**
-dontwarn com.google.android.gms.**

# Same reasoning as above, for the Play in-app update library (checks Play
# Store for a newer version on launch and forces an update if one exists).
-keep class com.google.android.play.core.** { *; }
-dontwarn com.google.android.play.core.**

# Bridge calls and plugin callbacks are reached from JavaScript/reflection.
-keepattributes RuntimeVisibleAnnotations,RuntimeInvisibleAnnotations,AnnotationDefault
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-keep public class * extends com.getcapacitor.Plugin { *; }
# RemoteViews components are instantiated by Android outside our process.
-keep class com.PlushLife.PlushLifeWidget* { *; }
