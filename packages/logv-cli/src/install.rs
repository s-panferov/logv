use directories::ProjectDirs;
use std::fs;
use std::io::ErrorKind;
use std::path::PathBuf;
use std::str::FromStr;
use thiserror::Error;

pub fn app_dir() -> PathBuf {
	ProjectDirs::from("dev", "", "logv")
		.unwrap()
		.config_dir()
		.to_owned()
}

pub struct CliInstaller {
	target: PathBuf,
	binary: PathBuf,
}

#[derive(Error, Debug)]
pub enum CliInstallerError {
	#[error("Permission denied")]
	PermissionDenied,
	#[error("Permission denied")]
	IoError(std::io::Error),
}

pub enum InstallationStatus {
	NotExists,
	WrongLink,
	Ok,
}

impl CliInstaller {
	pub fn new() -> CliInstaller {
		let binary = std::env::current_exe().unwrap();
		let binary = match std::fs::read_link(&binary) {
			Ok(path) => path,
			Err(_) => binary,
		};

		CliInstaller {
			target: PathBuf::from_str("/usr/local/bin/logv").unwrap(),
			binary,
		}
	}

	pub fn is_installed(&self) -> InstallationStatus {
		let info = fs::read_link(&self.target);
		match info {
			Ok(path) => {
				let correct = path == self.binary;
				if !correct {
					println!("Symlink exists, but points to a wrong location");
				} else {
					println!("Symlink exists");
				}
				if correct {
					InstallationStatus::Ok
				} else {
					InstallationStatus::WrongLink
				}
			}
			Err(_) => {
				println!("Symlink does not exists");
				InstallationStatus::NotExists
			}
		}
	}

	pub fn install(&self) -> Result<(), CliInstallerError> {
		match self.is_installed() {
			InstallationStatus::Ok => return Ok(()),
			InstallationStatus::WrongLink => {
				self.uninstall()?;
			}
			_ => {}
		};

		let parent = self.target.parent().unwrap();
		println!(
			"Make sure we have all the directories we need: {:?}",
			parent
		);

		match std::fs::create_dir_all(parent) {
			Ok(_) => {}
			Err(e) => match e.kind() {
				ErrorKind::PermissionDenied => {
					return Err(CliInstallerError::PermissionDenied)
				}
				_ => return Err(CliInstallerError::IoError(e)),
			},
		}

		println!("Installing symlink");

		#[cfg(not(windows))]
		match std::os::unix::fs::symlink(&self.binary, &self.target) {
			Ok(_) => {}
			Err(e) => match e.kind() {
				ErrorKind::PermissionDenied => {
					return Err(CliInstallerError::PermissionDenied)
				}
				_ => return Err(CliInstallerError::IoError(e)),
			},
		}

		#[cfg(windows)]
		match std::os::windows::fs::symlink_file(&self.binary, &self.target) {
			Ok(_) => {}
			Err(e) => match e.kind() {
				ErrorKind::PermissionDenied => {
					return Err(CliInstallerError::PermissionDenied)
				}
				_ => return Err(CliInstallerError::IoError(e)),
			},
		}

		Ok(())
	}

	pub fn uninstall(&self) -> Result<(), CliInstallerError> {
		println!("Trying to remove symlink");
		match fs::remove_file(&self.target) {
			Err(e) => match e.kind() {
				ErrorKind::PermissionDenied => {
					return Err(CliInstallerError::PermissionDenied)
				}
				_ => return Err(CliInstallerError::IoError(e)),
			},
			Ok(_) => Ok(()),
		}
	}
}
