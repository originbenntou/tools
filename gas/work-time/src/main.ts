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
    "mototsuka",
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
    updated: string
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
    setTrigger()

    // worklog取得
    const options = {
        contentType: "application/json",
        headers: {"Authorization": "Basic " + Utilities.base64Encode(BASIC_USER+":"+BASIC_TOKEN)}
    };

    const now = new Date();
    let beforeBusinessDay10 = modifyUntillBusinessDay(now)

    const response = UrlFetchApp.fetch(BASE_URL + UPDATED_PATH + "?since=" + beforeBusinessDay10.getTime(), options);
    const updated: ResponseUpdated = JSON.parse(response.getContentText());

    // Logger.log(updated);

    if (Object.keys(updated).length === 0) {
        console.info("updated is not found");
        return;
    }

    let today10 = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        10
    ).getTime();
    let worklogIds: number[] = [];
    updated.values.forEach(v => {
        // updatedがuntillが使えない
        // 前営業日の10:00:00〜今日9:59:59までのworklogのみ
        if (v.updatedTime < today10) {
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
                worklogs.push({summary: summary, timeSpent: v.timeSpentSeconds, updated: v.updated});
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
    // 8時間記入がない場合メンバーはアラートに出して、処理から排除

    // Logger.log(memberWorkLogs);

    // スプレッドシート記述
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const today = Utilities.formatDate(now, "JST", "yyyy/MM/dd");

    let insertData = [];
    // 新フォーマット（日付,人,内容,カテゴリ,時間）
    // memberWorkLogs.forEach(memberInfo => {
    //     memberInfo.worklogs.forEach(worklog => {
    //         insertData.push([today, memberInfo.name, worklog.summary, worklog.timeSpent, Date.parse(worklog.updated)]);
    //     });
    // });

    // 現フォーマット整形
    let sum: number = 0;
    let works: string[] = [];
    let firstHalf: string = "";
    let secondHalf: string = "";
    let thirdHalf: string = "";
    memberWorkLogs.forEach(memberInfo => {
        memberInfo.worklogs.forEach(worklog => {
            sum += worklog.timeSpent;
            works.push(worklog.summary);
            // 午前集計
            if (sum >= 3 * 60 * 60 && firstHalf == "") {
                // 数回記録することによるsummary重複排除
                let filtered = works.filter((e, i, self) => {
                    return self.indexOf(e) === i
                })
                firstHalf = filtered.join("\n");
                sum -= 3 * 60 * 60;
                works = [];
                return;
            }
            // 午後集計
            if (sum >= 5 * 60 * 60 && secondHalf == "") {
                let filtered = works.filter((e, i, self) => {
                    return self.indexOf(e) === i
                })
                secondHalf = filtered.join("\n");
                sum -= 5 * 60 * 60;
                works = [];
                return;
            }
        });
        let filtered = works.filter((e, i, self) => {
            return self.indexOf(e) === i
        })
        thirdHalf = filtered.join("\n");
        if (thirdHalf == "") {
            thirdHalf = secondHalf
        }

        insertData.push({
            'date': today,
            'name': memberInfo.name,
            'morning': firstHalf,
            'afternoon': secondHalf,
            'night': thirdHalf,
            'overtime': sum
        });
        sum = 0;
        works = [];
        firstHalf = secondHalf = thirdHalf = "";
    });

    // 日付列の最終行数を取得
    let lastRow = sheet.getRange("A:A").getValues().filter(String).length;
    insertData.forEach((v) => {
        sheet.getRange(lastRow+1, 1, 1, 3).setValues([[v.date, "9:00", "12:00"]]);
        sheet.getRange(lastRow+1, 6, 1, 3).setValues([[v.name, "保守", v.morning]]);
        lastRow++;
        sheet.getRange(lastRow+1, 1, 1, 3).setValues([[v.date, "13:00", "18:00"]]);
        sheet.getRange(lastRow+1, 6, 1, 3).setValues([[v.name, "開発", v.afternoon]]);
        lastRow++;
        if (v.night != "") {
            let regular = new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate(),
                18,
                0,
                0
            );
            let over = regular
            over.setSeconds(over.getSeconds() + v.overtime);
            sheet.getRange(lastRow+1, 1, 1, 3).
            setValues([
                [
                    v.date,
                    "18:00",
                    over.getHours() + ":" + over.getMinutes(),
                ]
            ]);
            sheet.getRange(lastRow+1, 6, 1, 3).
            setValues([
                [
                    v.name,
                    "開発",
                    v.night
                ]
            ]);
            lastRow++;
        }
    });

    console.info("Record Success");

    // 正常性確認（行数、合計時間等、休み => 目視で確認する仕組み）
    // 翌日、残業などの時間調整を許容できるようにする
    // module化
    // タスクをカテゴリ化する（JIRAの何かを利用）
}

const setTrigger = (): void => {
    let setTime = new Date();
    setTime.setDate(setTime.getDate() + 1)
    setTime.setHours(0)
    setTime.setMinutes(45)
    ScriptApp.newTrigger('testMethod').timeBased().at(setTime).create();
}

const modifyUntillBusinessDay = (date: Date): Date => {
    let yesterday10 = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate() - 1,
        10
    )
    
    if (!isBusinessDay(yesterday10)) modifyUntillBusinessDay(yesterday10)
    
    return yesterday10
}

const isBusinessDay = (date: Date): boolean => {
    if (date.getDay() == 0 || date.getDay() == 6) {
        return false;
    }
    const calJa = CalendarApp.getCalendarById('ja.japanese#holiday@group.v.calendar.google.com');
    return calJa.getEventsForDay(date).length <= 0;
}
