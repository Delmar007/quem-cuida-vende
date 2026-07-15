import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('Updating Perua SW to SW...');
  const { data: d1, error: e1 } = await supabase.from('cars').update({ tipoVeiculo: 'SW' }).eq('tipoVeiculo', 'Perua SW');
  if (e1) console.error('Error updating SW:', e1);
  else console.log('SW updated successfully');

  console.log('Updating Pickup to Pick-UP...');
  const { data: d2, error: e2 } = await supabase.from('cars').update({ tipoVeiculo: 'Pick-UP' }).eq('tipoVeiculo', 'Pickup');
  if (e2) console.error('Error updating Pick-UP:', e2);
  else console.log('Pick-UP updated successfully');

  console.log('Done.');
}

main();
