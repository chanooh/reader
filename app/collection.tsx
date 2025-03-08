import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator,
  Alert 
} from 'react-native';
import { Text, View } from '@/components/Themed';
import { Link, useLocalSearchParams } from 'expo-router';
 
interface Book {
  bookId: string;
  title: string;
  author: string;
  cover: string;
  progress: number; // 0-1之间的进度值
}
 
export default function CollectionScreen() {
  const { collectionId } = useLocalSearchParams();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
 
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const response = await fetch(
          `http://192.168.111.30:3000/api/collections/${collectionId}/books`
        );
        
        if (!response.ok) throw new Error('请求失败');
        
        const data = await response.json();
        setBooks(data);
      } catch (err:any) {
        setError(err.message);
        Alert.alert('错误', '无法获取书籍数据');
      } finally {
        setLoading(false);
      }
    };
 
    fetchBooks();
  }, [collectionId]);
 
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }
 
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
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
              params: { bookId: item.bookId }
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
                <View style={[styles.progressBar, { width: `${item.progress * 100}%` }]} />
                  <Text style={styles.progressText}>
                    {`已阅读 ${(item.progress * 100).toFixed(0)}%`}
                  </Text>
                </View>
              </View>
 
              <View style={styles.joinTag}>
                <Text style={styles.joinText}>加入书架</Text>
              </View>
            </TouchableOpacity>
          </Link>
        )}
        contentContainerStyle={styles.bookList}
        ListEmptyComponent={
          <Text style={styles.emptyText}>该分类下暂无书籍</Text>
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
  joinTag: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#c6f6d5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  joinText: {
    fontSize: 12,
    color: '#22543d',
    fontWeight: '500',
  },
  emptyText: {
    color: '#666666',      // 中性灰色
    fontSize: 16,          // 标准阅读字号
    textAlign: 'center',    // 文字居中
    marginTop: 40,         // 与上方内容间距
    lineHeight: 24,        // 舒适行高
    paddingHorizontal: 20  // 两侧留白
  },
 
  // 错误提示文本样式
  errorText: {
    color: '#DC2626',      // 醒目红色（Tailwind red-600）
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',     // 中等字重
    lineHeight: 24,
    paddingHorizontal: 20
  },
 
  // 错误容器样式
  errorContainer: {
    flex: 1,               // 充满容器
    justifyContent: 'center', // 垂直居中
    alignItems: 'center',   // 水平居中
    backgroundColor: '#FEF2F2', // 浅红色背景（Tailwind red-50）
    padding: 24            // 内边距
  },
 
  // 加载容器样式
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)' // 半透明白色叠加层
  }
});