import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dpnasdethhtybnyuqdlh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwbmFzZGV0aGh0eWJueXVxZGxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0MTUwNDUsImV4cCI6MjA5NTk5MTA0NX0.JL_U5AY2njRdutb43WeQNou7SJkhn0ybdPIe7Yv-jBc';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
  const newCar = {
    id: Date.now().toString(),
    cpf: '000.000.000-00',
    dataNascimento: null,
    estadoCivil: null,
    conjuge: null,
    filhos: [],
    sexo: null,
    time: null,
    hobby: null,
    marca: 'Test',
    modelo: 'Test',
    ano: 2021,
    anoModelo: 2021,
    km: 0,
    fipe: 0,
    venda: 0,
    ipva_pago: true,
    imagem: '',
    imagens: [],
    proprietarioNome: 'Test',
    proprietarioEmail: '',
    proprietarioTelefone: '',
    cidade: 'Test',
    estado: 'SP',
    negociacao: 'Venda a vista',
    tipoVeiculo: 'Carro',
    combustivel: 'Flex',
    cambio: 'Automático',
    tracao: '4x2',
    detalhes: '{}',
    status: 'pendente',
    dataCadastro: new Date().toISOString()
  };

  const { data, error } = await supabase.from('cars').insert([newCar]);
  if (error) {
    console.error('SUPABASE ERROR:', error);
  } else {
    console.log('SUCCESS:', data);
  }
}

testInsert();
