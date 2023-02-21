#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::cell::RefCell;
use std::fs::{self, File, OpenOptions};
use std::io::Write;
use std::path::{self, Path, PathBuf};
use std::sync::Once;

use magick_rust::{magick_wand_genesis, MagickWand};
use notify::{Event, EventKind, RecommendedWatcher, RecursiveMode, Result, Watcher};
use platform_dirs::AppDirs;
use serde::ser::{Serialize, SerializeStruct, Serializer};
use serde_json::Value;
use tauri::{
    CustomMenuItem, Manager, SystemTray, SystemTrayEvent, SystemTrayMenu, SystemTrayMenuItem,
    Window,
};

// Used to make sure MagickWand is initialized exactly once. Note that we
// do not bother shutting down, we simply exit when we're done.
static START: Once = Once::new();

#[derive(Clone, serde::Serialize, serde::Deserialize)]
struct Payload {
    message: String,
}

struct WatchPath {
    path: String,
    recursive_mode: bool,
}

impl Serialize for WatchPath {
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut s = serializer.serialize_struct("WatchPath", 2)?;
        s.serialize_field("path", &self.path)?;
        s.serialize_field("recursive_mode", &self.recursive_mode)?;
        s.end()
    }
}

struct ConversionMap {
    src: String,
    dst: String,
}

impl Serialize for ConversionMap {
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut s = serializer.serialize_struct("ConversionMap", 2)?;
        s.serialize_field("src", &self.src)?;
        s.serialize_field("dst", &self.dst)?;
        s.end()
    }
}

struct Config {
    watch_paths: Vec<WatchPath>,
    conversion_maps: Vec<ConversionMap>,
}

impl Serialize for Config {
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut s = serializer.serialize_struct("Config", 2)?;
        s.serialize_field("watch_paths", &self.watch_paths)?;
        s.serialize_field("conversion_maps", &self.conversion_maps)?;
        s.end()
    }
}

const DEFAULT_CONFIG: &str = r#"{
    "watch_paths": [
    ],
    "conversion_maps": [
      {
        "src": "webp",
        "dst": "png"
      }
    ]
  }
"#;

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn from_frontend_get_config(window: Window) -> Config {
    get_config()
}

fn get_config_path() -> (PathBuf, PathBuf) {
    let config_path = AppDirs::new(Some("Programs"), false)
        .unwrap()
        .data_dir
        .join("hawkeye");
    let config_file_path = config_path.join("config.json");

    (config_path, config_file_path)
}

fn get_config() -> Config {
    let (config_path, config_file_path) = get_config_path();

    let config = {
        let text = match std::fs::read_to_string(&config_file_path) {
            Ok(content) => {
                println!("Found Config JSON File!");
                content
            }
            Err(e) => {
                println!("NOT Found Config JSON File!");
                println!("input_path: {}", config_path.display());
                let content = &DEFAULT_CONFIG;
                let mut config_file = match OpenOptions::new().write(true).open(&config_file_path) {
                    Ok(file) => file,
                    Err(_) => {
                        fs::create_dir_all(&config_path).unwrap();
                        OpenOptions::new()
                            .create(true)
                            .write(true)
                            .open(&config_file_path)
                            .unwrap()
                    }
                };
                config_file.write_all(content.as_bytes()).unwrap();
                content.to_string()
            }
        };

        serde_json::from_str::<Value>(&text).unwrap()
    };

    let mut watch_paths: Vec<WatchPath> = vec![];
    let mut conversion_map: Vec<ConversionMap> = vec![];
    for each_path_config in config["watch_paths"].as_array().unwrap() {
        watch_paths.push(WatchPath {
            path: String::from(each_path_config["path"].as_str().unwrap()),
            recursive_mode: each_path_config["recursive_mode"].as_bool().unwrap(),
        });
    }
    for each_conversion_map in config["conversion_maps"].as_array().unwrap() {
        conversion_map.push(ConversionMap {
            src: String::from(each_conversion_map["src"].as_str().unwrap()),
            dst: String::from(each_conversion_map["dst"].as_str().unwrap()),
        });
    }
    let config = Config {
        watch_paths,
        conversion_maps: conversion_map,
    };

    config
}

fn convertImage(imageSrc: &Path) {
    START.call_once(|| {
        magick_wand_genesis();
    });
    let wand = MagickWand::new();
    match wand.read_image(imageSrc.to_str().unwrap()) {
        Ok(ok) => ok,
        Err(_) => {}
    };
    match wand.write_image(imageSrc.file_stem().unwrap().to_str().unwrap()) {
        Ok(_) => println!("Convert Success!"),
        Err(_) => println!("Convert Error!"),
    }
}

fn main() {
    let config = get_config();
    let conversion_maps: RefCell<Vec<ConversionMap>> = RefCell::new(vec![]);
    let watching_paths = RefCell::new(vec![]); // watching directories
    let watcher = RefCell::new(
        notify::recommended_watcher(|res: Result<Event>| match res {
            Ok(event) => {
                // println!("{:?}", event.kind);
                // println!("event: {:?}", event);
                // if event.kind.is_create() == true || event.kind.is_modify() == true {
                if event.kind.is_create() == true {
                    println!("{:?}", event.paths);
                    convertImage(event.paths.first().unwrap());
                }
            }
            Err(e) => println!("watch error: {:?}", e),
        })
        .unwrap(),
    );

    for each_path_config in config.watch_paths {
        let path = each_path_config.path;
        let recursive_mode = if each_path_config.recursive_mode == true {
            RecursiveMode::Recursive
        } else {
            RecursiveMode::NonRecursive
        };
        match (*watcher.borrow_mut()).watch(Path::new(&path), recursive_mode) {
            Err(e) => println!("{:?}", e),
            _ => (),
        }
        (*(watching_paths.borrow_mut())).push(String::from(&path));
    }

    for each_conversion_mapping in config.conversion_maps {
        (*(conversion_maps.borrow_mut())).push(ConversionMap {
            src: each_conversion_mapping.src,
            dst: each_conversion_mapping.dst,
        });
    }

    // here `"quit".to_string()` defines the menu item id, and the second parameter is the menu item label.
    let show = CustomMenuItem::new("show".to_string(), "Hide");
    let quit = CustomMenuItem::new("quit".to_string(), "Quit");

    let tray_menu = SystemTrayMenu::new()
        .add_item(show)
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(quit);

    let tray = SystemTray::new().with_menu(tray_menu);

    tauri::Builder::default()
        .system_tray(tray)
        .setup(|app| {
            let (config_path, config_file_path) = get_config_path();

            let main_window = app.get_window("main").unwrap();

            let test_id = main_window.listen("event", |event| {
                println!("payload: {:?}", event.payload());
            });

            let apply_settings_id = main_window.listen("applySettings", move |event| {
                let new_config =
                    &serde_json::from_str::<Value>(&(event.payload().unwrap())).unwrap()["message"];

                /* unwatch all paths */
                for each_watching_path in &*(watching_paths.borrow_mut()) {
                    (*(watcher.borrow_mut()))
                        .unwatch(Path::new(&each_watching_path))
                        .unwrap();
                    println!("removed {} from watching_paths", each_watching_path);
                }
                (*(watching_paths.borrow_mut())).clear();

                println!("{:?}", new_config);
                /* watch all paths in new config */
                for each_new_watching_path in new_config["watch_paths"].as_array().unwrap() {
                    let path = Path::new(each_new_watching_path["path"].as_str().unwrap());
                    let recursive_mode =
                        each_new_watching_path["recursive_mode"].as_bool().unwrap();
                    let recursive_mode = if recursive_mode == true {
                        RecursiveMode::Recursive
                    } else {
                        RecursiveMode::NonRecursive
                    };
                    (*(watcher.borrow_mut()))
                        .watch(path, recursive_mode)
                        .unwrap();
                    (*(watching_paths.borrow_mut())).push(String::from(
                        each_new_watching_path["path"].as_str().unwrap(),
                    ));
                    println!(
                        "add {} to watching_paths",
                        each_new_watching_path["path"].as_str().unwrap()
                    );
                }
                fs::write(
                    &config_file_path,
                    serde_json::to_string_pretty(&new_config).unwrap(),
                )
                .unwrap();
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![greet, from_frontend_get_config])
        .on_system_tray_event(|app, event| match event {
            SystemTrayEvent::DoubleClick {
                tray_id,
                position,
                size,
                ..
            } => {
                let window = app.get_window("main").unwrap();

                if window.is_visible().unwrap() == true {
                    window.set_focus().unwrap();
                } else {
                    window.show().unwrap();
                }
            }
            SystemTrayEvent::MenuItemClick { tray_id, id, .. } => {
                let item_handle = app.tray_handle().get_item(&id);
                match id.as_str() {
                    "show" => {
                        let window = app.get_window("main").unwrap();
                        if window.is_visible().unwrap() == true {
                            item_handle.set_title("Show").unwrap();
                            window.hide().unwrap();
                        } else {
                            item_handle.set_title("Hide").unwrap();
                            window.show().unwrap();
                        }
                    }
                    "quit" => {
                        std::process::exit(0);
                    }
                    _ => {}
                }
            }
            _ => {}
        })
        // .run(tauri::generate_context!())
        .build(tauri::generate_context!())
        .expect("error while running tauri application")
        .run(|app, event| match event {
            tauri::RunEvent::WindowEvent { label, event, .. } => match event {
                tauri::WindowEvent::CloseRequested { api, .. } => {
                    let window = app.get_window("main").unwrap();
                    window.hide().unwrap();
                    api.prevent_close();
                }
                _ => {}
            },
            _ => {}
        })
}
