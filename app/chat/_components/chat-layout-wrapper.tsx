"use client"
import { api } from "@/convex/_generated/api";
import { useAuth } from "@clerk/nextjs";
import { Preloaded, usePreloadedQuery } from "convex/react";
import { useEffect, useState } from "react";

interface ChatLayoutProps {
    children: React.ReactNode;
    preloadedUserInfo: Preloaded<typeof api.users.readUser>
}

export default function ChatLayoutWrapper({children, preloadedUserInfo}: ChatLayoutProps ) {


    const {isLoaded, isSignedIn, userId} = useAuth();
    const [shouldShowLoading, setShouldShowLoading] = useState(true);

    const userInfo = usePreloadedQuery(preloadedUserInfo);

    useEffect(() => {
        const timer = setTimeout(() => {
            setShouldShowLoading(false);
        }, 1000)
        return () => clearTimeout(timer);
    }, [])

    const isLoading = !isLoaded || userInfo === undefined || shouldShowLoading;

    if (isLoading) {
        return <LoadingState />
    }

    if(!isSignedIn) {
        return null;
    }
    return (
        <div className="flex h-screen bg-background dark:bg-[#111B21] overflow-hidden">
            <Sidebar />
            <Header>
                {children}
            </Header>
        </div>
    )
}