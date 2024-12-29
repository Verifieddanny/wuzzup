"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, PlayCircle, PauseCircle } from "lucide-react";
import { Preloaded, usePreloadedQuery } from "convex/react";
import { Button } from "@/components/ui/button";  // Assuming you have a Button component styled like in your project
import { api } from "@/convex/_generated/api";
import WaveSurfer from "wavesurfer.js"; 

interface Message {
    content: string;
    id: string;
    isSent: boolean;
    sender: string;
    sender_userId: string | undefined;
    time: string;
    type: "text" | "image" | "audio" | "video" | "file";
    mediaUrl?: string;
}

// Define the type for the WaveSurfer instance
type WaveSurferInstance = WaveSurfer;

export default function ChatList({ userId, preloadedMessages }: { userId: string, preloadedMessages: Preloaded<typeof api.chats.getMessages> }) {
    const messages = usePreloadedQuery(preloadedMessages);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // State to manage audio play/pause
    const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
    const [_audioDuration, setAudioDuration] = useState<number | null>(null);
    const waveformRefs = useRef<Map<string, WaveSurferInstance | null>>(new Map()); // Use a map with strong typing
    const [containerWidth, setContainerWidth] = useState<number>(0);

    // Auto-scroll to the latest message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        
    }, [messages]);

    // Update container width on resize
    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current) {
                setContainerWidth(containerRef.current.offsetWidth);
            }
        };

        window.addEventListener("resize", handleResize);

        // Set initial width
        handleResize();

        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    // Set up WaveSurfer for each audio message
    useEffect(() => {
        messages.forEach((message: Message) => {
            if (message.type === "audio" && message.mediaUrl) {
                const container = document.getElementById(`waveform-${message.id}`);
                if (container && !container.hasChildNodes()) {
                    // Initialize WaveSurfer for this audio message
                    const wavesurfer = WaveSurfer.create({
                        container: `#waveform-${message.id}`,
                        waveColor: "#B9B9B9", // Set waveform color
                        progressColor: "#33FF33", // Progress color
                        height: 50,
                        barWidth: 2,
                        width: 96,
                    });
                    wavesurfer.load(message.mediaUrl);

                    // Store the instance in the map
                    waveformRefs.current.set(message.id, wavesurfer);
                }

            }
        });

        // Cleanup: destroy WaveSurfer instances when the component is unmounted
                return () => {
            waveformRefs.current.forEach((wavesurfer) => wavesurfer?.destroy());
        };
    }, [messages, containerWidth]);

    // Toggle audio play/pause
    const toggleAudioPlay = (id: string) => {
        const wavesurfer = waveformRefs.current.get(id);
        if (wavesurfer) {
            if (playingAudioId === id) {
                wavesurfer.pause();
                setPlayingAudioId(null);
            } else {
                // Pause previous audio if it's playing
                if (playingAudioId !== null) {
                    const previousWaveSurfer = waveformRefs.current.get(playingAudioId);
                    if (previousWaveSurfer) {
                        previousWaveSurfer.pause();
                    }
                }
                wavesurfer.play();
                setPlayingAudioId(id);
            }
        }
    };

    // Format audio duration (minutes:seconds)
    // const formatDuration = (duration: number) => {
    //     const minutes = Math.floor(duration / 60);
    //     const seconds = Math.floor(duration % 60);
    //     return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    // };

    return (
        <div ref={containerRef} className="flex-1 overflow-y-auto bg-background dark:bg-[#0B141A] max-h-[calc(100vh-135px)]" style={{
            msOverflowStyle: 'none',
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch',
        }}>
            <div className="p-4 min-h-full flex flex-col space-y-4">
                {messages.map((message: Message) => {
                    const isMyMessage = message.sender_userId === userId;
                    return (
                        <div key={message.id} className={`flex  ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
                            <div className={`rounded-lg p-3 max-w-xs md:max-w-md ${isMyMessage ? "bg-primary dark:bg-[#005C4B] text-primary-foreground" : "bg-muted dark:bg-[#202C33]"}`}>
                                {!isMyMessage && (
                                    <p className="text-xs dark:text-white text-muted-foreground mb-1">{message.sender}</p>
                                )}

                                {/* Audio message rendering */}
                                {message?.type === "audio" && (
                                    <div className="flex w-[12rem] items-center space-x-3">
                                        <Mic className="h-5 w-5 text-primary" />
                                        <div id={`waveform-${message.id}`} className="w-[6rem] flex justify-center h-12 overflow-hidden"></div>

                                        <audio
                                            id={`audio-${message.id}`}
                                            className="w-4/5 hidden"
                                            onLoadedMetadata={(e) => setAudioDuration(e.currentTarget.duration)}
                                        >
                                            <source src={message.mediaUrl!} type="audio/mp3" />
                                            Your browser does not support the audio element.
                                        </audio>

                                        {/* Play/Pause button */}
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => toggleAudioPlay(message.id)}
                                            className="text-primary"
                                        >
                                            {playingAudioId === message.id ? (
                                                <PauseCircle className="h-5 w-5" />
                                            ) : (
                                                <PlayCircle className="h-5 w-5" />
                                            )}
                                        </Button>
                                    </div>
                                )}

                                {/* For other types like text and images */}
                                {message?.type === "image" && (
                                    <div className="relative w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl">
                                        <img
                                            src={message.mediaUrl! ?? ""}
                                            alt="Message content"
                                            className="w-full h-auto max-h-[300px] object-contain rounded-lg"
                                            onLoad={() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })}
                                        />
                                    </div>
                                )}
                                {message?.type === "text" && <p className="text-sm dark:text-white break-words whitespace-pre-wrap">{message.content}</p>}

                                {/* Message time */}
                                <p className="text-right text-xs text-muted-foreground mt-1">
                                    {message.time}
                                </p>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>
        </div>
    );
}
