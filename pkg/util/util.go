package util

import (
	"regexp"
	"strings"
	"unicode"
)

func Includes(str, substr string) bool {
	return strings.Contains(str, substr)
}

// SafeFilename 清理文件名中的非法字符，特别优化macOS兼容性
func SafeFilename(filename string) string {
	if filename == "" {
		return "unnamed_file"
	}
	
	// 1. 替换所有非法字符为下划线
	var result strings.Builder
	for _, r := range filename {
		switch {
		// Windows/macOS非法字符
		case r == '<' || r == '>' || r == ':' || r == '"' || r == '/' || r == '\\' || 
			 r == '|' || r == '?' || r == '*':
			result.WriteRune('_')
		// 控制字符
		case r < 32:
			result.WriteRune('_')
		// macOS特殊问题字符
		case r == '#':
			result.WriteString("_")
		case r == '，':  // 中文逗号
			result.WriteString("_")
		case r == '。':  // 中文句号
			result.WriteString("_")
		case r == '？':  // 中文问号
			result.WriteString("_")
		case r == '！':  // 中文感叹号
			result.WriteString("_")
		case r == '；':  // 中文分号
			result.WriteString("_")
		// 其他可能的问题字符
		case unicode.IsControl(r):
			result.WriteRune('_')
		// 正常字符直接保留
		default:
			result.WriteRune(r)
		}
	}
	
	cleaned := result.String()
	
	// 2. 清理连续的下划线
	reg := regexp.MustCompile(`_{2,}`)
	cleaned = reg.ReplaceAllString(cleaned, "_")
	
	// 3. 移除首尾的点、空格和下划线
	cleaned = strings.TrimSpace(cleaned)
	cleaned = strings.Trim(cleaned, "._")
	
	// 4. 如果清理后为空，使用默认名称
	if cleaned == "" {
		cleaned = "unnamed_file"
	}
	
	// 5. 限制长度（UTF-8安全截断）
	if len(cleaned) > 200 {
		// 安全截断，避免截断UTF-8字符
		runes := []rune(cleaned)
		if len(runes) > 100 {
			cleaned = string(runes[:100])
		}
	}
	
	return cleaned
}
