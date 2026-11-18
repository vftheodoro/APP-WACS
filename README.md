# WACS — Mobile Application

Mobile application from **WACS (Wheelchair Automation Control System)**, an assistive-mobility project developed alongside hardware and research components. This repository contains the React Native / Expo app; hardware and broader technical materials are in [TCC-WACS](https://github.com/vftheodoro/TCC-WACS).

## Project areas

- Wheelchair control interface and connectivity work.
- Mapping and accessibility-related screens.
- User profiles, community interactions, and location contributions.
- Authentication, cloud data, and app navigation.

**Project status:** research/prototype software. The presence of a screen or integration in the source does not establish that every feature is validated on physical hardware or ready for unsupervised use.

## Stack

React Native, Expo, JavaScript, React Navigation, Firebase, React Native Maps, Bluetooth-related libraries, and Socket.IO client integrations. Check `package.json` and individual modules for the versions and actual feature implementations.

## Local development

```bash
git clone https://github.com/vftheodoro/APP-WACS.git
cd APP-WACS
npm ci
npm run start
```

The `start` script invokes Expo. The `web` script (`npm run web`) launches the web target, which may not support native hardware features.

## Environment configuration

`app.config.js` reads environment variables for Firebase, Google Maps, WebSocket connectivity, and the Bluetooth mock flag. Configure your own development environment with, as applicable:

```dotenv
FIREBASE_API_KEY=
FIREBASE_AUTH_DOMAIN=
FIREBASE_PROJECT_ID=
FIREBASE_STORAGE_BUCKET=
FIREBASE_MESSAGING_SENDER_ID=
FIREBASE_APP_ID=
GOOGLE_MAPS_API_KEY=
WEBSOCKET_URL=
USE_BLUETOOTH_MOCK=
```

Do not commit live private credentials or personal data. Native Bluetooth features may require a compatible device and development build; browser/Expo Go behavior may differ.

## Relevant paths

- `src/screens`: application screens.
- `src/components`: shared UI and map components.
- `src/contexts`: application state and connectivity contexts.
- `src/config`: configuration and architectural notes.
- `scripts`: project maintenance utilities.

## Safety and limitations

This is an assistive-technology prototype, **not a medically certified mobility controller**. Hardware control must be tested under appropriate supervision with an emergency stop and physical safety measures. Map accessibility information must not be treated as guaranteed without local validation.

## Related work

- [WACS hardware and technical project](https://github.com/vftheodoro/TCC-WACS)
- [Victor Theodoro](https://github.com/vftheodoro)
