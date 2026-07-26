தாய் தந்தை மளிகை கடை — Firebase Online Version

இந்தப் பதிப்பில்:
- Firestore-இலிருந்து பொருட்கள் LIVE ஆக வரும்.
- Admin விலை மாற்றினால் எல்லா வாடிக்கையாளர்களுக்கும் உடனே மாறும்.
- வாடிக்கையாளர் Orders Firestore-ல் சேமிக்கப்படும்.
- Admin Dashboard-ல் Orders மற்றும் status பார்க்கலாம்.
- Firebase Authentication Email/Password மூலம் Admin பாதுகாப்பு.

முதலில் Firebase Console-ல் செய்ய வேண்டியது

1) Authentication அமைக்க:
   Build > Authentication > Get started
   Sign-in method > Email/Password > Enable > Save

2) Admin user உருவாக்க:
   Authentication > Users > Add user
   Email: manivannan7402@gmail.com
   வலுவான புதிய Password ஒன்றை அமைக்கவும்.
   Password-ஐ யாரிடமும் பகிர வேண்டாம்.

3) Firestore Rules:
   Build > Firestore Database > Rules
   இந்த ZIP-ல் உள்ள firestore.rules கோப்பின் முழு உள்ளடக்கத்தையும் copy செய்து
   Rules editor-ல் paste செய்யவும்.
   பிறகு Publish அழுத்தவும்.

4) Netlify:
   இந்த folder-ஐ முழுவதும் Netlify Deploys பகுதியில் upload செய்யவும்.
   index.html நேரடியாக இந்த folder-க்குள் இருக்க வேண்டும்.

5) Admin பயன்பாடு:
   உங்கள் website URL-க்கு /admin.html சேர்த்து திறக்கவும்.
   உதாரணம்:
   https://your-site.netlify.app/admin.html

   Firebase Authentication-ல் உருவாக்கிய Email மற்றும் Password மூலம் login செய்யவும்.
   முதலில் "மாதிரி பொருட்களை ஒருமுறை சேர்க்க" அழுத்தவும்.
   WhatsApp எண்ணை 91 உடன் உள்ளிட்டு சேமிக்கவும்.

பாதுகாப்பு:
- Firebase apiKey ஒரு password அல்ல. Web app config-ல் இருப்பது சாதாரணம்.
- உண்மையான பாதுகாப்பை Firestore Rules மற்றும் Firebase Authentication தருகின்றன.
- firestore.rules Publish செய்யாமல் வணிகப் பயன்பாட்டைத் தொடங்க வேண்டாம்.
- Test mode rules-ஐ தொடர்ந்து பயன்படுத்த வேண்டாம்.
