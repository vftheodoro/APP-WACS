import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';

// Constantes reutilizadas do RegisterScreen
const cidadesValeRibeira = [
  'Apiaí', 'Barra do Chapéu', 'Barra do Turvo', 'Cajati', 'Cananéia', 'Eldorado',
  'Iguape', 'Ilha Comprida', 'Iporanga', 'Itaoca', 'Itapirapuã Paulista', 'Itariri',
  'Jacupiranga', 'Juquiá', 'Juquitiba', 'Miracatu', 'Pariquera-Açu', 'Pedro de Toledo',
  'Registro', 'Ribeira', 'São Lourenço da Serra', 'Sete Barras', 'Tapiraí'
];

const mobilityOptions = [
  { value: 'cadeira', icon: 'wheelchair', label: 'Cadeira de rodas' },
  { value: 'andador', icon: 'walking', label: 'Andador' },
  { value: 'muleta', icon: 'crutch', label: 'Muleta' },
  { value: 'visual', icon: 'low-vision', label: 'Deficiência visual' },
  { value: 'auditiva', icon: 'deaf', label: 'Deficiência auditiva' },
  { value: 'outra', icon: 'question', label: 'Outra' },
  { value: 'nenhuma', icon: 'check', label: 'Nenhuma' },
];

const comorbidadesOptions = [
  { value: 'diabetes', label: 'Diabetes' },
  { value: 'hipertensao', label: 'Hipertensão' },
  { value: 'cardio', label: 'Doença cardiovascular' },
  { value: 'respiratorio', label: 'Problemas respiratórios' },
  { value: 'outra', label: 'Outro' },
  { value: 'nenhuma', label: 'Nenhuma' },
];

/**
 * ProfileForm - Formulário avançado de perfil/registro
 * Props:
 *  initialValues: { ... } // valores iniciais dos campos
 *  onSave: (values) => void // callback ao salvar
 *  onCancel: () => void // callback ao cancelar
 *  readOnlyEmail: boolean // email somente leitura
 *  showTerms: boolean // exibe aceite de termos (apenas leitura)
 *  isEditMode: boolean // modo edição (true) ou registro (false)
 *  loading: boolean // exibe loading no botão salvar
 */
const ProfileForm = ({
  initialValues = {},
  onSave,
  onCancel,
  readOnlyEmail = false,
  showTerms = false,
  isEditMode = false,
  loading = false,
}) => {
  // Estados dos campos
  const [username, setUsername] = useState(initialValues.username || '');
  const [email, setEmail] = useState(initialValues.email || '');
  const [fullName, setFullName] = useState(initialValues.fullName || '');
  const [birthdate, setBirthdate] = useState(initialValues.birthdate || '');
  const [cidade, setCidade] = useState(initialValues.cidade || '');
  const [cidadeQuery, setCidadeQuery] = useState(initialValues.cidade || '');
  const [showCidadeList, setShowCidadeList] = useState(false);
  const [mobilityType, setMobilityType] = useState(initialValues.mobilityType || '');
  const [showMobilityDropdown, setShowMobilityDropdown] = useState(false);
  const [comorbidades, setComorbidades] = useState(initialValues.comorbidades || []);
  const [showComorbidadesDropdown, setShowComorbidadesDropdown] = useState(false);
  const [profilePic, setProfilePic] = useState(initialValues.profilePic || null);
  const [acceptTerms, setAcceptTerms] = useState(initialValues.acceptTerms || false);
  const [error, setError] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState(initialValues.phoneNumber || '');
  const [instagram, setInstagram] = useState(initialValues.instagram || '');

  // Autocomplete cidades
  const filteredCidades = cidadesValeRibeira.filter(c =>
    c.toLowerCase().includes(cidadeQuery.toLowerCase())
  );

  // Multi-select comorbidades
  const toggleComorbidade = (value) => {
    if (value === 'nenhuma') {
      setComorbidades(['nenhuma']);
    } else {
      setComorbidades(prev => {
        const filtered = prev.filter(v => v !== 'nenhuma');
        if (filtered.includes(value)) {
          return filtered.filter(v => v !== value);
        } else {
          return [...filtered, value];
        }
      });
    }
  };

  // Upload de foto
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets && result.assets[0].uri) {
      setProfilePic(result.assets[0].uri);
    }
  };

  // Validação básica
  const validate = () => {
    if (!fullName || !birthdate || !cidadeQuery || !mobilityType) {
      setError('Preencha todos os campos obrigatórios.');
      return false;
    }
    // Validação básica de telefone (opcional)
    if (phoneNumber && phoneNumber.length < 8) {
      setError('Telefone inválido.');
      return false;
    }
    // Validação básica de Instagram (opcional)
    if (instagram && !/^@?\w{1,30}$/.test(instagram)) {
      setError('Instagram inválido.');
      return false;
    }
    setError('');
    return true;
  };

  // Submit
  const handleSubmit = () => {
    if (!validate()) return;
    onSave && onSave({
      username,
      email,
      fullName,
      birthdate,
      cidade: cidadeQuery,
      mobilityType,
      comorbidades,
      profilePic,
      acceptTerms,
      phoneNumber,
      instagram,
    });
  };

  // Render
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.formContainer} keyboardShouldPersistTaps="handled">
        {error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={20} color="#FF3B30" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
        {/* Nome completo */}
        <Text style={styles.sectionLabel}>Nome completo *</Text>
        <View style={styles.inputGroupRow}>
          <MaterialIcons name="badge" size={22} color="#1976d2" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Nome completo"
            value={fullName}
            onChangeText={setFullName}
            maxLength={64}
            accessibilityLabel="Nome completo"
          />
        </View>
        {/* Email */}
        <Text style={styles.sectionLabel}>E-mail *</Text>
        <View style={styles.inputGroupRow}>
          <MaterialIcons name="email" size={22} color="#1976d2" style={styles.inputIcon} />
          <TextInput
            style={[styles.input, readOnlyEmail && { backgroundColor: '#f0f0f0', color: '#888' }]}
            placeholder="E-mail"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            accessibilityLabel="E-mail"
            editable={!readOnlyEmail}
          />
        </View>
        {/* Data de nascimento */}
        <Text style={styles.sectionLabel}>Data de nascimento *</Text>
        <View style={styles.inputGroupRow}>
          <MaterialIcons name="calendar-today" size={22} color="#1976d2" style={styles.inputIcon} />
          <TouchableOpacity
            style={[styles.input, { flexDirection: 'row', alignItems: 'center' }]}
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.8}
            accessibilityLabel="Data de nascimento"
          >
            <Text style={{ color: birthdate ? '#222' : '#888', flex: 1 }}>
              {birthdate ?
                new Date(birthdate).toLocaleDateString('pt-BR') :
                'Selecione a data'}
            </Text>
            <Ionicons name="calendar" size={20} color="#888" />
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={birthdate ? new Date(birthdate) : new Date(2000, 0, 1)}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              maximumDate={new Date()}
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) {
                  setBirthdate(selectedDate.toISOString().split('T')[0]);
                }
              }}
            />
          )}
        </View>
        {/* Estado e Cidade */}
        <Text style={styles.sectionLabel}>Estado e Cidade *</Text>
        <View style={styles.inputGroupRow}>
          <MaterialIcons name="location-city" size={22} color="#1976d2" style={styles.inputIcon} />
          <View style={styles.ufCidadeRow}>
            <View style={styles.ufPickerDisabled}>
              <Text style={styles.ufPickerText}>SP</Text>
              <Ionicons name="lock-closed" size={16} color="#888" style={{ marginLeft: 2 }} />
            </View>
            <View style={{ flex: 1, position: 'relative', maxWidth: 200 }}>
              <TextInput
                style={[styles.input, { minWidth: 0, maxWidth: 180 }]}
                placeholder="Digite sua cidade"
                value={cidadeQuery}
                onChangeText={text => {
                  setCidadeQuery(text);
                  setShowCidadeList(true);
                  setCidade('');
                }}
                onFocus={() => setShowCidadeList(true)}
                autoCapitalize="words"
                accessibilityLabel="Cidade"
              />
              {showCidadeList && cidadeQuery.length > 0 && (
                <View style={styles.autocompleteList}>
                  <ScrollView style={{ maxHeight: 120 }} keyboardShouldPersistTaps="handled">
                    {filteredCidades.map(item => (
                      <TouchableOpacity
                        key={item}
                        style={styles.autocompleteItem}
                        onPress={() => {
                          setCidade(item);
                          setCidadeQuery(item);
                          setShowCidadeList(false);
                        }}
                      >
                        <Text>{item}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          </View>
        </View>
        {/* Tipo de Mobilidade */}
        <Text style={styles.sectionLabel}>Tipo de Mobilidade *</Text>
        <View style={styles.inputGroupRow}>
          <FontAwesome5 name="wheelchair" size={20} color="#1976d2" style={styles.inputIcon} />
          <TouchableOpacity
            style={[styles.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
            onPress={() => setShowMobilityDropdown(!showMobilityDropdown)}
            activeOpacity={0.8}
            accessibilityLabel="Tipo de mobilidade"
          >
            <Text style={{ color: mobilityType ? '#222' : '#888' }}>
              {mobilityType ? mobilityOptions.find(opt => opt.value === mobilityType)?.label : 'Selecione'}
            </Text>
            <Ionicons name={showMobilityDropdown ? 'chevron-up' : 'chevron-down'} size={20} color="#888" />
          </TouchableOpacity>
          {showMobilityDropdown && (
            <View style={styles.dropdownList}>
              {mobilityOptions.map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setMobilityType(opt.value);
                    setShowMobilityDropdown(false);
                  }}
                >
                  <FontAwesome5 name={opt.icon} size={18} color="#1976d2" style={{ marginRight: 10 }} solid />
                  <Text>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
        {/* Comorbidades */}
        <Text style={styles.sectionLabel}>Comorbidades / Necessidades Especiais</Text>
        <View style={styles.inputGroupRow}>
          <MaterialIcons name="healing" size={22} color="#1976d2" style={styles.inputIcon} />
          <TouchableOpacity
            style={[styles.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
            onPress={() => setShowComorbidadesDropdown(!showComorbidadesDropdown)}
            activeOpacity={0.8}
            accessibilityLabel="Comorbidades"
          >
            <Text style={{ color: comorbidades.length ? '#222' : '#888' }}>
              {comorbidades.length
                ? comorbidades.map(val => comorbidadesOptions.find(opt => opt.value === val)?.label || val).join(', ')
                : 'Selecione'}
            </Text>
            <Ionicons name={showComorbidadesDropdown ? 'chevron-up' : 'chevron-down'} size={20} color="#888" />
          </TouchableOpacity>
          {showComorbidadesDropdown && (
            <View style={styles.dropdownList}>
              {comorbidadesOptions.map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  style={styles.dropdownItem}
                  onPress={() => toggleComorbidade(opt.value)}
                >
                  <Text>{opt.label}</Text>
                  {comorbidades.includes(opt.value) && (
                    <Ionicons name="checkmark" size={18} color="#1976d2" style={{ marginLeft: 10 }} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
        <View style={styles.chipsContainer}>
          {comorbidades.map(val => (
            <View key={val} style={styles.chip}>
              <Text style={styles.chipText}>{comorbidadesOptions.find(opt => opt.value === val)?.label || val}</Text>
              <TouchableOpacity onPress={() => toggleComorbidade(val)}>
                <Ionicons name="close-circle" size={16} color="#888" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
        {/* Foto de Perfil */}
        <Text style={[styles.sectionLabel, { textAlign: 'center', marginTop: 18 }]}>Foto de Perfil (opcional)</Text>
        <View style={{ alignItems: 'center', marginBottom: 10 }}>
          <TouchableOpacity style={styles.avatarUpload} onPress={pickImage} accessibilityLabel="Foto de perfil">
            {profilePic ? (
              <Image
                source={{ uri: profilePic }}
                style={styles.avatar}
              />
            ) : (
              <View style={[styles.avatar, { alignItems: 'center', justifyContent: 'center' }]}> 
                <Ionicons name="person-circle" size={80} color="#b0b0b0" />
              </View>
            )}
            <View style={styles.avatarUploadBtn}>
              <Ionicons name="camera" size={18} color="#fff" />
            </View>
          </TouchableOpacity>
        </View>
        {/* Aceite de Termos */}
        {showTerms && (
          <View style={{ alignItems: 'center', marginTop: 10, marginBottom: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={acceptTerms ? 'checkbox' : 'square-outline'} size={22} color={acceptTerms ? '#1976d2' : '#888'} />
              <Text style={{ marginLeft: 8, textAlign: 'center' }}>
                Li e aceito os <Text style={{ color: '#1976d2', textDecorationLine: 'underline' }}>Termos de Uso</Text>
              </Text>
            </View>
          </View>
        )}
        {/* Telefone/Celular */}
        <Text style={styles.sectionLabel}>Telefone/Celular</Text>
        <View style={styles.inputGroupRow}>
          <MaterialIcons name="phone" size={22} color="#1976d2" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="(XX) XXXXX-XXXX"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            maxLength={20}
            accessibilityLabel="Telefone"
          />
        </View>
        {/* Instagram */}
        <Text style={styles.sectionLabel}>Instagram</Text>
        <View style={styles.inputGroupRow}>
          <FontAwesome5 name="instagram" size={20} color="#1976d2" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="@seuusuario"
            value={instagram}
            onChangeText={setInstagram}
            autoCapitalize="none"
            maxLength={32}
            accessibilityLabel="Instagram"
          />
        </View>
        {/* Botões */}
        <View style={styles.formButtonsRowCompact}>
          <TouchableOpacity
            style={styles.formCancelButtonCompact}
            onPress={onCancel}
            activeOpacity={0.85}
            accessibilityLabel="Cancelar edição"
          >
            <Text style={styles.formCancelButtonTextCompact}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.formSaveButtonCompact}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
            accessibilityLabel={isEditMode ? 'Salvar alterações' : 'Registrar'}
          >
            <LinearGradient colors={['#1976d2', '#2196f3']} style={styles.formSaveButtonGradientCompact}>
              <Text style={styles.formSaveButtonTextCompact}>{loading ? 'Salvando...' : isEditMode ? 'Salvar' : 'Registrar'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  formContainer: {
    backgroundColor: '#fff',
    padding: 28,
    borderRadius: 28,
    margin: 0,
    marginTop: 0,
    shadowColor: '#1976d2',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.13,
    shadowRadius: 16,
    elevation: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.12)',
    padding: 16,
    borderRadius: 16,
    marginBottom: 22,
  },
  errorText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '600',
  },
  sectionLabel: {
    fontSize: 17,
    color: '#1976d2',
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 22,
    letterSpacing: 0.3,
  },
  inputGroupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 26,
  },
  inputIcon: {
    marginRight: 14,
  },
  input: {
    backgroundColor: '#f7fafd',
    borderRadius: 16,
    padding: 18,
    fontSize: 17,
    borderWidth: 2,
    borderColor: '#e3f2fd',
    marginBottom: 0,
    flex: 1,
    shadowColor: '#1976d2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  button: {
    backgroundColor: '#1976d2',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 0,
    marginBottom: 0,
    shadowColor: '#1976d2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
    minWidth: 120,
  },
  buttonGradient: {
    borderRadius: 16,
    alignItems: 'center',
    padding: 16,
    width: '100%',
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    marginRight: 0,
  },
  cancelButtonText: {
    color: '#1976d2',
    fontWeight: 'bold',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: 'transparent',
    marginLeft: 0,
  },
  chip: {
    backgroundColor: '#e3f2fd',
    borderRadius: 18,
    paddingVertical: 7,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
    marginBottom: 10,
    shadowColor: '#1976d2',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  chipText: {
    color: '#1976d2',
    fontWeight: 'bold',
    marginRight: 6,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
    marginBottom: 10,
  },
  avatarUpload: {
    position: 'relative',
    width: 110,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: '#1976d2',
    backgroundColor: '#fff',
  },
  avatarUploadBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#1976d2',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#1976d2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.13,
    shadowRadius: 5,
    elevation: 4,
  },
  ufCidadeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ufPickerDisabled: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#e3f2fd',
    paddingHorizontal: 12,
    height: 52,
    minWidth: 52,
    justifyContent: 'center',
    marginRight: 8,
  },
  ufPickerText: {
    color: '#888',
    fontWeight: 'bold',
    fontSize: 17,
    letterSpacing: 1,
  },
  autocompleteList: {
    position: 'absolute',
    top: 58,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#1976d2',
    borderRadius: 12,
    zIndex: 10,
    shadowColor: '#1976d2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 5,
  },
  autocompleteItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownList: {
    position: 'absolute',
    top: 58,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#1976d2',
    borderRadius: 12,
    zIndex: 10,
    shadowColor: '#1976d2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 5,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  formButtonsRowCompact: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
    gap: 14,
  },
  formCancelButtonCompact: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#1976d2',
    borderRadius: 18,
    padding: 18,
    minWidth: 120,
  },
  formCancelButtonTextCompact: {
    color: '#1976d2',
    fontWeight: 'bold',
    fontSize: 17,
  },
  formSaveButtonCompact: {
    backgroundColor: 'transparent',
    minWidth: 120,
  },
  formSaveButtonGradientCompact: {
    borderRadius: 18,
    alignItems: 'center',
    padding: 18,
    width: '100%',
  },
  formSaveButtonTextCompact: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});

export default ProfileForm; 