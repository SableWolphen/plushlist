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

# Firebase, Google Play services and in-app updates supply consumer rules in
# their AARs for reflected/manifest components. Keeping these entire SDKs here
# prevented shrinking, optimization and obfuscation of most of the app.
# AGP 9 strict mode does not implicitly keep default constructors. Firebase
# discovers these registrars by name and constructs them reflectively.
-keep class * implements com.google.firebase.components.ComponentRegistrar {
    public <init>();
}

# Bridge calls and plugin callbacks are reached from JavaScript/reflection.
-keepattributes RuntimeVisibleAnnotations,RuntimeInvisibleAnnotations,AnnotationDefault
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-keep public class * extends com.getcapacitor.Plugin { *; }
# RemoteViews components are instantiated by Android outside our process.
-keep class com.PlushLife.PlushLifeWidget* { *; }
