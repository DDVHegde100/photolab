# PhotoLab Release Checklist

## Web on Vercel

1. Connect `https://github.com/DDVHegde100/photolab` in Vercel.
2. Set framework preset to `Other`.
3. Use build command `npm run build:web`.
4. Use output directory `dist`.
5. Deploy from `master`.
6. Add a custom domain after the first successful deploy.

## iOS TestFlight

1. Confirm `expo.ios.bundleIdentifier` in `app.json` is unique in Apple Developer. It is currently `com.ddvhegde.photolab`; change it before building if you want a different reverse-DNS ID.
2. Install EAS CLI with `npm install -g eas-cli`.
3. Log in with `eas login`.
4. Run `eas build:configure` if this Apple team has not been configured before.
5. Build with `eas build --platform ios --profile production`.
6. Submit with `eas submit --platform ios --profile production`.
7. In App Store Connect, add testers in TestFlight after Apple finishes processing.

## Before Every Release

```bash
npm run typecheck
npm run build:web
```

Increment `ios.buildNumber` and `android.versionCode` for store submissions.
