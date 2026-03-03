// src/pages/LandingPage.tsx
import {type JSX} from "react";

export function LandingPage(): JSX.Element {
    return (
        <div className="min-h-screen flex flex-col relative antialiased selection:bg-primary/30 selection:text-white">
            {/* Ambient lighting background */}
            <div className="ambient-light"/>

            {/* Top Navigation */}
            <nav className="fixed top-0 left-0 w-full z-50 px-6 py-6">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center gap-3 glass-chip px-4 py-2 rounded-full cursor-pointer group">
                        <span
                            className="material-symbols-outlined text-primary group-hover:text-white transition-colors">change_history</span>
                        <span className="text-white font-bold tracking-tight text-sm uppercase">Prism</span>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center gap-4">
                        <div className="glass-chip rounded-full px-1 p-1 flex items-center gap-1">
                            <a className="px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-full transition-all"
                               href="#">Solutions</a>
                            <a className="px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-full transition-all"
                               href="#">Pricing</a>
                            <a className="px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-full transition-all"
                               href="#">Enterprise</a>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                        <a className="hidden sm:flex glass-chip px-5 py-2.5 rounded-full text-sm font-medium text-slate-200 hover:text-white"
                           href="#">Login</a>
                        <a className="bg-primary hover:bg-blue-600 text-white px-5 py-2.5 rounded-full text-sm font-semibold shadow-glow-sm hover:shadow-glow transition-all flex items-center gap-2"
                           href="#">
                            <span>Start Free</span>
                            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                        </a>
                    </div>
                </div>
            </nav>

            {/* Main Content Area */}
            <main className="flex-grow flex items-center justify-center relative px-4 py-20 overflow-hidden">
                {/* large blurred background circle */}
                <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-200 h-200 bg-primary/20 rounded-full blur-[100px] opacity-20 pointer-events-none"/>

                <div className="w-full max-w-5xl relative z-10 flex flex-col items-center justify-center">
                    {/* Headline Behind Glass */}
                    <div
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full text-center pointer-events-none z-0">
                        <h1 className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white/30 to-white/5 select-none blur-xs transform scale-110">
                            TRANSPARENCY
                        </h1>
                    </div>

                    {/* The Glass Pane */}
                    <div
                        className="glass-pane rounded-2xl p-8 md:p-16 w-full max-w-3xl relative z-10 overflow-hidden group">
                        {/* caustic light overlay on hover */}
                        <div
                            className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"/>

                        <div className="relative z-20 flex flex-col items-center text-center gap-8">
                            {/* Icon */}
                            <div
                                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-white/10 to-white/0 border border-white/10 flex items-center justify-center shadow-glass mb-2">
                                <span className="material-symbols-outlined text-white text-3xl">fingerprint</span>
                            </div>

                            {/* Main Copy */}
                            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight drop-shadow-lg">
                                Transparency in <br/>
                                <span
                                    className="text-primary bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">Every Stroke</span>
                            </h2>

                            <p className="text-lg text-slate-300 max-w-lg font-light leading-relaxed">
                                Secure, legally binding signatures with crystal clear audit trails. Experience the
                                future of document verification.
                            </p>

                            {/* CTAs */}
                            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center mt-4">
                                <button
                                    className="bg-white text-slate-900 hover:bg-slate-100 px-8 py-3.5 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 shadow-lg min-w-[160px]">
                                    Get Started
                                </button>
                                <button
                                    className="glass-chip px-8 py-3.5 rounded-xl font-medium text-white hover:bg-white/10 transition-colors flex items-center justify-center gap-2 min-w-[160px]">
                                    <span className="material-symbols-outlined text-[20px]">play_circle</span>
                                    View Demo
                                </button>
                            </div>

                            {/* Trust Badges */}
                            <div
                                className="pt-8 flex items-center gap-6 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                                <div className="flex items-center gap-2" title="SOC2 Compliant">
                                    <span className="material-symbols-outlined text-xl">verified_user</span>
                                    <span className="text-xs font-semibold tracking-wider">SOC2 TYPE II</span>
                                </div>
                                <div className="h-4 w-px bg-white/20"></div>
                                <div className="flex items-center gap-2" title="GDPR Ready">
                                    <span className="material-symbols-outlined text-xl">security</span>
                                    <span className="text-xs font-semibold tracking-wider">GDPR READY</span>
                                </div>
                                <div className="h-4 w-px bg-white/20"></div>
                                <div className="flex items-center gap-2" title="256-bit Encryption">
                                    <span className="material-symbols-outlined text-xl">lock</span>
                                    <span className="text-xs font-semibold tracking-wider">AES-256</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Floating Feature Cards (bottom) */}
            <div className="w-full max-w-7xl mx-auto px-6 pb-12 grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                {/* Card 1 */}
                <div
                    className="glass-pane p-6 rounded-xl flex flex-col gap-4 group hover:-translate-y-1 transition-transform duration-300">
                    <div className="flex items-center justify-between">
                        <div className="p-2 rounded-lg bg-white/5 text-blue-400">
                            <span className="material-symbols-outlined">history_edu</span>
                        </div>
                        <span className="text-xs text-slate-400 font-mono">01</span>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-2">Audit Trails</h3>
                        <p className="text-sm text-slate-400">Complete, tamper-proof history of every action taken on
                            your document.</p>
                    </div>
                </div>

                {/* Card 2 */}
                <div
                    className="glass-pane p-6 rounded-xl flex flex-col gap-4 group hover:-translate-y-1 transition-transform duration-300">
                    <div className="flex items-center justify-between">
                        <div className="p-2 rounded-lg bg-white/5 text-purple-400">
                            <span className="material-symbols-outlined">verified</span>
                        </div>
                        <span className="text-xs text-slate-400 font-mono">02</span>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-2">Identity Verification</h3>
                        <p className="text-sm text-slate-400">Bank-grade identity checks ensure signers are who they say
                            they are.</p>
                    </div>
                </div>

                {/* Card 3 */}
                <div
                    className="glass-pane p-6 rounded-xl flex flex-col gap-4 group hover:-translate-y-1 transition-transform duration-300">
                    <div className="flex items-center justify-between">
                        <div className="p-2 rounded-lg bg-white/5 text-emerald-400">
                            <span className="material-symbols-outlined">encrypted</span>
                        </div>
                        <span className="text-xs text-slate-400 font-mono">03</span>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-2">End-to-End Encryption</h3>
                        <p className="text-sm text-slate-400">Documents are encrypted at rest and in transit with
                            advanced keys.</p>
                    </div>
                </div>
            </div>

            {/* Decorative floating elements */}
            <div
                className="absolute top-20 right-20 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl pointer-events-none pulse-blob"/>
            <div
                className="absolute bottom-20 left-20 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl pointer-events-none pulse-blob"
                style={{animationDelay: "1s"}}/>
        </div>
    );
}