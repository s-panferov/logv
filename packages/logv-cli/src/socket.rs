use async_std::sync::Mutex;
use futures::{SinkExt, StreamExt};
use std::net::SocketAddr;
use std::sync::Arc;
use tokio::net::TcpStream;
use tokio_tungstenite::accept_async;
use tungstenite::{Error as SocketError, Message};
use uuid::Uuid;

use crate::parser::ParsedLine;
use crate::store::{RangeQuery, StoreReq};
use crate::view::{View, ViewEvent};

use futures::channel::mpsc::{channel, Sender};

pub async fn accept(
	peer: SocketAddr,
	stream: TcpStream,
	store: Sender<StoreReq>,
) {
	if let Err(err) = handle(peer, stream, store).await {
		println!("Error processing connection: {:?}", err);
	}
}

#[derive(Deserialize, Debug)]
#[serde(rename_all(deserialize = "snake_case"))]
#[serde(tag = "type")]
pub enum ClientRequest {
	Range { id: Uuid, range: RangeQuery },
	Query { id: Uuid, query: String },
}

#[derive(Serialize)]
#[serde(rename_all(serialize = "camelCase"))]
#[serde(tag = "type")]
pub enum ClientResponse {
	Range { id: Uuid, lines: Vec<ParsedLine> },
	Query { id: Uuid },
	Event(Arc<ViewEvent>),
}

#[derive(Debug)]
enum ClientError {
	SocketError(SocketError),
	ParseError(serde_json::Error),
	NotReady,
	Canceled,
}

async fn handle(
	_peer: SocketAddr,
	stream: TcpStream,
	store: Sender<StoreReq>,
) -> Result<(), ClientError> {
	let stream = accept_async(stream).await.expect("Failed to accept");

	let (outgoing, mut incomming) = stream.split();
	let outgoing = Arc::new(Mutex::new(outgoing));

	let id = uuid::Uuid::new_v4();
	let view = View::new(uuid::Uuid::new_v4(), "".to_string(), store).await;

	let (sender, mut receiver) = channel(100);
	View::subscribe(view.clone(), id, sender).await;

	let outgoing_ = outgoing.clone();

	tokio::spawn(async move {
		while let Some(msg) = receiver.next().await {
			let res = outgoing_
				.clone()
				.lock()
				.await
				.send(Message::Text(
					serde_json::to_string(&ClientResponse::Event(msg)).unwrap(),
				))
				.await;

			match res {
				Err(_) => {
					break;
				}
				_ => {}
			}
		}
	});

	while let Some(msg) = incomming.next().await {
		let msg = msg.map_err(ClientError::SocketError)?;

		match msg {
			Message::Text(bytes) => {
				let client_message: ClientRequest =
					serde_json::from_str(&bytes)
						.map_err(ClientError::ParseError)?;

				match client_message {
					ClientRequest::Range { id, range } => {
						let lines = View::range(view.clone(), range).await;
						outgoing
							.clone()
							.lock()
							.await
							.send(Message::Text(
								serde_json::to_string(&ClientResponse::Range {
									id,
									lines,
								})
								.map_err(ClientError::ParseError)?,
							))
							.await
							.map_err(ClientError::SocketError)?
					}
					ClientRequest::Query { id, query } => {
						View::filter(view.clone(), query).await;
						outgoing
							.clone()
							.lock()
							.await
							.send(Message::Text(
								serde_json::to_string(&ClientResponse::Query {
									id,
								})
								.map_err(ClientError::ParseError)?,
							))
							.await
							.map_err(ClientError::SocketError)?
					}
				}
			}
			_ => {}
		}
	}

	Ok(())
}
