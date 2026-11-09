'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentProfile } from '@/app/actions/profile';

/**
 * Caixa de aviso centralizada e não bloqueante para usuários
 * autenticados com cadastro incompleto.
 *
 * Persiste o fechamento na sessão atual via sessionStorage para não
 * incomodar repetidamente na mesma navegação, mas reaparece em futuras visitas.
 */
export default function ProfileNoticeModal() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Se o usuário já dispensou nesta navegação/sessão, não exibe
    const dismissed = sessionStorage.getItem('dismissed_profile_notice');
    if (dismissed === 'true') return;

    getCurrentProfile().then((profile) => {
      // Usuário logado mas sem cadastro completo
      if (profile && !profile.is_complete) {
        setIsOpen(true);
      }
    });
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem('dismissed_profile_notice', 'true');
    setIsOpen(false);
  };

  const handleGoToProfile = () => {
    setIsOpen(false);
    router.push('/perfil');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200">
      <div className="relative w-full max-w-[440px] bg-white border border-gray-200 shadow-2xl p-6 rounded-none text-center animate-in zoom-in-95 duration-200">
        {/* Fechar no canto superior */}
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-gray-400 hover:text-black transition-colors p-1"
          aria-label="Fechar aviso"
        >
          &times;
        </button>

        {/* Ícone */}
        <div className="w-12 h-12 bg-orange-50 text-[#FB6600] rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 stroke-[1.8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </div>

        {/* Título e Mensagem */}
        <h3 className="text-base font-bold text-gray-900 mb-2">
          Complete seu cadastro!
        </h3>
        <p className="text-xs text-gray-600 leading-relaxed mb-6">
          Para se comunicar com as lojas pelo WhatsApp e aproveitar todos os recursos da Kittanda Outlet, precisamos que você complete seu cadastro.
        </p>

        {/* Botão de Ação */}
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <button
            type="button"
            onClick={handleGoToProfile}
            className="w-full bg-[#FB6600] hover:bg-[#e05b00] text-white py-2.5 px-4 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
          >
            Completar cadastro
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="w-full sm:w-auto px-4 py-2.5 text-xs text-gray-500 hover:text-black transition-colors"
          >
            Depois
          </button>
        </div>
      </div>
    </div>
  );
}
