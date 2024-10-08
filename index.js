const puppeteer = require('puppeteer');
const express = require('express');
const path = require('path');
const fs = require('fs');

const PORT = 8000;
const url = 'https://geoserver.car.gov.br/geoserver/web/wicket/bookmarkable/org.geoserver.web.demo.MapPreviewPage?1&filter=false';

const app = express();

// Função para configurar o comportamento de download
async function configureDownload(page, downloadPath) {
    // Habilita o monitoramento de downloads
    const client = await page.target().createCDPSession();
    await client.send('Page.setDownloadBehavior', {
        behavior: 'allow',
        downloadPath: downloadPath
    });
}

// Função para baixar os arquivos com a opção "text/csv"
async function downloadCSVFiles() {
    const browser = await puppeteer.launch({
        headless: true,  // Altere para false se quiser ver o navegador
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    // Define o diretório de download
    const downloadDir = path.resolve(__dirname, 'downloads');
    if (!fs.existsSync(downloadDir)) {
        fs.mkdirSync(downloadDir);
    }

    await configureDownload(page, downloadDir);
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Espera que a lista de camadas (layers) esteja visível
    await page.waitForSelector('table.layerTable tr');

    // Obtém todas as linhas da tabela de camadas (layers)
    const layers = await page.$$('table.layerTable tr');

    for (let i = 0; i < layers.length; i++) {
        const layer = layers[i];

        // Seleciona o nome da camada
        const layerName = await layer.$eval('td.layerTitle a', el => el.textContent.trim());
        console.log(`Baixando arquivo para a camada: ${layerName}`);

        // Tenta localizar o link de download CSV
        try {
            const csvLink = await layer.$eval('td.layerActions a[href*="outputFormat=text/csv"]', el => el.href);

            if (csvLink) {
                console.log(`Link CSV encontrado para a camada: ${layerName}`);

                // Navega até o link de download CSV
                const downloadPath = path.resolve(downloadDir, `${layerName}.csv`);
                const downloadPage = await browser.newPage();
                await downloadPage.goto(csvLink, { waitUntil: 'networkidle2' });

                // Aguarda o download concluir
                await new Promise(resolve => setTimeout(resolve, 10000)); // Ajuste o tempo conforme necessário
                console.log(`Download concluído para a camada: ${layerName}`);
                
                await downloadPage.close();
            }
        } catch (err) {
            console.log(`Não foi possível encontrar o link CSV para a camada: ${layerName}`);
        }
    }

    await browser.close();
}

// Rota simples para iniciar o processo de download
app.get('/download-csv', async (req, res) => {
    try {
      debugger;
        await downloadCSVFiles();
        res.send('Download concluído para todas as camadas em formato CSV!');
    } catch (err) {
        console.error('Erro ao realizar download:', err);
        res.status(500).send('Erro ao realizar o download');
    }
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
