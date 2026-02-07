import React, { useState, useEffect, useRef } from 'react';
import { 
  Heart, 
  CheckCircle, 
  ChefHat, 
  MessageCircle, 
  User, 
  Search, 
  Play, 
  Headphones, 
  FileText, 
  Sun, 
  CloudRain, 
  Calendar, 
  Stethoscope,
  ChevronRight,
  LogOut,
  Star,
  Lock,
  ArrowRight,
  Sparkles,
  Loader2,
  X
} from 'lucide-react';

// --- API CONFIGURATION ---
const apiKey = ""; // Set API Key here provided by environment

const callGemini = async (prompt, systemInstruction = "") => {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          systemInstruction: { parts: [{ text: systemInstruction }] }
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "Desculpe, não consegui processar isso agora.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Estou tendo dificuldades para conectar com o servidor. Tente novamente mais tarde.";
  }
};

// --- MOCK DATA ---

const MOCK_RECIPES = [
  {
    id: 1,
    title: "Papinha de Abóbora e Carne",
    image: "https://images.unsplash.com/photo-1621855826973-196d21df52e7?auto=format&fit=crop&q=80&w=600",
    ageMonths: 6,
    tags: ["Ferro", "Almoço"],
    weather: "any",
    type: "video",
    prepTime: "20 min",
    content: "Cozinhe a abóbora no vapor. Grelhe a carne moída magra. Amasse tudo com um garfo (não liquidificar). Adicione um fio de azeite."
  },
  {
    id: 2,
    title: "Sopa Creme de Mandioquinha",
    image: "https://images.unsplash.com/photo-1547592166-23acbe3b624b?auto=format&fit=crop&q=80&w=600",
    ageMonths: 8,
    tags: ["Jantar", "Conforto"],
    weather: "cold",
    type: "audio",
    prepTime: "30 min",
    content: "Ideal para dias frios. Cozinhe a mandioquinha até desmanchar. Adicione frango desfiado bem pequeno."
  },
  {
    id: 3,
    title: "Picolé de Leite Materno e Frutas",
    image: "https://images.unsplash.com/photo-1505576399279-565b52d4ac71?auto=format&fit=crop&q=80&w=600",
    ageMonths: 6,
    tags: ["Alívio Dentição", "Lanche"],
    weather: "hot",
    type: "text",
    prepTime: "5 min",
    content: "Misture o leite com pedaços de morango ou manga. Coloque em forminhas de picolé próprias para bebês. Ajuda a aliviar a gengiva."
  },
  {
    id: 4,
    title: "Omelete de Forno com Legumes",
    image: "https://images.unsplash.com/photo-1510693206972-df098062cb71?auto=format&fit=crop&q=80&w=600",
    ageMonths: 12,
    tags: ["Proteína", "BLW"],
    weather: "any",
    type: "video",
    prepTime: "15 min",
    content: "Bata 2 ovos, misture cenoura ralada e brócolis picadinho. Asse em forminhas de muffin por 15 min."
  },
  {
    id: 5,
    title: "Purê de Pera com Canela",
    image: "https://images.unsplash.com/photo-1632163957548-18e3848b528e?auto=format&fit=crop&q=80&w=600",
    ageMonths: 6,
    tags: ["Sobremesa", "Digestão"],
    weather: "any",
    type: "text",
    prepTime: "10 min",
    content: "Cozinhe a pera descascada com um pau de canela. Retire a canela e amasse a fruta."
  }
];

const PROFESSIONALS = [
  { id: 1, name: "Dra. Ana Clara", role: "Pediatra", specialty: "Introdução Alimentar", avatar: "https://i.pravatar.cc/150?u=1" },
  { id: 2, name: "Nutri. Marcos Silva", role: "Nutricionista", specialty: "Alergias Alimentares", avatar: "https://i.pravatar.cc/150?u=2" },
  { id: 3, name: "Dr. Roberto", role: "Psicólogo Infantil", specialty: "Seletividade Alimentar", avatar: "https://i.pravatar.cc/150?u=3" },
];

// --- COMPONENTS ---

const Button = ({ children, onClick, variant = "primary", className = "", icon: Icon, disabled }) => {
  const baseStyle = "px-4 py-3 rounded-xl font-medium flex items-center justify-center transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-emerald-500 text-white shadow-lg shadow-emerald-200 hover:bg-emerald-600",
    secondary: "bg-white text-emerald-600 border border-emerald-100 hover:bg-emerald-50",
    ghost: "bg-transparent text-gray-500 hover:bg-gray-100",
    outline: "border-2 border-emerald-500 text-emerald-600 bg-transparent",
    magic: "bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-200 hover:from-purple-600 hover:to-indigo-700"
  };

  return (
    <button onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant]} ${className}`}>
      {Icon && <Icon size={18} className="mr-2" />}
      {children}
    </button>
  );
};

const Tag = ({ children, active }) => (
  <span className={`text-xs px-2 py-1 rounded-full border ${active ? 'bg-emerald-100 border-emerald-300 text-emerald-800' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
    {children}
  </span>
);

// --- MAIN APP COMPONENT ---

export default function BebeFoodApp() {
  // State
  const [user, setUser] = useState(null); // Null = not logged in
  const [activeTab, setActiveTab] = useState('home');
  const [favorites, setFavorites] = useState([]);
  const [doneRecipes, setDoneRecipes] = useState([]);
  const [chatHistory, setChatHistory] = useState([{ sender: 'bot', text: "Olá! Sou a Jeey, sua assistente virtual. Posso ajudar com dicas de receitas, dúvidas sobre introdução alimentar ou te conectar com um profissional. Sobre o que quer falar hoje?" }]);
  const [inputText, setInputText] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [babyAge, setBabyAge] = useState(6); // Default 6 months
  const [weather] = useState("hot"); // Mock weather (hot/cold)
  
  // Magic Recipe States
  const [showMagicModal, setShowMagicModal] = useState(false);
  const [magicIngredients, setMagicIngredients] = useState("");
  const [magicRecipe, setMagicRecipe] = useState(null);
  const [isMagicLoading, setIsMagicLoading] = useState(false);

  const chatEndRef = useRef(null);

  // Load persistence
  useEffect(() => {
    const savedFavs = localStorage.getItem('bebeFood_favs');
    const savedDone = localStorage.getItem('bebeFood_done');
    const savedUser = localStorage.getItem('bebeFood_user');
    
    if (savedFavs) setFavorites(JSON.parse(savedFavs));
    if (savedDone) setDoneRecipes(JSON.parse(savedDone));
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  // Save persistence
  useEffect(() => {
    localStorage.setItem('bebeFood_favs', JSON.stringify(favorites));
    localStorage.setItem('bebeFood_done', JSON.stringify(doneRecipes));
    if (user) localStorage.setItem('bebeFood_user', JSON.stringify(user));
  }, [favorites, doneRecipes, user]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (activeTab === 'jeey') scrollToBottom();
  }, [chatHistory, activeTab, isChatLoading]);

  // Actions
  const handleLogin = (e) => {
    e.preventDefault();
    setUser({ name: "Mamãe", isPremium: false }); // Start as free, prompt upgrade later
  };

  const handleSubscribe = () => {
    setUser({ ...user, isPremium: true });
    alert("Assinatura confirmada! Bem-vindo ao plano Premium.");
  };

  const toggleFavorite = (id) => {
    if (favorites.includes(id)) {
      setFavorites(favorites.filter(favId => favId !== id));
    } else {
      setFavorites([...favorites, id]);
    }
  };

  const markAsDone = (id) => {
    if (!doneRecipes.includes(id)) {
      setDoneRecipes([...doneRecipes, id]);
    }
  };

  const handleChatSend = async () => {
    if (!inputText.trim()) return;

    const userMsg = { sender: 'user', text: inputText };
    setChatHistory(prev => [...prev, userMsg]);
    setInputText('');
    setIsChatLoading(true);

    const systemPrompt = "Você é a Jeey, uma assistente virtual especializada, gentil e carinhosa do aplicativo 'BebéFood.IA'. Seu público são mães e pais. Responda dúvidas sobre alimentação infantil, introdução alimentar e gravidez. Use emojis. Se a pergunta for médica grave (ex: febre muito alta, engasgo severo), recomende procurar um médico urgentemente. Respostas curtas e úteis.";
    
    const response = await callGemini(inputText, systemPrompt);
    
    setChatHistory(prev => [...prev, { sender: 'bot', text: response }]);
    setIsChatLoading(false);
  };

  const handleMagicRecipeGen = async () => {
    if (!magicIngredients.trim()) return;
    
    setIsMagicLoading(true);
    setMagicRecipe(null);

    const prompt = `Crie uma receita segura e saudável para um bebê de ${babyAge} meses usando estes ingredientes principais: ${magicIngredients}. Retorne APENAS um JSON válido com este formato: { "title": "Nome da Receita", "prepTime": "Tempo", "content": "Instruções passo a passo curtas", "tags": ["tag1", "tag2"] }. Não use markdown, apenas o JSON raw.`;

    try {
      const result = await callGemini(prompt, "Você é um chef nutricionista infantil.");
      // Simple clean up for JSON parsing if the model adds markdown
      const cleanJson = result.replace(/```json|```/g, '').trim();
      const recipeData = JSON.parse(cleanJson);
      
      setMagicRecipe({
        id: Date.now(), // Generate temp ID
        ...recipeData,
        image: "https://images.unsplash.com/photo-1598511757337-fe2cafc31ba0?auto=format&fit=crop&q=80&w=600", // Default generic food image
        ageMonths: babyAge,
        type: "text"
      });
    } catch (e) {
      setMagicRecipe({
        error: true,
        title: "Ops!",
        content: "Não consegui criar uma receita com esses ingredientes. Tente algo mais simples como 'batata e frango'."
      });
    }
    
    setIsMagicLoading(false);
  };

  // --- VIEWS ---

  const LoginView = () => (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-orange-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 text-center">
        <div className="bg-emerald-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <ChefHat size={40} className="text-emerald-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">BebéFood.IA</h1>
        <p className="text-gray-500 mb-8">Nutrição inteligente para o crescimento saudável do seu bebê.</p>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <input 
            type="email" 
            placeholder="Seu e-mail" 
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            required
          />
          <input 
            type="password" 
            placeholder="Senha" 
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            required
          />
          <Button type="submit" className="w-full">Entrar</Button>
        </form>
        <p className="mt-6 text-xs text-gray-400">Ao entrar, você concorda com nossos Termos de Uso.</p>
      </div>
    </div>
  );

  const SubscribeModal = () => (
    <div className="p-6 bg-orange-50 rounded-2xl border border-orange-100 mb-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-orange-800 flex items-center">
            <Star className="fill-orange-500 text-orange-500 mr-2" size={20} />
            Plano Premium
          </h3>
          <p className="text-sm text-orange-700 mt-1">Acesso ilimitado a IA, profissionais e análises.</p>
        </div>
        <span className="bg-white px-3 py-1 rounded-lg font-bold text-orange-600 shadow-sm text-sm">
          R$13/mês
        </span>
      </div>
      <ul className="text-sm text-orange-800 space-y-2 mb-4">
        <li className="flex items-center"><CheckCircle size={14} className="mr-2" /> Consultas ilimitadas com Jeey (IA)</li>
        <li className="flex items-center"><CheckCircle size={14} className="mr-2" /> Receitas Mágicas com IA</li>
        <li className="flex items-center"><CheckCircle size={14} className="mr-2" /> Análise de preparo</li>
      </ul>
      <Button onClick={handleSubscribe} variant="primary" className="w-full bg-orange-500 hover:bg-orange-600 shadow-orange-200">
        Assinar Agora
      </Button>
    </div>
  );

  const RecipeCard = ({ recipe }) => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-4 transition-all hover:shadow-md">
      <div className="relative h-40">
        <img src={recipe.image} alt={recipe.title} className="w-full h-full object-cover" />
        <div className="absolute top-2 right-2 flex space-x-2">
          <button 
            onClick={() => toggleFavorite(recipe.id)}
            className="p-2 bg-white/90 backdrop-blur rounded-full shadow-sm text-gray-500 hover:text-red-500 transition-colors"
          >
            <Heart size={18} className={favorites.includes(recipe.id) ? "fill-red-500 text-red-500" : ""} />
          </button>
        </div>
        <div className="absolute bottom-2 left-2 flex gap-1">
           {recipe.type === 'video' && <span className="px-2 py-1 bg-black/50 text-white text-xs rounded-lg flex items-center backdrop-blur-sm"><Play size={10} className="mr-1"/> Vídeo</span>}
           {recipe.type === 'audio' && <span className="px-2 py-1 bg-black/50 text-white text-xs rounded-lg flex items-center backdrop-blur-sm"><Headphones size={10} className="mr-1"/> Áudio</span>}
           {recipe.type === 'text' && <span className="px-2 py-1 bg-black/50 text-white text-xs rounded-lg flex items-center backdrop-blur-sm"><FileText size={10} className="mr-1"/> Texto</span>}
        </div>
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-gray-800">{recipe.title}</h3>
          <span className="text-xs font-semibold bg-emerald-100 text-emerald-700 px-2 py-1 rounded">{recipe.prepTime}</span>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-3">
          {recipe.tags?.map(tag => (
            <span key={tag} className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-md">{tag}</span>
          ))}
        </div>

        {/* Content Preview if available */}
        {recipe.content && (
            <p className="text-xs text-gray-500 mb-3 line-clamp-2">{recipe.content}</p>
        )}

        <div className="flex items-center justify-between mt-2">
          <div className="text-xs text-gray-400">Indicado: {recipe.ageMonths}m+</div>
          <button 
            onClick={() => markAsDone(recipe.id)}
            className={`flex items-center text-sm font-medium ${doneRecipes.includes(recipe.id) ? 'text-emerald-600' : 'text-gray-400 hover:text-emerald-500'}`}
          >
            <CheckCircle size={16} className="mr-1" />
            {doneRecipes.includes(recipe.id) ? "Feito!" : "Marcar feito"}
          </button>
        </div>
      </div>
    </div>
  );

  const MagicRecipeModal = () => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md p-6 relative animate-in fade-in zoom-in duration-300">
        <button onClick={() => setShowMagicModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X size={24} />
        </button>
        
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
             <Sparkles className="text-purple-600" size={30} />
          </div>
          <h3 className="text-xl font-bold text-purple-900">Cozinha Mágica</h3>
          <p className="text-sm text-gray-500">Diga o que você tem, a IA cria a receita.</p>
        </div>

        {!magicRecipe && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ingredientes disponíveis:</label>
              <textarea 
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                rows={3}
                placeholder="Ex: Batata doce, peito de frango, espinafre..."
                value={magicIngredients}
                onChange={(e) => setMagicIngredients(e.target.value)}
              ></textarea>
            </div>
            <Button 
              variant="magic" 
              className="w-full" 
              onClick={handleMagicRecipeGen}
              disabled={isMagicLoading || !magicIngredients}
            >
              {isMagicLoading ? (
                <>
                  <Loader2 className="animate-spin mr-2" /> Criando Mágica...
                </>
              ) : (
                <>
                  <Sparkles size={18} className="mr-2" /> Gerar Receita
                </>
              )}
            </Button>
          </div>
        )}

        {magicRecipe && (
          <div className="space-y-4">
            {!magicRecipe.error ? (
                <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                    <h4 className="font-bold text-purple-900 text-lg mb-1">{magicRecipe.title}</h4>
                    <div className="flex gap-2 text-xs text-purple-700 mb-3">
                        <span className="bg-purple-200 px-2 py-1 rounded-md">{magicRecipe.prepTime}</span>
                        <span className="bg-purple-200 px-2 py-1 rounded-md">{magicRecipe.ageMonths}m+</span>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{magicRecipe.content}</p>
                </div>
            ) : (
                <div className="text-center text-red-500 p-4">
                    <p>{magicRecipe.content}</p>
                </div>
            )}
            
            <Button 
                variant="outline" 
                className="w-full border-purple-200 text-purple-600 hover:bg-purple-50"
                onClick={() => setMagicRecipe(null)}
            >
                Criar outra
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  const HomeView = () => {
    // Logic for smart suggestions
    const suggestedRecipes = MOCK_RECIPES.filter(r => 
      (r.weather === weather || r.weather === 'any') && 
      r.ageMonths <= babyAge
    ).slice(0, 3);

    return (
      <div className="pb-24">
        <header className="px-6 pt-12 pb-6 bg-white sticky top-0 z-10 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Olá, {user.name}</h1>
              <p className="text-sm text-gray-500">Hoje é dia de nutrição!</p>
            </div>
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
              <User size={20} />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl flex justify-between items-center text-blue-800">
            <div className="flex items-center">
              {weather === 'hot' ? <Sun className="mr-3 text-orange-400" /> : <CloudRain className="mr-3 text-blue-500" />}
              <div>
                <p className="font-bold text-sm">Clima: {weather === 'hot' ? "Calor" : "Frio"}</p>
                <p className="text-xs opacity-75">Sugerimos hidratação.</p>
              </div>
            </div>
            <span className="text-xs font-bold bg-white/50 px-2 py-1 rounded">28°C</span>
          </div>
        </header>

        <main className="px-6 py-4">
          {!user.isPremium && <SubscribeModal />}

          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-gray-800">Sugestões de Hoje</h2>
            <button className="text-emerald-600 text-sm font-medium" onClick={() => setActiveTab('recipes')}>Ver todas</button>
          </div>

          <div className="space-y-4">
            {suggestedRecipes.map(recipe => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>

          <div className="mt-8 bg-emerald-50 p-6 rounded-2xl flex items-center justify-between cursor-pointer group" onClick={() => setActiveTab('jeey')}>
             <div>
               <h3 className="font-bold text-emerald-800 mb-1 group-hover:text-emerald-600 transition-colors">Dúvidas sobre nutrição?</h3>
               <p className="text-sm text-emerald-600">Fale com a Jeey agora mesmo.</p>
             </div>
             <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-200 group-hover:scale-110 transition-transform">
                <MessageCircle className="text-white" size={24} />
             </div>
          </div>
        </main>
      </div>
    );
  };

  const RecipesView = () => (
    <div className="pb-24 pt-10 px-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Receitas</h2>
        <button 
          onClick={() => setShowMagicModal(true)}
          className="bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center hover:bg-purple-200 transition-colors"
        >
          <Sparkles size={14} className="mr-1" /> Mágica IA
        </button>
      </div>
      
      <div className="relative mb-6">
        <Search className="absolute left-3 top-3 text-gray-400" size={20} />
        <input 
          type="text" 
          placeholder="Buscar ingredientes..." 
          className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-xl border border-transparent focus:bg-white focus:border-emerald-300 focus:outline-none transition-all"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-4 mb-2 no-scrollbar">
        <Tag active>Todas</Tag>
        <Tag>6+ Meses</Tag>
        <Tag>12+ Meses</Tag>
        <Tag>Sem Lactose</Tag>
        <Tag>Vegano</Tag>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Novidades</h3>
          {MOCK_RECIPES.map(recipe => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      </div>
    </div>
  );

  const SavedView = () => {
    const favs = MOCK_RECIPES.filter(r => favorites.includes(r.id));
    const done = MOCK_RECIPES.filter(r => doneRecipes.includes(r.id));

    return (
      <div className="pb-24 pt-10 px-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Minha Cozinha</h2>
        
        <div className="space-y-8">
          <section>
            <h3 className="flex items-center font-bold text-gray-700 mb-4">
              <Heart className="mr-2 text-red-500 fill-red-500" size={20} /> Favoritos ({favs.length})
            </h3>
            {favs.length === 0 ? (
              <p className="text-gray-400 text-sm italic">Você ainda não favoritou nenhuma receita.</p>
            ) : (
              favs.map(r => <RecipeCard key={r.id} recipe={r} />)
            )}
          </section>

          <section>
            <h3 className="flex items-center font-bold text-gray-700 mb-4">
              <CheckCircle className="mr-2 text-emerald-500" size={20} /> Feitos ({done.length})
            </h3>
            {done.length === 0 ? (
              <p className="text-gray-400 text-sm italic">Marque receitas como feitas para criar seu histórico.</p>
            ) : (
              done.map(r => (
                <div key={r.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg mb-2">
                   <span className="text-sm text-gray-700 font-medium">{r.title}</span>
                   <span className="text-xs text-emerald-600 bg-emerald-100 px-2 py-1 rounded">Sucesso</span>
                </div>
              ))
            )}
          </section>
        </div>
      </div>
    );
  };

  const JeeyView = () => (
    <div className="h-screen flex flex-col bg-white">
      <header className="p-4 border-b border-gray-100 flex items-center justify-between pt-10 bg-white z-10">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gradient-to-tr from-emerald-400 to-teal-600 rounded-full flex items-center justify-center text-white font-bold mr-3 shadow-md relative">
            J
            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
               <Sparkles size={10} className="text-yellow-400 fill-yellow-400" />
            </div>
          </div>
          <div>
            <h2 className="font-bold text-gray-800">Jeey</h2>
            <p className="text-xs text-emerald-600 font-medium flex items-center">
              <span className="w-2 h-2 bg-emerald-500 rounded-full mr-1 animate-pulse"></span> Online com IA
            </p>
          </div>
        </div>
        {!user.isPremium && <Lock size={18} className="text-gray-400" />}
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {chatHistory.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
              msg.sender === 'user' 
                ? 'bg-emerald-500 text-white rounded-br-none shadow-md shadow-emerald-200' 
                : 'bg-white text-gray-700 border border-gray-100 rounded-bl-none shadow-sm'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {isChatLoading && (
           <div className="flex justify-start">
             <div className="bg-white p-3 rounded-2xl rounded-bl-none shadow-sm border border-gray-100 flex items-center space-x-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
             </div>
           </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-gray-100 pb-24">
        <div className="relative">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleChatSend()}
            placeholder="Pergunte sobre receitas ou saúde..."
            className="w-full pl-4 pr-12 py-3 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            disabled={!user.isPremium || isChatLoading}
          />
          <button 
            onClick={handleChatSend}
            disabled={!user.isPremium || !inputText.trim() || isChatLoading}
            className={`absolute right-2 top-2 p-1.5 rounded-lg transition-colors ${!user.isPremium ? 'bg-gray-300 text-white' : 'bg-emerald-500 text-white hover:bg-emerald-600'}`}
          >
            <ArrowRight size={20} />
          </button>
        </div>
        {!user.isPremium && (
          <p className="text-center text-xs text-orange-500 mt-2 flex items-center justify-center cursor-pointer" onClick={() => setUser({...user, isPremium: true})}>
            <Lock size={12} className="mr-1"/> Assine para conversar com a Jeey
          </p>
        )}
      </div>
    </div>
  );

  const ProfessionalsView = () => (
    <div className="pb-24 pt-10 px-6 bg-gray-50 min-h-screen">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Profissionais</h2>
      <p className="text-gray-500 text-sm mb-6">Conecte-se com especialistas aprovados.</p>

      <div className="space-y-4">
        {PROFESSIONALS.map(prof => (
          <div key={prof.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
            <img src={prof.avatar} alt={prof.name} className="w-14 h-14 rounded-full object-cover border-2 border-emerald-100" />
            <div className="ml-4 flex-1">
              <h3 className="font-bold text-gray-800">{prof.name}</h3>
              <p className="text-xs text-emerald-600 font-semibold uppercase">{prof.role}</p>
              <p className="text-xs text-gray-400 mt-1">{prof.specialty}</p>
            </div>
            <button className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors">
              <MessageCircle size={20} />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-8 p-6 bg-blue-50 rounded-2xl border border-blue-100 text-center">
        <Stethoscope className="mx-auto text-blue-500 mb-3" size={32} />
        <h3 className="font-bold text-blue-800 mb-1">Precisa de ajuda urgente?</h3>
        <p className="text-sm text-blue-600 mb-3">Nossa IA pode triar seu caso.</p>
        <Button variant="secondary" onClick={() => setActiveTab('jeey')} className="w-full text-sm py-2">Falar com Jeey</Button>
      </div>
    </div>
  );

  // --- NAVIGATION ---

  const NavItem = ({ id, icon: Icon, label }) => {
    const isActive = activeTab === id;
    return (
      <button 
        onClick={() => setActiveTab(id)}
        className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-emerald-600' : 'text-gray-400'}`}
      >
        <Icon size={24} strokeWidth={isActive ? 2.5 : 2} className={`transition-all ${isActive ? '-translate-y-1' : ''}`} />
        <span className="text-[10px] font-medium">{label}</span>
      </button>
    );
  };

  if (!user) return <LoginView />;

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen shadow-2xl overflow-hidden relative font-sans text-gray-900">
      
      {showMagicModal && <MagicRecipeModal />}

      {/* Content Render */}
      <div className="h-full">
        {activeTab === 'home' && <HomeView />}
        {activeTab === 'recipes' && <RecipesView />}
        {activeTab === 'jeey' && <JeeyView />}
        {activeTab === 'saved' && <SavedView />}
        {activeTab === 'professionals' && <ProfessionalsView />}
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 w-full max-w-md bg-white border-t border-gray-100 h-20 px-2 shadow-[0_-5px_15px_rgba(0,0,0,0.02)] flex justify-around items-center z-50">
        <NavItem id="home" icon={ChefHat} label="Início" />
        <NavItem id="recipes" icon={Search} label="Receitas" />
        <div className="relative -top-5">
          <button 
            onClick={() => setActiveTab('jeey')}
            className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 ${activeTab === 'jeey' ? 'bg-emerald-600 text-white ring-4 ring-emerald-100' : 'bg-emerald-500 text-white'}`}
          >
            <MessageCircle size={28} />
          </button>
        </div>
        <NavItem id="saved" icon={Heart} label="Salvos" />
        <NavItem id="professionals" icon={User} label="Pro" />
      </nav>

    </div>
  );
}
