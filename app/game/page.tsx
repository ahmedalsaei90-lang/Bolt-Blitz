'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Zap, Clock, Target, Star, Shield, Eye, RotateCcw, ArrowLeft, Trophy, Users, Brain, CircleCheck as CheckCircle, Circle as XCircle, Timer, Sparkles, Crown, Flame, Coins } from 'lucide-react';
import { LightningLogo } from '@/components/ui/lightning-logo';
import { toast } from 'sonner';

interface User {
  id: string;
  username: string;
}

interface GameData {
  id: string;
  teams: any;
  status: string;
  scores: any;
  tools_used: any;
  double_conditions: any;
  mode?: string;
}

interface Question {
  id: string;
  category: string;
  difficulty: string;
  question_text: any;
  answers: any;
  picture_url?: string;
  viewed_by: string[];
}

interface Tool {
  id: string;
  name: string;
  icon: string;
  effect: string;
  timing: string;
  description: string;
}

const TOOLS: Tool[] = [
  {
    id: 'fifty-fifty',
    name: '50/50',
    icon: '⚡',
    effect: 'Remove 2 wrong answers',
    timing: 'Before answering',
    description: 'Eliminates two incorrect options, leaving only the correct answer and one wrong option.'
  },
  {
    id: 'double-points',
    name: 'Double Points',
    icon: '💎',
    effect: 'Double score for this question',
    timing: 'Before answering',
    description: 'Doubles the points earned from the next correct answer.'
  },
  {
    id: 'time-freeze',
    name: 'Time Freeze',
    icon: '❄️',
    effect: 'Stop timer for 10 seconds',
    timing: 'During question',
    description: 'Pauses the countdown timer for 10 seconds to give you more thinking time.'
  },
  {
    id: 'peek',
    name: 'Peek',
    icon: '👁️',
    effect: 'See opponent\'s answer',
    timing: 'After answering',
    description: 'Reveals what your opponent selected for this question.'
  },
  {
    id: 'strike',
    name: 'Strike',
    icon: '⚡',
    effect: 'Reduce opponent time by 10s',
    timing: 'During opponent turn',
    description: 'Reduces your opponent\'s remaining time by 10 seconds.'
  },
  {
    id: 'shield',
    name: 'Shield',
    icon: '🛡️',
    effect: 'Block opponent tools',
    timing: 'Passive',
    description: 'Protects you from the next opponent tool used against you.'
  }
];

const DIFFICULTY_COLORS = {
  Easy: 'bg-green-500',
  Medium: 'bg-yellow-500',
  Hard: 'bg-red-500'
};

const CATEGORY_THEMES = {
  Science: 'from-blue-600 to-cyan-600',
  History: 'from-amber-600 to-orange-600',
  Sports: 'from-green-600 to-emerald-600',
  Entertainment: 'from-purple-600 to-pink-600',
  Geography: 'from-teal-600 to-blue-600',
  Literature: 'from-indigo-600 to-purple-600',
  Technology: 'from-gray-600 to-slate-600',
  Art: 'from-rose-600 to-pink-600'
};

export default function GamePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const gameId = searchParams.get('id');
  const mode = searchParams.get('mode');
  
  const [game, setGame] = useState<GameData | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(30);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(4);
  const [currentTurn, setCurrentTurn] = useState<'A' | 'B'>('A');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [activeTool, setActiveTool] = useState<Tool | null>(null);
  const [usedTools, setUsedTools] = useState<string[]>([]);
  const [availableTools, setAvailableTools] = useState<Tool[]>([]);
  const [eliminatedAnswers, setEliminatedAnswers] = useState<number[]>([]);
  const [doublePoints, setDoublePoints] = useState(false);
  const [timeFrozen, setTimeFrozen] = useState(false);
  const [shieldActive, setShieldActive] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);

  // Check user authentication
  useEffect(() => {
    checkUser();
  }, []);

  // Load game data
  useEffect(() => {
    if (gameId && user) {
      fetchGame();
      setupRealtimeSubscription();
    }
  }, [gameId, user]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft > 0 && !answered && !timeFrozen && currentQuestion && gameStarted) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !answered && gameStarted) {
      handleTimeUp();
    }
  }, [timeLeft, answered, timeFrozen, currentQuestion, gameStarted]);

  // Load next question when current one is answered
  useEffect(() => {
    if (showResult) {
      const timer = setTimeout(() => {
        setShowResult(false);
        loadNextQuestion();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showResult]);

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

  const fetchGame = async () => {
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('id', gameId)
        .single();

      if (error) throw error;
      
      setGame(data);
      
      // Set total questions based on mode
      const questionCounts = {
        quick: 5, // Single player gets 5 questions
        practice: 4,
        custom: 6,
        tournament: 8,
        daily: 5
      };
      setTotalQuestions(questionCounts[mode as keyof typeof questionCounts] || 4);
      
      // Load available tools (simulate from achievements)
      // Get tools from URL params (selected in game setup)
      const toolsParam = searchParams.get('tools');
      const selectedToolIds = toolsParam ? toolsParam.split(',') : [];
      const selectedTools = TOOLS.filter(tool => selectedToolIds.includes(tool.id));
      setAvailableTools(selectedTools);
      
      // Start game after 3 seconds
      setTimeout(() => {
        setGameStarted(true);
        loadNextQuestion();
      }, 3000);
      
    } catch (error) {
      console.error('Error fetching game:', error);
      toast.error('Failed to load game');
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const subscription = supabase
      .channel(`game-${gameId}`)
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'games', filter: `id=eq.${gameId}` },
        (payload) => {
          setGame(payload.new as GameData);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const loadNextQuestion = async () => {
    if (!user || questionNumber > totalQuestions) {
      // Game finished
      handleGameEnd();
      return;
    }

    try {
      // Get random question not viewed by user
      const { data: questions, error } = await supabase
        .from('questions')
        .select('*')
        .not('viewed_by', 'cs', `{${user.id}}`)
        .limit(10);

      if (error) throw error;

      if (questions && questions.length > 0) {
        const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
        setCurrentQuestion(randomQuestion);
        
        // Mark as viewed
        await supabase
          .from('questions')
          .update({ 
            viewed_by: [...(randomQuestion.viewed_by || []), user.id] 
          })
          .eq('id', randomQuestion.id);

        // Reset question state
        setSelectedAnswer(null);
        setAnswered(false);
        setTimeLeft(30);
        setEliminatedAnswers([]);
        setDoublePoints(false);
        setTimeFrozen(false);
      } else {
        // No more questions available, generate one
        await generateQuestion();
      }
    } catch (error) {
      console.error('Error loading question:', error);
      toast.error('Failed to load question');
    }
  };

  const generateQuestion = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-question', {
        body: { 
          category: 'Science',
          language: 'en'
        }
      });

      if (error) throw error;

      if (data?.question) {
        setCurrentQuestion(data.question);
        setSelectedAnswer(null);
        setAnswered(false);
        setTimeLeft(30);
        setEliminatedAnswers([]);
        setDoublePoints(false);
        setTimeFrozen(false);
      }
    } catch (error) {
      console.error('Error generating question:', error);
      toast.error('Failed to generate question');
    }
  };

  const handleAnswerSelect = (answerIndex: number) => {
    if (answered || eliminatedAnswers.includes(answerIndex)) return;
    setSelectedAnswer(answerIndex);
  };

  const handleSubmitAnswer = async () => {
    if (selectedAnswer === null || answered || !currentQuestion) return;

    setAnswered(true);
    const correct = selectedAnswer === currentQuestion.answers.correct_index;
    setIsCorrect(correct);
    setShowResult(true);

    // Calculate points
    const basePoints = currentQuestion.difficulty === 'Easy' ? 100 : 
                      currentQuestion.difficulty === 'Medium' ? 200 : 400;
    const points = correct ? (doublePoints ? basePoints * 2 : basePoints) : 0;

    // Update game scores
    if (game && user) {
      const newScores = { ...game.scores };
      const teamKey = mode === 'quick' || mode === 'practice' || mode === 'daily' ? user.id : currentTurn;
      newScores[teamKey] = (newScores[teamKey] || 0) + points;

      await supabase
        .from('games')
        .update({ scores: newScores })
        .eq('id', gameId);
    }

    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(correct ? [100, 50, 100] : [200]);
    }

    // Show feedback
    toast(correct ? 'Correct! 🎉' : 'Wrong answer 😞', {
      duration: 2000,
    });

    // Update statistics
    setTotalAnswered(prev => prev + 1);
    if (correct) {
      setCorrectAnswers(prev => prev + 1);
    }

    setQuestionNumber(prev => prev + 1);
    
    // Switch turns in multiplayer
    if (isMultiplayer()) {
      setCurrentTurn(prev => prev === 'A' ? 'B' : 'A');
    }
  };

  const handleTimeUp = () => {
    setAnswered(true);
    setIsCorrect(false);
    setShowResult(true);
    setQuestionNumber(prev => prev + 1);
    toast('Time\'s up! ⏰');
    
    // Switch turns in multiplayer
    if (isMultiplayer()) {
      setCurrentTurn(prev => prev === 'A' ? 'B' : 'A');
    }
  };

  const handleGameEnd = () => {
    toast.success('Game completed! 🏆');
    setTimeout(() => {
      router.push('/achievements');
    }, 3000);
  };

  const handleToolActivation = async (tool: Tool) => {
    if (usedTools.includes(tool.id) || !currentQuestion) return;

    setActiveTool(tool);
    setUsedTools(prev => [...prev, tool.id]);

    // Apply tool effects
    switch (tool.id) {
      case 'fifty-fifty':
        const wrongAnswers = currentQuestion.answers.options
          .map((_, index) => index)
          .filter(index => index !== currentQuestion.answers.correct_index);
        const toEliminate = wrongAnswers.slice(0, 2);
        setEliminatedAnswers(toEliminate);
        break;
      
      case 'double-points':
        setDoublePoints(true);
        break;
      
      case 'time-freeze':
        setTimeFrozen(true);
        setTimeout(() => setTimeFrozen(false), 10000);
        break;
      
      case 'shield':
        setShieldActive(true);
        break;
    }

    // Update game tools_used
    if (game) {
      const newToolsUsed = { ...game.tools_used };
      const teamKey = isMultiplayer() ? currentTurn : user?.id;
      if (!newToolsUsed[teamKey!]) newToolsUsed[teamKey!] = [];
      newToolsUsed[teamKey!].push(tool.id);

      await supabase
        .from('games')
        .update({ tools_used: newToolsUsed })
        .eq('id', gameId);
    }

    // Visual feedback
    toast.success(`${tool.name} activated! ${tool.icon}`, {
      duration: 2000,
    });
    setActiveTool(null);
  };

  const isMultiplayer = () => {
    return mode === 'tournament' || mode === 'custom' || mode === 'quick';
  };

  const getTeamScore = (team: 'A' | 'B') => {
    if (!game?.scores) return 0;
    return game.scores[team] || 0;
  };

  const getUserScore = () => {
    if (!game?.scores || !user) return 0;
    return game.scores[user.id] || 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading game...</p>
        </div>
      </div>
    );
  }

  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 flex items-center justify-center">
        <Card className="bg-white/10 backdrop-blur-md border-white/20 max-w-md">
          <CardContent className="p-8 text-center">
            <LightningLogo size={64} className="mx-auto mb-4 animate-pulse" />
            <h2 className="text-2xl font-bold text-white mb-4">Get Ready!</h2>
            <p className="text-white/70 mb-6">Game starting in 3 seconds...</p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 flex items-center justify-center">
        <Card className="bg-white/10 backdrop-blur-md border-white/20 max-w-md">
          <CardContent className="p-8 text-center">
            <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">Game Complete!</h2>
            <p className="text-white/70 mb-6">Redirecting to main menu...</p>
            <Button onClick={() => router.push('/main')} className="bg-blue-600 hover:bg-blue-700">
              Return to Menu
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const categoryTheme = CATEGORY_THEMES[currentQuestion.category as keyof typeof CATEGORY_THEMES] || 'from-gray-600 to-slate-600';

  return (
    <div className="min-h-screen relative overflow-hidden" style={{
      background: 'radial-gradient(ellipse at top, rgba(128, 0, 128, 0.6) 0%, transparent 50%), radial-gradient(ellipse at bottom left, rgba(0, 0, 255, 0.6) 0%, transparent 50%), radial-gradient(ellipse at bottom right, rgba(75, 0, 130, 0.5) 0%, transparent 50%), radial-gradient(ellipse at center, #000000 0%, #0a0a0a 100%)'
    }}>
      {/* Animated Background */}
      <div className="absolute inset-0 space-content">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className={`absolute w-1 h-1 rounded-full animate-pulse ${
              i % 3 === 0 ? 'bg-purple-400' : i % 3 === 1 ? 'bg-blue-400' : 'bg-indigo-400'
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
      <div className="relative z-10 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/main')}
                className="text-white border-white/20 hover:bg-white/10"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Exit
              </Button>
              <div className="flex items-center gap-2">
                <LightningLogo size={24} />
                <span className="text-white font-bold">Bolt Blitz</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="text-sm">
                Question {questionNumber} of {totalQuestions}
              </Badge>
              <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-1">
                <Clock className="w-4 h-4 text-blue-400" />
                <span className={`font-bold ${timeLeft <= 10 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                  {timeLeft}s
                </span>
              </div>
            </div>
          </div>

          {/* Game Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Team A Panel (Multiplayer) */}
            {isMultiplayer() && (
              <div className={`lg:col-span-2 ${currentTurn === 'A' ? 'ring-2 ring-blue-400 animate-pulse' : ''}`}>
                <Card className="bg-blue-500/20 backdrop-blur-md border-blue-400/30 h-full">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-blue-400 text-sm flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Team A
                      {currentTurn === 'A' && <Badge className="bg-blue-500 text-white text-xs">Your Turn</Badge>}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">{getTeamScore('A')}</div>
                      <div className="text-xs text-white/70">Points</div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-xs text-white/70 uppercase tracking-wide">Tools</div>
                      {availableTools.map((tool) => (
                        <Dialog key={tool.id}>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={usedTools.includes(tool.id) || currentTurn !== 'A'}
                              className={`w-full text-xs justify-start ${
                                usedTools.includes(tool.id) ? 'opacity-50' : 'hover:scale-105'
                              }`}
                            >
                              <span className="mr-2">{tool.icon}</span>
                              {tool.name}
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-gray-900 border-gray-700">
                            <DialogHeader>
                              <DialogTitle className="text-white flex items-center gap-2">
                                <span className="text-2xl">{tool.icon}</span>
                                {tool.name}
                              </DialogTitle>
                              <DialogDescription className="text-gray-300">
                                {tool.description}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="text-sm text-gray-400">
                                <strong>Effect:</strong> {tool.effect}
                              </div>
                              <div className="text-sm text-gray-400">
                                <strong>Timing:</strong> {tool.timing}
                              </div>
                              <Button
                                onClick={() => handleToolActivation(tool)}
                                className="w-full bg-blue-600 hover:bg-blue-700"
                                disabled={usedTools.includes(tool.id)}
                              >
                                Activate Tool
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Main Game Area */}
            <div className={`${isMultiplayer() ? 'lg:col-span-8' : 'lg:col-span-12'}`}>
              {/* Category Banner */}
              <div className={`bg-gradient-to-r ${categoryTheme} rounded-lg p-4 mb-6 text-center`}>
                <div className="flex items-center justify-center gap-4">
                  <Badge className={`${DIFFICULTY_COLORS[currentQuestion.difficulty as keyof typeof DIFFICULTY_COLORS]} text-white`}>
                    {currentQuestion.difficulty}
                  </Badge>
                  <h2 className="text-2xl font-bold text-white">{currentQuestion.category}</h2>
                  <div className="flex items-center gap-1">
                    {[...Array(3)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`w-4 h-4 ${i < (currentQuestion.difficulty === 'Easy' ? 1 : currentQuestion.difficulty === 'Medium' ? 2 : 3) ? 'text-yellow-400 fill-current' : 'text-gray-400'}`} 
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Question Card */}
              <Card className="bg-white/10 backdrop-blur-md border-white/20 mb-6">
                <CardContent className="p-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Question Text */}
                    <div className="space-y-6">
                      <h3 className="text-2xl lg:text-3xl font-bold text-white leading-relaxed">
                        {currentQuestion.question_text?.en || currentQuestion.question_text}
                      </h3>
                      
                      {/* Timer Visualization */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-white/70">Time Remaining</span>
                          <span className={`text-sm font-bold ${timeLeft <= 10 ? 'text-red-400' : 'text-white'}`}>
                            {timeLeft}s
                          </span>
                        </div>
                        <Progress 
                          value={(timeLeft / 30) * 100} 
                          className={`h-2 ${timeLeft <= 10 ? 'animate-pulse' : ''}`}
                        />
                        {timeFrozen && (
                          <div className="flex items-center gap-2 text-blue-400 text-sm">
                            <Timer className="w-4 h-4" />
                            Time Frozen!
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Question Image */}
                    {currentQuestion.picture_url && (
                      <div className="flex items-center justify-center">
                        <img
                          src={currentQuestion.picture_url}
                          alt="Question illustration"
                          className="max-w-full h-48 object-cover rounded-lg shadow-lg"
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Answer Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {currentQuestion.answers.options.map((option: string, index: number) => (
                  <Button
                    key={index}
                    variant={selectedAnswer === index ? "default" : "outline"}
                    size="lg"
                    disabled={answered || eliminatedAnswers.includes(index)}
                    onClick={() => handleAnswerSelect(index)}
                    className={`p-6 text-left justify-start h-auto transition-all duration-300 ${
                      selectedAnswer === index 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white scale-105 shadow-lg' 
                        : eliminatedAnswers.includes(index)
                        ? 'opacity-30 cursor-not-allowed line-through'
                        : 'bg-white/10 hover:bg-white/20 text-white hover:scale-105'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        selectedAnswer === index ? 'bg-white text-blue-600' : 'bg-blue-600 text-white'
                      }`}>
                        {String.fromCharCode(65 + index)}
                      </div>
                      <span className="text-lg">{option}</span>
                    </div>
                  </Button>
                ))}
              </div>

              {/* Submit Button */}
              <div className="text-center">
                <Button
                  size="lg"
                  disabled={selectedAnswer === null || answered}
                  onClick={handleSubmitAnswer}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold px-12 py-4 text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  {answered ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Processing...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      Submit Answer
                      {doublePoints && <Badge className="bg-yellow-500 text-black ml-2">2x Points!</Badge>}
                    </div>
                  )}
                </Button>
              </div>
            </div>

            {/* Team B Panel (Multiplayer) */}
            {isMultiplayer() && (
              <div className={`lg:col-span-2 ${currentTurn === 'B' ? 'ring-2 ring-purple-400 animate-pulse' : ''}`}>
                <Card className="bg-purple-500/20 backdrop-blur-md border-purple-400/30 h-full">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-purple-400 text-sm flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Team B
                      {currentTurn === 'B' && <Badge className="bg-purple-500 text-white text-xs">Your Turn</Badge>}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">{getTeamScore('B')}</div>
                      <div className="text-xs text-white/70">Points</div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-xs text-white/70 uppercase tracking-wide">Tools</div>
                      {availableTools.map((tool) => (
                        <Dialog key={tool.id}>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={usedTools.includes(tool.id) || currentTurn !== 'B'}
                              className={`w-full text-xs justify-start ${
                                usedTools.includes(tool.id) ? 'opacity-50' : 'hover:scale-105'
                              }`}
                            >
                              <span className="mr-2">{tool.icon}</span>
                              {tool.name}
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-gray-900 border-gray-700">
                            <DialogHeader>
                              <DialogTitle className="text-white flex items-center gap-2">
                                <span className="text-2xl">{tool.icon}</span>
                                {tool.name}
                              </DialogTitle>
                              <DialogDescription className="text-gray-300">
                                {tool.description}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="text-sm text-gray-400">
                                <strong>Effect:</strong> {tool.effect}
                              </div>
                              <div className="text-sm text-gray-400">
                                <strong>Timing:</strong> {tool.timing}
                              </div>
                              <Button
                                onClick={() => handleToolActivation(tool)}
                                className="w-full bg-purple-600 hover:bg-purple-700"
                                disabled={usedTools.includes(tool.id)}
                              >
                                Activate Tool
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Solo Score Panel */}
            {!isMultiplayer() && (
              <div className="lg:col-span-12">
                <Card className="bg-white/10 backdrop-blur-md border-white/20 mb-6">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar className="w-12 h-12">
                          <AvatarFallback className="bg-blue-600 text-white">
                            {user?.username?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-bold text-white">{user?.username}</div>
                          <div className="text-sm text-white/70 flex items-center gap-2">
                            <Coins className="w-4 h-4" />
                            Score: {getUserScore()}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        {availableTools.map((tool) => (
                          <Dialog key={tool.id}>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={usedTools.includes(tool.id)}
                                className={`${usedTools.includes(tool.id) ? 'opacity-50' : 'hover:scale-105'}`}
                              >
                                <span className="mr-1">{tool.icon}</span>
                                {tool.name}
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-gray-900 border-gray-700">
                              <DialogHeader>
                                <DialogTitle className="text-white flex items-center gap-2">
                                  <span className="text-2xl">{tool.icon}</span>
                                  {tool.name}
                                </DialogTitle>
                                <DialogDescription className="text-gray-300">
                                  {tool.description}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="text-sm text-gray-400">
                                  <strong>Effect:</strong> {tool.effect}
                                </div>
                                <div className="text-sm text-gray-400">
                                  <strong>Timing:</strong> {tool.timing}
                                </div>
                                <Button
                                  onClick={() => handleToolActivation(tool)}
                                  className="w-full bg-blue-600 hover:bg-blue-700"
                                  disabled={usedTools.includes(tool.id)}
                                >
                                  Activate Tool
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Result Overlay */}
      {showResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className={`${isCorrect ? 'bg-green-500/20 border-green-400' : 'bg-red-500/20 border-red-400'} backdrop-blur-md max-w-md`}>
            <CardContent className="p-8 text-center">
              {isCorrect ? (
                <div className="space-y-4">
                  <div className="relative">
                    <CheckCircle className="w-16 h-16 text-green-400 mx-auto animate-bounce" />
                    <div className="absolute inset-0 w-16 h-16 bg-green-400/20 rounded-full animate-ping mx-auto"></div>
                  </div>
                  <h3 className="text-2xl font-bold text-white">Correct!</h3>
                  <div className="space-y-2">
                    <p className="text-white/70">
                      +{currentQuestion?.difficulty === 'Easy' ? 100 : currentQuestion?.difficulty === 'Medium' ? 200 : 400}
                      {doublePoints && ' x2'} points
                    </p>
                    {doublePoints && (
                      <Badge className="bg-yellow-500 text-black">Double Points Bonus!</Badge>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative">
                    <XCircle className="w-16 h-16 text-red-400 mx-auto animate-pulse" />
                    <div className="absolute inset-0 w-16 h-16 bg-red-400/20 rounded-full animate-ping mx-auto"></div>
                  </div>
                  <h3 className="text-2xl font-bold text-white">Wrong!</h3>
                  <p className="text-white/70">
                    The correct answer was: <br />
                    <strong>{currentQuestion?.answers.options[currentQuestion?.answers.correct_index]}</strong>
                  </p>
                  {currentQuestion?.answers.fact && (
                    <div className="mt-4 p-3 bg-blue-500/20 rounded-lg">
                      <p className="text-blue-200 text-sm">
                        <strong>Did you know?</strong> {currentQuestion.answers.fact}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Game Results Sheet */}
      {gameEnded && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <Card className="bg-white/10 backdrop-blur-md border-white/20 max-w-lg w-full mx-4">
            <CardHeader className="text-center">
              <div className="relative">
                <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4 animate-bounce" />
                <div className="absolute inset-0 w-16 h-16 bg-yellow-400/20 rounded-full animate-ping mx-auto"></div>
              </div>
              <CardTitle className="text-3xl font-bold text-white">Game Complete!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Final Score */}
              <div className="text-center">
                <div className="text-4xl font-bold text-yellow-400 mb-2">{finalScore}</div>
                <div className="text-white/70">Final Score</div>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-500/20 rounded-lg">
                  <div className="text-2xl font-bold text-blue-400">{correctAnswers}</div>
                  <div className="text-sm text-white/70">Correct Answers</div>
                </div>
                <div className="text-center p-4 bg-purple-500/20 rounded-lg">
                  <div className="text-2xl font-bold text-purple-400">{totalAnswered}</div>
                  <div className="text-sm text-white/70">Total Questions</div>
                </div>
              </div>

              {/* Accuracy */}
              <div className="text-center p-4 bg-green-500/20 rounded-lg">
                <div className="text-2xl font-bold text-green-400">
                  {totalAnswered > 0 ? Math.round((correctAnswers / totalAnswered) * 100) : 0}%
                </div>
                <div className="text-sm text-white/70">Accuracy</div>
              </div>

              {/* Performance Badge */}
              <div className="text-center">
                {correctAnswers / totalAnswered >= 0.8 ? (
                  <Badge className="bg-yellow-500 text-black text-lg px-4 py-2">
                    🏆 Excellent Performance!
                  </Badge>
                ) : correctAnswers / totalAnswered >= 0.6 ? (
                  <Badge className="bg-blue-500 text-white text-lg px-4 py-2">
                    👍 Good Job!
                  </Badge>
                ) : (
                  <Badge className="bg-gray-500 text-white text-lg px-4 py-2">
                    💪 Keep Practicing!
                  </Badge>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={() => router.push('/main')}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Main Menu
                </Button>
                <Button
                  onClick={() => router.push('/achievements')}
                  variant="outline"
                  className="flex-1 text-white border-white/20 hover:bg-white/10"
                >
                  View Achievements
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}