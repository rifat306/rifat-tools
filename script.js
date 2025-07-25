// গ্লোবাল ভেরিয়েবলস
let mediaRecorder;
let recordedChunks = [];
let audioRecorder;
let audioChunks = [];
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];

// লোডিং স্ক্রিন হাইড
window.addEventListener('load', () => {
    setTimeout(() => {
        const loadingScreen = document.getElementById('loadingScreen');
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 500);
    }, 1500);
});

// নেভিগেশন মেনু টগল
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

hamburger.addEventListener('click', () => {
    navMenu.classList.toggle('active');
});

// স্মুথ স্ক্রোল
function scrollToTools() {
    document.getElementById('tools').scrollIntoView({ 
        behavior: 'smooth' 
    });
}

// নেভিগেশন লিংকে স্মুথ স্ক্রোল যোগ করা
document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelectorAll('.nav-menu a');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({ 
                    behavior: 'smooth' 
                });
            }
        });
    });
    
    displayFavorites();
});

// টুল মডাল ম্যানেজমেন্ট
function openTool(toolName) {
    const modal = document.getElementById('toolModal');
    const content = document.getElementById('toolContent');
    
    content.innerHTML = getToolHTML(toolName);
    modal.style.display = 'block';
    
    // টুল স্পেসিফিক ইনিশিয়ালাইজেশন
    initializeTool(toolName);
}

function closeModal() {
    const modal = document.getElementById('toolModal');
    modal.style.display = 'none';
    
    // স্টপ রেকর্ডিং যদি চলছে
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
    }
    if (audioRecorder && audioRecorder.state !== 'inactive') {
        audioRecorder.stop();
    }
}

// মডাল বাইরে ক্লিক করলে বন্ধ
window.addEventListener('click', (e) => {
    const modal = document.getElementById('toolModal');
    if (e.target === modal) {
        closeModal();
    }
});

// টুল HTML জেনারেটর
function getToolHTML(toolName) {
    const tools = {
        'screen-recorder': `
            <div class="tool-interface">
                <h3>স্ক্রিন রেকর্ডার</h3>
                <div class="recording-controls">
                    <button class="record-btn" onclick="startScreenRecording()">
                        <i class="fas fa-record-vinyl"></i>
                    </button>
                    <button class="stop-btn" onclick="stopRecording()" disabled>
                        <i class="fas fa-stop"></i>
                    </button>
                </div>
                <video id="screenPreview" style="width: 100%; margin-top: 1rem; display: none;" controls></video>
                <a id="downloadLink" style="display: none;" download="screen-recording.webm">
                    <button>ডাউনলোড করুন</button>
                </a>
            </div>
        `,
        'live-favorite': `
            <div class="tool-interface">
                <h3>লাইভ ফেভারি</h3>
                <p>আপনার প্রিয় মুহূর্তগুলো এখানে সেভ করুন</p>
                <input type="text" placeholder="মুহূর্তের নাম লিখুন..." id="favoriteName">
                <button onclick="saveFavorite()">সেভ করুন</button>
                <div id="favoritesList" style="margin-top: 20px;">
                    ${getFavoritesList()}
                </div>
            </div>
        `,
        'web-recording': `
            <div class="tool-interface">
                <h3>ওয়েব রেকর্ডিং</h3>
                <p>আপনার ক্যামেরা দিয়ে ভিডিও রেকর্ড করুন</p>
                <div class="recording-controls">
                    <button class="record-btn" onclick="startWebRecording()">
                        <i class="fas fa-video"></i>
                    </button>
                    <button class="stop-btn" onclick="stopWebRecording()" disabled>
                        <i class="fas fa-stop"></i>
                    </button>
                </div>
                <video id="webPreview" style="width: 100%; margin-top: 1rem; display: none;" autoplay muted></video>
                <video id="webRecording" style="width: 100%; margin-top: 1rem; display: none;" controls></video>
                <a id="webDownloadLink" style="display: none;" download="web-recording.webm">
                    <button>ডাউনলোড করুন</button>
                </a>
            </div>
        `,
        'audio-recording': `
            <div class="tool-interface">
                <h3>অডিও রেকর্ডার</h3>
                <p>আপনার কণ্ঠ রেকর্ড করুন</p>
                <div class="recording-controls">
                    <button class="record-btn" onclick="startAudioRecording()">
                        <i class="fas fa-microphone"></i>
                    </button>
                    <button class="stop-btn" onclick="stopAudioRecording()" disabled>
                        <i class="fas fa-stop"></i>
                    </button>
                </div>
                <audio id="audioPreview" style="width: 100%; margin-top: 1rem; display: none;" controls></audio>
                <a id="audioDownloadLink" style="display: none;" download="audio-recording.webm">
                    <button>ডাউনলোড করুন</button>
                </a>
            </div>
        `,
        'text-to-speech': `
            <div class="tool-interface">
                <h3>টেক্সট টু ভয়েস</h3>
                <textarea id="textInput" placeholder="এখানে আপনার টেক্সট লিখুন..." rows="4" style="width: 100%; margin: 10px 0;"></textarea>
                <select id="voiceSelect" style="width: 100%; margin: 10px 0;">
                    <option value="">ভয়েস সিলেক্ট করুন</option>
                </select>
                <button onclick="speakText()">শুনুন</button>
                <button onclick="stopSpeech()">থামুন</button>
            </div>
        `,
        'image-compressor': `
            <div class="tool-interface">
                <h3>ইমেজ কম্প্রেসর</h3>
                <input type="file" id="imageInput" accept="image/*" onchange="compressImage(event)">
                <div id="imagePreview" class="preview"></div>
                <a id="compressedDownload" style="display: none;" download="compressed-image.jpg">
                    <button>কম্প্রেসড ইমেজ ডাউনলোড করুন</button>
                </a>
            </div>
        `,
        'qr-generator': `
            <div class="tool-interface">
                <h3>QR কোড জেনারেটর</h3>
                <input type="text" id="qrText" placeholder="QR কোডের জন্য টেক্সট লিখুন...">
                <button onclick="generateQR()">জেনারেট করুন</button>
                <div id="qrCode" class="preview"></div>
                <a id="qrDownload" style="display: none;" download="qr-code.png">
                    <button>QR কোড ডাউনলোড করুন</button>
                </a>
            </div>
        `,
        'password-generator': `
            <div class="tool-interface">
                <h3>পাসওয়ার্ড জেনারেটর</h3>
                <div style="text-align: left; margin: 20px 0;">
                    <label><input type="checkbox" id="includeUppercase" checked> বড় হাতের অক্ষর</label><br>
                    <label><input type="checkbox" id="includeLowercase" checked> ছোট হাতের অক্ষর</label><br>
                    <label><input type="checkbox" id="includeNumbers" checked> সংখ্যা</label><br>
                    <label><input type="checkbox" id="includeSymbols" checked> প্রতীক</label><br>
                    <label>দৈর্ঘ্য: <input type="number" id="passwordLength" value="12" min="4" max="32"></label>
                </div>
                <input type="text" id="generatedPassword" readonly style="width: 100%; padding: 10px; margin: 10px 0;">
                <button onclick="generatePassword()">জেনারেট করুন</button>
                <button onclick="copyPassword()">কপি করুন</button>
            </div>
        `,
        'calculator': `
            <div class="tool-interface">
                <h3>ক্যালকুলেটর</h3>
                <input type="text" id="calculatorDisplay" readonly style="width: 100%; padding: 15px; font-size: 1.5rem; text-align: right; margin-bottom: 10px;">
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 5px;">
                    <button onclick="addToCalc('7')">7</button>
                    <button onclick="addToCalc('8')">8</button>
                    <button onclick="addToCalc('9')">9</button>
                    <button onclick="addToCalc('/')">/</button>
                    <button onclick="addToCalc('4')">4</button>
                    <button onclick="addToCalc('5')">5</button>
                    <button onclick="addToCalc('6')">6</button>
                    <button onclick="addToCalc('*')">*</button>
                    <button onclick="addToCalc('1')">1</button>
                    <button onclick="addToCalc('2')">2</button>
                    <button onclick="addToCalc('3')">3</button>
                    <button onclick="addToCalc('-')">-</button>
                    <button onclick="addToCalc('0')">0</button>
                    <button onclick="addToCalc('.')">.</button>
                    <button onclick="calculate()">=</button>
                    <button onclick="addToCalc('+')">+</button>
                    <button onclick="clearCalc()">C</button>
                </div>
            </div>
        `
    };
    
    return tools[toolName] || '<p>টুল পাওয়া যায়নি</p>';
}

// টুল ইনিশিয়ালাইজেশন
function initializeTool(toolName) {
    switch(toolName) {
        case 'text-to-speech':
            loadVoices();
            break;
        case 'live-favorite':
            displayFavorites();
            break;
    }
}

// স্ক্রিন রেকর্ডিং ফাংশন
async function startScreenRecording() {
    try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: true
        });
        
        recordedChunks = [];
        mediaRecorder = new MediaRecorder(stream);
        
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };
        
        mediaRecorder.onstop = () => {
            const blob = new Blob(recordedChunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            
            const preview = document.getElementById('screenPreview');
            const downloadLink = document.getElementById('downloadLink');
            
            preview.src = url;
            preview.style.display = 'block';
            downloadLink.href = url;
            downloadLink.style.display = 'inline-block';
            
            stream.getTracks().forEach(track => track.stop());
        };
        
        mediaRecorder.start();
        
        document.querySelector('.record-btn').disabled = true;
        document.querySelector('.stop-btn').disabled = false;
        
    } catch (error) {
        alert('স্ক্রিন রেকর্ডিং শুরু করা যায়নি: ' + error.message);
    }
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        document.querySelector('.record-btn').disabled = false;
        document.querySelector('.stop-btn').disabled = true;
    }
}

// ওয়েব রেকর্ডিং ফাংশন
async function startWebRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        });
        
        const preview = document.getElementById('webPreview');
        preview.srcObject = stream;
        preview.style.display = 'block';
        
        recordedChunks = [];
        mediaRecorder = new MediaRecorder(stream);
        
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };
        
        mediaRecorder.onstop = () => {
            const blob = new Blob(recordedChunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            
            const recording = document.getElementById('webRecording');
            recording.src = url;
            recording.style.display = 'block';
            
            const downloadLink = document.getElementById('webDownloadLink');
            downloadLink.href = url;
            downloadLink.style.display = 'inline-block';
            
            stream.getTracks().forEach(track => track.stop());
        };
        
        mediaRecorder.start();
        
        document.querySelector('.record-btn').disabled = true;
        document.querySelector('.stop-btn').disabled = false;
        
    } catch (error) {
        alert('ওয়েব রেকর্ডিং শুরু করা যায়নি: ' + error.message);
    }
}

function stopWebRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        document.querySelector('.record-btn').disabled = false;
        document.querySelector('.stop-btn').disabled = true;
    }
}

// অডিও রেকর্ডিং ফাংশন
async function startAudioRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: true
        });
        
        audioChunks = [];
        audioRecorder = new MediaRecorder(stream);
        
        audioRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunks.push(event.data);
            }
        };
        
        audioRecorder.onstop = () => {
            const blob = new Blob(audioChunks, { type: 'audio/webm' });
            const url = URL.createObjectURL(blob);
            
            const preview = document.getElementById('audioPreview');
            preview.src = url;
            preview.style.display = 'block';
            
            const downloadLink = document.getElementById('audioDownloadLink');
            downloadLink.href = url;
            downloadLink.style.display = 'inline-block';
            
            stream.getTracks().forEach(track => track.stop());
        };
        
        audioRecorder.start();
        
        document.querySelector('.record-btn').disabled = true;
        document.querySelector('.stop-btn').disabled = false;
        
    } catch (error) {
        alert('অডিও রেকর্ডিং শুরু করা যায়নি: ' + error.message);
    }
}

function stopAudioRecording() {
    if (audioRecorder && audioRecorder.state !== 'inactive') {
        audioRecorder.stop();
        document.querySelector('.record-btn').disabled = false;
        document.querySelector('.stop-btn').disabled = true;
    }
}

// টেক্সট টু স্পিচ ফাংশন
function loadVoices() {
    const voices = speechSynthesis.getVoices();
    const voiceSelect = document.getElementById('voiceSelect');
    
    voiceSelect.innerHTML = '<option value="">ভয়েস সিলেক্ট করুন</option>';
    
    voices.forEach((voice, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = `${voice.name} (${voice.lang})`;
        voiceSelect.appendChild(option);
    });
}

function speakText() {
    const text = document.getElementById('textInput').value;
    const voiceSelect = document.getElementById('voiceSelect');
    const voices = speechSynthesis.getVoices();
    
    if (!text) {
        alert('দয়া করে কিছু টেক্সট লিখুন');
        return;
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    if (voiceSelect.value !== '') {
        utterance.voice = voices[voiceSelect.value];
    }
    
    speechSynthesis.speak(utterance);
}

function stopSpeech() {
    speechSynthesis.cancel();
}

// ইমেজ কম্প্রেসর ফাংশন
function compressImage(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // সাইজ রেডিউস
            const maxWidth = 800;
            const maxHeight = 600;
            let { width, height } = img;
            
            if (width > height) {
                if (width > maxWidth) {
                    height *= maxWidth / width;
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width *= maxHeight / height;
                    height = maxHeight;
                }
            }
            
            canvas.width = width;
            canvas.height = height;
            
            ctx.drawImage(img, 0, 0, width, height);
            
            // কম্প্রেসড ইমেজ
            canvas.toBlob(function(blob) {
                const url = URL.createObjectURL(blob);
                const preview = document.getElementById('imagePreview');
                const download = document.getElementById('compressedDownload');
                
                preview.innerHTML = `<img src="${url}" style="max-width: 100%; border-radius: 5px;">`;
                download.href = url;
                download.style.display = 'inline-block';
            }, 'image/jpeg', 0.7);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// QR কোড জেনারেটর ফাংশন
function generateQR() {
    const text = document.getElementById('qrText').value;
    if (!text) {
        alert('দয়া করে টেক্সট লিখুন');
        return;
    }
    
    const qrCode = document.getElementById('qrCode');
    const download = document.getElementById('qrDownload');
    
    // QR কোড জেনারেট করুন
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(text)}`;
    
    qrCode.innerHTML = `<img src="${qrUrl}" alt="QR Code">`;
    download.href = qrUrl;
    download.style.display = 'inline-block';
}

// পাসওয়ার্ড জেনারেটর ফাংশন
function generatePassword() {
    const length = document.getElementById('passwordLength').value;
    const includeUppercase = document.getElementById('includeUppercase').checked;
    const includeLowercase = document.getElementById('includeLowercase').checked;
    const includeNumbers = document.getElementById('includeNumbers').checked;
    const includeSymbols = document.getElementById('includeSymbols').checked;
    
    let charset = '';
    if (includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (includeNumbers) charset += '0123456789';
    if (includeSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    let password = '';
    for (let i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    document.getElementById('generatedPassword').value = password;
}

function copyPassword() {
    const password = document.getElementById('generatedPassword');
    password.select();
    document.execCommand('copy');
    alert('পাসওয়ার্ড কপি করা হয়েছে!');
}

// ক্যালকুলেটর ফাংশন
let calculatorValue = '';

function addToCalc(value) {
    calculatorValue += value;
    document.getElementById('calculatorDisplay').value = calculatorValue;
}

function clearCalc() {
    calculatorValue = '';
    document.getElementById('calculatorDisplay').value = '';
}

function calculate() {
    try {
        calculatorValue = eval(calculatorValue).toString();
        document.getElementById('calculatorDisplay').value = calculatorValue;
    } catch (error) {
        alert('ভুল এক্সপ্রেশন');
        clearCalc();
    }
}

// লাইভ ফেভারি ফাংশন
function saveFavorite() {
    const name = document.getElementById('favoriteName').value;
    if (!name) {
        alert('দয়া করে নাম লিখুন');
        return;
    }
    
    const favorite = {
        id: Date.now(),
        name: name,
        date: new Date().toLocaleString('bn-BD')
    };
    
    favorites.push(favorite);
    localStorage.setItem('favorites', JSON.stringify(favorites));
    
    document.getElementById('favoriteName').value = '';
    displayFavorites();
}

function displayFavorites() {
    const list = document.getElementById('favoritesList');
    if (!list) return;
    
    if (favorites.length === 0) {
        list.innerHTML = '<p>কোন ফেভারি নেই</p>';
        return;
    }
    
    list.innerHTML = favorites.map(fav => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; border: 1px solid #ddd; margin: 5px 0; border-radius: 5px;">
            <span>${fav.name} - ${fav.date}</span>
            <button onclick="deleteFavorite(${fav.id})" style="background: #f44336; color: white; border: none; padding: 5px 10px; border-radius: 3px;">ডিলিট</button>
        </div>
    `).join('');
}

function deleteFavorite(id) {
    favorites = favorites.filter(fav => fav.id !== id);
    localStorage.setItem('favorites', JSON.stringify(favorites));
    displayFavorites();
}

function getFavoritesList() {
    if (favorites.length === 0) return '<p>কোন ফেভারি নেই</p>';
    
    return favorites.map(fav => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; border: 1px solid #ddd; margin: 5px 0; border-radius: 5px;">
            <span>${fav.name} - ${fav.date}</span>
            <button onclick="deleteFavorite(${fav.id})" style="background: #f44336; color: white; border: none; padding: 5px 10px; border-radius: 3px;">ডিলিট</button>
        </div>
    `).join('');
}

// ভয়েস লোড
if (typeof speechSynthesis !== 'undefined') {
    speechSynthesis.addEventListener('voiceschanged', loadVoices);
}