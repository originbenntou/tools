package main

type memberTimeSum struct {
	name      string
	timeSpent int
}

func getMemberTimeSums(issues *resIssues) *[]*memberTimeSum {
	var mtss []*memberTimeSum
	for _, name := range Member {
		mts := new(memberTimeSum)
		mts.name = name

		for _, issue := range *issues {
			if name == issue.UpdateAuthor.Name {
				mts.timeSpent += issue.TimeSpentSeconds
			}
		}

		mtss = append(mtss, mts)
	}

	return *mtss
}
