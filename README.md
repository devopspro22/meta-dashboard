# 📊 Meta Ads Dashboard

דשבורד מקצועי לניטור ביצועי קמפיינים ב-Meta Ads (Facebook / Instagram).

מציג: הוצאות · לידים · ROAS · CTR · CPM · CPL · גרף יומי  
מתעדכן אוטומטית כל 15 דקות.

---

## 🚀 Deploy בלחיצה אחת

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/fb-dashboard&env=REACT_APP_META_TOKEN&envDescription=Meta%20Access%20Token%20from%20Graph%20API%20Explorer)

---

## 📋 הוראות Fork + Deploy

### שלב 1 — Fork
לחץ על `Fork` בפינה הימנית העליונה של הרפו.

### שלב 2 — קבל Meta Access Token
1. כנס ל-[Graph API Explorer](https://developers.facebook.com/tools/explorer/)
2. בחר את ה-App שלך
3. הוסף הרשאות: `ads_read` + `ads_management`
4. לחץ `Generate Access Token`
5. העתק את ה-Token

### שלב 3 — Deploy ל-Vercel
1. כנס ל-[vercel.com](https://vercel.com) וחבר את ה-GitHub שלך
2. בחר את ה-Fork שלך
3. בהגדרות `Environment Variables` הוסף:
   - **Key:** `REACT_APP_META_TOKEN`
   - **Value:** הטוקן שהעתקת
4. לחץ `Deploy`

### שלב 4 — גמור! ✅
הדשבורד שלך זמין בכתובת שסיפקה Vercel.

---

## 🛠️ הרצה מקומית

```bash
git clone https://github.com/YOUR_USERNAME/fb-dashboard
cd fb-dashboard
npm install
cp .env.example .env.local
# ערוך .env.local והוסף את הטוקן שלך
npm start
```

---

## 📊 מדדים מוצגים

| מדד | תיאור |
|---|---|
| **Spend** | סך הוצאות בתקופה הנבחרת |
| **Leads** | מספר לידים (Lead Gen campaigns) |
| **CPL** | עלות לליד |
| **ROAS** | החזר על ההשקעה |
| **CTR** | אחוז הקלקות |
| **CPM** | עלות ל-1000 חשיפות |
| **Reach** | טווח הגעה |

---

## ⚙️ הגדרות

| משתנה | תיאור |
|---|---|
| `REACT_APP_META_TOKEN` | Meta Access Token (חובה אם לא נכנסים ידנית) |

---

Built with React · Meta Graph API v19.0
