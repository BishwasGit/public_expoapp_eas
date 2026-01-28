import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface StatCardProps {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    trend?: string;
    color: string;
    onPress?: () => void;
}

export default function StatCard({ icon, label, value, trend, color, onPress }: StatCardProps) {
    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={!onPress}
            activeOpacity={onPress ? 0.7 : 1}
            className="bg-white p-4 rounded-xl shadow-sm border border-gray-100"
        >
            <View className="flex-row items-center justify-between mb-2">
                <View className={`p-2 rounded-lg ${color}`}>
                    {icon}
                </View>
            </View>
            <Text className="text-gray-500 text-xs font-medium">{label}</Text>
            <Text className="text-2xl font-bold text-gray-900 my-1">{value}</Text>
            {trend && <Text className="text-xs text-gray-400">{trend}</Text>}
        </TouchableOpacity>
    );
}
