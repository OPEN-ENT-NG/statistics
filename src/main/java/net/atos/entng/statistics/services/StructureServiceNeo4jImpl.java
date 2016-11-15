/*
 * Copyright © Région Nord Pas de Calais-Picardie, 2016.
 *
 * This file is part of OPEN ENT NG. OPEN ENT NG is a versatile ENT Project based on the JVM and ENT Core Project.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation (version 3 of the License).
 *
 * For the sake of explanation, any module that communicate over native
 * Web protocols, such as HTTP, with OPEN ENT NG is outside the scope of this
 * license and could be license under its own terms. This is merely considered
 * normal use of OPEN ENT NG, and does not fall under the heading of "covered work".
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 */

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

	public void getListStructuresForUser( String userId, Handler<Either<String, JsonArray>> handler) {
		String query = "match (u:User)-[IN]->(pg:ProfileGroup)-[DEPENDS]->(s:Structure)<-[:HAS_ATTACHMENT*0..]-(s2:Structure) " +
				" where u.id = {userId} return distinct s2.id as id, s2.name as name";
		JsonObject params = new JsonObject().putString("userId", userId);
		neo4j.execute(query, params, validResultHandler(handler));
	}
}
