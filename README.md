# StartUpCheck AI

Application web d'analyse de viabilité d'idées de business.
L'utilisateur décrit son idée, l'application produit un **dashboard complet** :
score global sur 100, cinq sous-scores, analyse SWOT, recommandations
priorisées et verdict final.

> Projet universitaire — interface en français, devise par défaut **MAD (DH)**.

---

## 1. Fonctionnalités

| Section du dashboard | Contenu |
|---|---|
| **Score global** | Note de viabilité sur 100, avec jauge animée |
| **5 sous-scores** | Marché, Faisabilité, Innovation, Croissance, Risque (chacun détaillé et expliqué) |
| **Graphique radar** | Profil visuel des cinq dimensions |
| **Analyse SWOT** | Forces, Faiblesses, Opportunités, Menaces |
| **Recommandations** | 4 à 6 conseils priorisés et actionnables |
| **Niveau de risque** | Note de risque, niveau (faible → très élevé) et principaux facteurs |
| **Verdict** | À développer · À améliorer · Risqué |
| **Onglet Finance** | Analyse financière prévisionnelle : CA, marge, seuil de rentabilité, ROI, payback, 3 scénarios, simulateur |
| **Onglet Étude de projet** | Business plan structuré en 9 sections, analyse des risques, feuille de route 12 mois, score de faisabilité, export PDF |
| **Historique** | Toutes les analyses conservées en base locale, consultables par URL |

Fonctions annexes : export JSON du rapport, impression / PDF, idées d'exemple
préremplissables (dont **StageConnect**).

---

## 2. Technologies

**Frontend** : React 18, Vite, TypeScript, Tailwind CSS, Framer Motion,
Recharts (radar), Zustand, React Router, lucide-react.

**Backend** : Node.js, Express, TypeScript, Zod (validation), Prisma + SQLite.

**Moteur d'analyse** : 100 % déterministe et local (aucune API externe requise).
Un enrichissement par IA générative est **optionnel** et n'intervient jamais
dans le calcul des scores.

---

## 3. Prérequis

- **Node.js 18.18 ou supérieur** (testé avec Node 24) — <https://nodejs.org>

Vérification :

```bash
node -v
```

---

## 4. Installation et lancement

### Méthode rapide (Windows)

Double-cliquez sur **`demarrer.cmd`** : le script installe les dépendances,
crée la base de données si besoin, puis démarre le serveur et l'interface.

### Méthode manuelle

```bash
npm install            # dépendances racine (concurrently)
npm run install:all    # dépendances serveur + client
npm run db:push        # crée la base SQLite (server/prisma/dev.db)
npm run dev            # démarre le serveur ET l'interface
```

Puis ouvrez : **<http://localhost:5173>**

| Service | Adresse |
|---|---|
| Interface | <http://localhost:5173> |
| API | <http://localhost:4000> |
| État de l'API | <http://localhost:4000/api/health> |

### ⚠️ Si vous utilisez PowerShell

Windows bloque parfois les scripts npm. Dans ce cas, utilisez le **Terminal
(invite de commandes / cmd)** plutôt que PowerShell, ou exécutez une fois :

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

### Scripts disponibles

| Commande | Effet |
|---|---|
| `npm run dev` | Lance le serveur (4000) et le client (5173) ensemble |
| `npm run dev:server` | Lance uniquement l'API |
| `npm run dev:client` | Lance uniquement l'interface |
| `npm test` | Exécute les tests du moteur d'analyse, du module financier et de l'étude de projet |
| `npm run typecheck` | Vérifie les types TypeScript (serveur + client) |
| `npm run seed` | Ajoute des analyses d'exemple en base |
| `npm run db:studio` | Ouvre l'explorateur de base Prisma Studio |
| `npm run build` | Construit l'interface pour la production |

---

## 5. Démonstration en 8 étapes

1. Ouvrir <http://localhost:5173>.
2. Cliquer sur **« Analyser mon idée »**.
3. Cliquer sur le bouton **StageConnect** (pré-remplit tout le formulaire, y compris les chiffres clés optionnels).
4. Cliquer sur **« Analyser mon idée »** : le dashboard apparaît.
5. Montrer dans l'ordre : le **score global**, le **verdict**, le **radar**,
   l'analyse **SWOT**, les **recommandations**, le **niveau de risque**.
   Cliquer sur **« Détail du calcul »** sous un score pour prouver que la note
   est expliquée facteur par facteur.
6. Ouvrir l'onglet **« Finance »** : KPI, santé financière, seuil de rentabilité,
   ROI, payback, graphiques, comparaison des 3 scénarios. Déplacer un curseur du
   **simulateur** pour montrer le recalcul immédiat, puis **enregistrer**.
7. Ouvrir l'onglet **« Étude de projet »** : générer l'étude, parcourir les 9
   sections, montrer le score de faisabilité, la matrice des risques, la feuille
   de route et la conclusion. Modifier un texte puis **régénérer** une version.
8. Aller dans **Historique** pour rouvrir une analyse, puis **Méthodologie**
   pour présenter la formule et les limites de l'outil.

---

## 6. Méthode d'analyse

### 6.1 Formule du score global

```
score = 0.25 × marché        (Potentiel du marché)
      + 0.20 × faisabilité   (Faisabilité)
      + 0.20 × innovation    (Innovation)
      + 0.20 × croissance    (Potentiel de croissance)
      + 0.15 × (100 − risque)(Niveau de risque, INVERSÉ)
```

Le résultat est borné entre 0 et 100 et arrondi.

### 6.2 Calcul de chaque dimension

| Dimension | Critères (tous issus des barèmes internes et de la saisie) |
|---|---|
| Potentiel du marché | Attractivité du secteur, maturité du pays, pouvoir d'achat, adoption numérique, précision du ciblage |
| Faisabilité | Adéquation budget / ticket d'entrée, lourdeur réglementaire inversée, complexité technique inversée, qualité de la description, précision du ciblage |
| Innovation | Signaux d'innovation détectés, différenciation revendiquée, faible saturation concurrentielle, intensité technologique |
| Croissance | Croissance du secteur, scalabilité, dynamisme du pays, adoption numérique, qualité de la description |
| Risque | Intensité concurrentielle, lourdeur réglementaire, complexité technique, insuffisance du budget, immaturité du marché, imprécision de la description |

### 6.3 Adéquation du budget

Le budget est comparé au ticket d'entrée du secteur via une courbe
exponentielle décroissante :

```
adéquation = 100 × (1 − e^(−ratio / 1,1))     avec ratio = budget / ticket d'entrée
```

| Ratio | Niveau | Effet |
|---|---|---|
| ≥ 3× | Confortable | Faisabilité très favorisée |
| 1,5× – 3× | Suffisant | Faisabilité favorisée |
| 1× – 1,5× | Juste | Neutre |
| 0,5× – 1× | Insuffisant | Faisabilité pénalisée, risque accru |
| < 0,5× | Critique | Faisabilité fortement pénalisée |

### 6.4 Seuils de décision

| Score global | Verdict |
|---|---|
| 70 – 100 | 🟢 **À développer** |
| 50 – 69 | 🟠 **À améliorer** |
| 0 – 49 | 🔴 **Risqué** |

| Note de risque | Niveau |
|---|---|
| 0 – 29 | Faible |
| 30 – 49 | Modéré |
| 50 – 69 | Élevé |
| 70 – 100 | Très élevé |

### 6.5 Transparence sur l'IA

- Les **scores sont toujours** calculés localement par des règles de calcul.
  Deux analyses des mêmes informations donnent exactement le même résultat.
- Le **texte** (SWOT, recommandations, justification du verdict) provient, par
  défaut, d'un **générateur de règles internes**. Dans ce cas, l'application
  l'indique explicitement et ne mentionne **jamais** d'IA générative.
- Si un LLM est configuré et qu'il répond correctement, le texte est alors
  rédigé par ce LLM et le rapport le signale, en précisant le fournisseur et le
  modèle utilisés.

---

## 7. Module « Financial Check » (analyse financière prévisionnelle)

Onglet **Finance** du dashboard. **Tous les calculs sont déterministes : aucune
IA générative n'intervient dans les chiffres.**

### 7.1 Les 5 hypothèses saisies

| Hypothèse | Unité |
|---|---|
| Investissement initial | DH |
| Prix de vente moyen | DH |
| Ventes / clients par mois | nombre |
| Charges fixes mensuelles | DH |
| Coût variable moyen par vente | DH |

Ces hypothèses sont **optionnelles** : on peut les saisir dans le formulaire
d'analyse (section « Chiffres clés ») ou plus tard depuis l'onglet Finance.

### 7.2 Formules exactes

| Indicateur | Formule | Si non calculable |
|---|---|---|
| CA mensuel | `prix × ventes` | — |
| CA annuel | `CA mensuel × 12` | — |
| Coûts variables | `coût variable × ventes` | — |
| Marge sur coûts variables (MCV) | `CA mensuel − coûts variables` | — |
| Taux de MCV | `(prix − coût variable) / prix` | `0` si prix nul |
| Charges totales | `charges fixes + coûts variables` | — |
| Résultat mensuel | `CA mensuel − charges totales` | peut être négatif |
| Résultat annuel | `résultat mensuel × 12` | — |
| Seuil de rentabilité (CA) | `charges fixes / taux de MCV` | `null` si marge nulle/négative |
| Seuil de rentabilité (ventes) | `charges fixes / (prix − coût variable)` | `null` si marge nulle/négative |
| ROI annuel | `résultat annuel / investissement initial` | `null` si investissement nul |
| Payback (mois) | `investissement / résultat mensuel` | `0` si investissement nul, `null` si jamais atteint |

Aucune division par zéro ne produit `NaN` ou `Infinity` : la valeur est `null`
et l'interface affiche un message explicite (« Non atteignable avec ces
hypothèses », « Non applicable — aucun investissement initial »). Les valeurs
négatives (pertes) sont **conservées et affichées**, jamais masquées.

### 7.3 Indicateur de santé financière

Score **déterministe borné entre 0 et 100** (`healthScore = max(0, min(100, raw))`),
construit par règles explicites affichées à l'utilisateur : résultat mensuel,
taux de marge, position vis-à-vis du seuil, vitesse de récupération, et structure
de la marge unitaire. Statuts : **Solide** (≥ 70), **Fragile** (45–69),
**À risque** (< 45), **Non rentable** (marge unitaire nulle ou négative).

### 7.4 Scénarios

| Paramètre | Pessimiste | Réaliste | Optimiste |
|---|---|---|---|
| Ventes / clients | × 0,70 | × 1,00 | × 1,25 |
| Prix de vente | × 0,90 | × 1,00 | × 1,05 |
| Coût variable | × 1,08 | × 1,00 | × 0,95 |
| Charges fixes | × 1,10 | × 1,00 | × 0,95 |
| Investissement initial | × 1,00 | × 1,00 | × 1,00 |

> ⚠️ **Le scénario « Réaliste » correspond strictement aux saisies.** Les
> scénarios pessimiste et optimiste sont des **hypothèses de simulation
> pédagogiques**, appliquées par coefficients fixes, et **non des prévisions
> universelles** ni des recommandations. L'investissement initial n'est jamais
> modulé (engagement de départ, pas une variable d'exploitation). Ces notes sont
> également affichées dans l'interface.

### 7.5 Simulateur

Modifier le prix, les ventes, les charges ou le coût variable recalcule
immédiatement tous les indicateurs. Le calcul est effectué **côté serveur**
(`POST /api/financial-checks/preview`, sans persistance) : une seule
implémentation des formules, aucune divergence client/serveur, aucun chiffre
inventé dans le navigateur. Le bouton **« Enregistrer ces hypothèses »** fige
les hypothèses **et** les résultats en base, rattachés à l'analyse.

### 7.6 Avertissement

> Ces montants sont des **projections** calculées à partir de vos hypothèses.
> Ils ne constituent **pas un conseil financier**, comptable, fiscal ou
> juridique, et ne garantissent aucun résultat.

---

## 8. Module « Étude de projet »

Onglet **Étude de projet** du dashboard. Il transforme l'analyse existante en
**business plan structuré**, sans jamais demander de ressaisir les données :
scores, SWOT, description, secteur, marché, cible et Financial Check sont
réutilisés automatiquement.

### 8.1 Les 9 sections

| # | Section | Contenu |
|---|---|---|
| 1 | **Présentation** | Projet, résumé exécutif, problème, solution, cible, secteur, marché, objectifs |
| 2 | **Étude de marché** | Vue d'ensemble, demande, segments, tendances, concurrence, opportunités, menaces |
| 3 | **Étude commerciale** | Proposition de valeur, offre, tarification, canaux, communication, acquisition, fidélisation |
| 4 | **Étude technique** | Solution, technologies, équipements, locaux, fournisseurs, processus, contraintes, scalabilité |
| 5 | **Étude organisationnelle** | Équipe, rôles, compétences, partenaires, management, cadre juridique |
| 6 | **Étude financière** | **Copie figée** du Financial Check existant (aucun recalcul) |
| 7 | **Analyse des risques** | 6 catégories, probabilité × impact, niveau, plan de mitigation |
| 8 | **Plan d'action** | Feuille de route 0–30 j, 30–60 j, 60–90 j, 3–6 mois, 6–12 mois |
| 9 | **Conclusion** | Niveau global de faisabilité, forces, faiblesses, conditions de réussite, recommandation |

### 8.2 Score de faisabilité

```
score = round( Σ(valeur × poids) / Σ(poids disponibles) )     borné entre 0 et 100
```

| Composante | Poids | Source |
|---|---|---|
| Viabilité du projet | 50 % | Score global de l'analyse existante |
| Santé financière | 30 % | Financial Check (score de santé) |
| Complétude du dossier | 20 % | `70 % × confiance de l'analyse + 30 % × présence d'un Financial Check` |

Sans Financial Check, la composante Finance est **omise** et les poids restants
sont **renormalisés** (50 % + 20 % = 70 %). La formule exacte, avec les valeurs
utilisées, est affichée dans l'en-tête de l'étude.

Statuts : **Projet viable** (score ≥ 70 et verdict « À développer »),
**Viable sous conditions** (score ≥ 45), **À retravailler** (score < 45).

Plafonnements de sécurité :

- marge unitaire ≤ 0 dans le Financial Check → **À retravailler** ;
- santé financière « Non rentable » → au mieux **Viable sous conditions** ;
- verdict de l'analyse « Risqué » → au mieux **Viable sous conditions**.

### 8.3 Analyse des risques

Six risques sont construits par règles : **financier, commercial, opérationnel,
technique, juridique, RH**. Chaque risque reçoit une probabilité et un impact
de 1 à 4 (hypothèses déterministes, jamais des mesures statistiques).

```
niveau = probabilité × impact        (1 à 16)
```

| Niveau | Plage |
|---|---|
| Faible | 1 – 4 |
| Modéré | 5 – 8 |
| Élevé | 9 – 12 |
| Critique | 13 – 16 |

### 8.4 Feuille de route

Cinq horizons (0–30 j, 30–60 j, 60–90 j, 3–6 mois, 6–12 mois), chacun avec
objectifs, actions priorisées et indicateurs de réussite. Ce sont des **repères
de travail**, pas des engagements contractuels.

### 8.5 Transparence des contenus

Chaque bloc de texte porte son origine, affichée dans l'interface :

| Badge | Signification |
|---|---|
| **Saisie** | Information fournie par l'utilisateur |
| **Calculé** | Résultat déterministe (score, marge, seuil, faisabilité) |
| **Hypothèse** | Déduction heuristique du moteur, jamais une donnée réelle |
| **IA** | Texte reformulé par un modèle de langage, non vérifié |

Le bandeau « Origine des contenus » compte les blocs par source. Les scores,
les risques et les chiffres financiers **ne passent jamais par le LLM**.

### 8.6 Versions et modification

- Chaque génération crée une **version** (`v1`, `v2`, …) ; une seule est active.
- L'historique des versions reste accessible et permet de revenir à une version
  antérieure.
- Le mode **Modifier** ne touche que les textes : les scores, risques et chiffres
  restent verrouillés. Un texte modifié est requalifié en **Saisie**.
- **Régénérer** crée une nouvelle version à partir de l'analyse et du Financial
  Check courants ; les versions précédentes sont conservées.

### 8.7 Export PDF

Le bouton **Exporter en PDF** utilise l'impression native du navigateur
(`window.print()`). Le rendu imprime les **9 sections complètes**, avec en-tête
et pied de page (date, moteur, méthodologie, avertissement), une section par
page, sans navigation ni boutons. L'export JSON reste celui de l'analyse.

### 8.8 Enrichissement par IA (optionnel)

Si un LLM est configuré, **un seul appel JSON structuré** reformule certains
textes (résumé, marché, commercial, organisation, mitigations, conclusion).
Garde-fous :

- le modèle ne reçoit que des textes déjà rédigés, jamais les scores ;
- il ne peut renvoyer que les identifiants fournis (liste blanche) ;
- tout **montant**, **pourcentage** ou **unité monétaire** nouveau fait rejeter
  la réponse entière ;
- un nombre absent du texte source fait rejeter le champ concerné ;
- en cas d'erreur, de délai ou de réponse incomplète, l'étude locale est
  conservée **silencieusement**.

---

## 9. Enrichissement par IA générative (optionnel)

**Aucune clé n'est nécessaire pour utiliser l'application.** Si aucune clé
n'est présente, ou si l'appel échoue (réseau, délai, réponse invalide),
l'application bascule automatiquement sur le générateur local — le rapport est
toujours produit.

Pour l'activer, éditez `server/.env` :

```env
LLM_PROVIDER="openai"
LLM_BASE_URL="https://api.openai.com/v1"
LLM_MODEL="gpt-4o-mini"
LLM_API_KEY="sk-..."
```

Exemple avec **Ollama en local** (aucune clé requise) :

```env
LLM_PROVIDER="ollama"
LLM_BASE_URL="http://localhost:11434/v1"
LLM_MODEL="llama3.1"
LLM_API_KEY="ollama"
```

Le service est compatible avec toute API de type OpenAI (OpenAI, Mistral,
Groq, Together, Ollama…). Il suffit de changer `LLM_BASE_URL` et `LLM_MODEL`.

---

## 10. API REST

| Méthode | Route | Description |
|---|---|---|
| `GET` | `/api/health` | État du serveur et de la base |
| `GET` | `/api/meta` | Référentiels (secteurs, marchés, exemples) + état du LLM |
| `POST` | `/api/analyses` | Crée une analyse |
| `GET` | `/api/analyses` | Liste l'historique |
| `GET` | `/api/analyses/:id` | Détail d'une analyse |
| `DELETE` | `/api/analyses/:id` | Supprime une analyse |
| `POST` | `/api/financial-checks/preview` | Calcule une analyse financière **sans** la persister (simulateur) |
| `POST` | `/api/financial-checks` | Calcule et enregistre (rattache à une analyse via `analysisId`) |
| `GET` | `/api/financial-checks?analysisId=…` | Liste les analyses financières |
| `GET` | `/api/financial-checks/:id` | Détail d'une analyse financière |
| `DELETE` | `/api/financial-checks/:id` | Supprime une analyse financière |
| `POST` | `/api/project-studies/preview` | Génère une étude de projet **sans** la persister |
| `POST` | `/api/project-studies` | Génère et enregistre une nouvelle version |
| `GET` | `/api/project-studies?analysisId=…` | Liste les versions d'une étude |
| `GET` | `/api/project-studies/current?analysisId=…` | Version active d'une analyse |
| `GET` | `/api/project-studies/:id` | Détail d'une version |
| `PATCH` | `/api/project-studies/:id` | Modifie uniquement des blocs de texte |
| `POST` | `/api/project-studies/:id/regenerate` | Crée une nouvelle version |
| `DELETE` | `/api/project-studies/:id` | Supprime une version |

`POST /api/analyses` accepte un bloc `financial` **optionnel** pour créer
l'analyse et son analyse financière en une seule requête.

Exemple de prévisualisation financière :

```bash
curl -X POST http://localhost:4000/api/financial-checks/preview \
  -H "Content-Type: application/json" \
  -d "{\"initialInvestment\":150000,\"unitPrice\":500,\"monthlyUnits\":40,\"fixedCostsMonthly\":8000,\"variableCostPerUnit\":120}"
```

Exemple :

```bash
curl -X POST http://localhost:4000/api/analyses \
  -H "Content-Type: application/json" \
  -d "{\"projectName\":\"StageConnect\",\"description\":\"Plateforme qui met en relation les etudiants et les entreprises qui recrutent, avec matching automatique et suivi des candidatures.\",\"sector\":\"edtech\",\"market\":\"maroc\",\"targetClients\":\"Etudiants et PME\",\"budget\":150000}"
```

---

## 11. Structure du projet

```
StartupCheckAi/
├─ client/                      Interface React + Vite
│  ├─ src/components/           UI, formulaire, dashboard, finance, mise en page
│  ├─ src/pages/                Accueil, Analyse, Résultats, Historique, Méthode
│  ├─ src/lib/                  API, formatage, finance (formats/thème), utilitaires
│  └─ src/store/                État global (Zustand)
├─ server/                      API Express + moteur d'analyse
│  ├─ prisma/schema.prisma      Schéma SQLite (Analysis + FinancialCheck + ProjectStudy)
│  ├─ src/engine/               Moteur de scoring déterministe + fallback
│  ├─ src/engine/financial/     Moteur financier déterministe (formules, scénarios, santé)
│  ├─ src/engine/project-study/ Moteur « Étude de projet » (9 sections, risques, feuille de route)
│  ├─ src/services/             LLM optionnel, services analyse + finance + étude
│  ├─ src/routes/               Routes REST
│  ├─ src/data/                 Idées d'exemple
│  └─ tests/                    Tests moteur + finance + étude de projet
├─ demarrer.cmd                 Lancement en un clic (Windows)
└─ README.md
```

---

## 12. Limites assumées

- Les barèmes sectoriels sont des **indices heuristiques** construits à partir
  d'ordres de grandeur publics. Ils ne remplacent pas une étude de marché.
- L'analyse de la description repose sur des **règles lexicales** : une idée mal
  décrite est pénalisée, même si le concept est solide.
- Le budget est comparé à un **ticket d'entrée indicatif** par secteur, et non à
  un plan de trésorerie détaillé.
- Le module financier raisonne en **régime mensuel constant** (pas de saisonnalité,
  pas de montée en charge progressive, pas de TVA ni d'impôts) : il donne des
  **ordres de grandeur**, pas une trésorerie comptable.
- Le délai de récupération suppose un **résultat mensuel constant** dès le premier mois.
- Les coefficients des scénarios pessimiste et optimiste sont **identiques pour
  tous les projets** : ils mesurent la sensibilité, ils ne prédisent rien.
- L'**étude de projet** est un document de travail généré par règles : elle
  réutilise l'analyse existante et ne remplace ni une étude de marché réelle, ni
  un business plan validé par un professionnel.
- Les probabilités et impacts des risques sont des **hypothèses déterministes**
  (échelle 1 à 4), pas des mesures statistiques.
- La section Finance est une **copie figée** du Financial Check au moment de la
  génération : régénérez l'étude après toute mise à jour des hypothèses.
- Les textes marqués **IA** sont reformulés par un modèle de langage et ne sont
  **pas vérifiés** ; aucun chiffre, montant ou pourcentage nouveau n'est accepté.
- Aucune donnée ne quitte votre machine : tout est stocké dans une base SQLite
  locale (`server/prisma/dev.db`).
