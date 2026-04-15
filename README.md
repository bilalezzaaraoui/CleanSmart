# CleanSmart

Outil interne de traitement de leads immobiliers. L'utilisateur choisit un type d'agence, un agent, charge un fichier CSV, puis déclenche un workflow n8n qui prend en charge le reste.

## Fonctionnalités

- Sélection du type d'agence : **Mandataire** ou **Agence**
- Sélection de l'agent : **Bilal** ou **Younes**
- Upload d'un fichier **CSV de leads** avec validation du format
- Envoi du payload (métadonnées + contenu CSV) vers un **webhook n8n** en POST JSON
- Feedback temps réel : état de chargement, succès, erreur
- **Authentification** par login/mot de passe pour protéger l'accès à l'app
- Session persistée en `localStorage` (pas de re-login à chaque rechargement)

## Stack

| Outil | Rôle |
|---|---|
| **Vite** + **React 19** + **TypeScript** | Frontend |
| **Tailwind CSS v4** | Styles |
| **n8n** | Automatisation backend via webhook |
| **Vercel** | Hébergement & déploiement continu |

## Démarrage rapide

```bash
# 1. Installer les dépendances
npm install

# 2. Configurer les variables d'environnement
cp .env.example .env
# Éditez .env et renseignez votre URL n8n

# 3. Lancer le serveur de développement
npm run dev
# → http://localhost:5173
```

## Variables d'environnement

| Variable | Description |
|---|---|
| `VITE_N8N_WEBHOOK_URL` | URL complète du webhook n8n à appeler lors de la soumission |

## Déploiement sur Vercel

1. Poussez le repo sur GitHub
2. Importez le projet sur [vercel.com](https://vercel.com)
3. Ajoutez `VITE_N8N_WEBHOOK_URL` dans **Settings → Environment Variables**
4. Chaque push sur `main` déclenche un déploiement automatique

## Structure du projet

```
src/
├── components/
│   ├── CleanSmartForm.tsx   # formulaire principal (sélection + upload CSV)
│   ├── LoginGate.tsx        # écran de connexion, bloque l'accès sans auth
│   └── StatusMessage.tsx    # feedback succès / erreur après envoi
├── hooks/
│   ├── useAuth.ts           # gestion de la session (localStorage)
│   └── useN8nWebhook.ts     # logique POST JSON vers le webhook n8n
├── App.tsx                  # shell de l'application (carte + logo)
├── main.tsx                 # point d'entrée, monte LoginGate + App
└── index.css
```

## Payload envoyé à n8n

```json
{
  "type": "Mandataire | Agence",
  "agent": "Bilal | Younes",
  "csvFileName": "leads.csv",
  "csvContent": "..."
}
```
