package net.atos.entng.statistics.services;

import org.vertx.java.core.Handler;
import org.vertx.java.core.json.JsonArray;
import org.vertx.java.core.json.JsonObject;

import fr.wseduc.webutils.Either;

public interface StatisticsService {

	public void getStats(JsonObject params, Handler<Either<String, JsonArray>> handler);
}
