# Cases everywhere

Ouverture de caisses CS2 pour le fun, en widget de barre des menus (Mac), en widget de zone de notification (Windows) et en extension navigateur.
**Argent fictif uniquement**, aucun vrai paiement.

## Installer

Site : https://agenceoriginal.github.io/cases-everywhere/ · Téléchargements : [dernière Release](https://github.com/agenceoriginal/cases-everywhere/releases/latest).

Les installateurs sont aussi dans `dist/` après `npm run dist` :

| Plateforme | Fichier | Installation |
|---|---|---|
| macOS (Intel + Apple Silicon) | `Cases-everywhere-1.0.0-mac.dmg` | Ouvre le .dmg et glisse **Cases everywhere** dans **Applications**. Au premier lancement : clic droit → **Ouvrir** (l'app n'est pas signée par Apple). |
| Windows 10/11 | `Cases-everywhere-1.0.0-win.exe` | Double-clic, l'installation se fait en un clic. Si SmartScreen s'affiche : **Informations complémentaires** → **Exécuter quand même**. |
| Chrome, Brave, Edge, Opera | `Cases-everywhere-extension.zip` | Dézippe, ouvre `chrome://extensions` (ou `brave://extensions`), active le **Mode développeur**, puis **Charger l'extension non empaquetée** et choisis le dossier dézippé. |

Une fois lancée, l'app vit dans la barre des menus (Mac) ou près de l'horloge (Windows) : icône ◆.
Clic pour ouvrir, clic droit pour **Lancer au démarrage** ou **Quitter**.

## Fonctionnement

- 12 caisses : 8 vraies caisses CS2 + 4 caisses spéciales (Couteaux, Gants, Karambit, Doppler).
- Probabilités officielles de CS, usures, StatTrak™. Images des skins depuis le CDN Steam (internet requis).
- Solde de départ jusqu'à 1 000 € ou $, réglable dans ⚙️. **Réinitialiser le compte** remet le solde et efface l'inventaire et les stats.
- Grosse animation pour les drops Covert et ★.
- Raccourci : `Espace` pour ouvrir une caisse.

## Développement

```bash
npm install
npm start          # lance le widget desktop
npm run dist       # crée les 3 fichiers de dist/ (DMG, EXE, ZIP)
npm run cases      # regénère app/cases.js (liste des caisses dans scripts/fetch-cases.mjs)
npm run icons      # regénère toutes les icônes
npm run promo      # regénère les bannières du Chrome Web Store (store/)
npm run site       # prépare le site vitrine (site/) : skins et icônes
```

```
app/        UI partagée + manifest de l'extension
desktop/    app Electron (barre des menus / zone de notification)
build/      icône des installateurs
store/      bannières du Chrome Web Store (440×280 et 1400×560)
site/       site vitrine (page statique)
scripts/    génération des caisses et des icônes
```

## Contribuer

Les contributions sont les bienvenues : idées, bugs, nouvelles caisses, traductions.

1. Ouvre une [issue](https://github.com/agenceoriginal/cases-everywhere/issues) pour décrire le bug ou l'idée.
2. Fork le dépôt, crée une branche, puis ouvre une pull request.
3. Teste ta modif avec `npm start` (widget) et/ou le serveur du site (`python3 -m http.server -d site`).

Données des caisses : [ByMykel/CSGO-API](https://github.com/ByMykel/CSGO-API). Projet perso non affilié à Valve.
