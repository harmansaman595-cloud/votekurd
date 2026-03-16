// لە admin.js دا ئەمە دابنێ:
if (!sessionStorage.getItem("isAdmin")) window.location.href = "login.html";

db.collection("votes").onSnapshot(snapshot => {
    const results = {};
    let total = snapshot.size;

    snapshot.forEach(doc => {
        const name = doc.data().candidate;
        results[name] = (results[name] || 0) + 1;
    });

    // ڕیزکردن بەپێی دەنگ
    const sorted = Object.entries(results).sort((a, b) => b[1] - a[1]);

    const adminContainer = document.getElementById('admin-results');
    adminContainer.innerHTML = `<h2>کۆی گشتی دەنگەکان: ${total}</h2>`;

    sorted.forEach(([name, count]) => {
        const percent = ((count / total) * 100).toFixed(1);
        adminContainer.innerHTML += `
            <div style="margin-bottom:20px;">
                <div style="display:flex; justify-content:space-between;">
                    <span>${name}</span> <span>${count} دەنگ (${percent}%)</span>
                </div>
                <div class="bar-container"><div class="bar-fill" style="width:${percent}%"></div></div>
            </div>
        `;
    });
});