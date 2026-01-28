import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import apiClient from '../services/api';

interface Service {
    id: string;
    name: string;
    description: string;
    price: number;
    duration: number;
    isEnabled: boolean;
}

interface Psychologist {
    id: string;
    alias: string;
    bio?: string;
    specialties?: string[];
    languages?: string[];
    education?: string;
    experience?: number;
    isVerified: boolean;
    status?: string;
    hourlyRate?: number;
    services?: Service[];
    profileImage?: string;
}

export default function PsychologistProfileScreen({ route, navigation }: any) {
    const { psychologistId } = route.params;
    const [psychologist, setPsychologist] = useState<Psychologist | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [availableSessions, setAvailableSessions] = useState<any[]>([]);
    const [sessionsLoading, setSessionsLoading] = useState(false);

    useEffect(() => {
        loadPsychologist();
        loadAvailableSessions();
    }, [psychologistId]);

    const loadPsychologist = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await apiClient.get(`/profile/psychologists/${psychologistId}`);
            const data = res.data.data || res.data;
            setPsychologist(data);
        } catch (err) {
            console.error('Failed to load psychologist profile:', err);
            setError('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const loadAvailableSessions = async () => {
        try {
            setSessionsLoading(true);
            const res = await apiClient.get(`/sessions/available/${psychologistId}`);
            const data = res.data.data || res.data || [];
            setAvailableSessions(data);
        } catch (err) {
            console.warn('Failed to load available sessions:', err);
        } finally {
            setSessionsLoading(false);
        }
    };

    const getStatusColor = (status?: string) => {
        switch (status) {
            case 'ONLINE':
            case 'AVAILABLE':
                return '#22c55e';
            case 'AWAY':
                return '#eab308';
            case 'BUSY':
                return '#f97316';
            case 'OFFLINE':
            default:
                return '#6b7280';
        }
    };

    const getStatusLabel = (status?: string) => {
        switch (status) {
            case 'ONLINE':
            case 'AVAILABLE':
                return 'Available';
            case 'AWAY':
                return 'Away';
            case 'BUSY':
                return 'Busy';
            case 'OFFLINE':
            default:
                return 'Offline';
        }
    };

    const handleRequestService = (service?: Service) => {
        navigation.navigate('BookSession', {
            psychologistId,
            serviceId: service?.id,
            serviceName: service?.name,
            servicePrice: service?.price,
            serviceDuration: service?.duration,
        });
    };

    const handleBookSlot = async (session: any) => {
        const { Alert } = require('react-native');
        Alert.alert(
            'Confirm Booking',
            `Book session on ${new Date(session.startTime).toLocaleDateString()} at ${new Date(session.startTime).toLocaleTimeString()} for $${session.price}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm',
                    onPress: async () => {
                        try {
                            await apiClient.post(`/sessions/${session.id}/book`);
                            Alert.alert('Success', 'Session booked successfully!', [
                                { text: 'OK', onPress: () => navigation.navigate('MySessions') }
                            ]);
                        } catch (error: any) {
                            Alert.alert('Booking Failed', error.response?.data?.message || 'Could not book session.');
                        }
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2563eb" />
                <Text style={styles.loadingText}>Loading profile...</Text>
            </View>
        );
    }

    if (error || !psychologist) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorIcon}>😕</Text>
                <Text style={styles.errorTitle}>Profile not found</Text>
                <Text style={styles.errorText}>{error || 'Unable to load psychologist profile'}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
                    <Text style={styles.retryText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const enabledServices = psychologist.services?.filter((s) => s.isEnabled) || [];

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#2563eb" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Profile</Text>
                <View style={{ width: 60 }} />
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Profile Card */}
                <View style={styles.profileCard}>
                    {/* Avatar */}
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{psychologist.alias.charAt(0).toUpperCase()}</Text>
                        </View>
                        <View style={[styles.statusDot, { backgroundColor: getStatusColor(psychologist.status) }]} />
                    </View>

                    {/* Name & Status */}
                    <Text style={styles.name}>{psychologist.alias}</Text>
                    <View style={styles.badgesRow}>
                        {psychologist.isVerified && (
                            <View style={styles.verifiedBadge}>
                                <Text style={styles.verifiedText}>✓ Verified</Text>
                            </View>
                        )}
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(psychologist.status) + '20' }]}>
                            <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(psychologist.status) }]} />
                            <Text style={[styles.statusText, { color: getStatusColor(psychologist.status) }]}>
                                {getStatusLabel(psychologist.status)}
                            </Text>
                        </View>
                    </View>

                    {/* Bio */}
                    {psychologist.bio && <Text style={styles.bio}>{psychologist.bio}</Text>}

                    {/* Quick Info */}
                    <View style={styles.quickInfoRow}>
                        {psychologist.experience && (
                            <View style={styles.quickInfoItem}>
                                <Text style={styles.quickInfoIcon}>🏆</Text>
                                <Text style={styles.quickInfoValue}>{psychologist.experience} yrs</Text>
                                <Text style={styles.quickInfoLabel}>Experience</Text>
                            </View>
                        )}
                        {psychologist.languages && psychologist.languages.length > 0 && (
                            <View style={styles.quickInfoItem}>
                                <Text style={styles.quickInfoIcon}>🌍</Text>
                                <Text style={styles.quickInfoValue}>{psychologist.languages.length}</Text>
                                <Text style={styles.quickInfoLabel}>Languages</Text>
                            </View>
                        )}
                        {psychologist.hourlyRate && (
                            <View style={styles.quickInfoItem}>
                                <Text style={styles.quickInfoIcon}>💵</Text>
                                <Text style={styles.quickInfoValue}>${psychologist.hourlyRate}</Text>
                                <Text style={styles.quickInfoLabel}>Per Hour</Text>
                            </View>
                        )}
                    </View>

                    {/* Gallery Link */}
                    <TouchableOpacity
                        style={styles.galleryButton}
                        onPress={() => navigation.navigate('Gallery', { psychologistId: psychologist.id })}
                    >
                        <Text style={styles.galleryButtonText}>🖼️ View Public Gallery</Text>
                    </TouchableOpacity>
                </View>

                {/* Available Sessions Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Available Slots</Text>
                    {sessionsLoading ? (
                        <ActivityIndicator color="#2563eb" />
                    ) : availableSessions.length > 0 ? (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.slotsScroll}>
                            {availableSessions.map((session) => (
                                <TouchableOpacity
                                    key={session.id}
                                    style={styles.slotCard}
                                    onPress={() => handleBookSlot(session)}
                                >
                                    <Text style={styles.slotDate}>
                                        {new Date(session.startTime).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                                    </Text>
                                    <Text style={styles.slotTime}>
                                        {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </Text>
                                    <Text style={styles.slotPrice}>${session.price}</Text>
                                    <View style={styles.bookSlotButton}>
                                        <Text style={styles.bookSlotText}>Book</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    ) : (
                        <Text style={styles.noSlotsText}>No available slots found. Try requesting one below.</Text>
                    )}
                </View>

                {/* Specialties */}
                {psychologist.specialties && psychologist.specialties.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Specialties</Text>
                        <View style={styles.specialtiesContainer}>
                            {psychologist.specialties.map((specialty, idx) => (
                                <View key={idx} style={styles.specialtyChip}>
                                    <Text style={styles.specialtyText}>{specialty}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Languages */}
                {psychologist.languages && psychologist.languages.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Languages</Text>
                        <View style={styles.languagesRow}>
                            {psychologist.languages.map((lang, idx) => (
                                <Text key={idx} style={styles.languageText}>
                                    {lang}
                                    {idx < psychologist.languages!.length - 1 ? ' • ' : ''}
                                </Text>
                            ))}
                        </View>
                    </View>
                )}

                {/* Education */}
                {psychologist.education && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Education</Text>
                        <Text style={styles.educationText}>{psychologist.education}</Text>
                    </View>
                )}

                {/* Services */}
                {enabledServices.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Request Custom Session</Text>
                        {enabledServices.map((service) => (
                            <View key={service.id} style={styles.serviceCard}>
                                <View style={styles.serviceHeader}>
                                    <Text style={styles.serviceName}>{service.name}</Text>
                                    <Text style={styles.servicePrice}>${service.price}</Text>
                                </View>
                                {service.description && (
                                    <Text style={styles.serviceDescription} numberOfLines={2}>
                                        {service.description}
                                    </Text>
                                )}
                                <View style={styles.serviceFooter}>
                                    <View style={styles.durationTag}>
                                        <Text style={styles.durationText}>⏱ {service.duration} min</Text>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.bookButton}
                                        onPress={() => handleRequestService(service)}
                                    >
                                        <Text style={styles.bookButtonText}>Request</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                {/* Book Session Button (if no services) */}
                {enabledServices.length === 0 && (
                    <View style={styles.section}>
                        <TouchableOpacity style={styles.mainBookButton} onPress={() => handleRequestService()}>
                            <Text style={styles.mainBookButtonText}>📅 Request a Session</Text>
                        </TouchableOpacity>
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
        marginTop: 12,
        color: '#6b7280',
    },
    errorContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f9fafb',
        paddingHorizontal: 32,
    },
    errorIcon: {
        fontSize: 48,
        marginBottom: 16,
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 8,
    },
    errorText: {
        color: '#6b7280',
        textAlign: 'center',
        marginBottom: 24,
    },
    retryButton: {
        backgroundColor: '#2563eb',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryText: {
        color: 'white',
        fontWeight: '600',
    },
    profileCard: {
        backgroundColor: 'white',
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    avatar: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: '#dbeafe',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontSize: 40,
        fontWeight: 'bold',
        color: '#2563eb',
    },
    statusDot: {
        position: 'absolute',
        bottom: 4,
        right: 4,
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 3,
        borderColor: 'white',
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 8,
    },
    badgesRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    verifiedBadge: {
        backgroundColor: '#dcfce7',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    verifiedText: {
        color: '#16a34a',
        fontSize: 12,
        fontWeight: '600',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 6,
    },
    statusIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    bio: {
        color: '#6b7280',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 16,
    },
    quickInfoRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
    },
    quickInfoItem: {
        alignItems: 'center',
    },
    quickInfoIcon: {
        fontSize: 24,
        marginBottom: 4,
    },
    quickInfoValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
    },
    quickInfoLabel: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 2,
    },
    section: {
        backgroundColor: 'white',
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 12,
    },
    specialtiesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    specialtyChip: {
        backgroundColor: '#dbeafe',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    specialtyText: {
        color: '#2563eb',
        fontSize: 13,
        fontWeight: '500',
    },
    languagesRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    languageText: {
        color: '#6b7280',
        fontSize: 14,
    },
    educationText: {
        color: '#6b7280',
        fontSize: 14,
        lineHeight: 20,
    },
    serviceCard: {
        backgroundColor: '#f9fafb',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    serviceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    serviceName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        flex: 1,
    },
    servicePrice: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#16a34a',
    },
    serviceDescription: {
        color: '#6b7280',
        fontSize: 13,
        lineHeight: 18,
        marginBottom: 12,
    },
    serviceFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    durationTag: {
        backgroundColor: '#f3f4f6',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    durationText: {
        color: '#6b7280',
        fontSize: 12,
    },
    bookButton: {
        backgroundColor: '#2563eb',
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 8,
    },
    bookButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 14,
    },
    mainBookButton: {
        backgroundColor: '#2563eb',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    mainBookButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    galleryButton: {
        marginTop: 20,
        backgroundColor: '#f3e8ff',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
        width: '100%',
        alignItems: 'center',
    },
    galleryButtonText: {
        color: '#7c3aed',
        fontSize: 14,
        fontWeight: 'bold',
    },
    // Slot Styles
    slotsScroll: {
        marginTop: 8,
    },
    noSlotsText: {
        color: '#9ca3af',
        fontStyle: 'italic',
        fontSize: 14,
    },
    slotCard: {
        backgroundColor: '#eff6ff',
        borderRadius: 12,
        padding: 12,
        marginRight: 12,
        borderWidth: 1,
        borderColor: '#bfdbfe',
        minWidth: 120,
        alignItems: 'center',
    },
    slotDate: {
        fontSize: 12,
        color: '#1e40af',
        marginBottom: 4,
        fontWeight: '600',
    },
    slotTime: {
        fontSize: 16,
        color: '#111827',
        fontWeight: 'bold',
        marginBottom: 4,
    },
    slotPrice: {
        fontSize: 14,
        color: '#16a34a',
        fontWeight: 'bold',
        marginBottom: 8,
    },
    bookSlotButton: {
        backgroundColor: '#2563eb',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    bookSlotText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
});
