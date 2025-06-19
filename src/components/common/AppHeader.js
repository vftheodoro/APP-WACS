import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform, Pressable, Modal, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

/**
 * AppHeader - Header genérico reutilizável
 * Props:
 *  title: string (título centralizado)
 *  onBack: function (callback do botão de voltar, opcional)
 *  actions: array de objetos { icon, label, onPress } (opcional)
 *  children: ReactNode (opcional, para linha extra de ações)
 *  gradientColors: array de cores (opcional)
 *  style: estilos adicionais (opcional)
 */
const MAX_VISIBLE_ACTIONS = 3;

const AppHeader = ({
  title,
  onBack,
  actions = [],
  children,
  gradientColors = ['#1976d2', '#2196f3'],
  style = {},
}) => {
  const [overflowVisible, setOverflowVisible] = useState(false);
  // Pesquisa é sempre o primeiro botão, se existir
  const searchAction = actions.find(a => a.icon === 'search');
  const otherActions = actions.filter(a => a.icon !== 'search');
  const visibleActions = otherActions.slice(0, MAX_VISIBLE_ACTIONS - 1); // -1 porque search está acima
  const overflowActions = otherActions.slice(MAX_VISIBLE_ACTIONS - 1);

  return (
    <LinearGradient colors={gradientColors} style={[styles.headerGradient, style]}>
      {/* Linha superior: botão de voltar à esquerda, título centralizado, pesquisa à direita */}
      <View style={styles.topRow}>
        {onBack ? (
          <Pressable
            onPress={onBack}
            style={({ pressed }) => [styles.backButton, pressed && styles.buttonPressed]}
            accessibilityLabel="Voltar"
            accessibilityRole="button"
            hitSlop={8}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </Pressable>
        ) : (
          <View style={styles.backButtonPlaceholder} />
        )}
        <View style={styles.titleContainer}>
          <Text style={styles.headerTitle} numberOfLines={1} accessibilityRole="header">
            {title}
          </Text>
        </View>
        {searchAction ? (
          <Pressable
            onPress={searchAction.onPress}
            style={({ pressed }) => [styles.headerButton, styles.searchButton, pressed && styles.buttonPressed]}
            accessibilityLabel={searchAction.label || 'Pesquisar'}
            accessibilityRole="button"
            hitSlop={8}
          >
            <Ionicons name={searchAction.icon} size={22} color="#fff" />
          </Pressable>
        ) : (
          <View style={styles.backButtonPlaceholder} />
        )}
      </View>
      {/* Linha inferior: outras ações */}
      {(visibleActions.length > 0 || overflowActions.length > 0) && (
        <View style={styles.headerRow}>
          {/* Espaço para alinhar com o botão de voltar */}
          <View style={styles.backButtonPlaceholder} />
          <View style={{ flex: 1 }} />
          <View style={styles.actionsRight}>
            {visibleActions.map((action, idx) => (
              <Pressable
                key={idx}
                onPress={action.onPress}
                style={({ pressed }) => [
                  styles.headerButton,
                  idx === visibleActions.length - 1 && overflowActions.length === 0 && { marginRight: 0 },
                  pressed && styles.buttonPressed,
                ]}
                accessibilityLabel={action.label || 'Ação'}
                accessibilityRole="button"
                hitSlop={8}
              >
                <Ionicons name={action.icon} size={22} color="#fff" />
                {action.label ? <Text style={styles.headerButtonText}>{action.label}</Text> : null}
              </Pressable>
            ))}
            {overflowActions.length > 0 && (
              <Pressable
                onPress={() => setOverflowVisible(true)}
                style={({ pressed }) => [styles.headerButton, styles.overflowButton, pressed && styles.buttonPressed]}
                accessibilityLabel="Mais opções"
                accessibilityRole="button"
                hitSlop={8}
              >
                <Ionicons name="ellipsis-vertical" size={22} color="#fff" />
              </Pressable>
            )}
          </View>
        </View>
      )}
      {/* Modal de overflow */}
      <Modal
        visible={overflowVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setOverflowVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setOverflowVisible(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        <View style={styles.overflowModalContainer}>
          {overflowActions.map((action, idx) => (
            <Pressable
              key={idx}
              onPress={() => {
                setOverflowVisible(false);
                action.onPress && action.onPress();
              }}
              style={({ pressed }) => [styles.overflowModalItem, pressed && styles.buttonPressed]}
              accessibilityLabel={action.label || 'Ação'}
              accessibilityRole="button"
              hitSlop={8}
            >
              <Ionicons name={action.icon} size={20} color="#1976d2" style={{ marginRight: 10 }} />
              <Text style={styles.overflowModalItemText}>{action.label || 'Ação'}</Text>
            </Pressable>
          ))}
        </View>
      </Modal>
      {children}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 12,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    zIndex: 1000,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    marginBottom: 2,
  },
  backButton: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 44,
  },
  backButtonPlaceholder: {
    width: 44,
    minWidth: 44,
    minHeight: 44,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    maxWidth: '90%',
  },
  searchButton: {
    marginLeft: 8,
    backgroundColor: 'rgba(255,255,255,0.18)',
    minWidth: 44,
    minHeight: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  actionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    minWidth: 40,
    marginLeft: 8,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 4,
    minHeight: 36,
    minWidth: 36,
  },
  overflowButton: {
    marginRight: 0,
  },
  headerButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  overflowModalContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 70 : 50,
    right: 24,
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 10,
    zIndex: 1001,
    minWidth: 180,
  },
  overflowModalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  overflowModalItemText: {
    fontSize: 15,
    color: '#1976d2',
    fontWeight: '500',
  },
});

export default AppHeader; 