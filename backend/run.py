# File: backend/run.py
from app import app   # ✅ FIXED IMPORT

if __name__ == "__main__":
    app.run(debug=True)