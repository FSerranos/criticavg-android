# Critic AVG for Android

*Dozens of critics. Just one rating.*

The Critic AVG app for Google Play. It's the same app as the website, packaged with **Capacitor**, plus four features that only make sense in an installed app:

| Feature | What it does |
|---|---|
| **My list** | Save films to watch later. Saved on the phone, so it also works offline |
| **Streaming alerts** | Every ~6 hours, even with the app closed, it checks the films on your list and sends a notification when one arrives on a streaming platform in your country |
| **Share** | Android's share sheet (WhatsApp, Instagram…) with the film, its Critic AVG score and a link |
| **Offline mode** | A proper offline screen; My list and the last 30 films you opened still work without internet |

The phone's back button, status bar colour, icon and splash screen are all set up for Android.

---

## 1 · Before you start

- **Update your Critic AVG server** to **v2026-11-14.4 or newer**. The app uses the server's new `/api/providers` address for the streaming alerts.
- A **Google Play developer account**: play.google.com/console, $25, paid once.

## 2 · Put this project on GitHub

1. On GitHub: **New repository** → name it `criticavg-android` → **Private** is fine → **Create**.
2. Upload everything in this folder (**uploading an existing file** → drag the files and folders in → **Commit changes**).
3. Hidden folders are often skipped. Check that **`.github/workflows/android.yml`** is there. If not: **Add file → Create new file**, type the name `.github/workflows/android.yml`, paste the file's contents, and **Commit changes**.

## 3 · Add your settings (once)

In the repository: **Settings → Secrets and variables → Actions**.

**Variables** tab → **New repository variable**:
- `API_URL` = your Critic AVG address, for example `https://criticavg.yourname.workers.dev` (no slash at the end)

**Secrets** tab → **New repository secret**, four times, using the values in `GITHUB-SECRETS.txt` from the separate **upload key** folder:
- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

> The upload key is your signature as the app's publisher. Keep the upload-key folder private and backed up, and never upload it into the repository.

## 4 · Build the app

**Actions** tab → **Build Critic AVG for Android** → **Run workflow**. After about 8 minutes, open the finished run and download **critic-avg-android-1.0.N** at the bottom. Inside:

- **app-release.apk**: to try it on your phone right away. Open it on the phone and allow "install unknown apps" for your browser or file manager.
- **app-release.aab**: the file you upload to Google Play.

Every run gets a higher version number automatically, as Google Play requires.

## 5 · Publish on Google Play

1. **Play Console → Create app**: name *Critic AVG*, App, Free.
2. Fill in the **App content** section:
   - **Privacy policy:** a page on your site (Claude can write it).
   - **Data safety:** the app collects no personal data. My list stays on the phone.
   - **Ads:** No.
   - **Content rating:** questionnaire, category "Reference / News".
   - **Target audience:** 13+.
3. **Store listing:** short and full description, the 512×512 icon, a 1024×500 feature graphic, and at least 2 phone screenshots.
4. **Closed testing**: new personal accounts need **12 testers opted in for 14 days in a row** before going public. Create a closed testing track, upload the **.aab**, and add your testers' Google emails (friends and family). Each one opens the opt-in link and installs the app.
5. After 14 days: **Apply for production access** → once approved, promote the release to **Production**.

## Updating the app

When the website changes, copy the new `index.html` into `web/`, then **Run workflow** again and upload the new **.aab** in Play Console.

## Files

| File | What it is |
|---|---|
| `web/` | The app itself (same as the website) |
| `runners/runner.js` | The background checker behind the streaming alerts |
| `capacitor.config.json` | App name, ID (`com.criticavg.app`), splash, checker schedule |
| `assets/` | Icon and splash source images (from your logo) |
| `scripts/build-www.mjs` | Puts the app files together with your server address |
| `scripts/patch-android.mjs` | Version number, signing, notification permission, checker engine |
| `scripts/test-runner.mjs` | Tests the checker (runs on every build) |
| `.github/workflows/android.yml` | The build on GitHub |
