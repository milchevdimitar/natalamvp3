import React,{createContext,useContext,useMemo,useState} from 'react';
import {useColorScheme} from 'react-native';
import {palette,Theme} from '../theme/tokens';
export type Page='home'|'explore'|'chat'|'people'|'profile';
type AppState={page:Page;setPage:(p:Page)=>void;themeMode:'system'|'light'|'dark';cycleTheme:()=>void;theme:Theme;colors:typeof palette.light};
const Context=createContext<AppState|null>(null);
export function AppProvider({children}:{children:React.ReactNode}){
 const system=useColorScheme(); const [themeMode,setThemeMode]=useState<'system'|'light'|'dark'>('system'); const [page,setPage]=useState<Page>('home');
 const theme:Theme=themeMode==='system'?(system==='dark'?'dark':'light'):themeMode;
 const value=useMemo(()=>({page,setPage,themeMode,cycleTheme:()=>setThemeMode(v=>v==='system'?'light':v==='light'?'dark':'system'),theme,colors:palette[theme]}),[page,themeMode,theme]);
 return <Context.Provider value={value}>{children}</Context.Provider>;
}
export const useApp=()=>{const x=useContext(Context);if(!x)throw Error('Missing AppProvider');return x;};
