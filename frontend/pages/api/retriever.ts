import axios from 'axios';
import type { NextApiRequest, NextApiResponse } from 'next';

const RETRIEVER_URL = 'http://retriever:8000';

class RetrieverService {

  async installDataset(datasetName: string, datasetId: number) {
    const response = await axios.get(`${RETRIEVER_URL}/install/${datasetName}/${datasetId}`);
    return response.data;
  }


  async buildIndex(datasetId: number, modelId: number) {
    const response = await axios.get(`${RETRIEVER_URL}/build/${datasetId}/${modelId}`);
    return response.data;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const service = new RetrieverService();

  try {
    let result;
    switch (req.method) {
      case 'GET':
          const datasetName = req.query.datasetName as string;
          const datasetId = parseInt(req.query.datasetId as string, 10);
          result = await service.installDataset(datasetName, datasetId);
        break;
      case 'POST':
          const postDatasetId = parseInt(req.body.datasetId, 10);
          const modelId = parseInt(req.body.modelId, 10);
          result = await service.buildIndex(postDatasetId, modelId);
        break;

      default:
        res.setHeader('Allow', ['GET']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
        return;
    }
    res.status(200).json(result);
  } catch (error) {
    console.error('API request error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
