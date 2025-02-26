// DOM Elements - Registration Section
const registerCameraBtn = document.getElementById('register-camera-btn');
const registerUploadBtn = document.getElementById('register-upload-btn');
const registerFileInput = document.getElementById('register-file-input');
const registerCameraContainer = document.getElementById('register-camera-container');
const registerVideo = document.getElementById('register-video');
const registerCaptureBtn = document.getElementById('register-capture-btn');
const registerPreviewContainer = document.getElementById('register-preview-container');
const registerPreview = document.getElementById('register-preview');
const registerRetakeBtn = document.getElementById('register-retake-btn');
const registerSubmitBtn = document.getElementById('register-submit-btn');
const registerResult = document.getElementById('register-result');

// DOM Elements - Verification Section
const verifyCameraBtn = document.getElementById('verify-camera-btn');
const verifyUploadBtn = document.getElementById('verify-upload-btn');
const verifyFileInput = document.getElementById('verify-file-input');
const verifyCameraContainer = document.getElementById('verify-camera-container');
const verifyVideo = document.getElementById('verify-video');
const verifyCaptureBtn = document.getElementById('verify-capture-btn');
const verifyPreviewContainer = document.getElementById('verify-preview-container');
const verifyPreview = document.getElementById('verify-preview');
const verifyRetakeBtn = document.getElementById('verify-retake-btn');
const verifySubmitBtn = document.getElementById('verify-submit-btn');
const verifyResult = document.getElementById('verify-result');
const scanningAnimation = document.getElementById('scanning-animation');

// Global variables
let registerStream = null;
let verifyStream = null;

// API endpoints (base URL)
const API_BASE_URL = 'http://localhost:8000';
const API_ENDPOINTS = {
    register: `${API_BASE_URL}/register/`,
    search: `${API_BASE_URL}/search/`,
    getImage: `${API_BASE_URL}/get-image/`
};

// ====== REGISTRATION SECTION ======
// Camera activation for registration
registerCameraBtn.addEventListener('click', async () => {
    try {
        registerStream = await navigator.mediaDevices.getUserMedia({ video: true });
        registerVideo.srcObject = registerStream;
        registerCameraContainer.classList.remove('hidden');
        registerPreviewContainer.classList.add('hidden');
    } catch (error) {
        showMessage(registerResult, 'Failed to access camera. Please check permissions.', 'error');
    }
});

// File upload for registration
registerUploadBtn.addEventListener('click', () => {
    registerFileInput.click();
});

registerFileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        const file = e.target.files[0];
        const reader = new FileReader();
        
        reader.onload = (event) => {
            registerPreview.src = event.target.result;
            registerPreviewContainer.classList.remove('hidden');
            registerCameraContainer.classList.add('hidden');
            
            // Stop camera if it's running
            stopRegisterStream();
        };
        
        reader.readAsDataURL(file);
    }
});

// Capture image from camera for registration
registerCaptureBtn.addEventListener('click', () => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = registerVideo.videoWidth;
    canvas.height = registerVideo.videoHeight;
    context.drawImage(registerVideo, 0, 0, canvas.width, canvas.height);
    
    registerPreview.src = canvas.toDataURL('image/jpeg');
    registerPreviewContainer.classList.remove('hidden');
    registerCameraContainer.classList.add('hidden');
});

// Retake image for registration
registerRetakeBtn.addEventListener('click', () => {
    if (registerStream) {
        registerPreviewContainer.classList.add('hidden');
        registerCameraContainer.classList.remove('hidden');
    } else {
        registerPreviewContainer.classList.add('hidden');
        registerCameraContainer.classList.add('hidden');
    }
    registerResult.classList.add('hidden');
});

// Submit registration
registerSubmitBtn.addEventListener('click', async () => {
    try {
        registerResult.innerHTML = `
            <div class="flex items-center justify-center">
                <div class="spinner mr-3"></div>
                <span>Registering face...</span>
            </div>
        `;
        registerResult.classList.remove('hidden', 'status-success', 'status-error');
        registerResult.classList.add('status-info');
        
        // Convert base64 image to blob
        const response = await fetch(registerPreview.src);
        const blob = await response.blob();
        
        // Create form data with unique filename
        const formData = new FormData();
        const timestamp = new Date().getTime();
        formData.append('image', blob, `face_${timestamp}.jpg`);
        
        // Send to server
        const result = await fetch(API_ENDPOINTS.register, {
            method: 'POST',
            body: formData
        });
        
        const data = await result.json();
        
        if (result.ok) {
            showMessage(registerResult, 'Registration successful! Your face has been added to the system.', 'success');
        } else {
            showMessage(registerResult, `Registration failed: ${data.detail}`, 'error');
        }
    } catch (error) {
        showMessage(registerResult, 'Error during registration. Please try again.', 'error');
        console.error(error);
    }
});

// ====== VERIFICATION SECTION ======
// Camera activation for verification
verifyCameraBtn.addEventListener('click', async () => {
    try {
        verifyStream = await navigator.mediaDevices.getUserMedia({ video: true });
        verifyVideo.srcObject = verifyStream;
        verifyCameraContainer.classList.remove('hidden');
        verifyPreviewContainer.classList.add('hidden');
    } catch (error) {
        showMessage(verifyResult, 'Failed to access camera. Please check permissions.', 'error');
    }
});

// File upload for verification
verifyUploadBtn.addEventListener('click', () => {
    verifyFileInput.click();
});

verifyFileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        const file = e.target.files[0];
        const reader = new FileReader();
        
        reader.onload = (event) => {
            verifyPreview.src = event.target.result;
            verifyPreviewContainer.classList.remove('hidden');
            verifyCameraContainer.classList.add('hidden');
            
            // Stop camera if it's running
            stopVerifyStream();
        };
        
        reader.readAsDataURL(file);
    }
});

// Capture image from camera for verification
verifyCaptureBtn.addEventListener('click', () => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = verifyVideo.videoWidth;
    canvas.height = verifyVideo.videoHeight;
    context.drawImage(verifyVideo, 0, 0, canvas.width, canvas.height);
    
    verifyPreview.src = canvas.toDataURL('image/jpeg');
    verifyPreviewContainer.classList.remove('hidden');
    verifyCameraContainer.classList.add('hidden');
});

// Retake image for verification
verifyRetakeBtn.addEventListener('click', () => {
    if (verifyStream) {
        verifyPreviewContainer.classList.add('hidden');
        verifyCameraContainer.classList.remove('hidden');
    } else {
        verifyPreviewContainer.classList.add('hidden');
        verifyCameraContainer.classList.add('hidden');
    }
    verifyResult.classList.add('hidden');
});

// Submit verification
verifySubmitBtn.addEventListener('click', async () => {
    try {
        // Show scanning animation for 3 seconds
        scanningAnimation.classList.remove('hidden');
        
        verifyResult.innerHTML = `
            <div class="flex items-center justify-center">
                <div class="spinner mr-3"></div>
                <span>Verifying face...</span>
            </div>
        `;
        verifyResult.classList.remove('hidden', 'status-success', 'status-error', 'status-warning');
        verifyResult.classList.add('status-info');
        
        // Convert base64 image to blob
        const response = await fetch(verifyPreview.src);
        const blob = await response.blob();
        
        // Create form data with unique filename
        const formData = new FormData();
        const timestamp = new Date().getTime();
        formData.append('image', blob, `verify_${timestamp}.jpg`);
        
        // Wait for animation (3 seconds)
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Send to server
        const result = await fetch(API_ENDPOINTS.search, {
            method: 'POST',
            body: formData
        });
        
        scanningAnimation.classList.add('hidden');
        
        if (result.ok) {
            const data = await result.json();
            console.log("Verification response:", data);
            
            if (data.message === "User found") {
                // Extract the filename from the URL path
                const imagePath = data.registered_image_url;
                const imageFilename = imagePath.split('/').pop();
                const imageUrl = `${API_ENDPOINTS.getImage}${imageFilename}`;
                
                // Display the matched image and score
                const matchScore = Math.round(data.match_score * 100);
                const matchColor = matchScore > 90 ? 'text-green-600' : 
                                 matchScore > 80 ? 'text-yellow-600' : 'text-red-600';
                
                verifyResult.innerHTML = `
                    <div class="text-center">
                        <div class="text-lg font-semibold mb-2 text-green-600">Identity Verified ✓</div>
                        <div class="flex items-center justify-center gap-4 mb-4">
                            <div class="w-1/2">
                                <div class="text-sm text-gray-600 mb-1">Your Image</div>
                                <img src="${verifyPreview.src}" class="h-32 w-full object-cover rounded-lg border-2 border-gray-300" alt="Your Face">
                            </div>
                            <div class="w-1/2">
                                <div class="text-sm text-gray-600 mb-1">Registered Image</div>
                                <img src="${imageUrl}" class="h-32 w-full object-cover rounded-lg border-2 border-gray-300" alt="Registered Face">
                            </div>
                        </div>
                        <div class="text-md">Match Score: <span class="${matchColor} font-bold">${matchScore}%</span></div>
                    </div>
                `;
                verifyResult.classList.remove('status-info', 'status-error', 'status-warning');
                verifyResult.classList.add('status-success');
            } else {
                showMessage(verifyResult, `Verification failed: No matching face found.`, 'warning');
            }
        } else {
            const errorData = await result.json();
            showMessage(verifyResult, `Verification error: ${errorData.detail || 'Unknown error'}`, 'error');
        }
    } catch (error) {
        scanningAnimation.classList.add('hidden');
        showMessage(verifyResult, `Error during verification. Please try again. (${error.message})`, 'error');
        console.error("Verification error:", error);
    }
});

// ====== UTILITY FUNCTIONS ======
// Stop camera stream for registration
function stopRegisterStream() {
    if (registerStream) {
        registerStream.getTracks().forEach(track => track.stop());
        registerStream = null;
    }
}

// Stop camera stream for verification
function stopVerifyStream() {
    if (verifyStream) {
        verifyStream.getTracks().forEach(track => track.stop());
        verifyStream = null;
    }
}

// Display message with status
function showMessage(element, message, status) {
    element.innerHTML = message;
    element.classList.remove('hidden', 'status-success', 'status-error', 'status-warning', 'status-info');
    element.classList.add(`status-${status}`);
}

// Clean up when leaving the page
window.addEventListener('beforeunload', () => {
    stopRegisterStream();
    stopVerifyStream();
});