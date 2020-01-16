package main

import (
	"encoding/json"
	"io/ioutil"
	"log"
	"net/http"
	"time"
)

type issue struct {
	Self   string `json:"self"`
	Author struct {
		Self        string `json:"self"`
		Name        string `json:"name"`
		DisplayName string `json:"displayName"`
		Active      bool   `json:"active"`
	} `json:"author"`
	UpdateAuthor struct {
		Self        string `json:"self"`
		Name        string `json:"name"`
		DisplayName string `json:"displayName"`
		Active      bool   `json:"active"`
	} `json:"updateAuthor"`
	Comment    string `json:"comment"`
	Updated    string `json:"updated"`
	Visibility struct {
		Type  string `json:"type"`
		Value string `json:"value"`
	} `json:"visibility"`
	Started          string `json:"started"`
	TimeSpent        string `json:"timeSpent"`
	TimeSpentSeconds int    `json:"timeSpentSeconds"`
	ID               string `json:"id"`
	IssueID          string `json:"issueId"`
}

type resIssues []issue

func getIssues(ids []int) *resIssues {
	client := &http.Client{Timeout: time.Duration(10) * time.Second}
	request := customRequest("POST", LIST_PATH, nil, ids)

	resp, err := client.Do(request)
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

	res := new(resIssues)
	if err := json.Unmarshal(b, res); err != nil {
		log.Printf("failed unmarshal: %v\n", err)
		return nil
	}

	return res
}
