import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/api';

interface Post {
  id: string;
  content: string;
  author_username: string;
  author_full_name: string;
  garage_name?: string;
  created_at: string;
  like_count: number;
  dislike_count: number;
  comment_count: number;
  user_vote?: 'like' | 'dislike';
  hashtags: string[];
}

interface Comment {
  id: string;
  content: string;
  author_username: string;
  author_full_name: string;
  created_at: string;
  like_count: number;
  user_liked: boolean;
}

const PostDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const { postId } = route.params as { postId: string };
  
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPostAndComments();
  }, [postId]);

  const loadPostAndComments = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [postResponse, commentsResponse] = await Promise.all([
        apiService.getPostById(postId),
        apiService.getComments(postId)
      ]);
      
      setPost(postResponse as Post);
      setComments((commentsResponse as any)?.comments || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to load post details');
    }
    
    setLoading(false);
    setRefreshing(false);
  };

  const handleVote = async (voteType: 'like' | 'dislike') => {
    if (!post) return;
    
    try {
      await apiService.voteOnPost(post.id, voteType);
      loadPostAndComments();
    } catch (error) {
      Alert.alert('Error', 'Failed to vote on post');
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Loading post...</Text>
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color="#FF6B35" />
        <Text style={styles.errorText}>Post not found</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => loadPostAndComments()}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadPostAndComments(true)}
            tintColor="#FF6B35"
          />
        }
      >
        {/* Post */}
        <View style={styles.postContainer}>
          <View style={styles.postHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {post.author_full_name?.charAt(0) || 'U'}
              </Text>
            </View>
            <View style={styles.authorInfo}>
              <Text style={styles.authorName}>{post.author_full_name}</Text>
              <Text style={styles.authorUsername}>@{post.author_username}</Text>
              <Text style={styles.timestamp}>{formatTimeAgo(post.created_at)}</Text>
            </View>
          </View>

          {post.garage_name && (
            <View style={styles.garageTag}>
              <Text style={styles.garageTagText}>in g/{post.garage_name}</Text>
            </View>
          )}

          <Text style={styles.postContent}>{post.content}</Text>

          {post.hashtags.length > 0 && (
            <View style={styles.hashtags}>
              {post.hashtags.map((tag, index) => (
                <Text key={index} style={styles.hashtag}>#{tag}</Text>
              ))}
            </View>
          )}

          <View style={styles.postActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleVote('like')}
            >
              <Ionicons
                name={post.user_vote === 'like' ? 'heart' : 'heart-outline'}
                size={20}
                color={post.user_vote === 'like' ? '#FF6B35' : '#666'}
              />
              <Text style={styles.actionText}>{post.like_count}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleVote('dislike')}
            >
              <Ionicons
                name={post.user_vote === 'dislike' ? 'thumbs-down' : 'thumbs-down-outline'}
                size={20}
                color={post.user_vote === 'dislike' ? '#FF6B35' : '#666'}
              />
              <Text style={styles.actionText}>{post.dislike_count}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="chatbubble-outline" size={20} color="#666" />
              <Text style={styles.actionText}>{post.comment_count}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Comments */}
        <View style={styles.commentsSection}>
          <Text style={styles.commentsTitle}>Comments ({comments.length})</Text>
          
          {comments.length === 0 ? (
            <View style={styles.noComments}>
              <Ionicons name="chatbubbles-outline" size={48} color="#666" />
              <Text style={styles.noCommentsText}>No comments yet</Text>
              <Text style={styles.noCommentsSubtext}>Be the first to share your thoughts!</Text>
            </View>
          ) : (
            comments.map((comment) => (
              <View key={comment.id} style={styles.comment}>
                <View style={styles.commentHeader}>
                  <View style={styles.commentAvatar}>
                    <Text style={styles.commentAvatarText}>
                      {comment.author_full_name?.charAt(0) || 'U'}
                    </Text>
                  </View>
                  <View style={styles.commentInfo}>
                    <Text style={styles.commentAuthor}>{comment.author_full_name}</Text>
                    <Text style={styles.commentUsername}>@{comment.author_username}</Text>
                  </View>
                  <Text style={styles.commentTimestamp}>{formatTimeAgo(comment.created_at)}</Text>
                </View>
                <Text style={styles.commentContent}>{comment.content}</Text>
                <View style={styles.commentActions}>
                  <TouchableOpacity style={styles.commentAction}>
                    <Ionicons
                      name={comment.user_liked ? 'heart' : 'heart-outline'}
                      size={16}
                      color={comment.user_liked ? '#FF6B35' : '#666'}
                    />
                    <Text style={styles.commentActionText}>{comment.like_count}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSpacer: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 12,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 18,
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  postContainer: {
    backgroundColor: '#2A2A2A',
    padding: 16,
    marginBottom: 8,
  },
  postHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  authorUsername: {
    color: '#666',
    fontSize: 14,
  },
  timestamp: {
    color: '#666',
    fontSize: 12,
    marginTop: 2,
  },
  garageTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#FF6B35',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  garageTagText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  postContent: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 12,
  },
  hashtags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  hashtag: {
    color: '#FF6B35',
    fontSize: 14,
    marginRight: 8,
    marginBottom: 4,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#404040',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  actionText: {
    color: '#666',
    marginLeft: 4,
    fontSize: 14,
  },
  commentsSection: {
    backgroundColor: '#2A2A2A',
    padding: 16,
  },
  commentsTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  noComments: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noCommentsText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 12,
  },
  noCommentsSubtext: {
    color: '#666',
    fontSize: 14,
    marginTop: 4,
  },
  comment: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#404040',
  },
  commentHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  commentAvatarText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  commentInfo: {
    flex: 1,
  },
  commentAuthor: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  commentUsername: {
    color: '#666',
    fontSize: 12,
  },
  commentTimestamp: {
    color: '#666',
    fontSize: 12,
  },
  commentContent: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  commentActions: {
    flexDirection: 'row',
  },
  commentAction: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  commentActionText: {
    color: '#666',
    marginLeft: 4,
    fontSize: 12,
  },
});

export default PostDetailScreen;