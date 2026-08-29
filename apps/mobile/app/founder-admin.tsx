import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { Screen } from '../src/components/Screen';
import { Pill, ScreenTitle, SupportText, ui } from '../src/components/ui';
import { createStudentDiscount, getFounderOverview, listFeatureFlags, listFounderWorkspaces, updateFeatureFlag } from '../src/lib/founder';
import { createBetaInvite, getFounderBetaOverview, listBetaFeedback, listBetaInvites, revokeBetaInvite, revokeBetaTester, type BetaOverview } from '../src/lib/beta';

export default function FounderAdminScreen() {
  const [overview, setOverview] = useState<any>(null);
  const [beta, setBeta] = useState<BetaOverview | null>(null);
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [flags, setFlags] = useState<any[]>([]);
  const [invites, setInvites] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<any[]>([]);
  const [email, setEmail] = useState('');
  const [inviteLabel, setInviteLabel] = useState('');
  const [inviteRegion, setInviteRegion] = useState('');
  const [inviteCohort, setInviteCohort] = useState<'student'|'outside'|'partner'|'angels_beauty'>('outside');
  const [lastToken, setLastToken] = useState<string | null>(null);
  const [lastBetaToken, setLastBetaToken] = useState<string | null>(null);
  useEffect(() => { void load(); }, []);
  async function load() {
    try {
      const [o,b,w,f,i,fb] = await Promise.all([getFounderOverview(), getFounderBetaOverview(), listFounderWorkspaces(), listFeatureFlags(), listBetaInvites(), listBetaFeedback()]);
      setOverview(o); setBeta(b); setWorkspaces(w); setFlags(f); setInvites(i); setFeedback(fb);
    } catch (error) { Alert.alert('Founder Admin unavailable', error instanceof Error ? error.message : 'Unknown error'); }
  }
  async function toggleFlag(flag:any, enabled:boolean) { try { await updateFeatureFlag(flag.key,{ enabled, stage: enabled && ['off','paused'].includes(flag.stage) ? 'beta' : flag.stage }); await load(); } catch (error) { Alert.alert('Could not update feature', error instanceof Error ? error.message : 'Unknown error'); } }
  async function makeStudentDiscount() { try { const created=await createStudentDiscount({emailHint:email.trim()||undefined,discountPercent:20}); setLastToken(created.token); setEmail(''); } catch(error){Alert.alert('Could not create student discount',error instanceof Error?error.message:'Unknown error');} }
  async function makeBetaInvite() { try { const created=await createBetaInvite({ emailHint: email.trim() || undefined, cohort:inviteCohort, label: inviteLabel.trim() || undefined, region: inviteRegion.trim() || undefined, expiresInDays: 60 }); setLastBetaToken(created.token); setInviteLabel(''); setInviteRegion(''); setEmail(''); await load(); } catch(error){Alert.alert('Could not create beta invite',error instanceof Error?error.message:'Unknown error');} }
  async function revokeInvite(id:string){ try{ await revokeBetaInvite(id); await load(); }catch(error){Alert.alert('Could not revoke invite',error instanceof Error?error.message:'Unknown error');} }
  async function revokeTester(userId:string){ Alert.alert('Revoke beta access?','The tester workspace will become read-only. Their data will not be deleted.',[{text:'Keep access',style:'cancel'},{text:'Revoke access',style:'destructive',onPress:()=>void (async()=>{try{await revokeBetaTester(userId);await load();}catch(error){Alert.alert('Could not revoke beta access',error instanceof Error?error.message:'Unknown error');}})()}]); }

  return <Screen><View style={styles.stack}>
    <Pill tone="gold">Founder Only</Pill>
    <ScreenTitle>Founder Control Center</ScreenTitle>
    <SupportText>Platform health, beta access and rollouts only. Subscriber client records, conversations and private business content are never exposed here.</SupportText>

    <View style={[styles.card,styles.premium]}><View style={styles.headerRow}><View style={styles.headerCopy}><Text style={styles.section}>Platform overview</Text><Text style={styles.subtle}>A privacy-safe operating view across AngelOS.</Text></View><Pill tone="success">Controlled</Pill></View>

    <View style={styles.grid}><Stat label="Workspaces" value={overview?.counts?.workspaces ?? '—'}/><Stat label="Trialing" value={overview?.counts?.trialing ?? '—'}/><Stat label="Paid" value={overview?.counts?.active ?? '—'}/><Stat label="Read only" value={overview?.counts?.readOnly ?? '—'}/></View></View>

    <View style={styles.card}>
      <Pill tone="gold">Release Gate</Pill><Text style={styles.section}>Invite-only beta</Text>
      <Text style={styles.big}>{beta?.readiness ? humanize(beta.readiness) : '—'}</Text>
      <Text style={styles.subtle}>Public launch is never automatic. Even when every gate passes, Founder approval is still required.</Text>
      <View style={styles.grid}><Stat label="Approved testers" value={beta?.counts.approvedTesters ?? 0}/><Stat label="Outside businesses" value={beta?.counts.outsideBusinesses ?? 0}/><Stat label="Outside active · 30d" value={beta?.counts.activeOutside30d ?? 0}/><Stat label="Reviews allowed" value={beta?.counts.testimonialCandidates ?? 0}/></View>
      {beta?.criteria.map((item)=><View key={item.key} style={styles.row}><Text style={{flex:1}}>{item.pass?'✓':'○'} {item.label}</Text><Text>{item.current ?? '—'} / {item.target}</Text></View>)}
    </View>

    <View style={styles.card}>
      <Text style={styles.section}>Approve a beta business</Text>
      <Text style={styles.subtle}>Create one private invite. The invite expires in 60 days if unused. Approved outside businesses receive an extended 60-day beta test window; student beta testers receive 30 days.</Text>
      <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Approved email (recommended)" autoCapitalize="none"/>
      <TextInput style={styles.input} value={inviteLabel} onChangeText={setInviteLabel} placeholder="Business / tester label"/>
      <TextInput style={styles.input} value={inviteRegion} onChangeText={setInviteRegion} placeholder="Region, e.g. Manila or Tokyo"/>
      <View style={styles.row}>{(['outside','student','partner','angels_beauty'] as const).map((value)=><Pressable key={value} onPress={()=>setInviteCohort(value)} style={[styles.cohort,inviteCohort===value&&styles.selected]}><Text>{humanize(value)}</Text></Pressable>)}</View>
      <Pressable style={styles.button} onPress={()=>void makeBetaInvite()}><Text style={styles.buttonText}>Create beta invite</Text></Pressable>
      {lastBetaToken ? <View style={styles.token}><Text style={styles.bold}>Share this beta token once:</Text><Text selectable>{lastBetaToken}</Text></View>:null}
      {invites.slice(0,8).map((invite)=><View key={invite.id} style={styles.item}><View style={{flex:1}}><Text style={styles.bold}>{invite.label || invite.email_hint || 'Approved beta tester'}</Text><Text style={styles.subtle}>{invite.cohort} · {invite.region || 'region not set'} · {invite.redeemed_at?'redeemed':invite.revoked_at?'revoked':'unused'}</Text></View>{!invite.redeemed_at&&!invite.revoked_at?<Pressable onPress={()=>void revokeInvite(invite.id)}><Text style={styles.danger}>Revoke invite</Text></Pressable>:invite.redeemed_by?<Pressable onPress={()=>void revokeTester(invite.redeemed_by)}><Text style={styles.danger}>Revoke access</Text></Pressable>:null}</View>)}
    </View>

    <View style={styles.card}><Text style={styles.section}>Private beta feedback</Text><Text style={styles.subtle}>{feedback.length} recent feedback item{feedback.length===1?'':'s'}. Quote permission is separate from ordinary feedback.</Text>{feedback.slice(0,6).map((item)=><View key={item.id} style={styles.item}><View style={{flex:1}}><Text style={styles.bold}>{humanize(item.category)} · {item.rating ? `${item.rating}/5` : 'no rating'}</Text><Text numberOfLines={3}>{item.message}</Text><Text style={styles.subtle}>{item.permission_to_quote?'Public quote allowed':'Private only'} · {item.status}</Text></View></View>)}</View>

    <View style={styles.card}><Text style={styles.section}>Usage · last 30 days</Text><Text>{overview?.usage30d?.activeWorkspaces ?? 0} active workspaces · {overview?.usage30d?.events ?? 0} privacy-safe usage events</Text>{overview?.usage30d?.topScreens?.slice(0,5).map((row:any)=><View style={styles.row} key={row.screen}><Text style={{flex:1}}>{row.screen}</Text><Text>{row.views} views</Text></View>)}</View>
    <View style={[styles.card,styles.premium]}><Pill tone="warning">Approval Required</Pill><Text style={styles.section}>Platform feature controls</Text><Text style={styles.subtle}>A rollout never becomes public automatically. Every stage remains Founder-controlled and reversible.</Text>{flags.map((flag)=><View key={flag.key} style={styles.flag}><View style={{flex:1}}><Text style={styles.bold}>{flag.name}</Text><Text style={styles.subtle}>{flag.description} · {flag.stage}</Text></View><Switch value={flag.enabled && !['off','paused'].includes(flag.stage)} trackColor={{false:ui.colors.border,true:ui.colors.softGold}} thumbColor={flag.enabled?ui.colors.gold:ui.colors.secondaryText} onValueChange={(value)=>void toggleFlag(flag,value)}/></View>)}</View>
    <View style={styles.card}><Text style={styles.section}>Student discount</Text><Text style={styles.subtle}>Create a one-time private 20% token for a verified Angels Beauty student/alumnus.</Text><TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Student email (optional)" autoCapitalize="none"/><Pressable style={styles.button} onPress={()=>void makeStudentDiscount()}><Text style={styles.buttonText}>Create private discount token</Text></Pressable>{lastToken ? <View style={styles.token}><Text style={styles.bold}>Share this token once:</Text><Text selectable>{lastToken}</Text></View> : null}</View>
    <View style={styles.card}><Text style={styles.section}>Recent workspaces</Text>{workspaces.slice(0,10).map((workspace)=><View key={workspace.id} style={styles.item}><Text style={styles.bold}>{workspace.name}</Text><Text style={styles.subtle}>{workspace.subscription?.status ?? 'unknown'} · {workspace.attentionCount} open attention item{workspace.attentionCount===1?'':'s'}</Text></View>)}</View>
    <View style={styles.card}><Pill tone="critical">Safety Boundary</Pill><Text style={styles.section}>What Founder Admin never exposes</Text><Text style={styles.subtle}>Private client details, treatment notes, subscriber messages, financial records and workspace content remain isolated. Emergency pause and audit evidence stay in the dedicated Safety Center.</Text></View>
  </View></Screen>;
}
function Stat({label,value}:{label:string;value:string|number}) { return <View style={styles.stat}><Text style={styles.statValue}>{value}</Text><Text style={styles.subtle}>{label}</Text></View>; }
function humanize(value:string){return value.replaceAll('_',' ').replace(/\b\w/g,(c)=>c.toUpperCase());}
const styles=StyleSheet.create({stack:{gap:ui.spacing.md},subtle:{color:ui.colors.secondaryText,fontSize:14,lineHeight:20},headerRow:{flexDirection:'row',alignItems:'flex-start',justifyContent:'space-between',gap:ui.spacing.sm},headerCopy:{flex:1,gap:2},grid:{flexDirection:'row',flexWrap:'wrap',gap:ui.spacing.xs},stat:{width:'48%',borderWidth:1,borderColor:ui.colors.border,borderRadius:ui.radius.control,padding:ui.spacing.sm,backgroundColor:ui.colors.elevated},statValue:{color:ui.colors.primaryText,fontSize:24,fontWeight:'700'},big:{color:ui.colors.primaryText,fontSize:24,fontWeight:'700'},card:{borderWidth:1,borderColor:ui.colors.border,borderRadius:ui.radius.card,padding:ui.spacing.sm,gap:ui.spacing.xs,backgroundColor:ui.colors.elevated},premium:{backgroundColor:ui.colors.warmSurface,borderColor:ui.colors.softGold},section:{color:ui.colors.primaryText,fontSize:18,fontWeight:'700'},row:{flexDirection:'row',flexWrap:'wrap',gap:ui.spacing.xs,alignItems:'center'},flag:{flexDirection:'row',gap:ui.spacing.sm,alignItems:'center',paddingVertical:ui.spacing.sm,borderTopWidth:1,borderTopColor:ui.colors.border},bold:{color:ui.colors.primaryText,fontWeight:'700'},input:{minHeight:50,borderWidth:1,borderColor:ui.colors.border,borderRadius:ui.radius.control,paddingHorizontal:ui.spacing.sm,color:ui.colors.primaryText,backgroundColor:ui.colors.elevated,fontSize:15},button:{minHeight:50,justifyContent:'center',backgroundColor:ui.colors.gold,padding:ui.spacing.sm,borderRadius:ui.radius.control,alignItems:'center'},buttonText:{color:ui.colors.primaryText,fontWeight:'700'},token:{borderWidth:1,borderColor:ui.colors.softGold,borderRadius:ui.radius.control,padding:ui.spacing.sm,gap:4,backgroundColor:ui.colors.warmSurface},item:{paddingVertical:ui.spacing.xs,borderTopWidth:1,borderTopColor:ui.colors.border,flexDirection:'row',gap:ui.spacing.sm},danger:{color:ui.colors.critical,fontWeight:'700'},cohort:{borderWidth:1,borderColor:ui.colors.border,borderRadius:ui.radius.control,paddingHorizontal:ui.spacing.sm,paddingVertical:ui.spacing.xs,backgroundColor:ui.colors.elevated},selected:{borderColor:ui.colors.gold,backgroundColor:ui.colors.softGold}});
