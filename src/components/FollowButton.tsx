'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface FollowButtonProps {
  /** UUID da loja que será seguida ou deixada de seguir */
  storeId: string;
  /** Texto opcional para substituir "Seguir" */
  followLabel?: string;
  /** Texto opcional para substituir "Seguindo" */
  followingLabel?: string;
}

/**
 * Botão para seguir ou deixar de seguir uma loja.
 *
 * - Envia POST para `/api/follow` para seguir.
 * - Envia DELETE para `/api/follow` para deixar de seguir.
 * - Mantém estado interno (`isFollowing`).
 * - Exibe feedback visual simples (desabilita enquanto a requisição está em andamento).
 *
 * O componente assume que o usuário já está autenticado via Supabase (cookies). Não há
 * verificação de permissão adicional porque a API já devolve 401 se necessário.
 */
export default function FollowButton({
  storeId,
  followLabel = '+ Seguir loja',
  followingLabel = 'Seguindo',
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  // Opcional: ao montar, podemos consultar se o usuário já segue a loja.
  // Como ainda não há endpoint GET, deixamos como false por padrão.

  const handleFollow = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/follow', {
        method: isFollowing ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId }),
      });
      const data = await res.json();
      if (!res.ok) {
        // Exibe erro simples no console; a UI pode ser aprimorada com toast.
        console.error('Follow error:', data?.error ?? 'unknown');
      } else {
        setIsFollowing(!isFollowing);
      }
    } catch (e) {
      console.error('Network error while following store:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleFollow}
      disabled={loading}
      className={`px-4 py-2 rounded transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
        ${isFollowing ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-primary-600 text-white hover:bg-primary-700'}`}
    >
      {loading ? '...' : isFollowing ? followingLabel : followLabel}
    </button>
  );
}
