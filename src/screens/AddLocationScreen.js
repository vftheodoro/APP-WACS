import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Alert, 
  Image,
  ActivityIndicator,
  Platform,
  StatusBar
} from 'react-native';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useRoute, useNavigation } from '@react-navigation/native';
import { db, storage, auth } from '../services/firebase/config';
import { collection, addDoc, serverTimestamp, runTransaction, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Picker } from '@react-native-picker/picker';
import Constants from 'expo-constants';
import { addXP } from '../services/gamification';
import { useAuth } from '../contexts/AuthContext';
import { Snackbar } from 'react-native-paper';

const COLORS = {
  primary: '#1976d2',
  primaryLight: '#63a4ff',
  success: '#34C759',
  background: '#f8fafc',
  surface: '#ffffff',
  text: '#333333',
  textSecondary: '#666666',
  border: '#e0e0e0',
  warning: '#FF9800',
};

const getFeatureData = (featureKey) => {
    const featureMap = {
        'wheelchair': { icon: 'walk-outline', name: 'Cadeirante' },
        'blind': { icon: 'eye-off-outline', name: 'Def. Visual' },
        'deaf': { icon: 'ear-outline', name: 'Def. Auditiva' },
        'elevator': { icon: 'swap-vertical-outline', name: 'Elevador' },
        'parking': { icon: 'car-outline', name: 'Estacionamento' },
        'restroom': { icon: 'body-outline', name: 'Banheiro Adapt.' },
        'ramp': { icon: 'enter-outline', name: 'Rampa' },
    };
    if (!featureKey) return featureMap;
    return featureMap[featureKey] || { icon: 'help-circle-outline', name: featureKey };
};

const ACCESSIBILITY_OPTIONS = Object.keys(getFeatureData());

// Tipos principais de estabelecimento
const MAIN_PLACE_TYPES = [
  { key: 'restaurant', label: 'Restaurante', icon: <MaterialCommunityIcons name="silverware-fork-knife" size={20} color="#1976d2" /> },
  { key: 'school', label: 'Escola', icon: <Ionicons name="school-outline" size={20} color="#1976d2" /> },
  { key: 'hospital', label: 'Hospital', icon: <MaterialCommunityIcons name="hospital-building" size={20} color="#1976d2" /> },
  { key: 'store', label: 'Loja', icon: <FontAwesome5 name="store" size={20} color="#1976d2" /> },
  { key: 'hotel', label: 'Hotel', icon: <FontAwesome5 name="hotel" size={20} color="#1976d2" /> },
  { key: 'gym', label: 'Academia', icon: <MaterialCommunityIcons name="dumbbell" size={20} color="#1976d2" /> },
  { key: 'station', label: 'Estação', icon: <MaterialCommunityIcons name="train" size={20} color="#1976d2" /> },
  { key: 'park', label: 'Parque', icon: <MaterialCommunityIcons name="tree" size={20} color="#1976d2" /> },
  { key: 'church', label: 'Igreja', icon: <MaterialCommunityIcons name="church" size={20} color="#1976d2" /> },
  { key: 'pharmacy', label: 'Farmácia', icon: <MaterialCommunityIcons name="pharmacy" size={20} color="#1976d2" /> },
  { key: 'supermarket', label: 'Supermercado', icon: <MaterialCommunityIcons name="cart" size={20} color="#1976d2" /> },
  { key: 'shopping_mall', label: 'Shopping', icon: <MaterialCommunityIcons name="shopping" size={20} color="#1976d2" /> },
  { key: 'bank', label: 'Banco', icon: <FontAwesome5 name="university" size={20} color="#1976d2" /> },
  { key: 'post_office', label: 'Correios', icon: <MaterialCommunityIcons name="email" size={20} color="#1976d2" /> },
  { key: 'other', label: 'Outros', icon: <Ionicons name="ellipsis-horizontal" size={20} color="#1976d2" /> },
];

// Tipos expandidos para "Outros"
const EXTRA_PLACE_TYPES = [
  { key: 'pet_store', label: 'Petshop', icon: <MaterialCommunityIcons name="dog" size={20} color="#1976d2" /> },
  { key: 'bar', label: 'Bar', icon: <MaterialCommunityIcons name="glass-cocktail" size={20} color="#1976d2" /> },
  { key: 'bakery', label: 'Padaria', icon: <MaterialCommunityIcons name="bread-slice" size={20} color="#1976d2" /> },
  { key: 'gas_station', label: 'Posto de Gasolina', icon: <MaterialCommunityIcons name="gas-station" size={20} color="#1976d2" /> },
  { key: 'clinic', label: 'Clínica', icon: <MaterialCommunityIcons name="stethoscope" size={20} color="#1976d2" /> },
  { key: 'theater', label: 'Teatro', icon: <MaterialCommunityIcons name="theater" size={20} color="#1976d2" /> },
  { key: 'cinema', label: 'Cinema', icon: <MaterialCommunityIcons name="movie" size={20} color="#1976d2" /> },
  { key: 'custom', label: 'Outro (especificar)', icon: <Ionicons name="create-outline" size={20} color="#1976d2" /> },
];

const GOOGLE_MAPS_APIKEY = Constants.expoConfig?.extra?.GOOGLE_MAPS_API_KEY;

export default function AddLocationScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  
  const { latitude, longitude, address, name: initialName, photoUrl } = route.params;

  const [step, setStep] = useState(1);
  const [name, setName] = useState(initialName || '');
  const [accessibilityFeatures, setAccessibilityFeatures] = useState([]);
  const [featureRatings, setFeatureRatings] = useState({});
  const [image, setImage] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [comment, setComment] = useState('');
  const maxCommentLength = 300;
  const [placeType, setPlaceType] = useState('');
  const [showExtraTypes, setShowExtraTypes] = useState(false);
  const [customType, setCustomType] = useState('');
  const { user } = useAuth();
  const [xpSnackbar, setXpSnackbar] = useState({ visible: false, message: '' });

  useEffect(() => {
    if (photoUrl) {
      setImage({ uri: photoUrl });
    }
  }, [photoUrl]);

  useEffect(() => {
    async function suggestPlaceType() {
      if (!name || !latitude || !longitude || !GOOGLE_MAPS_APIKEY) return;
      try {
        const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=50&keyword=${encodeURIComponent(name)}&key=${GOOGLE_MAPS_APIKEY}&language=pt-BR`;
        const response = await fetch(url);
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          const types = data.results[0].types || [];
          // Mapeamento Google -> nossos tipos
          const typeMap = {
            restaurant: 'restaurant',
            school: 'school',
            hospital: 'hospital',
            store: 'store',
            hotel: 'hotel',
            gym: 'gym',
            train_station: 'station',
            park: 'park',
            church: 'church',
            pharmacy: 'pharmacy',
            supermarket: 'supermarket',
            shopping_mall: 'shopping_mall',
            bank: 'bank',
            post_office: 'post_office',
            bar: 'bar',
            bakery: 'bakery',
            gas_station: 'gas_station',
            veterinary_care: 'pet_store',
            movie_theater: 'cinema',
            theater: 'theater',
            clinic: 'clinic',
          };
          const found = types.map(t => typeMap[t]).find(Boolean);
          if (found) {
            setPlaceType(found);
            setShowExtraTypes(found === 'other');
          }
        }
      } catch (e) {
        // Silencioso
      }
    }
    suggestPlaceType();
    // eslint-disable-next-line
  }, [name, latitude, longitude]);

  const handleSelectOption = (key) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAccessibilityFeatures((prev) => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ 
      mediaTypes: ImagePicker.MediaTypeOptions.Images, 
      quality: 0.7,
      allowsEditing: true,
      aspect: [16, 9],
    });
    if (!result.canceled && result.assets && result.assets[0]) {
      setImage(result.assets[0]);
    }
  };
  
  const validateStep1 = () => {
    if (!name.trim()) return "O nome do local é obrigatório.";
    if (!placeType || (placeType === 'custom' && !customType.trim())) return "Selecione o tipo de estabelecimento.";
    if (accessibilityFeatures.length === 0) return "Selecione pelo menos um recurso de acessibilidade.";
    if (!image) return "Uma imagem do local é obrigatória.";
    return null;
  };

  const handleNextStep = () => {
    const errorMessage = validateStep1();
    if (errorMessage) {
      Alert.alert('Campos Incompletos', errorMessage);
      return;
    }
    setStep(2);
  };
  
  const handleSubmit = async (includeReview) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      Alert.alert("Erro", "Você precisa estar logado para adicionar um local.");
      return;
    }
    
    setSubmitting(true);
    let reviewData = null;

    if (includeReview) {
        const ratings = Object.values(featureRatings);
        if (ratings.length < accessibilityFeatures.length) {
            Alert.alert("Avaliação Incompleta", "Por favor, avalie todos os recursos selecionados.");
            setSubmitting(false);
            return;
        }
        const sum = ratings.reduce((acc, curr) => acc + curr, 0);
        const avgRating = sum / ratings.length;
        reviewData = {
            rating: avgRating,
            comment: comment.trim(),
            featureRatings,
        };
    }
    
    try {
      const response = await fetch(image.uri);
      const blob = await response.blob();
      const filename = `locations/${Date.now()}-${image.uri.split('/').pop()}`;
      const imageRef = ref(storage, filename);
      await uploadBytes(imageRef, blob);
      const imageUrl = await getDownloadURL(imageRef);

      const locationsCollectionRef = collection(db, 'accessibleLocations');
      await runTransaction(db, async (transaction) => {
        const newLocationRef = doc(locationsCollectionRef);
        const locationPayload = {
          name: name.trim(),
          address,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          accessibilityFeatures,
          imageUrl,
          createdAt: serverTimestamp(),
          author: { id: currentUser.uid, name: currentUser.displayName, photoURL: currentUser.photoURL },
          rating: reviewData ? reviewData.rating : 0,
          reviewCount: reviewData ? 1 : 0,
          placeType: placeType === 'custom' ? customType.trim() : placeType,
        };
        transaction.set(newLocationRef, locationPayload);
        if (reviewData) {
          const reviewCollectionRef = collection(db, 'accessibleLocations', newLocationRef.id, 'reviews');
          const newReviewRef = doc(reviewCollectionRef);
          transaction.set(newReviewRef, {
            ...reviewData,
            createdAt: serverTimestamp(),
            user: { id: currentUser.uid, name: currentUser.displayName, photoURL: currentUser.photoURL },
          });
        }
      });
      // Alert.alert("Sucesso!", "Novo local adicionado com sucesso.");
      navigation.navigate('LocationsList');
      if (user?.id) {
        await addXP(user.id, 'add_location');
        setXpSnackbar({ visible: true, message: '+30 XP por adicionar local!' });
      }
    } catch (error) {
      console.error("Erro ao adicionar local:", error);
      Alert.alert("Erro", "Não foi possível adicionar o novo local.");
      setSubmitting(false);
    }
  };

  // Funções de renderização
  const renderStars = (currentRating, onRate) => ( <View style={styles.starsRow}>{[1, 2, 3, 4, 5].map(i => (<TouchableOpacity key={i} onPress={() => onRate(i)}><Ionicons name={i <= currentRating ? 'star' : 'star-outline'} size={28} color={COLORS.warning} /></TouchableOpacity>))}</View> );
  const FormField = ({ value, onChangeText, placeholder, iconName, ...props }) => ( <View style={styles.inputContainer}><Ionicons name={iconName} size={20} color={COLORS.textSecondary} style={styles.inputIcon} /><TextInput style={styles.input} placeholder={placeholder} placeholderTextColor={COLORS.textSecondary} value={value} onChangeText={onChangeText} {...props} />{value.length > 0 && (<TouchableOpacity onPress={() => onChangeText('')} style={styles.clearButton}><Ionicons name="close-circle" size={20} color={COLORS.border} /></TouchableOpacity>)}</View> );

  const renderStep1 = () => (
    <>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.addressBar}>
            <Ionicons name="location" size={20} color={COLORS.success} />
            <Text style={styles.addressText} numberOfLines={2}>{address}</Text>
        </View>
        <FormField placeholder="Nome do Local (Ex: Restaurante Acessível)" value={name} onChangeText={setName} iconName="text-outline" />
        <View style={{ marginBottom: 16 }}>
          <Text style={styles.sectionTitle}>Tipo de Estabelecimento</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', marginBottom: 8 }}>
            {MAIN_PLACE_TYPES.map(opt => (
              <TouchableOpacity
                key={opt.key}
                style={[styles.typeOption, placeType === opt.key && styles.typeOptionSelected]}
                onPress={() => {
                  setPlaceType(opt.key);
                  setShowExtraTypes(opt.key === 'other');
                  if (opt.key !== 'custom') setCustomType('');
                }}
              >
                {opt.icon}
                <Text style={[styles.typeOptionLabel, placeType === opt.key && { color: COLORS.primary }]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {showExtraTypes && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', marginBottom: 8 }}>
              {EXTRA_PLACE_TYPES.map(opt => (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.typeOption, placeType === opt.key && styles.typeOptionSelected]}
                  onPress={() => {
                    setPlaceType(opt.key);
                    if (opt.key === 'custom') setCustomType('');
                  }}
                >
                  {opt.icon}
                  <Text style={[styles.typeOptionLabel, placeType === opt.key && { color: COLORS.primary }]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
          {placeType === 'custom' && (
            <TextInput
              style={styles.input}
              placeholder="Digite o tipo de estabelecimento"
              value={customType}
              onChangeText={setCustomType}
            />
          )}
        </View>
        {placeType && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Ionicons name="bulb-outline" size={18} color={COLORS.primary} style={{ marginRight: 6 }} />
            <Text style={{ color: COLORS.primary, fontSize: 13 }}>
              Sugestão automática: {MAIN_PLACE_TYPES.concat(EXTRA_PLACE_TYPES).find(opt => opt.key === placeType)?.label || customType}
            </Text>
          </View>
        )}
        <Text style={styles.sectionTitle}>Recursos de Acessibilidade</Text>
        <View style={styles.optionsGrid}>{ACCESSIBILITY_OPTIONS.map(key => { const { icon, name: featureName } = getFeatureData(key); const isSelected = accessibilityFeatures.includes(key); return ( <TouchableOpacity key={key} style={[styles.option, isSelected && styles.optionSelected]} onPress={() => handleSelectOption(key)}><Ionicons name={icon} size={22} color={isSelected ? COLORS.primary : COLORS.textSecondary} /><Text style={[styles.optionLabel, isSelected && {color: COLORS.primary}]}>{featureName}</Text></TouchableOpacity> ); })}</View>
        <TouchableOpacity style={styles.imagePicker} onPress={handlePickImage}>{image ? (<Image source={{ uri: image.uri }} style={styles.imagePreview} />) : (<><Ionicons name="camera-outline" size={32} color={COLORS.textSecondary} /><Text style={styles.imagePickerText}>Adicionar Foto do Local</Text><Text style={styles.imagePickerSubtext}>Obrigatório</Text></>)}</TouchableOpacity>
      </ScrollView>
      <View style={styles.footer}><TouchableOpacity style={styles.submitBtn} onPress={handleNextStep}><Text style={styles.submitText}>Continuar para Avaliação</Text><Ionicons name="arrow-forward-outline" size={22} color="#fff" style={{marginLeft: 8}}/></TouchableOpacity></View>
    </>
  );

  const renderStep2 = () => (
    <>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>Avalie os recursos (opcional)</Text>
        {accessibilityFeatures.map(key => { const { icon, name: featureName } = getFeatureData(key); return ( <View key={key} style={styles.featureRow}><View style={styles.featureInfo}><Ionicons name={icon} size={24} color={COLORS.primary} /><Text style={styles.featureLabel}>{featureName}</Text></View>{renderStars(featureRatings[key] || 0, (value) => setFeatureRatings(prev => ({...prev, [key]: value})))}</View> ); })}
        <View style={styles.commentContainer}>
          <Text style={styles.commentLabel}>Comentário (opcional)</Text>
          <View style={styles.commentInputWrapper}>
            <TextInput
              style={styles.commentInput}
              placeholder="Compartilhe sua experiência..."
              placeholderTextColor={COLORS.textSecondary}
              value={comment}
              onChangeText={text => text.length <= maxCommentLength ? setComment(text) : null}
              multiline
              maxLength={maxCommentLength}
            />
            {comment.length > 0 && (
              <TouchableOpacity onPress={() => setComment('')} style={styles.clearCommentButton}>
                <Ionicons name="close-circle" size={20} color={COLORS.border} />
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.commentCounter}>{comment.length}/{maxCommentLength}</Text>
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity style={[styles.submitBtn, { marginBottom: 10 }]} onPress={() => handleSubmit(true)} disabled={submitting}>{submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Salvar com Avaliação</Text>}</TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => handleSubmit(false)} disabled={submitting}><Text style={styles.secondaryButtonText}>Salvar Apenas o Local</Text></TouchableOpacity>
      </View>
    </>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => step === 2 ? setStep(1) : navigation.goBack()} style={styles.headerButton}><Ionicons name={step === 2 ? "arrow-back" : "close"} size={28} color={COLORS.text} /></TouchableOpacity>
        <Text style={styles.title}>{step === 1 ? 'Adicionar Detalhes' : 'Avaliar Local'}</Text>
        <View style={{width: 40}} />
      </View>
      {step === 1 ? renderStep1() : renderStep2()}
      <Snackbar
        visible={xpSnackbar.visible}
        onDismiss={() => setXpSnackbar({ ...xpSnackbar, visible: false })}
        duration={2000}
        style={{ backgroundColor: '#43e97b', borderRadius: 16, marginBottom: 60 }}
        action={{ label: '🚀', onPress: () => setXpSnackbar({ ...xpSnackbar, visible: false }) }}
      >
        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{xpSnackbar.message}</Text>
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 50, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border, backgroundColor: COLORS.surface },
  headerButton: { padding: 5 },
  title: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
  scrollContent: { padding: 20, paddingBottom: 40 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, marginBottom: 16, paddingHorizontal: 12 },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, paddingVertical: Platform.OS === 'ios' ? 16 : 12, fontSize: 16, color: COLORS.text },
  clearButton: { padding: 4 },
  addressBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e8f5e9', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: COLORS.success, marginBottom: 16 },
  addressText: { flex: 1, marginLeft: 12, fontSize: 16, color: '#2e7d32' },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: COLORS.text, marginBottom: 16, marginTop: 10 },
  optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12 },
  option: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 10, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', width: '30%' },
  optionSelected: { backgroundColor: COLORS.primaryLight + '30', borderColor: COLORS.primary },
  optionLabel: { fontSize: 12, fontWeight: '500', color: COLORS.textSecondary, textAlign: 'center', marginTop: 6 },
  imagePicker: { alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: COLORS.border, borderStyle: 'dashed', borderRadius: 16, padding: 18, marginTop: 20, backgroundColor: COLORS.surface, height: 150 },
  imagePickerText: { color: COLORS.text, fontSize: 16, fontWeight: '600', marginTop: 8 },
  imagePickerSubtext: { color: COLORS.textSecondary, fontSize: 13, marginTop: 2 },
  imagePreview: { width: '100%', height: '100%', borderRadius: 14 },
  footer: { padding: 20, paddingTop: 10, borderTopWidth: 1, borderTopColor: COLORS.border, backgroundColor: COLORS.background },
  submitBtn: { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  submitText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  starsRow: { flexDirection: 'row', gap: 8 },
  featureRow: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, borderWidth: 1, borderColor: COLORS.border },
  featureInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureLabel: { fontSize: 16, color: COLORS.text },
  secondaryButton: { paddingVertical: 14, alignItems: 'center' },
  secondaryButtonText: { fontSize: 16, fontWeight: '600', color: COLORS.primary },
  commentContainer: { marginTop: 18, marginBottom: 8 },
  commentLabel: { fontSize: 15, color: COLORS.text, fontWeight: '600', marginBottom: 6 },
  commentInputWrapper: { position: 'relative', backgroundColor: COLORS.surface, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, minHeight: 60, paddingRight: 32 },
  commentInput: { minHeight: 60, maxHeight: 120, fontSize: 15, color: COLORS.text, padding: 12, paddingRight: 32 },
  clearCommentButton: { position: 'absolute', right: 6, top: 6, padding: 4 },
  commentCounter: { alignSelf: 'flex-end', fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  typeOption: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    marginRight: 10,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    minWidth: 80,
  },
  typeOptionSelected: {
    backgroundColor: '#e3f2fd',
    borderColor: COLORS.primary,
  },
  typeOptionLabel: {
    fontSize: 13,
    marginTop: 4,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});