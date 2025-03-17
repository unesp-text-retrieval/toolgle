from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel
from typing import Dict, Any
from PostgRESTClient import PostgRESTClient
from BEIRUtils import Dataset, Model, Index
import httpx
import uvicorn
from fastapi.responses import StreamingResponse
import asyncio

app = FastAPI()

@app.get("/install/{dataset_name}/{dataset_id}")
def beir_enable_dataset(dataset_name: str, dataset_id: int):
    dataset = Dataset(dataset_name.lower(), is_custom_dataset=False)
    dataset.download()
    
    
@app.get("/build/{dataset_id}/{model_id}")
def beir_load_index(dataset_id: int, model_id: int):
    dataset = Dataset(dataset_id)
    dataset.load()
    
    model = Model(model_id=model_id)
    model.load(
        name=dataset.name.lower()
    )
    
    index = Index(dataset, model)
    index.build()

@app.get("/evaluate/{index_id}")
def beir_evaluate_index(index_id: int):
    index = Index(index_id=index_id)
    return index.evaluate()
    

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)