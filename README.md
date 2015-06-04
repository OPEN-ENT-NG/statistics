# À propos de l'application Statistiques

* licence : [AGPL v3](http://www.gnu.org/licenses/agpl.txt)
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
    "neo4j" : false,
    "app-name" : "Statistiques",
    "app-address" : "/statistics",
    "app-icon" : "statistics-large",
    "host": "${host}",
    "ssl" : $ssl,
    "auto-redeploy": false,
    "userbook-host": "${host}",
    "integration-mode" : "HTTP",
    "mode" : "${mode}"
    }
}


Les paramètres spécifiques à l'application Statistiques sont les suivants :
	"aggregate-cron" : paramètre optionnel permettant de définir quand les documents de la collection "events" sont agrégés dans la collection "stats". Il est valorisé à "0 15 1 ? * * *" par défaut ( l'agrégation est donc lancée par défaut toutes les nuits à 1h15). Attention, il faut éviter de planifier un cron entre minuit et une heure, car le changement d'heure peut entraîner la répétion d'un cron ou son non-exécution 

	"aggregateOnStart" : paramètre optionnel. Booléen permettant de lancer une agrégation au démarrage du module, en environnement de développement (le paramètre mode doit valoir "dev")