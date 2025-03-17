import { Client } from '@elastic/elasticsearch';
import type { NextApiRequest, NextApiResponse } from 'next';
import { Document } from 'types';

const client = new Client({ node: 'http://elasticsearch:9200' });

export const mapElasticResponseToDocument = (hits: any[]): Document[] => {
  return hits.map(hit => ({
    id: hit._id,
    title: hit._source.title,
    content: hit._source.txt,
    score: hit._score.toString(),
    dataset: hit._index   
  }));
};

async function search(query: string, index: string) {
  try {
    console.log('Executing search with query:', query);

    const result = await client.search({
      index: index,
      body: {
      query: {
        multi_match: {  
        query: query,
        fields: ['txt', 'title'],
        fuzziness: "AUTO"
        }
      }
      },
      size: 10
    });
    console.log('Elasticsearch response:', result);
    return mapElasticResponseToDocument(result.hits.hits);
  } catch (error) {
    console.error('Elasticsearch query error:', error);
    throw error;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
    console.log('Request body:', req.body);
    let { query, index } = req.body;

    try {
        const results = await search(query, index);
        res.status(200).json(results);
    } 
    catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
}