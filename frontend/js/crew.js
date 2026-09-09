// File: frontend/js/crew.js

async function submitWork(complaintId) {
    const fileInput = document.getElementById('proof-upload');
    const file = fileInput ? fileInput.files[0] : null;
    
    if (!file) return alert("Please select a proof photo first!");

    const reader = new FileReader();
    reader.onload = async function(e) {
        const photoUrl = e.target.result;
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_BASE}/crew/resolve/${complaintId}`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify({
                    notes: "Work completed and area cleaned.",
                    after_image_url: photoUrl,
                    resolution_image_url: photoUrl
                })
            });

            if (response.ok) {
                alert("Work submitted for admin verification!");
                location.reload();
            } else {
                const err = await response.json();
                alert("Failed to submit work: " + (err.detail || err.error || "Server error"));
            }
        } catch (err) {
            alert("Connection error: " + err);
        }
    };
    reader.readAsDataURL(file);
}