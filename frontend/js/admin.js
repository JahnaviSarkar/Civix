// File: frontend/js/admin.js

let activeComplaintId = null;

function openVerifyModal(id, imgUrl) {
    activeComplaintId = id;
    document.getElementById('work-proof-img').src = imgUrl;
    document.getElementById('verify-modal').style.display = 'block';
}

async function closeCase(e) {
    e.preventDefault();
    const stars = document.getElementById('star-rating').value;
    const review = document.getElementById('admin-review').value;

    const response = await fetch(`${API_BASE}/verification/admin-close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            complaint_id: activeComplaintId,
            stars: parseInt(stars),
            review: review
        })
    });

    if (response.ok) {
        alert("Case Closed. Feedback sent to citizen.");
        location.reload();
    }
}