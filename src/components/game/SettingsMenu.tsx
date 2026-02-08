import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Wallet, LogOut, Settings, X, CreditCard, ArrowRight, Copy, Check, Eye, EyeOff, Keyboard } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useGameStore } from '@/store/gameStore';
import { toast } from 'sonner';
import { transferTokensToUser } from '@/lib/transferTokens';

interface SettingsMenuProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SettingsMenu({ isOpen, onClose }: SettingsMenuProps) {
    const { signOut, user } = useAuth();
    const player = useGameStore((state) => state.player);
    const withdrawTokens = useGameStore((state) => state.withdrawTokens);
    const renderDistance = useGameStore((state) => state.renderDistance);
    const setRenderDistance = useGameStore((state) => state.setRenderDistance);

    const [activeTab, setActiveTab] = useState<'settings' | 'wallet' | 'withdraw' | 'controls'>('settings');
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [showPrivateKey, setShowPrivateKey] = useState(false);
    const [withdrawing, setWithdrawing] = useState(false);

    if (!isOpen || !player) return null;

    const copyToClipboard = async (text: string, field: string) => {
        await navigator.clipboard.writeText(text);
        setCopiedField(field);
        toast.success(`${field} copied to clipboard!`);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const handleWithdraw = async () => {
        if (player.tokens === 0) {
            toast.error('No tokens to withdraw');
            return;
        }
        setWithdrawing(true);
        const amount = player.tokens;
        try {
            const res = await transferTokensToUser(player.publicKey, amount);
            if (res.error) {
                toast.error(`Withdrawal failed: ${res.error}`);
                return;
            }
            withdrawTokens();
            toast.success(`${amount.toLocaleString()} tokens sent to your wallet`);
        } finally {
            setWithdrawing(false);
        }
    };

    const truncateKey = (key: string, show: boolean = true) => {
        if (!key || key.length === 0) return '(Not available - requires re-import)';
        if (!show) return '••••••••••••••••••••••••••••••••';
        if (key.length <= 16) return key;
        return `${key.slice(0, 8)}...${key.slice(-8)}`;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm pointer-events-auto">
            {/* Menu Container - Minecraft Style */}
            <div className="bg-[#C6C6C6] border-4 border-t-[#FFFFFF] border-l-[#FFFFFF] border-b-[#555555] border-r-[#555555] p-1 shadow-2xl w-[700px] max-w-[95vw]">

                {/* Header */}
                <div className="flex justify-between items-center bg-[#373737] p-2 mb-4 text-white">
                    <h2 className="text-xl font-bold pl-2 font-sans">Game Menu</h2>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="hover:bg-red-500 hover:text-white text-white/80"
                    >
                        <X className="w-6 h-6" />
                    </Button>
                </div>

                <div className="flex gap-2 h-[450px]">
                    {/* Sidebar */}
                    <div className="w-1/3 flex flex-col gap-2 p-2 bg-[#8B8B8B] border-2 border-inset border-[#373737]">
                        <Button
                            variant={activeTab === 'settings' ? 'secondary' : 'ghost'}
                            className={`w-full justify-start text-left rounded-none border-2 font-bold ${activeTab === 'settings'
                                ? 'bg-[#A0A0A0] text-white border-[#FFFFFF] border-t-[#373737] border-l-[#373737]'
                                : 'bg-[#C6C6C6] text-black border-b-[#555555] border-r-[#555555] border-t-[#FFFFFF] border-l-[#FFFFFF] hover:bg-[#D6D6D6]'
                                }`}
                            onClick={() => setActiveTab('settings')}
                        >
                            <Settings className="w-4 h-4 mr-2" />
                            Settings
                        </Button>
                        <Button
                            variant={activeTab === 'controls' ? 'secondary' : 'ghost'}
                            className={`w-full justify-start text-left rounded-none border-2 font-bold ${activeTab === 'controls'
                                ? 'bg-[#A0A0A0] text-white border-[#FFFFFF] border-t-[#373737] border-l-[#373737]'
                                : 'bg-[#C6C6C6] text-black border-b-[#555555] border-r-[#555555] border-t-[#FFFFFF] border-l-[#FFFFFF] hover:bg-[#D6D6D6]'
                                }`}
                            onClick={() => setActiveTab('controls')}
                        >
                            <Keyboard className="w-4 h-4 mr-2" />
                            Controls
                        </Button>
                        <Button
                            variant={activeTab === 'wallet' ? 'secondary' : 'ghost'}
                            className={`w-full justify-start text-left rounded-none border-2 font-bold ${activeTab === 'wallet'
                                ? 'bg-[#A0A0A0] text-white border-[#FFFFFF] border-t-[#373737] border-l-[#373737]'
                                : 'bg-[#C6C6C6] text-black border-b-[#555555] border-r-[#555555] border-t-[#FFFFFF] border-l-[#FFFFFF] hover:bg-[#D6D6D6]'
                                }`}
                            onClick={() => setActiveTab('wallet')}
                        >
                            <Wallet className="w-4 h-4 mr-2" />
                            Wallet
                        </Button>
                        <Button
                            variant={activeTab === 'withdraw' ? 'secondary' : 'ghost'}
                            className={`w-full justify-start text-left rounded-none border-2 font-bold ${activeTab === 'withdraw'
                                ? 'bg-[#A0A0A0] text-white border-[#FFFFFF] border-t-[#373737] border-l-[#373737]'
                                : 'bg-[#C6C6C6] text-black border-b-[#555555] border-r-[#555555] border-t-[#FFFFFF] border-l-[#FFFFFF] hover:bg-[#D6D6D6]'
                                }`}
                            onClick={() => setActiveTab('withdraw')}
                        >
                            <CreditCard className="w-4 h-4 mr-2" />
                            Withdraw
                        </Button>

                        <div className="mt-auto">
                            <Button
                                variant="destructive"
                                className="w-full justify-start text-left rounded-none border-2 border-b-[#550000] border-r-[#550000] border-t-[#ff5555] border-l-[#ff5555] bg-[#AA0000] hover:bg-[#CC0000] text-white font-bold"
                                onClick={() => signOut()}
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                Disconnect
                            </Button>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 p-4 bg-[#C6C6C6] border-2 border-inset border-white border-b-[#FFFFFF] border-r-[#FFFFFF] border-t-[#373737] border-l-[#373737] text-black font-sans overflow-y-auto">
                        {activeTab === 'settings' && (
                            <div className="space-y-4">
                                <h3 className="text-xl font-bold mb-4 border-b-2 border-[#8B8B8B] pb-2 text-[#373737]">Game Settings</h3>
                                <div className="space-y-4">
                                    <p className="text-sm font-bold">Logged in as: <span className="text-[#373737]">{user?.email}</span></p>

                                    <div className="flex justify-between items-center p-2 bg-[#8B8B8B]/20 border border-[#8B8B8B]">
                                        <span className="font-bold text-[#373737]">Render Distance</span>
                                        <div className="flex gap-2">
                                            {(['low', 'medium', 'high'] as const).map((dist) => (
                                                <Button
                                                    key={dist}
                                                    variant="ghost"
                                                    onClick={() => setRenderDistance(dist)}
                                                    className={`
                                                        rounded-none border-2 font-bold px-3 py-1 text-xs uppercase
                                                        ${renderDistance === dist
                                                            ? 'bg-[#55FF55] text-black border-b-[#228822] border-r-[#228822] border-t-[#88FF88] border-l-[#88FF88]'
                                                            : 'bg-[#C6C6C6] text-[#555555] border-b-[#555555] border-r-[#555555] border-t-[#FFFFFF] border-l-[#FFFFFF] hover:bg-[#D6D6D6]'
                                                        }
                                                    `}
                                                >
                                                    {dist}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'controls' && (
                            <div className="space-y-4">
                                <h3 className="text-xl font-bold mb-4 border-b-2 border-[#8B8B8B] pb-2 text-[#373737]">Controls</h3>
                                <div className="grid grid-cols-2 gap-4 text-sm text-[#101010] font-medium">
                                    <div className="p-2 border-2 border-[#555555] bg-[#8B8B8B] text-white">
                                        WASD to Move
                                    </div>
                                    <div className="p-2 border-2 border-[#555555] bg-[#8B8B8B] text-white">
                                        Mouse to Look
                                    </div>
                                    <div className="p-2 border-2 border-[#555555] bg-[#8B8B8B] text-white">
                                        Click to Mine
                                    </div>
                                    <div className="p-2 border-2 border-[#555555] bg-[#8B8B8B] text-white">
                                        Space to Fly Up
                                    </div>
                                    <div className="col-span-2 p-2 border-2 border-[#555555] bg-[#8B8B8B] text-white">
                                        Shift to Fly Down
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'wallet' && (
                            <div className="space-y-4">
                                <h3 className="text-xl font-bold mb-4 border-b-2 border-[#8B8B8B] pb-2 text-[#373737]">Your Wallet</h3>

                                {/* Balance */}
                                <div className="bg-[#373737] p-4 text-white border-2 border-b-[#FFFFFF] border-r-[#FFFFFF] border-t-[#222222] border-l-[#222222]">
                                    <p className="text-sm text-gray-400 font-bold mb-1">Current Balance</p>
                                    <p className="text-3xl font-mono text-[#55FF55]">{player.tokens.toLocaleString()}</p>
                                    <p className="text-xs text-gray-400 mt-1">TOKENS</p>
                                </div>

                                {/* Public Key */}
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-[#555555] uppercase">Public Key</label>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 p-2 bg-white border-2 border-[#555555] font-mono text-xs truncate">
                                            {truncateKey(player.publicKey)}
                                        </div>
                                        <Button
                                            size="icon"
                                            className="rounded-none bg-[#C6C6C6] border-2 border-white border-b-[#555555] border-r-[#555555] hover:bg-[#D6D6D6] text-black"
                                            onClick={() => copyToClipboard(player.publicKey, 'Public Key')}
                                        >
                                            {copiedField === 'Public Key' ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                                        </Button>
                                    </div>
                                </div>

                                {/* Private Key */}
                                <div className="space-y-1">
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs font-bold text-[#555555] uppercase">Private Key</label>
                                        <button
                                            onClick={() => setShowPrivateKey(!showPrivateKey)}
                                            className="text-xs text-blue-800 hover:underline font-bold"
                                        >
                                            {showPrivateKey ? 'Hide' : 'Show'}
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className={`flex-1 p-2 bg-white border-2 border-[#555555] font-mono text-xs truncate ${!player.privateKey ? 'text-red-500' : ''}`}>
                                            {truncateKey(player.privateKey, showPrivateKey)}
                                        </div>
                                        <Button
                                            size="icon"
                                            disabled={!player.privateKey}
                                            className="rounded-none bg-[#C6C6C6] border-2 border-white border-b-[#555555] border-r-[#555555] hover:bg-[#D6D6D6] text-black"
                                            onClick={() => copyToClipboard(player.privateKey, 'Private Key')}
                                        >
                                            {copiedField === 'Private Key' ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                                        </Button>
                                    </div>
                                    <p className="text-[10px] text-red-700 font-bold mt-1">
                                        ⚠️ Never share your private key!
                                    </p>
                                </div>
                            </div>
                        )}

                        {activeTab === 'withdraw' && (
                            <div className="space-y-4">
                                <h3 className="text-xl font-bold mb-4 border-b-2 border-[#8B8B8B] pb-2 text-[#373737]">Withdraw Funds</h3>
                                <p className="text-sm text-[#373737] font-medium">
                                    Withdraw your earned tokens to your wallet address.
                                </p>

                                <div className="bg-[#8B8B8B]/20 p-4 border border-[#8B8B8B]">
                                    <div className="flex justify-between text-sm font-bold mb-2">
                                        <span>Available:</span>
                                        <span className="text-green-700">{player.tokens.toLocaleString()} TOKENS</span>
                                    </div>
                                </div>

                                <div className="space-y-2 mt-4">
                                    <Button
                                        onClick={handleWithdraw}
                                        disabled={player.tokens === 0 || withdrawing}
                                        className="w-full bg-[#55FF55] hover:bg-[#44CC44] text-[#373737] font-bold rounded-none border-2 border-b-[#228822] border-r-[#228822] border-t-[#88FF88] border-l-[#88FF88] py-6"
                                    >
                                        {withdrawing ? (
                                            <span>Processing...</span>
                                        ) : (
                                            <>
                                                Withdraw All Funds <ArrowRight className="w-4 h-4 ml-2" />
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
