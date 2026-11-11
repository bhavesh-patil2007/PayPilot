from contextlib import asynccontextmanager

import asyncpg
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.v1.routes import router as v1_router
from .api.v1.disputes import router as disputes_router
from .api.v1.vendor_invoices import router as vendor_invoices_router
from .api.v1.obligations import router as obligations_router
from .core.config import get_settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    app.state.database_pool = None
    if settings.database_url:
        app.state.database_pool = await asyncpg.create_pool(
            dsn=settings.database_url.get_secret_value(),
            min_size=1,
            max_size=5,
            command_timeout=10,
        )
    try:
        yield
    finally:
        if app.state.database_pool is not None:
            await app.state.database_pool.close()


settings = get_settings()
app = FastAPI(title="PayPilot API", version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Idempotency-Key"],
)
app.include_router(v1_router, prefix="/api/v1")
app.include_router(disputes_router, prefix="/api/v1")
app.include_router(vendor_invoices_router, prefix="/api/v1")
app.include_router(obligations_router, prefix="/api/v1")
