package net.atos.entng.statistics.services;

import static org.entcore.common.neo4j.Neo4jResult.validResultHandler;

import org.entcore.common.neo4j.Neo4j;
import org.vertx.java.core.Handler;
import org.vertx.java.core.json.JsonArray;
import org.vertx.java.core.json.JsonObject;

import fr.wseduc.webutils.Either;

public class StructureServiceNeo4jImpl implements StructureService {

	private Neo4j neo4j = Neo4j.getInstance();

	@Override
	public void list(JsonArray structureIds, Handler<Either<String, JsonArray>> handler) {
		String query = "MATCH (s:Structure) WHERE s.id IN {structureIds} RETURN s.id as id, s.name as name, s.UAI as uai, s.city as city";
		JsonObject params = new JsonObject().putArray("structureIds", structureIds);
		neo4j.execute(query, params, validResultHandler(handler));
	}

}
