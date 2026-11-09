'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentProfile, saveProfile, ProfileData } from '@/app/actions/profile';
import StoreModal from '@/components/StoreModal';
import PlansModal, { PlanType } from '@/components/PlansModal';

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isPlansModalOpen, setIsPlansModalOpen] = useState(false);
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('bronze');

  // Formatar máscara de WhatsApp brasileira: (XX) XXXXX-XXXX
  const formatPhone = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 11);
    if (raw.length <= 2) return raw;
    if (raw.length <= 7) return `(${raw.slice(0, 2)}) ${raw.slice(2)}`;
    return `(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value));
  };

  // Carregar perfil
  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await getCurrentProfile();
      if (!data) {
        // Redireciona para home se não logado
        router.push('/');
        return;
      }
      setProfile(data);
      setDisplayName(data.display_name || '');
      setPhone(data.phone ? formatPhone(data.phone) : '');
      setBirthDate(data.birth_date || '');
      // Se não completou os 3 campos obrigatórios, abre em modo de edição
      setIsEditing(!data.is_complete);
    } catch (err) {
      console.error('Erro ao carregar perfil:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    // Validações
    const rawPhone = phone.replace(/\D/g, '');
    if (rawPhone.length < 10 || rawPhone.length > 11) {
      setFeedback({ type: 'error', message: 'Por favor, insira um WhatsApp válido com DDD.' });
      setSaving(false);
      return;
    }

    if (birthDate) {
      const selected = new Date(birthDate);
      const today = new Date();
      if (selected > today) {
        setFeedback({ type: 'error', message: 'A data de nascimento não pode ser no futuro.' });
        setSaving(false);
        return;
      }
    }

    try {
      const res = await saveProfile({
        displayName,
        phone,
        birthDate,
      });

      if (res.success) {
        setFeedback({ type: 'success', message: 'Cadastro salvo com sucesso!' });
        setIsEditing(false);
        setProfile((prev) => prev ? {
          ...prev,
          display_name: displayName,
          phone,
          birth_date: birthDate,
          is_complete: Boolean(displayName && phone && birthDate),
        } : null);
      } else {
        setFeedback({ type: 'error', message: res.error || 'Erro ao salvar cadastro.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Erro inesperado.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isFormComplete = profile?.is_complete || Boolean(displayName && phone && birthDate);

  return (
    <div className="min-h-[85vh] bg-gray-50/50 py-10 px-4">
      <div className="max-w-[560px] mx-auto bg-white border border-gray-200 shadow-sm p-6 sm:p-8">
        {/* Cabeçalho do Perfil */}
        <div className="flex items-center gap-4 border-b border-gray-100 pb-5 mb-6">
          <div className="w-14 h-14 rounded-full border border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center shrink-0">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xl font-bold uppercase text-gray-400">
                {displayName ? displayName[0] : 'U'}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">
              {displayName || 'Meu Cadastro'}
            </h1>
            <p className="text-xs text-gray-500">{profile?.email}</p>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-3.5 mb-6 text-xs rounded-[2px] flex items-center justify-between ${
              feedback.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            <span>{feedback.message}</span>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="font-bold text-sm ml-2 cursor-pointer"
            >
              &times;
            </button>
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSave} className="space-y-4">
          {/* 1. Nome Completo */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
              Nome Completo *
            </label>
            <input
              type="text"
              required
              disabled={!isEditing}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Ex: Carlos Eduardo de Oliveira"
              className={`w-full border px-3 py-2 text-sm text-gray-900 transition-colors ${
                !isEditing
                  ? 'bg-gray-50 border-gray-200 cursor-not-allowed text-gray-600'
                  : 'bg-white border-gray-300 focus:border-black focus:outline-none'
              }`}
            />
          </div>

          {/* 2. WhatsApp */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
              WhatsApp *
            </label>
            <input
              type="tel"
              required
              disabled={!isEditing}
              value={phone}
              onChange={handlePhoneChange}
              placeholder="(11) 98765-4321"
              className={`w-full border px-3 py-2 text-sm text-gray-900 transition-colors ${
                !isEditing
                  ? 'bg-gray-50 border-gray-200 cursor-not-allowed text-gray-600'
                  : 'bg-white border-gray-300 focus:border-black focus:outline-none'
              }`}
            />
            <span className="text-[10px] text-gray-400 mt-0.5 block">
              Para entrar em contato com lojistas com agilidade e segurança.
            </span>
          </div>

          {/* 3. Data de Nascimento */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
              Data de Nascimento *
            </label>
            <input
              type="date"
              required
              disabled={!isEditing}
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className={`w-full border px-3 py-2 text-sm text-gray-900 transition-colors ${
                !isEditing
                  ? 'bg-gray-50 border-gray-200 cursor-not-allowed text-gray-600'
                  : 'bg-white border-gray-300 focus:border-black focus:outline-none'
              }`}
            />
            <span className="text-[10px] text-gray-400 mt-0.5 block">
              Seus dados pessoais são protegidos conforme as diretrizes da LGPD.
            </span>
          </div>

          {/* Botões de Ação */}
          <div className="pt-3">
            {isEditing ? (
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-black hover:bg-neutral-800 text-white py-3 text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer disabled:opacity-50"
              >
                {saving ? 'Salvando...' : 'Salvar Cadastro'}
              </button>
            ) : (
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="flex-1 border border-neutral-300 hover:border-black hover:bg-gray-50 text-neutral-800 py-3 px-2 text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer text-center"
                >
                  Editar Cadastro
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/')}
                  className="flex-1 bg-black hover:bg-neutral-800 text-white py-3 px-2 text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-sm text-center"
                >
                  Sou Usuário — Voltar para o Início
                </button>
                <button
                  type="button"
                  onClick={() => setIsPlansModalOpen(true)}
                  className="flex-1 bg-[#FB6600] hover:bg-[#e05b00] text-white py-3 px-2 text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-sm text-center"
                >
                  Sou Lojista — Quero abrir minha Kittanda
                </button>
              </div>
            )}
          </div>
        </form>

      </div>

      {/* Modal de Escolha de Planos (Bronze, Prata, Ouro) */}
      <PlansModal
        isOpen={isPlansModalOpen}
        onClose={() => setIsPlansModalOpen(false)}
        onSelectPlan={(plan) => {
          setSelectedPlan(plan);
          setIsPlansModalOpen(false);
          if (plan === 'bronze') {
            router.push('/painel/loja?plano=gratuito');
          } else {
            setIsStoreModalOpen(true);
          }
        }}
      />

      {/* Modal de Criação de Loja com o Plano Selecionado */}
      <StoreModal
        isOpen={isStoreModalOpen}
        onClose={() => setIsStoreModalOpen(false)}
        profile={profile}
        initialPlan={selectedPlan}
      />
    </div>
  );
}
