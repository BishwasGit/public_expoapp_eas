import React, { useContext, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import apiClient from '../services/api';

export default function MyProfileScreen({ navigation }: any) {
    const { user } = useContext(AuthContext);
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editMode, setEditMode] = useState(false);

    // Editable fields
    const [bio, setBio] = useState('');
    const [specialties, setSpecialties] = useState('');
    const [languages, setLanguages] = useState('');
    const [education, setEducation] = useState('');
    const [experience, setExperience] = useState('');
    const [hourlyRate, setHourlyRate] = useState('');

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            setLoading(true);
            const res = await apiClient.get('/profile');
            const data = res.data.data || res.data;
            setProfile(data);
            // Populate editable fields
            setBio(data.bio || '');
            setSpecialties((data.specialties || []).join(', '));
            setLanguages((data.languages || []).join(', '));
            setEducation(data.education || '');
            setExperience(data.experience?.toString() || '');
            setHourlyRate(data.hourlyRate?.toString() || '');
        } catch (error) {
            console.error('Failed to load profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            await apiClient.patch('/profile', {
                bio,
                specialties: specialties.split(',').map((s) => s.trim()).filter(Boolean),
                languages: languages.split(',').map((l) => l.trim()).filter(Boolean),
                education,
                experience: experience ? parseInt(experience) : null,
                hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
            });
            Alert.alert('Success', 'Profile updated successfully');
            setEditMode(false);
            loadProfile();
        } catch (error) {
            console.error('Failed to save profile:', error);
            Alert.alert('Error', 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#7c3aed" />
                <Text style={styles.loadingText}>Loading profile...</Text>
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
                <Text style={styles.headerTitle}>My Profile</Text>
                <TouchableOpacity onPress={() => (editMode ? handleSave() : setEditMode(true))}>
                    <Text style={styles.editText}>{saving ? 'Saving...' : editMode ? 'Save' : 'Edit'}</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Avatar Card */}
                <View style={styles.profileCard}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{user?.alias?.charAt(0).toUpperCase()}</Text>
                    </View>
                    <Text style={styles.name}>Dr. {user?.alias}</Text>
                    {profile?.isVerified && (
                        <View style={styles.verifiedBadge}>
                            <Text style={styles.verifiedText}>✓ Verified Professional</Text>
                        </View>
                    )}
                </View>

                {/* Bio */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Bio</Text>
                    {editMode ? (
                        <TextInput
                            style={styles.textArea}
                            value={bio}
                            onChangeText={setBio}
                            multiline
                            numberOfLines={4}
                            placeholder="Tell patients about yourself..."
                            placeholderTextColor="#9ca3af"
                        />
                    ) : (
                        <Text style={styles.fieldValue}>{bio || 'No bio added yet'}</Text>
                    )}
                </View>

                {/* Specialties */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Specialties</Text>
                    {editMode ? (
                        <TextInput
                            style={styles.input}
                            value={specialties}
                            onChangeText={setSpecialties}
                            placeholder="Anxiety, Depression, Trauma..."
                            placeholderTextColor="#9ca3af"
                        />
                    ) : (
                        <View style={styles.tagsContainer}>
                            {profile?.specialties?.length > 0 ? (
                                profile.specialties.map((spec: string, idx: number) => (
                                    <View key={idx} style={styles.tag}>
                                        <Text style={styles.tagText}>{spec}</Text>
                                    </View>
                                ))
                            ) : (
                                <Text style={styles.fieldValue}>No specialties added</Text>
                            )}
                        </View>
                    )}
                </View>

                {/* Languages */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Languages</Text>
                    {editMode ? (
                        <TextInput
                            style={styles.input}
                            value={languages}
                            onChangeText={setLanguages}
                            placeholder="English, Spanish..."
                            placeholderTextColor="#9ca3af"
                        />
                    ) : (
                        <Text style={styles.fieldValue}>
                            {profile?.languages?.join(', ') || 'No languages added'}
                        </Text>
                    )}
                </View>

                {/* Education */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Education</Text>
                    {editMode ? (
                        <TextInput
                            style={styles.textArea}
                            value={education}
                            onChangeText={setEducation}
                            multiline
                            numberOfLines={3}
                            placeholder="Add your educational background..."
                            placeholderTextColor="#9ca3af"
                        />
                    ) : (
                        <Text style={styles.fieldValue}>{education || 'No education added'}</Text>
                    )}
                </View>

                {/* Experience & Hourly Rate */}
                <View style={styles.row}>
                    <View style={[styles.section, { flex: 1, marginRight: 8 }]}>
                        <Text style={styles.sectionTitle}>Experience (years)</Text>
                        {editMode ? (
                            <TextInput
                                style={styles.input}
                                value={experience}
                                onChangeText={setExperience}
                                keyboardType="numeric"
                                placeholder="5"
                                placeholderTextColor="#9ca3af"
                            />
                        ) : (
                            <Text style={styles.fieldValue}>{experience || '—'} years</Text>
                        )}
                    </View>
                    <View style={[styles.section, { flex: 1, marginLeft: 8 }]}>
                        <Text style={styles.sectionTitle}>Hourly Rate ($)</Text>
                        {editMode ? (
                            <TextInput
                                style={styles.input}
                                value={hourlyRate}
                                onChangeText={setHourlyRate}
                                keyboardType="numeric"
                                placeholder="50"
                                placeholderTextColor="#9ca3af"
                            />
                        ) : (
                            <Text style={styles.fieldValue}>${hourlyRate || '—'}/hr</Text>
                        )}
                    </View>
                </View>

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
    editText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
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
    avatar: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: '#f3e8ff',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    avatarText: {
        fontSize: 40,
        fontWeight: 'bold',
        color: '#7c3aed',
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 8,
    },
    verifiedBadge: {
        backgroundColor: '#dcfce7',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 16,
    },
    verifiedText: {
        color: '#16a34a',
        fontSize: 13,
        fontWeight: '600',
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
        fontSize: 14,
        fontWeight: '600',
        color: '#6b7280',
        marginBottom: 8,
    },
    fieldValue: {
        fontSize: 16,
        color: '#111827',
        lineHeight: 24,
    },
    input: {
        backgroundColor: '#f9fafb',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
        color: '#111827',
    },
    textArea: {
        backgroundColor: '#f9fafb',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
        color: '#111827',
        minHeight: 100,
        textAlignVertical: 'top',
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    tag: {
        backgroundColor: '#f3e8ff',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    tagText: {
        color: '#7c3aed',
        fontSize: 13,
        fontWeight: '500',
    },
    row: {
        flexDirection: 'row',
        paddingHorizontal: 0,
    },
});
