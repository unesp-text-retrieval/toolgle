import { SyntheticEvent, useState, useEffect} from 'react';
import CircleLoader from 'react-spinners/CircleLoader';
import Modal from 'react-modal';
import { Document } from 'types';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import Sidebar from "@/components/Sidebar";

const customStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    width: '90%',
    height: '80%',
    transform: 'translate(-50%, -50%)',
    borderRadius: '5px',
  },
};

const CONTENT_LIMIT = 200;

export default function Home() {

  const [isLoading, setIsLoading] = useState(false);
  const [loadedOnce, setLoadedOnce] = useState(false);
  const [query, setQuery] = useState('');
  const [recommendedDocuments, setRecommendedDocuments] = useState<Document[]>([]);
  const [modalIsOpen, setIsOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | undefined>(undefined);
  const [index, setIndex] = useState('scifact');
  const [indexes, setIndexes] = useState([]);
  
  useEffect(() => {
    const fetchIndexes = async () => {
      try {
        const response = await fetch('/api/metadata?entityName=indexes', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        const data = await response.json();
        setIndexes(data);

      } catch (error) {
        console.error('Error fetching custom datasets:', error);
      }
    };

    fetchIndexes();
  }, []);


  const openModal = (document: Document) => {
    setSelectedDocument(document);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  const getRecommendations = async (e: SyntheticEvent) => {
    e.preventDefault();

    // Check Inputs
    if (query === '') {
      alert("Please let us know what you'd like to learn!");
      return;
    }

    setIsLoading(true);

    const indexName = index.includes('+') ? index.split('+')[1].trim().toLowerCase() : index;

    await fetch('/api/elastic', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        index: indexName
      })
    })
      .then((res) => {
        console.log(res)
        if (res.ok) return res.json();
      })
      .then((recommendations) => {
        console.log(recommendations);
        setRecommendedDocuments(recommendations);
      });

    setIsLoading(false);
    setLoadedOnce(true);
  };

  return (
    <div className="h-screen flex">
      <Sidebar /> {/* Add the Sidebar component */}
      <div className="flex-1 flex flex-col justify-between bg-gray-100">
        <Modal
          isOpen={modalIsOpen}
          onRequestClose={closeModal}
          style={customStyles}
          contentLabel="Document Modal"
        >
          <div className="flex justify-between">
            <h3 className="mt-2 text-lg font-semibold text-gray-700">
              {selectedDocument?.title}
            </h3>
            <Button
              className="hover:font-bold rounded hover:bg-gray-700 p-2 w-20 hover:text-white "
              onClick={closeModal}
            >
              Close
            </Button>
          </div>
          <div>
            <p className="mt-1 text-gray-500"><span className="font-bold">Content</span>:{' '}{selectedDocument?.content}</p>
            <p>
              <span className="font-bold">Score</span>:{' '}{selectedDocument?.score}
            </p>
            <p>
              <span className="font-bold">Dataset</span>:{' '}{selectedDocument?.dataset}
            </p>
          </div>
        </Modal>
        <div className="mb-auto py-10 px-4 bg-gray-100">
          <div className="container mx-auto">
            <h1 className="text-8xl font-black font-bold mb-6 text-center">
              <span className="text-blue-500">T</span>
              <span className="text-red-500">o</span>
              <span className="text-yellow-500">o</span>
              <span className="text-blue-500">l</span>
              <span className="text-green-500">g</span>
              <span className="text-red-500">l</span>
              <span className="text-blue-500">e</span>
            </h1>

            <form
              id="recommendation-form"
              className="mb-10"
              onSubmit={getRecommendations}
            >
              <div className="mb-4">
                <Input 
                  type="text"
                  id="favorite-documents"
                  name="favorite-documents"
                  placeholder="I'd like to learn..."
                  className="block w-full px-4 py-2 border border-gray-300 bg-white rounded-md shadow-sm "
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                  }}
                />
              </div>
              <div className="mb-4">
                <select
                  id="index"
                  name="index"
                  className="block w-full px-4 py-2 border border-gray-300 bg-white rounded-md shadow-sm"
                  value={index}
                  onChange={(e) => {
                    setIndex(e.target.value);
                  }}
                >
                    {indexes.map((idx: { name: string }) => (
                      idx.name && (
                        <option key={idx.name} value={idx.name.toLowerCase()}>{idx.name}</option>
                      )
                    ))}
                </select>
              </div>
              <Button className="bg-black text-white w-full rounded-md hover:bg-gray-800 hover:text-white" disabled={isLoading} type="submit" variant="outline">
                Search
              </Button>
            </form>

            {isLoading ? (
              <div className="w-full flex justify-center h-60 pt-10">
                <CircleLoader
                  color={'#000000'}
                  loading={isLoading}
                  size={100}
                  aria-label="Loading"
                  data-testid="loader"
                />
              </div>
            ) : (
              <>
                {loadedOnce ? (
                  <>
                    <h2 className="text-2xl font-bold mb-4 text-center">
                      Retrieved Documents
                    </h2>
                    <div
                      id="recommended-documents"
                      className="flex overflow-x-scroll pb-10 hide-scroll-bar"
                    >
                      {/* <!-- Recommended documents dynamically added here --> */}
                      <section className="container mx-auto mb-12">
                        <div className="flex flex-wrap -mx-2">
                        {recommendedDocuments.map((d: Document) => {
                            return (
                              <div key={d.id} className="w-full px-4 py-4 border-b border-gray-300" onClick={() => openModal(d)}>
                                <h3 className="text-xl font-semibold text-blue-600 hover:underline cursor-pointer mb-2">{d.title}</h3>
                                <p className="text-gray-700 mb-2">{d.content.length > CONTENT_LIMIT ? `${d.content.substring(0, CONTENT_LIMIT)}...` : d.content}</p>
                                <div className="text-sm text-gray-500">
                                  <p>Score: {d.score}</p>
                                  <p>Dataset: {d.dataset}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </section>
                    </div>
                  </>
                ) : (
                  <div className="w-full flex justify-center h-60 pt-10"></div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}