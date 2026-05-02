import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthProvider, AuthContext } from './constants/AuthContext';
import { ActivityIndicator, View } from 'react-native';

// Import Screens
import CafeMenu from './app/CafeMenu';
import Auth from './app/Auth';

const Stack = createStackNavigator();

const THEME = {
  primary: '#ff9aad',
  secondary: '#F06292',
  background: '#FCE4EC',
  white: '#FFFFFF',
};

// Logic Wrapper Component for Protected Screens
const ProtectedScreen = ({ component: Component, ...props }) => {
  const { user } = useContext(AuthContext);

  if (!user) {
    return <Auth {...props} />;
  }

  return <Component {...props} />;
};

function AppContent() {
  const { loading, user } = useContext(AuthContext);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: THEME.background }}>
        <ActivityIndicator size="large" color={THEME.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="Auth" component={Auth} />
        ) : (
          <Stack.Screen name="CafeMenu" component={CafeMenu} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
