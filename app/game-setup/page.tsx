'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Zap, Users, Target, Shield, Phone, Cloud, Dice6, Carrot as Mirror, Percent, Check, X, ArrowLeft, Crown, Star, Brain, Globe, Book, Gamepad2, Music, Palette, Atom, Lightbulb, Copy, Timer, Trophy, Calendar, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface User {
  id: string;
  username: string;
  achievements: any[];
}

interface Team {
  name: string;
  avatar: string;
  categories: string[];
  tools: Tool[];
  ready: boolean;
}

interface Tool {
  id: string;
  name: string;
  icon: any;
  timing: 'Before' | 'During' | 'After';
  description: string;
  available: boolean;
  color: string;
}

interface GameConfig {
  mode: string;
  teams: {
    teamA: Team;
    teamB: Team;
  };
  status: 'setup' | 'active' | 'ended';
  scores: any;
  tools_used: any;
  double_conditions: any;
  room_code?: string;
  difficulty?: string;
}

interface GameMode {
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  maxCategories: number;
  maxTools: number;
  showTeams: boolean;
  showDifficulty: boolean;
  showCategories: boolean;
  showTools: boolean;
  questionsPerUser: number;
  timeLimit: number;
  autoStart: boolean;
}

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸', rtl: false },
  { code: 'ar', name: 'العربية', flag: '🇸🇦', rtl: true },
];

const translations = {
  en: {
    gameSetup: 'Game Setup',
    quickMatch: 'Quick Match',
    createRoom: 'Create Room',
    practiceMode: 'Practice Mode',
    tournament: 'Tournament',
    dailyChallenge: 'Daily Challenge',
    teamConfiguration: 'Team Configuration',
    categorySelection: 'Category Selection',
    toolSelection: 'Tool Selection',
    difficultySelection: 'Difficulty Selection',
    gameRules: 'Game Rules',
    startGame: 'Start Game',
    teamA: 'Team A',
    teamB: 'Team B',
    teamName: 'Team Name',
    selectAvatar: 'Select Avatar',
    selectCategories: 'Select Categories',
    selectDifficulty: 'Select Difficulty',
    categoriesSelected: 'categories selected',
    availableTools: 'Available Tools',
    toolsAssigned: 'tools assigned',
    maxTools: 'Max tools per mode',
    ready: 'Ready',
    notReady: 'Not Ready',
    bothTeamsReady: 'Both teams must be ready to start',
    gameStarting: 'Game Starting...',
    backToMenu: 'Back to Menu',
    roomCode: 'Room Code',
    shareRoom: 'Share Room',
    copyCode: 'Copy Code',
    codeCopied: 'Room code copied!',
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard',
    pointSystem: 'Point System',
    easyPoints: 'Easy: 100 points',
    mediumPoints: 'Medium: 200 points',
    hardPoints: 'Hard: 400 points',
    doubleCondition: 'Double Condition',
    doubleConditionDesc: 'Special rounds that double your points if you meet the condition',
    toolUsage: 'Tool Usage',
    toolUsageDesc: 'Each tool can only be used once per game',
    achievements: 'Achievement Criteria',
    achievementsDesc: 'Complete challenges to unlock new tools and rewards',
    loading: 'Loading...',
    autoStarting: 'Auto-starting in 3 seconds...',
    dailyBonus: 'Daily Bonus: 50 coins on completion!',
    questionsPerUser: 'questions per user',
    timeLimit: 'seconds per question',
  },
  ar: {
    gameSetup: 'إعداد اللعبة',
    quickMatch: 'مباراة سريعة',
    createRoom: 'إنشاء غرفة',
    practiceMode: 'وضع التدريب',
    tournament: 'البطولة',
    dailyChallenge: 'التحدي اليومي',
    teamConfiguration: 'تكوين الفريق',
    categorySelection: 'اختيار الفئة',
    toolSelection: 'اختيار الأدوات',
    difficultySelection: 'اختيار الصعوبة',
    gameRules: 'قواعد اللعبة',
    startGame: 'بدء اللعبة',
    teamA: 'الفريق أ',
    teamB: 'الفريق ب',
    teamName: 'اسم الفريق',
    selectAvatar: 'اختر الصورة الرمزية',
    selectCategories: 'اختر الفئات',
    selectDifficulty: 'اختر الصعوبة',
    categoriesSelected: 'فئات مختارة',
    availableTools: 'الأدوات المتاحة',
    toolsAssigned: 'أدوات مخصصة',
    maxTools: 'حد أقصى للأدوات حسب الوضع',
    ready: 'جاهز',
    notReady: 'غير جاهز',
    bothTeamsReady: 'يجب أن يكون كلا الفريقين جاهزين للبدء',
    gameStarting: 'بدء اللعبة...',
    backToMenu: 'العودة للقائمة',
    roomCode: 'رمز الغرفة',
    shareRoom: 'مشاركة الغرفة',
    copyCode: 'نسخ الرمز',
    codeCopied: 'تم نسخ رمز الغرفة!',
    easy: 'سهل',
    medium: 'متوسط',
    hard: 'صعب',
    pointSystem: 'نظام النقاط',
    easyPoints: 'سهل: 100 نقطة',
    mediumPoints: 'متوسط: 200 نقطة',
    hardPoints: 'صعب: 400 نقطة',
    doubleCondition: 'الشرط المضاعف',
    doubleConditionDesc: 'جولات خاصة تضاعف نقاطك إذا استوفيت الشرط',
    toolUsage: 'استخدام الأدوات',
    toolUsageDesc: 'كل أداة يمكن استخدامها مرة واحدة فقط في اللعبة',
    achievements: 'معايير الإنجاز',
    achievementsDesc: 'أكمل التحديات لفتح أدوات ومكافآت جديدة',
    loading: 'جاري التحميل...',
    autoStarting: 'البدء التلقائي خلال 3 ثوان...',
    dailyBonus: 'مكافأة يومية: 50 عملة عند الإكمال!',
    questionsPerUser: 'أسئلة لكل مستخدم',
    timeLimit: 'ثانية لكل سؤال',
  },
};

const gameModes: { [key: string]: GameMode } = {
  quick: {
    id: 'quick',
    name: 'Quick Match',
    description: '1vs1 online multiplayer with matchmaking',
    icon: Zap,
    color: 'from-blue-500 to-cyan-600',
    maxCategories: 2,
    maxTools: 2,
    showTeams: true,
    showDifficulty: true,
    showCategories: true,
    showTools: true,
    questionsPerUser: 4,
    timeLimit: 30,
    autoStart: false,
  },
  custom: {
    id: 'custom',
    name: 'Create Room',
    description: 'Private 1vs1 with room code',
    icon: Users,
    color: 'from-purple-500 to-violet-600',
    maxCategories: 3,
    maxTools: 3,
    showTeams: true,
    showDifficulty: true,
    showCategories: true,
    showTools: true,
    questionsPerUser: 6,
    timeLimit: 30,
    autoStart: false,
  },
  practice: {
    id: 'practice',
    name: 'Practice Mode',
    description: 'Solo practice session',
    icon: Brain,
    color: 'from-green-500 to-emerald-600',
    maxCategories: 2,
    maxTools: 2,
    showTeams: false,
    showDifficulty: true,
    showCategories: true,
    showTools: true,
    questionsPerUser: 4,
    timeLimit: 30,
    autoStart: false,
  },
  tournament: {
    id: 'tournament',
    name: 'Tournament',
    description: 'Multi-team bracket competition',
    icon: Crown,
    color: 'from-yellow-500 to-orange-600',
    maxCategories: 4,
    maxTools: 3,
    showTeams: true,
    showDifficulty: false,
    showCategories: true,
    showTools: true,
    questionsPerUser: 8,
    timeLimit: 30,
    autoStart: false,
  },
  daily: {
    id: 'daily',
    name: 'Daily Challenge',
    description: 'Daily bonus challenge',
    icon: Calendar,
    color: 'from-indigo-500 to-purple-600',
    maxCategories: 0,
    maxTools: 0,
    showTeams: false,
    showDifficulty: false,
    showCategories: false,
    showTools: false,
    questionsPerUser: 5,
    timeLimit: 30,
    autoStart: true,
  },
};

const categories = [
  { id: 'science', name: 'Science', icon: Atom, color: 'from-green-500 to-emerald-600' },
  { id: 'history', name: 'History', icon: Book, color: 'from-amber-500 to-orange-600' },
  { id: 'sports', name: 'Sports', icon: Target, color: 'from-red-500 to-pink-600' },
  { id: 'technology', name: 'Technology', icon: Lightbulb, color: 'from-blue-500 to-cyan-600' },
  { id: 'arts', name: 'Arts', icon: Palette, color: 'from-purple-500 to-violet-600' },
  { id: 'music', name: 'Music', icon: Music, color: 'from-indigo-500 to-blue-600' },
  { id: 'geography', name: 'Geography', icon: Globe, color: 'from-teal-500 to-green-600' },
  { id: 'entertainment', name: 'Entertainment', icon: Gamepad2, color: 'from-pink-500 to-rose-600' },
];

const availableTools: Tool[] = [
  {
    id: 'strike',
    name: 'Strike',
    icon: Zap,
    timing: 'During',
    description: 'Remove one wrong answer with red lightning',
    available: true,
    color: 'from-red-500 to-red-600'
  },
  {
    id: 'pit',
    name: 'The PIT',
    icon: Shield,
    timing: 'Before',
    description: 'Protect your team from opponent tools',
    available: true,
    color: 'from-purple-500 to-purple-600'
  },
  {
    id: 'call-friend',
    name: 'Call a Friend',
    icon: Phone,
    timing: 'During',
    description: 'Get help from an AI assistant',
    available: true,
    color: 'from-green-500 to-green-600'
  },
  {
    id: 'storm',
    name: 'Storm',
    icon: Cloud,
    timing: 'After',
    description: 'Steal points from opponent team',
    available: false,
    color: 'from-blue-500 to-blue-600'
  },
  {
    id: 'gamble',
    name: 'Gamble',
    icon: Dice6,
    timing: 'Before',
    description: 'Risk points for double or nothing',
    available: false,
    color: 'from-yellow-500 to-yellow-600'
  },
  {
    id: 'mirror',
    name: 'Mirror',
    icon: Mirror,
    timing: 'During',
    description: 'Copy opponent team\'s last answer',
    available: false,
    color: 'from-cyan-500 to-cyan-600'
  },
  {
    id: 'fifty-fifty',
    name: '50/50',
    icon: Percent,
    timing: 'During',
    description: 'Remove two wrong answers',
    available: true,
    color: 'from-orange-500 to-orange-600'
  },
];

const avatars = [
  '⚡', '🔥', '💎', '🌟', '🚀', '🎯', '🏆', '👑', '🦄', '🐉'
];

const difficulties = [
  { id: 'easy', name: 'Easy', color: 'from-green-500 to-green-600', points: 100 },
  { id: 'medium', name: 'Medium', color: 'from-yellow-500 to-yellow-600', points: 200 },
  { id: 'hard', name: 'Hard', color: 'from-red-500 to-red-600', points: 400 },
];

export default function GameSetup() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const gameMode = searchParams.get('mode') || 'quick';
  
  const [currentLang, setCurrentLang] = useState<string>('en');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDifficulty, setSelectedDifficulty] = useState('medium');
  const [gameConfig, setGameConfig] = useState<GameConfig>({
    mode: gameMode,
    teams: {
      teamA: {
        name: '',
        avatar: '⚡',
        categories: [],
        tools: [],
        ready: false
      },
      teamB: {
        name: '',
        avatar: '🔥',
        categories: [],
        tools: [],
        ready: false
      }
    },
    status: 'setup',
    scores: {},
    tools_used: {},
    double_conditions: {},
    room_code: '',
    difficulty: 'medium'
  });
  const [draggedTool, setDraggedTool] = useState<Tool | null>(null);
  const [startingGame, setStartingGame] = useState(false);
  const [autoStartCountdown, setAutoStartCountdown] = useState(0);
  const [currentTurn, setCurrentTurn] = useState<'teamA' | 'teamB'>('teamA');
  const [matchmaking, setMatchmaking] = useState(false);
  const [matchFound, setMatchFound] = useState(false);

  const currentMode = gameModes[gameMode] || gameModes.quick;
  const t = translations[currentLang as keyof typeof translations];
  const isRTL = languages.find(lang => lang.code === currentLang)?.rtl || false;

  useEffect(() => {
    const savedLang = localStorage.getItem('language') || 'en';
    setCurrentLang(savedLang);
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = currentLang;
  }, [currentLang, isRTL]);

  useEffect(() => {
    checkUser();
    if (gameMode === 'custom') {
      generateRoomCode();
    }
    if (gameMode === 'daily') {
      handleAutoStart();
    }
  }, [gameMode]);

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (userData) {
          setUser({
            id: userData.id,
            username: userData.username,
            achievements: []
          });
        }
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateRoomCode = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setGameConfig(prev => ({ ...prev, room_code: code }));
  };

  const copyRoomCode = () => {
    if (gameConfig.room_code) {
      navigator.clipboard.writeText(gameConfig.room_code);
      toast.success(t.codeCopied);
    }
  };

  const handleAutoStart = () => {
    setAutoStartCountdown(3);
    const interval = setInterval(() => {
      setAutoStartCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          startGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const switchLanguage = (langCode: string) => {
    setCurrentLang(langCode);
    localStorage.setItem('language', langCode);
  };

  const updateTeam = (team: 'teamA' | 'teamB', updates: Partial<Team>) => {
    setGameConfig(prev => ({
      ...prev,
      teams: {
        ...prev.teams,
        [team]: {
          ...prev.teams[team],
          ...updates
        }
      }
    }));
  };

  const selectCategory = (team: 'teamA' | 'teamB', categoryId: string) => {
    const currentCategories = gameConfig.teams[team].categories;
    const otherTeamCategories = gameConfig.teams[team === 'teamA' ? 'teamB' : 'teamA'].categories;
    
    if (currentCategories.includes(categoryId)) {
      // Remove category
      updateTeam(team, {
        categories: currentCategories.filter(id => id !== categoryId)
      });
    } else if (currentCategories.length < currentMode.maxCategories && !otherTeamCategories.includes(categoryId)) {
      // Add category if not at limit and not selected by other team
      updateTeam(team, {
        categories: [...currentCategories, categoryId]
      });
    } else if (otherTeamCategories.includes(categoryId)) {
      toast.error('Category already selected by other team');
    } else {
      toast.error(`Maximum ${currentMode.maxCategories} categories per team`);
    }
  };

  const selectTool = (tool: Tool) => {
    if (!tool.available) {
      toast.error('Tool is locked');
      return;
    }
    
    // For single player modes, assign to teamA
    const targetTeam = currentMode.showTeams ? currentTurn : 'teamA';
    const currentTools = gameConfig.teams[targetTeam].tools;
    
    if (currentTools.find(t => t.id === tool.id)) {
      // Remove tool if already selected
      updateTeam(targetTeam, {
        tools: currentTools.filter(t => t.id !== tool.id)
      });
      
      // Switch turns in multiplayer after deselection
      if (currentMode.showTeams && gameMode !== 'quick') {
        switchTurn();
      }
    } else if (currentTools.length < currentMode.maxTools) {
      // Add tool if under limit
      updateTeam(targetTeam, {
        tools: [...currentTools, tool]
      });
      
      // Switch turns in multiplayer after selection
      if (currentMode.showTeams && gameMode !== 'quick') {
        switchTurn();
      }
    } else {
      toast.error(`Maximum ${currentMode.maxTools} tools allowed`);
    }
  };

  const switchTurn = () => {
    setCurrentTurn(prev => prev === 'teamA' ? 'teamB' : 'teamA');
  };

  const isToolSelected = (toolId: string, team: 'teamA' | 'teamB' = 'teamA') => {
    return gameConfig.teams[team].tools.some(tool => tool.id === toolId);
  };
  const handleDragStart = (tool: Tool) => {
    if (!tool.available) return;
    setDraggedTool(tool);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, team: 'teamA' | 'teamB') => {
    e.preventDefault();
    if (!draggedTool || !draggedTool.available) return;

    const currentTools = gameConfig.teams[team].tools;
    if (currentTools.length >= currentMode.maxTools) {
      toast.error(`Max ${currentMode.maxTools} tools per team`);
      return;
    }

    if (currentTools.find(tool => tool.id === draggedTool.id)) {
      toast.error('Tool already assigned');
      return;
    }

    updateTeam(team, {
      tools: [...currentTools, draggedTool]
    });
    setDraggedTool(null);
  };

  const removeTool = (team: 'teamA' | 'teamB', toolId: string) => {
    const currentTools = gameConfig.teams[team].tools;
    updateTeam(team, {
      tools: currentTools.filter(tool => tool.id !== toolId)
    });
  };

  const toggleReady = (team: 'teamA' | 'teamB') => {
    const teamData = gameConfig.teams[team];
    const isConfigComplete = teamData.name.trim() !== '' && 
                            teamData.categories.length === currentMode.maxCategories && 
                            teamData.tools.length <= currentMode.maxTools;
    
    if (!isConfigComplete && !teamData.ready) {
      toast.error('Complete team configuration first');
      return;
    }

    updateTeam(team, { ready: !teamData.ready });
  };

  const canStartGame = () => {
    if (currentMode.autoStart) return true;
    if (!currentMode.showTeams) return selectedDifficulty !== '';
    if (gameMode === 'quick') return selectedDifficulty !== '';
    return gameConfig.teams.teamA.ready && gameConfig.teams.teamB.ready;
  };

  const startGame = async () => {
    if (!canStartGame()) {
      toast.error(t.bothTeamsReady);
      return;
    }

    setStartingGame(true);
    
    try {
      // Create game in Supabase
      const { data: gameData, error } = await supabase
        .from('games')
        .insert({
          teams: currentMode.showTeams && gameMode !== 'quick' ? gameConfig.teams : {},
          status: 'setup',
          scores: gameConfig.scores,
          tools_used: gameConfig.tools_used,
          double_conditions: gameConfig.double_conditions
        })
        .select()
        .single();

      if (error) throw error;

      toast.success(t.gameStarting);
      
      // Simulate countdown
      setTimeout(() => {
        router.push(`/game?id=${gameData.id}&mode=${gameMode}`);
      }, 3000);
      
    } catch (error) {
      console.error('Error creating game:', error);
      toast.error('Failed to start game');
      setStartingGame(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p>{t.loading}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    router.push('/auth');
    return null;
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 relative page-container ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Animated Background */}
      <div className="absolute inset-0">
        {/* Neural Network Pattern */}
        <div className="absolute inset-0 opacity-10">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className={`absolute w-px h-px rounded-full animate-pulse ${
                i % 3 === 0 ? 'bg-purple-400' : i % 3 === 1 ? 'bg-blue-400' : 'bg-yellow-400'
              }`}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Header */}
      <div className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            {/* Back Button & Title */}
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => router.push('/main')}
                className="text-black-force border-white/20 hover:bg-white/10"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t.backToMenu}
              </Button>
              <div className="flex items-center gap-3">
                <div className={`p-2 bg-gradient-to-r ${currentMode.color} rounded-lg`}>
                  <currentMode.icon className="w-6 h-6 text-white-force" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-blue-400 bg-clip-text text-transparent">
                    {t[currentMode.id as keyof typeof t] || currentMode.name}
                  </h1>
                  <p className="text-black-force text-sm">{currentMode.description}</p>
                </div>
              </div>
            </div>

            {/* Language Toggle */}
            <div className="flex gap-2 bg-white/10 backdrop-blur-md rounded-lg p-2">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => switchLanguage(lang.code)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md transition-all duration-300 ${
                    currentLang === lang.code
                      ? 'bg-blue-500 text-white shadow-lg scale-105'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span className="text-lg">{lang.flag}</span>
                  <span className="text-sm font-medium">{lang.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Mode Info */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20 mb-8">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                <div className="flex items-center justify-center gap-2">
                  <Timer className="w-5 h-5 text-blue-400" />
                  <span className="text-black-force">{currentMode.timeLimit} {t.timeLimit}</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Target className="w-5 h-5 text-green-400" />
                  <span className="text-black-force">{currentMode.questionsPerUser} {t.questionsPerUser}</span>
                </div>
                {gameMode === 'custom' && gameConfig.room_code && (
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-black-force">{t.roomCode}:</span>
                    <Badge className="bg-blue-500 text-white-force font-mono text-lg">
                      {gameConfig.room_code}
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={copyRoomCode}
                      className="text-black-force hover:text-black-force"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                {gameMode === 'daily' && (
                  <div className="flex items-center justify-center gap-2">
                    <Star className="w-5 h-5 text-yellow-400" />
                    <span className="text-yellow-400">{t.dailyBonus}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Auto Start Countdown for Daily Challenge */}
          {gameMode === 'daily' && autoStartCountdown > 0 && (
            <Card className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-md border-yellow-400/30 mb-8">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center gap-3">
                  <div className="w-8 h-8 border-4 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin"></div>
                  <span className="text-yellow-400 text-xl font-bold">
                    {t.autoStarting} {autoStartCountdown}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Main Content */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
            {/* Configuration Panel */}
            <div className="xl:col-span-2 space-y-6">
              {/* Difficulty Selection */}
              {currentMode.showDifficulty && (
                <Card className="bg-white/10 backdrop-blur-md border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white">{t.difficultySelection}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      {difficulties.map((difficulty) => (
                        <button
                          key={difficulty.id}
                          onClick={() => setSelectedDifficulty(difficulty.id)}
                          className={`p-4 rounded-lg transition-all duration-300 ${
                            selectedDifficulty === difficulty.id
                              ? `bg-gradient-to-r ${difficulty.color} text-white scale-105 shadow-lg`
                              : 'bg-white/10 text-white hover:bg-white/20 hover:scale-105'
                          }`}
                        >
                          <div className="text-center">
                            <div className="text-lg font-bold">{t[difficulty.id as keyof typeof t]}</div>
                            <div className="text-sm opacity-80">{difficulty.points} pts</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Team Configuration */}
              {currentMode.showTeams && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-white mb-4">{t.teamConfiguration}</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Team A */}
                    <Card 
                      className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 backdrop-blur-md border-blue-400/30 hover:border-blue-400/60 transition-all duration-300"
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, 'teamA')}
                    >
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between text-white">
                          <span className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-blue-400" />
                            {t.teamA}
                          </span>
                          <Button
                            size="sm"
                            onClick={() => toggleReady('teamA')}
                            className={`${
                              gameConfig.teams.teamA.ready 
                                ? 'bg-green-600 hover:bg-green-700' 
                                : 'bg-gray-600 hover:bg-gray-700'
                            }`}
                          >
                            {gameConfig.teams.teamA.ready ? (
                              <>
                                <Check className="w-4 h-4 mr-1" />
                                {t.ready}
                              </>
                            ) : (
                              <>
                                <X className="w-4 h-4 mr-1" />
                                {t.notReady}
                              </>
                            )}
                          </Button>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Team Name */}
                        <Input
                          placeholder={t.teamName}
                          value={gameConfig.teams.teamA.name}
                          onChange={(e) => updateTeam('teamA', { name: e.target.value })}
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                          maxLength={20}
                        />
                        
                        {/* Avatar Selection */}
                        <div className="space-y-2">
                          <label className="text-sm text-white/80">{t.selectAvatar}</label>
                          <div className="flex flex-wrap gap-2">
                            {avatars.map((avatar) => (
                              <button
                                key={avatar}
                                onClick={() => updateTeam('teamA', { avatar })}
                                className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all duration-300 ${
                                  gameConfig.teams.teamA.avatar === avatar
                                    ? 'bg-blue-500 scale-110 shadow-lg'
                                    : 'bg-white/10 hover:bg-white/20'
                                }`}
                              >
                                {avatar}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Categories */}
                        {currentMode.showCategories && (
                          <div className="space-y-2">
                            <label className="text-sm text-white/80">
                              {t.selectCategories} ({gameConfig.teams.teamA.categories.length}/{currentMode.maxCategories})
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {gameConfig.teams.teamA.categories.map((categoryId) => {
                                const category = categories.find(c => c.id === categoryId);
                                return category ? (
                                  <Badge key={categoryId} className="bg-blue-500 text-white">
                                    {category.name}
                                  </Badge>
                                ) : null;
                              })}
                            </div>
                          </div>
                        )}

                        {/* Tools */}
                        {currentMode.showTools && (
                          <div className="space-y-2">
                            <label className="text-sm text-white/80">
                              {t.toolsAssigned} ({gameConfig.teams.teamA.tools.length}/{currentMode.maxTools})
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {gameConfig.teams.teamA.tools.map((tool) => (
                                <Badge 
                                  key={tool.id} 
                                  className="bg-blue-500 text-white cursor-pointer hover:bg-blue-600"
                                  onClick={() => removeTool('teamA', tool.id)}
                                >
                                  <tool.icon className="w-3 h-3 mr-1" />
                                  {tool.name}
                                  <X className="w-3 h-3 ml-1" />
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Team B */}
                    <Card 
                      className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 backdrop-blur-md border-purple-400/30 hover:border-purple-400/60 transition-all duration-300"
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, 'teamB')}
                    >
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between text-white">
                          <span className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-purple-400" />
                            {t.teamB}
                          </span>
                          <Button
                            size="sm"
                            onClick={() => toggleReady('teamB')}
                            className={`${
                              gameConfig.teams.teamB.ready 
                                ? 'bg-green-600 hover:bg-green-700' 
                                : 'bg-gray-600 hover:bg-gray-700'
                            }`}
                          >
                            {gameConfig.teams.teamB.ready ? (
                              <>
                                <Check className="w-4 h-4 mr-1" />
                                {t.ready}
                              </>
                            ) : (
                              <>
                                <X className="w-4 h-4 mr-1" />
                                {t.notReady}
                              </>
                            )}
                          </Button>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Team Name */}
                        <Input
                          placeholder={t.teamName}
                          value={gameConfig.teams.teamB.name}
                          onChange={(e) => updateTeam('teamB', { name: e.target.value })}
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                          maxLength={20}
                        />
                        
                        {/* Avatar Selection */}
                        <div className="space-y-2">
                          <label className="text-sm text-white/80">{t.selectAvatar}</label>
                          <div className="flex flex-wrap gap-2">
                            {avatars.map((avatar) => (
                              <button
                                key={avatar}
                                onClick={() => updateTeam('teamB', { avatar })}
                                className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all duration-300 ${
                                  gameConfig.teams.teamB.avatar === avatar
                                    ? 'bg-purple-500 scale-110 shadow-lg'
                                    : 'bg-white/10 hover:bg-white/20'
                                }`}
                              >
                                {avatar}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Categories */}
                        {currentMode.showCategories && (
                          <div className="space-y-2">
                            <label className="text-sm text-white/80">
                              {t.selectCategories} ({gameConfig.teams.teamB.categories.length}/{currentMode.maxCategories})
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {gameConfig.teams.teamB.categories.map((categoryId) => {
                                const category = categories.find(c => c.id === categoryId);
                                return category ? (
                                  <Badge key={categoryId} className="bg-purple-500 text-white">
                                    {category.name}
                                  </Badge>
                                ) : null;
                              })}
                            </div>
                          </div>
                        )}

                        {/* Tools */}
                        {currentMode.showTools && (
                          <div className="space-y-2">
                            <label className="text-sm text-white/80">
                              {t.toolsAssigned} ({gameConfig.teams.teamB.tools.length}/{currentMode.maxTools})
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {gameConfig.teams.teamB.tools.map((tool) => (
                                <Badge 
                                  key={tool.id} 
                                  className="bg-purple-500 text-white cursor-pointer hover:bg-purple-600"
                                  onClick={() => removeTool('teamB', tool.id)}
                                >
                                  <tool.icon className="w-3 h-3 mr-1" />
                                  {tool.name}
                                  <X className="w-3 h-3 ml-1" />
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {/* Category Selection Grid */}
              {currentMode.showCategories && (
                <Card className="bg-white/10 backdrop-blur-md border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white">{t.categorySelection}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {categories.map((category) => {
                        const selectedByA = gameConfig.teams.teamA.categories.includes(category.id);
                        const selectedByB = currentMode.showTeams ? gameConfig.teams.teamB.categories.includes(category.id) : false;
                        const Icon = category.icon;
                        
                        return (
                          <div key={category.id} className="space-y-2">
                            {currentMode.showTeams && gameMode !== 'quick' ? (
                              <>
                                <button
                                  onClick={() => selectCategory('teamA', category.id)}
                                  disabled={selectedByB}
                                  className={`w-full p-4 rounded-lg transition-all duration-300 ${
                                    selectedByA
                                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white scale-105 shadow-lg'
                                      : selectedByB
                                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                      : 'bg-white/10 text-contrast-light hover:bg-white/20 hover:scale-105'
                                  }`}
                                >
                                  <Icon className="w-6 h-6 mx-auto mb-2" />
                                  <span className="text-sm font-medium">{category.name}</span>
                                </button>
                                <button
                                  onClick={() => selectCategory('teamB', category.id)}
                                  disabled={selectedByA}
                                  className={`w-full p-4 rounded-lg transition-all duration-300 ${
                                    selectedByB
                                      ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white scale-105 shadow-lg'
                                      : selectedByA
                                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                      : 'bg-white/10 text-contrast-light hover:bg-white/20 hover:scale-105'
                                  }`}
                                >
                                  <Icon className="w-6 h-6 mx-auto mb-2" />
                                  <span className="text-sm font-medium">{category.name}</span>
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => selectCategory('teamA', category.id)}
                                className={`w-full p-4 rounded-lg transition-all duration-300 ${
                                  selectedByA
                                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white scale-105 shadow-lg'
                                    : 'bg-white/10 text-contrast-light hover:bg-white/20 hover:scale-105'
                                }`}
                              >
                                <Icon className="w-6 h-6 mx-auto mb-2" />
                                <span className="text-sm font-medium">{category.name}</span>
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Start Game Button */}
              <Card className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-md border-yellow-400/30">
                <CardContent className="p-6">
                  <Button
                    onClick={startGame}
                    disabled={!canStartGame() || startingGame || autoStartCountdown > 0}
                    className={`w-full py-4 text-lg font-bold transition-all duration-300 ${
                      canStartGame() && !startingGame && autoStartCountdown === 0
                        ? 'bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-black shadow-lg hover:shadow-yellow-500/25 hover:scale-105 animate-pulse'
                        : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {matchmaking ? (
                      <div className="flex items-center gap-3">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                        <span>Finding Opponent...</span>
                      </div>
                    ) : matchFound ? (
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-6 h-6" />
                        <span>Match Found! Starting...</span>
                      </div>
                    ) : startingGame ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        {t.gameStarting}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        {gameMode === 'quick' ? (
                          <>
                            <Users className="w-6 h-6" />
                            <span>Find Match</span>
                          </>
                        ) : (
                          <>
                            <Zap className="w-6 h-6" />
                            <span>Start Game</span>
                          </>
                        )}
                      </div>
                    )}
                  </Button>
                  {!canStartGame() && autoStartCountdown === 0 && (
                    <p className="text-center text-white/60 text-sm mt-2">
                      {currentMode.showTeams && gameMode !== 'quick' ? t.bothTeamsReady : 'Select difficulty and categories to continue'}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Side Panel */}
            <div className="xl:col-span-2 space-y-6">
              {/* Tool Selection */}
              {currentMode.showTools && (
                <Card className="bg-white/10 backdrop-blur-md border-white/20">
                  <CardHeader>
                    <CardTitle className="text-contrast-light">{t.availableTools}</CardTitle>
                    <CardDescription className="text-contrast-light/70">
                      {currentMode.showTeams && gameMode !== 'quick' 
                        ? `Drag tools to team areas (max ${currentMode.maxTools} per team)`
                        : `Click to select tools (max ${currentMode.maxTools})`
                      }
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {availableTools.map((tool) => {
                        const Icon = tool.icon;
                        const isSelected = isToolSelected(tool.id);
                        return (
                          <div
                            key={tool.id}
                            onClick={() => selectTool(tool)}
                            draggable={tool.available}
                            onDragStart={() => handleDragStart(tool)}
                            className={`tool-card p-4 rounded-lg border transition-all duration-300 ${
                              tool.available
                                ? `bg-gradient-to-r ${tool.color} text-white shadow-lg ${isSelected ? 'selected' : ''}`
                                : 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'
                            }`}
                          >
                            <div className="flex items-center gap-3 mb-2">
                              <Icon className="w-5 h-5" />
                              <span className="font-semibold text-white">{tool.name}</span>
                              <Badge variant="secondary" className="text-xs">
                                {tool.timing}
                              </Badge>
                              {isSelected && (
                                <Check className="w-4 h-4 text-green-400 ml-auto" />
                              )}
                            </div>
                            <p className="text-sm opacity-90 text-white">{tool.description}</p>
                            {!tool.available && (
                              <Badge className="mt-2 bg-red-500 text-white">
                                Locked
                              </Badge>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Game Rules */}
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardHeader>
                  <CardTitle className="text-black-force">{t.gameRules}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full scrollable-content">
                    <AccordionItem value="points" className="border-white/20">
                      <AccordionTrigger className="text-black-force hover:text-blue-400">
                        {t.pointSystem}
                      </AccordionTrigger>
                      <AccordionContent className="text-black-force space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span>{t.easyPoints}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                          <span>{t.mediumPoints}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          <span>{t.hardPoints}</span>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="double" className="border-white/20">
                      <AccordionTrigger className="text-black-force hover:text-blue-400">
                        {t.doubleCondition}
                      </AccordionTrigger>
                      <AccordionContent className="text-black-force">
                        <p>{t.doubleConditionDesc}</p>
                        <div className="mt-2 p-3 bg-yellow-500/20 rounded-lg border border-yellow-500/30">
                          <div className="flex items-center gap-2">
                            <Crown className="w-4 h-4 text-yellow-400" />
                            <span className="text-yellow-400 font-semibold">Golden Animation</span>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="tools" className="border-white/20">
                      <AccordionTrigger className="text-black-force hover:text-blue-400">
                        {t.toolUsage}
                      </AccordionTrigger>
                      <AccordionContent className="text-black-force">
                        <p>{t.toolUsageDesc}</p>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="achievements" className="border-white/20">
                      <AccordionTrigger className="text-black-force hover:text-blue-400">
                        {t.achievements}
                      </AccordionTrigger>
                      <AccordionContent className="text-black-force">
                        <p>{t.achievementsDesc}</p>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}