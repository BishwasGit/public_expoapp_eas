import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { AuthContext, AuthProvider } from './src/context/AuthContext';

// Screens
import BookSessionScreen from './src/screens/BookSessionScreen';
import ChatScreen from './src/screens/ChatScreen';
import CreateSessionScreen from './src/screens/CreateSessionScreen';
import EarningsScreen from './src/screens/EarningsScreen';
import FindPsychologistScreen from './src/screens/FindPsychologistScreen';
import GalleryScreen from './src/screens/GalleryScreen';
import LoginScreen from './src/screens/LoginScreen';
import MessagesScreen from './src/screens/MessagesScreen';
import MyProfileScreen from './src/screens/MyProfileScreen';
import MyServicesScreen from './src/screens/MyServicesScreen';
import MySessionsScreen from './src/screens/MySessionsScreen';
import PatientDashboard from './src/screens/PatientDashboard';
import PsychologistDashboard from './src/screens/PsychologistDashboard';
import PsychologistProfileScreen from './src/screens/PsychologistProfileScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import SessionDetailScreen from './src/screens/SessionDetailScreen';
import SessionRequestsScreen from './src/screens/SessionRequestsScreen';
import SessionScreen from './src/screens/SessionScreen';



const Stack = createNativeStackNavigator();

function Navigation() {
  const { isAuthenticated, isLoading, user } = React.useContext(AuthContext);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#2563eb',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        {!isAuthenticated ? (
          <>
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Register"
              component={RegisterScreen}
              options={{ headerShown: false }}
            />
          </>
        ) : (
          <>
            {user?.role === 'PSYCHOLOGIST' ? (
              <>
                <Stack.Screen
                  name="PsychologistDashboard"
                  component={PsychologistDashboard}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="MySessions"
                  component={MySessionsScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="SessionDetail"
                  component={SessionDetailScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="MyProfile"
                  component={MyProfileScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="MyServices"
                  component={MyServicesScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="Earnings"
                  component={EarningsScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="Gallery"
                  component={GalleryScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="CreateSession"
                  component={CreateSessionScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="SessionRequests"
                  component={SessionRequestsScreen}
                  options={{ headerShown: false }}
                />
              </>
            ) : (
              <>
                <Stack.Screen
                  name="PatientDashboard"
                  component={PatientDashboard}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="FindPsychologist"
                  component={FindPsychologistScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="PsychologistProfile"
                  component={PsychologistProfileScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="BookSession"
                  component={BookSessionScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="MySessions"
                  component={MySessionsScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="Gallery"
                  component={GalleryScreen}
                  options={{ headerShown: false }}
                />
              </>
            )}
            <Stack.Screen
              name="Messages"
              component={MessagesScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Chat"
              component={ChatScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Session"
              component={SessionScreen}
              options={{ headerShown: false }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}


export default function App() {
  return (
    <AuthProvider>
      <Navigation />
    </AuthProvider>
  );
}
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#374151',
  },
});
