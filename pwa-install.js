/* ============================================================
   IMPERSILVA PWA — Install Banner
   Coloca este ficheiro em: /js/pwa-install.js
   E chama-o NO <HEAD> com: <script src="js/pwa-install.js"></script>
   ============================================================ */

(function () {
  'use strict';

  /* ── 1. Capturar o evento O MAIS CEDO POSSÍVEL ── */
  let deferredPrompt = null;

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();          // impede o mini-infobar do Chrome
    deferredPrompt = e;
    console.log('[PWA] Install prompt capturado ✓');
    /* Se o banner já existir no DOM, mostrá-lo */
    showBannerWhenReady();
  });

  window.addEventListener('appinstalled', function () {
    deferredPrompt = null;
    hideBanner();
    console.log('[PWA] App instalada com sucesso ✓');
  });

  /* ── 2. Detectar iOS ── */
  function isIOS() {
    return /iphone|ipad|ipod/i.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  function isInStandaloneMode() {
    return ('standalone' in navigator && navigator.standalone) ||
      window.matchMedia('(display-mode: standalone)').matches;
  }

  /* ── 3. Já instalado? Não mostrar nada ── */
  function alreadyDismissed() {
    try { return localStorage.getItem('pwa-banner-dismissed') === '1'; } catch { return false; }
  }
  function markDismissed() {
    try { localStorage.setItem('pwa-banner-dismissed', '1'); } catch {}
  }

  /* ── 4. Criar e injectar o banner no DOM ── */
  function createBanner() {
    if (document.getElementById('pwa-install-banner')) return;

    const ios = isIOS();

    const banner = document.createElement('div');
    banner.id = 'pwa-install-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Instalar aplicação IMPERSILVA');

    banner.style.cssText = `
      position: fixed;
      bottom: 0; left: 0; right: 0;
      z-index: 99999;
      background: #1a1a1e;
      border-top: 1px solid rgba(255,255,255,0.10);
      border-top: 3px solid #d62828;
      padding: 1rem 1.4rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      font-family: 'Barlow', sans-serif;
      box-shadow: 0 -8px 32px rgba(0,0,0,0.5);
      transform: translateY(100%);
      transition: transform 0.35s cubic-bezier(0.34, 1.2, 0.64, 1);
      flex-wrap: wrap;
    `;

    /* Ícone */
    const icon = document.createElement('img');
    icon.src   = 'icons/icon-96.png';
    icon.alt   = 'IMPERSILVA';
    icon.style.cssText = 'width:44px;height:44px;border-radius:10px;flex-shrink:0;';

    /* Texto */
    const textBlock = document.createElement('div');
    textBlock.style.cssText = 'flex:1;min-width:0;';
    textBlock.innerHTML = `
      <div style="font-weight:700;font-size:0.88rem;color:#fff;letter-spacing:0.04em;">
        IMPERSILVA
      </div>
      <div style="font-size:0.75rem;color:#888896;font-weight:300;margin-top:1px;">
        ${ios
          ? 'Toque em <strong style="color:#fff">⎙ Partilhar</strong> e depois <strong style="color:#fff">Adicionar ao Ecrã Inicial</strong>'
          : 'Instale a app para acesso rápido, mesmo sem internet.'}
      </div>
    `;

    /* Botões */
    const btnArea = document.createElement('div');
    btnArea.style.cssText = 'display:flex;gap:0.6rem;align-items:center;flex-shrink:0;';

    if (!ios) {
      /* Android / Chrome: botão de instalar */
      const installBtn = document.createElement('button');
      installBtn.textContent = '📲 Instalar';
      installBtn.style.cssText = `
        background: #d62828;
        color: #fff;
        border: none;
        border-radius: 5px;
        padding: 0.55rem 1.1rem;
        font-family: 'Barlow', sans-serif;
        font-size: 0.82rem;
        font-weight: 700;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        cursor: pointer;
        white-space: nowrap;
        transition: background 0.2s;
      `;
      installBtn.addEventListener('mouseenter', function () { this.style.background = '#e84040'; });
      installBtn.addEventListener('mouseleave', function () { this.style.background = '#d62828'; });
      installBtn.addEventListener('click', triggerInstall);
      btnArea.appendChild(installBtn);
    }

    /* Botão fechar */
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '✕';
    closeBtn.setAttribute('aria-label', 'Fechar');
    closeBtn.style.cssText = `
      background: none;
      border: 1px solid rgba(255,255,255,0.15);
      border-radius: 5px;
      color: rgba(255,255,255,0.4);
      width: 32px; height: 32px;
      font-size: 0.85rem;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: all 0.2s;
      flex-shrink: 0;
    `;
    closeBtn.addEventListener('mouseenter', function () {
      this.style.borderColor = 'rgba(255,255,255,0.4)';
      this.style.color = '#fff';
    });
    closeBtn.addEventListener('mouseleave', function () {
      this.style.borderColor = 'rgba(255,255,255,0.15)';
      this.style.color = 'rgba(255,255,255,0.4)';
    });
    closeBtn.addEventListener('click', function () {
      hideBanner();
      markDismissed();
    });
    btnArea.appendChild(closeBtn);

    banner.appendChild(icon);
    banner.appendChild(textBlock);
    banner.appendChild(btnArea);
    document.body.appendChild(banner);

    /* Slide-in com pequeno delay */
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        banner.style.transform = 'translateY(0)';
      });
    });
  }

  function hideBanner() {
    const b = document.getElementById('pwa-install-banner');
    if (!b) return;
    b.style.transform = 'translateY(100%)';
    setTimeout(function () { b.remove(); }, 400);
  }

  /* ── 5. Disparar o install prompt nativo ── */
  function triggerInstall() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(function (choice) {
      console.log('[PWA] Escolha do utilizador:', choice.outcome);
      if (choice.outcome === 'accepted') {
        hideBanner();
        markDismissed();
      }
      deferredPrompt = null;
    });
  }

  /* ── 6. Expor função global (para botão manual se necessário) ── */
  window.installPWA = triggerInstall;

  /* ── 7. Mostrar banner quando o DOM estiver pronto ── */
  function showBannerWhenReady() {
    if (isInStandaloneMode()) return;   /* já instalado */
    if (alreadyDismissed()) return;     /* utilizador fechou antes */

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', createBanner);
    } else {
      /* DOM já pronto, pequeno delay para não bloquear o render */
      setTimeout(createBanner, 1500);
    }
  }

  /* ── 8. Para iOS: mostrar sempre (não há evento automático) ── */
  if (isIOS() && !isInStandaloneMode() && !alreadyDismissed()) {
    showBannerWhenReady();
  }

})();
