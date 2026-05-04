/**
 * IMPERSILVA — Auto-Auth para Admin de Cliente
 * Coloca como PRIMEIRO <script> dentro de <head>
 */
(function() {
  var API = 'https://impersilva-ao.3miliosilva.workers.dev';

  // Esconde tudo imediatamente para evitar flash do formulário
  var style = document.createElement('style');
  style.textContent = 'body{visibility:hidden!important}';
  document.head.appendChild(style);

  var params = new URLSearchParams(window.location.search);
  var tok = params.get('tok') || sessionStorage.getItem('loja_admin_tok');

  // Sem token → mostrar formulário normal (acesso manual pelo dono do site)
  if (!tok) {
    style.remove();
    return;
  }

  window.addEventListener('DOMContentLoaded', function() {
    validarToken(tok);
  });

  async function validarToken(token) {
    // Mostrar loading
    style.remove();
    document.body.style.visibility = 'visible';
    document.body.innerHTML =
      '<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0d0d0f;font-family:sans-serif">' +
        '<div style="text-align:center;color:#fff">' +
          '<div style="width:44px;height:44px;border:3px solid rgba(255,255,255,.1);border-top-color:#d62828;border-radius:50%;animation:sp .7s linear infinite;margin:0 auto 1rem"></div>' +
          '<div style="font-size:.82rem;color:#888">A verificar acesso...</div>' +
          '<style>@keyframes sp{to{transform:rotate(360deg)}}</style>' +
        '</div>' +
      '</div>';

    try {
      var r = await fetch(API + '/api/auth/verificar', {
        headers: {'X-Cliente-Token': token}
      });

      if (!r.ok) {
        sessionStorage.removeItem('loja_admin_tok');
        window.location.href = 'https://impersilvatech.github.io/IMPERSILVA/verificar-site.html';
        return;
      }

      var data = await r.json();
      var cli = data.cliente;

      // Guardar sessão para refreshes
      sessionStorage.setItem('loja_admin_tok', token);

      // Limpar token da URL
      if (params.get('tok')) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      // Expor dados globalmente
      window.LOJA_USER  = data.user;
      window.LOJA_CLI   = cli;
      window.LOJA_TOK   = token;

      // Configurações GitHub do cliente para preencher automaticamente
      window.LOJA_GH = {
        token  : cli && cli.gh_token  ? cli.gh_token  : '',
        user   : cli && cli.gh_user   ? cli.gh_user   : '',
        repo   : cli && cli.gh_repo   ? cli.gh_repo   : '',
        branch : cli && cli.gh_branch ? cli.gh_branch : 'main'
      };

      // Guardar no localStorage para o admin detectar automaticamente
      if (window.LOJA_GH.token) {
        localStorage.setItem('imp_ghtok', window.LOJA_GH.token);
      }
      if (window.LOJA_GH.user && window.LOJA_GH.repo) {
        localStorage.setItem('gh_cfg', JSON.stringify({
          token  : window.LOJA_GH.token,
          owner  : window.LOJA_GH.user,
          repo   : window.LOJA_GH.repo,
          branch : window.LOJA_GH.branch
        }));
      }
      // Preencher campos GitHub se já estiverem no DOM
      var ghFields = {
        'ghToken': window.LOJA_GH.token, 'cfGhTok': window.LOJA_GH.token,
        'ghOwner': window.LOJA_GH.user,  'ghUser': window.LOJA_GH.user,
        'ghRepo':  window.LOJA_GH.repo,
        'ghBranch': window.LOJA_GH.branch
      };
      Object.keys(ghFields).forEach(function(id) {
        var el = document.getElementById(id);
        if (el && ghFields[id]) el.value = ghFields[id];
      });

      // Notificar o admin que está pronto
      document.dispatchEvent(new CustomEvent('lojaAuthReady', {
        detail: { user: data.user, cliente: cli, token: token, gh: window.LOJA_GH }
      }));

      // Se o admin tem função de inicialização, chama-a
      if (typeof window.iniciarAdmin === 'function') {
        window.iniciarAdmin(data.user, cli, token);
      } else if (typeof window.startApp === 'function') {
        window.startApp();
      } else {
        // Recarregar sem o ?tok= para o admin arrancar normalmente com sessão
        location.reload();
      }

    } catch(e) {
      document.body.innerHTML =
        '<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0d0d0f;font-family:sans-serif;padding:1rem">' +
          '<div style="text-align:center;color:#fff;max-width:300px">' +
            '<div style="font-size:2.5rem;margin-bottom:.8rem">⚠️</div>' +
            '<div style="font-weight:700;margin-bottom:.5rem">Erro de Ligação</div>' +
            '<div style="color:#888;font-size:.82rem;margin-bottom:1.2rem">' + e.message + '</div>' +
            '<button onclick="location.reload()" style="background:#d62828;color:#fff;border:none;border-radius:8px;padding:.75rem 1.5rem;font-weight:700;cursor:pointer;margin-right:.5rem">Tentar novamente</button>' +
            '<a href="https://impersilvatech.github.io/IMPERSILVA/verificar-site.html" style="background:rgba(255,255,255,.08);color:#ccc;border-radius:8px;padding:.75rem 1.2rem;font-weight:700;font-size:.85rem;text-decoration:none;display:inline-block">Voltar</a>' +
          '</div>' +
        '</div>';
    }
  }

  // Helper: preencher campos GH num admin que usa GH_CFG
  window.preencherConfigsGH = function() {
    if (!window.LOJA_GH) return;
    var gh = window.LOJA_GH;
    // Para admins que usam o sistema GH_CFG da IMPERSILVA
    if (typeof GH_CFG !== 'undefined') {
      if (gh.token)  GH_CFG.token  = gh.token;
      if (gh.user)   GH_CFG.owner  = gh.user;
      if (gh.repo)   GH_CFG.repo   = gh.repo;
      if (gh.branch) GH_CFG.branch = gh.branch;
      localStorage.setItem('gh_cfg', JSON.stringify(GH_CFG));
    }
    // Preencher inputs se existirem na página
    var fields = {
      'ghToken': gh.token, 'ghOwner': gh.user,
      'ghRepo': gh.repo,   'ghBranch': gh.branch,
      'cfGhTok': gh.token
    };
    Object.keys(fields).forEach(function(id) {
      var el = document.getElementById(id);
      if (el && fields[id]) el.value = fields[id];
    });
  };

  // Auto-preencher quando o admin estiver pronto
  document.addEventListener('lojaAuthReady', function() {
    setTimeout(window.preencherConfigsGH, 500);
  });

})();
