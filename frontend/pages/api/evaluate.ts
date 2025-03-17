import axios from 'axios';
import type { NextApiRequest, NextApiResponse } from 'next';

const RETRIEVER_URL = 'http://retriever:8000';

class EvaluatorService {
  async evaluateIndex(indexId: number) {
    const response = await axios.get(`${RETRIEVER_URL}/evaluate/${indexId}`);
    return response.data;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const service = new EvaluatorService();

  try {
    if (req.method === 'POST') {
      const indexId = parseInt(req.body.indexId, 10);
      const result = await service.evaluateIndex(indexId);
      res.status(200).json(result);
    } else {
      res.setHeader('Allow', ['POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('API request error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
