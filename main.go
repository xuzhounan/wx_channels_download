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
			fmt.Printf("ERROR 创建下载目录失败: %v\n", err.Error())
			fmt.Printf("按 Ctrl+C 退出...\n")
			select {}
		}
		fmt.Printf("自动下载模式已开启，下载目录: %s\n", globalDownloadDir)
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
		fmt.Printf("\n正在关闭服务...%v\n\n", sig)
		switch os_env {
		case "darwin":
			proxy.DisableProxyInMacOS(proxy.ProxySettings{
							Device:   args.Device,
							Hostname: "127.0.0.1",
							Port:     strconv.Itoa(args.Port),
						})
		case "linux":
			err := proxy.DisableProxyInLinux()
			if err != nil {
				fmt.Printf("⚠️ 关闭 Linux 系统代理失败: %v\n", err)
			}
		}
		os.Exit(0)
	}()
	
	fmt.Printf("\nv" + version)
	fmt.Printf("\n问题反馈 https://github.com/ltaoo/wx_channels_download/issues\n")
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
	
	color.Green(fmt.Sprintf("\n\n服务已正确启动，请打开需要下载的视频号页面进行下载"))
	fmt.Println("\n\n服务正在运行，按 Ctrl+C 退出...")
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

func handleAutoDownload(req AutoDownloadRequest) {
	if !globalAutoMode {
		return
	}
	
	filename := req.Filename
	if filename == "" {
		if req.Title != "" {
			filename = req.Title
		} else {
			filename = strconv.Itoa(int(time.Now().Unix()))
		}
	}
	
	// 清理文件名中的非法字符
	filename = util.SafeFilename(filename)
	
	fmt.Printf("\n[自动下载] 开始下载: %s\n", filename)
	
	switch req.Type {
	case "picture":
		downloadPictureAuto(req, filename)
	case "media":
		if req.Key != 0 {
			downloadEncryptedVideoAuto(req, filename)
		} else {
			downloadVideoAuto(req, filename)
		}
	default:
		fmt.Printf("[自动下载] 未知类型: %s\n", req.Type)
	}
}

func downloadVideoAuto(req AutoDownloadRequest, filename string) {
	resp, err := http.Get(req.URL)
	if err != nil {
		fmt.Printf("[自动下载] 下载失败: %v\n", err.Error())
		return
	}
	defer resp.Body.Close()
	
	filepath := path.Join(globalDownloadDir, filename+".mp4")
	file, err := os.Create(filepath)
	if err != nil {
		fmt.Printf("[自动下载] 创建文件失败: %v\n", err.Error())
		return
	}
	defer file.Close()
	
	_, err = io.Copy(file, resp.Body)
	if err != nil {
		fmt.Printf("[自动下载] 写入文件失败: %v\n", err.Error())
		return
	}
	
	fmt.Printf("[自动下载] 下载完成: %s\n", filepath)
}

func downloadEncryptedVideoAuto(req AutoDownloadRequest, filename string) {
	resp, err := http.Get(req.URL)
	if err != nil {
		fmt.Printf("[自动下载] 下载失败: %v\n", err.Error())
		return
	}
	defer resp.Body.Close()
	
	data, err := io.ReadAll(resp.Body)
	if err != nil {
		fmt.Printf("[自动下载] 读取数据失败: %v\n", err.Error())
		return
	}
	
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
	
	filepath := path.Join(globalDownloadDir, filename+".mp4")
	err = os.WriteFile(filepath, data, 0644)
	if err != nil {
		fmt.Printf("[自动下载] 写入文件失败: %v\n", err.Error())
		return
	}
	
	fmt.Printf("[自动下载] 下载并解密完成: %s\n", filepath)
}

func downloadPictureAuto(req AutoDownloadRequest, filename string) {
	// 这里简化处理，只下载第一张图片
	if len(req.Files) == 0 {
		fmt.Printf("[自动下载] 没有图片文件\n")
		return
	}
	
	for i, file := range req.Files {
		url := file["url"].(string)
		resp, err := http.Get(url)
		if err != nil {
			fmt.Printf("[自动下载] 下载图片失败: %v\n", err.Error())
			continue
		}
		defer resp.Body.Close()
		
		filepath := path.Join(globalDownloadDir, fmt.Sprintf("%s_%d.jpg", filename, i+1))
		outFile, err := os.Create(filepath)
		if err != nil {
			fmt.Printf("[自动下载] 创建图片文件失败: %v\n", err.Error())
			resp.Body.Close()
			continue
		}
		
		_, err = io.Copy(outFile, resp.Body)
		outFile.Close()
		resp.Body.Close()
		
		if err != nil {
			fmt.Printf("[自动下载] 写入图片失败: %v\n", err.Error())
			continue
		}
		
		fmt.Printf("[自动下载] 图片下载完成: %s\n", filepath)
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
			fmt.Println("[DEBUG] 收到视频profile信息")
			request_body := Conn.GetRequestBody()
			fmt.Printf("[DEBUG] Profile请求体: %s\n", string(request_body))
			
			// 如果开启自动模式，直接触发下载
			if globalAutoMode {
				var profileData map[string]interface{}
				err := json.Unmarshal(request_body, &profileData)
				if err == nil {
					fmt.Printf("[DEBUG] 自动模式开启，准备下载视频: %v\n", profileData["title"])
					
					// 构造自动下载请求
					autoReq := AutoDownloadRequest{
						Title: fmt.Sprintf("%v", profileData["title"]),
						Type:  fmt.Sprintf("%v", profileData["type"]),
					}
					
					// 提取其他字段
					if url, ok := profileData["url"]; ok {
						autoReq.URL = fmt.Sprintf("%v", url)
					}
					if key, ok := profileData["key"]; ok {
						if keyStr, ok := key.(string); ok {
							// key是字符串，需要转换为整数
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
			fmt.Println("[DEBUG] 收到自动下载请求")
			var data AutoDownloadRequest
			request_body := Conn.GetRequestBody()
			fmt.Printf("[DEBUG] 请求体: %s\n", string(request_body))
			err := json.Unmarshal(request_body, &data)
			if err != nil {
				fmt.Println("解析自动下载请求失败:", err.Error())
				headers := http.Header{}
				headers.Set("Content-Type", "application/json")
				Conn.StopRequest(400, `{"error":"解析请求失败"}`, headers)
				return
			}
			
			fmt.Printf("[DEBUG] 解析成功，开始处理自动下载: %+v\n", data)
			// 处理自动下载
			go handleAutoDownload(data)
			
			headers := http.Header{}
			headers.Set("Content-Type", "application/json")
			headers.Set("__debug", "auto_download")
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
								window.__wx_log({msg: "[DEBUG] 自动模式已开启"});
							} else {
								setTimeout(function() {
									if (window.__wx_channels_store__) {
										window.__wx_channels_store__.autoMode = true;
										window.__wx_log({msg: "[DEBUG] 延迟设置自动模式已开启"});
									}
								}, 100);
							}
						})();
						</script>`)
						fmt.Println("[DEBUG] 后端自动模式已开启，注入自动模式脚本")
					}
					html = strings.Replace(html, "<head>", "<head>\n"+script+autoModeScript+script2, 1)
					fmt.Println("1. 视频详情页 html 注入 js 成功")
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
