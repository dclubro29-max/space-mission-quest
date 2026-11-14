import asyncio
from contextlib import suppress
from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import ASCENDING, DESCENDING, IndexModel
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Literal
import uuid
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

client = AsyncIOMotorClient(os.environ['MONGO_URL'])
db = client[os.environ['DB_NAME']]

INDEXES: dict[str, list[IndexModel]] = {
    "scores": [
        IndexModel([("id", ASCENDING)], name="id", unique=True),
        IndexModel([("score", DESCENDING)], name="score_desc"),
    ],
}


async def ensure_indexes() -> None:
    for collection, models in INDEXES.items():
        for model in models:
            try:
                await db[collection].create_indexes([model])
            except Exception as exc:
                logging.getLogger(__name__).error("ensure_indexes(%s.%s): %s", collection, model.document["name"], exc)

app = FastAPI()
api_router = APIRouter(prefix="/api")


class ScoreCreate(BaseModel):
    name: str = Field(min_length=1, max_length=24)
    score: int = Field(ge=0, le=100000)
    outcome: Literal["win", "lose"]
    quiz_correct: int = Field(ge=0, le=15)
    lives_left: int = Field(ge=0, le=3)


class Score(ScoreCreate):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


@api_router.get("/")
async def root():
    return {"message": "Mission Gratziella control online"}


@api_router.post("/scores", response_model=Score)
async def create_score(payload: ScoreCreate):
    score = Score(**payload.model_dump())
    await db.scores.insert_one(score.model_dump())
    return score


@api_router.get("/scores", response_model=List[Score])
async def top_scores():
    docs = await db.scores.find({}, {"_id": 0}).sort("score", -1).limit(10).to_list(10)
    return [Score(**d) for d in docs]


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')


@app.on_event("startup")
async def start_index_build():
    app.state.index_task = asyncio.create_task(ensure_indexes())


@app.on_event("shutdown")
async def shutdown_db_client():
    app.state.index_task.cancel()
    with suppress(asyncio.CancelledError):
        await app.state.index_task
    client.close()
