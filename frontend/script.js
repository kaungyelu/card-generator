// ------------------------------------------------------------
//  CONFIG
// ------------------------------------------------------------
const API_URL = "http://118.27.151.238:5000";  // မင်း VPS IP ထည့်

// DOM Elements
const secretKeyInput = document.getElementById('secretKey');
const fetchBtn = document.getElementById('fetchCustomersBtn');
const customerSection = document.getElementById('customerSection');
const customerList = document.getElementById('customerList');
const generateSection = document.getElementById('generateSection');
const cardCountInput = document.getElementById('cardCount');
const generateBtn = document.getElementById('generateBtn');
const cardOutput = document.getElementById('cardOutput');
const copyAllBtn = document.getElementById('copyAllBtn');
const statusDiv = document.getElementById('status');

let selectedCustomer = null;  // { brand, last4, exp_month, exp_year, cvv }

// ------------------------------------------------------------
//  Helper: Show Status
// ------------------------------------------------------------
function showStatus(msg, type = 'error') {
    statusDiv.textContent = msg;
    statusDiv.className = type;
    statusDiv.style.display = 'block';
}

function hideStatus() {
    statusDiv.style.display = 'none';
}

// ------------------------------------------------------------
//  1. FETCH CUSTOMERS
// ------------------------------------------------------------
fetchBtn.addEventListener('click', async () => {
    const key = secretKeyInput.value.trim();
    if (!key) {
        showStatus('❌ Please enter your Stripe Secret Key.', 'error');
        return;
    }

    hideStatus();
    fetchBtn.disabled = true;
    fetchBtn.textContent = '⏳ Fetching...';

    try {
        const response = await fetch(`${API_URL}/api/customers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ secret_key: key })
        });

        const data = await response.json();

        if (response.ok) {
            renderCustomers(data);
            customerSection.style.display = 'block';
            generateSection.style.display = 'none';
            showStatus(`✅ ${data.length} customers loaded.`, 'success');
        } else {
            showStatus(`❌ Error: ${data.error || 'Unknown error'}`, 'error');
        }
    } catch (err) {
        showStatus(`❌ Network error: ${err.message}`, 'error');
    } finally {
        fetchBtn.disabled = false;
        fetchBtn.textContent = '📋 Fetch Customers';
    }
});

// ------------------------------------------------------------
//  Render Customer List
// ------------------------------------------------------------
function renderCustomers(customers) {
    customerList.innerHTML = '';
    customers.forEach((cust, index) => {
        const div = document.createElement('div');
        div.className = 'customer-item';

        const info = document.createElement('div');
        info.className = 'info';
        info.innerHTML = `
            <span><strong>${cust.brand}</strong> •••• ${cust.last4}</span>
            <span>Exp: ${cust.exp_month}/${cust.exp_year}</span>
            <span>CVV: ${cust.cvv}</span>
        `;

        const badge = document.createElement('span');
        badge.className = 'badge';
        badge.textContent = `#${index + 1}`;

        div.appendChild(info);
        div.appendChild(badge);

        // Click → Select this customer
        div.addEventListener('click', () => {
            selectedCustomer = {
                brand: cust.brand,
                last4: cust.last4,
                exp_month: cust.exp_month,
                exp_year: cust.exp_year,
                cvv: cust.cvv
            };
            // Highlight selected
            document.querySelectorAll('.customer-item').forEach(el => el.style.borderColor = '#253040');
            div.style.borderColor = '#6b8cff';
            generateSection.style.display = 'block';
            cardOutput.textContent = 'Select a customer and click Generate.';
            copyAllBtn.style.display = 'none';
            showStatus(`✅ Selected: ${cust.brand} •••• ${cust.last4}`, 'success');
        });

        customerList.appendChild(div);
    });
}

// ------------------------------------------------------------
//  2. GENERATE CARDS
// ------------------------------------------------------------
generateBtn.addEventListener('click', async () => {
    if (!selectedCustomer) {
        showStatus('❌ Please select a customer first.', 'error');
        return;
    }

    const count = parseInt(cardCountInput.value) || 10;
    if (count < 1 || count > 500) {
        showStatus('❌ Card count must be between 1 and 500.', 'error');
        return;
    }

    hideStatus();
    generateBtn.disabled = true;
    generateBtn.textContent = '⏳ Generating...';

    try {
        const payload = {
            ...selectedCustomer,
            count: count
        };

        const response = await fetch(`${API_URL}/api/generate-cards`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok) {
            const cards = data.cards || [];
            cardOutput.textContent = cards.join('\n');
            copyAllBtn.style.display = 'block';
            showStatus(`✅ ${cards.length} cards generated.`, 'success');
        } else {
            showStatus(`❌ Error: ${data.error || 'Unknown error'}`, 'error');
        }
    } catch (err) {
        showStatus(`❌ Network error: ${err.message}`, 'error');
    } finally {
        generateBtn.disabled = false;
        generateBtn.textContent = '⚡ Generate Cards';
    }
});

// ------------------------------------------------------------
//  3. COPY ALL
// ------------------------------------------------------------
copyAllBtn.addEventListener('click', () => {
    const text = cardOutput.textContent;
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
        copyAllBtn.textContent = '✅ Copied!';
        setTimeout(() => copyAllBtn.textContent = '📋 Copy All', 2000);
    }).catch(() => alert('⚠️ Copy not allowed.'));
});

// ------------------------------------------------------------
//  Auto-hide status after 5 seconds
// ------------------------------------------------------------
setInterval(() => {
    if (statusDiv.style.display === 'block') {
        setTimeout(() => { statusDiv.style.display = 'none'; }, 5000);
    }
}, 5000);
