/**
 * Store logic for Renave Sul - Cloud Version (Supabase)
 * Handles persistence with Supabase instead of localStorage
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

    // Cache local para o App funcionar de forma síncrona
    data: {
        tasks: [],
        clients: [],
        appointments: [],
        registrations: [],
        transactions: [],
        settings: {}
    },

    async init() {
        console.log('☁️ Inicializando Store Cloud...');
        await this.fetchAll();
    },

    async fetchAll() {
        if (!supabase) return;
        try {
            const results = await Promise.all([
                supabase.from('tasks').select('*').order('id', { ascending: false }),
                supabase.from('clients').select('*'),
                supabase.from('registrations').select('*').order('id', { ascending: false }),
                supabase.from('transactions').select('*').order('id', { ascending: false })
            ]);

            this.data.tasks = results[0].data || [];
            this.data.clients = results[1].data || [];
            this.data.registrations = results[2].data || [];
            this.data.transactions = results[3].data || [];
            
            // Appointments (opcional, fallback para vazio se não existir tabela)
            const { data: appts } = await supabase.from('appointments').select('*').catch(() => ({ data: [] }));
            this.data.appointments = appts || [];

            console.log('✅ Dados da nuvem carregados.');
        } catch (err) {
            console.error('❌ Erro ao carregar dados:', err);
        }
    },

    get(key) {
        // Retorna do cache para manter a performance original do App
        return this.data[key] || [];
    },

    async save(key, data) {
        // No modo Supabase, as atualizações são feitas item a item para evitar conflitos
        // Mas mantemos esta função como cache local
        this.data[key] = data;
    },

    async addItem(key, item) {
        if (!supabase) return item;
        try {
            const { data, error } = await supabase.from(key).insert([item]).select();
            if (error) throw error;
            
            // Atualiza cache local e retorna
            const newItem = data[0];
            this.data[key].unshift(newItem);
            return newItem;
        } catch (err) {
            console.error(`Erro ao adicionar em ${key}:`, err);
            return item;
        }
    },

    async updateItem(key, id, updates) {
        if (!supabase) return;
        try {
            const { error } = await supabase.from(key).update(updates).eq('id', id);
            if (error) throw error;
            
            // Atualiza cache local
            const index = this.data[key].findIndex(i => i.id === id);
            if (index !== -1) {
                this.data[key][index] = { ...this.data[key][index], ...updates };
            }
        } catch (err) {
            console.error(`Erro ao atualizar ${key}:`, err);
        }
    },

    async deleteItem(key, id) {
        if (!supabase) return;
        try {
            const { error } = await supabase.from(key).delete().eq('id', id);
            if (error) throw error;
            
            // Atualiza cache local
            this.data[key] = this.data[key].filter(i => i.id !== id);
        } catch (err) {
            console.error(`Erro ao deletar em ${key}:`, err);
        }
    }
};

// Iniciar conexão
Store.init();
