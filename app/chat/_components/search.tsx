"use client"

import { api } from "@/convex/_generated/api";
import { useAuth } from "@clerk/nextjs"
import { useMutation, useQuery } from "convex/react";
import { debounce } from "lodash";
import { useRouter } from "next/navigation";
import React, { startTransition, useCallback, useState, useTransition } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from "@/components/ui/dialog"
  

export default function SearchComponent({onSidebar}: {onSidebar: boolean}) {

    const {userId} = useAuth();
    const [search, setSearchTerm] = useState<string>("");
    const [debouncedTerm, setDebouncedTerm] = useState<string>("");
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [isPending, setIsPending] = useTransition();

    const router = useRouter();

    const createConversation = useMutation(api.chats.createOrGetConversation)

    const debouncedSearch = useCallback(
        debounce((term: string) => {
            startTransition(() => {
                setDebouncedTerm(term);
            })
        }, 300), []
    )

    const searchResullt = useQuery(api.users.searchUsers, {
        searchTerm: debouncedTerm,
        currentUserId: userId || ""
    })

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);
        debouncedSearch(value);
    }

    const handleStartChart = async (selectedUserId: string) => {
        try {
            const conversationId = await createConversation({
                participantUserId: selectedUserId,
                currentUserId: userId || "",
            })

            setIsOpen(false);
            router.push(`/chat/${conversationId}`);
        } catch (error) {
            console.error("Error creating conversation " + error);
        }
    }

    const Skeleton = () => (
        <div className="flex items-center px-4 py-3 animate-pulse">
            <div className="h-12 w-12 rounded-full bg-[#202C33] mr-3"/>
            <div className="flex-1">
                <div className="h-4 bg-[#202C33] rounded w-1/3 mb-2" />
                <div className="h-3 bg-[#202C33] rounded w-1/2"/>
            </div>

        </div>
    )

    return (
        <Dialog>
            <DialogTrigger>Open</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                <DialogTitle>Are you absolutely sure?</DialogTitle>
                <DialogDescription>
                    This action cannot be undone. This will permanently delete your account
                    and remove your data from our servers.
                </DialogDescription>
                </DialogHeader>
            </DialogContent>
        </Dialog>

    )
}