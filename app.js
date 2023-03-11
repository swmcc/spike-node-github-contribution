import fetch from 'node-fetch'
import { GraphQLClient } from 'graphql-request'

const date = new Date(new Date().getTime() - 24 * 60 * 60 * 1000)
const yesterday = date.toISOString().slice(0, 10)

const username = 'swmcc'
const token = 'XXXXXXX'

const client = new GraphQLClient('https://api.github.com/graphql', {
  headers: {
    Authorization: `Bearer ${token}`
  }
})

const query = `
  query {
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
                  }
                }
              }
            }
          }
          pullRequests(first: 100, states: [MERGED], orderBy: {field: CREATED_AT, direction: DESC}) {
            nodes {
              number
              title
              mergedAt
            }
          }
        }
      }
    }
  }
`

async function getCommitsAndPRs() {
  const data = await client.request(query)
  const repos = data.viewer.repositories.nodes

  for (const repo of repos) {
    console.log(`Commits for ${repo.name}:`);
    for (const commit of repo.defaultBranchRef.target.history.nodes) {
      console.log(`  ${commit.oid} ${commit.message}`);
    }

    console.log(`Pull requests for ${repo.name}:`);
    for (const pr of repo.pullRequests.nodes) {
      if (pr.mergedAt && pr.mergedAt.slice(0, 10) === yesterday) {
        console.log(`  #${pr.number} ${pr.title}`);
      }
    }
  }
}

getCommitsAndPRs();
