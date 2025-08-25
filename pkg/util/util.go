package util

import (
	"regexp"
	"strings"
)

func Includes(str, substr string) bool {
	return strings.Contains(str, substr)
}

// SafeFilename 清理文件名中的非法字符
func SafeFilename(filename string) string {
	// 移除或替换Windows和macOS中的非法字符
	reg := regexp.MustCompile(`[<>:"/\\|?*\x00-\x1f]`)
	cleaned := reg.ReplaceAllString(filename, "_")
	
	// 移除首尾的点和空格
	cleaned = strings.TrimSpace(cleaned)
	cleaned = strings.Trim(cleaned, ".")
	
	// 如果文件名为空，使用默认名称
	if cleaned == "" {
		cleaned = "unnamed_file"
	}
	
	// 限制长度
	if len(cleaned) > 100 {
		cleaned = cleaned[:100]
	}
	
	return cleaned
}
