export const maskCurrency = (value) => {
  if (!value) return '';
  let v = value.toString().replace(/\D/g, '');
  if (!v) return '';
  
  // Se o usuário digitou algo, vamos considerar que ele digita a parte inteira e a máscara adiciona a formatação.
  // Como ele vai poder ver ",00" no blur, precisamos tratar se já tiver os centavos.
  // Vamos simplificar: guardaremos sempre string limpa no estado para dinheiro (em centavos ou apenas números)
  // Ou melhor, apenas tratar o input diretamente.
  
  // Vamos fazer uma máscara monetária brasileira padrão: 
  // v = (v / 100).toFixed(2).replace('.', ',');
  // v = v.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
  // return v;
  
  // O usuário quer: digita "30000", vira "30.000". No blur, vira "30.000,00".
  // Então o valor digitado é de reais inteiros, a menos que ele digite a vírgula? O input type é number hoje, então não tinha vírgula.
  // Vamos formatar sempre como inteiro enquanto digita.
  v = v.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
  return v;
};

export const maskInt = (value) => {
  if (!value) return '';
  let v = value.toString().replace(/\D/g, '');
  if (!v) return '';
  v = v.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
  return v;
};

export const applyCurrencyBlur = (value) => {
  if (!value) return '';
  let v = value.toString();
  // Se não tiver vírgula, adiciona ,00
  if (!v.includes(',')) {
    return v + ',00';
  }
  return v;
};

export const unmask = (value) => {
  if (!value) return 0;
  let v = value.toString();
  // Se tem vírgula, pega só a parte antes da vírgula para manter compatibilidade com os inteiros que salvavamos antes
  if (v.includes(',')) {
    v = v.split(',')[0];
  }
  return Number(v.replace(/\D/g, ''));
};

export const maskCPF = (value) => {
  if (!value) return '';
  let v = value.replace(/\D/g, '');
  if (v.length > 11) v = v.substring(0, 11);
  v = v.replace(/(\d{3})(\d)/, '$1.$2');
  v = v.replace(/(\d{3})(\d)/, '$1.$2');
  v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  return v;
};

export const validateCPF = (cpf) => {
  if (!cpf) return false;
  const strCPF = cpf.replace(/\D/g, '');
  if (strCPF.length !== 11) return false;
  
  if (/^(\d)\1+$/.test(strCPF)) return false;
  
  let soma = 0;
  let resto;
  
  for (let i = 1; i <= 9; i++) {
    soma = soma + parseInt(strCPF.substring(i-1, i)) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if ((resto === 10) || (resto === 11)) resto = 0;
  if (resto !== parseInt(strCPF.substring(9, 10))) return false;
  
  soma = 0;
  for (let i = 1; i <= 10; i++) {
    soma = soma + parseInt(strCPF.substring(i-1, i)) * (12 - i);
  }
  resto = (soma * 10) % 11;
  if ((resto === 10) || (resto === 11)) resto = 0;
  if (resto !== parseInt(strCPF.substring(10, 11))) return false;
  
  return true;
};
