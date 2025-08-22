-- Deshabilitar el trigger automático que está causando el error 500
DROP TRIGGER IF EXISTS on_user_created_subscription ON public.usuarios;

-- Eliminar la función del trigger automático
DROP FUNCTION IF EXISTS create_subscription_for_new_user();

-- El registro ahora funcionará sin trigger automático
-- La suscripción se creará manualmente desde el código de la aplicación