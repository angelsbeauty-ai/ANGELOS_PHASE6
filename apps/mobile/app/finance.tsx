import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../src/components/Screen';
import { BodyText, Card, Pill, ScreenTitle, SecondaryActionLabel, SectionTitle, SupportText, ui } from '../src/components/ui';
import { getFinanceOverview, type FinanceOverview } from '../src/lib/finance';
import { getActiveWorkspace } from '../src/lib/workspace';

export default function FinanceScreen(){
  const[overview,setOverview]=useState<FinanceOverview|null>(null);const[busy,setBusy]=useState(true);
  useEffect(()=>{void load();},[]);async function load(){setBusy(true);try{const workspace=await getActiveWorkspace();setOverview(await getFinanceOverview(workspace.id,30));}catch(error){Alert.alert('Could not load finance',error instanceof Error?error.message:'Unknown error');}finally{setBusy(false);}}
  const currency=overview?.entries[0]?.currency??'JPY';const methods=overview?Object.entries(overview.byMethod):[];
  return <Screen>
    <View style={styles.header}><View style={styles.headerCopy}><Pill tone="gold">Last 30 Days</Pill><ScreenTitle>Finance</ScreenTitle><SupportText>Actual money received—never inflated by booked value.</SupportText></View><Pressable onPress={()=>void load()} style={styles.refresh}><SecondaryActionLabel>Refresh</SecondaryActionLabel></Pressable></View>
    <Card premium><SupportText>Actual income</SupportText><Text style={styles.amount}>{overview?formatMoney(overview.actualIncome,currency):'—'}</Text><BodyText>Deposits, completed payments, discounts, refunds and corrections belong in the real ledger.</BodyText></Card>
    {busy?<Card><BodyText>Loading finance...</BodyText></Card>:null}
    <Card><SectionTitle>By payment method</SectionTitle>{methods.length?methods.map(([method,value])=><View key={method} style={styles.row}><View style={styles.rowCopy}><Text style={styles.rowTitle}>{humanize(method)}</Text><SupportText>Received payments</SupportText></View><Text style={styles.rowAmount}>{formatMoney(value,currency)}</Text></View>):<SupportText>No received payments recorded yet.</SupportText>}</Card>
    <Card><SectionTitle>Recent ledger</SectionTitle>{overview?.entries.slice(0,10).map((entry)=><View key={entry.id} style={styles.row}><View style={styles.rowCopy}><Text style={styles.rowTitle}>{humanize(entry.entry_type)}</Text><SupportText>{entry.method?humanize(entry.method):'Method not recorded'} | {new Date(entry.occurred_at).toLocaleDateString()}</SupportText></View><Text style={[styles.rowAmount,Number(entry.amount)<0&&{color:ui.colors.critical}]}>{formatMoney(Number(entry.amount),entry.currency)}</Text></View>)}{!overview?.entries.length?<SupportText>The ledger is empty.</SupportText>:null}</Card>
    <Card premium><Pill tone="warning">Owner confirmation required</Pill><SectionTitle>Outstanding balances</SectionTitle><BodyText>AngelOS never contacts a client only because a calculated balance exists. You confirm whether money was actually received before any reminder is prepared or sent.</BodyText></Card>
    <Card><SectionTitle>Correction history</SectionTitle><SupportText>Refunds, discounts and corrections stay visible as ledger entries instead of silently rewriting the original record.</SupportText></Card>
  </Screen>;
}
function formatMoney(value:number,currency:string){try{return new Intl.NumberFormat(undefined,{style:'currency',currency}).format(value)}catch{return `${currency} ${value.toFixed(2)}`}}function humanize(value:string){return value.replaceAll('_',' ').replace(/\b\w/g,(c)=>c.toUpperCase())}
const styles=StyleSheet.create({header:{flexDirection:'row',alignItems:'flex-start',gap:ui.spacing.sm},headerCopy:{flex:1,gap:ui.spacing.xs},refresh:{width:104},amount:{color:ui.colors.primaryText,fontSize:32,fontWeight:'700'},row:{minHeight:58,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:ui.spacing.sm,paddingVertical:ui.spacing.xs,borderBottomWidth:1,borderBottomColor:ui.colors.border},rowCopy:{flex:1,gap:2},rowTitle:{color:ui.colors.primaryText,fontSize:16,fontWeight:'700'},rowAmount:{color:ui.colors.primaryText,fontSize:16,fontWeight:'700'}});
