// src/pages/LandingPage.tsx
import React, { useEffect, useRef, useState, type JSX } from "react";
import { useNavigate } from "react-router-dom";

export function LandingPage(): JSX.Element {
    const navigate = useNavigate();
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));

    const toggleDark = () => {
        document.documentElement.classList.toggle('dark');
        setIsDark(document.documentElement.classList.contains('dark'));
    };

    // High performance cursor tracking without React state re-renders
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (containerRef.current) {
                containerRef.current.style.setProperty('--mouse-x', `${e.clientX}px`);
                containerRef.current.style.setProperty('--mouse-y', `${e.clientY}px`);
            }
        };
        window.addEventListener("mousemove", handleMouseMove, { passive: true });
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, []);

    return (
        <div
            ref={containerRef}
            className="min-h-screen bg-[#f3fbf6] dark:bg-neutral-950 transition-colors duration-700 relative overflow-hidden flex flex-col font-sans selection:bg-[#4a8b71]/30 selection:text-black dark:selection:text-white"
            style={{ '--mouse-x': '-1000px', '--mouse-y': '-1000px' } as React.CSSProperties}
        >
            <style>
                {`
                    @import url('https://fonts.googleapis.com/css2?family=Anton&family=Great+Vibes&family=Playfair+Display:ital,wght@0,400;0,600;1,400&display=swap');
                    
                    .font-cursive { 
                        font-family: 'Great Vibes', cursive; 
                        font-weight: 400; 
                    }
                    .font-chunky { 
                        font-family: 'Anton', sans-serif; 
                        letter-spacing: 0.01em; 
                    }
                    .btn-text { 
                        font-family: 'Playfair Display', serif; 
                    }
                    
                    /* The sexy smooth grid mask that follows the cursor */
                    .grid-mask {
                        mask-image: radial-gradient(400px circle at var(--mouse-x) var(--mouse-y), black 0%, transparent 80%);
                        -webkit-mask-image: radial-gradient(400px circle at var(--mouse-x) var(--mouse-y), black 0%, transparent 80%);
                        transition: mask-position 0.1s ease-out, -webkit-mask-position 0.1s ease-out;
                    }
                `}
            </style>

            {/* Desktop Grid Mask Layer (Light Mode) */}
            <div
                className="hidden md:block absolute inset-0 pointer-events-none z-0 grid-mask dark:hidden"
                style={{
                    backgroundImage: 'linear-gradient(to right, #d3eadb 1.5px, transparent 1.5px), linear-gradient(to bottom, #d3eadb 1.5px, transparent 1.5px)',
                    backgroundSize: '24px 24px',
                }}
            />

            {/* Desktop Grid Mask Layer (Dark Mode) */}
            <div
                className="hidden md:dark:block absolute inset-0 pointer-events-none z-0 grid-mask"
                style={{
                    backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.05) 1.5px, transparent 1.5px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1.5px, transparent 1.5px)',
                    backgroundSize: '24px 24px',
                }}
            />

            {/* Navbar / Logo */}
            <nav className="relative z-10 w-full px-8 py-8 md:px-16 md:py-10 flex justify-between items-center">
                <div className="text-[#2c4c3b] dark:text-teal-50 text-3xl md:text-5xl font-extrabold tracking-tighter transition-colors duration-700 drop-shadow-sm dark:drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                    SealVault
                </div>

                {/* Attractive Toggle */}
                <button
                    onClick={toggleDark}
                    className="relative w-20 h-10 rounded-full bg-[#d3eadb] dark:bg-neutral-800 border-2 border-[#a3c9b3] dark:border-neutral-700 shadow-inner flex items-center p-1 transition-all duration-500 overflow-hidden"
                    aria-label="Toggle Dark Mode"
                >
                    <div className="absolute inset-0 w-full h-full bg-linear-to-r from-sky-400 to-blue-500 dark:from-indigo-900 dark:to-purple-900 opacity-0 dark:opacity-100 transition-opacity duration-700"></div>
                    <div
                        className={`z-10 w-8 h-8 rounded-full flex items-center justify-center transform transition-transform duration-500 shadow-md ${isDark ? 'translate-x-10 bg-neutral-900' : 'translate-x-0 bg-yellow-100'
                            }`}
                    >
                        {isDark ? (
                            <span className="text-white text-sm" style={{ textShadow: '0 0 5px white' }}>☾</span>
                        ) : (
                            <span className="text-yellow-600 text-sm">☀</span>
                        )}
                    </div>
                </button>
            </nav>

            {/* Main Content Area */}
            <main className="flex-1 relative z-10 flex flex-col md:flex-row items-center justify-between px-8 md:px-16 w-full max-w-[1440px] mx-auto pb-20 pt-20">
                {/* Left Side: Text */}
                <div className="flex flex-col text-left w-full md:w-1/2">
                    {/* Huge cursive 'Sign' */}
                    <div className="font-cursive text-[140px] md:text-[230px] lg:text-[280px] leading-[0.6] text-black dark:text-neutral-100 pr-0.5 drop-shadow-sm transform -rotate-2 relative z-20 transition-colors duration-700">
                        Sign
                    </div>

                    {/* Bold chunky text */}
                    <div className="md:mt-16 flex flex-col gap-1">
                        <span className="font-chunky text-[65px] md:text-[90px] lg:text-[110px] leading-[0.9] text-black dark:text-neutral-200 lowercase transition-colors duration-700">
                            documents in
                        </span>
                        <span className="font-chunky text-[65px] md:text-[90px] lg:text-[110px] leading-[0.9] text-[#4a8b71] dark:text-teal-400 lowercase mt-1 transition-colors duration-700 drop-shadow-sm dark:drop-shadow-[0_0_20px_rgba(45,212,191,0.3)]">
                            minutes
                        </span>
                    </div>
                </div>

                {/* Right Side: Action buttons */}
                <div className="flex flex-col md:items-center justify-center gap-5 w-full md:w-1/2 mt-10 md:mt-0 relative z-20">
                    <div className="flex flex-col gap-5 w-full sm:w-[280px]">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="bg-[#4a8b71] dark:bg-teal-500 hover:bg-[#3d745e] dark:hover:bg-teal-400 text-white btn-text text-xl md:text-2xl px-8 py-4 rounded-xl shadow-[0_8px_20px_rgba(74,139,113,0.3)] dark:shadow-[0_8px_20px_rgba(20,184,166,0.3)] hover:shadow-[0_12px_25px_rgba(74,139,113,0.4)] dark:hover:shadow-[0_12px_25px_rgba(20,184,166,0.4)] border border-transparent dark:border-white/10 transition-all duration-500 hover:-translate-y-1 active:translate-y-0 w-full"
                        >
                            Upload Now
                        </button>
                        <button
                            onClick={() => navigate('/login')}
                            className="bg-[#2c4c3b] dark:bg-neutral-800 hover:bg-[#1e3529] dark:hover:bg-neutral-700 text-white btn-text text-xl md:text-2xl px-8 py-4 rounded-xl shadow-[0_8px_20px_rgba(44,76,59,0.3)] dark:shadow-[0_8px_20px_rgba(0,0,0,0.4)] hover:shadow-[0_12px_25px_rgba(44,76,59,0.4)] dark:hover:shadow-[0_12px_25px_rgba(0,0,0,0.6)] border border-transparent dark:border-white/10 transition-all duration-500 hover:-translate-y-1 active:translate-y-0 w-full"
                        >
                            Login
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default LandingPage;