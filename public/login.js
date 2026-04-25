// Redireciona para o app se já estiver autenticado
(async () => {
  try {
    const res = await fetch('/api/auth/me');
    if (res.ok) window.location.href = '/';
  } catch { /* ignora erros de rede na verificação inicial */ }
})();

document.getElementById('form-login').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email   = document.getElementById('email').value.trim();
  const senha   = document.getElementById('senha').value;
  const erroEl  = document.getElementById('erro-login');
  const btnEl   = document.getElementById('btn-entrar');

  erroEl.classList.add('oculto');
  btnEl.disabled = true;
  btnEl.textContent = 'Entrando…';

  try {
    const res = await fetch('/api/auth/login', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, senha }),
    });

    const resultado = await res.json();

    if (!res.ok) {
      erroEl.textContent = resultado.erro;
      erroEl.classList.remove('oculto');
      return;
    }

    window.location.href = '/';
  } finally {
    btnEl.disabled = false;
    btnEl.textContent = 'Entrar';
  }
});
