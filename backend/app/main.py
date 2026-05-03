from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.routers.auth import router as auth_router
from backend.app.routers.conversations import router as conversations_router
from backend.app.services.caption_service import caption_service


@asynccontextmanager
async def lifespan(app: FastAPI):
    caption_service.preload_in_background()
    yield


app = FastAPI(title="Firebase Image Captioning API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(conversations_router)


@app.get("/")
def root():
    return {
        "message": "Firebase Image Captioning API is running",
        "model": caption_service.get_model_name(),
        "endpoints": [
            "/",
            "/health",
            "/auth/me",
            "/conversations",
        ],
    }


@app.get("/health")
def health():
    return {
        "status": "ok",
        "model": caption_service.get_model_name(),
        "device": caption_service.get_device(),
        "loaded": caption_service.is_ready(),
        "loading": caption_service.is_loading(),
        "error": caption_service.get_load_error(),
    }
