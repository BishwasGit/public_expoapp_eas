import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import apiClient from '../services/api';

export default function SessionRequestsScreen({ navigation }: any) {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        loadRequests();
    }, []);

    const loadRequests = async () => {
        try {
            setLoading(true);
            const res = await apiClient.get('/sessions');
            const allSessions = res.data.data || res.data || [];
            // Filter for PENDING status
            const pending = allSessions.filter((s: any) => s.status === 'PENDING');
            setRequests(pending);
        } catch (error) {
            console.error('Failed to load requests:', error);
            Alert.alert('Error', 'Failed to load session requests');
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id: string, action: 'accept' | 'reject') => {
        try {
            setProcessingId(id);
            await apiClient.post(`/sessions/${id}/${action}`);
            Alert.alert('Success', `Session ${action}ed successfully`);
            loadRequests(); // Refresh list
        } catch (error: any) {
            console.error(`Failed to ${action} session:`, error);
            Alert.alert('Error', error.response?.data?.message || `Failed to ${action} session`);
        } finally {
            setProcessingId(null);
        }
    };

    const renderItem = ({ item }: { item: any }) => {
        const sessionDate = new Date(item.startTime || item.requestedTime);
        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.patientName}>{item.patient?.alias || 'Unknown Patient'}</Text>
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>PENDING</Text>
                    </View>
                </View>

                <View style={styles.details}>
                    <Text style={styles.detailText}>📅 {sessionDate.toLocaleDateString()}</Text>
                    <Text style={styles.detailText}>
                        🕐 {sessionDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                    <Text style={styles.detailText}>Service: {item.service?.name || 'General Session'}</Text>
                    {item.notes && <Text style={styles.notes}>"{item.notes}"</Text>}
                </View>

                <View style={styles.actions}>
                    <TouchableOpacity
                        style={[styles.button, styles.rejectButton]}
                        onPress={() => handleAction(item.id, 'reject')}
                        disabled={!!processingId}
                    >
                        {processingId === item.id ? (
                            <ActivityIndicator color="#ef4444" />
                        ) : (
                            <Text style={styles.rejectText}>Reject</Text>
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.button, styles.acceptButton]}
                        onPress={() => handleAction(item.id, 'accept')}
                        disabled={!!processingId}
                    >
                        {processingId === item.id ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={styles.acceptText}>Accept</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#7c3aed" />
                <Text style={styles.loadingText}>Loading requests...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#7c3aed" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Session Requests</Text>
                <View style={{ width: 60 }} />
            </View>

            <FlatList
                data={requests}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={loadRequests} />}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyIcon}>📭</Text>
                        <Text style={styles.emptyText}>No pending requests</Text>
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
        backgroundColor: '#7c3aed',
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    patientName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
    },
    badge: {
        backgroundColor: '#ffedd5',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    badgeText: {
        color: '#9a3412',
        fontSize: 12,
        fontWeight: 'bold',
    },
    details: {
        marginBottom: 16,
    },
    detailText: {
        color: '#4b5563',
        fontSize: 14,
        marginBottom: 4,
    },
    notes: {
        fontStyle: 'italic',
        color: '#6b7280',
        marginTop: 8,
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
    },
    button: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rejectButton: {
        backgroundColor: '#fee2e2',
        borderWidth: 1,
        borderColor: '#fecaca',
    },
    acceptButton: {
        backgroundColor: '#22c55e',
    },
    rejectText: {
        color: '#ef4444',
        fontWeight: '600',
    },
    acceptText: {
        color: 'white',
        fontWeight: '600',
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
