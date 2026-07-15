require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

const KAGGLE_USERNAME = process.env.KAGGLE_USERNAME;
const KAGGLE_KEY = process.env.KAGGLE_KEY;

if (!KAGGLE_USERNAME || !KAGGLE_KEY) {
  console.error("ERRO: As credenciais do Kaggle não foram encontradas no arquivo .env");
  console.error("Adicione KAGGLE_USERNAME e KAGGLE_KEY ao seu arquivo .env.");
  process.exit(1);
}

const DATASET_OWNER = 'franckepeixoto';
const DATASET_NAME = 'tabela-fipe';
const URL = `https://www.kaggle.com/api/v1/datasets/download/${DATASET_OWNER}/${DATASET_NAME}`;

async function downloadDataset() {
  console.log(`Baixando dataset ${DATASET_OWNER}/${DATASET_NAME}...`);
  
  try {
    const response = await axios({
      method: 'GET',
      url: URL,
      responseType: 'arraybuffer',
      auth: {
        username: KAGGLE_USERNAME,
        password: KAGGLE_KEY
      }
    });

    const zipPath = path.join(__dirname, 'dataset.zip');
    fs.writeFileSync(zipPath, response.data);
    console.log("Download concluído. Descompactando...");

    const zip = new AdmZip(zipPath);
    const extractDir = path.join(__dirname, 'extracted_fipe');
    zip.extractAllTo(extractDir, true);
    
    console.log("Arquivos extraídos em:", extractDir);
    fs.unlinkSync(zipPath);

    // List extracted files
    const files = fs.readdirSync(extractDir);
    console.log("Arquivos encontrados:", files);

  } catch (error) {
    console.error("Erro ao baixar o dataset:", error.message);
    if (error.response && error.response.status === 401) {
      console.error("Acesso negado. Verifique se suas credenciais do Kaggle estão corretas.");
    }
  }
}

downloadDataset();
