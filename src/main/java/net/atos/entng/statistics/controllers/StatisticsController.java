package net.atos.entng.statistics.controllers;

import static fr.wseduc.webutils.I18n.acceptLanguage;
import static net.atos.entng.statistics.aggregation.indicators.IndicatorFactory.STATS_FIELD_UNIQUE_VISITORS;
import static org.entcore.common.aggregation.MongoConstants.TRACE_TYPE_ACTIVATION;
import static org.entcore.common.aggregation.MongoConstants.TRACE_TYPE_CONNEXION;
import static org.entcore.common.aggregation.MongoConstants.TRACE_TYPE_SVC_ACCESS;

import fr.wseduc.webutils.I18n;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import net.atos.entng.statistics.DateUtils;
import net.atos.entng.statistics.services.StatisticsService;
import net.atos.entng.statistics.services.StatisticsServiceMongoImpl;
import net.atos.entng.statistics.services.StructureService;
import net.atos.entng.statistics.services.StructureServiceNeo4jImpl;

import org.entcore.common.mongodb.MongoDbControllerHelper;
import org.entcore.common.user.DefaultFunctions;
import org.entcore.common.user.UserInfos;
import org.entcore.common.user.UserInfos.Function;
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
	private final StructureService structureService;
	private I18n i18n;

	public static final String PARAM_SCHOOL_ID = "schoolId";
	public static final String PARAM_INDICATOR = "indicator";
	public static final String PARAM_START_DATE = "startDate";
	public static final String PARAM_END_DATE = "endDate";
	public static final String PARAM_MODULE = "module";
	public static final String PARAM_FORMAT = "format";

	private final Set<String> indicators;
	private final JsonObject metadata;
	private final JsonArray accessModules;

	public StatisticsController(String collection, JsonArray pAccessModules) {
		super(collection);
		statsService = new StatisticsServiceMongoImpl(collection);
		structureService = new StructureServiceNeo4jImpl();
		i18n = I18n.getInstance();

		indicators = new HashSet<>();
		indicators.add(STATS_FIELD_UNIQUE_VISITORS);
		indicators.add(TRACE_TYPE_ACTIVATION);
		indicators.add(TRACE_TYPE_CONNEXION);
		indicators.add(TRACE_TYPE_SVC_ACCESS);

		metadata = new JsonObject();
		metadata.putArray("indicators", new JsonArray(indicators.toArray()));
		metadata.putArray("modules", pAccessModules);
		accessModules = pAccessModules;
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
					final List<String> schoolIds = request.params().getAll(PARAM_SCHOOL_ID);
					if (schoolIds==null || schoolIds.size()==0 || !isValidSchools(user, schoolIds)) {
						String errorMsg = i18n.translate("statistics.bad.request.invalid.schools", acceptLanguage(request));
						badRequest(request, errorMsg);
						return;
					};

					final String indicator = request.params().get(PARAM_INDICATOR);
					if(indicator==null || indicator.trim().isEmpty() || !indicators.contains(indicator)) {
						String errorMsg = i18n.translate("statistics.bad.request.invalid.indicator", acceptLanguage(request));
						badRequest(request, errorMsg);
						return;
					}

					String module = "";
					if(TRACE_TYPE_SVC_ACCESS.equals(indicator)) {
						module = request.params().get(PARAM_MODULE);
						if(module!=null && !module.trim().isEmpty() && !accessModules.contains(module)) {
							String errorMsg = i18n.translate("statistics.bad.request.invalid.module", acceptLanguage(request));
							badRequest(request, errorMsg);
							return;
						}
						// Else (when module is not specified), return data for all modules
					}

					String startDate = request.params().get(PARAM_START_DATE);
					String endDate = request.params().get(PARAM_END_DATE);
					long start, end;
					try {
						start = DateUtils.parseStringDate(startDate);
						end = DateUtils.parseStringDate(endDate);
						if(end < start || end < 0L || start < 0L) {
							String errorMsg = i18n.translate("statistics.bad.request.invalid.dates", acceptLanguage(request));
							badRequest(request, errorMsg);
							return;
						}
					} catch (Exception e) {
						log.error("Error when casting startDate or endDate to long", e);
						String errorMsg = i18n.translate("statistics.bad.request.invalid.date.format", acceptLanguage(request));
						badRequest(request, errorMsg);
						return;
					}

					JsonObject params = new JsonObject();
					params.putString(PARAM_INDICATOR, indicator)
						.putNumber(PARAM_START_DATE, start)
						.putNumber(PARAM_END_DATE, end)
						.putString(PARAM_MODULE, module);

					String format = request.params().get(PARAM_FORMAT);
					if(format!=null && !format.isEmpty()) {
						if(!"csv".equals(format)) {
							String errorMsg = i18n.translate("statistics.bad.request.invalid.export.format", acceptLanguage(request));
							badRequest(request, errorMsg);
							return;
						}

						// Return data as csv
						statsService.getStatsForExport(schoolIds, params, new Handler<Either<String,JsonArray>>() {
							@Override
							public void handle(Either<String, JsonArray> event) {
								if(event.isLeft()) {
									log.error(event.left().getValue());
									renderError(request);
								}
								else {
									JsonObject params = new JsonObject()
										.putBoolean("is"+indicator, true)
										.putArray("list", event.right().getValue())
										.putString("indicator", indicator);

									processTemplate(request, "text/export.txt", params, new Handler<String>() {
										@Override
										public void handle(final String export) {
											if (export != null) {
												request.response().putHeader("Content-Type", "application/csv");
												request.response().putHeader("Content-Disposition",
														"attachment; filename=export.csv");
												request.response().end(export);
											} else {
												renderError(request);
											}
										}
									});

								}
							}
						});
					}
					else {
						// Return JSON data
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
					}

				} else {
					log.debug("User not found in session.");
					unauthorized(request);
				}
			}
		});
	}

	private boolean isValidSchools(UserInfos user, Collection<String> schoolIds) {
		Set<String> validSchoolIds = new HashSet<>(user.getStructures());

		Map<String, Function> functions = user.getFunctions();
		if(functions!=null && functions.containsKey(DefaultFunctions.ADMIN_LOCAL)) {
			List<String> scope = functions.get(DefaultFunctions.ADMIN_LOCAL).getScope();
			validSchoolIds.addAll(scope);
		}

		return validSchoolIds.containsAll(schoolIds);
	}

	@Get("/structures")
	@ApiDoc("Get structures' names, UAIs and cities")
	@SecuredAction("statistics.get.structures")
	public void getStructures(final HttpServerRequest request) {
		UserUtils.getUserInfos(eb, request, new Handler<UserInfos>() {
			@Override
			public void handle(final UserInfos user) {
				if (user != null) {
					List<String> schoolIds = request.params().getAll(PARAM_SCHOOL_ID);
					if (schoolIds==null || schoolIds.size()==0 || !isValidSchools(user, schoolIds)) {
						String errorMsg = i18n.translate("statistics.bad.request.invalid.schools", acceptLanguage(request));
						badRequest(request, errorMsg);
						return;
					};

					JsonArray structureIds = new JsonArray();
					for (String school : schoolIds) {
						structureIds.addString(school);
					}

					structureService.list(structureIds, new Handler<Either<String,JsonArray>>() {
						@Override
						public void handle(Either<String, JsonArray> event) {
							if(event.isLeft()) {
								log.error(event.left().getValue());
								renderError(request);
							}
							else if(event.isRight()) {
								renderJson(request, event.right().getValue());
							}
						}
					});
				}
			}
		});
	}

}
