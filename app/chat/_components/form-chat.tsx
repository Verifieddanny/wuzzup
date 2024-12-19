import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form"
import { toast } from "sonner";

interface FormInput {
    message: string;
}
export default function FormChat({conversationId, userId}: {conversationId: string, userId: string}) {
    const {register, handleSubmit, watch, formState: {errors}, setValue, reset,} = useForm(); 
    const [attachment, setAttachment] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [speechSupported, setSpeechSupported] = useState(false);
    const [hasMicPermission, setHasMicPermission] =  useState<boolean | null>(null);

    const recognitionRef = useRef<any>(null);

    const sendMessage = useMutation(api.chats.sendMessage)

    const checkMicrophonePermission = async () => {
        try {
            const permissionResult = await navigator.mediaDevices.getUserMedia({audio: true})

            setHasMicPermission(true);
            permissionResult.getTracks().forEach(track => track.stop())
        } catch (error) {
            setHasMicPermission(false);
            console.log("Microphone permission error", error)
            
        }
    }

    useEffect(() => {
        if(typeof window !== "undefined") {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

            if(SpeechRecognition) {
                setSpeechSupported(true);

                recognitionRef.current = new SpeechRecognition()
                const recognition = recognitionRef.current;

                recognition.continuous = true;
                recognition.interimResults = true;
                recognition.lang = "en-US";

                recognition.onstart = () => {
                    setIsListening(true);
                    toast.success("Started listening")
                };

                recognition.onresult = (event: any) => {
                    const current = event.resultIndex;
                    const transcript = event.results[current][0].transcript;
                    const currentMessage = watch('message') || "";
                    if(event.result[current].isFinal) {
                        setValue('message', currentMessage + transcript + " ")
                    }
                };

                recognition.onerror = (event: any) => {
                    console.log("Speech recognition error   : ", event.error);
                    setIsListening(false);

                    switch (event.error) {
                        case 'not-allowed':
                            toast.error("Microphone access denied, Please enable microphone permission.");
                            setHasMicPermission(false);
                            break;
                        
                        case 'no-speech':
                            toast.error("No speech detected, please try again.");
                            break;
                        
                        case 'network':
                            toast.error("Network error, please check your connection.");
                            break;
                    
                        default:
                            break;
                    }
                }

                recognition.onend = () => {
                    setIsListening(false);
                    toast.success("Stopped listening")
                };

                checkMicrophonePermission();
            }
        } 
    }, [])

    const toggleListening = async () => {
        if(!recognitionRef.current) return;

        if(isListening) {
            recognitionRef.current.stop()
        } else {
            if(hasMicPermission === false){
                toast.error(
                    "Microphone access denied. Please enable microphone permission in your browser settings.", 
                    {
                        action: {
                            label: "How to enable",
                            onClick: () => {
                                toast.info("To enable microphone: Click the camera/microphone icon in your browser's address bar and allow access", {duration: 5000})
                            }
                        }
                    }
                )

                return ;
            }

            try {
                await checkMicrophonePermission();

                if(hasMicPermission) {
                    recognitionRef.current.start()
                }
            } catch (error) {
                console.log("Error starting speech recognition ", error);
                toast.error("Failed to start speech recognition. Please try again.")
            }
        }
    }

    const onSubmit = async (data: FormInput) => {
        try {
            if(isListening && recognitionRef.current) {
                recognitionRef.current.stop()
            }

            for (const imageUrl of attachment) {
                await sendMessage({
                    type: "image",
                    conversationId: conversationId as Id<"conversations">,
                    senderId: userId!,
                    content: "Image",
                    mediaUrl: imageUrl,
                })
            }

            if(data.message.trim() ) {
                await sendMessage({
                    type: "text",
                    conversationId: conversationId as Id<"conversations">,
                    senderId: userId!,
                    content: data.message,
                })
            }

            reset()
        } catch (error) {
            
        }
    }
    return<></>
}