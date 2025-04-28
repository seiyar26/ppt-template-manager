const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialisation du client Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY; // Utiliser la clé de service pour les opérations côté serveur

if (!supabaseUrl || !supabaseKey) {
  console.error('Erreur: Les variables d\'environnement SUPABASE_URL et SUPABASE_SERVICE_KEY doivent être définies');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

module.exports = supabase;