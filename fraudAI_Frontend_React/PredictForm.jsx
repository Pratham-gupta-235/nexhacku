import React, { useState } from "react";
import axios from "axios";

const PredictForm = () => {
  const [jsonFile, setJsonFile] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === "application/json") {
      setJsonFile(file);
      setError(null);
    } else {
      setError("Please upload a valid JSON file");
      setJsonFile(null);
    }
  };

  const parseJSON = (text) => {
    try {
      const data = JSON.parse(text);
      
      // Handle single transaction object with features array
      if (data.features && Array.isArray(data.features)) {
        // Check if it's a single transaction
        if (data.features.every(item => typeof item === 'number')) {
          return [data.features];
        }
        // If features is an array of arrays
        return data.features;
      }
      
      // Handle array of transaction objects
      if (Array.isArray(data)) {
        return data.map(item => {
          if (Array.isArray(item)) return item;
          if (item.features && Array.isArray(item.features)) return item.features;
          return Object.values(item);
        });
      }
      
      throw new Error("Invalid JSON format");
    } catch (err) {
      throw new Error(`JSON parsing error: ${err.message}`);
    }
  };

  const handlePredict = async () => {
    if (!jsonFile) {
      setError("Please select a JSON file first");
      return;
    }

    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const text = await jsonFile.text();
      const featureRows = parseJSON(text);

      if (featureRows.length === 0) {
        setError("No valid feature rows found in JSON. Each transaction should have exactly 22 numerical values.");
        setLoading(false);
        return;
      }

      // Validate feature count
      const invalidRows = featureRows.filter(row => row.length !== 22);
      if (invalidRows.length > 0) {
        setError(`Found ${invalidRows.length} row(s) with invalid feature count. Each row must have exactly 22 features.`);
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
    const jsonResults = {
      total: results.length,
      fraudulent: results.filter((r) => r.success && r.prediction === 1).length,
      legitimate: results.filter((r) => r.success && r.prediction === 0).length,
      errors: results.filter((r) => !r.success).length,
      predictions: results.map((r) => ({
        row: r.row,
        prediction: r.success ? (r.prediction === 1 ? "FRAUD" : "LEGITIMATE") : "ERROR",
        prediction_value: r.success ? r.prediction : null,
        status: r.success ? "Success" : r.error,
      })),
    };

    const blob = new Blob([JSON.stringify(jsonResults, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "fraud_predictions.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h2>Fraud Detection - Batch Prediction</h2>
      
      <div style={{ marginBottom: "20px", padding: "15px", backgroundColor: "#f0f8ff", borderRadius: "8px" }}>
        <h3>JSON Format Requirements:</h3>
        <p><strong>Option 1 - Single Transaction:</strong></p>
        <pre style={{ backgroundColor: "#f5f5f5", padding: "10px", borderRadius: "4px", fontSize: "12px" }}>
{`{
  "features": [0.008, 0.0, 1.0, 0.0, 1.0, 0.189, 
               0.290, 0.875, 0.033, 0.0, 0.0, 0.0, 
               0.556, 0.158, 0.0, 0.0, 0.0, 0.0, 
               0.0, 1.0, 0.0, 0.0]
}`}
        </pre>
        
        <p><strong>Option 2 - Multiple Transactions:</strong></p>
        <pre style={{ backgroundColor: "#f5f5f5", padding: "10px", borderRadius: "4px", fontSize: "12px" }}>
{`{
  "features": [
    [0.008, 0.0, 1.0, ..., 0.0],
    [0.55, 1.0, 0.60, ..., 1.0]
  ]
}`}
        </pre>
        
        <p><strong>Option 3 - Array Format:</strong></p>
        <pre style={{ backgroundColor: "#f5f5f5", padding: "10px", borderRadius: "4px", fontSize: "12px" }}>
{`[
  {"features": [0.008, 0.0, 1.0, ..., 0.0]},
  {"features": [0.55, 1.0, 0.60, ..., 1.0]}
]`}
        </pre>
        
        <ul style={{ marginTop: "10px" }}>
          <li>Each transaction must have exactly <strong>22 numerical values</strong></li>
          <li>Values should be normalized between 0 and 1</li>
        </ul>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <label
          htmlFor="json-upload"
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
          {jsonFile ? jsonFile.name : "Choose JSON File"}
        </label>
        <input
          id="json-upload"
          type="file"
          accept=".json,application/json"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
      </div>

      <button
        onClick={handlePredict}
        disabled={!jsonFile || loading}
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
          Download Results (JSON)
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
          <h3>Prediction Results ({results.length} transactions)</h3>
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
