// Guarda o cliente aberto na tela de detalhe
let clienteAtual = null;

// ================================================
// Navegação entre seções
// ================================================

function mostrarLista() {
  alternarSecao('secao-lista');
  carregarClientes();
}

function mostrarFormulario(cliente = null) {
  document.getElementById('form-cliente').reset();
  document.getElementById('cliente-id').value = '';
  document.getElementById('cpf').classList.remove('invalido');
  document.getElementById('erro-cpf').classList.add('oculto');

  if (cliente) {
    document.getElementById('titulo-formulario').textContent = 'Editar Cliente';
    document.getElementById('cliente-id').value = cliente.id;
    document.getElementById('nome').value = cliente.nome || '';
    document.getElementById('cpf').value = formatarCPF(cliente.cpf);
    document.getElementById('email').value = cliente.email || '';
    document.getElementById('data-nascimento').value = cliente.data_nascimento || '';
    document.getElementById('endereco').value = cliente.endereco || '';
  } else {
    document.getElementById('titulo-formulario').textContent = 'Novo Cliente';
  }

  alternarSecao('secao-formulario');
}

function mostrarDetalhe(id) {
  carregarDetalheCliente(id);
  alternarSecao('secao-detalhe');
}

function alternarSecao(idAtiva) {
  ['secao-lista', 'secao-formulario', 'secao-detalhe'].forEach(id => {
    document.getElementById(id).classList.toggle('oculto', id !== idAtiva);
  });
}

// ================================================
// Clientes — CRUD
// ================================================

async function carregarClientes() {
  const res = await fetch('/api/clientes');
  const clientes = await res.json();
  const corpo = document.getElementById('corpo-tabela');

  if (clientes.length === 0) {
    corpo.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#aaa;padding:1.5rem">Nenhum cliente cadastrado</td></tr>';
    return;
  }

  corpo.innerHTML = clientes.map(c => `
    <tr>
      <td>${escapeHtml(c.nome)}</td>
      <td>${formatarCPF(c.cpf)}</td>
      <td>${escapeHtml(c.email || '—')}</td>
      <td>
        <button onclick="mostrarDetalhe(${c.id})">Contatos</button>
        <button class="btn-editar" onclick="editarCliente(${c.id})">Editar</button>
        <button class="btn-deletar" onclick="deletarCliente(${c.id}, '${escapeAttr(c.nome)}')">Excluir</button>
      </td>
    </tr>
  `).join('');
}

async function editarCliente(id) {
  const res = await fetch(`/api/clientes/${id}`);
  const cliente = await res.json();
  mostrarFormulario(cliente);
}

async function salvarCliente(event) {
  event.preventDefault();

  if (!validarCampoCPF()) {
    document.getElementById('cpf').focus();
    return;
  }

  const id = document.getElementById('cliente-id').value;
  const dados = {
    nome:            document.getElementById('nome').value.trim(),
    cpf:             document.getElementById('cpf').value.replace(/\D/g, ''),
    email:           document.getElementById('email').value.trim(),
    data_nascimento: document.getElementById('data-nascimento').value,
    endereco:        document.getElementById('endereco').value.trim(),
  };

  const res = await fetch(id ? `/api/clientes/${id}` : '/api/clientes', {
    method:  id ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(dados),
  });

  const resultado = await res.json();

  if (!res.ok) {
    exibirMensagem(resultado.erro, 'erro');
    return;
  }

  exibirMensagem(id ? 'Cliente atualizado!' : 'Cliente cadastrado!', 'sucesso');
  mostrarLista();
}

async function deletarCliente(id, nome) {
  if (!confirm(`Excluir o cliente "${nome}" e todos os seus contatos?`)) return;

  const res = await fetch(`/api/clientes/${id}`, { method: 'DELETE' });
  const resultado = await res.json();

  if (!res.ok) {
    exibirMensagem(resultado.erro, 'erro');
    return;
  }

  exibirMensagem('Cliente excluído!', 'sucesso');
  carregarClientes();
}

// ================================================
// Contatos — CRUD
// ================================================

async function carregarDetalheCliente(id) {
  const res = await fetch(`/api/clientes/${id}`);
  const cliente = await res.json();
  clienteAtual = cliente;

  document.getElementById('info-cliente').innerHTML = `
    <h2>${escapeHtml(cliente.nome)}</h2>
    <p><strong>CPF:</strong> ${formatarCPF(cliente.cpf)}</p>
    <p><strong>Email:</strong> ${escapeHtml(cliente.email || '—')}</p>
    <p><strong>Nascimento:</strong> ${cliente.data_nascimento ? formatarData(cliente.data_nascimento) : '—'}</p>
    <p><strong>Endereço:</strong> ${escapeHtml(cliente.endereco || '—')}</p>
  `;

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
      <td>${escapeHtml(c.telefone)}</td>
      <td>${capitalizar(c.tipo)}</td>
      <td>
        <button class="btn-editar" onclick="editarContato(${c.id}, '${escapeAttr(c.telefone)}', '${c.tipo}')">Editar</button>
        <button class="btn-deletar" onclick="deletarContato(${c.id})">Excluir</button>
      </td>
    </tr>
  `).join('');
}

async function salvarContato(event) {
  event.preventDefault();

  const id       = document.getElementById('contato-id').value;
  const telefone = document.getElementById('telefone').value.trim();
  const tipo     = document.getElementById('tipo-contato').value;

  const res = await fetch(
    id ? `/api/contatos/${id}` : `/api/contatos/cliente/${clienteAtual.id}`,
    {
      method:  id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ telefone, tipo }),
    }
  );

  const resultado = await res.json();

  if (!res.ok) {
    exibirMensagem(resultado.erro, 'erro');
    return;
  }

  exibirMensagem(id ? 'Contato atualizado!' : 'Contato adicionado!', 'sucesso');
  carregarDetalheCliente(clienteAtual.id);
}

function editarContato(id, telefone, tipo) {
  document.getElementById('contato-id').value = id;
  document.getElementById('telefone').value = telefone;
  document.getElementById('tipo-contato').value = tipo;
  document.getElementById('titulo-form-contato').textContent = 'Editar Contato';
  document.getElementById('btn-salvar-contato').textContent = 'Salvar';
  document.getElementById('btn-cancelar-contato').classList.remove('oculto');
  document.getElementById('form-contato').scrollIntoView({ behavior: 'smooth' });
}

function cancelarEdicaoContato() {
  resetarFormContato();
}

async function deletarContato(id) {
  if (!confirm('Excluir este contato?')) return;

  const res = await fetch(`/api/contatos/${id}`, { method: 'DELETE' });
  const resultado = await res.json();

  if (!res.ok) {
    exibirMensagem(resultado.erro, 'erro');
    return;
  }

  exibirMensagem('Contato excluído!', 'sucesso');
  carregarDetalheCliente(clienteAtual.id);
}

function resetarFormContato() {
  document.getElementById('form-contato').reset();
  document.getElementById('contato-id').value = '';
  document.getElementById('titulo-form-contato').textContent = 'Adicionar Contato';
  document.getElementById('btn-salvar-contato').textContent = 'Adicionar';
  document.getElementById('btn-cancelar-contato').classList.add('oculto');
}

// ================================================
// Validação de CPF
// ================================================

function validarCPF(cpf) {
  const s = cpf.replace(/\D/g, '');
  if (s.length !== 11) return false;
  // Rejeita sequências com todos os dígitos iguais (ex: 111.111.111-11)
  if (/^(\d)\1{10}$/.test(s)) return false;

  // Valida primeiro dígito verificador
  let soma = 0;
  for (let i = 0; i < 9; i++) soma += Number(s[i]) * (10 - i);
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== Number(s[9])) return false;

  // Valida segundo dígito verificador
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

// Escapa HTML para exibição segura em innerHTML
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Escapa apenas aspas simples para uso em atributos onclick inline
function escapeAttr(str) {
  return String(str).replace(/'/g, "\\'");
}

function exibirMensagem(texto, tipo) {
  const el = document.getElementById('mensagem');
  el.textContent = texto;
  el.className = `mensagem ${tipo}`;
  el.classList.remove('oculto');
  clearTimeout(el._timer);
  el._timer = setTimeout(() => el.classList.add('oculto'), 3000);
}

// Inicializa carregando a lista
mostrarLista();
