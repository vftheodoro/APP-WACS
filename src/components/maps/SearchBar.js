import React, { useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Animated, 
  ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const SearchBar = ({ 
  value, 
  onChangeText, 
  onSubmit, 
  onClear, 
  loading,
  placeholder = "Para onde você quer ir?",
  expanded = false,
  onFocus,
  onBlur
}) => {
  const { isDark } = useTheme();
  const inputRef = useRef(null);
  
  return (
    <View style={[
      styles.container,
      isDark ? styles.containerDark : null,
      expanded ? styles.containerExpanded : null
    ]}>
      <View style={[
        styles.searchBar,
        isDark ? styles.searchBarDark : null
      ]}>
        <Ionicons 
          name="search" 
          size={22} 
          color={isDark ? '#fff' : '#333'}
          style={styles.searchIcon} 
        />
        
        <TextInput
          ref={inputRef}
          style={[
            styles.input,
            isDark ? styles.inputDark : null
          ]}
          placeholder={placeholder}
          placeholderTextColor={isDark ? '#aaa' : '#777'}
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={() => onSubmit && onSubmit(value)}
          returnKeyType="search"
          clearButtonMode="never"
          autoCapitalize="none"
          autoCorrect={false}
          onFocus={() => onFocus && onFocus()}
          onBlur={() => onBlur && onBlur()}
          accessibilityLabel="Campo de busca de lugares"
          accessibilityHint="Digite para buscar lugares próximos"
        />
        
        {loading ? (
          <ActivityIndicator 
            size={20} 
            color={isDark ? '#fff' : '#333'} 
            style={styles.actionIcon}
          />
        ) : value ? (
          <TouchableOpacity
            onPress={() => {
              onClear && onClear();
              inputRef.current?.focus();
            }}
            style={styles.actionIcon}
            accessibilityLabel="Limpar busca"
          >
            <Ionicons 
              name="close-circle" 
              size={20} 
              color={isDark ? '#ccc' : '#666'} 
            />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    padding: 16,
    zIndex: 10,
    backgroundColor: 'transparent',
  },
  containerDark: {
    backgroundColor: 'transparent',
  },
  containerExpanded: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 8,
    height: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchBarDark: {
    backgroundColor: '#333',
    borderColor: '#555',
  },
  searchIcon: {
    marginHorizontal: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    height: '100%',
    padding: 0,
    marginRight: 5,
  },
  inputDark: {
    color: '#fff',
  },
  actionIcon: {
    padding: 8,
  }
});

export default SearchBar; 