import os
import ollama
import pymupdf4llm
from langchain_text_splitters import MarkdownHeaderTextSplitter, RecursiveCharacterTextSplitter


def chunk_document(file_path: str) -> list[dict[str, any]]:
    md_str = pymupdf4llm.to_markdown(
        doc=file_path,
        table_strategy='lines'
    )

    headers_to_split_on = [
        ("#", "Header 1"),
        ("##", "Header 2"),
        ("###", "Header 3"),
        ("####", "Header 4"),
        ("#####", "Header 5"),
        ("######", "Header 6")
    ]

    md_splitter = MarkdownHeaderTextSplitter(headers_to_split_on=headers_to_split_on)
    md_header_splits = md_splitter.split_text(md_str)

    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=int(os.getenv("EMBEDDING_BATCH_SIZE")),
        chunk_overlap=256
    )

    chunks = [
        { "metadata": doc.metadata, "contents": doc.page_content } for doc in text_splitter.split_documents(md_header_splits)
    ]

    return chunks


def generate_vector_db_entities(chunks: list[dict[str, any]]) -> list[tuple[str, any]]:
    vector_db_entities = []
    for chunk in chunks:
        vector_db_entities.append({
            "text": chunk["contents"],
            "metadata": chunk["metadata"],
            "embeddings": generate_embeddings(chunk["contents"])
        })

    return vector_db_entities


def generate_embeddings(text: str) -> list[any]:
    embeddings = ollama.embeddings(model="bge-m3", prompt=text)["embedding"]

    return embeddings


def generate_summarization(question: str, context: list[str]) -> str:
    prompt = f"""
        <|begin_of_text|>
        <|start_header_id|>
            system
        <|end_header_id|>
            You are a helpful, respectful and honest assistant designated answer questions related to the user's document.
            If the user tries to ask out of topic questions do not engange in the conversation.
            If the given context is not sufficient to answer the question just say you don't know the answer.
            Generate answer that concise while still maintaining all key information within the given context.
        <|eot_id|>
        <|start_header_id|>
            user
        <|end_header_id|>
            Answer the user question based on the context provided below
            Context: {context}
            Question: {question}
        <|eot_id|>
        <|start_header_id|>
            assistant
        <|end_header_id|>
    """
    response = ollama.generate(model="hf.co/tensorblock/SummLlama3.1-8B-GGUF:Q5_K_M", prompt=prompt)
    
    return response["response"]
    
