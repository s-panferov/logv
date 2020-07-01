use std::sync::Arc;

use chrono::{DateTime, Local};
use serde_json::json;
use tokio::sync::Mutex;
use tokio::task;

use futures::{
	channel::mpsc::{channel, Receiver, Sender},
	sink::SinkExt,
	stream::StreamExt,
};

use crate::config::Config;
use crate::meta::{parse_meta, MessageMeta};
use crate::selector::Selector;
use crate::term::Line;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParsedLine {
	pub id: Option<i64>,
	pub date: DateTime<Local>,
	pub body: serde_json::Value,
	pub meta: MessageMeta,
}

pub enum ParserReq {
	Line(Line),
}

pub struct Parser {
	parsed_lines: Mutex<Sender<ParsedLine>>,
	selector: Selector,
	config: Arc<Config>,
}

impl Parser {
	pub fn new(
		config: Arc<Config>,
	) -> (Sender<ParserReq>, Receiver<ParsedLine>) {
		let selector = Selector::new(&config.input.ignore);
		let (parsed_lines_sender, parsed_lines_receiver) = channel(1000);

		let parser = Arc::new(Parser {
			parsed_lines: Mutex::new(parsed_lines_sender),
			config,
			selector,
		});

		let (sender, mut receiver) = channel(1000);

		tokio::spawn(async move {
			loop {
				let msg = receiver.next().await;
				match msg {
					Some(msg) => parser.clone().handle(msg).await,
					None => return,
				}
			}
		});

		(sender, parsed_lines_receiver)
	}

	async fn handle(self: Arc<Self>, msg: ParserReq) {
		match msg {
			ParserReq::Line(line) => self.handle_line(line).await,
		}
	}

	async fn handle_line(self: Arc<Self>, line: Line) {
		let this = self.clone();
		let line = task::spawn_blocking(move || {
			let obj = serde_json::from_str(&line.text);
			let mut obj = match obj {
				Ok(j) => j,
				Err(_) => json!({ "message": line.text }),
			};

			this.selector.process(&mut obj);
			let meta = parse_meta(&obj, &this.config.input);

			ParsedLine {
				id: None,
				date: meta
					.date
					.map(|date| date.with_timezone(&chrono::Local))
					.unwrap_or(line.date),
				body: obj,
				meta,
			}
		})
		.await
		.unwrap();

		self.parsed_lines.lock().await.send(line).await.unwrap()
	}
}
