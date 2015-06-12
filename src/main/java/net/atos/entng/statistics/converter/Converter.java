package net.atos.entng.statistics.converter;

import static net.atos.entng.statistics.services.StatisticsServiceMongoImpl.PROFILE_ID;
import static net.atos.entng.statistics.controllers.StatisticsController.PARAM_INDICATOR;

import fr.wseduc.webutils.I18n;
import org.json.CDL;
import org.json.JSONArray;
import org.vertx.java.busmods.BusModBase;
import org.vertx.java.core.Handler;
import org.vertx.java.core.eventbus.Message;
import org.vertx.java.core.json.JsonArray;
import org.vertx.java.core.json.JsonObject;

public class Converter extends BusModBase implements Handler<Message<JsonObject>> {

	public static final String CONVERTER_ADDRESS = "statistics.converter";
	public static final String PARAM_ACTION = "action";
	public static final String PARAM_DATA = "data";
	public static final String PARAM_ACCEPT_LANGUAGE = "acceptLanguage";
	public static final String JSON_TO_CSV = "json_to_csv";

	private I18n i18n;

	@Override
	public void start() {
		super.start();
		// Register "Converter" as a local handler : it can only be reached by an instance of module "statistics"
		vertx.eventBus().registerLocalHandler(CONVERTER_ADDRESS, this);
		i18n = I18n.getInstance();
		i18n.init(container, vertx);
	}

	@Override
	public void handle(Message<JsonObject> message) {
		JsonObject body = message.body();
		if(body == null || body.size() == 0) {
			sendError(message, "message body is null or empty");
			return;
		}

		String action = body.getString(PARAM_ACTION);
		if (action == null) {
			sendError(message, "action must be specified");
			return;
		}

		try {
			switch (action) {
			case JSON_TO_CSV:
				jsonToCsv(message);
				break;

			default:
				sendError(message, "Invalid action: " + action);
				break;
			}
		} catch (Exception e) {
			sendError(message, e.getMessage());
		}

	}

	private void jsonToCsv(Message<JsonObject> message) {
		final String acceptLanguage = message.body().getString(PARAM_ACCEPT_LANGUAGE);
		final JsonArray data = message.body().getArray(PARAM_DATA, null);
		final String indicator = message.body().getString(PARAM_INDICATOR);
		formatJsonData(data, acceptLanguage, indicator);

		JSONArray ja = new JSONArray(data.toString());
		String csv = CDL.toString(ja);

		sendOK(message, new JsonObject().putString("result", csv));
	}

	// format JSON data : translate profiles and indicators, format dates, etc.
	private void formatJsonData(JsonArray data, String acceptLanguage, String indicator) {
		for (int i = 0; i < data.size(); i++) {
			JsonObject jo = data.get(i);

			String indicatorLabel = i18n.translate(indicator, acceptLanguage);
			Number indicatorValue = jo.getNumber(indicator);
			jo.putNumber(indicatorLabel, indicatorValue);
			jo.removeField(indicator);

			String profile = jo.getString(PROFILE_ID);
			jo.removeField(PROFILE_ID);
			String profileLabel = i18n.translate("statistics.profile", acceptLanguage);
			String profileValue = i18n.translate(profile, acceptLanguage);
			jo.putString(profileLabel, profileValue);

			String date = jo.getString("date");
			if(date.length() > 7) { // Keep 'yyyy-MM' from 'yyyy-MM-dd HH:mm.ss.SSS'
				jo.putString("date", date.substring(0, 7));
			}
		}
	}

}
