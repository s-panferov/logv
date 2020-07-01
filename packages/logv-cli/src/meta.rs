use crate::config::InputConfig;
use crate::selector::get_path;
use serde_json::Value;

use chrono::{DateTime, FixedOffset};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MessageMeta {
	pub message: Option<String>,
	pub date: Option<DateTime<FixedOffset>>,
	pub level: Option<String>,
}

const DEFAULT_DATE_FORMAT: &str = "%s";

pub fn parse_meta(value: &Value, config: &InputConfig) -> MessageMeta {
	let mut message: Option<String> = None;
	let mut level: Option<String> = None;
	let mut raw_date: Option<String> = None;

	let mut level_found = false;
	let mut message_found = false;
	let mut date_found = false;

	if config.message_path.is_some() {
		message = get_path(config.message_path.as_deref().unwrap(), value)
			.unwrap_or(None)
			.and_then(|v| v.as_str())
			.map(|v| v.to_owned());
		message_found = true;
	}

	if config.level_path.is_some() {
		level = get_path(config.level_path.as_deref().unwrap(), value)
			.unwrap_or(None)
			.and_then(|v| v.as_str())
			.map(|v| v.to_owned());
		level_found = true;
	}

	if config.date_path.is_some() {
		raw_date = get_path(config.date_path.as_deref().unwrap(), value)
			.unwrap_or(None)
			.and_then(|v| v.as_str())
			.map(|v| v.to_owned());
		date_found = true;
	}

	walk(Key::String("root"), value, 0, &mut |k, v, _l| {
		if !v.is_string() {
			return false;
		}

		match k {
			Key::String(k) => match *k {
				"message" | "msg" => {
					if !message_found {
						message =
							Some(v.as_str().map(|v| v.to_owned()).unwrap());
						message_found = true;
					}
				}
				"level" | "lvl" => {
					if !level_found {
						level = Some(v.as_str().map(|v| v.to_owned()).unwrap());
						level_found = true;
					}
				}
				"datetime" | "time" | "date" => {
					if !date_found {
						raw_date =
							Some(v.as_str().map(|v| v.to_owned()).unwrap());
						date_found = true;
					}
				}
				_ => {}
			},
			Key::Number(_) => {}
		}

		return date_found && level_found && message_found;
	});

	let date = raw_date.and_then(|date| {
		DateTime::parse_from_str(
			&date,
			config.date_format.as_deref().unwrap_or(DEFAULT_DATE_FORMAT),
		)
		.ok()
	});

	MessageMeta {
		message,
		date,
		level,
	}
}

enum Key<'a> {
	Number(usize),
	String(&'a str),
}

fn walk<'a>(
	key: Key,
	value: &'a Value,
	level: i8,
	visitor: &mut dyn FnMut(&Key, &'a serde_json::Value, i8) -> bool,
) -> bool {
	match value {
		Value::Null | Value::String(_) | Value::Number(_) | Value::Bool(_) => {
			if visitor(&key, value, level) {
				return true;
			}
		}
		Value::Array(a) => {
			for (index, value) in a.iter().enumerate() {
				if walk(Key::Number(index), value, level + 1, visitor) {
					return true;
				}
			}
		}
		Value::Object(o) => {
			for (key, value) in o.iter() {
				if walk(Key::String(key), value, level + 1, visitor) {
					return true;
				}
			}
		}
	}

	return false;
}
