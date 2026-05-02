console.log('Tentando carregar Store.js...');
/**
 * Store logic for Renave Sul - Supabase Edition
 * Handles communication with the Supabase Cloud Database
 */

// CONFIGURAÇÃO SUPABASE
const SUPABASE_URL = 'https://vlvngvhrfydtejbjfbrn.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsdm5ndmhyZnlkdGVqYmpmYnJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3MzcwMDUsImV4cCI6MjA5MzMxMzAwNX0.DpbF_oC0xne36qc4t_XZ8WfMuOfjK9vqRL_65DVcMOE';

// Inicialização robusta do Supabase
let supabase;
try {
    const lib = window.supabase || (window.supabaseJS ? window.supabaseJS : null);
    if (lib) {
        supabase = lib.createClient(SUPABASE_URL, SUPABASE_KEY);
    }
} catch (e) {
    console.error('Falha ao instanciar Supabase:', e);
}

window.Store = {
    // Tabelas no Supabase
    TABLES: {
        TASKS: 'tasks',
        CLIENTS: 'clients',
        REGISTRATIONS: 'registrations',
        TRANSACTIONS: 'transactions'
    },

    async init() {
        if (!supabase) {
            console.error('Supabase não foi carregado corretamente.');
            return;
        }
        console.log('Sistema conectado ao Supabase Cloud.');
    },

    // Buscar todos os registros (Asíncrono)
    async get(table) {
        const { data, error } = await supabase
            .from(table)
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error(`Erro ao buscar ${table}:`, error);
            return [];
        }
        return data;
    },

    // Adicionar novo registro
    async addItem(table, item) {
        const { data, error } = await supabase
            .from(table)
            .insert([item])
            .select();

        if (error) {
            console.error(`Erro ao adicionar em ${table}:`, error);
            return null;
        }
        return data[0];
    },

    // Atualizar registro existente
    async updateItem(table, id, updates) {
        const { error } = await supabase
            .from(table)
            .update(updates)
            .eq('id', id);

        if (error) {
            console.error(`Erro ao atualizar ${table}:`, error);
        }
    },

    // Deletar registro
    async deleteItem(table, id) {
        const { error } = await supabase
            .from(table)
            .delete()
            .eq('id', id);

        if (error) {
            console.error(`Erro ao deletar de ${table}:`, error);
        }
    }
};
console.log('Store.js carregado com sucesso.');
