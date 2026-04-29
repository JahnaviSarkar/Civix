# Export complaint data from Firebase to CSV
import csv, sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))
from config import init_firebase
from services.firebase_service import read_data

init_firebase()
data = read_data('complaints') or {}

with open('complaints_export.csv', 'w', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=['id','category','status','severity_score','created_at'])
    writer.writeheader()
    for k, v in data.items():
        writer.writerow({'id': k, **v})
print('Exported to complaints_export.csv')
