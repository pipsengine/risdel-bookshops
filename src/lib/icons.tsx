import React from "react";

const paths:Record<string,React.ReactNode>={
 home:<><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9 21v-7h6v7"/></>,
 org:<><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M8 8h8M8 12h8M8 16h4"/></>,
 sales:<><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 15V9m5 6v-3m5 3V7"/></>,
 book:<><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5z"/><path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5z"/></>,
 box:<><path d="m4 7 8-4 8 4-8 4z"/><path d="M4 7v10l8 4 8-4V7M12 11v10"/></>,
 cart:<><path d="M3 4h2l2.2 10.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 2-1.6L21 8H6"/><circle cx="10" cy="20" r="1"/><circle cx="18" cy="20" r="1"/></>,
 users:<><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
 school:<><path d="m3 10 9-6 9 6"/><path d="M5 10v9h14v-9M9 19v-5h6v5"/></>,
 supplier:<><path d="M7 7h14l-2 7H8z"/><path d="M7 7 5 3H2M10 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm7 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"/></>,
 finance:<><path d="M3 10h18M5 10v8m4-8v8m6-8v8m4-8v8M3 21h18M12 3 3 8h18z"/></>,
 truck:<><path d="M3 6h11v10H3zM14 10h4l3 3v3h-7z"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/></>,
 report:<><path d="M4 19V5M10 19V9M16 19V3M22 19H2"/></>,
 approve:<><path d="m5 12 4 4L19 6"/></>,
 bell:<><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></>,
 doc:<><path d="M6 2h9l5 5v15H6z"/><path d="M14 2v6h6M9 13h6M9 17h6"/></>,
 admin:<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21h-4v-.09A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3v-4h.09A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3h4v.09A1.7 1.7 0 0 0 15.4 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.13.38.36.72.68 1 .31.28.7.42 1.1.4H21v4h-.09c-.4-.02-.79.12-1.1.4-.31.28-.55.62-.68 1Z"/></>,
 search:<><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
 logout:<><path d="M10 17l5-5-5-5M15 12H3M21 19V5a2 2 0 0 0-2-2h-5"/></>,
 heart:<><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"/></>,
 package:<><path d="m12 2 9 5-9 5-9-5zM3 7v10l9 5 9-5V7M12 12v10"/></>,
 wallet:<><path d="M4 5h14a2 2 0 0 1 2 2v12H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"/><path d="M16 11h6v5h-6a2.5 2.5 0 0 1 0-5Z"/></>,
 plus:<><path d="M12 5v14M5 12h14"/></>,
 arrow:<><path d="M5 12h14M13 6l6 6-6 6"/></>
};
export const Icon=({name,size=17}:{name:string;size?:number})=><svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]||<circle cx="12" cy="12" r="4"/>}</svg>;
