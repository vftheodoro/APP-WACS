import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Image } from 'react-native';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

const ACCESSIBILITY_OPTIONS = [
  { key: 'wheelchair', label: 'Cadeira de Rodas', icon: <FontAwesome5 name="wheelchair" size={20} color="#007AFF" /> },
  { key: 'blind', label: 'Piso Tátil', icon: <FontAwesome5 name="walking" size={20} color="#007AFF" /> },
  { key: 'deaf', label: 'Rampa', icon: <MaterialCommunityIcons name="stairs" size={20} color="#007AFF" /> },
  { key: 'elevator', label: 'Elevador', icon: <MaterialCommunityIcons name="elevator" size={20} color="#007AFF" /> },
  { key: 'parking', label: 'Banheiro Adaptado', icon: <FontAwesome5 name="restroom" size={20} color="#007AFF" /> },
];

export default function AddLocationModal({ visible, onClose, onSubmit, navigation, selectedLocation }) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  // Novo: para controlar se o usuário já selecionou um local
  const [locationSelected, setLocationSelected] = useState(false);
  const [accessibility, setAccessibility] = useState([]);
  const [image, setImage] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  // Preencher campos quando selectedLocation mudar
  React.useEffect(() => {
    if (selectedLocation) {
      console.log('Modal recebeu localização:', selectedLocation);
      setLatitude(String(selectedLocation.latitude || ''));
      setLongitude(String(selectedLocation.longitude || ''));
      setAddress(selectedLocation.address || '');
      setLocationSelected(true);
    }
  }, [selectedLocation]);

  const handleSelectOption = (key) => {
    setAccessibility((prev) => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
    if (!result.canceled && result.assets && result.assets[0]) {
      setImage(result.assets[0]);
    }
  };

  const handleSubmit = async () => {
    if (!name || !address || !latitude || !longitude || !image) {
      Alert.alert('Preencha todos os campos obrigatórios.');
      return;
    }
    setSubmitting(true);
    await onSubmit({ name, address, latitude, longitude, accessibility, image });
    setSubmitting(false);
    setName('');
    setAddress('');
    setLatitude('');
    setLongitude('');
    setAccessibility([]);
    setImage(null);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>Adicionar Local Acessível</Text>
            <TextInput
              style={styles.input}
              placeholder="Nome do Local"
              value={name}
              onChangeText={setName}
            />
            {/* Botão para selecionar local no mapa */}
            <TouchableOpacity
              style={styles.selectLocationBtn}
              onPress={() => {
                if (!navigation) {
                  Alert.alert('Erro', 'Navegação não disponível');
                  return;
                }
                navigation.navigate('SelectLocationMap', {
                  returnScreen: 'LocationsList',
                });
              }}
            >
              <Ionicons name="location" size={20} color="#007AFF" />
              <Text style={styles.selectLocationText}>
                {locationSelected && address ? `Local selecionado: ${address}` : 'Selecionar Local'}
              </Text>
            </TouchableOpacity>
            <Text style={styles.label}>Recursos de Acessibilidade</Text>
            <View style={styles.optionsRow}>
              {ACCESSIBILITY_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.option, accessibility.includes(opt.key) && styles.optionSelected]}
                  onPress={() => handleSelectOption(opt.key)}
                >
                  {opt.icon}
                  <Text style={styles.optionLabel}>{opt.label}</Text>
                  {accessibility.includes(opt.key) && <Ionicons name="checkmark-circle" size={18} color="#34C759" style={{ marginLeft: 4 }} />}
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.imagePicker} onPress={handlePickImage}>
              {image ? (
                <Image source={{ uri: image.uri }} style={styles.imagePreview} />
              ) : (
                <>
                  <Ionicons name="image" size={32} color="#aaa" />
                  <Text style={styles.imagePickerText}>Selecionar imagem do local</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
              <Text style={styles.submitText}>{submitting ? 'Salvando...' : 'Salvar Local'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={submitting}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 20,
    width: '92%',
    maxHeight: '90%',
    alignSelf: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 14,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
    marginBottom: 10,
    backgroundColor: '#fafbfc',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  label: {
    fontSize: 15,
    color: '#333',
    marginBottom: 6,
    fontWeight: '500',
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 14,
    gap: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 8,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#f6faff',
  },
  optionSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#e6f0ff',
  },
  optionLabel: {
    marginLeft: 6,
    fontSize: 13,
    color: '#222',
  },
  imagePicker: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 18,
    marginBottom: 14,
    backgroundColor: '#fafbfc',
  },
  imagePickerText: {
    color: '#888',
    fontSize: 13,
    marginTop: 6,
  },
  imagePreview: {
    width: 120,
    height: 80,
    borderRadius: 8,
    marginBottom: 6,
  },
  submitBtn: {
    backgroundColor: '#34C759',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  submitText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  cancelBtn: {
    backgroundColor: '#eee',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 6,
  },
  cancelText: {
    color: '#333',
    fontWeight: 'bold',
  },
});
