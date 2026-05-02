/**
 * Store logic for Renave Sul
 * Handles persistence with localStorage
 */
const Store = {
    KEYS: {
        TASKS: 'renave_v2_tasks',
        CLIENTS: 'renave_v2_clients',
        APPOINTMENTS: 'renave_v2_appointments',
        REGISTRATIONS: 'renave_v2_registrations',
        TRANSACTIONS: 'renave_v2_transactions',
        SETTINGS: 'renave_v2_settings'
    },

    // Initialize with empty data
    init() {
        // Se quiser forçar a limpeza dos dados fictícios antigos, descomente a linha abaixo uma vez:
        // localStorage.clear(); 

        if (!localStorage.getItem(this.KEYS.TASKS)) {
            this.save(this.KEYS.TASKS, []);
        }
        if (!localStorage.getItem(this.KEYS.CLIENTS)) {
            this.save(this.KEYS.CLIENTS, []);
        }
        if (!localStorage.getItem(this.KEYS.APPOINTMENTS)) {
            this.save(this.KEYS.APPOINTMENTS, []);
        }
        if (!localStorage.getItem(this.KEYS.TRANSACTIONS)) {
            this.save(this.KEYS.TRANSACTIONS, []);
        }
        if (!localStorage.getItem(this.KEYS.REGISTRATIONS)) {
            this.save(this.KEYS.REGISTRATIONS, []);
        }
    },

    get(key) {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    },

    save(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    },

    addItem(key, item) {
        const data = this.get(key);
        item.id = Date.now();
        data.push(item);
        this.save(key, data);
        return item;
    },

    updateItem(key, id, updates) {
        let data = this.get(key);
        data = data.map(item => item.id === id ? { ...item, ...updates } : item);
        this.save(key, data);
    },

    deleteItem(key, id) {
        let data = this.get(key);
        data = data.filter(item => item.id !== id);
        this.save(key, data);
    }
};

Store.init();
