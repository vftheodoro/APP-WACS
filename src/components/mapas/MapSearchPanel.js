import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, FlatList, ScrollView, Dimensions } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

const { height } = Dimensions.get('window');
const COLORS = {
  primary: '#1976d2',
  accent: '#43e97b',
  border: '#e0e0e0',
  textSecondary: '#666',
};

export default function MapSearchPanel({
  searchText,
  setSearchText,
  searchResults,
  setSearchResults,
  isSearching,
  autoCompleteLoading,
  showSearchHistory,
  setShowSearchHistory,
  searchHistory,
  clearSearchHistory,
  nearbyPlaces,
  selectPlace,
  selectHistoryItem,
  searchPlaces,
  searchInputRef,
  isSearchFocused,
  setIsSearchFocused,
}) {
  return (
    (searchResults.length > 0 || autoCompleteLoading || (showSearchHistory && searchText.length === 0 && (searchHistory.length > 0 || nearbyPlaces.length > 0))) && (
      <View style={{
        position: 'absolute',
        top: 120,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderRadius: 18,
        marginHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.13,
        shadowRadius: 12,
        elevation: 8,
        zIndex: 100,
        maxHeight: height * 0.45,
      }}>
        {autoCompleteLoading ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 18 }}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={{ marginLeft: 10, color: COLORS.textSecondary }}>Buscando locais...</Text>
          </View>
        ) : searchResults.length > 0 ? (
          <FlatList
            data={searchResults}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' }} onPress={() => selectPlace(item)}>
                <MaterialIcons name="location-on" size={22} color={COLORS.primary} style={{ marginRight: 10 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: 'bold', color: '#333', fontSize: 15 }} numberOfLines={1}>
                    {item.name.split(new RegExp(`(${searchText})`, 'gi')).map((part, i) =>
                      part.toLowerCase() === searchText.toLowerCase() ? <Text key={i} style={{ backgroundColor: '#e3f2fd', color: COLORS.primary }}>{part}</Text> : part
                    )}
                  </Text>
                  <Text style={{ color: '#666', fontSize: 13 }} numberOfLines={1}>{item.address}</Text>
                  {item.distance && (
                    <Text style={{ color: COLORS.accent, fontSize: 12 }}>
                      {item.distance < 1000 ? `${Math.round(item.distance)}m` : `${(item.distance / 1000).toFixed(1)}km`} de distância
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            )}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          />
        ) : showSearchHistory && searchText.length === 0 && (searchHistory.length > 0 || nearbyPlaces.length > 0) ? (
          <ScrollView keyboardShouldPersistTaps="handled">
            {searchHistory.length > 0 && (
              <View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, backgroundColor: '#f8f9fa', borderBottomWidth: 1, borderBottomColor: '#eee' }}>
                  <Text style={{ fontWeight: 'bold', color: '#333', fontSize: 14 }}>Histórico de pesquisa</Text>
                  <TouchableOpacity onPress={clearSearchHistory}><Text style={{ color: '#007bff', fontSize: 13 }}>Limpar</Text></TouchableOpacity>
                </View>
                {searchHistory.map(item => (
                  <TouchableOpacity key={item.id} style={{ flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' }} onPress={() => selectHistoryItem(item)}>
                    <MaterialIcons name="history" size={20} color={COLORS.textSecondary} style={{ marginRight: 10 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: 'bold', color: '#333', fontSize: 15 }} numberOfLines={1}>{item.name}</Text>
                      <Text style={{ color: '#666', fontSize: 13 }} numberOfLines={1}>{item.address}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            {nearbyPlaces.length > 0 && (
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#f8f9fa', borderBottomWidth: 1, borderBottomColor: '#eee' }}>
                  <Text style={{ fontWeight: 'bold', color: '#333', fontSize: 14 }}>Lugares próximos</Text>
                </View>
                {nearbyPlaces.map(place => (
                  <TouchableOpacity key={place.id} style={{ flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' }} onPress={() => selectPlace(place)}>
                    <MaterialIcons name="near-me" size={20} color={COLORS.accent} style={{ marginRight: 10 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: 'bold', color: '#333', fontSize: 15 }} numberOfLines={1}>{place.name}</Text>
                      <Text style={{ color: '#666', fontSize: 13 }} numberOfLines={1}>{place.address}</Text>
                      <Text style={{ color: COLORS.accent, fontSize: 12 }}>
                        {place.distance < 1000 ? `${Math.round(place.distance)}m` : `${(place.distance / 1000).toFixed(1)}km`} de distância
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>
        ) : (
          <View style={{ alignItems: 'center', padding: 18 }}>
            <Text style={{ color: COLORS.textSecondary, fontSize: 15 }}>Nenhum resultado encontrado.</Text>
          </View>
        )}
      </View>
    )
  );
} 