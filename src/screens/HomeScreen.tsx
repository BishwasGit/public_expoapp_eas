import React, { useContext } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { AuthContext } from '../context/AuthContext';

export default function HomeScreen({ navigation }: any) {
  const { user, logout } = useContext(AuthContext);

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="px-6 pt-12 pb-6">
        <View className="flex-row justify-between items-center mb-8">
          <View>
            <Text className="text-2xl font-bold text-gray-800">
              Hello, {user?.alias}!
            </Text>
            <Text className="text-gray-600 capitalize">
              {user?.role.toLowerCase()}
            </Text>
          </View>
          <TouchableOpacity
            className="bg-red-500 px-4 py-2 rounded-lg"
            onPress={logout}
          >
            <Text className="text-white font-semibold">Logout</Text>
          </TouchableOpacity>
        </View>

        {user?.role === 'PATIENT' && (
          <View className="space-y-4">
            <TouchableOpacity
              className="bg-blue-600 p-6 rounded-xl"
              onPress={() => navigation.navigate('Psychologists')}
            >
              <Text className="text-white text-xl font-bold mb-2">
                Find Psychologist
              </Text>
              <Text className="text-blue-100">
                Browse and book sessions with professionals
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-green-600 p-6 rounded-xl mt-4"
              onPress={() => navigation.navigate('MySessions')}
            >
              <Text className="text-white text-xl font-bold mb-2">
                My Sessions
              </Text>
              <Text className="text-green-100">
                View upcoming and past sessions
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {user?.role === 'PSYCHOLOGIST' && (
          <View className="space-y-4">
            <TouchableOpacity
              className="bg-purple-600 p-6 rounded-xl"
              onPress={() => navigation.navigate('MySessions')}
            >
              <Text className="text-white text-xl font-bold mb-2">
                My Sessions
              </Text>
              <Text className="text-purple-100">
                Manage your appointments
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-indigo-600 p-6 rounded-xl mt-4"
              onPress={() => navigation.navigate('Profile')}
            >
              <Text className="text-white text-xl font-bold mb-2">
                My Profile
              </Text>
              <Text className="text-indigo-100">
                Update your information
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
