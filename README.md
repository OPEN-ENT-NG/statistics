# À propos de l'application stats
    
* Licence : [AGPL v3](http://www.gnu.org/licenses/agpl.txt) - Copyright Edifice
* Financeur(s) : Edifice
* Développeur(s) : Edifice
* Description : module d'affichage de statistiques.

# Notes d'utilisation

## Construction

`gradle copyMod`

## Déploiement dans ent-core


### Configuration

Dans le fichier template :

- Déclarer l'application dans la liste.

```
{
    "name": "fr.wseduc~stats~[VERSION]",
    "config": {
        "main" : "fr.wseduc.stats.Stats",
        "port" : 8025,
        "app-name" : "Statistiques",
        "app-address" : "/stats",
        "app-icon" : "stats-large",
        "app-displayName" : "stats",
        "ssl" : $ssl,
        "integration-mode" : "HTTP",
        "app-registry.port" : 8012,
        "auto-redeploy": false,
        "mode" : "${mode}",
        "entcore.port" : 8009,
        "overviewAllowedFunctions": ["SUPER_ADMIN"],
        "aggregation-cron": "0 0 0 * * ?",
        "dayDelta": -1
    }
}
```
Le champ `aggregation-cron` permet de spécifier la fréquence d'aggrégation. Ici elle est fixée à tous les jours à minuit.

Le champ `dayDelta` fixe l'agrégation à un jour spécifique. Ici, -1 signifie que le jour cible est la veille, 0 étant le jour courant.

Le champ `overviewAllowedFunctions` est *optionnel*, il limite l'accès du niveau 'projet' ainsi que l'export à une ou des fonctions.

- Associer une route à la configuration du module proxy intégré.

```
{
    "location": "/stats",
	"proxy_pass": "http://localhost:8025"
}
```

## Présentation

### Description

Cette application a pour but de produire une série de statistiques à partir de traces d’exécution et de les restituer à la demande à l’utilisateur final.

Ces statistiques doivent être à la fois globales (tous critères confondus), mais doivent aussi pouvoir être filtrées et groupées par critères, par exemple filtrées par période ou groupées par enseignant d’une structure donnée.

Le déclenchement du traitement est déclaré dans le fichier de configuration, et donc aisément modifiable.

### Liste des indicateurs restitués

- **Nombre de connexions**

Somme du nombre de connexions (= login) depuis le 1er septembre, groupé par profil, structure, classes et visualisable par jour / semaine / mois.

 - **Visiteurs uniques**

Nombre de visiteurs uniques sur les 30 derniers jours groupés par profil, structure et classe.
Visualisable par jour / semaine / mois.

 - **Visites par visiteurs uniques**

Combinaison des 2 indicateurs précédents, on somme les connections des 30 derniers jours et on divise par le nombre de visiteurs uniques sur cette période.
Groupé par profil / structure / classe mais visualisable uniquement par mois.

 - **Outils les plus utilisés**

Somme des accès aux services depuis le premier septembre, et affichage des 5 services les plus demandés, par profil ou global.

 - **Pic de connexion horaire**

Somme des connexions depuis le premier septembre par tranche horaire. Affichage pour tous les profils.

 - **Pic de connexion hebdomadaire**

Idem que pour le pic horaire, mais en hebdomadaire.

 - **Nombre de comptes activés**

Somme des comptes activés depuis le premier septembre. Affichage en global ou par profil, somme par jour / mois / semaine.

### Droits et accès

Un utilisateur peut être habilité à utiliser cette application en configurant le droit dans la console d'administration. De plus, un utilisateur ne peut demander la liste des statistiques que pour les établissements / classes dans lesquels il est rattaché.

## Précisions techniques

### Modèle backend

Le modèle JAVA comporte trois parties distinctes :

- Package `fr.wseduc.stats.aggregation` : <br>
Contient la classe d'aggrégation, héritée de AggregationProcessing et paramétrée avec la liste des indicateurs One, avec un filtre journalier et les groupes appropriés (profil / structures / classes / services)

- Package `fr.wseduc.stats.cron` : <br>
Tâche de Cron qui va appeler les implémentations de AggregationProcessing (dans notre cas, celle du package aggregation)

- Autre packages : <br>
Controller & Service qui contenant les méthodes d'appel à la base et d'envoi de données au front.

#### Base Mongodb

**Collection** : Stats<br>
**Modèle** :
```
{
    "_id" :[Id mongo],
    "date" : [Date de l'enregistrement, paramétrée au jour du cron à minuit au format "yyyy-MM-dd HH:mm:ss.SSS"],
    "groupedBy" : [Si on aggrège par groupe(s), contient les groupes séparés par des slash. Sinon vide.],
    "[GROUP]_id" : [Autant de champ id que de groupes dans le groupedBy, contient la valeur pointée par le champ groupe],
    "[TYPE]" : [Type de trace, et valeur aggrégée]
}
```

### Modèle frontend

2 types d'objets sont importants dans la logique javascript des statistiques :

#### IndicatorContainer

L'objet IndicatorContainer symbolise un groupement d'indicateurs, comme par structure ou par classe. Cet objet défini dans le fichier `model.js` contient toutes les requêtes ajax pour récupérer les différentes valeurs aggrégées utilisées pour calculer les indicateurs restitués.

C'est lui qui contient les données.

#### Indicator

L'objet Indicator symbolise un indicateur à restituer à l'écran, et contient une liste de méthodes de calcul et de visualisation toujours paramétrées par un conteneur.


### Dépendances et librairies

#### Common - Aggregation

Cette application One utilise un moteur d'aggrégation contenu dans le module common d'ent-core, étendu avec les indicateurs mentionnés ci-dessus pour aggréger une fois par jour les traces.

Pour les détails techniques plus poussés relatifs à l'aggrégateur, se référer à la documentation d'ent-core.

#### Chart.js

La restitution graphique sous forme de diagrammes se fait à l'aide de la librairie Chart.js.

### Affichage d'un nouveau module

Pour qu'un connecteur apparaisse dans les statistiques, il faut qu'il soit du type "CAS" et qu'il y ait une référence pour le type de CAS.

Pour qu'une application (pour laquelle des événements sont collectés) apparaisse dans les statistiques, il est nécessaire d'ajouter le nom court du *verticle* dans le tableau `modules` dans le fichier `src/main/resources/api-allowed-values.json`.

Processus : à l'ajout d'un nouveau module dont le verticle principal est la classe `org.entcore.xxx.xyz.MyVerticle`, il faut donc créer sur master une PR sur le module `statistics` avec l'ajout de la valeur `MyVerticle` au tableau `modules`.


Ce dépôt est un miroir officiel du dépôt Edifice : https://github.com/edificeio/statistics
