import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { db, storage, auth } from '../../services/firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function ContributeToLocationScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { locationId } = route.params;
  const [infoText, setInfoText] = useState('');
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Permita acesso à galeria para adicionar imagens.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [16, 9],
      allowsMultipleSelection: true,
      selectionLimit: 3,
    });
    if (!result.canceled && result.assets) {
      setImages([...images, ...result.assets]);
    }
  };

  const handleSubmit = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      Alert.alert('Erro', 'Você precisa estar logado para contribuir.');
      return;
    }
    if (!infoText.trim() && images.length === 0) {
      Alert.alert('Campos obrigatórios', 'Adicione uma informação ou imagem.');
      return;
    }
    setUploading(true);
    try {
      let imageUrls = [];
      for (const img of images) {
        const response = await fetch(img.uri);
        const blob = await response.blob();
        const filename = `contributions/${locationId}/${currentUser.uid}_${Date.now()}_${img.uri.split('/').pop()}`;
        const imageRef = ref(storage, filename);
        await uploadBytes(imageRef, blob);
        const url = await getDownloadURL(imageRef);
        imageUrls.push(url);
      }
      const contribRef = collection(db, 'accessibleLocations', locationId, 'contributions');
      await addDoc(contribRef, {
        userId: currentUser.uid,
        userName: currentUser.displayName || currentUser.email || 'Usuário',
        infoText: infoText.trim(),
        images: imageUrls,
        createdAt: serverTimestamp(),
      });
      Alert.alert('Sucesso', 'Contribuição enviada!');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível enviar sua contribuição.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Contribuir com este local</Text>
      <TextInput
        style={styles.input}
        placeholder="Adicione informações, dicas ou correções..."
        value={infoText}
        onChangeText={setInfoText}
        multiline
        maxLength={400}
      />
      <View style={styles.imagesRow}>
        {images.map((img, idx) => (
          <Image key={idx} source={{ uri: img.uri }} style={styles.imagePreview} />
        ))}
        {images.length < 3 && (
          <TouchableOpacity style={styles.addImageBtn} onPress={handlePickImage}>
            <Ionicons name="camera" size={28} color="#1976d2" />
            <Text style={{ color: '#1976d2', fontSize: 13 }}>Adicionar Imagem</Text>
          </TouchableOpacity>
        )}
      </View>
      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={uploading}>
        {uploading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Enviar Contribuição</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, backgroundColor: '#f8fafc', flexGrow: 1 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1976d2', marginBottom: 18 },
  input: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e0e0e0', padding: 14, fontSize: 16, minHeight: 80, marginBottom: 18 },
  imagesRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 10 },
  imagePreview: { width: 70, height: 70, borderRadius: 10, marginRight: 8, marginBottom: 8 },
  addImageBtn: { alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#1976d2', borderRadius: 10, padding: 12, backgroundColor: '#e3f2fd', width: 70, height: 70 },
  submitBtn: { backgroundColor: '#1976d2', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 10 },
  submitText: { color: '#fff', fontWeight: 'bold', fontSize: 17 },
}); 