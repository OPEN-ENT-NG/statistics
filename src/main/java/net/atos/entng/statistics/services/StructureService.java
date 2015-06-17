package net.atos.entng.statistics.services;

import org.vertx.java.core.Handler;
import org.vertx.java.core.json.JsonArray;

import fr.wseduc.webutils.Either;

public interface StructureService {

	public void list(JsonArray structureIds, Handler<Either<String, JsonArray>> handler);
}
