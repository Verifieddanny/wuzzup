"use client"

import { Progress } from "./ui/progress"
import { Lock } from "lucide-react"
import { useEffect, useState } from "react"

export default function LoadingState() {
    const [progress, setProgress] = useState(0)

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress((prevProgress) => {
                if(prevProgress >= 100) {
                    clearInterval(interval)
                    return 100;
                }
                return prevProgress + 1;
            })
        }, 50)

        return () => clearInterval(interval)
    }, [])

    return (
        <div className="flex h-screen bg-[#111B21]">
            <div className="flex-1 flex flex-col">
                <div className="flex-1 flex flex-col items-center justify-center gap-3">
                        <svg
                        viewBox="0 0 256 259"
                        width="128"
                        height="131"
                        className="mb-4"
                        xmlns="http://www.w3.org/2000/svg"
                        preserveAspectRatio="xMidYMid"
                        >
                        {/* <!-- Background Shape --> */}
                        <path
                            d="m67.663 221.823 4.185 2.093c17.44 10.463 36.971 15.346 56.503 15.346 61.385 0 111.609-50.224 111.609-111.609 0-29.297-11.859-57.897-32.785-78.824-20.927-20.927-48.83-32.785-78.824-32.785-61.385 0-111.61 50.224-110.912 112.307 0 20.926 6.278 41.156 16.741 58.594l2.79 4.186-11.16 41.156 41.853-10.464Z"
                            fill="#00E676"
                        />
                        <path
                            d="M219.033 37.668C195.316 13.254 162.531 0 129.048 0 57.898 0 .698 57.897 1.395 128.35c0 22.322 6.278 43.947 16.742 63.478L0 258.096l67.663-17.439c18.834 10.464 39.76 15.347 60.688 15.347 70.453 0 127.653-57.898 127.653-128.35 0-34.181-13.254-66.269-36.97-89.986ZM129.048 234.38c-18.834 0-37.668-4.882-53.712-14.648l-4.185-2.093-40.458 10.463 10.463-39.76-2.79-4.186C7.673 134.63 22.322 69.058 72.546 38.365c50.224-30.692 115.097-16.043 145.79 34.181 30.692 50.224 16.043 115.097-34.18 145.79-16.045 10.463-35.576 16.043-55.108 16.043Z"
                            fill="#FFF"
                        />
                        {/* <!-- Text Element --> */}
                        <text
                            x="50%"
                            y="50%"
                            dominantBaseline="middle"
                            textAnchor="middle"
                            fontFamily="Arial, sans-serif"
                            fontSize="40"
                            fill="#fff"
                            fontWeight="bold"
                        >
                            Wuzzup
                        </text>
                        </svg>


                        <div className="text-center mb-8 ">
                            <h1 className="text-[#E9EDEF] text-xl font-light mb-1">Wuzzup</h1>
                            <div className="flex items-center justify-center gap-2 text-[#8696A0]">
                                <Lock className="w-3 h-3" />
                                <span className="text-sm">End-to-end encrypted (NOT REALLY)</span>
                            </div>
                        </div>
                        
                        <div className="w-64 ">
                            <Progress value={progress} className= "h-1 bg-[#202C33]" />
                        </div>
                </div>
            </div>
        </div>
    )
}


