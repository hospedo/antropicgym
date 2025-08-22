-- SCRIPT PARA DIAGNOSTICAR TRIGGERS EXISTENTES

-- Ver todos los triggers en la base de datos
SELECT 
    schemaname, 
    tablename, 
    triggername,
    actionstatement
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE NOT tgisinternal
ORDER BY schemaname, tablename, triggername;

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