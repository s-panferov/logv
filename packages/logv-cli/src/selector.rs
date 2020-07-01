use globset::{Glob, GlobMatcher};
use serde_json::Value;

#[derive(Debug)]
struct JsonGlob {
	original: String,
	matcher: GlobMatcher,
	is_whitelist: bool,
}

pub struct Selector {
	ignore: Vec<JsonGlob>,
}

impl Selector {
	pub fn new(ignore: &[String]) -> Selector {
		Selector {
			ignore: ignore
				.iter()
				.map(|sel| {
					let (is_whitelist, sel) = if sel.starts_with("!") {
						(true, sel[1..].to_owned())
					} else {
						(false, sel.to_owned())
					};

					let prepared = sel.replace(".", "/");
					let matcher =
						Glob::new(&prepared).unwrap().compile_matcher();

					JsonGlob {
						original: sel,
						matcher,
						is_whitelist,
					}
				})
				.collect(),
		}
	}

	pub fn process(&self, value: &mut Value) {
		Walker {
			path: "".to_owned(),
			value,
		}
		.walk(&|path| {
			let mut ignore = false;
			for glob in &self.ignore {
				if ignore && !glob.is_whitelist {
					// already ignored
					continue;
				}
				if glob.matcher.is_match(&path) {
					ignore = !glob.is_whitelist
				}
			}

			if ignore {
				WalkerResult::Ignore
			} else {
				WalkerResult::Preserve
			}
		})
	}
}

enum WalkerResult {
	Ignore,
	Preserve,
}

struct Walker<'a> {
	value: &'a mut Value,
	path: String,
}

impl<'a> Walker<'a> {
	fn walk<F>(self, func: &F)
	where
		F: Fn(&str) -> WalkerResult,
	{
		match self.value {
			Value::Null
			| Value::Bool(_)
			| Value::Number(_)
			| Value::String(_) => return,
			Value::Object(obj) => {
				let keys: Vec<String> = obj.keys().map(|k| k.clone()).collect();
				for key in keys {
					let path = if self.path.len() > 0 {
						self.path.clone() + "/" + &key
					} else {
						key.clone()
					};
					match func(&path) {
						WalkerResult::Ignore => {
							obj.remove(&key);
						}
						WalkerResult::Preserve => {
							let value = obj.get_mut(&key).unwrap();
							let walker = Walker { value, path };
							walker.walk(func);
						}
					}
				}
			}
			Value::Array(arr) => {
				for value in arr {
					let walker = Walker {
						value,
						path: self.path.clone(),
					};
					walker.walk(func);
				}
			}
		}
	}
}

#[derive(PartialEq, Debug)]
pub enum GetPathError<'a, 'v> {
	Primitive(&'a str, &'v Value),
	ParseError(std::num::ParseIntError),
}

pub fn get_path<'a, 'v>(
	path: &'a str,
	mut value: &'v Value,
) -> Result<Option<&'v Value>, GetPathError<'a, 'v>> {
	let keys = path.split(".");

	for key in keys {
		if key == "" {
			return Ok(Some(value));
		}

		match value {
			Value::String(_)
			| Value::Bool(_)
			| Value::Null
			| Value::Number(_) => return Err(GetPathError::Primitive(key, value)),
			Value::Array(arr) => {
				let idx: usize =
					key.parse().map_err(GetPathError::ParseError)?;

				let arr_value = arr.get(idx);
				match arr_value {
					Some(v) => value = v,
					None => return Ok(None),
				}
			}
			Value::Object(obj) => {
				let obj_value = obj.get(key);
				match obj_value {
					Some(v) => value = v,
					None => return Ok(None),
				}
			}
		}
	}

	return Ok(Some(value));
}

#[cfg(test)]
mod test {
	use super::*;
	use serde_json::{json, Value};

	#[test]
	fn test_get_path() {
		let obj = json!({
			"a": {
				"b": [{
					"c": "test"
				}]
			}
		});

		let value = get_path("a.b.0.c", &obj);
		assert_eq!(value, Ok(Some(&Value::String("test".to_owned()))));
	}
}
