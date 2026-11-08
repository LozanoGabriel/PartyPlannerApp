# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **src/app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Login screen

The initial `/` route redirects to `/login`. Sign-in and sign-up open an unauthenticated dashboard preview after local validation; they do not verify credentials or create accounts. Password reset does not send emails, and Google sign-in is unavailable. Connect these flows to the authentication backend before using them for real accounts.

Unmatched routes show a custom not-found page; its back button returns to the previous in-app screen, or to the initial route when there is no navigation history. This page does not provide authentication or authorization.

The terms and privacy notice is draft placeholder text, not an actual policy or recorded consent. Replace it with approved terms describing the real data and AI practices before enabling registration.

The dashboard, its event and milestone data, and the Events, Tasks, Gala, and Settings pages are previews only. The Events page shows a separate example event; edits to its name, duration, food and drink preferences, and selected image are kept only in memory until the app reloads. Images are not uploaded and their local URIs may expire. Event edits do not update the dashboard, guest counts, tasks, budget, or any backend. The sample countdowns are based on November 7, 2026. The dashboard's `showEmptyState` switch previews the no-events fallback; replace it with real event data when the backend is connected.

The guest list is a session-only example: hosts can add or remove guests, edit names and response or invitation tracking labels, search, and filter. Marking an invitation as sent does not send it. Guest-list changes update the Events response summary but are lost on reload. Events and the guest list link to the same sample `/rsvp` guest view; the supplied invitation artwork contains illustrative details that differ from the sample event. RSVP responses, plus-one choices and notes are not saved or sent; no invitation token lookup or host notification is connected. A "Maybe" response offers a manual Google Calendar link for a personal follow-up reminder one week later, but it does not create a host task or reminder. Invitation delivery, guest-specific plus-one permissions, response persistence and follow-up scheduling require a backend.

Settings includes a Profile preview, Event Preferences preview, App Preferences, and Credits. Preference and profile changes require confirmation and warn when leaving with unapplied changes. Profile name, phone, and email last only for the app session; passwords are not saved. Do not enter real credentials. Sign Out only returns to the preview sign-in screen; account deletion is not connected. Event Preferences do not affect event creation yet. The AI Suggestions setting hides Gala's suggestion bubbles on Events, Tasks, and event-planning screens and removes AI-specific event-planning choices, while retaining manual controls and Gala chat.

Enabling notifications requests OS or browser permission when changes are confirmed. Disabling the preference does not revoke permission; use device settings or browser site controls to change it. Notifications are not scheduled or sent, and no backend is connected. Permission support varies by device and browser; web requires a secure context such as HTTPS or localhost. After adding `expo-notifications`, review native customizations and run `npx expo prebuild --platform android --no-install` before rebuilding the Android development app; rebuild the iOS development app on macOS as well. A previously installed build cannot request the new permission until it is rebuilt.

Tasks are fixed examples; the summary figures and listed tasks are separate mockups. Search, assignment/status tabs, due-date filtering, and marking tasks complete work locally; completion resets when leaving the Tasks screen. Create Task is not connected, and edits are temporary to the edit screen. The date picker is a native dependency; rebuild the development app after installing it.

The Gala chat is a preview: suggestion replies and the reply to a typed message are fixed examples, not AI-generated. Messages remain on the screen only. The image/PDF picker displays the selected file name but does not upload, read, or send the file. Dictation appends speech to the draft using the device or browser speech recognition service, which may process audio over the network; support and permissions vary by device and browser. Dictation does not send the message automatically. Rebuild the native development app after installing the document picker and speech recognition module.

If dictation is denied, use the app settings shortcut shown on the Gala page. On Android, allow Microphone under the app's permissions; on iOS, allow Microphone and Speech Recognition. On web, use the site controls beside the address bar to allow microphone access, check browser and operating-system microphone settings, reload, and try again. Permission can also be revoked in those settings. Browser speech recognition support varies; use a supported browser and a secure context such as HTTPS or localhost. Native dictation requires a rebuilt development app rather than Expo Go, a working microphone, and an available speech recognition service.

When an existing generated Android project is present, run `npx expo prebuild --platform android --no-install` before rebuilding so the current speech-recognition permissions and service queries are applied. Review existing native customizations first; do not use `--clean` unless you intend to delete and regenerate the native project. Install the rebuilt app on the device and tap the microphone to request access.

The proposed event update endpoint is `PATCH SERVERIP:3000/api/:eventId` with a `jwt` field in the request payload. It is not connected: the server address, authenticated token source, event ID, field schema, and image upload contract still need to be established. Rebuild the native development app after adding the image picker.

Create new event opens a five-step preview. Step 1 requires an event type, step 2 requires a suggested or custom name, and step 3 offers editable planning settings and a relative timeline. All suggestions are fixed examples, not AI-generated or based on event type. Finalize Changes keeps valid edits and returns to the read-only view; Accept Suggestions restores the defaults. Step 4 accepts an optional headcount (not guest details). Step 5 allows a manually entered total or an example budget; Gala budget generation and routing are not available yet. The final screen shows sample event details rather than entered values, and does not create an event, workspace, or checklist. Back to Dashboard asks for confirmation before discarding the preview. Choices remain in memory during the preview and are lost when it ends or the app reloads.

For an Android development build, run `npx expo start --dev-client` and open the installed development app. After changing bundler dependencies, restart Metro with `npx expo start --dev-client --clear`.

`@expo/ui` is pinned to the Expo SDK 53 alpha release: later canary builds can reference native APIs unavailable in this SDK. After changing native dependencies, rebuild and reinstall the development app with `npx expo run:android`.

The app icon uses `assets/images/gather_logo.png`; the Android adaptive foreground is a padded version of that image. After reviewing any custom native changes, apply icon configuration with `npx expo prebuild --platform android` and rebuild with `npx expo run:android`. Regenerate and rebuild the iOS app on macOS as well.

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **example** directory and create a blank **src/app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
