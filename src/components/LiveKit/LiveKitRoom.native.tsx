import {
    registerGlobals,
    useRoom,
    VideoView
} from '@livekit/react-native';
import {
    Room
} from 'livekit-client';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

// Register LiveKit globals
registerGlobals();

interface LiveKitRoomProps {
    token: string;
    url: string;
    onDisconnect: () => void;
    sessionId: string;
}

export default function LiveKitRoom({ token, url, onDisconnect, sessionId }: LiveKitRoomProps) {
    const [room] = useState(() => new Room({
        adaptiveStream: false,
        dynacast: false,
        publishDefaults: {
            // @ts-ignore - RED option exists in internal SDK
            audio: { red: false, echoCancellation: true, noiseSuppression: true }
        }
    }));
    const { participants } = useRoom(room);
    const [isConnected, setIsConnected] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [debugLogs, setDebugLogs] = useState<string[]>([]);

    const addLog = (msg: string) => {
        console.log(msg);
        setDebugLogs(prev => [msg, ...prev].slice(0, 3));
    };

    // Chat State
    const [isChatVisible, setIsChatVisible] = useState(false);
    const [messages, setMessages] = useState<{ sender: string; text: string; time: Date }[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        connectToRoom(url, token);

        // Chat Listener
        const handleDataReceived = (payload: Uint8Array, participant?: any, kind?: any, topic?: any) => {
            const senderId = participant?.identity || 'unknown';
            addLog(`Rx ${payload.byteLength}b from ${senderId}`);

            try {
                let jsonString = '';
                const charCodes = [];
                for (let i = 0; i < payload.length; i++) {
                    charCodes.push(payload[i]);
                }
                jsonString = String.fromCharCode.apply(null, charCodes);

                addLog(`Str: ${jsonString.substring(0, 30)}...`);

                try {
                    const data = JSON.parse(jsonString);
                    if (data.type === 'chat') {
                        setMessages((prev) => [...prev, {
                            sender: data.sender || 'Remote',
                            text: data.text,
                            time: new Date()
                        }]);
                        setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
                    } else {
                        addLog(`Rx Unknown Type: ${data.type}`);
                    }
                } catch (jsonErr) {
                    addLog(`JSON Fail`);
                }
            } catch (e) {
                addLog('Fatal decode error');
            }
        };

        room.on('dataReceived', handleDataReceived);

        return () => {
            room.off('dataReceived', handleDataReceived);
            room.disconnect();
        };
    }, []);

    const connectToRoom = async (wsUrl: string, apiToken: string) => {
        try {
            await room.connect(wsUrl, apiToken);
            setIsConnected(true);
            await room.localParticipant.setCameraEnabled(true);
            // await room.localParticipant.setMicrophoneEnabled(true); 
        } catch (error) {
            console.error('Failed to connect:', error);
            Alert.alert('Error', 'Failed to connect to LiveKit');
            onDisconnect();
        }
    };

    const toggleMic = () => {
        const enabled = !isMuted;
        room.localParticipant.setMicrophoneEnabled(enabled);
        setIsMuted(!enabled);
    };

    const toggleCamera = () => {
        const enabled = !isVideoEnabled;
        room.localParticipant.setCameraEnabled(enabled);
        setIsVideoEnabled(enabled);
    };

    const sendMessage = async () => {
        if (!newMessage.trim()) return;

        const msgData = {
            type: 'chat',
            sender: room.localParticipant.identity || 'Me',
            text: newMessage.trim()
        };

        try {
            const strData = JSON.stringify(msgData);
            let payload: Uint8Array;

            if (typeof TextEncoder !== 'undefined') {
                payload = new TextEncoder().encode(strData);
            } else {
                payload = new Uint8Array(strData.length);
                for (let i = 0; i < strData.length; i++) {
                    payload[i] = strData.charCodeAt(i);
                }
            }

            await room.localParticipant.publishData(payload, {
                reliable: true,
            });

            setMessages((prev) => [...prev, {
                sender: 'Me',
                text: newMessage.trim(),
                time: new Date()
            }]);
            setNewMessage('');
            setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
        } catch (error) {
            console.error('Failed to send message:', error);
            Alert.alert('Error', 'Could not send message');
        }
    };

    const renderParticipant = (participant: any) => {
        const videoTrackPub = Array.from(participant.videoTrackPublications.values())
            .find((pub: any) => pub.track) as any;

        if (videoTrackPub && videoTrackPub.track) {
            return (
                <View key={participant.identity} style={styles.participantView}>
                    <VideoView
                        style={styles.video}
                        videoTrack={videoTrackPub.track}
                        zOrder={participant === room.localParticipant ? 1 : 0}
                    />
                    <View style={styles.participantLabel}>
                        <Text style={styles.participantName}>{participant.identity}</Text>
                    </View>
                </View>
            );
        }

        return (
            <View key={participant.identity} style={styles.participantView}>
                <View style={[styles.video, styles.placeholder]}>
                    <Text style={styles.placeholderText}>
                        {participant.identity?.charAt(0) || '?'}
                    </Text>
                </View>
            </View>
        );
    };

    const renderChatMessage = ({ item }: { item: { sender: string; text: string; time: Date } }) => {
        const isMe = item.sender === 'Me';
        return (
            <View style={[styles.messageBubble, isMe ? styles.myMessage : styles.theirMessage]}>
                <Text style={[styles.messageSender, isMe ? styles.myMessageText : styles.theirMessageText]}>
                    {item.sender}
                </Text>
                <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.theirMessageText]}>
                    {item.text}
                </Text>
            </View>
        );
    };

    if (!isConnected) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#7c3aed" />
                <Text style={styles.loadingText}>Connecting to session...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.grid}>
                {participants.map(renderParticipant)}
            </View>

            <View style={styles.controls}>
                <TouchableOpacity onPress={toggleMic} style={[styles.controlBtn, isMuted && styles.controlBtnActive]}>
                    <Text style={[styles.controlText, isMuted && styles.controlTextActive]}>{isMuted ? 'Unmute' : 'Mute'}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={toggleCamera} style={[styles.controlBtn, !isVideoEnabled && styles.controlBtnActive]}>
                    <Text style={[styles.controlText, !isVideoEnabled && styles.controlTextActive]}>{isVideoEnabled ? 'Stop Video' : 'Start Video'}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setIsChatVisible(true)} style={styles.controlBtn}>
                    <Text style={styles.controlText}>Chat</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={onDisconnect} style={[styles.controlBtn, styles.leaveBtn]}>
                    <Text style={styles.controlText}>End</Text>
                </TouchableOpacity>
            </View>

            {/* Debug Logs */}
            <View style={{ position: 'absolute', top: 40, left: 10, right: 10, pointerEvents: 'none' }}>
                {debugLogs.map((log, i) => (
                    <Text key={i} style={{ color: 'yellow', fontSize: 10, textShadowColor: 'black', textShadowRadius: 2 }}>
                        {log}
                    </Text>
                ))}
            </View>

            {/* Chat Modal */}
            <Modal
                visible={isChatVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsChatVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalContainer}
                >
                    <View style={styles.chatContainer}>
                        <View style={styles.chatHeader}>
                            <Text style={styles.chatTitle}>Session Chat</Text>
                            <TouchableOpacity onPress={() => setIsChatVisible(false)} style={styles.closeButton}>
                                <Text style={styles.closeButtonText}>Close</Text>
                            </TouchableOpacity>
                        </View>

                        <FlatList
                            ref={flatListRef}
                            data={messages}
                            renderItem={renderChatMessage}
                            keyExtractor={(item, index) => index.toString()}
                            contentContainerStyle={styles.chatList}
                        />

                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                value={newMessage}
                                onChangeText={setNewMessage}
                                placeholder="Type a message..."
                                placeholderTextColor="#9ca3af"
                            />
                            <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
                                <Text style={styles.sendButtonText}>Send</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#111827',
    },
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
    grid: {
        flex: 1,
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignContent: 'center',
        padding: 4,
    },
    participantView: {
        width: '48%',
        aspectRatio: 3 / 4,
        margin: '1%',
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#1f2937',
    },
    video: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    placeholder: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    placeholderText: {
        color: 'white',
        fontSize: 48,
        fontWeight: 'bold',
    },
    participantLabel: {
        position: 'absolute',
        bottom: 8,
        left: 8,
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    participantName: {
        color: 'white',
        fontSize: 12,
    },
    controls: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        paddingVertical: 24,
        paddingBottom: 48,
    },
    controlBtn: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        padding: 16,
        borderRadius: 32,
        minWidth: 80,
        alignItems: 'center',
        justifyContent: 'center',
    },
    controlBtnActive: {
        backgroundColor: 'white',
    },
    leaveBtn: {
        backgroundColor: '#ef4444',
    },
    controlText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 12,
        textAlign: 'center',
    },
    controlTextActive: {
        color: '#111827',
    },

    // Chat Styles
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    chatContainer: {
        backgroundColor: 'white',
        height: '60%',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        overflow: 'hidden',
    },
    chatHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    chatTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
    },
    closeButton: {
        padding: 8,
    },
    closeButtonText: {
        color: '#6b7280',
        fontSize: 14,
    },
    chatList: {
        padding: 16,
    },
    messageBubble: {
        maxWidth: '80%',
        padding: 12,
        borderRadius: 12,
        marginBottom: 8,
    },
    myMessage: {
        alignSelf: 'flex-end',
        backgroundColor: '#7c3aed',
    },
    theirMessage: {
        alignSelf: 'flex-start',
        backgroundColor: '#f3f4f6',
    },
    messageSender: {
        fontSize: 10,
        marginBottom: 4,
        opacity: 0.8,
    },
    messageText: {
        fontSize: 14,
    },
    myMessageText: {
        color: 'white',
    },
    theirMessageText: {
        color: '#111827',
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        backgroundColor: '#f3f4f6',
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 10,
        marginRight: 8,
        color: '#111827',
    },
    sendButton: {
        backgroundColor: '#7c3aed',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 24,
    },
    sendButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
});
