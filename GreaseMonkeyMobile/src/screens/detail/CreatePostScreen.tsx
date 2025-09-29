import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/api';

const CreatePostScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreatePost = async () => {
    if (!content.trim()) {
      Alert.alert('Error', 'Please enter some content for your post');
      return;
    }

    setLoading(true);
    try {
      const hashtagArray = hashtags
        .split(' ')
        .filter(tag => tag.startsWith('#'))
        .map(tag => tag.substring(1));

      await apiService.createPost({
        content: content.trim(),
        hashtags: hashtagArray,
      });

      Alert.alert('Success', 'Post created successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to create post. Please try again.');
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Post</Text>
        <TouchableOpacity
          style={[styles.postButton, { opacity: content.trim() ? 1 : 0.5 }]}
          onPress={handleCreatePost}
          disabled={!content.trim() || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.postButtonText}>Post</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.full_name?.charAt(0) || 'U'}
            </Text>
          </View>
          <Text style={styles.username}>{user?.full_name || 'User'}</Text>
        </View>

        <TextInput
          style={styles.contentInput}
          placeholder="What's on your mind about motorcycles?"
          placeholderTextColor="#666"
          multiline
          value={content}
          onChangeText={setContent}
          maxLength={2000}
        />

        <TextInput
          style={styles.hashtagInput}
          placeholder="Add hashtags (#motorcycle #ride #adventure)"
          placeholderTextColor="#666"
          value={hashtags}
          onChangeText={setHashtags}
        />

        <Text style={styles.characterCount}>
          {content.length}/2000 characters
        </Text>
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
  postButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  postButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
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
  username: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  contentInput: {
    color: '#FFFFFF',
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  hashtagInput: {
    color: '#FFFFFF',
    fontSize: 14,
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingTop: 16,
    marginBottom: 8,
  },
  characterCount: {
    color: '#666',
    fontSize: 12,
    textAlign: 'right',
  },
});

export default CreatePostScreen;