/**
 * Renave Sul - Full Cloud Edition
 * Sistema de Gestão Unificado e Conectado ao Supabase
 */

// --- 1. CONFIGURAÇÃO DO BANCO DE DADOS ---
const SUPABASE_URL = 'https://vlvngvhrfydtejbjfbrn.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsdm5ndmhyZnlkdGVqYmpmYnJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3MzcwMDUsImV4cCI6MjA5MzMxMzAwNX0.DpbF_oC0xne36qc4t_XZ8WfMuOfjK9vqRL_65DVcMOE';

let supabase;
function getDB() {
    if (!supabase) {
        try {
            const lib = window.supabase || window.supabaseJS;
            if (lib) supabase = lib.createClient(SUPABASE_URL, SUPABASE_KEY);
        } catch (e) { console.error('Erro Supabase:', e); }
    }
    return supabase;
}

window.Store = {
    TABLES: { TASKS: 'tasks', CLIENTS: 'clients', REGISTRATIONS: 'registrations', TRANSACTIONS: 'transactions' },
    async get(table) {
        const db = getDB();
        if (!db) return [];
        const { data, error } = await db.from(table).select('*').order('created_at', { ascending: false });
        return error ? [] : data;
    },
    async addItem(table, item) {
        const db = getDB();
        if (!db) return null;
        const { data, error } = await db.from(table).insert([item]).select();
        return error ? null : data[0];
    },
    async updateItem(table, id, updates) {
        const db = getDB();
        if (db) await db.from(table).update(updates).eq('id', id);
    },
    async deleteItem(table, id) {
        const db = getDB();
        if (db) await db.from(table).delete().eq('id', id);
    }
};

// --- 2. LÓGICA DO APLICATIVO ---
window.App = {
    currentView: 'dashboard',

    init() {
        console.log('Iniciando sistema completo...');
        this.cacheDOM();
        this.bindEvents();
        this.checkAuth();
    },

    checkAuth() {
        const auth = sessionStorage.getItem('renave_auth');
        const login = document.getElementById('login-screen');
        const app = document.querySelector('.app-container');

        if (auth) {
            if (login) login.style.display = 'none';
            if (app) app.style.display = 'flex';
            this.render();
        } else {
            if (login) login.style.display = 'flex';
            if (app) app.style.display = 'none';
            this.bindLogin();
        }
    },

    bindLogin() {
        const form = document.getElementById('login-form');
        if (!form) return;
        form.onsubmit = (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value.trim();
            const pass = document.getElementById('login-password').value.trim();

            if ((email === 'admin@renave-sul.com.br' || email === 'admin@renave-sul-gestao.com.br') && pass === 'R3n@ve26') {
                sessionStorage.setItem('renave_auth', 'true');
                this.checkAuth();
            } else {
                const err = document.getElementById('login-error');
                if (err) err.style.display = 'block';
            }
        };
    },

    cacheDOM() {
        this.viewContainer = document.getElementById('view-container');
        this.navItems = document.querySelectorAll('.sidebar-nav li[data-view]');
        this.modalOverlay = document.getElementById('modal-container');
        this.modalTitle = document.getElementById('modal-title');
        this.modalBody = document.getElementById('modal-body');
        this.closeModalBtn = document.getElementById('close-modal');
        this.quickAddBtn = document.getElementById('btn-quick-add');
    },

    bindEvents() {
        this.navItems.forEach(item => {
            item.onclick = () => {
                this.navItems.forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                this.currentView = item.dataset.view;
                this.render();
            };
        });

        if (this.quickAddBtn) this.quickAddBtn.onclick = () => this.showQuickAdd();
        if (this.closeModalBtn) this.closeModalBtn.onclick = () => this.hideModal();
        
        const mobileToggle = document.getElementById('mobile-menu-toggle');
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        if (mobileToggle) mobileToggle.onclick = () => {
            sidebar.classList.toggle('active');
            overlay.classList.toggle('active');
        };
        if (overlay) overlay.onclick = () => {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
        };
    },

    async render() {
        if (!this.viewContainer) return;
        
        if (this.currentView === 'dashboard') await this.renderDashboard();
        else if (this.currentView === 'tasks') await this.renderTasks();
        else if (this.currentView === 'finance') await this.renderFinance();
        else if (this.currentView === 'clients') await this.renderClients();
        else if (this.currentView === 'registrations') await this.renderRegistrations();
        
        lucide.createIcons();
    },

    async renderDashboard() {
        const tasks = await window.Store.get(window.Store.TABLES.TASKS);
        const regs = await window.Store.get(window.Store.TABLES.REGISTRATIONS);
        
        const pending = tasks.filter(t => t.status === 'pendente').length;
        const overdue = tasks.filter(t => t.deadline && new Date(t.deadline) < new Date() && t.status !== 'concluido').length;

        this.viewContainer.innerHTML = `
            <div class="dashboard-header">
                <h1>Painel de Gestão</h1>
                <p>Resumo operacional Renave Sul.</p>
            </div>
            <div class="dashboard-grid">
                <div class="kpi-card"><span class="label">Tarefas Pendentes</span><span class="value">${pending}</span></div>
                <div class="kpi-card"><span class="label">Atrasados</span><span class="value" style="color:#ef4444">${overdue}</span></div>
                <div class="kpi-card"><span class="label">Lojas Parceiras</span><span class="value">${regs.length}</span></div>
                <div class="kpi-card"><span class="label">Novos Clientes</span><span class="value">${tasks.length}</span></div>
            </div>
            <div style="display:grid; grid-template-columns: 1.5fr 1fr; gap:2rem; margin-top:2rem;">
                <div class="card">
                    <div class="section-header"><h2>Ações Recentes</h2></div>
                    <ul class="action-list">
                        ${tasks.slice(0, 5).map(t => `<li class="action-item"><strong>${t.title}</strong><br><small>${t.responsible || 'Sem resp.'} - ${t.deadline || ''}</small></li>`).join('') || '<li>Nenhuma tarefa</li>'}
                    </ul>
                </div>
                <div class="card">
                    <div class="section-header"><h2>Fluxo de Crescimento</h2></div>
                    <div style="height:250px;"><canvas id="growthChart"></canvas></div>
                </div>
            </div>
        `;
        setTimeout(() => this.initChart(regs), 100);
    },

    initChart(regs) {
        const ctx = document.getElementById('growthChart');
        if (!ctx) return;
        const history = {};
        regs.forEach(r => {
            const m = r.created_at ? r.created_at.substring(0, 7) : new Date().toISOString().substring(0, 7);
            history[m] = (history[m] || 0) + 1;
        });
        const labels = Object.keys(history);
        const values = Object.values(history);

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{ label: 'Cadastros', data: values, borderColor: '#f38b3c', tension: 0.3, fill: true, backgroundColor: 'rgba(243, 139, 60, 0.1)' }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
        });
    },

    async renderTasks() {
        const tasks = await window.Store.get(window.Store.TABLES.TASKS);
        this.viewContainer.innerHTML = `
            <div class="section-header"><h1>Minhas Tarefas</h1><button class="btn btn-primary" onclick="window.App.showAddTask()">+ Nova Tarefa</button></div>
            <div class="card" style="overflow-x:auto;">
                <table class="data-table">
                    <thead><tr><th>Tarefa</th><th>Resp.</th><th>Prazo</th><th>Status</th><th>Ações</th></tr></thead>
                    <tbody>${tasks.map(t => `
                        <tr>
                            <td><strong>${t.title}</strong></td>
                            <td>${t.responsible}</td>
                            <td>${t.deadline}</td>
                            <td><span class="tag status-${t.status}">${t.status}</span></td>
                            <td><button class="btn btn-icon" onclick="window.App.deleteTask(${t.id})"><i data-lucide="trash"></i></button></td>
                        </tr>`).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    async renderFinance() {
        const trans = await window.Store.get(window.Store.TABLES.TRANSACTIONS);
        const total = trans.reduce((acc, t) => acc + (t.type === 'entry' ? parseFloat(t.value) : -parseFloat(t.value)), 0);
        
        this.viewContainer.innerHTML = `
            <div class="section-header"><h1>Financeiro</h1><button class="btn btn-primary" onclick="window.App.showAddTransaction()">+ Lançamento</button></div>
            <div class="kpi-card" style="margin-bottom:2rem; max-width:300px;"><span class="label">Saldo Atual</span><span class="value" style="color:${total >= 0 ? '#10b981' : '#ef4444'}">R$ ${total.toFixed(2)}</span></div>
            <div class="card" style="overflow-x:auto;">
                <table class="data-table">
                    <thead><tr><th>Data</th><th>Descrição</th><th>Valor</th></tr></thead>
                    <tbody>${trans.map(t => `<tr><td>${t.date}</td><td>${t.description}</td><td style="color:${t.type==='entry'?'green':'red'}">R$ ${parseFloat(t.value).toFixed(2)}</td></tr>`).join('')}</tbody>
                </table>
            </div>
        `;
    },

    async renderClients() {
        const clients = await window.Store.get(window.Store.TABLES.CLIENTS);
        this.viewContainer.innerHTML = `
            <div class="section-header"><h1>Consultar Clientes</h1><button class="btn btn-primary" onclick="window.App.showAddClient()">+ Novo Cliente</button></div>
            <div class="card" style="overflow-x:auto;">
                <table class="data-table">
                    <thead><tr><th>Nome</th><th>E-mail / Telefone</th><th>Ações</th></tr></thead>
                    <tbody>${clients.map(c => `<tr><td><strong>${c.name}</strong></td><td>${c.email || c.phone || '-'}</td><td><button class="btn btn-icon" onclick="window.App.deleteClient(${c.id})"><i data-lucide="trash"></i></button></td></tr>`).join('')}</tbody>
                </table>
            </div>
        `;
    },

    async renderRegistrations() {
        const regs = await window.Store.get(window.Store.TABLES.REGISTRATIONS);
        this.viewContainer.innerHTML = `
            <div class="section-header"><h1>Cadastros e Pendências</h1><button class="btn btn-primary" onclick="window.App.showAddRegistration()">+ Novo Credenciamento</button></div>
            <div class="card" style="overflow-x:auto;">
                <table class="data-table">
                    <thead><tr><th>Loja</th><th>SERPRO</th><th>Detran</th><th>Ações</th></tr></thead>
                    <tbody>${regs.map(r => `<tr><td><strong>${r.store_name}</strong></td><td>${r.serpro}</td><td>${r.detran}</td><td><button class="btn btn-icon" onclick="window.App.deleteRegistration(${r.id})"><i data-lucide="trash"></i></button></td></tr>`).join('')}</tbody>
                </table>
            </div>
        `;
    },

    // --- Modais ---
    showModal() { this.modalOverlay.classList.remove('hidden'); lucide.createIcons(); },
    hideModal() { this.modalOverlay.classList.add('hidden'); },

    showAddTask() {
        this.modalTitle.innerText = 'Nova Tarefa';
        this.modalBody.innerHTML = `
            <form id="modal-form">
                <div class="form-group"><label>Título</label><input type="text" id="m-title" class="form-control" required></div>
                <div class="form-group"><label>Resp.</label><select id="m-resp" class="form-control"><option>Lucas</option><option>Mateus</option><option>Gabriela</option></select></div>
                <div class="form-group"><label>Prazo</label><input type="date" id="m-date" class="form-control" required></div>
                <button type="submit" class="btn btn-primary" style="width:100%; margin-top:1rem;">Salvar</button>
            </form>
        `;
        this.showModal();
        document.getElementById('modal-form').onsubmit = async (e) => {
            e.preventDefault();
            await window.Store.addItem(window.Store.TABLES.TASKS, { title: document.getElementById('m-title').value, responsible: document.getElementById('m-resp').value, deadline: document.getElementById('m-date').value, status: 'pendente' });
            this.hideModal(); this.render();
        };
    },

    showAddClient() {
        this.modalTitle.innerText = 'Novo Cliente';
        this.modalBody.innerHTML = `
            <form id="modal-form">
                <div class="form-group"><label>Nome</label><input type="text" id="m-name" class="form-control" required></div>
                <div class="form-group"><label>E-mail</label><input type="email" id="m-email" class="form-control"></div>
                <button type="submit" class="btn btn-primary" style="width:100%; margin-top:1rem;">Salvar</button>
            </form>
        `;
        this.showModal();
        document.getElementById('modal-form').onsubmit = async (e) => {
            e.preventDefault();
            await window.Store.addItem(window.Store.TABLES.CLIENTS, { name: document.getElementById('m-name').value, email: document.getElementById('m-email').value });
            this.hideModal(); this.render();
        };
    },

    showAddTransaction() {
        this.modalTitle.innerText = 'Novo Lançamento';
        this.modalBody.innerHTML = `
            <form id="modal-form">
                <div class="form-group"><label>Descrição</label><input type="text" id="m-desc" class="form-control" required></div>
                <div class="form-group"><label>Valor (R$)</label><input type="number" step="0.01" id="m-val" class="form-control" required></div>
                <div class="form-group"><label>Tipo</label><select id="m-type" class="form-control"><option value="entry">Entrada</option><option value="exit">Saída</option></select></div>
                <button type="submit" class="btn btn-primary" style="width:100%; margin-top:1rem;">Lançar</button>
            </form>
        `;
        this.showModal();
        document.getElementById('modal-form').onsubmit = async (e) => {
            e.preventDefault();
            await window.Store.addItem(window.Store.TABLES.TRANSACTIONS, { description: document.getElementById('m-desc').value, value: document.getElementById('m-val').value, type: document.getElementById('m-type').value, date: new Date().toISOString().split('T')[0] });
            this.hideModal(); this.render();
        };
    },

    showAddRegistration() {
        this.modalTitle.innerText = 'Novo Credenciamento';
        this.modalBody.innerHTML = `
            <form id="modal-form">
                <div class="form-group"><label>Loja</label><input type="text" id="m-store" class="form-control" required></div>
                <button type="submit" class="btn btn-primary" style="width:100%; margin-top:1rem;">Iniciar</button>
            </form>
        `;
        this.showModal();
        document.getElementById('modal-form').onsubmit = async (e) => {
            e.preventDefault();
            await window.Store.addItem(window.Store.TABLES.REGISTRATIONS, { store_name: document.getElementById('m-store').value, serpro: 'pendente', detran: 'pendente' });
            this.hideModal(); this.render();
        };
    },

    async deleteTask(id) { if (confirm('Excluir?')) { await window.Store.deleteItem(window.Store.TABLES.TASKS, id); this.render(); } },
    async deleteClient(id) { if (confirm('Excluir?')) { await window.Store.deleteItem(window.Store.TABLES.CLIENTS, id); this.render(); } },
    async deleteRegistration(id) { if (confirm('Excluir?')) { await window.Store.deleteItem(window.Store.TABLES.REGISTRATIONS, id); this.render(); } }
};

window.onload = () => window.App.init();
