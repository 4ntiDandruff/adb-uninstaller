use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SafetyAnalysis {
    pub package_name: String,
    pub app_name: String,
    pub level: String,
    pub reason: String,
    pub can_remove: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
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
            ai_model: "kr/claude-haiku-4.5".into(),
            ai_system_prompt:
                "Kamu asisten ADB untuk teknisi servis HP Indonesia. Spesialisasi: debloat Android, analisa package, troubleshooting HP. Jawab dalam Bahasa Indonesia kecuali diminta bahasa lain. Singkat dan praktis.".into(),
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
    std::fs::create_dir_all(&dir).map_err(|e| format!("[ADB-5002] Gagal buat config dir: {e}"))?;
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
    let temp_path = path.with_extension("json.tmp");
    std::fs::write(&temp_path, raw)
        .map_err(|e| format!("[ADB-5006] Gagal tulis settings sementara: {e}"))?;
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        std::fs::set_permissions(&temp_path, std::fs::Permissions::from_mode(0o600))
            .map_err(|e| format!("[ADB-5007] Gagal amankan permission settings: {e}"))?;
    }
    std::fs::rename(&temp_path, &path)
        .map_err(|e| format!("[ADB-5008] Gagal pasang settings baru: {e}"))
}

fn strip_sse(text: &str) -> String {
    // ZevaiRouter kadang return SSE: "data: {...}\ndata: {...}\ndata: [DONE]"
    // Concat semua JSON payload, bukan cuma ambil yang pertama.
    let mut parts: Vec<String> = Vec::new();
    let mut is_sse = false;
    for line in text.lines() {
        let l = line.trim();
        if l.starts_with("data:") {
            is_sse = true;
            let payload = l.trim_start_matches("data:").trim();
            if payload != "[DONE]" && !payload.is_empty() {
                parts.push(payload.to_string());
            }
        }
    }
    if !is_sse {
        return text.trim().to_string();
    }
    if parts.len() == 1 {
        return parts[0].clone();
    }
    // Multiple SSE chunks: merge content from each delta
    let mut merged_content = String::new();
    let mut base_obj = String::new();
    for (i, part) in parts.iter().enumerate() {
        if let Ok(v) = serde_json::from_str::<serde_json::Value>(part) {
            if i == 0 {
                base_obj = part.clone();
            }
            if let Some(c) = v["choices"][0]["delta"]["content"].as_str() {
                merged_content.push_str(c);
            } else if let Some(c) = v["choices"][0]["message"]["content"].as_str() {
                merged_content.push_str(c);
            }
        }
    }
    if !merged_content.is_empty() {
        if let Ok(mut base) = serde_json::from_str::<serde_json::Value>(&base_obj) {
            if let Some(msg) = base
                .get_mut("choices")
                .and_then(|c| c.get_mut(0))
                .and_then(|c| c.get_mut("message"))
            {
                msg["content"] = serde_json::Value::String(merged_content);
            } else if let Some(choices) = base.get_mut("choices").and_then(|c| c.as_array_mut()) {
                if let Some(first) = choices.first_mut() {
                    first["message"] =
                        serde_json::json!({"role": "assistant", "content": merged_content});
                    first.as_object_mut().map(|o| o.remove("delta"));
                }
            }
            return base.to_string();
        }
    }
    parts
        .first()
        .cloned()
        .unwrap_or_else(|| text.trim().to_string())
}

fn normalize_base_url(base: &str) -> String {
    let mut b = base.trim().trim_end_matches('/').to_string();
    // Jika user sudah isi path lengkap (misal http://host:8080/api/v1), jangan tambah /v1 lagi.
    // Hanya tambah /v1 kalau base URL masih polos (http://host:port saja).
    let path_only = b.split_once("://").map(|x| x.1).unwrap_or(&b);
    let has_path = path_only.contains('/');
    if !has_path && !b.ends_with("/v1") {
        b.push_str("/v1");
    }
    b
}

fn sanitize_analysis(
    packages: &[String],
    parsed: Vec<SafetyAnalysis>,
    language: &str,
) -> Vec<SafetyAnalysis> {
    let mut by_package = std::collections::HashMap::new();
    for mut result in parsed {
        if packages.iter().any(|pkg| pkg == &result.package_name) {
            result.level = match result.level.to_lowercase().as_str() {
                "safe" => "safe",
                "risky" => "risky",
                "critical" => "critical",
                _ => "unknown",
            }
            .into();
            by_package
                .entry(result.package_name.clone())
                .or_insert(result);
        }
    }

    let missing_note = if language == "id" {
        "AI tak mengembalikan hasil"
    } else {
        "AI returned no result"
    };
    let mut seen = std::collections::HashSet::new();
    packages
        .iter()
        .filter(|pkg| seen.insert((*pkg).clone()))
        .map(|pkg| {
            by_package.remove(pkg).unwrap_or_else(|| SafetyAnalysis {
                package_name: pkg.clone(),
                app_name: String::new(),
                level: "unknown".into(),
                reason: missing_note.into(),
                can_remove: false,
            })
        })
        .collect()
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
        "temperature": 0.0,
        "stream": false
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

    let lang_note = if settings.language == "id" {
        " Tulis field reason dalam Bahasa Indonesia, singkat maksimal 5 kata."
    } else {
        " Write the reason field in English, max 5 words."
    };
    let system_str = format!("Kamu analis keamanan paket Android untuk teknisi servis HP Indonesia.\nBrand umum: Xiaomi/Redmi, Samsung, OPPO, Vivo, Realme, Infinix.\n\nUntuk SETIAP package, kembalikan JSON object dengan keys:\n- package_name: nama package\n- app_name: nama yang tampil di HP (contoh: com.whatsapp → WhatsApp, com.miui.home → Launcher MIUI, com.android.vending → Play Store)\n- level: salah satu dari [safe, risky, critical, unknown]\n- reason: alasan singkat, maks 5 kata\n- can_remove: boolean\n\nDefinisi level:\n- critical: sistem crash/bootloop jika dihapus (launcher, settings, framework, telephony, packageinstaller, SystemUI)\n- risky: HP tetap jalan tapi fitur penting hilang (camera, keyboard, NFC, SIM manager, GMS core)\n- safe: bloatware/app pihak ketiga/game bawaan, aman dihapus (browser vendor, cleaner, themes, musik bawaan, app promo)\n- unknown: package tidak dikenali, jarang ditemui\n\nContoh output:\n[{{\"package_name\":\"com.miui.cleanmaster\",\"app_name\":\"Cleaner\",\"level\":\"safe\",\"reason\":\"Bloatware pembersih bawaan\",\"can_remove\":true}},{{\"package_name\":\"com.android.settings\",\"app_name\":\"Settings\",\"level\":\"critical\",\"reason\":\"Pengaturan sistem utama\",\"can_remove\":false}}]\n\nKembalikan HANYA JSON array valid, tanpa markdown, tanpa penjelasan tambahan.{}", lang_note);
    let system = system_str.as_str();
    let user = serde_json::to_string(&packages)
        .map_err(|e| format!("[ADB-4006] Serialize packages gagal: {e}"))?;

    let body = serde_json::json!({
        "model": settings.ai_model,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user}
        ],
        "temperature": settings.temperature,
        "max_tokens": settings.max_tokens,
        "stream": false
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

    let text = strip_sse(&text);
    let v: Value =
        serde_json::from_str(&text).map_err(|e| format!("[ADB-4007] Parse response gagal: {e}"))?;
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

    // Cari array JSON di dalam content kalau AI nambah teks
    let json_slice = if let (Some(s), Some(e)) = (cleaned.find('['), cleaned.rfind(']')) {
        &cleaned[s..=e]
    } else {
        cleaned
    };

    let parsed: Vec<SafetyAnalysis> = serde_json::from_str(json_slice)
        .map_err(|e| format!("[ADB-4008] AI JSON invalid: {e} | content={cleaned}"))?;
    Ok(sanitize_analysis(&packages, parsed, &settings.language))
}

pub async fn analyze_device(
    model: String,
    chipset: String,
    android: String,
) -> Result<String, String> {
    let settings = load_settings()?;
    if settings.ai_api_key.trim().is_empty() {
        return Err("[ADB-4005] API key kosong — isi di Settings".into());
    }
    let base = normalize_base_url(&settings.ai_base_url);
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(60))
        .build()
        .map_err(|e| format!("[ADB-4001] HTTP client error: {e}"))?;

    let lang_note = if settings.language == "id" {
        "Jawab dalam Bahasa Indonesia."
    } else {
        "Answer in English."
    };
    let system = format!(
        "You are a phone repair technician assistant for Indonesian service shops.\nCommon brands: Xiaomi, Samsung, OPPO, Vivo, Realme, Infinix — mostly budget-midrange.\nOutput a compact brief in EXACTLY this bullet format, nothing else:\n\nSPEK\n• <chipset + kelas performa>\n• <RAM/layar kalau umum diketahui>\n\nISU KHAS SERVIS\n• <keluhan yang sering masuk servis untuk model ini>\n• <keluhan lain>\n\nTIPS\n• <tips singkat teknisi>\n\nRules: setiap poin diawali '• ', maksimal 12 kata per poin, maksimal 2 poin per section. JANGAN pakai markdown (tanpa **, tanpa #, tanpa nomor). {lang_note}"
    );
    let user = format!("Device: {model}\nChipset: {chipset}\nAndroid: {android}");

    let body = serde_json::json!({
        "model": settings.ai_model,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user}
        ],
        "temperature": settings.temperature,
        "max_tokens": settings.max_tokens,
        "stream": false
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
    let text = strip_sse(&text);
    let v: Value =
        serde_json::from_str(&text).map_err(|e| format!("[ADB-4007] Parse response gagal: {e}"))?;
    let msg = &v["choices"][0]["message"]["content"];
    if let Some(s) = msg.as_str() {
        return Ok(s.trim().to_string());
    }
    if let Some(arr) = msg.as_array() {
        let joined: String = arr
            .iter()
            .filter_map(|p| p.get("text").and_then(|t| t.as_str()))
            .collect::<Vec<_>>()
            .join("");
        if !joined.is_empty() {
            return Ok(joined);
        }
    }
    Err("[ADB-4010] Struktur response device analysis tidak dikenal".into())
}

pub async fn chat_with_ai(messages: Vec<ChatMessage>, context: String) -> Result<String, String> {
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
        "Kamu asisten ADB untuk teknisi servis HP Indonesia. Spesialisasi: debloat Android, analisa package, troubleshooting HP. Jawab dalam Bahasa Indonesia kecuali diminta bahasa lain. Singkat dan praktis.".to_string()
    } else {
        settings.ai_system_prompt.clone()
    };

    let mut api_messages = vec![serde_json::json!({"role": "system", "content": system})];
    if !context.is_empty() {
        api_messages.push(serde_json::json!({"role": "user", "content": format!("Context:\n{context}")}));
    }
    for m in &messages {
        api_messages.push(serde_json::json!({"role": m.role, "content": m.content}));
    }

    let body = serde_json::json!({
        "model": settings.ai_model,
        "messages": api_messages,
        "temperature": settings.temperature,
        "max_tokens": settings.max_tokens,
        "stream": false
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

    let text = strip_sse(&text);
    if text.is_empty() {
        return Err("[ADB-4009] AI balas body kosong (HTTP 200 tapi no content). Cek model/provider di ZevaiRouter.".into());
    }
    let v: Value = serde_json::from_str(&text).map_err(|e| {
        let preview: String = text.chars().take(200).collect();
        format!("[ADB-4007] Parse response gagal: {e} | body={preview}")
    })?;
    // Toleran: content bisa string atau array of parts (OpenAI vs lain)
    let msg = &v["choices"][0]["message"]["content"];
    if let Some(s) = msg.as_str() {
        return Ok(s.to_string());
    }
    if let Some(arr) = msg.as_array() {
        let joined: String = arr
            .iter()
            .filter_map(|p| p.get("text").and_then(|t| t.as_str()))
            .collect::<Vec<_>>()
            .join("");
        if !joined.is_empty() {
            return Ok(joined);
        }
    }
    // Fallback: beberapa provider taruh di "text" atau "content" root
    if let Some(t) = v["choices"][0]["text"].as_str() {
        return Ok(t.to_string());
    }
    Err(format!(
        "[ADB-4010] Struktur response tidak dikenal: {}",
        text.chars().take(200).collect::<String>()
    ))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn sanitize_analysis_filters_hallucinations_and_duplicates() {
        let packages = vec!["com.real.one".into(), "com.real.two".into()];
        let parsed = vec![
            SafetyAnalysis {
                package_name: "com.fake.app".into(),
                app_name: "Fake".into(),
                level: "safe".into(),
                reason: "fake".into(),
                can_remove: true,
            },
            SafetyAnalysis {
                package_name: "com.real.one".into(),
                app_name: "Real One".into(),
                level: "SAFE".into(),
                reason: "ok".into(),
                can_remove: true,
            },
            SafetyAnalysis {
                package_name: "com.real.one".into(),
                app_name: "Real One Dup".into(),
                level: "critical".into(),
                reason: "duplicate".into(),
                can_remove: false,
            },
        ];

        let result = sanitize_analysis(&packages, parsed, "id");
        assert_eq!(result.len(), 2);
        assert_eq!(result[0].package_name, "com.real.one");
        assert_eq!(result[0].level, "safe");
        assert_eq!(result[1].package_name, "com.real.two");
        assert_eq!(result[1].level, "unknown");
        assert!(!result[1].can_remove);
    }

    #[test]
    fn normalize_base_url_preserves_existing_api_path() {
        assert_eq!(
            normalize_base_url("http://localhost:8080"),
            "http://localhost:8080/v1"
        );
        assert_eq!(
            normalize_base_url("https://example.test/api/v1/"),
            "https://example.test/api/v1"
        );
    }
}
