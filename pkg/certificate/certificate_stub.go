//go:build !linux
// +build !linux

package certificate

import "errors"

func fetchCertificatesInLinux() ([]Certificate, error) {
	return nil, errors.New("Linux certificate functions not available on this platform")
}

func InstallCertificateInLinux(cert []byte) error {
	return errors.New("Linux certificate functions not available on this platform")
}

func UninstallCertificateInLinux() error {
	return errors.New("Linux certificate functions not available on this platform")
}