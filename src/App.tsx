import { useEffect } from 'react';
import { useAuthStore } from './features/auth/store';
import { AuthScreen } from './features/auth/AuthScreen';
import { MainApp } from './app/MainApp';

function App() {
  const { isAuthenticated, publicKey, authenticate } = useAuthStore();

  useEffect(() => {
    // Auto-authenticate if we have stored keys
    if (publicKey && !isAuthenticated) {
      authenticate();
    }
  }, [publicKey, isAuthenticated, authenticate]);

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  return <MainApp />;
}

export default App;
