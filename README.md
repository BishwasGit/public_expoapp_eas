# Medical App - Mobile

React Native mobile application built with Expo, NativeWind (Tailwind CSS), and LiveKit for video sessions.

## Tech Stack

- **Framework**: Expo (React Native)
- **UI Styling**: NativeWind (Tailwind CSS for React Native)
- **Navigation**: React Navigation
- **Video/Audio**: LiveKit React Native SDK
- **State Management**: React Context API
- **HTTP Client**: Axios
- **Storage**: AsyncStorage

## Prerequisites

- Node.js 18+ and npm
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (macOS) or Android Studio (for Android development)
- Expo Go app on your physical device (for testing)

## Installation

```bash
cd mobile
npm install
```

## Configuration

Update the API base URL in `src/services/api.ts`:

```typescript
const API_BASE_URL = 'http://192.168.1.94:3000'; // Your backend IP
```

## Running the App

### Development Server

```bash
npm start
```

This will start the Expo development server. You can then:
- Press `a` to open in Android emulator
- Press `i` to open in iOS simulator (macOS only)
- Scan the QR code with Expo Go app on your phone

### Platform-specific Commands

```bash
# Android
npm run android

# iOS (macOS only)
npm run ios

# Web
npm run web
```

# build 
``export JAVA_HOME=$HOME/jdk/latest && export ANDROID_HOME=$HOME/Android/sdk && export PATH=$JAVA_HOME/bin:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH && npx expo run:android

## Project Structure

```
mobile/
├── src/
│   ├── components/      # Reusable UI components
│   ├── context/         # React Context providers (Auth, etc.)
│   ├── screens/         # Screen components
│   ├── services/        # API client and services
│   └── types/           # TypeScript type definitions
├── App.tsx              # Main app component with navigation
├── global.css           # Global Tailwind styles
├── metro.config.js      # Metro bundler config for NativeWind
└── tailwind.config.js   # Tailwind CSS configuration
```

## Features

### Current Implementation

✅ Authentication (Login/Register)
✅ Protected routes based on auth state
✅ AsyncStorage for token persistence
✅ NativeWind styling with Tailwind classes
✅ Role-based navigation (Patient/Psychologist)

### To Be Implemented

- [ ] Psychologist listing and search
- [ ] Session booking
- [ ] LiveKit video sessions
- [ ] Chat messaging
- [ ] Session history
- [ ] Profile management
- [ ] Push notifications

## NativeWind Usage

Use Tailwind CSS classes with the `className` prop:

```tsx
<View className="flex-1 bg-white px-4">
  <Text className="text-xl font-bold text-gray-800">
    Hello World
  </Text>
  <TouchableOpacity className="bg-blue-600 py-3 px-6 rounded-lg">
    <Text className="text-white text-center">
      Button
    </Text>
  </TouchableOpacity>
</View>
```

## LiveKit Integration

The app is configured to work with your LiveKit server at `192.168.1.94:7880`. Video session components will use the LiveKit React Native SDK.

## Testing on Physical Device

1. Install Expo Go from App Store (iOS) or Play Store (Android)
2. Make sure your device is on the same network as your development machine
3. Run `npm start` and scan the QR code with Expo Go
4. Ensure your backend API is accessible from the device's network

## Building for Production

### Android APK

```bash
npx expo build:android
```

### iOS IPA

```bash
npx expo build:ios
```

For managed builds with EAS (recommended):

```bash
npm install -g eas-cli
eas build --platform android
eas build --platform ios
```

## Troubleshooting

### Metro bundler issues
```bash
npx expo start -c  # Clear cache
```

### Network connection issues
- Ensure backend server allows connections from your device IP
- Check firewall settings
- Use `ifconfig` (macOS/Linux) or `ipconfig` (Windows) to verify your IP

## Code Sharing with Web

This mobile app shares types and business logic with the web app in `/web`. Consider creating a shared package for:
- Type definitions
- API client utilities
- Business logic
- Constants

## License

Private - Medical Application
