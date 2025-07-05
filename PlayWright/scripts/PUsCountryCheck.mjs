import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = process.env.SUPABASE_PROJECT_URL;
const supabaseKey = process.env.SUPABASE_PROJECT_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function downloadCountryColumn() {
  const { data, error } = await supabase.storage
    .from('edurec-bucket')    
    .download('sessions/edurecAuth.json');  

  if (error) {
    throw error;
  }
}