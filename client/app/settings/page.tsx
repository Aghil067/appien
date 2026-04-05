"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import {
    Bell, Moon, Lock, Shield, MapPin, LogOut, Trash2, ChevronRight, Loader2, User
} from 'lucide-react';

import API_BASE from '@/lib/api';

interface UserSettings {
    notifications: boolean;
    darkMode: boolean;
    isPrivate: boolean;
}

export default function SettingsPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);

    const [settings, setSettings] = useState<UserSettings>({
        notifications: true,
        darkMode: false,
        isPrivate: false
    });
    const [username, setUsername] = useState("");
    const [location, setLocation] = useState("Loading...");
    const [blockedCount, setBlockedCount] = useState(0);

    // --- FETCH SETTINGS ---
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) { router.push('/login'); return; }

        const loadSettings = () => {
            axios.get(`${API_BASE}/users/settings`, {
                headers: { Authorization: `Bearer ${token}` }
            })
                .then(res => {
                    setSettings(res.data.settings);
                    setUsername(res.data.username || "");
                    setLocation(res.data.location);
                    setBlockedCount(res.data.blockedCount);
                    setIsLoading(false);

                    // Ensure sync state matches backend on load
                    const isDark = res.data.settings.darkMode;
                    if (isDark) {
                        document.documentElement.classList.add('dark');
                        document.documentElement.classList.remove('light');
                    } else {
                        document.documentElement.classList.remove('dark');
                        document.documentElement.classList.add('light');
                    }
                })
                .catch((err) => {
                    if (axios.isAxiosError(err) && err.response?.status === 401) {
                        localStorage.removeItem('token');
                        localStorage.removeItem('darkMode');
                        router.push('/login');
                    }
                    setIsLoading(false);
                });
        };

        loadSettings();

        // Refresh blocked count when block/unblock happens in another page
        const handleBlockChange = () => {
            const t = localStorage.getItem('token');
            if (!t) return;
            axios.get(`${API_BASE}/users/settings`, { headers: { Authorization: `Bearer ${t}` } })
                .then(res => setBlockedCount(res.data.blockedCount))
                .catch(() => {});
        };
        window.addEventListener('user-blocked-changed', handleBlockChange);
        return () => window.removeEventListener('user-blocked-changed', handleBlockChange);
    }, [router]); // router is stable

    // --- UPDATE HANDLER ---
    const updateSetting = async (key: string, value: boolean | string) => {
        // 1. Optimistic UI Update
        if (key === 'location') {
            setLocation(value as string);
        } else {
            setSettings(prev => ({ ...prev, [key]: value as boolean }));
        }

        // 2. Immediate Side Effects (Dark Mode)
        if (key === 'darkMode') {
            const isDark = value as boolean;
            const root = document.documentElement;
            if (isDark) {
                root.classList.add('dark');
                root.classList.remove('light');
                root.style.colorScheme = 'dark';
                localStorage.setItem('darkMode', 'true');
            } else {
                root.classList.remove('dark');
                root.classList.add('light'); // Ensure strict light
                root.style.colorScheme = 'light';
                localStorage.setItem('darkMode', 'false');
            }
        }

        const token = localStorage.getItem('token');
        if (!token) return;

        // 3. Backend Update (Fire and forget, but handle error)
        try {
            await axios.put(`${API_BASE}/users/settings`,
                { [key]: value },
                {
                    headers: { Authorization: `Bearer ${token}` }
                });

            // Notify other components (Navbar) about the update
            window.dispatchEvent(new Event('user-updated'));

        } catch (error: any) {
            console.error("Failed to save setting:", error);

            // Show user-friendly error message
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 429) {
                    toast.error("Too many requests. Please wait a moment and try again.");
                } else {
                    const errorMsg = error.response?.data?.error || error.message || "Failed to update setting";
                    toast.error(errorMsg);
                }
                console.error("API Error:", error.response?.status, error.response?.data);
            } else {
                toast.error("Failed to update setting. Please try again.");
                console.error("Unknown error:", error);
            }

            // Revert the optimistic update
            if (key === 'location') {
                // Reload to get correct value
                window.location.reload();
            } else {
                setSettings(prev => ({ ...prev, [key]: !value as boolean }));
            }
        }
    };

    const handleUsernameEdit = async () => {
        const newUsername = prompt("Enter your new username (min 3 characters):", username);
        if (!newUsername || newUsername === username) return;

        const trimmed = newUsername.trim();
        if (trimmed.length < 3) {
            toast.error("Username must be at least 3 characters");
            return;
        }

        if (trimmed.length > 20) {
            toast.error("Username must be less than 20 characters");
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            await axios.put(`${API_BASE}/users/settings`,
                { username: trimmed },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setUsername(trimmed);
            window.dispatchEvent(new Event('user-updated'));
            toast.success("Username updated successfully! 🎉");
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Failed to update username");
        }
    };

    const handleLocationChange = (newLocation: string) => {
        setLocation(newLocation);
        updateSetting('location', newLocation);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('darkMode');
        window.dispatchEvent(new Event('user-updated'));
        router.push('/login');
    };

    const handleDeleteAccount = async () => {
        if (!confirm("Are you sure? This will permanently delete your account and all data.")) return;

        const token = localStorage.getItem('token');
        try {
            // 1. Request OTP
            await axios.post(`${API_BASE}/users/delete-otp`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // 2. Prompt for OTP
            const otp = prompt("An OTP has been sent to your registered number. Enter it to confirm deletion:");
            if (!otp) return;

            // 3. Verify & Delete
            await axios.delete(`${API_BASE}/users/me`, {
                headers: { Authorization: `Bearer ${token}` },
                data: { otp }
            });

            localStorage.removeItem('token');
            localStorage.removeItem('darkMode');
            alert("Account permanently deleted.");
            router.push('/login');
        } catch (error: any) {
            alert(error.response?.data?.error || "Failed to delete account");
        }
    };

    if (isLoading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50/50 dark:bg-slate-950">
            <Loader2 className="animate-spin text-orange-600 dark:text-orange-400" size={32} />
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50/30 dark:bg-slate-950 pt-20 sm:pt-24 pb-24 md:pb-8 px-3 sm:px-4 md:px-6 lg:px-8 transition-colors duration-200">
            <div className="max-w-2xl mx-auto w-full">
                <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-white tracking-tight mb-2">Settings</h1>
                <p className="text-gray-500 dark:text-gray-400 mb-6 sm:mb-8 text-sm">Manage your preferences</p>

                {/* PREFERENCES SECTION */}
                <div className="mb-5 sm:mb-6">
                    <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase mb-3 ml-1 sm:ml-2 tracking-wider">Preferences</h3>
                    <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden transition-colors duration-200">

                        {/* Dark Mode Toggle */}
                        <div className="p-4 sm:p-5 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors touch-manipulation">
                            <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center text-[#ffb732] dark:text-[#ffb732] flex-shrink-0">
                                    <Moon size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Dark Mode</h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">Switch to dark theme</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer ml-3 flex-shrink-0">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={settings.darkMode}
                                    onChange={(e) => updateSetting('darkMode', e.target.checked)}
                                />
                                <div className="w-12 h-7 bg-gray-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:border-gray-300 dark:after:border-slate-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ffb732] dark:peer-checked:bg-[#ffb732]"></div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* PRIVACY SECTION */}
                <div className="mb-6">
                    <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase mb-3 ml-2 tracking-wider">Privacy & Security</h3>
                    <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden transition-colors duration-200">

                        {/* Privacy Settings */}
                        <button onClick={() => updateSetting('isPrivate', !settings.isPrivate)} className="w-full p-4 flex items-center justify-between border-b border-gray-50 dark:border-slate-800 hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors text-left">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0">
                                    <Lock size={20} />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Privacy Mode</h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{settings.isPrivate ? "Profile is currently Private" : "Profile is Public"}</p>
                                </div>
                            </div>
                            <div className={`text-sm font-medium flex items-center gap-1 px-2 py-1 rounded-md ${settings.isPrivate ? 'text-[#ffb732] dark:text-[#ffb732] bg-orange-50 dark:bg-orange-900/30' : 'text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-slate-800'}`}>
                                {settings.isPrivate ? "On" : "Off"}
                            </div>
                        </button>

                        {/* Blocked Users Link */}
                        <div
                            onClick={() => router.push('/settings/blocked')}
                            className="p-4 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer text-left"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 flex-shrink-0">
                                    <Shield size={20} />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Blocked Users</h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Manage blocked accounts</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500">
                                <span className="text-xs hidden sm:inline">{blockedCount} blocked</span>
                                <ChevronRight size={18} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ACCOUNT SECTION */}
                <div className="mb-8">
                    <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase mb-3 ml-1 sm:ml-2 tracking-wider">Account</h3>
                    <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden transition-colors duration-200">

                        {/* Username */}
                        <div onClick={handleUsernameEdit} className="w-full p-4 flex items-center justify-between border-b border-gray-50 dark:border-slate-800 hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer text-left group">
                            <div className="flex items-center gap-4 flex-1">
                                <div className="w-10 h-10 rounded-full bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 flex-shrink-0">
                                    <User size={20} />
                                </div>
                                <div className="overflow-hidden">
                                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Username</h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate max-w-[200px]">{username || "Not set"}</p>
                                </div>
                            </div>
                            <ChevronRight size={18} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
                        </div>

                        {/* Location */}
                        <div className="w-full p-4 flex items-center justify-between border-b border-gray-50 dark:border-slate-800 hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors">
                            <div className="flex items-center gap-4 flex-1">
                                <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                                    <MapPin size={20} />
                                </div>
                                <div className="overflow-hidden flex-1">
                                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-2">Location</h4>
                                    <select
                                        value={location}
                                        onChange={(e) => handleLocationChange(e.target.value)}
                                        className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500/50 dark:focus:ring-orange-500/30 focus:border-orange-500 dark:focus:border-orange-500/50 transition-all cursor-pointer appearance-none"
                                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23888'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1.25rem', paddingRight: '2.5rem' }}
                                    >
                                        <option value="HSR">HSR Layout</option>
                                        <option value="Koramangala">Koramangala</option>
                                        <option value="Both">Both Areas</option>
                                    </select>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">Select 'Both' to receive all notifications</p>
                                </div>
                            </div>
                        </div>

                        {/* Logout */}
                        <button onClick={handleLogout} className="w-full p-4 flex items-center justify-between border-b border-gray-50 dark:border-slate-800 hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors group text-left">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center text-[#ffb732] dark:text-[#ffb732] group-hover:bg-orange-100 dark:group-hover:bg-orange-900/50 transition-colors flex-shrink-0">
                                    <LogOut size={20} />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-[#ffb732] dark:group-hover:text-[#ffb732] text-sm">Log Out</h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Sign out of your account</p>
                                </div>
                            </div>
                            <ChevronRight size={18} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
                        </button>

                        {/* Delete Account */}
                        <button onClick={handleDeleteAccount} className="w-full p-4 flex items-center justify-between hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors group text-left">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/30 flex items-center justify-center text-red-500 dark:text-red-400 group-hover:bg-red-100 dark:group-hover:bg-red-900/50 transition-colors flex-shrink-0">
                                    <Trash2 size={20} />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-red-500 dark:text-red-400 text-sm">Delete Account</h4>
                                    <p className="text-xs text-red-300 dark:text-red-400/70 mt-0.5">Permanently delete your data</p>
                                </div>
                            </div>
                            <ChevronRight size={18} className="text-red-300 dark:text-red-400/70 flex-shrink-0" />
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}