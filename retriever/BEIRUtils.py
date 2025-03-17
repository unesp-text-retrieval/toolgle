from abc import ABC, abstractmethod
from typing import Any
from beir import util
import os
import pathlib 
from beir.datasets.data_loader import GenericDataLoader
from beir.retrieval.evaluation import EvaluateRetrieval
from beir.retrieval.search.lexical import BM25Search as BM25
from beir import LoggingHandler, util
from PostgRESTClient import PostgRESTClient
import logging
from tqdm import tqdm
from datetime import datetime
import json
import asyncio  # Add this import

logging.basicConfig(
    format="%(asctime)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    level=logging.INFO,
    handlers=[LoggingHandler()],
)

BEIR_DATASETS_BASE_URL = "https://public.ukp.informatik.tu-darmstadt.de/thakur/BEIR/datasets"
LEXICAL_SERVER_HOST_NAME = "elasticsearch"

class MetadataManager():
    def __init__(self):
        super().__init__()
        self.client = PostgRESTClient()
        
    def update_dataset(self, dataset_id: str, path: str, type: str):
        self.client.request(
            method="PATCH",
            endpoint=f"datasets?id=eq.{dataset_id}",
            data={"path": path, "type": type}
        )
        
    def get_dataset_by_id(self, dataset_id: int):
        response = self.client.request(
            method="GET",
            endpoint=f"datasets?id=eq.{dataset_id}"
        )
        if not response:
            raise ValueError(f"Dataset with id '{dataset_id}' does not exist.")
        return response[0]
    
    def get_model_by_id(self, model_id: int):
        response = self.client.request(
            method="GET",
            endpoint=f"models?id=eq.{model_id}"
        )
        if not response:
            raise ValueError(f"Model with id '{model_id}' does not exist.")
        return response[0]
    
    def get_index_by_id(self, index_id: int):
        response = self.client.request(
            method="GET",
            endpoint=f"indexes?id=eq.{index_id}"
        )
        if not response:
            raise ValueError(f"Index with id '{index_id}' does not exist.")
        return response[0]
    
    def set_index(self, dataset_id: int, model_id: int, name: str):
        self.client.request(
            method="POST",
            endpoint="indexes",
            data={
                "dataset_id": dataset_id, 
                "model_id": model_id, 
                "created_at": datetime.now().isoformat(),
                "name": name
            }
        )
        
    def get_dataset_id(self, dataset_name: str):
        response = self.client.request(
            method="GET",
            endpoint=f"datasets?name=ilike.{dataset_name}"
        )
        if not response:
            raise ValueError(f"Dataset with name '{dataset_name}' does not exist.")
        return response[0]["id"]
    
    def get_model_id(self, model_name: str):
        response = self.client.request(
            method="GET",
            endpoint=f"models?name=ilike.{model_name}"
        )
        if not response:
            raise ValueError(f"Model with name '{model_name}' does not exist.")
        return response[0]["id"]

class Dataset(MetadataManager):
    def __init__(self, dataset_name_or_id: Any, is_custom_dataset: bool = None):
        super().__init__()
        self.corpus = None
        self.queries = None
        self.qrels = None
        self.data_path = None  
        self.name = None
        
        # Dataset Name
        if isinstance(dataset_name_or_id, str):
            self.name = dataset_name_or_id
            self.url = f"{BEIR_DATASETS_BASE_URL}/{self.name}.zip"
            self.type = "custom" if is_custom_dataset else "beir"
            self.out_dir = os.path.join(pathlib.Path(__file__).parent.absolute(), f"datasets/{self.type}")
        
        # Dataset ID
        elif isinstance(dataset_name_or_id, int):
            metadata = self.get_dataset_by_id(dataset_name_or_id)
            self.name = metadata["name"].lower()
            self.type = metadata["type"]
            self.data_path = metadata["path"]
            self.out_dir = os.path.join(pathlib.Path(__file__).parent.absolute(), f"datasets/{self.type}")
            self.load()
        else:
            raise ValueError("dataset_name_or_id must be either a string or an integer")
    
    def download(self) -> None:
        logging.info(f"Downloading {self.name} dataset from {BEIR_DATASETS_BASE_URL}")
        self.data_path = util.download_and_unzip(self.url, self.out_dir)
        self.update_dataset(
            dataset_id=self.id,
            path=self.data_path,
            type=self.type
        )
        
    def load(self) -> None:    
        if not os.path.exists(self.data_path):
            raise FileNotFoundError(f"{self.data_path} not found")
        else:
            logging.info(f"Listing files in {self.data_path}")
            for file in os.listdir(self.data_path):
                logging.info(file)
        
        logging.info(f"Attempting to load {self.name} dataset, corpus, queries and qrels")
        self.corpus, self.queries, self.qrels = GenericDataLoader(self.data_path).load(split="test")
        
    @property
    def id(self) -> int:
        return self.get_dataset_id(self.name)

        
class Model(MetadataManager):
    def __init__(self, name: str = None, model_id: int = None):
        super().__init__()
        if name:
            self.name = name
        elif model_id:
            metadata = self.get_model_by_id(model_id)
            self.name = metadata["name"]
        else:
            raise ValueError("Either name or model_id must be provided")
        self.model = None
    

    
    def load(self, name: str, initialize: bool = True):
        # Currently only BM25 is supported
        if self.name == "BM25":
            logging.info("Loading BM25")
            self.model = BM25(
                index_name=name,
                hostname=LEXICAL_SERVER_HOST_NAME,
                initialize=initialize,
                number_of_shards=4
            )
        else:
            raise NotImplementedError("Model not supported")
        
    @property
    def id(self) -> int:
        return self.get_model_id(self.name)
        
class Index(MetadataManager):
    def __init__(self, dataset: Dataset = None, model: Model = None, index_id: int = None):
        super().__init__()
        if index_id:
            metadata = self.get_index_by_id(index_id)
            self.dataset = Dataset(metadata["dataset_id"])
            self.model = Model(model_id=metadata["model_id"])
            self.model.load(self.dataset.name, initialize=False)
        elif dataset and model:
            self.dataset = dataset
            self.model = model
        else:
            raise ValueError("Either index_id or both dataset and model must be provided")
        self.index = None
    
    def build(self):
        logging.info(f"Indexing {self.dataset.name} In {self.model.name}")
        if self.model.name == "BM25":
            self.model.model.index(self.dataset.corpus)    
            
            self.set_index(
                dataset_id=self.dataset.id,
                model_id=self.model.id,
                name=self.model.name + " + " + self.dataset.name
            )
            
            logging.info(f"Indexing {self.dataset.name} In {self.model.name} Completed!")
        else:
            raise NotImplementedError("Model not supported")

    def evaluate(self):
        if self.model.name == "BM25":
            logging.info(f"Evaluating {self.dataset.name} In {self.model.name}: {self.model.model}")
            retriever = EvaluateRetrieval(self.model.model)
            results = retriever.retrieve(self.dataset.corpus, self.dataset.queries)

            #### Evaluate your retrieval using NDCG@k, MAP@K ...
            logging.info(f"Retriever evaluation for k in: {retriever.k_values}")
            ndcg, _map, recall, precision = retriever.evaluate(self.dataset.qrels, results, retriever.k_values)
            return json.dumps({
                "ndcg": ndcg,
                "map": _map,
                "recall": recall,
                "precision": precision
            }, indent=4)
        else:
            raise NotImplementedError("Model not supported")

    
async def entry_point():
    logging.info("Initiating default states...")
    dataset = Dataset("scifact", is_custom_dataset=False)
    dataset.download()
    dataset.load()
    
    model = Model("BM25")
    model.load(
        name=dataset.name.lower()
    )
    
    index = Index(dataset, model)
    index.build()

if __name__ == "__main__":
    asyncio.run(entry_point())


