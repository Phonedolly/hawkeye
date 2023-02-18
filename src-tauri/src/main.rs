#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::fs::{self, File, OpenOptions};
use std::io::Write;
use std::path::{Path, PathBuf};

use notify::{RecommendedWatcher, RecursiveMode, Result, Watcher};
use platform_dirs::AppDirs;
use serde_json::Value;
use tauri::{
    CustomMenuItem, Manager, SystemTray, SystemTrayEvent, SystemTrayMenu, SystemTrayMenuItem,
    Window,
};

#[derive(Clone, serde::Serialize)]
struct Payload {
    message: String,
}

const DEFAULT_CONFIG: &str = r#"{
"watch_directories": [
]
}"#;

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn from_frontend_get_config(window: Window) -> Vec<Value> {
    get_config()["watch_directories"]
        .as_array()
        .unwrap()
        .to_vec()
}

fn get_config_path()->(PathBuf, PathBuf){
    let config_path = AppDirs::new(Some("Programs"), false)
        .unwrap()
        .data_dir
        .join("hawkeye");
    let config_file_path = config_path.join("config.json");

    (config_path, config_file_path)
}

fn get_config() -> Value {
    let (config_path, config_file_path) = get_config_path();
    println!("{}", config_path.display());

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

    config
}

fn main() {
    let config = get_config();
    let watch_directories = config["watch_directories"].as_array().unwrap();

    let mut watcher = notify::recommended_watcher(|res| match res {
        Ok(event) => println!("event: {:?}", event),
        Err(e) => println!("watch error: {:?}", e),
    })
    .unwrap();

    for directory in watch_directories {
        println!("{}", directory);
        watcher
            .watch(
                Path::new(directory.as_str().unwrap()),
                RecursiveMode::Recursive,
            )
            .unwrap();
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
        .setup(|app| {
            let (config_path, config_file_path) = get_config_path();

            let main_window = app.get_window("main").unwrap();

            let test_id = main_window.listen("event", |event| {
                println!("payload: {:?}", event.payload());
            });

            let apply_settings_id = main_window.listen("applySettings", move |event| {
                
                let new_config = serde_json::from_str::<Value>(match event.payload() {
                    Some(new_config) => new_config,
                    None => &DEFAULT_CONFIG,
                }).unwrap();
                fs::write(&config_file_path, serde_json::to_string_pretty(&new_config).unwrap());
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![greet])
        .invoke_handler(tauri::generate_handler![from_frontend_get_config])
        .system_tray(tray)
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
