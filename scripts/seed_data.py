# Populate Firebase with sample complaints for testing
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))
from config import init_firebase
from services.firebase_service import push_data
from datetime import datetime

init_firebase()

samples = [
    {'category': 'garbage_pile',   'latitude': 28.6139, 'longitude': 77.2090, 'status': 'submitted', 'severity_score': 0.8},
    {'category': 'drain_blockage', 'latitude': 28.6200, 'longitude': 77.2100, 'status': 'assigned',  'severity_score': 0.9},
    {'category': 'minor_litter',   'latitude': 28.6050, 'longitude': 77.2000, 'status': 'resolved',  'severity_score': 0.3},
]

for s in samples:
    s['created_at'] = datetime.utcnow().isoformat()
    push_data('complaints', s)
    print(f"Seeded: {s['category']}")
