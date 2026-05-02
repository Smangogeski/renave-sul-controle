console.log('Tentando carregar App.js...');
/**
 * App Logic for Renave Sul
 */
window.App = {
    currentView: 'dashboard',

    async init() {
        console.log('Iniciando App.init()...');
        try {
            this.checkAuth();
            if (!window.Store) {
                throw new Error('O arquivo de banco de dados (Store.js) não foi carregado pelo navegador.');
            }
            await window.Store.init();
            this.cacheDOM();
            this.bindEvents();
            await this.render();
            lucide.createIcons();
            console.log('App inicializado com sucesso!');
        } catch (error) {
            console.error('Erro crítico na inicialização:', error);
            document.body.innerHTML = `
                <div style="padding: 2rem; text-align: center; font-family: sans-serif; background: #fff; height: 100vh;">
                    <h1 style="color: #ef4444;">Ops! O sistema não carregou.</h1>
                    <p>Isso geralmente acontece quando os arquivos não são carregados na ordem correta ou há um erro de conexão.</p>
                    <div style="font-size: 0.9rem; color: #666; background: #f8f9fa; padding: 1.5rem; border-radius: 8px; margin: 2rem auto; max-width: 500px; text-align: left; border-left: 4px solid #ef4444;">
                        <strong>Detalhes do Erro:</strong><br>
                        ${error.message}
                    </div>
                    <button onclick="location.reload()" style="margin-top: 1rem; padding: 0.75rem 1.5rem; cursor: pointer; background: var(--accent-primary, #f38b3c); color: white; border: none; border-radius: 6px; font-weight: bold;">Tentar Novamente</button>
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
                const errorMsg = document.getElementById('login-error');
                if (errorMsg) errorMsg.style.display = 'block';
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
        this.modalOverlay.addEventListener('click', (e) => {
            if (e.target === this.modalOverlay) this.hideModal();
        });

        // Mobile Menu Toggle
        const mobileToggle = document.getElementById('mobile-menu-toggle');
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.getElementById('sidebar-overlay');

        const toggleMenu = () => {
            sidebar.classList.toggle('active');
            overlay.classList.toggle('active');
        };

        if (mobileToggle) {
            mobileToggle.addEventListener('click', toggleMenu);
        }
        if (overlay) {
            overlay.addEventListener('click', toggleMenu);
        }

        // Close menu when clicking a nav item on mobile
        this.navItems.forEach(item => {
            item.addEventListener('click', () => {
                if (window.innerWidth <= 1024) {
                    sidebar.classList.remove('active');
                    overlay.classList.remove('active');
                }
            });
        });
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

    // --- Renderers ---

    async renderDashboard() {
        const tasks = (await window.Store.get(window.Store.TABLES.TASKS)) || [];
        const regs = (await window.Store.get(window.Store.TABLES.REGISTRATIONS)) || [];
        const transactions = (await window.Store.get(window.Store.TABLES.TRANSACTIONS)) || [];

        const pendingTasks = tasks.length > 0 ? tasks.filter(t => t.status === 'pendente').length : 0;
        const overdueTasks = tasks.length > 0 ? tasks.filter(t => new Date(t.deadline) < new Date() && t.status !== 'concluido').length : 0;
        
        const ongoingRegistrations = regs.length > 0 ? regs.filter(r => 
            r.serpro !== 'concluido' || r.detran !== 'concluido' || r.renave !== 'concluido'
        ).length : 0;

        this.viewContainer.innerHTML = `
            <div class="dashboard-header" style="margin-bottom: 2rem;">
                <h1>Bem-vindo, Gestor</h1>
                <p>Aqui está o resumo operacional da Renave Sul hoje.</p>
            </div>

            <div class="dashboard-grid">
                <div class="kpi-card">
                    <span class="label">Tarefas Pendentes</span>
                    <span class="value">${pendingTasks}</span>
                    <span class="trend up"><i data-lucide="clock"></i> Aguardando ação</span>
                </div>
                <div class="kpi-card">
                    <span class="label">Processos Atrasados</span>
                    <span class="value" style="color: var(--danger);">${overdueTasks}</span>
                    <span class="trend down"><i data-lucide="alert-triangle"></i> Requer atenção</span>
                </div>
                <div class="kpi-card">
                    <span class="label">Total de Clientes</span>
                    <span class="value">${regs.length}</span>
                    <span class="trend" style="color: var(--accent-primary);"><i data-lucide="users"></i> Na base</span>
                </div>
                <div class="kpi-card">
                    <span class="label">Cadastros em Andamento</span>
                    <span class="value">${ongoingRegistrations}</span>
                    <span class="trend" style="color: var(--accent-primary);"><i data-lucide="loader"></i> Em fluxo</span>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1.5fr 1fr; gap: 2rem; margin-top: 2rem;">
                <div class="card">
                    <div class="section-header">
                        <h2>Ações Necessárias</h2>
                    </div>
                    <div class="card">
                        <ul class="action-list">
                            ${tasks.length > 0 ? tasks.slice(0, 3).map(task => `
                                <li class="action-item">
                                    <div class="status-indicator ${task.status}"></div>
                                    <div class="action-details">
                                        <span class="title">${task.title}</span>
                                        <span class="meta">${task.deadline} • ${task.responsible}</span>
                                    </div>
                                    <span class="priority-tag ${task.priority}">${task.priority}</span>
                                </li>
                            `).join('') : '<li class="action-item">Nenhuma tarefa pendente</li>'}
                        </ul>
                    </div>
                </div>

                <div class="card">
                    <div class="section-header">
                        <h2>Crescimento Mensal</h2>
                    </div>
                    <div style="height: 250px;">
                        <canvas id="monthlyChart"></canvas>
                    </div>
                </div>
            </div>
        `;

        // Initialize Chart
        setTimeout(() => App.initDashboardChart(), 0);
    },

    async initDashboardChart() {
        const ctx = document.getElementById('monthlyChart');
        if (!ctx) return;

        const regs = await window.Store.get(window.Store.TABLES.REGISTRATIONS);
        const history = App.getMonthlyHistory(regs);
        
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: history.map(h => h.month),
                datasets: [{
                    label: 'Novos Clientes',
                    data: history.map(h => h.count),
                    backgroundColor: '#f38b3c',
                    borderRadius: 6,
                    borderSkipped: false,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1 }
                    },
                    x: {
                        grid: { display: false }
                    }
                }
            }
        });
    },

    calculateMonthlyAverage(regs) {
        if (regs.length === 0) return 0;
        const months = new Set(regs.map(r => r.created_at ? r.created_at.substring(0, 7) : '')).size;
        return (regs.length / (months || 1)).toFixed(1);
    },

    getMonthlyHistory(regs) {
        const history = {};
        regs.forEach(r => {
            if (!r.created_at) return;
            const month = r.created_at.substring(0, 7); // YYYY-MM
            history[month] = (history[month] || 0) + 1;
        });
        
        return Object.entries(history).map(([month, count]) => {
            const [year, m] = month.split('-');
            const date = new Date(year, m - 1);
            const monthName = date.toLocaleString('pt-br', { month: 'long', year: 'numeric' });
            return { month: monthName, count };
        });
    },

    async renderTasks() {
        const tasks = await window.Store.get(window.Store.TABLES.TASKS);
        this.viewContainer.innerHTML = `
            <div class="section-header">
                <h1>Gestão de Tarefas</h1>
                <button class="btn btn-primary" onclick="App.showAddTask()">
                    <i data-lucide="plus"></i> Adicionar Tarefa
                </button>
            </div>
            <div class="card">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Título</th>
                            <th>Responsável</th>
                            <th>Prazo</th>
                            <th>Prioridade</th>
                            <th>Status</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tasks.map(task => `
                            <tr>
                                <td><strong>${task.title}</strong></td>
                                <td>${task.responsible}</td>
                                <td>${task.deadline}</td>
                                <td><span class="tag priority-${task.priority}">${task.priority}</span></td>
                                <td><span class="tag status-${task.status}">${task.status}</span></td>
                                <td>
                                    <button class="btn btn-icon" onclick="App.showEditTask(${task.id})" title="Editar Tarefa">
                                        <i data-lucide="edit-3"></i>
                                    </button>
                                    <button class="btn btn-icon" onclick="App.deleteTask(${task.id})" title="Excluir">
                                        <i data-lucide="trash"></i>
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    async renderFinance() {
        const transactions = await window.Store.get(window.Store.TABLES.TRANSACTIONS);
        const regs = await window.Store.get(window.Store.TABLES.REGISTRATIONS);
        
        // Cálculos
        const totalRevenue = transactions.filter(t => t.type === 'entry').reduce((acc, t) => acc + parseFloat(t.value), 0);
        const totalExpenses = transactions.filter(t => t.type === 'exit').reduce((acc, t) => acc + Math.abs(parseFloat(t.value)), 0);
        const cashFlow = totalRevenue - totalExpenses;
        const averageTicket = regs.length > 0 ? (totalRevenue / regs.length).toFixed(2) : 0;

        // Cálculo por Cliente
        const clientStats = regs.map(reg => {
            const clientTransactions = transactions.filter(t => t.store_id == reg.id && t.type === 'entry');
            const revenue = clientTransactions.reduce((acc, t) => acc + parseFloat(t.value), 0);
            const count = clientTransactions.length;
            const avg = count > 0 ? (revenue / count).toFixed(2) : 0;
            return { name: reg.store_name, revenue, count, avg };
        }).sort((a, b) => b.revenue - a.revenue);

        this.viewContainer.innerHTML = `
            <div class="section-header">
                <h1>Área Financeira</h1>
                <div class="finance-tabs" style="display: flex; gap: 1rem;">
                    <button class="btn btn-primary" onclick="App.showAddTransaction()">
                        <i data-lucide="plus"></i> Nova Transação
                    </button>
                </div>
            </div>

            <div class="dashboard-grid">
                <div class="kpi-card">
                    <span class="label">Ticket Médio (Geral)</span>
                    <span class="value">R$ ${averageTicket}</span>
                    <span class="trend" style="color: var(--accent-primary);"><i data-lucide="info"></i> Por loja cadastrada</span>
                </div>
                <div class="kpi-card">
                    <span class="label">Faturamento Total</span>
                    <span class="value" style="color: var(--success);">R$ ${totalRevenue.toLocaleString('pt-br')}</span>
                    <span class="trend up"><i data-lucide="trending-up"></i> Acumulado Mensal</span>
                </div>
                <div class="kpi-card">
                    <span class="label">Fluxo de Caixa</span>
                    <span class="value" style="color: ${cashFlow >= 0 ? 'var(--text-primary)' : 'var(--danger)'}">R$ ${cashFlow.toLocaleString('pt-br')}</span>
                    <span class="trend"><i data-lucide="bar-chart-2"></i> Saldo Atual</span>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-top: 2rem;">
                <div class="card">
                    <div class="section-header">
                        <h2>Rentabilidade por Cliente</h2>
                    </div>
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Loja / Cliente</th>
                                <th>Serviços</th>
                                <th style="text-align: right;">Ticket Médio</th>
                                <th style="text-align: right;">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${clientStats.map(stat => `
                                <tr>
                                    <td><strong>${stat.name}</strong></td>
                                    <td>${stat.count}</td>
                                    <td align="right">R$ ${stat.avg}</td>
                                    <td align="right" style="color: var(--success); font-weight: 700;">R$ ${stat.revenue.toLocaleString('pt-br')}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                <div class="card">
                    <div class="section-header">
                        <h2>Histórico de Lançamentos</h2>
                    </div>
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Descrição</th>
                                <th style="text-align: right;">Valor</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${transactions.map(t => `
                                <tr>
                                    <td>${t.date}</td>
                                    <td>${t.description}</td>
                                    <td align="right" style="font-weight: 700; color: ${t.type === 'entry' ? 'var(--success)' : 'var(--danger)'}">
                                        ${t.type === 'entry' ? '+' : '-'} R$ ${Math.abs(parseFloat(t.value)).toLocaleString('pt-br')}
                                    </td>
                                </tr>
                            `).reverse().slice(0, 5).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    async renderClients() {
        const clients = await window.Store.get(window.Store.TABLES.CLIENTS);
        this.viewContainer.innerHTML = `
            <div class="section-header">
                <h1>Clientes Cadastrados</h1>
                <button class="btn btn-primary" onclick="App.showAddClient()">
                    <i data-lucide="user-plus"></i> Novo Cliente
                </button>
            </div>
            <div class="card">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>E-mail</th>
                            <th>Telefone</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${clients.map(c => `
                            <tr>
                                <td><strong>${c.name}</strong></td>
                                <td>${c.email || '-'}</td>
                                <td>${c.phone || '-'}</td>
                                <td>
                                    <button class="btn btn-icon" onclick="App.deleteClient(${c.id})"><i data-lucide="trash"></i></button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    // --- Helpers ---

    showQuickAdd() {
        this.modalTitle.innerText = 'Rápido: Novo Registro';
        this.modalBody.innerHTML = `
            <form id="quick-add-form">
                <div class="form-group">
                    <label>O que você quer adicionar?</label>
                    <select class="form-control" id="quick-type">
                        <option value="task">Tarefa</option>
                        <option value="client">Cliente</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Título / Nome</label>
                    <input type="text" class="form-control" id="quick-title" required>
                </div>
                <button type="submit" class="btn btn-primary" style="width: 100%">Salvar</button>
            </form>
        `;
        
        this.showModal();
        
        document.getElementById('quick-add-form').onsubmit = async (e) => {
            e.preventDefault();
            const type = document.getElementById('quick-type').value;
            const title = document.getElementById('quick-title').value;
            
            if (type === 'task') {
                await window.Store.addItem(window.Store.TABLES.TASKS, {
                    title,
                    priority: 'media',
                    deadline: new Date().toISOString().split('T')[0],
                    responsible: 'Gestor',
                    status: 'pendente'
                });
            } else if (type === 'client') {
                await window.Store.addItem(window.Store.TABLES.CLIENTS, {
                    name: title,
                    email: '',
                    phone: ''
                });
            }
            
            App.hideModal();
            await App.render();
            App.showToast('Registro adicionado com sucesso!');
        };
    },

    showAddClient() {
        this.modalTitle.innerText = 'Novo Cliente';
        this.modalBody.innerHTML = `
            <form id="add-client-form">
                <div class="form-group">
                    <label>Nome Completo</label>
                    <input type="text" class="form-control" id="client-name" required>
                </div>
                <div class="form-group">
                    <label>E-mail</label>
                    <input type="email" class="form-control" id="client-email">
                </div>
                <div class="form-group">
                    <label>Telefone</label>
                    <input type="text" class="form-control" id="client-phone">
                </div>
                <button type="submit" class="btn btn-primary" style="width: 100%">Salvar Cliente</button>
            </form>
        `;
        this.showModal();
        document.getElementById('add-client-form').onsubmit = async (e) => {
            e.preventDefault();
            await window.Store.addItem(window.Store.TABLES.CLIENTS, {
                name: document.getElementById('client-name').value,
                email: document.getElementById('client-email').value,
                phone: document.getElementById('client-phone').value
            });
            App.hideModal();
            await App.render();
            App.showToast('Cliente cadastrado!');
        };
    },

    async deleteClient(id) {
        if (confirm('Excluir este cliente?')) {
            await window.Store.deleteItem(window.Store.TABLES.CLIENTS, id);
            await this.render();
            this.showToast('Cliente removido');
        }
    },

    showModal() {
        this.modalOverlay.classList.remove('hidden');
        lucide.createIcons();
    },

    hideModal() {
        this.modalOverlay.classList.add('hidden');
    },

    showToast(msg) {
        const toast = document.createElement('div');
        toast.className = 'toast success';
        toast.innerText = msg;
        const container = document.getElementById('toast-container');
        if (container) {
            container.appendChild(toast);
            setTimeout(() => toast.remove(), 3000);
        }
    },

    async updateAlertCount() {
        if (!window.Store) return;
        const tasks = await window.Store.get(window.Store.TABLES.TASKS);
        const overdue = tasks.filter(t => new Date(t.deadline) < new Date() && t.status !== 'concluido').length;
        if (this.alertBadge) this.alertBadge.innerText = overdue;
    },

    async showAddTask() {
        this.modalTitle.innerText = 'Nova Tarefa';
        this.modalBody.innerHTML = `
            <form id="add-task-form">
                <div class="form-group">
                    <label>Título</label>
                    <input type="text" class="form-control" id="task-title" required>
                </div>
                <div class="form-group">
                    <label>Responsável</label>
                    <select class="form-control" id="task-responsible">
                        <option value="Lucas">Lucas</option>
                        <option value="Mateus">Mateus</option>
                        <option value="Gabriela">Gabriela</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Prazo</label>
                    <input type="date" class="form-control" id="task-deadline" required>
                </div>
                <div class="form-group">
                    <label>Prioridade</label>
                    <select class="form-control" id="task-priority">
                        <option value="baixa">Baixa</option>
                        <option value="media" selected>Média</option>
                        <option value="alta">Alta</option>
                    </select>
                </div>
                <button type="submit" class="btn btn-primary" style="width: 100%">Adicionar Tarefa</button>
            </form>
        `;
        this.showModal();
        document.getElementById('add-task-form').onsubmit = async (e) => {
            e.preventDefault();
            await window.Store.addItem(window.Store.TABLES.TASKS, {
                title: document.getElementById('task-title').value,
                responsible: document.getElementById('task-responsible').value,
                deadline: document.getElementById('task-deadline').value,
                priority: document.getElementById('task-priority').value,
                status: 'pendente'
            });
            App.hideModal();
            await App.render();
            App.showToast('Tarefa criada no banco!');
        };
    },

    async showEditTask(id) {
        const tasks = await window.Store.get(window.Store.TABLES.TASKS);
        const task = tasks.find(t => t.id === id);
        if (!task) return;

        this.modalTitle.innerText = `Editar Tarefa: ${task.title}`;
        this.modalBody.innerHTML = `
            <form id="edit-task-form">
                <div class="form-group">
                    <label>Título da Tarefa</label>
                    <input type="text" class="form-control" id="edit-task-title" value="${task.title}" required>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div class="form-group">
                        <label>Responsável</label>
                        <select class="form-control" id="edit-task-resp">
                            <option value="Lucas" ${task.responsible === 'Lucas' ? 'selected' : ''}>Lucas</option>
                            <option value="Mateus" ${task.responsible === 'Mateus' ? 'selected' : ''}>Mateus</option>
                            <option value="Gabriela" ${task.responsible === 'Gabriela' ? 'selected' : ''}>Gabriela</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Prazo</label>
                        <input type="date" class="form-control" id="edit-task-deadline" value="${task.deadline}">
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem; background: var(--bg-primary); padding: 1rem; border-radius: 8px;">
                    <div class="form-group" style="margin-bottom: 0;">
                        <label>Prioridade</label>
                        <select class="form-control" id="edit-task-priority">
                            <option value="baixa" ${task.priority === 'baixa' ? 'selected' : ''}>Baixa</option>
                            <option value="media" ${task.priority === 'media' ? 'selected' : ''}>Média</option>
                            <option value="alta" ${task.priority === 'alta' ? 'selected' : ''}>Alta</option>
                        </select>
                    </div>
                    <div class="form-group" style="margin-bottom: 0;">
                        <label>Status</label>
                        <select class="form-control" id="edit-task-status">
                            <option value="pendente" ${task.status === 'pendente' ? 'selected' : ''}>Pendente</option>
                            <option value="em-andamento" ${task.status === 'em-andamento' ? 'selected' : ''}>Em Andamento</option>
                            <option value="concluido" ${task.status === 'concluido' ? 'selected' : ''}>Concluído</option>
                        </select>
                    </div>
                </div>
                <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 1.5rem;">Salvar Alterações</button>
            </form>
        `;
        this.showModal();

        document.getElementById('edit-task-form').onsubmit = async (e) => {
            e.preventDefault();
            await window.Store.updateItem(window.Store.TABLES.TASKS, id, {
                title: document.getElementById('edit-task-title').value,
                responsible: document.getElementById('edit-task-resp').value,
                deadline: document.getElementById('edit-task-deadline').value,
                priority: document.getElementById('edit-task-priority').value,
                status: document.getElementById('edit-task-status').value
            });
            
            App.hideModal();
            await App.render();
            App.showToast('Tarefa atualizada na nuvem!');
        };
    },

    async deleteTask(id) {
        if (confirm('Deseja excluir esta tarefa?')) {
            await window.Store.deleteItem(window.Store.TABLES.TASKS, id);
            await this.render();
            this.showToast('Tarefa excluída');
        }
    },

    async showAddRegistration() {
        this.modalTitle.innerText = 'Novo Cadastro de Loja';
        this.modalBody.innerHTML = `
            <form id="add-reg-form">
                <div class="form-group">
                    <label>Nome da Loja / Estabelecimento</label>
                    <input type="text" class="form-control" id="reg-store-name" required>
                </div>
                <div class="form-group">
                    <label>Registro da Loja (REV)</label>
                    <input type="text" class="form-control" id="reg-rev" placeholder="Ex: REV1234">
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div class="form-group">
                        <label>Senha Detran</label>
                        <input type="password" class="form-control" id="reg-detran-pass">
                    </div>
                    <div class="form-group">
                        <label>Senha SERPRO</label>
                        <input type="password" class="form-control" id="reg-serpro-pass">
                    </div>
                </div>
                <button type="submit" class="btn btn-primary" style="width: 100%">Criar Processo</button>
            </form>
        `;
        this.showModal();
        document.getElementById('add-reg-form').onsubmit = async (e) => {
            e.preventDefault();
            await window.Store.addItem(window.Store.TABLES.REGISTRATIONS, {
                store_name: document.getElementById('reg-store-name').value,
                rev_code: document.getElementById('reg-rev').value || 'REV',
                detran_password: document.getElementById('reg-detran-pass').value,
                serpro_password: document.getElementById('reg-serpro-pass').value,
                serpro: 'nao-iniciada',
                detran: 'nao-iniciada',
                renave: 'nao-iniciada'
            });
            App.hideModal();
            await App.render();
            App.showToast('Loja adicionada ao banco de dados!');
        };
    },

    async renderRegistrations() {
        const regs = await window.Store.get(window.Store.TABLES.REGISTRATIONS);
        this.viewContainer.innerHTML = `
            <div class="section-header">
                <h1>Cadastros e Pendências</h1>
                <button class="btn btn-primary" onclick="App.showAddRegistration()">
                    <i data-lucide="plus-circle"></i> Novo Credenciamento
                </button>
            </div>
            <div class="card">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Loja</th>
                            <th>Código REV</th>
                            <th>Etapa SERPRO</th>
                            <th>Etapa Detran/RS</th>
                            <th>Renave Sul</th>
                            <th align="right">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${regs.map(reg => `
                            <tr>
                                <td><strong>${reg.store_name}</strong></td>
                                <td><code>${reg.rev_code}</code></td>
                                <td>
                                    <span class="tag status-${reg.serpro}">${reg.serpro.replace('-', ' ')}</span>
                                </td>
                                <td>
                                    <span class="tag status-${reg.detran}">${reg.detran.replace('-', ' ')}</span>
                                </td>
                                <td>
                                    <span class="tag status-${reg.renave}">${reg.renave === 'concluido' ? 'Ativo' : 'Inativo'}</span>
                                </td>
                                <td align="right">
                                    <button class="btn btn-icon" onclick="App.showEditRegistration(${reg.id})">
                                        <i data-lucide="settings"></i>
                                    </button>
                                    <button class="btn btn-icon" onclick="App.deleteRegistration(${reg.id})">
                                        <i data-lucide="trash"></i>
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    async showEditRegistration(id) {
        const regs = await window.Store.get(window.Store.TABLES.REGISTRATIONS);
        const reg = regs.find(r => r.id === id);
        if (!reg) return;

        this.modalTitle.innerText = `Gestão: ${reg.store_name}`;
        this.modalBody.innerHTML = `
            <form id="edit-reg-form">
                <div class="form-group">
                    <label>Registro da Loja (REV)</label>
                    <input type="text" class="form-control" id="edit-rev" value="${reg.rev_code || 'REV'}" placeholder="Ex: REV1234">
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                    <div class="form-group">
                        <label>Senha Detran</label>
                        <input type="password" class="form-control" id="edit-detran-pass" value="${reg.detran_password || ''}">
                    </div>
                    <div class="form-group">
                        <label>Senha SERPRO</label>
                        <input type="password" class="form-control" id="edit-serpro-pass" value="${reg.serpro_password || ''}">
                    </div>
                </div>

                <div style="background: var(--bg-primary); padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                    <h4 style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 1rem;">Situação dos Cadastros</h4>
                    
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <span style="font-size: 0.875rem;">1. SERPRO</span>
                        <select class="status-select" id="edit-serpro-status" style="width: 140px;">
                            <option value="nao-iniciada" ${reg.serpro === 'nao-iniciada' ? 'selected' : ''}>Não Iniciada</option>
                            <option value="iniciada" ${reg.serpro === 'iniciada' ? 'selected' : ''}>Iniciada</option>
                            <option value="analise" ${reg.serpro === 'analise' ? 'selected' : ''}>Análise</option>
                            <option value="concluido" ${reg.serpro === 'concluido' ? 'selected' : ''}>Concluído</option>
                        </select>
                    </div>

                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <span style="font-size: 0.875rem;">2. Detran/RS</span>
                        <select class="status-select" id="edit-detran-status" style="width: 140px;">
                            <option value="nao-iniciada" ${reg.detran === 'nao-iniciada' ? 'selected' : ''}>Não Iniciada</option>
                            <option value="iniciada" ${reg.detran === 'iniciada' ? 'selected' : ''}>Iniciada</option>
                            <option value="analise" ${reg.detran === 'analise' ? 'selected' : ''}>Análise</option>
                            <option value="concluido" ${reg.detran === 'concluido' ? 'selected' : ''}>Concluído</option>
                        </select>
                    </div>

                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 0.875rem;">3. Acesso Renave Sul</span>
                        <label class="switch">
                            <input type="checkbox" id="edit-renave-status" ${reg.renave === 'concluido' ? 'checked' : ''}>
                            <span class="slider round"></span>
                        </label>
                    </div>
                </div>

                <button type="submit" class="btn btn-primary" style="width: 100%">Salvar Todas as Alterações</button>
            </form>
        `;
        this.showModal();

        document.getElementById('edit-reg-form').onsubmit = async (e) => {
            e.preventDefault();
            await window.Store.updateItem(window.Store.TABLES.REGISTRATIONS, id, {
                rev_code: document.getElementById('edit-rev').value,
                detran_password: document.getElementById('edit-detran-pass').value,
                serpro_password: document.getElementById('edit-serpro-pass').value,
                serpro: document.getElementById('edit-serpro-status').value,
                detran: document.getElementById('edit-detran-status').value,
                renave: document.getElementById('edit-renave-status').checked ? 'concluido' : 'nao-iniciada'
            });
            App.hideModal();
            await App.render();
            App.showToast('Cadastro atualizado no banco!');
        };
    },

    async deleteRegistration(id) {
        if (confirm('Deseja excluir este registro de loja?')) {
            await window.Store.deleteItem(window.Store.TABLES.REGISTRATIONS, id);
            await this.render();
            this.showToast('Registro removido');
        }
    },

    async showAddTransaction() {
        const regs = await window.Store.get(window.Store.TABLES.REGISTRATIONS);
        this.modalTitle.innerText = 'Novo Lançamento Financeiro';
        this.modalBody.innerHTML = `
            <form id="add-trans-form">
                <div class="form-group">
                    <label>Tipo de Lançamento</label>
                    <select class="form-control" id="trans-type" onchange="App.toggleFinanceFields(this.value)">
                        <option value="entry">Entrada (Mensalidade)</option>
                        <option value="exit">Saída (Despesa)</option>
                    </select>
                </div>

                <!-- Campos de ENTRADA -->
                <div id="entry-fields">
                    <div class="form-group">
                        <label>Loja / Cliente</label>
                        <select class="form-control" id="trans-store-id">
                            ${regs.map(r => `<option value="${r.id}">${r.store_name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Mês de Referência</label>
                        <input type="month" class="form-control" id="trans-ref-month" value="${new Date().toISOString().substring(0, 7)}">
                    </div>
                </div>

                <!-- Campos de SAÍDA -->
                <div id="exit-fields" style="display: none;">
                    <div class="form-group">
                        <label>Categoria da Despesa</label>
                        <select class="form-control" id="trans-category">
                            <option value="Combustível">Combustível</option>
                            <option value="Alimentação">Alimentação</option>
                            <option value="Impostos">Impostos</option>
                            <option value="Contabilidade">Contabilidade</option>
                            <option value="Outros">Outros (Diversos)</option>
                        </select>
                    </div>
                </div>

                <div class="form-group">
                    <label>Valor (R$)</label>
                    <input type="number" step="0.01" class="form-control" id="trans-value" required>
                </div>

                <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 1rem;">Confirmar Lançamento</button>
            </form>
        `;
        this.showModal();

        document.getElementById('add-trans-form').onsubmit = async (e) => {
            e.preventDefault();
            const type = document.getElementById('trans-type').value;
            let description = '';
            let storeId = null;

            if (type === 'entry') {
                const storeSelect = document.getElementById('trans-store-id');
                const storeName = storeSelect.options[storeSelect.selectedIndex].text;
                const refMonth = document.getElementById('trans-ref-month').value;
                description = `Mensalidade de ${storeName} referente a ${refMonth}`;
                storeId = parseInt(storeSelect.value);
            } else {
                description = document.getElementById('trans-category').value;
            }

            await window.Store.addItem(window.Store.TABLES.TRANSACTIONS, {
                store_id: storeId,
                date: new Date().toISOString().split('T')[0],
                description: description,
                value: parseFloat(document.getElementById('trans-value').value),
                type: type
            });
            App.hideModal();
            await App.render();
            App.showToast('Lançamento registrado na nuvem!');
        };
    },

    toggleFinanceFields(type) {
        const entryFields = document.getElementById('entry-fields');
        const exitFields = document.getElementById('exit-fields');
        if (type === 'entry') {
            entryFields.style.display = 'block';
            exitFields.style.display = 'none';
        } else {
            entryFields.style.display = 'none';
            exitFields.style.display = 'block';
        }
    },
};

// Start the app with a small delay to ensure Store is ready
window.onload = () => {
    setTimeout(() => {
        if (window.Store) {
            App.init();
        } else {
            console.error('Store ainda não foi carregado.');
            // Tenta novamente em 500ms se falhar
            setTimeout(() => App.init(), 500);
        }
    }, 100);
};
