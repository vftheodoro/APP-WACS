import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

const SearchSuggestions = ({ 
  suggestions, 
  onSuggestionPress, 
  visible = false,
  recentSearches = [],
  onRecentSearchPress,
  onClearRecentSearches
}) => {
  const { isDark } = useTheme();
  
  // Se não há sugestões e não está visível, não renderiza
  if (!visible) return null;
  
  // Renderiza item de sugestão
  const renderSuggestionItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.suggestionItem,
        isDark ? styles.suggestionItemDark : null
      ]}
      onPress={() => onSuggestionPress(item)}
      accessibilityLabel={`Buscar por ${item.description}`}
    >
      <MaterialIcons
        name="search"
        size={20}
        color={isDark ? '#aaa' : '#666'}
        style={styles.suggestionIcon}
      />
      <View style={styles.suggestionTextContainer}>
        <Text 
          style={[
            styles.primaryText,
            isDark ? styles.primaryTextDark : null
          ]}
          numberOfLines={1}
        >
          {item.structured_formatting?.main_text || item.description.split(',')[0]}
        </Text>
        {item.structured_formatting?.secondary_text && (
          <Text 
            style={[
              styles.secondaryText,
              isDark ? styles.secondaryTextDark : null
            ]}
            numberOfLines={1}
          >
            {item.structured_formatting.secondary_text}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
  
  // Renderiza item de busca recente
  const renderRecentSearchItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.suggestionItem,
        isDark ? styles.suggestionItemDark : null
      ]}
      onPress={() => onRecentSearchPress(item)}
      accessibilityLabel={`Buscar por ${item.description}`}
    >
      <Ionicons
        name="time-outline"
        size={20}
        color={isDark ? '#aaa' : '#666'}
        style={styles.suggestionIcon}
      />
      <View style={styles.suggestionTextContainer}>
        <Text 
          style={[
            styles.primaryText,
            isDark ? styles.primaryTextDark : null
          ]}
          numberOfLines={1}
        >
          {item.description}
        </Text>
      </View>
    </TouchableOpacity>
  );
  
  // Renderiza cabeçalho para buscas recentes (se houver)
  const renderRecentSearchesHeader = () => {
    if (recentSearches.length === 0) return null;
    
    return (
      <View style={styles.sectionHeader}>
        <Text style={[
          styles.sectionHeaderText,
          isDark ? styles.sectionHeaderTextDark : null
        ]}>
          Buscas recentes
        </Text>
        <TouchableOpacity
          onPress={onClearRecentSearches}
          accessibilityLabel="Limpar buscas recentes"
        >
          <Text style={styles.clearText}>
            Limpar
          </Text>
        </TouchableOpacity>
      </View>
    );
  };
  
  return (
    <Animated.View
      style={[
        styles.container,
        isDark ? styles.containerDark : null
      ]}
    >
      {/* Buscas recentes */}
      {recentSearches.length > 0 && (
        <>
          {renderRecentSearchesHeader()}
          <FlatList
            data={recentSearches}
            renderItem={renderRecentSearchItem}
            keyExtractor={(item, index) => `recent-${item.description}-${index}`}
            style={styles.listContainer}
            keyboardShouldPersistTaps="always"
            maxToRenderPerBatch={5}
            initialNumToRender={5}
          />
        </>
      )}
      
      {/* Exibe sugestões somente se houver alguma */}
      {suggestions.length > 0 && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={[
              styles.sectionHeaderText,
              isDark ? styles.sectionHeaderTextDark : null
            ]}>
              Sugestões
            </Text>
          </View>
          <FlatList
            data={suggestions}
            renderItem={renderSuggestionItem}
            keyExtractor={(item, index) => `suggestion-${item.place_id || index}`}
            style={styles.listContainer}
            keyboardShouldPersistTaps="always"
            maxToRenderPerBatch={5}
            initialNumToRender={5}
          />
        </>
      )}
      
      {/* Mensagem quando não há resultados */}
      {recentSearches.length === 0 && suggestions.length === 0 && (
        <View style={styles.emptyContainer}>
          <Ionicons
            name="search"
            size={32}
            color={isDark ? '#666' : '#ccc'}
          />
          <Text style={[
            styles.emptyText,
            isDark ? styles.emptyTextDark : null
          ]}>
            Digite para buscar lugares
          </Text>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 66, // Posição abaixo da barra de pesquisa
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    maxHeight: 400,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 1000,
  },
  containerDark: {
    backgroundColor: '#333',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionHeaderText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
  },
  sectionHeaderTextDark: {
    color: '#aaa',
  },
  clearText: {
    fontSize: 12,
    color: '#007AFF',
  },
  listContainer: {
    maxHeight: 350,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  suggestionItemDark: {
    borderBottomColor: '#444',
  },
  suggestionIcon: {
    marginRight: 12,
  },
  suggestionTextContainer: {
    flex: 1,
  },
  primaryText: {
    fontSize: 15,
    color: '#333',
  },
  primaryTextDark: {
    color: '#fff',
  },
  secondaryText: {
    fontSize: 13,
    color: '#999',
    marginTop: 2,
  },
  secondaryTextDark: {
    color: '#aaa',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  emptyTextDark: {
    color: '#777',
  }
});

export default SearchSuggestions;