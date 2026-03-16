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


// ئەم فانکشنە بانگ بکە بۆ خوێندنەوەی کۆی دەنگەکان بە شێوەی ڕاستەوخۆ
function listenToTotalVotes() {
    db.collection("votes").onSnapshot((snapshot) => {
        const totalVotes = snapshot.size; // ژمارەی هەموو دۆکیومێنتەکان وەردەگرێت
        const countElement = document.getElementById("live-total-count");

        // ئەنیمەیشنی گۆڕانی ژمارەکە (تەزوو)
        countElement.style.transform = "scale(1.2)";
        countElement.innerText = totalVotes;

        setTimeout(() => {
            countElement.style.transform = "scale(1)";
        }, 200);
    });
}

// لە کۆتایی فایلەکە یان لە دوای initialize کردنی فایەربەیس بانگی بکە
listenToTotalVotes();

const candidates = [
    { id: 1, name: "تەمۆ", img: "tamo_cleanup Cropped.jpg", quote: "لەگە ژنی قسەم دەکرد دەوی ئاوی دەکرد لەخۆشیان" },
    { id: 2, name: "ئازە بێمنەت", img: "aza_cleanup.jpg", quote: "مافی ئەوەت هەییە وەک سەگ بژی بەڵام مافی ئەوەت نییە بە ئێمە بوەڕی هەی نامەرد" },
    { id: 3, name: "هۆشمەند", img: "hosha.jpg", quote: "دەی دەی دەی بویمە جۆرە هۆشمەندەک هەتا ئەتوو فێڵەکم لێدەکەی ئەمن دە فێڵانت لێدەکەم" },
    { id: 4, name: "هەردی DJ", img: "hardi_cleanup (1).jpg", quote: "هیچ لێدوانێکم نییە بۆ ئەم کاتە" }
];

const grid = document.getElementById('candidates-grid');

candidates.forEach(c => {
    const hasVoted = localStorage.getItem("votedFor");
    grid.innerHTML += `
        <div class="card">
            <img src="${c.img}" alt="${c.name}" class="c-img img-${c.id}>
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
// 🔒 پاراستنی دەنگدان لە هاکەر (Console Protection)
// =============================================

// ئەم ڤاریبڵە تایبەتە بۆ ناوخۆ - هاکەر ناتوانێت بیگۆڕێت
let _voteInProgress = false;
let _hasVotedSecure = !!localStorage.getItem("votedFor");

// ئەم فانکشنە تەنها لە بەتنەکانەوە بانگ دەکرێت
function _handleVote(name, id) {
    // 1. پشکنینی ئایا پێشتر دەنگی داوە
    if (_hasVotedSecure) {
        alert("تۆ پێشتر دەنگت داوە!");
        return;
    }

    // 2. پشکنینی localStorage (لایەنی دووەم)
    if (localStorage.getItem("votedFor")) {
        _hasVotedSecure = true;
        alert("تۆ پێشتر دەنگت داوە!");
        return;
    }

    // 3. ڕێگری لە دووبارە ناردن
    if (_voteInProgress) {
        return;
    }

    // 4. پشکنینی ئایا ناوی کاندید دروستە
    const validNames = candidates.map(c => c.name);
    if (!validNames.includes(name)) {
        return;
    }

    // 5. پشکنینی ئایا کاتی دەنگدان تەواو نەبووە
    if (new Date().getTime() > deadline) {
        alert("ببورە، کاتی دەنگدان بەسەرچووە!");
        return;
    }

    _voteInProgress = true;

    db.collection("votes").add({
        candidate: name,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        localStorage.setItem("votedFor", name);
        _hasVotedSecure = true;
        location.reload();
    }).catch(() => {
        _voteInProgress = false;
        alert("هەڵەیەک ڕوویدا لە کاتی دەنگدان");
    });
}

// =============================================
// 🛡️ لەکارخستنی فانکشنە گەورەکان لە کۆنسۆل
// =============================================

// سڕینەوەی فانکشنی vote ی کۆنە لە window
// هاکەر ناتوانێت vote() بنووسێت لە کۆنسۆل
Object.defineProperty(window, 'vote', {
    value: function() {
        console.warn("🚫 ڕێگەپێنەدراوە! ئەم فانکشنە پاراستراوە.");
    },
    writable: false,
    configurable: false
});

// پاراستنی _handleVote لە گۆڕین
Object.defineProperty(window, '_handleVote', {
    value: _handleVote,
    writable: false,
    configurable: false
});

// پاراستنی localStorage.removeItem بۆ "votedFor"
// بۆ ڕێگری لە سڕینەوەی localStorage.removeItem("votedFor")
const _originalRemoveItem = localStorage.removeItem.bind(localStorage);
localStorage.removeItem = function(key) {
    if (key === "votedFor") {
        console.warn("🚫 ناتوانیت ئەم داتایە بسڕیتەوە!");
        return;
    }
    _originalRemoveItem(key);
};

// پاراستنی localStorage.setItem بۆ "votedFor"
// بۆ ڕێگری لە گۆڕینی بەهای votedFor
const _originalSetItem = localStorage.setItem.bind(localStorage);
localStorage.setItem = function(key, value) {
    if (key === "votedFor" && localStorage.getItem("votedFor")) {
        console.warn("🚫 ناتوانیت دەنگەکەت بگۆڕیت!");
        return;
    }
    _originalSetItem(key, value);
};

// پاراستنی localStorage.clear
const _originalClear = localStorage.clear.bind(localStorage);
localStorage.clear = function() {
    console.warn("🚫 ناتوانیت داتاکان بسڕیتەوە!");
};