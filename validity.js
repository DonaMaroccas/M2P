// ========================================
// Validity Management
// ========================================

function showAddValidityModal() {
    document.getElementById('validity-modal-title').textContent = 'Adicionar Item';
    document.getElementById('validity-form').reset();
    document.getElementById('validity-item-id').value = '';
    document.getElementById('validity-parent-id').value = '';
    
    document.getElementById('expiration-dates-section').style.display = 'block';
    document.getElementById('existing-dates-section').classList.add('hidden');
    document.getElementById('same-validity-group').classList.add('hidden');
    document.getElementById('single-date-section').classList.remove('hidden');
    document.getElementById('multiple-dates-section').classList.add('hidden');
    
    // Add listener for checkbox
    const sameValidityCheckbox = document.getElementById('same-validity');
    if (sameValidityCheckbox) {
        sameValidityCheckbox.onchange = function() {
            onQuantityChange();
        };
    }
    
    populateValidityDatalists();
    
    document.getElementById('validity-modal').classList.remove('hidden');
}

function closeValidityModal() {
    document.getElementById('validity-modal').classList.add('hidden');
}

function populateValidityDatalists() {
    // Populate category datalist
    const categoryDatalist = document.getElementById('category-list');
    categoryDatalist.innerHTML = validityData.categories.map(c => 
        '<option value="' + c.name + '">'
    ).join('');
    
    // Populate product datalist (based on selected category)
    updateProductDatalist();
}

function updateProductDatalist() {
    const categoryInput = document.getElementById('validity-category').value;
    const productDatalist = document.getElementById('product-list');
    const variationDatalist = document.getElementById('variation-list');
    
    // Clear downstream lists
    productDatalist.innerHTML = '';
    variationDatalist.innerHTML = '';
    
    if (categoryInput) {
        const category = validityData.categories.find(c => c.name.toLowerCase() === categoryInput.toLowerCase());
        if (category && category.products) {
            productDatalist.innerHTML = category.products.map(p => 
                '<option value="' + p.name + '">'
            ).join('');
        }
    }
}

function updateVariationDatalist() {
    const categoryInput = document.getElementById('validity-category').value;
    const productInput = document.getElementById('validity-product').value;
    const variationDatalist = document.getElementById('variation-list');
    
    variationDatalist.innerHTML = '';
    
    if (categoryInput && productInput) {
        const category = validityData.categories.find(c => c.name.toLowerCase() === categoryInput.toLowerCase());
        if (category && category.products) {
            const product = category.products.find(p => p.name.toLowerCase() === productInput.toLowerCase());
            if (product && product.variations) {
                variationDatalist.innerHTML = product.variations.map(v => 
                    '<option value="' + v.name + '">'
                ).join('');
                
                // Show existing dates if variation exists
                if (product.variations.some(v => v.name.toLowerCase() === productInput.toLowerCase())) {
                    // Variation exists, check if selected variation has dates
                    const variation = product.variations.find(v => v.name.toLowerCase() === productInput.toLowerCase());
                    if (variation && variation.dates && variation.dates.length > 0) {
                        renderExistingDates(variation.dates);
                        document.getElementById('existing-dates-section').classList.remove('hidden');
                    }
                }
            }
        }
    }
}

function onCategoryInput() {
    updateProductDatalist();
    // Clear downstream fields
    document.getElementById('validity-product').value = '';
    document.getElementById('validity-variation').value = '';
    document.getElementById('existing-dates-section').classList.add('hidden');
}

function onProductInput() {
    updateVariationDatalist();
    document.getElementById('validity-variation').value = '';
}

function onVariationInput() {
    // Check if variation exists and show dates
    const categoryInput = document.getElementById('validity-category').value;
    const productInput = document.getElementById('validity-product').value;
    const variationInput = document.getElementById('validity-variation').value;
    
    if (categoryInput && productInput && variationInput) {
        const category = validityData.categories.find(c => c.name.toLowerCase() === categoryInput.toLowerCase());
        if (category && category.products) {
            const product = category.products.find(p => p.name.toLowerCase() === productInput.toLowerCase());
            if (product && product.variations) {
                const variation = product.variations.find(v => v.name.toLowerCase() === variationInput.toLowerCase());
                if (variation && variation.dates && variation.dates.length > 0) {
                    renderExistingDates(variation.dates);
                    document.getElementById('existing-dates-section').classList.remove('hidden');
                } else {
                    document.getElementById('existing-dates-section').classList.add('hidden');
                }
            }
        }
    }
}

function onQuantityChange() {
    const quantity = parseInt(document.getElementById('validity-quantity').value) || 1;
    const sameValidityGroup = document.getElementById('same-validity-group');
    const singleDateSection = document.getElementById('single-date-section');
    const multipleDatesSection = document.getElementById('multiple-dates-section');
    
    if (quantity > 1) {
        sameValidityGroup.classList.remove('hidden');
        
        const sameValidity = document.getElementById('same-validity').checked;
        if (sameValidity) {
            singleDateSection.classList.remove('hidden');
            multipleDatesSection.classList.add('hidden');
        } else {
            singleDateSection.classList.add('hidden');
            multipleDatesSection.classList.remove('hidden');
            // Generate date fields for each unit
            generateMultipleDateFields(quantity);
        }
    } else {
        sameValidityGroup.classList.add('hidden');
        singleDateSection.classList.remove('hidden');
        multipleDatesSection.classList.add('hidden');
    }
}

function generateMultipleDateFields(quantity) {
    const container = document.getElementById('multiple-dates-list');
    let html = '';
    
    for (let i = 1; i <= quantity; i++) {
        html += '<div class="form-group multi-date-field">';
        html += '<label>Unidade ' + i + '</label>';
        html += '<input type="date" class="input-field multi-date-input" required>';
        html += '</div>';
    }
    
    container.innerHTML = html;
}

function addMoreDateFields() {
    const container = document.getElementById('multiple-dates-list');
    const currentFields = container.querySelectorAll('.multi-date-field').length;
    const newIndex = currentFields + 1;
    
    const html = '<div class="form-group multi-date-field">';
    html += '<label>Unidade ' + newIndex + '</label>';
    html += '<input type="date" class="input-field multi-date-input" required>';
    html += '</div>';
    
    container.insertAdjacentHTML('beforeend', html);
}

function renderExistingDates(dates) {
    const container = document.getElementById('existing-dates-list');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    container.innerHTML = dates.map(d => {
        const expDate = new Date(d.date);
        expDate.setHours(0, 0, 0, 0);
        const daysLeft = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
        
        let statusClass = 'status-ok';
        let statusText = daysLeft + ' dias';
        
        if (daysLeft < 0) {
            statusClass = 'status-expired';
            statusText = 'Vencido';
        } else if (daysLeft <= 30) {
            statusClass = 'status-warning';
            statusText = daysLeft + ' dias';
        }
        
        return `
            <div class="existing-date-item">
                <span class="date-text">${formatDate(d.date)}</span>
                <span class="date-qty">${d.quantity} un</span>
                <span class="date-status ${statusClass}">${statusText}</span>
                <button type="button" class="btn-remove-date" onclick="removeValidityDate('${d.id}')">×</button>
            </div>
        `;
    }).join('');
}

function saveValidityItem(event) {
    event.preventDefault();
    
    const categoryName = document.getElementById('validity-category').value.trim();
    const productName = document.getElementById('validity-product').value.trim();
    const variationName = document.getElementById('validity-variation').value.trim();
    const quantity = parseInt(document.getElementById('validity-quantity').value) || 1;
    const sameValidity = document.getElementById('same-validity') ? document.getElementById('same-validity').checked : true;
    
    if (!categoryName) {
        showToast('Digite uma categoria', 'error');
        return;
    }
    
    if (!productName) {
        showToast('Digite um produto', 'error');
        return;
    }
    
    if (!variationName) {
        showToast('Digite uma variação', 'error');
        return;
    }
    
    // Find or create category (case-insensitive)
    let category = validityData.categories.find(c => c.name.toLowerCase() === categoryName.toLowerCase());
    if (!category) {
        category = {
            id: generateId(),
            name: categoryName,
            products: []
        };
        validityData.categories.push(category);
    }
    
    // Find or create product (case-insensitive)
    let product = category.products.find(p => p.name.toLowerCase() === productName.toLowerCase());
    if (!product) {
        product = {
            id: generateId(),
            name: productName,
            variations: []
        };
        category.products.push(product);
    }
    
    // Find or create variation (case-insensitive)
    let variation = product.variations.find(v => v.name.toLowerCase() === variationName.toLowerCase());
    if (!variation) {
        variation = {
            id: generateId(),
            name: variationName,
            dates: []
        };
        product.variations.push(variation);
    }
    
    // Add dates based on selection
    if (sameValidity || quantity === 1) {
        // All units have the same validity
        const validityDate = document.getElementById('validity-date').value;
        if (validityDate) {
            variation.dates.push({
                id: generateId(),
                date: validityDate,
                quantity: quantity
            });
        }
    } else {
        // Each unit has different validity
        const dateInputs = document.querySelectorAll('.multi-date-input');
        dateInputs.forEach(input => {
            if (input.value) {
                variation.dates.push({
                    id: generateId(),
                    date: input.value,
                    quantity: 1
                });
            }
        });
    }
    
    // Save to localStorage
    localStorage.setItem('deliveryPets_validity', JSON.stringify(validityData));
    
    showToast('Item salvo com sucesso!', 'success');
    closeValidityModal();
    renderValidityList();
    renderHomeAlerts();
}

function renderValidityList() {
    const container = document.getElementById('validity-list');
    const emptyState = document.getElementById('validity-empty');
    
    // Check if there are any items
    const hasItems = validityData.categories.some(c => 
        c.products && c.products.some(p => 
            p.variations && p.variations.some(v => v.dates && v.dates.length > 0)
        )
    );
    
    if (!hasItems) {
        container.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }
    
    emptyState.classList.add('hidden');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    container.innerHTML = validityData.categories.map(category => {
        // Filter products that have at least one variation with dates
        const productsWithDates = (category.products || []).filter(p => 
            p.variations && p.variations.some(v => v.dates && v.dates.length > 0)
        );
        
        if (productsWithDates.length === 0) return '';
        
        return `
            <div class="validity-category">
                <div class="validity-category-header" onclick="toggleValidityCategory('${category.id}')">
                    <span class="validity-category-icon">📁</span>
                    <span class="validity-category-name">${category.name}</span>
                    <span class="validity-toggle">▼</span>
                </div>
                <div id="validity-category-${category.id}" class="validity-category-content">
                    ${productsWithDates.map(product => renderValidityProduct(product, today)).join('')}
                </div>
            </div>
        `;
    }).join('');
}

function renderValidityProduct(product, today) {
    return `
        <div class="validity-product">
            <div class="validity-product-header" onclick="toggleValidityProduct('${product.id}')">
                <span class="validity-product-name">${product.name}</span>
                <span class="validity-toggle">▼</span>
            </div>
            <div id="validity-product-${product.id}" class="validity-product-content">
                ${(product.variations || []).map(variation => renderValidityVariation(variation, today)).join('')}
            </div>
        </div>
    `;
}

function renderValidityVariation(variation, today) {
    if (!variation.dates || variation.dates.length === 0) return '';
    
    // Calculate total quantity and find earliest expiration
    let totalQty = 0;
    let earliestDate = null;
    
    variation.dates.forEach(d => {
        totalQty += d.quantity;
        if (!earliestDate || new Date(d.date) < earliestDate) {
            earliestDate = new Date(d.date);
        }
    });
    
    const daysLeft = earliestDate ? Math.ceil((earliestDate - today) / (1000 * 60 * 60 * 24)) : 0;
    
    let statusClass = 'status-ok';
    let statusText = daysLeft + ' dias';
    
    if (daysLeft < 0) {
        statusClass = 'status-expired';
        statusText = 'Vencido';
    } else if (daysLeft <= 30) {
        statusClass = 'status-warning';
        statusText = daysLeft + ' dias';
    }
    
    return `
        <div class="validity-variation">
            <div class="variation-header" onclick="toggleValidityVariation('${variation.id}')">
                <span class="variation-name">${variation.name}</span>
                <span class="variation-qty">${totalQty} un</span>
                <span class="variation-status ${statusClass}">${statusText}</span>
                <span class="validity-toggle">▼</span>
            </div>
            <div id="validity-variation-${variation.id}" class="variation-content hidden">
                ${variation.dates.map(d => {
                    const expDate = new Date(d.date);
                    expDate.setHours(0, 0, 0, 0);
                    const itemDaysLeft = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
                    
                    let itemStatusClass = 'status-ok';
                    let itemStatusText = itemDaysLeft + ' dias';
                    
                    if (itemDaysLeft < 0) {
                        itemStatusClass = 'status-expired';
                        itemStatusText = 'Vencido';
                    } else if (itemDaysLeft <= 30) {
                        itemStatusClass = 'status-warning';
                        itemStatusText = itemDaysLeft + ' dias';
                    }
                    
                    return `
                        <div class="variation-date-item">
                            <span class="date-label">${formatDate(d.date)}</span>
                            <span class="date-qty">${d.quantity} un</span>
                            <span class="date-status ${itemStatusClass}">${itemStatusText}</span>
                            <button type="button" class="btn-remove-date" onclick="deleteValidityDate('${d.id}')">🗑️</button>
                        </div>
                    `;
                }).join('')}
                <button type="button" class="btn btn-primary btn-small" onclick="addValidityDate('${variation.id}')">
                    ➕ Adicionar Data
                </button>
            </div>
        </div>
    `;
}

function toggleValidityCategory(categoryId) {
    const content = document.getElementById('validity-category-' + categoryId);
    const header = content.previousElementSibling;
    const toggle = header.querySelector('.validity-toggle');
    
    if (content.classList.contains('hidden')) {
        content.classList.remove('hidden');
        toggle.textContent = '▼';
    } else {
        content.classList.add('hidden');
        toggle.textContent = '▶';
    }
}

function toggleValidityProduct(productId) {
    const content = document.getElementById('validity-product-' + productId);
    const header = content.previousElementSibling;
    const toggle = header.querySelector('.validity-toggle');
    
    if (content.classList.contains('hidden')) {
        content.classList.remove('hidden');
        toggle.textContent = '▼';
    } else {
        content.classList.add('hidden');
        toggle.textContent = '▶';
    }
}

function toggleValidityVariation(variationId) {
    const content = document.getElementById('validity-variation-' + variationId);
    const header = content.previousElementSibling;
    const toggle = header.querySelector('.validity-toggle');
    
    if (content.classList.contains('hidden')) {
        content.classList.remove('hidden');
        toggle.textContent = '▼';
    } else {
        content.classList.add('hidden');
        toggle.textContent = '▶';
    }
}

function addValidityDate(variationId) {
    // Find the variation and add a date
    for (const category of validityData.categories) {
        for (const product of (category.products || [])) {
            const variation = (product.variations || []).find(v => v.id === variationId);
            if (variation) {
                const date = prompt('Data de validade (YYYY-MM-DD):');
                const qty = prompt('Quantidade:');
                if (date && qty) {
                    variation.dates.push({
                        id: generateId(),
                        date: date,
                        quantity: parseInt(qty) || 1
                    });
                    localStorage.setItem('deliveryPets_validity', JSON.stringify(validityData));
                    renderValidityList();
                }
                return;
            }
        }
    }
}

function deleteValidityDate(dateId) {
    if (!confirm('Excluir esta data de validade?')) return;
    
    for (const category of validityData.categories) {
        for (const product of (category.products || [])) {
            for (const variation of (product.variations || [])) {
                const index = variation.dates.findIndex(d => d.id === dateId);
                if (index !== -1) {
                    variation.dates.splice(index, 1);
                    localStorage.setItem('deliveryPets_validity', JSON.stringify(validityData));
                    renderValidityList();
                    return;
                }
            }
        }
    }
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR');
}

// ========================================
// Home Screen Alerts
// ========================================

function getExpiringItems(days) {
    if (days === undefined) days = 30;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + days);
    
    const expiringItems = [];
    
    for (const category of validityData.categories) {
        for (const product of (category.products || [])) {
            for (const variation of (product.variations || [])) {
                for (const dateItem of (variation.dates || [])) {
                    const expDate = new Date(dateItem.date);
                    expDate.setHours(0, 0, 0, 0);
                    
                    if (expDate <= futureDate && expDate >= today) {
                        expiringItems.push({
                            category: category.name,
                            product: product.name,
                            variation: variation.name,
                            date: dateItem.date,
                            quantity: dateItem.quantity,
                            daysLeft: Math.ceil((expDate - today) / (1000 * 60 * 60 * 24))
                        });
                    } else if (expDate < today) {
                        expiringItems.push({
                            category: category.name,
                            product: product.name,
                            variation: variation.name,
                            date: dateItem.date,
                            quantity: dateItem.quantity,
                            daysLeft: -1 // Expired
                        });
                    }
                }
            }
        }
    }
    
    return expiringItems.sort(function(a, b) { return a.daysLeft - b.daysLeft; });
}

function renderHomeAlerts() {
    const expiringItems = getExpiringItems(30);
    const alertContainer = document.getElementById('home-alerts');
    
    if (!alertContainer) return;
    
    if (expiringItems.length === 0) {
        alertContainer.innerHTML = '';
        return;
    }
    
    alertContainer.innerHTML = `
        <div class="home-alerts-section">
            <div class="alerts-header">
                <span>⚠️ Itens vencendo em 30 dias</span>
                <span class="alert-count">${expiringItems.length}</span>
            </div>
            ${expiringItems.slice(0, 5).map(item => {
                const statusClass = item.daysLeft < 0 ? 'alert-expired' : 'alert-warning';
                const statusText = item.daysLeft < 0 ? 'Vencido' : item.daysLeft + 'd';
                return `
                    <div class="alert-item">
                        <span class="alert-product">${item.product} (${item.variation})</span>
                        <span class="alert-qty">${item.quantity} un</span>
                        <span class="alert-status ${statusClass}">${statusText}</span>
                    </div>
                `;
            }).join('')}
            ${expiringItems.length > 5 ? '<div class="alert-more">+' + (expiringItems.length - 5) + ' mais...</div>' : ''}
        </div>
    `;
}

// Initialize home alerts on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderHomeAlerts);
} else {
    renderHomeAlerts();
}
