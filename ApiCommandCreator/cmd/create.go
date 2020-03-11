/*
Copyright © 2020 NAME HERE <EMAIL ADDRESS>

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
package cmd

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"
	"os/exec"
	"strings"

	"github.com/spf13/cobra"
)

type Apis struct {
	Dev []string `json:"dev"`
	Stg []string `json:"stg"`
	Prd []string `json:"prd"`
}

var components = []string{
	"t",
	"p",
	"o",
}

var env = []string{
	"dev",
	"stg",
	"prd",
}

// createCmd represents the create command
var createCmd = &cobra.Command{
	Use:   "create",
	Short: "A brief description of your command",
	Long: `A longer description that spans multiple lines and likely contains examples
and usage of using your command. For example:

Cobra is a CLI library for Go that empowers applications.
This application is a tool to generate the needed files
to quickly create a Cobra application.`,
	Run: func(cmd *cobra.Command, args []string) {
		c, err := exec.Command("sh", "-c", "echo "+"\""+strings.Join(components, "\n")+"\""+" | peco").Output()
		if err != nil {
			fmt.Println(err.Error())
			os.Exit(1)
		}

		e, err := exec.Command("sh", "-c", "echo "+"\""+strings.Join(env, "\n")+"\""+" | peco").Output()
		if err != nil {
			fmt.Println(err.Error())
			os.Exit(1)
		}

		f, err := os.Open("config/" + strings.Trim(string(c), "\n") + ".json")
		if err != nil {
			panic(err)
		}
		defer f.Close()

		b, err := ioutil.ReadAll(f)
		if err != nil {
			fmt.Println(err.Error())
			os.Exit(1)
		}

		var Apis map[string][]string
		err = json.Unmarshal(b, &Apis)
		if err != nil {
			fmt.Println(err.Error())
			os.Exit(1)
		}

		a, err := exec.Command("sh", "-c", "echo "+"\""+strings.Join(Apis[strings.Trim(string(e), "\n")], "\n")+"\""+" | peco").Output()
		if err != nil {
			fmt.Println(err.Error())
			os.Exit(1)
		}

		_, err = exec.Command("sh", "-c", "echo "+strings.Trim(string(a), "\n")+" | tr -d '\n' | pbcopy").Output()
		if err != nil {
			fmt.Println(err.Error())
			os.Exit(1)
		}

		fmt.Println("copied: \n", strings.Trim(string(a), "\n"))
	},
}

func init() {
	rootCmd.AddCommand(createCmd)

	// Here you will define your flags and configuration settings.

	// Cobra supports Persistent Flags which will work for this command
	// and all subcommands, e.g.:
	// createCmd.PersistentFlags().String("foo", "", "A help for foo")

	// Cobra supports local flags which will only run when this command
	// is called directly, e.g.:
	// createCmd.Flags().BoolP("toggle", "t", false, "Help message for toggle")
}
