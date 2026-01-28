import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    RefreshControl,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import apiClient from '../services/api';

export default function EarningsScreen({ navigation }: any) {
    const [balance, setBalance] = useState({ balance: 0, currency: 'USD' });
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Withdrawal Modal
    const [modalVisible, setModalVisible] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [withdrawDetails, setWithdrawDetails] = useState('');
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [balanceRes, transactionsRes] = await Promise.all([
                apiClient.get('/wallet/balance'),
                apiClient.get('/wallet/transactions')
            ]);

            setBalance(balanceRes.data.data || balanceRes.data || { balance: 0 });
            setTransactions(transactionsRes.data.data || transactionsRes.data || []);
        } catch (error) {
            console.error('Failed to load earnings data:', error);
            // Alert.alert('Error', 'Failed to load earnings info');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const handleWithdraw = async () => {
        if (!withdrawAmount || isNaN(parseFloat(withdrawAmount))) {
            Alert.alert('Invalid Amount', 'Please enter a valid number');
            return;
        }
        if (parseFloat(withdrawAmount) > balance.balance) {
            Alert.alert('Insufficient Funds', 'You cannot withdraw more than your balance');
            return;
        }

        try {
            setProcessing(true);
            await apiClient.post('/wallet/withdraw', {
                amount: parseFloat(withdrawAmount),
                details: withdrawDetails || 'Withdrawal request'
            });

            Alert.alert('Success', 'Withdrawal processed successfully');
            setModalVisible(false);
            setWithdrawAmount('');
            setWithdrawDetails('');
            loadData();
        } catch (error: any) {
            console.error('Withdrawal error:', error);
            Alert.alert('Error', error.response?.data?.message || 'Withdrawal failed');
        } finally {
            setProcessing(false);
        }
    };

    const renderTransaction = ({ item }: { item: any }) => (
        <View style={styles.transactionCard}>
            <View style={styles.transactionHeader}>
                <Text style={styles.transactionType}>
                    {item.type === 'DEPOSIT' || item.type === 'EARNING' ? '💰 Earning' : '💸 Withdrawal'}
                </Text>
                <Text style={[
                    styles.transactionAmount,
                    { color: item.type === 'WITHDRAWAL' ? '#ef4444' : '#16a34a' }
                ]}>
                    {item.type === 'WITHDRAWAL' ? '-' : '+'}${item.amount}
                </Text>
            </View>
            <Text style={styles.transactionDate}>
                {new Date(item.createdAt).toLocaleDateString()} • {new Date(item.createdAt).toLocaleTimeString()}
            </Text>
            {item.description && <Text style={styles.transactionDesc}>{item.description}</Text>}
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#16a34a" />
                <Text style={styles.loadingText}>Loading earnings...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#16a34a" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Earnings & Wallet</Text>
                <View style={{ width: 60 }} />
            </View>

            {/* Balance Card */}
            <View style={styles.balanceContainer}>
                <Text style={styles.balanceLabel}>Total Balance</Text>
                <Text style={styles.balanceValue}>${balance.balance?.toFixed(2)}</Text>
                <TouchableOpacity
                    style={styles.withdrawButton}
                    onPress={() => setModalVisible(true)}
                >
                    <Text style={styles.withdrawButtonText}>Request Withdrawal</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.listContainer}>
                <Text style={styles.sectionTitle}>Transaction History</Text>
                <FlatList
                    data={transactions}
                    renderItem={renderTransaction}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyIcon}>🧾</Text>
                            <Text style={styles.emptyText}>No transactions yet</Text>
                        </View>
                    }
                />
            </View>

            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Withdraw Funds</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Text style={styles.closeText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.form}>
                            <Text style={styles.label}>Amount ($)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="0.00"
                                keyboardType="numeric"
                                value={withdrawAmount}
                                onChangeText={setWithdrawAmount}
                            />
                            <Text style={styles.helperText}>Available: ${balance.balance?.toFixed(2)}</Text>

                            <Text style={styles.label}>Bank Details / Notes</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="e.g. IBAN, PayPal email..."
                                multiline
                                numberOfLines={3}
                                value={withdrawDetails}
                                onChangeText={setWithdrawDetails}
                            />

                            <TouchableOpacity
                                style={[styles.confirmButton, processing && styles.disabledButton]}
                                onPress={handleWithdraw}
                                disabled={processing}
                            >
                                {processing ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text style={styles.confirmButtonText}>Confirm Withdrawal</Text>
                                )}
                            </TouchableOpacity>
                        </View>
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
        backgroundColor: '#16a34a',
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
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        marginTop: 12,
        color: '#6b7280',
    },
    balanceContainer: {
        backgroundColor: '#16a34a',
        paddingHorizontal: 24,
        paddingBottom: 32,
        alignItems: 'center',
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    balanceLabel: {
        color: '#dcfce7',
        fontSize: 14,
        marginBottom: 8,
    },
    balanceValue: {
        color: 'white',
        fontSize: 40,
        fontWeight: 'bold',
        marginBottom: 24,
    },
    withdrawButton: {
        backgroundColor: 'white',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 24,
    },
    withdrawButtonText: {
        color: '#16a34a',
        fontWeight: 'bold',
        fontSize: 14,
    },
    listContainer: {
        flex: 1,
        paddingTop: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
        marginLeft: 16,
        marginBottom: 12,
    },
    list: {
        padding: 16,
    },
    transactionCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    transactionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    transactionType: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
    },
    transactionAmount: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    transactionDate: {
        fontSize: 12,
        color: '#6b7280',
        marginBottom: 4,
    },
    transactionDesc: {
        fontSize: 14,
        color: '#4b5563',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 48,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: 16,
    },
    emptyText: {
        color: '#6b7280',
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
        paddingBottom: 32,
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
    helperText: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 4,
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
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    confirmButton: {
        backgroundColor: '#16a34a',
        marginTop: 32,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    disabledButton: {
        backgroundColor: '#86efac',
    },
    confirmButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
