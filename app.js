import { GraphQLClient } from 'graphql-request'
import axios from 'axios'

const baseURL = 'https://pulp.swm.cc/';

if (!process.env.GITHUB_TOKEN) {
  console.error(`Environment variable 'GITHUB_TOKEN' is not set. Exiting the script.`);
  process.exit(1);
}
const token = process.env.GITHUB_TOKEN

if (!process.env.PULP_USERNAME) {
  console.error(`Environment variable 'PULP_USERNAME' is not set. Exiting the script.`);
  process.exit(1);
}
const username = process.env.PULP_USERNAME

if (!process.env.PULP_PASSWORD) {
  console.error(`Environment variable 'PULP_PASSWORD' is not set. Exiting the script.`);
  process.exit(1);
}
const password = process.env.PULP_PASSWORD

let number_of_days = 1
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

const login = async () => {
  try {
    const response = await axios.post(`${baseURL}/users/tokens/sign_in`, { email: username, password: password });

    if (response.data.token) {
      return response.data.token;
    } else {
      throw new Error('Login failed');
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};


function isInteger(value) {
  return Number.isInteger(Number(value));
}

async function getandPostCommits(token) {
  const data = await client.request(query)
  const repos = data.viewer.repositories.nodes

  for (const repo of repos) {
    for (const commit of repo.defaultBranchRef.target.history.nodes) {
      let jsonPayload = {
        "commit": {
          "sha": commit['oid'],
          "message": commit['message'],
          "commit_date": commit['committedDate'],
          "repo_name": repo.name
        }
      }

      const request = axios.post(`${baseURL}/api/v1/commits`, jsonPayload, {
        headers: { Authentication: `${token}` },
      })

      try {
        const response = await Promise.all(request);
        console.log(response.data);
      } catch (error) {
        console.error(`Error: ${error.message}`);
      }
    }
  }
}


const runApp = async () => {
  const token = await login();
  await getandPostCommits(token);
};

runApp()
