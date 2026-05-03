/**
 * IMPERSILVA — Autenticação do Admin de Cliente
 * Adicionar este bloco no topo do admin.html de cada site criado
 * 
 * Como funciona:
 * 1. Lê ?tok= da URL (vem do admin-loja.html)
 * 2. Valida com o Worker da IMPERSILVA
 * 3. Se válido → mostra o admin
 * 4. Se inválido → mostra ecrã de erro
 */

(async function() {
  var API = 'https://impersilva-ao.3miliosilva.workers.dev';

  // Get token from URL params
  var params = new URLSearchParams(window.location.search);
  var tok = params.get('tok');
  var cliId = params.get('cli');

  // Also check sessionStorage (for page refreshes within admin)
  if (!tok) tok = sessionStorage.getItem('loja_admin_tok');
  if (!tok) {
    showAuthError('Acesso negado. Entra pela área de cliente.');
    return;
  }

  try {
    var r = await fetch(API + '/api/auth/verificar', {
      headers: {'X-Cliente-Token': tok}
    });

    if (!r.ok) {
      sessionStorage.removeItem('loja_admin_tok');
      showAuthError('Sessão expirada. Por favor entra novamente.');
      return;
    }

    var data = await r.json();

    // Save token for page refreshes
    sessionStorage.setItem('loja_admin_tok', tok);

    // Clean URL (remove token from address bar)
    if (params.get('tok')) {
      var cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }

    // Expose user and client data globally
    window.LOJA_USER = data.user;
    window.LOJA_CLI = data.cliente;
    window.LOJA_TOK = tok;

    // Dispatch event so admin page knows auth is ready
    document.dispatchEvent(new CustomEvent('lojaAuthReady', {
      detail: {user: data.user, cliente: data.cliente, token: tok}
    }));

  } catch(e) {
    showAuthError('Erro de ligação: ' + e.message);
  }

  function showAuthError(msg) {
    document.body.style.cssText = 'margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0e0e0f;font-family:sans-serif;color:#fff;text-align:center;padding:1rem';
    document.body.innerHTML =
      '<div style="max-width:320px">' +
        '<div style="font-size:3rem;margin-bottom:1rem">🔒</div>' +
        '<div style="font-size:1.2rem;font-weight:700;margin-bottom:.5rem">Acesso Restrito</div>' +
        '<div style="color:#888;font-size:.85rem;margin-bottom:1.5rem">' + msg + '</div>' +
        '<a href="https://impersilvatech.github.io/IMPERSILVA/verificar-site.html" ' +
          'style="background:#d62828;color:#fff;padding:.8rem 1.5rem;border-radius:8px;text-decoration:none;font-weight:700;font-size:.85rem">' +
          '← Área de Cliente' +
        '</a>' +
      '</div>';
    // Stop any other scripts from running
    throw new Error('Auth failed');
  }
})();
