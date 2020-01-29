#!/usr/bin/env bash

# require bash,peco,ssh,curl,find,sed
# 各環境にsshアクセスできる

declare -a ENV_LIST=()
selectedEnv=""
selectedApi=""

function init() {
	local files=$(find ./*)

	# 環境リストを生成
	declare -a envs=()
	for file in ${files[*]}; do
		if [[ -f ${file} ]]; then
			# jsonファイルのみを取り出す
			if [[ ${file} == *json* ]]; then
				# 環境名だけ取り出す
				envs+=($(echo ${file} | sed -E 's/(\.\/)(.+[DEV|STG])(.+json)/\2/g'))
			fi
		fi
	done

	# 重複削除
	ENV_LIST=$(printf "%s\n" "${envs[@]}" | sort -u)
}

function SelectEnvironment() {
	local env=$(echo "$(IFS=$'\n'; echo "${ENV_LIST[*]}")" | peco)
	selectedEnv=${env}

	echo ${selectedEnv}
}

function SelectAPIs() {
	local api=$(echo "$(IFS=$'\n'; ls "./${selectedEnv}")" | peco)
	selectedApi=$(echo ${api} | sed -E 's/\.json//g')

	# TODO: 複数選択
	echo ${selectedApi}
}

function Execute() {
	echo "Result: OK"
}

echo "----------------------------"
read -p "Health_Cheker [Enter]"

init

read -p "環境/APIを選択 [Enter]"

SelectEnvironment
SelectAPIs

read -p "${selectedEnv}, ${selectedApi}を実行します [Enter]"

Execute

echo "----------------------------"
