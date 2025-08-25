//go:build !linux
// +build !linux

package proxy

import "errors"

func EnableProxyInLinux(ps ProxySettings) error {
	return errors.New("Linux proxy functions not available on this platform")
}

func DisableProxyInLinux() error {
	return errors.New("Linux proxy functions not available on this platform")
}