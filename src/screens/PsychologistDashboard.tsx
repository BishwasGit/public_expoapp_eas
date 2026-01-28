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

export default function PsychologistDashboard({ navigation }: any) {
    const { user, logout } = useContext(AuthContext);
    const [stats, setStats] = useState<any>({
        totalEarnings: 0,
        monthlyEarnings: 0,
        totalSessions: 0,
        pendingRequests: 0,
        patientCount: 0,
    });
    const [wallet, setWallet] = useState<any>({ balance: 0 });
    const [sessions, setSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [status, setStatus] = useState<'AVAILABLE' | 'BUSY' | 'OFFLINE'>('AVAILABLE');

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
                const mySessions = Array.isArray(sessionsData)
                    ? sessionsData.filter((s: any) => s.psychologistId === user?.id)
                    : [];
                setSessions(mySessions);

                // Calculate pending requests, unique patients, and earnings
                const pending = mySessions.filter((s: any) => s.status === 'PENDING').length;
                const uniquePatients = new Set(mySessions.map((s: any) => s.patientId).filter(Boolean));

                // Calculate earnings
                const completedSessions = mySessions.filter((s: any) => ['COMPLETED', 'SCHEDULED', 'LIVE'].includes(s.status));
                const totalEarnings = completedSessions.reduce((sum: number, s: any) => sum + ((s.price || 0) * 0.9), 0);

                const now = new Date();
                const thisMonthSessions = completedSessions.filter((s: any) => {
                    const sessionDate = new Date(s.startTime);
                    return sessionDate.getMonth() === now.getMonth() && sessionDate.getFullYear() === now.getFullYear();
                });
                const monthlyEarnings = thisMonthSessions.reduce((sum: number, s: any) => sum + ((s.price || 0) * 0.9), 0);

                setStats((prev: any) => ({
                    ...prev,
                    totalSessions: mySessions.length,
                    pendingRequests: pending,
                    patientCount: uniquePatients.size,
                    totalEarnings,
                    monthlyEarnings,
                }));
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

    const updateStatus = async (newStatus: 'AVAILABLE' | 'BUSY' | 'OFFLINE') => {
        setStatus(newStatus);
        try {
            await apiClient.patch('/psychologist/status', { status: newStatus });
        } catch (e) {
            console.warn('Status update failed');
        }
    };

    const startSession = async (sessionId: string, currentStatus: string) => {
        console.log('Starting session:', sessionId, currentStatus);
        try {
            // If session is not yet LIVE, start it
            if (currentStatus !== 'LIVE') {
                console.log('Updating status to LIVE');
                await apiClient.patch(`/sessions/${sessionId}/status`, { status: 'LIVE' });
            }
            // Navigate to session
            console.log('Navigating to Session screen');
            navigation.navigate('Session', { sessionId });
        } catch (error) {
            console.error('Failed to start session:', error);
            // Navigate anyway in case backend is down
            navigation.navigate('Session', { sessionId });
        }
    };

    const todaySessions = sessions.filter((s) => {
        const sessionDate = new Date(s.startTime).toDateString();
        const today = new Date().toDateString();
        return sessionDate === today && (s.status === 'SCHEDULED' || s.status === 'LIVE');
    });

    const pendingRequests = sessions.filter((s) => s.status === 'PENDING');

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#7c3aed" />
                <Text style={styles.loadingText}>Loading dashboard...</Text>
            </View>
        );
    }

    const getStatusStyle = (s: string) => {
        if (status === s) {
            if (s === 'AVAILABLE') return styles.statusActive;
            if (s === 'BUSY') return styles.statusBusy;
            return styles.statusOffline;
        }
        return styles.statusInactive;
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#7c3aed" />
            <ScrollView
                style={styles.scrollView}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#7c3aed']} />
                }
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerContent}>
                        <View>
                            <Text style={styles.welcomeText}>Welcome back</Text>
                            <Text style={styles.userName}>Dr. {user?.alias}</Text>
                        </View>
                        <TouchableOpacity onPress={logout} style={styles.logoutButton}>
                            <Text style={styles.logoutText}>Logout</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Status Selector */}
                    <View style={styles.statusSection}>
                        <Text style={styles.statusLabel}>Your Status</Text>
                        <View style={styles.statusRow}>
                            {(['AVAILABLE', 'BUSY', 'OFFLINE'] as const).map((s) => (
                                <TouchableOpacity
                                    key={s}
                                    onPress={() => updateStatus(s)}
                                    style={[styles.statusButton, getStatusStyle(s)]}
                                >
                                    <Text style={styles.statusText}>{s}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Earnings Card */}
                    <View style={styles.earningsCard}>
                        <Text style={styles.earningsLabel}>Total Earnings</Text>
                        <Text style={styles.earningsValue}>
                            ${stats.totalEarnings.toFixed(2)}
                        </Text>
                        <Text style={styles.earningsSubtext}>
                            ${stats.monthlyEarnings.toFixed(2)} this month
                        </Text>
                    </View>

                    {/* Wallet Card */}
                    <View style={styles.walletCard}>
                        <View style={styles.walletRow}>
                            <View>
                                <Text style={styles.walletLabel}>Wallet Balance</Text>
                                <Text style={styles.walletValue}>${wallet.balance?.toFixed(2) || '0.00'}</Text>
                            </View>
                            <View style={styles.patientsBadge}>
                                <Text style={styles.patientsValue}>{stats.patientCount}</Text>
                                <Text style={styles.patientsLabel}>Patients</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Stats Row */}
                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <Text style={[styles.statValue, { color: '#7c3aed' }]}>{todaySessions.length}</Text>
                        <Text style={styles.statLabel}>Today</Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('SessionRequests')}
                        style={styles.statCard}
                    >
                        <Text style={[styles.statValue, { color: '#f97316' }]}>{pendingRequests.length}</Text>
                        <Text style={styles.statLabel}>Pending</Text>
                    </TouchableOpacity>
                    <View style={styles.statCard}>
                        <Text style={[styles.statValue, { color: '#16a34a' }]}>{sessions.length}</Text>
                        <Text style={styles.statLabel}>Total</Text>
                    </View>
                </View>

                {/* Quick Actions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>

                    <TouchableOpacity
                        onPress={() => navigation.navigate('MySessions')}
                        style={[styles.actionCard, { backgroundColor: '#7c3aed' }]}
                    >
                        <Text style={styles.actionTitle}>📅 My Sessions</Text>
                        <Text style={styles.actionDescription}>Manage your appointments</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => navigation.navigate('CreateSession')}
                        style={[styles.actionCard, { backgroundColor: '#db2777' }]}
                    >
                        <Text style={styles.actionTitle}>➕ Create Session</Text>
                        <Text style={styles.actionDescription}>Schedule new availability</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => navigation.navigate('SessionRequests')}
                        style={[styles.actionCard, { backgroundColor: '#f97316' }]}
                    >
                        <Text style={styles.actionTitle}>📋 Session Requests</Text>
                        <Text style={styles.actionDescription}>
                            {pendingRequests.length} pending requests
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => navigation.navigate('MyServices')}
                        style={[styles.actionCard, { backgroundColor: '#4f46e5' }]}
                    >
                        <Text style={styles.actionTitle}>💼 My Services</Text>
                        <Text style={styles.actionDescription}>Manage your services and pricing</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => navigation.navigate('Earnings')}
                        style={[styles.actionCard, { backgroundColor: '#16a34a' }]}
                    >
                        <Text style={styles.actionTitle}>💰 Earnings</Text>
                        <Text style={styles.actionDescription}>View your earnings and payouts</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => navigation.navigate('Messages')}
                        style={[styles.actionCard, { backgroundColor: '#8b5cf6' }]}
                    >
                        <Text style={styles.actionTitle}>💬 Messages</Text>
                        <Text style={styles.actionDescription}>Chat with your patients</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => navigation.navigate('MyProfile')}
                        style={[styles.actionCard, { backgroundColor: '#0ea5e9' }]}
                    >
                        <Text style={styles.actionTitle}>👤 My Profile</Text>
                        <Text style={styles.actionDescription}>Edit your profile and bio</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => navigation.navigate('Gallery')}
                        style={[styles.actionCard, { backgroundColor: '#ec4899' }]}
                    >
                        <Text style={styles.actionTitle}>🖼️ My Gallery</Text>
                        <Text style={styles.actionDescription}>Manage photos and videos</Text>
                    </TouchableOpacity>
                </View>

                {/* Today's Sessions */}
                <View style={[styles.section, { marginBottom: 32 }]}>
                    <Text style={styles.sectionTitle}>Today's Sessions</Text>

                    {todaySessions.length > 0 ? (
                        todaySessions.map((session: any) => (
                            <View key={session.id} style={styles.sessionCard}>
                                <View style={styles.sessionContent}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.sessionPatient}>
                                            {session.patient?.alias || 'Patient'}
                                        </Text>
                                        <Text style={styles.sessionTime}>
                                            {new Date(session.startTime).toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </Text>
                                    </View>
                                    <View style={styles.durationTag}>
                                        <Text style={styles.durationText}>{session.duration} min</Text>
                                    </View>
                                </View>
                                <TouchableOpacity
                                    style={[styles.joinButton, session.status === 'LIVE' && styles.liveButton]}
                                    onPress={() => startSession(session.id, session.status)}
                                >
                                    <Text style={styles.joinButtonText}>
                                        {session.status === 'LIVE' ? 'Join Session' : 'Start Session'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        ))
                    ) : (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyIcon}>📅</Text>
                            <Text style={styles.emptyText}>No sessions scheduled for today</Text>
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
        backgroundColor: '#7c3aed',
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
        color: '#c4b5fd',
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
    statusSection: {
        marginTop: 24,
    },
    statusLabel: {
        color: '#c4b5fd',
        fontSize: 14,
        marginBottom: 8,
    },
    statusRow: {
        flexDirection: 'row',
        gap: 8,
    },
    statusButton: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        alignItems: 'center',
    },
    statusActive: {
        backgroundColor: '#22c55e',
    },
    statusBusy: {
        backgroundColor: '#f97316',
    },
    statusOffline: {
        backgroundColor: '#6b7280',
    },
    statusInactive: {
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    statusText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '500',
    },
    earningsCard: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        marginTop: 24,
        padding: 16,
        borderRadius: 16,
    },
    earningsLabel: {
        color: '#c4b5fd',
        fontSize: 14,
    },
    earningsValue: {
        color: 'white',
        fontSize: 32,
        fontWeight: 'bold',
        marginTop: 4,
    },
    earningsSubtext: {
        color: '#ddd6fe',
        fontSize: 14,
        marginTop: 4,
    },
    walletCard: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        marginTop: 12,
        padding: 16,
        borderRadius: 16,
    },
    walletRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    walletLabel: {
        color: '#c4b5fd',
        fontSize: 12,
    },
    walletValue: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 2,
    },
    patientsBadge: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        alignItems: 'center',
    },
    patientsValue: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    patientsLabel: {
        color: '#e9d5ff',
        fontSize: 10,
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
    sessionPatient: {
        fontWeight: '600',
        color: '#111827',
    },
    sessionTime: {
        color: '#6b7280',
        fontSize: 14,
        marginTop: 4,
    },
    joinButton: {
        backgroundColor: '#7c3aed',
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
    liveButton: {
        backgroundColor: '#16a34a',
    },
    durationTag: {
        backgroundColor: '#f3e8ff',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 16,
    },
    durationText: {
        color: '#7c3aed',
        fontSize: 12,
        fontWeight: '500',
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
});
