import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useContext, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import apiClient from '../services/api';

export default function BookSessionScreen({ route, navigation }: any) {
    const { user } = useContext(AuthContext);
    const { psychologistId, serviceId, serviceName, servicePrice, serviceDuration } = route.params;

    const [date, setDate] = useState(new Date());
    const [time, setTime] = useState(new Date());
    const [loading, setLoading] = useState(false);

    // Visibility for pickers
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);

    const onChangeDate = (event: any, selectedDate?: Date) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            setDate(selectedDate);
            // Update time date part
            const newTime = new Date(time);
            newTime.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
            setTime(newTime);
        }
    };

    const onChangeTime = (event: any, selectedTime?: Date) => {
        setShowTimePicker(Platform.OS === 'ios');
        if (selectedTime) {
            const newTime = new Date(date);
            newTime.setHours(selectedTime.getHours(), selectedTime.getMinutes());
            setTime(newTime);
        }
    };

    const handleBookSession = async () => {
        try {
            setLoading(true);

            // Construct requested time
            const requestedTime = new Date(date);
            requestedTime.setHours(time.getHours(), time.getMinutes());

            if (requestedTime < new Date()) {
                Alert.alert('Invalid Time', 'Please select a future time');
                return;
            }

            const payload = {
                psychologistId,
                requestedTime: requestedTime.toISOString(),
                serviceId,
                notes: `Booking for ${serviceName}`,
            };

            await apiClient.post('/sessions/request', payload);

            Alert.alert(
                'Request Sent',
                'Your session request has been sent to the psychologist. You will be notified when they accept.',
                [{ text: 'OK', onPress: () => navigation.navigate('PatientDashboard') }]
            );
        } catch (error: any) {
            console.error('Booking error:', error);
            Alert.alert('Booking Failed', error.response?.data?.message || 'Failed to book session');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#2563eb" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backText}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Book Session</Text>
                <View style={{ width: 60 }} />
            </View>

            <ScrollView style={styles.content}>
                <View style={styles.serviceCard}>
                    <Text style={styles.serviceName}>{serviceName || 'Session'}</Text>
                    <Text style={styles.servicePrice}>${servicePrice || 0}</Text>
                    <Text style={styles.serviceDuration}>{serviceDuration || 60} minutes</Text>
                </View>

                <Text style={styles.label}>Select Date</Text>
                {Platform.OS === 'android' && (
                    <TouchableOpacity
                        style={styles.pickerButton}
                        onPress={() => setShowDatePicker(true)}
                    >
                        <Text style={styles.pickerButtonText}>{date.toDateString()}</Text>
                    </TouchableOpacity>
                )}
                {(Platform.OS === 'ios' || showDatePicker) && (
                    <View style={styles.pickerContainer}>
                        <DateTimePicker
                            testID="datePicker"
                            value={date}
                            mode="date"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={onChangeDate}
                            minimumDate={new Date()}
                            textColor={Platform.OS === 'ios' ? 'black' : undefined}
                        />
                    </View>
                )}

                <Text style={styles.label}>Select Time</Text>
                {Platform.OS === 'android' && (
                    <TouchableOpacity
                        style={styles.pickerButton}
                        onPress={() => setShowTimePicker(true)}
                    >
                        <Text style={styles.pickerButtonText}>
                            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    </TouchableOpacity>
                )}
                {(Platform.OS === 'ios' || showTimePicker) && (
                    <View style={styles.pickerContainer}>
                        <DateTimePicker
                            testID="timePicker"
                            value={time}
                            mode="time"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={onChangeTime}
                            minuteInterval={15}
                            textColor={Platform.OS === 'ios' ? 'black' : undefined}
                        />
                    </View>
                )}

                <View style={styles.summaryContainer}>
                    <Text style={styles.summaryTitle}>Booking Summary</Text>
                    <Text style={styles.summaryText}>
                        Date: {date.toDateString()}
                    </Text>
                    <Text style={styles.summaryText}>
                        Time: {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                    <Text style={styles.disclaimer}>
                        Note: This is a request. The psychologist will need to confirm the appointment.
                    </Text>
                </View>

                <TouchableOpacity
                    style={[styles.bookButton, loading && styles.disabledButton]}
                    onPress={handleBookSession}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.bookButtonText}>Confirm Booking Request</Text>
                    )}
                </TouchableOpacity>

                <View style={{ height: 40 }} />
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
    content: {
        padding: 24,
    },
    serviceCard: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 16,
        marginBottom: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    serviceName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 8,
    },
    servicePrice: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2563eb',
        marginBottom: 4,
    },
    serviceDuration: {
        fontSize: 14,
        color: '#6b7280',
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        marginTop: 16,
        marginBottom: 8,
    },
    pickerContainer: {
        backgroundColor: 'white',
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    pickerButton: {
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#d1d5db',
        alignItems: 'center',
    },
    pickerButtonText: {
        fontSize: 16,
        color: '#111827',
    },
    summaryContainer: {
        backgroundColor: '#dbeafe',
        padding: 16,
        borderRadius: 12,
        marginTop: 32,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#bfdbfe',
    },
    summaryTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2563eb',
        marginBottom: 8,
    },
    summaryText: {
        color: '#1e40af',
        fontSize: 14,
        marginBottom: 4,
    },
    disclaimer: {
        color: '#60a5fa',
        fontSize: 12,
        fontStyle: 'italic',
        marginTop: 8,
    },
    bookButton: {
        backgroundColor: '#2563eb',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#2563eb',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    disabledButton: {
        backgroundColor: '#93c5fd',
    },
    bookButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
