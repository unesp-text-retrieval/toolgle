import { useState, useEffect } from 'react';
import Sidebar from "@/components/Sidebar"; // Import the Sidebar component
import { Button } from "@/components/ui/button";
import axios from 'axios';

export default function Indexes() {
  const [indexes, setIndexes] = useState([]);
  const [datasets, setDatasets] = useState([]);
  const [models, setModels] = useState([]);
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [selectedModel, setSelectedModel] = useState(null);
  const [isBuilding, setIsBuilding] = useState(false);
  const [dots, setDots] = useState('');

  useEffect(() => {
    if (isBuilding) {
      const interval = setInterval(() => {
        setDots((prev) => (prev.length < 3 ? prev + '.' : ''));
      }, 500);
      return () => clearInterval(interval);
    }
  }, [isBuilding]);

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

    const fetchDatasets = async () => {
      try {
        const response = await fetch('/api/metadata?entityName=datasets', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        const data = await response.json();
        const filteredData = data.filter(dataset => dataset.path !== null);
        setDatasets(filteredData);
      } catch (error) {
        console.error('Error fetching datasets:', error);
      }
    };

    const fetchModels = async () => {
      try {
        const response = await fetch('/api/metadata?entityName=models', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        const data = await response.json();
        setModels(data);
      } catch (error) {
        console.error('Error fetching models:', error);
      }
    };

    fetchIndexes();
    fetchDatasets();
    fetchModels();
  }, []);

  const handleDrop = (event, type) => {
    event.preventDefault();
    const id = event.dataTransfer.getData("text");
    const item = type === 'dataset' ? datasets.find(d => d.id === parseInt(id)) : models.find(m => m.id === parseInt(id));
    if (type === 'dataset') {
      setSelectedDataset(item);
    } else {
      setSelectedModel(item);
    }
  };

  const handleDragStart = (event, id) => {
    event.dataTransfer.setData("text", id);
  };

  const handleSubmit = async () => {
    if (!selectedDataset || !selectedModel) {
      alert('Please select both a dataset and a model.');
      return;
    }
    setIsBuilding(true);
    try {
      const response = await axios.post('/api/retriever', {
        datasetId: selectedDataset.id,
        modelId: selectedModel.id,
      });
      if (response.status === 200) {
        alert('Index created successfully!');
        window.location.reload();
      } else {
        throw new Error('Error creating index');
      }
    } catch (error) {
      console.error('Error creating index:', error);
      alert('Error creating index. Please try again later.');
    } finally {
      setIsBuilding(false);
    }
  };

  return (
    <div className="h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col justify-between bg-gray-100 p-4">
        <h1 className="text-3xl font-black font-bold mb-6 text-center">
          Indexes
        </h1>
    
        <div className="mb-4">
          <h2 className="text-2xl font-bold mb-4">Loaded Indexes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mt-4">
            {indexes.map((index) => (
              <div key={index.id} className="p-3 border border-gray-300 rounded-md bg-white shadow-md">
                <h3 className="text-xl font-semibold text-blue-600 mb-2">{index.name}</h3>
                <p className="text-gray-700 mb-2">Dataset: {index.dataset_name}</p>
                <p className="text-gray-700 mb-2">Model: {index.model_name}</p>
              </div>
            ))}
          </div>
        </div>
        
        <h2 className="text-2xl font-bold mb-4">Drag and Drop to Build Index</h2>
        <div className="flex flex-col mb-4">
          <div className="flex space-x-4">
            <div
              className="w-1/3 p-4 border-2 border-dashed border-gray-300 rounded-md"
              onDrop={(e) => handleDrop(e, 'dataset')}
              onDragOver={(e) => e.preventDefault()}
            >
              <h3 className="text-xl font-semibold mb-2">Drop Dataset Here</h3>
              {selectedDataset && (
                <div className="p-3 border border-gray-300 rounded-md bg-white shadow-md">
                  <h3 className="text-xl font-semibold text-blue-600 mb-2">{selectedDataset.name}</h3>
                </div>
              )}
            </div>
            <div
              className="w-1/3 p-4 border-2 border-dashed border-gray-300 rounded-md"
              onDrop={(e) => handleDrop(e, 'model')}
              onDragOver={(e) => e.preventDefault()}
            >
              <h3 className="text-xl font-semibold mb-2">Drop Model Here</h3>
              {selectedModel && (
                <div className="p-3 border border-gray-300 rounded-md bg-white shadow-md">
                  <h3 className="text-xl font-semibold text-blue-600 mb-2">{selectedModel.name}</h3>
                </div>
              )}
            </div>
          </div>
          <Button className="bg-gray-800 text-white mt-4 rounded-md hover:bg-gray-900" onClick={handleSubmit}>
            {isBuilding ? `Building Index${dots}` : `Build Index ${selectedDataset && selectedModel && `for ${selectedDataset.name} and ${selectedModel.name}`} 🏭`}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mt-4">
          <h2 className="text-2xl font-bold mb-4">Available Datasets</h2>
          {datasets.map((dataset) => (
            <div
              key={dataset.id}
              className="p-3 border border-gray-300 rounded-md bg-white shadow-md"
              draggable
              onDragStart={(e) => handleDragStart(e, dataset.id)}
            >
              <h3 className="text-xl font-semibold text-blue-600 mb-2">{dataset.name}</h3>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mt-4">
          <h2 className="text-2xl font-bold mb-4">Available Models</h2>
          {models.map((model) => (
            <div
              key={model.id}
              className="p-3 border border-gray-300 rounded-md bg-white shadow-md"
              draggable
              onDragStart={(e) => handleDragStart(e, model.id)}
            >
              <h3 className="text-xl font-semibold text-blue-600 mb-2">{model.name}</h3>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
