'use client';

import { createClient } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function ChatRoomPage() {
    const { id } = useParams(); // Connection ID
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [otherPerson, setOtherPerson] = useState<any>(null);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const supabase = createClient();
    const router = useRouter();

    // Scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Initial Fetch
    useEffect(() => {
        const initChat = async () => {
             const { data: { user } } = await supabase.auth.getUser();
             if (!user) return;
             setCurrentUser(user);

             // 1. Get Other Person Info
             const { data: memberData } = await supabase
                .from('connection_members')
                .select('profile:profiles(display_name, avatar_url, profile_type)')
                .eq('connection_id', id)
                .neq('profile_id', user.id)
                .single();
            
            if (memberData) setOtherPerson(memberData.profile);

            // 2. Fetch Messages
            const { data: msgs } = await supabase
                .from('messages')
                .select('*')
                .eq('connection_id', id)
                .order('created_at', { ascending: true });
            
            if (msgs) setMessages(msgs);

            // 3. Subscribe to Realtime Changes
            const channel = supabase
                .channel(`chat:${id}`)
                .on('postgres_changes', 
                    { event: 'INSERT', schema: 'public', table: 'messages', filter: `connection_id=eq.${id}` }, 
                    (payload) => {
                        setMessages(curr => [...curr, payload.new]);
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        };

        if (id) initChat();
    }, [id, supabase]);

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!newMessage.trim() || !currentUser) return;

        const text = newMessage;
        setNewMessage(""); // Optimistic clear

        // Send to DB
        const { error } = await supabase
            .from('messages')
            .insert({
                connection_id: id,
                sender_id: currentUser.id,
                body: text
            });

        if (error) {
            console.error("Error sending message:", error);
            // Could restore text if error
        }
    };

    return (
        <div className="flex flex-col h-full bg-background-light dark:bg-black text-slate-900 dark:text-white">
            
            {/* HEADER */}
            <div className="flex items-center gap-3 px-4 py-3 bg-surface-dark/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-20">
                <button 
                    onClick={() => router.back()}
                    className="p-2 -ml-2 text-gray-400 hover:text-white"
                >
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                
                <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden">
                    {otherPerson?.avatar_url && (
                        <img src={otherPerson.avatar_url} className="w-full h-full object-cover" />
                    )}
                </div>
                
                <div className="flex-1">
                    <h2 className="text-base font-bold">{otherPerson?.display_name || "Chat"}</h2>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        <span className="text-xs text-green-500 font-medium">Online now</span>
                    </div>
                </div>

                <button className="p-2 text-primary">
                    <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>videocam</span>
                </button>
            </div>

            {/* MESSAGES */}
            <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-3">
                
                {/* Intro date */}
                <div className="text-center my-4">
                    <span className="text-[10px] text-gray-500 bg-surface-light dark:bg-white/5 px-3 py-1 rounded-full uppercase tracking-wider">
                        You matched today
                    </span>
                </div>

                {/* Automation Message */}
                {/* <div className="self-center bg-transparent text-gray-400 text-xs italic mb-4">
                    Start the conversation!
                </div> */}

                {messages.map((msg) => {
                    const isMe = msg.sender_id === currentUser?.id;
                    return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div 
                                className={`
                                    max-w-[80%] rounded-2xl px-5 py-3 text-sm font-medium leading-relaxed
                                    ${isMe 
                                        ? 'bg-primary text-white rounded-br-none' 
                                        : 'bg-surface-light dark:bg-[#1a1a1a] text-slate-900 dark:text-white rounded-bl-none border border-black/5 dark:border-white/5'
                                    }
                                `}
                            >
                                {msg.body}
                                <div className={`text-[9px] mt-1 opacity-60 text-right ${isMe ? 'text-white' : 'text-gray-400'}`}>
                                    {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* INPUT */}
            <form 
                onSubmit={handleSend}
                className="p-3 bg-surface-dark border-t border-white/5 pb-8 flex items-end gap-2"
            >
                <button type="button" className="p-3 text-primary hover:bg-white/5 rounded-full transition-colors">
                    <span className="material-symbols-outlined">add_circle</span>
                </button>
                
                <div className="flex-1 bg-surface-light dark:bg-[#1a1a1a] rounded-2xl flex items-center px-4 py-2 border border-transparent focus-within:border-primary/50 transition-colors">
                    <input 
                        type="text" 
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="w-full bg-transparent border-none focus:ring-0 text-sm placeholder-gray-500"
                    />
                </div>

                <button 
                    type="submit" 
                    disabled={!newMessage.trim()}
                    className="p-3 bg-primary text-white rounded-full hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                >
                    <span className="material-symbols-outlined text-xl">send</span>
                </button>
            </form>
        </div>
    );
}
