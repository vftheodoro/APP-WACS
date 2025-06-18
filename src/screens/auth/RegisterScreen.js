import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Pressable,
  FlatList,
  Animated,
} from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';

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

const RegisterScreen = () => {
  const navigation = useNavigation();
  const [step, setStep] = useState(1);
  // Etapa 1
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  // Etapa 2
  const [birthdate, setBirthdate] = useState('');
  const [cidade, setCidade] = useState('');
  const [cidadeQuery, setCidadeQuery] = useState('');
  const [showCidadeList, setShowCidadeList] = useState(false);
  const [mobilityType, setMobilityType] = useState('');
  const [showMobilityDropdown, setShowMobilityDropdown] = useState(false);
  const [comorbidades, setComorbidades] = useState([]);
  const [showComorbidadesDropdown, setShowComorbidadesDropdown] = useState(false);
  const [profilePic, setProfilePic] = useState(null);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState('');
  const cidadeInputRef = useRef();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const stepAnim = useRef(new Animated.Value(step)).current;

  useEffect(() => {
    // Animate step change
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: step === 2 ? -30 : 30,
        duration: 180,
        useNativeDriver: true,
      })
    ]).start(() => {
      fadeAnim.setValue(0);
      slideAnim.setValue(step === 2 ? 30 : -30);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        })
      ]).start();
    });
    Animated.timing(stepAnim, {
      toValue: step,
      duration: 350,
      useNativeDriver: false,
    }).start();
  }, [step]);

  // Validação
  const validateStep1 = () => {
    if (!username || !email || !password || !confirmPassword || !fullName) {
      setError('Preencha todos os campos obrigatórios.');
      return false;
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return false;
    }
    setError('');
    return true;
  };
  const validateStep2 = () => {
    if (!birthdate || !cidade || !mobilityType || !acceptTerms) {
      setError('Preencha todos os campos obrigatórios da etapa 2.');
      return false;
    }
    setError('');
    return true;
  };

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

  // Simulação de registro
  const handleRegister = () => {
    if (!validateStep2()) return;
    // Simula registro
    Alert.alert('Sucesso', 'Conta criada com sucesso! Você já pode fazer login.', [
      { text: 'OK', onPress: () => navigation.navigate('Login') }
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#f8fafc' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <LinearGradient colors={['#1976d2', '#2196f3']} style={styles.headerGradient}>
          <View style={styles.headerIconTitleRow}>
            {step === 2 ? (
              <TouchableOpacity style={styles.headerBackBtn} onPress={() => setStep(1)}>
                <Ionicons name="arrow-back" size={26} color="#fff" />
              </TouchableOpacity>
            ) : (
              <View style={{ width: 32 }} />
            )}
            <View style={styles.headerIconTitleCenter}>
              <Ionicons name="person-add" size={38} color="#fff" style={{ marginBottom: 2 }} />
              <Text style={styles.headerTitle}>Criar Conta</Text>
            </View>
            <View style={{ width: 32 }} />
          </View>
          <View style={styles.headerStepIndicator}>
            <Animated.View style={[styles.stepItem, { opacity: stepAnim.interpolate({ inputRange: [1, 2], outputRange: [1, 0.5] }) }] }>
              <Animated.View style={[styles.stepCircle, step === 1 && styles.stepCircleActive, step === 1 && { transform: [{ scale: stepAnim.interpolate({ inputRange: [1, 2], outputRange: [1.1, 1] }) }] }]}>
                <Text style={[styles.stepNumber, step === 1 && styles.stepNumberActive]}>1</Text>
              </Animated.View>
              <Text style={[styles.stepLabel, step === 1 && styles.stepLabelActive]}>Dados</Text>
            </Animated.View>
            <Animated.View style={step === 2 ? styles.stepLineActive : styles.stepLine} />
            <Animated.View style={[styles.stepItem, { opacity: stepAnim.interpolate({ inputRange: [1, 2], outputRange: [0.5, 1] }) }] }>
              <Animated.View style={[styles.stepCircle, step === 2 && styles.stepCircleActive, step === 2 && { transform: [{ scale: stepAnim.interpolate({ inputRange: [1, 2], outputRange: [1, 1.1] }) }] }]}>
                <Text style={[styles.stepNumber, step === 2 && styles.stepNumberActive]}>2</Text>
              </Animated.View>
              <Text style={[styles.stepLabel, step === 2 && styles.stepLabelActive]}>Perfil</Text>
            </Animated.View>
          </View>
        </LinearGradient>
        <View style={styles.formContainer}>
          {error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={20} color="#FF3B30" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
          {step === 1 && (
            <Animated.View style={{ opacity: fadeAnim, transform: [{ translateX: slideAnim }] }}>
              <View>
                <Text style={styles.sectionLabel}>Nome de usuário *</Text>
                <View style={styles.inputGroupRow}>
                  <MaterialIcons name="person" size={22} color="#1976d2" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Nome de usuário"
                    value={username}
                    onChangeText={setUsername}
                    maxLength={32}
                    autoCapitalize="none"
                    accessibilityLabel="Nome de usuário"
                  />
                </View>
                <Text style={styles.sectionLabel}>E-mail *</Text>
                <View style={styles.inputGroupRow}>
                  <MaterialIcons name="email" size={22} color="#1976d2" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="E-mail"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    accessibilityLabel="E-mail"
                  />
                </View>
                <Text style={styles.sectionLabel}>Senha *</Text>
                <View style={styles.inputGroupRow}>
                  <MaterialIcons name="lock" size={22} color="#1976d2" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Senha"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    minLength={6}
                    accessibilityLabel="Senha"
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowPassword(!showPassword)}
                    accessibilityLabel={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color="#1976d2" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.sectionLabel}>Confirmar Senha *</Text>
                <View style={styles.inputGroupRow}>
                  <MaterialIcons name="lock" size={22} color="#1976d2" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Confirmar Senha"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    minLength={6}
                    accessibilityLabel="Confirmar Senha"
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    accessibilityLabel={showConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    <Ionicons name={showConfirmPassword ? 'eye-off' : 'eye'} size={20} color="#1976d2" />
                  </TouchableOpacity>
                </View>
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
                <View style={{ alignItems: 'center', marginTop: 10 }}>
                  <TouchableOpacity style={[styles.button, { minWidth: 180, backgroundColor: 'transparent', shadowColor: 'transparent', elevation: 0 }]} onPress={() => {
                    if (validateStep1()) setStep(2);
                  }}>
                    <LinearGradient colors={['#1976d2', '#2196f3']} style={styles.buttonGradient}>
                      <Text style={styles.buttonText}>Próxima etapa</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.switchForm} onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.switchFormText}>Já tem conta? <Text style={{ color: '#1976d2' }}>Entrar</Text></Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}
          {step === 2 && (
            <Animated.View style={{ opacity: fadeAnim, transform: [{ translateX: slideAnim }] }}>
              <View>
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
                        ref={cidadeInputRef}
                        style={[styles.input, { minWidth: 0 }]}
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
                <View style={{ alignItems: 'center', marginTop: 10, marginBottom: 4 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                    <TouchableOpacity onPress={() => setAcceptTerms(!acceptTerms)} style={styles.checkbox} accessibilityLabel="Aceitar termos">
                      {acceptTerms ? (
                        <Ionicons name="checkbox" size={22} color="#1976d2" />
                      ) : (
                        <Ionicons name="square-outline" size={22} color="#888" />
                      )}
                    </TouchableOpacity>
                    <Text style={{ marginLeft: 8, textAlign: 'center' }}>
                      Li e aceito os <Text style={{ color: '#1976d2', textDecorationLine: 'underline' }}>Termos de Uso</Text> *
                    </Text>
                  </View>
                </View>
                <View style={{ alignItems: 'center', marginTop: 10 }}>
                  <TouchableOpacity style={[styles.button, { minWidth: 180, backgroundColor: 'transparent', shadowColor: 'transparent', elevation: 0 }]} onPress={handleRegister}>
                    <LinearGradient colors={['#1976d2', '#2196f3']} style={styles.buttonGradient}>
                      <Text style={styles.buttonText}>Criar Conta</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.switchForm} onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.switchFormText}>Já tem conta? <Text style={{ color: '#1976d2' }}>Entrar</Text></Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  headerGradient: {
    paddingTop: 28,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerIconTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerBackBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconTitleCenter: {
    alignItems: 'center',
  },
  headerStepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    marginTop: 2,
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e3f2fd',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  stepCircleActive: {
    backgroundColor: '#1976d2',
    shadowColor: '#1976d2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  stepNumber: {
    color: '#1976d2',
    fontWeight: 'bold',
    fontSize: 17,
  },
  stepNumberActive: {
    color: '#fff',
  },
  stepLabel: {
    fontSize: 13,
    color: '#1976d2',
    opacity: 0.7,
    marginTop: 2,
    fontWeight: '500',
  },
  stepLabelActive: {
    color: '#1976d2',
    opacity: 1,
    fontWeight: 'bold',
  },
  stepLine: {
    width: 36,
    height: 4,
    backgroundColor: '#e3f2fd',
    marginHorizontal: 2,
    borderRadius: 2,
    alignSelf: 'center',
  },
  stepLineActive: {
    width: 36,
    height: 4,
    backgroundColor: '#1976d2',
    marginHorizontal: 2,
    borderRadius: 2,
    alignSelf: 'center',
  },
  formContainer: {
    backgroundColor: '#f8fafc',
    padding: 20,
    borderRadius: 20,
    margin: 20,
    marginTop: -18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 15,
  },
  errorText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#FF3B30',
  },
  inputGroupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    marginBottom: 0,
    flex: 1,
  },
  eyeIcon: {
    position: 'absolute',
    right: 14,
    top: 14,
  },
  buttonGradient: {
    borderRadius: 15,
    alignItems: 'center',
    padding: 15,
  },
  infoText: {
    fontSize: 13,
    color: '#f44336',
    marginTop: 4,
  },
  autocompleteList: {
    position: 'absolute',
    top: 54,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#1976d2',
    borderRadius: 10,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  autocompleteItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownList: {
    position: 'absolute',
    top: 54,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#1976d2',
    borderRadius: 10,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  chip: {
    backgroundColor: '#e3f2fd',
    borderRadius: 16,
    paddingVertical: 5,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 8,
  },
  chipText: {
    color: '#1976d2',
    marginRight: 4,
  },
  avatarUpload: {
    position: 'relative',
    width: 90,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: '#1976d2',
    backgroundColor: '#fff',
  },
  avatarUploadBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#1976d2',
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  checkbox: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    backgroundColor: '#1976d2',
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  switchForm: {
    marginTop: 10,
    alignItems: 'center',
  },
  switchFormText: {
    fontSize: 15,
    color: '#333',
  },
  ufCidadeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ufPickerDisabled: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    paddingHorizontal: 10,
    height: 48,
    minWidth: 48,
    justifyContent: 'center',
    marginRight: 6,
  },
  ufPickerText: {
    color: '#888',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 1,
  },
  sectionLabel: { fontSize: 15, fontWeight: '600', color: '#1976d2', marginBottom: 4, marginLeft: 2 },
});

export default RegisterScreen; 