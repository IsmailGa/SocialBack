// Утилита для определения типа медиафайла по расширению
function getMediaTypeByExtension(ext) {
  ext = ext.toLowerCase();
  if ([".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"].includes(ext)) return "image";
  if ([".mp4", ".mov", ".avi", ".mkv", ".webm"].includes(ext)) return "video";
  if ([".mp3", ".wav", ".ogg", ".aac", ".flac"].includes(ext)) return "audio";
  if ([".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".txt", ".zip", ".rar"].includes(ext)) return "document";
  return null;
}

module.exports = { getMediaTypeByExtension }; 