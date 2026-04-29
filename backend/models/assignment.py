# Assignment document shape
ASSIGNMENT_SCHEMA = {
    'id': str,
    'complaint_id': str,
    'team_id': str,
    'ward': str,
    'assigned_by': str,        # admin user ID
    'sla_deadline': str,       # ISO timestamp
    'status': str,             # assigned | in_progress | completed
    'created_at': str,
}
