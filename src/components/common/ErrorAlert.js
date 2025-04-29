import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ErrorAlert = ({ title, messages }) => {
  return (
    <View style={styles.container}>
      <View style={styles.errorAlert}>
        <View style={styles.flex}>
          <View style={styles.iconContainer}>
            <Ionicons name="close-circle" size={24} color="#F87171" />
          </View>
          <View style={styles.contentContainer}>
            <Text style={styles.title}>{title}</Text>
            <View style={styles.messagesContainer}>
              {messages.map((message, index) => (
                <Text key={index} style={styles.message}>
                  • {message}
                </Text>
              ))}
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    padding: 16,
  },
  errorAlert: {
    borderRadius: 6,
    padding: 16,
    backgroundColor: '#FEE2E2',
  },
  flex: {
    flexDirection: 'row',
  },
  iconContainer: {
    marginRight: 16,
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    color: '#991B1B',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  messagesContainer: {
    marginTop: 4,
  },
  message: {
    color: '#B91C1C',
    fontSize: 14,
    marginLeft: 8,
    marginBottom: 4,
  },
});

export default ErrorAlert; 