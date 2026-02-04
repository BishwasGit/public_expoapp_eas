import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import apiClient from '../services/api';
// This import will resolve to .native.tsx on native and .web.tsx on web
// @ts-ignore - Metro resolves this extensions automatically
import LiveKitRoom from '../components/LiveKit/LiveKitRoom';

export default function SessionScreen({ route, navigation }: any) {
    const { sessionId } = route.params;
    const [token, setToken] = useState<string>('');
    const [url, setUrl] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [demoState, setDemoState] = useState({ active: false, remaining: 0 });
    const [startTime, setStartTime] = useState<string | null>(null);

    useEffect(() => {
        const initSession = async () => {
            try {
                // 1. Fetch Session Details (to get start time/participants)
                const sessionRes = await apiClient.get(`/sessions/${sessionId}`);
                const session = sessionRes.data.data || sessionRes.data;
                setStartTime(session.startTime);

                // 2. Fetch Demo Info (if patient)
                // We'd need patientId and psychologistId.
                // Assuming session object has them.
                if (session.psychologistId && session.patientId) {
                    // Check demo minutes
                    const demoRes = await apiClient.get(`/demo-minutes/psychologist/${session.psychologistId}?patientId=${session.patientId}`);
                    if (demoRes.data && demoRes.data.remainingMinutes) {
                        setDemoState({
                            active: true, // Initially assume active if minutes exist
                            remaining: demoRes.data.remainingMinutes
                        });
                    }
                }

                // 3. Get LiveKit Token
                const tokenRes = await apiClient.post('/video/token', {
                    roomName: `session-${sessionId}`,
                });
                const tokenData = tokenRes.data.data || tokenRes.data;
                setToken(tokenData.token);
                setUrl(process.env.EXPO_PUBLIC_LIVEKIT_URL || tokenData.serverUrl);

            } catch (error) {
                console.error('Failed to join session:', error);
                Alert.alert('Error', 'Failed to join session');
                navigation.goBack();
            } finally {
                setIsLoading(false);
            }
        };

        initSession();
    }, []);

    const handleDisconnect = () => {
        navigation.goBack();
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#7c3aed" />
                <Text style={styles.loadingText}>Preparing session...</Text>
            </View>
        );
    }

    if (!token || !url) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.errorText}>Could not load session details.</Text>
            </View>
        );
    }

    return (
        <LiveKitRoom
            token={token}
            url={url}
            sessionId={sessionId}
            onDisconnect={handleDisconnect}
            demoMinutes={demoState.remaining}
            sessionStartTime={startTime}
        />
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#111827',
    },
    loadingText: {
        color: 'white',
        marginTop: 16,
    },
    errorText: {
        color: '#ef4444',
        fontSize: 16,
    }
});
