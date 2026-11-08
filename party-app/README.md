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

The terms and privacy notice is draft placeholder text, not an actual policy or recorded consent. Replace it with approved terms describing the real data and AI practices before enabling registration.

The dashboard, its event and milestone data, and the Events, Tasks, Gala, and Settings pages are previews only. The sample countdowns are based on November 7, 2026. The dashboard's `showEmptyState` switch previews the no-events fallback; replace it with real event data when the backend is connected.

Create new event opens a five-step preview. Step 1 requires an event type, step 2 requires a suggested or custom name, and step 3 offers editable planning settings and a relative timeline. All suggestions are fixed examples, not AI-generated or based on event type. Finalize Changes keeps valid edits and returns to the read-only view; Accept Suggestions restores the defaults. Step 4 accepts an optional headcount (not guest details). Step 5 allows a manually entered total or an example budget; Gala budget generation and routing are not available yet. The final screen shows sample event details rather than entered values, and does not create an event, workspace, or checklist. Choices remain in memory during the preview and are lost when it ends or the app reloads.

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
