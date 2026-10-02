# AngelOS store page and student-launch closeout

Draft for App Store Connect. Do not submit until items marked blocked are done.

## Listing

- Name: AngelOS
- Subtitle: Studio OS for owners and students
- Bundle id already in app.json: com.angelos.app
- Category: Business
- Price: free download, subscription later through Apple. Do not turn on paid until IAP is set.

Promotional text
Run the studio day. Invite students into their own private space.

Description
AngelOS is the operating app for Angel's Beauty. Owners keep bookings, content, and messages in one workspace. Students join only by an invite you send, with their own login.

What you can do
- Sign in to your owner workspace
- Invite a student or tester and revoke that invite
- Review drafts before anything is sent
- Read the privacy policy, terms, and request account deletion inside the app

AngelOS does not post or message a client unless you approve that step.

Keywords
beauty studio, salon, bookings, students, academy, content calendar

Support URL: mailto:angelica.borac123@gmail.com
Privacy URL: host the in-app Privacy screen text at a public page before review. Apple will not accept an in-app-only policy.

## Closeout

1. Owner workspace: blocked on your live signup. Code path exists.
2. Student invites: built. Founder Control Center creates a cohort=student invite. Student redeems it and gets a private login. Not a shared class account.
3. Student class area: not built. Academy bot is still a phase-1 stub. Do not show classes until lessons exist.
4. Real AI replies: blocked on an AI provider key in the API env. Do not ship fake replies to students.
5. Privacy, terms, delete account: in the app under Settings as of 2 Oct 2026. Still host the privacy text on a public URL for App Store Connect.
6. Name and bundle id exist. Icon and screenshots still needed.
7. Subscriptions: demo checkout only. Do not touch Apple IAP until you ask.
8. Test build and review: blocked on an EAS iOS build after this commit.
9. Instagram, Facebook, LINE: doorway exists, live send is not connected. Inbox stays demo until tokens are added.
10. Keyboard shell: Screen now keeps the field above the iPhone keyboard. Full visual polish is not done.
