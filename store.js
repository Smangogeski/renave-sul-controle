/**
 * Store logic for Renave Sul - Cloud Version (Resilient)
 */
const SUPABASE_CONFIG = {
    url: 'https://vlvngvhrfydtejbjfbrn.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsdm5ndmhyZnlkdGVqYmpmYnJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3MzcwMDUsImV4cCI6MjA5MzMxMzAwNX0.DpbF_oC0xne36qc4t_XZ8WfMuOfjK9vqRL_65DVcMOE'
};

let supabase = null;

const Store = {
    KEYS: {
        TASKS: 'renave_v2_tasks',
        CLIENTS: 'renave_v2_clients',
        APPOINTMENTS: 'renave_v2_appointments',
        REGISTRATIONS: 'renave_v2_registrations',
        TRANSACTIONS: 'renave_v2_transactions'
    },

    data: {
        tasks: [],
        clients: [],
        appointments: [],
        registrations: [],
        transactions: []
    },

    async init() {
        console.log('☁️ Conectando ao Renave Sul Cloud...');
        
        // Tentar obter o cliente Supabase
        const lib = window.supabase || (window.supabaseJS ? window.supabaseJS : null);
        if (!lib) {
            console.error('❌ Erro: Biblioteca Supabase não carregada. Verifique sua internet.');
            return;
        }

        supabase = lib.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.key);

        try {
            const results = await Promise.all([
                supabase.from('tasks').select('*'),
                supabase.from('clients').select('*'),
                supabase.from('registrations').select('*'),
                supabase.from('transactions').select('*')
            ]);

            this.data.tasks = results[0].data || [];
            this.data.clients = results[1].data || [];
            this.data.registrations = results[2].data || [];
            this.data.transactions = results[3].data || [];
            
            console.log('✅ Dados carregados com sucesso.');
        } catch (err) {
            console.warn('⚠️ Erro ao buscar dados na nuvem, usando cache vazio.', err);
        }
    },

    get(key) {
        const table = key.replace('renave_v2_', '');
        return this.data[table] || [];
    },

    save(key, data) {
        const table = key.replace('renave_v2_', '');
        this.data[table] = data;
    },

    async addItem(key, item) {
        const table = key.replace('renave_v2_', '');
        if (!supabase) return item;
        
        const { data, error } = await supabase.from(table).insert([item]).select();
        if (data) {
            this.data[table].push(data[0]);
            return data[0];
        }
        return item;
    },

    async updateItem(key, id, updates) {
        const table = key.replace('renave_v2_', '');
        if (supabase) await supabase.from(table).update(updates).eq('id', id);
        const index = this.data[table].findIndex(i => i.id === id);
        if (index !== -1) this.data[table][index] = { ...this.data[table][index], ...updates };
    },

    async deleteItem(key, id) {
        const table = key.replace('renave_v2_', '');
        if (supabase) await supabase.from(table).delete().eq('id', id);
        this.data[table] = this.data[table].filter(i => i.id !== id);
    }
};
