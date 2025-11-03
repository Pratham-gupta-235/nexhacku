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
import os
model_path = "best_rf_model (1).pkl"
model = None
load_error = None

# Get the directory where app.py is located
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
full_model_path = os.path.join(BASE_DIR, model_path)

try:
    with open(full_model_path, "rb") as file:
        model = pickle.load(file)
    print(f"✅ Model loaded successfully from {full_model_path}")
except Exception as e:
    load_error = str(e)
    print(f"❌ Failed to load model: {load_error}")


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
        print(f"📊 Received features: {features}")
        prediction = model.predict(features)
        print(f"✅ Prediction: {prediction.tolist()}")
        return {"prediction": prediction.tolist()}
    except Exception as e:
        print(f"❌ Prediction error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
