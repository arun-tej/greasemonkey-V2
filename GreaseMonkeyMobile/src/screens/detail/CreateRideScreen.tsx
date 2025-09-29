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

const CreateRideScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startLocation: '',
    endLocation: '',
    startTime: '',
    maxParticipants: '',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
  });

  const handleCreateRide = async () => {
    if (!formData.title.trim() || !formData.startLocation.trim()) {
      Alert.alert('Error', 'Please fill in the required fields (Title and Start Location)');
      return;
    }

    setLoading(true);
    try {
      // Mock ride creation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      Alert.alert('Success', 'Ride created successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to create ride. Please try again.');
    }
    setLoading(false);
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const difficultyOptions = [
    { value: 'easy', label: 'Easy', color: '#4CAF50', icon: 'leaf-outline' },
    { value: 'medium', label: 'Medium', color: '#FF9800', icon: 'trail-sign-outline' },
    { value: 'hard', label: 'Hard', color: '#F44336', icon: 'flash-outline' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Ride</Text>
        <TouchableOpacity
          style={[styles.createButton, { opacity: formData.title.trim() && formData.startLocation.trim() ? 1 : 0.5 }]}
          onPress={handleCreateRide}
          disabled={!formData.title.trim() || !formData.startLocation.trim() || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.createButtonText}>Create</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏍️ Ride Details</Text>
          
          <View style={styles.field}>
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.input}
              value={formData.title}
              onChangeText={(value) => updateField('title', value)}
              placeholder="Weekend Mountain Ride"
              placeholderTextColor="#666"
              maxLength={100}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(value) => updateField('description', value)}
              placeholder="Describe your ride, what to expect, any special requirements..."
              placeholderTextColor="#666"
              multiline
              numberOfLines={4}
              maxLength={500}
            />
            <Text style={styles.characterCount}>
              {formData.description.length}/500 characters
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 Route</Text>
          
          <View style={styles.field}>
            <Text style={styles.label}>Start Location *</Text>
            <TextInput
              style={styles.input}
              value={formData.startLocation}
              onChangeText={(value) => updateField('startLocation', value)}
              placeholder="Enter starting point"
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>End Location</Text>
            <TextInput
              style={styles.input}
              value={formData.endLocation}
              onChangeText={(value) => updateField('endLocation', value)}
              placeholder="Enter destination (optional)"
              placeholderTextColor="#666"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⏰ Schedule</Text>
          
          <View style={styles.field}>
            <Text style={styles.label}>Start Time</Text>
            <TouchableOpacity style={styles.dateInput}>
              <Text style={styles.dateInputText}>
                {formData.startTime || 'Select date and time'}
              </Text>
              <Ionicons name="calendar-outline" size={20} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👥 Participants</Text>
          
          <View style={styles.field}>
            <Text style={styles.label}>Max Participants</Text>
            <TextInput
              style={styles.input}
              value={formData.maxParticipants}
              onChangeText={(value) => updateField('maxParticipants', value)}
              placeholder="Leave empty for unlimited"
              placeholderTextColor="#666"
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎯 Difficulty</Text>
          
          <View style={styles.difficultyContainer}>
            {difficultyOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.difficultyOption,
                  formData.difficulty === option.value && {
                    backgroundColor: option.color + '20',
                    borderColor: option.color,
                  }
                ]}
                onPress={() => updateField('difficulty', option.value)}
              >
                <Ionicons
                  name={option.icon as any}
                  size={24}
                  color={formData.difficulty === option.value ? option.color : '#666'}
                />
                <Text style={[
                  styles.difficultyText,
                  formData.difficulty === option.value && { color: option.color }
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Additional Info</Text>
          <Text style={styles.infoText}>
            • Make sure to check weather conditions
            • Bring safety gear and emergency supplies
            • Share your planned route with someone
            • Respect traffic laws and speed limits
          </Text>
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
  createButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#404040',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  characterCount: {
    color: '#666',
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  dateInput: {
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#404040',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateInputText: {
    color: '#666',
    fontSize: 16,
  },
  difficultyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  difficultyOption: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#2A2A2A',
    borderWidth: 1,
    borderColor: '#404040',
  },
  difficultyText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
  },
  infoText: {
    color: '#666',
    fontSize: 14,
    lineHeight: 20,
  },
});

export default CreateRideScreen;