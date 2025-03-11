// app/bookmarks.tsx
import React, { useState, useCallback } from 'react';
import { 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Image,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Text, View } from '@/components/Themed';
import { Link, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import dayjs from 'dayjs';

interface Bookmark {
  bookmark_id: string;
  book_id: string;
  chapter_number: number;
  book_title: string;
  cover_url: string;
  author: string;
  chapter_title: string;
  created_at: string;
}

export default function BookmarkScreen() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookmarks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('提示', '请先登录');
        return;
      }

      const response = await fetch('http://192.168.111.30:3000/api/bookmarks', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) throw new Error(`请求失败：${response.status}`);
      
      const data = await response.json();
      setBookmarks(data);
    } catch (err: any) {
      setError(err.message);
      Alert.alert('错误', '获取书签失败');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDelete = async (bookmarkId: string) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`http://192.168.111.30:3000/api/bookmarks/${bookmarkId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('删除失败');
      
      setBookmarks(prev => 
        prev.filter(b => b.bookmark_id !== bookmarkId)
      );
      Alert.alert('成功', '书签已删除');
    } catch (error) {
      Alert.alert('错误', '删除失败，请重试');
    }
  };

  useFocusEffect(useCallback(() => {
    fetchBookmarks();
  }, []));

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>加载书签中...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={fetchBookmarks}
        >
          <Text style={styles.retryText}>点击重试</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={bookmarks}
        keyExtractor={item => item.bookmark_id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Link
              href={{
                pathname: '/reader',
                params: { 
                  bookId: item.book_id,
                  // chapterNumber: item.chapter_number.toString()
                  chapterNumber: item.chapter_number
                }
              }}
              asChild
            >
              <TouchableOpacity style={styles.bookContent}>
                <Image
                  source={{ uri: item.cover_url }}
                  style={styles.cover}
                />
                <View style={styles.info}>
                  <Text style={styles.bookTitle} numberOfLines={1}>
                    {item.book_title}
                  </Text>
                  <Text style={styles.author}>{item.author}</Text>
                  
                  <View style={styles.chapterInfo}>
                    <Text style={styles.chapterNumber}>
                      第 {item.chapter_number} 章
                    </Text>
                    <Text 
                      style={styles.chapterTitle}
                      numberOfLines={1}
                    >
                      {item.chapter_title}
                    </Text>
                  </View>
{/* 
                  <Text style={styles.time}>
                    {dayjs(item.created_at).format('YYYY-MM-DD HH:mm')}
                  </Text> */}
                </View>
              </TouchableOpacity>
            </Link>

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDelete(item.bookmark_id)}
            >
              <Text style={styles.deleteText}>删除</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>还没有任何书签哦</Text>
            <Text style={styles.emptyHint}>在章节内长按文本添加书签</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContent: {
    padding: 16,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  bookContent: {
    flex: 1,
    flexDirection: 'row',
  },
  cover: {
    width: 60,
    height: 80,
    borderRadius: 6,
    marginRight: 12,
  },
  info: {
    flex: 1,
    justifyContent: 'space-between',
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  author: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  chapterInfo: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  chapterNumber: {
    fontSize: 14,
    color: '#007AFF',
    marginRight: 8,
  },
  chapterTitle: {
    flex: 1,
    fontSize: 14,
    color: '#444',
  },
  time: {
    fontSize: 12,
    color: '#999',
    marginTop: 6,
  },
  deleteButton: {
    justifyContent: 'center',
    paddingLeft: 16,
  },
  deleteText: {
    color: '#ff4444',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#007AFF',
    borderRadius: 25,
  },
  retryText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  empty: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyImage: {
    width: 120,
    height: 120,
    opacity: 0.8,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  emptyHint: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
});