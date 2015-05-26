package net.atos.entng.statistics.controllers;

import static net.atos.entng.statistics.aggregation.indicators.IndicatorFactory.STATS_FIELD_UNIQUE_VISITORS;
import static org.entcore.common.aggregation.MongoConstants.TRACE_TYPE_ACTIVATION;
import static org.entcore.common.aggregation.MongoConstants.TRACE_TYPE_CONNEXION;
import static org.entcore.common.aggregation.MongoConstants.TRACE_TYPE_SVC_ACCESS;

import java.util.HashSet;
import java.util.Set;

import net.atos.entng.statistics.services.StatisticsService;
import net.atos.entng.statistics.services.StatisticsServiceMongoImpl;

import org.entcore.common.mongodb.MongoDbControllerHelper;
import org.entcore.common.user.UserInfos;
import org.entcore.common.user.UserUtils;
import org.vertx.java.core.Handler;
import org.vertx.java.core.http.HttpServerRequest;
import org.vertx.java.core.json.JsonArray;
import org.vertx.java.core.json.JsonObject;

import fr.wseduc.rs.ApiDoc;
import fr.wseduc.rs.Get;
import fr.wseduc.webutils.Either;

public class StatisticsController extends MongoDbControllerHelper {

	private final StatisticsService statsService;

	public StatisticsController(String collection) {
		super(collection);
		statsService = new StatisticsServiceMongoImpl(collection);
	}

	private final static Set<String> indicators;
	static {
		indicators = new HashSet<>();
		indicators.add(STATS_FIELD_UNIQUE_VISITORS);
		indicators.add(TRACE_TYPE_ACTIVATION);
		indicators.add(TRACE_TYPE_CONNEXION);
		indicators.add(TRACE_TYPE_SVC_ACCESS);
	}

	// TODO : add workflow rights for all REST APIs

	@Get("")
	@ApiDoc("Get HTML view")
	public void view(HttpServerRequest request) {
		renderView(request);
	}

	@Get("/data")
	public void getData(final HttpServerRequest request) {
		UserUtils.getUserInfos(eb, request, new Handler<UserInfos>() {
			@Override
			public void handle(final UserInfos user) {
				if (user != null) {
					// TODO : add error messages for all bad requests
					String schoolId = request.params().get("schoolId");
					if (schoolId==null || schoolId.trim().isEmpty() || !user.getStructures().contains(schoolId)) {
						badRequest(request);
						return;
					};

					String indicator = request.params().get("indicator");
					if(indicator==null || indicator.trim().isEmpty() || !indicators.contains(indicator)) {
						badRequest(request);
						return;
					}

					String startDate = request.params().get("startDate");
					String endDate = request.params().get("endDate");
					long start, end;
					try {
						start = Long.parseLong(startDate);
						end = Long.parseLong(endDate);
						if(end < start || end < 0L || start < 0L) {
							badRequest(request);
							return;
						}
					} catch (Exception e) {
						log.error("Error when casting startDate or endDate to long", e);
						badRequest(request);
						return;
					}

					JsonObject params = new JsonObject();
					params.putString("schoolId", schoolId)
						.putString("indicator", indicator)
						.putNumber("startDate", start)
						.putNumber("endDate", end);

					statsService.getStats(params, new Handler<Either<String,JsonArray>>() {
						@Override
						public void handle(Either<String, JsonArray> event) {
							if(event.isLeft()) {
								log.error(event.left().getValue());
								renderError(request);
							}
							else {
								renderJson(request, event.right().getValue());
							}
						}
					});

				} else {
					log.debug("User not found in session.");
					unauthorized(request);
				}
			}
		});

	}

}