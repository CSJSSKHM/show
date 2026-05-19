// display.js
// ⚠️ 請填入你從 Apps Script 複製下來的網頁應用程式網址
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbx19dq64h2dVG1xTga-Q4qjZWAxLrc6I8_VyGlmHrlLDbaWsDeS43ektZ23MzsoIZVd/exec';

const ITEMS_PER_PAGE = 7;
const SECONDS_PER_PAGE = 8;

let allRankedPlayers = [];
let currentPage = 0;
let isFirstLoad = true;

async function fetchData() {
    try {
        const response = await fetch(WEB_APP_URL);
        const json = await response.json();
        
        if (json.status !== 'success') throw new Error('API 讀取錯誤');
        processData(json.data);
    } catch (err) {
        const errorEl = document.getElementById('error-msg');
        errorEl.innerText = '🚨 網路連線異常，將於稍後重試。';
        errorEl.style.display = 'block';
    }
}

function processData(rawData) {
    document.getElementById('error-msg').style.display = 'none';

    // 處理與計算數據
    let players = rawData.map(p => {
        let winRate = p.matches > 0 ? (p.wins / p.matches * 100).toFixed(1) : 0;
        return { ...p, winRate: parseFloat(winRate) };
    });

    // 排序：勝率優先，淨勝分次之
    players.sort((a, b) => b.winRate - a.winRate || b.netScore - a.netScore);

    allRankedPlayers = players.filter(p => p.matches >= 3);
    const pending = players.filter(p => p.matches < 3 && p.matches > 0);

    // 繪製待定區
    let pendingHTML = pending.map(p => {
        return `<span style="background:#112240; padding:3px 8px; border-radius:5px; margin:3px; display:inline-block; border:1px solid #233554;">
                ${p.class}(${p.no}) <span style="color:#8892b0;">[欠${3 - p.matches}場]</span></span>`;
    }).join(' ');
    document.getElementById('pendingList').innerHTML = pendingHTML || '<span style="color:#8892b0;">目前無待定選手</span>';

    const now = new Date();
    document.getElementById('status').innerText = `🟢 衛星數據同步中... (${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')})`;

    if (isFirstLoad) {
        renderCurrentPage();
        startPaginationTimer();
        isFirstLoad = false;
    }
}

function renderCurrentPage() {
    const tbody = document.getElementById('rankingBody');
    
    if (allRankedPlayers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="color:#8892b0;">目前尚未有選手完成 3 場賽事</td></tr>';
        document.getElementById('pageText').innerText = '頁面 0 / 0';
        return;
    }

    const totalPages = Math.ceil(allRankedPlayers.length / ITEMS_PER_PAGE);
    if (currentPage >= totalPages) currentPage = 0;

    const startIdx = currentPage * ITEMS_PER_PAGE;
    const endIdx = startIdx + ITEMS_PER_PAGE;
    const pageData = allRankedPlayers.slice(startIdx, endIdx);

    let html = '';
    pageData.forEach((p, i) => {
        const actualRank = startIdx + i + 1;
        const delay = i * 0.1;
        
        html += `<tr class="flip-row ${actualRank === 1 ? 'rank-1' : ''}" style="animation-delay: ${delay}s">
            <td>${actualRank === 1 ? '👑 1' : actualRank}</td>
            <td>${p.class}</td>
            <td>${p.no}</td>
            <td class="win-rate">${p.winRate}%</td>
            <td>${p.netScore > 0 ? '+' + p.netScore : p.netScore}</td>
            <td>${p.matches}</td>
        </tr>`;
    });

    tbody.innerHTML = html;
    document.getElementById('pageText').innerText = `分頁 ${currentPage + 1} / ${totalPages}`;
    
    currentPage++;
    if (currentPage >= totalPages) currentPage = 0; 
}

function startPaginationTimer() {
    const progressEl = document.getElementById('progressBar');
    let timeLeft = SECONDS_PER_PAGE * 10; 

    setInterval(() => {
        timeLeft--;
        const percentage = ((SECONDS_PER_PAGE * 10 - timeLeft) / (SECONDS_PER_PAGE * 10)) * 100;
        progressEl.style.width = percentage + '%';

        if (timeLeft <= 0) {
            renderCurrentPage();
            timeLeft = SECONDS_PER_PAGE * 10;
            progressEl.style.transition = 'none';
            progressEl.style.width = '0%';
            setTimeout(() => progressEl.style.transition = 'width 0.1s linear', 50);
        }
    }, 100); 
}

// 啟動與循環抓取
fetchData();
setInterval(fetchData, 10000);