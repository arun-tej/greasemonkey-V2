import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const PostDetailScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Post Detail Screen</Text>
      <Text style={styles.subtext}>Coming Soon</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtext: {
    color: '#666',
    fontSize: 16,
    marginTop: 8,
  },
});

export default PostDetailScreen;