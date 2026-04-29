import { useState, useCallback, useEffect, useRef } from 'react';

let _mostrar = null;

export function useMensagem() {
  return useCallback((texto, tipo = 'sucesso') => {
    if (_mostrar) _mostrar(texto, tipo);
  }, []);
}

export default function Mensagem() {
  const [msg, setMsg] = useState(null);
  const timer = useRef(null);

  useEffect(() => {
    _mostrar = (texto, tipo) => {
      clearTimeout(timer.current);
      setMsg({ texto, tipo });
      timer.current = setTimeout(() => setMsg(null), 3000);
    };
    return () => { _mostrar = null; };
  }, []);

  if (!msg) return null;

  return (
    <div className={`mensagem ${msg.tipo}`}>
      {msg.texto}
    </div>
  );
}
