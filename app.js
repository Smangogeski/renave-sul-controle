/**
 * Renave Sul - Unified App & Store Logic
 * All-in-one file to prevent loading issues.
 */

// --- 1. CONFIGURAÇÃO E BANCO DE DADOS (STORE) ---
const SUPABASE_URL = 'https://vlvngvhrfydtejbjfbrn.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsdm5ndmhyZnlkdGVqYmpmYnJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3MzcwMDUsImV4cCI6MjA5MzMxMzAwNX0.DpbF_oC0xne36qc4t_XZ8WfMuOfjK9vqRL_65DVcMOE';

let supabase;
try {
    const lib = window.supabase || window.supabaseJS;
    if (lib) {
        supabase = lib.createClient(SUPABASE_URL, SUPABASE_KEY);
    }
} catch (e) {
    console.error('Falha ao instanciar Supabase:', e);
}

const Store = {
    TABLES: {
        TASKS: 'tasks',
        CLIENTS: 'clients',
        REGISTRATIONS: 'registrations',
        TRANSACTIONS: 'transactions'
    },

    async init() {
        if (!supabase) {
            console.error('Supabase não carregado.');
            return;
        }
        console.log('Conectado ao Supabase.');
    },

    async get(table) {
        const { data, error } = await supabase.from(table).select('*').order('created_at', { ascending: false });
        return error ? [] : data;
    },

    async addItem(table, item) {
        const { data, error } = await supabase.from(table).insert([item]).select();
        return error ? null : data[0];
    },

    async updateItem(table, id, updates) {
        await supabase.from(table).update(updates).eq('id', id);
    },

    async deleteItem(table, id) {
        await supabase.from(table).delete().eq('id', id);
    }
};

// --- 2. LÓGICA DA APLICAÇÃO (APP) ---
window.App = {
    currentView: 'dashboard',

    async init() {
        try {
            this.checkAuth();
            await Store.init();
            this.cacheDOM();
            this.bindEvents();
            await this.render();
            lucide.createIcons();
            console.log('App Pronto!');
        } catch (error) {
            console.error('Erro:', error);
            document.body.innerHTML = `
                <div style="padding: 2rem; text-align: center; font-family: sans-serif; background: #fff; height: 100vh;">
                    <h1 style="color: #ef4444;">Erro ao carregar o sistema</h1>
                    <p>${error.message}</p>
                    <button onclick="location.reload()" style="padding: 0.5rem 1rem;">Tentar Novamente</button>
                </div>
            `;
        }
    },

    checkAuth() {
        const isLoggedIn = sessionStorage.getItem('renave_auth');
        const loginScreen = document.getElementById('login-screen');
        const appContainer = document.querySelector('.app-container');

        if (isLoggedIn) {
            if (loginScreen) loginScreen.style.display = 'none';
            if (appContainer) appContainer.style.display = 'flex';
        } else {
            if (loginScreen) loginScreen.style.display = 'flex';
            if (appContainer) appContainer.style.display = 'none';
            this.bindLoginEvents();
        }
    },

    bindLoginEvents() {
        const loginForm = document.getElementById('login-form');
        if (!loginForm) return;
        loginForm.onsubmit = (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const pass = document.getElementById('login-password').value;
            if (email === 'admin@renavesul.com.br' && pass === 'R3n@ve26') {
                sessionStorage.setItem('renave_auth', 'true');
                this.checkAuth();
                this.render();
            } else {
                const err = document.getElementById('login-error');
                if (err) err.style.display = 'block';
            }
        };
    },

    cacheDOM() {
        this.navItems = document.querySelectorAll('.sidebar-nav li[data-view]');
        this.viewContainer = document.getElementById('view-container');
        this.modalOverlay = document.getElementById('modal-container');
        this.modalTitle = document.getElementById('modal-title');
        this.modalBody = document.getElementById('modal-body');
        this.closeModalBtn = document.getElementById('close-modal');
        this.quickAddBtn = document.getElementById('btn-quick-add');
        this.alertBadge = document.getElementById('alert-count');
    },

    bindEvents() {
        this.navItems.forEach(item => {
            item.addEventListener('click', () => {
                this.navItems.forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                this.currentView = item.dataset.view;
                this.render();
            });
        });
        this.quickAddBtn.addEventListener('click', () => this.showQuickAdd());
        this.closeModalBtn.addEventListener('click', () => this.hideModal());
        this.modalOverlay.addEventListener('click', (e) => { if (e.target === this.modalOverlay) this.hideModal(); });
        
        const mobileToggle = document.getElementById('mobile-menu-toggle');
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        const toggleMenu = () => { sidebar.classList.toggle('active'); overlay.classList.toggle('active'); };
        if (mobileToggle) mobileToggle.onclick = toggleMenu;
        if (overlay) overlay.onclick = toggleMenu;
    },

    async render() {
        if (this.currentView === 'dashboard') await this.renderDashboard();
        else if (this.currentView === 'tasks') await this.renderTasks();
        else if (this.currentView === 'finance') await this.renderFinance();
        else if (this.currentView === 'clients') await this.renderClients();
        else if (this.currentView === 'registrations') await this.renderRegistrations();
        lucide.createIcons();
        this.updateAlertCount();
    },

    async renderDashboard() {
        const tasks = (await Store.get(Store.TABLES.TASKS)) || [];
        const regs = (await Store.get(Store.TABLES.REGISTRATIONS)) || [];
        const pendingTasks = tasks.filter(t => t.status === 'pendente').length;
        const overdueTasks = tasks.filter(t => new Date(t.deadline) < new Date() && t.status !== 'concluido').length;
        const ongoingRegs = regs.filter(r => r.serpro !== 'concluido' || r.detran !== 'concluido').length;

        this.viewContainer.innerHTML = `
            <div class="dashboard-header"><h1>Painel Renave Sul</h1><p>Resumo operacional.</p></div>
            <div class="dashboard-grid">
                <div class="kpi-card"><span class="label">Tarefas</span><span class="value">${pendingTasks}</span></div>
                <div class="kpi-card"><span class="label">Atrasados</span><span class="value" style="color:red">${overdueTasks}</span></div>
                <div class="kpi-card"><span class="label">Clientes</span><span class="value">${regs.length}</span></div>
                <div class="kpi-card"><span class="label">Em Fluxo</span><span class="value">${ongoingRegs}</span></div>
            </div>
            <div style="display: grid; grid-template-columns: 1.5fr 1fr; gap: 2rem; margin-top: 2rem;">
                <div class="card">
                    <div class="section-header"><h2>Ações Rápidas</h2></div>
                    <ul class="action-list">
                        ${tasks.slice(0, 3).map(t => `<li class="action-item"><strong>${t.title}</strong> - ${t.responsible}</li>`).join('') || '<li>Nenhuma tarefa</li>'}
                    </ul>
                </div>
                <div class="card">
                    <div class="section-header"><h2>Crescimento</h2></div>
                    <div style="height: 200px;"><canvas id="monthlyChart"></canvas></div>
                </div>
            </div>
        `;
        setTimeout(() => this.initDashboardChart(), 100);
    },

    async initDashboardChart() {
        const ctx = document.getElementById('monthlyChart');
        if (!ctx) return;
        const regs = await Store.get(Store.TABLES.REGISTRATIONS);
        const history = this.getMonthlyHistory(regs);
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: history.map(h => h.month),
                datasets: [{ label: 'Novos', data: history.map(h => h.count), backgroundColor: '#f38b3c' }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    },

    getMonthlyHistory(regs) {
        const history = {};
        regs.forEach(r => {
            const m = r.created_at ? r.created_at.substring(0, 7) : '2026-05';
            history[m] = (history[m] || 0) + 1;
        });
        return Object.entries(history).map(([m, count]) => ({ month: m, count }));
    },

    async renderTasks() {
        const tasks = await Store.get(Store.TABLES.TASKS);
        this.viewContainer.innerHTML = `
            <div class="section-header"><h1>Tarefas</h1><button class="btn btn-primary" onclick="App.showAddTask()">+ Nova</button></div>
            <div class="card"><table class="data-table">
                <thead><tr><th>Título</th><th>Responsável</th><th>Prazo</th><th>Ações</th></tr></thead>
                <tbody>${tasks.map(t => `<tr><td>${t.title}</td><td>${t.responsible}</td><td>${t.deadline}</td><td><button class="btn btn-icon" onclick="App.deleteTask(${t.id})"><i data-lucide="trash"></i></button></td></tr>`).join('')}</tbody>
            </table></div>
        `;
    },

    async renderFinance() {
        const trans = await Store.get(Store.TABLES.TRANSACTIONS);
        this.viewContainer.innerHTML = `
            <div class="section-header"><h1>Finanças</h1><button class="btn btn-primary" onclick="App.showAddTransaction()">+ Lançamento</button></div>
            <div class="card"><table class="data-table">
                <thead><tr><th>Data</th><th>Descrição</th><th>Valor</th></tr></thead>
                <tbody>${trans.map(t => `<tr><td>${t.date}</td><td>${t.description}</td><td style="color:${t.type==='entry'?'green':'red'}">R$ ${t.value}</td></tr>`).join('')}</tbody>
            </table></div>
        `;
    },

    async renderClients() {
        const clients = await Store.get(Store.TABLES.CLIENTS);
        this.viewContainer.innerHTML = `
            <div class="section-header"><h1>Clientes</h1><button class="btn btn-primary" onclick="App.showAddClient()">+ Novo</button></div>
            <div class="card"><table class="data-table">
                <thead><tr><th>Nome</th><th>E-mail</th><th>Ações</th></tr></thead>
                <tbody>${clients.map(c => `<tr><td>${c.name}</td><td>${c.email}</td><td><button class="btn btn-icon" onclick="App.deleteClient(${c.id})"><i data-lucide="trash"></i></button></td></tr>`).join('')}</tbody>
            </table></div>
        `;
    },

    async renderRegistrations() {
        const regs = await Store.get(Store.TABLES.REGISTRATIONS);
        this.viewContainer.innerHTML = `
            <div class="section-header"><h1>Credenciamentos</h1><button class="btn btn-primary" onclick="App.showAddRegistration()">+ Novo</button></div>
            <div class="card"><table class="data-table">
                <thead><tr><th>Loja</th><th>SERPRO</th><th>Detran</th><th>Ações</th></tr></thead>
                <tbody>${regs.map(r => `<tr><td>${r.store_name}</td><td>${r.serpro}</td><td>${r.detran}</td><td><button class="btn btn-icon" onclick="App.deleteRegistration(${r.id})"><i data-lucide="trash"></i></button></td></tr>`).join('')}</tbody>
            </table></div>
        `;
    },

    showQuickAdd() { this.showAddTask(); },
    showModal() { this.modalOverlay.classList.remove('hidden'); lucide.createIcons(); },
    hideModal() { this.modalOverlay.classList.add('hidden'); },
    showToast(msg) { alert(msg); },
    async updateAlertCount() { 
        const tasks = await Store.get(Store.TABLES.TASKS);
        const overdue = tasks.filter(t => new Date(t.deadline) < new Date() && t.status !== 'concluido').length;
        if (this.alertBadge) this.alertBadge.innerText = overdue;
    },

    async showAddTask() {
        this.modalTitle.innerText = 'Nova Tarefa';
        this.modalBody.innerHTML = `
            <form id="add-task-form">
                <input type="text" class="form-control" id="task-title" placeholder="Título" required><br>
                <select class="form-control" id="task-responsible"><option value="Lucas">Lucas</option><option value="Mateus">Mateus</option><option value="Gabriela">Gabriela</option></select><br>
                <input type="date" class="form-control" id="task-deadline" required><br>
                <button type="submit" class="btn btn-primary" style="width: 100%">Salvar</button>
            </form>
        `;
        this.showModal();
        document.getElementById('add-task-form').onsubmit = async (e) => {
            e.preventDefault();
            await Store.addItem(Store.TABLES.TASKS, {
                title: document.getElementById('task-title').value,
                responsible: document.getElementById('task-responsible').value,
                deadline: document.getElementById('task-deadline').value,
                status: 'pendente'
            });
            this.hideModal();
            await this.render();
        };
    },

    async showAddRegistration() {
        this.modalTitle.innerText = 'Novo Cadastro';
        this.modalBody.innerHTML = `
            <form id="add-reg-form">
                <input type="text" class="form-control" id="reg-name" placeholder="Nome da Loja" required><br>
                <button type="submit" class="btn btn-primary" style="width: 100%">Criar</button>
            </form>
        `;
        this.showModal();
        document.getElementById('add-reg-form').onsubmit = async (e) => {
            e.preventDefault();
            await Store.addItem(Store.TABLES.REGISTRATIONS, { store_name: document.getElementById('reg-name').value });
            this.hideModal();
            await this.render();
        };
    },

    async deleteTask(id) { if (confirm('Excluir?')) { await Store.deleteItem(Store.TABLES.TASKS, id); await this.render(); } },
    async deleteRegistration(id) { if (confirm('Excluir?')) { await Store.deleteItem(Store.TABLES.REGISTRATIONS, id); await this.render(); } },
    async deleteClient(id) { if (confirm('Excluir?')) { await Store.deleteItem(Store.TABLES.CLIENTS, id); await this.render(); } }
};

// Start the app
window.onload = () => App.init();
