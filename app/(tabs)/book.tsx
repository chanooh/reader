import React from 'react';
import { StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { Text, View } from '@/components/Themed';
import { Link } from 'expo-router';

const bookshelf = [
  { bookId: '6', title: '朝花夕拾', author: '鲁迅', cover: 'https://pic.arkread.com/cover/ebook/f/434328855.1686022830.jpg!cover_default.jpg' },
  { bookId: '7', title: '骆驼祥子', author: '老舍', cover: 'https://pic.arkread.com/cover/ebook/f/434328855.1686022830.jpg!cover_default.jpg' },
  { bookId: '8', title: '藤野先生', author: '鲁迅', cover: 'https://pic.arkread.com/cover/ebook/f/434328855.1686022830.jpg!cover_default.jpg' },
  { bookId: '1', title: '钢铁是怎样炼成的', author: '尼古拉·奥斯特洛夫斯基', cover: 'https://pic.arkread.com/cover/ebook/f/434328855.1686022830.jpg!cover_default.jpg' },
  { bookId: '2', title: '祝福', author: '鲁迅', cover: 'https://pic.arkread.com/cover/ebook/f/434328855.1686022830.jpg!cover_default.jpg' },
];;

export default function BookScreen() {
  // const handleBookPress = (book: any) => {
  //   console.log('Book pressed:', book.title);
  // };

  // 模拟阅读进度
  const getProgress: any = () => Math.random().toFixed(2);

  return (
    <View style={styles.container}>
      {/* <Text style={styles.headerTitle}>📖 我的书架</Text> */}
      <FlatList
        data={bookshelf}
        keyExtractor={(item) => item.bookId}
        renderItem={({ item }) => (
          <Link
          href={{
            pathname: '/reader',
            params: { collectionId: item.bookId }
            }}
            asChild>
          <TouchableOpacity 
            style={styles.bookCard}
            activeOpacity={0.8}
          >
            <Image 
              source={{ uri: item.cover }} 
              style={styles.coverImage}
              resizeMode="cover"
            />
            
            <View style={styles.bookInfo}>
              <Text style={styles.bookTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.bookAuthor}>{item.author}</Text>
              
              {/* 阅读进度条 */}
              <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { width: `${getProgress() * 100}%` }]} />
                <Text style={styles.progressText}>
                  {`已阅读 ${(getProgress() * 100).toFixed(0)}%`}
                </Text>
              </View>
            </View>

            {/* 右上角分类标签 */}
            <View style={styles.removeTag}>
              <Text style={styles.removeText}>移出书架</Text>
            </View>
          </TouchableOpacity>
          </Link>

        )}
        contentContainerStyle={styles.bookList}
        showsVerticalScrollIndicator={false}
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
  removeTag: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#c6f6d5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  removeText: {
    fontSize: 12,
    color: '#22543d',
    fontWeight: '500',
  },
});