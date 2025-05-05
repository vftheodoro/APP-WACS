import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const SearchBar = ({ value, onChangeText, placeholder }) => {
  return (
    <View style={defaultStyles.container}>
      <MaterialIcons name="search" size={24} color="#666" style={defaultStyles.icon} />
      <TextInput
        style={defaultStyles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder || 'Pesquisar...'}
        placeholderTextColor="#999"
      />
    </View>
  );
};

const defaultStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 8,
    margin: 10,
    elevation: 2
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#333'
  },
  icon: {
    marginRight: 5
  }
});

export default SearchBar;
