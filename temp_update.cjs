const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: cars, error } = await supabase.from('cars').select('*');
  if (error) { console.error('Erro ao buscar:', error); return; }
  
  // Find a car with destaqueBanner
  let bannerCar = cars.find(c => c.detalhes && c.detalhes.includes('"destaqueBanner":true'));
  if (!bannerCar && cars.length > 0) bannerCar = cars[0];
  
  if (bannerCar) {
    const newImgs = [
      'https://images.unsplash.com/photo-1503376712341-ea400c4df1b0?w=800',
      'https://images.unsplash.com/photo-1549317661-bd32c8ce0be2?w=500',
      'https://images.unsplash.com/photo-1614200187524-dc4b892acf16?w=500',
      'https://images.unsplash.com/photo-1563720223185-11003d516935?w=500',
      'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=500',
      'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=500'
    ];
    let detalhesObj = {};
    try { detalhesObj = JSON.parse(bannerCar.detalhes || '{}'); } catch(e){}
    detalhesObj.destaqueBanner = true;
    
    const { error: updErr } = await supabase.from('cars').update({ imagens: newImgs, detalhes: JSON.stringify(detalhesObj) }).eq('id', bannerCar.id);
    if (updErr) console.error('Erro update:', updErr);
    else console.log('Sucesso! Adicionado 6 imagens ao carro:', bannerCar.modelo);
  }
}
run();
