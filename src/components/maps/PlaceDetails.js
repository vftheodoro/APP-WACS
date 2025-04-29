import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  ScrollView, 
  Linking, 
  Platform,
  Share
} from 'react-native';
import { Ionicons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { getPlacePhotoUrl } from '../../services/maps/placesService';

const PlaceDetails = ({ 
  place, 
  onClose, 
  onGetDirections 
}) => {
  const { isDark } = useTheme();
  
  if (!place) return null;
  
  // Abrir telefone
  const callPhone = () => {
    if (!place.formatted_phone_number) return;
    
    const phoneUrl = `tel:${place.formatted_phone_number.replace(/\s/g, '')}`;
    Linking.canOpenURL(phoneUrl)
      .then(supported => {
        if (supported) {
          return Linking.openURL(phoneUrl);
        }
      })
      .catch(error => console.error('Erro ao fazer ligação:', error));
  };
  
  // Abrir website
  const openWebsite = () => {
    if (!place.website) return;
    
    Linking.canOpenURL(place.website)
      .then(supported => {
        if (supported) {
          return Linking.openURL(place.website);
        }
      })
      .catch(error => console.error('Erro ao abrir website:', error));
  };
  
  // Compartilhar
  const sharePlace = async () => {
    try {
      const url = place.url || `https://www.google.com/maps/search/?api=1&query=${place.name}&query_place_id=${place.place_id}`;
      
      await Share.share({
        message: `Confira este lugar: ${place.name} - ${url}`,
        url: url,
        title: place.name
      });
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
    }
  };
  
  // Verificar se o lugar está aberto agora
  const isOpenNow = () => {
    if (!place.opening_hours) return null;
    return place.opening_hours.open_now ? true : false;
  };
  
  // Pegar primeira foto do lugar
  const getPhoto = () => {
    if (place.photos && place.photos.length > 0) {
      return getPlacePhotoUrl(place.photos[0].photo_reference, 600);
    }
    return null;
  };
  
  // Formatar categorias do estabelecimento
  const getPlaceCategories = () => {
    if (!place.types || place.types.length === 0) return '';
    
    const displayTypes = place.types
      .filter(type => !['point_of_interest', 'establishment'].includes(type))
      .map(type => formatPlaceType(type));
    
    return displayTypes.slice(0, 3).join(' • ');
  };
  
  // Formatar tipo de lugar para exibição
  const formatPlaceType = (type) => {
    const typeMap = {
      'restaurant': 'Restaurante',
      'cafe': 'Café',
      'bar': 'Bar',
      'lodging': 'Hospedagem',
      'food': 'Alimentação',
      'store': 'Loja',
      'supermarket': 'Supermercado',
      'shopping_mall': 'Shopping',
      'pharmacy': 'Farmácia',
      'hospital': 'Hospital',
      'doctor': 'Médico',
      'bakery': 'Padaria',
      'bank': 'Banco',
      'gas_station': 'Posto de Gasolina',
      'parking': 'Estacionamento',
      'park': 'Parque',
      'tourist_attraction': 'Atração Turística',
      'museum': 'Museu',
      'movie_theater': 'Cinema'
    };
    
    return typeMap[type] || type.replace(/_/g, ' ');
  };
  
  // Render do componente
  return (
    <View style={[
      styles.container,
      isDark ? styles.containerDark : null
    ]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header com imagem ou placeholder */}
        <View style={styles.imageContainer}>
          {getPhoto() ? (
            <Image 
              source={{ uri: getPhoto() }}
              style={styles.image}
              resizeMode="cover"
            />
          ) : (
            <View style={[
              styles.placeholderContainer,
              isDark ? styles.placeholderContainerDark : null
            ]}>
              <MaterialIcons 
                name="place" 
                size={60} 
                color={isDark ? '#555' : '#ccc'} 
              />
              <Text style={[
                styles.placeholderText,
                isDark ? styles.placeholderTextDark : null
              ]}>
                Imagem não disponível
              </Text>
            </View>
          )}
          
          <TouchableOpacity 
            style={[styles.closeButton, isDark ? styles.closeButtonDark : null]} 
            onPress={onClose}
            accessibilityLabel="Fechar detalhes do local"
          >
            <Ionicons name="close" size={22} color={isDark ? '#000' : '#fff'} />
          </TouchableOpacity>
        </View>
        
        {/* Informações principais */}
        <View style={styles.contentContainer}>
          <Text style={[styles.placeName, isDark ? styles.placeNameDark : null]}>
            {place.name}
          </Text>
          
          {place.rating && (
            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map((i) => (
                <FontAwesome5 
                  key={i}
                  name="star" 
                  solid={i <= Math.floor(place.rating)}
                  size={16} 
                  color={i <= Math.floor(place.rating) ? '#FFD700' : '#C4C4C4'} 
                  style={{ marginRight: 2 }}
                />
              ))}
              <Text style={[styles.ratingText, isDark ? styles.ratingTextDark : null]}>
                {place.rating.toFixed(1)}
              </Text>
              {place.user_ratings_total && (
                <Text style={[styles.reviewCount, isDark ? styles.reviewCountDark : null]}>
                  ({place.user_ratings_total})
                </Text>
              )}
            </View>
          )}
          
          <Text style={[styles.placeCategory, isDark ? styles.placeCategoryDark : null]}>
            {getPlaceCategories()}
          </Text>
          
          {isOpenNow() !== null && (
            <Text style={[
              styles.openStatus,
              isOpenNow() ? styles.openNow : styles.closedNow,
              isDark && (isOpenNow() ? styles.openNowDark : styles.closedNowDark)
            ]}>
              {isOpenNow() ? 'Aberto agora' : 'Fechado'}
            </Text>
          )}
          
          {/* Endereço */}
          {place.formatted_address && (
            <View style={styles.infoRow}>
              <MaterialIcons 
                name="location-on" 
                size={22} 
                color={isDark ? '#ddd' : '#666'} 
                style={styles.infoIcon}
              />
              <View style={styles.infoTextContainer}>
                <Text style={[styles.infoText, isDark ? styles.infoTextDark : null]}>
                  {place.formatted_address}
                </Text>
              </View>
            </View>
          )}
          
          {/* Telefone */}
          {place.formatted_phone_number && (
            <TouchableOpacity 
              style={styles.infoRow}
              onPress={callPhone}
              accessibilityLabel="Ligar para este lugar"
            >
              <MaterialIcons 
                name="phone" 
                size={22} 
                color={isDark ? '#ddd' : '#666'} 
                style={styles.infoIcon}
              />
              <View style={styles.infoTextContainer}>
                <Text style={[styles.infoText, isDark ? styles.infoTextDark : null]}>
                  {place.formatted_phone_number}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          
          {/* Website */}
          {place.website && (
            <TouchableOpacity 
              style={styles.infoRow}
              onPress={openWebsite}
              accessibilityLabel="Visitar website"
            >
              <MaterialIcons 
                name="public" 
                size={22} 
                color={isDark ? '#ddd' : '#666'} 
                style={styles.infoIcon}
              />
              <View style={styles.infoTextContainer}>
                <Text 
                  style={[styles.infoText, styles.websiteText, isDark ? styles.websiteTextDark : null]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {place.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Botões de ação */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={callPhone}
            disabled={!place.formatted_phone_number}
            accessibilityLabel="Ligar para este lugar"
          >
            <View style={[
              styles.actionButtonIcon,
              !place.formatted_phone_number && styles.actionButtonDisabled
            ]}>
              <Ionicons 
                name="call" 
                size={22} 
                color="#fff" 
              />
            </View>
            <Text style={[
              styles.actionButtonText, 
              isDark ? styles.actionButtonTextDark : null,
              !place.formatted_phone_number && styles.actionButtonTextDisabled
            ]}>
              Ligar
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={sharePlace}
            accessibilityLabel="Compartilhar este lugar"
          >
            <View style={styles.actionButtonIcon}>
              <Ionicons 
                name="share-social" 
                size={22} 
                color="#fff" 
              />
            </View>
            <Text style={[styles.actionButtonText, isDark ? styles.actionButtonTextDark : null]}>
              Compartilhar
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={openWebsite}
            disabled={!place.website}
            accessibilityLabel="Visitar website"
          >
            <View style={[
              styles.actionButtonIcon,
              !place.website && styles.actionButtonDisabled
            ]}>
              <Ionicons 
                name="globe" 
                size={22} 
                color="#fff" 
              />
            </View>
            <Text style={[
              styles.actionButtonText, 
              isDark ? styles.actionButtonTextDark : null,
              !place.website && styles.actionButtonTextDisabled
            ]}>
              Website
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      {/* Botão de navegação fixo na parte inferior */}
      <View style={[styles.navigationBar, isDark ? styles.navigationBarDark : null]}>
        <TouchableOpacity 
          style={styles.navigationButton}
          onPress={() => onGetDirections(place)}
          accessibilityLabel="Como chegar neste lugar"
        >
          <Ionicons 
            name="navigate" 
            size={24} 
            color="#fff" 
          />
          <Text style={styles.navigationButtonText}>
            Como chegar
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  containerDark: {
    backgroundColor: '#1c1c1e',
  },
  imageContainer: {
    width: '100%',
    height: 200,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderContainerDark: {
    backgroundColor: '#2c2c2e',
  },
  placeholderText: {
    marginTop: 8,
    fontSize: 14,
    color: '#999',
  },
  placeholderTextDark: {
    color: '#666',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  closeButtonDark: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  contentContainer: {
    padding: 16,
  },
  placeName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#000',
  },
  placeNameDark: {
    color: '#fff',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  ratingTextDark: {
    color: '#fff',
  },
  reviewCount: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  reviewCountDark: {
    color: '#aaa',
  },
  placeCategory: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  placeCategoryDark: {
    color: '#aaa',
  },
  openStatus: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  openNow: {
    color: '#34C759',
  },
  closedNow: {
    color: '#FF3B30',
  },
  openNowDark: {
    color: '#30D158',
  },
  closedNowDark: {
    color: '#FF453A',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  infoIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  infoTextDark: {
    color: '#ddd',
  },
  websiteText: {
    color: '#007AFF',
  },
  websiteTextDark: {
    color: '#0A84FF',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    marginBottom: 80, // Espaço para o botão de navegação
  },
  actionButton: {
    alignItems: 'center',
  },
  actionButtonIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionButtonDisabled: {
    backgroundColor: '#ccc',
  },
  actionButtonText: {
    fontSize: 14,
    color: '#333',
  },
  actionButtonTextDark: {
    color: '#ddd',
  },
  actionButtonTextDisabled: {
    color: '#999',
  },
  navigationBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  navigationBarDark: {
    backgroundColor: '#1c1c1e',
    borderTopColor: '#333',
  },
  navigationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 12,
  },
  navigationButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  }
});

export default PlaceDetails;