# À propos de l'application Statistiques

* Licence : [AGPL v3](http://www.gnu.org/licenses/agpl.txt) - Copyright Région Hauts-de-France (ex Picardie)
* Développeur(s) : ATOS
* Financeur(s) : égion Hauts-de-France (ex Picardie)
* description : Application permettant d'agréger des traces et de les afficher sous forme de diagramme

## Déployer dans ent-core
<pre>
		gradle clean install
</pre>


## Configuration
Contenu du fichier deployment/statistics/conf.json.template :
{
  "name": "net.atos~statistics~0.1-SNAPSHOT",
  "config": {
    "main" : "net.atos.entng.statistics.Statistics",
    "port" : 8042,
    "sql" : false,
    "mongodb" : true,
    "neo4j" : true,
    "app-name" : "Statistiques",
    "app-address" : "/statistics",
    "app-icon" : "statistics-large",
    "host": "${host}",
    "ssl" : $ssl,
    "auto-redeploy": false,
    "userbook-host": "${host}",
    "integration-mode" : "HTTP",
    "mode" : "${mode}",
    "access-modules" : ["Blog","Workspace","Conversation","Actualites","Support","Community","Forum","Wiki","Rbs","Mindmap","TimelineGenerator","CollaborativeWall","Poll","Calendar","AdminConsole","Pages","Rack","Annuaire","Archive"]
    }
}


Les paramètres spécifiques à l'application Statistiques sont les suivants :
    "access-modules" : tableau contenant les modules pour lesquels l'indicateur "Accès" est calculé. Ce tableau permet d'afficher la liste déroulante des modules dans le formulaire d'affichage des diagrammes. Chaque élément correspond à une valeur possible du champ "module" des documents de la collection "events".
    Pour ajouter un nouveau module pour l'indicateur "Accès", il faut ajouter ce module au tableau "access-modules", mais aussi modifier le module pour qu'il trace les accès dans la collection "events".

	"aggregate-cron" : paramètre optionnel permettant de définir quand les documents de la collection "events" sont agrégés dans la collection "stats". Il est valorisé à "0 15 1 ? * * *" par défaut ( l'agrégation est donc lancée par défaut toutes les nuits à 1h15). Attention, il faut éviter de planifier un cron entre minuit et une heure, car le changement d'heure peut entraîner la répétion d'un cron ou sa non-exécution 

	"aggregateOnStart" : paramètre optionnel. Booléen permettant de lancer une agrégation au démarrage du module, en environnement de développement (le paramètre mode doit valoir "dev")
