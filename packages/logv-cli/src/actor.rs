use futures::channel::{
	mpsc::Sender,
	oneshot::{channel, Canceled, Sender as OneshotSender},
};
use futures::sink::SinkExt;

pub async fn send_async<C, R, F>(
	chan: &mut Sender<C>,
	func: F,
) -> Result<R, Canceled>
where
	F: FnOnce(OneshotSender<R>) -> C,
{
	let (sender, receiver) = channel();
	let message = func(sender);
	chan.send(message).await.map_err(|_| Canceled)?;
	Ok(receiver.await?)
}
