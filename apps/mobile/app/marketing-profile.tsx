import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Screen } from '../src/components/Screen';
import { Card, Pill, PrimaryActionLabel, ScreenTitle, SectionTitle, SupportText, ui } from '../src/components/ui';
import { getMarketingProfile, updateMarketingProfile } from '../src/lib/analytics';
import { getActiveWorkspace } from '../src/lib/workspace';
const goals=['bookings','inquiries','profile_visits','saves','reach'] as const; const levels=['beginner','intermediate','advanced'] as const;
export default function MarketingProfileScreen(){
  const[workspaceId,setWorkspaceId]=useState<string|null>(null);const[goal,setGoal]=useState('bookings');const[level,setLevel]=useState('beginner');const[targetClient,setTargetClient]=useState('');const[serviceArea,setServiceArea]=useState('');const[city,setCity]=useState('');const[country,setCountry]=useState('');const[saving,setSaving]=useState(false);
  useEffect(()=>{void load();},[]);async function load(){try{const workspace=await getActiveWorkspace();setWorkspaceId(workspace.id);const profile=await getMarketingProfile(workspace.id);setGoal(profile.primary_goal??'bookings');setLevel(profile.experience_level??'beginner');setTargetClient(profile.target_client??'');setServiceArea(profile.service_area??'');setCity(profile.city??'');setCountry(profile.country??'');}catch(error){Alert.alert('Could not load marketing profile',error instanceof Error?error.message:'Unknown error');}}
  async function save(){if(!workspaceId)return;setSaving(true);try{await updateMarketingProfile(workspaceId,{primaryGoal:goal,experienceLevel:level,targetClient,serviceArea,city,country,localContextEnabled:true});Alert.alert('Saved','AngelOS will use this context to make marketing guidance more relevant.');}catch(error){Alert.alert('Could not save',error instanceof Error?error.message:'Unknown error');}finally{setSaving(false);}}
  return <Screen>
    <Pill tone="gold">Growth Context</Pill><ScreenTitle>Marketing Profile</ScreenTitle><SupportText>Tell AngelOS what growth means for this business. It can learn the details over time.</SupportText>
    <Card><SectionTitle>Primary goal</SectionTitle><View style={styles.wrap}>{goals.map((item)=><Pressable key={item} onPress={()=>setGoal(item)}><Pill tone={goal===item?'gold':'secondary'}>{item.replaceAll('_',' ')}</Pill></Pressable>)}</View></Card>
    <Card><SectionTitle>Experience level</SectionTitle><View style={styles.wrap}>{levels.map((item)=><Pressable key={item} onPress={()=>setLevel(item)}><Pill tone={level===item?'gold':'secondary'}>{item}</Pill></Pressable>)}</View></Card>
    <Card><SectionTitle>Who and where</SectionTitle><Field label="Ideal client" value={targetClient} onChangeText={setTargetClient} placeholder="Example: local women who want natural brows"/><Field label="Service area" value={serviceArea} onChangeText={setServiceArea} placeholder="Example: Okinawa / within 30 minutes"/><Field label="City" value={city} onChangeText={setCity} placeholder="City"/><Field label="Country" value={country} onChangeText={setCountry} placeholder="Country"/></Card>
    <Pressable disabled={saving} onPress={()=>void save()}><PrimaryActionLabel>{saving?'Saving...':'Save Marketing Profile'}</PrimaryActionLabel></Pressable>
    <Card premium><SectionTitle>Honest local guidance</SectionTitle><SupportText>This profile localizes strategy and timing. Live events and trends remain unavailable until a current-data research provider is connected.</SupportText></Card>
  </Screen>;
}
function Field({label,...props}:{label:string;value:string;onChangeText:(value:string)=>void;placeholder:string}){return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput {...props} placeholderTextColor={ui.colors.secondaryText} style={styles.input}/></View>}
const styles=StyleSheet.create({wrap:{flexDirection:'row',flexWrap:'wrap',gap:ui.spacing.xs},field:{gap:ui.spacing.xs},label:{color:ui.colors.secondaryText,fontSize:13,fontWeight:'700'},input:{borderWidth:1,borderColor:ui.colors.border,borderRadius:ui.radius.control,backgroundColor:ui.colors.elevated,color:ui.colors.primaryText,padding:ui.spacing.sm,fontSize:16}});
