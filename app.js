/**
 * App Logic for Renave Sul - Cloud Version
 * Based on Original Code v2.0
 */
const App = {
    currentView: 'dashboard',

    async init() {
        console.log('🚀 Iniciando Sistema Cloud...');
        
        // Pular login por padrão
        this.skipAuth();
        
        // Aguardar carregamento dos dados da nuvem
        await Store.init();
        
        this.cacheDOM();
        this.bindEvents();
        this.render();
        lucide.createIcons();
    },

    skipAuth() {
        const loginScreen = document.getElementById('login-screen');
        const appContainer = document.querySelector('.app-container');
        if (loginScreen) loginScreen.style.display = 'none';
        if (appContainer) appContainer.style.display = 'flex';
    },

    // Mantemos as funções originais, mas adaptadas para chamadas Async do Store
    async addItem(key, item) {
        await Store.addItem(key, item);
        this.render();
    },

    async updateItem(key, id, updates) {
        await Store.updateItem(key, id, updates);
        this.render();
    },

    async deleteItem(key, id) {
        if (confirm('Deseja excluir este item?')) {
            await Store.deleteItem(key, id);
            this.render();
        }
    },

    // --- CÓDIGO ORIGINAL ABAIXO (MANTIDO E ADAPTADO) ---

    fileHandle: null,

    async requestFileSystemAccess() {
        this.showToast('ℹ️ Modo Cloud Ativo: O Sync local não é mais necessário.');
    },

    exportToJSON() {
        const fullData = {
            tasks: Store.get(Store.KEYS.TASKS),
            clients: Store.get(Store.KEYS.CLIENTS),
            registrations: Store.get(Store.KEYS.REGISTRATIONS),
            transactions: Store.get(Store.KEYS.TRANSACTIONS),
            exportDate: new Date().toISOString()
        };

        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(fullData, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `renave_sul_backup_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        
        this.showToast('Backup JSON gerado com sucesso!');
    },

    cacheDOM() {
        this.viewContainer = document.getElementById('view-container');
        this.navItems = document.querySelectorAll('.sidebar-nav li');
        this.quickAddBtn = document.getElementById('btn-quick-add');
        this.modalOverlay = document.getElementById('modal-container');
        this.closeModalBtn = document.getElementById('close-modal');
        this.modalBody = document.getElementById('modal-body');
        this.modalTitle = document.getElementById('modal-title');
        this.alertBadge = document.getElementById('alert-count');
    },

    bindEvents() {
        this.navItems.forEach(item => {
            if (item.dataset.view) {
                item.addEventListener('click', () => {
                    this.navItems.forEach(i => i.classList.remove('active'));
                    item.classList.add('active');
                    this.currentView = item.dataset.view;
                    this.render();
                });
            }
        });

        if (this.quickAddBtn) this.quickAddBtn.addEventListener('click', () => this.showQuickAdd());
        if (this.closeModalBtn) this.closeModalBtn.addEventListener('click', () => this.hideModal());
        if (this.modalOverlay) {
            this.modalOverlay.addEventListener('click', (e) => {
                if (e.target === this.modalOverlay) this.hideModal();
            });
        }

        // Mobile Menu Toggle
        const mobileToggle = document.getElementById('mobile-menu-toggle');
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.getElementById('sidebar-overlay');

        const toggleMenu = () => {
            sidebar.classList.toggle('active');
            overlay.classList.toggle('active');
        };

        if (mobileToggle) mobileToggle.addEventListener('click', toggleMenu);
        if (overlay) overlay.addEventListener('click', toggleMenu);
    },

    render() {
        this.viewContainer.innerHTML = '';
        
        switch (this.currentView) {
            case 'dashboard':
                this.renderDashboard();
                setTimeout(() => App.initDashboardChart(), 0);
                break;
            case 'tasks':
                this.renderTasks();
                break;
            case 'finance':
                this.renderFinance();
                break;
            case 'clients':
                this.renderClients();
                break;
            case 'registrations':
                this.renderRegistrations();
                break;
        }
        
        this.updateAlertCount();
        lucide.createIcons();
    },

    renderDashboard() {
        const tasks = Store.get(Store.KEYS.TASKS);
        const appts = Store.get(Store.KEYS.APPOINTMENTS);
        const regs = Store.get(Store.KEYS.REGISTRATIONS);

        const pendingTasks = tasks.filter(t => t.status === 'pendente').length;
        const overdueTasks = tasks.filter(t => new Date(t.deadline) < new Date() && t.status !== 'concluido').length;
        const todayAppointments = appts.length;
        const ongoingRegistrations = regs.filter(r => r.serpro !== 'concluido' || r.detran !== 'concluido').length;

        this.viewContainer.innerHTML = `
            <div class="dashboard-header" style="margin-bottom: 2rem;">
                <h1 style="font-size: 2rem; font-weight: 800; color: var(--text-primary);">Dashboard Operacional</h1>
            </div>

            <div class="dashboard-grid">
                <div class="kpi-card">
                    <span class="label">Tarefas Pendentes</span>
                    <span class="value">${pendingTasks}</span>
                </div>
                <div class="kpi-card">
                    <span class="label">Pendências Urgentes</span>
                    <span class="value" style="color: var(--danger);">${overdueTasks}</span>
                </div>
                <div class="kpi-card">
                    <span class="label">Visitas Hoje</span>
                    <span class="value">${todayAppointments}</span>
                </div>
                <div class="kpi-card">
                    <span class="label">Cadastros em Andamento</span>
                    <span class="value">${ongoingRegistrations}</span>
                </div>
            </div>

            <div class="dashboard-sections" style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-top: 2rem;">
                <div class="section">
                    <div class="section-header"><h2>Próximas Ações</h2></div>
                    <div class="card">
                        <ul class="action-list" style="list-style: none;">
                            ${tasks.slice(0, 5).map(task => `
                                <li style="padding: 1rem 0; border-bottom: 1px solid var(--bg-tertiary); display: flex; justify-content: space-between;">
                                    <div><strong>${task.title}</strong><br><small>${task.deadline}</small></div>
                                    <span class="tag">${task.status}</span>
                                </li>
                            `).join('') || '<li>Nenhuma tarefa.</li>'}
                        </ul>
                    </div>
                </div>
                <div class="section">
                    <div class="section-header"><h2>Crescimento Mensal</h2></div>
                    <div class="card"><canvas id="monthlyChart" height="150"></canvas></div>
                </div>
            </div>
        `;
    },

    initDashboardChart() {
        const ctx = document.getElementById('monthlyChart');
        if (!ctx) return;
        const regs = Store.get(Store.KEYS.REGISTRATIONS);
        const history = {};
        regs.forEach(r => {
            const m = r.createdAt ? r.createdAt.substring(0, 7) : new Date().toISOString().substring(0, 7);
            history[m] = (history[m] || 0) + 1;
        });
        
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Object.keys(history),
                datasets: [{ label: 'Novos Clientes', data: Object.values(history), backgroundColor: '#f38b3c', borderRadius: 6 }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    },

    renderTasks() {
        const tasks = Store.get(Store.KEYS.TASKS);
        this.viewContainer.innerHTML = `
            <div class="section-header">
                <h1>Gestão de Tarefas</h1>
                <button class="btn btn-primary" onclick="App.showAddTask()">Novo</button>
            </div>
            <div class="card">
                <table class="data-table">
                    <thead><tr><th>Título</th><th>Responsável</th><th>Prazo</th><th>Status</th><th>Ações</th></tr></thead>
                    <tbody>${tasks.map(t => `
                        <tr>
                            <td><strong>${t.title}</strong></td>
                            <td>${t.responsible}</td>
                            <td>${t.deadline}</td>
                            <td>${t.status}</td>
                            <td><button class="btn btn-icon" onclick="App.deleteItem('${Store.KEYS.TASKS}', ${t.id})"><i data-lucide="trash"></i></button></td>
                        </tr>`).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    renderFinance() {
        const trans = Store.get(Store.KEYS.TRANSACTIONS);
        this.viewContainer.innerHTML = `
            <div class="section-header"><h1>Financeiro</h1><button class="btn btn-primary" onclick="App.showAddTransaction()">Novo</button></div>
            <div class="card">
                <table class="data-table">
                    <thead><tr><th>Data</th><th>Descrição</th><th>Valor</th></tr></thead>
                    <tbody>${trans.map(t => `
                        <tr>
                            <td>${t.date}</td>
                            <td>${t.desc}</td>
                            <td style="color: ${t.type === 'entry' ? 'var(--success)' : 'var(--danger)'}">R$ ${t.value.toLocaleString('pt-br')}</td>
                        </tr>`).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    renderClients() {
        const clients = Store.get(Store.KEYS.CLIENTS);
        this.viewContainer.innerHTML = `
            <div class="section-header"><h1>Clientes</h1><button class="btn btn-primary" onclick="App.showAddClient()">Novo</button></div>
            <div class="grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1rem;">
                ${clients.map(c => `<div class="card"><h3>${c.name}</h3><p>${c.email}</p></div>`).join('')}
            </div>
        `;
    },

    renderRegistrations() {
        const regs = Store.get(Store.KEYS.REGISTRATIONS);
        this.viewContainer.innerHTML = `
            <div class="section-header"><h1>Processos</h1><button class="btn btn-primary" onclick="App.showAddRegistration()">Novo</button></div>
            <div class="card">
                <table class="data-table">
                    <thead><tr><th>Loja</th><th>SERPRO</th><th>Detran</th><th>Renave</th><th>Ações</th></tr></thead>
                    <tbody>${regs.map(r => `
                        <tr>
                            <td><strong>${r.storeName}</strong></td>
                            <td>${r.serpro}</td><td>${r.detran}</td><td>${r.renave}</td>
                            <td><button class="btn btn-icon" onclick="App.deleteItem('${Store.KEYS.REGISTRATIONS}', ${r.id})"><i data-lucide="trash"></i></button></td>
                        </tr>`).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    showModal() { this.modalOverlay.classList.remove('hidden'); lucide.createIcons(); },
    hideModal() { this.modalOverlay.classList.add('hidden'); },
    showToast(msg) { 
        const t = document.createElement('div'); t.className = 'toast success'; t.innerText = msg;
        document.getElementById('toast-container').appendChild(t); setTimeout(() => t.remove(), 3000);
    },

    showAddTask() {
        this.modalTitle.innerText = 'Nova Tarefa';
        this.modalBody.innerHTML = `<form id="f-add"><input type="text" id="t-title" placeholder="Título" required><button type="submit" class="btn btn-primary">Salvar</button></form>`;
        this.showModal();
        document.getElementById('f-add').onsubmit = async (e) => {
            e.preventDefault();
            await Store.addItem(Store.KEYS.TASKS, { title: document.getElementById('t-title').value, status: 'pendente', deadline: new Date().toLocaleDateString() });
            this.hideModal(); this.render();
        };
    },

    updateAlertCount() {
        const count = Store.get(Store.KEYS.TASKS).filter(t => t.status === 'pendente').length;
        if (this.alertBadge) this.alertBadge.innerText = count;
    }
};

window.onload = () => App.init();
