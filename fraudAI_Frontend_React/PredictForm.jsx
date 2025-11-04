import React, { useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Upload, Download, AlertCircle, CheckCircle2, XCircle, FileJson, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Header from "./src/components/logic/Header";
import SidebarContent from "./src/components/logic/SidebarContent";

const PredictForm = () => {
  const [jsonFile, setJsonFile] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

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
    <div className="flex min-h-screen bg-gray-900 text-gray-100">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-72 min-h-screen border-r border-gray-800 bg-gray-900">
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        {/* Header */}
        <Header user={user} />

        {/* Fraud Detection Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="p-6 space-y-6 max-w-6xl mx-auto"
        >
          {/* Page Title */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">AI Fraud Detection</h1>
            <p className="text-gray-400">Upload transaction data for batch fraud analysis</p>
          </div>

          {/* Upload Card */}
          <Card className="bg-gray-800 border-gray-700 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-100 flex items-center">
                <FileJson className="mr-2 h-6 w-6 text-blue-400" />
                Upload Transaction Data
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* JSON Format Instructions */}
              <Card className="bg-gray-700 border-gray-600">
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold text-white mb-3">JSON Format Requirements:</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-blue-400 mb-2">Option 1 - Single Transaction:</p>
                      <pre className="bg-gray-900 text-gray-300 p-3 rounded-md text-xs overflow-x-auto border border-gray-600">
{`{
  "features": [0.008, 0.0, 1.0, 0.0, 1.0, 0.189, 
               0.290, 0.875, 0.033, 0.0, 0.0, 0.0, 
               0.556, 0.158, 0.0, 0.0, 0.0, 0.0, 
               0.0, 1.0, 0.0, 0.0]
}`}
                      </pre>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-blue-400 mb-2">Option 2 - Multiple Transactions:</p>
                      <pre className="bg-gray-900 text-gray-300 p-3 rounded-md text-xs overflow-x-auto border border-gray-600">
{`{
  "features": [
    [0.008, 0.0, 1.0, ..., 0.0],
    [0.55, 1.0, 0.60, ..., 1.0]
  ]
}`}
                      </pre>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-blue-400 mb-2">Option 3 - Array Format:</p>
                      <pre className="bg-gray-900 text-gray-300 p-3 rounded-md text-xs overflow-x-auto border border-gray-600">
{`[
  {"features": [0.008, 0.0, 1.0, ..., 0.0]},
  {"features": [0.55, 1.0, 0.60, ..., 1.0]}
]`}
                      </pre>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-blue-500 bg-opacity-10 border border-blue-500 border-opacity-30 rounded-md">
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li className="flex items-start">
                        <CheckCircle2 className="h-4 w-4 text-blue-400 mr-2 mt-0.5 flex-shrink-0" />
                        Each transaction must have exactly <strong className="text-white mx-1">22 numerical values</strong>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle2 className="h-4 w-4 text-blue-400 mr-2 mt-0.5 flex-shrink-0" />
                        Values should be normalized between 0 and 1
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* File Upload Section */}
              <div className="space-y-3">
                <label
                  htmlFor="json-upload"
                  className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-gray-700 transition-all duration-300"
                >
                  <div className="text-center">
                    <Upload className="mx-auto h-10 w-10 text-gray-400 mb-2" />
                    {jsonFile ? (
                      <div>
                        <p className="text-sm font-medium text-blue-400">{jsonFile.name}</p>
                        <p className="text-xs text-gray-500 mt-1">Click to change file</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm font-medium text-gray-300">Choose JSON File</p>
                        <p className="text-xs text-gray-500 mt-1">or drag and drop</p>
                      </div>
                    )}
                  </div>
                </label>
                <input
                  id="json-upload"
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={handlePredict}
                  disabled={!jsonFile || loading}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-5 w-5" />
                      Analyze Transactions
                    </>
                  )}
                </Button>

                {results.length > 0 && (
                  <Button
                    onClick={downloadResults}
                    className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300"
                  >
                    <Download className="mr-2 h-5 w-5" />
                    Download Results
                  </Button>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start p-4 bg-red-500 bg-opacity-10 border border-red-500 border-opacity-30 rounded-lg"
                >
                  <AlertCircle className="h-5 w-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-400">Error</p>
                    <p className="text-sm text-gray-300 mt-1">{error}</p>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>

          {/* Results Section */}
          {results.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="bg-gray-800 border-gray-700 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-gray-100">
                    Analysis Results ({results.length} transactions)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-red-500 bg-opacity-10 border-red-500 border-opacity-30">
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <XCircle className="h-10 w-10 text-red-400 mx-auto mb-2" />
                          <p className="text-3xl font-bold text-red-400">
                            {results.filter((r) => r.success && r.prediction === 1).length}
                          </p>
                          <p className="text-sm text-gray-400 mt-1">Fraudulent</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-green-500 bg-opacity-10 border-green-500 border-opacity-30">
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <CheckCircle2 className="h-10 w-10 text-green-400 mx-auto mb-2" />
                          <p className="text-3xl font-bold text-green-400">
                            {results.filter((r) => r.success && r.prediction === 0).length}
                          </p>
                          <p className="text-sm text-gray-400 mt-1">Legitimate</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-yellow-500 bg-opacity-10 border-yellow-500 border-opacity-30">
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <AlertCircle className="h-10 w-10 text-yellow-400 mx-auto mb-2" />
                          <p className="text-3xl font-bold text-yellow-400">
                            {results.filter((r) => !r.success).length}
                          </p>
                          <p className="text-sm text-gray-400 mt-1">Errors</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Results Table */}
                  <div className="overflow-x-auto rounded-lg border border-gray-700">
                    <div className="max-h-96 overflow-y-auto">
                      <table className="w-full">
                        <thead className="bg-gray-700 sticky top-0">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                              Row
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                              Prediction
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                          {results.map((result) => (
                            <motion.tr
                              key={result.row}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ duration: 0.3 }}
                              className={`${
                                result.success
                                  ? result.prediction === 1
                                    ? "bg-red-500 bg-opacity-5 hover:bg-opacity-10"
                                    : "bg-green-500 bg-opacity-5 hover:bg-opacity-10"
                                  : "bg-yellow-500 bg-opacity-5 hover:bg-opacity-10"
                              } transition-colors duration-200`}
                            >
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                #{result.row}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {result.success ? (
                                  <Badge
                                    variant={result.prediction === 1 ? "destructive" : "success"}
                                    className={`${
                                      result.prediction === 1
                                        ? "bg-red-500 hover:bg-red-600"
                                        : "bg-green-500 hover:bg-green-600"
                                    } text-white font-semibold`}
                                  >
                                    {result.prediction === 1 ? "⚠️ FRAUD" : "✅ LEGITIMATE"}
                                  </Badge>
                                ) : (
                                  <Badge variant="warning" className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold">
                                    ❌ ERROR
                                  </Badge>
                                )}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-400">
                                {result.success ? "Success" : result.error}
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default PredictForm;
