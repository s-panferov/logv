use std::collections::{BTreeMap, BTreeSet};
use std::sync::Arc;

use async_std::sync::Mutex;
use futures::channel::mpsc::{channel, Sender};
use futures::channel::oneshot::{
	channel as oneshot, Receiver as OneshotReceiver,
};
use futures::SinkExt;
use tokio::stream::StreamExt;
use uuid::Uuid;

use crate::parser::ParsedLine;
use crate::store::{RangeQuery, StoreAddr, StoreEvent, StoreReq};
use crate::sub::Sub;

pub struct View {
	id: Uuid,
	query: String,
	matches: BTreeSet<i64>,
	top_idx: Option<i64>,
	bottom_idx: Option<i64>,
	idx_map: BTreeMap<i64, i64>,
	store: StoreAddr,
	store_sub: Option<OneshotReceiver<()>>,
	filter_sub: Option<OneshotReceiver<()>>,
	sub: Sub<Arc<ViewEvent>>,
}

#[derive(Serialize)]
pub struct ViewEvent {
	total: i64,
	max: Option<i64>,
	line: Option<ParsedLine>,
}

const LINE_ID_WARN: &str = "Line id should be present here";

impl View {
	pub async fn new(
		id: Uuid,
		query: String,
		store: StoreAddr,
	) -> Arc<Mutex<View>> {
		let has_query = query.len() != 0;
		let view = Arc::new(Mutex::new(View {
			id,
			query: query.clone(),
			matches: BTreeSet::new(),
			store,
			top_idx: None,
			bottom_idx: None,
			idx_map: BTreeMap::new(),
			store_sub: None,
			filter_sub: None,
			sub: Sub::new(),
		}));

		View::subscribe_store(view.clone()).await;

		if has_query {
			View::filter(view.clone(), query).await;
		}

		view
	}

	pub async fn subscribe(
		view_arc: Arc<Mutex<Self>>,
		id: uuid::Uuid,
		sender: Sender<Arc<ViewEvent>>,
	) {
		let view = view_arc.lock().await;
		view.sub.add(id, sender).await;
	}

	pub async fn unsubscribe(view_arc: Arc<Mutex<Self>>, id: uuid::Uuid) {
		let view = view_arc.lock().await;
		view.sub.remove(id).await;
	}

	async fn subscribe_store(view_arc: Arc<Mutex<Self>>) {
		let mut view = view_arc.lock().await;

		let (send, mut recv) = channel(100);
		let id = view.id.clone();
		view.store
			.send(StoreReq::Subscribe(id, send))
			.await
			.unwrap();

		let (token, handler) = oneshot::<()>();

		std::mem::swap(&mut view.store_sub, &mut Some(handler));
		std::mem::drop(view);

		tokio::spawn(async move {
			loop {
				if token.is_canceled() {
					break;
				}

				let ev = recv.next().await;

				if token.is_canceled() {
					break;
				}

				let mut view = view_arc.lock().await;

				match ev {
					Some(ev) => match &ev.event {
						StoreEvent::UpdateTotal(ev) => {
							if view.query.len() == 0 {
								view.sub
									.send(Arc::new(ViewEvent {
										total: ev.total,
										max: if ev.total > 0 {
											Some(ev.total - 1)
										} else {
											None
										},
										line: None,
									}))
									.await;
							}
						}
						StoreEvent::NewLine(new) => {
							if view.query.len() == 0 {
								view.sub
									.send(Arc::new(ViewEvent {
										total: new.total,
										max: Some(new.total - 1),
										line: Some(new.line.clone()),
									}))
									.await;
							} else {
								view.add_line(&new.line, true).await
							}
						}
					},
					None => {
						break;
					}
				}
			}
		});
	}

	pub async fn range(
		view_arc: Arc<Mutex<Self>>,
		req: RangeQuery,
	) -> Vec<ParsedLine> {
		let mut view = view_arc.lock().await;
		let lines = if view.query.len() == 0 {
			crate::actor::send_async(&mut view.store, move |s| {
				StoreReq::Range((req, s))
			})
			.await
			.unwrap()
		} else {
			let items = view
				.idx_map
				.range(req.from..=req.to)
				.map(|(_, v)| v)
				.cloned()
				.collect();

			crate::actor::send_async(&mut view.store, move |s| {
				StoreReq::Read((items, s))
			})
			.await
			.unwrap()
			.into_iter()
			.zip(req.from..=req.to)
			.map(|(mut line, id)| {
				line.id = Some(id);
				line
			})
			.collect()
		};

		lines
	}

	pub async fn filter(view_arc: Arc<Mutex<Self>>, query: String) {
		let mut view = view_arc.lock().await;

		view.matches = BTreeSet::new();
		view.query = query;

		let (token, handler) = oneshot::<()>();
		view.filter_sub = Some(handler);

		view.top_idx = None;
		view.bottom_idx = None;
		view.idx_map.clear();

		if view.query.len() == 0 {
			let total = crate::actor::send_async(&mut view.store, move |s| {
				StoreReq::Stat(s)
			})
			.await
			.unwrap();

			view.sub
				.send(Arc::new(ViewEvent {
					total,
					max: Some(total - 1),
					line: None,
				}))
				.await;
			return;
		} else {
			view.sub
				.send(Arc::new(ViewEvent {
					total: 0,
					max: None,
					line: None,
				}))
				.await;
		}

		let (send, mut recv) = channel(100);
		view.store.send(StoreReq::Iter(send)).await.unwrap();
		std::mem::drop(view);

		tokio::spawn(async move {
			loop {
				if token.is_canceled() {
					break;
				}

				let ev = recv.next().await;

				if token.is_canceled() {
					break;
				}

				match ev {
					Some(ev) => {
						let mut view = view_arc.lock().await;
						view.add_line(&ev, false).await
					}
					None => {
						break;
					}
				}
			}
		});
	}

	fn matches(line: &ParsedLine, query: &str) -> bool {
		match &line.meta.message {
			Some(msg) => msg.contains(query),
			None => false,
		}
	}

	async fn add_line(&mut self, line: &ParsedLine, front: bool) {
		if Self::matches(line, &self.query) {
			let id = line.id.expect(LINE_ID_WARN);
			if front {
				self.matches.insert(id);

				if self.top_idx.is_none() {
					self.top_idx = Some(0)
				};

				let view_id = self.top_idx.unwrap();

				self.top_idx = Some(view_id + 1);
				self.idx_map.insert(view_id, id);

				let mut line = line.clone();
				line.id = Some(view_id);

				self.sub
					.send(Arc::new(ViewEvent {
						total: self.matches.len() as i64,
						max: Some(view_id),
						line: Some(line),
					}))
					.await;
			} else {
				self.matches.insert(id);

				if self.bottom_idx.is_none() {
					self.bottom_idx = Some(-1)
				};

				let view_id = self.bottom_idx.unwrap();

				self.bottom_idx = Some(view_id - 1);
				self.idx_map.insert(view_id, id);

				let mut line = line.clone();
				line.id = Some(view_id);

				self.sub
					.send(Arc::new(ViewEvent {
						total: self.matches.len() as i64,
						max: self.top_idx,
						line: if view_id > -100 { Some(line) } else { None },
					}))
					.await;
			}
		}
	}
}
