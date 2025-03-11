import React,  { useEffect, useState, useCallback } from 'react';
import { 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Image,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Text, View } from '@/components/Themed';
import { Link, useRouter,useFocusEffect  } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
 
interface Book {
  bookId: string;
  title: string;
  author: string;
  cover: string;
  currentChapter:number;
  progress: number;
}
 
export default function BookScreen() {
  const router = useRouter();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const storedToken = await AsyncStorage.getItem('token');
      
      if (!storedToken) {
        router.replace('/login');
        return;
      }
 
      const response = await fetch(
        'http://192.168.111.30:3000/api/user_books',
        { headers: { Authorization: `Bearer ${storedToken}` } }
      );
 
      if (!response.ok) throw new Error('请求失败');
      setBooks(await response.json());
      setError(null);
    } catch (err: any) {
      setError(err.message);
      Alert.alert('错误', '获取书架数据失败');
    } finally {
      setLoading(false);
    }
  }, []);
 
  // 认证检查 & 获取数据
  useFocusEffect(
    useCallback(() => {
      fetchData();
      
      // 可选：清理函数（如果需要取消请求）
      return () => {
        // 这里可以添加请求中止逻辑
      };
    }, [fetchData])
  );
 
 
  // 移出书架操作
  const handleRemoveBook = async (bookId: string) => {
    try {
      const storedToken = await AsyncStorage.getItem('token');
      if (!storedToken) return;
 
      const response = await fetch(
        `http://192.168.111.30:3000/api/user_books/${bookId}`,
        { method: 'DELETE', headers: { Authorization: `Bearer ${storedToken}`, } }
      );
 
      if (!response.ok) throw new Error('操作失败');
      
      // 修改：重新获取最新数据而不是本地过滤
      await fetchData();
      Alert.alert('成功', '已移出书架');
    } catch (error) {
      Alert.alert('错误', '操作失败，请重试');
    }
  };
 
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    );
  }
 
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => router.replace('/book')}
        >
          <Text style={styles.retryText}>点击重试</Text>
        </TouchableOpacity>
      </View>
    );
  }
 
  return (
    <View style={styles.container}>
      <FlatList
        data={books}
        keyExtractor={(item) => item.bookId}
        renderItem={({ item }) => (

            <Link
              href={{
                pathname: '/reader',
                params: { bookId: item.bookId, chapterNumber:item.currentChapter }
              }}
              asChild
            >
              <TouchableOpacity style={styles.bookCard} activeOpacity={0.8}>
                <Image 
                  source={{ uri: item.cover }} 
                  style={styles.coverImage}
                  resizeMode="cover"
                />
                
                <View style={styles.bookInfo}>
                  <Text style={styles.bookTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.bookAuthor}>{item.author}</Text>
                  
                  <View style={styles.progressContainer}>
                    <View style={[styles.progressBar, { 
                      width: `${item.progress * 100}%` 
                    }]} />
                    <Text style={styles.progressText}>
                      {`已阅读 ${(item.progress * 100).toFixed(0)}%`}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                style={[styles.removeTag]}
                onPress={() => handleRemoveBook(item.bookId)}
              >

                 <View  style={styles.removeButton}>
                  <Text style={styles.removeText}>移出书架</Text>
                </View>
              </TouchableOpacity>
              </TouchableOpacity>
            </Link>


        )}
        contentContainerStyle={styles.bookList}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>书架空空如也</Text>
            <Text style={styles.emptySubText}>快去添加喜欢的书籍吧</Text>
          </View>
        }
      />
    </View>
  );
}
 

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2c3e50',
    marginVertical: 24,
    marginLeft: 8,
    letterSpacing: 0.8,
  },
  bookList: {
    paddingBottom: 40,
  },
  bookCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
    alignItems: 'center',
    // 阴影效果
    shadowColor: '#4a5568',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  coverImage: {
    width: 80,
    height: 120,
    borderRadius: 8,
    marginRight: 16,
    // 封面装饰边框
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  bookInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  bookTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 6,
    maxWidth: '90%',
  },
  bookAuthor: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 12,
  },
  progressContainer: {
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#48bb78',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#718096',
  },


  bookContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  removeButton: {
    backgroundColor: '#778899',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 4,
  },
  removeText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '500',
  },

  removeTag: {
    position: 'absolute',
    top: 12,
    right: 12,
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
    color: 'red',
    fontSize: 16,
    marginBottom: 12,
  },
  retryButton: {
    padding: 12,
    backgroundColor: '#007AFF',
    borderRadius: 6,
  },
  retryText: {
    color: 'white',
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },

});