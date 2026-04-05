"use client";
import './globals.css';
import { Inter } from 'next/font/google';
import { useRouter, usePathname } from 'next/navigation';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useEffect } from 'react';
import axios from 'axios';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


const inter = Inter({
    subsets: ['latin'],
    weight: ['400', '500', '600', '700', '800', '900'],
    display: 'swap',
    variable: '--font-inter'
});
import API_BASE from '@/lib/api';

if (typeof window !== 'undefined') {
    console.log("🚀 [Appien] API Configured:", API_BASE);
}

const PUBLIC_VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_KEY as string;

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export default function RootLayout({ children }: { children: React.ReactNode }) {

    const router = useRouter();
    const pathname = usePathname();

    // --- 1. AXIOS INTERCEPTOR FOR AUTO-LOGOUT ---
    useEffect(() => {
        const interceptor = axios.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response && error.response.status === 401) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('darkMode'); // Clear theme preference
                    router.push('/login');
                }
                return Promise.reject(error);
            }
        );

        return () => {
            axios.interceptors.response.eject(interceptor);
        };
    }, [router]);

    // --- 2. THEME SYNC (Separate Effect) ---
    useEffect(() => {
        const syncTheme = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;

            try {
                const { data } = await axios.get(`${API_BASE}/users/settings`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (data?.settings?.darkMode) {
                    document.documentElement.classList.add('dark');
                    document.documentElement.classList.remove('light');
                    localStorage.setItem('darkMode', 'true');
                } else {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.classList.add('light');
                    localStorage.setItem('darkMode', 'false');
                }
            } catch (e) { console.error("Theme Sync Error", e); }
        };

        syncTheme();

        // Listen for login/logout/update events
        window.addEventListener('user-updated', syncTheme);
        return () => window.removeEventListener('user-updated', syncTheme);
    }, []);

    // --- 3. PUSH NOTIFICATIONS (Service Worker Only) ---
    useEffect(() => {
        if ('serviceWorker' in navigator && typeof window !== 'undefined') {
            navigator.serviceWorker.register('/sw.js')
                .then(async (reg) => {
                    console.log("SW Registered");
                    try {
                        const token = localStorage.getItem('token');
                        if (!token) return;
                        
                        const VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_KEY;
                        if (!VAPID_KEY) return;

                        let sub = await reg.pushManager.getSubscription();
                        if (!sub && Notification.permission !== 'denied') {
                            sub = await reg.pushManager.subscribe({
                                userVisibleOnly: true,
                                applicationServerKey: urlBase64ToUint8Array(VAPID_KEY)
                            });
                        }
                        if (sub) {
                            await axios.post(`${API_BASE}/notifications/subscribe`, sub, {
                                headers: { Authorization: `Bearer ${token}` }
                            });
                        }
                    } catch (e) {
                         console.error("Auto subscribe failed", e);
                    }
                })
                .catch(e => console.error("SW Fail", e));
        }
    }, []);

    return (
        <html lang="en" className={inter.variable} suppressHydrationWarning>
            <body className={`font-sans bg-gray-50 dark:bg-slate-950 min-h-screen flex flex-col text-gray-900 dark:text-gray-100 transition-colors duration-200 antialiased`}>
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
                            (function() {
                                try {
                                    var localTheme = localStorage.getItem('darkMode');
                                    var dark = localTheme === 'true';
                                    var cl = document.documentElement.classList;
                                    if (dark) {
                                        cl.add('dark');
                                        cl.remove('light');
                                    } else {
                                        cl.remove('dark');
                                        cl.add('light');
                                    }
                                } catch (e) {}
                            })();
                        `,
                    }}
                />
                <Navbar />
                <main className="flex-1 w-full flex flex-col">
                    {children}
                </main>
                {!pathname?.startsWith('/inbox') && <Footer />}
                <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="colored" />
            </body>
        </html>
    );
}