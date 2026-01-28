import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface LiveKitRoomProps {
    token: string;
    url: string;
    onDisconnect: () => void;
    sessionId: string;
}

export default function LiveKitRoom({ onDisconnect }: LiveKitRoomProps) {
    useEffect(() => {
        // Log that web is being used
        console.log('LiveKitRoom Web Component Loaded');
        // We could implement web-specific logic here using livekit-client directly
        // For now, we just show a message.
    }, []);

    return (
        <View style={styles.container}>
            <Text style={styles.text}>Video Calls on Web are currently in development.</Text>
            <Text style={styles.subtext}>Please use the mobile app for video sessions.</Text>

            <TouchableOpacity onPress={onDisconnect} style={styles.button}>
                <Text style={styles.buttonText}>Close Session</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#111827',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    text: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 10,
    },
    subtext: {
        color: '#9ca3af',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 30,
    },
    button: {
        backgroundColor: '#ef4444',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 24,
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
    },
});
