from sys import platform
from typing import Union
from dotenv import load_dotenv
from fastapi import APIRouter
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
from db import search_book_embeddings, search_book_collection, upsert_book_collection, upsert_book_embeddings
from services import chunk_document, generate_embeddings, generate_summarization, generate_vector_db_entities

load_dotenv()

router = APIRouter()


@router.get("/list_document")
async def list_document(id: str):
    if not id:
        return JSONResponse(
            status_code=400,
            content=jsonable_encoder({
                "status": "error",
                "message": "id is required"
            })
        )
    
    id_embeddings = generate_embeddings(id)
    retrieved_texts = search_book_collection(query=id_embeddings, id=id)

    return JSONResponse(
        content=jsonable_encoder({
            "status": "success",
            "message": retrieved_texts
        })
    )


@router.get("/ask_question")
async def ask_question(question: str, id: str):
    if not question:
        return JSONResponse(
            status_code=400,
            content=jsonable_encoder({
                "status": "error",
                "message": "question is required"
            })
        )
    
    question_embeddings = generate_embeddings(text=question)
    retrieved_embeddings = search_book_embeddings(query=question_embeddings, id=id)
    retrieved_texts = [point["payload"]["text"] for point in (retrieved_embeddings.model_dump())["points"]]

    response = generate_summarization(question=question, context=retrieved_texts)

    return JSONResponse(
        content=jsonable_encoder({
            "status": "success",
            "message": response
        })
    )


@router.post("/upload_document")
async def upload_document(document_path: str, id: str, title: str, author: Union[str, None]):
    if not document_path:
        return JSONResponse(
            status_code=400,
            content=jsonable_encoder({
                "status": "error",
                "message": "document is required"
            })
        )
    if not document_path.endswith(".pdf"):
        return JSONResponse(
            status_code=400,
            content=jsonable_encoder({
                "status": "error",
                "message": "document extension should be .pdf"
            })
        )
    
    book_embeddings = generate_embeddings(text=id + "-" + document_path.split("\\")[-1] if platform == "win32" else id + "-" + document_path.split("/")[-1])
    upsert_book_collection(embeddings=book_embeddings, id=id, title=title, author=author)

    chunks = chunk_document(file_path=document_path)
    vector_db_entities = generate_vector_db_entities(chunks=chunks)
    upsert_book_embeddings(data_arr=vector_db_entities, id=id, title=title, author=author)
    
    return JSONResponse(
        content=jsonable_encoder({
            "status": "success",
            "message": "Upload document success"
        })
    )
