# Regras de Segurança Recomendadas para Firebase

## Regras para Firebase Storage

Para garantir que a funcionalidade de upload de imagens funcione corretamente, configure as seguintes regras no console do Firebase Storage:

```rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Permissão para ler e escrever para usuários autenticados
    match /users/{userId}/{allPaths=**} {
      // Permitir leitura para qualquer pessoa
      allow read;
      
      // Permitir escrita apenas para o usuário dono da pasta
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Regras padrão para demais arquivos
    match /{allPaths=**} {
      allow read;
      allow write: if request.auth != null;
    }
  }
}
```

## Como aplicar essas regras

1. Acesse o [Console do Firebase](https://console.firebase.google.com/)
2. Selecione seu projeto
3. No menu lateral, clique em "Storage"
4. Clique na aba "Regras"
5. Copie e cole as regras acima
6. Clique em "Publicar"

## Explicação das Regras

- `match /users/{userId}/{allPaths=**}`: Esta regra se aplica a todos os arquivos na pasta de um usuário específico
  - `allow read`: Qualquer pessoa pode visualizar as imagens de perfil
  - `allow write: if request.auth != null && request.auth.uid == userId`: Apenas o próprio usuário pode fazer upload ou modificar seus arquivos

- `match /{allPaths=**}`: Esta regra se aplica a todos os outros arquivos
  - `allow read`: Qualquer pessoa pode visualizar os arquivos
  - `allow write: if request.auth != null`: Apenas usuários autenticados podem fazer upload

## Estrutura de Pastas

O aplicativo usa a seguinte estrutura de pastas no Firebase Storage:

```
/users/
  /{userId}/
    profile_picture.jpg
```

Cada usuário terá sua imagem de perfil armazenada em sua própria pasta, identificada pelo seu ID único. 