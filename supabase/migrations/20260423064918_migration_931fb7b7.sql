-- Agregar columna slug a businesses
ALTER TABLE public.businesses 
ADD COLUMN slug TEXT;

-- Crear índice único para el slug
CREATE UNIQUE INDEX businesses_slug_unique ON public.businesses(slug);

-- Generar slug para el negocio existente del super admin
UPDATE public.businesses
SET slug = LOWER(REPLACE(name, ' ', '-')) || '-' || substr(md5(random()::text), 1, 8)
WHERE owner_id = '39f4a294-0956-404d-a31d-ae8e1b0e16e3';

-- Verificar que se aplicó correctamente
SELECT id, name, slug, owner_id
FROM public.businesses
WHERE owner_id = '39f4a294-0956-404d-a31d-ae8e1b0e16e3';