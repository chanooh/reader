import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  username: string;
  avatar_url: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isInitializing: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isInitializing: true,
  login: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const fetchUser = useCallback(async (token: string) => {
    try {
      const response = await fetch('http://127.0.0.1:3000/api/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error(`请求失败 (${response.status})`);
      }

      const userData = await response.json();
      
      // 基本数据验证
      if (!userData?.id || !userData?.username) {
        throw new Error('无效的用户数据格式');
      }

      return userData as User;
    } catch (error) {
      console.error('用户信息请求失败:', error);
      throw error;
    }
  }, []);

  const login = useCallback(async (newToken: string) => {
    try {
      console.log(newToken)
      await AsyncStorage.setItem('token', newToken);
      setToken(newToken);
      
      const userData = await fetchUser(newToken);
      setUser(userData);
    } catch (error) {
      console.error('登录流程失败:', error);
      await AsyncStorage.removeItem('token');
      setToken(null);
      setUser(null);
      throw error;
    }
  }, [fetchUser]);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }, []);

  // 初始化认证状态
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const savedToken = await AsyncStorage.getItem('token');
        if (savedToken) {
          await login(savedToken);
        }
      } catch (error) {
        console.error('自动登录失败:', error);
        await logout();
      } finally {
        setIsInitializing(false);
      }
    };

    initializeAuth();
  }, [login, logout]);

  return (
    <AuthContext.Provider 
      value={{ 
        user,
        token,
        isInitializing,
        login,
        logout 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);