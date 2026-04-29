export function validarCPF(cpf) {
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

export function aplicarMascara(entrada, mascara) {
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

export function validarContato(tipo, valor) {
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
