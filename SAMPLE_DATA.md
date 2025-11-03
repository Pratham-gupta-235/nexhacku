# Sample Transaction Data for Testing

## Single Prediction Examples

### Legitimate Transactions (Expected: 0)
```
0.12, 0.23, 0.15, 0.28, 0.19, 0.21, 0.17, 0.25, 0.13, 0.18
```

```
0.31, 0.27, 0.33, 0.29, 0.24, 0.35, 0.26, 0.22, 0.30, 0.28
```

```
0.08, 0.11, 0.14, 0.09, 0.13, 0.10, 0.15, 0.12, 0.07, 0.11
```

### Potentially Fraudulent Transactions (Expected: 1)
```
0.89, 0.92, 0.87, 0.95, 0.91, 0.88, 0.93, 0.90, 0.94, 0.86
```

```
0.78, 0.82, 0.85, 0.79, 0.88, 0.81, 0.86, 0.83, 0.80, 0.84
```

```
0.93, 0.96, 0.91, 0.98, 0.94, 0.92, 0.97, 0.95, 0.90, 0.93
```

## Batch CSV Format

Create a CSV file with the following format (no headers):

```csv
0.12,0.23,0.15,0.28,0.19,0.21,0.17,0.25,0.13,0.18
0.89,0.92,0.87,0.95,0.91,0.88,0.93,0.90,0.94,0.86
0.31,0.27,0.33,0.29,0.24,0.35,0.26,0.22,0.30,0.28
0.78,0.82,0.85,0.79,0.88,0.81,0.86,0.83,0.80,0.84
0.08,0.11,0.14,0.09,0.13,0.10,0.15,0.12,0.07,0.11
```

## Feature Explanation

The model expects normalized feature values between 0 and 1. These represent:
- Transaction amount patterns
- Time-based features
- Location data
- Account history metrics
- Behavioral patterns
- Device fingerprints
- Network indicators

**Note:** Actual features depend on your trained model and dataset. Adjust the number of features based on your model's input dimension.

## Testing Tips

1. **Normal Activity:** Use values mostly between 0.1 - 0.4
2. **Suspicious Activity:** Use values mostly between 0.7 - 0.95
3. **Mixed Signals:** Combine high and low values randomly
4. **Edge Cases:** Try values very close to 0 or 1

## API Testing with cURL

### Single Prediction
```bash
curl -X POST http://127.0.0.1:5000/predict \
  -H "Content-Type: application/json" \
  -d "{\"features\": [0.5, 0.3, 0.8, 0.2, 0.9, 0.1, 0.7]}"
```

### Expected Response
```json
{
  "prediction": [1]
}
```

or

```json
{
  "prediction": [0]
}
```
