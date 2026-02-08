import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSupabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Pickaxe, Gem, User, Mail, Lock, Eye, EyeOff } from 'lucide-react';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;

    // Check if user is already logged in
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/');
      }
    };
    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = getSupabase();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success('Welcome back, miner!');
      } else {
        if (!username.trim()) {
          toast.error('Please enter a username');
          setLoading(false);
          return;
        }
        if (username.length < 3) {
          toast.error('Username must be at least 3 characters');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          toast.error('Password must be at least 6 characters');
          setLoading(false);
          return;
        }

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              username: username.trim(),
            },
          },
        });
        if (error) throw error;
        toast.success('Account created! Welcome to the mine!');
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      if (error.message.includes('User already registered')) {
        toast.error('This email is already registered. Please login instead.');
      } else if (error.message.includes('Invalid login credentials')) {
        toast.error('Invalid email or password');
      } else {
        toast.error(error.message || 'Authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#373737] flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Logo and title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-[#C6C6C6] border-4 border-white border-l-white border-b-[#555555] border-r-[#555555] mb-4">
            <Pickaxe className="w-10 h-10 text-black" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 font-sans tracking-tight" style={{ textShadow: '2px 2px 0px #000' }}>
            Crypto<span className="text-[#55FF55]">Mine</span>
          </h1>
          <p className="text-[#AAAAAA] font-medium">Mine blocks. Earn tokens. Get rich.</p>
        </div>

        {/* Auth card */}
        <div className="bg-[#C6C6C6] border-4 border-white border-b-[#555555] border-r-[#555555] p-6 shadow-2xl">
          {/* Tabs */}
          <div className="flex mb-6 gap-2">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 font-bold transition-all border-2 ${isLogin
                  ? 'bg-[#8B8B8B] text-white border-[#555555] border-b-white border-r-white inset-shadow'
                  : 'bg-[#C6C6C6] text-[#555555] border-white border-b-[#555555] border-r-[#555555] hover:bg-[#D6D6D6]'
                }`}
            >
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 font-bold transition-all border-2 ${!isLogin
                  ? 'bg-[#8B8B8B] text-white border-[#555555] border-b-white border-r-white inset-shadow'
                  : 'bg-[#C6C6C6] text-[#555555] border-white border-b-[#555555] border-r-[#555555] hover:bg-[#D6D6D6]'
                }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username (signup only) */}
            {!isLogin && (
              <div className="space-y-1">
                <Label htmlFor="username" className="text-[#101010] font-bold">
                  Username
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#555555]" />
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="CryptoMiner99"
                    className="pl-10 bg-white border-2 border-[#555555] border-b-white border-r-white text-black placeholder:text-gray-400 rounded-none focus:ring-0"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div className="space-y-1">
              <Label htmlFor="email" className="text-[#101010] font-bold">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#555555]" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="miner@crypto.com"
                  className="pl-10 bg-white border-2 border-[#555555] border-b-white border-r-white text-black placeholder:text-gray-400 rounded-none focus:ring-0"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <Label htmlFor="password" className="text-[#101010] font-bold">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#555555]" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10 pr-10 bg-white border-2 border-[#555555] border-b-white border-r-white text-black placeholder:text-gray-400 rounded-none focus:ring-0"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555555] hover:text-black transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#55FF55] hover:bg-[#44CC44] text-[#101010] font-bold py-6 rounded-none border-2 border-white border-b-[#228822] border-r-[#228822] shadow-sm transform active:translate-y-1 active:shadow-none transition-none mt-6"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  {isLogin ? 'Logging in...' : 'Creating account...'}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Gem className="w-5 h-5" />
                  {isLogin ? 'Enter the Mine' : 'Start Mining'}
                </div>
              )}
            </Button>
          </form>

          {/* Footer text */}
          <p className="text-center text-[#555555] text-sm mt-6 font-medium">
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-[#101010] hover:text-[#555555] underline transition-colors font-bold"
            >
              {isLogin ? 'Sign up' : 'Login'}
            </button>
          </p>
        </div>

        {/* Features */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="text-[#AAAAAA]">
            <div className="text-2xl font-bold text-[#55FF55]" style={{ textShadow: '1px 1px 0 #000' }}>3,500</div>
            <div className="text-xs font-bold">Tokens/Block</div>
          </div>
          <div className="text-[#AAAAAA]">
            <div className="text-2xl font-bold text-[#FF5555]" style={{ textShadow: '1px 1px 0 #000' }}>2s</div>
            <div className="text-xs font-bold">Mining Time</div>
          </div>
          <div className="text-[#AAAAAA]">
            <div className="text-2xl font-bold text-[#5555FF]" style={{ textShadow: '1px 1px 0 #000' }}>∞</div>
            <div className="text-xs font-bold">Respawning</div>
          </div>
        </div>
      </div>
    </div>
  );
}
