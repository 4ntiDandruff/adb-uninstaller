use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SafetyAnalysis {
    pub package_name: String,
    pub level: String,
    pub reason: String,
    pub can_remove: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConnectionTest {
    pub success: bool,
    pub message: String,
    pub models: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppSettings {
    pub ai_base_url: String,
    pub ai_api_key: String,
    pub ai_model: String,
    pub ai_system_prompt: String,
    pub language: String,
    pub theme: String,
    pub temperature: f32,
    pub max_tokens: u32,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            ai_base_url: "http://43.163.100.241:1997/v1".into(),
            ai_api_key: String::new(),
            ai_model: "gk/gx-grok-4.5".into(),
            ai_system_prompt: "You are an Android package safety analyst for technicians. Be concise.".into(),
            language: "id".into(),
            theme: "dark".into(),
            temperature: 0.3,
            max_tokens: 4096,
        }
    }
}

fn settings_path() -> Result<std::path::PathBuf, String> {
    let dir = dirs::config_dir()
        .ok_or_else(|| "[ADB-5001] Config dir tidak ditemukan".to_string())?
        .join("adb-uninstaller");
    std::fs::create_dir_all(&dir)
        .map_err(|e| format!("[ADB-5002] Gagal buat config dir: {e}"))?;
    Ok(dir.join("settings.json"))
}

pub fn load_settings() -> Result<AppSettings, String> {
    let path = settings_path()?;
    if !path.exists() {
        return Ok(AppSettings::default());
    }
    let raw = std::fs::read_to_string(&path)
        .map_err(|e| format!("[ADB-5003] Gagal baca settings: {e}"))?;
    serde_json::from_str(&raw).map_err(|e| format!("[ADB-5004] Settings corrupt: {e}"))
}

pub fn save_settings(settings: AppSettings) -> Result<(), String> {
    let path = settings_path()?;
    let raw = serde_json::to_string_pretty(&settings)
        .map_err(|e| format!("[ADB-5005] Serialize gagal: {e}"))?;
    std::fs::write(&path, raw).map_err(|e| format!("[ADB-5006] Gagal tulis settings: {e}"))
}

fn normalize_base_url(base: &str) -> String {
    let mut b = base.trim().trim_end_matches('/').to_string();
    if !b.ends_with("/v1") {
        b.push_str("/v1");
    }
    b
}

pub async fn test_ai_connection(
    base_url: String,
    api_key: String,
    model: String,
) -> Result<ConnectionTest, String> {
    let base = normalize_base_url(&base_url);
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(20))
        .build()
        .map_err(|e| format!("[ADB-4001] HTTP client error: {e}"))?;

    // Prefer models endpoint if available
    let models_url = format!("{base}/models");
    let mut models = Vec::new();
    if let Ok(resp) = client
        .get(&models_url)
        .header("Authorization", format!("Bearer {api_key}"))
        .send()
        .await
    {
        if resp.status().is_success() {
            if let Ok(v) = resp.json::<Value>().await {
                if let Some(arr) = v.get("data").and_then(|d| d.as_array()) {
                    for m in arr {
                        if let Some(id) = m.get("id").and_then(|x| x.as_str()) {
                            models.push(id.to_string());
                        }
                    }
                }
            }
        }
    }

    // Minimal chat completion probe
    let chat_url = format!("{base}/chat/completions");
    let body = serde_json::json!({
        "model": model,
        "messages": [{"role": "user", "content": "ping"}],
        "max_tokens": 8,
        "temperature": 0.0
    });

    let resp = client
        .post(&chat_url)
        .header("Authorization", format!("Bearer {api_key}"))
        .header("Content-Type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("[ADB-4002] Koneksi AI gagal: {e}"))?;

    let status = resp.status();
    let text = resp
        .text()
        .await
        .map_err(|e| format!("[ADB-4003] Baca response gagal: {e}"))?;

    if !status.is_success() {
        return Ok(ConnectionTest {
            success: false,
            message: format!("[ADB-4004] HTTP {status}: {text}"),
            models,
        });
    }

    Ok(ConnectionTest {
        success: true,
        message: "Koneksi AI OK".into(),
        models,
    })
}

pub async fn analyze_apps_batch(packages: Vec<String>) -> Result<Vec<SafetyAnalysis>, String> {
    let settings = load_settings()?;
    if settings.ai_api_key.trim().is_empty() {
        return Err("[ADB-4005] API key kosong — isi di Settings".into());
    }

    let mut packages = packages;
    if packages.len() > 50 {
        packages.truncate(50);
    }

    let base = normalize_base_url(&settings.ai_base_url);
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(60))
        .build()
        .map_err(|e| format!("[ADB-4001] HTTP client error: {e}"))?;

    let system = "Analyze Android package names. For EACH package return JSON object with keys: package_name, level (safe|risky|critical|unknown), reason (short), can_remove (bool). Return ONLY a JSON array, no markdown.";
    let user = serde_json::to_string(&packages)
        .map_err(|e| format!("[ADB-4006] Serialize packages gagal: {e}"))?;

    let body = serde_json::json!({
        "model": settings.ai_model,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user}
        ],
        "temperature": settings.temperature,
        "max_tokens": settings.max_tokens
    });

    let resp = client
        .post(format!("{base}/chat/completions"))
        .header("Authorization", format!("Bearer {}", settings.ai_api_key))
        .header("Content-Type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("[ADB-4002] Koneksi AI gagal: {e}"))?;

    let status = resp.status();
    let text = resp
        .text()
        .await
        .map_err(|e| format!("[ADB-4003] Baca response gagal: {e}"))?;
    if !status.is_success() {
        return Err(format!("[ADB-4004] HTTP {status}: {text}"));
    }

    let v: Value = serde_json::from_str(&text)
        .map_err(|e| format!("[ADB-4007] Parse response gagal: {e}"))?;
    let content = v["choices"][0]["message"]["content"]
        .as_str()
        .unwrap_or("")
        .trim()
        .to_string();

    let cleaned = content
        .trim_start_matches("```json")
        .trim_start_matches("```")
        .trim_end_matches("```")
        .trim();

    let parsed: Vec<SafetyAnalysis> = serde_json::from_str(cleaned).map_err(|e| {
        format!("[ADB-4008] AI JSON invalid: {e} | content={cleaned}")
    })?;
    Ok(parsed)
}

pub async fn chat_with_ai(message: String, context: String) -> Result<String, String> {
    let settings = load_settings()?;
    if settings.ai_api_key.trim().is_empty() {
        return Err("[ADB-4005] API key kosong — isi di Settings".into());
    }

    let base = normalize_base_url(&settings.ai_base_url);
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(60))
        .build()
        .map_err(|e| format!("[ADB-4001] HTTP client error: {e}"))?;

    let system = if settings.ai_system_prompt.is_empty() {
        "You are an Android ADB assistant for phone technicians. Answer in Bahasa Indonesia unless asked otherwise.".into()
    } else {
        settings.ai_system_prompt.clone()
    };

    let user = if context.is_empty() {
        message
    } else {
        format!("Context:\n{context}\n\nUser:\n{message}")
    };

    let body = serde_json::json!({
        "model": settings.ai_model,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user}
        ],
        "temperature": settings.temperature,
        "max_tokens": settings.max_tokens
    });

    let resp = client
        .post(format!("{base}/chat/completions"))
        .header("Authorization", format!("Bearer {}", settings.ai_api_key))
        .header("Content-Type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("[ADB-4002] Koneksi AI gagal: {e}"))?;

    let status = resp.status();
    let text = resp
        .text()
        .await
        .map_err(|e| format!("[ADB-4003] Baca response gagal: {e}"))?;
    if !status.is_success() {
        return Err(format!("[ADB-4004] HTTP {status}: {text}"));
    }

    let v: Value = serde_json::from_str(&text)
        .map_err(|e| format!("[ADB-4007] Parse response gagal: {e}"))?;
    Ok(v["choices"][0]["message"]["content"]
        .as_str()
        .unwrap_or("")
        .to_string())
}
