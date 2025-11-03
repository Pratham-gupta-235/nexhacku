import pickle
import numpy as np
import random

with open('best_rf_model (1).pkl','rb') as f:
    model = pickle.load(f)

print('n_features:', model.n_features_in_)
RAD = model.n_features_in_
random.seed(42)
np.random.seed(42)

def search(name, sampler):
    for attempt in range(1, 40001):
        vec = sampler()
        if model.predict([vec])[0] == 1:
            print(f'Found class 1 via {name} attempt {attempt}')
            print([round(float(v), 4) for v in vec])
            return vec
    return None

res = search('high', lambda: np.random.uniform(0.85, 1.0, RAD))
if res is None:
    res = search('low', lambda: np.random.uniform(0.0, 0.2, RAD))
if res is None:
    res = search('mixed', lambda: np.array([np.random.uniform(0.85, 1.0) if i % 2 == 0 else np.random.uniform(0.0, 0.2) for i in range(RAD)]))
if res is None:
    res = search('bimodal', lambda: np.array([np.random.uniform(0.9, 1.0) if random.random() < 0.7 else np.random.uniform(0.0, 0.05) for _ in range(RAD)]))
if res is None:
    print('No positive example found in search.')
