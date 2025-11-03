import React, { useState } from "react";
import axios from "axios";

const PredictForm = () => {
  const [csvFile, setCsvFile] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === "text/csv") {
      setCsvFile(file);
      setError(null);
    } else {
      setError("Please upload a valid CSV file");
      setCsvFile(null);
    }
  };

  const parseCSV = (text) => {
    const lines = text.trim().split("\n");
    const data = [];
    
    lines.forEach((line, index) => {
      // Skip empty lines
      if (!line.trim()) return;
      
      // Parse CSV line (handle both comma and quoted values)
      const values = line.split(",").map((val) => parseFloat(val.trim()));
      
      // Validate that we have 22 features
      if (values.length === 22 && !values.some(isNaN)) {
        data.push(values);
      } else if (index > 0) { // Skip header warning if first line
        console.warn(`Line ${index + 1} has invalid data or incorrect feature count`);
      }
    });
    
    return data;
  };

  const handlePredict = async () => {
    if (!csvFile) {
      setError("Please select a CSV file first");
      return;
    }

    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const text = await csvFile.text();
      const featureRows = parseCSV(text);

      if (featureRows.length === 0) {
        setError("No valid feature rows found in CSV. Each row should have exactly 22 numerical values.");
        setLoading(false);
        return;
      }

      // Process predictions for each row
      const predictions = [];
      for (let i = 0; i < featureRows.length; i++) {
        try {
          const response = await axios.post("http://127.0.0.1:8000/predict", {
            features: featureRows[i],
          });
          predictions.push({
            row: i + 1,
            features: featureRows[i],
            prediction: response.data.prediction[0],
            success: true,
          });
        } catch (err) {
          predictions.push({
            row: i + 1,
            features: featureRows[i],
            error: err.response?.data?.detail || err.message,
            success: false,
          });
        }
      }

      setResults(predictions);
    } catch (err) {
      setError(`Error processing file: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const downloadResults = () => {
    const csvContent = [
      "Row,Prediction,Status",
      ...results.map((r) =>
        `${r.row},${r.success ? r.prediction : "Error"},${
          r.success ? "Success" : r.error
        }`
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "fraud_predictions.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h2>Fraud Detection - Batch Prediction</h2>
      
      <div style={{ marginBottom: "20px", padding: "15px", backgroundColor: "#f0f8ff", borderRadius: "8px" }}>
        <h3>CSV Format Requirements:</h3>
        <ul>
          <li>Each row should contain exactly <strong>22 numerical values</strong></li>
          <li>Values should be comma-separated</li>
          <li>Values should be normalized between 0 and 1</li>
          <li>No header row (or it will be skipped if first line has non-numeric data)</li>
        </ul>
        <p style={{ fontSize: "12px", color: "#666" }}>
          Example: 0.008,0.0,1.0,0.0,1.0,0.189,0.290,0.875,0.033,0.0,0.0,0.0,0.556,0.158,0.0,0.0,0.0,0.0,0.0,1.0,0.0,0.0
        </p>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <label
          htmlFor="csv-upload"
          style={{
            display: "inline-block",
            padding: "10px 20px",
            backgroundColor: "#4CAF50",
            color: "white",
            borderRadius: "5px",
            cursor: "pointer",
            fontSize: "16px",
          }}
        >
          {csvFile ? csvFile.name : "Choose CSV File"}
        </label>
        <input
          id="csv-upload"
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
      </div>

      <button
        onClick={handlePredict}
        disabled={!csvFile || loading}
        style={{
          padding: "12px 24px",
          backgroundColor: loading ? "#ccc" : "#2196F3",
          color: "white",
          border: "none",
          borderRadius: "5px",
          fontSize: "16px",
          cursor: loading ? "not-allowed" : "pointer",
          marginRight: "10px",
        }}
      >
        {loading ? "Processing..." : "Predict"}
      </button>

      {results.length > 0 && (
        <button
          onClick={downloadResults}
          style={{
            padding: "12px 24px",
            backgroundColor: "#FF9800",
            color: "white",
            border: "none",
            borderRadius: "5px",
            fontSize: "16px",
            cursor: "pointer",
          }}
        >
          Download Results
        </button>
      )}

      {error && (
        <div
          style={{
            marginTop: "20px",
            padding: "15px",
            backgroundColor: "#ffebee",
            borderLeft: "4px solid #f44336",
            borderRadius: "4px",
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}

      {results.length > 0 && (
        <div style={{ marginTop: "30px" }}>
          <h3>Prediction Results ({results.length} rows)</h3>
          <div
            style={{
              backgroundColor: "#f5f5f5",
              padding: "10px",
              borderRadius: "5px",
              marginBottom: "15px",
            }}
          >
            <strong>Summary:</strong>
            <ul>
              <li>
                Fraudulent: {results.filter((r) => r.success && r.prediction === 1).length}
              </li>
              <li>
                Legitimate: {results.filter((r) => r.success && r.prediction === 0).length}
              </li>
              <li>Errors: {results.filter((r) => !r.success).length}</li>
            </ul>
          </div>

          <div style={{ maxHeight: "400px", overflowY: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                backgroundColor: "white",
              }}
            >
              <thead>
                <tr style={{ backgroundColor: "#2196F3", color: "white" }}>
                  <th style={{ padding: "12px", border: "1px solid #ddd" }}>Row</th>
                  <th style={{ padding: "12px", border: "1px solid #ddd" }}>Prediction</th>
                  <th style={{ padding: "12px", border: "1px solid #ddd" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result) => (
                  <tr
                    key={result.row}
                    style={{
                      backgroundColor: result.success
                        ? result.prediction === 1
                          ? "#ffebee"
                          : "#e8f5e9"
                        : "#fff3e0",
                    }}
                  >
                    <td style={{ padding: "10px", border: "1px solid #ddd" }}>
                      {result.row}
                    </td>
                    <td
                      style={{
                        padding: "10px",
                        border: "1px solid #ddd",
                        fontWeight: "bold",
                      }}
                    >
                      {result.success ? (
                        <span
                          style={{
                            color: result.prediction === 1 ? "#d32f2f" : "#388e3c",
                          }}
                        >
                          {result.prediction === 1 ? "⚠️ FRAUD" : "✅ LEGITIMATE"}
                        </span>
                      ) : (
                        <span style={{ color: "#f57c00" }}>Error</span>
                      )}
                    </td>
                    <td style={{ padding: "10px", border: "1px solid #ddd" }}>
                      {result.success ? "Success" : result.error}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default PredictForm;
