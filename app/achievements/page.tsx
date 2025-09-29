'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Calendar, Clock, Trophy, Star, Gift, Zap, Target, Crown, Medal, Award, Sparkles, CircleCheck as CheckCircle, Circle, Coins, Gem, Gamepad2, Brain, Users, Timer, Shield, Eye, RotateCcw, TrendingUp, Flame, Lock, Clock as Unlock } from 'lucide-react';
import { LightningLogo } from '@/components/ui/lightning-logo';
import { toast } from 'sonner';

interface User {
  id: string;
  username: string;
  gems: number;
  coins: number;
  stats: {
    games_played: number;
    wins: number;
    accuracy: number;
  };
}

interface Achievement {
  id: string;
  user_id: string;
  type: 'daily' | 'weekly' | 'milestone' | 'special';
  title: string;
  description: string;
  icon: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  progress: {
    current: number;
    target: number;
    completed_at?: string;
  };
  rewards: {
    coins?: number;
    gems?: number;
    tools?: string[];
    categories?: string[];
    free_games?: number;
    badges?: string[];
  };
  unlocked: boolean;
  created_at: string;
}

const ACHIEVEMENT_ICONS = {
  games: Gamepad2,
  wins: Trophy,
  accuracy: Target,
  streak: Flame,
  tools: Zap,
  categories: Brain,
  multiplayer: Users,
  speed: Timer,
  perfect: Crown,
  collector: Medal,
  explorer: Star,
  master: Award
};

const TIER_COLORS = {
  bronze: 'from-amber-600 to-orange-600',
  silver: 'from-gray-400 to-gray-600',
  gold: 'from-yellow-400 to-yellow-600',
  platinum: 'from-purple-400 to-purple-600'
};

const TIER_BADGES = {
  bronze: 'bg-amber-500',
  silver: 'bg-gray-400',
  gold: 'bg-yellow-500',
  platinum: 'bg-purple-500'
};

export default function AchievementsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('daily');
  const [collectingReward, setCollectingReward] = useState<string | null>(null);

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchAchievements();
      setupRealtimeSubscription();
    }
  }, [user]);

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
        }
      } else {
        router.push('/auth');
      }
    } catch (error) {
      console.error('Error checking user:', error);
      router.push('/auth');
    }
  };

  const fetchAchievements = async () => {
    try {
      if (!user) return;

      // First, create default achievements if they don't exist
      await createDefaultAchievements();

      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setAchievements(data);
      }
    } catch (error) {
      console.error('Error fetching achievements:', error);
      toast.error('Failed to load achievements');
    } finally {
      setLoading(false);
    }
  };

  const createDefaultAchievements = async () => {
    if (!user) return;

    const defaultAchievements = [
      // Daily Achievements
      {
        user_id: user.id,
        type: 'daily',
        title: 'Daily Player',
        description: 'Play 3 games today',
        icon: 'games',
        tier: 'bronze',
        progress: { current: user.stats.games_played % 3, target: 3 },
        rewards: { coins: 50, free_games: 1 },
        unlocked: false
      },
      {
        user_id: user.id,
        type: 'daily',
        title: 'Quick Learner',
        description: 'Answer 10 questions correctly today',
        icon: 'accuracy',
        tier: 'bronze',
        progress: { current: 0, target: 10 },
        rewards: { gems: 25 },
        unlocked: false
      },
      // Weekly Achievements
      {
        user_id: user.id,
        type: 'weekly',
        title: 'Weekly Champion',
        description: 'Win 5 games this week',
        icon: 'wins',
        tier: 'silver',
        progress: { current: user.stats.wins % 5, target: 5 },
        rewards: { gems: 100, tools: ['double-points'] },
        unlocked: false
      },
      {
        user_id: user.id,
        type: 'weekly',
        title: 'Category Explorer',
        description: 'Play in 4 different categories this week',
        icon: 'explorer',
        tier: 'silver',
        progress: { current: 0, target: 4 },
        rewards: { categories: ['Art'], coins: 75 },
        unlocked: false
      },
      // Milestone Achievements
      {
        user_id: user.id,
        type: 'milestone',
        title: 'Game Master',
        description: 'Play 100 total games',
        icon: 'master',
        tier: 'gold',
        progress: { current: user.stats.games_played, target: 100 },
        rewards: { gems: 500, tools: ['time-freeze', 'shield'] },
        unlocked: user.stats.games_played >= 100
      },
      {
        user_id: user.id,
        type: 'milestone',
        title: 'Perfect Streak',
        description: 'Achieve 90% accuracy over 50 games',
        icon: 'perfect',
        tier: 'platinum',
        progress: { current: user.stats.accuracy, target: 90 },
        rewards: { gems: 1000, badges: ['perfectionist'], categories: ['Literature', 'Technology'] },
        unlocked: user.stats.accuracy >= 90 && user.stats.games_played >= 50
      },
      // Special Achievements
      {
        user_id: user.id,
        type: 'special',
        title: 'Lightning Fast',
        description: 'Answer 5 questions in under 10 seconds each',
        icon: 'speed',
        tier: 'gold',
        progress: { current: 0, target: 5 },
        rewards: { gems: 300, tools: ['strike'] },
        unlocked: false
      },
      {
        user_id: user.id,
        type: 'special',
        title: 'Tool Collector',
        description: 'Use all 6 different tools in games',
        icon: 'collector',
        tier: 'platinum',
        progress: { current: 0, target: 6 },
        rewards: { gems: 750, tools: ['peek'], badges: ['tool-master'] },
        unlocked: false
      }
    ];

    // Check which achievements already exist
    const { data: existingAchievements } = await supabase
      .from('achievements')
      .select('title')
      .eq('user_id', user.id);

    const existingTitles = existingAchievements?.map(a => a.title) || [];
    const newAchievements = defaultAchievements.filter(a => !existingTitles.includes(a.title));

    if (newAchievements.length > 0) {
      await supabase
        .from('achievements')
        .insert(newAchievements);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!user) return;

    const subscription = supabase
      .channel(`achievements-${user.id}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'achievements', filter: `user_id=eq.${user.id}` },
        () => fetchAchievements()
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const collectReward = async (achievement: Achievement) => {
    if (!user || achievement.unlocked || collectingReward) return;

    setCollectingReward(achievement.id);

    try {
      // Update achievement as unlocked
      const { error: achievementError } = await supabase
        .from('achievements')
        .update({ 
          unlocked: true,
          progress: { 
            ...achievement.progress, 
            completed_at: new Date().toISOString() 
          }
        })
        .eq('id', achievement.id);

      if (achievementError) throw achievementError;

      // Update user rewards
      const newCoins = user.coins + (achievement.rewards.coins || 0);
      const newGems = user.gems + (achievement.rewards.gems || 0);

      const { error: userError } = await supabase
        .from('users')
        .update({ 
          coins: newCoins,
          gems: newGems
        })
        .eq('id', user.id);

      if (userError) throw userError;

      // Update local state
      setUser({ ...user, coins: newCoins, gems: newGems });

      // Show success message
      const rewardText = [];
      if (achievement.rewards.coins) rewardText.push(`+${achievement.rewards.coins} coins`);
      if (achievement.rewards.gems) rewardText.push(`+${achievement.rewards.gems} gems`);
      if (achievement.rewards.tools) rewardText.push(`${achievement.rewards.tools.length} new tools`);
      if (achievement.rewards.categories) rewardText.push(`${achievement.rewards.categories.length} new categories`);
      if (achievement.rewards.free_games) rewardText.push(`${achievement.rewards.free_games} free games`);

      toast.success(`🎉 Achievement Unlocked! ${rewardText.join(', ')}`);

    } catch (error) {
      console.error('Error collecting reward:', error);
      toast.error('Failed to collect reward');
    } finally {
      setCollectingReward(null);
    }
  };

  const getFilteredAchievements = (type: string) => {
    return achievements.filter(achievement => achievement.type === type);
  };

  const getProgressPercentage = (achievement: Achievement) => {
    return Math.min((achievement.progress.current / achievement.progress.target) * 100, 100);
  };

  const isCompleted = (achievement: Achievement) => {
    return achievement.progress.current >= achievement.progress.target;
  };

  const getIconComponent = (iconName: string) => {
    const IconComponent = ACHIEVEMENT_ICONS[iconName as keyof typeof ACHIEVEMENT_ICONS] || Star;
    return IconComponent;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading achievements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden" style={{
      background: 'radial-gradient(ellipse at top, rgba(128, 0, 128, 0.6) 0%, transparent 50%), radial-gradient(ellipse at bottom left, rgba(0, 0, 255, 0.6) 0%, transparent 50%), radial-gradient(ellipse at bottom right, rgba(75, 0, 130, 0.5) 0%, transparent 50%), radial-gradient(ellipse at center, #000000 0%, #0a0a0a 100%)'
    }}>
      {/* Animated Background */}
      <div className="absolute inset-0 space-content">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className={`absolute w-1 h-1 rounded-full animate-pulse ${
              i % 4 === 0 ? 'bg-purple-400' : 
              i % 4 === 1 ? 'bg-blue-400' : 
              i % 4 === 2 ? 'bg-indigo-400' : 'bg-purple-300'
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
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => router.push('/main')}
                className="text-white border-white/20 hover:bg-white/10"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Menu
              </Button>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <LightningLogo size={32} className="animate-pulse drop-shadow-lg" />
                  <div className="absolute inset-0 w-8 h-8 bg-yellow-400/20 rounded-full animate-ping" />
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-blue-400 bg-clip-text text-transparent">
                  Achievements
                </h1>
              </div>
            </div>

            {/* User Stats */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-yellow-500/20 rounded-lg px-4 py-2">
                <Gem className="w-5 h-5 text-yellow-400" />
                <span className="text-yellow-400 font-bold text-lg">{user?.gems}</span>
              </div>
              <div className="flex items-center gap-2 bg-blue-500/20 rounded-lg px-4 py-2">
                <Coins className="w-5 h-5 text-blue-400" />
                <span className="text-blue-400 font-bold text-lg">{user?.coins}</span>
              </div>
            </div>
          </div>

          {/* Achievement Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-white/10 backdrop-blur-md">
              <TabsTrigger value="daily" className="flex items-center gap-2 data-[state=active]:bg-blue-500">
                <Calendar className="w-4 h-4" />
                Daily
              </TabsTrigger>
              <TabsTrigger value="weekly" className="flex items-center gap-2 data-[state=active]:bg-purple-500">
                <Clock className="w-4 h-4" />
                Weekly
              </TabsTrigger>
              <TabsTrigger value="milestone" className="flex items-center gap-2 data-[state=active]:bg-yellow-500">
                <Trophy className="w-4 h-4" />
                Milestone
              </TabsTrigger>
              <TabsTrigger value="special" className="flex items-center gap-2 data-[state=active]:bg-green-500">
                <Star className="w-4 h-4" />
                Special
              </TabsTrigger>
            </TabsList>

            {/* Daily Achievements */}
            <TabsContent value="daily" className="space-y-6 mt-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">Daily Tasks</h2>
                <p className="text-white/70">Complete daily challenges to earn rewards</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getFilteredAchievements('daily').map((achievement) => {
                  const IconComponent = getIconComponent(achievement.icon);
                  const completed = isCompleted(achievement);
                  const progress = getProgressPercentage(achievement);
                  
                  return (
                    <Card key={achievement.id} className={`bg-gradient-to-br ${TIER_COLORS[achievement.tier]}/20 backdrop-blur-md border-white/20 hover:scale-105 transition-all duration-300 ${completed && !achievement.unlocked ? 'ring-2 ring-yellow-400 animate-pulse' : ''}`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 bg-gradient-to-r ${TIER_COLORS[achievement.tier]} rounded-lg`}>
                              <IconComponent className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <CardTitle className="text-white text-lg">{achievement.title}</CardTitle>
                              <Badge className={`${TIER_BADGES[achievement.tier]} text-white text-xs`}>
                                {achievement.tier.toUpperCase()}
                              </Badge>
                            </div>
                          </div>
                          {achievement.unlocked ? (
                            <CheckCircle className="w-6 h-6 text-green-400" />
                          ) : completed ? (
                            <Gift className="w-6 h-6 text-yellow-400 animate-bounce" />
                          ) : (
                            <Circle className="w-6 h-6 text-white/30" />
                          )}
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        <CardDescription className="text-white/70">
                          {achievement.description}
                        </CardDescription>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-white/70">Progress</span>
                            <span className="text-white font-bold">
                              {achievement.progress.current}/{achievement.progress.target}
                            </span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>
                        
                        <div className="space-y-2">
                          <div className="text-sm text-white/70">Rewards:</div>
                          <div className="flex flex-wrap gap-2">
                            {achievement.rewards.coins && (
                              <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
                                +{achievement.rewards.coins} coins
                              </Badge>
                            )}
                            {achievement.rewards.gems && (
                              <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400">
                                +{achievement.rewards.gems} gems
                              </Badge>
                            )}
                            {achievement.rewards.free_games && (
                              <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                                {achievement.rewards.free_games} free games
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        {completed && !achievement.unlocked && (
                          <Button
                            onClick={() => collectReward(achievement)}
                            disabled={collectingReward === achievement.id}
                            className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold"
                          >
                            {collectingReward === achievement.id ? (
                              <div className="flex items-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Collecting...
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Gift className="w-4 h-4" />
                                Collect Reward
                              </div>
                            )}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            {/* Weekly Achievements */}
            <TabsContent value="weekly" className="space-y-6 mt-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">Weekly Challenges</h2>
                <p className="text-white/70">Bigger challenges, better rewards</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {getFilteredAchievements('weekly').map((achievement) => {
                  const IconComponent = getIconComponent(achievement.icon);
                  const completed = isCompleted(achievement);
                  const progress = getProgressPercentage(achievement);
                  
                  return (
                    <Card key={achievement.id} className={`bg-gradient-to-br ${TIER_COLORS[achievement.tier]}/20 backdrop-blur-md border-white/20 hover:scale-105 transition-all duration-300 ${completed && !achievement.unlocked ? 'ring-2 ring-yellow-400 animate-pulse' : ''}`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-3 bg-gradient-to-r ${TIER_COLORS[achievement.tier]} rounded-lg`}>
                              <IconComponent className="w-8 h-8 text-white" />
                            </div>
                            <div>
                              <CardTitle className="text-white text-xl">{achievement.title}</CardTitle>
                              <Badge className={`${TIER_BADGES[achievement.tier]} text-white`}>
                                {achievement.tier.toUpperCase()}
                              </Badge>
                            </div>
                          </div>
                          {achievement.unlocked ? (
                            <CheckCircle className="w-8 h-8 text-green-400" />
                          ) : completed ? (
                            <Gift className="w-8 h-8 text-yellow-400 animate-bounce" />
                          ) : (
                            <Circle className="w-8 h-8 text-white/30" />
                          )}
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        <CardDescription className="text-white/70 text-lg">
                          {achievement.description}
                        </CardDescription>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-white/70">Progress</span>
                            <span className="text-white font-bold text-lg">
                              {achievement.progress.current}/{achievement.progress.target}
                            </span>
                          </div>
                          <Progress value={progress} className="h-3" />
                        </div>
                        
                        <div className="space-y-2">
                          <div className="text-white/70">Rewards:</div>
                          <div className="flex flex-wrap gap-2">
                            {achievement.rewards.gems && (
                              <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400">
                                +{achievement.rewards.gems} gems
                              </Badge>
                            )}
                            {achievement.rewards.tools && (
                              <Badge variant="secondary" className="bg-purple-500/20 text-purple-400">
                                {achievement.rewards.tools.length} new tools
                              </Badge>
                            )}
                            {achievement.rewards.categories && (
                              <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                                {achievement.rewards.categories.length} new categories
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        {completed && !achievement.unlocked && (
                          <Button
                            onClick={() => collectReward(achievement)}
                            disabled={collectingReward === achievement.id}
                            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold"
                          >
                            {collectingReward === achievement.id ? (
                              <div className="flex items-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Collecting...
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Gift className="w-4 h-4" />
                                Collect Reward
                              </div>
                            )}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            {/* Milestone Achievements */}
            <TabsContent value="milestone" className="space-y-6 mt-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">Epic Milestones</h2>
                <p className="text-white/70">Long-term goals with legendary rewards</p>
              </div>
              
              <div className="space-y-6">
                {getFilteredAchievements('milestone').map((achievement, index) => {
                  const IconComponent = getIconComponent(achievement.icon);
                  const completed = isCompleted(achievement);
                  const progress = getProgressPercentage(achievement);
                  
                  return (
                    <Card key={achievement.id} className={`bg-gradient-to-r ${TIER_COLORS[achievement.tier]}/20 backdrop-blur-md border-white/20 hover:scale-105 transition-all duration-300 ${completed && !achievement.unlocked ? 'ring-2 ring-yellow-400 animate-pulse' : ''}`}>
                      <CardContent className="p-8">
                        <div className="flex items-center gap-6">
                          <div className={`p-4 bg-gradient-to-r ${TIER_COLORS[achievement.tier]} rounded-xl`}>
                            <IconComponent className="w-12 h-12 text-white" />
                          </div>
                          
                          <div className="flex-1 space-y-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="text-2xl font-bold text-white">{achievement.title}</h3>
                                <p className="text-white/70 text-lg">{achievement.description}</p>
                                <Badge className={`${TIER_BADGES[achievement.tier]} text-white mt-2`}>
                                  {achievement.tier.toUpperCase()} MILESTONE
                                </Badge>
                              </div>
                              {achievement.unlocked ? (
                                <CheckCircle className="w-12 h-12 text-green-400" />
                              ) : completed ? (
                                <Gift className="w-12 h-12 text-yellow-400 animate-bounce" />
                              ) : (
                                <Circle className="w-12 h-12 text-white/30" />
                              )}
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-white/70">Progress</span>
                                <span className="text-white font-bold text-xl">
                                  {achievement.progress.current}/{achievement.progress.target}
                                </span>
                              </div>
                              <Progress value={progress} className="h-4" />
                            </div>
                            
                            <div className="space-y-2">
                              <div className="text-white/70 text-lg">Epic Rewards:</div>
                              <div className="flex flex-wrap gap-3">
                                {achievement.rewards.gems && (
                                  <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400 text-lg px-4 py-2">
                                    +{achievement.rewards.gems} gems
                                  </Badge>
                                )}
                                {achievement.rewards.tools && (
                                  <Badge variant="secondary" className="bg-purple-500/20 text-purple-400 text-lg px-4 py-2">
                                    {achievement.rewards.tools.length} legendary tools
                                  </Badge>
                                )}
                                {achievement.rewards.categories && (
                                  <Badge variant="secondary" className="bg-green-500/20 text-green-400 text-lg px-4 py-2">
                                    {achievement.rewards.categories.length} new categories
                                  </Badge>
                                )}
                                {achievement.rewards.badges && (
                                  <Badge variant="secondary" className="bg-red-500/20 text-red-400 text-lg px-4 py-2">
                                    {achievement.rewards.badges.length} exclusive badges
                                  </Badge>
                                )}
                              </div>
                            </div>
                            
                            {completed && !achievement.unlocked && (
                              <Button
                                onClick={() => collectReward(achievement)}
                                disabled={collectingReward === achievement.id}
                                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold text-lg px-8 py-3"
                              >
                                {collectingReward === achievement.id ? (
                                  <div className="flex items-center gap-2">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    Collecting Epic Reward...
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <Crown className="w-5 h-5" />
                                    Claim Epic Reward
                                  </div>
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            {/* Special Achievements */}
            <TabsContent value="special" className="space-y-6 mt-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">Special Achievements</h2>
                <p className="text-white/70">Rare accomplishments for dedicated players</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {getFilteredAchievements('special').map((achievement) => {
                  const IconComponent = getIconComponent(achievement.icon);
                  const completed = isCompleted(achievement);
                  const progress = getProgressPercentage(achievement);
                  
                  return (
                    <Card key={achievement.id} className={`bg-gradient-to-br ${TIER_COLORS[achievement.tier]}/20 backdrop-blur-md border-white/20 hover:scale-105 transition-all duration-300 relative overflow-hidden ${completed && !achievement.unlocked ? 'ring-2 ring-yellow-400 animate-pulse' : ''}`}>
                      {/* Special glow effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse"></div>
                      
                      <CardHeader className="pb-3 relative z-10">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-3 bg-gradient-to-r ${TIER_COLORS[achievement.tier]} rounded-lg relative`}>
                              <IconComponent className="w-8 h-8 text-white" />
                              <Sparkles className="w-4 h-4 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
                            </div>
                            <div>
                              <CardTitle className="text-white text-xl">{achievement.title}</CardTitle>
                              <Badge className={`${TIER_BADGES[achievement.tier]} text-white`}>
                                SPECIAL {achievement.tier.toUpperCase()}
                              </Badge>
                            </div>
                          </div>
                          {achievement.unlocked ? (
                            <CheckCircle className="w-8 h-8 text-green-400" />
                          ) : completed ? (
                            <Gift className="w-8 h-8 text-yellow-400 animate-bounce" />
                          ) : (
                            <Lock className="w-8 h-8 text-white/30" />
                          )}
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-4 relative z-10">
                        <CardDescription className="text-white/70 text-lg">
                          {achievement.description}
                        </CardDescription>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-white/70">Progress</span>
                            <span className="text-white font-bold text-lg">
                              {achievement.progress.current}/{achievement.progress.target}
                            </span>
                          </div>
                          <Progress value={progress} className="h-3" />
                        </div>
                        
                        <div className="space-y-2">
                          <div className="text-white/70">Special Rewards:</div>
                          <div className="flex flex-wrap gap-2">
                            {achievement.rewards.gems && (
                              <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400">
                                +{achievement.rewards.gems} gems
                              </Badge>
                            )}
                            {achievement.rewards.tools && (
                              <Badge variant="secondary" className="bg-purple-500/20 text-purple-400">
                                {achievement.rewards.tools.length} rare tools
                              </Badge>
                            )}
                            {achievement.rewards.badges && (
                              <Badge variant="secondary" className="bg-red-500/20 text-red-400">
                                {achievement.rewards.badges.length} exclusive badges
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        {completed && !achievement.unlocked && (
                          <Button
                            onClick={() => collectReward(achievement)}
                            disabled={collectingReward === achievement.id}
                            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold"
                          >
                            {collectingReward === achievement.id ? (
                              <div className="flex items-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Collecting...
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4" />
                                Collect Special Reward
                              </div>
                            )}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}