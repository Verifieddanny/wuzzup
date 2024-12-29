"use client"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { fetchMutation } from "convex/nextjs";
import { useMutation } from "convex/react";
import { useReactMediaRecorder } from "react-media-recorder";
import { Mic, Paperclip, Send, X, PlayCircle, PauseCircle, Trash2, StopCircle } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form"
import { toast } from "sonner";

interface FormInput {
    message: string;
}
export default function FormChat({conversationId, userId}: {conversationId: string, userId: string}) {
    const {register, handleSubmit, watch, setValue, reset,} = useForm<FormInput>(); 
    const [attachments, setAttachments] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const [audioAttachments, setAudioAttachments] = useState<Array<{
      url: string;
      blob: Blob;
      duration: number;
    }>>([]);
    const [playingAudioIndex, setPlayingAudioIndex] = useState<number | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    // const audioRef = useRef<HTMLAudioElement[] | null>(null);
    const audioRef = useRef<(HTMLAudioElement | null)[]>([]);

    const { startRecording, stopRecording, mediaBlobUrl } = useReactMediaRecorder({
        audio: true,
        onStop: (blobUrl, blob) => {
            if (blob) {
                const audio = new Audio(blobUrl);
                audio.addEventListener('loadedmetadata', () => {
                    console.log({recordingDuration})
                    const duration = memoizedDuration;
                    console.log({duration})
                 
                    setAudioAttachments(prev => [...prev, {
                        url: blobUrl,
                        blob: blob,
                        duration: duration
                    }]);
                });
            }
        }
    });

    const sendMessage = useMutation(api.chats.sendMessage)

    useEffect(() => {
        if (isRecording) {
            timerRef.current = setInterval(() => {
                setRecordingDuration(prev => prev + 1);
            }, 1000);
        } else {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
            setRecordingDuration(0);
        }

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [isRecording]);


    const memoizedDuration = useMemo(() => recordingDuration, [recordingDuration]);


    const formatDuration = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const handleStartRecording = () => {
        setIsRecording(true);
        startRecording();
    };

    const handleStopRecording = () => {
        setIsRecording(false);
        stopRecording();
    };

    const deleteAudio = (index: number) => {
        setAudioAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const cancelRecording = () => {
        setIsRecording(false);
        stopRecording();
        setAudioAttachments(prev => prev.slice(0, -1));
    };

    // Play or pause the audio based on the index
    const toggleAudioPlay = (index: number) => {
        const audio = audioRef.current?.[index];

        if (!audio) return;

        if (playingAudioIndex === index) {
            audio.pause();
            setPlayingAudioIndex(null);
        } else {
            // Pause any currently playing audio
            if (playingAudioIndex !== null && audioRef.current?.[playingAudioIndex]) {
                audioRef.current[playingAudioIndex].pause();
            }
            audio.play();
            setPlayingAudioIndex(index);
        }
    };


    const onSubmit = async (data: FormInput) => {
        try {
            // if(isListening && recognitionRef.current) {
            //     recognitionRef.current.stop()
            // }


            for (const imageUrl of attachments) {
                await sendMessage({
                    type: "image",
                    conversationId: conversationId as Id<"conversations">,
                    senderId: userId!,
                    content: "Image",
                    mediaUrl: imageUrl,
                })
            }
  // Send audio if recorded
            
            for (const audio of audioAttachments) {
                const uploadUrl = await fetchMutation(api.chats.generateUploadUrl);
                const response = await fetch(uploadUrl, {
                    method: "POST",
                    headers: { "Content-Type": "audio/wav" },
                    body: audio.blob,
                });

                if (!response.ok) {
                    throw new Error(`Audio upload failed: ${response.statusText}`);
                }

                const { storageId } = await response.json();
                const audioUrl = await fetchMutation(api.chats.getUploadUrl, { storageId });

                await sendMessage({
                    type: "audio",
                    conversationId: conversationId as Id<"conversations">,
                    senderId: userId!,
                    content: "Audio Message",
                    mediaUrl: audioUrl || undefined,
                });
            }
            if(data.message.trim() ) {
                            await sendMessage({
                                type: "text",
                                conversationId: conversationId as Id<"conversations">,
                                senderId: userId!,
                                content: data.message,
                            })
                        }

            reset();
            setAttachments([]);
            setAudioAttachments([]);
        } catch (error) {
            console.log("Failed to send message:", error);
            toast.error("Failed to send message. Please try again.")
        }
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if(!file) return;

        try {
            setIsUploading(true);

            const postUrl = await fetchMutation(api.chats.generateUploadUrl)
            const result = await fetch(postUrl, {
                method: "POST",
                headers: { "Content-Type": file.type},
                body: file,
            });

            if (!result.ok) {
                throw new Error(`Upload failed: ${result.statusText}`)
              }

            const { storageId } = await result.json();

            const url = await fetchMutation(api.chats.getUploadUrl, {
                storageId
            })

            if (url) {
                setAttachments([...attachments, url])
              }
            
        } catch (error) {
            console.log("Upload failed:", error);
            toast.error("Failed to upload image. Please try again.");
        } finally {
            setIsUploading(false);
        }
    }

    const removeAttachment = (index: number) => {
        setAttachments(attachments.filter((_, i) => i !== index))
      }

    return (
        <div className="bg-muted dark:bg-[#202C33]">
            {/* Image Attachments */}
            {attachments?.length > 0 && (
                <div className="p-2 flex gap-2 flex-wrap border-b border-border dark:border-[#313D45]">
                    {attachments.map((url, index) => (
                        <div key={index} className="relative group">
                            <img src={url} alt="attachment" className="h-20 w-20 object-cover rounded-md" />
                            <button onClick={() => removeAttachment(index)} className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <X className="h-4 w-4 text-white" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

           {/* Audio Attachments Section */}
           {audioAttachments.length > 0 && !isRecording && (
                <div className="p-4 space-y-2 border-t border-border">
                    {audioAttachments.map((audio, index) => (
                        <div key={index} className="flex items-center justify-between bg-background dark:bg-[#2A3942] p-3 rounded-lg">
                            <div className="flex items-center space-x-3">
                                <Mic className="h-5 w-5 text-primary" />
                                <span className="text-sm font-medium">{formatDuration(audio.duration)}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleAudioPlay(index)}
                                    className="text-primary"
                                >
                                    {playingAudioIndex === index ? <PauseCircle className="h-5 w-5" /> : <PlayCircle className="h-5 w-5" />}
                                </Button>
                                <Button
                                    onClick={() => deleteAudio(index)}
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-500 hover:text-red-600"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                            <audio  ref={(el) => {
                                    audioRef.current[index] = el; 
                                }}
                                src={audio.url} />

                        </div>
                    ))}
                </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className={`bg-muted dark:bg-[#202C33] p-4 flex items-center space-x-2 ${(attachments?.length > 0 || audioAttachments.length > 0) && "pb-[5rem]"}`}>
                {/* File upload button */}
                <div className="relative">
                    <label htmlFor="file-upload" className="cursor-pointer inline-flex items-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 w-10 justify-center">
                        <Paperclip className="w-5 h-5" />
                    </label>
                    <input id="file-upload" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isUploading} />
                </div>

                {isRecording ? (
          <div className="flex-1 flex items-center justify-between bg-background dark:bg-[#2A3942] rounded-md px-4 h-10">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Mic className="h-5 w-5 text-red-500 animate-pulse" />
                <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full animate-ping" />
              </div>
              <span className="text-sm font-medium">{formatDuration(recordingDuration)}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={cancelRecording}
                className="text-red-500 hover:text-red-600 p-0 h-8 w-8"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleStopRecording}
                className="text-primary hover:text-primary/80 p-0 h-8 w-8"
              >
                <StopCircle className="h-5 w-5" />
              </Button>
            </div>
          </div>
        ) : (
          <Input
            {...register("message")}
            placeholder={
              isUploading
                ? "Uploading..."
                : isListening
                ? "Listening..."
                : "Type a message"
            }
            className="flex-1 bg-background dark:bg-[#2A3942] border-none placeholder:text-muted-foreground"
          />
        )}

                {/* <Input 
                    {...register("message")} 
                    placeholder={isUploading ? "Uploading..." : isListening ? "Listening..." : "Type a message"}
                    className="flex-1 bg-background dark:bg-[#2A3942] border-none placeholder:text-muted-foreground" 
                /> */}

                {/* Recording button with ripple effect */}
                {isRecording ? (
                    <Button variant="outline" onClick={handleStopRecording}>
                        <StopCircle className="w-6 h-6" />
                    </Button>
                ) : (
                    <Button variant="outline" onClick={handleStartRecording}>
                        <Mic className="w-6 h-6" />
                    </Button>
                )}

                {/* Speech recognition button */}
                {/* {speechSupported && (
                    <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        onClick={toggleListening} 
                        className={`transition-colors ${isListening ? "text-red-500" : hasMicPermission === false ? "text-gray-400": ""}`}
                    >
                        <Mic className={`h-6 w-6 ${isListening ? "animate-pulse": ""}`} />
                    </Button>
                )} */}

                <Button 
                    type="submit" 
                    size="icon" 
                    disabled={isUploading || (!attachments.length && !audioAttachments.length && !watch("message"))}
                >
                    <Send className="w-5 h-5" />
                </Button>
            </form>
        </div>
    );
}