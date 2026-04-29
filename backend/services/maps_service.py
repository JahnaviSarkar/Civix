import requests, os

MAPS_KEY = os.getenv('GOOGLE_MAPS_API_KEY')

def reverse_geocode(lat, lng):
    url = f'https://maps.googleapis.com/maps/api/geocode/json?latlng={lat},{lng}&key={MAPS_KEY}'
    resp = requests.get(url).json()
    if resp['results']:
        return resp['results'][0]['formatted_address']
    return None
