import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  Dimensions,
  FlatList,
  ActivityIndicator
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
 
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
  const { bookId, chapterNumber: paramChapter } = useLocalSearchParams();
  const initialChapter = paramChapter ? parseInt(paramChapter as string, 10) : null;
 
  // 初始化章节状态
  useEffect(() => {
    if (initialChapter) {
      setCurrentChapterIndex(initialChapter - 1);
      // 预初始化数组长度确保能滚动到指定位置
      setChapters(prev => [...prev, ...Array(initialChapter - prev.length).fill(undefined)]);
    }
  }, [initialChapter]);
 
  const fetchChapter = async (chapterNumber: number) => {
    if (chapterNumber < 1 || !hasMoreChapters || chapters[chapterNumber - 1]) return;
 
    try {
      setPendingRequests(prev => prev + 1);
      const response = await fetch(
        `http://192.168.111.30:3000/bookcontent?bookId=${bookId}&chapter=${chapterNumber}`
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
      <View style={[styles.header, { zIndex: 10 }]}>
        <TouchableOpacity onPress={() => {}}>
          <Text style={[styles.icon, styles.bookmarked]}>🔖</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setNightMode((prev) => !prev)}>
          <Text style={styles.icon}>{nightMode ? '🌞' : '🌙'}</Text>
        </TouchableOpacity>
      </View>
 
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
                  data={item.paragraphs}
                  keyExtractor={(_, i) => `para-${index}-${i}`}
                  showsVerticalScrollIndicator={false}
                  style={styles.chapterContent}
                  renderItem={({ item: paragraph }) => (
                    <Text style={[styles.contentText, nightMode && styles.nightText]}>
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
  header: {
    position: 'absolute',
    top: 5,

    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
  },
  link: {
    fontSize: 20,
    color: '#4A90E2',
  },
  chapterTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  chapterContent: {
    flex: 1,
  },
  contentText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    marginBottom: 10,
  },
  nightText: {
    color: '#fff',
  },
  pageContainer: {
    width: SCREEN_WIDTH,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  icon: {
    fontSize: 24,
    color: '#000',
  },
  bookmarked: {
    color: '#FFD700',
  },
  
});

