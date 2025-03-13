import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  Dimensions,
  FlatList,
  ActivityIndicator,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Alert
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { config } from "@/constants/ApiConfig";
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
 
interface Chapter {
  chapterId: string;
  title: string;
  paragraphs: string[];
}
 
export default function BookReaderScreen() {
  const [nightMode, setNightMode] = useState(false);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [hasMoreChapters, setHasMoreChapters] = useState(true);
  const [pendingRequests, setPendingRequests] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const { bookId, chapterNumber: paramChapter, totalChapters } = useLocalSearchParams();
  const initialChapter = paramChapter ? parseInt(paramChapter as string, 10) : null;
  const [readChapters, setReadChapters] = useState(0);
  const menuAnimation = useRef(new Animated.Value(0)).current;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const MIN_FONT_SIZE = 12;
  const MAX_FONT_SIZE = 24;

  const toggleMenu = () => {
    Animated.timing(menuAnimation, {
      toValue: isMenuOpen ? 0 : 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
    setIsMenuOpen(!isMenuOpen);
  };
 
  const menuTranslateY = menuAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [-20, 0]
  });
  // 初始化章节状态
  useEffect(() => {
    if (initialChapter) {
      setCurrentChapterIndex(initialChapter - 1);
      setChapters(prev => [...prev, ...Array(initialChapter - prev.length).fill(undefined)]);
    }
  }, [initialChapter]);
 
  const fetchChapter = async (chapterNumber: number) => {
    if (chapterNumber < 1 || !hasMoreChapters || chapters[chapterNumber - 1]) return;
 
    try {
      setPendingRequests(prev => prev + 1);
      const response = await fetch(
        `${config.API_BASE}/bookcontent?bookId=${bookId}&chapter=${chapterNumber}`
      );
      const data = await response.json();
 
      if (data.error === 'Chapter not found') {
        setHasMoreChapters(false);
        return;
      }
 
      setChapters(prev => {
        const newChapters = [...prev];
        newChapters[chapterNumber - 1] = data;
        return newChapters;
      });
    } catch (error) {
      console.error('获取章节数据出错：', error);
    } finally {
      setPendingRequests(prev => prev - 1);
    }
  };

  // 滚动处理函数
  const handleChapterScroll = useCallback((chapterIndex: number) => {
    return async (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
      const scrollY = contentOffset.y;
      const contentHeight = contentSize.height;
      const viewportHeight = layoutMeasurement.height;
      
  
      if (contentHeight > 0 && (scrollY + viewportHeight) / contentHeight >= 0.8) {
        // console.log(chapterIndex)
        if (chapterIndex+1>readChapters) {
          const token = await AsyncStorage.getItem('token');
          fetch(`${config.API_BASE}/api/reading-progress`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              book_id: Number(bookId),
              current_chapter: chapterIndex+1
            })
          });


          setReadChapters(chapterIndex+1)


        }
      }
    };
  }, [readChapters, chapters]);
  const adjustFontSize = (size: number) => {
    setFontSize(Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, size)));
  };

  const handleAddBookmark = async () => {
    try {
      const currentChapter = chapters[currentChapterIndex];
      if (!currentChapter) {
        Alert.alert('提示', '章节内容尚未加载完成');
        return;
      }
 
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('未登录', '请先登录后再添加书签');
        return;
      }
 
      const response = await fetch(`${config.API_BASE}/api/bookmarks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          book_id: Number(bookId),
          chapter_number: currentChapterIndex+1
      })
      });
 
      const result = await response.json();
      
      if (response.status === 409) {
        Alert.alert('提示', '该书签已存在');
        return;
      }
 
      if (!response.ok) {
        throw new Error(result.error || '添加书签失败');
      }
 
      Alert.alert('成功', '书签添加成功');
    } catch (error) {
      console.error('书签添加失败:', error);
      Alert.alert('错误', '添加书签失败，请稍后重试');
    }
  };

  const increaseFontSize = () => setFontSize(prev => Math.min(MAX_FONT_SIZE, prev + 2));
  const decreaseFontSize = () => setFontSize(prev => Math.max(MIN_FONT_SIZE, prev - 2))
 
  
  // 初始加载逻辑
  useEffect(() => {
    if (!bookId) return;
 
    const loadInitialChapters = () => {
      if (initialChapter) {
        // 加载当前章节及前后章节
        fetchChapter(initialChapter - 1);
        fetchChapter(initialChapter);
        fetchChapter(initialChapter + 1);
      } else {
        // 默认加载前两章
        fetchChapter(1);
        fetchChapter(2);
      }
    };
 
    loadInitialChapters();
  }, [bookId, initialChapter]);
 
  const handleScrollEnd = (e: any) => {
    const contentOffsetX = e.nativeEvent.contentOffset.x;
    const newIndex = Math.round(contentOffsetX / SCREEN_WIDTH);
    setCurrentChapterIndex(newIndex);
 
    // 预加载后续两章
    const nextChapter = newIndex + 2;
    if (hasMoreChapters && !chapters[nextChapter - 1]) {
      fetchChapter(nextChapter);
    }
 
    // 预加载前一章（确保有缓存）
    const prevChapter = newIndex;
    if (prevChapter > 0 && !chapters[prevChapter - 1]) {
      fetchChapter(prevChapter);
    }
  };
 
  // 滚动到初始章节
  useEffect(() => {
    if (chapters.length > currentChapterIndex) {
      flatListRef.current?.scrollToIndex({
        index: currentChapterIndex,
        animated: false,
      });
    }
  }, [chapters.length]);
 
  if (pendingRequests > 0 && !chapters.length) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }
 
  return (
    <View style={[styles.container, nightMode && styles.nightContainer]}>
      {/* 菜单触发按钮 */}
      <TouchableOpacity 
        style={styles.menuTrigger}
        onPress={toggleMenu}
        activeOpacity={0.7}>
        <Text style={[styles.menuIcon, nightMode && styles.nightText]}>
          {isMenuOpen ? '×' : '⋮'}
        </Text>
      </TouchableOpacity>
 
      {/* 折叠菜单 */}
      <Animated.View 
        style={[
          styles.menuContainer,
          nightMode && styles.nightMenu,
          {
            opacity: menuAnimation,
            transform: [{ translateY: menuTranslateY }]
          }
        ]}>
        {/* 字体控制 */}
        <View style={styles.menuGroup}>
          <TouchableOpacity
            onPress={() => adjustFontSize(fontSize - 2)}
            style={styles.menuButton}>
            <Text style={[styles.menuText, nightMode && styles.nightText]}>A-</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => adjustFontSize(fontSize + 2)}
            style={styles.menuButton}>
            <Text style={[styles.menuText, nightMode && styles.nightText]}>A+</Text>
          </TouchableOpacity>
        </View>
 
        {/* 功能按钮 */}
        <View style={styles.menuGroup}>
          <TouchableOpacity
            onPress={handleAddBookmark}
            style={styles.menuButton}>
            <Text style={[styles.menuText, nightMode && styles.nightText]}>⭐</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setNightMode(!nightMode)}
            style={styles.menuButton}>
            <Text style={[styles.menuText, nightMode && styles.nightText]}>
              {nightMode ? '🌞' : '🌙'}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
 
      {/* 内容区域 */}
      <FlatList
        ref={flatListRef}
        data={chapters}
        keyExtractor={(_, index) => `chapter-${index}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={currentChapterIndex}
        onScrollToIndexFailed={({ index }) => {
          flatListRef.current?.scrollToOffset({
            offset: index * SCREEN_WIDTH,
            animated: false
          });
        }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onMomentumScrollEnd={handleScrollEnd}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index
        })}
        renderItem={({ item, index }) => (
          <View style={styles.pageContainer}>
            {item ? (
              <>
                <Text style={[styles.chapterTitle, nightMode && styles.nightText]}>
                  {item.title}
                </Text>
                <FlatList
                  onScroll={handleChapterScroll(index)}
                  scrollEventThrottle={100}
                  data={item.paragraphs}
                  keyExtractor={(_, i) => `para-${index}-${i}`}
                  showsVerticalScrollIndicator={false}
                  style={styles.chapterContent}
                  renderItem={({ item: paragraph }) => (
                    <Text style={[
                      styles.contentText, 
                      nightMode && styles.nightText,
                      { fontSize }
                    ]}>
                      {paragraph}
                    </Text>
                  )}
                />
              </>
            ) : (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0000ff" />
              </View>
            )}
          </View>
        )}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  nightContainer: {
    backgroundColor: '#333',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuTrigger: {
    position: 'absolute',
    top: 0,
    right: 20,
    zIndex: 101,
    padding: 12,
    // backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  menuIcon: {
    fontSize: 24,
    color: '#333',
  },
  menuContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 100,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  nightMenu: {
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  menuGroup: {
    marginVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 8,
    alignItems: 'center',
  },
  menuButton: {
    padding: 8,
    marginVertical: 4,
  },
  menuText: {
    fontSize: 20,
    color: '#333',
  },
  pageContainer: {
    width: SCREEN_WIDTH,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  chapterTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  chapterContent: {
    flex: 1,
  },
  contentText: {
    marginBottom: 16,
    lineHeight: 36,
    color: '#333',
  },
  nightText: {
    color: '#fff',
  },
});