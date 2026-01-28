import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import apiClient from '../services/api';

interface Psychologist {
    id: string;
    alias: string;
    bio?: string;
    specialties?: string[];
    languages?: string[];
    hourlyRate?: number;
    isVerified: boolean;
    profileImage?: string;
}

export default function FindPsychologistScreen({ navigation }: any) {
    const [psychologists, setPsychologists] = useState<Psychologist[]>([]);
    const [filteredPsychologists, setFilteredPsychologists] = useState<Psychologist[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSpecialty, setSelectedSpecialty] = useState('ALL');

    useEffect(() => {
        loadPsychologists();
    }, []);

    useEffect(() => {
        filterPsychologists();
    }, [searchQuery, selectedSpecialty, psychologists]);

    const loadPsychologists = async () => {
        try {
            setLoading(true);
            const res = await apiClient.get('/profile/psychologists');
            const data = res.data.data || res.data || [];
            // Filter only verified psychologists
            const verified = Array.isArray(data) ? data.filter((p: Psychologist) => p.isVerified) : [];
            setPsychologists(verified);
            setFilteredPsychologists(verified);
        } catch (error) {
            console.error('Failed to load psychologists:', error);
            setPsychologists([]);
            setFilteredPsychologists([]);
        } finally {
            setLoading(false);
        }
    };

    const filterPsychologists = () => {
        let filtered = [...psychologists];

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (p) =>
                    p.alias.toLowerCase().includes(query) ||
                    p.bio?.toLowerCase().includes(query) ||
                    p.specialties?.some((s) => s.toLowerCase().includes(query))
            );
        }

        // Specialty filter
        if (selectedSpecialty !== 'ALL') {
            filtered = filtered.filter((p) => p.specialties?.includes(selectedSpecialty));
        }

        setFilteredPsychologists(filtered);
    };

    // Get unique specialties
    const allSpecialties = Array.from(
        new Set(psychologists.flatMap((p) => p.specialties || []))
    ).sort();

    const renderPsychologistCard = ({ item }: { item: Psychologist }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('PsychologistProfile', { psychologistId: item.id })}
            activeOpacity={0.7}
        >
            {/* Avatar */}
            <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.alias.charAt(0).toUpperCase()}</Text>
            </View>

            {/* Info */}
            <View style={styles.cardContent}>
                <Text style={styles.name}>{item.alias}</Text>

                {/* Specialties */}
                {item.specialties && item.specialties.length > 0 && (
                    <View style={styles.specialtiesRow}>
                        {item.specialties.slice(0, 2).map((specialty, idx) => (
                            <View key={idx} style={styles.specialtyTag}>
                                <Text style={styles.specialtyText}>{specialty}</Text>
                            </View>
                        ))}
                        {item.specialties.length > 2 && (
                            <View style={styles.moreTag}>
                                <Text style={styles.moreText}>+{item.specialties.length - 2}</Text>
                            </View>
                        )}
                    </View>
                )}

                {/* Bio */}
                {item.bio && (
                    <Text style={styles.bio} numberOfLines={2}>
                        {item.bio}
                    </Text>
                )}
            </View>

            {/* Arrow */}
            <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#2563eb" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Find Psychologist</Text>
                <View style={{ width: 60 }} />
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search by name or specialty..."
                    placeholderTextColor="#9ca3af"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {/* Specialty Filters */}
            <View style={styles.filtersWrapper}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filtersContent}
                >
                    <TouchableOpacity
                        style={[styles.filterChip, selectedSpecialty === 'ALL' && styles.filterChipActive]}
                        onPress={() => setSelectedSpecialty('ALL')}
                    >
                        <Text
                            style={[
                                styles.filterChipText,
                                selectedSpecialty === 'ALL' && styles.filterChipTextActive,
                            ]}
                        >
                            All
                        </Text>
                    </TouchableOpacity>
                    {allSpecialties.map((specialty) => (
                        <TouchableOpacity
                            key={specialty}
                            style={[
                                styles.filterChip,
                                selectedSpecialty === specialty && styles.filterChipActive,
                            ]}
                            onPress={() => setSelectedSpecialty(specialty)}
                        >
                            <Text
                                style={[
                                    styles.filterChipText,
                                    selectedSpecialty === specialty && styles.filterChipTextActive,
                                ]}
                            >
                                {specialty}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Results Count */}
            <Text style={styles.resultsCount}>
                {filteredPsychologists.length} psychologist{filteredPsychologists.length !== 1 ? 's' : ''}{' '}
                found
            </Text>

            {/* Content */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#2563eb" />
                    <Text style={styles.loadingText}>Loading psychologists...</Text>
                </View>
            ) : filteredPsychologists.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyIcon}>🔍</Text>
                    <Text style={styles.emptyTitle}>No psychologists found</Text>
                    <Text style={styles.emptyText}>Try adjusting your search or filters</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredPsychologists}
                    keyExtractor={(item) => item.id}
                    renderItem={renderPsychologistCard}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            )}
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
    searchContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    searchInput: {
        backgroundColor: '#f3f4f6',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: '#111827',
    },
    filtersWrapper: {
        height: 56,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        justifyContent: 'center',
    },
    filtersContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        height: 56,
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f3f4f6',
        marginRight: 8,
    },
    filterChipActive: {
        backgroundColor: '#2563eb',
    },
    filterChipText: {
        fontSize: 14,
        color: '#6b7280',
        fontWeight: '500',
    },
    filterChipTextActive: {
        color: 'white',
    },
    resultsCount: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 14,
        color: '#6b7280',
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
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 24,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#dbeafe',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    avatarText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2563eb',
    },
    cardContent: {
        flex: 1,
    },
    name: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
    },
    specialtiesRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 4,
    },
    specialtyTag: {
        backgroundColor: '#dbeafe',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        marginRight: 4,
        marginBottom: 4,
    },
    specialtyText: {
        fontSize: 11,
        color: '#2563eb',
        fontWeight: '500',
    },
    moreTag: {
        backgroundColor: '#f3f4f6',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    moreText: {
        fontSize: 11,
        color: '#6b7280',
    },
    bio: {
        fontSize: 13,
        color: '#6b7280',
        lineHeight: 18,
    },
    arrow: {
        fontSize: 24,
        color: '#9ca3af',
        marginLeft: 8,
    },
});
