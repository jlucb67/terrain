# Terrain Paris 2027

Appli de terrain des groupes d'action : carte de la circonscription, porte-à-porte et tractage (marchés, supermarchés, métro, pieds d'immeuble).

Adresse : https://jlucb67.github.io/terrain/ (depuis le 12/10/2026 ; l'ancienne adresse terrain-paris-2027 ne répond plus).

- Les 18 circonscriptions de Paris sont chargées (12/10/2026) ; les groupes d'action sont des exemples.
- Depuis le 20/10/2026 : deux onglets, Porte-à-porte et Tractage ; le score d'une adresse est son rang dans la circonscription ; l'onglet Tractage classe les lieux selon le moment choisi (jour et heure).
- Connexion par identifiant et mot de passe, donnés par un administrateur dans la console de l'appli.
- Les saisies partent dans un journal partagé privé ; hors connexion, elles attendent sur le téléphone et partent au retour du réseau.
- Données de la carte : sources publiques et estimations par adresse, sans aucune donnée personnelle.

## Contenu du dépôt

| Fichier | Rôle |
|---|---|
| `index.html` | la page (balisage et styles) ; elle charge le code depuis `js/` |
| `js/liste.json` | ordre des morceaux de code et empreinte de chacun |
| `js/*.js` | le code, en morceaux |
| `img/` | logos |
| `d/` | données de la carte : `paris.json`, `quartiers.json`, puis pour chaque circonscription KK `circo_KK.json` (adresses, bureaux, lieux de tractage, secteurs de pieds d'immeuble, fond de carte) et `bati_KK.json` (bâti) |
| `acces.json` | comptes de connexion, écrit par l'appli elle-même : ne pas le modifier à la main |

Chaque compte de `acces.json` est chiffré par son mot de passe (PBKDF2 puis AES-GCM) : sans le mot de passe, il ne livre rien. Aucune clé en clair dans ce dépôt. Sources, méthode et tests : dépôt privé du projet.
