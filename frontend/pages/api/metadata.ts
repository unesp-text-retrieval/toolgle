import axios from 'axios';
import type { NextApiRequest, NextApiResponse } from 'next';

const POSTGREST_URL = 'http://postgrest:3000';

class MetadataEntityService {
  private entityName: string;

  constructor(entityName: string) {
    this.entityName = entityName;
  }

  async fetch() {
    const response = await axios.get(`${POSTGREST_URL}/${this.entityName}`);
    return response.data;
  }

  async create(entity: any) {
    const response = await axios.post(`${POSTGREST_URL}/${this.entityName}`, entity);
    return response.data;
  }

  async update(id: string, entity: any) {
    const response = await axios.patch(`${POSTGREST_URL}/${this.entityName}?id=eq.${id}`, entity);
    return response.data;
  }

  async deleteEntity(id: string) {
    const response = await axios.delete(`${POSTGREST_URL}/${this.entityName}?id=eq.${id}`);
    return response.data;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  let entityName: string;
  let data: any;
  let id: string;

  if (req.method === 'GET') {
    entityName = req.query.entityName as string;
  } else {
    ({ entityName, data, id } = req.body);
  }

  const service = new MetadataEntityService(entityName);

  try {
    let result;
    switch (req.method) {
      case 'GET':
        result = await service.fetch();
        break;
      case 'POST':
        result = await service.create(data);
        break;
      case 'PATCH':
        result = await service.update(id, data);
        break;
      case 'DELETE':
        result = await service.deleteEntity(id);
        break;
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PATCH', 'DELETE']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
        return;
    }
    res.status(200).json(result);
  } catch (error) {
    console.error('API request error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}