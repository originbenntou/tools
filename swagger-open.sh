#!/usr/bin/env bash

docker-compose -f ./swagger/docker-compose.yml up

echo $?

if [[ $? -ne 0 ]]; then
	echo "swagger-ui failed to start"
	exit 1
fi

open localhost:9092
