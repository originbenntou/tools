package main

import (
	"bytes"
	"log"
	"net/http"
	"net/url"
	"strconv"
	"strings"
)

func customRequest(method string, path string, params map[string]string, ids []int) *http.Request {
	// クエリ生成
	q := url.Values{}
	if params != nil {
		for k, v := range params {
			q.Add(k, v)
		}
	}

	// body生成
	b := ""
	if ids != nil {
		var i []string
		for _, v := range ids {
			i = append(i, strconv.Itoa(v))
		}
		b = "{\"ids\":[" + strings.Join(i, ",") + "]}"
	}

	req, err := http.NewRequest(method, BASE_URL+path, bytes.NewBufferString(b))
	if err != nil {
		log.Printf("failed new request: %v\n", err)
		return nil
	}
	req.URL.RawQuery = q.Encode()

	req.SetBasicAuth(BASIC_USER, BASIC_TOKEN)
	req.Header.Add("Content-Type", "application/json")

	return req
}
