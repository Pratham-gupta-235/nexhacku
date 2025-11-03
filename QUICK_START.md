# 🚀 Quick Start Guide - FraudGuard AI

## Step-by-Step Instructions

### 1️⃣ Start the Backend (Flask API)

```powershell
# Navigate to the Flask server directory
cd AI_model_server_Flask

# Activate virtual environment
.\env\Scripts\activate

# Run the Flask server
python app.py
```

✅ You should see: `Running on http://127.0.0.1:5000`

---

### 2️⃣ Start the Frontend (React)

Open a **new terminal** and run:

```powershell
# Navigate to the React frontend directory
cd React_Frontend

# Install dependencies (first time only)
npm install

# Start the development server
npm run dev
```

✅ You should see: `Local: http://localhost:5173/`

---

### 3️⃣ Access the Application

Open your browser and go to: **http://localhost:5173**

---

## 🧪 Testing the Application

### Single Prediction Test

1. Click on **"Single Prediction"** tab
2. Enter sample features (normalized values 0-1):
   ```
   0.5, 0.3, 0.8, 0.2, 0.9, 0.1, 0.7
   ```
3. Click **"Analyze Transaction"**
4. View the fraud prediction result!

### Example Features to Try

**Legitimate Transaction:**
```
0.1, 0.2, 0.15, 0.3, 0.25, 0.18, 0.22
```

**Potentially Fraudulent:**
```
0.9, 0.85, 0.92, 0.88, 0.95, 0.87, 0.91
```

---

## ⚠️ Troubleshooting

### Backend Issues

**Error: "Module not found"**
```powershell
# Make sure you're in the Flask directory and env is activated
cd AI_model_server_Flask
.\env\Scripts\activate
pip install flask flask-cors numpy scikit-learn
```

**Error: "Model file not found"**
- Ensure `best_rf_model (1).pkl` exists in `AI_model_server_Flask/`
- If missing, you need to run the Jupyter notebook to generate it

### Frontend Issues

**Error: "Failed to fetch"**
- Make sure Flask server is running on port 5000
- Check browser console for CORS errors
- Verify API_URL in App.jsx is `http://127.0.0.1:5000`

**Error: npm command not found**
- Install Node.js from https://nodejs.org/

---

## 📱 Application Features

### ✨ What You Can Do:

1. **Single Prediction**
   - Analyze individual transactions
   - Get instant fraud detection results
   - See detailed prediction information

2. **Batch Analysis**
   - Upload CSV files
   - Process multiple transactions
   - (Feature in development)

3. **About Model**
   - Learn about the technology
   - View model architecture
   - See performance metrics

---

## 🛑 Stopping the Application

### Stop Flask Server
Press `Ctrl + C` in the Flask terminal

### Stop React Dev Server
Press `Ctrl + C` in the React terminal

---

## 📊 Understanding Results

### Prediction Output

- **0** = Legitimate Transaction ✅
- **1** = Fraudulent Transaction ⚠️

### Color Coding

- 🟢 **Green** = Safe/Legitimate
- 🔴 **Red** = Fraud Detected

---

## 💡 Tips

1. **Keep both servers running** - Backend and Frontend need to run simultaneously
2. **Use normalized values** - Features should be between 0 and 1
3. **Check console logs** - Useful for debugging
4. **API Status** - Green "API Online" badge should be visible

---

## 🔗 Important URLs

- **Frontend:** http://localhost:5173
- **Backend API:** http://127.0.0.1:5000
- **API Health:** http://127.0.0.1:5000/

---

## 📞 Need Help?

Check the main README.md for detailed documentation or open an issue on GitHub.

Happy Fraud Detecting! 🛡️
