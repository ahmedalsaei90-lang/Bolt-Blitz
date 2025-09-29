'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Trophy, Crown, Medal, Award, Star, TrendingUp, Users, Target, Zap } from 'lucide-react';
import { LightningLogo } from '@/components/ui/lightning-logo';

interface LeaderboardEntry {
  id: string;
  user_id: string;
  score: number;
  rank: number;
  users: { 
    username: string;
    stats: {
      games_played: number;
      wins: number;
      accuracy: number;
    };
  };
}

interface User {
  id: string;
  username: string;
}

export default function LeaderboardPage() {
  const router = useRouter();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
    fetchLeaderboard();
    setupRealtimeSubscription();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: userData } = await supabase
          .from('users')
          .select('id, username')
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

  const fetchLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('leaderboards')
        .select(`
          *,
          users (username, stats)
        `)
        .order('rank', { ascending: true })
        .limit(50);

      if (error) throw error;

      if (data) {
        setLeaderboard(data);
        
        // Find user's rank
        if (user) {
          const userEntry = data.find(entry => entry.user_id === user.id);
          setUserRank(userEntry?.rank || null);
        }
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const subscription = supabase
      .channel('leaderboard-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'leaderboards' },
        () => fetchLeaderboard()
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-400" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-orange-600" />;
      default:
        return <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-white text-sm font-bold">{rank}</div>;
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return 'bg-yellow-500 text-black';
    if (rank === 2) return 'bg-gray-400 text-black';
    if (rank === 3) return 'bg-orange-600 text-white';
    if (rank <= 10) return 'bg-blue-500 text-white';
    return 'bg-white/20 text-white';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading leaderboard...</p>
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
              i % 3 === 0 ? 'bg-purple-400' : 
              i % 3 === 1 ? 'bg-blue-400' : 'bg-indigo-400'
            }`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${8 + Math.random() * 4}s`,
              transform: `translateY(${Math.sin(i) * 20}px)`,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <div className="relative z-10 p-6">
        <div className="max-w-4xl mx-auto">
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
                  Leaderboard
                </h1>
              </div>
            </div>

            {/* User Rank */}
            {userRank && (
              <div className="flex items-center gap-2 bg-blue-500/20 rounded-lg px-4 py-2">
                <Trophy className="w-5 h-5 text-blue-400" />
                <span className="text-blue-400 font-bold">Your Rank: #{userRank}</span>
              </div>
            )}
          </div>

          {/* Top 3 Podium */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {leaderboard.slice(0, 3).map((entry, index) => (
              <Card key={entry.id} className={`${
                index === 0 ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-yellow-400/30 md:order-2' :
                index === 1 ? 'bg-gradient-to-br from-gray-400/20 to-gray-600/20 border-gray-400/30 md:order-1' :
                'bg-gradient-to-br from-orange-600/20 to-red-600/20 border-orange-400/30 md:order-3'
              } backdrop-blur-md hover:scale-105 transition-all duration-300`}>
                <CardContent className="p-6 text-center">
                  <div className="relative mb-4">
                    {getRankIcon(entry.rank)}
                    <div className={`absolute -top-2 -right-2 w-8 h-8 rounded-full ${getRankBadge(entry.rank)} flex items-center justify-center text-xs font-bold`}>
                      #{entry.rank}
                    </div>
                  </div>
                  
                  <Avatar className="w-16 h-16 mx-auto mb-4 border-2 border-white/20">
                    <AvatarFallback className="bg-blue-600 text-white text-xl">
                      {entry.users.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <h3 className="text-xl font-bold text-white mb-2">{entry.users.username}</h3>
                  <div className="text-2xl font-bold text-yellow-400 mb-2">{entry.score}</div>
                  <div className="text-sm text-white/70">points</div>
                  
                  <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center">
                      <div className="text-blue-400 font-bold">{entry.users.stats?.games_played || 0}</div>
                      <div className="text-white/60">Games</div>
                    </div>
                    <div className="text-center">
                      <div className="text-green-400 font-bold">{entry.users.stats?.wins || 0}</div>
                      <div className="text-white/60">Wins</div>
                    </div>
                    <div className="text-center">
                      <div className="text-purple-400 font-bold">{entry.users.stats?.accuracy || 0}%</div>
                      <div className="text-white/60">Accuracy</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Full Leaderboard */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Full Rankings
              </CardTitle>
              <CardDescription className="text-white/70">
                Complete leaderboard with all players
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {leaderboard.map((entry) => (
                  <div key={entry.id} className={`flex items-center gap-4 p-4 rounded-lg transition-all duration-300 hover:scale-105 ${
                    entry.user_id === user?.id ? 'bg-blue-500/20 border border-blue-400/30' : 'bg-white/5 hover:bg-white/10'
                  }`}>
                    <div className="flex items-center gap-3">
                      {getRankIcon(entry.rank)}
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-blue-600 text-white">
                          {entry.users.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{entry.users.username}</span>
                        {entry.user_id === user?.id && (
                          <Badge className="bg-blue-500 text-white text-xs">You</Badge>
                        )}
                      </div>
                      <div className="text-sm text-white/60">
                        {entry.users.stats?.games_played || 0} games • {entry.users.stats?.wins || 0} wins • {entry.users.stats?.accuracy || 0}% accuracy
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-xl font-bold text-yellow-400">{entry.score}</div>
                      <div className="text-xs text-white/60">points</div>
                    </div>
                  </div>
                ))}
                
                {leaderboard.length === 0 && (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-white/30 mx-auto mb-4" />
                    <p className="text-white/60">No players on the leaderboard yet</p>
                    <p className="text-white/40 text-sm mt-2">Be the first to play and claim the top spot!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}