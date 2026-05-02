/**
 * Renave Sul - Final Stable Cloud
 */

const SUPABASE_URL = 'https://vlvngvhrfydtejbjfbrn.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsdm5ndmhyZnlkdGVqYmpmYnJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3MzcwMDUsImV4cCI6MjA5MzMxMzAwNX0.DpbF_oC0xne36qc4t_XZ8WfMuOfjK9vqRL_65DVcMOE';

let supabase;
function initDB() {
    try {
        const lib = window.supabase || window.supabaseJS;
        if (lib && !supabase) supabase = lib.createClient(SUPABASE_URL, SUPABASE_KEY);
    } catch (e) { console.error(e); }
}

window.Store = {
    TABLES: { TASKS: 'tasks', CLIENTS: 'clients', REGISTRATIONS: 'registrations', TRANSACTIONS: 'transactions' },
    async get(t) { 
        initDB(); 
        if (!supabase) return [];
        try {
            const { data } = await supabase.from(t).select('*').order('created_at', { ascending: false });
            return data || [];
        } catch (e) { return []; }
    },
    async addItem(t, i) { initDB(); return await supabase.from(t).insert([i]).select(); },
    async updateItem(t, id, updates) { initDB(); await supabase.from(t).update(updates).eq('id', id); },
    async deleteItem(t, id) { initDB(); await supabase.from(t).delete().eq('id', id); }
};

window.App = {
    currentView: 'dashboard',

    init() {
        this.bindLogin();
        this.checkAuth();
        this.bindNav();
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

    bindNav() {
        const items = document.querySelectorAll('.sidebar-nav li[data-view]');
        items.forEach(item => {
            item.onclick = () => {
                items.forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                this.currentView = item.dataset.view;
                this.render();
                
                // Fechar menu mobile se estiver aberto
                document.querySelector('.sidebar').classList.remove('active');
                document.querySelector('.sidebar-overlay').classList.remove('active');
            };
        });

        const mobileToggle = document.getElementById('mobile-menu-toggle');
        if (mobileToggle) {
            mobileToggle.onclick = () => {
                document.querySelector('.sidebar').classList.toggle('active');
                document.querySelector('.sidebar-overlay').classList.toggle('active');
            };
        }
    },

    async render() {
        const container = document.getElementById('view-container');
        if (!container) return;

        if (this.currentView === 'dashboard') await this.renderDashboard(container);
        else if (this.currentView === 'tasks') await this.renderTasks(container);
        else if (this.currentView === 'finance') await this.renderFinance(container);
        else if (this.currentView === 'clients') await this.renderClients(container);
        else if (this.currentView === 'registrations') await this.renderRegistrations(container);

        lucide.createIcons();
    },

    async renderDashboard(container) {
        const tasks = await window.Store.get(window.Store.TABLES.TASKS);
        const regs = await window.Store.get(window.Store.TABLES.REGISTRATIONS);
        const pending = tasks.filter(t => t.status === 'pendente').length;
        const overdue = tasks.filter(t => t.deadline && new Date(t.deadline) < new Date() && t.status !== 'concluido').length;

        container.innerHTML = `
            <div class="dashboard-header"><h1>Painel de Gestão</h1><p>Resumo operacional.</p></div>
            <div class="dashboard-grid">
                <div class="kpi-card"><span class="label">Tarefas</span><span class="value">${pending}</span></div>
                <div class="kpi-card"><span class="label">Atrasados</span><span class="value" style="color:red">${overdue}</span></div>
                <div class="kpi-card"><span class="label">Lojas</span><span class="value">${regs.length}</span></div>
                <div class="kpi-card"><span class="label">Total Ações</span><span class="value">${tasks.length}</span></div>
            </div>
            <div style="margin-top:2rem; display:grid; grid-template-columns: 1fr 1fr; gap:2rem;">
                <div class="card"><h3>Tarefas Recentes</h3><ul>${tasks.slice(0, 5).map(t => `<li>${t.title} (${t.responsible})</li>`).join('') || '<li>Vazio</li>'}</ul></div>
                <div class="card"><h3>Crescimento</h3><canvas id="chart" style="height:200px;"></canvas></div>
            </div>
        `;
        this.initChart(regs);
    },

    async renderTasks(container) {
        const tasks = await window.Store.get(window.Store.TABLES.TASKS);
        container.innerHTML = `
            <div class="section-header"><h1>Tarefas</h1><button class="btn btn-primary" onclick="window.App.showAddTask()">+ Nova</button></div>
            <div class="card"><table class="data-table">
                <thead><tr><th>Tarefa</th><th>Resp.</th><th>Prazo</th><th>Ações</th></tr></thead>
                <tbody>${tasks.map(t => `<tr><td>${t.title}</td><td>${t.responsible}</td><td>${t.deadline}</td><td><button onclick="window.App.deleteTask(${t.id})">Excluir</button></td></tr>`).join('')}</tbody>
            </table></div>
        `;
    },

    async renderFinance(container) {
        const trans = await window.Store.get(window.Store.TABLES.TRANSACTIONS);
        container.innerHTML = `
            <div class="section-header"><h1>Financeiro</h1><button class="btn btn-primary" onclick="window.App.showAddTransaction()">+ Novo</button></div>
            <div class="card"><table class="data-table">
                <thead><tr><th>Data</th><th>Descrição</th><th>Valor</th></tr></thead>
                <tbody>${trans.map(t => `<tr><td>${t.date}</td><td>${t.description}</td><td style="color:${t.type==='entry'?'green':'red'}">R$ ${t.value}</td></tr>`).join('')}</tbody>
            </table></div>
        `;
    },

    async renderClients(container) {
        const clients = await window.Store.get(window.Store.TABLES.CLIENTS);
        container.innerHTML = `
            <div class="section-header"><h1>Clientes</h1><button class="btn btn-primary" onclick="window.App.showAddClient()">+ Novo</button></div>
            <div class="card"><table class="data-table">
                <thead><tr><th>Nome</th><th>Contato</th><th>Ações</th></tr></thead>
                <tbody>${clients.map(c => `<tr><td>${c.name}</td><td>${c.email || '-'}</td><td><button onclick="window.App.deleteClient(${c.id})">Excluir</button></td></tr>`).join('')}</tbody>
            </table></div>
        `;
    },

    async renderRegistrations(container) {
        const regs = await window.Store.get(window.Store.TABLES.REGISTRATIONS);
        container.innerHTML = `
            <div class="section-header"><h1>Credenciamentos</h1><button class="btn btn-primary" onclick="window.App.showAddReg()">+ Novo</button></div>
            <div class="card"><table class="data-table">
                <thead><tr><th>Loja</th><th>SERPRO</th><th>Detran</th><th>Ações</th></tr></thead>
                <tbody>${regs.map(r => `<tr><td>${r.store_name}</td><td>${r.serpro}</td><td>${r.detran}</td><td><button onclick="window.App.deleteReg(${r.id})">Excluir</button></td></tr>`).join('')}</tbody>
            </table></div>
        `;
    },

    initChart(regs) {
        const ctx = document.getElementById('chart');
        if (!ctx) return;
        new Chart(ctx, {
            type: 'bar',
            data: { labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai'], datasets: [{ label: 'Cadastros', data: [12, 19, 3, 5, regs.length], backgroundColor: '#f38b3c' }] },
            options: { responsive: true, maintainAspectRatio: false }
        });
    },

    showAddTask() {
        const title = prompt('Título da Tarefa:');
        if (title) { window.Store.addItem(window.Store.TABLES.TASKS, { title, responsible: 'Mateus', deadline: '2026-05-30', status: 'pendente' }).then(() => this.render()); }
    },

    showAddClient() {
        const name = prompt('Nome do Cliente:');
        if (name) { window.Store.addItem(window.Store.TABLES.CLIENTS, { name, email: '' }).then(() => this.render()); }
    },

    showAddTransaction() {
        const desc = prompt('Descrição:');
        const val = prompt('Valor:');
        if (desc && val) { window.Store.addItem(window.Store.TABLES.TRANSACTIONS, { description: desc, value: val, type: 'entry', date: '2026-05-02' }).then(() => this.render()); }
    },

    showAddReg() {
        const store = prompt('Nome da Loja:');
        if (store) { window.Store.addItem(window.Store.TABLES.REGISTRATIONS, { store_name: store, serpro: 'pendente', detran: 'pendente' }).then(() => this.render()); }
    },

    async deleteTask(id) { if (confirm('Excluir?')) { await window.Store.deleteItem(window.Store.TABLES.TASKS, id); this.render(); } },
    async deleteClient(id) { if (confirm('Excluir?')) { await window.Store.deleteItem(window.Store.TABLES.CLIENTS, id); this.render(); } },
    async deleteReg(id) { if (confirm('Excluir?')) { await window.Store.deleteItem(window.Store.TABLES.REGISTRATIONS, id); this.render(); } }
};

window.onload = () => window.App.init();
