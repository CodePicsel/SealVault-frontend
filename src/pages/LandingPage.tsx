// src/pages/LandingPage.tsx
import React, { useEffect, useRef, type JSX } from "react";
import { useNavigate } from "react-router-dom";

export function LandingPage(): JSX.Element {
    const navigate = useNavigate();
    const containerRef = useRef<HTMLDivElement>(null);

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
            className="min-h-screen bg-[#f3fbf6] relative overflow-hidden flex flex-col font-sans selection:bg-[#4a8b71]/30 selection:text-black"
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

            {/* Desktop Grid Mask Layer */}
            <div
                className="hidden md:block absolute inset-0 pointer-events-none z-0 grid-mask"
                style={{
                    backgroundImage: 'linear-gradient(to right, #d3eadb 1.5px, transparent 1.5px), linear-gradient(to bottom, #d3eadb 1.5px, transparent 1.5px)',
                    backgroundSize: '24px 24px',
                }}
            />

            {/* Navbar / Logo */}
            <nav className="relative z-10 w-full px-8 py-8 md:px-16 md:py-10">
                <div className="text-[#2c4c3b] text-3xl md:text-5xl font-extrabold tracking-tighter">
                    SealValut
                </div>
            </nav>

            {/* Main Content Area */}
            <main className="flex-1 relative z-10 flex flex-col md:flex-row items-center justify-between px-8 md:px-16 w-full max-w-[1440px] mx-auto pb-20 pt-20">
                {/* Left Side: Text */}
                <div className="flex flex-col text-left w-full md:w-1/2">
                    {/* Huge cursive 'Sign' */}
                    <div className="font-cursive text-[140px] md:text-[230px] lg:text-[280px] leading-[0.6] text-black pr-0.5 drop-shadow-sm transform -rotate-2 relative z-20">
                        Sign
                    </div>

                    {/* Bold chunky text */}
                    <div className="md:mt-16 flex flex-col gap-1">
                        <span className="font-chunky text-[65px] md:text-[90px] lg:text-[110px] leading-[0.9] text-black lowercase">
                            documents in
                        </span>
                        <span className="font-chunky text-[65px] md:text-[90px] lg:text-[110px] leading-[0.9] text-[#4a8b71] lowercase mt-1">
                            minutes
                        </span>
                    </div>
                </div>

                {/* Right Side: Action buttons */}
                <div className="flex flex-col md:items-center justify-center gap-5 w-full md:w-1/2 mt-10 md:mt-0">
                    <div className="flex flex-col gap-5 w-full sm:w-[280px]">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="bg-[#4a8b71] hover:bg-[#3d745e] text-white btn-text text-xl md:text-2xl px-8 py-4 rounded-xl shadow-[0_8px_20px_rgba(74,139,113,0.3)] hover:shadow-[0_12px_25px_rgba(74,139,113,0.4)] transition-all duration-300 hover:-translate-y-1 active:translate-y-0 w-full"
                        >
                            Upload Now
                        </button>
                        <button
                            onClick={() => navigate('/login')}
                            className="bg-[#2c4c3b] hover:bg-[#1e3529] text-white btn-text text-xl md:text-2xl px-8 py-4 rounded-xl shadow-[0_8px_20px_rgba(44,76,59,0.3)] hover:shadow-[0_12px_25px_rgba(44,76,59,0.4)] transition-all duration-300 hover:-translate-y-1 active:translate-y-0 w-full"
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