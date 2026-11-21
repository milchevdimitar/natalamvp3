import React from 'react';
import {View,Text,Pressable,TextInput,StyleSheet,type TextProps,type StyleProp,type ViewStyle} from 'react-native';
import {Search,QrCode} from 'lucide-react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {useApp} from '../context/AppContext';
import { glassPanel, isCosmicPage, lightGlassPanel } from '../theme/cosmic';
export function T({children,size=15,bold=false,muted=false,style,numberOfLines}:{children:React.ReactNode;size?:number;bold?:boolean;muted?:boolean;style?:TextProps['style'];numberOfLines?:number}){const {colors}=useApp();return <Text numberOfLines={numberOfLines} style={[{fontSize:size,color:muted?colors.muted:colors.text,fontWeight:bold?'700':'400',lineHeight:size*1.36},style]}>{children}</Text>}
export function Card({ children, style, onPress, activeOpacity, treatment }: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  activeOpacity?: number;
  treatment?: 'muted';
}) {
  const { colors, page, theme } = useApp();
  const basePanel = theme === 'dark' ? glassPanel : lightGlassPanel;
  const panel = treatment === 'muted' ? {
    ...basePanel, border: 'rgba(166,172,187,0.23)',
    colors: (theme === 'dark' ? ['rgba(77,82,94,0.40)', 'rgba(49,52,62,0.50)'] : ['#e5e7ed', '#cfd3dd']) as readonly [string, string],
  } : basePanel;
  const cosmicCard = isCosmicPage(page);
  const base = [
    { backgroundColor: colors.surface, borderRadius: 24, padding: 18 },
    cosmicCard && { backgroundColor: panel.background, borderRadius: 28, borderColor: panel.border, borderWidth: 1, overflow: 'hidden' as const },
    style,
  ];
  const content = <>
    {cosmicCard && <LinearGradient pointerEvents="none" colors={panel.colors} start={panel.start} end={panel.end} style={StyleSheet.absoluteFill} />}
    {children}
  </>;
  return onPress
    ? <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [base, pressed && activeOpacity !== undefined && { opacity: activeOpacity }]}>{content}</Pressable>
    : <View style={base}>{content}</View>;
}
export function Brand({size=39}:{size?:number}){const {colors}=useApp();return <Text style={{fontFamily:'DancingScript_700Bold',fontSize:size,color:colors.text,lineHeight:size*1.3}}>Natala</Text>}
export function Hero({eyebrow,first,accent,description}:{eyebrow:string;first:string;accent:string;description:string}){
  const {colors,page,theme}=useApp();
  if (isCosmicPage(page)) return (
    <View style={{ paddingVertical: 14, marginBottom: 8, gap: 8 }}>
      <Text style={{ color: colors.muted, fontSize: 10, fontWeight: '800', letterSpacing: 1.1 }}>{eyebrow}</Text>
      <Text accessibilityRole="header" style={{ color: colors.text, fontSize: 29, lineHeight: 33, fontWeight: '800', letterSpacing: -1.25 }}>
        {first}{' '}<Text style={{ color: theme === 'dark' ? '#b7b4ff' : colors.purple }}>{accent}</Text>
      </Text>
      <T muted size={12} style={{ maxWidth: 370, lineHeight: 19 }}>{description}</T>
    </View>
  );
  return <View style={{paddingTop:10,paddingBottom:24,minHeight:185}}><T size={10} bold style={{letterSpacing:2,color:colors.purple,marginBottom:11}}>{eyebrow}</T><T size={37} bold style={{letterSpacing:-1.6,lineHeight:43}}>{first}</T><T size={37} bold style={{fontStyle:'italic',color:colors.purple,letterSpacing:-1.6,lineHeight:43}}>{accent}</T><T muted size={13} style={{marginTop:10,maxWidth:370}}>{description}</T></View>;
}
export function SearchBar({ value, onChange, placeholder, qr }: {
  value: string; onChange: (value: string) => void; placeholder: string; qr?: () => void;
}) {
  const { colors, page, theme } = useApp();
  const panel = theme === 'dark' ? glassPanel : lightGlassPanel;
  const surface = isCosmicPage(page)
    ? { borderWidth: 1, borderColor: panel.border, backgroundColor: theme === 'dark' ? 'rgba(29,48,99,0.52)' : panel.background }
    : { backgroundColor: colors.surface };
  return (
    <View style={{ flexDirection: 'row', gap: 9, alignItems: 'center', marginBottom: 24 }}>
      <View style={[{ height: 52, flex: 1, borderRadius: 16, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, gap: 11 }, surface]}>
        <Search size={19} color={colors.muted} />
        <TextInput accessibilityLabel={placeholder} value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={colors.muted} style={{ flex: 1, minWidth: 0, color: colors.text, fontSize: 14 }} />
      </View>
      {qr && <Pressable accessibilityLabel="Open QR scanner" onPress={qr} style={[{ width: 52, height: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 16 }, surface]}>
        <QrCode size={23} color={colors.purple} />
      </Pressable>}
    </View>
  );
}
export function Section({children,action,style}:{children:string;action?:React.ReactNode;style?:StyleProp<ViewStyle>}){
  const {page}=useApp();
  const themed=isCosmicPage(page);
  return <View style={[{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:themed?11:14,marginTop:10},style]}><T size={themed?17:22} bold style={{letterSpacing:themed?-.4:-.7,fontWeight:themed?'800':'700'}}>{children}</T>{action}</View>;
}
export function Pill({children,onPress,selected=false,disabled=false}:{children:React.ReactNode;onPress?:()=>void;selected?:boolean;disabled?:boolean}){const {colors}=useApp();return <Pressable accessibilityRole={onPress ? 'button' : undefined} accessibilityState={{disabled,selected}} disabled={disabled} onPress={onPress} style={{borderRadius:99,paddingVertical:10,paddingHorizontal:16,backgroundColor:selected?colors.purpleSoft:colors.surfaceAlt,alignSelf:'flex-start'}}><T bold size={12} style={{color:colors.purple}}>{children}</T></Pressable>}
export function Avatar({initial,size=50}:{initial:string;size?:number}){const {colors}=useApp();return <View style={{width:size,height:size,borderRadius:size/2,backgroundColor:colors.purpleSoft,alignItems:'center',justifyContent:'center'}}><T bold size={size*.35} style={{color:colors.purple}}>{initial}</T></View>}
export function Progress({value,color}:{value:number;color?:string}){const {colors}=useApp();return <View style={{height:9,backgroundColor:colors.surfaceAlt,borderRadius:99,overflow:'hidden'}}><View style={{width:`${value}%`,height:'100%',borderRadius:99,backgroundColor:color||colors.purple}}/></View>}
