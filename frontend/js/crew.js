// File: frontend/js/crew.js

async function submitWork(complaintId) {
    const fileInput = document.getElementById('proof-upload');
    const file = fileInput.files[0];
    
    if (!file) return alert("Please select a photo first!");

    // 1. In a real app, upload to Firebase Storage here to get a URL
    // For now, we simulate a URL
    const simulatedUrl = "https://firebasestorage.googleapis.com/v0/b/demo/work_done.jpg";

    const response = await fetch(`${API_BASE}/verification/crew-upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            complaint_id: complaintId,
            after_img_url: simulatedUrl
        })
    });

    if (response.ok) {
        alert("Work submitted for admin verification!");
        location.reload();
    }
}