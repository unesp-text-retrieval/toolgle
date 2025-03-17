from typing import Dict, Any
import httpx
from fastapi import HTTPException

class PostgRESTClient:
    def __init__(self):
        self.base_url = 'http://postgrest:3000'

    def request(self, method: str, endpoint: str, data: Dict[str, Any] = None):
        with httpx.Client() as client:
            url = f"{self.base_url}/{endpoint}"
            response = client.request(method, url, json=data)
            
            if response.status_code not in {200, 201, 204}:
                raise HTTPException(status_code=response.status_code, detail=response.text)
            
            if not response.content:
                return {"detail": "Request executed successfully"}
            
            return response.json() if response.status_code != 204 else {"detail": "Request executed successfully"}