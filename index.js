const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Lista das siglas dos estados brasileiros
const siglaEstados = [
  'ac', 'al', 'am', 'ap', 'ba', 'ce', 'df', 'es', 'go', 'ma',
  'mg', 'ms', 'mt', 'pa', 'pb', 'pe', 'pi', 'pr', 'rj', 'rn',
  'ro', 'rr', 'rs', 'sc', 'se', 'sp', 'to'
];

// Tipo de arquivo que será baixado (pode ser 'csv', 'json', etc.)
const tipoArquivo = 'csv';

// Cria a pasta downloads se ela ainda não existir
const downloadDir = path.resolve(__dirname, 'downloads');
if (!fs.existsSync(downloadDir)) {
  fs.mkdirSync(downloadDir);
}

// Função para fazer download de um arquivo e salvá-lo
async function downloadFile(url, fileName) {
  const filePath = path.resolve(downloadDir, fileName);
  const writer = fs.createWriteStream(filePath);

  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream'
  });

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

// Função principal que itera sobre os estados e baixa os arquivos
async function downloadFiles() {
  for (let index = 0; index < siglaEstados.length; index++) {
    const sigla = siglaEstados[index];

    // Monta a URL para o download
    const url = `https://geoserver.car.gov.br/geoserver/sicar/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=sicar%3Asicar_imoveis_${sigla}&outputFormat=${tipoArquivo}`;

    // Nome do arquivo salvo localmente
    const fileName = `sicar_imoveis_${sigla}.${tipoArquivo}`;

    try {
      console.log(`Baixando arquivo para ${sigla}...`);
      await downloadFile(url, fileName);
      console.log(`Download concluído para ${sigla}`);
    } catch (error) {
      console.error(`Erro ao baixar arquivo para ${sigla}:`, error.message);
    }
  }
}

// Executa a função principal
downloadFiles()
  .then(() => console.log('Todos os downloads foram concluídos.'))
  .catch(err => console.error('Erro ao executar os downloads:', err));
