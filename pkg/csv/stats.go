package csv

import (
	"fmt"
	"sort"
	"time"
)

// Stats 统计信息
type Stats struct {
	TotalVideos     int
	TotalSize       int64
	TotalDuration   int
	VideosByType    map[string]int
	VideosByUser    map[string]int
	RecentVideos    []*VideoRecord
	TopLikedVideos  []*VideoRecord
	TopSharedVideos []*VideoRecord
}

// GetStats 获取统计信息
func (cm *CSVManager) GetStats() (*Stats, error) {
	records, err := cm.ReadRecords()
	if err != nil {
		return nil, err
	}

	stats := &Stats{
		VideosByType: make(map[string]int),
		VideosByUser: make(map[string]int),
		RecentVideos: make([]*VideoRecord, 0),
		TopLikedVideos: make([]*VideoRecord, 0),
		TopSharedVideos: make([]*VideoRecord, 0),
	}

	// 收集所有记录到切片中，便于排序
	allRecords := make([]*VideoRecord, 0, len(records))
	for _, record := range records {
		allRecords = append(allRecords, record)
		
		// 基础统计
		stats.TotalVideos++
		stats.TotalSize += record.FileSize
		stats.TotalDuration += record.Duration
		
		// 按类型统计
		stats.VideosByType[record.Type]++
		
		// 按用户统计
		user := record.Nickname
		if user == "" {
			user = record.Username
		}
		if user == "" {
			user = "未知用户"
		}
		stats.VideosByUser[user]++
	}

	// 按时间排序 - 最近的视频
	sort.Slice(allRecords, func(i, j int) bool {
		return allRecords[i].DownloadTime.After(allRecords[j].DownloadTime)
	})
	
	limit := 10
	if len(allRecords) < limit {
		limit = len(allRecords)
	}
	stats.RecentVideos = allRecords[:limit]

	// 按点赞数排序 - 最受欢迎的视频
	likedRecords := make([]*VideoRecord, len(allRecords))
	copy(likedRecords, allRecords)
	sort.Slice(likedRecords, func(i, j int) bool {
		return likedRecords[i].Likes > likedRecords[j].Likes
	})
	stats.TopLikedVideos = likedRecords[:limit]

	// 按分享数排序 - 最多分享的视频
	sharedRecords := make([]*VideoRecord, len(allRecords))
	copy(sharedRecords, allRecords)
	sort.Slice(sharedRecords, func(i, j int) bool {
		return sharedRecords[i].Shares > sharedRecords[j].Shares
	})
	stats.TopSharedVideos = sharedRecords[:limit]

	return stats, nil
}

// PrintStats 打印统计信息
func (cm *CSVManager) PrintStats() error {
	stats, err := cm.GetStats()
	if err != nil {
		return err
	}

	fmt.Println("📊 视频下载统计")
	fmt.Println("====================================================")
	fmt.Printf("📹 总视频数: %d\n", stats.TotalVideos)
	fmt.Printf("💾 总大小: %s\n", formatBytes(stats.TotalSize))
	fmt.Printf("⏱️  总时长: %s\n", formatDuration(stats.TotalDuration))
	
	fmt.Println("\n📊 按类型统计:")
	for videoType, count := range stats.VideosByType {
		fmt.Printf("  %s: %d\n", videoType, count)
	}
	
	fmt.Println("\n👤 按用户统计 (前10名):")
	// 将用户统计转换为切片并排序
	type userStat struct {
		name  string
		count int
	}
	userStats := make([]userStat, 0, len(stats.VideosByUser))
	for name, count := range stats.VideosByUser {
		userStats = append(userStats, userStat{name, count})
	}
	sort.Slice(userStats, func(i, j int) bool {
		return userStats[i].count > userStats[j].count
	})
	
	limit := 10
	if len(userStats) < limit {
		limit = len(userStats)
	}
	for i := 0; i < limit; i++ {
		fmt.Printf("  %s: %d\n", userStats[i].name, userStats[i].count)
	}

	fmt.Println("\n🕒 最近下载 (前5个):")
	recentLimit := 5
	if len(stats.RecentVideos) < recentLimit {
		recentLimit = len(stats.RecentVideos)
	}
	for i := 0; i < recentLimit; i++ {
		record := stats.RecentVideos[i]
		fmt.Printf("  %s - %s (%s)\n", 
			record.DownloadTime.Format("01-02 15:04"),
			record.Title,
			record.Nickname)
	}

	fmt.Println("\n❤️  最受欢迎 (前5个):")
	for i := 0; i < recentLimit && i < len(stats.TopLikedVideos); i++ {
		record := stats.TopLikedVideos[i]
		fmt.Printf("  👍 %d - %s (%s)\n", 
			record.Likes,
			record.Title,
			record.Nickname)
	}

	return nil
}

// formatBytes 格式化字节数
func formatBytes(bytes int64) string {
	const unit = 1024
	if bytes < unit {
		return fmt.Sprintf("%d B", bytes)
	}
	div, exp := int64(unit), 0
	for n := bytes / unit; n >= unit; n /= unit {
		div *= unit
		exp++
	}
	return fmt.Sprintf("%.1f %cB", float64(bytes)/float64(div), "KMGTPE"[exp])
}

// formatDuration 格式化持续时间
func formatDuration(durationMs int) string {
	if durationMs == 0 {
		return "未知"
	}
	
	duration := time.Duration(durationMs) * time.Millisecond
	hours := int(duration.Hours())
	minutes := int(duration.Minutes()) % 60
	seconds := int(duration.Seconds()) % 60
	
	if hours > 0 {
		return fmt.Sprintf("%d小时%d分%d秒", hours, minutes, seconds)
	} else if minutes > 0 {
		return fmt.Sprintf("%d分%d秒", minutes, seconds)
	} else {
		return fmt.Sprintf("%d秒", seconds)
	}
}