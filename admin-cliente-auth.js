/**
 * IMPERSILVA — Auto-Auth para Admin de Cliente
 * Coloca este <script> como PRIMEIRO elemento dentro de <head>
 * ANTES de qualquer outro script ou estilo
 *
 * Fluxo:
 *  - Vem do portal IMPERSILVA com ?tok= na URL → login automático, sem mostrar o formulário
 *  - Acesso directo sem token → mostra formulário normal (para o dono do site)
 */
(function() {
  var API = 'https://impersilva-ao.3miliosilva.workers.dev';

  // Esconde TUDO imediatamente para evitar flash do formulário
  var style = document.createElement('style');
  style.id = '_impersilva_hide';
  style.textContent = 'body { visibility: hidden !important; }';
  document.head.appendChild(style);

  var params = new URLSearchParams(window.location.search);
  var tok = params.get('tok');
  var cliId = params.get('cli');

  // Sem token na URL → mostrar tudo normalmente (acesso manual pelo dono)
  if (!tok) {
    // Verifica sessão guardada (refresh de página dentro do admin)
    tok = sessionStorage.getItem('loja_admin_tok');
    if (!tok) {
      document.getElementById('_impersilva_hide') && document.getElementById('_impersilva_hide').remove();
      document.head.querySelector('#_impersilva_hide') && document.head.querySelector('#_impersilva_hide').remove();
      style.remove();
      return; // Mostra login normal
    }
  }

  // Tem token → validar e fazer login automático
  window.addEventListener('DOMContentLoaded', function() {
    validarToken(tok, cliId);
  });

  async function validarToken(token, clienteId) {
    // Mostrar ecrã de loading em vez do formulário
    document.body.style.visibility = 'visible';
    document.body.innerHTML =
      '<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0d0d0f;font-family:sans-serif">' +
        '<div style="text-align:center;color:#fff">' +
          '<div style="width:48px;height:48px;border:3px solid rgba(255,255,255,.1);border-top-color:#d62828;border-radius:50%;animation:sp .7s linear infinite;margin:0 auto 1rem"></div>' +
          '<div style="font-size:.85rem;color:#888">A verificar acesso...</div>' +
          '<style>@keyframes sp{to{transform:rotate(360deg)}}</style>' +
        '</div>' +
      '</div>';

    try {
      var r = await fetch(API + '/api/auth/verificar', {
        headers: {'X-Cliente-Token': token}
      });

      if (!r.ok) {
        sessionStorage.removeItem('loja_admin_tok');
        // Token inválido → redirecionar de volta ao portal
        window.location.href = 'https://impersilvatech.github.io/IMPERSILVA/verificar-site.html';
        return;
      }

      var data = await r.json();

      // Guardar sessão para refreshes
      sessionStorage.setItem('loja_admin_tok', token);

      // Limpar token da URL (segurança - não fica no histórico)
      if (params.get('tok')) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      // Guardar dados globalmente para o admin usar
      window.LOJA_USER = data.user;
      window.LOJA_CLI = data.cliente;
      window.LOJA_TOK = token;

      // Remover o estilo que escondia o body e recarregar o HTML original
      // O admin deve agora reconstruir a sua UI
      document.dispatchEvent(new CustomEvent('lojaAuthReady', {
        detail: { user: data.user, cliente: data.cliente, token: token }
      }));

      // Se o admin usa um sistema de render() baseado em sessão, inicializa
      if (typeof window.iniciarAdmin === 'function') {
        window.iniciarAdmin(data.user, data.cliente, token);
      } else if (typeof window.startApp === 'function') {
        window.startApp();
      } else {
        // Fallback: recarregar a página sem o ?tok= para o admin detectar sessão normal
        location.reload();
      }

    } catch(e) {
      // Erro de rede → mostrar botão de retry
      document.body.innerHTML =
        '<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0d0d0f;font-family:sans-serif;padding:1rem">' +
          '<div style="text-align:center;color:#fff;max-width:300px">' +
            '<div style="font-size:2.5rem;margin-bottom:.8rem">⚠️</div>' +
            '<div style="font-weight:700;margin-bottom:.4rem">Erro de Ligação</div>' +
            '<div style="color:#888;font-size:.82rem;margin-bottom:1.2rem">' + e.message + '</div>' +
            '<button onclick="location.reload()" style="background:#d62828;color:#fff;border:none;border-radius:8px;padding:.75rem 1.5rem;font-weight:700;cursor:pointer;font-size:.85rem;margin-right:.5rem">Tentar novamente</button>' +
            '<a href="https://impersilvatech.github.io/IMPERSILVA/verificar-site.html" style="background:rgba(255,255,255,.08);color:#ccc;border-radius:8px;padding:.75rem 1.5rem;font-weight:700;font-size:.85rem;text-decoration:none;display:inline-block">Voltar</a>' +
          '</div>' +
        '</div>';
    }
  }
})();
