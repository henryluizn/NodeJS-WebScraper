const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const url = 'https://geoserver.car.gov.br/geoserver/web/wicket/bookmarkable/org.geoserver.web.demo.MapPreviewPage?1';

// Função para baixar o arquivo CSV a partir de um link
async function downloadCSV(link, fileName) {
  const filePath = path.resolve(__dirname, 'downloads', fileName);
  const writer = fs.createWriteStream(filePath);

  const response = await axios({
    url: link,
    method: 'GET',
    responseType: 'stream',
  });

  // Escreve o arquivo baixado no sistema de arquivos
  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

// Função para carregar os dados da página e baixar os arquivos CSV
async function downloadCSVFiles() {
  // Cria a pasta 'downloads' caso não exista
  const downloadDir = path.resolve(__dirname, 'downloads');
  if (!fs.existsSync(downloadDir)) {
    fs.mkdirSync(downloadDir);
  }

  try {
    // Faz a requisição à página que contém os links para os CSVs
    const { data } = await axios.get(url);

    // Usa cheerio para parsear o HTML e encontrar os links
    const $ = cheerio.load(data);

    // Busca todos os links que contêm 'outputFormat=text/csv' no href
    const promises = [];
    $('table.layerTable tr').each((index, element) => {
      const layerName = $(element).find('td.layerTitle a').text().trim();
      const csvLink = $(element).find('td.layerActions a[href*="outputFormat=text/csv"]').attr('href');

      if (csvLink) {
        const fullLink = `https://geoserver.car.gov.br${csvLink}`;
        const fileName = `${layerName}.csv`;

        console.log(`Baixando arquivo CSV para a camada: ${layerName}`);
        
        // Adiciona a promessa do download à lista
        promises.push(downloadCSV(fullLink, fileName).then(() => {
          console.log(`Download concluído para a camada: ${layerName}`);
        }).catch(err => {
          console.log(`Erro ao baixar CSV para a camada ${layerName}:`, err);
        }));
      } else {
        console.log(`Não foi encontrado link CSV para a camada: ${layerName}`);
      }
    });

    // Espera que todas as promessas de download sejam concluídas
    await Promise.all(promises);
  } catch (error) {
    console.error('Erro ao carregar a página ou baixar os arquivos:', error);
  }
}

// Executa a função de download
downloadCSVFiles().then(() => {
  console.log('Todos os downloads concluídos.');
}).catch(err => {
  console.error('Erro ao executar o download:', err);
});
