# ONLINE STORE

## Démarrage du projet

### Base de données


### Backend

Dans `backend/.env`, configurez les paramètres suivants :

```

Utilisez une clé aléatoire longue pour `SESSION_SECRET` et renseignez le mot de passe MySQL si nécessaire. Puis lancez le serveur :

```sh
cd backend
npm install
npm run dev
```

L’API de diagnostic est disponible sur `http://localhost:5000/api/health`.

### Frontend

À la racine du projet, installez les dépendances et lancez Vite :

```sh
npm install
npm run dev
```

## API d’authentification

Les routes sont préfixées par `/api/auth` :

- `POST /register` — crée un compte avec `nom`, `email` et `password`.
- `POST /login` — authentifie l’utilisateur avec `email` et `password`.
- `GET /me` — renvoie le profil associé à la session.
- `POST /logout` — termine la session.

Les requêtes du navigateur doivent inclure les cookies (`credentials: "include"`). `FRONTEND_URL` doit correspondre à l’origine affichée par le serveur de développement Vite.

Après inscription ou connexion, l’utilisateur est redirigé vers `/profile`. Cette page affiche son nom, son adresse e-mail et la date de création du compte ; elle est réservée aux sessions authentifiées et permet de se déconnecter.

Le panier et les favoris des comptes connectés sont chargés et sauvegardés par utilisateur dans la table `user_collections`. L’API protégée `GET` et `PUT /api/user-data` utilise l’utilisateur de la session ; les données des invités restent locales dans le navigateur.
