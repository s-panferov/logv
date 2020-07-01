use std::sync::Arc;

use tokio::task::spawn_blocking;
use uuid::Uuid;

use futures::{
	channel::mpsc::{channel, Sender},
	channel::oneshot::Sender as OneshotSender,
	sink::SinkExt,
	stream::StreamExt,
};

use crate::db::Database;
use crate::parser::ParsedLine;
use crate::sub::Sub;

pub type StoreAddr = Sender<StoreReq>;

#[derive(Serialize)]
pub struct NewLine {
	pub line: ParsedLine,
	pub total: i64,
}

#[derive(Serialize)]
pub struct UpdateTotal {
	pub total: i64,
}

#[derive(Serialize)]
#[serde(tag = "type")]
pub enum StoreEvent {
	UpdateTotal(UpdateTotal),
	NewLine(NewLine),
}

pub struct SerializedStoreEvent {
	pub event: StoreEvent,
	pub serialized: String,
}

#[derive(Deserialize, Debug)]
pub struct RangeQuery {
	pub from: i64,
	pub to: i64,
}

pub type RangeRequest = (RangeQuery, OneshotSender<Vec<ParsedLine>>);
pub type ReadRequest = (Vec<i64>, OneshotSender<Vec<ParsedLine>>);
pub type StatRequest = OneshotSender<i64>;
pub type IterRequest = Sender<ParsedLine>;

impl SerializedStoreEvent {
	fn new(event: StoreEvent) -> Arc<Self> {
		let serialized = serde_json::to_string(&event).unwrap();
		Arc::new(SerializedStoreEvent { event, serialized })
	}
}

pub enum StoreReq {
	Line(ParsedLine),
	Subscribe(Uuid, Sender<Arc<SerializedStoreEvent>>),
	Range(RangeRequest),
	Read(ReadRequest),
	Stat(StatRequest),
	Unsubscribe(Uuid),
	Iter(IterRequest),
}

pub struct Store {
	database: Database,
	sub: Sub<Arc<SerializedStoreEvent>>,
}

impl Store {
	pub fn new(database: Database) -> Sender<StoreReq> {
		let store = Arc::new(Store {
			database,
			sub: Sub::new(),
		});

		let (sender, mut receiver) = channel(1000);
		tokio::spawn(async move {
			loop {
				let msg = receiver.next().await;
				match msg {
					Some(msg) => store.clone().handle(msg).await,
					None => return,
				}
			}
		});

		sender
	}

	async fn handle(self: Arc<Self>, msg: StoreReq) {
		match msg {
			StoreReq::Line(ev) => self.handle_insert(ev).await,
			StoreReq::Subscribe(id, mut sender) => {
				let _ = sender
					.send(SerializedStoreEvent::new(StoreEvent::UpdateTotal(
						UpdateTotal {
							total: self.database.total() as i64,
						},
					)))
					.await;

				self.sub.add(id, sender).await
			}
			StoreReq::Unsubscribe(id) => self.sub.remove(id).await,
			StoreReq::Range(req) => self.handle_range(req).await,
			StoreReq::Read(req) => self.handle_read(req).await,
			StoreReq::Stat(req) => self.handle_stat(req).await,
			StoreReq::Iter(req) => self.handle_iter(req).await,
		}
	}

	async fn handle_range(self: Arc<Self>, req: RangeRequest) {
		let (RangeQuery { from, to }, answer) = req;
		let this = self.clone();
		let res = spawn_blocking(move || {
			this.database.range(from, to).unwrap_or_else(|e| {
				println!("{:?}", e);
				vec![]
			})
		})
		.await
		.unwrap();
		let _ = answer.send(res);
	}

	async fn handle_read(self: Arc<Self>, req: ReadRequest) {
		let (items, answer) = req;
		let this = self.clone();
		let res = spawn_blocking(move || {
			this.database.read(items).unwrap_or_else(|e| {
				println!("{:?}", e);
				vec![]
			})
		})
		.await
		.unwrap();

		let _ = answer.send(res);
	}

	async fn handle_stat(self: Arc<Self>, req: StatRequest) {
		let this = self.clone();
		let res = spawn_blocking(move || this.database.total()).await.unwrap();
		let _ = req.send(res as i64);
	}

	async fn handle_iter(self: Arc<Self>, mut req: IterRequest) {
		let this = self.clone();

		spawn_blocking(move || {
			let mut rt = tokio::runtime::Runtime::new().unwrap();
			let iter = this.database.iter_all();
			for line in iter {
				let res = rt.block_on(req.send(line));
				if res.is_err() {
					break;
				}
			}
		});
	}

	async fn handle_insert(self: Arc<Self>, line: ParsedLine) {
		let this = self.clone();
		let line = spawn_blocking(move || this.database.insert(line).unwrap())
			.await
			.unwrap();

		let total = line.id.unwrap() + 1;
		let new_line = NewLine { line, total };

		self.sub
			.send(SerializedStoreEvent::new(StoreEvent::NewLine(new_line)))
			.await;
	}
}
