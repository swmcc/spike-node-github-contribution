import fetch from 'node-fetch'
import { GraphQLClient } from 'graphql-request'

const token = process.env.GITHUB_TOKEN
const yesterday = getYesterdaysDate()

function getYesterdaysDate() {
  const date = new Date()
  date.setDate(date.getDate() - 1);
  return date.toISOString().substring(0, 10)
}

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
                history(since: "${yesterday}T00:00:00Z") {
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

async function getCommits() {
  const data = await client.request(query)
  const repos = data.viewer.repositories.nodes
  let commits = {}

  for (const repo of repos) {
    for (const commit of repo.defaultBranchRef.target.history.nodes) {
      commits[repo.name] = { ...commits[repo.name], [commit.oid]: { message: commit.message, date: commit.committedDate } }
    }
  }
  console.log(yesterday)
  console.log(commits)
}

getCommits();
