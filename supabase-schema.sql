-- Script de création des tables Supabase pour PPT Template Manager
-- Basé sur les modèles Sequelize actuels

-- Extension pour UUID si pas déjà activée
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Création de la table Users
-- Note: Dans Supabase, utiliser auth.users pour l'authentification
-- Cette table stocke les données utilisateur supplémentaires
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID UNIQUE, -- Pour lier avec auth.users si nécessaire
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Index pour l'email
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users (email);

-- Création de la table Categories
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  color VARCHAR(255) DEFAULT '#3B82F6',
  icon VARCHAR(255) DEFAULT 'folder',
  is_default BOOLEAN NOT NULL DEFAULT false,
  parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  position INTEGER NOT NULL DEFAULT 0,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Index pour les catégories par utilisateur
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories (user_id);

-- Création de la table Templates
CREATE TABLE IF NOT EXISTS public.templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  thumbnail_url VARCHAR(1024),
  file_path VARCHAR(1024) NOT NULL,
  is_official BOOLEAN NOT NULL DEFAULT false,
  is_public BOOLEAN NOT NULL DEFAULT false,
  file_size INTEGER,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Index pour les templates par utilisateur
CREATE INDEX IF NOT EXISTS idx_templates_user_id ON public.templates (user_id);

-- Table de relation many-to-many entre Templates et Categories
CREATE TABLE IF NOT EXISTS public.template_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL REFERENCES public.templates(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (template_id, category_id)
);

-- Index pour les relations
CREATE INDEX IF NOT EXISTS idx_template_categories_template_id ON public.template_categories (template_id);
CREATE INDEX IF NOT EXISTS idx_template_categories_category_id ON public.template_categories (category_id);

-- Création de la table Slides
CREATE TABLE IF NOT EXISTS public.slides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slide_number INTEGER NOT NULL,
  title VARCHAR(255),
  template_id UUID NOT NULL REFERENCES public.templates(id) ON DELETE CASCADE,
  thumbnail_url VARCHAR(1024),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Index pour les slides par template
CREATE INDEX IF NOT EXISTS idx_slides_template_id ON public.slides (template_id);

-- Création de la table Fields
CREATE TABLE IF NOT EXISTS public.fields (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  field_type VARCHAR(50) NOT NULL,
  placeholder TEXT,
  default_value TEXT,
  is_required BOOLEAN DEFAULT false,
  options JSONB,
  slide_number INTEGER,
  position JSONB,
  validation JSONB,
  template_id UUID NOT NULL REFERENCES public.templates(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Index pour les champs par template
CREATE INDEX IF NOT EXISTS idx_fields_template_id ON public.fields (template_id);

-- Création de la table Exports
CREATE TABLE IF NOT EXISTS public.exports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  output_path VARCHAR(1024),
  storage_type VARCHAR(50) DEFAULT 'local',
  storage_path VARCHAR(1024),
  download_url VARCHAR(1024),
  error TEXT,
  template_id UUID NOT NULL REFERENCES public.templates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  form_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Index pour les exports par utilisateur et template
CREATE INDEX IF NOT EXISTS idx_exports_user_id ON public.exports (user_id);
CREATE INDEX IF NOT EXISTS idx_exports_template_id ON public.exports (template_id);

-- Création des buckets de stockage
-- Note: Ceci doit être exécuté via l'API Supabase ou l'interface admin,
-- mais les commandes sont fournies à titre de référence

/*
-- À exécuter via l'interface Supabase Storage ou l'API:
1. Créer un bucket 'templates' pour les fichiers de modèles
2. Créer un bucket 'exports' pour les fichiers générés
3. Créer un bucket 'thumbnails' pour les miniatures
*/

-- Ajouter des règles de sécurité RLS (Row Level Security)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exports ENABLE ROW LEVEL SECURITY;

-- Politique: les utilisateurs peuvent voir et modifier uniquement leurs propres données
CREATE POLICY user_isolation_policy ON public.users 
  FOR ALL USING (auth.uid() = id);

CREATE POLICY user_categories_policy ON public.categories 
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY user_templates_policy ON public.templates 
  FOR ALL USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY user_exports_policy ON public.exports 
  FOR ALL USING (auth.uid() = user_id);

-- Création d'un utilisateur admin par défaut (mot de passe: admin123)
-- Note: Le mot de passe est déjà hashé pour sécurité
DO $$
DECLARE
  admin_uuid UUID := uuid_generate_v4();
BEGIN
  INSERT INTO public.users (id, email, password_hash, name, created_at, updated_at)
  VALUES (
    admin_uuid,
    'admin@example.com', 
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    'Administrateur',
    NOW(),
    NOW()
  ) ON CONFLICT (email) DO NOTHING;
END $$;

-- Création des catégories par défaut pour l'utilisateur admin
DO $$
DECLARE
  admin_id UUID;
BEGIN
  SELECT id INTO admin_id FROM public.users WHERE email = 'admin@example.com' LIMIT 1;
  
  IF admin_id IS NOT NULL THEN
    INSERT INTO public.categories (name, color, icon, is_default, position, user_id, created_at, updated_at)
    VALUES
      ('Présentations commerciales', '#3B82F6', 'folder', false, 1, admin_id, NOW(), NOW()),
      ('Rapports financiers', '#3B82F6', 'folder', false, 2, admin_id, NOW(), NOW()),
      ('Présentations marketing', '#3B82F6', 'folder', false, 3, admin_id, NOW(), NOW()),
      ('Pitchs startup', '#3B82F6', 'folder', false, 4, admin_id, NOW(), NOW()),
      ('Autres', '#3B82F6', 'folder', false, 5, admin_id, NOW(), NOW())
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
