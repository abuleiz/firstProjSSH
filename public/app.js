// ================================================
// Estado da aplicação
// ================================================
let clienteAtual        = null;
let usuarioLogado       = null;
let paginasAdmin        = new Set();
let urlParentMap        = {};
let titulosPagina       = {};
let tiposContatoCache   = [];

// ================================================
// Inicialização e autenticação
// ================================================

async function inicializar() {
  const res = await fetch('/api/auth/me');
  if (!res.ok) {
    window.location.href = '/login.html';
    return;
  }
  usuarioLogado = await res.json();
  configurarInterface();
  await Promise.all([carregarMenu(), carregarTiposContato()]);
  navegarPara('dashboard');
}

function configurarInterface() {
  document.getElementById('sidebar-nome-usuario').textContent = usuarioLogado.nome;

  const badge = document.getElementById('sidebar-nivel-usuario');
  badge.textContent = usuarioLogado.perfil_nome || '—';
  badge.className   = `badge-nivel ${usuarioLogado.nivel}`;
}

// ================================================
// Menu dinâmico
// ================================================

const ICONES = {
  dashboard:  '<path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>',
  clientes:   '<path d="M12 12c2.71 0 4.8-2.09 4.8-4.8S14.71 2.4 12 2.4 7.2 4.49 7.2 7.2 9.29 12 12 12zm0 2.4c-3.21 0-9.6 1.61-9.6 4.8v2.4h19.2v-2.4c0-3.19-6.39-4.8-9.6-4.8z"/>',
  backoffice: '<path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>',
  usuarios:   '<path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>',
  menus:      '<path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>',
  perfis:          '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>',
  'tipos-contato': '<path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z"/>',
  seguranca:       '<path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>',
};

function svgIcone(icon, size = 18) {
  return `<svg viewBox="0 0 24 24" fill="currentColor" width="${size}" height="${size}">${ICONES[icon] || ''}</svg>`;
}

// Retorna a cadeia completa de ícones ancestrais (do mais externo ao imediato)
function cadeiaPais(item, todos) {
  const cadeia = [];
  let atual = item;
  while (atual.parent_id) {
    const pai = todos.find(i => i.id === atual.parent_id);
    if (!pai) break;
    cadeia.unshift(pai.icon);
    atual = pai;
  }
  return cadeia;
}

async function carregarMenu() {
  const res = await apiFetch('/api/menus');
  if (!res) return;
  const itens = await res.json();

  paginasAdmin = new Set(
    itens.filter(i => i.url && i.perfil_nivel < 2).map(i => i.url)
  );

  urlParentMap  = {};
  titulosPagina = {};
  itens.filter(i => i.url).forEach(item => {
    titulosPagina[item.url] = item.label;
    const cadeia = cadeiaPais(item, itens);
    if (cadeia.length > 0) urlParentMap[item.url] = cadeia;
  });

  renderizarMenu(itens);
}

function renderizarMenu(itens) {
  const ul = document.getElementById('sidebar-menu');
  ul.innerHTML = '';
  itens.filter(i => !i.parent_id)
       .sort((a, b) => a.ordem - b.ordem)
       .forEach(item => ul.appendChild(criarNoMenu(item, itens, 0)));
}

function criarNoMenu(item, todos, nivel) {
  const filhos = todos.filter(i => i.parent_id === item.id)
                      .sort((a, b) => a.ordem - b.ordem);
  return filhos.length > 0
    ? criarGrupoMenu(item, filhos, todos, nivel)
    : criarItemMenu(item, nivel);
}

function criarItemMenu(item, nivel = 0) {
  const li = document.createElement('li');
  li.className = nivel > 0 ? 'menu-item submenu-item' : 'menu-item';
  li.id        = `nav-${item.url}`;
  li.onclick   = () => navegarPara(item.url);
  li.innerHTML = `${svgIcone(item.icon, nivel > 0 ? 16 : 18)} ${escapeHtml(item.label)}`;
  return li;
}

function criarGrupoMenu(pai, filhos, todos, nivel = 0) {
  const SETA = `<svg class="seta-submenu" viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/></svg>`;

  const li = document.createElement('li');
  li.className = 'menu-grupo';
  li.id = `nav-${pai.icon}`;

  const div = document.createElement('div');
  div.className = nivel > 0 ? 'menu-item submenu-item' : 'menu-item';
  div.onclick   = () => toggleSubmenu(pai.icon);
  div.innerHTML = `${svgIcone(pai.icon, nivel > 0 ? 16 : 18)} ${escapeHtml(pai.label)} ${SETA}`;

  const ulSub = document.createElement('ul');
  ulSub.className = 'submenu oculto';
  ulSub.id = `submenu-${pai.icon}`;

  filhos.forEach(filho => ulSub.appendChild(criarNoMenu(filho, todos, nivel + 1)));

  li.appendChild(div);
  li.appendChild(ulSub);
  return li;
}

async function carregarTiposContato() {
  const res = await apiFetch('/api/tipos-contato');
  if (!res) return;
  tiposContatoCache = await res.json();
}

function preencherSelectTiposContato(force = false) {
  const select = document.getElementById('tipo-contato');
  if (!force && select.options.length > 0) return;
  select.innerHTML = '';
  tiposContatoCache.forEach(t => {
    const opt = document.createElement('option');
    opt.value       = t.id;
    opt.textContent = t.nome;
    select.appendChild(opt);
  });
}

async function atualizarCacheETiposSelect() {
  await carregarTiposContato();
  const select   = document.getElementById('tipo-contato');
  const anterior = select.value;
  preencherSelectTiposContato(true);
  if (select.querySelector(`option[value="${anterior}"]`)) select.value = anterior;
  configurarCampoContato(tipoSelecionado());
}

function toggleSubmenu(icone) {
  document.getElementById(`submenu-${icone}`).classList.toggle('oculto');
  document.getElementById(`nav-${icone}`).classList.toggle('aberto');
}

async function logout() {
  await fetch('/api/auth/logout', { method: 'POST' });
  window.location.href = '/login.html';
}

// Wrapper que redireciona para login caso a sessão tenha expirado (401)
async function apiFetch(url, options = {}) {
  const res = await fetch(url, options);
  if (res.status === 401) {
    window.location.href = '/login.html';
    return null;
  }
  return res;
}

// ================================================
// Navegação: sidebar e seções
// ================================================

function navegarPara(pagina) {
  if (paginasAdmin.has(pagina) && (!usuarioLogado || usuarioLogado.nivel !== 'admin')) {
    exibirMensagem('Acesso negado', 'erro');
    navegarPara('dashboard');
    return;
  }

  document.querySelectorAll('.menu-item').forEach(el => el.classList.remove('ativo'));
  const navEl = document.getElementById(`nav-${pagina}`);
  if (navEl) navEl.classList.add('ativo');

  (urlParentMap[pagina] || []).forEach(paiIcone => {
    const submenu = document.getElementById(`submenu-${paiIcone}`);
    const grupo   = document.getElementById(`nav-${paiIcone}`);
    if (submenu) submenu.classList.remove('oculto');
    if (grupo)   grupo.classList.add('aberto');
  });

  document.getElementById('titulo-pagina').textContent = titulosPagina[pagina] || '';

  if (pagina === 'dashboard') {
    alternarSecao('secao-dashboard');
    carregarDashboard();
  } else if (pagina === 'clientes') {
    alternarSecao('secao-lista');
    carregarClientes();
  } else if (pagina === 'usuarios') {
    alternarSecao('secao-usuarios');
    carregarUsuarios();
  } else if (pagina === 'menus') {
    alternarSecao('secao-menus');
    carregarMenusCadastro();
  } else if (pagina === 'perfis') {
    alternarSecao('secao-perfis');
    carregarPerfis();
  } else if (pagina === 'tipos-contato') {
    alternarSecao('secao-tipos-contato');
    carregarTiposContatoCadastro();
  }
}

async function carregarDashboard() {
  const res = await apiFetch('/api/clientes');
  if (!res) return;
  const clientes = await res.json();
  document.getElementById('total-clientes').textContent = clientes.length;
}

function mostrarLista() {
  alternarSecao('secao-lista');
  carregarClientes();
}

function alternarSecao(idAtiva) {
  ['secao-dashboard',      'secao-lista',           'secao-formulario',
   'secao-usuarios',       'secao-form-usuario',
   'secao-menus',          'secao-form-menu',
   'secao-perfis',         'secao-form-perfil',
   'secao-tipos-contato',  'secao-form-tipos-contato'].forEach(id => {
    document.getElementById(id).classList.toggle('oculto', id !== idAtiva);
  });
}

// ================================================
// Clientes — CRUD
// ================================================

async function carregarClientes() {
  const res = await apiFetch('/api/clientes');
  if (!res) return;
  const clientes = await res.json();
  const corpo = document.getElementById('corpo-tabela');

  if (clientes.length === 0) {
    corpo.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#aaa;padding:1.5rem">Nenhum cliente cadastrado</td></tr>';
    return;
  }

  // Botão "Contatos" removido — gerenciado inline no formulário de edição
  corpo.innerHTML = clientes.map(c => `
    <tr>
      <td>${escapeHtml(c.nome)}</td>
      <td>${formatarCPF(c.cpf)}</td>
      <td>${escapeHtml(c.email || '—')}</td>
      <td>
        <button class="btn-editar" onclick="editarCliente(${c.id})">Editar</button>
        <button class="btn-deletar" onclick="deletarCliente(${c.id}, '${escapeAttr(c.nome)}')">Excluir</button>
      </td>
    </tr>
  `).join('');
}

async function editarCliente(id) {
  const res = await apiFetch(`/api/clientes/${id}`);
  if (!res) return;
  mostrarFormulario(await res.json());
}

async function mostrarFormulario(cliente = null) {
  document.getElementById('form-cliente').reset();
  document.getElementById('cliente-id').value = '';
  document.getElementById('cpf').classList.remove('invalido');
  document.getElementById('erro-cpf').classList.add('oculto');

  if (cliente) {
    document.getElementById('titulo-formulario').textContent    = 'Editar Cliente';
    document.getElementById('cliente-id').value                 = cliente.id;
    document.getElementById('nome').value                       = cliente.nome || '';
    document.getElementById('cpf').value                        = formatarCPF(cliente.cpf);
    document.getElementById('email').value                      = cliente.email || '';
    document.getElementById('data-nascimento').value            = cliente.data_nascimento || '';
    document.getElementById('endereco').value                   = cliente.endereco || '';

    // Exibe a seção de contatos para cliente já existente
    document.getElementById('msg-salvar-primeiro').classList.add('oculto');
    document.getElementById('area-contatos').classList.remove('oculto');
    await carregarContatosInline(cliente.id);
  } else {
    document.getElementById('titulo-formulario').textContent = 'Novo Cliente';

    // Exibe aviso enquanto o cliente ainda não foi salvo
    document.getElementById('msg-salvar-primeiro').classList.remove('oculto');
    document.getElementById('area-contatos').classList.add('oculto');
  }

  alternarSecao('secao-formulario');
}

async function salvarCliente(event) {
  event.preventDefault();

  if (!validarCampoCPF()) {
    document.getElementById('cpf').focus();
    return;
  }

  const id    = document.getElementById('cliente-id').value;
  const dados = {
    nome:            document.getElementById('nome').value.trim(),
    cpf:             document.getElementById('cpf').value.replace(/\D/g, ''),
    email:           document.getElementById('email').value.trim(),
    data_nascimento: document.getElementById('data-nascimento').value,
    endereco:        document.getElementById('endereco').value.trim(),
  };

  const res = await apiFetch(id ? `/api/clientes/${id}` : '/api/clientes', {
    method:  id ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(dados),
  });
  if (!res) return;

  const resultado = await res.json();
  if (!res.ok) { exibirMensagem(resultado.erro, 'erro'); return; }

  exibirMensagem(id ? 'Cliente atualizado!' : 'Cliente cadastrado!', 'sucesso');
  mostrarLista();
}

async function deletarCliente(id, nome) {
  if (!confirm(`Excluir o cliente "${nome}" e todos os seus contatos?`)) return;

  const res = await apiFetch(`/api/clientes/${id}`, { method: 'DELETE' });
  if (!res) return;
  const resultado = await res.json();
  if (!res.ok) { exibirMensagem(resultado.erro, 'erro'); return; }

  exibirMensagem('Cliente excluído!', 'sucesso');
  carregarClientes();
}

// ================================================
// Contatos — inline no formulário de cliente
// ================================================

async function carregarContatosInline(clienteId) {
  const res = await apiFetch(`/api/clientes/${clienteId}`);
  if (!res) return;
  const cliente = await res.json();
  clienteAtual = cliente;
  renderizarContatos(cliente.contatos);
  resetarFormContato();
}

function renderizarContatos(contatos) {
  const corpo = document.getElementById('corpo-contatos');

  if (!contatos || contatos.length === 0) {
    corpo.innerHTML = '<tr><td colspan="3" style="text-align:center;color:#aaa;padding:1rem">Nenhum contato cadastrado</td></tr>';
    return;
  }

  corpo.innerHTML = contatos.map(c => `
    <tr>
      <td>${escapeHtml(c.tipo_nome)}</td>
      <td>${escapeHtml(c.telefone)}</td>
      <td>
        <button class="btn-editar" onclick="editarContato(${c.id}, '${escapeAttr(c.telefone)}', ${c.tipo_id})">Editar</button>
        <button class="btn-deletar" onclick="deletarContato(${c.id})">Excluir</button>
      </td>
    </tr>
  `).join('');
}

// Aplica máscara progressiva: '9' = dígito, outros chars = literal
function aplicarMascara(entrada, mascara) {
  const maxDigits = (mascara.match(/9/g) || []).length;
  let digits = entrada.replace(/\D/g, '').slice(0, maxDigits);
  let result = '';
  let di = 0;
  for (let mi = 0; mi < mascara.length; mi++) {
    if (di >= digits.length) break;
    result += mascara[mi] === '9' ? digits[di++] : mascara[mi];
  }
  return result;
}

function tipoSelecionado() {
  const id = Number(document.getElementById('tipo-contato').value);
  return tiposContatoCache.find(t => t.id === id) || null;
}

function configurarCampoContato(tipo) {
  document.getElementById('telefone').placeholder = tipo ? (tipo.placeholder || '') : '';
}

function atualizarCampoContato() {
  document.getElementById('telefone').value = '';
  document.getElementById('erro-contato').classList.add('oculto');
  configurarCampoContato(tipoSelecionado());
}

function mascararContato() {
  const tipo  = tipoSelecionado();
  const input = document.getElementById('telefone');
  if (!tipo || tipo.validacao !== 'telefone' || !tipo.mascara) return;
  input.value = aplicarMascara(input.value, tipo.mascara);
}

function validarContato(tipo, valor) {
  const v = valor.trim();
  if (!v) return 'O contato não pode estar vazio';

  if (tipo.validacao === 'email') {
    const partes = v.split('@');
    if (partes.length !== 2 || !partes[1].includes('.')) return 'E-mail inválido';
    return null;
  }

  if (tipo.validacao === 'telefone') {
    const maxDigits = tipo.mascara ? (tipo.mascara.match(/9/g) || []).length : 0;
    const digits = v.replace(/\D/g, '');
    if (maxDigits && digits.length !== maxDigits) return `Deve ter ${maxDigits} dígitos`;
    return null;
  }

  return null;
}

function mostrarFormContato() {
  preencherSelectTiposContato();
  document.getElementById('form-contato').reset();
  document.getElementById('contato-id').value = '';
  document.getElementById('titulo-form-contato').textContent = 'Adicionar Contato';
  document.getElementById('erro-contato').classList.add('oculto');
  configurarCampoContato(tipoSelecionado());
  document.getElementById('form-contato-wrapper').classList.remove('oculto');
  document.getElementById('form-contato-wrapper').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function cancelarFormContato() {
  document.getElementById('form-contato-wrapper').classList.add('oculto');
  document.getElementById('form-contato').reset();
  document.getElementById('contato-id').value = '';
  document.getElementById('erro-contato').classList.add('oculto');
  configurarCampoContato(tipoSelecionado());
}

function resetarFormContato() {
  document.getElementById('form-contato-wrapper').classList.add('oculto');
  document.getElementById('form-contato').reset();
  document.getElementById('contato-id').value = '';
  document.getElementById('erro-contato').classList.add('oculto');
  configurarCampoContato(tipoSelecionado());
}

function editarContato(id, telefone, tipoId) {
  preencherSelectTiposContato();
  document.getElementById('contato-id').value   = id;
  document.getElementById('tipo-contato').value = String(tipoId);
  const tipo = tiposContatoCache.find(t => t.id === tipoId);
  configurarCampoContato(tipo);
  document.getElementById('telefone').value = telefone;
  document.getElementById('erro-contato').classList.add('oculto');
  document.getElementById('titulo-form-contato').textContent = 'Editar Contato';
  document.getElementById('form-contato-wrapper').classList.remove('oculto');
  document.getElementById('form-contato-wrapper').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

async function salvarContato(event) {
  event.preventDefault();

  const id       = document.getElementById('contato-id').value;
  const telefone = document.getElementById('telefone').value.trim();
  const tipo     = tipoSelecionado();

  const erroMsg = tipo ? validarContato(tipo, telefone) : 'Selecione um tipo';
  if (erroMsg) {
    const erroEl = document.getElementById('erro-contato');
    erroEl.textContent = erroMsg;
    erroEl.classList.remove('oculto');
    return;
  }
  document.getElementById('erro-contato').classList.add('oculto');

  const res = await apiFetch(
    id ? `/api/contatos/${id}` : `/api/contatos/cliente/${clienteAtual.id}`,
    {
      method:  id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ telefone, tipo_id: tipo.id }),
    }
  );
  if (!res) return;

  const resultado = await res.json();
  if (!res.ok) { exibirMensagem(resultado.erro, 'erro'); return; }

  exibirMensagem(id ? 'Contato atualizado!' : 'Contato adicionado!', 'sucesso');
  carregarContatosInline(clienteAtual.id);
}

async function deletarContato(id) {
  if (!confirm('Excluir este contato?')) return;

  const res = await apiFetch(`/api/contatos/${id}`, { method: 'DELETE' });
  if (!res) return;
  const resultado = await res.json();
  if (!res.ok) { exibirMensagem(resultado.erro, 'erro'); return; }

  exibirMensagem('Contato excluído!', 'sucesso');
  carregarContatosInline(clienteAtual.id);
}

// ================================================
// Menus — CRUD (admin)
// ================================================

async function carregarMenusCadastro() {
  const res = await apiFetch('/api/menus/todos');
  if (!res) return;
  if (res.status === 403) { exibirMensagem('Acesso restrito a administradores', 'erro'); return; }

  const menus = await res.json();
  const corpo = document.getElementById('corpo-menus');

  if (menus.length === 0) {
    corpo.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#aaa;padding:1.5rem">Nenhum menu cadastrado</td></tr>';
    return;
  }

  corpo.innerHTML = menus.map(m => {
    const protegido = m.url === 'menus';
    const btnStatus = m.ativo
      ? `<button class="btn-deletar" onclick="toggleStatusMenu(${m.id}, 1)"
             ${protegido ? 'disabled title="Este item não pode ser desativado"' : ''}>Desativar</button>`
      : `<button class="btn-ativar" onclick="toggleStatusMenu(${m.id}, 0)">Ativar</button>`;
    return `
      <tr>
        <td>${m.ordem}</td>
        <td>${escapeHtml(m.label)}</td>
        <td>${escapeHtml(m.url || '—')}</td>
        <td>${escapeHtml(m.pai_label || '—')}</td>
        <td><span class="badge-nivel ${m.perfil_nivel === 1 ? 'admin' : 'usuario'}">${escapeHtml(m.perfil_nome)}</span></td>
        <td><span class="badge-status ${m.ativo ? 'ativo' : 'inativo'}">${m.ativo ? 'Ativo' : 'Inativo'}</span></td>
        <td>
          <button class="btn-editar" onclick="editarMenu(${m.id})">Editar</button>
          ${btnStatus}
        </td>
      </tr>
    `;
  }).join('');
}

async function mostrarFormularioMenu(menu = null) {
  if (!usuarioLogado || usuarioLogado.nivel !== 'admin') {
    exibirMensagem('Acesso negado', 'erro');
    navegarPara('dashboard');
    return;
  }

  document.getElementById('form-menu').reset();
  document.getElementById('menu-id').value    = '';
  document.getElementById('menu-ativo').checked = true;

  const [resRaiz, resPerfis] = await Promise.all([
    apiFetch('/api/menus/raiz'),
    apiFetch('/api/perfis'),
  ]);
  if (!resRaiz || !resPerfis) return;

  const raiz = await resRaiz.json();
  const selectParent = document.getElementById('menu-parent');
  selectParent.innerHTML = '<option value="">Nenhum (item raiz)</option>';
  raiz.forEach(r => {
    selectParent.innerHTML += `<option value="${r.id}">${escapeHtml(r.label)}</option>`;
  });

  const perfis = await resPerfis.json();
  const selectPerfil = document.getElementById('menu-perfil');
  selectPerfil.innerHTML = '';
  perfis.forEach(p => {
    selectPerfil.innerHTML += `<option value="${p.id}">${escapeHtml(p.nome)}</option>`;
  });

  if (menu) {
    document.getElementById('titulo-form-menu').textContent  = 'Editar Menu';
    document.getElementById('menu-id').value                 = menu.id;
    document.getElementById('menu-label').value              = menu.label;
    document.getElementById('menu-icon').value               = menu.icon;
    document.getElementById('menu-url').value                = menu.url   || '';
    document.getElementById('menu-parent').value             = menu.parent_id || '';
    document.getElementById('menu-perfil').value             = menu.perfil_id;
    document.getElementById('menu-ordem').value              = menu.ordem;
    document.getElementById('menu-ativo').checked            = !!menu.ativo;
  } else {
    document.getElementById('titulo-form-menu').textContent = 'Novo Menu';
  }

  alternarSecao('secao-form-menu');
}

async function editarMenu(id) {
  const res = await apiFetch(`/api/menus/${id}`);
  if (!res) return;
  mostrarFormularioMenu(await res.json());
}

async function salvarMenu(event) {
  event.preventDefault();

  const id    = document.getElementById('menu-id').value;
  const dados = {
    label:     document.getElementById('menu-label').value.trim(),
    icon:      document.getElementById('menu-icon').value.trim(),
    url:       document.getElementById('menu-url').value.trim()   || null,
    parent_id: document.getElementById('menu-parent').value       || null,
    perfil_id: Number(document.getElementById('menu-perfil').value),
    ordem:     Number(document.getElementById('menu-ordem').value),
    ativo:     document.getElementById('menu-ativo').checked,
  };

  const res = await apiFetch(id ? `/api/menus/${id}` : '/api/menus', {
    method:  id ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(dados),
  });
  if (!res) return;

  const resultado = await res.json();
  if (!res.ok) { exibirMensagem(resultado.erro, 'erro'); return; }

  exibirMensagem(id ? 'Menu atualizado!' : 'Menu criado!', 'sucesso');
  await carregarMenu();
  navegarPara('menus');
}

async function toggleStatusMenu(id, ativoAtual) {
  const acao = ativoAtual ? 'desativar' : 'ativar';
  if (!confirm(`Deseja ${acao} este menu?`)) return;

  const res = await apiFetch(`/api/menus/${id}/status`, { method: 'PATCH' });
  if (!res) return;

  const resultado = await res.json();
  if (!res.ok) { exibirMensagem(resultado.erro, 'erro'); return; }

  exibirMensagem(`Menu ${ativoAtual ? 'desativado' : 'ativado'}!`, 'sucesso');
  await carregarMenu();
  carregarMenusCadastro();
}

// ================================================
// Usuários — CRUD (admin)
// ================================================

async function carregarUsuarios() {
  const res = await apiFetch('/api/usuarios');
  if (!res) return;

  if (res.status === 403) {
    exibirMensagem('Acesso restrito a administradores', 'erro');
    return;
  }

  const usuarios = await res.json();
  const corpo = document.getElementById('corpo-usuarios');

  if (usuarios.length === 0) {
    corpo.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#aaa;padding:1.5rem">Nenhum usuário cadastrado</td></tr>';
    return;
  }

  corpo.innerHTML = usuarios.map(u => {
    const ehEuMesmo = u.id === usuarioLogado.id;
    const btnStatus = u.ativo
      ? `<button class="btn-deletar" onclick="toggleStatusUsuario(${u.id}, 1)" ${ehEuMesmo ? 'disabled title="Você não pode desativar sua própria conta"' : ''}>Desativar</button>`
      : `<button class="btn-ativar"  onclick="toggleStatusUsuario(${u.id}, 0)">Ativar</button>`;

    return `
      <tr>
        <td>${escapeHtml(u.nome)}</td>
        <td>${escapeHtml(u.email)}</td>
        <td><span class="badge-nivel ${u.perfil_nivel === 1 ? 'admin' : 'usuario'}">${escapeHtml(u.perfis_nomes || '—')}</span></td>
        <td><span class="badge-status ${u.ativo ? 'ativo' : 'inativo'}">${u.ativo ? 'Ativo' : 'Inativo'}</span></td>
        <td>
          <button class="btn-editar" onclick="editarUsuario(${u.id})">Editar</button>
          ${btnStatus}
        </td>
      </tr>
    `;
  }).join('');
}

async function mostrarFormularioUsuario(usuario = null) {
  if (!usuarioLogado || usuarioLogado.nivel !== 'admin') {
    exibirMensagem('Acesso negado', 'erro');
    navegarPara('dashboard');
    return;
  }

  document.getElementById('form-usuario').reset();
  document.getElementById('usuario-id').value = '';

  const senhaInput = document.getElementById('usuario-senha');
  const senhaHint  = document.getElementById('senha-hint');

  if (usuario) {
    document.getElementById('titulo-form-usuario').textContent = 'Editar Usuário';
    document.getElementById('usuario-id').value    = usuario.id;
    document.getElementById('usuario-nome').value  = usuario.nome;
    document.getElementById('usuario-email').value = usuario.email;
    senhaInput.required   = false;
    senhaInput.minLength  = 0;
    senhaHint.textContent = '(deixe em branco para manter a atual)';

    document.getElementById('msg-salvar-usuario-primeiro').classList.add('oculto');
    document.getElementById('area-perfis-usuario').classList.remove('oculto');
    await carregarPerfisUsuario(usuario.id);
  } else {
    document.getElementById('titulo-form-usuario').textContent = 'Novo Usuário';
    senhaInput.required   = true;
    senhaInput.minLength  = 6;
    senhaHint.textContent = '(mínimo 6 caracteres)';

    document.getElementById('msg-salvar-usuario-primeiro').classList.remove('oculto');
    document.getElementById('area-perfis-usuario').classList.add('oculto');
  }

  alternarSecao('secao-form-usuario');
}

async function editarUsuario(id) {
  const res = await apiFetch(`/api/usuarios/${id}`);
  if (!res) return;
  mostrarFormularioUsuario(await res.json());
}

async function salvarUsuario(event) {
  event.preventDefault();

  const id    = document.getElementById('usuario-id').value;
  const dados = {
    nome:  document.getElementById('usuario-nome').value.trim(),
    email: document.getElementById('usuario-email').value.trim(),
    senha: document.getElementById('usuario-senha').value,
  };

  const res = await apiFetch(id ? `/api/usuarios/${id}` : '/api/usuarios', {
    method:  id ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(dados),
  });
  if (!res) return;

  const resultado = await res.json();
  if (!res.ok) { exibirMensagem(resultado.erro, 'erro'); return; }

  const usuarioId = id || resultado.id;

  // Transita para modo edição com seção de perfis visível
  document.getElementById('usuario-id').value = usuarioId;
  document.getElementById('titulo-form-usuario').textContent = 'Editar Usuário';
  const senhaInput = document.getElementById('usuario-senha');
  senhaInput.required   = false;
  senhaInput.minLength  = 0;
  senhaInput.value      = '';
  document.getElementById('senha-hint').textContent = '(deixe em branco para manter a atual)';
  document.getElementById('msg-salvar-usuario-primeiro').classList.add('oculto');
  document.getElementById('area-perfis-usuario').classList.remove('oculto');

  exibirMensagem(id ? 'Usuário atualizado!' : 'Usuário criado!', 'sucesso');
  await carregarPerfisUsuario(usuarioId);
}

async function toggleStatusUsuario(id, ativoAtual) {
  const acao = ativoAtual ? 'desativar' : 'ativar';
  if (!confirm(`Deseja ${acao} este usuário?`)) return;

  const res = await apiFetch(`/api/usuarios/${id}/status`, { method: 'PATCH' });
  if (!res) return;
  const resultado = await res.json();
  if (!res.ok) { exibirMensagem(resultado.erro, 'erro'); return; }

  exibirMensagem(`Usuário ${ativoAtual ? 'desativado' : 'ativado'}!`, 'sucesso');
  carregarUsuarios();
}

// ------------------------------------------------
// Perfis inline do usuário
// ------------------------------------------------

async function carregarPerfisUsuario(usuarioId) {
  const res = await apiFetch(`/api/usuarios/${usuarioId}/perfis`);
  if (!res) return;
  renderizarPerfisUsuario(await res.json(), usuarioId);
  cancelarFormAdicionarPerfil();
}

function renderizarPerfisUsuario(perfis, usuarioId) {
  const corpo = document.getElementById('corpo-perfis-usuario');
  if (!perfis || perfis.length === 0) {
    corpo.innerHTML = '<tr><td colspan="3" style="text-align:center;color:#aaa;padding:1rem">Nenhum perfil atribuído</td></tr>';
    return;
  }
  corpo.innerHTML = perfis.map(p => `
    <tr>
      <td>${escapeHtml(p.nome)}</td>
      <td><span class="badge-nivel ${p.nivel === 1 ? 'admin' : 'usuario'}">${p.nivel === 1 ? 'Admin' : 'Usuário'}</span></td>
      <td>
        <button class="btn-deletar" onclick="removerPerfilUsuario(${usuarioId}, ${p.id})">Remover</button>
      </td>
    </tr>
  `).join('');
}

async function mostrarFormAdicionarPerfil() {
  const resPerfis = await apiFetch('/api/perfis');
  if (!resPerfis) return;
  const perfis = await resPerfis.json();

  const select = document.getElementById('select-perfil-usuario');
  select.innerHTML = '';
  perfis.forEach(p => {
    select.innerHTML += `<option value="${p.id}">${escapeHtml(p.nome)}</option>`;
  });

  document.getElementById('form-perfil-usuario-wrapper').classList.remove('oculto');
}

function cancelarFormAdicionarPerfil() {
  document.getElementById('form-perfil-usuario-wrapper').classList.add('oculto');
}

async function adicionarPerfilUsuario() {
  const usuarioId = document.getElementById('usuario-id').value;
  const perfilId  = document.getElementById('select-perfil-usuario').value;
  if (!usuarioId || !perfilId) return;

  const res = await apiFetch(`/api/usuarios/${usuarioId}/perfis`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ perfil_id: Number(perfilId) }),
  });
  if (!res) return;
  const resultado = await res.json();
  if (!res.ok) { exibirMensagem(resultado.erro, 'erro'); return; }

  exibirMensagem('Perfil adicionado!', 'sucesso');
  carregarPerfisUsuario(usuarioId);
}

async function removerPerfilUsuario(usuarioId, perfilId) {
  if (!confirm('Remover este perfil do usuário?')) return;

  const res = await apiFetch(`/api/usuarios/${usuarioId}/perfis/${perfilId}`, { method: 'DELETE' });
  if (!res) return;
  const resultado = await res.json();
  if (!res.ok) { exibirMensagem(resultado.erro, 'erro'); return; }

  exibirMensagem('Perfil removido!', 'sucesso');
  carregarPerfisUsuario(usuarioId);
}

// ================================================
// Tipos de Contato — CRUD (admin)
// ================================================

const VALIDACAO_LABELS = { telefone: 'Telefone', email: 'E-mail', texto: 'Texto' };

async function carregarTiposContatoCadastro() {
  const res = await apiFetch('/api/tipos-contato/todos');
  if (!res) return;
  if (res.status === 403) { exibirMensagem('Acesso restrito a administradores', 'erro'); return; }

  const tipos = await res.json();
  const corpo = document.getElementById('corpo-tipos-contato');

  if (tipos.length === 0) {
    corpo.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#aaa;padding:1.5rem">Nenhum tipo cadastrado</td></tr>';
    return;
  }

  corpo.innerHTML = tipos.map(t => {
    const btnStatus = t.ativo
      ? `<button class="btn-deletar" onclick="toggleStatusTipoContato(${t.id}, 1)">Desativar</button>`
      : `<button class="btn-ativar"  onclick="toggleStatusTipoContato(${t.id}, 0)">Ativar</button>`;
    return `
      <tr>
        <td>${escapeHtml(t.nome)}</td>
        <td>${escapeHtml(t.mascara || '—')}</td>
        <td>${escapeHtml(t.placeholder || '—')}</td>
        <td>${escapeHtml(VALIDACAO_LABELS[t.validacao] || t.validacao)}</td>
        <td><span class="badge-status ${t.ativo ? 'ativo' : 'inativo'}">${t.ativo ? 'Ativo' : 'Inativo'}</span></td>
        <td>
          <button class="btn-editar" onclick="editarTipoContato(${t.id})">Editar</button>
          ${btnStatus}
        </td>
      </tr>
    `;
  }).join('');
}

async function mostrarFormularioTipoContato(tipo = null) {
  if (!usuarioLogado || usuarioLogado.nivel !== 'admin') {
    exibirMensagem('Acesso negado', 'erro');
    navegarPara('dashboard');
    return;
  }

  document.getElementById('form-tipo-contato').reset();
  document.getElementById('tipo-contato-id').value    = '';
  document.getElementById('tipo-contato-ativo').checked = true;

  if (tipo) {
    document.getElementById('titulo-form-tipo-contato').textContent  = 'Editar Tipo de Contato';
    document.getElementById('tipo-contato-id').value                 = tipo.id;
    document.getElementById('tipo-contato-nome').value               = tipo.nome;
    document.getElementById('tipo-contato-mascara').value            = tipo.mascara     || '';
    document.getElementById('tipo-contato-placeholder').value        = tipo.placeholder || '';
    document.getElementById('tipo-contato-validacao').value          = tipo.validacao;
    document.getElementById('tipo-contato-ativo').checked            = !!tipo.ativo;
  } else {
    document.getElementById('titulo-form-tipo-contato').textContent = 'Novo Tipo de Contato';
  }

  alternarSecao('secao-form-tipos-contato');
}

async function editarTipoContato(id) {
  const res = await apiFetch(`/api/tipos-contato/${id}`);
  if (!res) return;
  mostrarFormularioTipoContato(await res.json());
}

async function salvarTipoContato(event) {
  event.preventDefault();

  const id    = document.getElementById('tipo-contato-id').value;
  const dados = {
    nome:        document.getElementById('tipo-contato-nome').value.trim(),
    mascara:     document.getElementById('tipo-contato-mascara').value.trim(),
    placeholder: document.getElementById('tipo-contato-placeholder').value.trim(),
    validacao:   document.getElementById('tipo-contato-validacao').value,
    ativo:       document.getElementById('tipo-contato-ativo').checked,
  };

  const res = await apiFetch(id ? `/api/tipos-contato/${id}` : '/api/tipos-contato', {
    method:  id ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(dados),
  });
  if (!res) return;

  const resultado = await res.json();
  if (!res.ok) { exibirMensagem(resultado.erro, 'erro'); return; }

  exibirMensagem(id ? 'Tipo atualizado!' : 'Tipo criado!', 'sucesso');
  await atualizarCacheETiposSelect();
  navegarPara('tipos-contato');
}

async function toggleStatusTipoContato(id, ativoAtual) {
  const acao = ativoAtual ? 'desativar' : 'ativar';
  if (!confirm(`Deseja ${acao} este tipo de contato?`)) return;

  const res = await apiFetch(`/api/tipos-contato/${id}/status`, { method: 'PATCH' });
  if (!res) return;
  const resultado = await res.json();
  if (!res.ok) { exibirMensagem(resultado.erro, 'erro'); return; }

  exibirMensagem(`Tipo ${ativoAtual ? 'desativado' : 'ativado'}!`, 'sucesso');
  await atualizarCacheETiposSelect();
  carregarTiposContatoCadastro();
}

// ================================================
// Perfis — CRUD (admin)
// ================================================

async function carregarPerfis() {
  const res = await apiFetch('/api/perfis/todos');
  if (!res) return;
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    exibirMensagem(err.erro || 'Erro ao carregar perfis', 'erro');
    return;
  }

  const perfis = await res.json();
  const corpo  = document.getElementById('corpo-perfis');

  if (perfis.length === 0) {
    corpo.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#aaa;padding:1.5rem">Nenhum perfil cadastrado</td></tr>';
    return;
  }

  corpo.innerHTML = perfis.map(p => {
    const protegido = p.nivel === 1;
    const btnStatus = p.ativo
      ? `<button class="btn-deletar" onclick="toggleStatusPerfil(${p.id}, 1)"
             ${protegido ? 'disabled title="O perfil Administrador não pode ser desativado"' : ''}>Desativar</button>`
      : `<button class="btn-ativar" onclick="toggleStatusPerfil(${p.id}, 0)">Ativar</button>`;
    return `
      <tr>
        <td>${escapeHtml(p.nome)}</td>
        <td>${escapeHtml(p.descricao || '—')}</td>
        <td><span class="badge-status ${p.ativo ? 'ativo' : 'inativo'}">${p.ativo ? 'Ativo' : 'Inativo'}</span></td>
        <td>${p.usuarios_ativos}</td>
        <td>
          <button class="btn-editar" onclick="editarPerfil(${p.id})"
              ${protegido ? 'disabled title="O perfil Administrador não pode ser editado"' : ''}>Editar</button>
          ${btnStatus}
        </td>
      </tr>
    `;
  }).join('');
}

async function mostrarFormularioPerfil(perfil = null) {
  if (!usuarioLogado || usuarioLogado.nivel !== 'admin') {
    exibirMensagem('Acesso negado', 'erro');
    navegarPara('dashboard');
    return;
  }

  document.getElementById('form-perfil').reset();
  document.getElementById('perfil-id').value       = '';
  document.getElementById('perfil-ativo').checked  = true;

  if (perfil) {
    document.getElementById('titulo-form-perfil').textContent = 'Editar Perfil';
    document.getElementById('perfil-id').value                = perfil.id;
    document.getElementById('perfil-nome').value              = perfil.nome;
    document.getElementById('perfil-descricao').value         = perfil.descricao || '';
    document.getElementById('perfil-ativo').checked           = !!perfil.ativo;
  } else {
    document.getElementById('titulo-form-perfil').textContent = 'Novo Perfil';
  }

  alternarSecao('secao-form-perfil');
}

async function editarPerfil(id) {
  const res = await apiFetch(`/api/perfis/${id}`);
  if (!res) return;
  mostrarFormularioPerfil(await res.json());
}

async function salvarPerfil(event) {
  event.preventDefault();

  const id    = document.getElementById('perfil-id').value;
  const dados = {
    nome:     document.getElementById('perfil-nome').value.trim(),
    descricao: document.getElementById('perfil-descricao').value.trim(),
    ativo:    document.getElementById('perfil-ativo').checked,
  };

  const res = await apiFetch(id ? `/api/perfis/${id}` : '/api/perfis', {
    method:  id ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(dados),
  });
  if (!res) return;

  const resultado = await res.json();
  if (!res.ok) { exibirMensagem(resultado.erro, 'erro'); return; }

  exibirMensagem(id ? 'Perfil atualizado!' : 'Perfil criado!', 'sucesso');
  navegarPara('perfis');
}

async function toggleStatusPerfil(id, ativoAtual) {
  const acao = ativoAtual ? 'desativar' : 'ativar';
  if (!confirm(`Deseja ${acao} este perfil?`)) return;

  const res = await apiFetch(`/api/perfis/${id}/status`, { method: 'PATCH' });
  if (!res) return;
  const resultado = await res.json();
  if (!res.ok) { exibirMensagem(resultado.erro, 'erro'); return; }

  exibirMensagem(`Perfil ${ativoAtual ? 'desativado' : 'ativado'}!`, 'sucesso');
  carregarPerfis();
}

// ================================================
// Validação de CPF
// ================================================

function validarCPF(cpf) {
  const s = cpf.replace(/\D/g, '');
  if (s.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(s)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) soma += Number(s[i]) * (10 - i);
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== Number(s[9])) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) soma += Number(s[i]) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  return resto === Number(s[10]);
}

function validarCampoCPF() {
  const input = document.getElementById('cpf');
  const erro  = document.getElementById('erro-cpf');
  const vazio = input.value.trim() === '';
  const valido = !vazio && validarCPF(input.value);

  input.classList.toggle('invalido', !vazio && !valido);
  erro.classList.toggle('oculto', vazio || valido);
  return valido;
}

// ================================================
// Utilitários
// ================================================

function formatarCPF(cpf) {
  const s = String(cpf).replace(/\D/g, '').padStart(11, '0');
  return `${s.slice(0,3)}.${s.slice(3,6)}.${s.slice(6,9)}-${s.slice(9,11)}`;
}

function formatarData(data) {
  const [ano, mes, dia] = data.split('-');
  return `${dia}/${mes}/${ano}`;
}

function capitalizar(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(str) {
  return String(str).replace(/'/g, "\\'");
}

function exibirMensagem(texto, tipo) {
  const el = document.getElementById('mensagem');
  el.textContent = texto;
  el.className   = `mensagem ${tipo}`;
  el.classList.remove('oculto');
  clearTimeout(el._timer);
  el._timer = setTimeout(() => el.classList.add('oculto'), 3000);
}

// Ponto de entrada: verifica autenticação antes de qualquer coisa
inicializar();
