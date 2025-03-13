import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  TextInput, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator,
  Alert 
} from 'react-native';
import { Text, View } from '@/components/Themed';
import { Link } from 'expo-router';
import { config } from "@/constants/ApiConfig";
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Book {
  bookId: string;
  title: string;
  author: string;
  cover: string;
  progress: number;
  totalChapters: number;
  status: 0 | 1;
}
 
interface Category {
  collectionId: string;
  name: string;
}

function useDebounce<T extends (...args: any[]) => void>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  const timerRef = React.useRef<NodeJS.Timeout>();
 
  // 清理定时器
  React.useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);
 
  return (...args: Parameters<T>) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      func(...args);
    }, delay);
  };
}
 
export default function HomeScreen() {
  const [dailyRecommendations, setDailyRecommendations] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Book[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);

  const [errorSearch, setErrorSearch] = useState<string | null>(null);

  const debouncedSearch = useDebounce(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
 
    try {
      setLoadingSearch(true);
      const token = await AsyncStorage.getItem('token')
      const response = await fetch(
        `${config.API_BASE}/api/search?keyword=${encodeURIComponent(query)}`,{
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      Alert.alert('搜索失败', '请检查网络连接');
    } finally {
      setLoadingSearch(false);
    }
  }, 500); // 500ms防抖间隔

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    debouncedSearch(text);
  };

  const renderSearchResults = () => {
    if (!searchQuery) return null;
 
    if (loadingSearch) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#007AFF" />
        </View>
      );
    }
 
    if (errorSearch) {
      return (
        <Text style={styles.errorText}>搜索失败：{errorSearch}</Text>
      );
    }
 
    return (
      <FlatList
        data={searchResults}
        keyExtractor={(item) => item.bookId}
        renderItem={({ item }) => (
          <Link
            href={{
              pathname: '/reader',
              params: { bookId: item.bookId }
            }}
            asChild
          >
            <TouchableOpacity style={styles.searchItem}>
              <Image 
                source={{ uri: item.cover }} 
                style={styles.searchCover}
              />
              <View style={styles.searchInfo}>
                <Text style={styles.searchTitle}>{item.title}</Text>
                <Text style={styles.searchAuthor}>{item.author}</Text>
                <View style={styles.progressContainer}>
                  <Text style={styles.progressText}>
                    {item.status === 1 ? '已收藏' : '未收藏'} · 
                    阅读进度 {(item.progress * 100).toFixed(0)}%
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </Link>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>没有找到相关书籍</Text>
        }
      />
    );
  };
 
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 并行请求两个接口
        const [recommendationsRes, categoriesRes] = await Promise.all([
          fetch(`${config.API_BASE}/api/recommendations`),
          fetch(`${config.API_BASE}/api/categories`)
        ]);
 
        // 处理推荐数据
        if (!recommendationsRes.ok) throw new Error('推荐数据获取失败');
        const recommendationsData = await recommendationsRes.json();
        setDailyRecommendations(recommendationsData);
 
        // 处理分类数据
        if (!categoriesRes.ok) throw new Error('分类数据获取失败');
        const categoriesData = await categoriesRes.json();
        setCategories(categoriesData);
 
      } catch (err:any) {
        setError(err.message);
        Alert.alert('错误', '数据加载失败，请检查网络连接');
      } finally {
        setLoading(false);
      }
    };
 
    fetchData();
  }, []);
 
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
      {/* 搜索框 */}
      <TextInput
        style={styles.searchBox}
        placeholder="搜索书籍..."
        placeholderTextColor="#999"
        value={searchQuery}
        onChangeText={handleSearchChange}
      />

      {searchQuery ? (
        renderSearchResults()
      ) : (
        <>
      {/* 每日推荐书籍卡片 */}
      <Text style={styles.sectionTitle}>📚 每日推荐</Text>
      <FlatList
        data={dailyRecommendations}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.bookId}
        renderItem={({ item }) => (
          <Link
            href={{
              pathname: '/reader',
              params: { bookId: item.bookId }
            }}
            style={styles.cardLink}
            asChild>
            <TouchableOpacity style={styles.card}>
              <View style={styles.imageContainer}>
                <Image 
                  source={{ uri: item.cover }} 
                  style={styles.coverImage}
                  resizeMode="cover"
                />
              </View>
              <View style={styles.cardTextContainer}>
                <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.cardAuthor}>{item.author}</Text>
              </View>
            </TouchableOpacity>
          </Link>
        )}
        contentContainerStyle={styles.cardList}
        ListEmptyComponent={<Text style={styles.emptyText}>暂无推荐书籍</Text>}
      />
 
      {/* 类型合集卡片 */}
      <Text style={styles.sectionTitle}>📖 书籍分类</Text>
      <FlatList
        data={categories}
        numColumns={2}
        columnWrapperStyle={styles.categoryRow}
        keyExtractor={(item) => item.collectionId}
        renderItem={({ item }) => (
          <Link
            href={{
              pathname: '/collection',
              params: { collectionId: item.collectionId }
            }}
            asChild>
            <TouchableOpacity style={styles.categoryCard}>
              <Text style={styles.categoryText}>{item.name}</Text>
            </TouchableOpacity>
          </Link>
        )}
        contentContainerStyle={styles.categoryList}
        ListEmptyComponent={<Text style={styles.emptyText}>暂无分类信息</Text>}
      />
        </>
      )}
 

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  searchBox: {
    height: 45,
    backgroundColor: 'white',
    borderRadius: 24,
    paddingHorizontal: 24,
    fontSize: 16,
    marginBottom: 24,
    // 阴影效果
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    color: '#2c3e50',
    marginLeft: 8,
  },
  cardList: {
    paddingLeft: 8,
    marginBottom: 2,
  },
  cardLink:{
    marginRight: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingTop: 5,
    width: 160,
    height: 275,
    // 阴影效果
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  coverImage: {
    width: '100%',
    height: "100%",
    objectFit: 'contain',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  cardTextContainer: {
    padding: 12,
    backgroundColor: 'transparent',
  },
  cardTitle: {
    fontWeight: '600',
    fontSize: 14,
    marginBottom: 4,
    color: '#34495e',
  },
  cardAuthor: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  categoryList: {
    paddingHorizontal: 8,
  },
  categoryRow: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  categoryCard: {
    backgroundColor: '#e8f4f8',
    width: '48%',
    paddingVertical: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    // 阴影效果
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2980b9',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center'
  },
  emptyText: {
    padding: 20,
    color: '#666',
    textAlign: 'center'
  },
  imageContainer: {
    height: 200,
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden'
  },
  // searchBox: {
  //   height: 40,
  //   margin: 16,
  //   paddingHorizontal: 12,
  //   borderRadius: 8,
  //   backgroundColor: '#fff',
  //   fontSize: 16,
  // },
  searchItem: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
  },
  searchCover: {
    width: 60,
    height: 80,
    borderRadius: 4,
  },
  searchInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  searchTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  searchAuthor: {
    fontSize: 14,
    color: '#666',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressText: {
    fontSize: 12,
    color: '#888',
  },
});