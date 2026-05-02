/**
 * Renave Sul - Diagnostic Version
 */

const SUPABASE_URL = 'https://vlvngvhrfydtejbjfbrn.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsdm5ndmhyZnlkdGVqYmpmYnJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3MzcwMDUsImV4cCI6MjA5MzMxMzAwNX0.DpbF_oC0xne36qc4t_XZ8WfMuOfjK9vqRL_65DVcMOE';

function logToScreen(msg) {
    const debug = document.getElementById('debug-log') || document.createElement('div');
    if (!debug.id) {
        debug.id = 'debug-log';
        debug.style = 'background:#000; color:#0f0; font-family:monospace; font-size:10px; padding:10px; margin-top:20px; border-radius:5px;';
        document.querySelector('.login-card').appendChild(debug);
    }
    debug.innerHTML += '> ' + msg + '<br>';
}

window.App = {
    init() {
        logToScreen('Script carregado');
        const form = document.getElementById('login-form');
        if (!form) {
            logToScreen('ERRO: Formulário não encontrado!');
            return;
        }

        form.onsubmit = (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value.trim();
            const pass = document.getElementById('login-password').value.trim();
            
            logToScreen('Tentativa: ' + email);

            if (email === 'admin@renave-sul.com.br' && pass === 'R3n@ve26') {
                logToScreen('Senha Correta! Entrando...');
                sessionStorage.setItem('renave_auth', 'true');
                this.render();
            } else {
                logToScreen('ERRO: Credenciais inválidas.');
                document.getElementById('login-error').style.display = 'block';
            }
        };
        
        if (sessionStorage.getItem('renave_auth')) {
            logToScreen('Sessão ativa encontrada.');
            this.render();
        }
    },

    render() {
        document.getElementById('login-screen').style.display = 'none';
        document.querySelector('.app-container').style.display = 'flex';
        document.getElementById('view-container').innerHTML = `
            <div style="padding:40px; text-align:center;">
                <h1 style="color:#f38b3c">SISTEMA CONECTADO!</h1>
                <p>Se você está vendo esta tela, o login funcionou.</p>
                <button onclick="sessionStorage.clear(); location.reload();" style="padding:10px 20px; margin-top:20px;">Sair</button>
            </div>
        `;
    }
};

window.onload = () => window.App.init();
