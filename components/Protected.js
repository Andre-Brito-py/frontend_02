import { useEffect, useState } from 'react';

export default function Protected({ children, roles }) {
  const [ok, setOk] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    if (!token) {
      window.location.href = '/';
      return;
    }
    if (roles && roles.length > 0 && !roles.includes(role)) {
      // redireciona para página adequada
      window.location.href = role === 'CAIXA' ? '/sales' : '/dashboard';
      return;
    }
    setOk(true);
  }, [roles]);

  if (!ok) return null;
  return children;
}