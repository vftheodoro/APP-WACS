/**
 * Script para verificar a migração de TypeScript para JavaScript
 */

const fs = require('fs');
const path = require('path');

// Função para verificar a extensão dos arquivos
function checkFileExtensions(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    
    if (fs.statSync(fullPath).isDirectory()) {
      // Recursivamente verificar diretórios
      if (file !== 'node_modules' && file !== '.git') {
        checkFileExtensions(fullPath);
      }
    } else {
      // Verificar extensão de arquivo
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        console.warn(`Arquivo TypeScript encontrado: ${fullPath}`);
      }
    }
  }
}

// Verificar se o package.json tem dependências TypeScript
function checkPackageJson() {
  const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
  const dependencies = { 
    ...packageJson.dependencies, 
    ...packageJson.devDependencies 
  };
  
  const typescriptDeps = Object.keys(dependencies).filter(dep => 
    dep === 'typescript' || dep.startsWith('@types/')
  );
  
  if (typescriptDeps.length > 0) {
    console.warn('Dependências TypeScript encontradas no package.json:', typescriptDeps);
  } else {
    console.log('Nenhuma dependência TypeScript encontrada no package.json');
  }
  
  // Verificar o ponto de entrada
  if (packageJson.main && packageJson.main.endsWith('.ts')) {
    console.warn(`Ponto de entrada ainda é um arquivo TypeScript: ${packageJson.main}`);
  } else {
    console.log(`Ponto de entrada validado: ${packageJson.main}`);
  }
}

// Executar verificações
console.log('Iniciando verificação da migração de TypeScript para JavaScript...');
checkPackageJson();
console.log('Verificando extensões de arquivos...');
checkFileExtensions('.');
console.log('Verificação concluída!'); 