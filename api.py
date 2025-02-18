from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi import Response
from fastapi.responses import JSONResponse, FileResponse
import json
import numpy as np
import psycopg2
import os
import cv2
from PIL import Image
from imgbeddings import imgbeddings
import io
import uvicorn
import ast  
from dotenv import load_dotenv

# Initialize FastAPI app
app = FastAPI()

# Database connection
DB_URI = os.getenv("DB_URI")
conn = psycopg2.connect(DB_URI)

# Initialize image embeddings
ibed = imgbeddings()

# Load the Haar Cascade for face detection
face_cascade = cv2.CascadeClassifier("haarcascade_frontalface_default.xml")

# Directory to store images
IMAGE_DIR = "stored-faces"
os.makedirs(IMAGE_DIR, exist_ok=True)

# Cosine Similarity Function
def cosine_similarity(vec1, vec2):
    vec1, vec2 = np.array(vec1), np.array(vec2)
    return np.dot(vec1, vec2) / (np.linalg.norm(vec1) * np.linalg.norm(vec2))

def extract_face(image: Image.Image):
    """Extracts the face from an image using Haar Cascade."""
    img_cv = np.array(image.convert("RGB"))[:, :, ::-1]  # Convert RGB to BGR
    gray = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(50, 50))

    if len(faces) == 0:
        return None  # No face found

    x, y, w, h = faces[0]
    face_roi = gray[y:y+h, x:x+w]  # Crop the face region
    face_resized = cv2.resize(face_roi, (100, 100))

    return Image.fromarray(face_resized)  # Convert back to PIL format

@app.post("/register/")
async def register_user(image: UploadFile = File(...)):
    image_bytes = await image.read()
    img = Image.open(io.BytesIO(image_bytes))

    face_img = extract_face(img)
    if face_img is None:
        raise HTTPException(status_code=400, detail="No face detected")

    embedding = ibed.to_embeddings(face_img)[0].tolist()
    image_path = f"{IMAGE_DIR}/{image.filename}"
    face_img.save(image_path)

    cur = conn.cursor()
    cur.execute("INSERT INTO pictures (picture, embedding) VALUES (%s, %s)", (image.filename, embedding))
    conn.commit()
    cur.close()

    return {"message": "User registered successfully", "image_path": image_path}

import ast  # Add this at the top

@app.post("/search/")
async def search_user(image: UploadFile = File(...)):
    image_bytes = await image.read()
    img = Image.open(io.BytesIO(image_bytes))

    face_img = extract_face(img)
    if face_img is None:
        raise HTTPException(status_code=400, detail="No face detected")

    embedding = ibed.to_embeddings(face_img)[0].tolist()

    # Search in DB
    cur = conn.cursor()
    cur.execute("SELECT picture, embedding FROM pictures")
    rows = cur.fetchall()
    cur.close()

    if not rows:
        raise HTTPException(status_code=404, detail="No registered users in the database")

    # Compute similarity with all stored embeddings
    best_match = None
    best_similarity = -1
    for row in rows:
        stored_filename, stored_embedding_str = row
        stored_embedding = ast.literal_eval(stored_embedding_str)  # Convert string to list

        similarity = cosine_similarity(embedding, stored_embedding)
        if similarity > best_similarity:
            best_similarity = similarity
            best_match = stored_filename

    # Set a threshold (e.g., 0.7) for a valid match
    THRESHOLD = 0.7
    if best_similarity < THRESHOLD:
        return JSONResponse(content={"message": "User not found", "match_score": best_similarity})

    # Return JSON response with a link to fetch the image
    return {
        "message": "User found",
        "registered_image_url": f"/get-image/{best_match}",
        "match_score": best_similarity
    }

@app.get("/get-image/{filename}")
async def get_image(filename: str):
    image_path = os.path.join(IMAGE_DIR, filename)
    if not os.path.exists(image_path):
        raise HTTPException(status_code=404, detail="Image not found")
    return FileResponse(image_path, media_type="image/jpeg")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)