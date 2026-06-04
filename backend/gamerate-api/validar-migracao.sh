#!/bin/bash
# script-validacao.sh - Script para validar a migração TypeScript

echo "🔍 VALIDAÇÃO DA MIGRAÇÃO TYPESCRIPT"
echo "===================================="
echo ""

echo "✅ Etapa 1: Verificando arquivo tsconfig.json..."
if [ -f "tsconfig.json" ]; then
    echo "   ✓ tsconfig.json encontrado"
else
    echo "   ✗ tsconfig.json NÃO encontrado"
    exit 1
fi
echo ""

echo "✅ Etapa 2: Verificando diretórios obrigatórios..."
for dir in src/types src/errors src/middlewares src/models src/controllers src/routes src/database; do
    if [ -d "$dir" ]; then
        echo "   ✓ $dir"
    else
        echo "   ✗ $dir NÃO encontrado"
        exit 1
    fi
done
echo ""

echo "✅ Etapa 3: Verificando arquivos TypeScript principais..."
for file in src/index.ts src/routes.ts src/types/index.ts src/errors/HttpError.ts src/middlewares/errorHandler.ts; do
    if [ -f "$file" ]; then
        echo "   ✓ $file"
    else
        echo "   ✗ $file NÃO encontrado"
        exit 1
    fi
done
echo ""

echo "✅ Etapa 4: Verificando models..."
for model in Perfil Categoria Jogo Usuario Avaliacao Contato; do
    if [ -f "src/models/${model}.ts" ]; then
        echo "   ✓ src/models/${model}.ts"
    else
        echo "   ✗ src/models/${model}.ts NÃO encontrado"
        exit 1
    fi
done
echo ""

echo "✅ Etapa 5: Verificando controllers..."
for controller in Jogo Avaliacao Usuario Contato Catalog; do
    if [ -f "src/controllers/${controller}Controller.ts" ]; then
        echo "   ✓ src/controllers/${controller}Controller.ts"
    else
        echo "   ✗ src/controllers/${controller}Controller.ts NÃO encontrado"
        exit 1
    fi
done
echo ""

echo "✅ Etapa 6: Verificando routes..."
for route in jogo avaliacao usuario auth contato; do
    if [ -f "src/routes/${route}Routes.ts" ]; then
        echo "   ✓ src/routes/${route}Routes.ts"
    else
        echo "   ✗ src/routes/${route}Routes.ts NÃO encontrado"
        exit 1
    fi
done
echo ""

echo "✅ Etapa 7: Verificando dependências TypeScript no package.json..."
if grep -q '"typescript"' package.json; then
    echo "   ✓ typescript instalado"
else
    echo "   ✗ typescript NÃO encontrado"
    exit 1
fi

if grep -q '"tsx"' package.json; then
    echo "   ✓ tsx instalado"
else
    echo "   ✗ tsx NÃO encontrado"
    exit 1
fi

if grep -q '"@types/express"' package.json; then
    echo "   ✓ @types/express instalado"
else
    echo "   ✗ @types/express NÃO encontrado"
    exit 1
fi
echo ""

echo "✅ Etapa 8: Verificando scripts npm..."
if grep -q '"dev": "tsx watch src/index.ts"' package.json; then
    echo "   ✓ Script 'dev' configurado"
else
    echo "   ✗ Script 'dev' NÃO configurado"
    exit 1
fi

if grep -q '"build": "tsc"' package.json; then
    echo "   ✓ Script 'build' configurado"
else
    echo "   ✗ Script 'build' NÃO configurado"
    exit 1
fi

if grep -q '"check": "tsc --noEmit"' package.json; then
    echo "   ✓ Script 'check' configurado"
else
    echo "   ✗ Script 'check' NÃO configurado"
    exit 1
fi
echo ""

echo "✅ Etapa 9: Verificando documentação..."
if [ -f "TYPESCRIPT_MIGRATION.md" ]; then
    echo "   ✓ TYPESCRIPT_MIGRATION.md"
else
    echo "   ✗ TYPESCRIPT_MIGRATION.md NÃO encontrado"
fi

if [ -f "MIGRATION_SUMMARY.md" ]; then
    echo "   ✓ MIGRATION_SUMMARY.md"
else
    echo "   ✗ MIGRATION_SUMMARY.md NÃO encontrado"
fi
echo ""

echo "════════════════════════════════════════"
echo "✅ VALIDAÇÃO CONCLUÍDA COM SUCESSO!"
echo "════════════════════════════════════════"
echo ""
echo "Próximos passos:"
echo "  1. npm install                  # Instalar dependências"
echo "  2. npm run check                # Validar tipos TypeScript"
echo "  3. npm run dev                  # Iniciar servidor em desenvolvimento"
echo "  4. npm run db:reload            # Recriar banco com seed"
echo ""
