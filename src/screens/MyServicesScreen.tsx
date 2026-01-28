import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import apiClient from '../services/api';

interface ServiceOption {
    id: string;
    name: string;
    description: string;
    price: number;
    duration: number;
    isEnabled: boolean;
}

export default function MyServicesScreen({ navigation }: any) {
    const [services, setServices] = useState<ServiceOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [editingService, setEditingService] = useState<ServiceOption | null>(null);

    // Form State
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [duration, setDuration] = useState('');

    useEffect(() => {
        loadServices();
    }, []);

    const loadServices = async () => {
        try {
            setLoading(true);
            const res = await apiClient.get('/service-options/my');
            setServices(res.data.data || res.data || []);
        } catch (error) {
            console.error('Failed to load services:', error);
            Alert.alert('Error', 'Failed to load services');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (service?: ServiceOption) => {
        if (service) {
            setEditingService(service);
            setName(service.name);
            setDescription(service.description);
            setPrice(service.price.toString());
            setDuration(service.duration.toString());
        } else {
            setEditingService(null);
            setName('');
            setDescription('');
            setPrice('');
            setDuration('');
        }
        setModalVisible(true);
    };

    const handleSave = async () => {
        if (!name || !price || !duration) {
            Alert.alert('Validation Error', 'Please fill in all required fields');
            return;
        }

        try {
            setProcessing(true);
            const payload = {
                name,
                description,
                price: parseFloat(price),
                duration: parseInt(duration),
                isEnabled: true,
            };

            if (editingService) {
                await apiClient.patch(`/service-options/${editingService.id}`, payload);
            } else {
                await apiClient.post('/service-options', payload);
            }

            setModalVisible(false);
            loadServices();
            Alert.alert('Success', 'Service saved successfully');
        } catch (error: any) {
            console.error('Save error:', error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to save service');
        } finally {
            setProcessing(false);
        }
    };

    const handleDelete = (id: string) => {
        Alert.alert(
            'Delete Service',
            'Are you sure you want to delete this service?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setProcessing(true);
                            await apiClient.delete(`/service-options/${id}`);
                            loadServices();
                        } catch (error: any) {
                            Alert.alert('Error', 'Failed to delete service');
                        } finally {
                            setProcessing(false);
                        }
                    },
                },
            ]
        );
    };

    const renderItem = ({ item }: { item: ServiceOption }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.serviceName}>{item.name}</Text>
                <Text style={styles.servicePrice}>${item.price}</Text>
            </View>
            <View style={styles.durationBadge}>
                <Text style={styles.durationText}>⏱ {item.duration} min</Text>
            </View>
            {item.description ? <Text style={styles.description}>{item.description}</Text> : null}

            <View style={styles.actions}>
                <TouchableOpacity
                    style={[styles.actionButton, styles.editButton]}
                    onPress={() => handleOpenModal(item)}
                >
                    <Text style={styles.editText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDelete(item.id)}
                >
                    <Text style={styles.deleteText}>Delete</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#7c3aed" />
                <Text style={styles.loadingText}>Loading services...</Text>
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
                <Text style={styles.headerTitle}>My Services</Text>
                <TouchableOpacity onPress={() => handleOpenModal()} style={styles.addButton}>
                    <Text style={styles.addText}>+ Add</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={services}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyIcon}>💼</Text>
                        <Text style={styles.emptyText}>No services added yet</Text>
                    </View>
                }
            />

            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {editingService ? 'Edit Service' : 'New Service'}
                            </Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Text style={styles.closeText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView contentContainerStyle={styles.form}>
                            <Text style={styles.label}>Service Name *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. Cognitive Therapy"
                                value={name}
                                onChangeText={setName}
                            />

                            <Text style={styles.label}>Price ($) *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="0.00"
                                keyboardType="numeric"
                                value={price}
                                onChangeText={setPrice}
                            />

                            <Text style={styles.label}>Duration (minutes) *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="60"
                                keyboardType="number-pad"
                                value={duration}
                                onChangeText={setDuration}
                            />

                            <Text style={styles.label}>Description</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="Brief description of the service..."
                                multiline
                                numberOfLines={4}
                                value={description}
                                onChangeText={setDescription}
                            />

                            <TouchableOpacity
                                style={[styles.saveButton, processing && styles.disabledButton]}
                                onPress={handleSave}
                                disabled={processing}
                            >
                                {processing ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text style={styles.saveButtonText}>Save Service</Text>
                                )}
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
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
    addButton: {
        padding: 8,
    },
    addText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
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
        marginBottom: 8,
    },
    serviceName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
        flex: 1,
    },
    servicePrice: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#16a34a',
    },
    durationBadge: {
        backgroundColor: '#f3e8ff',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        marginBottom: 8,
    },
    durationText: {
        color: '#7c3aed',
        fontSize: 12,
        fontWeight: '500',
    },
    description: {
        color: '#6b7280',
        fontSize: 14,
        marginBottom: 12,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 8,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
        paddingTop: 12,
    },
    actionButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    editButton: {
        backgroundColor: '#e0e7ff',
    },
    deleteButton: {
        backgroundColor: '#fee2e2',
    },
    editText: {
        color: '#4f46e5',
        fontWeight: '500',
    },
    deleteText: {
        color: '#ef4444',
        fontWeight: '500',
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        height: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
    },
    closeText: {
        color: '#6b7280',
        fontSize: 16,
    },
    form: {
        padding: 24,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
        marginTop: 16,
    },
    input: {
        backgroundColor: '#f9fafb',
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#111827',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    saveButton: {
        backgroundColor: '#7c3aed',
        marginTop: 32,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    disabledButton: {
        backgroundColor: '#c4b5fd',
    },
    saveButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
