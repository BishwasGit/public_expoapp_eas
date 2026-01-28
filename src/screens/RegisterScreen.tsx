import React, { useContext, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import apiClient from '../services/api';

export default function RegisterScreen({ navigation }: any) {
    const { login } = useContext(AuthContext);
    const [alias, setAlias] = useState('');
    const [email, setEmail] = useState('');
    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        if (!alias || !pin || !confirmPin || !email) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (alias.length < 3) {
            Alert.alert('Error', 'Alias must be at least 3 characters');
            return;
        }

        if (!email.includes('@')) {
            Alert.alert('Error', 'Please enter a valid email');
            return;
        }

        if (pin.length < 4) {
            Alert.alert('Error', 'PIN must be at least 4 characters');
            return;
        }

        if (pin !== confirmPin) {
            Alert.alert('Error', 'PINs do not match');
            return;
        }

        try {
            setLoading(true);
            const response = await apiClient.post('/auth/signup', {
                alias,
                email,
                pin,
                role: 'PATIENT',
            });

            if (response.status === 201 || response.status === 200) {
                // Auto login after registration
                try {
                    await login(alias, pin);
                    // Navigation handled by router based on auth state
                } catch (loginError) {
                    Alert.alert('Success', 'Account created! Please log in.');
                    navigation.navigate('Login');
                }
            }
        } catch (error: any) {
            console.error('Registration failed:', error);
            Alert.alert(
                'Registration Failed',
                error.response?.data?.message || 'Something went wrong'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <View style={styles.formContainer}>
                <Text style={styles.title}>Create Account</Text>
                <Text style={styles.subtitle}>Sign up as a Patient</Text>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Alias (Username)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter your alias"
                        value={alias}
                        onChangeText={setAlias}
                        autoCapitalize="none"
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Email Address</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter your email"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>PIN (Password)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter 4+ digit PIN"
                        value={pin}
                        onChangeText={setPin}
                        secureTextEntry
                        keyboardType="numeric"
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Confirm PIN</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Confirm your PIN"
                        value={confirmPin}
                        onChangeText={setConfirmPin}
                        secureTextEntry
                        keyboardType="numeric"
                    />
                </View>

                <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleRegister}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>Sign Up</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.linkButton}
                    onPress={() => navigation.navigate('Login')}
                >
                    <Text style={styles.linkText}>
                        Already have an account? <Text style={styles.linkBold}>Log In</Text>
                    </Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        justifyContent: 'center',
    },
    formContainer: {
        padding: 24,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#2563eb',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#6b7280',
        marginBottom: 32,
        textAlign: 'center',
    },
    inputContainer: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
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
    button: {
        backgroundColor: '#2563eb',
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 16,
        shadowColor: '#2563eb',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonDisabled: {
        backgroundColor: '#93c5fd',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    linkButton: {
        marginTop: 24,
        alignItems: 'center',
    },
    linkText: {
        color: '#6b7280',
        fontSize: 14,
    },
    linkBold: {
        color: '#2563eb',
        fontWeight: 'bold',
    },
});
