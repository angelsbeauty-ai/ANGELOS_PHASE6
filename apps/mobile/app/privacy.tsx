import { Screen } from '../src/components/Screen';
import { BodyText, Card, ScreenTitle, SectionTitle, SupportText } from '../src/components/ui';

export default function PrivacyScreen() {
  return (
    <Screen>
      <ScreenTitle>Privacy Policy</ScreenTitle>
      <SupportText>AngelOS by Angel's Beauty. Last updated 2 October 2026. This is the in-app copy students and Apple reviewers see.</SupportText>
      <Card>
        <SectionTitle>What we collect</SectionTitle>
        <BodyText>Account email, workspace name, and the business or class records you type in. If you connect LINE, Instagram, or Facebook later, we store the messages needed to show your inbox. If you allow photos, we store only the media you import.</BodyText>
      </Card>
      <Card>
        <SectionTitle>What we do not sell</SectionTitle>
        <BodyText>We do not sell student records, client lists, or messages. Student practice records stay in that student's private account. Your salon records stay in your workspace.</BodyText>
      </Card>
      <Card>
        <SectionTitle>AI</SectionTitle>
        <BodyText>When a real AI key is connected, message text is sent to that provider only to generate the reply you asked for. Until that key is connected, AngelOS does not invent a live AI reply.</BodyText>
      </Card>
      <Card>
        <SectionTitle>Delete</SectionTitle>
        <BodyText>Settings, then Delete my account. We delete the login and workspace data we control within 30 days, except records we must keep for tax or a legal request.</BodyText>
      </Card>
      <Card>
        <SectionTitle>Contact</SectionTitle>
        <BodyText>angelica.borac123@gmail.com</BodyText>
      </Card>
    </Screen>
  );
}
