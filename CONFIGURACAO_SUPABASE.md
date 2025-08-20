# Configuração do Supabase

## Problemas Identificados e Soluções

### 1. Erro 404 nas requisições para o Supabase

**Problema:** As tabelas não existem no banco de dados ou não foram criadas corretamente.

**Solução:** Execute o script SQL no painel do Supabase:

1. Acesse o painel do Supabase: https://supabase.com/dashboard
2. Vá para o projeto: `rpyhrikatvqutookarwz`
3. Navegue até "SQL Editor"
4. Execute o conteúdo completo do arquivo `schema.sql`

### 2. Ordem de Criação das Tabelas

**Problema Corrigido:** A tabela `users` estava sendo criada antes da tabela `schools`, causando erro de referência.

**Solução Aplicada:** Reordenamos o schema para criar primeiro a tabela `schools` e depois `users`.

### 3. Nome Incorreto da Tabela

**Problema Corrigido:** O código estava tentando acessar `recognition_history` mas a tabela se chama `recognition_events`.

**Solução Aplicada:** Corrigimos as referências no `App.tsx`.

### 4. Favicon 404

**Problema Corrigido:** Navegador não encontrava o favicon.

**Solução Aplicada:** Criamos um favicon SVG e adicionamos a referência correta no `index.html`.

## Credenciais de Teste

Após executar o schema.sql, você terá os seguintes usuários de teste:

- **Admin:** admin@escola.com (qualquer senha)
- **Professor:** professor@escola.com (qualquer senha)
- **Operador:** operador@escola.com (qualquer senha)

## Verificação

Para verificar se tudo está funcionando:

1. Execute o schema.sql no Supabase
2. Reinicie o servidor de desenvolvimento: `npm run dev`
3. Acesse http://localhost:5173/
4. Verifique se não há mais erros 404 no console do navegador

## Instalação do React DevTools

Para uma melhor experiência de desenvolvimento, instale o React DevTools:

- **Chrome:** https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi
- **Firefox:** https://addons.mozilla.org/en-US/firefox/addon/react-devtools/
- **Edge:** https://microsoftedge.microsoft.com/addons/detail/react-developer-tools/gpphkfbcpidddadnkolkpfckpihlkkil

Ou instale globalmente via npm:
```bash
npm install -g react-devtools
react-devtools
```