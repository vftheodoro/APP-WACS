# 🚀 Aplicativo WACS

<p align="center">
  <img src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80" alt="Banner Acessibilidade" width="100%"/>
</p>

> **WACS** é um aplicativo móvel robusto, colaborativo e acessível, focado em mobilidade urbana e autonomia de pessoas com deficiência. Permite controle de cadeira de rodas, mapeamento de acessibilidade, perfis sociais e muito mais!

---

## ✨ Funcionalidades Principais

<p align="center">
  <img src="https://cdn-icons-png.flaticon.com/512/3062/3062634.png" alt="Controle Bluetooth" width="120"/>
  <img src="https://cdn-icons-png.flaticon.com/512/854/854878.png" alt="Mapa Acessível" width="120"/>
  <img src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png" alt="Perfil Usuário" width="120"/>
  <img src="https://cdn-icons-png.flaticon.com/512/1827/1827504.png" alt="Notificações" width="120"/>
</p>

- **Controle e Configuração da Cadeira:**
  - Ajuste de parâmetros, status em tempo real e controle total da mobilidade via Bluetooth.
  - <img src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80" alt="Controle Cadeira de Rodas" width="300"/>
- **Mapeamento Colaborativo de Acessibilidade:**
  - Marcação e avaliação de locais acessíveis (restaurantes, banheiros, calçadas, pontos de ônibus).
  - GPS com rotas adaptadas e informações sobre rampas, banheiros e facilidades.
  - Fotos e comentários da comunidade.
  - <img src="https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=400&q=80" alt="Mapa Acessível" width="300"/>
- **Sistema de Perfis:**
  - Criação, personalização e compartilhamento de perfis, interação social e troca de experiências.
  - <img src="https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=400&q=80" alt="Perfil Usuário" width="300"/>
- **Tema Claro/Escuro**
- **Notificações Push**

---

## 🛠️ Tecnologias Utilizadas

<p align="center">
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original.svg" width="60" alt="React Native" title="React Native">
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/firebase/firebase-plain.svg" width="60" alt="Firebase" title="Firebase">
  <img src="https://upload.wikimedia.org/wikipedia/commons/7/75/Google_Maps_icon.svg" width="60" alt="Google Maps" title="Google Maps">
  <img src="https://upload.wikimedia.org/wikipedia/commons/4/4f/Bluetooth.svg" width="60" alt="Bluetooth" title="Bluetooth">
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/arduino/arduino-original.svg" width="60" alt="Arduino" title="Arduino">
</p>

| Mobile/App         | Backend/Cloud | Hardware   | Extras         |
|--------------------|--------------|------------|----------------|
| React Native (Expo)| Firebase     | Arduino    | Google Maps API|
| Bluetooth          |              | C++        | IA/ML          |

---

## 📁 Estrutura do Projeto

```
├── src
│   ├── contexts        # Contextos React (Auth, Theme, etc)
│   ├── screens         # Telas do aplicativo
│   ├── navigation      # Navegação (Stack, Tabs)
│   └── config          # Configurações (ex: Google Maps)
├── assets              # Imagens e ícones
├── scripts             # Scripts auxiliares
├── .env                # Variáveis de ambiente (NÃO subir para o Git!)
```

---

## ⚙️ Configuração e Execução

### 1. Pré-requisitos
- Node.js >= 18
- Expo CLI (`npm install -g expo-cli`)
- Conta Google Maps API e Firebase

### 2. Instalação
```bash
npm install
```

### 3. Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto com:
```env
GOOGLE_MAPS_API_KEY=SuaChaveAqui
```
> **Nunca compartilhe sua chave pública!**

### 4. Executando o Projeto
```bash
# Iniciar o Metro Bundler
npm start
# ou
expo start
```

#### Android/iOS
```bash
expo run:android
expo run:ios
```

#### Web
```bash
expo start --web
```

### 5. Dicas para Google Maps
- Certifique-se de ativar a API de Maps no console do Google Cloud.
- Se usar Expo Go, variáveis de ambiente podem não funcionar. Prefira build nativo (`expo prebuild`).

---

## 🧑‍💻 Contribuição
1. Faça um fork do projeto
2. Crie uma branch: `git checkout -b minha-feature`
3. Commit suas alterações: `git commit -m 'feat: minha nova feature'`
4. Push na branch: `git push origin minha-feature`
5. Abra um Pull Request

---

## 📄 Licença
Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 📬 Contato & Suporte
- Desenvolvedor: [Seu Nome](mailto:seuemail@exemplo.com)
- Issues e sugestões: [GitHub Issues](https://github.com/seuusuario/app-wacs/issues)

---

> Feito com ❤️ para promover acessibilidade e autonomia!
