use std::sync::Arc;

use serde_json::ser::PrettyFormatter;

use chrono::Local;
use colored_json::{ColorMode, ColoredFormatter, Output};

#[cfg(windows)]
use ansi_term::enable_ansi_support;
use ansi_term::Colour::Fixed;
use ansi_term::Style;

use async_std::io::Stdout;
use async_std::prelude::*;

use crate::config::Config;
use crate::parser::ParsedLine;
use crate::selector::Selector;

pub struct PrettyPrinter {
	writer: Stdout,
	selector: Arc<Selector>,
	config: Arc<Config>,
}

const DEFAULT_DATE_FORMAT: &str = "%Y-%m-%d %T";

impl PrettyPrinter {
	pub fn new(config: Arc<Config>) -> Self {
		PrettyPrinter {
			writer: async_std::io::stdout(),
			selector: Arc::new(Selector::new(&config.output.ignore)),
			config,
		}
	}

	pub async fn print(&mut self, mut line: ParsedLine) {
		let selector = self.selector.clone();
		let config = self.config.clone();
		let writer = async_std::task::spawn_blocking(move || {
			let mut writer: Vec<u8> = Vec::with_capacity(256);

			let message = format!(
				"[{}]{}:{} ",
				line.date.with_timezone(&Local).format(
					config
						.output
						.date_format
						.as_deref()
						.unwrap_or(DEFAULT_DATE_FORMAT)
				),
				line.meta
					.level
					.as_ref()
					.map(|l| format!(" {}", l))
					.unwrap_or(String::new()),
				line.meta
					.message
					.as_ref()
					.map(|m| format!(" {}", m))
					.unwrap_or(String::new()),
			);

			std::io::Write::write_fmt(&mut writer, format_args!("{}", message))
				.unwrap();

			selector.process(&mut line.body);

			ColoredFormatter::new(PrettyFormatter::new())
				.write_colored_json(
					&line.body,
					&mut writer,
					ColorMode::Auto(Output::StdOut),
				)
				.unwrap();

			std::io::Write::write_fmt(&mut writer, format_args!("\n")).unwrap();

			writer
		})
		.await;

		let style = Style::new().on(Fixed(250)).paint(writer);

		{
			self.writer.write_all(&style).await.unwrap();
			self.writer.flush().await.unwrap()
		}
	}
}
