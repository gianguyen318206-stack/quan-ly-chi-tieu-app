// ==========================================
// CẤU HÌNH FIREBASE
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyAqrz6RAM-1xM6tafM8mRIOw4mxDy-Owks",
  authDomain: "quanlychitieunhom-9d22c.firebaseapp.com",
  projectId: "quanlychitieunhom-9d22c",
  storageBucket: "quanlychitieunhom-9d22c.firebasestorage.app",
  messagingSenderId: "172592025181",
  appId: "1:172592025181:web:2d17cc7bd613aa20e947b4",
  databaseURL: "https://quanlychitieunhom-9d22c-default-rtdb.firebaseio.com"
};

// Khởi tạo Firebase
firebase.initializeApp(firebaseConfig);
let db;
try {
    db = firebase.database();
} catch (error) {
    alert("Lỗi kết nối Cơ sở dữ liệu Firebase. Vui lòng đảm bảo bạn đã tạo Realtime Database: " + error.message);
}

// ==========================================
// DOM ELEMENTS
// ==========================================
const form = document.getElementById('form');
const dateInput = document.getElementById('date');
const descInput = document.getElementById('desc');
const amountInput = document.getElementById('amount');
const payerInput = document.getElementById('payer');
const noteInput = document.getElementById('note');

const expenseTableBody = document.getElementById('expense-table-body');
const totalGroupExpenseEl = document.getElementById('total-group-expense');
const averageExpenseEl = document.getElementById('average-expense');
const settlementListEl = document.getElementById('settlement-list');
const membersSummaryContainer = document.getElementById('members-summary-container');

// Onboarding Elements
const onboardingScreen = document.getElementById('onboarding-screen');
const mainDashboard = document.getElementById('main-dashboard');
const groupNameInput = document.getElementById('group-name-input');
const membersInputList = document.getElementById('members-input-list');
const addMemberInputBtn = document.getElementById('add-member-input-btn');
const createGroupBtn = document.getElementById('create-group-btn');

const tabCreate = document.getElementById('tab-create');
const tabJoin = document.getElementById('tab-join');
const createGroupSection = document.getElementById('create-group-section');
const joinGroupSection = document.getElementById('join-group-section');
const joinCodeInput = document.getElementById('join-code-input');
const joinGroupBtn = document.getElementById('join-group-btn');

const headerGroupName = document.getElementById('header-group-name');
const headerGroupMembers = document.getElementById('header-group-members');
const displayGroupCode = document.getElementById('display-group-code');
const copyCodeBtn = document.getElementById('copy-code-btn');
const copyReportHeaderBtn = document.getElementById('copy-report-header-btn');
const copyReportSettlementBtn = document.getElementById('copy-report-settlement-btn');
const logoutBtn = document.getElementById('logout-btn');
const toastEl = document.getElementById('toast');
const toastMessageEl = document.getElementById('toast-message');

// Avatar gradients
const avatarGradients = [
    "linear-gradient(135deg, #3b82f6, #60a5fa)",
    "linear-gradient(135deg, #8b5cf6, #a78bfa)",
    "linear-gradient(135deg, #10b981, #34d399)",
    "linear-gradient(135deg, #f59e0b, #fbbf24)",
    "linear-gradient(135deg, #ef4444, #f87171)",
    "linear-gradient(135deg, #06b6d4, #22d3ee)",
    "linear-gradient(135deg, #ec4899, #f472b6)",
    "linear-gradient(135deg, #84cc16, #a3e635)"
];

dateInput.valueAsDate = new Date();

// ==========================================
// STATE & REALTIME
// ==========================================
let currentGroupId = localStorage.getItem('current_group_id') || null;
let groupData = null;
let expenses = [];

// ==========================================
// TABS LOGIC
// ==========================================
tabCreate.addEventListener('click', () => {
    tabCreate.style.background = 'var(--primary)';
    tabCreate.style.color = 'white';
    tabJoin.style.background = '#e2e8f0';
    tabJoin.style.color = 'var(--text-primary)';
    createGroupSection.style.display = 'block';
    joinGroupSection.style.display = 'none';
});

tabJoin.addEventListener('click', () => {
    tabJoin.style.background = 'var(--primary)';
    tabJoin.style.color = 'white';
    tabCreate.style.background = '#e2e8f0';
    tabCreate.style.color = 'var(--text-primary)';
    createGroupSection.style.display = 'none';
    joinGroupSection.style.display = 'block';
});

// ==========================================
// CREATE & JOIN GROUP (FIREBASE)
// ==========================================

addMemberInputBtn.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'member-name-input';
    input.placeholder = `Tên thành viên ${membersInputList.children.length + 1}`;
    input.required = true;
    input.style.marginBottom = '0.5rem';
    input.style.width = '100%';
    input.style.padding = '0.8rem 1.2rem';
    input.style.borderRadius = '12px';
    input.style.border = '2px solid #e2e8f0';
    membersInputList.appendChild(input);
});

createGroupBtn.addEventListener('click', async () => {
    const name = groupNameInput.value.trim();
    const inputs = document.querySelectorAll('.member-name-input');
    let members = [];
    
    inputs.forEach(input => {
        const val = input.value.trim();
        if (val && !members.includes(val)) members.push(val);
    });

    if (!name) return alert("Vui lòng nhập tên nhóm!");
    if (members.length < 2) return alert("Nhóm cần có ít nhất 2 thành viên!");

    // Tạo ID ngẫu nhiên 6 ký tự
    const groupId = generateID(6).toUpperCase();
    
    const newGroup = {
        name: name,
        members: members,
        createdAt: new Date().toISOString()
    };

    try {
        await db.ref('groups/' + groupId).set(newGroup);
        currentGroupId = groupId;
        localStorage.setItem('current_group_id', groupId);
        listenToGroup();
    } catch (error) {
        alert("Lỗi tạo nhóm: " + error.message);
    }
});

joinGroupBtn.addEventListener('click', async () => {
    const code = joinCodeInput.value.trim().toUpperCase();
    if (!code) return alert("Vui lòng nhập mã nhóm!");

    try {
        const snapshot = await db.ref('groups/' + code).once('value');
        if (snapshot.exists()) {
            currentGroupId = code;
            localStorage.setItem('current_group_id', code);
            listenToGroup();
        } else {
            alert("Mã nhóm không tồn tại. Vui lòng kiểm tra lại!");
        }
    } catch (error) {
        alert("Lỗi khi tham gia: " + error.message);
    }
});

logoutBtn.addEventListener('click', () => {
    if (confirm("Bạn có chắc chắn muốn thoát khỏi nhóm này? (Để vào lại bạn cần có Mã nhóm)")) {
        localStorage.removeItem('current_group_id');
        window.location.reload();
    }
});

copyCodeBtn.addEventListener('click', () => {
    copyTextToClipboard(currentGroupId, () => {
        showToast("Đã copy mã nhóm: " + currentGroupId);
    });
});

if (copyReportHeaderBtn) {
    copyReportHeaderBtn.addEventListener('click', () => handleCopyReport(copyReportHeaderBtn));
}

if (copyReportSettlementBtn) {
    copyReportSettlementBtn.addEventListener('click', () => handleCopyReport(copyReportSettlementBtn));
}

// ==========================================
// FIREBASE REALTIME LISTENER
// ==========================================
function listenToGroup() {
    if (!currentGroupId) {
        onboardingScreen.style.display = 'block';
        mainDashboard.style.display = 'none';
        return;
    }

    db.ref('groups/' + currentGroupId).on('value', (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            groupData = {
                name: data.name,
                members: data.members || []
            };
            
            // Lấy danh sách expenses từ Firebase (đang ở dạng object) chuyển thành array
            const expensesObj = data.expenses || {};
            expenses = Object.keys(expensesObj).map(key => ({
                id: key,
                ...expensesObj[key]
            }));

            initDashboardUI();
        } else {
            // Nhóm bị xóa
            alert("Nhóm này đã không còn tồn tại.");
            localStorage.removeItem('current_group_id');
            window.location.reload();
        }
    }, (error) => {
        console.error("Firebase read error:", error);
    });
}

// ==========================================
// MAIN UI LOGIC
// ==========================================

function initDashboardUI() {
    onboardingScreen.style.display = 'none';
    mainDashboard.style.display = 'block';
    
    headerGroupName.innerText = groupData.name;
    headerGroupMembers.innerText = `Thành viên: ${groupData.members.join(', ')}`;
    displayGroupCode.innerText = currentGroupId;

    // Populate payer options
    const currentPayer = payerInput.value;
    payerInput.innerHTML = '<option value="" disabled selected>-- Chọn người chi --</option>';
    groupData.members.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m;
        opt.innerText = m;
        payerInput.appendChild(opt);
    });
    if (groupData.members.includes(currentPayer)) {
        payerInput.value = currentPayer;
    }

    renderApp();
}

function getMemberColor(name) {
    if (!groupData) return avatarGradients[0];
    let index = groupData.members.indexOf(name);
    if (index === -1) index = 0;
    return avatarGradients[index % avatarGradients.length];
}

function addExpense(e) {
    e.preventDefault();

    const date = dateInput.value;
    const desc = descInput.value.trim();
    const amount = +amountInput.value;
    const payer = payerInput.value;
    const note = noteInput.value.trim();

    if (!date || !desc || !amount || !payer) {
        return alert('Vui lòng nhập đầy đủ các thông tin bắt buộc.');
    }

    const expenseId = generateID(10);
    const expense = {
        date,
        desc,
        amount,
        payer,
        note
    };

    // Đẩy lên Firebase, không cần push vào mảng local (vì Firebase sẽ tự gọi lại hàm listen)
    db.ref('groups/' + currentGroupId + '/expenses/' + expenseId).set(expense);

    // Vẫn đẩy lên Google Sheets để backup nếu muốn
    syncToGoogleSheets({ id: expenseId, ...expense });

    descInput.value = '';
    amountInput.value = '';
    payerInput.value = '';
    noteInput.value = '';
}

function removeExpense(id) {
    if (confirm('Bạn có chắc chắn muốn xóa khoản chi này?')) {
        db.ref('groups/' + currentGroupId + '/expenses/' + id).remove();
    }
}

function renderExpenses() {
    expenseTableBody.innerHTML = '';
    const sortedExpenses = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));

    sortedExpenses.forEach(expense => {
        const tr = document.createElement('tr');
        const color = getMemberColor(expense.payer);
        
        tr.innerHTML = `
            <td>${formatDate(expense.date)}</td>
            <td>${expense.desc}</td>
            <td class="td-amount">${formatMoney(expense.amount)}</td>
            <td><span class="payer-badge" style="background: ${color}">${expense.payer}</span></td>
            <td>${expense.note}</td>
            <td>
                <button class="delete-btn" onclick="removeExpense('${expense.id}')">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        `;
        expenseTableBody.appendChild(tr);
    });
}

function updateSummary() {
    if (!groupData) return;

    let total = 0;
    let spentBy = {};
    groupData.members.forEach(m => spentBy[m] = 0);

    expenses.forEach(expense => {
        total += expense.amount;
        if (spentBy[expense.payer] !== undefined) {
            spentBy[expense.payer] += expense.amount;
        } else {
            spentBy[expense.payer] = expense.amount;
        }
    });

    totalGroupExpenseEl.innerText = formatMoney(total);

    const numPeople = groupData.members.length;
    const average = numPeople > 0 ? total / numPeople : 0;
    averageExpenseEl.innerText = formatMoney(average);

    let balances = {};
    groupData.members.forEach(m => {
        balances[m] = spentBy[m] - average;
    });

    // Render Member Cards
    membersSummaryContainer.innerHTML = '';
    groupData.members.forEach(member => {
        const bal = balances[member];
        const color = getMemberColor(member);
        
        let balText, balClass;
        if (total === 0) {
            balText = 'Dư: 0 ₫'; balClass = 'balance-neutral';
        } else if (bal > 0.01) {
            balText = `Dư: +${formatMoney(bal)}`; balClass = 'balance-positive';
        } else if (bal < -0.01) {
            balText = `Nợ: -${formatMoney(Math.abs(bal))}`; balClass = 'balance-negative';
        } else {
            balText = 'Đủ tiêu chuẩn'; balClass = 'balance-neutral';
        }

        const card = document.createElement('div');
        card.className = 'card member-card glass';
        card.innerHTML = `
            <div class="avatar" style="background: ${color}">${member.charAt(0).toUpperCase()}</div>
            <div class="details">
                <h4>${member}</h4>
                <p class="money">${formatMoney(spentBy[member])}</p>
                <small class="balance-text ${balClass}">${balText}</small>
            </div>
        `;
        membersSummaryContainer.appendChild(card);
    });

    // Calculate Settlements
    let debtors = [];
    let creditors = [];

    for (const [name, bal] of Object.entries(balances)) {
        if (bal < -0.01) debtors.push({ name, amount: -bal });
        else if (bal > 0.01) creditors.push({ name, amount: bal });
    }

    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    let settlements = [];
    let i = 0, j = 0;

    while (i < debtors.length && j < creditors.length) {
        let debtor = debtors[i];
        let creditor = creditors[j];
        let settleAmount = Math.min(debtor.amount, creditor.amount);

        settlements.push({ from: debtor.name, to: creditor.name, amount: settleAmount });
        debtor.amount -= settleAmount;
        creditor.amount -= settleAmount;

        if (debtor.amount < 0.01) i++;
        if (creditor.amount < 0.01) j++;
    }

    // Render settlements
    settlementListEl.innerHTML = '';
    if (total === 0) {
        settlementListEl.innerHTML = '<li style="justify-content: center; color: var(--text-secondary);">Chưa có chi tiêu nào</li>';
    } else if (settlements.length === 0) {
        settlementListEl.innerHTML = '<li style="justify-content: center; color: var(--success-color);">Không ai nợ ai, tuyệt vời! 🎉</li>';
    } else {
        settlements.forEach(s => {
            const li = document.createElement('li');
            li.className = 'settlement-item';
            
            li.innerHTML = `
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span class="debtor" style="font-size: 1.25rem; font-weight: 800;">${s.from}</span>
                    <i class="fa-solid fa-arrow-right arrow" style="margin: 0 0.8rem; color: #94a3b8; font-size: 1.1rem;"></i>
                    <span class="creditor" style="font-size: 1.25rem; font-weight: 800; color: #8b5cf6;">${s.to}</span>
                </div>
                <div class="amount" style="font-size: 1.3rem; padding: 0.6rem 1.2rem; background: #fee2e2; color: #e11d48; border-radius: 12px; font-weight: 800;">
                    ${formatMoney(s.amount)}
                </div>
            `;
            settlementListEl.appendChild(li);
        });
    }
}

function renderApp() {
    renderExpenses();
    updateSummary();
}

function generateID(length = 9) {
    return Math.random().toString(36).substr(2, length);
}

function formatDate(dateString) {
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
}

function formatMoney(number) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(number);
}

form.addEventListener('submit', addExpense);

// ==========================================
// GOOGLE SHEETS BACKUP
// ==========================================
const GOOGLE_APP_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxk2QHdqWM6rk3aiQrMrIAn7SafX0fOdgr72kbCbco9xQwytWd0ET4dBYRXjEg2nfU1/exec';

function syncToGoogleSheets(expense) {
    if (!GOOGLE_APP_SCRIPT_URL) return;
    expense.groupName = groupData ? groupData.name : "";
    fetch(GOOGLE_APP_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expense)
    }).catch(err => console.error(err));
}

// ==========================================
// THÔNG BÁO TOAST & SAO CHÉP BÁO CÁO
// ==========================================
let toastTimer = null;
function showToast(message) {
    if (!toastEl) return;
    if (toastMessageEl) toastMessageEl.innerText = message;
    toastEl.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toastEl.classList.remove('show');
    }, 3000);
}

function copyTextToClipboard(text, successCb) {
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => {
            if (successCb) successCb();
        }).catch(() => {
            fallbackCopy(text, successCb);
        });
    } else {
        fallbackCopy(text, successCb);
    }
}

function fallbackCopy(text, successCb) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
        const successful = document.execCommand('copy');
        if (successful && successCb) successCb();
    } catch (err) {
        alert("Không thể tự động sao chép: " + err);
    }
    document.body.removeChild(textArea);
}

function generateSpendingReportText() {
    if (!groupData) return "";

    let total = 0;
    let spentBy = {};
    groupData.members.forEach(m => spentBy[m] = 0);

    expenses.forEach(expense => {
        total += expense.amount;
        if (spentBy[expense.payer] !== undefined) {
            spentBy[expense.payer] += expense.amount;
        } else {
            spentBy[expense.payer] = expense.amount;
        }
    });

    const numPeople = groupData.members.length;
    const average = numPeople > 0 ? total / numPeople : 0;

    let balances = {};
    groupData.members.forEach(m => {
        balances[m] = spentBy[m] - average;
    });

    // Tính toán phương án tất toán
    let debtors = [];
    let creditors = [];
    for (const [name, bal] of Object.entries(balances)) {
        if (bal < -0.01) debtors.push({ name, amount: -bal });
        else if (bal > 0.01) creditors.push({ name, amount: bal });
    }

    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    let settlements = [];
    let i = 0, j = 0;
    let debtorsClone = debtors.map(d => ({ ...d }));
    let creditorsClone = creditors.map(c => ({ ...c }));

    while (i < debtorsClone.length && j < creditorsClone.length) {
        let debtor = debtorsClone[i];
        let creditor = creditorsClone[j];
        let settleAmount = Math.min(debtor.amount, creditor.amount);

        settlements.push({ from: debtor.name, to: creditor.name, amount: settleAmount });
        debtor.amount -= settleAmount;
        creditor.amount -= settleAmount;

        if (debtor.amount < 0.01) i++;
        if (creditor.amount < 0.01) j++;
    }

    // Xây dựng nội dung thông báo
    let lines = [];
    lines.push(`📢 THÔNG BÁO CHI TIÊU NHÓM: ${groupData.name.toUpperCase()}`);
    if (currentGroupId) lines.push(`🔑 Mã phòng: ${currentGroupId}`);
    lines.push(`----------------------------------`);
    lines.push(`💰 Tổng chi tiêu nhóm: ${formatMoney(total)}`);
    lines.push(`⚖️ Bình quân mỗi người: ${formatMoney(average)}`);
    lines.push(``);
    lines.push(`👥 Tình trạng chi tiêu từng người:`);

    groupData.members.forEach(member => {
        const spent = spentBy[member] || 0;
        const bal = balances[member] || 0;
        let status = '';
        if (total === 0) {
            status = ' (Dư: 0 ₫)';
        } else if (bal > 0.01) {
            status = ` (Dư: +${formatMoney(bal)})`;
        } else if (bal < -0.01) {
            status = ` (Nợ: -${formatMoney(Math.abs(bal))})`;
        } else {
            status = ` (Đã hòa vốn)`;
        }
        lines.push(`• ${member} đã chi: ${formatMoney(spent)}${status}`);
    });

    lines.push(``);
    lines.push(`🤝 Phương án tất toán (ai cần chuyển cho ai):`);
    if (total === 0) {
        lines.push(`• Chưa có chi tiêu nào được ghi nhận.`);
    } else if (settlements.length === 0) {
        lines.push(`• Mọi người đã hòa tiền, không ai nợ ai! 🎉`);
    } else {
        settlements.forEach(s => {
            lines.push(`• ${s.from} ➡️ ${s.to}: ${formatMoney(s.amount)}`);
        });
    }
    lines.push(`----------------------------------`);

    return lines.join('\n');
}

function handleCopyReport(btn) {
    if (!groupData) {
        return alert("Chưa có thông tin nhóm!");
    }
    const reportText = generateSpendingReportText();
    copyTextToClipboard(reportText, () => {
        showToast("Đã copy thông báo chi tiêu vào bộ nhớ tạm!");
        if (btn) {
            const originalHTML = btn.innerHTML;
            btn.innerHTML = `<i class="fa-solid fa-check"></i> Đã chép!`;
            setTimeout(() => {
                btn.innerHTML = originalHTML;
            }, 2000);
        }
    });
}

// Khởi động
listenToGroup();
