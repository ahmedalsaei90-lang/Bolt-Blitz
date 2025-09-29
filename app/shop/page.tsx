'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, ShoppingCart, Coins, Star, Zap, Crown, Shield, Eye, RotateCcw, Timer, Brain, Globe, Palette, Volume2, Bell, Lock, Clock as Unlock, Gift, TrendingUp, Clock, DollarSign, CreditCard, Receipt, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle } from 'lucide-react';
import { LightningLogo } from '@/components/ui/lightning-logo';
import { toast } from 'sonner';

interface User {
  id: string;
  username: string;
  coins: number;
  gems: number;
  age: number;
}

interface ShopItem {
  id: string;
  name: string;
  description: string;
  price_usd: number;
  coins_reward?: number;
  games_reward?: number;
  category: 'games' | 'tools' | 'categories' | 'premium';
  icon: string;
  featured?: boolean;
  discount?: number;
  limited_time?: boolean;
  age_restricted?: boolean;
  preview?: string;
}

interface Purchase {
  id: string;
  item: string;
  cost_usd: number;
  purchased_at: string;
}

const SHOP_ITEMS: ShopItem[] = [
  // Game Credit Packages
  {
    id: 'games-1',
    name: '1 Game Credit',
    description: 'Single game access',
    price_usd: 2.00,
    games_reward: 1,
    category: 'games',
    icon: 'gamepad',
  },
  {
    id: 'games-5',
    name: '5 Game Credits',
    description: 'Five games with bonus',
    price_usd: 7.50,
    games_reward: 5,
    category: 'games',
    icon: 'gamepad',
    discount: 25,
    featured: true,
  },
  {
    id: 'games-10',
    name: '10 Game Credits',
    description: 'Ten games bundle',
    price_usd: 15.00,
    games_reward: 10,
    category: 'games',
    icon: 'gamepad',
  },
  {
    id: 'games-15',
    name: '15 Game Credits',
    description: 'Best value game package',
    price_usd: 20.00,
    games_reward: 15,
    category: 'games',
    icon: 'gamepad',
    discount: 33,
    featured: true,
  },
  // Premium Tools
  {
    id: 'tool-gamble',
    name: 'Gamble Tool',
    description: 'Risk points for double or nothing',
    price_usd: 4.99,
    category: 'tools',
    icon: 'zap',
    preview: 'Bet your current points for a chance to double them',
  },
  {
    id: 'tool-oracle',
    name: 'Oracle Tool',
    description: 'See next 3 questions in advance',
    price_usd: 6.99,
    category: 'tools',
    icon: 'eye',
    preview: 'Preview upcoming questions to strategize',
  },
  {
    id: 'tool-rewind',
    name: 'Rewind Tool',
    description: 'Undo your last answer',
    price_usd: 3.99,
    category: 'tools',
    icon: 'rotate-ccw',
    preview: 'Change your answer if you made a mistake',
  },
  // Exclusive Categories
  {
    id: 'category-mythology',
    name: 'Mythology Category',
    description: 'Ancient myths and legends',
    price_usd: 2.99,
    category: 'categories',
    icon: 'crown',
    preview: 'Questions about gods, heroes, and ancient stories',
  },
  {
    id: 'category-space',
    name: 'Space & Astronomy',
    description: 'Explore the cosmos',
    price_usd: 3.99,
    category: 'categories',
    icon: 'globe',
    preview: 'Questions about planets, stars, and space exploration',
  },
  // Premium Features
  {
    id: 'premium-themes',
    name: 'Premium Themes',
    description: 'Exclusive visual themes',
    price_usd: 4.99,
    category: 'premium',
    icon: 'palette',
    preview: 'Neon, Galaxy, and Retro themes',
  },
  {
    id: 'premium-sounds',
    name: 'Sound Pack',
    description: 'Enhanced audio effects',
    price_usd: 2.99,
    category: 'premium',
    icon: 'volume-2',
    preview: 'Epic sound effects and background music',
  },
  {
    id: 'premium-ad-free',
    name: 'Ad-Free Experience',
    description: 'Remove all advertisements',
    price_usd: 9.99,
    category: 'premium',
    icon: 'shield',
    featured: true,
    preview: 'Uninterrupted gameplay experience',
  },
];

const CATEGORY_ICONS = {
  games: ShoppingCart,
  tools: Zap,
  categories: Brain,
  premium: Crown,
};

const ITEM_ICONS = {
  gamepad: ShoppingCart,
  zap: Zap,
  eye: Eye,
  'rotate-ccw': RotateCcw,
  crown: Crown,
  globe: Globe,
  palette: Palette,
  'volume-2': Volume2,
  shield: Shield,
};

export default function ShopPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('games');
  const [cart, setCart] = useState<ShopItem[]>([]);
  const [purchaseHistory, setPurchaseHistory] = useState<Purchase[]>([]);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchPurchaseHistory();
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
    } finally {
      setLoading(false);
    }
  };

  const fetchPurchaseHistory = async () => {
    try {
      if (!user) return;

      const { data, error } = await supabase
        .from('shop_purchases')
        .select('*')
        .eq('user_id', user.id)
        .order('purchased_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      if (data) {
        setPurchaseHistory(data);
      }
    } catch (error) {
      console.error('Error fetching purchase history:', error);
    }
  };

  const handlePurchase = async (item: ShopItem) => {
    if (!user || purchasing) return;

    // Age restriction check
    if (item.age_restricted && user.age < 18) {
      toast.error('This item requires parental permission for users under 18');
      return;
    }

    // High-value confirmation
    if (item.price_usd >= 10) {
      const confirmed = window.confirm(`Confirm purchase of ${item.name} for $${item.price_usd.toFixed(2)}?`);
      if (!confirmed) return;
    }

    setPurchasing(item.id);

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update user coins/games if applicable
      let updateData: any = {};
      if (item.coins_reward) {
        updateData.coins = user.coins + item.coins_reward;
      }
      if (item.games_reward) {
        // For now, we'll add games as coins (1 game = 50 coins equivalent)
        updateData.coins = (user.coins || 0) + (item.games_reward * 50);
      }

      if (Object.keys(updateData).length > 0) {
        const { error: userError } = await supabase
          .from('users')
          .update(updateData)
          .eq('id', user.id);

        if (userError) throw userError;

        // Update local user state
        setUser({ ...user, ...updateData });
      }

      // Record purchase
      const { error: purchaseError } = await supabase
        .from('shop_purchases')
        .insert({
          user_id: user.id,
          item: item.name,
          cost_usd: item.price_usd,
          purchased_at: new Date().toISOString()
        });

      if (purchaseError) throw purchaseError;

      // Refresh purchase history
      await fetchPurchaseHistory();

      // Success feedback
      toast.success(`🎉 Successfully purchased ${item.name}!`);

      // Remove from cart if it was there
      setCart(prev => prev.filter(cartItem => cartItem.id !== item.id));

    } catch (error) {
      console.error('Error processing purchase:', error);
      toast.error('Purchase failed. Please try again.');
    } finally {
      setPurchasing(null);
    }
  };

  const addToCart = (item: ShopItem) => {
    if (cart.find(cartItem => cartItem.id === item.id)) {
      toast.info('Item already in cart');
      return;
    }
    setCart(prev => [...prev, item]);
    toast.success(`Added ${item.name} to cart`);
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(item => item.id !== itemId));
    toast.success('Removed from cart');
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + item.price_usd, 0);
  };

  const getFilteredItems = (category: string) => {
    return SHOP_ITEMS.filter(item => item.category === category);
  };

  const getFeaturedItems = () => {
    return SHOP_ITEMS.filter(item => item.featured);
  };

  const getIconComponent = (iconName: string) => {
    const IconComponent = ITEM_ICONS[iconName as keyof typeof ITEM_ICONS] || ShoppingCart;
    return IconComponent;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-black text-lg">Loading shop...</p>
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
        {[...Array(40)].map((_, i) => (
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
                className="text-black border-white/20 hover:bg-white/10"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Menu
              </Button>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <LightningLogo size={32} className="animate-pulse drop-shadow-lg" />
                  <div className="absolute inset-0 w-8 h-8 bg-blue-400/20 rounded-full animate-ping" />
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Game Shop
                </h1>
              </div>
            </div>

            {/* User Balance & Cart */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-blue-500/20 rounded-lg px-4 py-2">
                <Coins className="w-5 h-5 text-blue-400" />
                <span className="text-blue-400 font-bold text-lg">{user?.coins || 0}</span>
                <span className="text-blue-300 text-sm">coins</span>
              </div>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="relative text-black border-white/20 hover:bg-white/10">
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Cart
                    {cart.length > 0 && (
                      <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs">
                        {cart.length}
                      </Badge>
                    )}
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-gray-900 border-gray-700 max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-black flex items-center gap-2">
                      <ShoppingCart className="w-5 h-5" />
                      Shopping Cart
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {cart.length === 0 ? (
                      <p className="text-gray-400 text-center py-8">Your cart is empty</p>
                    ) : (
                      <>
                        {cart.map((item) => (
                          <div key={item.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                            <div>
                              <h4 className="text-black font-medium">{item.name}</h4>
                              <p className="text-gray-400 text-sm">${item.price_usd.toFixed(2)}</p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => removeFromCart(item.id)}
                              className="text-red-400 border-red-400 hover:bg-red-400/10"
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                        <div className="border-t border-gray-700 pt-4">
                          <div className="flex justify-between items-center mb-4">
                            <span className="text-black font-bold">Total:</span>
                            <span className="text-black font-bold text-lg">${getCartTotal().toFixed(2)}</span>
                          </div>
                          <Button className="w-full bg-blue-600 hover:bg-blue-700">
                            Checkout (Coming Soon)
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </DialogContent>
              </Dialog>

              <Button
                variant="outline"
                onClick={() => setShowHistory(!showHistory)}
                className="text-black border-white/20 hover:bg-white/10"
              >
                <Receipt className="w-4 h-4 mr-2" />
                History
              </Button>
            </div>
          </div>

          {/* Featured Deals Banner */}
          <Card className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-md border-yellow-400/30 mb-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-black mb-2">🔥 Featured Deals</h2>
                  <p className="text-black/70">Limited time offers with amazing discounts!</p>
                </div>
                <div className="flex gap-4">
                  {getFeaturedItems().slice(0, 2).map((item) => (
                    <Card key={item.id} className="bg-white/10 backdrop-blur-md border-white/20 min-w-[200px]">
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl mb-2">{item.discount}% OFF</div>
                        <h3 className="font-bold text-black">{item.name}</h3>
                        <p className="text-black/70 text-sm mb-2">{item.description}</p>
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-gray-400 line-through text-sm">
                            ${(item.price_usd / (1 - item.discount! / 100)).toFixed(2)}
                          </span>
                          <span className="text-green-400 font-bold">${item.price_usd.toFixed(2)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Purchase History */}
          {showHistory && (
            <Card className="bg-white/10 backdrop-blur-md border-white/20 mb-8">
              <CardHeader>
                <CardTitle className="text-black flex items-center gap-2">
                  <Receipt className="w-5 h-5" />
                  Purchase History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {purchaseHistory.length === 0 ? (
                  <p className="text-black/70 text-center py-4">No purchases yet</p>
                ) : (
                  <div className="space-y-3">
                    {purchaseHistory.map((purchase) => (
                      <div key={purchase.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <div>
                          <h4 className="text-black font-medium">{purchase.item}</h4>
                          <p className="text-black/70 text-sm">
                            {new Date(purchase.purchased_at).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="text-green-400 font-bold">${purchase.cost_usd.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Shop Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-white/10 backdrop-blur-md">
              <TabsTrigger value="games" className="flex items-center gap-2 data-[state=active]:bg-blue-500">
                <ShoppingCart className="w-4 h-4" />
                Games
              </TabsTrigger>
              <TabsTrigger value="tools" className="flex items-center gap-2 data-[state=active]:bg-purple-500">
                <Zap className="w-4 h-4" />
                Tools
              </TabsTrigger>
              <TabsTrigger value="categories" className="flex items-center gap-2 data-[state=active]:bg-green-500">
                <Brain className="w-4 h-4" />
                Categories
              </TabsTrigger>
              <TabsTrigger value="premium" className="flex items-center gap-2 data-[state=active]:bg-yellow-500">
                <Crown className="w-4 h-4" />
                Premium
              </TabsTrigger>
            </TabsList>

            {/* Game Credits Tab */}
            <TabsContent value="games" className="space-y-6 mt-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-black mb-2">Game Credit Packages</h2>
                <p className="text-black/70">Purchase game credits to play unlimited matches</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {getFilteredItems('games').map((item) => {
                  const IconComponent = getIconComponent(item.icon);
                  const originalPrice = item.discount ? item.price_usd / (1 - item.discount / 100) : null;
                  
                  return (
                    <Card key={item.id} className={`bg-white/10 backdrop-blur-md border-white/20 hover:scale-105 transition-all duration-300 ${item.featured ? 'ring-2 ring-yellow-400' : ''}`}>
                      <CardHeader className="text-center">
                        {item.featured && (
                          <Badge className="bg-yellow-500 text-black font-bold mb-2 mx-auto w-fit">
                            BEST VALUE
                          </Badge>
                        )}
                        {item.discount && (
                          <Badge className="bg-red-500 text-white font-bold mb-2 mx-auto w-fit">
                            {item.discount}% OFF
                          </Badge>
                        )}
                        <div className="p-4 bg-blue-500/20 rounded-lg mx-auto w-fit">
                          <IconComponent className="w-8 h-8 text-blue-400" />
                        </div>
                        <CardTitle className="text-black text-xl">{item.name}</CardTitle>
                        <CardDescription className="text-black/70">
                          {item.description}
                        </CardDescription>
                      </CardHeader>
                      
                      <CardContent className="text-center space-y-4">
                        <div className="space-y-2">
                          {originalPrice && (
                            <div className="text-gray-400 line-through text-lg">
                              ${originalPrice.toFixed(2)}
                            </div>
                          )}
                          <div className="text-3xl font-bold text-black">
                            ${item.price_usd.toFixed(2)}
                          </div>
                          {item.games_reward && (
                            <div className="text-blue-400 font-medium">
                              {item.games_reward} Game{item.games_reward > 1 ? 's' : ''}
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <Button
                            onClick={() => handlePurchase(item)}
                            disabled={purchasing === item.id}
                            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold"
                          >
                            {purchasing === item.id ? (
                              <div className="flex items-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Processing...
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <CreditCard className="w-4 h-4" />
                                Buy Now
                              </div>
                            )}
                          </Button>
                          
                          <Button
                            variant="outline"
                            onClick={() => addToCart(item)}
                            className="w-full text-black border-white/20 hover:bg-white/10"
                          >
                            Add to Cart
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            {/* Tools Tab */}
            <TabsContent value="tools" className="space-y-6 mt-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-black mb-2">Premium Tools</h2>
                <p className="text-black/70">Unlock powerful tools to dominate your games</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getFilteredItems('tools').map((item) => {
                  const IconComponent = getIconComponent(item.icon);
                  
                  return (
                    <Card key={item.id} className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-md border-purple-400/30 hover:scale-105 transition-all duration-300">
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-purple-500/30 rounded-lg">
                            <IconComponent className="w-8 h-8 text-purple-400" />
                          </div>
                          <div>
                            <CardTitle className="text-black text-xl">{item.name}</CardTitle>
                            <CardDescription className="text-black/70">
                              {item.description}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        {item.preview && (
                          <div className="p-3 bg-purple-500/20 rounded-lg">
                            <p className="text-purple-200 text-sm">
                              <strong>Preview:</strong> {item.preview}
                            </p>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <div className="text-2xl font-bold text-black">
                            ${item.price_usd.toFixed(2)}
                          </div>
                          <Badge className="bg-purple-500 text-white">
                            PREMIUM TOOL
                          </Badge>
                        </div>
                        
                        <div className="space-y-2">
                          <Button
                            onClick={() => handlePurchase(item)}
                            disabled={purchasing === item.id}
                            className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-bold"
                          >
                            {purchasing === item.id ? (
                              <div className="flex items-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Unlocking...
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Unlock className="w-4 h-4" />
                                Unlock Tool
                              </div>
                            )}
                          </Button>
                          
                          <Button
                            variant="outline"
                            onClick={() => addToCart(item)}
                            className="w-full text-black border-white/20 hover:bg-white/10"
                          >
                            Add to Cart
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            {/* Categories Tab */}
            <TabsContent value="categories" className="space-y-6 mt-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-black mb-2">Exclusive Categories</h2>
                <p className="text-black/70">Unlock new question categories for diverse gameplay</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {getFilteredItems('categories').map((item) => {
                  const IconComponent = getIconComponent(item.icon);
                  
                  return (
                    <Card key={item.id} className="bg-gradient-to-br from-green-600/20 to-teal-600/20 backdrop-blur-md border-green-400/30 hover:scale-105 transition-all duration-300">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="p-4 bg-green-500/30 rounded-lg">
                            <IconComponent className="w-10 h-10 text-green-400" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-2xl font-bold text-black">{item.name}</h3>
                            <p className="text-black/70 text-lg">{item.description}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-black">
                              ${item.price_usd.toFixed(2)}
                            </div>
                            <Badge className="bg-green-500 text-white">
                              NEW CATEGORY
                            </Badge>
                          </div>
                        </div>
                        
                        {item.preview && (
                          <div className="p-4 bg-green-500/20 rounded-lg mb-4">
                            <p className="text-green-200">
                              <strong>What you'll get:</strong> {item.preview}
                            </p>
                          </div>
                        )}
                        
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handlePurchase(item)}
                            disabled={purchasing === item.id}
                            className="flex-1 bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white font-bold"
                          >
                            {purchasing === item.id ? (
                              <div className="flex items-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Unlocking...
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Unlock className="w-4 h-4" />
                                Unlock Category
                              </div>
                            )}
                          </Button>
                          
                          <Button
                            variant="outline"
                            onClick={() => addToCart(item)}
                            className="text-black border-white/20 hover:bg-white/10"
                          >
                            <ShoppingCart className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            {/* Premium Features Tab */}
            <TabsContent value="premium" className="space-y-6 mt-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-black mb-2">Premium Features</h2>
                <p className="text-black/70">Enhance your gaming experience with premium upgrades</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getFilteredItems('premium').map((item) => {
                  const IconComponent = getIconComponent(item.icon);
                  
                  return (
                    <Card key={item.id} className={`bg-gradient-to-br from-yellow-600/20 to-orange-600/20 backdrop-blur-md border-yellow-400/30 hover:scale-105 transition-all duration-300 ${item.featured ? 'ring-2 ring-yellow-400' : ''}`}>
                      <CardHeader>
                        {item.featured && (
                          <Badge className="bg-yellow-500 text-black font-bold mb-2 mx-auto w-fit">
                            MOST POPULAR
                          </Badge>
                        )}
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-yellow-500/30 rounded-lg">
                            <IconComponent className="w-8 h-8 text-yellow-400" />
                          </div>
                          <div>
                            <CardTitle className="text-black text-xl">{item.name}</CardTitle>
                            <CardDescription className="text-black/70">
                              {item.description}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        {item.preview && (
                          <div className="p-3 bg-yellow-500/20 rounded-lg">
                            <p className="text-yellow-200 text-sm">
                              <strong>Includes:</strong> {item.preview}
                            </p>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <div className="text-2xl font-bold text-black">
                            ${item.price_usd.toFixed(2)}
                          </div>
                          <Badge className="bg-yellow-500 text-black">
                            PREMIUM
                          </Badge>
                        </div>
                        
                        <div className="space-y-2">
                          <Button
                            onClick={() => handlePurchase(item)}
                            disabled={purchasing === item.id}
                            className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white font-bold"
                          >
                            {purchasing === item.id ? (
                              <div className="flex items-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Activating...
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Crown className="w-4 h-4" />
                                Go Premium
                              </div>
                            )}
                          </Button>
                          
                          <Button
                            variant="outline"
                            onClick={() => addToCart(item)}
                            className="w-full text-black border-white/20 hover:bg-white/10"
                          >
                            Add to Cart
                          </Button>
                        </div>
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