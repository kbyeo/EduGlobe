import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL= "https://osoyhekwotdpazclekmu.supabase.co";
const SUPABASE_ANON_KEY= "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zb3loZWt3b3RkcGF6Y2xla211Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxNDY2ODksImV4cCI6MjA2MzcyMjY4OX0.ACtumr_cCW2r4fE5Kus_PCdiIHhDueiMPl_YR_0qJQM";

const MAPPINGS_URL="https://liluljhcmvebrsolymoi.supabase.co";
const MAPPINGS_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpbHVsamhjbXZlYnJzb2x5bW9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDg2NzM5NCwiZXhwIjoyMDkwNDQzMzk0fQ.DZNbqK5ORXo15LG6Nzj2TKnpu8PTj2CfhG-7yCg3kaI";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const mappings = createClient(MAPPINGS_URL, MAPPINGS_ANON_KEY);

export default { supabase, mappings };