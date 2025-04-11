import os
import uuid
from dotenv import load_dotenv
from typing import Optional
from qdrant_client import QdrantClient
from qdrant_client.models import Datatype, Distance, Filter, FieldCondition, MatchValue, PointStruct, VectorParams
from models import BookCollectionEntities

load_dotenv()

client = QdrantClient(url=f'http://{os.getenv("QDRANT_HOST")}')

qdrant_collections = (os.getenv("QDRANT_COLLECTIONS")).split(",")
for collection in qdrant_collections:
    if not client.collection_exists(collection_name=collection):
        client.create_collection(
            collection_name=collection,
            vectors_config=VectorParams(size=1024, distance=Distance.COSINE, datatype=Datatype.FLOAT32)
        )


def upsert_book_collection(embeddings: list[float], id: str, title: str, author: Optional[str] = ""):
    if not id or not title:
        print("id and title are required")
        return

    point_data_payload = {}
    point_data_payload['server_id'] = id
    point_data_payload['title'] = title
    if author:
        point_data_payload['author'] = author

    point_data_arr = [PointStruct(
        id=str(uuid.uuid5(uuid.NAMESPACE_OID, f'{id}-{title}')),
        vector=embeddings,
        payload=point_data_payload
    )]

    operation_info = client.upsert(
        collection_name="book_collection",
        points=point_data_arr,
        wait=True
    )

    return operation_info


def search_book_collection(query: list[float], id: str):
    results = client.query_points(
        collection_name="book_collection",
        query=query,
        query_filter=Filter(
            must=[
                FieldCondition(
                    key="server_id",
                    match=MatchValue(
                        value=id
                    )
                )
            ]
        ),
        limit=10
    )

    return results


def upsert_book_embeddings(data_arr: list[BookCollectionEntities], id: str, title: str, author: Optional[str] = ""):
    if not id or not title:
        print("id and title are required")
        return
    
    point_data_arr = []
    for index, data in enumerate(data_arr):
        if (not data["text"]):
            continue

        point_data_payload = {}
        point_data_payload['text'] = data["text"]
        point_data_payload['title'] = title
        point_data_payload['doc_id'] = str(uuid.uuid5(uuid.NAMESPACE_OID, f'{id}-{title}'))
        if author:
            point_data_payload['author'] = author

        point_data_arr.append(PointStruct(
            id=str(uuid.uuid5(uuid.NAMESPACE_OID, f'{id}-{title}-{index}')),
            vector=data["embeddings"],
            payload=point_data_payload
        ))

    operation_info = client.upsert(
        collection_name="book_embeddings",
        points=point_data_arr,
        wait=True
    )

    return operation_info


def search_book_embeddings(query: list[float], id: str):
    results = client.query_points(
        collection_name="book_embeddings",
        query=query,
        query_filter=Filter(
            must=[
                FieldCondition(
                    key="doc_id",
                    match=MatchValue(
                        value=id
                    )
                )
            ]
        ),
        limit=10
    )

    return results