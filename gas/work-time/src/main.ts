import {constants} from "http2";
import HttpMethod = GoogleAppsScript.URL_Fetch.HttpMethod;

const postMethod: HttpMethod = 'post';

const BASE_URL     = "https://originbenntou.atlassian.net/rest/api/2";
const UPDATED_PATH = "/worklog/updated";
const LIST_PATH    = "/worklog/list";
const ISSUE_PATH    = "/issue";

const BASIC_USER  = "originbenntou8973@gmail.com";
const BASIC_TOKEN = "amSPARFPAfI2bSS48V2O1818";

const Member = [
    "司 山本",
    "piyo",
    "fuga",
];

interface MemberWorkLog {
    name: string
    worklogs: Worklog[]
}

interface Worklog {
    summary: string
    timeSpent: number
}

interface Value {
    worklogId: number
    updatedTime: number
    properties: any
}

interface ResponseUpdated {
    values: Value[]
    since: number
    until: number
    self: string
    lastPage: boolean
}

interface UpdateAuthor {
    self: string
    name: string
    displayName: string
    active: boolean
}

interface ResponseIssue {
    self: string
    author: object
    updateAuthor: UpdateAuthor
    comment: string
    updated: string
    visibility: object
    started: string
    timeSpent: string
    timeSpentSeconds: number
    id: string
    issueId: string
}

function main() {
    // worklog取得
    const options = {
        contentType: "application/json",
        headers: {"Authorization": "Basic " + Utilities.base64Encode(BASIC_USER+":"+BASIC_TOKEN)}
    };

    const now = new Date();
    let yesterday9 = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - 100,
        9
    ).getTime();

    const response = UrlFetchApp.fetch(BASE_URL + UPDATED_PATH + "?since=" + yesterday9, options);
    const updated: ResponseUpdated = JSON.parse(response.getContentText());

    Logger.log(updated);

    if (Object.keys(updated).length === 0) {
        console.info("updated is not found");
        return;
    }

    let worklogIds: number[] = [];
    updated.values.forEach(v => {
        // 昨日9時〜今日9時までのworklogのみ
        if (v.updatedTime < now.getTime()) {
            worklogIds.push(v.worklogId);
        }
    });

    if (worklogIds.length === 0) {
        console.info("worklog is not found");
        return;
    }

    // issue取得
    const options2 = {
        method: postMethod,
        contentType: "application/json",
        headers: {"Authorization": "Basic " + Utilities.base64Encode(BASIC_USER+':'+BASIC_TOKEN)},
        payload: JSON.stringify({"ids": worklogIds})
    };

    const response2 = UrlFetchApp.fetch(BASE_URL + LIST_PATH , options2);
    const issues: ResponseIssue[] = JSON.parse(response2.getContentText()) as ResponseIssue[];

    if (issues.length === 0) {
        console.info("issue is not found");
        return;
    }

    // データ整形
    let memberWorkLogs: MemberWorkLog[] = [];
    // メンバーごとに時間集計
    Member.forEach(name => {
        let worklogs: Worklog[] = [];
        issues.forEach(v => {
            if (v.updateAuthor.displayName === name) {
                const summary = JSON.parse(
                    UrlFetchApp.fetch(BASE_URL + ISSUE_PATH + "/" + v.issueId, options).getContentText()
                )["fields"]["summary"];
                worklogs.push({summary: summary, timeSpent: v.timeSpentSeconds});
            }
        });
        memberWorkLogs.push({name: name, worklogs: worklogs});
    });

    // メンバーをソート
    memberWorkLogs.sort((a, b) => {return (a.name > b.name) ? 1 : -1;});
    // summaryをソート
    memberWorkLogs.forEach(v => v.worklogs.sort(
        (a, b) => {return (a.summary > b.summary) ? 1 : -1;
        }
    ));

    Logger.log(memberWorkLogs);

    // スプレッドシート記述
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const today = Utilities.formatDate(now, "JST", "yyyy/MM/dd");

    let insertData = [];
    memberWorkLogs.forEach(memberInfo => {
        memberInfo.worklogs.forEach(worklog => {
            insertData.push([today, memberInfo.name, worklog.summary, worklog.timeSpent]);
        });
    });

    // 日付列の最終行数を取得
    let lastRow = sheet.getRange("A:A").getValues().filter(String).length;
    sheet.getRange(lastRow+1, 1, Member.length, insertData[0].length).setValues(insertData);

    console.info("Record Success");

    // 正常性確認（行数、合計時間等、休み => 目視で確認する仕組み）
    // 翌日、残業などの時間調整を許容できるようにする
    // module化
    // タスクをカテゴリ化する（JIRAの何かを利用）
}
