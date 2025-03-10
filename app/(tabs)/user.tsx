import React, { useEffect, useState } from 'react';
import { StyleSheet, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { View, Text } from '@/components/Themed';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  username: string;
  avatar_url: string;
}

 
export default function UserScreen() {

  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();

  const getStorage = async () => {
    const token = await AsyncStorage.getItem('token') ?? ''; 
    console.log(token)
    const userData = await AsyncStorage.getItem('userData') ?? ''; 
    const userDataJson = JSON.parse(userData); 
    setToken(token);
    setUser(userDataJson);
  };

  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = await AsyncStorage.getItem('token');
      const storedUser = await AsyncStorage.getItem('userData');
  
      if (!storedToken) {
        router.replace('/login');
        return;
      }
  
      // 更新状态
      setToken(storedToken);
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    };
  
    checkAuth();
  }, []);

  // 处理退出登录
  const handleLogout = async () => {
    // logout();
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('userData');
    router.replace('/login');
  };
 const handleBookmark = async () => {
  router.push('/bookmark');
 }
  return (
    <View style={styles.container}>
      {/* 个人信息卡片 */}
      <View style={styles.profileCard}>
        <Link href="/edit" asChild>
          <TouchableOpacity style={styles.avatarContainer}>
            <Image 
              source={{ uri: user?.avatar_url || 'https://via.placeholder.com/100' }} 
              style={styles.avatar}
            />
            <View style={styles.avatarEditBadge}>
              <Ionicons name="camera" size={16} color="white" />
            </View>
          </TouchableOpacity>
        </Link>
        
        <View style={styles.profileDetails}>
          <Text style={styles.name}>{user?.username || '未命名用户'}</Text>
        </View>
 
        <Link href="/edit" asChild>
          <TouchableOpacity style={styles.editButton}>
            <Ionicons name="pencil" size={22} color="#4A90E2" />
          </TouchableOpacity>
        </Link>
      </View>
 
      {/* 功能列表 */}
      <View style={styles.listContainer}>
        <View style={styles.listGroup}>
          {/* <Link href="/bookmark" asChild>

          </Link> */}
          <ListItem 
              icon="bookmark" 
              label="我的书签"  
              onPress={handleBookmark} 
              color="#FFA726"
            />
          <ListItem 
            icon="log-out" 
            label="退出登录" 
            onPress={handleLogout} 
            color="#EF5350"
            isLast
          />
        </View>
      </View>
    </View>
  );
}
 
// 列表项组件保持不变
const ListItem = ({ icon, label, href, color, isLast, onPress }: any) => (
  <TouchableOpacity 
    style={[styles.listItem, !isLast && styles.listItemBorder]}
    activeOpacity={0.8}
    onPress={onPress}
  >
    <View style={styles.listItemContent}>
      <View style={styles.left}>
        <View style={[styles.iconContainer]}>
          <Ionicons name={icon} size={22} color={color} />
        </View>
        <Text style={[styles.listItemText, { color }]}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
    </View>
  </TouchableOpacity>
);
 
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 20,
  },
  profileCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    marginVertical: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#4B5563',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#E5E7EB',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    padding: 4,
  },
  profileDetails: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },

  editButton: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 10,
    marginLeft: 12,
  },
  listContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#4B5563',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  listGroup: {
    paddingHorizontal: 16,
  },
  listItem: {
    paddingVertical: 18,
  },
  listItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  listItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    borderRadius: 10,
    padding: 8,
    marginRight: 12,
  },
  listItemText: {
    fontSize: 16,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 16,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryText: {
    color: 'white',
    fontWeight: '500',
  },
});