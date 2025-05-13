# 🤖 Agent de Démarches Administratives (Formation IA + TypeScript)

Ce projet a été conçu comme support d’un atelier de formation pour développeurs.  
Il permet de découvrir comment construire un **agent intelligent** en TypeScript, capable de :

- Comprendre une intention utilisateur exprimée en langage naturel
- Appeler dynamiquement des fonctions métiers (`function_call`)
- Utiliser l'API OpenAI pour résumer, analyser ou enrichir les réponses
- Orchestrer plusieurs appels de fonctions selon les besoins
- Déclencher un sous-agent spécialisé (agent secondaire) dans certaines situations

---

## 📚 Contexte pédagogique

En Côte d’Ivoire (et ailleurs), les démarches administratives sont parfois longues, complexes ou peu claires.

L’idée ici est de **simuler un assistant intelligent** qui aide l’utilisateur à :

- Connaître les étapes pour obtenir un document (CNI, casier judiciaire…)
- Trouver un centre de traitement proche de chez lui
- Estimer le coût et le délai
- Résumer la procédure simplement
- (Bonus) Proposer un rappel ou détecter si une démarche est urgente

---

## 🎯 Objectifs pédagogiques

Les participants vont apprendre à :

- Utiliser `function_call` avec l’API OpenAI
- Orchestrer dynamiquement des appels à des fonctions TypeScript
- Réinjecter les résultats pour obtenir une réponse finale cohérente
- Simuler un sous-agent OpenAI avec ses propres fonctions
- Structurer un petit backend pour servir cet agent

---

## 🧰 Prérequis techniques

- Node.js v18+
- Une clé API OpenAI (compte développeur)
- Notions de base en TypeScript et Nest.js
- Aucune dépendance à une base de données (tout est mocké)

---

## 🚀 Installation

```bash
git clone https://github.com/votre-utilisateur/agent-demarches-civ.git
cd agent-demarches-civ
npm install
cp .env.example .env # Ajoutez votre clé OpenAI ici
npm run dev
