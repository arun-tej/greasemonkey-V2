import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../../services/api';
import { Post } from '../../types';
import { theme } from '../../styles/theme';
import { Card, Button } from '../../components/ui';

const FeedScreen = ({ navigation }: any) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const response = await apiService.getPosts();
      setPosts((response as any)?.items || []);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    loadPosts();
  };

  const renderPost = ({ item }: { item: Post }) => (
    <Card style={styles.postCard}>
      <TouchableOpacity 
        onPress={() => navigation.navigate('PostDetail', { postId: item.id })}
      >
        <View style={styles.postHeader}>
          <View style={styles.authorInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {item.author.username.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View>
              <Text style={styles.authorName}>{item.author.username}</Text>
              <Text style={styles.garageName}>{item.garage.name}</Text>
            </View>
          </View>
          <Text style={styles.timestamp}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>

        <Text style={styles.postTitle}>{item.title}</Text>
        <Text style={styles.postBody} numberOfLines={3}>
          {item.body}
        </Text>

        <View style={styles.postFooter}>
          <View style={styles.scoreContainer}>
            <Ionicons name="arrow-up" size={16} color={theme.colors.primary.orange} />
            <Text style={styles.scoreText}>{item.score}</Text>
          </View>
          <View style={styles.tagsContainer}>
            {item.tags.map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      </TouchableOpacity>
    </Card>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.colors.primary.orange} />
        <Text style={styles.loadingText}>Loading feed...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Feed</Text>
        <TouchableOpacity 
          style={styles.createButton}
          onPress={() => navigation.navigate('CreatePost')}
        >
          <Ionicons name="add" size={24} color={theme.colors.primary.orange} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.DEFAULT,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingTop: 60,
    paddingBottom: theme.spacing.xl,
    backgroundColor: theme.colors.background.DEFAULT,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize['3xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.foreground.DEFAULT,
  },
  createButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  listContainer: {
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
  },
  postCard: {
    marginBottom: theme.spacing.lg,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary.orange,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  avatarText: {
    color: theme.colors.primary.foreground,
    fontWeight: theme.typography.fontWeight.bold,
    fontSize: theme.typography.fontSize.base,
  },
  authorName: {
    color: theme.colors.foreground.DEFAULT,
    fontWeight: theme.typography.fontWeight.semibold,
    fontSize: theme.typography.fontSize.sm,
  },
  garageName: {
    color: theme.colors.foreground.muted,
    fontSize: theme.typography.fontSize.xs,
  },
  timestamp: {
    color: theme.colors.foreground.muted,
    fontSize: theme.typography.fontSize.xs,
  },
  postTitle: {
    color: theme.colors.foreground.DEFAULT,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing.sm,
  },
  postBody: {
    color: theme.colors.foreground.muted,
    fontSize: theme.typography.fontSize.sm,
    lineHeight: 20,
    marginBottom: theme.spacing.md,
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreText: {
    color: theme.colors.primary.orange,
    marginLeft: 4,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: theme.colors.primary.orange,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.md,
    marginLeft: 4,
  },
  tagText: {
    color: theme.colors.primary.foreground,
    fontSize: 10,
    fontWeight: theme.typography.fontWeight.medium,
  },
  loadingText: {
    color: theme.colors.foreground.muted,
    marginTop: 10,
    fontSize: theme.typography.fontSize.base,
  },
});

export default FeedScreen;