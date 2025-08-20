# Deploy no Vercel - Sistema de Reconhecimento Facial

## Pré-requisitos

1. Conta no [Vercel](https://vercel.com)
2. Projeto configurado no Supabase
3. Repositório Git (GitHub, GitLab ou Bitbucket)

## Passos para Deploy

### 1. Preparar o Repositório

```bash
# Adicionar todos os arquivos ao Git
git add .
git commit -m "Preparar para deploy no Vercel"
git push origin main
```

### 2. Configurar no Vercel

1. Acesse [vercel.com](https://vercel.com) e faça login
2. Clique em "New Project"
3. Importe seu repositório do GitHub/GitLab/Bitbucket
4. Configure as seguintes opções:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### 3. Configurar Variáveis de Ambiente

No painel do Vercel, vá em **Settings > Environment Variables** e adicione:

```
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui
```

### 4. Configurações Importantes

#### Headers de Segurança
O arquivo `vercel.json` já inclui os headers necessários para:
- Cross-Origin-Embedder-Policy
- Cross-Origin-Opener-Policy

#### Roteamento SPA
O arquivo `vercel.json` configura rewrites para suportar roteamento client-side.

### 5. Deploy

1. Clique em "Deploy" no Vercel
2. Aguarde o build completar
3. Acesse a URL fornecida pelo Vercel

## Verificações Pós-Deploy

- [ ] Aplicação carrega corretamente
- [ ] Autenticação funciona
- [ ] Câmera é acessível (HTTPS necessário)
- [ ] Reconhecimento facial funciona
- [ ] Banco de dados conecta corretamente

## Troubleshooting

### Erro de Câmera
- Certifique-se de que o site está sendo servido via HTTPS
- Verifique se as permissões de câmera estão habilitadas

### Erro de Conexão com Supabase
- Verifique se as variáveis de ambiente estão corretas
- Confirme se o projeto Supabase está ativo

### Erro de Build
- Verifique os logs de build no Vercel
- Certifique-se de que todas as dependências estão no package.json

## Comandos Úteis

```bash
# Testar build local
npm run build

# Preview do build
npm run preview

# Instalar Vercel CLI (opcional)
npm i -g vercel

# Deploy via CLI
vercel --prod
```

## Estrutura de Arquivos Importantes

```
├── vercel.json          # Configurações do Vercel
├── .env.example         # Exemplo de variáveis de ambiente
├── vite.config.ts       # Configurações otimizadas do Vite
└── dist/                # Pasta de build (gerada automaticamente)
```

## Próximos Passos

1. Configure um domínio personalizado no Vercel (opcional)
2. Configure analytics e monitoring
3. Configure branch previews para desenvolvimento
4. Configure webhooks para deploy automático