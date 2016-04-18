package net.atos.entng.statistics.services;

import static org.entcore.common.neo4j.Neo4jResult.validResultHandler;

import org.entcore.common.neo4j.Neo4j;
import org.vertx.java.core.Handler;
import org.vertx.java.core.json.JsonArray;
import org.vertx.java.core.json.JsonObject;

import fr.wseduc.webutils.Either;

import java.util.ArrayList;

public class StructureServiceNeo4jImpl implements StructureService {

	private Neo4j neo4j = Neo4j.getInstance();

	@Override
	public void list(JsonArray structureIds, Handler<Either<String, JsonArray>> handler) {
		String query = "MATCH (s:Structure) WHERE s.id IN {structureIds} RETURN s.id as id, s.name as name, s.UAI as uai, s.city as city";
		JsonObject params = new JsonObject().putArray("structureIds", structureIds);
		neo4j.execute(query, params, validResultHandler(handler));
	}

	public void getAttachedStructureslist(String structureId, Handler<Either<String, JsonArray>> handler) {
		String query = "MATCH (s:Structure)<-[:HAS_ATTACHMENT*0..]-(s2:Structure) where s.id = {structureId} RETURN s2.id";
		JsonObject params = new JsonObject().putString("structureId", structureId);
		neo4j.execute(query, params, validResultHandler(handler));
	}

}
