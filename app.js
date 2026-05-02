/**
 * App Logic for Renave Sul
 */
const App = {
    currentView: 'dashboard',

    async init() {
        if (this.initialized) return;
        this.initialized = true;
        console.log('🚀 Iniciando App...');
        
        const loginScreen = document.getElementById('login-screen');
        const appContainer = document.querySelector('.app-container');
        if (loginScreen) loginScreen.style.display = 'none';
        if (appContainer) appContainer.style.display = 'flex';

        console.log('📦 Aguardando Store...');
        await Store.init();
        
        console.log('🖼️ Renderizando Interface...');
        this.cacheDOM();
        this.bindEvents();
        this.render();
        lucide.createIcons();
        console.log('✅ Sistema Pronto.');
    },

    checkAuth() {
        const isLoggedIn = sessionStorage.getItem('renave_auth');
        const loginScreen = document.getElementById('login-screen');
        const appContainer = document.querySelector('.app-container');

        if (isLoggedIn) {
            loginScreen.style.display = 'none';
            appContainer.style.display = 'flex';
        } else {
            loginScreen.style.display = 'flex';
            appContainer.style.display = 'none';
            this.bindLoginEvents();
        }
    },

    bindLoginEvents() {
        const form = document.getElementById('login-form');
        const errorMsg = document.getElementById('login-error');

        form.onsubmit = (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const pass = document.getElementById('login-password').value;

            if (email === 'admin@renavesul.com.br' && pass === 'R3n@ve26') {
                sessionStorage.setItem('renave_auth', 'true');
                this.checkAuth();
            } else {
                errorMsg.style.display = 'block';
                setTimeout(() => { errorMsg.style.display = 'none'; }, 3000);
            }
        };
    },

    fileHandle: null,

    async requestFileSystemAccess() {
        try {
            // Se já tivermos um vínculo, tentamos usá-lo (o navegador pedirá permissão)
            if (!this.fileHandle) {
                this.fileHandle = await window.showSaveFilePicker({
                    suggestedName: 'renave_sul_database.json',
                    types: [{
                        description: 'Arquivo de Dados JSON',
                        accept: {'application/json': ['.json']},
                    }],
                });
            }

            // Garante que temos permissão de escrita
            const options = { mode: 'readwrite' };
            if ((await this.fileHandle.queryPermission(options)) !== 'granted') {
                if ((await this.fileHandle.requestPermission(options)) !== 'granted') {
                    throw new Error('Permissão negada');
                }
            }

            this.showToast('✅ Conexão com o arquivo restabelecida!');
            this.updateSyncButton(true);
            this.syncToDisk();
        } catch (err) {
            console.error('Erro ao acessar arquivo:', err);
            this.fileHandle = null;
            this.updateSyncButton(false);
        }
    },

    updateSyncButton(active) {
        const btn = document.getElementById('sync-btn');
        if (active) {
            btn.style.color = 'var(--success)';
            btn.innerHTML = '<i data-lucide="refresh-cw"></i><span>Auto-Sync Ativo</span>';
        } else {
            btn.style.color = 'var(--accent-primary)';
            btn.innerHTML = '<i data-lucide="shield-check"></i><span>Reativar Sync</span>';
        }
        lucide.createIcons();
    },

    async syncToDisk() {
        if (!this.fileHandle) return;
        
        try {
            const fullData = {
                tasks: Store.get(Store.KEYS.TASKS),
                clients: Store.get(Store.KEYS.CLIENTS),
                registrations: Store.get(Store.KEYS.REGISTRATIONS),
                transactions: Store.get(Store.KEYS.TRANSACTIONS),
                lastUpdate: new Date().toISOString()
            };

            // Criamos o writable com a opção de NÃO manter dados antigos (sobrescrita total)
            const writable = await this.fileHandle.createWritable({ keepExistingData: false });
            await writable.write(JSON.stringify(fullData, null, 2));
            await writable.close();
        } catch (err) {
            console.error('Erro na sincronização:', err);
        }
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

    renderFinance() {
        const transactions = Store.get(Store.KEYS.TRANSACTIONS);
        const regs = Store.get(Store.KEYS.REGISTRATIONS);
        
        // Cálculos
        const totalRevenue = transactions.filter(t => t.type === 'entry').reduce((acc, t) => acc + t.value, 0);
        const totalExpenses = transactions.filter(t => t.type === 'exit').reduce((acc, t) => acc + Math.abs(t.value), 0);
        const cashFlow = totalRevenue - totalExpenses;
        const averageTicket = regs.length > 0 ? (totalRevenue / regs.length).toFixed(2) : 0;

        // Cálculo por Cliente
        const clientStats = regs.map(reg => {
            const clientTransactions = transactions.filter(t => t.storeId === reg.id && t.type === 'entry');
            const revenue = clientTransactions.reduce((acc, t) => acc + t.value, 0);
            const count = clientTransactions.length;
            const avg = count > 0 ? (revenue / count).toFixed(2) : 0;
            return { name: reg.storeName, revenue, count, avg };
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
                                    <td>${t.desc}</td>
                                    <td align="right" style="font-weight: 700; color: ${t.type === 'entry' ? 'var(--success)' : 'var(--danger)'}">
                                        ${t.type === 'entry' ? '+' : '-'} R$ ${Math.abs(t.value).toLocaleString('pt-br')}
                                    </td>
                                </tr>
                            `).reverse().slice(0, 5).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    showAddTransaction() {
        const regs = Store.get(Store.KEYS.REGISTRATIONS);
        this.modalTitle.innerText = 'Novo Lançamento Financeiro';
        this.modalBody.innerHTML = `
            <form id="add-trans-form">
                <div class="form-group">
                    <label>Tipo de Lançamento</label>
                    <select class="form-control" id="trans-type" onchange="App.toggleFinanceFields(this.value)">
                        <option value="entry">Entrada (Receita de Cliente)</option>
                        <option value="exit">Saída (Despesa Operacional)</option>
                    </select>
                </div>

                <!-- Campos de ENTRADA -->
                <div id="entry-fields">
                    <div class="form-group">
                        <label>Loja / Cliente</label>
                        <select class="form-control" id="trans-store-id">
                            ${regs.map(r => `<option value="${r.id}">${r.storeName}</option>`).join('')}
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

        document.getElementById('add-trans-form').onsubmit = (e) => {
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

            Store.addItem(Store.KEYS.TRANSACTIONS, {
                storeId: storeId,
                date: new Date().toISOString().split('T')[0],
                desc: description,
                value: parseFloat(document.getElementById('trans-value').value),
                type: type
            });
            App.hideModal();
            App.render();
            App.showToast('Lançamento padronizado registrado!');
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

    renderClients() {
        const clients = Store.get(Store.KEYS.CLIENTS);
        this.viewContainer.innerHTML = `
            <div class="section-header">
                <h1>Controle de Clientes</h1>
                <button class="btn btn-primary" onclick="App.showAddClient()">
                    <i data-lucide="user-plus"></i> Novo Cliente
                </button>
            </div>
            <div class="grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem;">
                ${clients.map(client => `
                    <div class="card client-card">
                        <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                            <div class="avatar">${client.name.substring(0,2).toUpperCase()}</div>
                            <div>
                                <h3 style="font-size: 1rem;">${client.name}</h3>
                                <span class="text-muted" style="font-size: 0.75rem;">${client.email}</span>
                            </div>
                        </div>
                        <div style="font-size: 0.875rem; color: var(--text-secondary);">
                            <p><i data-lucide="phone" style="width: 14px;"></i> ${client.phone}</p>
                        </div>
                        <hr style="border: 0; border-top: 1px solid var(--bg-tertiary); margin: 1rem 0;">
                        <button class="btn btn-icon" style="width: 100%;">Ver Histórico</button>
                    </div>
                `).join('')}
            </div>
        `;
    },

    renderRegistrations() {
        const regs = Store.get(Store.KEYS.REGISTRATIONS);
        
        const statuses = [
            { id: 'nao-iniciada', label: 'Não Iniciada' },
            { id: 'iniciada', label: 'Iniciada' },
            { id: 'analise', label: 'Análise' },
            { id: 'concluido', label: 'Concluído' }
        ];

        this.viewContainer.innerHTML = `
            <div class="section-header">
                <div>
                    <h1>Cadastros e Credenciamentos</h1>
                    <p class="text-secondary">Controle de situação por etapa</p>
                </div>
                <button class="btn btn-primary" onclick="App.showAddRegistration()">
                    <i data-lucide="plus"></i> Novo Cadastro de Loja
                </button>
            </div>
            <div class="card">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Loja / Estabelecimento</th>
                            <th style="text-align: center;">1. SERPRO (Situação)</th>
                            <th style="text-align: center;">2. Detran/RS (Situação)</th>
                            <th style="text-align: center;">3. Renave Sul (Acesso)</th>
                            <th style="text-align: right;">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${regs.map(reg => {
                            const getStatusTag = (status) => {
                                const map = {
                                    'nao-iniciada': { label: 'Pendente', class: 'status-nao-iniciada' },
                                    'iniciada': { label: 'Iniciada', class: 'status-iniciada' },
                                    'analise': { label: 'Análise', class: 'status-analise' },
                                    'concluido': { label: 'Concluído', class: 'status-concluido' }
                                };
                                const info = map[status] || { label: status, class: '' };
                                return `<span class="tag ${info.class}">${info.label}</span>`;
                            };

                            return `
                                <tr>
                                    <td>
                                        <div style="display: flex; flex-direction: column;">
                                            <strong>${reg.storeName}</strong>
                                            <span style="font-size: 0.7rem; color: var(--text-muted);">${reg.revCode || 'Sem Registro'}</span>
                                        </div>
                                    </td>
                                    <td align="center">${getStatusTag(reg.serpro)}</td>
                                    <td align="center">${getStatusTag(reg.detran)}</td>
                                    <td align="center">
                                        <span class="tag ${reg.renave === 'concluido' ? 'status-concluido' : 'status-nao-iniciada'}">
                                            ${reg.renave === 'concluido' ? 'ATIVO' : 'INATIVO'}
                                        </span>
                                    </td>
                                    <td align="right">
                                        <button class="btn btn-icon" onclick="App.showEditRegistration(${reg.id})" title="Editar Detalhes e Situação">
                                            <i data-lucide="edit-3"></i>
                                        </button>
                                        <button class="btn btn-icon" onclick="App.deleteRegistration(${reg.id})" title="Excluir">
                                            <i data-lucide="trash"></i>
                                        </button>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    updateStageStatus(id, stage, value) {
        const regs = Store.get(Store.KEYS.REGISTRATIONS);
        const index = regs.findIndex(r => r.id === id);
        if (index === -1) return;
        
        regs[index][stage] = value;
        Store.save(Store.KEYS.REGISTRATIONS, regs);
        this.render();
        this.showToast('Situação atualizada');
    },

    toggleRenaveStatus(id, checked) {
        const regs = Store.get(Store.KEYS.REGISTRATIONS);
        const index = regs.findIndex(r => r.id === id);
        if (index === -1) return;
        
        regs[index].renave = checked ? 'concluido' : 'nao-iniciada';
        Store.save(Store.KEYS.REGISTRATIONS, regs);
        this.render();
        this.showToast(checked ? 'Loja Ativada na Renave' : 'Loja Inativada na Renave');
    },

    render() {
        this.viewContainer.innerHTML = '';
        
        switch (this.currentView) {
            case 'dashboard':
                this.renderDashboard();
                // Initialize chart after DOM is updated
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
        
        // Auto-sync ao disco se estiver ativo
        if (this.fileHandle) {
            this.syncToDisk();
        }
    },

    // --- Renderers ---

    renderDashboard() {
        const tasks = Store.get(Store.KEYS.TASKS);
        const appointments = Store.get(Store.KEYS.APPOINTMENTS);
        const regs = Store.get(Store.KEYS.REGISTRATIONS);

        const pendingTasks = tasks.filter(t => t.status === 'pendente').length;
        const overdueTasks = tasks.filter(t => new Date(t.deadline) < new Date() && t.status !== 'concluido').length;
        const todayAppointments = appointments.length;

        // Cálculo de Processos em Andamento (Cadastros)
        // Consideramos em andamento qualquer loja que não esteja com as 3 etapas concluídas
        const ongoingRegistrations = regs.filter(r => 
            r.serpro !== 'concluido' || r.detran !== 'concluido' || r.renave !== 'concluido'
        ).length;

        this.viewContainer.innerHTML = `
            <div class="dashboard-header" style="margin-bottom: 2rem;">
                <nav class="breadcrumbs" style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 0.5rem;">
                    Painel de Controle > Dashboard
                </nav>
                <h1 style="font-size: 2rem; font-weight: 800; color: var(--text-primary);">Dashboard Operacional</h1>
            </div>

            <div class="dashboard-grid">
                <div class="kpi-card">
                    <span class="label">Tarefas Pendentes</span>
                    <span class="value">${pendingTasks}</span>
                    <span class="trend" style="color: var(--accent-primary);"><i data-lucide="activity"></i> Em dia</span>
                </div>
                <div class="kpi-card">
                    <span class="label">Pendências Urgentes</span>
                    <span class="value" style="color: var(--danger);">${overdueTasks}</span>
                    <span class="trend down"><i data-lucide="alert-triangle"></i> Requer atenção</span>
                </div>
                <div class="kpi-card">
                    <span class="label">Visitas Hoje</span>
                    <span class="value">${todayAppointments}</span>
                    <span class="trend" style="color: var(--accent-primary);"><i data-lucide="calendar"></i> Agendado</span>
                </div>
                <div class="kpi-card">
                    <span class="label">Cadastros em Andamento</span>
                    <span class="value" style="color: var(--accent-primary);">${ongoingRegistrations}</span>
                    <span class="trend"><i data-lucide="refresh-cw"></i> Sincronizado com Cadastros</span>
                </div>
            </div>

            <div class="dashboard-sections" style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
                <div class="section">
                    <div class="section-header">
                        <h2>Próximas Ações (Tarefas)</h2>
                    </div>
                    <div class="card">
                        <ul class="action-list">
                            ${tasks.slice(0, 3).map(task => `
                                <li class="action-item">
                                    <div class="status-indicator ${task.status}"></div>
                                    <div class="action-details">
                                        <span class="title">${task.title}</span>
                                        <span class="meta">${task.deadline} • ${task.responsible}</span>
                                    </div>
                                    <span class="priority-tag ${task.priority}">${task.priority}</span>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                </div>

                <div class="section">
                    <div class="section-header">
                        <h2>Crescimento Mensal</h2>
                        <span style="font-size: 0.75rem; color: var(--success); font-weight: 700;">Média: ${App.calculateMonthlyAverage(regs)}/mês</span>
                    </div>
                    <div class="card">
                        <canvas id="monthlyChart" height="150"></canvas>
                    </div>
                </div>
            </div>
        `;
    },

    initDashboardChart() {
        const ctx = document.getElementById('monthlyChart');
        if (!ctx) return;

        const regs = Store.get(Store.KEYS.REGISTRATIONS);
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
        const months = new Set(regs.map(r => r.createdAt ? r.createdAt.substring(0, 7) : '')).size;
        return (regs.length / (months || 1)).toFixed(1);
    },

    getMonthlyHistory(regs) {
        const history = {};
        regs.forEach(r => {
            if (!r.createdAt) return;
            const month = r.createdAt.substring(0, 7); // YYYY-MM
            history[month] = (history[month] || 0) + 1;
        });
        
        return Object.entries(history).map(([month, count]) => {
            const [year, m] = month.split('-');
            const date = new Date(year, m - 1);
            const monthName = date.toLocaleString('pt-br', { month: 'long', year: 'numeric' });
            return { month: monthName, count };
        });
    },

    renderTasks() {
        const tasks = Store.get(Store.KEYS.TASKS);
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

    // --- Helpers ---

    showQuickAdd() {
        this.modalTitle.innerText = 'Rápido: Novo Registro';
        this.modalBody.innerHTML = `
            <form id="quick-add-form">
                <div class="form-group">
                    <label>O que você quer adicionar?</label>
                    <select class="form-control" id="quick-type">
                        <option value="task">Tarefa</option>
                        <option value="appointment">Compromisso</option>
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
        
        document.getElementById('quick-add-form').onsubmit = (e) => {
            e.preventDefault();
            const type = document.getElementById('quick-type').value;
            const title = document.getElementById('quick-title').value;
            
            if (type === 'task') {
                Store.addItem(Store.KEYS.TASKS, {
                    title,
                    desc: '',
                    priority: 'media',
                    deadline: new Date().toISOString().split('T')[0],
                    responsible: 'Gestor',
                    status: 'pendente'
                });
            }
            
            App.hideModal();
            App.render();
            App.showToast('Registro adicionado com sucesso!');
        };
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
        document.getElementById('toast-container').appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    },

    showAddTask() {
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
        document.getElementById('add-task-form').onsubmit = (e) => {
            e.preventDefault();
            Store.addItem(Store.KEYS.TASKS, {
                title: document.getElementById('task-title').value,
                responsible: document.getElementById('task-responsible').value,
                deadline: document.getElementById('task-deadline').value,
                priority: document.getElementById('task-priority').value,
                status: 'pendente'
            });
            App.hideModal();
            App.render();
            App.showToast('Tarefa criada!');
        };
    },

    showEditTask(id) {
        const tasks = Store.get(Store.KEYS.TASKS);
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

        document.getElementById('edit-task-form').onsubmit = (e) => {
            e.preventDefault();
            const updatedTasks = Store.get(Store.KEYS.TASKS);
            const index = updatedTasks.findIndex(t => t.id === id);
            
            updatedTasks[index] = {
                ...updatedTasks[index],
                title: document.getElementById('edit-task-title').value,
                responsible: document.getElementById('edit-task-resp').value,
                deadline: document.getElementById('edit-task-deadline').value,
                priority: document.getElementById('edit-task-priority').value,
                status: document.getElementById('edit-task-status').value
            };
            
            Store.save(Store.KEYS.TASKS, updatedTasks);
            App.hideModal();
            App.render();
            App.showToast('Tarefa atualizada!');
        };
    },

    deleteTask(id) {
        if (confirm('Deseja excluir esta tarefa?')) {
            Store.deleteItem(Store.KEYS.TASKS, id);
            this.render();
            this.showToast('Tarefa excluída');
        }
    },

    updateAlertCount() {
        const overdue = Store.get(Store.KEYS.TASKS).filter(t => new Date(t.deadline) < new Date() && t.status !== 'concluido').length;
        this.alertBadge.innerText = overdue;
    },

    showAddRegistration() {
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
        document.getElementById('add-reg-form').onsubmit = (e) => {
            e.preventDefault();
            Store.addItem(Store.KEYS.REGISTRATIONS, {
                storeName: document.getElementById('reg-store-name').value,
                revCode: document.getElementById('reg-rev').value || 'REV',
                createdAt: new Date().toISOString(),
                detranPassword: document.getElementById('reg-detran-pass').value,
                serproPassword: document.getElementById('reg-serpro-pass').value,
                serpro: 'nao-iniciada',
                detran: 'nao-iniciada',
                renave: 'nao-iniciada'
            });
            App.hideModal();
            App.render();
            App.showToast('Loja adicionada ao fluxo!');
        };
    },

    showEditRegistration(id) {
        const regs = Store.get(Store.KEYS.REGISTRATIONS);
        const reg = regs.find(r => r.id === id);
        if (!reg) return;

        this.modalTitle.innerText = `Gestão: ${reg.storeName}`;
        this.modalBody.innerHTML = `
            <form id="edit-reg-form">
                <div class="form-group">
                    <label>Registro da Loja (REV)</label>
                    <input type="text" class="form-control" id="edit-rev" value="${reg.revCode || 'REV'}" placeholder="Ex: REV1234">
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                    <div class="form-group">
                        <label>Senha Detran</label>
                        <input type="password" class="form-control" id="edit-detran-pass" value="${reg.detranPassword || ''}">
                    </div>
                    <div class="form-group">
                        <label>Senha SERPRO</label>
                        <input type="password" class="form-control" id="edit-serpro-pass" value="${reg.serproPassword || ''}">
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

        document.getElementById('edit-reg-form').onsubmit = (e) => {
            e.preventDefault();
            const updatedRegs = Store.get(Store.KEYS.REGISTRATIONS);
            const index = updatedRegs.findIndex(r => r.id === id);
            
            updatedRegs[index] = {
                ...updatedRegs[index],
                revCode: document.getElementById('edit-rev').value,
                detranPassword: document.getElementById('edit-detran-pass').value,
                serproPassword: document.getElementById('edit-serpro-pass').value,
                serpro: document.getElementById('edit-serpro-status').value,
                detran: document.getElementById('edit-detran-status').value,
                renave: document.getElementById('edit-renave-status').checked ? 'concluido' : 'nao-iniciada'
            };
            
            Store.save(Store.KEYS.REGISTRATIONS, updatedRegs);
            App.hideModal();
            App.render();
            App.showToast('Cadastro atualizado com sucesso!');
        };
    },

    deleteRegistration(id) {
        if (confirm('Deseja excluir este registro de loja?')) {
            Store.deleteItem(Store.KEYS.REGISTRATIONS, id);
            this.render();
            this.showToast('Registro removido');
        }
    },
};

// Start the app
window.onload = () => App.init();
