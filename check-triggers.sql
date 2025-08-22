-- SCRIPT PARA DIAGNOSTICAR TRIGGERS EXISTENTES

-- Ver todos los triggers en la base de datos
SELECT 
    n.nspname as schema_name, 
    c.relname as table_name, 
    t.tgname as trigger_name,
    pg_get_triggerdef(t.oid) as trigger_definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE NOT t.tgisinternal
ORDER BY n.nspname, c.relname, t.tgname;

-- Ver funciones relacionadas con usuarios/subscriptions
SELECT 
    routine_name,
    routine_schema,
    routine_type
FROM information_schema.routines 
WHERE routine_name LIKE '%user%' 
   OR routine_name LIKE '%subscription%'
ORDER BY routine_schema, routine_name;

-- Ver políticas RLS que podrían estar causando problemas
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('usuarios', 'subscriptions')
ORDER BY schemaname, tablename;