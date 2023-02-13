#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::fs;
use std::path::{Path, PathBuf};

use notify::{RecommendedWatcher, RecursiveMode, Result, Watcher};
use serde_json::Value;
use tauri::{CustomMenuItem, SystemTray, SystemTrayMenu, SystemTrayMenuItem};
use tauri::{Manager, SystemTrayEvent};

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

// fn read_config()->PathBuf{
//     tauri::api::path::parse(config, package_info, env, path)
// }

fn main() {
    let input_path = Path::new("%LOCALAPPDATA%/Programs/hawkeye/config.json");

    let config = {
        let text = match std::fs::read_to_string(&input_path) {
            Ok(content) => {
                println!("Found Config JSON File!");
                content
            }
            Err(e) => {
                println!("NOT Found Config JSON File!");
                println!("input_path: {:?}", input_path);
                let content = r#"{
                    "watch_directories": [
                    ]
                  }"#;

                std::fs::write(&input_path, content).unwrap();
                String::from(content)
            }
        };

        serde_json::from_str::<Value>(&text).unwrap()
    };

    let watch_directories = config["watch_directories"].as_array().unwrap();

    for directory in watch_directories {
        println!("{}", directory);
    }

    let mut watcher = notify::recommended_watcher(|res| match res {
        Ok(event) => println!("event: {:?}", event),
        Err(e) => println!("watch error: {:?}", e),
    })
    .unwrap();

    watcher
        .watch(Path::new("."), RecursiveMode::Recursive)
        .unwrap();

    // here `"quit".to_string()` defines the menu item id, and the second parameter is the menu item label.
    let show = CustomMenuItem::new("show".to_string(), "Hide");
    let quit = CustomMenuItem::new("quit".to_string(), "Quit");

    let tray_menu = SystemTrayMenu::new()
        .add_item(show)
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(quit);

    let tray = SystemTray::new().with_menu(tray_menu);

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![greet])
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
