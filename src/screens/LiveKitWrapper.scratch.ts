import {
    registerGlobals
} from '@livekit/react-native';
import {
    Platform
} from 'react-native';

// Web compatibility wrapper
let WebLiveKit: any = null;
let WebRoom: any = null;

if (Platform.OS === 'web') {
    try {
        // Dynamic import for web SDKs if using Metro with proper resolution
        // But for simply splitting, we usually need different files (SessionScreen.web.tsx)
        // or ensure native modules aren't imported.
        // Since `import ... from '@livekit/react-native'` is static, it breaks bundle.
    } catch (e) {
        console.error('Web LiveKit load error', e);
    }
} else {
    registerGlobals();
}

// ...
