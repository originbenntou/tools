package main

import (
	"encoding/json"
	"io/ioutil"
	"log"
	"net/http"
	"net/url"
	"strconv"
	"time"
)

type resUpdated struct {
	Values []struct {
		WorklogID   int           `json:"worklogId"`
		UpdatedTime int64         `json:"updatedTime"`
		Properties  []interface{} `json:"properties"`
	} `json:"values"`
	Since    int64  `json:"since"`
	Until    int64  `json:"until"`
	Self     string `json:"self"`
	LastPage bool   `json:"lastPage"`
}

func getUpdated() *resUpdated {
	client := &http.Client{Timeout: time.Duration(10) * time.Second}
	resp, err := client.Do(createRequest())
	if err != nil {
		log.Printf("fail client do: %v\n", err)
		return nil
	}

	defer resp.Body.Close()

	b, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		log.Printf("failed read body: %v\n", err)
		return nil
	}

	res := new(resUpdated)
	if err := json.Unmarshal(b, res); err != nil {
		log.Printf("failed unmarshal: %v\n", err)
		return nil
	}

	return res
}

func createRequest() *http.Request {
	req, err := http.NewRequest("GET", BASE_URL+UPDATED_PATH, nil)
	if err != nil {
		log.Printf("failed new request: %v\n", err)
		return nil
	}

	s, u := getTerm()
	values := url.Values{}
	values.Add("since", s)
	values.Add("until", u)
	req.URL.RawQuery = values.Encode()

	req.SetBasicAuth(BASIC_USER, BASIC_TOKEN)
	req.Header.Add("Content-Type", "application/json")

	return req
}

func getTerm() (string, string) {
	// ボードのタイムゾーンに合わせる
	location := "Asia/Tokyo"

	loc, err := time.LoadLocation(location)
	if err != nil {
		// UTCから計算して合わせる
		loc = time.FixedZone(location, 9*60*60)
	}

	n := time.Now().In(loc)
	s := time.Date(n.Year(), n.Month(), n.Day()-1, 9, 0, 0, 0, loc)
	u := time.Date(n.Year(), n.Month(), n.Day(), 9, 0, 0, 0, loc)

	return strconv.FormatInt(s.Unix(), 10) + "000", strconv.FormatInt(u.Unix(), 10) + "000"
}
