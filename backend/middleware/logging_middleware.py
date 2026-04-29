from flask import request
from datetime import datetime
from services.firebase_service import push_data

def log_action(user_id, action, resource_id):
    push_data('audit_logs', {
        'user_id': user_id,
        'action': action,
        'resource_id': resource_id,
        'timestamp': datetime.utcnow().isoformat()
    })
