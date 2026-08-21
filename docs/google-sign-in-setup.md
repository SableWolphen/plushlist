# Google Sign-In setup for PlushLife

The app UI and Android return-link handling are implemented in the repository. Google Sign-In still requires provider credentials to be configured in Google Cloud and Supabase before the button can complete a real sign-in.

## Redirects used by PlushLife

- Web: `https://sablewolphen.github.io/plushlist/`
- Android callback: `plushlife://login-callback`
- Supabase project callback for Google: use the callback URL shown on the Google provider page for project `pvitdhixycegmcovapyh`.

The Android manifest already registers `plushlife://login-callback`, and `login.html` listens for the Capacitor `appUrlOpen` event to finish the Supabase session.

## Google Cloud

1. Open Google Auth Platform for the PlushLife Google Cloud project.
2. Configure Branding and Audience for the app.
3. Keep the requested scopes limited to the identity scopes Supabase needs: `openid`, email, and profile.
4. Create a Web OAuth client.
5. Add `https://sablewolphen.github.io` as an authorized JavaScript origin.
6. Add the Supabase Google callback URL shown in Authentication > Providers > Google as an authorized redirect URI.
7. For the Android-native credential path in the future, also create an Android OAuth client using package `com.PlushLife` and the signing SHA-1 fingerprints for test and production builds. The current shipped flow uses Supabase OAuth plus the registered app callback, so no Google client secret belongs in this repository.

## Supabase

1. Open Authentication > Providers > Google for project `pvitdhixycegmcovapyh`.
2. Enable Google.
3. Add the Web client ID and client secret from Google Cloud.
4. In Authentication > URL Configuration, keep the production site URL and add these redirect URLs:
   - `https://sablewolphen.github.io/plushlist/**`
   - `plushlife://login-callback`
5. Save the provider settings.

Do not commit the Google client secret, service-account credentials, or any other OAuth secret to GitHub.

## Verification checklist

After provider configuration is saved:

1. On web, open `login.html`, tap **Continue with Google**, complete consent, and confirm PlushLife opens signed in.
2. On the Android test build, tap **Continue with Google**, complete consent, and confirm Android returns to PlushLife through `plushlife://login-callback`.
3. Sign out and confirm email-code and password sign-in still work.
4. Try an account that has never used PlushLife before and confirm a normal Supabase user is created without bypassing row-level security.
5. Test an existing email account that later chooses Google with the same email and verify account-linking behavior before broadly promoting Google Sign-In.

Google/Supabase console configuration is intentionally kept outside source control because it contains credentials and live auth settings.
