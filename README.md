# 3SETS Club Pass

Application React/Vite reliée à Supabase pour inscrire les licenciés, distribuer des coupons et les valider en magasin.

## Installation locale

Prérequis : Node.js 20 ou plus récent.

1. Copier `.env.example` vers `.env.local`.
2. Renseigner l’URL, la clé publique Supabase, l’URL de l’application et la clé publique VAPID.
3. Exécuter `npm ci`, puis `npm run dev`.

Commandes de vérification :

```bash
npm run lint
npm test
npm run build
```

## Base Supabase

Avant toute migration d’une base utilisée, créer une sauvegarde. Exécuter ensuite `supabase/schema.sql` dans SQL Editor. Le script ajoute les colonnes manquantes sans supprimer les clients existants et retire les anciennes politiques publiques dangereuses.

Dans Authentication, désactiver l’inscription publique par email. Créer le compte vendeur depuis le tableau de bord Supabase, puis lui attribuer le rôle administrateur :

```sql
update profiles set role='admin' where email='magasin@3sets.fr';
```

Ne jamais placer la clé `service_role` dans Vercel ou dans le code du navigateur.

## Notifications push

Créer une paire de clés VAPID, puis :

- mettre la clé publique dans `VITE_VAPID_PUBLIC_KEY` sur Vercel ;
- ajouter `VAPID_PUBLIC_KEY` et `VAPID_PRIVATE_KEY` aux secrets Supabase ;
- déployer `supabase/functions/quick-function` comme Edge Function ;
- conserver la vérification JWT activée.

La fonction contrôle le rôle administrateur avant chaque envoi et supprime automatiquement les abonnements expirés.

## Déploiement

Configurer dans Vercel :

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_PUBLIC_APP_URL`
- `VITE_VAPID_PUBLIC_KEY`

Puis lancer un nouveau déploiement. `vercel.json` redirige les routes React vers `index.html`.

## Sécurité et données personnelles

Les tables contenant les coordonnées et l’utilisation des coupons ne sont pas publiquement lisibles. Les visiteurs utilisent uniquement des fonctions limitées : inscription atomique, récupération par email + téléphone et consultation par jeton de pass. Le consentement newsletter est désactivé par défaut.

Prévoir également une page de confidentialité indiquant le responsable du traitement, la finalité, la durée de conservation et la procédure de suppression des données.
