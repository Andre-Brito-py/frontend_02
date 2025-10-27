import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function Protected({ children, roles }) {
  const [ok, setOk] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
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
  }, [roles, router]);

  if (!ok) return null;
  return children;
}