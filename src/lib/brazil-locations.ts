export interface BrazilState {
  uf: string
  name: string
}

export interface KittandaLocation {
  state: string
  city: string
  neighborhood: string
}

export const KITTANDA_LOCATION_STORAGE_KEY = 'kittanda_selected_location'
export const KITTANDA_LOCATION_EVENT = 'kittanda:location-changed'

export const DEFAULT_KITTANDA_LOCATION: KittandaLocation = {
  state: 'MS',
  city: 'Campo Grande',
  neighborhood: 'Centro',
}

export const BRAZIL_STATES: BrazilState[] = [
  { uf: 'AC', name: 'Acre' },
  { uf: 'AL', name: 'Alagoas' },
  { uf: 'AP', name: 'Amapá' },
  { uf: 'AM', name: 'Amazonas' },
  { uf: 'BA', name: 'Bahia' },
  { uf: 'CE', name: 'Ceará' },
  { uf: 'DF', name: 'Distrito Federal' },
  { uf: 'ES', name: 'Espírito Santo' },
  { uf: 'GO', name: 'Goiás' },
  { uf: 'MA', name: 'Maranhão' },
  { uf: 'MT', name: 'Mato Grosso' },
  { uf: 'MS', name: 'Mato Grosso do Sul' },
  { uf: 'MG', name: 'Minas Gerais' },
  { uf: 'PA', name: 'Pará' },
  { uf: 'PB', name: 'Paraíba' },
  { uf: 'PR', name: 'Paraná' },
  { uf: 'PE', name: 'Pernambuco' },
  { uf: 'PI', name: 'Piauí' },
  { uf: 'RJ', name: 'Rio de Janeiro' },
  { uf: 'RN', name: 'Rio Grande do Norte' },
  { uf: 'RS', name: 'Rio Grande do Sul' },
  { uf: 'RO', name: 'Rondônia' },
  { uf: 'RR', name: 'Roraima' },
  { uf: 'SC', name: 'Santa Catarina' },
  { uf: 'SP', name: 'São Paulo' },
  { uf: 'SE', name: 'Sergipe' },
  { uf: 'TO', name: 'Tocantins' },
]

export const TOP_CITIES_BY_UF: Record<string, string[]> = {
  AC: [
    'Rio Branco', 'Cruzeiro do Sul', 'Sena Madureira', 'Tarauacá', 'Feijó',
    'Brasileia', 'Senador Guiomard', 'Plácido de Castro', 'Xapuri', 'Mâncio Lima',
    'Epitaciolândia', 'Marechal Thaumaturgo', 'Porto Acre', 'Rodrigues Alves', 'Acrelândia',
    'Capixaba', 'Bujari', 'Manoel Urbano', 'Assis Brasil', 'Jordão', 'Porto Walter', 'Santa Rosa do Purus',
  ],
  AL: [
    'Maceió', 'Arapiraca', 'Rio Largo', 'Palmeira dos Índios', 'União dos Palmares',
    'Penedo', 'São Miguel dos Campos', 'Coruripe', 'Marechal Deodoro', 'Delmiro Gouveia',
    'Santana do Ipanema', 'Atalaia', 'Teotônio Vilela', 'Girau do Ponciano', 'Pilar',
    'São Luís do Quitunde', 'São Sebastião', 'Maragogi', 'Junqueiro', 'Viçosa',
    'Matriz de Camaragibe', 'Murici', 'Boca da Mata', 'Porto Calvo', 'Campo Alegre',
    'Pão de Açúcar', 'Traipu', 'Igaci', 'Craíbas', 'Limoeiro de Anadia',
  ],
  AP: [
    'Macapá', 'Santana', 'Laranjal do Jari', 'Oiapoque', 'Mazagão',
    'Porto Grande', 'Tartarugalzinho', 'Pedra Branca do Amapari', 'Vitória do Jari', 'Calçoene',
    'Amapá', 'Ferreira Gomes', 'Cutias', 'Itaubal', 'Serra do Navio', 'Pracuúba',
  ],
  AM: [
    'Manaus', 'Parintins', 'Itacoatiara', 'Manacapuru', 'Coari',
    'Tabatinga', 'Maués', 'Tefé', 'Manicoré', 'Humaitá',
    'Iranduba', 'Lábrea', 'São Gabriel da Cachoeira', 'Benjamin Constant', 'Borba',
    'Autazes', 'São Paulo de Olivença', 'Careiro', 'Nova Olinda do Norte', 'Presidente Figueiredo',
    'Eirunepé', 'Boca do Acre', 'Rio Preto da Eva', 'Manaquiri', 'Barreirinha',
    'Fonte Boa', 'Santo Antônio do Içá', 'Barcelos', 'Carauari', 'Novo Aripuanã',
  ],
  BA: [
    'Salvador', 'Feira de Santana', 'Vitória da Conquista', 'Camaçari', 'Juazeiro',
    'Itabuna', 'Lauro de Freitas', 'Ilhéus', 'Jequié', 'Teixeira de Freitas',
    'Barreiras', 'Alagoinhas', 'Porto Seguro', 'Simões Filho', 'Paulo Afonso',
    'Eunápolis', 'Santo Antônio de Jesus', 'Valença', 'Candeias', 'Luís Eduardo Magalhães',
    'Guanambi', 'Jacobina', 'Serrinha', 'Senhor do Bonfim', 'Dias d\'Ávila',
    'Itapetinga', 'Irecê', 'Campo Formoso', 'Casa Nova', 'Brumado',
  ],
  CE: [
    'Fortaleza', 'Caucaia', 'Juazeiro do Norte', 'Maracanaú', 'Sobral',
    'Crato', 'Itapipoca', 'Maranguape', 'Iguatu', 'Quixadá',
    'Pacatuba', 'Aquiraz', 'Quixeramobim', 'Canindé', 'Russas',
    'Crateús', 'Tianguá', 'Aracati', 'Cascavel', 'Pacajus',
    'Icó', 'Horizonte', 'Camocim', 'Morada Nova', 'Acaraú',
    'Viçosa do Ceará', 'Barbalha', 'Limoeiro do Norte', 'Tauá', 'Trairi',
  ],
  DF: [
    'Brasília', 'Ceilândia', 'Taguatinga', 'Samambaia', 'Plano Piloto',
    'Águas Claras', 'Gama', 'Guará', 'Sobradinho', 'Planaltina',
    'Recanto das Emas', 'Santa Maria', 'São Sebastião', 'Vicente Pires', 'Riacho Fundo',
    'Núcleo Bandeirante', 'Paranoá', 'Brazlândia', 'Itapoã', 'Sudoeste/Octogonal',
    'Cruzeiro', 'Jardim Botânico', 'Lago Sul', 'Lago Norte', 'Sobradinho II',
    'Riacho Fundo II', 'Park Way', 'SCIA (Estrutural)', 'Varjão', 'Candangolândia',
  ],
  ES: [
    'Serra', 'Vila Velha', 'Cariacica', 'Vitória', 'Cachoeiro de Itapemirim',
    'Linhares', 'Guarapari', 'São Mateus', 'Colatina', 'Aracruz',
    'Viana', 'Nova Venécia', 'Barra de São Francisco', 'Santa Maria de Jetibá', 'Marataízes',
    'São Gabriel da Palha', 'Castelo', 'Itapemirim', 'Domingos Martins', 'Conceição da Barra',
    'Guaçuí', 'Jaguaré', 'Afonso Cláudio', 'Anchieta', 'Alegre',
    'Baixo Guandu', 'Sooretama', 'Iúna', 'Piúma', 'Pedro Canário',
  ],
  GO: [
    'Goiânia', 'Aparecida de Goiânia', 'Anápolis', 'Rio Verde', 'Águas Lindas de Goiás',
    'Luziânia', 'Valparaíso de Goiás', 'Trindade', 'Formosa', 'Senador Canedo',
    'Novo Gama', 'Catalão', 'Itumbiara', 'Jataí', 'Caldas Novas',
    'Planaltina', 'Cidade Ocidental', 'Santo Antônio do Descoberto', 'Goianésia', 'Mineiros',
    'Cristalina', 'Inhumas', 'Jaraguá', 'Quirinópolis', 'Niquelândia',
    'Porangatu', 'Morrinhos', 'Goianira', 'Uruaçu', 'Santa Helena de Goiás',
  ],
  MA: [
    'São Luís', 'Imperatriz', 'São José de Ribamar', 'Timon', 'Caxias',
    'Paço do Lumiar', 'Codó', 'Açailândia', 'Bacabal', 'Balsas',
    'Santa Inês', 'Barra do Corda', 'Pinheiro', 'Chapadinha', 'Grajaú',
    'Itapecuru-Mirim', 'Coroatá', 'Barreirinhas', 'Tutóia', 'Zé Doca',
    'Viana', 'Presidente Dutra', 'Coelho Neto', 'Lago da Pedra', 'Rosário',
    'São Mateus do Maranhão', 'Pedreiras', 'Colinas', 'Raposa', 'Estreito',
  ],
  MT: [
    'Cuiabá', 'Várzea Grande', 'Rondonópolis', 'Sinop', 'Sorriso',
    'Tangará da Serra', 'Cáceres', 'Primavera do Leste', 'Lucas do Rio Verde', 'Barra do Garças',
    'Alta Floresta', 'Nova Mutum', 'Pontes e Lacerda', 'Juína', 'Campo Novo do Parecis',
    'Colniza', 'Guarantã do Norte', 'Juara', 'Peixoto de Azevedo', 'Campo Verde',
    'Poconé', 'Confresa', 'Sapezal', 'Água Boa', 'Canarana',
    'Mirassol d\'Oeste', 'Jaciara', 'Paranatinga', 'Aripuanã', 'Comodoro',
  ],
  MS: [
    'Campo Grande', 'Dourados', 'Três Lagoas', 'Corumbá', 'Ponta Porã',
    'Naviraí', 'Nova Andradina', 'Aquidauana', 'Sidrolândia', 'Maracaju',
    'Paranaíba', 'Amambai', 'Rio Brilhante', 'Coxim', 'Chapadão do Sul',
    'Caarapó', 'São Gabriel do Oeste', 'Miranda', 'Jardim', 'Anastácio',
    'Bela Vista', 'Ivinhema', 'Aparecida do Taboado', 'Ribas do Rio Pardo', 'Bataguassu',
    'Bonito', 'Cassilândia', 'Nova Alvorada do Sul', 'Itaporã', 'Ladário',
  ],
  MG: [
    'Belo Horizonte', 'Uberlândia', 'Contagem', 'Juiz de Fora', 'Betim',
    'Montes Claros', 'Ribeirão das Neves', 'Uberaba', 'Governador Valadares', 'Ipatinga',
    'Sete Lagoas', 'Divinópolis', 'Santa Luzia', 'Ibirité', 'Poços de Caldas',
    'Patos de Minas', 'Pouso Alegre', 'Teófilo Otoni', 'Barbacena', 'Sabará',
    'Varginha', 'Conselheiro Lafaiete', 'Vespasiano', 'Itabira', 'Araguari',
    'Passos', 'Ubá', 'Coronel Fabriciano', 'Muriaé', 'Nova Serrana',
  ],
  PA: [
    'Belém', 'Ananindeua', 'Santarém', 'Parauapebas', 'Marabá',
    'Castanhal', 'Abaetetuba', 'Cametá', 'Marituba', 'Bragança',
    'Barcarena', 'Altamira', 'Tucuruí', 'Paragominas', 'Tailândia',
    'Breves', 'Itaituba', 'Redenção', 'Moju', 'Novo Repartimento',
    'Oriximiná', 'Capanema', 'Benevides', 'Santa Izabel do Pará', 'Tomé-Açu',
    'Viseu', 'Igarapé-Miri', 'Monte Alegre', 'São Félix do Xingu', 'Canaã dos Carajás',
  ],
  PB: [
    'João Pessoa', 'Campina Grande', 'Santa Rita', 'Patos', 'Bayeux',
    'Sousa', 'Cabedelo', 'Cajazeiras', 'Guarabira', 'Sapé',
    'Mamanguape', 'Queimadas', 'São Bento', 'Monteiro', 'Esperança',
    'Pombal', 'Catolé do Rocha', 'Alagoa Grande', 'Pedras de Fogo', 'Lagoa Seca',
    'Conde', 'Solânea', 'Itabaiana', 'Rio Tinto', 'Princesa Isabel',
    'Areia', 'Bananeiras', 'Mari', 'Cuité', 'Alhandra',
  ],
  PR: [
    'Curitiba', 'Londrina', 'Maringá', 'Ponta Grossa', 'Cascavel',
    'São José dos Pinhais', 'Foz do Iguaçu', 'Colombo', 'Guarapuava', 'Paranaguá',
    'Araucária', 'Toledo', 'Apucarana', 'Campo Largo', 'Pinhais',
    'Arapongas', 'Almirante Tamandaré', 'Piraquara', 'Umuarama', 'Cambé',
    'Fazenda Rio Grande', 'Sarandi', 'Campo Mourão', 'Paranavaí', 'Francisco Beltrão',
    'Pato Branco', 'Cianorte', 'Telêmaco Borba', 'Castro', 'Rolândia',
  ],
  PE: [
    'Recife', 'Jaboatão dos Guararapes', 'Petrolina', 'Caruaru', 'Olinda',
    'Paulista', 'Cabo de Santo Agostinho', 'Camaragibe', 'Garanhuns', 'Vitória de Santo Antão',
    'Igarassu', 'São Lourenço da Mata', 'Santa Cruz do Capibaribe', 'Abreu e Lima', 'Ipojuca',
    'Serra Talhada', 'Gravatá', 'Araripina', 'Carpina', 'Goiana',
    'Belo Jardim', 'Arcoverde', 'Ouricuri', 'Escada', 'Pesqueira',
    'Surubim', 'Moreno', 'Palmares', 'Salgueiro', 'Bezerros',
  ],
  PI: [
    'Teresina', 'Parnaíba', 'Picos', 'Piripiri', 'Floriano',
    'Barras', 'Campo Maior', 'União', 'Altos', 'Esperantina',
    'José de Freitas', 'Pedro II', 'Oeiras', 'São Raimundo Nonato', 'Miguel Alves',
    'Luís Correia', 'Piracuruca', 'Cocal', 'Batalha', 'Corrente',
    'Bom Jesus', 'Luzilândia', 'Uruçuí', 'Valença do Piauí', 'Paulistana',
    'Jaicós', 'Buriti dos Lopes', 'Amarante', 'Água Branca', 'Inhuma',
  ],
  RJ: [
    'Rio de Janeiro', 'São Gonçalo', 'Duque de Caxias', 'Nova Iguaçu', 'Campos dos Goytacazes',
    'Belford Roxo', 'Niterói', 'São João de Meriti', 'Petrópolis', 'Volta Redonda',
    'Macaé', 'Magé', 'Itaboraí', 'Cabo Frio', 'Maricá',
    'Nova Friburgo', 'Barra Mansa', 'Angra dos Reis', 'Mesquita', 'Teresópolis',
    'Rio das Ostras', 'Nilópolis', 'Queimados', 'Araruama', 'Resende',
    'Itaguaí', 'São Pedro da Aldeia', 'Japeri', 'Barra do Piraí', 'Saquarema',
  ],
  RN: [
    'Natal', 'Mossoró', 'Parnamirim', 'São Gonçalo do Amarante', 'Macaíba',
    'Ceará-Mirim', 'Caicó', 'Assu', 'Currais Novos', 'São José de Mipibu',
    'Santa Cruz', 'Nova Cruz', 'Apodi', 'João Câmara', 'Canguaretama',
    'Touros', 'Macau', 'Pau dos Ferros', 'Extremoz', 'Areia Branca',
    'Nísia Floresta', 'Goianinha', 'Santo Antônio', 'Monte Alegre', 'São Paulo do Potengi',
    'Baraúna', 'Tangará', 'Caraúbas', 'Parelhas', 'Jucurutu',
  ],
  RS: [
    'Porto Alegre', 'Caxias do Sul', 'Canoas', 'Pelotas', 'Santa Maria',
    'Gravataí', 'Viamão', 'Novo Hamburgo', 'São Leopoldo', 'Rio Grande',
    'Alvorada', 'Passo Fundo', 'Sapucaia do Sul', 'Cachoeirinha', 'Santa Cruz do Sul',
    'Uruguaiana', 'Bento Gonçalves', 'Bagé', 'Erechim', 'Guaíba',
    'Lajeado', 'Ijuí', 'Cachoeira do Sul', 'Sapiranga', 'Santo Ângelo',
    'Santana do Livramento', 'Alegrete', 'Esteio', 'Farroupilha', 'Venâncio Aires',
  ],
  RO: [
    'Porto Velho', 'Ji-Paraná', 'Ariquemes', 'Vilhena', 'Cacoal',
    'Rolim de Moura', 'Jaru', 'Guajará-Mirim', 'Machadinho d\'Oeste', 'Buritis',
    'Pimenta Bueno', 'Ouro Preto do Oeste', 'Espigão d\'Oeste', 'Nova Mamoré', 'Candeias do Jamari',
    'Alta Floresta d\'Oeste', 'São Miguel do Guaporé', 'Presidente Médici', 'Nova Brasilândia d\'Oeste', 'Cerejeiras',
    'Colorado do Oeste', 'Alvorada d\'Oeste', 'São Francisco do Guaporé', 'Costa Marques', 'Monte Negro',
    'Itapuã do Oeste', 'Chupinguaia', 'Seringueiras', 'Urupá', 'Mirante da Serra',
  ],
  RR: [
    'Boa Vista', 'Rorainópolis', 'Caracaraí', 'Pacaraima', 'Cantá',
    'Mucajaí', 'Alto Alegre', 'Amajari', 'Bonfim', 'Normandia',
    'Iracema', 'Uiramutã', 'São João da Baliza', 'São Luiz', 'Caroebe',
  ],
  SC: [
    'Joinville', 'Florianópolis', 'Blumenau', 'São José', 'Itajaí',
    'Chapecó', 'Palhoça', 'Criciúma', 'Jaraguá do Sul', 'Lages',
    'Balneário Camboriú', 'Brusque', 'Tubarão', 'Camboriú', 'Navegantes',
    'São Bento do Sul', 'Concórdia', 'Caçador', 'Biguaçu', 'Rio do Sul',
    'Indaial', 'Araranguá', 'Itapema', 'Mafra', 'Içara',
    'Gaspar', 'Canoinhas', 'Videira', 'Tijucas', 'Imbituba',
  ],
  SP: [
    'São Paulo', 'Guarulhos', 'Campinas', 'São Bernardo do Campo', 'Santo André',
    'Osasco', 'Sorocaba', 'Ribeirão Preto', 'São José dos Campos', 'São José do Rio Preto',
    'Mogi das Cruzes', 'Jundiaí', 'Piracicaba', 'Santos', 'Mauá',
    'Diadema', 'Carapicuíba', 'Bauru', 'Itaquaquecetuba', 'Praia Grande',
    'Franca', 'São Vicente', 'Barueri', 'Taubaté', 'Suzano',
    'Limeira', 'Cotia', 'Taboão da Serra', 'Sumaré', 'Indaiatuba',
  ],
  SE: [
    'Aracaju', 'Nossa Senhora do Socorro', 'Lagarto', 'Itabaiana', 'São Cristóvão',
    'Estância', 'Tobias Barreto', 'Itabaianinha', 'Simão Dias', 'Nossa Senhora da Glória',
    'Poço Redondo', 'Itaporanga d\'Ajuda', 'Capela', 'Barra dos Coqueiros', 'Propriá',
    'Porto da Folha', 'Laranjeiras', 'Boquim', 'Umbaúba', 'Nossa Senhora das Dores',
    'Poço Verde', 'Canindé de São Francisco', 'Carira', 'Riachão do Dantas', 'Aquidabã',
    'Neópolis', 'Salgado', 'Cristinápolis', 'Ribeirópolis', 'Japaratuba',
  ],
  TO: [
    'Palmas', 'Araguaína', 'Gurupi', 'Porto Nacional', 'Paraíso do Tocantins',
    'Araguatins', 'Colinas do Tocantins', 'Guaraí', 'Tocantinópolis', 'Dianópolis',
    'Miracema do Tocantins', 'Formoso do Araguaia', 'Augustinópolis', 'Taguatinga', 'Miranorte',
    'Xambioá', 'Pedro Afonso', 'São Miguel do Tocantins', 'Goiatins', 'Lagoa da Confusão',
    'Nova Olinda', 'Wanderlândia', 'Ananás', 'Peixe', 'Buriti do Tocantins',
    'Alvorada', 'Natividade', 'Arraias', 'Sítio Novo do Tocantins', 'Babaçulândia',
  ],
}

export const CAMPO_GRANDE_MS_BAIRROS: string[] = [
  'Aero Rancho',
  'Alves Pereira',
  'Amambaí',
  'América',
  'Autonomista',
  'Bandeirantes',
  'Batistão',
  'Bela Vista',
  'Bosque da Saúde',
  'Cabreúva',
  'Caiçara',
  'Caiobá',
  'Carandá Bosque',
  'Carlota',
  'Centenário',
  'Centro',
  'Centro Oeste',
  'Chácara Cachoeira',
  'Chácara das Mansões',
  'Chácara dos Poderes',
  'Coophasul',
  'Coophatrabalho',
  'Coronel Antonino',
  'Cruzeiro',
  'Danúbio Azul',
  'Estrela Dalva',
  'Guanandi',
  'Itanhangá Park',
  'Jacy',
  'Jardim dos Estados',
  'Jardim Paulista',
  'Jardim São Bento',
  'Jockey Club',
  'José Abrão',
  'Lageado',
  'Leblon',
  'Los Angeles',
  'Margarida',
  'Maria Aparecida Pedrossian',
  'Mata do Jacinto',
  'Mata do Segredo',
  'Monte Castelo',
  'Monte Líbano',
  'Moreninha',
  'Nasser',
  'Nhanhá',
  'Noroeste',
  'Nova Campo Grande',
  'Nova Lima',
  'Novos Estados',
  'Núcleo Industrial',
  'Oliveira',
  'Panamá',
  'Parati',
  'Parque do Sol',
  'Parque dos Novos Estados',
  'Parque dos Poderes',
  'Pioneiros',
  'Piratininga',
  'Planalto',
  'Popular',
  'Rita Vieira',
  'Rouxinóis',
  'Santa Emília',
  'Santa Fé',
  'Santo Amaro',
  'Santo Antônio',
  'São Conrado',
  'São Francisco',
  'São Lourenço',
  'Seminário',
  'Sobrinho',
  'Taquarussu',
  'Tarumã',
  'Taveirópolis',
  'Tijuca',
  'Tiradentes',
  'TV Morena',
  'União',
  'Universitário',
  'Veraneio',
  'Vila Alba',
  'Vila Bordon',
  'Vila Carvalho',
  'Vila Glória',
  'Vila Margarida',
  'Vila Nossa Senhora das Graças',
  'Vila Piratininga',
  'Vila Progresso',
  'Vila Sobrinho',
  'Vilas Boas',
]

export function getCitiesForUf(uf: string): string[] {
  return TOP_CITIES_BY_UF[(uf || '').toUpperCase()] || []
}

export function getStoredLocation(): KittandaLocation {
  if (typeof window === 'undefined') return DEFAULT_KITTANDA_LOCATION
  try {
    const raw = localStorage.getItem(KITTANDA_LOCATION_STORAGE_KEY)
    if (!raw) return DEFAULT_KITTANDA_LOCATION
    const parsed = JSON.parse(raw)
    return {
      state: typeof parsed?.state === 'string' && parsed.state.trim() ? parsed.state.trim().toUpperCase() : 'MS',
      city: typeof parsed?.city === 'string' && parsed.city.trim() ? parsed.city.trim() : 'Campo Grande',
      neighborhood: typeof parsed?.neighborhood === 'string' ? parsed.neighborhood.trim() : '',
    }
  } catch {
    return DEFAULT_KITTANDA_LOCATION
  }
}

export function saveStoredLocation(loc: KittandaLocation) {
  if (typeof window === 'undefined') return
  const normalized: KittandaLocation = {
    state: (loc.state || 'MS').trim().toUpperCase(),
    city: (loc.city || 'Campo Grande').trim(),
    neighborhood: (loc.neighborhood || '').trim(),
  }
  try {
    localStorage.setItem(KITTANDA_LOCATION_STORAGE_KEY, JSON.stringify(normalized))
    window.dispatchEvent(new CustomEvent(KITTANDA_LOCATION_EVENT, { detail: normalized }))
  } catch {
    // ignore
  }
}
