import { useLocalBack } from '../components/NavigationBack';
import { Check, Settings2 } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, Switch, View } from 'react-native';
import { Card, Section, T } from '../components/UI';
import { useApp } from '../context/AppContext';
import { featureLabels, previewTier, refreshAccount, tiers, unsubscribe, updatePlan, type Feature, type Tier } from '../services/account';

const labels: Record<Tier, string> = { free: 'Free', plus: 'Plus', pro: 'Pro' };
const storeUrls = {
  ios: 'https://apps.apple.com/account/subscriptions',
  android: 'https://play.google.com/store/account/subscriptions',
};

export function SubscriptionDetails() {
  const { account, setAccount, colors } = useApp();
  const [editingTier, setEditingTier] = useState<Tier | null>(null);
  const [chosen, setChosen] = useState<Feature[]>([]);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState('');
  useLocalBack(Boolean(editingTier) || confirm, () => {
    if (busy) return;
    setEditingTier(null);
    setConfirm(false);
    setError('');
  });
  useEffect(() => {
    let active = true;
    void refreshAccount().then((result) => { if (active) setAccount(result); }).catch(() => {
      if (active) setError('Could not refresh subscription details.');
    });
    return () => { active = false; };
  }, [setAccount]);

  const update = async (action: () => Promise<void>) => {
    setBusy(true);
    setError('');
    try { await action(); }
    catch (failure) { setError(failure instanceof Error ? failure.message : 'Could not change this subscription.'); }
    finally { setBusy(false); }
  };

  const subscription = account?.subscription;
  const platform = subscription?.platform;
  const store = platform === 'ios' || platform === 'android' ? platform : null;
  const hasPaidPlan = !!subscription && subscription.tier !== 'free';
  const ownerPreview = account?.tier === 'owner';
  if (editingTier) return <View style={styles.list}>
    <Section>{`Features for ${labels[editingTier]}`}</Section>
    <Card style={styles.card}>
      {(Object.keys(featureLabels) as Feature[]).map((feature) => <View key={feature} style={styles.row}>
        <T size={14}>{featureLabels[feature]}</T>
        <Switch accessibilityLabel={featureLabels[feature]} value={chosen.includes(feature)} disabled={busy}
          onValueChange={(enabled) => setChosen((current) => enabled ? [...current, feature] : current.filter((item) => item !== feature))} />
      </View>)}
    </Card>
    <Card style={styles.card} onPress={busy ? undefined : () => update(async () => {
      setAccount(await updatePlan(editingTier, chosen));
      setEditingTier(null);
    })}><T bold>{busy ? 'Saving?' : 'Save features'}</T></Card>
    <Card style={styles.card} onPress={busy ? undefined : () => { setEditingTier(null); setError(''); }}><T>Cancel</T></Card>
    {!!error && <T size={13}>{error}</T>}
  </View>;

  return <View style={styles.list}>
    <Card style={styles.card}>
      <T bold size={23}>{ownerPreview ? 'Owner access' : labels[account?.tier === 'owner' ? 'free' : account?.tier ?? 'free']}</T>
      <T muted size={14}>{ownerPreview ? 'All features unlocked.' : (account?.features ?? []).map((feature) => featureLabels[feature]).join(' ? ') || 'Core app features'}</T>
      {!!subscription && <T muted size={12}>Account plan ? {labels[subscription.tier]} ? {subscription.status.replaceAll('_', ' ')}</T>}
      {!!subscription?.expiresAt && <T muted size={12}>Access through {new Date(subscription.expiresAt).toLocaleDateString()}</T>}
    </Card>
    {account?.isOwner && <>
      <Section>Preview access</Section>
      {([null, ...tiers] as const).map((tier) => {
        const label = tier ? labels[tier] : 'Owner access';
        return <Card key={tier ?? 'owner'} style={styles.card}>
          <View style={styles.row}>
            <Pressable accessibilityRole="button" disabled={busy} style={styles.preview}
              onPress={() => update(async () => setAccount(await previewTier(tier)))}>
              <T bold>{label}</T>
              {(account.previewTier ?? null) === tier && <Check size={16} color={colors.purple} />}
            </Pressable>
            {tier && <Pressable accessibilityRole="button" accessibilityLabel={`Edit ${label} features`} disabled={busy || !account.plans} style={[styles.gear, { backgroundColor: colors.purpleSoft }]}
              onPress={() => { setError(''); setChosen(account.plans?.[tier] ?? []); setEditingTier(tier); }}>
              <Settings2 size={18} color={colors.purple} />
            </Pressable>}
          </View>
        </Card>;
      })}
    </>}
    {hasPaidPlan && store && <Card style={styles.card} onPress={busy ? undefined : () => update(() => Linking.openURL(storeUrls[store]))}>
      <T bold>Manage or cancel subscription</T>
      <T muted size={13}>{store === 'ios' ? 'Opens App Store subscriptions' : 'Opens Google Play subscriptions'}</T>
    </Card>}
    {hasPaidPlan && !store && !confirm && <Card style={styles.card} onPress={busy ? undefined : () => setConfirm(true)}><T bold>Unsubscribe</T></Card>}
    {hasPaidPlan && !store && confirm && <>
      <T muted size={14}>Cancel your current plan and return to Free?</T>
      <Card style={styles.card} onPress={busy ? undefined : () => update(async () => { setAccount(await unsubscribe()); setConfirm(false); })}><T bold>Confirm unsubscribe</T></Card>
      <Card style={styles.card} onPress={busy ? undefined : () => setConfirm(false)}><T>Keep subscription</T></Card>
    </>}
    {!!error && <T size={13}>{error}</T>}
  </View>;
}

const styles = StyleSheet.create({
  list: { gap: 10, marginTop: 15 },
  card: { padding: 16, gap: 7 },
  row: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  preview: { flex: 1, minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8 },
  gear: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
