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

    // Safety Features State
    const [showMenu, setShowMenu] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportReason, setReportReason] = useState("");

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
            // Fetch duplicate column id to be safe
            const { data: memberData } = await supabase
                .from('connection_members')
                .select('profile:profiles(id, display_name, avatar_url, profile_type)')
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

    const handleUnmatch = async () => {
        if (!confirm("Are you sure you want to unmatch? This cannot be undone.")) return;

        try {
            // Update connection status to 'blocked'
            const { error } = await supabase
                .from('connections')
                .update({ status: 'blocked' })
                .eq('id', id);

            if (error) throw error;
            router.push('/app/chats');
        } catch (error) {
            console.error('Error unmatching:', error);
            alert('Failed to unmatch.');
        }
    };

    const handleReport = async () => {
        try {
            if (!currentUser || !otherPerson) return;

            const { error } = await supabase
                .from('reports')
                .insert({
                    reporter_id: currentUser.id,
                    reported_profile_id: otherPerson.id,
                    reason: reportReason,
                    details: 'Reported from chat'
                });

            if (error) throw error;

            // Auto unmatch after report
            await supabase
                .from('connections')
                .update({ status: 'blocked' })
                .eq('id', id);

            alert('User reported. Conversation closed.');
            router.push('/app/chats');
        } catch (error) {
            console.error('Error reporting:', error);
            alert('Failed to submit report.');
        }
    };

    return (
        <div className="flex flex-col h-full bg-background-light dark:bg-black text-slate-900 dark:text-white">

            {/* HEADER */}
            <div className="flex items-center gap-3 px-4 py-3 bg-surface-dark/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-20 relative">
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

                <div className="relative">
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="p-2 text-gray-400 hover:text-white"
                    >
                        <span className="material-symbols-outlined">more_vert</span>
                    </button>

                    {showMenu && (
                        <>
                            <div className="fixed inset-0 z-30" onClick={() => setShowMenu(false)}></div>
                            <div className="absolute right-0 top-full mt-2 w-48 bg-surface-light dark:bg-[#1f1f1f] rounded-xl shadow-2xl border border-white/10 z-40 overflow-hidden">
                                <button
                                    onClick={handleUnmatch}
                                    className="w-full text-left px-4 py-3 text-sm font-medium text-red-500 hover:bg-white/5 flex items-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-lg">person_remove</span>
                                    Unmatch
                                </button>
                                <button
                                    onClick={() => { setShowReportModal(true); setShowMenu(false); }}
                                    className="w-full text-left px-4 py-3 text-sm font-medium text-gray-300 hover:bg-white/5 flex items-center gap-2 border-t border-white/5"
                                >
                                    <span className="material-symbols-outlined text-lg">flag</span>
                                    Report User
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* MESSAGES */}
            <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-3">

                {/* Intro date */}
                <div className="text-center my-4">
                    <span className="text-[10px] text-gray-500 bg-surface-light dark:bg-white/5 px-3 py-1 rounded-full uppercase tracking-wider">
                        You matched today
                    </span>
                </div>

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
                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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

            {/* REPORT MODAL */}
            {showReportModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-surface-light dark:bg-[#1a1a1a] w-full max-w-sm rounded-2xl p-6 border border-white/10">
                        <h3 className="text-lg font-bold mb-4">Report User</h3>
                        <p className="text-sm text-gray-400 mb-4">Why are you reporting this user? This will also block them.</p>

                        <div className="space-y-2 mb-6">
                            {['Fake Profile', 'Harassment', 'Inappropriate Content', 'Other'].map((reason) => (
                                <button
                                    key={reason}
                                    onClick={() => setReportReason(reason)}
                                    className={`w-full p-3 rounded-xl text-left text-sm font-medium border transition-colors ${reportReason === reason
                                            ? 'border-primary bg-primary/10 text-primary'
                                            : 'border-white/10 hover:bg-white/5'
                                        }`}
                                >
                                    {reason}
                                </button>
                            ))}
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowReportModal(false)}
                                className="flex-1 py-3 font-bold text-gray-400 hover:text-white"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReport}
                                disabled={!reportReason}
                                className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold disabled:opacity-50"
                            >
                                Report
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
