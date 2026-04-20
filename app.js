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
let bathgroomSchedules = [];

// ========================================
// LocalStorage Functions
// ========================================

function loadData() {
    // Clear old localStorage store cache and use config.js instead
    clearOldStoreCache();
    
    const savedDeliveries = localStorage.getItem('deliveryPets_deliveries');
    const savedClients = localStorage.getItem('deliveryPets_clients');
    const lastDate = localStorage.getItem('deliveryPets_lastDate');

    // Check if it's a new day and clear deliveries
    const today = new Date().toDateString();
    if (lastDate !== today) {
        // New day - clear deliveries but keep clients
        deliveries = [];
        localStorage.setItem('deliveryPets_deliveries', JSON.stringify(deliveries));
        localStorage.setItem('deliveryPets_lastDate', today);
        console.log('Novo dia detectado. Lista de pedidos foi zerada.');
    } else {
        // Same day - load existing deliveries
        if (savedDeliveries) {
            deliveries = JSON.parse(savedDeliveries);
        }
    }

    if (savedClients) {
        clients = JSON.parse(savedClients);
    }

    // Load bathgroom schedules
    const savedBathgroom = localStorage.getItem('deliveryPets_bathgroom');
    if (savedBathgroom) {
        bathgroomSchedules = JSON.parse(savedBathgroom);
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
    // Also save as last list for recovery
    localStorage.setItem('ultima_lista_reposicao', JSON.stringify(replenishment));
}

function recoverLastReplenishmentList() {
    const savedList = localStorage.getItem('ultima_lista_reposicao');
    
    if (!savedList) {
        showToast('Nenhuma lista anterior encontrada', 'error');
        return;
    }
    
    try {
        const replenishment = JSON.parse(savedList);
        
        // Restore store
        if (replenishment.store) {
            document.getElementById('store-select').value = replenishment.store;
        }
        
        // Restore all items
        const fields = [
            { active: 'racaoCachorroAtivo', value: 'racaoCachorro' },
            { active: 'racaoGatoAtivo', value: 'racaoGato' },
            { active: 'areiaAtivo', value: 'areia' },
            { active: 'passarinhoAtivo', value: 'passarinho' },
            { active: 'avulsaAtivo', value: 'avulsa' },
            { active: 'sacheAtivo', value: 'sache' },
            { active: 'remedioAtivo', value: 'remedio' },
            { active: 'shampooAtivo', value: 'shampoo' },
            { active: 'canaletadoAtivo', value: 'canaletado' },
            { active: 'sacoFechadoAtivo', value: 'saco15kg' },
            { active: 'sacoFechadoAtivo', value: 'saco10kg' },
            { active: 'produtosLojaAtivo', value: 'produtosLoja' }
        ];
        
        fields.forEach(field => {
            const activeEl = document.getElementById(field.active);
            const valueEl = document.getElementById(field.value);
            
            if (activeEl && replenishment[field.active]) {
                activeEl.classList.add('active');
            } else if (activeEl) {
                activeEl.classList.remove('active');
            }
            
            if (valueEl && replenishment[field.value] !== undefined) {
                valueEl.value = replenishment[field.value];
            }
        });
        
        // Update preview
        updateReplenishmentMessage();
        
        showToast('Lista anterior recuperada com sucesso!', 'success');
    } catch (e) {
        showToast('Erro ao recuperar lista anterior', 'error');
    }
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
    } else if (screen === 'bathgroom') {
        document.getElementById('bathgroom-screen').classList.add('active');
        renderBathgroomList();
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
    
    // Reset order type to Delivery
    setOrderType('delivery');
    
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
    
    // Fill order type (delivery or mesa)
    setOrderType(delivery.tipo || 'delivery');
    
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
    
    // Format: (XX) 9XXXX-XXXX
    if (value.length > 0) {
        value = value.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
        // If not 11 digits yet, try partial format
        if (value.length <= 14) {
            value = input.value.replace(/\D/g, '');
            if (value.length >= 2) {
                value = '(' + value;
                if (value.length > 3) {
                    value = value.substring(0, 3) + ') ' + value.substring(3);
                }
                if (value.length > 10) {
                    value = value.substring(0, 10) + '-' + value.substring(10);
                }
            }
        }
    }
    
    input.value = value.substring(0, 15);
    
    // Update preview
    updateMessagePreview();
}

// ========================================
// Report Bug
// ========================================

function reportBug() {
    const phoneNumber = '5521971593565'; // WhatsApp number
    const message = 'Olá MrsNesbitt, encontrei um erro no sistema e preciso de ajuda. O bug que está acontecendo é:';
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');
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
            
            // Preserve existing store selection if available (from original orderItems array)
            const preservedStore = orderItems[newOrderItems.length] ? orderItems[newOrderItems.length].store : '';
            
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
    // Sync orderItems back to description textarea
    syncDescriptionFromOrderItems();
    updateMessagePreview();
}

function syncDescriptionFromOrderItems() {
    const descriptionField = document.getElementById('order-description');
    if (descriptionField && orderItems.length > 0) {
        const text = orderItems.map((item, index) => {
            return `${index + 1}. ${item.text || ''}`;
        }).join('\n');
        descriptionField.value = text;
    }
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
    const orderType = document.getElementById('order-type').value;
    const paymentMethod = document.getElementById('payment-method').value;
    const alreadyPaid = document.getElementById('already-paid').checked;
    const needsChange = document.getElementById('needs-change').checked;
    const changeValue = document.getElementById('change-value').value;
    const deliveryTime = document.getElementById('delivery-time').value;
    const deliverTomorrow = document.getElementById('deliver-tomorrow').checked;
    const notes = document.getElementById('notes').value;
    
    let message = '';
    
    // Client info - Cliente, Telefone, Endereço, Referência
    message += `👤 Cliente: ${name || '[nome]'}\n`;
    message += `📞 Telefone: ${noPhone ? 'Sem telefone' : (phone || '[telefone]')}\n`;
    message += `🏠 Endereço: ${address || '[endereço]'}\n`;
    message += `📍 Referência: ${reference || '[referência]'}\n`;
    
    // Google Maps link
    const includeMapsLink = document.getElementById('include-maps-link')?.checked ?? true;
    if (includeMapsLink && address) {
        const mapQuery = encodeURIComponent(address + ', Rio de Janeiro - RJ');
        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;
        message += `📍 Localização: ${mapsUrl}\n`;
    }
    
    // Order - com lógica de loja por item
    const lojaUnica = document.getElementById('loja-unica').checked;
    message += '\n📦 Pedido:\n';
    
    if (description) {
        const lines = description.split('\n').filter(line => line.trim());
        
        if (lojaUnica) {
            // Loja única: itens sem loja, mostrar only no campo Retirada
            lines.forEach((line, index) => {
                if (line.trim()) {
                    message += `${line.trim()}\n`;
                }
            });
        } else {
            // Múltiplas lojas: mostrar loja ao lado de cada item
            // Verificar se todos os itens são da mesma loja
            const uniqueStores = new Set();
            lines.forEach((line, index) => {
                if (orderItems[index] && orderItems[index].store) {
                    uniqueStores.add(orderItems[index].store);
                }
            });
            
            if (uniqueStores.size > 1) {
                // Itens de lojas diferentes - mostrar loja em cada item
                lines.forEach((line, index) => {
                    if (line.trim()) {
                        const store = (orderItems[index] && orderItems[index].store) ? orderItems[index].store : '';
                        const storeText = store ? ` - ${store}` : '';
                        message += `${line.trim()}${storeText}\n`;
                    }
                });
            } else {
                // Mesma loja ou não especificada - apenas itens
                lines.forEach((line, index) => {
                    if (line.trim()) {
                        message += `${line.trim()}\n`;
                    }
                });
            }
        }
    } else {
        message += '[itens do pedido]\n';
    }
    
    // Pickup location (only show if Loja Única is enabled)
    if (lojaUnica && pickupLocation) {
        message += `\n📍 Retirada: ${pickupLocation}\n`;
    }
    
    // Payment - Lógica de status para PIX e Cartão
    // alreadyPaid=true means "Pagar na entrega" checkbox is checked
    let paymentText = paymentMethod;
    if (orderType !== 'mesa') {
        if (alreadyPaid) {
            paymentText = `${paymentMethod} (PAGAR NA ENTREGA)`;
        } else {
            paymentText = `${paymentMethod} (JÁ PAGO)`;
        }
    }
    
    message += `\n💰 Valor: R$ ${totalValue || '0,00'}\n`;
    message += `💳 Pagamento: ${paymentText}\n`;
    
    if (paymentMethod === 'Dinheiro' && alreadyPaid && needsChange) {
        message += `💵 Troco para: R$ ${changeValue || '0,00'}\n`;
    }
    
    // Schedule
    let schedule = '';
    if (deliveryTime) {
        schedule = deliveryTime;
    }
    if (deliverTomorrow) {
        schedule += schedule ? ' - ' : '';
        schedule += 'Amanhã';
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
    const orderType = document.getElementById('order-type').value;
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
            telefone: noPhone ? '' : formatPhoneNumber(phone),
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
        telefone: noPhone ? '' : formatPhoneNumber(phone),
        pedido: description,
        itensPedido: orderItems, // Save the structured order items with store info
        retirada: pickupLocation,
        valor: totalValue,
        tipo: orderType,
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
// Order Type Toggle Functions
// ========================================

function selectOrderType(type) {
    if (type === 'mesa') {
        // Show password dialog for Mesa
        showPasswordDialogForForm();
    } else {
        // Direct switch to Delivery
        setOrderType('delivery');
    }
}

function setOrderType(type) {
    document.getElementById('order-type').value = type;
    document.getElementById('btn-delivery').classList.toggle('active', type === 'delivery');
    document.getElementById('btn-mesa').classList.toggle('active', type === 'mesa');
    
    // Toggle address field visibility based on type
    const addressSection = document.querySelector('#client-address').closest('.form-group');
    const referenceSection = document.querySelector('#client-reference').closest('.form-group');
    
    if (type === 'mesa') {
        if (addressSection) addressSection.classList.add('hidden');
        if (referenceSection) referenceSection.classList.add('hidden');
    } else {
        if (addressSection) addressSection.classList.remove('hidden');
        if (referenceSection) referenceSection.classList.remove('hidden');
    }
    
    updateMessagePreview();
}

function showPasswordDialogForForm() {
    document.getElementById('mesa-password').value = '';
    document.getElementById('password-error').classList.add('hidden');
    document.getElementById('password-dialog').classList.remove('hidden');
    
    const passwordInput = document.getElementById('mesa-password');
    passwordInput.focus();
    
    passwordInput.oninput = function() {
        this.value = this.value.replace(/[^0-9]/g, '');
        if (this.value.length === 6) {
            validateMesaPasswordForForm();
        }
    };
}

function validateMesaPasswordForForm() {
    const password = document.getElementById('mesa-password').value;
    const correctPassword = '258137';
    
    if (password === correctPassword) {
        setOrderType('mesa');
        closePasswordDialog();
        showToast('Modo Mesa/Comanda ativado', 'success');
    } else {
        document.getElementById('mesa-password').value = '';
        document.getElementById('password-error').classList.remove('hidden');
        // Reset to delivery on wrong password
        setOrderType('delivery');
    }
}

function toggleDeliveryType(deliveryId) {
    const delivery = deliveries.find(d => d.id === deliveryId);
    if (!delivery) return;
    
    const isCurrentlyMesa = delivery.tipo === 'mesa';
    
    // If changing from Mesa to Delivery, no password needed
    if (isCurrentlyMesa) {
        delivery.tipo = 'delivery';
        saveData();
        renderDeliveries();
        showToast('Pedido alterado para Delivery', 'success');
        return;
    }
    
    // Changing from Delivery to Mesa - require password
    showPasswordDialog(deliveryId);
}

function showPasswordDialog(deliveryId) {
    window._pendingMesaDeliveryId = deliveryId;
    document.getElementById('mesa-password').value = '';
    document.getElementById('password-error').classList.add('hidden');
    document.getElementById('password-dialog').classList.remove('hidden');
    
    // Focus and show keyboard
    const passwordInput = document.getElementById('mesa-password');
    passwordInput.focus();
    
    // Add input listener for auto-validation
    passwordInput.oninput = function() {
        // Only allow numeric input
        this.value = this.value.replace(/[^0-9]/g, '');
        
        // Auto-submit when 6 digits entered
        if (this.value.length === 6) {
            validateMesaPassword();
        }
    };
}

function closePasswordDialog() {
    document.getElementById('password-dialog').classList.add('hidden');
    window._pendingMesaDeliveryId = null;
}

function validateMesaPassword() {
    const password = document.getElementById('mesa-password').value;
    const correctPassword = '258137';
    
    // Auto-validate when 6 digits are entered
    if (password.length === 6) {
        if (password === correctPassword) {
            // Password correct - change to Mesa
            const deliveryId = window._pendingMesaDeliveryId;
            const delivery = deliveries.find(d => d.id === deliveryId);
            if (delivery) {
                delivery.tipo = 'mesa';
                saveData();
                renderDeliveries();
                showToast('Pedido alterado para Mesa/Comanda', 'success');
            }
            closePasswordDialog();
        } else {
            // Password incorrect - clear and show error
            document.getElementById('mesa-password').value = '';
            document.getElementById('password-error').classList.remove('hidden');
        }
    }
}

function confirmMesaPassword() {
    const password = document.getElementById('mesa-password').value;
    const correctPassword = '258137';
    
    if (password === correctPassword) {
        // Password correct - change to Mesa
        const deliveryId = window._pendingMesaDeliveryId;
        const delivery = deliveries.find(d => d.id === deliveryId);
        if (delivery) {
            delivery.tipo = 'mesa';
            saveData();
            renderDeliveries();
            showToast('Pedido alterado para Mesa/Comanda', 'success');
        }
        closePasswordDialog();
    } else {
        // Password incorrect - show error
        document.getElementById('password-error').classList.remove('hidden');
    }
}

// Initialize pending delivery ID variable
window._pendingMesaDeliveryId = null;

// Password input event listener (set up in main DOMContentLoaded)
function setupPasswordInput() {
    const passwordInput = document.getElementById('mesa-password');
    if (passwordInput) {
        passwordInput.addEventListener('input', function(e) {
            this.value = this.value.replace(/[^0-9]/g, '');
            if (this.value.length === 6) {
                validateMesaPassword();
            }
        });
        
        passwordInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                validateMesaPassword();
            }
        });
    }
}

function copySalesSummary() {
    // Open the summary modal instead of directly copying
    showSummaryModal();
}

function showSummaryModal() {
    const modal = document.getElementById('summary-modal');
    const resultContainer = document.getElementById('summary-result-container');
    const summaryStore = document.getElementById('summary-store');
    const summaryObservation = document.getElementById('summary-observation');
    
    // Reset fields
    summaryStore.value = 'Marcão';
    summaryObservation.value = '';
    resultContainer.classList.add('hidden');
    
    modal.classList.remove('hidden');
}

function closeSummaryModal() {
    document.getElementById('summary-modal').classList.add('hidden');
}

function generateSalesSummary() {
    const totals = window._currentTotals;
    if (!totals) {
        showToast('Erro ao gerar resumo', 'error');
        return;
    }
    
    const store = document.getElementById('summary-store').value;
    const observation = document.getElementById('summary-observation').value.trim();
    
    // Build Delivery section - only show if there are delivery sales
    let deliveryData = '';
    if (totals.totalDelivery > 0) {
        const deliveryParts = [];
        if (totals.totalCartao > 0) {
            deliveryParts.push(`Crédito R$ ${totals.totalCartao.toFixed(2)}`);
            deliveryParts.push(`Débito R$ ${totals.totalCartao.toFixed(2)}`);
        }
        if (totals.totalPix > 0) {
            deliveryParts.push(`Pix R$ ${totals.totalPix.toFixed(2)}`);
        }
        if (deliveryParts.length > 0) {
            deliveryData = `Vendas Delivery: ${deliveryParts.join(' • ')}`;
        }
    }
    
    // Build Mesa section - only show if there are mesa sales
    let mesaData = '';
    if (totals.totalMesa > 0) {
        const mesaParts = [];
        if (totals.totalMesaCartao > 0) {
            mesaParts.push(`Crédito R$ ${totals.totalMesaCartao.toFixed(2)}`);
            mesaParts.push(`Débito R$ ${totals.totalMesaCartao.toFixed(2)}`);
        }
        if (totals.totalMesaPix > 0) {
            mesaParts.push(`Pix R$ ${totals.totalMesaPix.toFixed(2)}`);
        }
        if (mesaParts.length > 0) {
            mesaData = ` | Mesa: ${mesaParts.join(' • ')}`;
        }
    }
    
    // Build final message
    let message;
    if (observation) {
        message = `Fechamento ${store}: ${observation} (${deliveryData}${mesaData})`;
    } else {
        message = `Fechamento ${store}: (${deliveryData}${mesaData})`;
    }
    
    // Display the message
    const resultContainer = document.getElementById('summary-result-container');
    const summaryMessage = document.getElementById('summary-message');
    summaryMessage.textContent = message;
    resultContainer.classList.remove('hidden');
    
    // Store message for copying
    window._currentSummaryMessage = message;
}

function copySummaryMessage() {
    const message = window._currentSummaryMessage;
    if (message) {
        copyToClipboard(message);
        showToast('Mensagem copiada!', 'success');
    }
}

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
    
    // Calculate totals by payment method and type
    let totalDinheiro = 0;
    let totalCartao = 0;
    let totalPix = 0;
    let totalMesaDinheiro = 0;
    let totalMesaCartao = 0;
    let totalMesaPix = 0;
    
    sortedDeliveries.forEach(d => {
        const valor = parseCurrency(d.valor) || 0;
        const isMesa = d.tipo === 'mesa';
        
        if (isMesa) {
            // Mesa/Comanda - separate by payment method
            if (d.pagamento === 'Dinheiro') {
                totalMesaDinheiro += valor;
            } else if (d.pagamento === 'Cartão') {
                totalMesaCartao += valor;
            } else if (d.pagamento === 'PIX') {
                totalMesaPix += valor;
            }
        } else {
            // Delivery - separate by payment method
            if (d.pagamento === 'Dinheiro') {
                totalDinheiro += valor;
            } else if (d.pagamento === 'Cartão') {
                totalCartao += valor;
            } else if (d.pagamento === 'PIX') {
                totalPix += valor;
            }
        }
    });
    
    container.innerHTML = sortedDeliveries.map(delivery => {
        let schedule = delivery.horario || '';
        if (delivery.entregarAmanha) {
            schedule += schedule ? ' - ' : '';
            schedule += 'Amanhã';
        }
        
        const isMesa = delivery.tipo === 'mesa';
        const cardClass = isMesa ? 'delivery-card delivery-mesa' : 'delivery-card';
        const typeIcon = isMesa ? '🍽️' : '🚗';
        const typeLabel = isMesa ? 'Mesa' : 'Delivery';
        
        return `
            <div class="${cardClass}" onclick="showDeliveryMessage('${delivery.id}')">
                <div class="card-header">
                    <div class="card-header-left">
                        <button class="type-toggle-btn" onclick="event.stopPropagation(); toggleDeliveryType('${delivery.id}')" title="Alternar Delivery/Mesa">
                            ${typeIcon}
                        </button>
                        <span class="card-client">${delivery.nome}</span>
                    </div>
                    <span class="card-value">R$ ${delivery.valor}</span>
                </div>
                ${!isMesa ? `<div class="card-address">
                    📍 ${delivery.endereco}
                </div>` : ''}
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
    }).join('');
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
    message += `🏠 Endereço: ${delivery.endereco || '[endereço]'}\n`;
    message += `📍 Referência: ${delivery.referencia || '[referência]'}\n`;
    
    // Google Maps link
    if (delivery.endereco) {
        const mapQuery = encodeURIComponent(delivery.endereco + ', Rio de Janeiro - RJ');
        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;
        message += `📍 Localização: ${mapsUrl}\n`;
    }
    
    // Generate formatted order items - com lógica de loja por item
    if (delivery.itensPedido && delivery.itensPedido.length > 0) {
        message += `\n📦 Pedido:\n`;
        
        // Verificar se há lojas diferentes
        const uniqueStores = new Set();
        delivery.itensPedido.forEach((item) => {
            if (item.store) uniqueStores.add(item.store);
        });
        
        if (uniqueStores.size > 1) {
            // Itens de lojas diferentes - mostrar loja ao lado de cada item
            delivery.itensPedido.forEach((item, index) => {
                const storeText = item.store ? ` - ${item.store}` : '';
                message += `${item.text}${storeText}\n`;
            });
        } else {
            // Mesma loja ou não especificada - apenas itens
            delivery.itensPedido.forEach((item, index) => {
                message += `${item.text}\n`;
            });
        }
    } else if (delivery.pedido) {
        message += `\n📦 Pedido:\n`;
        const lines = delivery.pedido.split('\n').filter(line => line.trim());
        lines.forEach((line, index) => {
            const cleanLine = line.replace(/^\d+[.)\-:]\s*/, '');
            message += `${cleanLine}\n`;
        });
    }
    
    // Pickup location (only show if exists)
    if (delivery.retirada) {
        message += `\n📍 Retirada: ${delivery.retirada}\n`;
    }
    
    // Payment logic - generalized for PIX and Cartão
    let paymentText = delivery.pagamento;
    if (delivery.tipo !== 'mesa') {
        if (delivery.pagarNaEntrega) {
            paymentText = `${delivery.pagamento} (PAGAR NA ENTREGA)`;
        } else {
            paymentText = `${delivery.pagamento} (JÁ PAGO)`;
        }
    }
    
    message += `\n💰 Valor: R$ ${delivery.valor}\n`;
    message += `💳 Pagamento: ${paymentText}\n`;
    
    if (delivery.pagamento === 'Dinheiro' && delivery.pagarNaEntrega && delivery.precisaTroco) {
        message += `💵 Troco para: R$ ${delivery.valorTroco}\n`;
    }
    
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
    message += `🏠 Endereço: ${delivery.endereco || '[endereço]'}\n`;
    message += `📍 Referência: ${delivery.referencia || '[referência]'}\n`;
    
// Google Maps link
    const includeMapsLink = document.getElementById('include-maps-link')?.checked ?? true;
    if (includeMapsLink && delivery.endereco) {
        const mapQuery = encodeURIComponent(delivery.endereco + ', Rio de Janeiro - RJ');
        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;
        message += `📍 Localização: ${mapsUrl}\n`;
    }
    
    // Generate formatted order items - com lógica de loja por item
    if (delivery.itensPedido && delivery.itensPedido.length > 0) {
        message += `\n📦 Pedido:\n`;
        
        // Verificar se há lojas diferentes
        const uniqueStores = new Set();
        delivery.itensPedido.forEach((item) => {
            if (item.store) uniqueStores.add(item.store);
        });
        
        if (uniqueStores.size > 1) {
            // Itens de lojas diferentes - mostrar loja ao lado de cada item
            delivery.itensPedido.forEach((item) => {
                const storeText = item.store ? ` - ${item.store}` : '';
                message += `${item.text}${storeText}\n`;
            });
        } else {
            delivery.itensPedido.forEach((item) => {
                message += `${item.text}\n`;
            });
        }
    } else if (delivery.pedido) {
        message += `\n📦 Pedido:\n`;
        const lines = delivery.pedido.split('\n').filter(line => line.trim());
        lines.forEach((line, index) => {
            const cleanLine = line.replace(/^\d+[.)\-:]\s*/, '');
            message += `${cleanLine}\n`;
        });
    }
    
    if (delivery.retirada) {
        message += `\n📍 Retirada: ${delivery.retirada}\n`;
    }
    
    // Payment logic - generalized for PIX and Cartão
    let paymentText = delivery.pagamento;
    if (delivery.tipo !== 'mesa') {
        if (delivery.pagarNaEntrega) {
            paymentText = `${delivery.pagamento} (PAGAR NA ENTREGA)`;
        } else {
            paymentText = `${delivery.pagamento} (JÁ PAGO)`;
        }
    }
    
    message += `\n💰 Valor: R$ ${delivery.valor}\n`;
    message += `💳 Pagamento: ${paymentText}\n`;
    
    if (delivery.pagamento === 'Dinheiro' && delivery.pagarNaEntrega && delivery.precisaTroco) {
        message += `💵 Troco para: R$ ${delivery.valorTroco}\n`;
    }
    
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
    message += `🏠 Endereço: ${delivery.endereco || '[endereço]'}\n`;
    message += `📍 Referência: ${delivery.referencia || '[referência]'}\n`;
    
    // Google Maps link
    const includeMapsLink = document.getElementById('include-maps-link')?.checked ?? true;
    if (includeMapsLink && delivery.endereco) {
        const mapQuery = encodeURIComponent(delivery.endereco + ', Rio de Janeiro - RJ');
        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;
        message += `📍 Localização: ${mapsUrl}\n`;
    }
    
    // Generate formatted order items - com lógica de loja por item
    if (delivery.itensPedido && delivery.itensPedido.length > 0) {
        message += `\n📦 Pedido:\n`;
        
        // Verificar se há lojas diferentes
        const uniqueStores = new Set();
        delivery.itensPedido.forEach((item) => {
            if (item.store) uniqueStores.add(item.store);
        });
        
        if (uniqueStores.size > 1) {
            // Itens de lojas diferentes - mostrar loja ao lado de cada item
            delivery.itensPedido.forEach((item) => {
                const storeText = item.store ? ` - ${item.store}` : '';
                message += `${item.text}${storeText}\n`;
            });
        } else {
            delivery.itensPedido.forEach((item) => {
                message += `${item.text}\n`;
            });
        }
    } else if (delivery.pedido) {
        message += `\n📦 Pedido:\n${delivery.pedido}\n`;
    }
    
    if (delivery.retirada) {
        message += `\n📍 Retirada: ${delivery.retirada}\n`;
    }
    
    // Payment logic - generalized for PIX and Cartão
    let paymentText = delivery.pagamento;
    if (delivery.tipo !== 'mesa') {
        if (delivery.pagarNaEntrega) {
            paymentText = `${delivery.pagamento} (PAGAR NA ENTREGA)`;
        } else {
            paymentText = `${delivery.pagamento} (JÁ PAGO)`;
        }
    }
    
    message += `\n💰 Valor: R$ ${delivery.valor}\n`;
    message += `��� Pagamento: ${paymentText}\n`;
    
    if (delivery.pagamento === 'Dinheiro' && delivery.pagarNaEntrega && delivery.precisaTroco) {
        message += `💵 Troco para: R$ ${delivery.valorTroco}\n`;
    }
    
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
    
    // Send via WhatsApp
    const phone = delivery.telefone.replace(/\D/g, '');
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank');
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
        // Check if it's a bathgroom schedule or delivery
        const isBathgroom = bathgroomSchedules.some(s => s.id === currentDeliveryId);
        
        if (isBathgroom) {
            bathgroomSchedules = bathgroomSchedules.filter(s => s.id !== currentDeliveryId);
            localStorage.setItem('deliveryPets_bathgroom', JSON.stringify(bathgroomSchedules));
            renderBathgroomList();
            showToast('Agendamento excluído!', 'success');
        } else {
            deliveries = deliveries.filter(d => d.id !== currentDeliveryId);
            saveData();
            renderDeliveries();
            showToast('Entrega excluída', 'success');
        }
        currentDeliveryId = null;
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
            telefone: formatPhoneNumber(document.getElementById('edit-client-phone').value),
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
    setupPasswordInput();
    
    // Listen for changes in the description textarea to sync with orderItems
    const descriptionField = document.getElementById('order-description');
    if (descriptionField) {
        descriptionField.addEventListener('input', () => {
            // Parse items when user types in description textarea
            parseOrderItems();
        });
    }
    
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
        
        // Close BT client dropdown when clicking outside
        const btDropdown = document.getElementById('bt-client-dropdown');
        const btSearchInput = document.getElementById('bt-cliente-search');
        
        if (btSearchInput && btDropdown) {
            if (!btSearchInput.contains(e.target) && !btDropdown.contains(e.target)) {
                btDropdown.classList.add('hidden');
                btDropdown.style.display = 'none';
            }
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
  
  
// ========================================
   // Banho e Tosa Functions
   // ========================================

   function formatBTPhone(input) {
       let value = input.value.replace(/\D/g, '');
       
       if (value.length > 0) {
           if (value.length >= 2) {
               value = '(' + value;
               if (value.length > 3) {
                   value = value.substring(0, 3) + ') ' + value.substring(3);
               }
               if (value.length > 10) {
                   value = value.substring(0, 10) + '-' + value.substring(10);
               }
           }
       }
       
       input.value = value.substring(0, 15);
   }

   function formatBTCurrency(input) {
       let value = input.value.replace(/\D/g, '');
       
       if (value.length > 0) {
           value = (parseInt(value) / 100).toFixed(2);
           value = value.replace('.', ',');
       }
       
       input.value = value;
   }

   function formatBTTime(input) {
       let value = input.value.replace(/\D/g, '');
       
       if (value.length > 2) {
           value = value.substring(0, 2) + ':' + value.substring(2);
       }
       
       input.value = value.substring(0, 5);
   }

function toggleBTAddress() {
        const taxidog = document.getElementById('bt-taxidog').checked;
        const addressSection = document.getElementById('bt-address-section');
        
        if (taxidog) {
            addressSection.classList.remove('hidden');
        } else {
            addressSection.classList.add('hidden');
        }
    }

    // ========================================
    // Banho e Tosa - Busca de Clientes
    // ========================================

    function searchBTClient(query) {
        const dropdown = document.getElementById('bt-client-dropdown');
        
        if (!query || query.length < 2) {
            dropdown.classList.add('hidden');
            dropdown.style.display = 'none';
            return;
        }
        
        const lowerQuery = query.toLowerCase();
        const filtered = clients.filter(c => 
            c.nome.toLowerCase().includes(lowerQuery) ||
            (c.telefone && c.telefone.includes(query))
        );
        
        if (filtered.length === 0) {
            dropdown.innerHTML = '<div style="padding: 10px; color: var(--text-secondary);">Nenhum cliente encontrado</div>';
            dropdown.classList.remove('hidden');
            dropdown.style.display = 'block';
            return;
        }
        
        dropdown.innerHTML = filtered.map(client => `
            <div class="dropdown-item" onclick="selectBTClient('${client.id}')" 
                 style="padding: 10px; cursor: pointer; border-bottom: 1px solid var(--border-color);">
                <div style="font-weight: bold;">${client.nome}</div>
                <div style="font-size: 12px; color: var(--text-secondary);">${client.telefone || 'Sem telefone'}</div>
            </div>
        `).join('');
        
        dropdown.classList.remove('hidden');
        dropdown.style.display = 'block';
    }

    function selectBTClient(clientId) {
        const client = clients.find(c => c.id === clientId);
        if (!client) return;
        
        document.getElementById('bt-cliente').value = client.nome;
        document.getElementById('bt-cliente-search').value = client.nome;
        document.getElementById('bt-telefone').value = client.telefone || '';
        
        // Auto-fill pet data
        if (client.petNome) {
            document.getElementById('bt-pet-nome').value = client.petNome;
        }
        if (client.petRaca) {
            document.getElementById('bt-pet-raca').value = client.petRaca;
        }
        if (client.petPorte) {
            document.getElementById('bt-pet-porte').value = client.petPorte;
        }
        
        // Auto-fill address if has Taxidog
        if (client.endereco) {
            document.getElementById('bt-taxidog').checked = true;
            toggleBTAddress();
            document.getElementById('bt-endereco').value = client.endereco;
            document.getElementById('bt-referencia').value = client.pontoReferencia || '';
        }
        
        // Hide dropdown
        const dropdown = document.getElementById('bt-client-dropdown');
        dropdown.classList.add('hidden');
        dropdown.style.display = 'none';
        
        // Check save client by default since it's an existing client
        document.getElementById('bt-save-client').checked = true;
    }

    function saveBTClientData(cliente, telefone, petNome, petRaca, petPorte, endereco, referencia) {
        const existingIndex = clients.findIndex(c => c.nome.toLowerCase() === cliente.toLowerCase());
        
        if (existingIndex !== -1) {
            // Update existing client
            clients[existingIndex] = {
                ...clients[existingIndex],
                telefone: telefone,
                petNome: petNome,
                petRaca: petRaca,
                petPorte: petPorte,
                endereco: endereco,
                pontoReferencia: referencia
            };
        } else {
            // Create new client
            clients.push({
                id: generateId(),
                nome: cliente,
                telefone: telefone,
                petNome: petNome,
                petRaca: petRaca,
                petPorte: petPorte,
                endereco: endereco,
                pontoReferencia: referencia
            });
        }
        
        localStorage.setItem('deliveryPets_clients', JSON.stringify(clients));
    }

    function toggleBTAddress() {
       
       if (taxidog) {
           addressSection.classList.remove('hidden');
       } else {
           addressSection.classList.add('hidden');
       }
   }

   function copyBathgroomSchedule() {
       const cliente = document.getElementById('bt-cliente').value;
       const telefone = document.getElementById('bt-telefone').value;
       const petNome = document.getElementById('bt-pet-nome').value;
       const petRaca = document.getElementById('bt-pet-raca').value;
       const petPorte = document.getElementById('bt-pet-porte').value;
       const servico = document.getElementById('bt-servico').value;
       const taxidog = document.getElementById('bt-taxidog').checked;
       const endereco = document.getElementById('bt-endereco').value;
       const referencia = document.getElementById('bt-referencia').value;
       const valor = document.getElementById('bt-valor').value;
       const data = document.getElementById('bt-data').value;
       const horario = document.getElementById('bt-horario').value;
       const observacoes = document.getElementById('bt-observacoes').value;

       // Format date
       let dataFormatada = '';
       if (data) {
           const partes = data.split('-');
           dataFormatada = `${partes[2]}/${partes[1]}/${partes[0]}`;
       }

       // Format phone
       let telefoneFormatado = telefone;
       if (telefone) {
           telefoneFormatado = telefone;
       }

// Build message
        let message = '';
        message += `👤 Cliente: ${cliente || '[nome]'}\n`;
        message += `📞 Telefone: ${telefoneFormatado || '[telefone]'}\n`;
        
        message += `\n🚐 TaxiDog: ${taxidog ? 'Sim' : 'Não'}\n`;
        if (taxidog) {
            message += `🏠 Endereço: ${endereco || '[endereço]'}\n`;
            message += `📍 Ponto de Referência: ${referencia || '[referência]'}\n`;
            
            // Google Maps link - controlado pelo checkbox
            const includeMaps = document.getElementById('bt-include-maps')?.checked ?? true;
            if (includeMaps && endereco) {
                const mapQuery = encodeURIComponent(endereco + ', Rio de Janeiro - RJ');
                const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;
                message += `📍 Localização: ${mapsUrl}\n`;
            }
        }
        
        message += `\n🐶🐱 Pet:\n`;
        message += `\nNome: ${petNome || '[nome]'}\n`;
        message += `\nRaça: ${petRaca || '[raça]'}\n`;
        message += `\nPorte: ${petPorte || '[porte]'}\n`;
        message += `\n✂️ Serviço: ${servico || '[serviço]'}\n`;
        
        message += `\n💰 Valor: ${valor ? 'R$ ' + valor : 'R$ 0,00'}\n`;
        
        message += `\n📅 Data: ${dataFormatada || '[data]'}\n`;
        message += `⏰ Horário: ${horario || '[horário]'}\n`;
        
        message += `\n📝 Observações: ${observacoes || '-'}`;

copyToClipboard(message);
        showToast('Agendamento copiado!', 'success');
    }

    // ========================================
    // Banho e Tosa - Gerenciamento
    // ========================================

    function saveBathgroomSchedule() {
        const cliente = document.getElementById('bt-cliente').value;
        const telefone = document.getElementById('bt-telefone').value;
        const petNome = document.getElementById('bt-pet-nome').value;
        const petRaca = document.getElementById('bt-pet-raca').value;
        const petPorte = document.getElementById('bt-pet-porte').value;
        const servico = document.getElementById('bt-servico').value;
        const taxidog = document.getElementById('bt-taxidog').checked;
        const endereco = document.getElementById('bt-endereco').value;
        const referencia = document.getElementById('bt-referencia').value;
        const valor = document.getElementById('bt-valor').value;
        const data = document.getElementById('bt-data').value;
        const horario = document.getElementById('bt-horario').value;
        const observacoes = document.getElementById('bt-observacoes').value;
        
        if (!cliente || !petNome) {
            showToast('Preencha Cliente e Nome do Pet', 'error');
            return;
        }
        
        // Save/Update client data if checkbox is checked
        const saveClient = document.getElementById('bt-save-client')?.checked;
        if (saveClient) {
            saveBTClientData(
                cliente, 
                telefone, 
                petNome, 
                petRaca, 
                petPorte, 
                taxidog ? endereco : '', 
                taxidog ? referencia : ''
            );
        }
        
        const schedule = {
            id: generateId(),
            cliente,
            telefone,
            petNome,
            petRaca,
            petPorte,
            servico,
            taxidog,
            endereco,
            referencia,
            valor,
            data,
            horario,
            observacoes,
            createdAt: new Date().toISOString()
        };
        
        bathgroomSchedules.push(schedule);
        localStorage.setItem('deliveryPets_bathgroom', JSON.stringify(bathgroomSchedules));
        
        clearBathgroomForm();
        closeBathgroomModal();
        showToast('Agendamento salvo!', 'success');
    }

    function renderSchedulesList(filter = '') {
        const container = document.getElementById('schedules-list');
        const emptyState = document.getElementById('schedules-empty');
        
        let filtered = bathgroomSchedules;
        if (filter) {
            const lowerFilter = filter.toLowerCase();
            filtered = bathgroomSchedules.filter(s => 
                s.petNome?.toLowerCase().includes(lowerFilter) || 
                s.cliente?.toLowerCase().includes(lowerFilter)
            );
        }
        
        if (filtered.length === 0) {
            container.innerHTML = '';
            emptyState.classList.remove('hidden');
            return;
        }
        
        emptyState.classList.add('hidden');
        
        // Sort by date (most recent first)
        const sorted = [...filtered].reverse();
        
        container.innerHTML = sorted.map(schedule => {
            return `
                <div class="delivery-card" onclick="copyBathgroomMessage('${schedule.id}')">
                    <div class="card-header">
                        <div class="card-header-left">
                            <span class="card-client">${schedule.petNome}</span>
                        </div>
                        <span class="card-value">${schedule.horario || '-'}</span>
                    </div>
                    <div class="card-address">
                        ${schedule.servico || 'Serviço não especificado'}
                    </div>
                    <div class="card-address">
                        👤 ${schedule.cliente} ${schedule.telefone ? '- ' + schedule.telefone : ''}
                    </div>
                    <div class="card-address">
                        ${schedule.data ? '📅 ' + formatDateBR(schedule.data) : ''}
                    </div>
                    <div class="card-actions" onclick="event.stopPropagation()">
                        <button class="card-action-btn" onclick="copyBathgroomMessage('${schedule.id}')">📋</button>
                        <button class="card-action-btn" onclick="editBathgroomScheduleFromList('${schedule.id}')">✏️</button>
                        <button class="card-action-btn delete" onclick="confirmDeleteBathgroom('${schedule.id}')">🗑️</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    function filterSchedules(query) {
        renderSchedulesList(query);
    }

    function editBathgroomScheduleFromList(scheduleId) {
        editBathgroomSchedule(scheduleId);
        navigateTo('bathgroom');
    }

    function copyBathgroomMessage(scheduleId) {
        const schedule = bathgroomSchedules.find(s => s.id === scheduleId);
        if (!schedule) return;
        
        const message = generateBathgroomMessage(schedule);
        copyToClipboard(message);
        showToast('Agendamento copiado!', 'success');
    }

    function generateBathgroomMessage(schedule) {
        const telefoneFormatado = schedule.telefone || '[telefone]';
        
        let message = '';
        message += `👤 Cliente: ${schedule.cliente || '[nome]'}\n`;
        message += `📞 Telefone: ${telefoneFormatado}\n`;
        
        message += `\n🚐 TaxiDog: ${schedule.taxidog ? 'Sim' : 'Não'}\n`;
        if (schedule.taxidog) {
            message += `🏠 Endereço: ${schedule.endereco || '[endereço]'}\n`;
            message += `📍 Ponto de Referência: ${schedule.referencia || '[referência]'}\n`;
            
            const includeMaps = document.getElementById('bt-include-maps')?.checked ?? true;
            if (includeMaps && schedule.endereco) {
                const mapQuery = encodeURIComponent(schedule.endereco + ', Rio de Janeiro - RJ');
                const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;
                message += `📍 Localização: ${mapsUrl}\n`;
            }
        }
        
        message += `\n🐶🐱 Pet:\n`;
        message += `\nNome: ${schedule.petNome || '[nome]'}\n`;
        message += `\nRaça: ${schedule.petRaca || '[raça]'}\n`;
        message += `\nPorte: ${schedule.petPorte || '[porte]'}\n`;
        message += `\n✂️ Serviço: ${schedule.servico || '[serviço]'}\n`;
        
        message += `\n💰 Valor: ${schedule.valor ? 'R$ ' + schedule.valor : 'R$ 0,00'}\n`;
        
        const dataFormatada = schedule.data ? formatDateBR(schedule.data) : '[data]';
        message += `\n📅 Data: ${dataFormatada}\n`;
        message += `⏰ Horário: ${schedule.horario || '[horário]'}\n`;
        
        message += `\n📝 Observações: ${schedule.observacoes || '-'}`;
        
        return message;
    }

    function editBathgroomSchedule(scheduleId) {
        const schedule = bathgroomSchedules.find(s => s.id === scheduleId);
        if (!schedule) return;
        
        document.getElementById('bt-cliente').value = schedule.cliente || '';
        document.getElementById('bt-telefone').value = schedule.telefone || '';
        document.getElementById('bt-pet-nome').value = schedule.petNome || '';
        document.getElementById('bt-pet-raca').value = schedule.petRaca || '';
        document.getElementById('bt-pet-porte').value = schedule.petPorte || '';
        document.getElementById('bt-servico').value = schedule.servico || '';
        document.getElementById('bt-taxidog').checked = schedule.taxidog || false;
        
        toggleBTAddress();
        
        document.getElementById('bt-endereco').value = schedule.endereco || '';
        document.getElementById('bt-referencia').value = schedule.referencia || '';
        document.getElementById('bt-valor').value = schedule.valor || '';
        document.getElementById('bt-data').value = schedule.data || '';
        document.getElementById('bt-horario').value = schedule.horario || '';
        document.getElementById('bt-observacoes').value = schedule.observacoes || '';
        
        document.getElementById('bathgroom-form-title').textContent = '✂️ Editar Agendamento';
        document.getElementById('bathgroom-modal').classList.remove('hidden');
    }

    function confirmDeleteBathgroom(scheduleId) {
        currentDeliveryId = scheduleId;
        document.getElementById('confirm-dialog').classList.remove('hidden');
    }

    function deleteBathgroomSchedule() {
        if (currentDeliveryId) {
            bathgroomSchedules = bathgroomSchedules.filter(s => s.id !== currentDeliveryId);
            localStorage.setItem('deliveryPets_bathgroom', JSON.stringify(bathgroomSchedules));
            renderBathgroomList();
            currentDeliveryId = null;
            showToast('Agendamento excluído!', 'success');
        }
        document.getElementById('confirm-dialog').classList.add('hidden');
    }

    function clearBathgroomForm() {
        const el = (id) => document.getElementById(id);
        
        if (el('bt-cliente')) el('bt-cliente').value = '';
        if (el('bt-cliente-search')) el('bt-cliente-search').value = '';
        if (el('bt-telefone')) el('bt-telefone').value = '';
        if (el('bt-pet-nome')) el('bt-pet-nome').value = '';
        if (el('bt-pet-raca')) el('bt-pet-raca').value = '';
        if (el('bt-pet-porte')) el('bt-pet-porte').value = '';
        if (el('bt-servico')) el('bt-servico').value = '';
        if (el('bt-taxidog')) el('bt-taxidog').checked = false;
        if (el('bt-endereco')) el('bt-endereco').value = '';
        if (el('bt-referencia')) el('bt-referencia').value = '';
        if (el('bt-valor')) el('bt-valor').value = '';
        if (el('bt-data')) el('bt-data').value = '';
        if (el('bt-horario')) el('bt-horario').value = '';
        if (el('bt-observacoes')) el('bt-observacoes').value = '';
        if (el('bt-save-client')) el('bt-save-client').checked = false;
        
        // Toggle address section if exists
        const addressSection = document.getElementById('bt-address-section');
        if (addressSection) {
            addressSection.classList.add('hidden');
        }
    }

    function showBathgroomForm() {
        console.log('Abrindo formulário...');
        clearBathgroomForm();
        document.getElementById('bathgroom-form-title').textContent = '✂️ Novo Agendamento';
        
        const modal = document.getElementById('bathgroom-modal');
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
        modal.style.zIndex = '9999';
    }

    function closeBathgroomModal() {
        console.log('Fechando formulário...');
        const modal = document.getElementById('bathgroom-modal');
        modal.classList.add('hidden');
        modal.style.display = 'none';
        renderBathgroomList();
    }

    function renderBathgroomList() {
        const container = document.getElementById('bathgroom-list');
        const emptyState = document.getElementById('bathgroom-empty');
        
        if (bathgroomSchedules.length === 0) {
            container.innerHTML = '';
            emptyState.classList.remove('hidden');
            return;
        }
        
        emptyState.classList.add('hidden');
        
        const sorted = [...bathgroomSchedules].reverse();
        
        container.innerHTML = sorted.map(schedule => {
            return `
                <div class="delivery-card" onclick="copyBathgroomMessage('${schedule.id}')">
                    <div class="card-header">
                        <div class="card-header-left">
                            <span class="card-client">${schedule.petNome}</span>
                        </div>
                        <span class="card-value">${schedule.horario || '-'}</span>
                    </div>
                    <div class="card-address">
                        ${schedule.servico || 'Serviço não especificado'}
                    </div>
                    <div class="card-address">
                        👤 ${schedule.cliente} ${schedule.data ? '- ' + formatDateBR(schedule.data) : ''}
                    </div>
                    <div class="card-actions" onclick="event.stopPropagation()">
                        <button class="card-action-btn" onclick="copyBathgroomMessage('${schedule.id}')">📋</button>
                        <button class="card-action-btn" onclick="editBathgroomSchedule('${schedule.id}')">✏️</button>
                        <button class="card-action-btn delete" onclick="confirmDeleteBathgroom('${schedule.id}')">🗑️</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    function formatDateBR(dateStr) {
        if (!dateStr) return '';
        const partes = dateStr.split('-');
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }

    // Validity Functions
