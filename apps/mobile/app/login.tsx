import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '../src/components/Screen';
import { BodyText, Card, Pill, PrimaryActionLabel, ScreenTitle, SecondaryActionLabel, SectionTitle, SupportText, ui } from '../src/components/ui';
import { supabase } from '../src/lib/supabase';
import { apiFetch } from '../src/lib/api';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const ready = Boolean(email.trim() && password);

  async function signIn() {
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) return Alert.alert('Sign in failed', error.message);
    try {
      const workspaces = await apiFetch<Array<{ id: string }>>('/workspaces');
      router.replace(workspaces.length ? '/' : '/onboarding');
    } catch { router.replace('/onboarding'); }
  }

  async function signUp() {
    setBusy(true);
    const { error } = await supabase.auth.signUp({ email: email.trim(), password });
    setBusy(false);
    if (error) return Alert.alert('Account could not be created', error.message);
    Alert.alert('Account created', 'Check your email if verification is enabled, then return here to sign in.');
  }

  return <Screen><View style={styles.stack}>
    <Pill tone="gold">Private Beta</Pill><ScreenTitle>Welcome to AngelOS</ScreenTitle><SupportText>Your calm business operating system. Sign in securely to continue to your private workspace.</SupportText>
    <Card premium><SectionTitle>Sign in</SectionTitle><View style={styles.field}><Text style={styles.label}>Email</Text><TextInput autoCapitalize="none" autoCorrect={false} keyboardType="email-address" value={email} onChangeText={setEmail} placeholder="you@example.com" placeholderTextColor={ui.colors.secondaryText} style={styles.input}/></View><View style={styles.field}><Text style={styles.label}>Password</Text><TextInput secureTextEntry autoCapitalize="none" value={password} onChangeText={setPassword} placeholder="Your password" placeholderTextColor={ui.colors.secondaryText} style={styles.input}/></View><Pressable disabled={busy || !ready} onPress={() => void signIn()} style={({pressed})=>[(busy||!ready||pressed)&&styles.muted]}><PrimaryActionLabel>{busy?'Working...':'Sign In'}</PrimaryActionLabel></Pressable></Card>
    <Card><SectionTitle>New beta tester?</SectionTitle><BodyText>Create your secure account first. Your founder-approved beta invite and business workspace come next.</BodyText><Pressable disabled={busy || !ready} onPress={() => void signUp()} style={({pressed})=>[(busy||!ready||pressed)&&styles.muted]}><SecondaryActionLabel>Create Account</SecondaryActionLabel></Pressable></Card>
    <Card><SectionTitle>Private by design</SectionTitle><SupportText>Your business workspace is isolated from other subscribers. AngelOS never exposes private client records inside Founder Admin.</SupportText></Card>
  </View></Screen>;
}

const styles=StyleSheet.create({stack:{gap:ui.spacing.md},field:{gap:ui.spacing.xs},label:{color:ui.colors.primaryText,fontSize:13,fontWeight:'700'},input:{minHeight:52,borderWidth:1,borderColor:ui.colors.border,borderRadius:ui.radius.control,paddingHorizontal:ui.spacing.sm,color:ui.colors.primaryText,backgroundColor:ui.colors.elevated,fontSize:16},muted:{opacity:.55}});
