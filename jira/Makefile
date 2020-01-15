.PHONY: deps clean build

deps:
	go get -u ./...

clean: 
	rm -rf ./work-time/work-time

local:
	sam local start-api

build:
	GOOS=linux GOARCH=amd64 go build -o work-time/work-time ./work-time

package:
	sam package --template-file ./template.yaml --output-template-file ./sam-template-store/output-template.yaml --s3-bucket originbenntou

deploy:
	sam deploy --template-file ./sam-template-store/output-template.yaml --capabilities CAPABILITY_IAM --stack-name work-time --region ap-northeast-1
