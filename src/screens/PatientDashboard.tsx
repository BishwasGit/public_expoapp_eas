import React, { useContext, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import apiClient from '../services/api';

export default function PatientDashboard({ navigation }: any) {
    const { user, logout } = useContext(AuthContext);
    const [wallet, setWallet] = useState<any>({ balance: 0 });
    const [sessions, setSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            // Fetch wallet balance
            try {
                const walletRes = await apiClient.get('/wallet/balance');
                setWallet(walletRes.data.data || walletRes.data || { balance: 0 });
            } catch (e) {
                console.warn('Wallet endpoint not available');
                setWallet({ balance: 0 });
            }

            // Fetch sessions
            try {
                const sessionsRes = await apiClient.get('/sessions');
                const sessionsData = sessionsRes.data.data || sessionsRes.data || [];
                const userSessions = Array.isArray(sessionsData)
                    ? sessionsData.filter((s: any) => s.patientId === user?.id)
                    : [];
                setSessions(userSessions);
            } catch (e) {
                console.warn('Sessions fetch failed');
                setSessions([]);
            }
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const upcomingSessions = sessions.filter(
        (s) => s.status === 'LIVE' || (s.status === 'SCHEDULED' && new Date(s.endTime) > new Date())
    );
    const completedSessions = sessions.filter((s) => s.status === 'COMPLETED');

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2563eb" />
                <Text style={styles.loadingText}>Loading dashboard...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#2563eb" />
            <ScrollView
                style={styles.scrollView}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563eb']} />
                }
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerContent}>
                        <View>
                            <Text style={styles.welcomeText}>Welcome back</Text>
                            <Text style={styles.userName}>{user?.alias}</Text>
                        </View>
                        <TouchableOpacity onPress={logout} style={styles.logoutButton}>
                            <Text style={styles.logoutText}>Logout</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Wallet Balance Card */}
                    <View style={styles.walletCard}>
                        <Text style={styles.walletLabel}>Wallet Balance</Text>
                        <Text style={styles.walletBalance}>
                            ${wallet?.balance?.toFixed(2) || '0.00'}
                        </Text>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('AddFunds')}
                            style={styles.addFundsButton}
                        >
                            <Text style={styles.addFundsText}>+ Add Funds</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Stats Row */}
                <View style={styles.statsRow}>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('MySessions')}
                        style={styles.statCard}
                    >
                        <Text style={[styles.statValue, { color: '#2563eb' }]}>{upcomingSessions.length}</Text>
                        <Text style={styles.statLabel}>Upcoming</Text>
                    </TouchableOpacity>
                    <View style={styles.statCard}>
                        <Text style={[styles.statValue, { color: '#16a34a' }]}>{completedSessions.length}</Text>
                        <Text style={styles.statLabel}>Completed</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={[styles.statValue, { color: '#9333ea' }]}>{sessions.length}</Text>
                        <Text style={styles.statLabel}>Total</Text>
                    </View>
                </View>

                {/* Quick Actions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>

                    <TouchableOpacity
                        onPress={() => navigation.navigate('FindPsychologist')}
                        style={[styles.actionCard, { backgroundColor: '#2563eb' }]}
                    >
                        <Text style={styles.actionTitle}>🔍 Find Psychologist</Text>
                        <Text style={styles.actionDescription}>
                            Browse verified mental health professionals
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => navigation.navigate('MySessions')}
                        style={[styles.actionCard, { backgroundColor: '#16a34a' }]}
                    >
                        <Text style={styles.actionTitle}>📅 My Sessions</Text>
                        <Text style={styles.actionDescription}>
                            View and manage your appointments
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => navigation.navigate('Messages')}
                        style={[styles.actionCard, { backgroundColor: '#9333ea' }]}
                    >
                        <Text style={styles.actionTitle}>💬 Messages</Text>
                        <Text style={styles.actionDescription}>
                            Chat with your psychologist
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Upcoming Sessions */}
                <View style={[styles.section, { marginBottom: 32 }]}>
                    <Text style={styles.sectionTitle}>Upcoming Sessions</Text>

                    {upcomingSessions.length > 0 ? (
                        upcomingSessions.slice(0, 3).map((session: any) => (
                            <View key={session.id} style={styles.sessionCard}>
                                <View style={styles.sessionContent}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.sessionDoctor}>
                                            {session.psychologist?.alias || 'Psychologist'}
                                        </Text>
                                        <Text style={styles.sessionTime}>
                                            {new Date(session.startTime).toLocaleDateString()} at{' '}
                                            {new Date(session.startTime).toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </Text>
                                    </View>
                                    <View style={styles.priceTag}>
                                        <Text style={styles.priceText}>${session.price}</Text>
                                    </View>
                                </View>
                                <TouchableOpacity
                                    style={styles.joinButton}
                                    onPress={() => navigation.navigate('Session', { sessionId: session.id })}
                                >
                                    <Text style={styles.joinButtonText}>Join Session</Text>
                                </TouchableOpacity>
                            </View>
                        ))
                    ) : (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyIcon}>📅</Text>
                            <Text style={styles.emptyText}>No upcoming sessions</Text>
                            <TouchableOpacity
                                onPress={() => navigation.navigate('FindPsychologist')}
                            >
                                <Text style={styles.emptyLink}>Find a psychologist</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    scrollView: {
        flex: 1,
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
    header: {
        backgroundColor: '#2563eb',
        paddingHorizontal: 24,
        paddingTop: 56,
        paddingBottom: 32,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    welcomeText: {
        color: '#bfdbfe',
        fontSize: 14,
    },
    userName: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
    },
    logoutButton: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    logoutText: {
        color: 'white',
        fontWeight: '500',
    },
    walletCard: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        marginTop: 24,
        padding: 16,
        borderRadius: 16,
    },
    walletLabel: {
        color: '#bfdbfe',
        fontSize: 14,
    },
    walletBalance: {
        color: 'white',
        fontSize: 32,
        fontWeight: 'bold',
        marginTop: 4,
    },
    addFundsButton: {
        backgroundColor: 'white',
        marginTop: 12,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    addFundsText: {
        color: '#2563eb',
        fontWeight: '600',
    },
    statsRow: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        marginTop: 24,
        gap: 12,
    },
    statCard: {
        flex: 1,
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    statValue: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    statLabel: {
        color: '#6b7280',
        fontSize: 12,
        marginTop: 4,
    },
    section: {
        paddingHorizontal: 24,
        marginTop: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 16,
    },
    actionCard: {
        padding: 20,
        borderRadius: 12,
        marginBottom: 12,
    },
    actionTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    actionDescription: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        marginTop: 4,
    },
    sessionCard: {
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#f3f4f6',
    },
    sessionContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    sessionDoctor: {
        fontWeight: '600',
        color: '#111827',
    },
    sessionTime: {
        color: '#6b7280',
        fontSize: 14,
        marginTop: 4,
    },
    priceTag: {
        backgroundColor: '#dbeafe',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 16,
    },
    priceText: {
        color: '#2563eb',
        fontSize: 12,
        fontWeight: '500',
    },
    joinButton: {
        backgroundColor: '#2563eb',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 12,
    },
    joinButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
    emptyState: {
        backgroundColor: 'white',
        padding: 24,
        borderRadius: 12,
        alignItems: 'center',
    },
    emptyIcon: {
        fontSize: 40,
        marginBottom: 8,
    },
    emptyText: {
        color: '#6b7280',
        textAlign: 'center',
    },
    emptyLink: {
        color: '#2563eb',
        fontWeight: '600',
        marginTop: 12,
    },
});
