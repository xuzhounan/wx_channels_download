package main

import (
	"bytes"
	_ "embed"
	"encoding/json"
	"fmt"
	"io"
	"net/url"
	"os"
	"os/signal"
	"path"
	"regexp"
	"runtime"
	"strconv"
	"strings"
	"syscall"
	"time"

	"github.com/fatih/color"
	"github.com/qtgolang/SunnyNet/SunnyNet"
	"github.com/qtgolang/SunnyNet/src/http"
	"github.com/qtgolang/SunnyNet/src/public"
	"github.com/spf13/cobra"

	"wx_channel/pkg/certificate"
	"wx_channel/pkg/decrypt"
	"wx_channel/pkg/proxy"
	"wx_channel/pkg/util"
)

//go:embed certs/SunnyRoot.cer
var cert_data []byte

//go:embed lib/FileSaver.min.js
var file_saver_js []byte

//go:embed lib/jszip.min.js
var zip_js []byte

//go:embed inject/main.js
var main_js []byte

var version = "250808"
var v = "?t=" + version
var DefaultPort = 2023
var uninstallFlag bool
var globalDownloadDir string
var globalAutoMode bool
func main() {
	cobra.MousetrapHelpText = ""
	var (
		device      string
		port        int
		downloadDir string
		autoMode    bool
	)

	root_cmd := &cobra.Command{
		Use:   "wx_video_download",
		Short: "启动下载程序",
		Long:  "启动后将对网络请求进行代理，在微信视频号详情页面注入下载按钮",
		Run: func(cmd *cobra.Command, args []string) {
			root_command(RootCommandArg{
				Device:      device,
				Port:        port,
				DownloadDir: downloadDir,
				AutoMode:    autoMode,
			})
		},
	}
	root_cmd.PersistentFlags().BoolVar(&uninstallFlag, "uninstall", false, "卸载 WeChatAppEx_CA 根证书（仅限 Linux）")
	root_cmd.Flags().StringVar(&device, "dev", "", "代理服务器网络设备")
	root_cmd.Flags().IntVar(&port, "port", DefaultPort, "代理服务器端口")
	root_cmd.Flags().StringVar(&downloadDir, "download-dir", "", "自动下载保存目录")
	root_cmd.Flags().BoolVar(&autoMode, "auto", false, "开启自动下载模式")
	var (
		video_url         string
		filename          string
		video_decrypt_key int
	)
	download_cmd := &cobra.Command{
		Use:   "download",
		Short: "下载视频",
		Long:  "从指定URL下载视频文件",
		Run: func(cmd *cobra.Command, args []string) {
			command := cmd.Name()
			if command != "download" {
				return
			}
			download_command(DownloadCommandArgs{
				URL:        video_url,
				DecryptKey: video_decrypt_key,
				Filename:   filename,
			})
		},
	}
	now := int(time.Now().Unix())
	download_cmd.Flags().StringVar(&video_url, "url", "", "视频URL（必需）")
	download_cmd.Flags().IntVar(&video_decrypt_key, "key", 0, "解密密钥（未加密的视频不用传该参数）")
	download_cmd.Flags().StringVar(&filename, "filename", strconv.Itoa(now)+".mp4", "下载后的文件名")
	download_cmd.MarkFlagRequired("url")

	var (
		filepath           string
		video_decrypt_key2 int
	)
	decrypt_cmd := &cobra.Command{
		Use:   "decrypt",
		Short: "解密视频",
		Long:  "使用 key 对本地加密视频进行解密",
		Run: func(cmd *cobra.Command, args []string) {
			command := cmd.Name()
			if command != "decrypt" {
				return
			}
			decrypt_command(DecryptCOmmandArgs{
				Filepath:   video_url,
				DecryptKey: video_decrypt_key,
			})
		},
	}
	decrypt_cmd.Flags().StringVar(&filepath, "filepath", "", "视频地址（必需）")
	decrypt_cmd.Flags().IntVar(&video_decrypt_key2, "key", 0, "解密密钥（必需）")
	decrypt_cmd.MarkFlagRequired("filepath")

	root_cmd.AddCommand(download_cmd)
	root_cmd.AddCommand(decrypt_cmd)
	if err := root_cmd.Execute(); err != nil {
		fmt.Printf("初始化失败 %v", err.Error())
		fmt.Printf("按 Ctrl+C 退出...\n")
		select {}
	}
}

type RootCommandArg struct {
	Device      string
	Port        int
	DownloadDir string
	AutoMode    bool
}

func root_command(args RootCommandArg) {
	os_env := runtime.GOOS
	
	// 设置全局配置
	globalDownloadDir = args.DownloadDir
	globalAutoMode = args.AutoMode
	
	// 验证配置
	if globalAutoMode && globalDownloadDir == "" {
		homedir, err := os.UserHomeDir()
		if err == nil {
			globalDownloadDir = path.Join(homedir, "Downloads", "微信视频号")
		} else {
			globalDownloadDir = "./downloads"
		}
	}
	if globalAutoMode {
		err := os.MkdirAll(globalDownloadDir, 0755)
		if err != nil {
			fmt.Printf("❌ 创建下载目录失败: %v\n", err.Error())
			fmt.Printf("按 Ctrl+C 退出...\n")
			select {}
		}
		fmt.Printf("🚀 自动归档下载模式已开启\n")
		fmt.Printf("📁 下载目录: %s\n", globalDownloadDir)
		fmt.Printf("📂 视频将按用户名自动归档\n")
		fmt.Printf("⚡ 自动跳过重复文件\n")
	}

	signal_chan := make(chan os.Signal, 1)
	// Notify the signal channel on SIGINT (Ctrl+C) and SIGTERM
	signal.Notify(signal_chan, syscall.SIGINT, syscall.SIGTERM)
	// go func() {
	// 	sig := <-signal_chan
	// 	fmt.Printf("\n正在关闭服务...%v\n\n", sig)
	// 	if os_env == "darwin" {
	// 		proxy.DisableProxyInMacOS(proxy.ProxySettings{
	// 			Device:   args.Device,
	// 			Hostname: "127.0.0.1",
	// 			Port:     strconv.Itoa(args.Port),
	// 		})
	// 	}
	// 	os.Exit(0)
	// }()
	go func() {
		sig := <-signal_chan
		fmt.Printf("\n🛑 正在关闭服务...%v\n", sig)
		
		// 强制清理代理设置
		switch os_env {
		case "darwin":
			fmt.Print("🔧 正在清理 macOS 系统代理...")
			err := proxy.DisableProxyInMacOS(proxy.ProxySettings{
				Device:   args.Device,
				Hostname: "127.0.0.1",
				Port:     strconv.Itoa(args.Port),
			})
			if err != nil {
				fmt.Printf("❌ 失败: %v\n", err)
				fmt.Println("⚠️  请手动清理系统代理设置:")
				fmt.Println("   系统偏好设置 → 网络 → 高级 → 代理 → 关闭所有代理")
			} else {
				fmt.Println("✅ 完成")
			}
		case "linux":
			fmt.Print("🔧 正在清理 Linux 系统代理...")
			err := proxy.DisableProxyInLinux()
			if err != nil {
				fmt.Printf("❌ 失败: %v\n", err)
			} else {
				fmt.Println("✅ 完成")
			}
		case "windows":
			fmt.Println("🔧 Windows 使用进程代理，无需清理系统设置")
		}
		
		fmt.Println("\n✅ 服务已安全关闭")
		os.Exit(0)
	}()
	
	fmt.Printf("\nv" + version)
	fmt.Printf("\n问题反馈 https://github.com/ltaoo/wx_channels_download/issues\n")
	
	// 启动时检查并清理残留的代理设置
	if os_env == "darwin" {
		fmt.Print("🔍 检查系统代理设置...")
		err := proxy.DisableProxyInMacOS(proxy.ProxySettings{
			Device:   args.Device,
			Hostname: "127.0.0.1",
			Port:     strconv.Itoa(args.Port),
		})
		if err == nil {
			fmt.Println("✅ 已清理")
		} else {
			fmt.Println("✅ 正常")
		}
	}
	existing, err1 := certificate.CheckCertificate("SunnyNet")
	if err1 != nil {
		fmt.Printf("\nERROR %v\v", err1.Error())
		fmt.Printf("按 Ctrl+C 退出...\n")
		select {}
	}
	if !existing {
		fmt.Printf("\n\n正在安装证书...\n")
		err := certificate.InstallCertificate(cert_data)
		time.Sleep(3 * time.Second)
		if err != nil {
			fmt.Printf("\nERROR %v\n", err.Error())
			fmt.Printf("按 Ctrl+C 退出...\n")
			select {}
		}
	}
	var Sunny = SunnyNet.NewSunny()
	Sunny.SetGoCallback(HttpCallback, nil, nil, nil)
	Sunny.SetPort(args.Port).Start()
	err := Sunny.Error
	if err != nil {
		fmt.Printf("\nERROR %v\n", err.Error())
		fmt.Printf("按 Ctrl+C 退出...\n")
		select {}
	}
	if os_env == "windows" {
		ok := Sunny.OpenDrive(true)
		if !ok {
			fmt.Printf("\nERROR 启动进程代理失败，检查是否以管理员身份运行\n")
			fmt.Printf("按 Ctrl+C 退出...\n")
			select {}
		}
		Sunny.ProcessAddName("WeChatAppEx.exe")
	}
	if os_env == "darwin" {
		err := proxy.EnableProxyInMacOS(proxy.ProxySettings{
			Device:   args.Device,
			Hostname: "127.0.0.1",
			Port:     strconv.Itoa(args.Port),
		})
		if err != nil {
			fmt.Printf("\nERROR 设置代理失败 %v\n", err.Error())
			fmt.Printf("按 Ctrl+C 退出...\n")
			select {}
		}
	}
	if os_env == "linux" {
        if uninstallFlag {
            err := certificate.UninstallCertificateInLinux()
            if err != nil {
                fmt.Printf("证书卸载失败: %v\n", err)
                os.Exit(1)
            }
            fmt.Println("✅ 证书卸载成功")
            os.Exit(0)
        } else {
            err := certificate.InstallCertificateInLinux(cert_data)
            if err != nil {
                fmt.Printf("证书安装失败: %v\n", err)
                os.Exit(1)
            }
        }

        err := proxy.EnableProxyInLinux(proxy.ProxySettings{
            Hostname: "127.0.0.1",
            Port:     strconv.Itoa(args.Port),
        })
        if err != nil {
            fmt.Printf("设置系统代理失败: %v\n", err)
            os.Exit(1)
        }

        Sunny.ProcessAddName("WeChatAppEx")
    }
	
	if globalAutoMode {
		color.Green("\n\n✅ 自动下载服务已启动！")
		fmt.Println("📱 请打开微信视频号，浏览视频即可自动下载")
		fmt.Println("🎯 完全自动，无需手动操作")
		fmt.Println("\n⚠️  按 Ctrl+C 退出服务")
	} else {
		color.Green("\n\n✅ 服务已正确启动，请打开需要下载的视频号页面进行下载")
		fmt.Println("\n\n服务正在运行，按 Ctrl+C 退出...")
	}
	select {}
}

type DownloadCommandArgs struct {
	URL        string
	Filename   string
	DecryptKey int
}

func download_command(args DownloadCommandArgs) {
	resp, err := http.Get(args.URL)
	if err != nil {
		fmt.Printf("[ERROR]下载失败 %v\n", err.Error())
		return
	}
	defer resp.Body.Close()
	homedir, err := os.UserHomeDir()
	if err != nil {
		fmt.Printf("[ERROR]获取下载路径失败 %v\n", err.Error())
		return
	}
	tmp_filename := "wx_" + strconv.Itoa(int(time.Now().Unix()))
	tmp_dest_filepath := path.Join(homedir, "Downloads", tmp_filename)
	dest_filepath := path.Join(homedir, "Downloads", args.Filename)
	file, err := os.Create(tmp_dest_filepath)
	if err != nil {
		fmt.Printf("[ERROR]下载文件失败 %v\n", err.Error())
		os.Exit(0)
		return
	}
	defer file.Close()
	content_length := resp.Header.Get("Content-Length")
	total_size := int64(-1)
	if content_length != "" {
		total_size, _ = strconv.ParseInt(content_length, 10, 64)
	}
	buf := make([]byte, 32*1024) // 32KB buffer
	var downloaded int64 = 0
	for {
		n, err := resp.Body.Read(buf)
		if n > 0 {
			_, werr := file.Write(buf[:n])
			if werr != nil {
				fmt.Printf("[ERROR]写入文件失败 %v\n", werr.Error())
				return
			}
			downloaded += int64(n)
			if total_size > 0 {
				percent := float64(downloaded) / float64(total_size) * 100
				fmt.Printf("\r\033[K已下载: %d/%d 字节 (%.2f%%)", downloaded, total_size, percent)
			} else {
				fmt.Printf("\r\033[K已下载: %d 字节", downloaded)
			}
		}
		if err == io.EOF {
			break
		}
		if err != nil {
			fmt.Printf("[ERROR]下载文件失败2 %v\n", err.Error())
			return
		}
	}
	fmt.Println()
	if args.DecryptKey != 0 {
		fmt.Printf("开始对文件解密 %s", tmp_dest_filepath)
		length := uint32(131072)
		enclen_str := resp.Header.Get("X-enclen")
		if enclen_str != "" {
			v, err := strconv.ParseUint(enclen_str, 10, 32)
			if err == nil {
				length = uint32(v)
			}
		}
		key := uint64(args.DecryptKey)
		data, err := os.ReadFile(tmp_dest_filepath)
		if err != nil {
			fmt.Printf("[ERROR]读取已下载的文件失败 %v\n", err.Error())
			return
		}
		decrypt.DecryptData(data, length, key)
		err = os.WriteFile(dest_filepath, data, 0644)
		if err != nil {
			fmt.Printf("[ERROR]写入文件失败 %v\n", err.Error())
			return
		}
		file.Close()
		err = os.Remove(tmp_dest_filepath)
		if err != nil {
			if os.IsNotExist(err) {
				fmt.Println("[ERROR]临时文件不存在")
			} else if os.IsPermission(err) {
				fmt.Println("[ERROR]没有权限删除临时文件")
			} else {
				fmt.Printf("[ERROR]临时文件删除失败 %v\n", err.Error())
			}
		}
		fmt.Printf("解密完成，文件路径为 %s\n", dest_filepath)
		return
	}
	file.Close()
	err = os.Rename(tmp_dest_filepath, dest_filepath)
	if err != nil {
		fmt.Printf("[ERROR]重命名文件失败 %v\n", err.Error())
		return
	}
	fmt.Printf("下载完成，件路径为 %s\n", dest_filepath)
}

type DecryptCOmmandArgs struct {
	Filepath   string
	DecryptKey int
}

func decrypt_command(args DecryptCOmmandArgs) {
	fmt.Printf("开始对文件解密 %s", args.Filepath)
	length := uint32(131072)
	key := uint64(args.DecryptKey)
	data, err := os.ReadFile(args.Filepath)
	if err != nil {
		fmt.Printf("[ERROR]读取已下载的文件失败 %v\n", err.Error())
		return
	}
	decrypt.DecryptData(data, length, key)
	err = os.WriteFile(args.Filepath, data, 0644)
	if err != nil {
		fmt.Printf("[ERROR]写入文件失败 %v\n", err.Error())
		return
	}
	fmt.Printf("解密完成 %s", args.Filepath)
}

// 格式化字节大小
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

func handleAutoDownload(req AutoDownloadRequest) {
	if !globalAutoMode {
		return
	}
	
	// 构建用户目录
	userDir := req.Nickname
	if userDir == "" {
		userDir = "未知用户"
	}
	userDir = util.SafeFilename(userDir)
	
	// 创建用户子目录
	userPath := path.Join(globalDownloadDir, userDir)
	err := os.MkdirAll(userPath, 0755)
	if err != nil {
		fmt.Printf("[自动下载] 创建用户目录失败: %v\n", err)
		return
	}
	
	// 生成文件名
	filename := req.Filename
	if filename == "" {
		if req.Title != "" {
			filename = req.Title
		} else if req.VideoID != "" {
			filename = req.VideoID
		} else {
			filename = strconv.Itoa(int(time.Now().Unix()))
		}
	}
	filename = util.SafeFilename(filename)
	
	// 检查是否已存在（重复检测）
	var targetFile string
	switch req.Type {
	case "picture":
		targetFile = path.Join(userPath, filename+".zip")
	default:
		targetFile = path.Join(userPath, filename+".mp4")
	}
	
	if _, err := os.Stat(targetFile); err == nil {
		fmt.Printf("⏭️  文件已存在，跳过: %s/%s\n", userDir, filename)
		return
	}
	
	// 如果是视频，也检查基于VideoID的文件名
	if req.Type == "media" && req.VideoID != "" && req.VideoID != filename {
		videoIdFile := path.Join(userPath, util.SafeFilename(req.VideoID)+".mp4")
		if _, err := os.Stat(videoIdFile); err == nil {
			fmt.Printf("⏭️  视频已存在，跳过: %s/%s\n", userDir, util.SafeFilename(req.VideoID))
			return
		}
	}
	
	fmt.Printf("\n🎬 用户: %s\n", req.Nickname)
	fmt.Printf("📁 目录: %s\n", userDir)
	
	switch req.Type {
	case "picture":
		downloadPictureAutoWithPath(req, filename, userPath)
	case "media":
		if req.Key != 0 {
			fmt.Printf("🔐 加密视频，开始下载并解密: %s\n", filename)
			downloadEncryptedVideoAutoWithPath(req, filename, userPath)
		} else {
			fmt.Printf("🎥 开始下载视频: %s\n", filename)
			downloadVideoAutoWithPath(req, filename, userPath)
		}
	default:
		fmt.Printf("❓ 未知类型: %s\n", req.Type)
	}
}

func downloadVideoAutoWithPath(req AutoDownloadRequest, filename, targetDir string) {
	resp, err := http.Get(req.URL)
	if err != nil {
		fmt.Printf("❌ 下载失败: %v\n", err.Error())
		return
	}
	defer resp.Body.Close()
	
	filepath := path.Join(targetDir, filename+".mp4")
	file, err := os.Create(filepath)
	if err != nil {
		fmt.Printf("❌ 创建文件失败: %v\n", err.Error())
		return
	}
	defer file.Close()
	
	// 获取文件大小
	contentLength := resp.Header.Get("Content-Length")
	var totalSize int64
	if contentLength != "" {
		totalSize, _ = strconv.ParseInt(contentLength, 10, 64)
	}
	
	// 带进度的复制
	var downloaded int64
	buffer := make([]byte, 32*1024) // 32KB buffer
	
	for {
		n, err := resp.Body.Read(buffer)
		if n > 0 {
			_, writeErr := file.Write(buffer[:n])
			if writeErr != nil {
				fmt.Printf("❌ 写入失败: %v\n", writeErr.Error())
				return
			}
			downloaded += int64(n)
			
			if totalSize > 0 {
				percent := float64(downloaded) / float64(totalSize) * 100
				fmt.Printf("\r📥 下载中: %.1f%% (%s/%s)", 
					percent, 
					formatBytes(downloaded), 
					formatBytes(totalSize))
			} else {
				fmt.Printf("\r📥 已下载: %s", formatBytes(downloaded))
			}
		}
		if err == io.EOF {
			break
		}
		if err != nil {
			fmt.Printf("\n❌ 下载出错: %v\n", err.Error())
			return
		}
	}
	
	fmt.Printf("\n✅ 下载完成: %s\n", filepath)
}

func downloadEncryptedVideoAutoWithPath(req AutoDownloadRequest, filename, targetDir string) {
	resp, err := http.Get(req.URL)
	if err != nil {
		fmt.Printf("❌ 下载失败: %v\n", err.Error())
		return
	}
	defer resp.Body.Close()
	
	// 获取文件大小
	contentLength := resp.Header.Get("Content-Length")
	var totalSize int64
	if contentLength != "" {
		totalSize, _ = strconv.ParseInt(contentLength, 10, 64)
	}
	
	// 带进度的读取
	var data []byte
	var downloaded int64
	buffer := make([]byte, 32*1024) // 32KB buffer
	
	for {
		n, err := resp.Body.Read(buffer)
		if n > 0 {
			data = append(data, buffer[:n]...)
			downloaded += int64(n)
			
			if totalSize > 0 {
				percent := float64(downloaded) / float64(totalSize) * 100
				fmt.Printf("\r📥 下载中: %.1f%% (%s/%s)", 
					percent, 
					formatBytes(downloaded), 
					formatBytes(totalSize))
			} else {
				fmt.Printf("\r📥 已下载: %s", formatBytes(downloaded))
			}
		}
		if err == io.EOF {
			break
		}
		if err != nil {
			fmt.Printf("\n❌ 下载出错: %v\n", err.Error())
			return
		}
	}
	
	fmt.Print("\r🔓 正在解密...")
	
	// 解密
	length := uint32(131072)
	enclen_str := resp.Header.Get("X-enclen")
	if enclen_str != "" {
		v, err := strconv.ParseUint(enclen_str, 10, 32)
		if err == nil {
			length = uint32(v)
		}
	}
	key := uint64(req.Key)
	decrypt.DecryptData(data, length, key)
	
	filepath := path.Join(targetDir, filename+".mp4")
	err = os.WriteFile(filepath, data, 0644)
	if err != nil {
		fmt.Printf("\n❌ 写入文件失败: %v\n", err.Error())
		return
	}
	
	fmt.Printf("\r✅ 下载并解密完成: %s\n", filepath)
}

func downloadPictureAutoWithPath(req AutoDownloadRequest, filename, targetDir string) {
	if len(req.Files) == 0 {
		fmt.Printf("❌ 没有图片文件\n")
		return
	}
	
	fmt.Printf("📸 开始下载 %d 张图片\n", len(req.Files))
	
	for i, file := range req.Files {
		url := file["url"].(string)
		resp, err := http.Get(url)
		if err != nil {
			fmt.Printf("❌ 图片 %d/%d 下载失败: %v\n", i+1, len(req.Files), err.Error())
			continue
		}
		defer resp.Body.Close()
		
		filepath := path.Join(targetDir, fmt.Sprintf("%s_%d.jpg", filename, i+1))
		outFile, err := os.Create(filepath)
		if err != nil {
			fmt.Printf("❌ 图片 %d/%d 创建文件失败: %v\n", i+1, len(req.Files), err.Error())
			resp.Body.Close()
			continue
		}
		
		_, err = io.Copy(outFile, resp.Body)
		outFile.Close()
		resp.Body.Close()
		
		if err != nil {
			fmt.Printf("❌ 图片 %d/%d 写入失败: %v\n", i+1, len(req.Files), err.Error())
			continue
		}
		
		fmt.Printf("✅ 图片 %d/%d 下载完成\n", i+1, len(req.Files))
	}
}

type ChannelProfile struct {
	Title string `json:"title"`
}
type FrontendTip struct {
	End     int    `json:"end"`
	Replace int    `json:"replace"`
	Msg     string `json:"msg"`
}

type AutoDownloadRequest struct {
	URL        string `json:"url"`
	Filename   string `json:"filename"`
	Key        int    `json:"key"`
	Type       string `json:"type"`
	Title      string `json:"title"`
	CoverURL   string `json:"coverUrl"`
	Files      []map[string]interface{} `json:"files"`
	Username   string `json:"username"`
	Nickname   string `json:"nickname"`
	VideoID    string `json:"videoId"`
}

func HttpCallback(Conn SunnyNet.ConnHTTP) {
	u := Conn.URL()
	parsed_url, err := url.Parse(u)
	if err != nil {
		fmt.Printf("URL解析失败: %v\n", err)
		return
	}
	hostname := parsed_url.Hostname()
	path := parsed_url.Path
	if Conn.Type() == public.HttpSendRequest {
		Conn.GetRequestHeader().Del("Accept-Encoding")
		if util.Includes(path, "jszip") {
			headers := http.Header{}
			headers.Set("Content-Type", "application/javascript")
			headers.Set("__debug", "local_file")
			Conn.StopRequest(200, zip_js, headers)
			return
		}
		if util.Includes(path, "FileSaver.min") {
			headers := http.Header{}
			headers.Set("Content-Type", "application/javascript")
			headers.Set("__debug", "local_file")
			Conn.StopRequest(200, file_saver_js, headers)
			return
		}
		if path == "/__wx_channels_api/profile" {
			request_body := Conn.GetRequestBody()
			
			// 如果开启自动模式，直接触发下载
			if globalAutoMode {
				var profileData map[string]interface{}
				err := json.Unmarshal(request_body, &profileData)
				if err == nil {
					
					// 构造自动下载请求
					autoReq := AutoDownloadRequest{
						Title: fmt.Sprintf("%v", profileData["title"]),
						Type:  fmt.Sprintf("%v", profileData["type"]),
					}
					
					// 提取基本字段
					if url, ok := profileData["url"]; ok {
						autoReq.URL = fmt.Sprintf("%v", url)
					}
					if key, ok := profileData["key"]; ok {
						if keyStr, ok := key.(string); ok {
							if keyInt, err := strconv.ParseInt(keyStr, 10, 64); err == nil {
								autoReq.Key = int(keyInt)
							}
						} else if keyInt, ok := key.(float64); ok {
							autoReq.Key = int(keyInt)
						}
					}
					if coverUrl, ok := profileData["coverUrl"]; ok {
						autoReq.CoverURL = fmt.Sprintf("%v", coverUrl)
					}
					if id, ok := profileData["id"]; ok {
						autoReq.VideoID = fmt.Sprintf("%v", id)
					}
					if nickname, ok := profileData["nickname"]; ok {
						autoReq.Nickname = fmt.Sprintf("%v", nickname)
					}
					
					// 提取用户名（从contact中获取）
					if contact, ok := profileData["contact"]; ok {
						if contactMap, ok := contact.(map[string]interface{}); ok {
							if username, ok := contactMap["username"]; ok {
								autoReq.Username = fmt.Sprintf("%v", username)
							}
							// 如果没有nickname，从contact中获取
							if autoReq.Nickname == "" {
								if nickname, ok := contactMap["nickname"]; ok {
									autoReq.Nickname = fmt.Sprintf("%v", nickname)
								}
							}
						}
					}
					
					// 提取files字段（用于图片内容）
					if files, ok := profileData["files"]; ok {
						if filesArray, ok := files.([]interface{}); ok {
							autoReq.Files = make([]map[string]interface{}, len(filesArray))
							for i, file := range filesArray {
								if fileMap, ok := file.(map[string]interface{}); ok {
									autoReq.Files[i] = fileMap
								}
							}
						}
					}
					
					// 异步触发下载
					go handleAutoDownload(autoReq)
				}
			}
			
			var data ChannelProfile
			err := json.Unmarshal(request_body, &data)
			if err != nil {
				fmt.Println(err.Error())
			}
			fmt.Printf("\n打开了视频\n%s\n", data.Title)
			headers := http.Header{}
			headers.Set("Content-Type", "application/json")
			headers.Set("__debug", "fake_resp")
			Conn.StopRequest(200, "{}", headers)
			return
		}
		if path == "/__wx_channels_api/tip" {
			var data FrontendTip
			request_body := Conn.GetRequestBody()
			err := json.Unmarshal(request_body, &data)
			if err != nil {
				fmt.Println(err.Error())
			}
			if data.End == 1 {
				fmt.Println()
			} else if data.Replace == 1 {
				fmt.Printf("\r\033[K[FRONTEND]%s", data.Msg)
			} else {
				fmt.Printf("[FRONTEND]%s\n", data.Msg)
			}
			headers := http.Header{}
			headers.Set("Content-Type", "application/json")
			headers.Set("__debug", "fake_resp")
			Conn.StopRequest(200, "{}", headers)
			return
		}
		if path == "/__wx_channels_api/auto_download" {
			var data AutoDownloadRequest
			request_body := Conn.GetRequestBody()
			err := json.Unmarshal(request_body, &data)
			if err != nil {
				headers := http.Header{}
				headers.Set("Content-Type", "application/json")
				Conn.StopRequest(400, `{"error":"解析请求失败"}`, headers)
				return
			}
			
			// 处理自动下载
			go handleAutoDownload(data)
			
			headers := http.Header{}
			headers.Set("Content-Type", "application/json")
			Conn.StopRequest(200, `{"success":true}`, headers)
			return
		}
	}
	if Conn.Type() == public.HttpResponseOK {
		content_type := strings.ToLower(Conn.GetResponseHeader().Get("Content-Type"))
		if Conn.GetResponseBody() != nil {
			request_body := Conn.GetResponseBody()
			// if content_type == "text/css" {
			// 	Conn.Response.Body = io.NopCloser(bytes.NewBuffer(Body))
			// 	return
			// }
			// if content_type == "image/svg+xml" {
			// 	Conn.Response.Body = io.NopCloser(bytes.NewBuffer(Body))
			// 	return
			// }
			// if content_type == "image/jpeg" {
			// 	Conn.Response.Body = io.NopCloser(bytes.NewBuffer(Body))
			// 	return
			// }
			// if content_type == "image/jpg" {
			// 	Conn.Response.Body = io.NopCloser(bytes.NewBuffer(Body))
			// 	return
			// }
			// if content_type == "image/png" {
			// 	Conn.Response.Body = io.NopCloser(bytes.NewBuffer(Body))
			// 	return
			// }
			// if content_type == "image/gif" {
			// 	Conn.Response.Body = io.NopCloser(bytes.NewBuffer(Body))
			// 	return
			// }
			// if content_type == "video/mp4" {
			// 	Conn.Response.Body = io.NopCloser(bytes.NewBuffer(Body))
			// 	return
			// }
			// if path == "/web/report-perf" {
			// 	Conn.Response.Body = io.NopCloser(bytes.NewBuffer(Body))
			// 	return
			// }
			// fmt.Println("HttpCallback", Conn.Type, host, path)
			// fmt.Println("Response ContentType is", content_type)
			if content_type == "text/html; charset=utf-8" {
				// fmt.Println("\n\n检测到页面打开")
				// fmt.Println(path)
				html := string(request_body)
				script_reg1 := regexp.MustCompile(`src="([^"]{1,})\.js"`)
				html = script_reg1.ReplaceAllString(html, `src="$1.js`+v+`"`)
				script_reg2 := regexp.MustCompile(`href="([^"]{1,})\.js"`)
				html = script_reg2.ReplaceAllString(html, `href="$1.js`+v+`"`)
				Conn.GetResponseHeader().Set("__debug", "append_script")
				script2 := ""
				// script2 := `<script
				//       crossorigin="anonymous"
				//       src="https://pagespy.jikejishu.com/page-spy/index.min.js"
				//     ></script>
				//     <script
				//       crossorigin="anonymous"
				//       src="https://pagespy.jikejishu.com/plugin/data-harbor/index.min.js"
				//     ></script>
				//     <script
				//       crossorigin="anonymous"
				//       src="https://pagespy.jikejishu.com/plugin/rrweb/index.min.js"
				//     ></script>
				//     <!-- 使用第二步：实例化 PageSpy -->
				//     <script>
				//       window.$harbor = new DataHarborPlugin();
				//       window.$rrweb = new RRWebPlugin();
				//       [window.$harbor, window.$rrweb].forEach((p) => {
				//         PageSpy.registerPlugin(p);
				//       });

				//       // 实例化的参数都是可选的
				//       window.$pageSpy = new PageSpy({
				//         api: "pagespy.jikejishu.com",
				//         clientOrigin: "https://pagespy.jikejishu.com",
				//         project: "React 演示",
				//         autoRender: true,
				//         title: "PageSpy 🤝 React",
				//       });
				//       // 之后即可使用 PageSpy，前往 https://pagespy.jikejishu.com 体验
				//     </script>`
				if hostname == "channels.weixin.qq.com" && (path == "/web/pages/feed" || path == "/web/pages/home") {
					script := fmt.Sprintf(`<script>%s</script>`, main_js)
					autoModeScript := ""
					if globalAutoMode {
						autoModeScript = fmt.Sprintf(`<script>
						(function() {
							if (window.__wx_channels_store__) {
								window.__wx_channels_store__.autoMode = true;
							} else {
								setTimeout(function() {
									if (window.__wx_channels_store__) {
										window.__wx_channels_store__.autoMode = true;
									}
								}, 100);
							}
						})();
						</script>`)
					}
					html = strings.Replace(html, "<head>", "<head>\n"+script+autoModeScript+script2, 1)
					Conn.SetResponseBodyIO(io.NopCloser(bytes.NewBuffer([]byte(html))))
					return
				}
				Conn.SetResponseBodyIO(io.NopCloser(bytes.NewBuffer([]byte(html))))
				return
			}
			if content_type == "application/javascript" {
				content := string(request_body)
				dep_reg := regexp.MustCompile(`"js/([^"]{1,})\.js"`)
				from_reg := regexp.MustCompile(`from {0,1}"([^"]{1,})\.js"`)
				lazy_import_reg := regexp.MustCompile(`import\("([^"]{1,})\.js"\)`)
				import_reg := regexp.MustCompile(`import {0,1}"([^"]{1,})\.js"`)
				content = from_reg.ReplaceAllString(content, `from"$1.js`+v+`"`)
				content = dep_reg.ReplaceAllString(content, `"js/$1.js`+v+`"`)
				content = lazy_import_reg.ReplaceAllString(content, `import("$1.js`+v+`")`)
				content = import_reg.ReplaceAllString(content, `import"$1.js`+v+`"`)
				Conn.GetResponseHeader().Set("__debug", "replace_script")

				if util.Includes(path, "/t/wx_fed/finder/web/web-finder/res/js/index.publish") {
					regexp1 := regexp.MustCompile(`this.sourceBuffer.appendBuffer\(h\),`)
					replaceStr1 := `(() => {
if (window.__wx_channels_store__) {
window.__wx_channels_store__.buffers.push(h);
}
})(),this.sourceBuffer.appendBuffer(h),`
					if regexp1.MatchString(content) {
						fmt.Println("2. 视频播放 js 修改成功")
					}
					content = regexp1.ReplaceAllString(content, replaceStr1)
					regexp2 := regexp.MustCompile(`if\(f.cmd===re.MAIN_THREAD_CMD.AUTO_CUT`)
					replaceStr2 := `if(f.cmd==="CUT"){
	if (window.__wx_channels_store__) {
	console.log("CUT", f, __wx_channels_store__.profile.key);
	window.__wx_channels_store__.keys[__wx_channels_store__.profile.key]=f.decryptor_array;
	}
}
if(f.cmd===re.MAIN_THREAD_CMD.AUTO_CUT`
					content = regexp2.ReplaceAllString(content, replaceStr2)
					Conn.SetResponseBodyIO(io.NopCloser(bytes.NewBuffer([]byte(content))))
					return
				}
				if util.Includes(path, "/t/wx_fed/finder/web/web-finder/res/js/virtual_svg-icons-register") {
					regexp1 := regexp.MustCompile(`async finderGetCommentDetail\((\w+)\)\{return(.*?)\}async`)
					replaceStr1 := `async finderGetCommentDetail($1) {
					var feedResult = await$2;
					var data_object = feedResult.data.object;
					if (!data_object.objectDesc) {
						return feedResult;
					}
					var media = data_object.objectDesc.media[0];
					var profile = media.mediaType !== 4 ? {
						type: "picture",
						id: data_object.id,
						title: data_object.objectDesc.description,
						files: data_object.objectDesc.media,
						spec: [],
						contact: data_object.contact
					} : {
						type: "media",
						duration: media.spec[0].durationMs,
						spec: media.spec,
						title: data_object.objectDesc.description,
						coverUrl: media.coverUrl,
						url: media.url+media.urlToken,
						size: media.fileSize,
						key: media.decodeKey,
						id: data_object.id,
						nonce_id: data_object.objectNonceId,
						nickname: data_object.nickname,
						createtime: data_object.createtime,
						fileFormat: media.spec.map(o => o.fileFormat),
						contact: data_object.contact
					};
					fetch("/__wx_channels_api/profile", {
						method: "POST",
						headers: {
							"Content-Type": "application/json"
						},
						body: JSON.stringify(profile)
					});
					if (window.__wx_channels_store__) {
					__wx_channels_store__.profile = profile;
					window.__wx_channels_store__.profiles.push(profile);
					
					// 直接调用自动下载逻辑
					if (window.__wx_channels_store__.autoMode) {
						var filename = profile.title || profile.id || new Date().valueOf();
						var downloadData = {
							url: profile.url,
							filename: filename,
							key: profile.key || 0,
							type: profile.type,
							title: profile.title,
							coverUrl: profile.coverUrl,
							files: profile.files || []
						};
						
						fetch("/__wx_channels_api/auto_download", {
							method: "POST",
							headers: {"Content-Type": "application/json"},
							body: JSON.stringify(downloadData)
						}).then(function(response) {
							return response.json();
						}).then(function(data) {
							if (data.success) {
								window.__wx_log({msg: "[自动下载] " + filename});
							}
						}).catch(function(err) {
							window.__wx_log({msg: "[自动下载错误] " + err.message});
						});
					}
					}
					return feedResult;
				}async`
					if regexp1.MatchString(content) {
						fmt.Println("3. 视频详情页 js 修改成功")
					}
					content = regexp1.ReplaceAllString(content, replaceStr1)
					regex2 := regexp.MustCompile(`i.default={dialog`)
					replaceStr2 := `i.default=window.window.__wx_channels_tip__={dialog`
					content = regex2.ReplaceAllString(content, replaceStr2)
					regex5 := regexp.MustCompile(`this.updateDetail\(o\)`)
					replaceStr5 := `(() => {
					if (Object.keys(o).length===0){
					return;
					}
					var data_object = o;
					var media = data_object.objectDesc.media[0];
					var profile = media.mediaType !== 4 ? {
						type: "picture",
						id: data_object.id,
						title: data_object.objectDesc.description,
						files: data_object.objectDesc.media,
						spec: [],
						contact: data_object.contact
					} : {
						type: "media",
						duration: media.spec[0].durationMs,
						spec: media.spec,
						title: data_object.objectDesc.description,
						url: media.url+media.urlToken,
						size: media.fileSize,
						key: media.decodeKey,
						id: data_object.id,
						nonce_id: data_object.objectNonceId,
						nickname: data_object.nickname,
						createtime: data_object.createtime,
						fileFormat: media.spec.map(o => o.fileFormat),
						contact: data_object.contact
					};
					if (window.__wx_channels_store__) {
window.__wx_channels_store__.profiles.push(profile);

// 直接调用自动下载逻辑
if (window.__wx_channels_store__.autoMode) {
	var filename = profile.title || profile.id || new Date().valueOf();
	var downloadData = {
		url: profile.url,
		filename: filename,
		key: profile.key || 0,
		type: profile.type,
		title: profile.title,
		coverUrl: profile.coverUrl,
		files: profile.files || []
	};
	
	fetch("/__wx_channels_api/auto_download", {
		method: "POST",
		headers: {"Content-Type": "application/json"},
		body: JSON.stringify(downloadData)
	}).then(function(response) {
		return response.json();
	}).then(function(data) {
		if (data.success) {
			window.__wx_log({msg: "[自动下载] " + filename});
		}
	}).catch(function(err) {
		window.__wx_log({msg: "[自动下载错误] " + err.message});
	});
}
					}
					})(),this.updateDetail(o)`
					content = regex5.ReplaceAllString(content, replaceStr5)
					Conn.SetResponseBodyIO(io.NopCloser(bytes.NewBuffer([]byte(content))))
					return
				}
				if util.Includes(path, "/t/wx_fed/finder/web/web-finder/res/js/FeedDetail.publish") {
					regex := regexp.MustCompile(`,"投诉"\)]`)
					replaceStr := `,"投诉_update"),...(() => {
					if (window.__wx_channels_store__ && window.__wx_channels_store__.profile) {
						return window.__wx_channels_store__.profile.spec.map((sp) => {
							return f("div",{class:"context-item",role:"button",onClick:() => __wx_channels_handle_click_download__(sp)},sp.fileFormat);
						});
					}
					})(),f("div",{class:"context-item",role:"button",onClick:()=>__wx_channels_handle_click_download__()},"原始视频"),f("div",{class:"context-item",role:"button",onClick:__wx_channels_download_cur__},"当前视频"),f("div",{class:"context-item",role:"button",onClick:__wx_channels_handle_print_download_command},"打印下载命令"),f("div",{class:"context-item",role:"button",onClick:()=>__wx_channels_handle_download_cover()},"下载封面"),f("div",{class:"context-item",role:"button",onClick:__wx_channels_handle_copy__},"复制页面链接")]`
					content = regex.ReplaceAllString(content, replaceStr)
					Conn.SetResponseBodyIO(io.NopCloser(bytes.NewBuffer([]byte(content))))
					return
				}
				if util.Includes(path, "worker_release") {
					regex := regexp.MustCompile(`fmp4Index:p.fmp4Index`)
					replaceStr := `decryptor_array:p.decryptor_array,fmp4Index:p.fmp4Index`
					content = regex.ReplaceAllString(content, replaceStr)
					Conn.SetResponseBodyIO(io.NopCloser(bytes.NewBuffer([]byte(content))))
					return
				}
				Conn.SetResponseBodyIO(io.NopCloser(bytes.NewBuffer([]byte(content))))
				return
			}
			Conn.SetResponseBodyIO(io.NopCloser(bytes.NewBuffer([]byte(request_body))))
		}

	}
	if Conn.Type() == public.HttpRequestFail {
		//请求错误
		// Body := []byte("Hello Sunny Response")
		// Conn.Response = &http.Response{
		// 	Body: io.NopCloser(bytes.NewBuffer(Body)),
		// }
	}
}
