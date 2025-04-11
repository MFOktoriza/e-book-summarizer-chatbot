import os
import uvicorn
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import router

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup event
    api_host = os.getenv('API_HOST')
    api_port = os.getenv('API_PORT')

    print(f"Starting API on {api_host}:{api_port}")
    
    yield
    # Shutdown event
    print("Shutting down API")


def create_application() -> FastAPI:
    application = FastAPI(
        title="E-Book Summarizer API",
        lifespan=lifespan,
        debug=False,
    )
    origins = ["*"]
    application.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    application.include_router(router)

    return application


if __name__ == "__main__":
    uvicorn.run(
        "main:create_application",
        factory=True,
        host=os.getenv("API_HOST"),
        port=int(os.getenv("API_PORT")),
        log_level="debug",
        access_log=True,
        reload=False,
    )
