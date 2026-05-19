const API_URL = 'https://script.google.com/macros/s/AKfycbx19dq64h2dVG1xTga-Q4qjZWAxLrc6I8_VyGlmHrlLDbaWsDeS43ektZ23MzsoIZVd/exec'; // ⚠️ 記得貼上你的 API 網址

// 頁面載入時，自動生成班別和學號的下拉選項
window.onload = () => {
    const classes = ['1A','1B','1C','2A','2B','2C','3A','3B','3C','4A','4B','5A','5B','5C'];
    const classOptions = '<option value="">請選擇班別</option>' + classes.map(c => `<option value="${c}">${c}</option>`).join('');
    
    let numOptions = '<option value="">請選擇學號</option>';
    for(let i=1; i<=40; i++) numOptions += `<option value="${i}">${i}</option>`;

    document.getElementById('p1_c').innerHTML = classOptions;
    document.getElementById('p2_c').innerHTML = classOptions;
    document.getElementById('p1_n').innerHTML = numOptions;
    document.getElementById('p2_n').innerHTML = numOptions;
};

function check() {
    if (document.getElementById('pw').value === '123') {
        document.getElementById('loginBox').style.display = 'none';
        document.getElementById('formBox').style.display = 'block';
    } else {
        alert("密碼錯誤");
    }
}

// 獲取單選按鈕的值
function getRadioValue(name) {
    const ele = document.querySelector(`input[name="${name}"]:checked`);
    return ele ? ele.value : '';
}

async function send() {
    const p1_score_str = getRadioValue('p1_s');
    const p2_score_str = getRadioValue('p2_s');

    // 獲取所有輸入值
    const data = {
        p1_class: document.getElementById('p1_c').value,
        p1_no: document.getElementById('p1_n').value,
        p1_score: p1_score_str,
        p2_class: document.getElementById('p2_c').value,
        p2_no: document.getElementById('p2_n').value,
        p2_score: p2_score_str
    };

    // 1. 驗證是否全部填寫
    if (Object.values(data).some(val => val === '')) {
        alert('請選擇所有選手的班別、學號與得分！');
        return;
    }

    // ⭐ 2. 嚴格防呆邏輯：防止自己打自己
    if (data.p1_class === data.p2_class && data.p1_no === data.p2_no) {
        alert("🚨 錯誤：選手一和選手二不能是同一位學生！");
        return;
    }

    const p1_s = parseInt(p1_score_str);
    const p2_s = parseInt(p2_score_str);

    // 3. 嚴格防呆邏輯：驗證 4 分規則
    if (p1_s === 4 && p2_s === 4) {
        alert("🚨 錯誤：不可能雙方都獲得 4 分！");
        return;
    }
    if (p1_s !== 4 && p2_s !== 4) {
        alert("🚨 錯誤：必須有一方獲得 4 分才能分出勝負！");
        return;
    }

    // 自動判斷勝方 (拿到 4 分的就是 1 號或 2 號)
    const autoWinner = p1_s === 4 ? 1 : 2;

    const btn = document.getElementById('sendBtn');
    const msg = document.getElementById('msg');

    // 組合參數送出
    const params = new URLSearchParams({
        action: 'submit_match',
        ...data,
        winner: autoWinner
    });

    btn.disabled = true;
    msg.style.color = '#8892b0';
    msg.innerText = "⏳ 數據傳送中...";
    
    try {
        const response = await fetch(`${API_URL}?${params.toString()}`);
        const json = await response.json();
        
        if (json.status === 'success') {
            msg.style.color = '#64ffda';
            msg.innerText = "✅ 戰果已成功記錄！";
            
            // 清空下拉與得分，方便下一局
            document.getElementById('p1_c').value = '';
            document.getElementById('p2_c').value = '';
            document.getElementById('p1_n').value = '';
            document.getElementById('p2_n').value = '';
            
            // 取消選中單選按鈕
            document.querySelectorAll('input[type="radio"]').forEach(radio => radio.checked = false);
        } else {
            throw new Error('伺服器錯誤');
        }
    } catch (e) { 
        msg.style.color = '#ff6b6b';
        msg.innerText = "❌ 傳送失敗，請重試。"; 
    } finally {
        btn.disabled = false;
    }
}