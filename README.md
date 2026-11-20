## Integrantes
* **Gustavo Galvão** – RM: 565969
* **Lucas Tamura** – RM: 563249

---

## Desafio do Global Solution - Citizentech - Diarista Já
O objetivo é desenvolvermos uma solução integrada entre um aplicativo mobile e uma plataforma web, que leve essa solução até o cidadão.

---

## O que Contém o Projeto

Nesta versão do protótipo, foram implementados Next.js, TypeScript, Tailwind CSS e Supabase para parte do acesso ao banco de dados.

## 1. Configurar o Banco de Dados (Supabase)

1. Crie um projeto gratuito em [supabase.com](https://supabase.com).
2. Abra o **SQL Editor** no painel do Supabase, cole todo o conteúdo do arquivo `supabase/schema.sql` e clique em **Run**.
3. *(Opcional para testes rápidos)* Em **Authentication > Providers > Email**, desative **Confirm email** para que o profissional faça cadastro e já entre diretamente sem precisar confirmar e-mail.

## 2. Rodar o Projeto Web

1. No arquivo para adequar ao supabase, `.env.local`, preencha com as credenciais do Supabase como o ID e o Link.

2. Instale as dependências e inicie o servidor:
   ```bash
   npm install
   npm run dev
   ```
3. Acesse `http://localhost:3000`:
   - **`/cadastro`**
   - **`/admin/login`**
   - **`/admin`**

