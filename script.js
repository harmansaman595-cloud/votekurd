// Firebase config is loaded from firebase-config.js

// لێرە کاتەکە دیاری بکە (ساڵ، مانگ، ڕۆژ، سەعات:خولەک:چرکە)
const deadline = new Date("March 20, 2026 05:00:00").getTime();

const timerInterval = setInterval(function () {
    const now = new Date().getTime();
    const timeLeft = deadline - now;

    // هەژمارکردنی ڕۆژ، سەعات، خولەک و چرکە
    const d = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const h = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((timeLeft % (1000 * 60)) / 1000);

    // پیشاندان لە شاشە
    document.getElementById("days").innerText = d < 10 ? "0" + d : d;
    document.getElementById("hours").innerText = h < 10 ? "0" + h : h;
    document.getElementById("minutes").innerText = m < 10 ? "0" + m : m;
    document.getElementById("seconds").innerText = s < 10 ? "0" + s : s;

    // کاتێک کات تەواو دەبێت
    if (timeLeft < 0) {
        clearInterval(timerInterval);
        document.getElementById("timer").style.display = "none";
        const status = document.getElementById("status-msg");
        status.innerHTML = "<span class='expired'>⚠️ دەنگدان کۆتایی هات!</span>";

        // لەکارخستنی هەموو بەتنەکان
        const allButtons = document.querySelectorAll("button");
        allButtons.forEach(btn => {
            btn.disabled = true;
            btn.innerText = "کاتی دەنگدان نەماوە";
            btn.style.background = "#444";
        });
    }
}, 1000);


// =============================================
// 🛡️ Device fingerprint — unique ID per browser
// =============================================
function getDeviceFingerprint() {
    const raw = [
        navigator.userAgent,
        navigator.language,
        screen.width + 'x' + screen.height,
        Intl.DateTimeFormat().resolvedOptions().timeZone
    ].join('|');

    // Simple hash
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
        hash = ((hash << 5) - hash) + raw.charCodeAt(i);
        hash |= 0;
    }
    return 'fp_' + Math.abs(hash).toString(36);
}

const _deviceId = getDeviceFingerprint();

// Check Firestore server-side if this device already voted
async function checkIfAlreadyVoted() {
    try {
        const snap = await db.collection("votes").where("deviceId", "==", _deviceId).limit(1).get();
        return !snap.empty;
    } catch (e) {
        // If Firestore rules block reading or index is missing, fall back to localStorage
        return false;
    }
}

// Live total vote counter
function listenToTotalVotes() {
    db.collection("votes").onSnapshot((snapshot) => {
        const totalVotes = snapshot.size;
        const countElement = document.getElementById("live-total-count");
        countElement.style.transform = "scale(1.2)";
        countElement.innerText = totalVotes;
        setTimeout(() => { countElement.style.transform = "scale(1)"; }, 200);
    });
}

listenToTotalVotes();

const candidates = [
    { id: 1, name: "تەمۆ", img: "tamo.jpg", quote: "لەگە ژنی قسەم دەکرد دەوی ئاوی دەکرد لەخۆشیان" },
    { id: 2, name: "ئازە بێمنەت", img: "aza_cleanup.JPG", quote: "مافی ئەوەت هەییە وەک سەگ بژی بەڵام مافی ئەوەت نییە بە ئێمە بوەڕی هەی نامەرد" },
    { id: 3, name: "هۆشمەند", img: "hoshmand.jpg", quote: "دەی دەی دەی بویمە جۆرە هۆشمەندەک هەتا ئەتوو فێڵەکم لێدەکەی ئەمن دە فێڵانت لێدەکەم" },
    { id: 4, name: "هەردی DJ", img: "hardi.jpg", quote: "هیچ لێدوانێکم نییە بۆ ئەم کاتە" }
];

const grid = document.getElementById('candidates-grid');

candidates.forEach(c => {
    const hasVoted = localStorage.getItem("votedFor");
    grid.innerHTML += `
        <div class="card">
            <img src="${c.img}" alt="${c.name}" class="c-img img-${c.id}">
            <div class="info">
                <h2>${c.name}</h2>
                <p class="quote">"${c.quote}"</p>
                <button id="btn-${c.id}" onclick="_handleVote('${c.name}', ${c.id})" 
                    ${hasVoted ? 'disabled' : ''}>
                    ${hasVoted === c.name ? 'دەنگت داوە ✅' : (hasVoted ? 'داخراوە' : 'دەنگ بدە')}
                </button>
            </div>
        </div>
    `;
});

// =============================================
// 🔒 Vote Protection — localStorage + Firestore
// =============================================

let _voteInProgress = false;
let _hasVotedSecure = !!localStorage.getItem("votedFor");

// On page load: also verify against Firestore (device fingerprint)
checkIfAlreadyVoted().then(alreadyVoted => {
    if (alreadyVoted && !_hasVotedSecure) {
        // Firestore says voted but localStorage was cleared — restore lock
        localStorage.setItem("votedFor", "__voted__");
        _hasVotedSecure = true;
        // Disable all vote buttons
        document.querySelectorAll('button[id^="btn-"]').forEach(btn => {
            btn.disabled = true;
            btn.innerText = "داخراوە";
        });
    }
});

async function _handleVote(name, id) {
    // 1. Local check
    if (_hasVotedSecure || localStorage.getItem("votedFor")) {
        alert("تۆ پێشتر دەنگت داوە!");
        return;
    }

    // 2. Firestore check (server-side) — safely falls back if it fails
    try {
        const alreadyVoted = await checkIfAlreadyVoted();
        if (alreadyVoted) {
            localStorage.setItem("votedFor", "__voted__");
            _hasVotedSecure = true;
            alert("تۆ پێشتر دەنگت داوە!");
            return;
        }
    } catch (e) { /* fall through to vote */ }

    // 3. Prevent double-click
    if (_voteInProgress) return;

    // 4. Validate candidate name
    const validNames = candidates.map(c => c.name);
    if (!validNames.includes(name)) return;

    // 5. Check voting deadline
    if (new Date().getTime() > deadline) {
        alert("ببورە، کاتی دەنگدان بەسەرچووە!");
        return;
    }

    _voteInProgress = true;

    db.collection("votes").add({
        candidate: name,
        deviceId: _deviceId,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        localStorage.setItem("votedFor", name);
        _hasVotedSecure = true;
        
        // 1. Immediately update UI (crucial for mobile responsiveness)
        document.querySelectorAll('button[id^="btn-"]').forEach(btn => {
            btn.disabled = true;
            btn.innerText = "داخراوە"; // Closed
        });
        const votedBtn = document.getElementById(`btn-${id}`);
        if(votedBtn) {
            votedBtn.innerText = 'دەنگت داوە ✅';
            votedBtn.style.backgroundColor = '#4CAF50';
        }

        // 2. Reload after a short delay so localStorage has time to persist on iOS
        setTimeout(() => {
            window.location.reload(true);
        }, 800);

    }).catch((err) => {
        _voteInProgress = false;
        alert("هەڵەیەک ڕوویدا لە کاتی دەنگدان: " + err.message);
    });
}

// =============================================
// 🛡️ Lock _handleVote so it can't be overwritten from console
// =============================================

Object.defineProperty(window, 'vote', {
    value: function () { console.warn("🚫 ڕێگەپێنەدراوە!"); },
    writable: false,
    configurable: false
});

Object.defineProperty(window, '_handleVote', {
    value: _handleVote,
    writable: false,
    configurable: false
});