import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { Ionicons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

// Componente para exibir instruções passo a passo
export const DirectionsList = ({ steps, onClose }) => {
  const { isDark } = useTheme();
  
  if (!steps || steps.length === 0) {
    return null;
  }
  
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={true}
      onRequestClose={onClose}
    >
      <View style={[
        styles.modalContainer,
        isDark ? styles.modalContainerDark : null
      ]}>
        <View style={[
          styles.directionsContainer,
          isDark ? styles.directionsContainerDark : null
        ]}>
          <View style={styles.directionsHeader}>
            <Text style={[
              styles.directionsTitle,
              isDark ? styles.directionsTitleDark : null
            ]}>
              Instruções passo a passo
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons 
                name="close" 
                size={24} 
                color={isDark ? '#fff' : '#333'} 
              />
            </TouchableOpacity>
          </View>
          
          <ScrollView
            style={styles.stepsList}
            showsVerticalScrollIndicator={false}
          >
            {steps.map((step, index) => (
              <View 
                key={index} 
                style={[
                  styles.stepItem,
                  isDark ? styles.stepItemDark : null
                ]}
              >
                <View style={styles.stepIconContainer}>
                  <MaterialIcons 
                    name={getDirectionIcon(step.maneuver)} 
                    size={20} 
                    color={isDark ? '#fff' : '#333'} 
                  />
                </View>
                <View style={styles.stepTextContainer}>
                  <Text 
                    style={[
                      styles.stepText,
                      isDark ? styles.stepTextDark : null
                    ]}
                  >
                    {step.html_instructions.replace(/<[^>]*>/g, ' ')}
                  </Text>
                  <Text 
                    style={[
                      styles.stepDistance,
                      isDark ? styles.stepDistanceDark : null
                    ]}
                  >
                    {step.distance.text}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// Função para determinar o ícone com base na manobra
const getDirectionIcon = (maneuver) => {
  switch (maneuver) {
    case 'turn-right':
      return 'turn-right';
    case 'turn-left':
      return 'turn-left';
    case 'turn-slight-right':
      return 'turn-slight-right';
    case 'turn-slight-left':
      return 'turn-slight-left';
    case 'turn-sharp-right':
      return 'turn-sharp-right';
    case 'turn-sharp-left':
      return 'turn-sharp-left';
    case 'uturn-right':
    case 'uturn-left':
      return 'u-turn-right';
    case 'roundabout-right':
    case 'roundabout-left':
      return 'roundabout-right';
    case 'fork-right':
    case 'fork-left':
      return 'fork-right';
    case 'straight':
      return 'straight';
    case 'ramp-right':
    case 'ramp-left':
      return 'ramp-right';
    case 'merge':
      return 'merge';
    default:
      return 'arrow-forward';
  }
};

// Componente para exibir informações da rota (tempo, distância, botões de ação)
const RouteInfo = ({ 
  routeData, 
  onStartNavigation, 
  onShowDirections, 
  onClose,
  onChangeTravelMode,
  travelMode
}) => {
  const { isDark } = useTheme();
  
  if (!routeData || !routeData.legs || routeData.legs.length === 0) {
    return null;
  }
  
  const leg = routeData.legs[0];
  const { duration, distance } = leg;
  
  return (
    <View style={[
      styles.container,
      isDark ? styles.containerDark : null
    ]}>
      <View style={styles.header}>
        <View>
          <Text style={[
            styles.title,
            isDark ? styles.titleDark : null
          ]}>
            Tempo estimado
          </Text>
          <Text style={[
            styles.duration,
            isDark ? styles.durationDark : null
          ]}>
            {duration.text}
          </Text>
          <Text style={[
            styles.distance,
            isDark ? styles.distanceDark : null
          ]}>
            {distance.text}
          </Text>
        </View>
        
        <TouchableOpacity 
          onPress={onClose}
          style={styles.closeButton}
          accessibilityLabel="Fechar informações da rota"
        >
          <Ionicons 
            name="close-circle-outline" 
            size={26} 
            color={isDark ? '#fff' : '#333'} 
          />
        </TouchableOpacity>
      </View>
      
      <View style={styles.travelModeContainer}>
        <TouchableOpacity 
          style={[
            styles.travelModeButton,
            travelMode === 'driving' && styles.activeTravelMode,
            travelMode === 'driving' && isDark && styles.activeTravelModeDark
          ]}
          onPress={() => onChangeTravelMode('driving')}
          accessibilityLabel="Modo de viagem: carro"
        >
          <FontAwesome5 
            name="car" 
            size={16} 
            color={travelMode === 'driving' ? (isDark ? '#000' : '#fff') : (isDark ? '#ddd' : '#666')} 
          />
          <Text style={[
            styles.travelModeText,
            travelMode === 'driving' && styles.activeTravelModeText,
            travelMode === 'driving' && isDark && styles.activeTravelModeTextDark
          ]}>
            Carro
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.travelModeButton,
            travelMode === 'walking' && styles.activeTravelMode,
            travelMode === 'walking' && isDark && styles.activeTravelModeDark
          ]}
          onPress={() => onChangeTravelMode('walking')}
          accessibilityLabel="Modo de viagem: a pé"
        >
          <FontAwesome5 
            name="walking" 
            size={16} 
            color={travelMode === 'walking' ? (isDark ? '#000' : '#fff') : (isDark ? '#ddd' : '#666')} 
          />
          <Text style={[
            styles.travelModeText,
            travelMode === 'walking' && styles.activeTravelModeText,
            travelMode === 'walking' && isDark && styles.activeTravelModeTextDark
          ]}>
            A pé
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.travelModeButton,
            travelMode === 'bicycling' && styles.activeTravelMode,
            travelMode === 'bicycling' && isDark && styles.activeTravelModeDark
          ]}
          onPress={() => onChangeTravelMode('bicycling')}
          accessibilityLabel="Modo de viagem: bicicleta"
        >
          <FontAwesome5 
            name="bicycle" 
            size={16} 
            color={travelMode === 'bicycling' ? (isDark ? '#000' : '#fff') : (isDark ? '#ddd' : '#666')} 
          />
          <Text style={[
            styles.travelModeText,
            travelMode === 'bicycling' && styles.activeTravelModeText,
            travelMode === 'bicycling' && isDark && styles.activeTravelModeTextDark
          ]}>
            Bicicleta
          </Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.actions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={onShowDirections}
          accessibilityLabel="Ver passo a passo"
        >
          <Ionicons 
            name="list" 
            size={24} 
            color={isDark ? '#fff' : '#333'} 
          />
          <Text style={[
            styles.actionText,
            isDark ? styles.actionTextDark : null
          ]}>
            Passo a passo
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.startButton,
            isDark ? styles.startButtonDark : null
          ]}
          onPress={onStartNavigation}
          accessibilityLabel="Iniciar navegação"
        >
          <Ionicons name="navigate" size={24} color="#fff" />
          <Text style={styles.startButtonText}>
            Iniciar
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  containerDark: {
    backgroundColor: '#333',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    color: '#666',
  },
  titleDark: {
    color: '#aaa',
  },
  duration: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginVertical: 4,
  },
  durationDark: {
    color: '#fff',
  },
  distance: {
    fontSize: 16,
    color: '#666',
  },
  distanceDark: {
    color: '#aaa',
  },
  closeButton: {
    padding: 4,
  },
  travelModeContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    overflow: 'hidden',
  },
  travelModeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  travelModeText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#666',
  },
  activeTravelMode: {
    backgroundColor: '#007AFF',
  },
  activeTravelModeDark: {
    backgroundColor: '#0A84FF',
  },
  activeTravelModeText: {
    color: '#fff',
  },
  activeTravelModeTextDark: {
    color: '#000',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  actionText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  actionTextDark: {
    color: '#fff',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#007AFF',
  },
  startButtonDark: {
    backgroundColor: '#0A84FF',
  },
  startButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  // Estilos para o modal de direções
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainerDark: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  directionsContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    height: '80%',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  directionsContainerDark: {
    backgroundColor: '#1c1c1e',
  },
  directionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  directionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  directionsTitleDark: {
    color: '#fff',
  },
  stepsList: {
    flex: 1,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  stepItemDark: {
    borderBottomColor: '#333',
  },
  stepIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepTextContainer: {
    flex: 1,
  },
  stepText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  stepTextDark: {
    color: '#fff',
  },
  stepDistance: {
    fontSize: 14,
    color: '#666',
  },
  stepDistanceDark: {
    color: '#aaa',
  },
});

export default RouteInfo; 