/**
 * Renave Sul v3.0 - Cloud Management System
 * Unified Logic File
 */

// --- 1. CONFIGURAÇÃO DO BANCO (STORE) ---
const SUPABASE_CONFIG = {
    url: 'https://vlvngvhrfydtejbjfbrn.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsdm5ndmhyZnlkdGVqYmpmYnJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3MzcwMDUsImV4cCI6MjA5MzMxMzAwNX0.DpbF_oC0xne36qc4t_XZ8WfMuOfjK9vqRL_65DVcMOE'
};

let supabaseClient = null;

function getSupabase() {
    if (!supabaseClient) {
        try {
            const lib = window.supabase || window.supabaseJS;
            if (lib) {
                supabaseClient = lib.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.key);
                console.log('✅ Supabase conectado.');
                document.getElementById('system-status').classList.add('online');
            }
        } catch (e) {
            console.error('❌ Erro Supabase:', e);
        }
    }
    return supabaseClient;
}

window.Store = {
    TABLES: {
        TASKS: 'tasks',
        CLIENTS: 'clients',
        REGISTRATIONS: 'registrations',
        TRANSACTIONS: 'transactions'
    },

    async getAll(table) {
        const client = getSupabase();
        if (!client) return [];
        const { data, error } = await client.from(table).select('*').order('created_at', { ascending: false });
        if (error) { console.error(`Erro ao buscar ${table}:`, error); return []; }
        return data || [];
    },

    async add(table, item) {
        const client = getSupabase();
        if (!client) return null;
        const { data, error } = await client.from(table).insert([item]).select();
        return error ? null : data[0];
    },

    async update(table, id, updates) {
        const client = getSupabase();
        if (!client) return;
        await client.from(table).update(updates).eq('id', id);
    },

    async remove(table, id) {
        const client = getSupabase();
        if (!client) return;
        await client.from(table).delete().eq('id', id);
    }
};

// --- 2. LÓGICA DA INTERFACE (APP) ---
window.App = {
    currentView: 'dashboard',
    userData: { name: 'Gestor', role: 'Administrador' },

    init() {
        console.log('🚀 Iniciando Renave Sul v3.0...');
        
        // Alerta de protocolo local
        if (window.location.protocol === 'file:') {
            alert('⚠️ ATENÇÃO: Você abriu o arquivo diretamente. Para o banco de dados funcionar localmente, você deve rodar um servidor (ex: npx serve) ou usar o link da Vercel.');
        }

        this.bindEvents();
        this.checkAuth();
        getSupabase(); // Forçar conexão inicial
    },

    checkAuth() {
        // Modo Desenvolvedor: Login sempre ativo
        const loginScreen = document.getElementById('login-screen');
        const appWrapper = document.querySelector('.app-wrapper');

        if (loginScreen) loginScreen.style.display = 'none';
        if (appWrapper) appWrapper.style.display = 'flex';
        this.render();
    },

    bindLogin() {
        const form = document.getElementById('login-form');
        form.onsubmit = async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value.trim();
            const pass = document.getElementById('login-password').value.trim();

            if (email === 'admin@renave-sul.com.br' && pass === 'R3n@ve26') {
                sessionStorage.setItem('renave_auth', 'true');
                this.checkAuth();
            } else {
                document.getElementById('login-error').style.display = 'block';
            }
        };
    },

    bindEvents() {
        // Navegação
        document.querySelectorAll('.sidebar-nav li').forEach(item => {
            item.onclick = () => {
                document.querySelectorAll('.sidebar-nav li').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                this.currentView = item.dataset.view;
                this.render();
                // Fechar sidebar no mobile
                document.querySelector('.sidebar').classList.remove('active');
                document.getElementById('sidebar-overlay').classList.remove('active');
            };
        });

        // Toggle Mobile
        const btnToggle = document.getElementById('mobile-toggle');
        const overlay = document.getElementById('sidebar-overlay');
        const sidebar = document.querySelector('.sidebar');
        
        btnToggle.onclick = () => {
            sidebar.classList.add('active');
            overlay.classList.add('active');
        };
        
        overlay.onclick = () => {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
        };
    },

    async render() {
        const container = document.getElementById('view-container');
        if (!container) return;

        container.innerHTML = '<div class="loader-box">Carregando dados...</div>';

        switch(this.currentView) {
            case 'dashboard': await this.renderDashboard(container); break;
            case 'tasks': await this.renderTasks(container); break;
            case 'finance': await this.renderFinance(container); break;
            case 'clients': await this.renderClients(container); break;
            case 'registrations': await this.renderRegistrations(container); break;
        }

        lucide.createIcons();
    },

    // --- Renderers ---

    async renderDashboard(container) {
        const tasks = await window.Store.getAll(window.Store.TABLES.TASKS);
        const regs = await window.Store.getAll(window.Store.TABLES.REGISTRATIONS);
        
        const pending = tasks.filter(t => t.status === 'pendente').length;
        const overdue = tasks.filter(t => t.deadline && new Date(t.deadline) < new Date() && t.status !== 'concluido').length;

        container.innerHTML = `
            <div class="dashboard-grid">
                <div class="kpi-card">
                    <span class="label">Tarefas Pendentes</span>
                    <span class="value">${pending}</span>
                </div>
                <div class="kpi-card" style="border-color: var(--danger)">
                    <span class="label">Processos Atrasados</span>
                    <span class="value" style="color: var(--danger)">${overdue}</span>
                </div>
                <div class="kpi-card">
                    <span class="label">Total de Clientes</span>
                    <span class="value">${regs.length}</span>
                </div>
                <div class="kpi-card" style="border-color: var(--success)">
                    <span class="label">Credenciamentos Ativos</span>
                    <span class="value">${regs.filter(r => r.renave === 'concluido').length}</span>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem;">
                <div class="card">
                    <div class="section-header"><h2>Ações Recentes</h2></div>
                    <ul style="list-style: none;">
                        ${tasks.slice(0, 5).map(t => `
                            <li style="padding: 0.8rem 0; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between;">
                                <div>
                                    <div style="font-weight: 600;">${t.title}</div>
                                    <div style="font-size: 0.75rem; color: var(--text-muted);">${t.responsible} • ${t.deadline}</div>
                                </div>
                                <span class="tag tag-pending">${t.status}</span>
                            </li>
                        `).join('') || '<li>Nenhuma tarefa recente.</li>'}
                    </ul>
                </div>
                <div class="card">
                    <div class="section-header"><h2>Crescimento Mensal</h2></div>
                    <div style="height: 250px;"><canvas id="chart-growth"></canvas></div>
                </div>
            </div>
        `;
        this.initChart(regs);
    },

    initChart(regs) {
        const ctx = document.getElementById('chart-growth');
        if (!ctx) return;
        const history = {};
        regs.forEach(r => {
            const m = r.created_at ? r.created_at.substring(0, 7) : new Date().toISOString().substring(0, 7);
            history[m] = (history[m] || 0) + 1;
        });
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Object.keys(history),
                datasets: [{ label: 'Novos Clientes', data: Object.values(history), backgroundColor: '#f38b3c', borderRadius: 5 }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    },

    async renderTasks(container) {
        const items = await window.Store.getAll(window.Store.TABLES.TASKS);
        container.innerHTML = `
            <div class="section-header">
                <h1>Gestão de Tarefas</h1>
                <button class="btn-primary" onclick="window.App.showAddTask()"><i data-lucide="plus"></i> Nova Tarefa</button>
            </div>
            <div class="card" style="overflow-x: auto;">
                <table class="data-table">
                    <thead><tr><th>Tarefa</th><th>Responsável</th><th>Prazo</th><th>Status</th><th>Ações</th></tr></thead>
                    <tbody>${items.map(t => `
                        <tr>
                            <td><strong>${t.title}</strong></td>
                            <td>${t.responsible}</td>
                            <td>${t.deadline}</td>
                            <td><span class="tag tag-pending">${t.status}</span></td>
                            <td><button class="btn-icon" onclick="window.App.deleteItem('${window.Store.TABLES.TASKS}', ${t.id})"><i data-lucide="trash-2"></i></button></td>
                        </tr>`).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    async renderFinance(container) {
        const trans = await window.Store.getAll(window.Store.TABLES.TRANSACTIONS);
        const total = trans.reduce((acc, t) => acc + (t.type === 'entry' ? parseFloat(t.value) : -parseFloat(t.value)), 0);
        
        container.innerHTML = `
            <div class="section-header">
                <h1>Fluxo Financeiro</h1>
                <button class="btn-primary" onclick="window.App.showAddFinance()"><i data-lucide="plus"></i> Novo Lançamento</button>
            </div>
            <div class="kpi-card" style="margin-bottom: 1.5rem; max-width: 300px;">
                <span class="label">Saldo Consolidado</span>
                <span class="value" style="color: ${total >= 0 ? 'var(--success)' : 'var(--danger)'}">R$ ${total.toFixed(2)}</span>
            </div>
            <div class="card" style="overflow-x: auto;">
                <table class="data-table">
                    <thead><tr><th>Data</th><th>Descrição</th><th>Tipo</th><th>Valor</th></tr></thead>
                    <tbody>${trans.map(t => `
                        <tr>
                            <td>${t.date}</td>
                            <td>${t.description}</td>
                            <td><span class="tag ${t.type === 'entry' ? 'tag-success' : 'tag-danger'}">${t.type}</span></td>
                            <td style="font-weight: 700;">R$ ${parseFloat(t.value).toFixed(2)}</td>
                        </tr>`).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    async renderClients(container) {
        const items = await window.Store.getAll(window.Store.TABLES.CLIENTS);
        container.innerHTML = `
            <div class="section-header">
                <h1>Base de Clientes</h1>
                <button class="btn-primary" onclick="window.App.showAddClient()"><i data-lucide="user-plus"></i> Novo Cliente</button>
            </div>
            <div class="card" style="overflow-x: auto;">
                <table class="data-table">
                    <thead><tr><th>Nome</th><th>Contato</th><th>Ações</th></tr></thead>
                    <tbody>${items.map(c => `
                        <tr>
                            <td><strong>${c.name}</strong></td>
                            <td>${c.email || c.phone || '-'}</td>
                            <td><button class="btn-icon" onclick="window.App.deleteItem('${window.Store.TABLES.CLIENTS}', ${c.id})"><i data-lucide="trash-2"></i></button></td>
                        </tr>`).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    async renderRegistrations(container) {
        const items = await window.Store.getAll(window.Store.TABLES.REGISTRATIONS);
        container.innerHTML = `
            <div class="section-header">
                <h1>Credenciamentos</h1>
                <button class="btn-primary" onclick="window.App.showAddReg()"><i data-lucide="file-plus"></i> Nova Loja</button>
            </div>
            <div class="card" style="overflow-x: auto;">
                <table class="data-table">
                    <thead><tr><th>Loja</th><th>SERPRO</th><th>Detran</th><th>Renave</th><th>Ações</th></tr></thead>
                    <tbody>${items.map(r => `
                        <tr>
                            <td><strong>${r.store_name}</strong></td>
                            <td><span class="tag tag-pending">${r.serpro}</span></td>
                            <td><span class="tag tag-pending">${r.detran}</span></td>
                            <td><span class="tag ${r.renave === 'concluido' ? 'tag-success' : 'tag-pending'}">${r.renave}</span></td>
                            <td><button class="btn-icon" onclick="window.App.deleteItem('${window.Store.TABLES.REGISTRATIONS}', ${r.id})"><i data-lucide="trash-2"></i></button></td>
                        </tr>`).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    // --- Modais ---
    showModal(title, bodyHtml) {
        document.getElementById('modal-title').innerText = title;
        document.getElementById('modal-body').innerHTML = bodyHtml;
        document.getElementById('modal-container').classList.remove('hidden');
    },
    hideModal() {
        document.getElementById('modal-container').classList.add('hidden');
    },

    showAddTask() {
        this.showModal('Nova Tarefa', `
            <form id="form-add">
                <div class="form-group"><label>Título</label><input type="text" id="f-title" required></div>
                <div class="form-group"><label>Responsável</label><select id="f-resp" style="width:100%; padding:0.8rem; border-radius:10px; border:2px solid var(--border);"><option>Lucas</option><option>Mateus</option><option>Gabriela</option></select></div>
                <div class="form-group"><label>Prazo</label><input type="date" id="f-date" required></div>
                <button type="submit" class="btn-primary-lg">Salvar Tarefa</button>
            </form>
        `);
        document.getElementById('form-add').onsubmit = async (e) => {
            e.preventDefault();
            await window.Store.add(window.Store.TABLES.TASKS, { 
                title: document.getElementById('f-title').value, 
                responsible: document.getElementById('f-resp').value,
                deadline: document.getElementById('f-date').value,
                status: 'pendente'
            });
            this.hideModal(); this.render();
        };
    },

    showAddClient() {
        this.showModal('Novo Cliente', `
            <form id="form-add">
                <div class="form-group"><label>Nome</label><input type="text" id="f-name" required></div>
                <div class="form-group"><label>E-mail</label><input type="email" id="f-email"></div>
                <button type="submit" class="btn-primary-lg">Salvar Cliente</button>
            </form>
        `);
        document.getElementById('form-add').onsubmit = async (e) => {
            e.preventDefault();
            await window.Store.add(window.Store.TABLES.CLIENTS, { 
                name: document.getElementById('f-name').value, 
                email: document.getElementById('f-email').value 
            });
            this.hideModal(); this.render();
        };
    },

    showAddReg() {
        this.showModal('Novo Credenciamento', `
            <form id="form-add">
                <div class="form-group"><label>Nome da Loja</label><input type="text" id="f-store" required></div>
                <div class="form-group"><label>Código REV</label><input type="text" id="f-rev" placeholder="REV1234"></div>
                <button type="submit" class="btn-primary-lg">Iniciar Processo</button>
            </form>
        `);
        document.getElementById('form-add').onsubmit = async (e) => {
            e.preventDefault();
            await window.Store.add(window.Store.TABLES.REGISTRATIONS, { 
                store_name: document.getElementById('f-store').value,
                rev_code: document.getElementById('f-rev').value || 'REV',
                serpro: 'pendente', 
                detran: 'pendente',
                renave: 'pendente'
            });
            this.hideModal(); this.render();
        };
    },

    showAddFinance() {
        this.showModal('Novo Lançamento', `
            <form id="form-add">
                <div class="form-group"><label>Descrição</label><input type="text" id="f-desc" required></div>
                <div class="form-group"><label>Valor (R$)</label><input type="number" step="0.01" id="f-val" required></div>
                <div class="form-group"><label>Tipo</label>
                    <select id="f-type" style="width:100%; padding:0.8rem; border-radius:10px; border:2px solid var(--border);">
                        <option value="entry">Entrada (Receita)</option>
                        <option value="exit">Saída (Despesa)</option>
                    </select>
                </div>
                <button type="submit" class="btn-primary-lg">Salvar Lançamento</button>
            </form>
        `);
        document.getElementById('form-add').onsubmit = async (e) => {
            e.preventDefault();
            await window.Store.add(window.Store.TABLES.TRANSACTIONS, { 
                description: document.getElementById('f-desc').value,
                value: document.getElementById('f-val').value,
                type: document.getElementById('f-type').value,
                date: new Date().toISOString().split('T')[0]
            });
            this.hideModal(); this.render();
        };
    },

    async updateRegStatus(id, field, value) {
        const updates = {};
        updates[field] = value;
        await window.Store.update(window.Store.TABLES.REGISTRATIONS, id, updates);
        this.render();
    },

    async deleteItem(table, id) {
        if (confirm('Deseja excluir este item permanentemente?')) {
            await window.Store.remove(table, id);
            this.render();
        }
    },

    logout() {
        sessionStorage.clear();
        location.reload();
    }
};

window.onload = () => window.App.init();
