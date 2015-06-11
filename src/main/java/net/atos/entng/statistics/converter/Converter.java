package net.atos.entng.statistics.converter;

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
	public static final String JSON_TO_CSV = "json_to_csv";

	@Override
	public void start() {
		super.start();
		// Register "Converter" as a local handler : it can only be reached by an instance of module "statistics"
		vertx.eventBus().registerLocalHandler(CONVERTER_ADDRESS, this);
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
		// TODO : format JSON before converting it to CSV (translate profiles and indicators, format dates, etc)
		JsonArray data = message.body().getArray(PARAM_DATA, null);
		JSONArray ja = new JSONArray(data.toString());
		String csv = CDL.toString(ja);

		sendOK(message, new JsonObject().putString("result", csv));
	}

}
