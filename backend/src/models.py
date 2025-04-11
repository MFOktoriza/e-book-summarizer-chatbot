from pydantic import BaseModel
from typing import Any, Optional, Union
from enum import Enum


class StatusEnum(str, Enum):
    success = "success"
    error = "error"


class Response(BaseModel):
    status: StatusEnum
    statusCode: int
    message: str
    data: Any


class AskQuestionResponse(Response):
    data: Optional[str]


class UploadDocumentResponse(Response):
    data: Optional[str]


class BookCollectionEntities(BaseModel):
    id: Union[int | None]
    text: str
    embeddings: list[float]
    metadata: Any
