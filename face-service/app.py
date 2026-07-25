from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Annotated, Literal

import numpy as np
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from pydantic import BaseModel

from face_engine import FaceEngine, FaceEngineError, cosine_similarity


class HealthResponse(BaseModel):
    status: str
    model: str


class EnrollmentResponse(BaseModel):
    embedding: list[float]
    accepted_samples: int
    consistency: float


class VerificationResponse(BaseModel):
    embedding: list[float]
    liveness_passed: bool
    same_face_score: float
    movement_score: float


app = FastAPI(title="Banhang Face Service", version="1.0.0", docs_url=None, redoc_url=None)


@lru_cache(maxsize=1)
def get_engine() -> FaceEngine:
    return FaceEngine(Path(__file__).resolve().parent / "models")


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    get_engine()
    return HealthResponse(status="ok", model="InsightFace buffalo_s ArcFace")


@app.post("/v1/enroll", response_model=EnrollmentResponse)
async def enroll(
    images: Annotated[list[UploadFile], File(min_length=3, max_length=5)]
) -> EnrollmentResponse:
    engine = get_engine()
    samples = []
    try:
        for image in images:
            samples.append(engine.extract(await image.read()))
    except FaceEngineError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error

    embeddings = np.stack([sample.embedding for sample in samples])
    pair_scores = [
        cosine_similarity(embeddings[left], embeddings[right])
        for left in range(len(embeddings))
        for right in range(left + 1, len(embeddings))
    ]
    consistency = float(min(pair_scores))
    if consistency < 0.45:
        raise HTTPException(
            status_code=422,
            detail="Cac anh khong nhat quan. Hay dam bao chi cung mot nguoi dung camera.",
        )

    template = embeddings.mean(axis=0)
    template /= np.linalg.norm(template) + 1e-8
    return EnrollmentResponse(
        embedding=template.astype(float).tolist(),
        accepted_samples=len(samples),
        consistency=consistency,
    )


@app.post("/v1/verify", response_model=VerificationResponse)
async def verify(
    neutral_image: Annotated[UploadFile, File()],
    challenge_image: Annotated[UploadFile, File()],
    challenge_type: Annotated[Literal["TURN_HEAD", "MOVE_CLOSER"], Form()],
) -> VerificationResponse:
    engine = get_engine()
    try:
        neutral = engine.extract(await neutral_image.read())
        challenged = engine.extract(await challenge_image.read())
    except FaceEngineError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error

    same_face_score = cosine_similarity(neutral.embedding, challenged.embedding)
    if challenge_type == "TURN_HEAD":
        movement_score = abs(challenged.yaw_proxy - neutral.yaw_proxy)
        movement_passed = movement_score >= 0.12
    else:
        movement_score = challenged.face_width / max(neutral.face_width, 1.0)
        movement_passed = movement_score >= 1.15

    liveness_passed = same_face_score >= 0.42 and movement_passed
    return VerificationResponse(
        embedding=challenged.embedding.astype(float).tolist(),
        liveness_passed=liveness_passed,
        same_face_score=same_face_score,
        movement_score=movement_score,
    )
