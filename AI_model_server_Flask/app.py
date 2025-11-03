from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
import pickle
import numpy as np
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Allow CORS from anywhere (adjust origins in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the saved model
model_path = "best_rf_model (1).pkl"
model = None
load_error = None
try:
    with open(model_path, "rb") as file:
        model = pickle.load(file)
except Exception as e:
    load_error = str(e)


class Features(BaseModel):
    features: List[float]


@app.get("/")
def read_root():
    return {"message": "Welcome to the Random Forest Prediction API!"}


@app.post("/predict")
def predict(payload: Features):
    if model is None:
        # Model failed to load at startup
        raise HTTPException(status_code=500, detail=f"Model not loaded: {load_error}")

    try:
        features = np.array(payload.features).reshape(1, -1)
        prediction = model.predict(features)
        return {"prediction": prediction.tolist()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    # Run with: python app.py  (this will start uvicorn)
    import uvicorn

    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
