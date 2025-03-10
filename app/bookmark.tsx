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
  chapter_id: string;
  created_at: string;
  book_title: string;
  chapter_title: string;
  cover_url: string;
}

export default function BookmarkScreen() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookmarks = useCallback(async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const response = await fetch('http://127.0.0.1:3000/bookmarks', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('获取书签失败');
      const data = await response.json();
      setBookmarks(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteBookmark = async (bookmarkId: string) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`http://127.0.0.1:3000/bookmarks/${bookmarkId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('删除失败');
      setBookmarks(prev => prev.filter(b => b.bookmark_id !== bookmarkId));
      Alert.alert('成功', '书签已删除');
    } catch (error) {
      Alert.alert('错误', '删除失败，请重试');
    }
  };

  useFocusEffect(useCallback(() => {
    fetchBookmarks();
  }, []));

  // ...保持加载和错误状态渲染不变

  return (
    <View style={styles.container}>
      <FlatList
        data={bookmarks}
        keyExtractor={item => item.bookmark_id}
        renderItem={({ item }) => (
          <View style={styles.bookmarkCard}>
            <Link
              href={{
                pathname: '/reader',
                params: { 
                  bookId: item.book_id,
                  chapterId: item.chapter_id
                }
              }}
              asChild
            >
              <TouchableOpacity style={styles.content}>
                <Image
                  source={{ uri: item.cover_url }}
                  style={styles.cover}
                />
                <View style={styles.info}>
                  <Text style={styles.bookTitle}>{item.book_title}</Text>
                  <Text style={styles.chapterTitle}>{item.chapter_title}</Text>
                  {/* <Text style={styles.time}>
                    {dayjs(item.created_at).format('YYYY-MM-DD HH:mm')}
                  </Text> */}
                </View>
              </TouchableOpacity>
            </Link>

            <TouchableOpacity 
              style={styles.deleteButton}
              onPress={() => deleteBookmark(item.bookmark_id)}
            >
              <Text style={styles.deleteText}>删除</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>暂无书签记录</Text>
            <Text style={styles.emptyHint}>在章节页面长按添加书签</Text>
          </View>
        }
      />
    </View>
  );
}

// 样式表调整
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  bookmarkCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 12,
    padding: 16,
    elevation: 2,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cover: {
    width: 50,
    height: 70,
    borderRadius: 4,
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  chapterTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  time: {
    fontSize: 12,
    color: '#999',
  },
  deleteButton: {
    justifyContent: 'center',
    paddingLeft: 16,
  },
  deleteText: {
    color: '#ff4444',
    fontWeight: '500',
  },
  empty: {
    alignItems: 'center',
    marginTop: 40,
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