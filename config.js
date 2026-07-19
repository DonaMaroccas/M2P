/* ========================================
   Delivery Pets - Configuration
   ======================================== */

// Centralized store configuration
// Edit only this file to change store names
const STORE_CONFIG = {
    stores: [
        { id: 'marcao', name: 'Marcão' },
        { id: 'chc', name: 'CHC' },
        { id: 'ruah', name: 'Rua H' },
        { id: 'lagoas', name: 'Lagoas' },
        { id: 'cdd', name: 'CDD' },
        { id: 'favelao', name: 'Favelão' }
    ],
    
    // Helper function to get store IDs array
    getStoreIds: function() {
        return this.stores.map(store => store.id);
    },
    
    // Helper function to get store name by ID
    getStoreName: function(storeId) {
        const store = this.stores.find(s => s.id === storeId);
        return store ? store.name : storeId;
    },
    
    // Helper function to create storeNames object (for backward compatibility)
    getStoreNamesObject: function() {
        const storeNames = {};
        this.stores.forEach(store => {
            storeNames[store.id] = store.name;
        });
        return storeNames;
    }
};

// Clear old localStorage store data on load (run once)
// This ensures the system uses config.js stores instead of cached ones
function clearOldStoreCache() {
    if (localStorage.getItem('deliveryPets_stores')) {
        localStorage.removeItem('deliveryPets_stores');
        console.log('Old store cache cleared. Using config.js stores.');
    }
}

// Phone formatting utility - ensures consistent format (XX) 9XXXX-XXXX
function formatPhoneNumber(phone) {
    if (!phone) return '';
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 11) {
        return digits.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
    }
    return phone; // Return original if not 11 digits
}
