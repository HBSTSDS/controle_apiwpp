// Configuração central da URL da API
// Em produção (Vercel), usa a variável de ambiente NEXT_PUBLIC_API_URL
// Em desenvolvimento local, usa localhost:3001
const API_URL = typeof window !== 'undefined' 
  ? (window.location.hostname === 'localhost' 
      ? 'http://localhost:3001' 
      : `http://${window.location.hostname}:3001`)
  : 'http://localhost:3001';

export default API_URL;
