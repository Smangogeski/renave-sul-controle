/**
 * Store logic for Renave Sul - Cloud Version (Final Sync Fix)
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
        TRANSACTIONS: 'renave_v2_transactions',
        SETTINGS: 'renave_v2_settings'
    },

    data: {},
    initPromise: null,

    init() {
        if (this.initPromise) return this.initPromise;
        
        this.initPromise = new Promise(async (resolve) => {
            console.log('☁️ Iniciando sincronização Cloud...');
            if (!supabase) {
                console.error('Supabase não encontrado.');
                return resolve();
            }

            try {
                const [tasks, clients, regs, trans] = await Promise.all([
                    supabase.from('tasks').select('*'),
                    supabase.from('clients').select('*'),
                    supabase.from('registrations').select('*'),
                    supabase.from('transactions').select('*')
                ]);

                this.data[this.KEYS.TASKS] = tasks.data || [];
                this.data[this.KEYS.CLIENTS] = clients.data || [];
                this.data[this.KEYS.REGISTRATIONS] = regs.data || [];
                this.data[this.KEYS.TRANSACTIONS] = trans.data || [];
                this.data[this.KEYS.APPOINTMENTS] = [];

                console.log('✅ Sincronização concluída.');
            } catch (e) {
                console.error('Erro na sincronização:', e);
            }
            resolve();
        });

        return this.initPromise;
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
        if (index !== -1) {
            this.data[key][index] = { ...this.data[key][index], ...updates };
        }
    },

    async deleteItem(key, id) {
        const table = key.replace('renave_v2_', '');
        await supabase.from(table).delete().eq('id', id);
        this.data[key] = this.data[key].filter(i => i.id !== id);
    }
};

// Iniciar conexão imediatamente
Store.init();
