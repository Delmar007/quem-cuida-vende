import Link from "next/link";
import HomeBanner from "@/components/HomeBanner";
import ProductCardImageCarousel from "@/components/ProductCardImageCarousel";
import PromoThermometerBar from "@/components/PromoThermometerBar";
import { createClient } from "@/lib/supabase/server";
import { getLocalStores } from "@/lib/stores-storage";
import { getLocalProducts } from "@/lib/products-storage";
import { getFollowedStoreIdsFromServer } from "@/app/actions/user-office";
import { getAllPromoTimersServer } from "@/lib/promo-timer-storage";
import { streetsMatch } from "@/lib/streets";
import { connection } from "next/server";

function formatCurrencyBRL(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "0,00";
  const num = typeof value === "string" ? parseFloat(value.replace(/\./g, "").replace(",", ".")) : value;
  if (isNaN(num)) return "0,00";
  return num.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export const instant = false;

interface HomeProps {
  searchParams: Promise<{ tipo?: string; cat?: string; subcat?: string; filtro?: string; q?: string; rua?: string }>;
}

export interface StoreItem {
  id: string;
  name: string;
  slug: string;
  category: string;
  subcategories: string[];
  large_banner_url?: string | null;
  small_banner_url?: string | null;
  logo_url?: string | null;
  street?: string | null;
  description?: string | null;
  plan?: string;
  is_active: boolean;
}

export interface ProductItem {
  id: string;
  store_id: string;
  store_name: string;
  store_logo_url?: string | null;
  name: string;
  description?: string | null;
  price: string;
  regular_price?: number | null;
  promotional_price?: number | null;
  image_url: string;
  images?: string[];
  photo_orientation?: "vertical" | "horizontal";
  category: string;
  subcategory: string;
  promo_type?: string;
  is_vehicle?: boolean;
  vehicle_category?: string | null;
  vehicle_brand?: string | null;
  vehicle_model?: string | null;
  vehicle_version?: string | null;
  vehicle_year_fab?: string | null;
  vehicle_year_model?: string | null;
  vehicle_km?: string | null;
  vehicle_transmission?: string | null;
  vehicle_traction?: string | null;
  is_outlet: boolean;
  is_novidade: boolean;
  is_active: boolean;
  published_at: string;
}

// Catálogo base de demonstração e fallback para todas as categorias e subcategorias
const SEED_STORES: StoreItem[] = [
  {
    id: "st-1",
    name: "Águia Fashion",
    slug: "aguia-fashion",
    category: "moda",
    subcategories: ["Feminina", "Festa", "Streetwear"],
    large_banner_url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=940&q=80",
    small_banner_url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=400&q=80",
    logo_url: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=120&q=80",
    street: "Av. Afonso Pena",
    description: "Moda feminina contemporânea e looks exclusivos para festas e eventos.",
    plan: "ouro",
    is_active: true,
  },
  {
    id: "st-2",
    name: "Bella Moda & Estilo",
    slug: "bella-moda",
    category: "moda",
    subcategories: ["Feminina", "Fitness", "Praia"],
    large_banner_url: "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=940&q=80",
    small_banner_url: "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=400&q=80",
    logo_url: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=120&q=80",
    street: "Rua Barão do Rio Branco",
    description: "Coleções de moda feminina, linha fitness para treino e moda praia para o verão.",
    plan: "prata",
    is_active: true,
  },
  {
    id: "st-3",
    name: "Casa & Conforto Design",
    slug: "casa-conforto",
    category: "casa",
    subcategories: ["Móveis", "Decoração", "Cama, Mesa e Banho"],
    large_banner_url: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=940&q=80",
    small_banner_url: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=400&q=80",
    logo_url: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=120&q=80",
    street: "Av. Mato Grosso",
    description: "Móveis e artigos finos de decoração e utilidades domésticas.",
    plan: "bronze_plus",
    is_active: true,
  },
  {
    id: "st-4",
    name: "Estilo Masculino VIP",
    slug: "estilo-masculino-vip",
    category: "moda",
    subcategories: ["Masculina", "Streetwear", "Country"],
    large_banner_url: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=940&q=80",
    small_banner_url: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=400&q=80",
    logo_url: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=120&q=80",
    street: "Rua Quatorze de Julho",
    description: "Roupas masculinas de alfaiataria, jeanswear e peças para o dia a dia.",
    plan: "bronze",
    is_active: true,
  },
  {
    id: "st-5",
    name: "Glamour Cosméticos & Salão",
    slug: "glamour-cosmeticos",
    category: "beleza",
    subcategories: ["Cosméticos", "Maquiagem", "Perfumes", "Skincare", "Salão"],
    large_banner_url: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=940&q=80",
    small_banner_url: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=400&q=80",
    logo_url: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=120&q=80",
    street: "Av. Afonso Pena",
    description: "Produtos de maquiagem importada, fragrâncias e tratamento facial.",
    plan: "ouro",
    is_active: true,
  },
  {
    id: "st-6",
    name: "Pet Amigo Care",
    slug: "pet-amigo-care",
    category: "pet",
    subcategories: ["Shop", "Banho", "Clínica", "Farmácia"],
    large_banner_url: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=940&q=80",
    small_banner_url: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=400&q=80",
    logo_url: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=120&q=80",
    street: "Rua Ceará",
    description: "Acessórios, rações nobres e cuidados completos para cães e gatos.",
    plan: "prata",
    is_active: true,
  },
  {
    id: "st-7",
    name: "TechEletro Store",
    slug: "techeletro-store",
    category: "eletro",
    subcategories: ["Celulares", "Informática", "Games"],
    large_banner_url: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=940&q=80",
    small_banner_url: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=400&q=80",
    logo_url: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=120&q=80",
    street: "Av. Afonso Pena",
    description: "Smartphones, periféricos gamers e tecnologia de ponta.",
    plan: "ouro",
    is_active: true,
  },
  {
    id: "st-8",
    name: "Zeta Outlet Automotivo",
    slug: "zeta-outlet-automotivo",
    category: "carro",
    subcategories: ["Peças", "Pneus", "Acessórios", "Som Automotivo"],
    large_banner_url: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=940&q=80",
    small_banner_url: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=400&q=80",
    street: "Av. Coronel Antonino",
    description: "Peças originais, rodas esportivas e som para veículos leves e pesados.",
    plan: "bronze",
    is_active: true,
  },
  {
    id: "st-9",
    name: "Auto Prime Multimarcas & Usados",
    slug: "auto-prime-multimarcas",
    category: "carro",
    subcategories: ["Usados", "Concessionária", "Picapes"],
    large_banner_url: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=940&q=80",
    small_banner_url: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=400&q=80",
    street: "Av. Eduardo Elias Zahran",
    description: "Seminovos e usados revisados com garantia de procedência e financiamento.",
    plan: "bronze",
    is_active: true,
  },
  {
    id: "st-10",
    name: "AgroCampo Sementes & Rações",
    slug: "agrocampo-sementes",
    category: "agro",
    subcategories: ["Agropecuária", "Sementes", "Rações"],
    large_banner_url: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=940&q=80",
    small_banner_url: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=400&q=80",
    street: "Av. Guaicurus",
    description: "Insumos agrícolas, sementes selecionadas e nutrição animal para o campo.",
    plan: "bronze",
    is_active: true,
  },
  {
    id: "st-11",
    name: "Bela Vista Papelaria & Escritório",
    slug: "bela-vista-papelaria",
    category: "escritorio",
    subcategories: ["Papelaria", "Escolar", "Móveis"],
    large_banner_url: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=940&q=80",
    small_banner_url: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=400&q=80",
    street: "Rua Joaquim Murtinho",
    description: "Materiais escolares, cadeiras ergonômicas e suprimentos corporativos.",
    plan: "bronze",
    is_active: true,
  },
  {
    id: "st-12",
    name: "Cantinho Baby & Kids",
    slug: "cantinho-baby-kids",
    category: "moda",
    subcategories: ["Infantil", "Festa"],
    large_banner_url: "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?auto=format&fit=crop&w=940&q=80",
    small_banner_url: "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?auto=format&fit=crop&w=400&q=80",
    street: "Rua Antônio Maria Coelho",
    description: "Enxoval completo e moda infantil confortável para todas as idades.",
    plan: "bronze",
    is_active: true,
  },
  {
    id: "st-13",
    name: "Dona Flor Decorações",
    slug: "dona-flor-decoracoes",
    category: "casa",
    subcategories: ["Decoração", "Iluminação", "Jardim e Piscina"],
    large_banner_url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=940&q=80",
    small_banner_url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=400&q=80",
    street: "Rua Euclides da Cunha",
    description: "Luminárias, quadros, vasos artesanais e peças de design para sua casa.",
    plan: "bronze",
    is_active: true,
  },
  {
    id: "st-14",
    name: "Espaço Barbearia & Estética",
    slug: "espaco-barbearia-estetica",
    category: "beleza",
    subcategories: ["Barbearia", "Cosméticos", "Perfumes"],
    large_banner_url: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=940&q=80",
    small_banner_url: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=400&q=80",
    street: "Rua Rui Barbosa",
    description: "Linha profissional para barba, cabelo e cuidados masculinos.",
    plan: "bronze",
    is_active: true,
  },
];

const SEED_PRODUCTS: ProductItem[] = [
  // MODA FEMININA - OUTLET
  {
    id: "prod-101",
    store_id: "st-1",
    store_name: "Águia Fashion",
    name: "Vestido Midi Plissado Outlet",
    description: "Vestido midi floral com tecido fluido e acabamento delicado em saldão.",
    price: "R$ 89,90",
    regular_price: 99.9,
    promotional_price: 89.9,
    image_url: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=400&q=80",
    category: "moda",
    subcategory: "feminina",
    promo_type: "outlet",
    is_outlet: true,
    is_novidade: false,
    is_active: true,
    published_at: "2026-10-14T15:30:00Z", // hoje às 15:30
  },
  {
    id: "prod-102",
    store_id: "st-2",
    store_name: "Bella Moda & Estilo",
    name: "Blusa Seda Pura Liquidação",
    description: "Blusa leve de toque acetinado para looks casuais e elegantes.",
    price: "R$ 59,90",
    regular_price: 74.9,
    promotional_price: 59.9,
    image_url: "https://images.unsplash.com/photo-1564257631407-4deb129f042b?auto=format&fit=crop&w=400&q=80",
    category: "moda",
    subcategory: "feminina",
    promo_type: "ultimas_unidades",
    is_outlet: true,
    is_novidade: false,
    is_active: true,
    published_at: "2026-10-14T11:00:00Z", // hoje às 11:00
  },
  {
    id: "prod-103",
    store_id: "st-1",
    store_name: "Águia Fashion",
    name: "Calça Jeans Flare Barra Desfiada Outlet",
    description: "Jeans premium com elastano e lavagem média em liquidação de estoque.",
    price: "R$ 99,90",
    regular_price: 129.9,
    promotional_price: 99.9,
    image_url: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=400&q=80",
    category: "moda",
    subcategory: "feminina",
    promo_type: "pequeno_defeito",
    is_outlet: true,
    is_novidade: false,
    is_active: true,
    published_at: "2026-10-13T18:00:00Z", // ontem
  },

  // MODA FEMININA - LANÇAMENTO / EXCLUSIVIDADE
  {
    id: "prod-104",
    store_id: "st-2",
    store_name: "Bella Moda & Estilo",
    name: "Blazer Alfaiataria Primavera Lançamento",
    description: "Blazer estruturado recém-chegado com forro acetinado e botões dourados.",
    price: "R$ 189,90",
    regular_price: 189.9,
    promotional_price: null,
    image_url: "https://images.unsplash.com/photo-1584273143981-41c073dfe8f8?auto=format&fit=crop&w=400&q=80",
    category: "moda",
    subcategory: "feminina",
    promo_type: "lancamento",
    is_outlet: false,
    is_novidade: true,
    is_active: true,
    published_at: "2026-10-14T17:00:00Z", // hoje às 17:00 (mais recente)
  },
  {
    id: "prod-105",
    store_id: "st-1",
    store_name: "Águia Fashion",
    name: "Conjunto Cropped e Saia Evasê Exclusividade",
    description: "Lançamento da estação com estampa geométrica exclusiva.",
    price: "R$ 149,90",
    regular_price: 149.9,
    promotional_price: null,
    image_url: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=400&q=80",
    category: "moda",
    subcategory: "feminina",
    promo_type: "exclusividade",
    is_outlet: false,
    is_novidade: true,
    is_active: true,
    published_at: "2026-10-14T14:15:00Z", // hoje às 14:15
  },

  // MODA FEMININA - PEÇA ÚNICA
  {
    id: "prod-106",
    store_id: "st-2",
    store_name: "Bella Moda & Estilo",
    name: "Tênis Casual Feminino Couro Soft",
    description: "Modelo especial peça única com preço promocional de vitrine.",
    price: "R$ 119,90",
    regular_price: 149.9,
    promotional_price: 119.9,
    image_url: "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=400&q=80",
    category: "moda",
    subcategory: "feminina",
    promo_type: "peca_unica",
    is_outlet: true,
    is_novidade: true,
    is_active: true,
    published_at: "2026-10-14T16:45:00Z", // hoje às 16:45
  },

  // MODA MASCULINA
  {
    id: "prod-107",
    store_id: "st-4",
    store_name: "Estilo Masculino VIP",
    name: "Camisa Social Slim Fit Algodão Egípcio",
    description: "Camisa impecável para ambientes corporativos e eventos.",
    price: "R$ 129,90",
    regular_price: 149.9,
    promotional_price: 129.9,
    image_url: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=400&q=80",
    category: "moda",
    subcategory: "masculina",
    promo_type: "vitrine",
    is_outlet: true,
    is_novidade: false,
    is_active: true,
    published_at: "2026-10-12T10:00:00Z",
  },
  {
    id: "prod-108",
    store_id: "st-4",
    store_name: "Estilo Masculino VIP",
    name: "Jaqueta Bomber Urbana Sob Encomenda",
    description: "Jaqueta forrada corta-vento sob medida outono/inverno.",
    price: "R$ 219,90",
    regular_price: 219.9,
    promotional_price: null,
    image_url: "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=400&q=80",
    category: "moda",
    subcategory: "masculina",
    promo_type: "sob_encomenda",
    is_outlet: false,
    is_novidade: true,
    is_active: true,
    published_at: "2026-10-14T16:00:00Z",
  },

  // BELEZA - COSMÉTICOS & MAQUIAGEM
  {
    id: "prod-109",
    store_id: "st-5",
    store_name: "Glamour Cosméticos & Salão",
    name: "Paleta de Sombras Pigmentadas Glow Importada",
    description: "18 cores vibrantes e cintilantes importadas com fixação de até 12 horas.",
    price: "R$ 49,90",
    regular_price: 69.9,
    promotional_price: 49.9,
    image_url: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=400&q=80",
    category: "beleza",
    subcategory: "maquiagem",
    promo_type: "importado",
    is_outlet: true,
    is_novidade: false,
    is_active: true,
    published_at: "2026-10-11T09:00:00Z",
  },
  {
    id: "prod-110",
    store_id: "st-5",
    store_name: "Glamour Cosméticos & Salão",
    name: "Sérum Anti-idade Ácido Hialurônico Lançamento",
    description: "Fórmula de alta absorção desenvolvida por dermatologistas.",
    price: "R$ 79,90",
    regular_price: 79.9,
    promotional_price: null,
    image_url: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=400&q=80",
    category: "beleza",
    subcategory: "skincare",
    promo_type: "lancamento",
    is_outlet: false,
    is_novidade: true,
    is_active: true,
    published_at: "2026-10-14T13:00:00Z",
  },

  // CASA - MÓVEIS & DECORAÇÃO
  {
    id: "prod-111",
    store_id: "st-3",
    store_name: "Casa & Conforto Design",
    name: "Poltrona Decorativa Pés Palito Artezanal",
    description: "Estofado feito à mão em veludo macio ideal para sala de estar ou leitura.",
    price: "R$ 349,90",
    regular_price: 399.9,
    promotional_price: 349.9,
    image_url: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=400&q=80",
    category: "casa",
    subcategory: "móveis",
    promo_type: "artezanal",
    is_outlet: true,
    is_novidade: false,
    is_active: true,
    published_at: "2026-10-10T14:00:00Z",
  },
  {
    id: "prod-112",
    store_id: "st-3",
    store_name: "Casa & Conforto Design",
    name: "Luminária de Chão Nórdica Vitrine",
    description: "Design moderno minimalista em metal preto fosco e madeira natural.",
    price: "R$ 169,90",
    regular_price: 189.9,
    promotional_price: 169.9,
    image_url: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=400&q=80",
    category: "casa",
    subcategory: "iluminação",
    promo_type: "vitrine",
    is_outlet: false,
    is_novidade: true,
    is_active: true,
    published_at: "2026-10-14T12:00:00Z",
  },

  // PET - SHOP & ACESSÓRIOS
  {
    id: "prod-113",
    store_id: "st-6",
    store_name: "Pet Amigo Care",
    name: "Cama Pet Nuvem Ortopédica Outlet",
    description: "Conforto máximo para cães e gatos, lavável e ultra macia.",
    price: "R$ 69,90",
    regular_price: 89.9,
    promotional_price: 69.9,
    image_url: "https://images.unsplash.com/photo-1541599540903-216a46ca1dc0?auto=format&fit=crop&w=400&q=80",
    category: "pet",
    subcategory: "shop",
    promo_type: "outlet",
    is_outlet: true,
    is_novidade: false,
    is_active: true,
    published_at: "2026-10-13T08:00:00Z",
  },
  {
    id: "prod-114",
    store_id: "st-6",
    store_name: "Pet Amigo Care",
    name: "Comedouro Automático Inteligente Wi-Fi Importado",
    description: "Controle as refeições do seu pet via smartphone com câmera HD.",
    price: "R$ 299,90",
    regular_price: 299.9,
    promotional_price: null,
    image_url: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=400&q=80",
    category: "pet",
    subcategory: "shop",
    promo_type: "importado",
    is_outlet: false,
    is_novidade: true,
    is_active: true,
    published_at: "2026-10-14T10:00:00Z",
  },

  // ELETRO - CELULARES & GAMES
  {
    id: "prod-115",
    store_id: "st-7",
    store_name: "TechEletro Store",
    name: "Fone Bluetooth Cancelamento de Ruído Recondicionado",
    description: "Bateria de 40 horas e áudio Hi-Res revisado com garantia.",
    price: "R$ 159,90",
    regular_price: 199.9,
    promotional_price: 159.9,
    image_url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=80",
    category: "eletro",
    subcategory: "acessórios",
    promo_type: "recondicionado",
    is_outlet: true,
    is_novidade: false,
    is_active: true,
    published_at: "2026-10-09T17:00:00Z",
  },
  {
    id: "prod-116",
    store_id: "st-7",
    store_name: "TechEletro Store",
    name: "Smartphone Pro 256GB 5G Lançamento",
    description: "Câmera de 200MP e processador octa-core de última geração.",
    price: "R$ 2.499,00",
    regular_price: 2499.0,
    promotional_price: null,
    image_url: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=400&q=80",
    category: "eletro",
    subcategory: "celulares",
    promo_type: "lancamento",
    is_outlet: false,
    is_novidade: true,
    is_active: true,
    published_at: "2026-10-14T17:30:00Z",
  },

  // CARRO - PEÇAS & ACESSÓRIOS
  {
    id: "prod-117",
    store_id: "st-8",
    store_name: "Zeta Outlet Automotivo",
    name: "Jogo de Tapetes Borracha Reforçada Novo",
    description: "Universal e impermeável, com presilhas de segurança.",
    price: "R$ 79,90",
    regular_price: 99.9,
    promotional_price: 79.9,
    image_url: "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=400&q=80",
    category: "carro",
    subcategory: "acessórios",
    promo_type: "novo",
    is_outlet: true,
    is_novidade: false,
    is_active: true,
    published_at: "2026-10-08T11:00:00Z",
  },
  {
    id: "prod-118",
    store_id: "st-8",
    store_name: "Zeta Outlet Automotivo",
    name: "Kit Multimídia Android Auto 10 Pol Usado",
    description: "Tela IPS capacitiva, GPS integrado e câmera de ré inclusa.",
    price: "R$ 589,00",
    regular_price: 699.0,
    promotional_price: 589.0,
    image_url: "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=400&q=80",
    category: "carro",
    subcategory: "som automotivo",
    promo_type: "usado",
    is_outlet: false,
    is_novidade: true,
    is_active: true,
    published_at: "2026-10-14T09:30:00Z",
  },
  {
    id: "prod-119",
    store_id: "st-9",
    store_name: "Auto Prime Multimarcas & Usados",
    name: "Toyota Corolla 2.0 XEi 16V Flex Aut. 2023/2024",
    description: "Único dono, revisado na concessionária e garantia de fábrica.",
    price: "R$ 118.900,00",
    regular_price: 124900.0,
    promotional_price: 118900.0,
    image_url: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=600&q=80",
    images: [
      "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=600&q=80",
    ],
    photo_orientation: "horizontal",
    category: "carro",
    subcategory: "usados",
    promo_type: "semi_novo",
    is_vehicle: true,
    vehicle_category: "Carro",
    vehicle_brand: "Toyota",
    vehicle_model: "Corolla",
    vehicle_version: "2.0 XEi 16V Flex Aut.",
    vehicle_year_fab: "2023",
    vehicle_year_model: "2023/2024",
    vehicle_km: "42.000 km",
    vehicle_transmission: "Automático",
    vehicle_traction: "Dianteira 4x2",
    is_outlet: false,
    is_novidade: true,
    is_active: true,
    published_at: "2026-10-14T16:10:00Z",
  },
  {
    id: "prod-120",
    store_id: "st-10",
    store_name: "AgroCampo Sementes & Rações",
    name: "Semente de Pastagem Brachiaria Brizantha 20kg",
    description: "Alta pureza e germinação garantida para formação de pasto.",
    price: "R$ 289,00",
    regular_price: 320.0,
    promotional_price: 289.0,
    image_url: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=400&q=80",
    category: "agro",
    subcategory: "sementes",
    promo_type: "outlet",
    is_outlet: true,
    is_novidade: false,
    is_active: true,
    published_at: "2026-10-14T08:00:00Z",
  },
  {
    id: "prod-121",
    store_id: "st-11",
    store_name: "Bela Vista Papelaria & Escritório",
    name: "Cadeira Ergonômica Presidente Tela Mesh",
    description: "Apoio lombar ajustável e braços 3D para home office.",
    price: "R$ 649,00",
    regular_price: 799.0,
    promotional_price: 649.0,
    image_url: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=400&q=80",
    category: "escritorio",
    subcategory: "móveis",
    promo_type: "lancamento",
    is_outlet: false,
    is_novidade: true,
    is_active: true,
    published_at: "2026-10-13T15:00:00Z",
  },
  {
    id: "prod-122",
    store_id: "st-12",
    store_name: "Cantinho Baby & Kids",
    name: "Conjunto Infantil Algodão Orgânico 3 Peças",
    description: "Toque super macio e hipoalergênico para bebês e crianças.",
    price: "R$ 79,90",
    regular_price: 99.9,
    promotional_price: 79.9,
    image_url: "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?auto=format&fit=crop&w=400&q=80",
    category: "moda",
    subcategory: "infantil",
    promo_type: "novo",
    is_outlet: true,
    is_novidade: true,
    is_active: true,
    published_at: "2026-10-13T14:00:00Z",
  },
  {
    id: "prod-123",
    store_id: "st-13",
    store_name: "Dona Flor Decorações",
    name: "Luminária Pendente Industrial Dourado Fosco",
    description: "Design escandinavo ideal para sala de jantar e bancadas.",
    price: "R$ 199,90",
    regular_price: 249.9,
    promotional_price: 199.9,
    image_url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=400&q=80",
    category: "casa",
    subcategory: "iluminação",
    promo_type: "vitrine",
    is_outlet: true,
    is_novidade: false,
    is_active: true,
    published_at: "2026-10-12T16:00:00Z",
  },
  {
    id: "prod-124",
    store_id: "st-14",
    store_name: "Espaço Barbearia & Estética",
    name: "Kit Pomada Modeladora Matte + Óleo para Barba",
    description: "Fixação forte sem brilho e hidratação profunda com aroma amadeirado.",
    price: "R$ 69,90",
    regular_price: 89.9,
    promotional_price: 69.9,
    image_url: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=400&q=80",
    category: "beleza",
    subcategory: "barbearia",
    promo_type: "exclusividade",
    is_outlet: false,
    is_novidade: true,
    is_active: true,
    published_at: "2026-10-12T12:00:00Z",
  },
];

export default async function Home({ searchParams }: HomeProps) {
  await connection();
  const resolvedParams = await searchParams;
  const isHomePage = !resolvedParams.cat && !resolvedParams.tipo && !resolvedParams.q && !resolvedParams.filtro && !resolvedParams.rua;
  const tipo = resolvedParams.tipo || (isHomePage ? "produtos" : "lojas");
  const cat = (resolvedParams.cat || "").toLowerCase().trim();
  const subcat = (resolvedParams.subcat || "").toLowerCase().trim();
  const rawFiltro = (resolvedParams.filtro || "").toLowerCase().trim();
  const query = (resolvedParams.q || "").toLowerCase().trim();
  const rua = (resolvedParams.rua || "").trim();

  // Dicionário amigável de nomes de categorias
  const nomesCategorias: Record<string, string> = {
    moda: "Moda",
    pet: "Pet",
    agro: "Agro",
    carro: "Carro",
    escritorio: "Escritório",
    eletro: "Eletro",
    casa: "Casa",
    beleza: "Beleza",
    por_rua: "Por Rua",
  };

  // Dicionário amigável de Tipos de Promoção
  const nomesPromocoes: Record<string, string> = {
    outlet: "Outlet",
    lancamento: "Lançamento",
    novidades: "Lançamento",
    vitrine: "Vitrine",
    recondicionado: "Recondicionado",
    ultimas_unidades: "Últimas unidades",
    exclusividade: "Exclusividade",
    sob_encomenda: "Sob Encomenda",
    importado: "Importado",
    peca_unica: "Peça única",
    pequeno_defeito: "Pequeno Defeito",
    artezanal: "Artezanal",
    artesanal: "Artezanal",
    novo: "Novo",
    usado: "Usado",
    semi_novo: "Semi-novo",
    seminovo: "Semi-novo",
    "semi-novo": "Semi-novo",
    feed_que_sigo: "Feed que sigo",
    feed_seguindo: "Feed que sigo",
  };

  const categoriaAtual = cat ? (nomesCategorias[cat] || cat.toUpperCase()) : "Todas as Categorias";

  // Filtros de promoção selecionados
  const modalidadesSelecionadas = rawFiltro
    .split(",")
    .map((m) => m.trim().toLowerCase())
    .filter(Boolean);

  const isFeedQueSigoActive =
    modalidadesSelecionadas.includes("feed_que_sigo") ||
    modalidadesSelecionadas.includes("feed_seguindo");

  const [followedStoreIds, promoTimersList] = await Promise.all([
    getFollowedStoreIdsFromServer(),
    getAllPromoTimersServer(),
  ]);

  const promoTimers = Object.fromEntries(
    promoTimersList.map((t) => [t.storeId, t])
  );

  const matchesPromoType = (prod: ProductItem) => {
    if (modalidadesSelecionadas.length === 0) return true;
    const prodPromo = (prod.promo_type || "").toLowerCase();
    return modalidadesSelecionadas.some((f) => {
      if (f === "feed_que_sigo" || f === "feed_seguindo") {
        return followedStoreIds.some(
          (sid: string) =>
            sid === prod.store_id ||
            sid.toLowerCase() === prod.store_name.toLowerCase()
        );
      }
      if (prodPromo === f) return true;
      if (f === "artezanal" && prodPromo === "artesanal") return true;
      if (f === "outlet" && !prodPromo && prod.is_outlet) return true;
      if ((f === "lancamento" || f === "novidades") && !prodPromo && prod.is_novidade) return true;
      return false;
    });
  };

  // 1. CARREGAR DADOS DO SUPABASE (COM FALLBACK CONSISTENTE CASO BANCO ESTEJA VAZIO)
  let dbStores: StoreItem[] = [];
  let dbProducts: ProductItem[] = [];

  try {
    const supabase = await createClient();

    // Consulta de Lojas
    const { data: storesData } = await supabase
      .from("stores")
      .select("*")
      .eq("is_active", true);

    if (storesData && storesData.length > 0) {
      dbStores = storesData.map((s: any) => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        category: (s.category || "").toLowerCase(),
        subcategories: s.subcategories || [],
        large_banner_url: s.large_banner_url,
        small_banner_url: s.small_banner_url,
        logo_url: s.logo_url,
        street: s.street || null,
        description: s.description,
        plan: (s.effective_plan || s.plan || "bronze").toLowerCase(),
        is_active: Boolean(s.is_active),
      }));
    }

    // Consulta de Produtos
    const { data: productsData } = await supabase
      .from("products")
      .select("*, stores(name, logo_url)")
      .eq("is_active", true);

    if (productsData && productsData.length > 0) {
      dbProducts = productsData.map((p: any) => {
        const regPrice = typeof p.price === "number" ? p.price : null;
        const promoPrice = typeof p.promotional_price === "number" && regPrice && p.promotional_price < regPrice ? p.promotional_price : null;
        const displayPrice = promoPrice !== null ? promoPrice : regPrice;
        return {
          id: p.id,
          store_id: p.store_id,
          store_name: p.stores?.name || "Loja Parceira",
          store_logo_url: p.stores?.logo_url || null,
          name: p.name,
          description: p.description,
          price: typeof displayPrice === "number" ? `R$ ${formatCurrencyBRL(displayPrice)}` : String(p.price || "R$ 0,00"),
          regular_price: regPrice,
          promotional_price: promoPrice,
          image_url: p.image_url || "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=400&q=80",
          images: p.images && p.images.length > 0 ? p.images : p.image_url ? [p.image_url] : [],
          photo_orientation: p.photo_orientation || (p.is_vehicle ? "horizontal" : "vertical"),
          category: (p.category || "").toLowerCase(),
          subcategory: (p.subcategory || "").toLowerCase(),
          promo_type: p.promo_type || (p.is_novidade ? "lancamento" : "outlet"),
          is_vehicle: Boolean(p.is_vehicle),
          vehicle_category: p.vehicle_category || null,
          vehicle_brand: p.vehicle_brand || null,
          vehicle_model: p.vehicle_model || null,
          vehicle_version: p.vehicle_version || null,
          vehicle_year_fab: p.vehicle_year_fab || null,
          vehicle_year_model: p.vehicle_year_model || null,
          vehicle_km: p.vehicle_km || null,
          vehicle_transmission: p.vehicle_transmission || null,
          vehicle_traction: p.vehicle_traction || null,
          is_outlet: Boolean(p.is_outlet),
          is_novidade: Boolean(p.is_novidade),
          is_active: Boolean(p.is_active),
          published_at: p.published_at || p.created_at || new Date().toISOString(),
        };
      });
    }
  } catch (err) {
    // Falha silenciosa de conexão; utilizar fallback
  }

  // Carregar lojas locais gravadas
  const localStores: StoreItem[] = getLocalStores().map((s) => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
    category: (s.category || "").toLowerCase(),
    subcategories: s.subcategories || [],
    large_banner_url: s.large_banner_url,
    small_banner_url: s.small_banner_url,
    logo_url: s.logo_url,
    street: s.street || null,
    description: s.description,
    plan: (s.effective_plan || s.plan || "bronze").toLowerCase(),
    is_active: Boolean(s.is_active),
  }));

  const baseStores: StoreItem[] =
    dbStores.length >= 6
      ? dbStores
      : [
          ...dbStores,
          ...SEED_STORES.filter((seed) => !dbStores.some((db) => db.id === seed.id)),
        ];
  const combinedStores: StoreItem[] = [...baseStores];
  for (const ls of localStores) {
    if (!combinedStores.some((s) => s.id === ls.id)) {
      combinedStores.unshift(ls);
    }
  }

  const allStores: StoreItem[] = combinedStores;
  const localProdsMapped: ProductItem[] = getLocalProducts()
    .filter((lp) => lp.is_active !== false)
    .map((lp) => {
      const storeObj = allStores.find((s) => s.id === lp.store_id);
      const isStoreCarVehicle =
        storeObj?.category === "carro" &&
        (!storeObj.subcategories?.length ||
          storeObj.subcategories.some((sub) =>
            ["usados", "concessionária", "concessionaria"].includes(sub.toLowerCase().trim())
          ));
      const isVeh = Boolean(
        lp.is_vehicle ||
          isStoreCarVehicle ||
          lp.vehicle_version ||
          lp.vehicle_km ||
          lp.vehicle_traction ||
          lp.vehicle_year_fab ||
          lp.vehicle_year_model
      );
      const hasPromo = Boolean(lp.promotional_price && lp.promotional_price < lp.price);
      const effectivePrice = hasPromo ? lp.promotional_price! : lp.price;
      return {
        id: lp.id,
        store_id: lp.store_id,
        store_name: storeObj?.name || "Loja Parceira",
        store_logo_url: storeObj?.logo_url || null,
        name: lp.name,
        description: lp.description,
        price: `R$ ${formatCurrencyBRL(effectivePrice)}`,
        regular_price: lp.price,
        promotional_price: hasPromo ? lp.promotional_price : null,
        image_url: lp.image_url || (lp.images && lp.images[0]) || "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=400&q=80",
        images: lp.images && lp.images.length > 0 ? lp.images : lp.image_url ? [lp.image_url] : [],
        photo_orientation: lp.photo_orientation || (isVeh ? "horizontal" : "vertical"),
        category: (lp.category || storeObj?.category || "").toLowerCase(),
        subcategory: (lp.subcategory || "").toLowerCase(),
        promo_type: lp.promo_type || (lp.is_novidade ? "lancamento" : "outlet"),
        is_vehicle: isVeh,
        vehicle_category: lp.vehicle_category || null,
        vehicle_brand: lp.vehicle_brand || null,
        vehicle_model: lp.vehicle_model || null,
        vehicle_version: lp.vehicle_version || null,
        vehicle_year_fab: lp.vehicle_year_fab || null,
        vehicle_year_model: lp.vehicle_year_model || null,
        vehicle_km: lp.vehicle_km || null,
        vehicle_transmission: lp.vehicle_transmission || null,
        vehicle_traction: lp.vehicle_traction || null,
        is_outlet: Boolean(lp.is_outlet),
        is_novidade: Boolean(lp.is_novidade),
        is_active: Boolean(lp.is_active),
        published_at: lp.published_at || lp.created_at || new Date().toISOString(),
      };
    });

  const baseProducts: ProductItem[] =
    dbProducts.length >= 8
      ? dbProducts
      : [
          ...dbProducts,
          ...SEED_PRODUCTS.filter((seed) => !dbProducts.some((db) => db.id === seed.id)),
        ];
  const combinedProducts: ProductItem[] = [...baseProducts];
  for (const lpm of localProdsMapped) {
    if (!combinedProducts.some((p) => p.id === lpm.id)) {
      combinedProducts.unshift(lpm);
    }
  }
  const allProducts: ProductItem[] = combinedProducts;

  // =========================================================================
  // 2. FILTRAGEM COMBINADA DE PRODUTOS (POR INTERSEÇÃO)
  // =========================================================================
  const produtosFiltrados = allProducts.filter((prod) => {
    // A. Categoria principal (ignora quando está em modo "por_rua")
    if (cat && cat !== "por_rua" && prod.category !== cat) {
      return false;
    }

    // A2. Filtro Por Rua (verifica a rua da loja proprietária do produto)
    if (rua) {
      const storeObj = allStores.find(
        (s) => s.id === prod.store_id || s.name === prod.store_name
      );
      if (!streetsMatch(storeObj?.street, rua)) {
        return false;
      }
    }

    // B. Subcategoria
    if (subcat && prod.subcategory !== subcat) {
      return false;
    }

    // C. Tipo de Promoção selecionado
    if (!matchesPromoType(prod)) {
      return false;
    }

    // D. Termo de busca (q)
    if (query) {
      const matchName = prod.name.toLowerCase().includes(query);
      const matchDesc = prod.description?.toLowerCase().includes(query);
      const matchStore = prod.store_name.toLowerCase().includes(query);
      if (!matchName && !matchDesc && !matchStore) {
        return false;
      }
    }

    return true;
  });

  // ORDENAÇÃO DE PRODUTOS: Ordem cronológica decrescente de cadastro ou publicação
  // Regra: Mais recentes primeiro, mais antigos depois. Critério secundário estável: ID.
  produtosFiltrados.sort((a, b) => {
    const timeA = new Date(a.published_at).getTime();
    const timeB = new Date(b.published_at).getTime();
    if (timeB !== timeA) {
      return timeB - timeA;
    }
    return b.id.localeCompare(a.id);
  });

  // =========================================================================
  // 3. FILTRAGEM COMBINADA DE LOJAS (POR INTERSEÇÃO & ELEGIBILIDADE REAL)
  // Regra do Edital: "uma loja não deverá aparecer apenas porque está cadastrada
  // na categoria Moda. Ela deverá possuir produtos ou publicações elegíveis
  // para a subcategoria e modalidade selecionadas."
  // =========================================================================
  const lojasFiltradas = allStores.filter((store) => {
    // Filtro Por Rua
    if (rua && !streetsMatch(store.street, rua)) {
      return false;
    }

    // Termo de busca
    if (query) {
      const matchStoreName = store.name.toLowerCase().includes(query);
      const matchStoreDesc = store.description?.toLowerCase().includes(query);
      if (!matchStoreName && !matchStoreDesc) {
        return false;
      }
    }

    // Verificar se a loja possui produtos cadastrados que atendam aos critérios selecionados
    const produtosElegiveisDaLoja = allProducts.filter((p) => {
      if (p.store_id !== store.id && p.store_name !== store.name) {
        return false;
      }

      // Se categoria foi selecionada (exceto modo especial "por_rua")
      if (cat && cat !== "por_rua" && p.category !== cat) {
        return false;
      }

      // Se subcategoria foi selecionada
      if (subcat && p.subcategory !== subcat) {
        return false;
      }

      // Tipo de Promoção do produto na loja
      if (!matchesPromoType(p)) {
        return false;
      }

      return true;
    });

    // Se houver filtros específicos de subcategoria, categoria ou tipo de promoção aplicados, a loja é elegível se tiver produtos correspondentes
    // ou se for uma loja recém-aberta na plataforma que ainda está montando seu catálogo na respectiva categoria
    if ((cat && cat !== "por_rua") || subcat || modalidadesSelecionadas.length > 0) {
      if (produtosElegiveisDaLoja.length > 0) {
        return true;
      }
      const matchesCat = !cat || cat === "por_rua" || store.category.toLowerCase() === cat.toLowerCase();
      const matchesSubcat = !subcat || store.subcategories?.some((s: string) => s.toLowerCase() === subcat.toLowerCase());
      const hasAnyProduct = allProducts.some((p) => p.store_id === store.id || p.store_name === store.name);
      return matchesCat && matchesSubcat && !hasAnyProduct;
    }

    return true;
  });

  // ORDENAÇÃO DE LOJAS: Ordem alfabética crescente (A a Z)
  // Regra do Edital: Case-insensitive, tratando acentos da língua portuguesa (ex: Águia antes de Bella).
  lojasFiltradas.sort((a, b) => {
    return a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" });
  });

  // Legenda de status dos filtros de promoção ativos
  const modalidadeLegenda =
    modalidadesSelecionadas.length > 0
      ? modalidadesSelecionadas.map((m) => nomesPromocoes[m] || m).join(" • ")
      : "Todas as Promoções";

  // =========================================================================
  // RENDERIZAÇÃO 1: ÁREA LOJAS (PADRÃO DE LINHAS: 1 BANNER SINGLE + 1 BANNER DUPLO, EM SEGUIDA 1 BANNER TRIPLO)
  // =========================================================================
  if (tipo === "lojas") {
    // Separar lojas elegíveis pelo formato de banner do seu plano contratado:
    // - Plano Bronze (Gratuito): Banner Single (1 coluna)
    // - Plano Bronze Plus e Plano Prata: Banner Duplo (2 colunas)
    // - Plano Ouro: Banner Triplo (3 colunas)
    const getStoreBannerType = (storePlan?: string): "single" | "double" | "triple" => {
      const p = (storePlan || "bronze").toLowerCase();
      if (p === "ouro" || p === "auto_100") return "triple";
      if (p === "bronze_plus" || p === "prata" || p === "auto_50") return "double";
      return "single";
    };

    const singleQueue = lojasFiltradas.filter((s) => getStoreBannerType(s.plan) === "single");
    const doubleQueue = lojasFiltradas.filter((s) => getStoreBannerType(s.plan) === "double");
    const tripleQueue = lojasFiltradas.filter((s) => getStoreBannerType(s.plan) === "triple");

    const fallbackSingles = allStores.filter((s) => getStoreBannerType(s.plan) === "single");
    const fallbackDoubles = allStores.filter((s) => getStoreBannerType(s.plan) === "double");
    const fallbackTriples = allStores.filter((s) => getStoreBannerType(s.plan) === "triple");

    // Sequência exata das 6 linhas que se repete no feed de lojas:
    // Linha 1: 3 Singles
    // Linha 2: 1 Single + 1 Duplo
    // Linha 3: 1 Triplo
    // Linha 4: 3 Singles
    // Linha 5: 1 Duplo + 1 Single
    // Linha 6: 1 Triplo
    const ROW_PATTERN: ("single" | "double" | "triple")[][] = [
      ["single", "single", "single"], // Linha 1: 3 Singles
      ["single", "double"],           // Linha 2: 1 Single e 1 Duplo
      ["triple"],                     // Linha 3: 1 Triplo
      ["single", "single", "single"], // Linha 4: 3 Singles
      ["double", "single"],           // Linha 5: 1 Duplo e 1 Single
      ["triple"],                     // Linha 6: 1 Triplo
    ];

    const orderedFeedStores: {
      loja: StoreItem;
      bannerType: "single" | "double" | "triple";
      renderKey: string;
    }[] = [];

    if (lojasFiltradas.length > 0) {
      if (rua) {
        lojasFiltradas.forEach((store, idx) => {
          orderedFeedStores.push({
            loja: store,
            bannerType: getStoreBannerType(store.plan),
            renderKey: `${store.id}-rua-${idx}`,
          });
        });
      } else {
        let sIdx = 0;
        let dIdx = 0;
        let tIdx = 0;

        const pickNextStore = (type: "single" | "double" | "triple"): StoreItem => {
          if (type === "single") {
            const pool = singleQueue.length > 0 ? singleQueue : fallbackSingles;
            return pool[sIdx++ % pool.length];
          }
          if (type === "double") {
            const pool = doubleQueue.length > 0 ? doubleQueue : fallbackDoubles;
            return pool[dIdx++ % pool.length];
          }
          const pool = tripleQueue.length > 0 ? tripleQueue : fallbackTriples;
          return pool[tIdx++ % pool.length];
        };

        const cyclesNeeded = Math.max(
          1,
          Math.ceil(singleQueue.length / 8),
          Math.ceil(doubleQueue.length / 2),
          Math.ceil(tripleQueue.length / 2)
        );

        for (let cycle = 0; cycle < cyclesNeeded; cycle++) {
          for (let rowIndex = 0; rowIndex < ROW_PATTERN.length; rowIndex++) {
            const rowSlots = ROW_PATTERN[rowIndex];
            for (let slotIndex = 0; slotIndex < rowSlots.length; slotIndex++) {
              const bType = rowSlots[slotIndex];
              const store = pickNextStore(bType);
              if (store) {
                orderedFeedStores.push({
                  loja: store,
                  bannerType: bType,
                  renderKey: `${store.id}-c${cycle}-r${rowIndex}-s${slotIndex}`,
                });
              }
            }
          }
        }
      }
    }

    return (
      <div className="w-full">
        {/* Barra Informativa de Filtros Ativos (Sem título grande repetitivo e sem contador de lojas elegíveis) */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-[#FB6600] text-white tracking-widest rounded-none">
              Lojas
            </span>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-black text-white tracking-widest rounded-none">
              {categoriaAtual}
            </span>
            {rua && (
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 border border-[#FB6600] text-[#FB6600] tracking-widest rounded-none">
                {rua}
              </span>
            )}
            {subcat && (
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 border border-[#FB6600] text-[#FB6600] tracking-widest rounded-none">
                {subcat}
              </span>
            )}
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-gray-100 text-gray-800 tracking-widest rounded-none">
              {modalidadeLegenda}
            </span>
          </div>
        </div>

        {orderedFeedStores.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 border border-dashed border-gray-200 p-8 my-6">
            <p className="text-sm text-gray-600 font-medium mb-1">
              {rua
                ? `Nenhuma loja cadastrada encontrada na rua "${rua}" para os filtros selecionados.`
                : "Nenhuma loja com produtos elegíveis encontrada para os filtros selecionados."}
            </p>
            <p className="text-xs text-gray-400">
              Critérios aplicados: {categoriaAtual} {rua ? `> ${rua}` : ""} {subcat ? `> ${subcat}` : ""} &bull; Modalidade: {modalidadeLegenda}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6 w-full max-w-full">
            {orderedFeedStores.map(({ loja, bannerType, renderKey }) => {
              // Regra dos Banners no Feed de Lojas:
              // - Plano Bronze (single): o Banner Grande/Triplo (large_banner_url) fica somente dentro da loja e NÃO aparece no filtro Lojas; usa apenas small_banner_url.
              // - Planos Bronze Plus e Prata (double): têm Triplo (dentro da loja) e Duplo (small_banner_url), porém em Lojas só aparece o Duplo.
              // - Plano Ouro (triple): tem Triplo (large_banner_url) e aparece em Lojas.
              const bgImg =
                bannerType === "single"
                  ? loja.small_banner_url || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=600&q=80"
                  : bannerType === "double"
                  ? loja.small_banner_url || "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=800&q=80"
                  : loja.large_banner_url || loja.small_banner_url || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=940&q=80";

              const colSpanOnly =
                bannerType === "triple"
                  ? "md:col-span-3"
                  : bannerType === "double"
                  ? "md:col-span-2"
                  : "md:col-span-1";

              const heightClass =
                bannerType === "triple"
                  ? "h-[210px] md:h-[245px]"
                  : "h-[210px] md:h-[220px]";

              const storeTimer = promoTimers[loja.id];

              return (
                <div
                  key={renderKey}
                  className={`flex flex-col w-full max-w-full shadow-sm hover:shadow-md transition-all duration-300 rounded-t-none rounded-b-[16px] overflow-hidden ${colSpanOnly}`}
                >
                  <Link
                    href={`/loja/${loja.slug || loja.id}`}
                    className={`group relative overflow-hidden bg-neutral-100 border-t border-x border-gray-200 rounded-none cursor-pointer w-full max-w-full flex flex-col justify-between p-4 ${heightClass}`}
                  >
                    <img
                      src={bgImg}
                      alt={loja.name}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/35 to-transparent group-hover:from-black/90 transition-colors" />

                    {/* Topo do Card de Loja (Livre) */}
                    <div className="relative z-10" />

                    {/* Rodapé do Card de Loja */}
                    <div className="relative z-10">
                      <h3 className={`${bannerType === "triple" ? "text-2xl md:text-3xl" : "text-xl"} font-heading font-extrabold tracking-tight text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] leading-tight mb-1`}>
                        {loja.name}
                      </h3>
                      {loja.description && (
                        <p className="text-xs sm:text-[13px] text-gray-100 leading-relaxed line-clamp-1 drop-shadow-md max-w-2xl">
                          {loja.description}
                        </p>
                      )}
                    </div>
                  </Link>

                  {/* Barra inferior de Cronômetro de Promoção + Termômetro Temporal + Coração (Exatamente como nas imagens) */}
                  <PromoThermometerBar
                    storeId={loja.id}
                    title={storeTimer?.title}
                    startDate={storeTimer?.startDate}
                    endDate={storeTimer?.endDate}
                    isActive={storeTimer ? storeTimer.isActive : true}
                    variant="banner"
                    showHeart={true}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // RENDERIZAÇÃO 2: ÁREA PRODUTOS (FEED CRONOLÓGICO DECRESCENTE)
  // =========================================================================
  return (
    <div className="w-full">
      {/* O banner institucional só aparece na página inicial geral sem filtros restritivos */}
      {isHomePage && <HomeBanner />}

      {/* Barra Informativa de Filtros Ativos (Sem título grande repetitivo e sem contador de produtos recentes) */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-[#FB6600] text-white tracking-widest rounded-none">
            Produtos
          </span>
          <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-black text-white tracking-widest rounded-none">
            {categoriaAtual}
          </span>
          {rua && (
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 border border-[#FB6600] text-[#FB6600] tracking-widest rounded-none">
              {rua}
            </span>
          )}
          {subcat && (
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 border border-[#FB6600] text-[#FB6600] tracking-widest rounded-none">
              {subcat}
            </span>
          )}
          <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-gray-100 text-gray-800 tracking-widest rounded-none">
            {modalidadeLegenda}
          </span>
        </div>
      </div>

      {produtosFiltrados.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 border border-dashed border-gray-200 p-8 my-6">
          {isFeedQueSigoActive && followedStoreIds.length === 0 ? (
            <>
              <p className="text-sm text-gray-800 font-bold mb-1.5">
                Você ainda não está seguindo nenhuma loja no seu Feed que sigo.
              </p>
              <p className="text-xs text-gray-500 mb-4 max-w-md mx-auto">
                Siga suas lojas favoritas clicando no coração (♡) abaixo dos banners das lojas ou gerencie suas lojas seguidas no seu Perfil.
              </p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <Link
                  href="/?tipo=lojas"
                  className="px-4 py-2 bg-[#FB6600] hover:bg-[#e05b00] text-white text-xs font-bold uppercase tracking-wider rounded-[2px] transition-colors"
                >
                  Explorar Lojas para Seguir
                </Link>
                <Link
                  href="/perfil?aba=seguindo"
                  className="px-4 py-2 bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 text-xs font-semibold uppercase tracking-wider rounded-[2px] transition-colors"
                >
                  Abrir Meu Perfil (Seguindo)
                </Link>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-600 font-medium mb-1">
                Nenhum produto encontrado para a combinação selecionada.
              </p>
              <p className="text-xs text-gray-400">
                Filtros ativos: {categoriaAtual} {subcat ? `> ${subcat}` : ""} &bull; Tipo de Promoção: {modalidadeLegenda}
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 md:gap-6 w-full max-w-full">
          {produtosFiltrados.map((produto) => {
            const dataPublicacao = new Date(produto.published_at);
            const dataFormatada = !isNaN(dataPublicacao.getTime())
              ? dataPublicacao.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
              : "";
            const promoBadgeLabel =
              nomesPromocoes[(produto.promo_type || "").toLowerCase()] ||
              (produto.is_novidade ? "Lançamento" : "Outlet");
            const hasDiscount =
              typeof produto.regular_price === "number" &&
              typeof produto.promotional_price === "number" &&
              produto.promotional_price > 0 &&
              produto.promotional_price < produto.regular_price;
            const discountPercent = hasDiscount
              ? Math.round(((produto.regular_price! - produto.promotional_price!) / produto.regular_price!) * 100)
              : null;

            const isVehicleCard = Boolean(
              produto.is_vehicle ||
                produto.photo_orientation === "horizontal" ||
                produto.vehicle_version ||
                produto.vehicle_km ||
                produto.vehicle_traction ||
                produto.vehicle_year_fab ||
                produto.vehicle_year_model ||
                (produto.category === "carro" &&
                  ["usados", "concessionária", "concessionaria"].includes(produto.subcategory))
            );
            const cardOrientation = isVehicleCard ? "horizontal" : (produto.photo_orientation || "vertical");

            // Galeria do card: usa as fotos cadastradas do produto/veículo (até 6 ou 12 fotos)
            // e, para itens de demonstração com 1 foto, inclui as demais fotos da categoria para permitir navegar nas setas laterais
            const sameCatImages = produtosFiltrados
              .filter((p) => p.category === produto.category && p.id !== produto.id)
              .map((p) => p.image_url);
            const cardImages =
              produto.images && produto.images.length > 1
                ? produto.images
                : [produto.image_url, ...sameCatImages].filter(Boolean).slice(0, 6);

            const prodStoreTimer = promoTimers[produto.store_id];
            const prodStoreObj = allStores.find((s) => s.id === produto.store_id);
            const storeLogoUrl = produto.store_logo_url || prodStoreObj?.logo_url || null;

            return (
              <div
                key={produto.id}
                className="group border border-gray-200 bg-white hover:shadow-md transition-shadow duration-300 grid grid-cols-1 h-full w-full max-w-full overflow-hidden rounded-[6px]"
              >
                {/* Sizer estrutural invisível para manter o card de carros exatamente com o mesmo tamanho do card de produtos */}
                <div
                  aria-hidden="true"
                  className="col-start-1 row-start-1 pointer-events-none invisible select-none flex flex-col w-full"
                >
                  <div className="aspect-[4/5] w-full" />
                  <div className="h-[38px]" />
                  <div className="p-4 flex flex-col justify-between">
                    <div className="h-[78px]" />
                    <div className="mt-3 pt-3 h-[84px]" />
                  </div>
                </div>

                {/* Conteúdo visível do Card */}
                <div className="col-start-1 row-start-1 flex flex-col h-full w-full overflow-hidden">
                  {/* Imagem do Produto/Veículo com Setas Laterais + Tag de Tipo de Promoção + Círculo de Desconto */}
                  <ProductCardImageCarousel
                    images={cardImages}
                    alt={produto.name}
                    photoOrientation={cardOrientation}
                    promoBadgeLabel={promoBadgeLabel}
                    subcategory={produto.subcategory}
                    hasDiscount={hasDiscount}
                    discountPercent={discountPercent}
                  />

                  {/* Cronômetro de Promoção + Termômetro Temporal + Coração de Favorito */}
                  <PromoThermometerBar
                    productId={produto.id}
                    storeId={produto.store_id}
                    title={prodStoreTimer?.title || promoBadgeLabel}
                    startDate={prodStoreTimer?.startDate}
                    endDate={prodStoreTimer?.endDate}
                    isActive={prodStoreTimer ? prodStoreTimer.isActive : true}
                    variant="card"
                    showHeart={true}
                    className="!border-x-0 !rounded-none"
                  />

                  {/* Conteúdo do Card */}
                  <div className="p-4 flex flex-col flex-grow justify-between bg-white">
                    <div className="flex flex-col flex-grow">
                      <div className="flex items-center justify-between text-xs text-gray-500 tracking-wide mb-1.5 gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div className="w-5 h-5 rounded-full overflow-hidden border border-gray-200 bg-gray-100 shrink-0 flex items-center justify-center">
                            {storeLogoUrl ? (
                              <img
                                src={storeLogoUrl}
                                alt={produto.store_name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="font-heading text-[10px] font-bold text-gray-600 leading-none select-none">
                                {produto.store_name.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <span className="font-heading font-semibold uppercase text-[11px] text-gray-700 line-clamp-1">
                            {produto.store_name}
                          </span>
                        </div>
                        {dataFormatada && <span className="text-[11px] shrink-0 text-gray-400 tabular-nums">{dataFormatada}</span>}
                      </div>
                      <h3 className="font-heading text-[15px] text-gray-900 font-semibold leading-snug tracking-tight mb-1.5 line-clamp-2">
                        {produto.name}
                      </h3>

                      {isVehicleCard ? (
                        <div className="my-auto py-1.5 space-y-1.5">
                          <div className="bg-gray-50 border border-gray-100 px-2.5 py-1.5 rounded-[2px]">
                            <span className="text-[9px] uppercase tracking-wider text-gray-400 font-bold block leading-tight">
                              Versão
                            </span>
                            <span className="text-[11px] font-semibold text-gray-800 block leading-snug line-clamp-1">
                              {produto.vehicle_version || produto.description || "Versão Completa"}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-1.5">
                            <div className="bg-gray-50 border border-gray-100 px-2.5 py-1.5 rounded-[2px]">
                              <span className="text-[9px] uppercase tracking-wider text-gray-400 font-bold block leading-tight">
                                KM
                              </span>
                              <span className="text-[11px] font-bold text-gray-800 block truncate">
                                {produto.vehicle_km || "0 km"}
                              </span>
                            </div>
                            <div className="bg-gray-50 border border-gray-100 px-2.5 py-1.5 rounded-[2px]">
                              <span className="text-[9px] uppercase tracking-wider text-gray-400 font-bold block leading-tight">
                                Tração
                              </span>
                              <span className="text-[11px] font-bold text-gray-800 block truncate">
                                {produto.vehicle_traction || "4x2"}
                              </span>
                            </div>
                            <div className="bg-gray-50 border border-gray-100 px-2.5 py-1.5 rounded-[2px]">
                              <span className="text-[9px] uppercase tracking-wider text-gray-400 font-bold block leading-tight">
                                Ano
                              </span>
                              <span className="text-[11px] font-bold text-gray-800 block truncate">
                                {produto.vehicle_year_fab || "2024"}
                              </span>
                            </div>
                            <div className="bg-gray-50 border border-gray-100 px-2.5 py-1.5 rounded-[2px]">
                              <span className="text-[9px] uppercase tracking-wider text-gray-400 font-bold block leading-tight">
                                Ano/Modelo
                              </span>
                              <span className="text-[11px] font-bold text-gray-800 block truncate">
                                {produto.vehicle_year_model || "2024/2025"}
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        produto.description && (
                          <p className="text-[13px] text-gray-600 leading-relaxed line-clamp-2 mb-2">
                            {produto.description}
                          </p>
                        )
                      )}
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-100 flex flex-col gap-1">
                      {/* 1. Preço de venda (R$ perfeitamente alinhado na mesma fonte e linha) */}
                      <div className="font-heading text-base font-bold text-neutral-900 tracking-normal tabular-nums leading-tight">
                        R$ {String(produto.price || "").replace(/^R\$\s*/i, "").trim()}
                      </div>

                      {/* 2. Preço anterior / referência riscado logo abaixo */}
                      {hasDiscount && produto.regular_price && (
                        <div className="text-xs text-gray-400 line-through tabular-nums leading-tight">
                          R$ {formatCurrencyBRL(produto.regular_price)}
                        </div>
                      )}

                      {/* 3. Botão abaixo dos preços */}
                      <button
                        type="button"
                        className="mt-1.5 w-full font-heading text-xs border border-gray-300 px-3 py-2 text-gray-800 hover:border-black hover:text-black font-semibold tracking-tight transition-colors"
                      >
                        Ver Detalhes
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
