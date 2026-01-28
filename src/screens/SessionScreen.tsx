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

    useEffect(() => {
        fetchToken();
    }, []);

    const fetchToken = async () => {
        try {
            // Get token from backend
            const res = await apiClient.post('/video/token', {
                roomName: `session-${sessionId}`,
            });
            const data = res.data.data || res.data;
            setToken(data.token);
            setUrl(process.env.EXPO_PUBLIC_LIVEKIT_URL || data.serverUrl);
        } catch (error) {
            console.error('Failed to get token:', error);
            Alert.alert('Error', 'Failed to join session');
            navigation.goBack();
        } finally {
            setIsLoading(false);
        }
    };

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
