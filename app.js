import { GraphQLClient } from 'graphql-request'

if (!process.env.GITHUB_TOKEN) {
  console.error(`Environment variable 'GITHUB_TOKEN' is not set. Exiting the script.`);
  process.exit(1);
}
const token = process.env.GITHUB_TOKEN

let number_of_days =  1
if (process.argv.length >= 3) {
  number_of_days = process.argv[2]
  if (!isInteger(number_of_days)) {
    console.error('Error: The provided argument must be an integer.');
    process.exit(1);
  }
} 

const date = new Date()
date.setDate(date.getDate() - number_of_days);
const start_date = date.toISOString().substring(0, 10)

const client = new GraphQLClient('https://api.github.com/graphql', {
  headers: {
    Authorization: `Bearer ${token}`
  }
})

const query = `
  query GetCommits {
    viewer {
      repositories(first: 100) {
        nodes {
          name
          defaultBranchRef {
            name
            target {
              ... on Commit {
                history(since: "${start_date}T00:00:00Z") {
                  nodes {
                    oid
                    message
                    committedDate
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`

function isInteger(value) {
  return Number.isInteger(Number(value));
}

async function getCommits() {
  const data = await client.request(query)
  const repos = data.viewer.repositories.nodes
  let commits = {}

  for (const repo of repos) {
    for (const commit of repo.defaultBranchRef.target.history.nodes) {
      commits[repo.name] = { ...commits[repo.name], [commit.oid]: { message: commit.message, date: commit.committedDate } }
    }
  }
  console.log(start_date)
  console.log(commits)
}

getCommits();
