export type Theme = 'light' | 'dark';
export const palette = {
 light:{bg:'#F5F6F8',surface:'#FFFFFF',surfaceAlt:'#F0EFF5',text:'#17171D',muted:'#6E7080',line:'#E9E8EF',purple:'#7653AD',purpleSoft:'#F0E9FA',gold:'#AD7B3A',goldSoft:'#FFF3DD',nav:'rgba(255,255,255,0.78)'},
 dark:{bg:'#101215',surface:'#1B1E24',surfaceAlt:'#272934',text:'#F7F5FB',muted:'#B1ABBD',line:'#35313D',purple:'#C3A7F5',purpleSoft:'#392B4C',gold:'#EBC587',goldSoft:'#4B3825',nav:'rgba(28,29,36,0.78)'}
};
export type Colors = typeof palette.light;
export const radius={card:24,small:16,pill:99};
