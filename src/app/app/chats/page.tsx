'use client';

import Link from "next/link";

export default function ChatsPage() {
    const conversations = [
        {
            id: 1,
            name: "The Trio",
            message: "See you both tonight?",
            time: "9:41 AM",
            avatar1: "https://lh3.googleusercontent.com/aida-public/AB6AXuBSo9v5QAxmzEYDlFlRaHvSMC8ZMiCqitD3OXu91BBbl0djyes8u_ZSZDF4g89OY_EmOzgu2gEVViVaW9SZMfWGXRNPLLrZyQu4PbM_n5ikKYwEqps-7t3D4A9Ao-V1u32xFzFv24RtI0FWurRbEnl2x0GciCSjV8Td57JmVi-ziXeHGoFZ1yg7ZuHOc0uWPvMG-fSqiTISRxLDEqPEOCYuuDB-j9wmNZOAGWrnPVnA-zJMRiha_xbyHgcA0QewGpfhRYZOHMzxvQaZ",
            avatar2: "https://lh3.googleusercontent.com/aida-public/AB6AXuAOio-lDir2OR0fOfPHMjam9cHRtgq5AXcUcRCxk1XLy9IV8bbENZOqHArwkLBBfDYWjJ8FFgRgbUKggiLrjSweCiJ5iKDyebwqMY7PJQHFY6b9W-h40R5me9R1MoRlqAt2fW3pvBTqB4nB8hWwSBilVqzu6ZP2cuKOMkONwyYkxBWqUYEa21AukrysYvMXq9BKfjznVQjeGdTWMJXwfGqpISpw4ey8dclchvAcOKVnolfW0sE2VRZDO29UwBDok2xzLv6G2FSUiOfF",
            unread: true,
            verified: true
        },
        {
            id: 2,
            name: "Elena",
            message: "I loved your profile...",
            time: "Yesterday",
            avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuADhVjPxhGUThW4hz_QXxKOpcRM8-isMsY875JQCeURc4hNvoMrqyFtDrlwpJs0EQ1M7PB0RIuV8NhDszS4lqqNNBUcVwo48UUfJZ5_j-YK0zX7CJmQBz9YS8LoISbfPI0TabLZJuIEpKHYC3Vn_JAqi_P34pZNVWjUJDTp5VpuIsNE-Q3Kd6hXNGgErWreV1Jq5SpgHMya_x8yuWmBfuJ6HlS8GCgdqHkYMB_v5tqEsgpGt26tVty1yZHHs5uR0QeQzQsysHj92-Ke",
            unread: true,
            verified: true,
            online: true
        },
        {
            id: 3,
            name: "Marcus",
            message: "Are you free later?",
            time: "Tue",
            avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDDtDyw92kToJx_wJ34NIshWB32SRE32Nwhfg20OER9Tfe2vKNflTBUoPqMeocW-vM1eoBJcqWByRKB_hYmBF2ZdFRTR3VjkZkwupto6_54Vu1jCptJPdSngLU_lu0gwhC0D2n0_lq1p4k6vTMQLk4HXpw4YtyR87YHxAqeqkg2yGSa9CkSVn86OsX8d0XTRG50UcuKRyOElKQDTiUsIhOQOWLZIraceD4RPALwsyspdU7hy1T1-EB5J6O2bM-mTrJJXyPEiJ5b9m-6",
            unread: false,
            verified: false
        },
        {
            id: 4,
            name: "Couple + 1",
            message: "That sounds perfect.",
            time: "Mon",
            avatar1: "https://lh3.googleusercontent.com/aida-public/AB6AXuDYfXi6OAPaMOeuKt3_7nMFOW4ym4LNQR57_L78srM21Pw5hNLMAsreJ2UmKIF9W0fFVvjS3j6rsrojqLgyEMp_g-czvM-G6oAyMMWRPpQUd8XnHHwQrwqU4xpz5i5tQxnDzIsORSJjzV9hMA9muQLBJY8egvYXHeR4ZxTsUIf9ZGWosRRcSIn_44r35ilHyLYjcfpirI1jo2l3j2uySTI6IozPY8MRVkOZiSN_Gs_l2ndJPPAsWzVGlV3cV7-6QT6e516e-daPCbSL",
            avatar2: "https://lh3.googleusercontent.com/aida-public/AB6AXuAwHQVcUhS5tep8__AZExQas-wM4C6gsvvM5guqEtdp6yLDQFS3v-xkZ8nq7oORDAPpJYS9Uqjc7hLqc-MQbmyu6e1jdOU4xIOyZAnD-7lkR05jjhJ1CTfPyHIinoJClx6uJWwYLTkqdx3ML1bRQLHHVUTMcVdRWwoRxQ0m6Np6ckwYm3MfZhRNPoO5YfPzNpE9-sBiBpQZksZDshtfA05uoeeRZHsnxz-oAO9HGfBCQ8ExFP1OGgV0Flu56JwMHhTmXZL-xZtLiGdE",
            unread: false,
            verified: false,
            read: true
        }
    ];

    return (
        <>
            <header className="sticky top-0 z-20 flex items-center justify-between px-6 pt-12 pb-4 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Conversations</h1>
                <button className="group flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-surface-dark hover:bg-primary/10 transition-colors">
                    <span className="material-symbols-outlined text-slate-600 dark:text-gray-300 group-hover:text-primary transition-colors">search</span>
                </button>
            </header>

            <div className="sticky top-[88px] z-10 bg-background-light dark:bg-background-dark px-6 border-b border-slate-200 dark:border-white/5">
                <div className="flex gap-8">
                    <button className="relative flex flex-col items-center pb-3 pt-2">
                        <span className="text-sm font-bold tracking-wide text-slate-900 dark:text-white">All</span>
                        <span className="absolute bottom-0 h-0.5 w-full bg-primary rounded-t-full"></span>
                    </button>
                    <button className="relative flex flex-col items-center pb-3 pt-2 group">
                        <span className="text-sm font-medium tracking-wide text-slate-500 dark:text-gray-500 group-hover:text-slate-700 dark:group-hover:text-gray-300 transition-colors">Direct</span>
                        <span className="absolute bottom-0 h-0.5 w-full bg-transparent group-hover:bg-slate-300 dark:group-hover:bg-white/10 rounded-t-full transition-colors"></span>
                    </button>
                    <button className="relative flex flex-col items-center pb-3 pt-2 group">
                        <span className="text-sm font-medium tracking-wide text-slate-500 dark:text-gray-500 group-hover:text-slate-700 dark:group-hover:text-gray-300 transition-colors">Dynamics</span>
                        <span className="absolute bottom-0 h-0.5 w-full bg-transparent group-hover:bg-slate-300 dark:group-hover:bg-white/10 rounded-t-full transition-colors"></span>
                    </button>
                </div>
            </div>

            <main className="flex-1 overflow-y-auto pb-24 px-2 no-scrollbar">
                {conversations.map((chat) => (
                    <Link key={chat.id} href={`/app/chats/${chat.id}`}>
                        <div className="group/item relative flex cursor-pointer items-center gap-4 rounded-xl p-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                            <div className="relative h-14 w-14 flex-shrink-0">
                                {chat.avatar1 ? (
                                    <>
                                        <img alt="Member 1" className="absolute bottom-0 left-0 h-10 w-10 rounded-full border-2 border-white dark:border-background-dark object-cover z-20" src={chat.avatar1} />
                                        <img alt="Member 2" className="absolute top-0 right-0 h-10 w-10 rounded-full border-2 border-white dark:border-background-dark object-cover z-10 opacity-90" src={chat.avatar2} />
                                    </>
                                ) : (
                                    <>
                                        <img alt={chat.name} className="h-full w-full rounded-full object-cover border border-slate-100 dark:border-white/10" src={chat.avatar} />
                                        {chat.online && <div className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-background-dark bg-green-500"></div>}
                                    </>
                                )}
                            </div>
                            <div className="flex flex-1 flex-col justify-center min-w-0">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                    <p className="truncate text-base font-bold text-slate-900 dark:text-white">{chat.name}</p>
                                    {chat.verified && <span className="material-symbols-outlined text-[16px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>}
                                </div>
                                <p className={`truncate text-sm ${chat.unread ? 'font-medium text-slate-900 dark:text-white' : 'text-slate-500 dark:text-gray-400'}`}>
                                    {chat.message} <span className="text-slate-400 dark:text-gray-500 font-normal">· {chat.time}</span>
                                </p>
                            </div>
                            <div className="shrink-0 flex flex-col items-end gap-1">
                                {chat.unread ? (
                                    <div className="h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_8px_#008B99]"></div>
                                ) : chat.read ? (
                                    <span className="material-symbols-outlined text-[18px] text-slate-400 dark:text-gray-600">check_circle</span>
                                ) : null}
                            </div>
                        </div>
                    </Link>
                ))}
            </main>
        </>
    );
}
