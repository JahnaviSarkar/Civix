let map;

function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 28.6139, lng: 77.2090 }, // default (India)
    zoom: 10
  });
}

function addMarkers(complaints) {
  complaints.forEach(c => {
    if (!c.latitude || !c.longitude) return;

    new google.maps.Marker({
      position: {
        lat: parseFloat(c.latitude),
        lng: parseFloat(c.longitude)
      },
      map: map,
      title: c.description
    });
  });
}