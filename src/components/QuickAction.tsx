import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface QuickActionProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    onPress: () => void;
    color?: string;
}

export default function QuickAction({ icon, title, description, onPress, color = 'bg-blue-600' }: QuickActionProps) {
    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.8}
            className={`${color} p-5 rounded-xl mb-3`}
        >
            <View className="flex-row items-center mb-2">
                {icon}
                <Text className="text-white text-lg font-bold ml-2">{title}</Text>
            </View>
            <Text className="text-white/80 text-sm">{description}</Text>
        </TouchableOpacity>
    );
}
