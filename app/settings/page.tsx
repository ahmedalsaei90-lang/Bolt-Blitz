'use client';

import React from 'react';  // Added for JSX
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Settings, User, Bell, Volume2, Shield, Palette, Accessibility, Wifi, HardDrive, CircleHelp as HelpCircle, MessageSquare, FileText, Star as StarIcon, Info, Upload, CreditCard as Edit3, Check, X, Eye, EyeOff, Globe, Trash2, Download, Mail, Lock, Calendar, Trophy, Star, Moon, Sun, Monitor, Zap, Brain, Heart, ExternalLink, Smartphone } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  preferences?: {
    language: string;
    difficulty: string;
    categories: string[];
    notifications: {
      achievements: boolean;
      games: boolean;
      updates: boolean;
    };
    audio: {
      effects: number;
      music: number;
    };
    theme: string;
    animations: string;
    accessibility: {
      fontSize: number;
      contrast: number;
    };
    dataUsage: {
      wifiOnly: boolean;
    };
  };
  created_at: string;
}

interface Achievement {
  id: string;
  type: string;
  tier: string;
  unlocked: boolean;
}

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸', rtl: false },
  { code: 'ar', name: 'العربية', flag: '🇸🇦', rtl: true },
];

const categories = [
  'Science', 'History', 'Sports', 'Entertainment', 
  'Geography', 'Literature', 'Technology', 'Art'
];

const themes = [
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'auto', label: 'Auto', icon: Monitor },
];

const animations = [
  { value: 'full', label: 'Full Animations' },
  { value: 'reduced', label: 'Reduced Motion' },
  { value: 'off', label: 'No Animations' },
];

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  
  // Profile editing states
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  
  // Password change states
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  
  // Support form states
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [submittingSupport, setSubmittingSupport] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchAchievements();
      setNewUsername(user.username);
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
          // Set default preferences if not exist
          const defaultPreferences = {
            language: 'en',
            difficulty: 'medium',
            categories: ['Science', 'History'],
            notifications: {
              achievements: true,
              games: true,
              updates: false,
            },
            audio: {
              effects: 80,
              music: 60,
            },
            theme: 'dark',
            animations: 'full',
            accessibility: {
              fontSize: 16,
              contrast: 100,
            },
            dataUsage: {
              wifiOnly: false,
            },
          };
          
          const userWithDefaults = {
            ...userData,
            preferences: { ...defaultPreferences, ...userData.preferences }
          };
          
          setUser(userWithDefaults);
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

  const fetchAchievements = async () => {
    try {
      if (!user) return;
      
      const { data } = await supabase
        .from('achievements')
        .select('*')
        .eq('user_id', user.id)
        .eq('unlocked', true)
        .limit(6);
      
      if (data) setAchievements(data);
    } catch (error) {
      console.error('Error fetching achievements:', error);
    }
  };

  const checkUsernameAvailability = async (username: string) => {
    if (!username.trim() || username === user?.username) {
      setUsernameAvailable(null);
      return;
    }

    try {
      const { data } = await supabase
        .from('users')
        .select('id')
        .eq('username', username.trim())
        .single();
      
      setUsernameAvailable(!data);
    } catch (error) {
      setUsernameAvailable(true); // Assume available on error
    }
  };

  const handleSaveUsername = async () => {
    if (!user || !newUsername.trim() || usernameAvailable === false) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ username: newUsername.trim() })
        .eq('id', user.id);

      if (error) throw error;
      
      setUser({ ...user, username: newUsername.trim() });
      setIsEditingUsername(false);
      toast.success('Username updated successfully!');
    } catch (error) {
      console.error('Error updating username:', error);
      toast.error('Failed to update username');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePreferences = async (updates: Partial<User['preferences']>) => {
    if (!user) return;
    
    setSaving(true);
    try {
      const newPreferences = { ...user.preferences, ...updates };
      
      const { error } = await supabase
        .from('users')
        .update({ preferences: newPreferences })
        .eq('id', user.id);

      if (error) throw error;

      setUser({ ...user, preferences: newPreferences });
      toast.success('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || newPassword !== confirmPassword) {
      toast.error('Please fill all fields correctly');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setShowPasswordChange(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password updated successfully!');
    } catch (error) {
      console.error('Error updating password:', error);
      toast.error('Failed to update password');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitSupport = async () => {
    if (!supportSubject.trim() || !supportMessage.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setSubmittingSupport(true);
    try {
      // In a real app, this would insert to a support_tickets table
      // For now, we'll just simulate the submission
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSupportSubject('');
      setSupportMessage('');
      toast.success('Support ticket submitted successfully!');
    } catch (error) {
      console.error('Error submitting support ticket:', error);
      toast.error('Failed to submit support ticket');
    } finally {
      setSubmittingSupport(false);
    }
  };

  const handleAccountDeletion = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone.'
    );
    
    if (!confirmed) return;

    try {
      const { error } = await supabase.auth.admin.deleteUser(user!.id);
      if (error) throw error;
      
      toast.success('Account deleted successfully');
      router.push('/auth');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Failed to delete account');
    }
  };

  const handleDataExport = async () => {
    if (!user) return;
    
    try {
      // Fetch all user data
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      const { data: achievementsData } = await supabase
        .from('achievements')
        .select('*')
        .eq('user_id', user.id);

      const { data: purchasesData } = await supabase
        .from('shop_purchases')
        .select('*')
        .eq('user_id', user.id);

      const exportData = {
        profile: userData,
        achievements: achievementsData,
        purchases: purchasesData,
        exportDate: new Date().toISOString(),
      };

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bolt-blitz-data-${user.username}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success('Data exported successfully!');
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export data');
    }
  };

  const clearCache = () => {
    localStorage.clear();
    sessionStorage.clear();
    toast.success('Cache cleared successfully!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading settings...</p>
        </div>
      </div>
    );
  } else {
    return (
      <div className="min-h-screen relative overflow-hidden" style={{
        background: 'radial-gradient(ellipse at top, rgba(128, 0, 128, 0.6) 0%, transparent 50%), radial-gradient(ellipse at bottom left, rgba(0, 0, 255, 0.6) 0%, transparent 50%), radial-gradient(ellipse at bottom right, rgba(75, 0, 130, 0.5) 0%, transparent 50%), radial-gradient(ellipse at center, #000000 0%, #0a0a0a 100%)'
      }}>
        {/* Animated Background */}
        <div className="absolute inset-0 space-content">
          {/* Neural Network Pattern */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'radial-gradient(circle, rgba(0,212,255,0.1) 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }}></div>
        </div>

        <div className="relative container mx-auto p-4 max-w-2xl">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-white">
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-2xl font-bold text-white">Settings</h1>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-white/10 border-white/20">
              <TabsTrigger value="profile" className="text-white data-[state=active]:bg-white/20">Profile</TabsTrigger>
              <TabsTrigger value="preferences" className="text-white data-[state=active]:bg-white/20">Preferences</TabsTrigger>
              <TabsTrigger value="account" className="text-white data-[state=active]:bg-white/20">Account</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-4">
              {/* Profile Information */}
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Profile Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20 border-2 border-blue-400">
                      <AvatarImage src="/placeholder-avatar.jpg" />
                      <AvatarFallback className="bg-blue-900 text-white">{user.username[0]}</AvatarFallback>
                    </Avatar>
                    <Button variant="outline" className="text-white border-white/20">
                      <Upload className="mr-2 h-4 w-4" />
                      Change Avatar
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Username</Label>
                    {isEditingUsername ? (
                      <div className="space-y-2">
                        <Input 
                          value={newUsername}
                          onChange={(e) => {
                            setNewUsername(e.target.value);
                            checkUsernameAvailability(e.target.value);
                          }}
                          className="bg-white/10 border-white/20 text-white"
                          placeholder="Enter new username"
                        />
                        <div className="flex items-center gap-2 text-sm">
                          {usernameAvailable === true && <Check className="h-4 w-4 text-green-400" />}
                          {usernameAvailable === false && <X className="h-4 w-4 text-red-400" />}
                          <span className={usernameAvailable === true ? 'text-green-400' : usernameAvailable === false ? 'text-red-400' : 'text-gray-400'}>
                            {usernameAvailable === true ? 'Available' : usernameAvailable === false ? 'Taken' : 'Checking...'}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            onClick={handleSaveUsername}
                            disabled={saving || usernameAvailable !== true}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            {saving ? 'Saving...' : 'Save'}
                          </Button>
                          <Button 
                            variant="ghost"
                            onClick={() => {
                              setIsEditingUsername(false);
                              setNewUsername(user.username);
                            }}
                            className="text-white"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-white">{user.username}</span>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => {
                            setIsEditingUsername(true);
                            setNewUsername(user.username);
                          }}
                          className="text-blue-400"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Age</Label>
                    <p className="text-white/70">{user.age} (Not editable)</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Account Created</Label>
                    <p className="text-white/70">{new Date(user.created_at).toLocaleDateString()}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Achievements Showcase */}
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Trophy className="w-5 h-5" />
                    Achievements Showcase
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    {achievements.map((ach) => (
                      <div key={ach.id} className="flex flex-col items-center p-2 rounded-lg bg-white/5">
                        <StarIcon className={`w-8 h-8 mb-2 ${
                          ach.tier === 'bronze' ? 'text-amber-600' :
                          ach.tier === 'silver' ? 'text-gray-400' :
                          ach.tier === 'gold' ? 'text-yellow-400' :
                          'text-purple-400'
                        }`} />
                        <span className="text-white text-sm text-center">{ach.type}</span>
                      </div>
                    ))}
                    {achievements.length === 0 && (
                      <p className="col-span-3 text-center text-white/70">No achievements unlocked yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Preferences Tab */}
            <TabsContent value="preferences" className="space-y-6 mt-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Game Preferences */}
                <Card className="bg-white/10 backdrop-blur-md border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Zap className="w-5 h-5" />
                      Game Preferences
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-white">Language</Label>
                      <Select
                        value={user.preferences?.language || 'en'}
                        onValueChange={(value) => handleSavePreferences({ language: value })}
                      >
                        <SelectTrigger className="bg-white/10 border-white/20 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {languages.map((lang) => (
                            <SelectItem key={lang.code} value={lang.code}>
                              <div className="flex items-center gap-2">
                                <span>{lang.flag}</span>
                                <span>{lang.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-white">Default Difficulty</Label>
                      <Select
                        value={user.preferences?.difficulty || 'medium'}
                        onValueChange={(value) => handleSavePreferences({ difficulty: value })}
                      >
                        <SelectTrigger className="bg-white/10 border-white/20 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="easy">Easy</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="hard">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-white">Favorite Categories</Label>
                      <div className="flex flex-wrap gap-2">
                        {(user.preferences?.categories || []).map((cat) => (
                          <Badge key={cat} variant="secondary" className="bg-blue-600/50">
                            {cat}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-4 w-4 ml-2 p-0 text-white/70 hover:text-white"
                              onClick={() => {
                                const newCategories = (user.preferences?.categories || []).filter(c => c !== cat);
                                handleSavePreferences({ categories: newCategories });
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ))}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Badge variant="outline" className="cursor-pointer border-dashed border-white/50 bg-transparent hover:bg-white/10">
                              + Add Category
                            </Badge>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Add Favorite Category</DialogTitle>
                            </DialogHeader>
                            <Select
                              onValueChange={(value) => {
                                if (!user.preferences?.categories.includes(value)) {
                                  const newCategories = [...(user.preferences?.categories || []), value];
                                  handleSavePreferences({ categories: newCategories });
                                }
                              }}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                              <SelectContent>
                                {categories.map((cat) => (
                                  <SelectItem key={cat} value={cat}>
                                    {cat}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-white">Notifications</Label>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-white">Achievements</span>
                          <Switch
                            checked={user.preferences?.notifications?.achievements ?? true}
                            onCheckedChange={(checked) => 
                              handleSavePreferences({
                                notifications: { ...user.preferences?.notifications, achievements: checked }
                              })
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-white">Games</span>
                          <Switch
                            checked={user.preferences?.notifications?.games ?? true}
                            onCheckedChange={(checked) => 
                              handleSavePreferences({
                                notifications: { ...user.preferences?.notifications, games: checked }
                              })
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-white">Updates</span>
                          <Switch
                            checked={user.preferences?.notifications?.updates ?? false}
                            onCheckedChange={(checked) => 
                              handleSavePreferences({
                                notifications: { ...user.preferences?.notifications, updates: checked }
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-white">Sound Effects</Label>
                      <Slider
                        value={[user.preferences?.audio?.effects || 80]}
                        onValueChange={([value]) => 
                          handleSavePreferences({
                            audio: { ...user.preferences?.audio, effects: value }
                          })
                        }
                        min={0}
                        max={100}
                        step={1}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-white">Music Volume</Label>
                      <Slider
                        value={[user.preferences?.audio?.music || 60]}
                        onValueChange={([value]) => 
                          handleSavePreferences({
                            audio: { ...user.preferences?.audio, music: value }
                          })
                        }
                        min={0}
                        max={100}
                        step={1}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="account" className="space-y-6 mt-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Account Information */}
                <Card className="bg-white/10 backdrop-blur-md border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Account Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-white">Email</Label>
                      <p className="text-white/70">{user.email}</p>
                      <Button variant="outline" className="w-full text-white border-white/20">
                        <Mail className="w-4 h-4 mr-2" />
                        Change Email
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-white">Password</Label>
                      <Dialog open={showPasswordChange} onOpenChange={setShowPasswordChange}>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="w-full text-white border-white/20">
                            <Lock className="w-4 h-4 mr-2" />
                            Change Password
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Change Password</DialogTitle>
                            <DialogDescription>
                              Enter your current password and new password below.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label>Current Password</Label>
                              <div className="relative">
                                <Input
                                  type={showPasswords ? 'text' : 'password'}
                                  value={currentPassword}
                                  onChange={(e) => setCurrentPassword(e.target.value)}
                                />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="absolute right-2 top-1/2 -translate-y-1/2"
                                  onClick={() => setShowPasswords(!showPasswords)}
                                >
                                  {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label>New Password</Label>
                              <Input
                                type={showPasswords ? 'text' : 'password'}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Confirm New Password</Label>
                              <Input
                                type={showPasswords ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                              />
                            </div>
                            <Button
                              onClick={handlePasswordChange}
                              disabled={saving}
                              className="w-full"
                            >
                              {saving ? 'Updating...' : 'Update Password'}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-white">Account Created</Label>
                      <p className="text-white/70">{new Date(user.created_at).toLocaleDateString()}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Privacy & Security */}
                <Card className="bg-white/10 backdrop-blur-md border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      Privacy & Security
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-white">Share Profile</Label>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-white">Public Achievements</Label>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-white">Allow Friend Requests</Label>
                      <Switch defaultChecked />
                    </div>
                    <Button variant="outline" className="w-full text-white border-white/20">
                      <Shield className="w-4 h-4 mr-2" />
                      View Privacy Policy
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  }
}