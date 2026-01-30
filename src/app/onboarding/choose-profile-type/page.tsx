'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ChooseProfileTypePage() {
    const [selectedType, setSelectedType] = useState<'single' | 'couple'>('single');

    return (
        <div className="relative flex h-full min-h-screen w-full flex-col bg-background-light dark:bg-background-dark shadow-2xl overflow-hidden">
            {/* Dynamic Background */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[30%] bg-primary/10 rounded-full blur-[80px] pointer-events-none"></div>
            <div className="absolute bottom-[10%] right-[-5%] w-[60%] h-[40%] bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>

            {/* Header */}
            <div className="flex items-center p-6 pb-2 justify-between z-10 w-full max-w-md mx-auto">
                <button className="text-white/80 hover:text-white transition-colors p-2 -ml-2 rounded-full hover:bg-white/5">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <div className="flex gap-2">
                    <div className="h-1.5 w-6 rounded-full bg-primary shadow-glow"></div>
                    <div className="h-1.5 w-1.5 rounded-full bg-white/20"></div>
                    <div className="h-1.5 w-1.5 rounded-full bg-white/20"></div>
                </div>
                <div className="w-10"></div>
            </div>

            <div className="flex-1 flex flex-col px-6 pt-4 pb-8 z-10 w-full max-w-md mx-auto">
                <div className="mb-8 mt-4">
                    <h1 className="text-white font-display text-4xl font-light tracking-tight leading-[1.15]">
                        How do you want to <br /> <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70">experience us?</span>
                    </h1>
                    <p className="text-white/50 mt-3 text-base font-light">Choose your journey type to get started.</p>
                </div>

                <div className="grid grid-cols-1 gap-5 flex-1">
                    {/* Single Option */}
                    <button
                        onClick={() => setSelectedType('single')}
                        className={`group relative flex flex-row items-center gap-5 rounded-[2rem] border-2 p-6 text-left transition-all duration-300 hover:scale-[1.02] shadow-glow ${selectedType === 'single'
                                ? 'border-primary bg-surface-dark/50'
                                : 'border-white/5 bg-surface-darker/50 hover:bg-surface-dark/80 hover:border-white/20'
                            }`}
                    >
                        {selectedType === 'single' && (
                            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-50 rounded-[2rem]"></div>
                        )}
                        <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full transition-colors duration-300 ${selectedType === 'single'
                                ? 'bg-primary/20 text-primary'
                                : 'bg-white/5 text-white/70 group-hover:bg-white/10 group-hover:text-white'
                            }`}>
                            <span className="material-symbols-outlined text-[32px]">person</span>
                        </div>
                        <div className="flex flex-col gap-1 z-10">
                            <h2 className={`text-xl font-bold leading-tight tracking-wide ${selectedType === 'single' ? 'text-white' : 'text-white/90'}`}>
                                Sou Single
                            </h2>
                            <p className={`text-sm font-medium leading-normal ${selectedType === 'single' ? 'text-primary/80' : 'text-white/40'}`}>
                                Explore connections solo
                            </p>
                        </div>
                        <div className="ml-auto">
                            <span className={`material-symbols-outlined transition-opacity ${selectedType === 'single' ? 'text-primary filled opacity-100' : 'text-white/20 opacity-0 group-hover:opacity-100'}`}>
                                {selectedType === 'single' ? 'check_circle' : 'radio_button_unchecked'}
                            </span>
                        </div>
                    </button>

                    {/* Couple Option */}
                    <button
                        onClick={() => setSelectedType('couple')}
                        className={`group relative flex flex-row items-center gap-5 rounded-[2rem] border-2 p-6 text-left transition-all duration-300 hover:scale-[1.02] shadow-glow ${selectedType === 'couple'
                                ? 'border-primary bg-surface-dark/50'
                                : 'border-white/5 bg-surface-darker/50 hover:bg-surface-dark/80 hover:border-white/20'
                            }`}
                    >
                        {selectedType === 'couple' && (
                            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-50 rounded-[2rem]"></div>
                        )}
                        <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full transition-colors duration-300 ${selectedType === 'couple'
                                ? 'bg-primary/20 text-primary'
                                : 'bg-white/5 text-white/70 group-hover:bg-white/10 group-hover:text-white'
                            }`}>
                            <span className="material-symbols-outlined text-[32px]">diversity_3</span>
                        </div>
                        <div className="flex flex-col gap-1 z-10">
                            <h2 className={`text-xl font-bold leading-tight tracking-wide ${selectedType === 'couple' ? 'text-white' : 'text-white/90'}`}>
                                Somos 2
                            </h2>
                            <p className={`text-sm font-medium leading-normal ${selectedType === 'couple' ? 'text-primary/80' : 'text-white/40'}`}>
                                Profile for couples
                            </p>
                        </div>
                        <div className="ml-auto">
                            <span className={`material-symbols-outlined transition-opacity ${selectedType === 'couple' ? 'text-primary filled opacity-100' : 'text-white/20 opacity-0 group-hover:opacity-100'}`}>
                                {selectedType === 'couple' ? 'check_circle' : 'radio_button_unchecked'}
                            </span>
                        </div>
                    </button>

                    <div className="flex-1 min-h-[40px]"></div>
                </div>

                {/* Footer */}
                <div className="flex flex-col gap-6 mt-auto">
                    <Link href="/onboarding/profile" className="w-full">
                        <button className="relative flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-full h-14 bg-primary text-white text-lg font-bold tracking-wide shadow-glow transition-transform active:scale-95 hover:brightness-110">
                            <span className="z-10">Continue</span>
                            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity"></div>
                        </button>
                    </Link>
                    <div className="flex items-center justify-center gap-2 text-white/30">
                        <span className="material-symbols-outlined text-[16px]">lock</span>
                        <p className="text-xs font-medium tracking-wide">Your privacy is our priority</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
