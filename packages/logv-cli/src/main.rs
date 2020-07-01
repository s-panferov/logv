#![allow(dead_code)]

#[macro_use]
extern crate serde;

use std::sync::Arc;

use clap::Clap;
use futures::sink::SinkExt;
use futures::stream::StreamExt;
use tokio::net::TcpListener;

mod actor;
mod config;
mod db;
mod install;
mod meta;
mod parser;
mod pretty;
mod selector;
mod socket;
mod store;
mod sub;
mod term;
mod view;

/// This doc string acts as a help message when the user runs '--help'
/// as do all doc strings on fields
#[derive(Clap)]
#[clap(version = "1.0", author = "Stanislav P.")]
struct Args {
	#[clap(subcommand)]
	cmd: Option<Sub>,

	#[clap(flatten)]
	run: RunArgs,
}

#[derive(Clap)]
enum Sub {
	#[clap(name = "install")]
	Install(InstallArgs),
}

#[derive(Clap)]
struct InstallArgs {}

#[derive(Clap)]
struct RunArgs {
	/// Sets a custom config file. Could have been an Option<T> with no default too
	#[clap(short = "s", long = "save")]
	save: bool,

	#[clap(short = "w", long = "web")]
	web: bool,
	// #[clap(short = "u", long = "ui")]
	// ui: bool,
}

#[derive(Serialize)]
struct Open<'a> {
	port: u16,
	path: &'a str,
}

#[tokio::main]
async fn main() -> std::io::Result<()> {
	let raw_conf = config::Config::read().unwrap();
	let config = Arc::new(raw_conf);

	let args = Args::parse();

	println!("{:#?}", config);

	match args.cmd {
		Some(Sub::Install(_opts)) => {
			let installer = install::CliInstaller::new();
			let _res = installer.install().unwrap();
			std::process::exit(0)
		}
		None => {}
	}

	std::env::set_var("RUST_LOG", "actix_web=info");

	let database = db::Database::new(".logv", args.run.save).unwrap();

	let mut term = crate::term::term_chan();

	let store = store::Store::new(database);

	let (mut parser, mut parsed_lines) = parser::Parser::new(config.clone());

	let mut store_1 = store.clone();
	let store_2 = store.clone();

	async_std::task::spawn(async move {
		// Move tasks from term to parser
		loop {
			let line = term.next().await;
			match line {
				Some(line) => {
					parser.send(parser::ParserReq::Line(line)).await.unwrap()
				}
				None => break,
			}
		}
	});

	async_std::task::spawn(async move {
		// Move tasks from parser to the pretty printer and to the store
		let mut pretty = crate::pretty::PrettyPrinter::new(config.clone());
		loop {
			let line = parsed_lines.next().await;
			match line {
				Some(line) => {
					pretty.print(line.clone()).await;
					let _ = store_1.send(store::StoreReq::Line(line)).await;
				}
				None => break,
			}
		}
	});

	let port: u32 = if cfg!(debug_assertions) { 8081 } else { 0 };
	let host = format!("0.0.0.0:{}", port);

	let mut server = TcpListener::bind(&host).await.expect("Can't listen");

	let socket = server.local_addr().unwrap();
	let port = socket.port();

	let start_url = if cfg!(debug_assertions) {
		format!("https://local.logv.app:8080/?p={}", port)
	} else {
		format!("https://ui.logv.app/?p={}", port)
	};

	if args.run.web {
		let _res = webbrowser::open(&start_url);
	} else if false {
		let path = std::env::current_dir().unwrap();
		let open = Open {
			path: &path.to_string_lossy(),
			port,
		};

		let params = serde_urlencoded::to_string(open).unwrap();
		let url = format!("logv://open?{}", params);

		println!("App url: {}", url);
		open::that(url).unwrap();
	}

	println!("Web url: {}", start_url);

	while let Ok((stream, _)) = server.accept().await {
		let peer = stream
			.peer_addr()
			.expect("connected streams should have a peer address");

		tokio::spawn(crate::socket::accept(peer, stream, store_2.clone()));
	}

	Ok(())
}
