/* ========================================
   Delivery Pets - JavaScript
   ======================================== */

// ========================================
// Data Structures
// ========================================

let deliveries = [];
let clients = [];
let stores = STORE_CONFIG.getStoreIds();
let currentDeliveryId = null;
let selectedClientId = null;

// Validity data structure
let validityData = {
    categories: []  // { id, name, products: [{ id, name, variations: [{ id, name, dates: [{ id, date, quantity }] }] }] }
};

// ========================================
// LocalStorage Functions
// ========================================

function loadData() {
    // Clear old localStorage store cache and use config.js instead
    clearOldStoreCache();
    
    const savedDeliveries = localStorage.getItem('deliveryPets_deliveries');
    const savedClients = localStorage.getItem('deliveryPets_clients');
    const lastDate = localStorage.getItem('deliveryPets_lastDate');
    const savedValidity = localStorage.getItem('deliveryPets_validity');

    // Check if it's a new day and clear deliveries
    const today = new Date().toDateString();
    if (lastDate !== today) {
        // New day - clear deliveries but keep clients
        deliveries = [];
        localStorage.setItem('deliveryPets_deliveries', JSON.stringify(deliveries));
        localStorage.setItem('deliveryPets_lastDate', today);
    }

    if (savedDeliveries) {
        deliveries = JSON.parse(savedDeliveries);
    }

    if (savedClients) {
        clients = JSON.parse(savedClients);
    }

    if (savedValidity) {
        validityData = JSON.parse(savedValidity);
    }

    populateStoreDropdown();
}

function saveData() {
    localStorage.setItem('deliveryPets_deliveries', JSON.stringify(deliveries));
    localStorage.setItem('deliveryPets_clients', JSON.stringify(clients));
}

function saveReplenishment() {
    const getActive = (id) => {
        const el = document.getElementById(id);
        return el ? el.classList.contains('active') : false;
    };
    
    const replenishment = {
        store: document.getElementById('store-select').value,
        racaoCachorroAtivo: getActive('racaoCachorroAtivo'),
        racaoCachorro: document.getElementById('racaoCachorro').value,
        racaoGatoAtivo: getActive('racaoGatoAtivo'),
        racaoGato: document.getElementById('racaoGato').value,
        areiaAtivo: getActive('areiaAtivo'),
        areia: document.getElementById('areia').value,
        passarinhoAtivo: getActive('passarinhoAtivo'),
        passarinho: document.getElementById('passarinho').value,
        avulsaAtivo: getActive('avulsaAtivo'),
        avulsa: document.getElementById('avulsa').value,
        sacheAtivo: getActive('sacheAtivo'),
        sache: document.getElementById('sache').value,
        remedioAtivo: getActive('remedioAtivo'),
        remedio: document.getElementById('remedio').value,
        shampooAtivo: getActive('shampooAtivo'),
        shampoo: document.getElementById('shampoo').value,
        canaletadoAtivo: getActive('canaletadoAtivo'),
        canaletado: document.getElementById('canaletado').value,
        sacoFechadoAtivo: getActive('sacoFechadoAtivo'),
        saco15kg: document.getElementById('saco15kg').value,
        saco10kg: document.getElementById('saco10kg').value,
        produtosLojaAtivo: getActive('produtosLojaAtivo'),
        produtosLoja: document.getElementById('produtosLoja').value
    };

    localStorage.setItem('deliveryPets_replenishment', JSON.stringify(replenishment));
}

// ========================================
// Navigation
// ========================================

function navigateTo(screen) {
    const navBtns = document.querySelectorAll('.nav-btn');
    const fab = document.querySelector('.fab');
    
    // Update nav buttons
    navBtns.forEach(b => {
        b.classList.remove('active');
        if (b.dataset.screen === screen) {
            b.classList.add('active');
        }
    });
    
    // Show/hide screens
    document.querySelectorAll('.screen').forEach(s => {
        s.classList.remove('active');
    });
    
    // Show/hide FAB (only on deliveries screen)
    if (fab) {
        fab.style.display = screen === 'deliveries' ? 'flex' : 'none';
    }
    
    if (screen === 'deliveries') {
        document.getElementById('deliveries-screen').classList.add('active');
        renderDeliveries();
    } else if (screen === 'replenishment') {
        document.getElementById('replenishment-screen').classList.add('active');
    } else if (screen === 'home') {
        document.getElementById('home-screen').classList.add('active');
    } else if (screen === 'validity') {
        document.getElementById('validity-screen').classList.add('active');
        renderValidityList();
    }
}

function initNavigation() {
    const navBtns = document.querySelectorAll('.nav-btn');
    
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const screen = btn.dataset.screen;
            navigateTo(screen);
        });
    });
}

function showDeliveriesList() {
    navigateTo('deliveries');
    renderDeliveries();
}

function showNewDeliveryForm() {
    // Reset form
    document.getElementById('delivery-form').reset();
    currentDeliveryId = null;
    selectedClientId = null;
    orderItems = [];
    
    // Reset loja unica
    document.getElementById('loja-unica').checked = false;
    document.getElementById('loja-unica-section').classList.add('hidden');
    
    // Clear client dropdown
    document.getElementById('client-dropdown').classList.add('hidden');
    
    // Clear order items
    document.getElementById('order-items-container').innerHTML = '';
    
    // Reset payment options
    togglePaymentOptions();
    
    // Show form
    document.getElementById('deliveries-screen').classList.remove('active');
    document.getElementById('new-delivery-screen').classList.add('active');
    
    // Update message preview
    updateMessagePreview();
    
    // Focus on client search
    setTimeout(() => {
        document.getElementById('client-search').focus();
    }, 100);
}

function editDelivery(deliveryId) {
    const delivery = deliveries.find(d => d.id === deliveryId);
    if (!delivery) return;
    
    // Set current delivery ID for updating
    currentDeliveryId = deliveryId;
    selectedClientId = delivery.clienteId || null;
    
    // Fill client fields
    document.getElementById('client-search').value = delivery.nome || '';
    document.getElementById('client-name').value = delivery.nome || '';
    document.getElementById('client-phone').value = delivery.telefone || '';
    document.getElementById('client-address').value = delivery.endereco || '';
    document.getElementById('client-reference').value = delivery.referencia || '';
    
    // Fill order description
    document.getElementById('order-description').value = delivery.pedido || '';
    
    // Load order items with store selections
    if (delivery.itensPedido && delivery.itensPedido.length > 0) {
        orderItems = [...delivery.itensPedido];
    } else {
        // Parse from plain text if no structured items
        orderItems = [];
        if (delivery.pedido) {
            const lines = delivery.pedido.split('\n');
            let currentOrder = 1;
            lines.forEach(line => {
                const trimmed = line.trim();
                if (trimmed) {
                    const match = trimmed.match(/^(\d+)[.)\-:]\s*(.+)/);
                    if (match) {
                        orderItems.push({
                            order: parseInt(match[1]),
                            text: match[2].trim(),
                            store: ''
                        });
                        currentOrder = parseInt(match[1]) + 1;
                    } else {
                        orderItems.push({
                            order: currentOrder,
                            text: trimmed,
                            store: ''
                        });
                        currentOrder++;
                    }
                }
            });
        }
    }
    
    // Render order items with store selections
    renderOrderItemsForEditing();
    
    // Handle loja unica
    const hasStore = orderItems.some(item => item.store);
    if (delivery.retirada && !hasStore) {
        document.getElementById('loja-unica').checked = true;
        document.getElementById('loja-unica-section').classList.remove('hidden');
        document.getElementById('pickup-location').value = delivery.retirada || '';
    } else {
        document.getElementById('loja-unica').checked = false;
        document.getElementById('loja-unica-section').classList.add('hidden');
    }
    
    // Fill payment fields
    document.getElementById('total-value').value = delivery.valor || '';
    document.getElementById('payment-method').value = delivery.pagamento || 'PIX';
    document.getElementById('already-paid').checked = delivery.pagarNaEntrega || false;
    document.getElementById('needs-change').checked = delivery.precisaTroco || false;
    document.getElementById('change-value').value = delivery.valorTroco || '';
    
    // Fill schedule fields
    document.getElementById('delivery-time').value = delivery.horario || '';
    document.getElementById('deliver-tomorrow').checked = delivery.entregarAmanha || false;
    
    // Fill notes
    document.getElementById('notes').value = delivery.observacoes || '';
    
    // Update payment options visibility
    togglePaymentOptions();
    toggleChangeField();
    
    // Show form
    document.getElementById('deliveries-screen').classList.remove('active');
    document.getElementById('new-delivery-screen').classList.add('active');
    
    // Update message preview
    updateMessagePreview();
}

function renderOrderItemsForEditing() {
    const container = document.getElementById('order-items-container');
    const lojaUnica = document.getElementById('loja-unica').checked;
    const pickupLocation = document.getElementById('pickup-location').value;
    
    if (lojaUnica) {
        // Single store for all items
        container.innerHTML = orderItems.map((item, index) => `
            <div class="order-item">
                <span class="order-item-number">${item.order || index + 1}.</span>
                <input type="text" class="order-item-input" value="${item.text}" 
                       oninput="updateItemText(${index}, this.value)" placeholder="Descrição">
                <span class="order-item-store">${pickupLocation || 'Sem loja'}</span>
            </div>
        `).join('');
    } else {
        // Each item has its own store dropdown
        const storeNames = STORE_CONFIG.getStoreNamesObject();
        container.innerHTML = orderItems.map((item, index) => `
            <div class="order-item">
                <span class="order-item-number">${index + 1}.</span>
                <input type="text" class="order-item-input" value="${item.text}" 
                       oninput="updateItemText(${index}, this.value)" placeholder="Descrição">
                <select class="item-store-select" data-index="${index}" onchange="updateItemStore(${index}, this.value)">
                    <option value="">Loja...</option>
                    ${stores.map(store => `<option value="${store}" ${item.store === store ? 'selected' : ''}>${storeNames[store] || store}</option>`).join('')}
                </select>
            </div>
        `).join('');
    }
}

// ========================================
// Client Functions
// ========================================

function searchClients(query) {
    const dropdown = document.getElementById('client-dropdown');
    
    if (!query || query.length < 1) {
        dropdown.classList.add('hidden');
        return;
    }
    
    const results = clients.filter(client => 
        client.nome.toLowerCase().includes(query.toLowerCase()) ||
        client.telefone.includes(query)
    );
    
    if (results.length === 0) {
        dropdown.classList.add('hidden');
        return;
    }
    
    dropdown.innerHTML = results.map(client => `
        <div class="dropdown-item" onclick="selectClient('${client.id}')">
            <div class="client-name">${client.nome}</div>
            <div class="client-phone">${client.telefone}</div>
        </div>
    `).join('');
    
    dropdown.classList.remove('hidden');
}

function selectClient(clientId) {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;
    
    selectedClientId = clientId;
    document.getElementById('client-search').value = client.nome;
    document.getElementById('client-name').value = client.nome;
    document.getElementById('client-phone').value = client.telefone;
    document.getElementById('client-address').value = client.endereco || '';
    document.getElementById('client-reference').value = client.pontoReferencia || '';
    
    document.getElementById('client-dropdown').classList.add('hidden');
    
    updateMessagePreview();
}

function showClientDropdown() {
    const dropdown = document.getElementById('client-dropdown');
    
    // Always search when focused - shows all or filtered results
    const query = document.getElementById('client-search').value;
    
    if (!query) {
        // Show all clients
        if (clients.length === 0) {
            dropdown.innerHTML = '<div class="dropdown-item">Nenhum cliente cadastrado</div>';
        } else {
            dropdown.innerHTML = clients.map(client => `
                <div class="dropdown-item" onclick="selectClient('${client.id}')">
                    <div class="client-name">${client.nome}</div>
                    <div class="client-phone">${client.telefone || ''}</div>
                </div>
            `).join('');
        }
        dropdown.classList.remove('hidden');
    } else {
        searchClients(query);
    }
}

// ========================================
// Phone Formatting
// ========================================

function formatPhone(input) {
    let value = input.value.replace(/\D/g, '');
    
    if (value.length > 0) {
        value = '(' + value;
    }
    if (value.length > 3) {
        value = value.substring(0, 3) + ')' + value.substring(3);
    }
    if (value.length > 9) {
        value = value.substring(0, 10) + '-' + value.substring(10);
    }
    
    input.value = value.substring(0, 15);
    
    // Update preview
    updateMessagePreview();
}

// ========================================
// Currency Formatting
// ========================================

function formatCurrency(input) {
    let value = input.value.replace(/\D/g, '');
    
    if (value.length > 0) {
        value = (parseInt(value) / 100).toFixed(2);
        value = value.replace('.', ',');
    }
    
    input.value = value;
    
    // Update preview
    updateMessagePreview();
}

function parseCurrency(value) {
    if (!value) return 0;
    return parseFloat(value.replace(',', '.')) || 0;
}

// ========================================
// Time Formatting
// ========================================

function formatTime(input) {
    let value = input.value.replace(/\D/g, '');
    
    if (value.length > 2) {
        value = value.substring(0, 2) + ':' + value.substring(2);
    }
    
    input.value = value.substring(0, 5);
    
    // Update preview
    updateMessagePreview();
}

// ========================================
// Order Item Parser
// ========================================

function toggleLojaUnica() {
    const lojaUnica = document.getElementById('loja-unica').checked;
    const lojaUnicaSection = document.getElementById('loja-unica-section');
    const container = document.getElementById('order-items-container');
    
    if (lojaUnica) {
        lojaUnicaSection.classList.remove('hidden');
    } else {
        lojaUnicaSection.classList.add('hidden');
    }
    
    parseOrderItems();
}

function parseOrderItems() {
    const description = document.getElementById('order-description').value;
    const container = document.getElementById('order-items-container');
    const lojaUnica = document.getElementById('loja-unica').checked;
    const pickupLocation = document.getElementById('pickup-location').value;
    
    // Parse items - each line is a new item
    const lines = description.split('\n');
    let currentOrder = 1;
    
    // Rebuild orderItems array while preserving existing store selections
    const newOrderItems = [];
    
    lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed) {
            // Each line is a new item
            // Check if line starts with a number
            const match = trimmed.match(/^(\d+)[.)\-:]\s*(.+)/);
            let itemText;
            let itemOrder;
            
            if (match) {
                itemOrder = parseInt(match[1]);
                itemText = match[2].trim();
                currentOrder = itemOrder + 1;
            } else {
                // New item with automatic numbering
                itemOrder = currentOrder;
                itemText = trimmed;
                currentOrder++;
            }
            
            // Preserve existing store selection if available
            const existingItem = newOrderItems[newOrderItems.length - 1];
            const preservedStore = existingItem ? existingItem.store : '';
            
            newOrderItems.push({
                order: itemOrder,
                text: itemText,
                store: preservedStore
            });
        }
    });
    
    // Update the global orderItems while preserving stores for existing indices
    orderItems = newOrderItems;
    
    // Always show each item with store selection (when not using Loja Única)
    // Each line = new item with automatic numbering
    if (lojaUnica) {
        // Single store for all items
        container.innerHTML = orderItems.map((item, index) => `
            <div class="order-item">
                <span class="order-item-number">${item.order}.</span>
                <span class="order-item-text">${item.text.replace(/\n/g, '<br>')}</span>
                <span class="order-item-store">${pickupLocation || 'Sem loja'}</span>
            </div>
        `).join('');
    } else {
        // Each item has its own store dropdown - independent selection per item
        const storeNames = STORE_CONFIG.getStoreNamesObject();
        container.innerHTML = orderItems.map((item, index) => `
            <div class="order-item">
                <span class="order-item-number">${index + 1}.</span>
                <input type="text" class="order-item-input" value="${item.text}" 
                       oninput="updateItemText(${index}, this.value)" placeholder="Descrição">
                <select class="item-store-select" data-index="${index}" onchange="updateItemStore(${index}, this.value)">
                    <option value="">Loja...</option>
                    ${stores.map(store => `<option value="${store}" ${item.store === store ? 'selected' : ''}>${storeNames[store] || store}</option>`).join('')}
                </select>
            </div>
        `).join('');
    }
    
    updateMessagePreview();
}

// Store selected items
let orderItems = [];

function updateItemStore(index, store) {
    if (!orderItems[index]) {
        orderItems[index] = { store: store };
    } else {
        orderItems[index].store = store;
    }
    updateMessagePreview();
}

function updateItemText(index, text) {
    if (orderItems[index]) {
        orderItems[index].text = text;
    }
    updateMessagePreview();
}

// ========================================
// Store Dropdown
// ========================================

function populateStoreDropdown() {
    const select = document.getElementById('pickup-location');
    const storeNames = STORE_CONFIG.getStoreNamesObject();
    select.innerHTML = '<option value="">Selecione...</option>' +
        stores.map(store => `<option value="${store}">${storeNames[store] || store}</option>`).join('');
}

// ========================================
// Payment Options
// ========================================

function togglePaymentOptions() {
    const paymentMethod = document.getElementById('payment-method').value;
    const changeOptions = document.getElementById('change-options');
    const needsChange = document.getElementById('needs-change');
    const changeValueGroup = document.getElementById('change-value-group');
    const alreadyPaid = document.getElementById('already-paid').checked;
    
    // Show change options only for Dinheiro when paying on delivery
    if (paymentMethod === 'Dinheiro' && alreadyPaid) {
        changeOptions.classList.remove('hidden');
    } else {
        changeOptions.classList.add('hidden');
        needsChange.checked = false;
        changeValueGroup.classList.add('hidden');
    }
    
    updateMessagePreview();
}

function toggleChangeField() {
    const needsChange = document.getElementById('needs-change');
    const changeValueGroup = document.getElementById('change-value-group');
    
    if (needsChange.checked) {
        changeValueGroup.classList.remove('hidden');
    } else {
        changeValueGroup.classList.add('hidden');
    }
    
    updateMessagePreview();
}

function validateChange() {
    const totalValue = parseCurrency(document.getElementById('total-value').value);
    const changeValue = parseCurrency(document.getElementById('change-value').value);
    const needsChange = document.getElementById('needs-change').checked;
    const errorMessage = document.getElementById('change-error');
    const changeInput = document.getElementById('change-value');
    
    if (needsChange && changeValue > 0 && changeValue <= totalValue) {
        errorMessage.classList.remove('hidden');
        changeInput.style.borderColor = 'var(--accent-red)';
        return false;
    } else {
        errorMessage.classList.add('hidden');
        changeInput.style.borderColor = '';
        return true;
    }
}

// ========================================
// Message Generation
// ========================================

function generateDeliveryMessage() {
    const name = document.getElementById('client-name').value;
    const phone = document.getElementById('client-phone').value;
    const noPhone = document.getElementById('no-phone').checked;
    const address = document.getElementById('client-address').value;
    const reference = document.getElementById('client-reference').value;
    const description = document.getElementById('order-description').value;
    const pickupLocation = document.getElementById('pickup-location').value;
    const totalValue = document.getElementById('total-value').value;
    const paymentMethod = document.getElementById('payment-method').value;
    const alreadyPaid = document.getElementById('already-paid').checked;
    const needsChange = document.getElementById('needs-change').checked;
    const changeValue = document.getElementById('change-value').value;
    const deliveryTime = document.getElementById('delivery-time').value;
    const deliverTomorrow = document.getElementById('deliver-tomorrow').checked;
    const notes = document.getElementById('notes').value;
    
    let message = '';
    
    // Client info
    message += `👤 Cliente: ${name || '[nome]'}\n`;
    message += `📞 Telefone: ${noPhone ? 'Sem telefone' : (phone || '[telefone]')}\n`;
    
    // Order
    const lojaUnica = document.getElementById('loja-unica').checked;
    message += '\n📦 Pedido:\n';
    if (description) {
        const lines = description.split('\n');
        let itemIndex = 0;
        lines.forEach((line) => {
            if (line.trim()) {
                let store = '';
                if (lojaUnica) {
                    store = pickupLocation ? ` (${pickupLocation})` : '';
                } else if (orderItems[itemIndex] && orderItems[itemIndex].store) {
                    store = ` (${orderItems[itemIndex].store})`;
                }
                message += `${itemIndex + 1}. ${line.trim()}${store}\n`;
                itemIndex++;
            }
        });
    } else {
        message += '[itens do pedido]\n';
    }
    
    // Pickup location (only show if Loja Única is enabled)
    if (lojaUnica && pickupLocation) {
        message += `\n📍 Retirada: ${pickupLocation}\n`;
    }
    
    // Payment
    message += `\n💰 Valor: R$ ${totalValue || '0,00'}\n`;
    message += `💳 Pagamento: ${paymentMethod}\n`;
    
    if (paymentMethod === 'Dinheiro' && alreadyPaid && needsChange) {
        message += `💵 Troco para: R$ ${changeValue || '0,00'}\n`;
    }
    
    // Address
    message += `\n🏠 Endereço: ${address || '[endereço]'}\n`;
    message += `📍 Referência: ${reference || '[referência]'}\n`;
    
    // Schedule
    let schedule = '';
    if (deliveryTime) {
        schedule = deliveryTime;
    }
    if (deliverTomorrow) {
        schedule += schedule ? ' - ' : '';
        schedule += 'Entregar amanhã';
    }
    message += `\n⏰ Horário: ${schedule || '[horário]'}\n`;
    
    // Notes
    if (notes) {
        message += `\n📝 Observações: ${notes}\n`;
    }
    
    return message;
}

function updateMessagePreview() {
    const preview = document.getElementById('message-preview');
    const message = generateDeliveryMessage();
    preview.textContent = message;
}

function getCurrentDeliveryMessage() {
    return generateDeliveryMessage();
}

// ========================================
// Save Delivery
// ========================================

function saveDelivery(event) {
    event.preventDefault();
    
    // Validate change if needed
    if (!validateChange()) {
        showToast('O troco deve ser maior que o valor total', 'error');
        return;
    }
    
    const name = document.getElementById('client-name').value;
    const phone = document.getElementById('client-phone').value;
    const noPhone = document.getElementById('no-phone').checked;
    const address = document.getElementById('client-address').value;
    const reference = document.getElementById('client-reference').value;
    const description = document.getElementById('order-description').value;
    const pickupLocation = document.getElementById('pickup-location').value;
    const totalValue = document.getElementById('total-value').value;
    const paymentMethod = document.getElementById('payment-method').value;
    const alreadyPaid = document.getElementById('already-paid').checked;
    const needsChange = document.getElementById('needs-change').checked;
    const changeValue = document.getElementById('change-value').value;
    const deliveryTime = document.getElementById('delivery-time').value;
    const deliverTomorrow = document.getElementById('deliver-tomorrow').checked;
    const notes = document.getElementById('notes').value;
    const saveClient = document.getElementById('save-client').checked;
    
    // Save client if needed
    if (saveClient && !selectedClientId) {
        // Check if client already exists with same name and phone
        const existingClient = clients.find(c => 
            c.nome.toLowerCase() === name.toLowerCase() && 
            c.telefone === phone
        );
        
        if (existingClient) {
            showToast('⚠️ CLIENTE JÁ CADASTRADO: ' + existingClient.nome, 'error');
            return;
        }
        
        const newClient = {
            id: generateId(),
            nome: name,
            telefone: noPhone ? '' : phone,
            endereco: address,
            pontoReferencia: reference,
            dataCadastro: new Date().toISOString()
        };
        clients.push(newClient);
        selectedClientId = newClient.id;
    }
    
    // Create delivery object
    const delivery = {
        id: currentDeliveryId || generateId(),
        clienteId: selectedClientId,
        nome: name,
        telefone: noPhone ? '' : phone,
        pedido: description,
        itensPedido: orderItems, // Save the structured order items with store info
        retirada: pickupLocation,
        valor: totalValue,
        pagamento: paymentMethod,
        pagarNaEntrega: alreadyPaid,
        precisaTroco: needsChange,
        valorTroco: changeValue,
        endereco: address,
        referencia: reference,
        horario: deliveryTime,
        entregarAmanha: deliverTomorrow,
        observacoes: notes,
        data: new Date().toISOString()
    };
    
    // Update or add delivery
    if (currentDeliveryId) {
        const index = deliveries.findIndex(d => d.id === currentDeliveryId);
        if (index !== -1) {
            deliveries[index] = delivery;
        }
    } else {
        deliveries.push(delivery);
    }
    
    // Save to localStorage
    saveData();
    
    // Show success message
    showToast('Entrega salva com sucesso!', 'success');
    
    // Return to list
    showDeliveriesList();
}

// ========================================
// Render Deliveries
// ========================================

function renderDeliveries() {
    const container = document.getElementById('deliveries-list');
    const emptyState = document.getElementById('empty-state');
    
    // Sort by date (most recent first)
    const sortedDeliveries = [...deliveries].sort((a, b) => 
        new Date(b.data) - new Date(a.data)
    );
    
    if (sortedDeliveries.length === 0) {
        container.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }
    
    emptyState.classList.add('hidden');
    
    // Calculate totals by payment method
    let totalDinheiro = 0;
    let totalCartao = 0;
    let totalPix = 0;
    
    sortedDeliveries.forEach(d => {
        const valor = parseCurrency(d.valor) || 0;
        if (d.pagamento === 'Dinheiro') {
            totalDinheiro += valor;
        } else if (d.pagamento === 'Cartão') {
            totalCartao += valor;
        } else if (d.pagamento === 'PIX') {
            totalPix += valor;
        }
    });
    
    const totalGeral = totalDinheiro + totalCartao + totalPix;
    
    const totalsHTML = `
        <div class="totals-section">
            <div class="totals-title">💰 TOTAL VENDIDO HOJE</div>
            <div class="totals-grid">
                <div class="total-item">
                    <span class="total-label">💵 Dinheiro</span>
                    <span class="total-value">R$ ${totalDinheiro.toFixed(2).replace('.', ',')}</span>
                </div>
                <div class="total-item">
                    <span class="total-label">💳 Cartão</span>
                    <span class="total-value">R$ ${totalCartao.toFixed(2).replace('.', ',')}</span>
                </div>
                <div class="total-item">
                    <span class="total-label">📱 Pix</span>
                    <span class="total-value">R$ ${totalPix.toFixed(2).replace('.', ',')}</span>
                </div>
                <div class="total-item total-geral">
                    <span class="total-label">🤑 TOTAL</span>
                    <span class="total-value">R$ ${totalGeral.toFixed(2).replace('.', ',')}</span>
                </div>
            </div>
        </div>
    `;
    
    container.innerHTML = sortedDeliveries.map(delivery => {
        let schedule = delivery.horario || '';
        if (delivery.entregarAmanha) {
            schedule += schedule ? ' - ' : '';
            schedule += 'Amanhã';
        }
        
        return `
            <div class="delivery-card" onclick="showDeliveryMessage('${delivery.id}')">
                <div class="card-header">
                    <span class="card-client">${delivery.nome}</span>
                    <span class="card-value">R$ ${delivery.valor}</span>
                </div>
                <div class="card-address">
                    📍 ${delivery.endereco}
                </div>
                ${renderDeliveryItems(delivery)}
                <div class="card-time">
                    ⏰ ${schedule || 'Sem horário'}
                </div>
                <div class="card-actions" onclick="event.stopPropagation()">
                    <button class="card-action-btn edit" onclick="editDelivery('${delivery.id}')">
                        ✏️ Editar
                    </button>
                    <button class="card-action-btn" onclick="copyDeliveryMessage('${delivery.id}')">
                        📋 Copiar
                    </button>
                    <button class="card-action-btn" onclick="shareDeliveryWhatsApp('${delivery.id}')">
                        📱 WhatsApp
                    </button>
                    <button class="card-action-btn delete" onclick="confirmDeleteDelivery('${delivery.id}')">
                        🗑️
                    </button>
                </div>
            </div>
        `;
    }).join('') + totalsHTML;
}

// ========================================
// Render Delivery Items for Card
// ========================================

function renderDeliveryItems(delivery) {
    // Try to use structured items first, then fallback to plain text
    const itens = delivery.itensPedido;
    const pedido = delivery.pedido;
    
    if (itens && itens.length > 0) {
        // Use structured items with store info
        return `<div class="card-items">` + 
            itens.map((item, index) => 
                `<div class="card-item">` +
                    `<span class="card-item-number">${index + 1}.</span>` +
                    `<span class="card-item-text">${item.text}</span>` +
                    `${item.store ? `<span class="card-item-store">${item.store}</span>` : ''}` +
                `</div>`
            ).join('') + 
            `</div>`;
    } else if (pedido) {
        // Fallback: parse plain text
        const lines = pedido.split('\n').filter(line => line.trim());
        if (lines.length > 0) {
            return `<div class="card-items">` + 
                lines.map((line, index) => {
                    // Remove existing numbering if present
                    const cleanLine = line.replace(/^\d+[.)\-:]\s*/, '');
                    return `<div class="card-item">` +
                        `<span class="card-item-number">${index + 1}.</span>` +
                        `<span class="card-item-text">${cleanLine}</span>` +
                    `</div>`;
                }).join('') + 
                `</div>`;
        }
    }
    
    return '';
}

// ========================================
// Modal Functions
// ========================================

function showDeliveryMessage(deliveryId) {
    const delivery = deliveries.find(d => d.id === deliveryId);
    if (!delivery) return;
    
    const modal = document.getElementById('message-modal');
    const modalMessage = document.getElementById('modal-message');
    
    // Generate message from delivery data
    let message = '';
    message += `👤 Cliente: ${delivery.nome}\n`;
    message += `📞 Telefone: ${delivery.telefone || 'Sem telefone'}\n`;
    
    // Generate formatted order items with numbering
    if (delivery.itensPedido && delivery.itensPedido.length > 0) {
        message += `\n📦 Pedido:\n`;
        delivery.itensPedido.forEach((item, index) => {
            const storeInfo = item.store ? ` (${item.store})` : '';
            message += `${index + 1}. ${item.text}${storeInfo}\n`;
        });
    } else if (delivery.pedido) {
        // Fallback to plain text with numbered format
        message += `\n📦 Pedido:\n`;
        const lines = delivery.pedido.split('\n').filter(line => line.trim());
        lines.forEach((line, index) => {
            // Remove existing numbering if present
            const cleanLine = line.replace(/^\d+[.)\-:]\s*/, '');
            message += `${index + 1}. ${cleanLine}\n`;
        });
    }
    
    if (delivery.retirada) {
        message += `\n📍 Retirada: ${delivery.retirada}\n`;
    }
    
    message += `\n💰 Valor: R$ ${delivery.valor}\n`;
    message += `💳 Pagamento: ${delivery.pagamento}\n`;
    
    if (delivery.pagamento === 'Dinheiro' && !delivery.jaPago && delivery.precisaTroco) {
        message += `💵 Troco para: R$ ${delivery.valorTroco}\n`;
    }
    
    message += `\n🏠 Endereço: ${delivery.endereco}\n`;
    message += `📍 Referência: ${delivery.referencia}\n`;
    
    if (delivery.horario) {
        let schedule = delivery.horario;
        if (delivery.entregarAmanha) {
            schedule += ' - Amanhã';
        }
        message += `\n⏰ Horário: ${schedule}\n`;
    }
    
    if (delivery.observacoes) {
        message += `\n📝 Observações: ${delivery.observacoes}\n`;
    }
    
    currentDeliveryId = deliveryId;
    modalMessage.textContent = message;
    modal.classList.remove('hidden');
}

function closeModal() {
    document.getElementById('message-modal').classList.add('hidden');
}

function copyMessage() {
    const message = document.getElementById('modal-message').textContent;
    copyToClipboard(message);
    showToast('Mensagem copiada!', 'success');
}

function shareWhatsApp() {
    const message = document.getElementById('modal-message').textContent;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
}

function shareSMS() {
    const delivery = deliveries.find(d => d.id === currentDeliveryId);
    if (!delivery || !delivery.telefone) {
        showToast('Cliente sem telefone', 'error');
        return;
    }
    
    const message = document.getElementById('modal-message').textContent;
    const encodedMessage = encodeURIComponent(message);
    const phone = delivery.telefone.replace(/\D/g, '');
    window.open(`sms:${phone}?body=${encodedMessage}`, '_blank');
}

function copyDeliveryMessage(deliveryId) {
    const delivery = deliveries.find(d => d.id === deliveryId);
    if (!delivery) return;
    
    let message = '';
    message += `👤 Cliente: ${delivery.nome}\n`;
    message += `📞 Telefone: ${delivery.telefone || 'Sem telefone'}\n`;
    
    // Generate formatted order items with numbering
    if (delivery.itensPedido && delivery.itensPedido.length > 0) {
        message += `\n📦 Pedido:\n`;
        delivery.itensPedido.forEach((item, index) => {
            const storeInfo = item.store ? ` (${item.store})` : '';
            message += `${index + 1}. ${item.text}${storeInfo}\n`;
        });
    } else if (delivery.pedido) {
        // Fallback to plain text with numbered format
        message += `\n📦 Pedido:\n`;
        const lines = delivery.pedido.split('\n').filter(line => line.trim());
        lines.forEach((line, index) => {
            // Remove existing numbering if present
            const cleanLine = line.replace(/^\d+[.)\-:]\s*/, '');
            message += `${index + 1}. ${cleanLine}\n`;
        });
    }
    
    if (delivery.retirada) {
        message += `\n📍 Retirada: ${delivery.retirada}\n`;
    }
    
    message += `\n💰 Valor: R$ ${delivery.valor}\n`;
    message += `💳 Pagamento: ${delivery.pagamento}\n`;
    
    if (delivery.pagamento === 'Dinheiro' && delivery.pagarNaEntrega && delivery.precisaTroco) {
        message += `💵 Troco para: R$ ${delivery.valorTroco}\n`;
    }
    
    message += `\n🏠 Endereço: ${delivery.endereco}\n`;
    message += `📍 Referência: ${delivery.referencia}\n`;
    
    if (delivery.horario) {
        let schedule = delivery.horario;
        if (delivery.entregarAmanha) {
            schedule += ' - Amanhã';
        }
        message += `\n⏰ Horário: ${schedule}\n`;
    }
    
    if (delivery.observacoes) {
        message += `\n📝 Observações: ${delivery.observacoes}\n`;
    }
    
    copyToClipboard(message);
    showToast('Mensagem copiada!', 'success');
}

function shareDeliveryWhatsApp(deliveryId) {
    const delivery = deliveries.find(d => d.id === deliveryId);
    if (!delivery) return;
    
    let message = '';
    message += `👤 Cliente: ${delivery.nome}\n`;
    message += `📞 Telefone: ${delivery.telefone || 'Sem telefone'}\n`;
    
    if (delivery.pedido) {
        message += `\n📦 Pedido:\n${delivery.pedido}\n`;
    }
    
    if (delivery.retirada) {
        message += `\n📍 Retirada: ${delivery.retirada}\n`;
    }
    
    message += `\n💰 Valor: R$ ${delivery.valor}\n`;
    message += `💳 Pagamento: ${delivery.pagamento}\n`;
    
    if (delivery.pagamento === 'Dinheiro' && delivery.pagarNaEntrega && delivery.precisaTroco) {
        message += `💵 Troco para: R$ ${delivery.valorTroco}\n`;
    }
    
    message += `\n🏠 Endereço: ${delivery.endereco}\n`;
    message += `📍 Referência: ${delivery.referencia}\n`;
    
    if (delivery.horario) {
        let schedule = delivery.horario;
        if (delivery.entregarAmanha) {
            schedule += ' - Amanhã';
        }
        message += `\n⏰ Horário: ${schedule}\n`;
    }
    
    if (delivery.observacoes) {
        message += `\n📝 Observações: ${delivery.observacoes}\n`;
    }
    
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
}

// ========================================
// Delete Functions
// ========================================

function confirmDeleteDelivery(deliveryId) {
    currentDeliveryId = deliveryId;
    document.getElementById('confirm-dialog').classList.remove('hidden');
}

function closeConfirmDialog() {
    document.getElementById('confirm-dialog').classList.add('hidden');
    currentDeliveryId = null;
}

function confirmDelete() {
    if (currentDeliveryId) {
        deliveries = deliveries.filter(d => d.id !== currentDeliveryId);
        saveData();
        renderDeliveries();
        showToast('Entrega excluída', 'success');
    }
    closeConfirmDialog();
}

// ========================================
// Replenishment Functions
// ========================================

function toggleCategory(category) {
    const toggle = document.getElementById(`${category}Ativo`);
    const content = document.getElementById(category);
    
    if (toggle && content) {
        toggle.classList.toggle('active');
        content.classList.toggle('hidden', !toggle.classList.contains('active'));
    }
    
    updateReplenishmentMessage();
}

function toggleSacoFechado() {
    const toggle = document.getElementById('sacoFechadoAtivo');
    const content = document.getElementById('sacoFechado-content');
    
    if (toggle && content) {
        toggle.classList.toggle('active');
        content.classList.toggle('hidden', !toggle.classList.contains('active'));
    }
    
    updateReplenishmentMessage();
}

function loadStoreData() {
    updateReplenishmentMessage();
}

function loadPreviousList() {
    const usePrevious = document.getElementById('use-previous-list').checked;
    
    if (usePrevious) {
        const saved = localStorage.getItem('deliveryPets_replenishment');
        if (saved) {
            const replenishment = JSON.parse(saved);
            
            Object.keys(replenishment).forEach(key => {
                const el = document.getElementById(key);
                if (el) {
                    if (el.type === 'checkbox') {
                        el.checked = replenishment[key];
                        const content = el.closest('.category-group').querySelector('.category-content');
                        if (content) {
                            content.classList.toggle('hidden', !replenishment[key]);
                        }
                    } else {
                        el.value = replenishment[key];
                    }
                }
            });
            
            updateReplenishmentMessage();
            showToast('Lista anterior carregada', 'success');
        } else {
            showToast('Nenhuma lista anterior encontrada', 'error');
            document.getElementById('use-previous-list').checked = false;
        }
    }
}

function generateReplenishmentMessage() {
    const store = document.getElementById('store-select').value;
    
    if (!store) {
        return 'Selecione uma loja...';
    }
    
    let message = `📋 REPOSIÇÃO: ${store}\n\n`;
    
    const categories = [
        { id: 'racaoCachorro', icon: '🐶', label: 'Ração Cachorro' },
        { id: 'racaoGato', icon: '🐱', label: 'Ração Gato' },
        { id: 'areia', icon: '🕳️', label: 'Areia' },
        { id: 'passarinho', icon: '🦜', label: 'Passarinho' },
        { id: 'avulsa', icon: '📦', label: 'Avulsa' },
        { id: 'sache', icon: '🥩', label: 'Sachê' },
        { id: 'remedio', icon: '💊', label: 'Remédio' },
        { id: 'shampoo', icon: '🧼', label: 'Shampoo' },
        { id: 'canaletado', icon: '📌', label: 'Canaletado' },
        { id: 'sacoFechado', icon: '⚖️', label: 'Saco Fechado' },
        { id: 'produtosLoja', icon: '🧹', label: 'Produtos para Loja' }
    ];
    
    let hasItems = false;
    
    categories.forEach(cat => {
        const toggle = document.getElementById(`${cat.id}Ativo`);
        const active = toggle ? toggle.classList.contains('active') : false;
        
        if (active) {
            hasItems = true;
            message += `${cat.icon} ${cat.label}\n`;
            
            if (cat.id === 'sacoFechado') {
                const peso15 = document.getElementById('saco15kg').value;
                const peso10 = document.getElementById('saco10kg').value;
                
                if (peso15) {
                    const linhas15 = peso15.split('\n');
                    linhas15.forEach(linha => {
                        if (linha.trim()) {
                            message += `• 15kg: ${linha.trim()}\n`;
                        }
                    });
                }
                if (peso10) {
                    const linhas10 = peso10.split('\n');
                    linhas10.forEach(linha => {
                        if (linha.trim()) {
                            message += `• 10kg: ${linha.trim()}\n`;
                        }
                    });
                }
            } else {
                const value = document.getElementById(cat.id).value;
                if (value) {
                    const lines = value.split('\n');
                    lines.forEach(line => {
                        if (line.trim()) {
                            message += `• ${line.trim()}\n`;
                        }
                    });
                }
            }
            
            message += '\n';
        }
    });
    
    if (!hasItems) {
        message += 'Nenhum item adicionado...';
    }
    
    return message;
}

function updateReplenishmentMessage() {
    const preview = document.getElementById('replenishment-preview');
    const message = generateReplenishmentMessage();
    preview.textContent = message;
    
    // Auto-save
    saveReplenishment();
}

function copyReplenishmentMessage() {
    const message = document.getElementById('replenishment-preview').textContent;
    copyToClipboard(message);
    showToast('Mensagem copiada!', 'success');
}

function sendReplenishmentWhatsApp() {
    const store = document.getElementById('store-select').value;
    
    if (!store) {
        showToast('Selecione uma loja primeiro', 'error');
        return;
    }
    
    const message = document.getElementById('replenishment-preview').textContent;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
}

// ========================================
// Utility Functions
// ========================================

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).catch(() => {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
    });
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type}`;
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

// ========================================
// Clients Modal Functions
// ========================================

function showClientsModal() {
    const modal = document.getElementById('clients-modal');
    const listContainer = document.getElementById('clients-list');
    const noClients = document.getElementById('no-clients');
    
    // Reset filter
    document.getElementById('client-filter').value = '';
    
    renderClientsList(clients);
    
    modal.classList.remove('hidden');
}

function renderClientsList(clientsToRender) {
    const listContainer = document.getElementById('clients-list');
    const noClients = document.getElementById('no-clients');
    
    if (clientsToRender.length === 0) {
        listContainer.innerHTML = '';
        noClients.classList.remove('hidden');
    } else {
        noClients.classList.add('hidden');
        listContainer.innerHTML = clientsToRender.map(client => `
            <div class="client-item" onclick="selectClientFromList('${client.id}')">
                <div class="client-info">
                    <div class="client-name">${client.nome}</div>
                    <div class="client-phone">${client.telefone || 'Sem telefone'}</div>
                </div>
                <div class="client-actions">
                    <button class="client-action-btn" onclick="event.stopPropagation(); editClient('${client.id}')">✏️</button>
                    <button class="client-action-btn delete" onclick="event.stopPropagation(); confirmDeleteClient('${client.id}')">🗑️</button>
                </div>
            </div>
        `).join('');
    }
}

function filterClients(query) {
    if (!query) {
        renderClientsList(clients);
        return;
    }
    
    const filtered = clients.filter(client => 
        client.nome.toLowerCase().includes(query.toLowerCase()) ||
        (client.telefone && client.telefone.includes(query))
    );
    
    renderClientsList(filtered);
}

function closeClientsModal() {
    document.getElementById('clients-modal').classList.add('hidden');
}

function selectClientFromList(clientId) {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;
    
    closeClientsModal();
    
    // Navigate to new delivery with client data
    showNewDeliveryForm();
    
    // Fill client data
    selectedClientId = client.id;
    document.getElementById('client-search').value = client.nome;
    document.getElementById('client-name').value = client.nome;
    document.getElementById('client-phone').value = client.telefone || '';
    document.getElementById('client-address').value = client.endereco || '';
    document.getElementById('client-reference').value = client.pontoReferencia || '';
    
    // Uncheck "save client" since it's already saved
    document.getElementById('save-client').checked = false;
    
    updateMessagePreview();
}

let editingClientId = null;

function editClient(clientId) {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;
    
    editingClientId = clientId;
    document.getElementById('edit-client-id').value = client.id;
    document.getElementById('edit-client-name').value = client.nome;
    document.getElementById('edit-client-phone').value = client.telefone || '';
    document.getElementById('edit-client-address').value = client.endereco || '';
    document.getElementById('edit-client-reference').value = client.pontoReferencia || '';
    
    document.getElementById('edit-client-modal').classList.remove('hidden');
}

function closeEditClientModal() {
    document.getElementById('edit-client-modal').classList.add('hidden');
    editingClientId = null;
}

function formatPhoneEdit() {
    const input = document.getElementById('edit-client-phone');
    formatPhone(input);
}

document.getElementById('edit-client-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const clientId = document.getElementById('edit-client-id').value;
    const clientIndex = clients.findIndex(c => c.id === clientId);
    
    if (clientIndex !== -1) {
        clients[clientIndex] = {
            ...clients[clientIndex],
            nome: document.getElementById('edit-client-name').value,
            telefone: document.getElementById('edit-client-phone').value,
            endereco: document.getElementById('edit-client-address').value,
            pontoReferencia: document.getElementById('edit-client-reference').value
        };
        
        saveData();
        closeEditClientModal();
        showClientsModal();
        showToast('Cliente atualizado!', 'success');
    }
});

function confirmDeleteClient(clientId) {
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
        clients = clients.filter(c => c.id !== clientId);
        saveData();
        showClientsModal();
        showToast('Cliente excluído!', 'success');
    }
}

function deleteClient() {
    if (editingClientId) {
        confirmDeleteClient(editingClientId);
        closeEditClientModal();
    }
}

// ========================================
// Initialization
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    loadData();
    initNavigation();
    
    // Close clients modal when clicking outside
    document.getElementById('clients-modal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('clients-modal')) {
            closeClientsModal();
        }
    });
    
    // Close edit client modal when clicking outside
    document.getElementById('edit-client-modal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('edit-client-modal')) {
            closeEditClientModal();
        }
    });
    
    // Show FAB on deliveries screen by default
    const fab = document.querySelector('.fab');
    if (fab) {
        fab.style.display = 'flex';
    }
    
    renderDeliveries();
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        const dropdown = document.getElementById('client-dropdown');
        const searchInput = document.getElementById('client-search');
        
        if (!searchInput.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.classList.add('hidden');
        }
    });
    
    // Close modal when clicking outside
    document.getElementById('message-modal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('message-modal')) {
            closeModal();
        }
    });
    
    document.getElementById('confirm-dialog').addEventListener('click', (e) => {
        if (e.target === document.getElementById('confirm-dialog')) {
            closeConfirmDialog();
        }
    });
});
  
  
// Validity Functions 
