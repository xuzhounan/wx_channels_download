package csv

import (
	"encoding/csv"
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"
)

// VideoRecord 视频记录结构
type VideoRecord struct {
	VideoID      string    `csv:"video_id"`
	Title        string    `csv:"title"`
	Filename     string    `csv:"filename"`
	Username     string    `csv:"username"`
	Nickname     string    `csv:"nickname"`
	VideoURL     string    `csv:"video_url"`
	CoverURL     string    `csv:"cover_url"`
	Duration     int       `csv:"duration_ms"`
	FileSize     int64     `csv:"file_size_bytes"`
	Type         string    `csv:"type"`
	PublishTime  time.Time `csv:"publish_time"`      // 添加发布时间字段
	Likes        int       `csv:"likes"`
	Shares       int       `csv:"shares"`
	Favorites    int       `csv:"favorites"`
	Comments     int       `csv:"comments"`
	IsEncrypted  bool      `csv:"is_encrypted"`
	DecryptKey   int       `csv:"decrypt_key"`
	DownloadTime time.Time `csv:"download_time"`
	FilePath     string    `csv:"file_path"`
}

// CSVManager CSV管理器
type CSVManager struct {
	filePath string
}

// NewCSVManager 创建CSV管理器
func NewCSVManager(downloadDir string) *CSVManager {
	csvPath := filepath.Join(downloadDir, "video_metadata.csv")
	return &CSVManager{
		filePath: csvPath,
	}
}

// getHeaders 获取CSV头部
func (cm *CSVManager) getHeaders() []string {
	return []string{
		"video_id",
		"title", 
		"filename",
		"username",
		"nickname",
		"video_url",
		"cover_url",
		"duration_ms",
		"file_size_bytes",
		"type",
		"publish_time",        // 添加发布时间列
		"likes",
		"shares", 
		"favorites",
		"comments",
		"is_encrypted",
		"decrypt_key",
		"download_time",
		"file_path",
	}
}

// recordToRow 将记录转换为CSV行
func (cm *CSVManager) recordToRow(record *VideoRecord) []string {
	return []string{
		record.VideoID,
		record.Title,
		record.Filename,
		record.Username,
		record.Nickname,
		record.VideoURL,
		record.CoverURL,
		strconv.Itoa(record.Duration),
		strconv.FormatInt(record.FileSize, 10),
		record.Type,
		record.PublishTime.Format("2006-01-02 15:04:05"),  // 添加发布时间
		strconv.Itoa(record.Likes),
		strconv.Itoa(record.Shares),
		strconv.Itoa(record.Favorites),
		strconv.Itoa(record.Comments),
		strconv.FormatBool(record.IsEncrypted),
		strconv.Itoa(record.DecryptKey),
		record.DownloadTime.Format("2006-01-02 15:04:05"),
		record.FilePath,
	}
}

// rowToRecord 将CSV行转换为记录
func (cm *CSVManager) rowToRecord(row []string) (*VideoRecord, error) {
	if len(row) < 19 {
		return nil, fmt.Errorf("invalid row length: %d", len(row))
	}

	duration, _ := strconv.Atoi(row[7])
	fileSize, _ := strconv.ParseInt(row[8], 10, 64)
	
	// 解析发布时间
	publishTime, err := time.Parse("2006-01-02 15:04:05", row[10])
	if err != nil {
		publishTime = time.Time{} // 默认零时间
	}
	
	likes, _ := strconv.Atoi(row[11])
	shares, _ := strconv.Atoi(row[12])
	favorites, _ := strconv.Atoi(row[13])
	comments, _ := strconv.Atoi(row[14])
	isEncrypted, _ := strconv.ParseBool(row[15])
	decryptKey, _ := strconv.Atoi(row[16])
	
	downloadTime, err := time.Parse("2006-01-02 15:04:05", row[17])
	if err != nil {
		downloadTime = time.Now()
	}

	return &VideoRecord{
		VideoID:      row[0],
		Title:        row[1],
		Filename:     row[2],
		Username:     row[3],
		Nickname:     row[4],
		VideoURL:     row[5],
		CoverURL:     row[6],
		Duration:     duration,
		FileSize:     fileSize,
		Type:         row[9],
		PublishTime:  publishTime,  // 添加发布时间字段
		Likes:        likes,
		Shares:       shares,
		Favorites:    favorites,
		Comments:     comments,
		IsEncrypted:  isEncrypted,
		DecryptKey:   decryptKey,
		DownloadTime: downloadTime,
		FilePath:     row[18],  // 调整索引
	}, nil
}

// ReadRecords 读取所有记录
func (cm *CSVManager) ReadRecords() (map[string]*VideoRecord, error) {
	records := make(map[string]*VideoRecord)

	// 检查文件是否存在
	if _, err := os.Stat(cm.filePath); os.IsNotExist(err) {
		return records, nil
	}

	file, err := os.Open(cm.filePath)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	reader := csv.NewReader(file)
	reader.FieldsPerRecord = -1 // 允许可变字段数

	rows, err := reader.ReadAll()
	if err != nil {
		return nil, err
	}

	// 跳过header行
	if len(rows) > 0 {
		rows = rows[1:]
	}

	for _, row := range rows {
		if len(row) >= 18 {
			record, err := cm.rowToRecord(row)
			if err == nil && record.VideoID != "" {
				records[record.VideoID] = record
			}
		}
	}

	return records, nil
}

// WriteRecords 写入所有记录
func (cm *CSVManager) WriteRecords(records map[string]*VideoRecord) error {
	// 确保目录存在
	dir := filepath.Dir(cm.filePath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}

	file, err := os.Create(cm.filePath)
	if err != nil {
		return err
	}
	defer file.Close()

	writer := csv.NewWriter(file)
	defer writer.Flush()

	// 写入头部
	if err := writer.Write(cm.getHeaders()); err != nil {
		return err
	}

	// 写入记录
	for _, record := range records {
		row := cm.recordToRow(record)
		if err := writer.Write(row); err != nil {
			return err
		}
	}

	return nil
}

// AddOrUpdateRecord 添加或更新记录
func (cm *CSVManager) AddOrUpdateRecord(record *VideoRecord) error {
	// 读取现有记录
	records, err := cm.ReadRecords()
	if err != nil {
		return err
	}

	// 添加或更新记录
	records[record.VideoID] = record

	// 写回文件
	return cm.WriteRecords(records)
}

// GetRecord 获取记录
func (cm *CSVManager) GetRecord(videoID string) (*VideoRecord, error) {
	records, err := cm.ReadRecords()
	if err != nil {
		return nil, err
	}

	if record, exists := records[videoID]; exists {
		return record, nil
	}

	return nil, fmt.Errorf("record not found for video ID: %s", videoID)
}

// SafeFilename 安全的文件名处理
func SafeFilename(filename string) string {
	// 替换不安全的字符
	unsafe := []string{"/", "\\", ":", "*", "?", "\"", "<", ">", "|", "\n", "\r", "\t"}
	safe := filename
	for _, char := range unsafe {
		safe = strings.ReplaceAll(safe, char, "_")
	}
	
	// 限制长度
	if len(safe) > 200 {
		safe = safe[:200]
	}
	
	return safe
}