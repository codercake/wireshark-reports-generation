import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
import joblib

def train_model(data):
    X = data.drop(columns=['label']) 
    y = data['label']  

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

    model = RandomForestClassifier()
    model.fit(X_train, y_train)

    joblib.dump(model, 'models/attack_detector.pkl')  

