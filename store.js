/**
 * Store logic for Renave Sul - Cloud Version (Versão Boa)
 */
const SUPABASE_CONFIG = {
    url: 'https://vlvngvhrfydtejbjfbrn.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsdm5ndmhyZnlkdGVqYmpmYnJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3MzcwMDUsImV4cCI6MjA5MzMxMzAwNX0.DpbF_oC0xne36qc4t_XZ8WfMuOfjK9vqRL_65DVcMOE'
};

const supabase = window.supabase ? window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.key) : null;

const Store = {
    KEYS: {
        TASKS: 'renave_v2_tasks',
        CLIENTS: 'renave_v2_clients',
        APPOINTMENTS: 'renave_v2_appointments',
        REGISTRATIONS: 'renave_v2_registrations',
        TRANSACTIONS: 'renave_v2_transactions'
    },

    data: {},

    async init() {
        if (!supabase) return;
        try {
            const results = await Promise.all([
                supabase.from('tasks').select('*'),
                supabase.from('clients').select('*'),
                supabase.from('registrations').select('*'),
                supabase.from('transactions').select('*')
            ]);

            this.data[this.KEYS.TASKS] = results[0].data || [];
            this.data[this.KEYS.CLIENTS] = results[1].data || [];
            this.data[this.KEYS.REGISTRATIONS] = results[2].data || [];
            this.data[this.KEYS.TRANSACTIONS] = results[3].data || [];
            this.data[this.KEYS.APPOINTMENTS] = [];

            console.log('✅ Cloud Sincronizado.');
            if (window.App && window.App.render) window.App.render();
        } catch (e) { console.error(e); }
    },

    get(key) { return this.data[key] || []; },
    save(key, data) { this.data[key] = data; },

    async addItem(key, item) {
        const table = key.replace('renave_v2_', '');
        const { data } = await supabase.from(table).insert([item]).select();
        if (data) {
            if (!this.data[key]) this.data[key] = [];
            this.data[key].push(data[0]);
            return data[0];
        }
        return item;
    },

    async updateItem(key, id, updates) {
        const table = key.replace('renave_v2_', '');
        await supabase.from(table).update(updates).eq('id', id);
        const index = this.data[key].findIndex(i => i.id === id);
        if (index !== -1) this.data[key][index] = { ...this.data[table][index], ...updates };
    },

    async deleteItem(key, id) {
        const table = key.replace('renave_v2_', '');
        await supabase.from(table).delete().eq('id', id);
        this.data[key] = this.data[key].filter(i => i.id !== id);
    }
};

Store.init();
