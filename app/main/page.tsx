'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Zap, Trophy, User, Brain, Star, Coins, CreditCard as Edit3, Check, X, Users, Target, Calendar, Award, Crown, Medal, Gamepad2, Swords, Clock, Gift, TrendingUp, Globe, ShoppingCart, Settings } from 'lucide-react';
import { LightningLogo } from '@/components/ui/lightning-logo';
import { toast } from 'sonner';

interface User {
  id: string;
  email: string;
  username: string;
  age: number;
  gems: number;
  coins: number;
  stats: {
    games_played: number;
    wins: number;
    accuracy: number;
  };
}

interface LeaderboardEntry {
  id: string;
  user_id: string;
  score: number;
  rank: number;
  users: { username: string };
}

interface Achievement {
  id: string;
  type: string;
  progress: any;
  unlocked: boolean;
}

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸', rtl: false },
  { code: 'ar', name: 'العربية', flag: '🇸🇦', rtl: true },
];

const translations = {
  en: {
    dashboard: 'Dashboard',
    quickMatch: 'Quick Match',
    createRoom: 'Create Room',
    practiceMode: 'Practice Mode',
    tournament: 'Tournament',
    dailyChallenge: 'Daily Challenge',
    achievements: 'Achievements',
    leaderboard: 'Leaderboard',
    profile: 'Profile',
    stats: 'Statistics',
    gamesPlayed: 'Games Played',
    wins: 'Wins',
    accuracy: 'Accuracy',
    level: 'Level',
    editUsername: 'Edit Username',
    saveUsername: 'Save Username',
    cancelEdit: 'Cancel',
    usernameUpdated: 'Username updated successfully!',
    usernameError: 'Failed to update username',
    signOut: 'Sign Out',
    signedOut: 'Signed out successfully!',
    topPlayers: 'Top Players',
    yourRank: 'Your Rank',
    dailyTasks: 'Daily Tasks',
    comingSoon: 'Coming Soon',
    findOpponent: 'Find an opponent instantly',
    inviteFriends: 'Create a custom game room',
    improvSkills: 'Practice solo to improve',
    competeTournament: 'Compete in tournaments',
    dailyRewards: 'Complete daily challenges',
    noAchievements: 'No achievements yet!',
    playGames: 'Play games to unlock rewards',
    loading: 'Loading...',
  },
  ar: {
    dashboard: 'لوحة التحكم',
    quickMatch: 'مباراة سريعة',
    createRoom: 'إنشاء غرفة',
    practiceMode: 'وضع التدريب',
    tournament: 'البطولة',
    dailyChallenge: 'التحدي اليومي',
    achievements: 'الإنجازات',
    leaderboard: 'لوحة المتصدرين',
    profile: 'الملف الشخصي',
    stats: 'الإحصائيات',
    gamesPlayed: 'الألعاب المُلعبة',
    wins: 'الانتصارات',
    accuracy: 'الدقة',
    level: 'المستوى',
    editUsername: 'تعديل اسم المستخدم',
    saveUsername: 'حفظ اسم المستخدم',
    cancelEdit: 'إلغاء',
    usernameUpdated: 'تم تحديث اسم المستخدم بنجاح!',
    usernameError: 'فشل في تحديث اسم المستخدم',
    signOut: 'تسجيل الخروج',
    signedOut: 'تم تسجيل الخروج بنجاح!',
    topPlayers: 'أفضل اللاعبين',
    yourRank: 'ترتيبك',
    dailyTasks: 'المهام اليومية',
    comingSoon: 'قريباً',
    findOpponent: 'ابحث عن خصم فوراً',
    inviteFriends: 'أنشئ غرفة لعب مخصصة',
    improvSkills: 'تدرب منفرداً لتحسين مهاراتك',
    competeTournament: 'تنافس في البطولات',
    dailyRewards: 'أكمل التحديات اليومية',
    noAchievements: 'لا توجد إنجازات بعد!',
    playGames: 'العب الألعاب لفتح المكافآت',
    loading: 'جاري التحميل...',
  },
};

export default function MainDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [currentLang, setCurrentLang] = useState<string>('en');
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [savingUsername, setSavingUsername] = useState(false);

  const t = translations[currentLang as keyof typeof translations];
  const isRTL = languages.find(lang => lang.code === currentLang)?.rtl || false;

  useEffect(() => {
    // Load saved language preference
    const savedLang = localStorage.getItem('language') || 'en';
    setCurrentLang(savedLang);
    
    // Apply RTL to document
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = currentLang;
  }, [currentLang, isRTL]);

  useEffect(() => {
    checkUser();
    fetchLeaderboard();
    fetchAchievements();
    
    // Subscribe to leaderboard changes
    const leaderboardSubscription = supabase
      .channel('leaderboard-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'leaderboards' },
        () => fetchLeaderboard()
      )
      .subscribe();

    return () => {
      leaderboardSubscription.unsubscribe();
    };
  }, []);

  // Handle authentication redirect
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [loading, user, router]);

  const switchLanguage = (langCode: string) => {
    setCurrentLang(langCode);
    localStorage.setItem('language', langCode);
  };

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
          setUser(userData);
          setNewUsername(userData.username);
        }
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const { data } = await supabase
        .from('leaderboards')
        .select(`
          *,
          users (username)
        `)
        .order('rank', { ascending: true })
        .limit(10);
      
      if (data) setLeaderboard(data);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  };

  const fetchAchievements = async () => {
    try {
      if (!user) return;
      
      const { data } = await supabase
        .from('achievements')
        .select('*')
        .eq('user_id', user.id);
      
      if (data) setAchievements(data);
    } catch (error) {
      console.error('Error fetching achievements:', error);
    }
  };

  const handleSaveUsername = async () => {
    if (!user || !newUsername.trim()) return;
    
    setSavingUsername(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ username: newUsername.trim() })
        .eq('id', user.id);

      if (error) throw error;

      setUser({ ...user, username: newUsername.trim() });
      setIsEditingUsername(false);
      toast.success(t.usernameUpdated);
    } catch (error) {
      console.error('Error updating username:', error);
      toast.error(t.usernameError);
    } finally {
      setSavingUsername(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success(t.signedOut);
    window.location.href = '/auth';
  };

  const getUserLevel = () => {
    if (!user) return 1;
    return Math.floor(user.stats.games_played / 10) + 1;
  };

  const getWinRate = () => {
    if (!user || user.stats.games_played === 0) return 0;
    return Math.round((user.stats.wins / user.stats.games_played) * 100);
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p>{t.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen relative page-container ${isRTL ? 'rtl' : 'ltr'}`} style={{
      background: 'radial-gradient(ellipse at top, rgba(128, 0, 128, 0.4) 0%, transparent 50%), radial-gradient(ellipse at bottom left, rgba(0, 0, 255, 0.4) 0%, transparent 50%), radial-gradient(ellipse at bottom right, rgba(75, 0, 130, 0.3) 0%, transparent 50%), radial-gradient(ellipse at center, #000000 0%, #0a0a0a 100%)'
    }}>
      {/* Animated Background */}
      <div className="absolute inset-0 space-content">
        {/* Neural Network Pattern */}
        <div className="absolute inset-0 opacity-10">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className={`absolute w-px h-px rounded-full animate-pulse ${
                i % 3 === 0 ? 'bg-purple-400' : 
                i % 3 === 1 ? 'bg-blue-400' : 'bg-indigo-400'
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
        
        {/* Floating Particles */}
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className={`absolute w-1 h-1 rounded-full animate-pulse ${
              i % 3 === 0 ? 'bg-purple-400' : 
              i % 3 === 1 ? 'bg-blue-400' : 'bg-indigo-400'
            }`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <div className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <LightningLogo size={40} className="animate-pulse drop-shadow-lg" />
                <div className="absolute inset-0 w-10 h-10 bg-yellow-400/20 rounded-full animate-ping" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-blue-400 bg-clip-text text-transparent">
                Bolt Blitz ⚡️
              </h1>
            </div>

            {/* Top Right Controls */}
            <div className="flex items-center gap-4">
              {/* Settings Gear Button */}
              <Button
                variant="outline"
                size="icon"
                onClick={() => router.push('/settings')}
                className="bg-gray-400/20 border-gray-400/30 hover:bg-gray-400/30 text-gray-300 hover:text-white transition-all duration-300 hover:scale-110"
                title="Settings"
              >
                <Settings className="w-4 h-4" />
              </Button>
              
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
          </div>

          {/* User Profile Header */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-2xl mb-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar className="w-16 h-16 border-2 border-blue-400">
                      <AvatarImage src="" />
                      <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xl font-bold">
                        {user.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <Badge className="absolute -bottom-2 -right-2 bg-yellow-500 text-black font-bold">
                      {getUserLevel()}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    {isEditingUsername ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={newUsername}
                          onChange={(e) => setNewUsername(e.target.value)}
                          className="bg-white/10 border-white/20 text-white"
                          placeholder="Enter username"
                        />
                        <Button
                          size="sm"
                          onClick={handleSaveUsername}
                          disabled={savingUsername}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setIsEditingUsername(false);
                            setNewUsername(user.username);
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <h2 className="text-2xl font-bold text-white">{user.username}</h2>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setIsEditingUsername(true)}
                          className="text-white/70 hover:text-white"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm text-white/80">
                      <span className="flex items-center gap-1">
                        <Trophy className="w-4 h-4" />
                        {t.level} {getUserLevel()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Target className="w-4 h-4" />
                        {getWinRate()}% {t.accuracy}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2 bg-yellow-500/20 rounded-lg px-4 py-2">
                    <Star className="w-5 h-5 text-yellow-400" />
                    <span className="text-yellow-400 font-bold text-lg">{user.gems}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-blue-500/20 rounded-lg px-4 py-2">
                    <Coins className="w-5 h-5 text-blue-400" />
                    <span className="text-blue-400 font-bold text-lg">{user.coins}</span>
                  </div>
                  <Button variant="outline" onClick={handleSignOut} className="text-white border-white/20">
                    {t.signOut}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Game Mode Cards */}
            <div className="lg:col-span-2 space-y-6">
              <h3 className="text-2xl font-bold text-white mb-4">{t.dashboard}</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Quick Match */}
                <Card className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 backdrop-blur-md border-blue-400/30 hover:border-blue-400/60 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/25 cursor-pointer group">
                  <CardHeader onClick={() => router.push('/game-setup?mode=quick')}>
                    <CardTitle className="flex items-center gap-3 text-blue-900">
                      <div className="p-2 bg-blue-500/30 rounded-lg group-hover:bg-blue-500/50 transition-colors">
                        <Zap className="w-6 h-6" />
                      </div>
                      {t.quickMatch}
                    </CardTitle>
                    <CardDescription className="text-blue-800/80">
                      Single-player mode with AI matchmaking
                    </CardDescription>
                  </CardHeader>
                </Card>

                {/* Create Room */}
                <Card className="bg-gradient-to-br from-green-600/20 to-teal-600/20 backdrop-blur-md border-green-400/30 hover:border-green-400/60 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-green-500/25 cursor-pointer group">
                  <CardHeader onClick={() => router.push('/game-setup?mode=custom')}>
                    <CardTitle className="flex items-center gap-3 text-blue-900">
                      <div className="p-2 bg-green-500/30 rounded-lg group-hover:bg-green-500/50 transition-colors">
                        <Users className="w-6 h-6" />
                      </div>
                      {t.createRoom}
                    </CardTitle>
                    <CardDescription className="text-blue-800/80">
                      {t.inviteFriends}
                    </CardDescription>
                  </CardHeader>
                </Card>

                {/* Practice Mode */}
                <Card className="bg-gradient-to-br from-indigo-600/20 to-blue-600/20 backdrop-blur-md border-indigo-400/30 hover:border-indigo-400/60 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-indigo-500/25 cursor-pointer group">
                  <CardHeader onClick={() => router.push('/game-setup?mode=practice')}>
                    <CardTitle className="flex items-center gap-3 text-blue-900">
                      <div className="p-2 bg-indigo-500/30 rounded-lg group-hover:bg-indigo-500/50 transition-colors">
                        <Target className="w-6 h-6" />
                      </div>
                      {t.practiceMode}
                    </CardTitle>
                    <CardDescription className="text-blue-800/80">
                      {t.improvSkills}
                    </CardDescription>
                  </CardHeader>
                </Card>

                {/* Tournament */}
                <Card className="bg-gradient-to-br from-yellow-600/20 to-orange-600/20 backdrop-blur-md border-yellow-400/30 hover:border-yellow-400/60 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-yellow-500/25 cursor-pointer group">
                  <CardHeader onClick={() => router.push('/game-setup?mode=tournament')}>
                    <CardTitle className="flex items-center gap-3 text-blue-900">
                      <div className="p-2 bg-yellow-500/30 rounded-lg group-hover:bg-yellow-500/50 transition-colors">
                        <Trophy className="w-6 h-6" />
                      </div>
                      {t.tournament}
                    </CardTitle>
                    <CardDescription className="text-blue-800/80">
                      {t.competeTournament}
                    </CardDescription>
                  </CardHeader>
                </Card>

                {/* Daily Challenge */}
                <Card className="bg-gradient-to-br from-red-600/20 to-pink-600/20 backdrop-blur-md border-red-400/30 hover:border-red-400/60 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-red-500/25 cursor-pointer group">
                  <CardHeader onClick={() => router.push('/game-setup?mode=daily')}>
                    <CardTitle className="flex items-center gap-3 text-blue-900">
                      <div className="p-2 bg-red-500/30 rounded-lg group-hover:bg-red-500/50 transition-colors">
                        <Calendar className="w-6 h-6" />
                      </div>
                      {t.dailyChallenge}
                    </CardTitle>
                    <CardDescription className="text-blue-800/80">
                      {t.dailyRewards}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </div>

              {/* Statistics */}
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">{t.stats}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-400">{user.stats.games_played}</div>
                      <div className="text-sm text-white/70">{t.gamesPlayed}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-400">{user.stats.wins}</div>
                      <div className="text-sm text-white/70">{t.wins}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-yellow-400">{user.stats.accuracy}%</div>
                      <div className="text-sm text-white/70">{t.accuracy}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Leaderboard */}
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Trophy className="w-5 h-5 text-yellow-400" />
                    {t.leaderboard}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {leaderboard.slice(0, 5).map((entry, index) => (
                      <div key={entry.id} className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          index === 0 ? 'bg-yellow-500 text-black' :
                          index === 1 ? 'bg-gray-400 text-black' :
                          index === 2 ? 'bg-orange-600 text-white' :
                          'bg-white/20 text-white'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="text-white text-sm font-medium">{entry.users.username}</div>
                          <div className="text-white/60 text-xs">{entry.score} pts</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Achievements */}
              <Card className="bg-white/10 backdrop-blur-md border-white/20 cursor-pointer hover:bg-white/15 transition-all duration-300 hover:scale-105" onClick={() => router.push('/achievements')}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Award className="w-5 h-5 text-purple-400" />
                    {t.achievements}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {achievements.length > 0 ? (
                    <div className="space-y-3">
                      {achievements.slice(0, 3).map((achievement) => (
                        <div key={achievement.id} className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            achievement.unlocked ? 'bg-yellow-500' : 'bg-gray-600'
                          }`}>
                            <Medal className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <div className="text-white text-sm">{achievement.type}</div>
                            <Progress 
                              value={achievement.progress} 
                              className="h-2 mt-1"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-white/60 py-4">
                      <Award className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">{t.noAchievements}</p>
                      <p className="text-xs mt-1">{t.playGames}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Daily Tasks */}
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Calendar className="w-5 h-5 text-green-400" />
                    {t.dailyTasks}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center text-white/60 py-4">
                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">{t.comingSoon}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}