import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SIZE = 32;

const UserMarker = ({ photoURL }) => {
  return (
    <View style={styles.container}>
      {photoURL ? (
        <Image source={{ uri: photoURL }} style={styles.photo} resizeMode="cover" />
      ) : (
        <Ionicons name="person" size={20} color="#fff" />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: '#1976d2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photo: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
  },
});

export default UserMarker; 