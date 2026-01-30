import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Linking
} from 'react-native';
import apiClient from '../services/api';

export default function AddFundsScreen({ navigation }: any) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddFunds = async () => {
    const value = parseFloat(amount);
    if (!value || value < 10) {
      Alert.alert('Invalid Amount', 'Please enter an amount of at least Rs. 10');
      return;
    }

    setLoading(true);
    try {
      // 1. Initialize Payment
      // Strategy: Open Web Browser to the Frontend's Bridge Page.
      // We pass a successUrl that points to the Web Frontend BUT with a 'redirect' param to the mobile app.
      // This ensures eSewa redirects to HTTPS (Web), and Web redirects to Custom Scheme (App).
      
      const FRONTEND_ORIGIN = 'https://public-frontend-vitereact.onrender.com';
      const DEEP_LINK_SUCCESS = 'medicalapp://esewa/success';
      const DEEP_LINK_FAILURE = 'medicalapp://esewa/failure';
      
      // Construct the URL that eSewa will redirect to (The Web Frontend)
      // We append ?redirect=... so the Frontend knows to bounce it back to the app.
      const successUrl = `${FRONTEND_ORIGIN}/esewa/success?redirect=${encodeURIComponent(DEEP_LINK_SUCCESS)}`;
      const failureUrl = `${FRONTEND_ORIGIN}/esewa/failure?redirect=${encodeURIComponent(DEEP_LINK_FAILURE)}`;

      const response = await apiClient.post('/wallet/esewa/init', {
        amount: value,
        successUrl: successUrl,
        failureUrl: failureUrl,
      });
      
      const { params } = response.data;
      
      // 2. Open Bridge Page
      // We pass all the signed params to the bridge page as query params.
      // The bridge page will render a form and submit it.
      
      // Convert params object to query string
      const queryString = Object.keys(params)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
        .join('&');
        
      const bridgeUrl = `${FRONTEND_ORIGIN}/esewa/pay-redirect?${queryString}`;
      
      const supported = await Linking.canOpenURL(bridgeUrl);
      if (supported) {
        await Linking.openURL(bridgeUrl);
      } else {
        Alert.alert('Error', 'Cannot open browser for payment');
      }

      // Note: We don't verify here. The App should handle the Deep Link to verify/show success.
      // Ideally, listen for Linking events or rely on the redirected page opening the app.

    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to initialize payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Add Funds</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Amount (Rs.)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter amount (e.g., 500)"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
            editable={!loading}
          />

          <View style={styles.presets}>
            {[100, 500, 1000, 2000].map((val) => (
              <TouchableOpacity
                key={val}
                style={[
                    styles.presetButton,
                    amount === val.toString() && styles.presetButtonActive
                ]}
                onPress={() => setAmount(val.toString())}
              >
                <Text style={[
                    styles.presetText,
                    amount === val.toString() && styles.presetTextActive
                ]}>Rs. {val}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.payButton, loading && styles.disabledButton]}
            onPress={handleAddFunds}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.payButtonText}>Pay with eSewa</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1, padding: 24 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 32 },
  backButton: { marginRight: 16 },
  backButtonText: { fontSize: 16, color: '#2563eb' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  form: { flex: 1 },
  label: { fontSize: 16, fontWeight: '500', color: '#374151', marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 18,
    marginBottom: 24,
  },
  presets: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  presetButton: {
    borderWidth: 1,
    borderColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  presetButtonActive: { backgroundColor: '#eff6ff' },
  presetText: { color: '#2563eb', fontWeight: '500' },
  presetTextActive: { fontWeight: '700' },
  payButton: {
    backgroundColor: '#16a34a',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledButton: { opacity: 0.7 },
  payButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
});
