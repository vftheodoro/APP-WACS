/**
 * Script para remover arquivos TypeScript após a migração para JavaScript
 */

const fs = require('fs');
const path = require('path');

// Função para deletar arquivos TypeScript
function deleteTypeScriptFiles(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    
    if (fs.statSync(fullPath).isDirectory()) {
      // Recursivamente verificar diretórios
      if (file !== 'node_modules' && file !== '.git') {
        deleteTypeScriptFiles(fullPath);
      }
    } else {
      // Excluir arquivo se for TypeScript
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        try {
          // Verifica se o arquivo JavaScript correspondente existe
          const jsFileName = fullPath.replace(/\.tsx?$/, '.js');
          const jsFileExists = fs.existsSync(jsFileName);
          
          if (jsFileExists) {
            fs.unlinkSync(fullPath);
          } else {
            // console.warn(`Arquivo JavaScript correspondente não encontrado para: ${fullPath}`);
          }
        } catch (error) {
          // console.error(`Erro ao excluir arquivo ${fullPath}:`, error.message);
        }
      }
    }
  }
}

// Executar limpeza
deleteTypeScriptFiles('.'); 