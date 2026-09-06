import React from "react";
export const Icon=({name}:{name:string})=><span aria-hidden="true" style={{fontSize:15,lineHeight:1}}>{({home:"⌂",sales:"▣",book:"▤",box:"◇",cart:"🛒",users:"◎",school:"⌂",supplier:"⇄",finance:"₦",truck:"→",report:"▥",approve:"✓",bell:"◉",doc:"▧",admin:"⚙",search:"⌕",help:"?",logout:"↪"} as Record<string,string>)[name]||"•"}</span>;
