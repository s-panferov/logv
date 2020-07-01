use std::collections::HashMap;

use async_std::sync::RwLock;
use futures::channel::mpsc::Sender;
use futures::{SinkExt, TryFutureExt};
use uuid::Uuid;

pub struct Sub<T: Clone> {
	clients: RwLock<HashMap<Uuid, Sender<T>>>,
}

impl<T: Clone> Sub<T> {
	pub fn new() -> Sub<T> {
		Sub {
			clients: RwLock::new(HashMap::new()),
		}
	}

	pub async fn add(&self, id: Uuid, sender: Sender<T>) {
		let mut sub = self.clients.write().await; // FIXME block
		sub.insert(id, sender);
	}

	pub async fn remove(&self, id: Uuid) {
		let mut sub = self.clients.write().await; // FIXME block
		sub.remove(&id);
	}

	pub async fn send(&self, ev: T) {
		let mut sub = self.clients.read().await.clone();
		let futures = {
			let mut arr = Vec::with_capacity(sub.len());
			for (id, sender) in sub.iter_mut() {
				arr.push(sender.send(ev.clone()).map_err(move |_| id))
			}
			arr
		};

		let res = futures::future::join_all(futures.into_iter()).await;
		let mut sub = self.clients.write().await;
		for c in res {
			match c {
				Ok(_) => {}
				Err(id) => {
					sub.remove(id);
				}
			}
		}
	}
}
