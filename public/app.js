// ================================================
// Estado da aplicação
// ================================================
let clienteAtual  = null;
let usuarioLogado = null;
let paginasAdmin  = new Set();
let urlParentMap  = {};
let titulosPagina = {};

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
  await carregarMenu();
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
  perfis:     '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>',
};

function svgIcone(icon, size = 18) {
  return `<svg viewBox="0 0 24 24" fill="currentColor" width="${size}" height="${size}">${ICONES[icon] || ''}</svg>`;
}

async function carregarMenu() {
  const res = await apiFetch('/api/menus');
  if (!res) return;
  const itens = await res.json();

  // Páginas admin-only = items cujo perfil_nivel < 2 (mais restritivos que "todos")
  paginasAdmin = new Set(
    itens.filter(i => i.url && i.perfil_nivel < 2).map(i => i.url)
  );

  urlParentMap  = {};
  titulosPagina = {};
  itens.filter(i => i.url).forEach(i => { titulosPagina[i.url] = i.label; });
  itens.filter(i => i.parent_id).forEach(filho => {
    const pai = itens.find(i => i.id === filho.parent_id);
    if (pai && filho.url) urlParentMap[filho.url] = pai.icon;
  });

  renderizarMenu(itens);
}

function renderizarMenu(itens) {
  const ul = document.getElementById('sidebar-menu');
  ul.innerHTML = '';

  const raiz = itens.filter(i => !i.parent_id).sort((a, b) => a.ordem - b.ordem);

  raiz.forEach(item => {
    const filhos = itens.filter(i => i.parent_id === item.id).sort((a, b) => a.ordem - b.ordem);
    ul.appendChild(filhos.length > 0 ? criarGrupoMenu(item, filhos) : criarItemMenu(item));
  });
}

function criarItemMenu(item) {
  const li = document.createElement('li');
  li.className = 'menu-item';
  li.id = `nav-${item.url}`;
  li.onclick = () => navegarPara(item.url);
  li.innerHTML = `${svgIcone(item.icon)} ${escapeHtml(item.label)}`;
  return li;
}

function criarGrupoMenu(pai, filhos) {
  const SETA = `<svg class="seta-submenu" viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/></svg>`;

  const li = document.createElement('li');
  li.className = 'menu-grupo';
  li.id = `nav-${pai.icon}`;

  const div = document.createElement('div');
  div.className = 'menu-item';
  div.onclick = () => toggleSubmenu(pai.icon);
  div.innerHTML = `${svgIcone(pai.icon)} ${escapeHtml(pai.label)} ${SETA}`;

  const ulSub = document.createElement('ul');
  ulSub.className = 'submenu oculto';
  ulSub.id = `submenu-${pai.icon}`;

  filhos.forEach(filho => {
    const liFilho = document.createElement('li');
    liFilho.className = 'menu-item submenu-item';
    liFilho.id = `nav-${filho.url}`;
    liFilho.onclick = () => navegarPara(filho.url);
    liFilho.innerHTML = `${svgIcone(filho.icon, 16)} ${escapeHtml(filho.label)}`;
    ulSub.appendChild(liFilho);
  });

  li.appendChild(div);
  li.appendChild(ulSub);
  return li;
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

  const paiIcone = urlParentMap[pagina];
  if (paiIcone) {
    const submenu = document.getElementById(`submenu-${paiIcone}`);
    const grupo   = document.getElementById(`nav-${paiIcone}`);
    if (submenu) submenu.classList.remove('oculto');
    if (grupo)   grupo.classList.add('aberto');
  }

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
  ['secao-dashboard', 'secao-lista',      'secao-formulario',
   'secao-usuarios',  'secao-form-usuario',
   'secao-menus',     'secao-form-menu',
   'secao-perfis',    'secao-form-perfil'].forEach(id => {
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

  const clienteId = id || resultado.id;

  // Transita para modo edição (permanece na tela com contatos visíveis)
  document.getElementById('cliente-id').value = clienteId;
  document.getElementById('titulo-formulario').textContent = 'Editar Cliente';
  document.getElementById('msg-salvar-primeiro').classList.add('oculto');
  document.getElementById('area-contatos').classList.remove('oculto');

  exibirMensagem(id ? 'Cliente atualizado!' : 'Cliente cadastrado!', 'sucesso');
  await carregarContatosInline(clienteId);
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
      <td>${capitalizar(c.tipo)}</td>
      <td>${escapeHtml(c.telefone)}</td>
      <td>
        <button class="btn-editar" onclick="editarContato(${c.id}, '${escapeAttr(c.telefone)}', '${c.tipo}')">Editar</button>
        <button class="btn-deletar" onclick="deletarContato(${c.id})">Excluir</button>
      </td>
    </tr>
  `).join('');
}

function mostrarFormContato() {
  document.getElementById('form-contato').reset();
  document.getElementById('contato-id').value = '';
  document.getElementById('titulo-form-contato').textContent = 'Adicionar Contato';
  document.getElementById('form-contato-wrapper').classList.remove('oculto');
  document.getElementById('form-contato-wrapper').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function cancelarFormContato() {
  document.getElementById('form-contato-wrapper').classList.add('oculto');
  document.getElementById('form-contato').reset();
  document.getElementById('contato-id').value = '';
}

function resetarFormContato() {
  document.getElementById('form-contato-wrapper').classList.add('oculto');
  document.getElementById('form-contato').reset();
  document.getElementById('contato-id').value = '';
}

function editarContato(id, telefone, tipo) {
  document.getElementById('contato-id').value   = id;
  document.getElementById('telefone').value     = telefone;
  document.getElementById('tipo-contato').value = tipo;
  document.getElementById('titulo-form-contato').textContent = 'Editar Contato';
  document.getElementById('form-contato-wrapper').classList.remove('oculto');
  document.getElementById('form-contato-wrapper').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

async function salvarContato(event) {
  event.preventDefault();

  const id       = document.getElementById('contato-id').value;
  const telefone = document.getElementById('telefone').value.trim();
  const tipo     = document.getElementById('tipo-contato').value;

  const res = await apiFetch(
    id ? `/api/contatos/${id}` : `/api/contatos/cliente/${clienteAtual.id}`,
    {
      method:  id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ telefone, tipo }),
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
        <td><span class="badge-nivel ${u.perfil_nivel === 1 ? 'admin' : 'usuario'}">${escapeHtml(u.perfil_nome)}</span></td>
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

  const resPerfis = await apiFetch('/api/perfis');
  if (!resPerfis) return;
  const perfis = await resPerfis.json();
  const select = document.getElementById('usuario-perfil');
  select.innerHTML = '';
  perfis.forEach(p => {
    select.innerHTML += `<option value="${p.id}">${escapeHtml(p.nome)}</option>`;
  });

  const senhaInput = document.getElementById('usuario-senha');
  const senhaHint  = document.getElementById('senha-hint');

  if (usuario) {
    document.getElementById('titulo-form-usuario').textContent = 'Editar Usuário';
    document.getElementById('usuario-id').value     = usuario.id;
    document.getElementById('usuario-nome').value   = usuario.nome;
    document.getElementById('usuario-email').value  = usuario.email;
    document.getElementById('usuario-perfil').value = usuario.perfil_id;
    senhaInput.required   = false;
    senhaInput.minLength  = 0;
    senhaHint.textContent = '(deixe em branco para manter a atual)';
  } else {
    document.getElementById('titulo-form-usuario').textContent = 'Novo Usuário';
    senhaInput.required   = true;
    senhaInput.minLength  = 6;
    senhaHint.textContent = '(mínimo 6 caracteres)';
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
    nome:      document.getElementById('usuario-nome').value.trim(),
    email:     document.getElementById('usuario-email').value.trim(),
    senha:     document.getElementById('usuario-senha').value,
    perfil_id: Number(document.getElementById('usuario-perfil').value),
  };

  const res = await apiFetch(id ? `/api/usuarios/${id}` : '/api/usuarios', {
    method:  id ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(dados),
  });
  if (!res) return;

  const resultado = await res.json();
  if (!res.ok) { exibirMensagem(resultado.erro, 'erro'); return; }

  exibirMensagem(id ? 'Usuário atualizado!' : 'Usuário criado!', 'sucesso');
  navegarPara('usuarios');
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

// ================================================
// Perfis — CRUD (admin)
// ================================================

async function carregarPerfis() {
  const res = await apiFetch('/api/perfis/todos');
  if (!res) return;
  if (res.status === 403) { exibirMensagem('Acesso restrito a administradores', 'erro'); return; }

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
