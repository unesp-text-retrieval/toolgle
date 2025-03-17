import { useState, useEffect } from 'react';
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import axios from 'axios';

export default function Evaluate() {
  interface Index {
    id: string;
    name: string;
    dataset_name: string;
    model_name: string;
  }

  const [indexes, setIndexes] = useState<Index[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<Index | null>(null);
  const [evaluationResult, setEvaluationResult] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [dots, setDots] = useState('');

  useEffect(() => {
    const fetchIndexes = async () => {
      try {
        const response = await fetch('/api/metadata?entityName=wide_indexes_view', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        const data = await response.json();
        setIndexes(data);
      } catch (error) {
        console.error('Error fetching indexes:', error);
      }
    };

    fetchIndexes();
  }, []);

  useEffect(() => {
    if (isEvaluating) {
      const interval = setInterval(() => {
        setDots((prev) => (prev.length < 3 ? prev + '.' : ''));
      }, 500);
      return () => clearInterval(interval);
    }
  }, [isEvaluating]);

  const handleEvaluate = async () => {
    if (!selectedIndex) {
      alert('Please select an index to evaluate.');
      return;
    }
    setIsEvaluating(true);
    try {
      const response = await axios.post('/api/evaluate', {
        indexId: selectedIndex.id,
      });
      if (response.status === 200) {
        setEvaluationResult(response.data); // Pretty-print the evaluation result with 2 spaces indentation
      } else {
        throw new Error('Error evaluating index');
      }
    } catch (error) {
      console.error('Error evaluating index:', error);
      alert('Error evaluating index. Please try again later.');
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleCopyResults = () => {
    navigator.clipboard.writeText(JSON.stringify(evaluationResult, null, 2)); // Ensure copied text also has 2 spaces indentation
    alert('Evaluation results copied to clipboard.');
  };

  return (
    <div className="h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col justify-between bg-gray-100 p-4">
        <div className="flex">
          <div className="w-1/2 p-4">
            <h2 className="text-2xl font-bold mb-4">Select Index to Evaluate</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {indexes.map((index) => (
                <button
                  key={index.id}
                  className={`p-3 border border-gray-300 rounded-md shadow-md cursor-pointer ${selectedIndex?.id === index.id ? 'bg-blue-100 border-blue-500' : 'bg-white'}`}
                  onClick={() => setSelectedIndex(index)}
                  style={{ outline: 'none' }} // Add outline style to ensure focus visibility
                >
                  <h3 className="text-xl font-semibold text-blue-600 mb-2">{index.name}</h3>
                  <p className="text-gray-700 mb-2">Dataset: {index.dataset_name}</p>
                  <p className="text-gray-700 mb-2">Model: {index.model_name}</p>
                </button>
              ))}
            </div>
            <Button className="bg-gray-800 text-white mt-4 rounded-md hover:bg-gray-900" onClick={handleEvaluate}>
              {isEvaluating ? `Evaluating${dots}` : 'Evaluate 🧪'}
            </Button>
          </div>
          <div className="w-1/2 p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Results</h2>
              <Button className="bg-gray-800 text-white rounded-md hover:bg-gray-900 text-xs px-2 py-1" onClick={handleCopyResults}>
                Clipboard&nbsp;📋
              </Button>
            </div>
            <div className="bg-white p-4 border border-gray-300 rounded-md shadow-md text-sm overflow-auto" style={{ maxWidth: '100%', filter: evaluationResult ? 'none' : 'blur(3px)' }}>
              {evaluationResult ? (
                <pre className="whitespace-pre-wrap">
                  {evaluationResult}
                </pre>
              ) : (
                <pre>
                  {`
    NDCG@1: 0.1900
    NDCG@3: 0.1563
    NDCG@5: 0.1350
    NDCG@10: 0.1647
    NDCG@100: 0.2304
    NDCG@1000: 0.2738

    MAP@1: 0.0387
    MAP@3: 0.0702
    MAP@5: 0.0827
    MAP@10: 0.0964
    MAP@100: 0.1119
    MAP@1000: 0.1142

    Recall@1: 0.0387
    Recall@3: 0.0889
    Recall@5: 0.1190
    Recall@10: 0.1737
    Recall@100: 0.3676`}
                </pre>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
