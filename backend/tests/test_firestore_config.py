from app.services.firestore import FirestoreRepository

def test_firestore_repository_user_crud():
    user = FirestoreRepository.create_user("test_uid_123", "Test User", "test@civix.local", "citizen")
    assert user["firebase_uid"] == "test_uid_123"
    assert user["name"] == "Test User"
    assert user["role"] == "citizen"

    fetched = FirestoreRepository.get_user_by_uid("test_uid_123")
    assert fetched is not None
    assert fetched["email"] == "test@civix.local"

    updated = FirestoreRepository.update_user_name("test_uid_123", "Updated Test User")
    assert updated["name"] == "Updated Test User"

def test_firestore_repository_complaint_lifecycle():
    citizen = FirestoreRepository.create_user("citizen_uid", "Jane Citizen", "citizen@civix.local", "citizen")
    crew = FirestoreRepository.create_user("crew_uid", "Crew Team", "crew@civix.local", "crew")

    payload = {
        "title": "Overflowing bin",
        "description": "Bin overflowing on main street",
        "category": "Garbage Collection",
        "latitude": 12.97,
        "longitude": 77.59,
        "address": "Main Street"
    }

    complaint = FirestoreRepository.create_complaint(citizen, payload)
    cid = complaint["id"]
    assert complaint["status"] == "PENDING"

    # Assign
    assigned = FirestoreRepository.assign_complaint(cid, crew, notes="Assigned to crew")
    assert assigned["status"] == "ASSIGNED"

    # Resolve
    resolved = FirestoreRepository.resolve_complaint(cid, crew["id"], notes="Cleaned up", after_image_url="http://img.url")
    assert resolved["status"] == "RESOLVED"

    # Verify
    verified = FirestoreRepository.verify_complaint(cid, accepted=True, rejection_reason=None)
    assert verified["status"] == "VERIFIED"

    # Rate
    rated = FirestoreRepository.rate_complaint(cid, citizen["id"], score=5, feedback="Great job!")
    assert rated["rating"]["score"] == 5
