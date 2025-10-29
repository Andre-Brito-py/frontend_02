import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function Protected({ children, roles }) {
  const [ok, setOk] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const role = typeof window !== 'undefined' ? localStorage.getItem('role') : null;
    if (!token) {
      router.replace('/');
      return;
    }
    if (roles && roles.length > 0 && !roles.includes(role)) {
      // redireciona para página adequada
      router.replace(role === 'CAIXA' ? '/sales' : '/dashboard');
      return;
    }
    setOk(true);
  }, []);

  if (!ok) return null;
  return children;
}