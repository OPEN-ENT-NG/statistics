package net.atos.entng.statistics.services;

import java.util.List;

import org.vertx.java.core.Handler;
import org.vertx.java.core.json.JsonArray;
import org.vertx.java.core.json.JsonObject;

import fr.wseduc.webutils.Either;

public interface StatisticsService {

	public void getStats(List<String> schoolIds, JsonObject params, Handler<Either<String, JsonArray>> handler);

	public void getSortedStats(final List<String> schoolIds, final JsonObject params, final Handler<Either<String, JsonArray>> handler);
}
