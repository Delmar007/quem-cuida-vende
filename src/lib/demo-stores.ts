export interface DemoStoreItem {
  id: string
  name: string
  slug: string
  category: string
  subcategories: string[]
  large_banner_url?: string | null
  small_banner_url?: string | null
  logo_url?: string | null
  description?: string | null
  is_active: boolean
  phone?: string | null
  street?: string | null
  number?: string | null
  neighborhood?: string | null
  city?: string | null
  state?: string | null
  cep?: string | null
  plan?: string
}

export const SEED_STORES: DemoStoreItem[] = [
  {
    id: "st-1",
    name: "Águia Fashion",
    slug: "aguia-fashion",
    category: "moda",
    subcategories: ["Feminina", "Festa", "Streetwear"],
    large_banner_url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=940&q=80",
    small_banner_url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=400&q=80",
    description: "Moda feminina contemporânea e looks exclusivos para festas e eventos.",
    is_active: true,
    city: "Campo Grande",
    state: "MS",
    phone: "67999887766",
    plan: "ouro",
  },
  {
    id: "st-2",
    name: "Bella Moda & Estilo",
    slug: "bella-moda",
    category: "moda",
    subcategories: ["Feminina", "Fitness", "Praia"],
    large_banner_url: "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=940&q=80",
    small_banner_url: "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=400&q=80",
    description: "Coleções de moda feminina, linha fitness para treino e moda praia para o verão.",
    is_active: true,
    city: "Campo Grande",
    state: "MS",
    phone: "67988776655",
    plan: "prata",
  },
  {
    id: "st-3",
    name: "Casa & Conforto Design",
    slug: "casa-conforto",
    category: "casa",
    subcategories: ["Móveis", "Decoração", "Cama, Mesa e Banho"],
    large_banner_url: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=940&q=80",
    small_banner_url: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=400&q=80",
    description: "Móveis e artigos finos de decoração e utilidades domésticas.",
    is_active: true,
    city: "Campo Grande",
    state: "MS",
    phone: "67977665544",
    plan: "bronze_plus",
  },
  {
    id: "st-4",
    name: "Estilo Masculino VIP",
    slug: "estilo-masculino-vip",
    category: "moda",
    subcategories: ["Masculina", "Streetwear", "Country"],
    large_banner_url: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=940&q=80",
    small_banner_url: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=400&q=80",
    description: "Roupas masculinas de alfaiataria, jeanswear e peças para o dia a dia.",
    is_active: true,
    city: "Campo Grande",
    state: "MS",
    phone: "67966554433",
    plan: "ouro",
  },
  {
    id: "st-5",
    name: "Glamour Cosméticos & Salão",
    slug: "glamour-cosmeticos",
    category: "beleza",
    subcategories: ["Cosméticos", "Maquiagem", "Perfumes", "Skincare", "Salão"],
    large_banner_url: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=940&q=80",
    small_banner_url: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=400&q=80",
    description: "Produtos de maquiagem importada, fragrâncias e tratamento facial.",
    is_active: true,
    city: "Campo Grande",
    state: "MS",
    phone: "67955443322",
    plan: "prata",
  },
  {
    id: "st-6",
    name: "Pet Amigo Care",
    slug: "pet-amigo-care",
    category: "pet",
    subcategories: ["Shop", "Banho", "Clínica", "Farmácia"],
    large_banner_url: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=940&q=80",
    small_banner_url: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=400&q=80",
    description: "Acessórios, rações nobres e cuidados completos para cães e gatos.",
    is_active: true,
    city: "Campo Grande",
    state: "MS",
    phone: "67944332211",
    plan: "bronze_plus",
  },
  {
    id: "st-7",
    name: "TechEletro Store",
    slug: "techeletro-store",
    category: "eletro",
    subcategories: ["Celulares", "Informática", "Games"],
    large_banner_url: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=940&q=80",
    small_banner_url: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=400&q=80",
    description: "Smartphones, periféricos gamers e tecnologia de ponta.",
    is_active: true,
    city: "Campo Grande",
    state: "MS",
    phone: "67933221100",
    plan: "ouro",
  },
  {
    id: "st-8",
    name: "Zeta Outlet Automotivo",
    slug: "zeta-outlet-automotivo",
    category: "carro",
    subcategories: ["Peças", "Acessórios", "Pneus", "Som Automotivo"],
    large_banner_url: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=940&q=80",
    small_banner_url: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=400&q=80",
    description: "Peças automotivas, som e acessórios com preços de outlet.",
    is_active: true,
    city: "Campo Grande",
    state: "MS",
    phone: "67922110099",
    plan: "bronze",
  },
]
