import { Screen } from '../src/components/Screen';
import { BodyText, Card, ScreenTitle, SectionTitle, SupportText } from '../src/components/ui';

export default function TermsScreen() {
  return (
    <Screen>
      <ScreenTitle>Terms of Use</ScreenTitle>
      <SupportText>AngelOS by Angel's Beauty. Last updated 2 October 2026.</SupportText>
      <Card>
        <SectionTitle>Who it is for</SectionTitle>
        <BodyText>Owners use AngelOS to run a studio. Students join only with an invite you send. Each person gets their own login. A student does not see another student's practice records.</BodyText>
      </Card>
      <Card>
        <SectionTitle>Your content</SectionTitle>
        <BodyText>You own the photos, captions, class notes, and client records you add. You give AngelOS permission to store and show them inside your account so the app can work.</BodyText>
      </Card>
      <Card>
        <SectionTitle>Payments</SectionTitle>
        <BodyText>Paid plans, when live, are billed by Apple inside the app. Cancel in iPhone Settings, Subscriptions. A student discount code does not create a charge by itself.</BodyText>
      </Card>
      <Card>
        <SectionTitle>Not a guarantee</SectionTitle>
        <BodyText>AngelOS drafts and organizes. It does not post, message a client, or charge a card unless you approve that step. Beauty training advice in the app is education, not a medical diagnosis.</BodyText>
      </Card>
    </Screen>
  );
}
