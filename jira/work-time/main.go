package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
	"net/http"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
)

type PersonResponse struct {
	PersonID   string `json:"personID"`
	PersonName string `json:"personName"`
	Old        int    `json:"old"`
}

func format(person PersonResponse) []byte {
	jsonBytes, _ := json.Marshal(person)

	return jsonBytes
}

var (
	// DefaultHTTPGetAddress Default Address
	DefaultHTTPGetAddress = "https://checkip.amazonaws.com"

	// ErrNoIP No IP found in response
	ErrNoIP = errors.New("No IP in HTTP response")

	// ErrNon200Response non 200 status code in response
	ErrNon200Response = errors.New("Non 200 Response found")
)

func handler(request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	resp, err := http.Get(DefaultHTTPGetAddress)
	if err != nil {
		return events.APIGatewayProxyResponse{}, err
	}

	if resp.StatusCode != 200 {
		return events.APIGatewayProxyResponse{}, ErrNon200Response
	}

	ip, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return events.APIGatewayProxyResponse{}, err
	}

	if len(ip) == 0 {
		return events.APIGatewayProxyResponse{}, ErrNoIP
	}

	personID := request.PathParameters["personID"]
	personName := request.QueryStringParameters["personName"]
	old := 25

	person := PersonResponse{
		PersonID:   personID,
		PersonName: personName,
		Old:        old,
	}

	// 昨日更新されたworklogのIDを取得
	// 昨日の09:00 ~ 今日の09:00
	var ids []int
	updated := getUpdated()
	for _, v := range updated.Values {
		ids = append(ids, v.WorklogID)
	}

	// IDを元にissue情報を取得

	// メンバーごとにissueを所定の形式に変換

	// s3アップロード

	// slackへ投稿？

	return events.APIGatewayProxyResponse{
		Body:       fmt.Sprintf("Hello, %v", string(ip)+string(format(person))),
		StatusCode: 200,
	}, nil
}

func main() {
	lambda.Start(handler)
}
