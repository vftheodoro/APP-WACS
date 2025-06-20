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
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useRoute, useNavigation } from '@react-navigation/native';
import { db, storage, auth } from '../services/firebase/config';
import { collection, addDoc, serverTimestamp, runTransaction, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

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

  useEffect(() => {
    if (photoUrl) {
      setImage({ uri: photoUrl });
    }
  }, [photoUrl]);

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
            comment: '',
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

      const locationsCollectionRef = collection(db, 'locations');
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
        };
        transaction.set(newLocationRef, locationPayload);
        if (reviewData) {
          const reviewCollectionRef = collection(db, 'locations', newLocationRef.id, 'reviews');
          const newReviewRef = doc(reviewCollectionRef);
          transaction.set(newReviewRef, {
            ...reviewData,
            createdAt: serverTimestamp(),
            user: { id: currentUser.uid, name: currentUser.displayName, photoURL: currentUser.photoURL },
          });
        }
      });
      Alert.alert("Sucesso!", "Novo local adicionado com sucesso.");
      navigation.navigate('LocationsList');
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
});