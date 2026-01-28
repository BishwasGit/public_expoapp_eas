import React, { useContext, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import apiClient from '../services/api';

export default function MessagesScreen({ navigation }: any) {
    const { user } = useContext(AuthContext);
    const [conversations, setConversations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadConversations();
    }, []);

    const loadConversations = async () => {
        try {
            const res = await apiClient.get('/messages/conversations');
            setConversations(res.data.data || res.data || []);
        } catch (error) {
            console.error('Failed to load conversations:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadConversations();
    };

    const handlePress = (otherUser: any) => {
        navigation.navigate('Chat', {
            otherUserId: otherUser.id,
            otherUserName: otherUser.alias || 'User',
        });
    };

    const renderItem = ({ item }: { item: any }) => {
        // item structure depends on backend. Usually it returns the last message + other user details
        // Assuming backend returns { otherUser: { id, alias... }, lastMessage: { content, createdAt } }
        // Let's inspect backend logic if possible, or assume standard structure.
        // If backend returns raw list of users or conversations, I'll adapt.
        // Based on typical implementation:
        const otherUser = item.otherUser || {};
        const lastMessage = item.lastMessage || {};

        return (
            <TouchableOpacity style={styles.card} onPress={() => handlePress(otherUser)}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{(otherUser.alias?.[0] || '?').toUpperCase()}</Text>
                </View>
                <View style={styles.content}>
                    <View style={styles.headerRow}>
                        <Text style={styles.name}>{otherUser.alias || 'Unknown'}</Text>
                        <Text style={styles.time}>
                            {lastMessage.createdAt ? new Date(lastMessage.createdAt).toLocaleDateString() : ''}
                        </Text>
                    </View>
                    <Text style={styles.preview} numberOfLines={1}>
                        {lastMessage.content || 'Start a conversation'}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2563eb" />
                <Text style={styles.loadingText}>Loading messages...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#2563eb" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Messages</Text>
                <View style={{ width: 60 }} />
            </View>

            <FlatList
                data={conversations}
                renderItem={renderItem}
                keyExtractor={(item, index) => item.otherUser?.id || index.toString()}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyIcon}>💬</Text>
                        <Text style={styles.emptyText}>No messages yet</Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    header: {
        backgroundColor: '#2563eb',
        paddingTop: 48,
        paddingBottom: 16,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButton: {
        padding: 8,
    },
    backText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '500',
    },
    headerTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        marginTop: 12,
        color: '#6b7280',
    },
    list: {
        padding: 16,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#dbeafe',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    avatarText: {
        color: '#2563eb',
        fontSize: 20,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    name: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
    },
    time: {
        fontSize: 12,
        color: '#6b7280',
    },
    preview: {
        color: '#6b7280',
        fontSize: 14,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 64,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: 16,
    },
    emptyText: {
        color: '#6b7280',
        fontSize: 16,
    },
});
