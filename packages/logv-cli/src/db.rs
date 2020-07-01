use sled::{Config, Db, Error, Transactional, Tree};
use std::convert::TryInto;

use crate::parser::ParsedLine;

pub struct Database {
	db: Db,
	logs: Tree,
	meta: Tree,
}

#[derive(Debug)]
pub enum DatabaseError {
	OpenError(Error),
	InsertError(ParsedLine, Error),
}

impl Database {
	pub fn new(name: &str, save: bool) -> Result<Self, Error> {
		let db = Config::default().path(name).temporary(!save).open()?;

		let logs = db.open_tree("logs")?;
		let meta = db.open_tree("meta")?;

		if !meta.contains_key("total")? {
			meta.insert("total", &0u64.to_be_bytes())?;
		}

		Ok(Database { db, logs, meta })
	}

	pub fn insert(&self, ev: ParsedLine) -> Result<ParsedLine, Error> {
		let ev = std::cell::RefCell::new(ev);
		let _: sled::transaction::TransactionResult<(), ()> =
			(&self.logs, &self.meta).transaction(|(logs, meta)| {
				let total_ivec = meta.get("total")?.unwrap();
				let mut total =
					u64::from_be_bytes(total_ivec.as_ref().try_into().unwrap());

				total += 1;

				meta.insert("total", total.to_be_bytes().to_vec())?;

				let mut ev_mut = ev.borrow_mut();
				let id = total - 1;
				ev_mut.id = Some(id as i64);

				std::mem::drop(ev_mut);

				let _ = logs.insert(
					id.to_be_bytes().to_vec(),
					serde_json::to_vec(&ev).unwrap(),
				)?;

				Ok(())
			});

		Ok(ev.into_inner())
	}

	pub fn range(&self, from: i64, to: i64) -> Result<Vec<ParsedLine>, Error> {
		let from = from.to_be_bytes();
		let to = to.to_be_bytes();

		Ok(self
			.logs
			.range(from..=to)
			.filter(|res| res.is_ok())
			.map(|res| res.unwrap())
			.map(|(_, v)| serde_json::from_slice(v.as_ref()).unwrap())
			.collect())
	}

	pub fn read(&self, read: Vec<i64>) -> Result<Vec<ParsedLine>, Error> {
		Ok(read
			.iter()
			.map(|id| id.to_be_bytes())
			.map(|id| self.logs.get(id))
			.filter(|res| res.is_ok())
			.map(|res| res.unwrap())
			.filter(|res| res.is_some())
			.map(|res| res.unwrap())
			.map(|v| serde_json::from_slice(v.as_ref()).unwrap())
			.collect())
	}

	pub fn total(&self) -> u64 {
		let bytes = self.meta.get("total").unwrap().unwrap();
		u64::from_be_bytes(bytes.as_ref().try_into().unwrap())
	}

	pub fn iter_all(&self) -> impl Iterator<Item = ParsedLine> {
		self.logs
			.iter()
			.rev()
			.filter(|res| res.is_ok())
			.map(|res| res.unwrap())
			.map(|(_, v)| serde_json::from_slice(v.as_ref()).unwrap())
	}

	pub fn id(&self) -> u64 {
		self.db.generate_id().unwrap()
	}
}

pub type FilterFn = Box<dyn Fn(ParsedLine) -> bool>;

fn increment(old: Option<&[u8]>) -> Option<Vec<u8>> {
	let number = match old {
		Some(bytes) => {
			let array: [u8; 8] = bytes.try_into().unwrap();
			let number = u64::from_be_bytes(array);
			number + 1
		}
		None => 0,
	};

	Some(number.to_be_bytes().to_vec())
}
