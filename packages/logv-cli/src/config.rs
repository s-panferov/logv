use anyhow::Error;
use serde::Deserialize;

#[derive(Debug, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InputConfig {
	#[serde(default)]
	pub ignore: Vec<String>,
	pub message_path: Option<String>,
	pub level_path: Option<String>,
	pub date_format: Option<String>,
	pub date_path: Option<String>,
}

#[derive(Debug, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OutputConfig {
	#[serde(default)]
	pub ignore: Vec<String>,
	pub date_format: Option<String>,
}

#[derive(Debug, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WebConfig {
	#[serde(default)]
	pub ignore: Vec<String>,
}

#[derive(Debug, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Config {
	#[serde(default)]
	pub input: InputConfig,

	#[serde(default)]
	pub output: OutputConfig,

	#[serde(default)]
	pub web: WebConfig,
}

impl Config {
	pub fn read() -> Result<Config, Error> {
		let mut path = std::env::current_dir()?.to_owned();
		loop {
			let rc = path.join(".logvrc.json");
			if rc.exists() {
				let data = std::fs::read(&rc)?;
				return Ok(serde_json::from_slice(&data)?);
			} else {
				match path.parent() {
					Some(parent) => path = parent.to_owned(),
					None => break,
				}
			}
		}

		Ok(Config::default())
	}
}
