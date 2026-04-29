import tensorflow as tf
import numpy as np
from PIL import Image
import json, io

model = None

def load_model():
    global model
    model = tf.keras.applications.MobileNetV2(weights='imagenet', include_top=True)

def score_severity(image_bytes):
    if model is None:
        load_model()
    img = Image.open(io.BytesIO(image_bytes)).resize((224, 224))
    arr = tf.keras.applications.mobilenet_v2.preprocess_input(np.array(img)[None])
    preds = model.predict(arr)
    # Map top prediction confidence to a 0-1 severity score
    top_score = float(np.max(preds))
    return round(top_score, 3)
