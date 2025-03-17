import { useState, useEffect } from 'react';
import Sidebar from "@/components/Sidebar"; // Import the Sidebar component
import { Button } from "@/components/ui/button";
import axios from 'axios';

export default function Datasets() {
  interface Dataset {
    id: number;
    name: string;
    type: string;
    queries_size: number;
    corpus_size: number;
    path?: string;
  }

  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loadingDatasetId, setLoadingDatasetId] = useState<number | null>(null);

  useEffect(() => {
    const fetchDatasets = async () => {
      try {
        const response = await fetch('/api/metadata?entityName=datasets', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        const data = await response.json();
        setDatasets(data);

      } catch (error) {
        console.error('Error fetching custom datasets:', error);
      }
    };

    fetchDatasets();
  }, []);

  const createNewDataset = () => {
    const modal = document.getElementById('datasetModal');
    if (modal) {
      modal.classList.remove('hidden');
    }
  };

  const closeModal = () => {
    const modal = document.getElementById('datasetModal');
    if (modal) {
      modal.classList.add('hidden');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const rawName = event.target.datasetName.value;
    const name = event.target.datasetName.value.toLowerCase();
    const description = event.target.datasetDescription.value;
    const corpusFile = event.target.corpusFile.files[0];
    const queriesFile = event.target.queriesFile.files[0];
    const qrelsFile = event.target.qrelsFile.files[0];
    const createdAt = new Date().toISOString();
    const type = "custom";

    if (!corpusFile) {
      alert('Please upload corpus file.');
      return;
    }

    console.log("Corpus file format: ", corpusFile);
    if (!corpusFile.name.endsWith('.jsonl')) {
      alert('Files must be in JSONL format.');
      return;
    }

    const datasetPath = `custom/${name}`;
    const corpusPath = `${datasetPath}/corpus.jsonl`;
    const queriesPath = `${datasetPath}/queries.jsonl`;
    let queriesNumberOfRows = 0;
    let corpusNumberOfRows = 0;

    try {
      // Save corpus file
      const corpusReader = new FileReader();
      corpusReader.onload = async () => {
        const corpusContent = corpusReader.result;
        corpusNumberOfRows = corpusContent.split('\n').length;
        console.log("Corpus content: ", corpusContent);
        try {
          const response = await fetch('/api/saveFile', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              path: corpusPath,
              content: corpusContent,
            }),
          });
          if (!response.ok) {
            throw new Error('Error saving corpus file');
          }
        } catch (error) {
          console.error('Error saving corpus file:', error.message);
          alert('Error saving corpus file. Please try again later.');
          return;
        }

        // Save queries file
        if (queriesFile) {
          const queriesReader = new FileReader();
          queriesReader.onload = async () => {
            const queriesContent = queriesReader.result;
            queriesNumberOfRows = queriesContent.split('\n').length;
            try {
              const response = await fetch('/api/saveFile', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  path: queriesPath,
                  content: queriesContent,
                }),
              });
              if (!response.ok) {
                throw new Error('Error saving queries file');
              }
            } catch (error) {
              console.error('Error saving queries file:', error.message);
              alert('Error saving queries file. Please try again later.');
              return;
            }
          };
          queriesReader.readAsText(queriesFile);
        }

        // Save QRels file
        if (qrelsFile) {
          const qrelsReader = new FileReader();
          qrelsReader.onload = async () => {
            const qrelsContent = qrelsReader.result;
            try {
              const response = await fetch('/api/saveFile', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  path: `${datasetPath}/qrels/test.tsv`,
                  content: qrelsContent,
                }),
              });
              if (!response.ok) {
                throw new Error('Error saving QRels file');
              }
            } catch (error) {
              console.error('Error saving QRels file:', error.message);
              alert('Error saving QRels file. Please try again later.');
              return;
            }
          };
          qrelsReader.readAsText(qrelsFile);
        }

        // Create metadata associated with the dataset
        try {
          const response = await fetch('/api/metadata', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              entityName: 'datasets',
              data: {
                name: rawName,
                description: description,
                created_at: createdAt,
                type: type,
                path: "/app/datasets/" + datasetPath,
                queries_size: queriesNumberOfRows,
                corpus_size: corpusNumberOfRows
              },
            }),
          });
          if (!response.ok) {
            throw new Error('Error creating dataset metadata');
          }

          alert('Dataset created successfully!');
          closeModal();
          window.location.reload();
        } catch (error) {
          console.error('Error creating dataset metadata:', error.message);
          console.error('Error details:', error);
          alert('Error creating dataset metadata. Please try again later.');
        }
      };
      corpusReader.readAsText(corpusFile);
    } catch (error) {
      console.error('Error creating dataset:', error.message);
      alert('Error creating dataset. Please try again later.');
    }
  };

  const downloadDataset = async (datasetId: number, datasetName: string) => {
    try {
      setLoadingDatasetId(datasetId); // Set loading state
      // Show loading indicator
      const loadingIndicator = document.getElementById('loadingIndicator');
      if (loadingIndicator) {
        loadingIndicator.classList.remove('hidden');
      }

      const response = await fetch(`/api/retriever?datasetName=${datasetName}&datasetId=${datasetId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      alert('Download completed successfully!');
      
      // Refresh the page
      window.location.reload();
    } catch (error) {
      console.error('Error downloading dataset:', error);
      alert('Error downloading dataset. Please try again later.');
    } finally {
      setLoadingDatasetId(null); // Reset loading state
      // Hide loading indicator
      const loadingIndicator = document.getElementById('loadingIndicator');
      if (loadingIndicator) {
        loadingIndicator.classList.add('hidden');
      }
    }
  };

  const renderTags = (type: string) => {
    return type.split(', ').map(tag => (
      <span key={tag} className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2">
        {tag}
      </span>
    ));
  };

  return (
    <div className="h-screen flex">
      <Sidebar /> 
      <div className="flex-1 flex flex-col justify-between bg-gray-100 p-4">
        <h1 className="text-3xl font-black font-bold mb-6 text-center">
          Datasets
        </h1>
        

        <div className="mb-4">
            <Button className="bg-gray-800 text-white w-full rounded-md hover:bg-gray-700 hover:text-white text-lg py-2" onClick={createNewDataset}>
            ⬆️ Import a custom dataset
            </Button>
          <br></br><br></br>



            <h2 className="text-2xl font-bold mb-4">📃 Custom Datasets</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mt-4">
            {datasets
              .filter((dataset) => dataset.type === 'custom')
              .sort((a, b) => (a.path ? -1 : 1))
              .map((dataset) => (
              <div key={dataset.id} className="p-3 border border-gray-300 rounded-md bg-white shadow-md">
                <h3 className="text-xl font-semibold text-blue-600 mb-2">{dataset.name}</h3>
                <p className="text-gray-700 mb-2">Type: {renderTags(dataset.type)}</p>
                <p className="text-gray-700 mb-2">Queries: {dataset.queries_size}</p>
                <p className="text-gray-700 mb-2">Corpus: {dataset.corpus_size}</p>
                <p className="text-gray-700 mb-2">Path: <span className="block text-ellipsis overflow-hidden text-right">{dataset.path ? dataset.path : 'Not installed'}</span></p>
                {dataset.path ? (
                <Button className="bg-green-500 text-white w-full rounded-md hover:bg-green-700 text-xs" onClick={() => alert(`More info about dataset with ID: ${dataset.id}`)}>
                  More Info
                </Button>
                ) : (
                <Button
                  className={`bg-blue-500 text-white w-full rounded-md hover:bg-blue-700 text-xs ${loadingDatasetId === dataset.id ? 'running-bg' : ''}`}
                  onClick={() => downloadDataset(dataset.id, dataset.name)}
                  disabled={loadingDatasetId === dataset.id}
                >
                  {loadingDatasetId === dataset.id ? 'Installing...' : 'Install'}
                </Button>
                )}
              </div>
              ))}
            </div>
            <br></br><br></br>
            <h2 className="text-2xl font-bold mb-4">🛍️ BEIR Datasets</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mt-4">
            {datasets
              .filter((dataset) => dataset.type !== 'custom')
              .sort((a, b) => (a.path ? -1 : 1))
              .map((dataset) => (
              <div key={dataset.id} className="p-3 border border-gray-300 rounded-md bg-white shadow-md">
                <h3 className="text-xl font-semibold text-blue-600 mb-2">{dataset.name}</h3>
                <p className="text-gray-700 mb-2">Type: {renderTags(dataset.type)}</p>
                <p className="text-gray-700 mb-2">Queries: {dataset.queries_size}</p>
                <p className="text-gray-700 mb-2">Corpus: {dataset.corpus_size}</p>
                <p className="text-gray-700 mb-2">Path: <span className="block text-ellipsis overflow-hidden text-right">{dataset.path ? dataset.path : 'Not installed'}</span></p>
                {dataset.path ? (
                <Button className="bg-green-500 text-white w-full rounded-md hover:bg-green-700 text-xs" onClick={() => alert(`More info about dataset with ID: ${dataset.id}`)}>
                  More Info
                </Button>
                ) : (
                <Button
                  className={`bg-blue-500 text-white w-full rounded-md hover:bg-blue-700 text-xs ${loadingDatasetId === dataset.id ? 'running-bg' : ''}`}
                  onClick={() => downloadDataset(dataset.id, dataset.name)}
                  disabled={loadingDatasetId === dataset.id}
                >
                  {loadingDatasetId === dataset.id ? 'Installing...' : 'Install'}
                </Button>
                )}
              </div>
              ))}
            </div>
          </div>
        </div>
        <div id="datasetModal" className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center hidden">
          <div className="bg-white p-6 rounded-lg shadow-lg w-1/2">
            <h2 className="text-2xl font-bold mb-4">Create New Dataset</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="datasetName">
                  Dataset Name
                </label>
                <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="datasetName" type="text" required />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="datasetDescription">
                  Description
                </label>
                <textarea className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="datasetDescription" />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="corpusFile">
                  Corpus File (JSONL)
                </label>
                <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="corpusFile" type="file" accept=".jsonl" required />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="queriesFile">
                  Queries File (JSONL)
                </label>
                <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="queriesFile" type="file" accept=".jsonl" />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="qrelsFile">
                  QRels File (TSV)
                </label>
                <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="qrelsFile" type="file" accept=".tsv" />
              </div>
              <div className="flex items-center justify-between">
                <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" type="submit">
                  Submit
                </button>
                <button className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" type="button" onClick={closeModal}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
  </div>
  );
}