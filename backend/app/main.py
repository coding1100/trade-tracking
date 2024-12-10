from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import strategies, trades, auth
from app.database import engine, Base

Base.metadata.create_all(bind=engine)

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Replace with your frontend's origin in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(strategies.router, prefix="/strategies", tags=["Strategies"])
app.include_router(trades.router, prefix="/trades", tags=["Trades"])

# Test root endpoint
@app.get("/")
def read_root():
    return {"message": "Welcome to the Trade Tracker API"}
