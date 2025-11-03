# 🛡️ FraudGuard AI - Advanced Fraud Detection System

A comprehensive fraud detection system powered by **Generative Adversarial Networks (GAN)** and **Random Forest** machine learning, with a modern React frontend and Flask REST API backend.

![Technology Stack](https://img.shields.io/badge/AI-TensorFlow-orange) ![ML](https://img.shields.io/badge/ML-scikit--learn-blue) ![Backend](https://img.shields.io/badge/Backend-Flask-green) ![Frontend](https://img.shields.io/badge/Frontend-React-cyan)

## 🌟 Features

- **Real-time Fraud Detection**: Instant analysis of transaction data
- **GAN-Powered Data Augmentation**: Synthetic fraud data generation for balanced training
- **Optimized ML Model**: Random Forest classifier with GridSearchCV hyperparameter tuning
- **Modern UI**: Beautiful, responsive React frontend with Tailwind CSS
- **REST API**: Easy integration with existing systems
- **Batch Processing**: Analyze multiple transactions at once
- **High Accuracy**: 95%+ accuracy with excellent precision and recall

## 🏗️ Project Structure

```
nexhacku/
├── AI_model_Py_Scripts/          # Jupyter notebooks and training scripts
│   ├── FraudDetectionUSingGAN.ipynb
│   └── fraud_dataset_Generator_using_numpy.csv
├── AI_model_server_Flask/        # Flask API backend
│   ├── app.py
│   ├── best_rf_model (1).pkl
│   └── env/
└── React_Frontend/               # React frontend application
    ├── src/
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── package.json
    └── vite.config.js
```

## 🚀 Getting Started

### Prerequisites

- Python 3.8+
- Node.js 16+
- npm or yarn

### Backend Setup

1. **Navigate to the Flask server directory:**
   ```bash
   cd AI_model_server_Flask
   ```

2. **Activate the virtual environment:**
   ```bash
   # Windows
   .\env\Scripts\activate
   
   # Linux/Mac
   source env/bin/activate
   ```

3. **Install dependencies (if needed):**
   ```bash
   pip install flask flask-cors numpy scikit-learn
   ```

4. **Run the Flask server:**
   ```bash
   python app.py
   ```
   
   The API will be available at `http://127.0.0.1:5000`

### Frontend Setup

1. **Navigate to the React frontend directory:**
   ```bash
   cd React_Frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   
   The frontend will be available at `http://localhost:5173`

## 📊 How It Works

### 1. Data Augmentation with GAN
- **Generator**: Creates synthetic fraudulent transaction data
- **Discriminator**: Distinguishes between real and synthetic data
- **Training**: 1000 epochs with batch normalization and label smoothing
- **Output**: Balanced dataset with realistic fraud patterns

### 2. Model Training
- **Algorithm**: Random Forest Classifier
- **Optimization**: GridSearchCV for hyperparameter tuning
- **Features**: Normalized transaction features (MinMaxScaler)
- **Encoding**: One-hot encoding for categorical variables

### 3. Real-time Prediction
- **Input**: Transaction feature vector
- **Processing**: Normalization and feature engineering
- **Output**: Binary classification (Fraud/Legitimate)
- **API**: RESTful endpoint for predictions

## 🔧 API Documentation

### Predict Endpoint

**URL:** `POST /predict`

**Request Body:**
```json
{
  "features": [0.5, 0.3, 0.8, 0.2, 0.9, 0.1, 0.7]
}
```

**Response:**
```json
{
  "prediction": [1]  // 1 = Fraud, 0 = Legitimate
}
```

**Error Response:**
```json
{
  "error": "Error message"
}
```

## 🎨 Frontend Features

### Single Prediction
- Enter transaction features as comma-separated values
- Real-time validation and error handling
- Visual feedback for fraud/legitimate classification
- Model performance metrics display

### Batch Analysis
- Upload CSV files with multiple transactions
- Bulk processing capability
- Downloadable results

### About Model
- Technology stack overview
- Model architecture details
- Performance metrics
- Implementation guide

## 📈 Model Performance

| Metric | Value |
|--------|-------|
| Accuracy | 95%+ |
| Precision | High |
| Recall | High |
| AUC-ROC | 0.9+ |

## 🛠️ Technology Stack

### Machine Learning
- **TensorFlow/Keras**: GAN implementation
- **scikit-learn**: Random Forest classifier
- **NumPy/Pandas**: Data processing
- **Matplotlib/Seaborn**: Visualization

### Backend
- **Flask**: REST API framework
- **Flask-CORS**: Cross-origin resource sharing
- **pickle**: Model serialization

### Frontend
- **React 19**: UI framework
- **Tailwind CSS**: Styling
- **Vite**: Build tool and dev server

## 📝 Usage Example

### Single Transaction Analysis

1. Open the frontend application
2. Navigate to "Single Prediction" tab
3. Enter normalized feature values (e.g., `0.5, 0.3, 0.8, 0.2, 0.9, 0.1, 0.7`)
4. Click "Analyze Transaction"
5. View the prediction result

### Batch Analysis

1. Navigate to "Batch Analysis" tab
2. Upload a CSV file with transaction features
3. Click "Analyze Batch"
4. Download results

## 🔐 Data Privacy

- All predictions are processed locally
- No transaction data is stored
- API follows REST best practices
- CORS enabled for secure cross-origin requests

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 👥 Authors

- **Pratham Gupta** - [GitHub](https://github.com/Pratham-gupta-235)

## 🙏 Acknowledgments

- TensorFlow team for the deep learning framework
- scikit-learn contributors for machine learning tools
- React and Vite teams for the frontend framework

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

**Note**: Make sure both the Flask backend and React frontend are running for the application to work properly.
