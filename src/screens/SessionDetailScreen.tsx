import React, { useContext, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import apiClient from '../services/api';

export default function SessionDetailScreen({ route, navigation }: any) {
    const { sessionId } = route.params;
    const { user } = useContext(AuthContext);
    const [session, setSession] = useState<any>(null);
    const [transaction, setTransaction] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSession();
    }, [sessionId]);

    const loadSession = async () => {
        try {
            const res = await apiClient.get(`/sessions/${sessionId}`);
            setSession(res.data.data || res.data);

            // Fetch transaction
            const txRes = await apiClient.get(`/wallet/transactions?referenceId=${sessionId}`);
            const transactions = txRes.data.data || txRes.data;
            if (transactions && transactions.length > 0) {
                setTransaction(transactions[0]);
            }
        } catch (error) {
            console.error('Failed to load session:', error);
            Alert.alert('Error', 'Failed to load session details');
        } finally {
            setLoading(false);
        }
    };

    const startSession = async () => {
        try {
            if (session.status !== 'LIVE') {
                await apiClient.patch(`/sessions/${sessionId}/status`, { status: 'LIVE' });
            }
            navigation.navigate('Session', { sessionId });
        } catch (error) {
            console.error('Failed to start session:', error);
            // Navigate anyway
            navigation.navigate('Session', { sessionId });
        }
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

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#7c3aed" />
                <Text style={styles.loadingText}>Loading session...</Text>
            </View>
        );
    }

    if (!session) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.errorText}>Session not found</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backLink}>
                    <Text style={styles.backLinkText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const sessionDate = new Date(session.startTime);
    const endDate = new Date(session.endTime);
    const isPsychologist = user?.role === 'PSYCHOLOGIST';
    const canStart = ['SCHEDULED', 'LIVE'].includes(session.status);
    const isLive = session.status === 'LIVE';

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#7c3aed" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Session Details</Text>
                <View style={{ width: 60 }} />
            </View>

            <ScrollView style={styles.content}>
                {/* Status Badge */}
                <View style={styles.statusContainer}>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(session.status) }]}>
                        <Text style={styles.statusText}>{session.status}</Text>
                    </View>
                </View>

                {/* Participant Info */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>
                        {isPsychologist ? 'Patient' : 'Psychologist'}
                    </Text>
                    <Text style={styles.participantName}>
                        {isPsychologist
                            ? (session.patient?.alias || 'Patient')
                            : (session.psychologist?.alias || 'Psychologist')
                        }
                    </Text>
                </View>

                {/* Session Info */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Session Information</Text>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>📅 Date</Text>
                        <Text style={styles.infoValue}>{sessionDate.toLocaleDateString()}</Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>🕐 Time</Text>
                        <Text style={styles.infoValue}>
                            {sessionDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                            {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>⏱️ Duration</Text>
                        <Text style={styles.infoValue}>{session.duration} minutes</Text>
                    </View>

                    {session.service?.name && (
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>💼 Service</Text>
                            <Text style={styles.infoValue}>{session.service.name}</Text>
                        </View>
                    )}

                    {session.price && (
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>💰 Price</Text>
                            <Text style={styles.infoValue}>${session.price}</Text>
                        </View>
                    )}
                </View>

                {/* Billing Breakdown (New) */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Billing Breakdown</Text>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Base Price</Text>
                        <Text style={styles.infoValue}>${session.price || 0}</Text>
                    </View>
                    {transaction ? (
                        <>
                            {Math.max(0, (session.price || 0) - Math.abs(transaction.amount)) > 0.01 && (
                                <View style={styles.infoRow}>
                                    <Text style={[styles.infoLabel, { color: '#16a34a' }]}>Discount / Demo</Text>
                                    <Text style={[styles.infoValue, { color: '#16a34a' }]}>
                                        -${(Math.max(0, (session.price || 0) - Math.abs(transaction.amount))).toFixed(2)}
                                    </Text>
                                </View>
                            )}
                            <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                                <Text style={[styles.infoLabel, { fontWeight: 'bold', color: '#111827' }]}>Total Paid</Text>
                                <Text style={[styles.infoValue, { fontWeight: 'bold', color: '#16a34a' }]}>
                                    ${Math.abs(transaction.amount).toFixed(2)}
                                </Text>
                            </View>
                        </>
                    ) : (
                        <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                            <Text style={styles.infoLabel}>Status</Text>
                            <Text style={[styles.infoValue, { color: '#f97316' }]}>Pending / Unbilled</Text>
                        </View>
                    )}
                </View>

                {/* Notes */}
                {session.notes && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Notes</Text>
                        <Text style={styles.notesText}>{session.notes}</Text>
                    </View>
                )}

                {/* Action Button */}
                {canStart && (
                    <TouchableOpacity
                        style={[styles.actionButton, isLive && styles.liveButton]}
                        onPress={startSession}
                    >
                        <Text style={styles.actionButtonText}>
                            {isLive ? '🎥 Join Session' : '▶️ Start Session'}
                        </Text>
                    </TouchableOpacity>
                )}

                {session.status === 'COMPLETED' && (
                    <View style={styles.completedBanner}>
                        <Text style={styles.completedText}>✅ This session has been completed</Text>
                    </View>
                )}

                {session.status === 'CANCELLED' && (
                    <View style={styles.cancelledBanner}>
                        <Text style={styles.cancelledText}>❌ This session was cancelled</Text>
                    </View>
                )}

                <View style={{ height: 32 }} />
            </ScrollView>
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
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f9fafb',
    },
    loadingText: {
        color: '#6b7280',
        marginTop: 16,
    },
    errorText: {
        color: '#ef4444',
        fontSize: 16,
    },
    backLink: {
        marginTop: 16,
    },
    backLinkText: {
        color: '#7c3aed',
        fontSize: 16,
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
    },
    headerTitle: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
    },
    content: {
        padding: 16,
    },
    statusContainer: {
        alignItems: 'center',
        marginBottom: 16,
    },
    statusBadge: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
    },
    statusText: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
    },
    card: {
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    cardTitle: {
        fontSize: 12,
        color: '#6b7280',
        fontWeight: '600',
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    participantName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    infoLabel: {
        color: '#6b7280',
        fontSize: 14,
    },
    infoValue: {
        color: '#111827',
        fontSize: 14,
        fontWeight: '500',
    },
    notesText: {
        color: '#374151',
        fontSize: 14,
        lineHeight: 20,
    },
    actionButton: {
        backgroundColor: '#7c3aed',
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
    },
    liveButton: {
        backgroundColor: '#16a34a',
    },
    actionButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    completedBanner: {
        backgroundColor: '#d1fae5',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
    },
    completedText: {
        color: '#065f46',
        fontSize: 14,
        fontWeight: '500',
    },
    cancelledBanner: {
        backgroundColor: '#fee2e2',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
    },
    cancelledText: {
        color: '#991b1b',
        fontSize: 14,
        fontWeight: '500',
    },
});
