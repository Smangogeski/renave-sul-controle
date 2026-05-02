/**
 * Store logic for Renave Sul - Cloud Version (Supabase)
 */
const SUPABASE_CONFIG = {
    url: 'https://vlvngvhrfydtejbjfbrn.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsdm5ndmhyZnlkdGVqYmpmYnJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3MzcwMDUsImV4cCI6MjA5MzMxMzAwNX0.DpbF_oC0xne36qc4t_XZ8WfMuOfjK9vqRL_65DVcMOE'
};

const supabase = window.supabase ? window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.key) : null;

const Store = {
    KEYS: {
        TASKS: 'tasks',
        CLIENTS: 'clients',
        APPOINTMENTS: 'appointments',
        REGISTRATIONS: 'registrations',
        TRANSACTIONS: 'transactions',
        SETTINGS: 'settings'
    },

    data: {
        tasks: [],
        clients: [],
        appointments: [],
        registrations: [],
        transactions: [],
        settings: {}
    },

    async init() {
        if (!supabase) return;
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
            
            // Fallback para appointments
            const { data: appts } = await supabase.from('appointments').select('*').catch(() => ({ data: [] }));
            this.data.appointments = appts || [];

            console.log('✅ Dados Cloud carregados.');
        } catch (err) {
            console.error('Erro ao carregar dados:', err);
        }
    },

    get(key) {
        // Mapeamento das chaves antigas para as novas tabelas
        const map = {
            'renave_v2_tasks': 'tasks',
            'renave_v2_clients': 'clients',
            'renave_v2_appointments': 'appointments',
            'renave_v2_registrations': 'registrations',
            'renave_v2_transactions': 'transactions'
        };
        const table = map[key] || key;
        return this.data[table] || [];
    },

    save(key, data) {
        // Cache local
        const map = {
            'renave_v2_tasks': 'tasks',
            'renave_v2_clients': 'clients',
            'renave_v2_appointments': 'appointments',
            'renave_v2_registrations': 'registrations',
            'renave_v2_transactions': 'transactions'
        };
        const table = map[key] || key;
        this.data[table] = data;
    },

    async addItem(key, item) {
        const map = {
            'renave_v2_tasks': 'tasks',
            'renave_v2_clients': 'clients',
            'renave_v2_appointments': 'appointments',
            'renave_v2_registrations': 'registrations',
            'renave_v2_transactions': 'transactions'
        };
        const table = map[key] || key;
        
        const { data, error } = await supabase.from(table).insert([item]).select();
        if (data) {
            this.data[table].push(data[0]);
            return data[0];
        }
        return item;
    },

    async updateItem(key, id, updates) {
        const map = { 'renave_v2_tasks': 'tasks', 'renave_v2_clients': 'clients', 'renave_v2_registrations': 'registrations', 'renave_v2_transactions': 'transactions' };
        const table = map[key] || key;
        await supabase.from(table).update(updates).eq('id', id);
        const index = this.data[table].findIndex(i => i.id === id);
        if (index !== -1) this.data[table][index] = { ...this.data[table][index], ...updates };
    },

    async deleteItem(key, id) {
        const map = { 'renave_v2_tasks': 'tasks', 'renave_v2_clients': 'clients', 'renave_v2_registrations': 'registrations', 'renave_v2_transactions': 'transactions' };
        const table = map[key] || key;
        await supabase.from(table).delete().eq('id', id);
        this.data[table] = this.data[table].filter(i => i.id !== id);
    }
};
