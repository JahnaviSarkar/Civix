from services.firebase_service import update_data

def notify_status_change(complaint_id, new_status, citizen_id):
    # Write a notification entry the frontend listens to
    update_data(f'notifications/{citizen_id}/{complaint_id}', {
        'status': new_status,
        'read': False
    })
