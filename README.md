# Matarot — דשבורד קמפיינים פייסבוק

ממשק ווב לניהול ומעקב אחרי קמפיינים של Meta Ads (Facebook/Instagram) בזמן אמת.

## תכונות

- 🔐 התחברות עם Meta Access Token (לא נשמר בשרת)
- 📊 סטטיסטיקות מרכזיות: הוצאות, חשיפות, קליקים
- 🔎 חיפוש וסינון קמפיינים לפי שם וסטטוס
- 📈 ויזואליזציה של הוצאות יחסיות
- 🔄 רענון נתונים בזמן אמת

## התקנה מהירה

```bash
npm install
npm start
```

## העלאה ל-GitHub + Vercel

1. **GitHub:**
```bash
git init
git add .
git commit -m "first commit"
gh repo create matarot-fb-dashboard --public --push
```

2. **Vercel:**
```bash
npx vercel --prod
```
   או: Import ב-[vercel.com/new](https://vercel.com/new)

## קבלת Access Token

1. עבור ל-[Graph API Explorer](https://developers.facebook.com/tools/explorer/)
2. בחר את האפליקציה שלך (או צור חדשה)
3. הוסף הרשאות: `ads_read` + `ads_management`
4. לחץ **Generate Access Token**

## טכנולוגיות

- React 18
- Meta Graph API v19.0
- CSS순수 (ללא תלויות UI)
