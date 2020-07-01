use chrono::{DateTime, Local};
use futures::{
	channel::mpsc::{channel, Receiver},
	sink::SinkExt,
};

pub struct Line {
	pub date: DateTime<Local>,
	pub text: String,
}

pub fn term_chan() -> Receiver<Line> {
	let (mut sender, receiver) = channel(1000);

	async_std::task::spawn(async move {
		let stdin = async_std::io::stdin();
		loop {
			let mut text = String::new();
			stdin
				.read_line(&mut text)
				.await
				.expect("Failed to read a line");

			text = text.trim().to_owned();
			if text.is_empty() {
				// Skip empty lines here
				continue;
			}

			let date = Local::now();
			let event = Line { date, text };

			sender.send(event).await.expect("Send");
		}
	});

	receiver
}
