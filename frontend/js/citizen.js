// File: frontend/js/citizen.js

const API_BASE = "http://127.0.0.1:8000/api";

async function loadMyComplaints() {
    const uid = localStorage.getItem('uid'); // Stored during login
    const response = await fetch(`${API_BASE}/complaints/my-complaints/${uid}`);
    const complaints = await response.json();
    
    const container = document.getElementById('complaints-container');
    container.innerHTML = complaints.map(c => `
        <div class="complaint-card">
            <h4>${c.description}</h4>
            <p>Status: <span class="badge ${c.status}">${c.status}</span></p>
            ${c.status === 'closed' ? `
                <div class="feedback">
                    <p>Rating: ${'★'.repeat(c.feedback_stars)}</p>
                    <p>Review: ${c.review_text}</p>
                </div>
            ` : ''}
        </div>
    `).join('');
}

function logout() {
    localStorage.clear();
    window.location.href = "../login.html";
}

// Load data on page entry
if (document.getElementById('complaints-container')) loadMyComplaints();

// File: frontend/js/citizen.js

// File: frontend/js/citizen.js

async function submitComplaint(e) {
    e.preventDefault();
    console.log("Submit button clicked..."); // Check your console (F12) for this!

    const submitBtn = e.target.querySelector('button');
    submitBtn.innerText = "Submitting...";
    submitBtn.disabled = true;

    // Fix: Fallback to test email if localStorage is empty
    const userEmail = localStorage.getItem('userEmail') || "test@gmail.com";

    const formData = {
        title: document.getElementById('title').value,
        category: document.getElementById('category').value,
        location: document.getElementById('location').value,
        description: document.getElementById('description').value,
        priority: document.getElementById('priority').value,
        citizen_email: userEmail
    };

    try {
        const response = await fetch('http://127.0.0.1:8000/api/complaints/citizen-submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            alert("Complaint Logged Successfully!");
            window.location.href = "dashboard.html";
        } else {
            const errData = await response.json();
            alert("Error: " + errData.error);
            submitBtn.innerText = "Submit to Waste Dept";
            submitBtn.disabled = false;
        }
    } catch (err) {
        console.error("Submission Error:", err);
        alert("Server not found. Make sure python app.py is running!");
        submitBtn.disabled = false;
        submitBtn.innerText = "Submit to Waste Dept";
    }
}
// File: frontend/js/citizen.js

let map, marker;
let selectedPhotoBase64 = "";

// 1. Fix Google Maps Initialization
window.initMap = function() {
    const defaultPos = { lat: 30.9010, lng: 75.8573 };
    const mapElement = document.getElementById("map");
    
    if (!mapElement) return;

    map = new google.maps.Map(mapElement, {
        zoom: 15,
        center: defaultPos,
        disableDefaultUI: true,
        zoomControl: true
    });

    marker = new google.maps.Marker({
        position: defaultPos,
        map: map,
        draggable: true
    });

    marker.addListener("dragend", () => {
        const pos = marker.getPosition();
        const coordsInput = document.getElementById('coords');
        if (coordsInput) {
            coordsInput.value = `${pos.lat().toFixed(6)}, ${pos.lng().toFixed(6)}`;
        }
    });
};

// 2. Fix Photo Upload Error
window.handlePhotoUpload = function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function() {
        selectedPhotoBase64 = reader.result;
        const preview = document.getElementById('photo-preview');
        const uploadText = document.getElementById('upload-text');
        
        if (preview && uploadText) {
            preview.src = reader.result;
            preview.style.display = 'block';
            uploadText.style.display = 'none';
        }
    };
    reader.readAsDataURL(file);
};

// 3. Fix Submit Button & Null Value Errors
window.submitComplaint = async function(e) {
    e.preventDefault();
    console.log("Submit button clicked...");

    try {
        const payload = {
            title: document.getElementById('title').value,
            category: document.getElementById('category').value,
            priority: document.getElementById('priority').value,
            description: document.getElementById('description').value,
            location: document.getElementById('coords').value || "30.9010, 75.8573",
            image: selectedPhotoBase64,
            email: localStorage.getItem('userEmail') || "test@gmail.com"
        };

        const response = await fetch('http://127.0.0.1:8000/api/complaints/citizen-submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            alert("Report Submitted Successfully!");
            window.location.href = "dashboard.html";
        } else {
            alert("Submission failed. Check backend.");
        }
    } catch (err) {
        console.error("Submission Error:", err);
        alert("Server error. Is Flask running?");
    }
};