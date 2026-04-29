from firebase_admin import storage

def upload_image(file_obj, destination_path):
    bucket = storage.bucket()
    blob = bucket.blob(destination_path)
    blob.upload_from_file(file_obj, content_type='image/jpeg')
    blob.make_public()
    return blob.public_url
