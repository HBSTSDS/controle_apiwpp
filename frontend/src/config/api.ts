// Configuração central da URL da API
// Em produção (Vercel), usa a variável de ambiente NEXT_PUBLIC_API_URL
// Em desenvolvimento local, usa localhost:3001
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default API_URL;
