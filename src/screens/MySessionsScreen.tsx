import React, { useContext, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

import { AuthContext } from '../context/AuthContext';
import apiClient from '../services/api';

export default function MySessionsScreen({ navigation }: any) {
    const { user } = useContext(AuthContext);
    const [sessions, setSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadSessions();
    }, []);

    const loadSessions = async () => {
        try {
            const res = await apiClient.get('/sessions');
            const data = res.data.data || res.data || [];
            let mySessions = [];
            if (Array.isArray(data)) {
                if (user?.role === 'PATIENT') {
                    mySessions = data.filter((s: any) => s.patientId === user.id);
                } else {
                    mySessions = data.filter((s: any) => s.psychologistId === user?.id);
                }
            }
            // Sort by startTime descending (newest first)
            mySessions.sort((a: any, b: any) =>
                new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
            );
            setSessions(mySessions);
        } catch (error) {
            console.error('Failed to load sessions:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadSessions();
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'LIVE': return '#16a34a';
            case 'SCHEDULED': return '#7c3aed';
            case 'COMPLETED': return '#6b7280';
            case 'PENDING': return '#f97316';
            case 'CANCELLED': return '#ef4444';
            default: return '#6b7280';
        }
    };

    const renderSession = ({ item }: { item: any }) => {
        const sessionDate = new Date(item.startTime);
        const isToday = sessionDate.toDateString() === new Date().toDateString();

        return (
            <TouchableOpacity
                style={styles.sessionCard}
                onPress={() => navigation.navigate('SessionDetail', { sessionId: item.id })}
            >
                <View style={styles.sessionHeader}>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                        <Text style={styles.statusText}>{item.status}</Text>
                    </View>
                    {isToday && (
                        <View style={styles.todayBadge}>
                            <Text style={styles.todayText}>Today</Text>
                        </View>
                    )}
                </View>

                <Text style={styles.patientName}>
                    {item.patient?.alias || 'Patient'}
                </Text>

                <View style={styles.sessionDetails}>
                    <Text style={styles.dateText}>
                        📅 {sessionDate.toLocaleDateString()}
                    </Text>
                    <Text style={styles.timeText}>
                        🕐 {sessionDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                    <Text style={styles.durationText}>
                        ⏱️ {item.duration} min
                    </Text>
                </View>

                {item.service?.name && (
                    <Text style={styles.serviceName}>{item.service.name}</Text>
                )}
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#7c3aed" />
                <Text style={styles.loadingText}>Loading sessions...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#7c3aed" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Sessions</Text>
                <View style={{ width: 60 }} />
            </View>

            <FlatList
                data={sessions}
                renderItem={renderSession}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#7c3aed']} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyIcon}>📅</Text>
                        <Text style={styles.emptyText}>No sessions yet</Text>
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

    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    loadingText: {
        marginTop: 12,
        color: '#6b7280',
    },

    header: {
        height: 56,
        backgroundColor: '#7c3aed',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        justifyContent: 'space-between',
    },
    backButton: {
        width: 60,
    },
    backText: {
        color: '#fff',
        fontSize: 16,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },

    listContent: {
        padding: 16,
    },

    sessionCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        elevation: 2,
    },

    sessionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },

    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
    },
    statusText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },

    todayBadge: {
        backgroundColor: '#fde68a',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 999,
    },
    todayText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#92400e',
    },

    patientName: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 6,
        color: '#111827',
    },

    sessionDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },

    dateText: {
        fontSize: 13,
        color: '#374151',
    },
    timeText: {
        fontSize: 13,
        color: '#374151',
    },
    durationText: {
        fontSize: 13,
        color: '#374151',
    },

    serviceName: {
        fontSize: 13,
        color: '#6b7280',
        marginTop: 4,
    },

    emptyState: {
        alignItems: 'center',
        marginTop: 80,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: 8,
    },
    emptyText: {
        color: '#6b7280',
        fontSize: 16,
    },
});
