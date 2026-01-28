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

export default function CreateSessionScreen({ navigation }: any) {
    const { user } = useContext(AuthContext);
    const [date, setDate] = useState(new Date());
    const [startTime, setStartTime] = useState(new Date());
    const [endTime, setEndTime] = useState(new Date(new Date().setHours(new Date().getHours() + 1)));
    const [loading, setLoading] = useState(false);

    // Visibility for pickers (mostly for Android)
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showStartTimePicker, setShowStartTimePicker] = useState(false);
    const [showEndTimePicker, setShowEndTimePicker] = useState(false);

    const onChangeDate = (event: any, selectedDate?: Date) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            setDate(selectedDate);
            // Update time parts of start/end to match new date
            const newStart = new Date(startTime);
            newStart.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
            setStartTime(newStart);

            const newEnd = new Date(endTime);
            newEnd.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
            setEndTime(newEnd);
        }
    };

    const onChangeStartTime = (event: any, selectedTime?: Date) => {
        setShowStartTimePicker(Platform.OS === 'ios');
        if (selectedTime) {
            // Keep the date part from 'date' state, only update time
            const newStart = new Date(date);
            newStart.setHours(selectedTime.getHours(), selectedTime.getMinutes());
            setStartTime(newStart);

            // Auto update end time to be 1 hour later if it's before start time
            if (endTime <= newStart) {
                const newEnd = new Date(newStart);
                newEnd.setHours(newStart.getHours() + 1);
                setEndTime(newEnd);
            }
        }
    };

    const onChangeEndTime = (event: any, selectedTime?: Date) => {
        setShowEndTimePicker(Platform.OS === 'ios');
        if (selectedTime) {
            const newEnd = new Date(date);
            newEnd.setHours(selectedTime.getHours(), selectedTime.getMinutes());
            setEndTime(newEnd);
        }
    };

    const handleCreateSession = async () => {
        if (endTime <= startTime) {
            Alert.alert('Invalid Time', 'End time must be after start time');
            return;
        }

        try {
            setLoading(true);
            const payload = {
                psychologistId: user?.id,
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString(),
            };

            await apiClient.post('/sessions', payload);
            Alert.alert('Success', 'Session created successfully', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error: any) {
            console.error('Create session error:', error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to create session');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#7c3aed" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backText}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Create Session</Text>
                <View style={{ width: 60 }} />
            </View>

            <ScrollView style={styles.content}>
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

                <Text style={styles.label}>Start Time</Text>
                {Platform.OS === 'android' && (
                    <TouchableOpacity
                        style={styles.pickerButton}
                        onPress={() => setShowStartTimePicker(true)}
                    >
                        <Text style={styles.pickerButtonText}>
                            {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    </TouchableOpacity>
                )}
                {(Platform.OS === 'ios' || showStartTimePicker) && (
                    <View style={styles.pickerContainer}>
                        <DateTimePicker
                            testID="startTimePicker"
                            value={startTime}
                            mode="time"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={onChangeStartTime}
                            minuteInterval={15}
                            textColor={Platform.OS === 'ios' ? 'black' : undefined}
                        />
                    </View>
                )}

                <Text style={styles.label}>End Time</Text>
                {Platform.OS === 'android' && (
                    <TouchableOpacity
                        style={styles.pickerButton}
                        onPress={() => setShowEndTimePicker(true)}
                    >
                        <Text style={styles.pickerButtonText}>
                            {endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    </TouchableOpacity>
                )}
                {(Platform.OS === 'ios' || showEndTimePicker) && (
                    <View style={styles.pickerContainer}>
                        <DateTimePicker
                            testID="endTimePicker"
                            value={endTime}
                            mode="time"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={onChangeEndTime}
                            minuteInterval={15}
                            textColor={Platform.OS === 'ios' ? 'black' : undefined}
                        />
                    </View>
                )}

                <View style={styles.summaryContainer}>
                    <Text style={styles.summaryTitle}>Session Summary</Text>
                    <Text style={styles.summaryText}>
                        Date: {date.toDateString()}
                    </Text>
                    <Text style={styles.summaryText}>
                        Time: {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                    <Text style={styles.summaryText}>
                        Duration: {Math.round((endTime.getTime() - startTime.getTime()) / 60000)} mins
                    </Text>
                </View>

                <TouchableOpacity
                    style={[styles.createButton, loading && styles.disabledButton]}
                    onPress={handleCreateSession}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.createButtonText}>Create Session</Text>
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
    content: {
        padding: 24,
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
        backgroundColor: '#ede9fe',
        padding: 16,
        borderRadius: 12,
        marginTop: 32,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#ddd6fe',
    },
    summaryTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#7c3aed',
        marginBottom: 8,
    },
    summaryText: {
        color: '#5b21b6',
        fontSize: 14,
        marginBottom: 4,
    },
    createButton: {
        backgroundColor: '#7c3aed',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#7c3aed',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    disabledButton: {
        backgroundColor: '#a78bfa',
    },
    createButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
