import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = process.env.SUPABASE_PROJECT_URL;
const supabaseKey = process.env.SUPABASE_PROJECT_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function downloadSession() {
  const { data, error } = await supabase.storage
    .from('edurec-bucket')    
    .download('sessions/edurecAuth.json');  

  if (error) {
    throw error;
  }

  const arrayBuffer = await data.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  fs.writeFileSync('./PlayWright/edurecAuth.json', buffer);

  console.log('Session file downloaded successfully!');
  const fileContents = fs.readFileSync('./PlayWright/edurecAuth.json', 'utf-8');
  console.log('edurecAuth.json contents:\n', fileContents);
}

downloadSession().catch(err => {
  console.error('Failed to download session:', err);
  process.exit(1);
});
