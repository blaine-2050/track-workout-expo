import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from './hooks/useAuth';
import { AuthScreen } from './components/AuthScreen';
import { WorkoutScreen } from './components/WorkoutScreen';

export default function App() {
  const { isLoading, isAuthenticated, login, register, logout } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <StatusBar style="auto" />
      </View>
    );
  }

  return (
    <>
      {isAuthenticated ? (
        <WorkoutScreen onLogout={logout} />
      ) : (
        <AuthScreen onLogin={login} onRegister={register} />
      )}
      <StatusBar style="auto" />
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
