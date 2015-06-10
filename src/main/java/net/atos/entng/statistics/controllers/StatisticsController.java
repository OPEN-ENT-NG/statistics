package net.atos.entng.statistics.controllers;

import static net.atos.entng.statistics.aggregation.indicators.IndicatorFactory.STATS_FIELD_UNIQUE_VISITORS;
import static org.entcore.common.aggregation.MongoConstants.TRACE_TYPE_ACTIVATION;
import static org.entcore.common.aggregation.MongoConstants.TRACE_TYPE_CONNEXION;
import static org.entcore.common.aggregation.MongoConstants.TRACE_TYPE_SVC_ACCESS;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

import net.atos.entng.statistics.DateUtils;
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
import fr.wseduc.security.SecuredAction;
import fr.wseduc.webutils.Either;

public class StatisticsController extends MongoDbControllerHelper {

	private final StatisticsService statsService;

	public static final String PARAM_SCHOOL_ID = "schoolId";
	public static final String PARAM_INDICATOR = "indicator";
	public static final String PARAM_START_DATE = "startDate";
	public static final String PARAM_END_DATE = "endDate";
	public static final String PARAM_MODULE = "module";


	public StatisticsController(String collection) {
		super(collection);
		statsService = new StatisticsServiceMongoImpl(collection);
	}

	private final static Set<String> indicators, modules;
	private final static JsonObject metadata;
	static {
		indicators = new HashSet<>();
		indicators.add(STATS_FIELD_UNIQUE_VISITORS);
		indicators.add(TRACE_TYPE_ACTIVATION);
		indicators.add(TRACE_TYPE_CONNEXION);
		indicators.add(TRACE_TYPE_SVC_ACCESS);

		modules = new HashSet<>();
		modules.add("Blog");
		modules.add("Workspace");
		modules.add("Conversation");
		modules.add("Actualites");
		modules.add("Support");
		modules.add("Community");
		modules.add("Forum");
		modules.add("Wiki");
		modules.add("Rbs");
		modules.add("Mindmap");
		modules.add("TimelineGenerator");
		modules.add("CollaborativeWall");
		modules.add("Poll");
		modules.add("Calendar");
		modules.add("AdminConsole");
		modules.add("Pages");
		modules.add("Rack");
		modules.add("Annuaire");
		modules.add("Archive");

		metadata = new JsonObject();
		metadata.putArray("indicators", new JsonArray(indicators.toArray()));
		metadata.putArray("modules", new JsonArray(modules.toArray()));
	}

	@Get("")
	@ApiDoc("Get HTML view")
	@SecuredAction("statistics.view")
	public void view(HttpServerRequest request) {
		renderView(request);
	}

	@Get("/indicators")
	@ApiDoc("Get existing indicators and modules")
	@SecuredAction("statistics.get.indicators")
	public void getIndicators(final HttpServerRequest request) {
		renderJson(request, metadata);
	}

	@Get("/data")
	@SecuredAction("statistics.get.data")
	public void getData(final HttpServerRequest request) {
		UserUtils.getUserInfos(eb, request, new Handler<UserInfos>() {
			@Override
			public void handle(final UserInfos user) {
				if (user != null) {
					// TODO : add error messages for all bad requests

					List<String> schoolIds = request.params().getAll(PARAM_SCHOOL_ID);
					if (schoolIds==null || schoolIds.size()==0 || !user.getStructures().containsAll(schoolIds)) {
						badRequest(request);
						return;
					};

					String indicator = request.params().get(PARAM_INDICATOR);
					if(indicator==null || indicator.trim().isEmpty() || !indicators.contains(indicator)) {
						badRequest(request);
						return;
					}

					String module = "";
					if(TRACE_TYPE_SVC_ACCESS.equals(indicator)) {
						module = request.params().get(PARAM_MODULE);
						if(module==null || module.trim().isEmpty() || !modules.contains(module)) {
							badRequest(request);
							return;
						}
					}

					String startDate = request.params().get(PARAM_START_DATE);
					String endDate = request.params().get(PARAM_END_DATE);
					long start, end;
					try {
						start = DateUtils.parseStringDate(startDate);
						end = DateUtils.parseStringDate(endDate);
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
					params.putString(PARAM_INDICATOR, indicator)
						.putNumber(PARAM_START_DATE, start)
						.putNumber(PARAM_END_DATE, end)
						.putString(PARAM_MODULE, module);

					statsService.getStats(schoolIds, params, new Handler<Either<String,JsonArray>>() {
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
