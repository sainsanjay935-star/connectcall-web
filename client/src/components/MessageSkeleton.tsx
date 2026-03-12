import React from 'react';

export default function MessageSkeleton() {
    // We will render an array of fake message blocks containing skeletons
    const skeletons = [
        { isMine: false, width: 'w-2/3', height: 'h-16' },
        { isMine: true, width: 'w-1/2', height: 'h-12' },
        { isMine: false, width: 'w-3/4', height: 'h-24' },
        { isMine: true, width: 'w-1/3', height: 'h-12' },
        { isMine: false, width: 'w-1/2', height: 'h-16' },
    ];

    return (
        <div className="flex flex-col space-y-3 p-6">
            {skeletons.map((skel, idx) => (
                <div key={idx} className={`flex w-full ${skel.isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`
                        ${skel.width} ${skel.height} rounded-xl px-3 py-2
                        animate-pulse
                        ${skel.isMine ? 'bg-[#dcf8c6]/50 dark:bg-[#005c4b]/50 rounded-tr-none' : 'bg-white/50 dark:bg-[#202c33]/50 rounded-tl-none'}
                    `}>
                        {/* Inner text lines placeholder */}
                        <div className="flex flex-col space-y-2 mt-1">
                            <div className="h-3 w-3/4 bg-black/10 dark:bg-white/10 rounded-full"></div>
                            <div className="h-3 w-1/2 bg-black/10 dark:bg-white/10 rounded-full"></div>
                        </div>
                        {/* Time placeholder */}
                        <div className="flex justify-end mt-2">
                            <div className="h-2 w-8 bg-black/10 dark:bg-white/10 rounded-full"></div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
