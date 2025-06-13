import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, FlatList, Image, TouchableOpacity, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, Borders, Shadows } from '../../theme';

const { width } = Dimensions.get('window');

export const ProfileTabScreen = () => {
  const navigation = useNavigation();

  const suggestions = [
    { id: '1', name: 'Felipe Souza', role: 'Engenheiro de Dados', profilePic: 'https://via.placeholder.com/40/FFFF33/000000?text=FS' },
    { id: '2', name: 'Larissa Costa', role: 'UX Designer', profilePic: 'https://via.placeholder.com/40/33FFFF/000000?text=LC' },
  ];

  const featuredTopics = [
    { id: '1', name: '#AcessibilidadeDigital', posts: '1.2K Posts' },
    { id: '2', name: '#InovacaoPCD', posts: '850 Posts' },
  ];

  const renderSuggestionItem = ({ item }) => (
    <Pressable style={styles.suggestionCard}>
      <Image source={{ uri: item.profilePic }} style={styles.suggestionProfilePic} />
      <Text style={styles.suggestionName}>{item.name}</Text>
      <Text style={styles.suggestionRole}>{item.role}</Text>
      <TouchableOpacity style={styles.connectButton}>
        <LinearGradient
          colors={[Colors.primary.dark, Colors.primary.light]}
          style={styles.connectButtonGradient}
        >
          <Text style={styles.connectButtonText}>Conectar</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Pressable>
  );

  const renderTopicItem = ({ item }) => (
    <View style={styles.topicItem}>
      <Text style={styles.topicName}>{item.name}</Text>
      <Text style={styles.topicPosts}>{item.posts}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.primary.dark, Colors.primary.light]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Seu Perfil</Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        {/* Seu Perfil */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Seu Perfil</Text>
          <View style={styles.profileCard}>
            <View style={styles.profileStats}>
              <View style={styles.profileStatItem}>
                <Text style={styles.profileStatValue}>0</Text>
                <Text style={styles.profileStatLabel}>Contribuições</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.profileStatItem}>
                <Text style={styles.profileStatValue}>0</Text>
                <Text style={styles.profileStatLabel}>Avaliações</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.profileStatItem}>
                <Text style={styles.profileStatValue}>0</Text>
                <Text style={styles.profileStatLabel}>Pontos</Text>
              </View>
            </View>
            <View style={styles.profileButtons}>
              <Pressable style={styles.profileButton}>
                <Text style={styles.profileButtonText}>Editar Perfil</Text>
              </Pressable>
              <Pressable style={styles.profileButton}>
                <Text style={styles.profileButtonText}>Ver Histórico</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Sugestões para Você */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Sugestões para Você</Text>
          <FlatList
            data={suggestions}
            keyExtractor={item => item.id}
            renderItem={renderSuggestionItem}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.suggestionsList}
          />
        </View>

        {/* Tópicos em Destaque */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Tópicos em Destaque</Text>
          <View style={styles.topicsGrid}>
            {featuredTopics.map(item => (
              <React.Fragment key={item.id}>
                {renderTopicItem({ item })}
              </React.Fragment>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.screen,
  },
  header: {
    paddingTop: Spacing.headerTop,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.xl,
    borderBottomLeftRadius: Borders.radius.xl,
    borderBottomRightRadius: Borders.radius.xl,
    zIndex: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  headerTitle: {
    fontSize: Typography.fontSizes.xl,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.text.lightOnPrimary,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: Spacing.sm * 1.25,
  },
  scrollViewContent: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xl * 2,
  },
  sectionContainer: {
    backgroundColor: Colors.background.card,
    borderRadius: Borders.radius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
    ...Shadows.default,
  },
  sectionTitle: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.text.darkPrimary,
    marginBottom: Spacing.lg,
  },
  // Seu Perfil Section
  profileCard: {
    backgroundColor: Colors.background.card,
    borderRadius: Borders.radius.md,
    padding: Spacing.lg,
    ...Shadows.default,
  },
  profileStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  profileStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  profileStatValue: {
    fontSize: Typography.fontSizes.xl,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.primary.dark,
  },
  profileStatLabel: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.text.darkSecondary,
    marginTop: Spacing.xxs,
  },
  statDivider: {
    width: Borders.width.sm,
    height: 40,
    backgroundColor: Colors.border.light,
  },
  profileButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: Spacing.md,
  },
  profileButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: Borders.radius.sm,
    borderWidth: Borders.width.sm,
    borderColor: Colors.primary.dark,
    backgroundColor: Colors.background.screen,
  },
  profileButtonText: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.semibold,
    color: Colors.primary.dark,
  },
  // Sugestões para Você Section
  suggestionsList: {
    paddingVertical: Spacing.xs,
  },
  suggestionCard: {
    backgroundColor: Colors.background.card,
    borderRadius: Borders.radius.md,
    padding: Spacing.lg,
    marginRight: Spacing.md,
    alignItems: 'center',
    ...Shadows.sm,
    width: width * 0.4, // Adjust card width for horizontal scroll
  },
  suggestionProfilePic: {
    width: 60,
    height: 60,
    borderRadius: Borders.radius.circular,
    marginBottom: Spacing.sm,
    borderWidth: Borders.width.sm,
    borderColor: Colors.border.medium,
  },
  suggestionName: {
    fontSize: Typography.fontSizes.md,
    fontWeight: Typography.fontWeights.semibold,
    color: Colors.text.darkPrimary,
    marginBottom: Spacing.xxs,
  },
  suggestionRole: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.text.darkSecondary,
    marginBottom: Spacing.sm,
  },
  connectButton: {
    marginTop: Spacing.sm,
    borderRadius: Borders.radius.sm,
    overflow: 'hidden',
    width: '100%',
  },
  connectButtonGradient: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectButtonText: {
    color: Colors.text.lightOnPrimary,
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.semibold,
  },
  // Tópicos em Destaque Section
  topicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm, // Gap between topic items
  },
  topicItem: {
    backgroundColor: Colors.background.screen,
    borderRadius: Borders.radius.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderWidth: Borders.width.sm,
    borderColor: Colors.border.light,
    ...Shadows.sm,
  },
  topicName: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.semibold,
    color: Colors.primary.dark,
  },
  topicPosts: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.text.darkSecondary,
    marginTop: Spacing.xxs,
  },
}); 